import React from 'react';
import { useStore } from '@/store/useStore';
import { 
  Factory, 
  Cpu, 
  Layers, 
  Settings2, 
  Plus, 
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const machineTypes = [
  { id: '', label: 'New Machine', icon: Settings2, description: 'Add a new machine to the production line' },
];

const Sidebar = () => {
  const { addNode, nodes } = useStore();

  const handleAddMachine = (type: string) => {
    // Add node near center or randomly
    const x = Math.random() * 200 + 100;
    const y = Math.random() * 200 + 100;
    addNode(type, { x, y });
  };

  const activeCount = nodes.filter(n => n.data.status === 'active').length;
  const warningCount = nodes.filter(n => n.data.status === 'warning').length;
  const downCount = nodes.filter(n => n.data.status === 'down').length;

  return (
    <div className="w-full h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-primary text-white">
        <div className="flex items-center gap-2 mb-1">
          <Factory size={24} />
          <h1 className="text-xl font-bold">Flow 2D</h1>
        </div>
        <p className="text-xs text-primary-foreground opacity-70">Line Machine Schema</p>
      </div>

      {/* Stats Summary */}
      <div className="p-4 grid grid-cols-2 gap-2 bg-slate-50 border-b border-slate-100">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-green-600 mb-1">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase">Active</span>
          </div>
          <span className="text-2xl font-bold text-slate-700">{activeCount}</span>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-red-500 mb-1">
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold uppercase">Critical</span>
          </div>
          <span className="text-2xl font-bold text-slate-700">{warningCount + downCount}</span>
        </div>
      </div>

      {/* Machine Library */}
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Machine Library</h2>
        <div className="space-y-3">
          {machineTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleAddMachine(type.label)}
              className="group w-full flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all text-left"
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors">
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
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
          System healthy and synchronized
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
