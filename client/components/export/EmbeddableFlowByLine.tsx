// client/components/export/EmbeddableFlowByLine.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { fetchFlowByLineId } from '@/services/api';
import EmbeddableFlow from './EmbeddableFlow';
import { ExportedFlowData } from '@/shared/types';
import { Loader2, AlertCircle, WifiOff } from 'lucide-react';

interface EmbeddableFlowByLineProps {
  lineId: string;
  width?: number | string;
  height?: number | string;
  readOnly?: boolean;
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onEdgeClick?: (edgeId: string, edgeData: any) => void;
  onLoadComplete?: (flowData: any) => void;
  onError?: (error: Error) => void;
}

const EmbeddableFlowByLine: React.FC<EmbeddableFlowByLineProps> = ({
  lineId,
  width = '100%',
  height = 600,
  readOnly = true,
  showControls = true,
  showMiniMap = true,
  showBackground = true,
  className = '',
  style = {},
  onNodeClick,
  onEdgeClick,
  onLoadComplete,
  onError,
}) => {
  const [flowData, setFlowData] = useState<ExportedFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lineId) {
      setError('No Line ID provided');
      setLoading(false);
      return;
    }

    const loadFlow = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchFlowByLineId(lineId);

        if (!data || !data.nodes) {
          throw new Error(`No flow data found for line "${lineId}"`);
        }

        // Convert ke format ExportedFlowData
        const exportedData: ExportedFlowData = {
          version: data.version || '2.0',
          exportedAt: new Date(data.updatedAt || Date.now()).toISOString(),
          appName: 'Flow2D',
         nodes: data.nodes.map((node: any, index: number) => {
            // Parse template jika string
            let template = node.data?.template;
            if (typeof template === 'string') {
                try { template = JSON.parse(template); } catch (e) { template = null; }
            }
            
            // Parse chairDesign jika string
            let chairDesign = node.data?.chairDesign;
            if (typeof chairDesign === 'string') {
                try { chairDesign = JSON.parse(chairDesign); } catch (e) { chairDesign = null; }
            }
            
            // ✅ FIX POSISI: pastikan tidak negatif
            const posX = node.position?.x ?? index * 200;
            const posY = Math.max(0, node.position?.y ?? 100); // Minimal 0
            
            return {
                id: node.id || `node-${index}`,
                type: (node.type === 'operatorNode' || node.type === 'shapeOperatorNode') ? 'operator' : 'machine',
                label: node.data?.label || node.id,
                position: {
                x: posX,
                y: posY,  // ✅ Tidak negatif
                },
                status: node.data?.status || 'idle',
                throughput: node.data?.throughput ?? 0,
                capacity: node.data?.capacity ?? 100,
                template: template,
                frameRotation: node.data?.frameRotation || template?.frameRotation || 0,
                operatorId: node.data?.id,
                process: node.data?.process,
                color: node.data?.color,
                chairDesign: chairDesign,
                handles: node.data?.handles,
            };
            }),
          edges: data.edges.map((edge: any) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.data?.operatorId ? 'operator' : 'machine',
            style: {
              stroke: edge.style?.stroke || '#1e293b',
              strokeWidth: edge.style?.strokeWidth || 2,
              strokeDasharray: edge.style?.strokeDasharray,
              animated: edge.animated,
            },
            label: edge.data?.sourceProcess ? `P${edge.data.sourceProcess} → P${edge.data.targetProcess}` : undefined,
            operatorId: edge.data?.operatorId,
          })),
          viewMode: data.viewMode || 'default',
          metadata: {
            totalMachines: data.nodes.filter((n: any) => n.type !== 'operatorNode').length,
            totalOperators: data.nodes.filter((n: any) => n.type === 'operatorNode').length,
            activeMachines: 0,
            warningMachines: 0,
            downMachines: 0,
            totalConnections: data.edges.length,
            operatorConnections: data.edges.filter((e: any) => e.data?.operatorId).length,
            machineConnections: data.edges.filter((e: any) => !e.data?.operatorId).length,
          },
        };

        setFlowData(exportedData);
        onLoadComplete?.(data);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to load flow';
        setError(errorMsg);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    loadFlow();
  }, [lineId]);

  // Loading state
  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">Loading flow layout...</p>
          <p className="text-xs text-slate-400 mt-1">Line: {lineId}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-red-200 rounded-lg bg-red-50 ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center max-w-sm">
          <WifiOff size={32} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-600">Failed to Load Flow</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          <p className="text-[10px] text-red-400 mt-2">Line ID: {lineId}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center border-2 border-dashed border-amber-200 rounded-lg bg-amber-50 ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center">
          <AlertCircle size={32} className="text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-600">No Flow Data</p>
          <p className="text-xs text-amber-500 mt-1">Line "{lineId}" has no saved layout</p>
          <p className="text-[10px] text-amber-400 mt-2">Create a layout in Flow2D and save it with this Line ID</p>
        </div>
      </div>
    );
  }

  // Success - render flow
  return (
    <div className={`relative ${className}`}>
      <EmbeddableFlow
        data={flowData}
        width={width}
        height={height}
        readOnly={readOnly}
        showControls={showControls}
        showMiniMap={showMiniMap}
        showBackground={showBackground}
        style={style}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] text-slate-400 z-10">
        Line: {lineId} · {flowData.nodes.length} nodes
      </div>
    </div>
  );
};

export default EmbeddableFlowByLine;