// client/components/flow/FlowCanvas.tsx
import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  useReactFlow,
} from 'reactflow';
import MachineNode from './MachineNode';
import OperatorNode from './OperatorNode';
import ShapeMachineNode from './ShapeMachineNode';
import ShapeOperatorNode from './ShapeOperatorNode';
import SaveLoadPanel from './SaveLoadPanel';
import UndoRedoIndicator from './UndoRedoIndicator';
import { useStore } from '@/store/useStore';
import { Info, EyeOff } from 'lucide-react';
import ViewModeToggle from './ViewModeToggle';
import SmartAvoidEdge from './SmartAvoidEdge';
import FlowExporter from '@/components/export/FlowExporter';
import SaveToDatabaseDialog from './SaveToDatabaseDialog';
import LineSelector from './LineSelector';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// nodeTypes didefinisikan di luar komponen
const nodeTypes = {
  machineNode: MachineNode,
  shapeMachineNode: ShapeMachineNode,
  operatorNode: OperatorNode,
  shapeOperatorNode: ShapeOperatorNode,
};

const edgeTypes = {
  'smart-avoid': SmartAvoidEdge,
};

interface FlowCanvasProps {
  isEmbedMode?: boolean;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({ isEmbedMode = false }) => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    pushToHistory,
    viewMode,
    getNodeTemplate,
    isToolsHidden,
    setIsToolsHidden,
  } = useStore();

  const reactFlowInstance = useReactFlow();
  const nodeChangesTimer = useRef<NodeJS.Timeout>();
  const hasAutoFitted = useRef(false);

  // Auto fit view saat nodes berubah (untuk embed mode)
  useEffect(() => {
    if (isEmbedMode && nodes.length > 0 && !hasAutoFitted.current) {
      const timer = setTimeout(() => {
        console.log('[FlowCanvas] Auto fitting view for embed mode');
        reactFlowInstance.fitView({ 
          padding: 0.3,
          duration: 300,
          maxZoom: 1.5,
        });
        hasAutoFitted.current = true;
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Reset flag saat nodes berubah signifikan
    if (nodes.length === 0) {
      hasAutoFitted.current = false;
    }
  }, [isEmbedMode, nodes.length, reactFlowInstance]);

  // Keyboard shortcut: Ctrl+Shift+H — toggle hide tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'h'
      ) {
        e.preventDefault();
        setIsToolsHidden(!useStore.getState().isToolsHidden);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsToolsHidden]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      if (!isEmbedMode) {
        setSelectedNodeId(node.id);
      }
    },
    [setSelectedNodeId, isEmbedMode]
  );

  const onPaneClick = useCallback(() => {
    if (!isEmbedMode) {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId, isEmbedMode]);

  // Transform nodes based on view mode
  const processedNodes = useMemo(() => {
    if (viewMode === 'default') {
      return nodes;
    } else {
      return nodes.map((node) => {
        if (node.type === 'operatorNode') {
          return {
            ...node,
            type: 'shapeOperatorNode',
            data: {
              ...node.data,
              chairDesign: (node.data as any).chairDesign || {
                enabled: false,
                chairColor: (node.data as any).color || '#a855f7',
                showIdInChair: true,
                showProcessInChair: true,
                chairWidth: 80,
                chairHeight: 100,
                seatDepth: 45,
                backrestHeight: 55,
              },
            },
          };
        }

        if (node.type === 'machineNode' || node.type === 'shapeMachineNode') {
          return {
            ...node,
            type: 'shapeMachineNode',
            data: {
              ...node.data,
              template: getNodeTemplate(node.id),
            },
          };
        }

        return node;
      });
    }
  }, [nodes, viewMode, getNodeTemplate]);

  // Process edges with node data for obstacle detection
  const processedEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      type: 'smart-avoid',
      data: {
        ...edge.data,
        allNodes: nodes,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
      },
    }));
  }, [edges, nodes]);

  const onNodesChangeWithHistory = useCallback(
    (changes: any) => {
      onNodesChange(changes);

      if (nodeChangesTimer.current) {
        clearTimeout(nodeChangesTimer.current);
      }

      nodeChangesTimer.current = setTimeout(() => {
        pushToHistory('Node position changed');
      }, 500);
    },
    [onNodesChange, pushToHistory]
  );

  useEffect(() => {
    return () => {
      if (nodeChangesTimer.current) {
        clearTimeout(nodeChangesTimer.current);
      }
    };
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  }, []);

  return (
    <div
      className="w-full h-full bg-slate-50 relative"
      onContextMenu={onContextMenu}
    >
      <ReactFlow
        nodes={processedNodes}
        edges={processedEdges}
        onNodesChange={onNodesChangeWithHistory}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={(e) => e.preventDefault()}
        onEdgeContextMenu={(e) => e.preventDefault()}
        onPaneContextMenu={(e) => e.preventDefault()}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={!isEmbedMode} // Jangan gunakan fitView bawaan untuk embed mode
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          style: { stroke: '#1e293b', strokeWidth: 2 },
          animated: false,
          type: 'smart-avoid',
        }}
        // Nonaktifkan interaksi dalam embed mode
        nodesDraggable={!isEmbedMode}
        nodesConnectable={!isEmbedMode}
        elementsSelectable={!isEmbedMode}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />

        {/* Controls (zoom in/out) — selalu visible */}
        <Controls 
          showInteractive={false} 
          className="fill-slate-700"
        />

        {/* MiniMap — hidden when tools hidden atau embed mode */}
        {!isToolsHidden && !isEmbedMode && (
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'operatorNode' || n.type === 'shapeOperatorNode') {
                return (n.data as any).color || '#a855f7';
              }
              if (n.data?.status === 'active') return '#22c55e';
              if (n.data?.status === 'warning') return '#f59e0b';
              if (n.data?.status === 'down') return '#ef4444';
              return '#94a3b8';
            }}
            maskColor="rgba(241, 245, 249, 0.7)"
            className="border-slate-200"
          />
        )}

        {/* TOP-RIGHT PANEL — hidden when tools hidden atau embed mode */}
        {!isToolsHidden && !isEmbedMode && (
          <Panel position="top-right" className="flex items-center gap-2">

            {viewMode === 'shapes' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white gap-2"
                      onClick={() => setIsToolsHidden(true)}
                    >
                      <EyeOff size={16} className="text-slate-500" />
                      <span className="text-xs font-medium">Hide Tools</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Ctrl+Shift+H</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <LineSelector />
            <ViewModeToggle />
            <SaveLoadPanel />
            <FlowExporter />
            <SaveToDatabaseDialog />

            <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </div>
              <Info size={14} className="text-slate-400" />
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* UndoRedoIndicator — hidden when tools hidden atau embed mode */}
      {!isToolsHidden && !isEmbedMode && <UndoRedoIndicator />}
    </div>
  );
};

export default FlowCanvas;