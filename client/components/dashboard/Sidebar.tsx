// client/components/dashboard/Sidebar.tsx
import React from 'react';
import { useStore, MachineData, NodeData } from '@/store/useStore';
import { 
  Factory, 
  Cpu, 
  Layers, 
  Settings2, 
  Plus, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  User,
  Users,
  Power,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Node } from 'reactflow';
import { OperatorData } from '@/shared/types';

// Type guard untuk mengecek apakah node adalah machine node
const isMachineNode = (node: Node<NodeData>): node is Node<MachineData> => {
  return node.type === 'machineNode' || node.type === 'shapeMachineNode';
};

// Type guard untuk mengecek apakah node adalah operator node
const isOperatorNode = (node: Node<NodeData>): node is Node<OperatorData> => {
  return node.type === 'operatorNode';
};

const machineTypes = [
  { 
    id: 'default', 
    label: 'New Machine', 
    icon: Settings2, 
    description: 'Add a new machine to the production line',
    type: 'machine'
  },
  { 
    id: 'operator', 
    label: 'New Operator', 
    icon: User, 
    description: 'Add a new operator to the production line', 
    type: 'operator' 
  },
];

const Sidebar = () => {
  const { addNode, addOperator, nodes } = useStore();

  const handleAddMachine = (type: string, itemType?: string) => {
    const x = Math.random() * 200 + 100;
    const y = Math.random() * 200 + 100;
    
    if (itemType === 'operator') {
      addOperator({ x, y });
    } else {
      addNode(type, { x, y });
    }
  };

  // Filter hanya machine nodes untuk statistik status
  const machineNodes = nodes.filter(isMachineNode);
  
  // Hitung status menggunakan machineNodes yang sudah difilter
  const activeCount = machineNodes.filter(n => n.data.status === 'active').length;
  const warningCount = machineNodes.filter(n => n.data.status === 'warning').length;
  const downCount = machineNodes.filter(n => n.data.status === 'down').length;
  const idleCount = machineNodes.filter(n => n.data.status === 'idle').length;
  
  // Hitung jumlah operator
  const operatorCount = nodes.filter(isOperatorNode).length;
  
  // Total machines
  const totalMachines = machineNodes.length;

  return (
    <div className="w-full h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-primary text-white">
        <div className="flex items-center gap-2 mb-1">
          <Factory size={24} />
          <h1 className="text-xl font-bold">Flow 2D</h1>
        </div>
        <p className="text-xs text-primary-foreground opacity-70">Line Machine & Operator Schema</p>
      </div>

      {/* Stats Summary */}
      <div className="p-4 grid grid-cols-4 gap-2 bg-slate-50 border-b border-slate-100">
        {/* Active Machines */}
        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-green-600 mb-1">
            <Power size={12} />
            <span className="text-[8px] font-bold uppercase">Active</span>
          </div>
          <span className="text-lg font-bold text-slate-700">{activeCount}</span>
          <span className="text-[8px] text-slate-400 block">/{totalMachines}</span>
        </div>

        {/* Warning Machines */}
        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-600 mb-1">
            <AlertTriangle size={12} />
            <span className="text-[8px] font-bold uppercase">Warning</span>
          </div>
          <span className="text-lg font-bold text-slate-700">{warningCount}</span>
          <span className="text-[8px] text-slate-400 block">/{totalMachines}</span>
        </div>

        {/* Down/Critical Machines */}
        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-red-600 mb-1">
            <XCircle size={12} />
            <span className="text-[8px] font-bold uppercase">Down</span>
          </div>
          <span className="text-lg font-bold text-slate-700">{downCount}</span>
          <span className="text-[8px] text-slate-400 block">/{totalMachines}</span>
        </div>

        {/* Operators */}
        <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-purple-600 mb-1">
            <Users size={12} />
            <span className="text-[8px] font-bold uppercase">Operators</span>
          </div>
          <span className="text-lg font-bold text-slate-700">{operatorCount}</span>
          <span className="text-[8px] text-slate-400 block">total</span>
        </div>
      </div>

      {/* Quick Stats Summary (Compact) */}
      <div className="px-4 py-2 bg-slate-100/50 border-b border-slate-100 flex justify-between text-[10px]">
        <span className="text-slate-500">Total Machines: <span className="font-bold text-slate-700">{totalMachines}</span></span>
        <span className="text-slate-500">Idle: <span className="font-bold text-slate-700">{idleCount}</span></span>
        <span className="text-slate-500">Critical: <span className="font-bold text-red-600">{warningCount + downCount}</span></span>
      </div>

      {/* Library */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Component Library</h2>
        <div className="space-y-3">
          {machineTypes.map((type) => (
            <button
              key={type.id + (type.type || '')}
              onClick={() => handleAddMachine(type.label, type.type)}
              className="group w-full flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all text-left"
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                type.type === 'operator' 
                  ? "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
                  : "bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white"
              )}>
                <type.icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors truncate">
                    {type.label}
                  </span>
                  <Plus size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {type.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-slate-100" />

        {/* Component Info */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Component Types</h3>
          
          {/* Machine Info */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="p-1.5 rounded bg-blue-100 text-blue-600">
              <Cpu size={12} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-700">Machine Nodes</p>
              <p className="text-[9px] text-slate-400">Production equipment with status tracking</p>
            </div>
          </div>

          {/* Operator Info */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="p-1.5 rounded bg-purple-100 text-purple-600">
              <User size={12} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-700">Operator Nodes</p>
              <p className="text-[9px] text-slate-400">Workers with ID grouping & process ordering</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <span className={cn(
            "inline-block w-1.5 h-1.5 rounded-full",
            warningCount + downCount > 0 ? "bg-red-500 animate-pulse" : "bg-green-500"
          )} />
          {warningCount + downCount > 0 
            ? `${warningCount + downCount} machine(s) need attention` 
            : "All systems operational"}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;