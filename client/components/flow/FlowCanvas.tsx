import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import MachineNode from './MachineNode';
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
  } = useStore();

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="w-full h-full bg-slate-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
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
        
        <Panel position="top-right" className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-100">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE MONITORING
          </div>
          <Info size={14} className="text-slate-400" />
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
