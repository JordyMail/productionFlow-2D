import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MachineData } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, Play, Square, XCircle } from 'lucide-react';

const statusConfig = {
  active: {
    label: 'Running',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: Play,
  },
  idle: {
    label: 'Idle',
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    icon: Square,
  },
  warning: {
    label: 'Warning',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: AlertTriangle,
  },
  down: {
    label: 'Down',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: XCircle,
  },
};

const MachineNode = ({ data, selected }: NodeProps<MachineData>) => {
  const { label, status, throughput } = data;
  const config = statusConfig[status] || statusConfig.idle;
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-all duration-200 w-[220px] relative',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200',
        status === 'down' && !selected && 'border-red-400'
      )}
    >
      {/* Left Handle (Target/Input) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-3 h-3 bg-primary border-2 border-white"
        style={{ top: '50%' }}
      />
      
      {/* Right Handle (Source/Output) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 bg-primary border-2 border-white"
        style={{ top: '50%' }}
      />

      {/* Top Handle (Target & Source) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="w-3 h-3 bg-primary border-2 border-white"
        style={{ left: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="w-3 h-3 bg-primary border-2 border-white"
        style={{ left: '50%' }}
      />

      {/* Bottom Handle (Target & Source) */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="w-3 h-3 bg-primary border-2 border-white"
        style={{ left: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="w-3 h-3 bg-primary border-2 border-white"
        style={{ left: '50%' }}
      />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Machine</span>
          <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold', config.color)}>
            <StatusIcon size={10} />
            {config.label}
          </div>
        </div>
        
        <h3 className="font-bold text-primary truncate" title={label}>{label}</h3>
        
        <div className="mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium">Throughput</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-700">{throughput}</span>
              <span className="text-[10px] text-slate-400">pcs/min</span>
            </div>
          </div>
          <Activity size={20} className={cn('opacity-20', status === 'active' && 'text-green-500 opacity-100 animate-pulse')} />
        </div>
      </div>
    </div>
  );
};

export default memo(MachineNode);