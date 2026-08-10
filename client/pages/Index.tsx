// client/pages/Index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useStore, setupAutoSave } from '@/store/useStore';
import Sidebar from '@/components/dashboard/Sidebar';
import FlowCanvas from '@/components/flow/FlowCanvas';
import PropertyPanel from '@/components/dashboard/PropertyPanel';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

export default function Index() {
  const { 
    updateThroughput, 
    selectedNodeId, 
    isToolsHidden, 
    setIsToolsHidden,
    setViewMode,
    loadFlowFromDatabase,
    nodes,
    updateNodeData,
  } = useStore();

  const [isEmbedMode, setIsEmbedMode] = useState(false);

  /**
   * Fungsi untuk mapping formasi ke operator nodes
   * @param formationsData - Data formasi dari SWS: { [operatorNumber]: string[] } dimana string adalah sqc/process
   */
  const applyFormationToOperators = useCallback((formationsData: { [operatorNumber: number]: string[] }) => {
    console.log('[Index] Applying formation to operators:', formationsData);
    
    if (!formationsData || Object.keys(formationsData).length === 0) {
      console.warn('[Index] No formation data to apply');
      return;
    }

    // Dapatkan semua operator nodes
    const operatorNodes = nodes.filter(node => 
      node.type === 'operatorNode' || node.type === 'shapeOperatorNode'
    );

    console.log(`[Index] Found ${operatorNodes.length} operator nodes`);

    // Reset semua operator id ke null dulu
    operatorNodes.forEach(node => {
      updateNodeData(node.id, { id: null });
    });

    // Mapping: untuk setiap operator, assign id berdasarkan sqc/process
    Object.entries(formationsData).forEach(([operatorNumberStr, processSqcList]) => {
      const operatorNumber = parseInt(operatorNumberStr);
      
      if (!Array.isArray(processSqcList)) return;

      processSqcList.forEach(sqc => {
        // Cari operator node yang memiliki process === sqc
        // sqc dari FormationTab adalah string, process di node adalah number
        const processNumber = parseInt(sqc);
        
        const matchingNode = operatorNodes.find(node => {
          const nodeData = node.data as any;
          return nodeData.process === processNumber;
        });

        if (matchingNode) {
          console.log(`[Index] Assigning operator ${operatorNumber} to process ${processNumber} (node: ${matchingNode.id})`);
          updateNodeData(matchingNode.id, { 
            id: operatorNumber,
            label: `Operator ${operatorNumber}.${processNumber}`
          });
        } else {
          console.warn(`[Index] No operator node found with process ${processNumber}`);
        }
      });
    });

    // Trigger update koneksi setelah perubahan
    setTimeout(() => {
      useStore.getState().updateOperatorConnections();
    }, 200);
  }, [nodes, updateNodeData]);

  // Cek parameter URL untuk embed mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isEmbed = params.get('embed') === 'true';
    const viewMode = params.get('view') || 'default';
    const hideTools = params.get('hideTools') === 'true';

    console.log('[Index] URL Params:', { isEmbed, viewMode, hideTools });

    if (isEmbed) {
      setIsEmbedMode(true);
      
      if (viewMode === 'shapes') {
        console.log('[Index] Setting view mode to shapes');
        setViewMode('shapes');
      }
      
      if (hideTools) {
        console.log('[Index] Hiding tools and nav');
        setIsToolsHidden(true);
        
        const navBar = document.querySelector('nav, header, .navbar, .top-bar');
        if (navBar) {
          (navBar as HTMLElement).style.display = 'none';
        }
      }
    }
  }, [setViewMode, setIsToolsHidden]);

  // Dengarkan pesan dari parent window (SWS)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:3001',
        'http://10.125.20.42:3000',
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.log('[Index] Message from unauthorized origin:', event.origin);
        return;
      }

      const { type, lineId, formations, timestamp } = event.data;

      console.log('[Index] Received message:', { type, lineId, formations, timestamp, origin: event.origin });

      // ==========================================
      // ✅ SISIPKAN DI SINI (Langkah 3 - Ekspor Data)
      // ==========================================
      if (type === 'CAPTURE_SNAPSHOT') {
        // Menyedot data mentah (posisi dan mesin) langsung dari memori React Flow
        const currentNodes = useStore.getState().nodes;
        const currentEdges = useStore.getState().edges;

        // Mengonversi objek JavaScript menjadi teks JSON statis
        const snapshotData = JSON.stringify({ nodes: currentNodes, edges: currentEdges });

        if (event.source && 'postMessage' in event.source) {
          (event.source as WindowProxy).postMessage({
            type: 'SNAPSHOT_RESULT',
            data: snapshotData
          }, event.origin);
        }
        
        return; // Menghentikan eksekusi fungsi lebih lanjut untuk pesan ini
      }
      
      // ==========================================
      // ✅ PENERIMA PERINTAH RENDER SNAPSHOT DI SUMMARY VIEW
      // ==========================================
      if (type === 'LOAD_SNAPSHOT' && event.data.snapshotData) {
        console.log('[Index] Memuat data snapshot JSON...');
        try {
          const parsedData = typeof event.data.snapshotData === 'string' 
            ? JSON.parse(event.data.snapshotData) 
            : event.data.snapshotData;

          // Memaksa state React Flow untuk menggunakan data usang dari JSON
          useStore.setState({ 
            nodes: parsedData.nodes || [], 
            edges: parsedData.edges || [] 
          });

          // Memusatkan kamera (zoom to fit) agar semua mesin terlihat
          setTimeout(() => {
            const { fitView } = useStore.getState();
            if (fitView) fitView({ padding: 0.2 });
          }, 200);
        } catch (err) {
          console.error('[Index] Gagal mengurai snapshot:', err);
        }
        return; // Hentikan agar tidak lanjut memproses LOAD_FLOW
      }
      // ==========================================

      if (type === 'LOAD_FLOW' && lineId) {
        console.log('[Index] Loading flow for line:', lineId);
        
        try {
          const success = await loadFlowFromDatabase(lineId);
          
          if (success) {
            console.log('[Index] Flow loaded successfully for line:', lineId);
            
            // ✅ JIKA ADA DATA FORMATION, APPLY KE OPERATORS
            if (formations && Object.keys(formations).length > 0) {
              console.log('[Index] Formation data received, applying to operators...');
              
              // Delay sedikit untuk memastikan nodes sudah terupdate
              setTimeout(() => {
                applyFormationToOperators(formations);
              }, 500);
            }
            
            // Kirim konfirmasi ke parent
            if (event.source && 'postMessage' in event.source) {
              (event.source as WindowProxy).postMessage({
                type: 'FLOW_LOADED',
                lineId: lineId,
                success: true,
                timestamp: Date.now()
              }, event.origin);
            }
          } else {
            console.warn('[Index] No flow found for line:', lineId);
            
            if (event.source && 'postMessage' in event.source) {
              (event.source as WindowProxy).postMessage({
                type: 'FLOW_LOAD_ERROR',
                lineId: lineId,
                error: 'No flow found for this line',
                timestamp: Date.now()
              }, event.origin);
            }
          }
        } catch (error) {
          console.error('[Index] Failed to load flow:', error);
          
          if (event.source && 'postMessage' in event.source) {
            (event.source as WindowProxy).postMessage({
              type: 'FLOW_LOAD_ERROR',
              lineId: lineId,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: Date.now()
            }, event.origin);
          }
        }
      }
      
      // ✅ TERIMA UPDATE FORMATION SAAT FLOW SUDAH LOAD
      if (type === 'UPDATE_FORMATION' && formations) {
        console.log('[Index] Received formation update:', formations);
        applyFormationToOperators(formations);
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('[Index] Listening for messages from parent window');
    
    return () => window.removeEventListener('message', handleMessage);
  }, [loadFlowFromDatabase, applyFormationToOperators]);

  // Real-time Simulation Logic
  useEffect(() => {
    const interval = setInterval(() => {
      updateThroughput();
    }, 3000);
    return () => clearInterval(interval);
  }, [updateThroughput]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const cleanup = setupAutoSave(30000);
    return cleanup;
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      <ReactFlowProvider>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {!isToolsHidden && !isEmbedMode && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <Sidebar />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          <ResizablePanel defaultSize={isToolsHidden || isEmbedMode ? 100 : selectedNodeId ? 55 : 80}>
            <FlowCanvas isEmbedMode={isEmbedMode} />
          </ResizablePanel>

          {!isToolsHidden && !isEmbedMode && selectedNodeId && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                <PropertyPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </ReactFlowProvider>
    </div>
  );
}