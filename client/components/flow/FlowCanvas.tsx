import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import MachineNode from './MachineNode';
import SaveLoadPanel from './SaveLoadPanel';
import UndoRedoIndicator from './UndoRedoIndicator'; // Import baru
import { useStore } from '@/store/useStore';
import { Settings, Info } from 'lucide-react';

const nodeTypes = {
  machineNode: MachineNode,
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

  // Debounced history push for node movements
  const onNodesChangeWithHistory = useCallback(
    (changes: any) => {
      onNodesChange(changes);
      
      // Clear previous timer
      if (nodeChangesTimer.current) {
        clearTimeout(nodeChangesTimer.current);
      }
      
      // Set new timer to push to history after movement stops
      nodeChangesTimer.current = setTimeout(() => {
        pushToHistory('Node position changed');
      }, 500);
    },
    [onNodesChange, pushToHistory]
  );

  // Prevent context menu
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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWithHistory} // Gunakan yang sudah di-debounce
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={(e) => e.preventDefault()}
        onEdgeContextMenu={(e) => e.preventDefault()}
        onPaneContextMenu={(e) => e.preventDefault()}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          style: { stroke: '#1e293b', strokeWidth: 2 },
          animated: false,
          type: 'smoothstep',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} className="fill-slate-700" />
        <MiniMap 
          nodeColor={(n) => {
            if (n.data?.status === 'active') return '#22c55e';
            if (n.data?.status === 'warning') return '#f59e0b';
            if (n.data?.status === 'down') return '#ef4444';
            return '#94a3b8';
          }}
          maskColor="rgba(241, 245, 249, 0.7)"
          className="border-slate-200"
        />
        
        <Panel position="top-right" className="flex items-center gap-2">
          <SaveLoadPanel />
          <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>
            <Info size={14} className="text-slate-400" />
          </div>
        </Panel>
      </ReactFlow>

      {/* Undo/Redo Indicator */}
      <UndoRedoIndicator />
    </div>
  );
};

export default FlowCanvas;