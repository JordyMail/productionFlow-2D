// client/components/flow/OperatorNode.tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { User, Hash, ListOrdered } from 'lucide-react';
import { HandleConfig, HandlePosition } from '@/shared/types'; // Import types

interface OperatorNodeData {
  id: number;
  process: number;
  label?: string;
  handles?: HandleConfig; // Tambahkan
  color?: string; // Tambahkan
}

// Helper untuk mengecek apakah handle aktif
const isHandleActive = (handles: HandleConfig | undefined, position: HandlePosition): boolean => {
  if (!handles) return true; // Default ke aktif jika belum ada config
  return handles[position];
};

const OperatorNode = ({ data, selected }: NodeProps<OperatorNodeData>) => {
  const { id, process, label, handles, color } = data;
  
  // Gunakan color dari data atau default purple
  const nodeColor = color || '#a855f7';
  const bgColor = `${nodeColor}20`; // 20 = 12% opacity
  const borderColor = selected ? nodeColor : `${nodeColor}80`; // 80 = 50% opacity

  return (
    <div
      className={cn(
        'px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-all duration-200 w-[180px] relative',
        selected ? 'ring-2 ring-purple-200' : '',
      )}
      style={{
        borderColor: borderColor,
        backgroundColor: bgColor
      }}
    >
      {/* Left Handles - Hanya render jika aktif */}
      {isHandleActive(handles, 'left') && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="left-target"
            className="w-3 h-3 border-2 border-white"
            style={{ backgroundColor: nodeColor }}
          />
          <Handle
            type="source"
            position={Position.Left}
            id="left-source"
            className="w-3 h-3 border-2 border-white"
            style={{ backgroundColor: nodeColor }}
          />
        </>
      )}
      
      {/* Right Handles - Hanya render jika aktif */}
      {isHandleActive(handles, 'right') && (
        <>
          <Handle
            type="target"
            position={Position.Right}
            id="right-target"
            className="w-3 h-3 border-2 border-white"
            style={{ backgroundColor: nodeColor }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right-source"
            className="w-3 h-3 border-2 border-white"
            style={{ backgroundColor: nodeColor }}
          />
        </>
      )}

      {/* Top Handles - Hanya render jika aktif */}
      {isHandleActive(handles, 'top') && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="top-target"
            className="w-3 h-3 border-2 border-white"
            style={{ backgroundColor: nodeColor, left: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Top}
            id="top-source"
            className="w-3 h-3 border-2 border-white"
            style={{ backgroundColor: nodeColor, left: '50%' }}
          />
        </>
      )}

      {/* Bottom Handles - Hanya render jika aktif */}
      {isHandleActive(handles, 'bottom') && (
        <>
          <Handle
            type="target"
            position={Position.Bottom}
            id="bottom-target"
            className="w-3 h-3 border-2 border-white"
            style={{ backgroundColor: nodeColor, left: '50%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom-source"
            className="w-3 h-3 border-2 border-white"
            style={{ backgroundColor: nodeColor, left: '50%' }}
          />
        </>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
                style={{ color: nodeColor }}>
            <User size={12} />
            Operator
          </span>
        </div>
        
        <h3 className="font-bold truncate" style={{ color: nodeColor }}>
          {label || `Operator ${id}`}
        </h3>
        
        <div className="mt-2 grid grid-cols-2 gap-2 p-2 rounded-md border"
             style={{ 
               backgroundColor: `${nodeColor}10`,
               borderColor: `${nodeColor}30`
             }}>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px]" style={{ color: nodeColor }}>
              <Hash size={10} />
              <span>ID</span>
            </div>
            <span className="text-lg font-bold" style={{ color: nodeColor }}>{id}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px]" style={{ color: nodeColor }}>
              <ListOrdered size={10} />
              <span>Process</span>
            </div>
            <span className="text-lg font-bold" style={{ color: nodeColor }}>{process}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(OperatorNode);