// client/components/flow/OperatorNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { User, Hash, ListOrdered } from 'lucide-react';

interface OperatorNodeData {
  id: number;
  process: number;
  label?: string;
}

const OperatorNode = ({ data, selected }: NodeProps<OperatorNodeData>) => {
  const { id, process, label } = data;

  return (
    <div
      className={cn(
        'px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-all duration-200 w-[180px] relative',
        selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-200',
      )}
    >
      {/* Left Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      
      {/* Right Handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      {/* Top Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      {/* Bottom Handles */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 flex items-center gap-1">
            <User size={12} />
            Operator
          </span>
        </div>
        
        <h3 className="font-bold text-purple-700 truncate">
          {label || `Operator ${id}`}
        </h3>
        
        <div className="mt-2 grid grid-cols-2 gap-2 bg-purple-50 p-2 rounded-md border border-purple-100">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-purple-600">
              <Hash size={10} />
              <span>ID</span>
            </div>
            <span className="text-lg font-bold text-purple-700">{id}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-purple-600">
              <ListOrdered size={10} />
              <span>Process</span>
            </div>
            <span className="text-lg font-bold text-purple-700">{process}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OperatorNode);