// client/components/flow/FlowCanvas.tsx
import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import MachineNode from './MachineNode';
import OperatorNode from './OperatorNode';
import ShapeMachineNode from './ShapeMachineNode';
import ShapeOperatorNode from './ShapeOperatorNode';
import SaveLoadPanel from './SaveLoadPanel';
import UndoRedoIndicator from './UndoRedoIndicator';
import { useStore } from '@/store/useStore';
import { Settings, Info } from 'lucide-react';
import ViewModeToggle from './ViewModeToggle';
import SmartAvoidEdge from './SmartAvoidEdge';
import FlowExporter from '@/components/export/FlowExporter';
import SaveToDatabaseDialog from './SaveToDatabaseDialog'; // ✅ NEW IMPORT

const nodeTypes = {
  machineNode: MachineNode,
  shapeMachineNode: ShapeMachineNode,
  operatorNode: OperatorNode,
  shapeOperatorNode: ShapeOperatorNode,
};

const edgeTypes = {
  'smart-avoid': SmartAvoidEdge,
};

const FlowCanvas = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    pushToHistory,
    viewMode,
    getNodeTemplate
  } = useStore();

  const nodeChangesTimer = useRef<NodeJS.Timeout>();

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Transform nodes based on view mode
  const processedNodes = React.useMemo(() => {
    if (viewMode === 'default') {
      return nodes;
    } else {
      return nodes.map(node => {
        if (node.type === 'operatorNode') {
          return {
            ...node,
            type: 'shapeOperatorNode',
            data: {
              ...node.data,
              chairDesign: (node.data as any).chairDesign || {
                enabled: true,
                chairColor: (node.data as any).color || '#a855f7',
                showIdInChair: true,
                showProcessInChair: true,
                chairWidth: 80,
                chairHeight: 100,
                seatDepth: 45,
                backrestHeight: 55,
              }
            }
          };
        }
        
        if (node.type === 'machineNode' || node.type === 'shapeMachineNode') {
          return {
            ...node,
            type: 'shapeMachineNode',
            data: {
              ...node.data,
              template: getNodeTemplate(node.id)
            }
          };
        }
        
        return node;
      });
    }
  }, [nodes, viewMode, getNodeTemplate]);

  // Process edges dengan data nodes untuk deteksi obstacle
  const processedEdges = useMemo(() => {
    return edges.map(edge => ({
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
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          style: { stroke: '#1e293b', strokeWidth: 2 },
          animated: false,
          type: 'smart-avoid',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} className="fill-slate-700" />
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
        
        {/* ============================================ */}
        {/* TOP-RIGHT PANEL - Semua Tombol Aksi */}
        {/* ============================================ */}
        <Panel position="top-right" className="flex items-center gap-2">
          {/* View Mode Toggle: Default | Shapes */}
          <ViewModeToggle />
          
          {/* Save/Load: LocalStorage, Export/Import File */}
          <SaveLoadPanel />
          
          {/* Export/Embed: JSON Download, Embed Code */}
          <FlowExporter />
          
          {/* ✅ SAVE TO DATABASE BUTTON - INI YANG BARU */}
          <SaveToDatabaseDialog />
          
          {/* Live Indicator */}
          <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>
            <Info size={14} className="text-slate-400" />
          </div>
        </Panel>
      </ReactFlow>

      <UndoRedoIndicator />
    </div>
  );
};

export default FlowCanvas;