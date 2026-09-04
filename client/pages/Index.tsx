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

// =====================================================
// HELPER: CEK NODE MESIN
// =====================================================
const isMachineNode = (node: any) => {
  return (
    node?.type === 'machineNode' ||
    node?.type === 'shapeMachineNode'
  );
};

// =====================================================
// HELPER: NORMALISASI SNAPSHOT UNTUK EMBED / PDF
// =====================================================
// Tujuan:
// - Saat PDF capture buka Flow2D di Playwright,
//   store fresh belum tentu punya machine template.
// - Jadi template harus diambil dari node.data.template,
//   atau fallback dari templateMap jika ada.
// =====================================================
const normalizeSnapshotForEmbed = (snapshotData: any) => {
  const parsedData =
    typeof snapshotData === 'string'
      ? JSON.parse(snapshotData)
      : snapshotData;

  const rawNodes = Array.isArray(parsedData?.nodes)
    ? parsedData.nodes
    : [];

  const rawEdges = Array.isArray(parsedData?.edges)
    ? parsedData.edges
    : [];

  const templateMap =
    parsedData?.templates ||
    parsedData?.nodeTemplates ||
    parsedData?.machineTemplates ||
    parsedData?.templateMap ||
    {};

  const nodes = rawNodes.map((node: any) => {
    if (!isMachineNode(node)) {
      return node;
    }

    const data = node.data || {};

    const template =
      data.template ||
      data.machineTemplate ||
      data.selectedTemplate ||
      data.shapeTemplate ||
      templateMap[node.id] ||
      templateMap[data.templateId] ||
      null;

    return {
      ...node,
      type: 'shapeMachineNode',
      data: {
        ...data,
        template,
      },
    };
  });

  return {
    nodes,
    edges: rawEdges,
  };
};

export default function Index() {
  const {
    updateThroughput,
    selectedNodeId,
    isToolsHidden,
    setIsToolsHidden,
    setViewMode,
    loadFlowFromDatabase,
    clearAll,
    setCurrentLineId,
    nodes,
    updateNodeData,
  } = useStore();

  const [isEmbedMode, setIsEmbedMode] = useState(false);

  /**
   * Fungsi untuk mapping formasi ke operator nodes.
   *
   * formationsData format:
   * {
   *   [operatorNumber]: string[]
   * }
   *
   * string[] berisi sqc/process.
   */
  const applyFormationToOperators = useCallback(
    (formationsData: { [operatorNumber: number]: string[] }) => {
      console.log('[Index] Applying formation to operators:', formationsData);

      if (!formationsData || Object.keys(formationsData).length === 0) {
        console.warn('[Index] No formation data to apply');
        return;
      }

      // Ambil semua operator nodes.
      const operatorNodes = nodes.filter(
        (node) =>
          node.type === 'operatorNode' ||
          node.type === 'shapeOperatorNode'
      );

      console.log(`[Index] Found ${operatorNodes.length} operator nodes`);

      // Reset semua operator id ke null dulu.
      operatorNodes.forEach((node) => {
        updateNodeData(node.id, { id: null });
      });

      // Mapping operator ke process.
      Object.entries(formationsData).forEach(
        ([operatorNumberStr, processSqcList]) => {
          const operatorNumber = parseInt(operatorNumberStr);

          if (!Array.isArray(processSqcList)) {
            return;
          }

          processSqcList.forEach((sqc) => {
            const processNumber = parseInt(sqc);

            const matchingNode = operatorNodes.find((node) => {
              const nodeData = node.data as any;
              return nodeData.process === processNumber;
            });

            if (matchingNode) {
              console.log(
                `[Index] Assigning operator ${operatorNumber} to process ${processNumber} (node: ${matchingNode.id})`
              );

              updateNodeData(matchingNode.id, {
                id: operatorNumber,
                label: `Operator ${operatorNumber}.${processNumber}`,
              });
            } else {
              console.warn(
                `[Index] No operator node found with process ${processNumber}`
              );
            }
          });
        }
      );

      // Trigger update koneksi setelah perubahan.
      setTimeout(() => {
        useStore.getState().updateOperatorConnections();
      }, 200);
    },
    [nodes, updateNodeData]
  );

  // =====================================================
  // EMBED MODE SETUP
  // =====================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const lineId = params.get('lineId');
    const mode = params.get('mode');
    const isEmbed = params.get('embed') === 'true';
    const viewMode = params.get('view') || 'default';
    const hideTools = params.get('hideTools') === 'true';

    console.log('[Index] URL Params:', {
      isEmbed,
      viewMode,
      hideTools,
    });

    if (isEmbed) {
      setIsEmbedMode(true);
      if (viewMode === 'shapes') {
        console.log('[Index] Setting view mode to shapes');
        setViewMode('shapes');
      }
      if (hideTools) {
        console.log('[Index] Hiding tools and nav');
        setIsToolsHidden(true);
        const navBar = document.querySelector(
          'nav, header, .navbar, .top-bar'
        );
        if (navBar) {
          (navBar as HTMLElement).style.display = 'none';
        }
      }
    }
    // ==========================
    // FLOW2D WORKING SHEET
    // ==========================
    if (lineId) {
      if (mode === 'new') {
        // ==========================
        // NEW DESIGN
        // ==========================
        console.log(
          '[Index] Creating new flow for line:',
          lineId
        );
        // kosongkan canvas
        clearAll();
        // simpan line id untuk autosave
        setCurrentLineId(lineId);
      } else {
        // ==========================
        // EXISTING DESIGN
        // ==========================
        console.log(
          '[Index] Loading existing flow:',
          lineId
        );
        setTimeout(() => {
          loadFlowFromDatabase(lineId);
        }, 300);
      }
    }
  }, [
    setViewMode,
    setIsToolsHidden,
    clearAll,
    setCurrentLineId,
    loadFlowFromDatabase
  ]);

  // =====================================================
  // MESSAGE LISTENER
  // =====================================================
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:3001',
        'http://10.125.20.42:3000',
        'http://localhost:8080',
      ];

      if (!allowedOrigins.includes(event.origin)) {
        console.log(
          '[Index] Message from unauthorized origin:',
          event.origin
        );
        return;
      }

      const { type, lineId, formations, timestamp } = event.data;

      console.log('[Index] Received message:', {
        type,
        lineId,
        formations,
        timestamp,
        origin: event.origin,
      });

      // =================================================
      // 1. CAPTURE SNAPSHOT
      // =================================================
      // Dipakai saat mengambil data mentah dari Flow2D.
      //
      // Fix penting:
      // - Jangan hanya simpan currentNodes.
      // - Simpan nodesWithTemplates supaya machine template
      //   ikut masuk ke layout_sws_json.
      // =================================================
      if (type === 'CAPTURE_SNAPSHOT') {
        const state = useStore.getState();

        const currentNodes = state.nodes;
        const currentEdges = state.edges;

        const nodesWithTemplates = currentNodes.map((node: any) => {
          if (!isMachineNode(node)) {
            return node;
          }

          const data = node.data || {};

          const template =
            data.template ||
            data.machineTemplate ||
            data.selectedTemplate ||
            data.shapeTemplate ||
            state.getNodeTemplate?.(node.id) ||
            null;

          return {
            ...node,
            data: {
              ...data,
              template,
            },
          };
        });

        const snapshotData = JSON.stringify({
          nodes: nodesWithTemplates,
          edges: currentEdges,
        });

        if (event.source && 'postMessage' in event.source) {
          (event.source as WindowProxy).postMessage(
            {
              type: 'SNAPSHOT_RESULT',
              data: snapshotData,
            },
            event.origin
          );
        }

        return;
      }

      // =================================================
      // 2. LOAD SNAPSHOT
      // =================================================
      // Dipakai oleh PDF renderer / Playwright.
      //
      // Backend mengirim snapshotData dari layout_sws_json,
      // lalu ReactFlow render dalam embed mode.
      // =================================================
      if (type === 'LOAD_SNAPSHOT' && event.data.snapshotData) {
        console.log('[Index] Loading snapshot...');

        try {
          const normalizedSnapshot = normalizeSnapshotForEmbed(
            event.data.snapshotData
          );

          useStore.setState({
            nodes: normalizedSnapshot.nodes,
            edges: normalizedSnapshot.edges,
          });

          setTimeout(() => {
            const { fitView } = useStore.getState();

            if (fitView) {
              fitView({
                padding: 0.2,
              });
            }

            setTimeout(() => {
              console.log('[Index] Snapshot ready sending signal');

              if (event.source && 'postMessage' in event.source) {
                (event.source as WindowProxy).postMessage(
                  {
                    type: 'SNAPSHOT_READY',
                    timestamp: Date.now(),
                  },
                  event.origin
                );
              }
            }, 1000);
          }, 1000);
        } catch (err) {
          console.error('[Index] Snapshot error', err);
        }

        return;
      }

      // =================================================
      // 3. LOAD FLOW BY LINE
      // =================================================
      if (type === 'LOAD_FLOW' && lineId) {
        console.log('[Index] Loading flow for line:', lineId);

        try {
          const success = await loadFlowFromDatabase(lineId);

          if (success) {
            console.log(
              '[Index] Flow loaded successfully for line:',
              lineId
            );

            if (formations && Object.keys(formations).length > 0) {
              console.log(
                '[Index] Formation data received, applying to operators...'
              );

              setTimeout(() => {
                applyFormationToOperators(formations);
              }, 500);
            }

            if (event.source && 'postMessage' in event.source) {
              (event.source as WindowProxy).postMessage(
                {
                  type: 'FLOW_LOADED',
                  lineId,
                  success: true,
                  timestamp: Date.now(),
                },
                event.origin
              );
            }
          } else {
            console.warn('[Index] No flow found for this line:', lineId);

            if (event.source && 'postMessage' in event.source) {
              (event.source as WindowProxy).postMessage(
                {
                  type: 'FLOW_LOAD_ERROR',
                  lineId,
                  error: 'No flow found for this line',
                  timestamp: Date.now(),
                },
                event.origin
              );
            }
          }
        } catch (error) {
          console.error('[Index] Failed to load flow:', error);

          if (event.source && 'postMessage' in event.source) {
            (event.source as WindowProxy).postMessage(
              {
                type: 'FLOW_LOAD_ERROR',
                lineId,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Unknown error',
                timestamp: Date.now(),
              },
              event.origin
            );
          }
        }

        return;
      }

      // =================================================
      // 4. UPDATE FORMATION
      // =================================================
      if (type === 'UPDATE_FORMATION' && formations) {
        console.log('[Index] Received formation update:', formations);
        applyFormationToOperators(formations);
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('[Index] Listening for messages from parent window');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [loadFlowFromDatabase, applyFormationToOperators]);

  // =====================================================
  // REAL-TIME SIMULATION LOGIC
  // =====================================================
  useEffect(() => {
    if (isEmbedMode) {
      return;
    }

    const interval = setInterval(() => {
      updateThroughput();
    }, 3000);

    return () => clearInterval(interval);
  }, [updateThroughput, isEmbedMode]);

  // =====================================================
  // AUTO SAVE
  // =====================================================
  useEffect(() => {
    if (isEmbedMode) {
      return;
    }

    const cleanup = setupAutoSave(30000);

    return cleanup;
  }, [isEmbedMode]);

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

          <ResizablePanel
            defaultSize={
              isToolsHidden || isEmbedMode
                ? 100
                : selectedNodeId
                  ? 55
                  : 80
            }
          >
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