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
  Cpu,
  RotateCw
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
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import TemplateSelector from './TemplateSelector';

const PropertyPanel = () => {
  // Ambil semua state yang diperlukan
  const { 
    selectedNodeId, 
    nodes, 
    updateNodeData, 
    deleteNode, 
    setSelectedNodeId,
    viewMode,
    nodeTemplates,
    getTemplateById,
    templates
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
  const currentTemplateId = nodeTemplates?.[selectedNode.id];
  
  // Dapatkan template dari store
  const currentTemplate = currentTemplateId 
    ? templates.find(t => t.id === currentTemplateId) 
    : null;

  // Dapatkan rotasi dari node data (jika ada)
  const frameRotation = (selectedNode.data as any).frameRotation || 
                        currentTemplate?.frameRotation || 
                        0;

  const handleChange = (field: keyof MachineData, value: any) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this machine?')) {
      deleteNode(selectedNode.id);
    }
  };

  const handleRotationChange = (rotation: number) => {
    // Pastikan rotasi dalam range 0-360
    const validRotation = Math.min(360, Math.max(0, rotation));
    
    // Simpan rotasi langsung ke node data
    updateNodeData(selectedNode.id, { 
      frameRotation: validRotation 
    });
    
    // Trigger re-render dengan state update
    setTimeout(() => {
      // Force update untuk memastikan canvas merespon
      window.dispatchEvent(new Event('resize'));
    }, 10);
  };

  // Cek apakah template valid (bukan default shape)
  const hasValidTemplate = currentTemplate && currentTemplate.id;

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

        {/* Template Selection - hanya muncul di shape mode */}
        {viewMode === 'shapes' && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-400 uppercase block">
              Shape Template
            </Label>
            <TemplateSelector 
              nodeId={selectedNode.id}
              currentTemplateId={nodeTemplates?.[selectedNode.id]}
            />
            <p className="text-[10px] text-slate-400">
              Choose a custom shape template for this machine
            </p>
          </div>
        )}

        {/* Frame Rotation - hanya muncul jika template dipilih dan valid */}
        {viewMode === 'shapes' && hasValidTemplate && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-400 uppercase block">
              Frame Rotation
            </Label>
            
            <div className="space-y-4">
              {/* Slider untuk rotasi */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">0°</span>
                  <span className="text-slate-700 font-medium">{frameRotation}°</span>
                  <span className="text-slate-500">360°</span>
                </div>
                <Slider
                  value={[frameRotation]}
                  onValueChange={([value]) => handleRotationChange(value)}
                  min={0}
                  max={360}
                  step={15}
                  className="w-full"
                />
              </div>
              
              {/* Kontrol rotasi dengan tombol */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleRotationChange(frameRotation - 15)}
                  disabled={frameRotation <= 0}
                >
                  <RotateCw size={14} className="rotate-180" />
                  <span className="ml-1 text-xs">-15°</span>
                </Button>
                
                <Input
                  type="number"
                  value={frameRotation}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      handleRotationChange(val);
                    }
                  }}
                  className="h-8 text-center"
                  min={0}
                  max={360}
                  step={15}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => handleRotationChange(frameRotation + 15)}
                  disabled={frameRotation >= 360}
                >
                  <span className="mr-1 text-xs">+15°</span>
                  <RotateCw size={14} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleRotationChange(0)}
                >
                  Reset
                </Button>
              </div>
              
              {/* Preview rotasi */}
              <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 bg-primary/20 border-2 border-primary rounded flex items-center justify-center transition-all duration-200"
                    style={{
                      transform: `rotate(${frameRotation}deg)`,
                    }}
                  >
                    <div className="w-1 h-1 bg-primary rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-600">Live Preview</p>
                    <p className="text-[10px] text-slate-400">
                      {currentTemplate.frameType === 'rectangle' && 'Square 1x1'}
                      {currentTemplate.frameType === 'rectangle2x1' && 'Rectangle'}
                      {currentTemplate.frameType === 'circle' && 'Circle'}
                      {currentTemplate.frameType === 'triangle' && 'Triangle'}
                      {' • '}{frameRotation}°
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-slate-400">
                Rotate the frame to any angle. Use slider, buttons, or type directly.
              </p>
            </div>
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