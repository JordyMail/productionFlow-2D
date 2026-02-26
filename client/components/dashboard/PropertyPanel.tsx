import React from 'react';
import { useStore, MachineData } from '@/store/useStore';
import { 
  X, 
  Trash2, 
  Settings, 
  Activity, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import TemplateSelector from './TemplateSelector'; // ✅ Import sudah benar

const PropertyPanel = () => {
  // ✅ Ambil semua state yang diperlukan
  const { 
    selectedNodeId, 
    nodes, 
    updateNodeData, 
    deleteNode, 
    setSelectedNodeId,
    viewMode,           // ✅ Tambahkan ini
    nodeTemplates       // ✅ Tambahkan ini
  } = useStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-full h-full bg-slate-50 border-l border-slate-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
          <Settings size={32} />
        </div>
        <h3 className="text-slate-600 font-bold mb-1">No Machine Selected</h3>
        <p className="text-xs text-slate-400 max-w-[200px]">
          Click on any machine in the canvas to view and edit its properties.
        </p>
      </div>
    );
  }

  const { data } = selectedNode;

  const handleChange = (field: keyof MachineData, value: any) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this machine?')) {
      deleteNode(selectedNode.id);
    }
  };

  return (
    <div className="w-full h-full bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={18} className="text-primary" />
          <h2 className="font-bold text-slate-700">Machine Details</h2>
        </div>
        <button 
          onClick={() => setSelectedNodeId(null)}
          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="machine-name" className="text-xs font-bold text-slate-400 uppercase">Machine Name</Label>
            <Input 
              id="machine-name"
              value={data.label}
              onChange={(e) => handleChange('label', e.target.value)}
              className="border-slate-200 focus:border-primary transition-colors h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine-status" className="text-xs font-bold text-slate-400 uppercase">Operating Status</Label>
            <Select 
              value={data.status} 
              onValueChange={(val: any) => handleChange('status', val)}
            >
              <SelectTrigger id="machine-status" className="border-slate-200 h-10">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Running</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="down">Down / Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Capacity / Performance */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <Label className="text-xs font-bold text-slate-400 uppercase block">Performance Metrics</Label>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="capacity" className="text-xs font-semibold text-slate-500">Target Capacity (pcs/min)</Label>
                <span className="text-xs font-bold text-slate-700">{data.capacity || 100}</span>
              </div>
              <Input 
                id="capacity"
                type="number"
                value={data.capacity || 100}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
                className="border-slate-200 h-10"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Throughput</span>
                <TrendingUp size={14} className={cn(data.status === 'active' ? 'text-green-500' : 'text-slate-300')} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-800">{data.throughput}</span>
                <span className="text-xs text-slate-500">Items / minute</span>
              </div>
              <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    data.status === 'active' ? 'bg-green-500' : 
                    data.status === 'warning' ? 'bg-amber-500' : 
                    data.status === 'down' ? 'bg-red-500' : 'bg-slate-400'
                  )}
                  style={{ width: `${Math.min(100, (data.throughput / (data.capacity || 100)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <Label className="text-xs font-bold text-slate-400 uppercase block">Maintenance Logs</Label>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <Calendar size={16} className="text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Last Inspection</p>
              <p className="text-xs font-bold text-slate-700">{data.lastMaintenance}</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-slate-300" />
          </div>
          <Button variant="outline" className="w-full text-xs font-bold h-9 border-slate-200 text-slate-500">
            View History
          </Button>
        </div>

        {/* ✅ Template Selection dengan conditional yang benar */}
        {viewMode === 'shapes' && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-400 uppercase block">
              Shape Template
            </Label>
            <TemplateSelector 
              nodeId={selectedNode.id}
              currentTemplateId={nodeTemplates?.[selectedNode.id]} // ✅ Optional chaining untuk safety
            />
            <p className="text-[10px] text-slate-400">
              Choose a custom shape template for this machine
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-slate-100">
        <Button 
          variant="destructive" 
          className="w-full font-bold flex items-center justify-center gap-2 h-11 shadow-sm"
          onClick={handleDelete}
        >
          <Trash2 size={16} />
          Remove Machine
        </Button>
      </div>
    </div>
  );
};

export default PropertyPanel;