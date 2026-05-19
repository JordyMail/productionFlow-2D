// client/components/dashboard/PropertyPanel.tsx

import React from 'react';
import { useStore, MachineData, NodeData } from '@/store/useStore';
import { 
  X, 
  Trash2, 
  Settings, 
  Activity, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  Cpu,
  RotateCw,
  User,
  Hash,
  ListOrdered,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Node } from 'reactflow';
import { OperatorData, HandlePosition, HandleConfig } from '@/shared/types';

// Type guard untuk mengecek apakah node adalah operator node
const isOperatorNode = (node: Node<NodeData>): node is Node<OperatorData> => {
  return node.type === 'operatorNode';
};

// Type guard untuk mengecek apakah data adalah MachineData
const isMachineData = (data: any): data is MachineData => {
  return data && 'status' in data && 'throughput' in data;
};

// Type guard untuk mengecek apakah data adalah OperatorData
const isOperatorData = (data: any): data is OperatorData => {
  return data && 'id' in data && 'process' in data && !('status' in data);
};

// Type guard untuk array operator nodes
const filterOperatorNodes = (nodes: Node<NodeData>[], predicate: (node: Node<OperatorData>) => boolean): Node<OperatorData>[] => {
  return nodes.filter((node): node is Node<OperatorData> => 
    isOperatorNode(node) && predicate(node)
  );
};

const PropertyPanel = () => {
  const { 
    selectedNodeId, 
    nodes, 
    updateNodeData, 
    deleteNode, 
    setSelectedNodeId,
    viewMode,
    nodeTemplates,
    getTemplateById,
    templates,
    updateOperatorConnections,
    toggleHandle,
    getActiveHandles
  } = useStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Handler untuk toggle handle
  const handleToggleHandle = (position: HandlePosition) => {
    if (selectedNodeId) {
      toggleHandle(selectedNodeId, position);
    }
  };

  // Dapatkan status handle untuk node yang dipilih
  const getHandleStatus = (position: HandlePosition): boolean => {
    if (!selectedNode) return true;
    const handles = (selectedNode.data as any).handles as HandleConfig | undefined;
    return handles ? handles[position] : true;
  };

  // Render handle controls section
  const renderHandleControls = () => {
    if (!selectedNode) return null;

    const isOperator = selectedNode.type === 'operatorNode';
    const activeHandles = getActiveHandles(selectedNode.id);
    const totalHandles = 4;
    const activeCount = activeHandles.length;

    return (
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
            <ToggleRight size={14} />
            Connection Handles
          </Label>
          <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
            {activeCount}/{totalHandles} Active
          </span>
        </div>

        {/* Info jika semua handle mati */}
        {activeCount === 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700">No Active Handles</p>
                <p className="text-[10px] text-amber-600">
                  This {isOperator ? 'operator' : 'machine'} cannot connect to any node. Enable at least one handle to allow connections.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid toggle untuk 4 arah */}
        <div className="grid grid-cols-2 gap-3">
          {/* Top Handle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <ArrowUp size={16} className={cn(
                "transition-colors",
                getHandleStatus('top') ? "text-primary" : "text-slate-300"
              )} />
              <span className="text-xs font-medium text-slate-700">Top</span>
            </div>
            <Switch
              checked={getHandleStatus('top')}
              onCheckedChange={() => handleToggleHandle('top')}
              className="scale-75"
            />
          </div>

          {/* Bottom Handle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <ArrowDown size={16} className={cn(
                "transition-colors",
                getHandleStatus('bottom') ? "text-primary" : "text-slate-300"
              )} />
              <span className="text-xs font-medium text-slate-700">Bottom</span>
            </div>
            <Switch
              checked={getHandleStatus('bottom')}
              onCheckedChange={() => handleToggleHandle('bottom')}
              className="scale-75"
            />
          </div>

          {/* Left Handle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <ArrowLeft size={16} className={cn(
                "transition-colors",
                getHandleStatus('left') ? "text-primary" : "text-slate-300"
              )} />
              <span className="text-xs font-medium text-slate-700">Left</span>
            </div>
            <Switch
              checked={getHandleStatus('left')}
              onCheckedChange={() => handleToggleHandle('left')}
              className="scale-75"
            />
          </div>

          {/* Right Handle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <ArrowRight size={16} className={cn(
                "transition-colors",
                getHandleStatus('right') ? "text-primary" : "text-slate-300"
              )} />
              <span className="text-xs font-medium text-slate-700">Right</span>
            </div>
            <Switch
              checked={getHandleStatus('right')}
              onCheckedChange={() => handleToggleHandle('right')}
              className="scale-75"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => {
              if (selectedNodeId) {
                ['top', 'bottom', 'left', 'right'].forEach(pos => {
                  if (!getHandleStatus(pos as HandlePosition)) {
                    toggleHandle(selectedNodeId, pos as HandlePosition);
                  }
                });
              }
            }}
          >
            Enable All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => {
              if (selectedNodeId) {
                ['top', 'bottom', 'left', 'right'].forEach(pos => {
                  if (getHandleStatus(pos as HandlePosition)) {
                    toggleHandle(selectedNodeId, pos as HandlePosition);
                  }
                });
              }
            }}
          >
            Disable All
          </Button>
        </div>

        {/* Informasi koneksi untuk operator */}
        {isOperator && (
          <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-100">
            <p className="text-[10px] text-purple-600">
              <span className="font-medium">Active handles:</span>{' '}
              {activeHandles.map(h => h.charAt(0).toUpperCase() + h.slice(1)).join(', ')}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!selectedNode) {
    return (
      <div className="w-full h-full bg-slate-50 border-l border-slate-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
          <Settings size={32} />
        </div>
        <h3 className="text-slate-600 font-bold mb-1">No Item Selected</h3>
        <p className="text-xs text-slate-400 max-w-[200px]">
          Click on any machine or operator in the canvas to view and edit its properties.
        </p>
      </div>
    );
  }

  const { data } = selectedNode;
  const isMachine = selectedNode.type === 'machineNode' || selectedNode.type === 'shapeMachineNode';
  const isOperator = selectedNode.type === 'operatorNode';

  // Handler untuk perubahan data operator
  const handleOperatorChange = (field: 'id' | 'process', value: number) => {
    if (!isOperator || !isOperatorData(data)) return;
    
    const operatorData = data as OperatorData;
    const newData = { ...operatorData, [field]: value };
    
    // Validasi untuk process: cek duplikasi di operator lain dengan ID yang sama
    if (field === 'process') {
      // Gunakan type guard untuk filter operator nodes
      const otherOperators = filterOperatorNodes(
        nodes,
        (n): n is Node<OperatorData> => 
          n.id !== selectedNode.id && n.data.id === operatorData.id
      );
      
      const isDuplicate = otherOperators.some(n => n.data.process === value);
      
      if (isDuplicate) {
        alert(`Process ${value} is already used by another operator with ID ${operatorData.id}`);
        return;
      }
    }
    
    updateNodeData(selectedNode.id, newData);
    // Trigger update koneksi setelah perubahan
    setTimeout(() => updateOperatorConnections(), 100);
  };

  // Handler untuk machine change
  const handleMachineChange = (field: keyof MachineData, value: any) => {
    if (!isMachine) return;
    updateNodeData(selectedNode.id, { [field]: value });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete this ${isMachine ? 'machine' : 'operator'}?`)) {
      deleteNode(selectedNode.id);
    }
  };

  // Render untuk Operator
  if (isOperator && isOperatorData(data)) {
    const operatorData = data as OperatorData;
    
    // Cari operator lain dengan ID yang sama menggunakan type guard
    const otherOperators = filterOperatorNodes(
      nodes,
      (n): n is Node<OperatorData> => 
        n.id !== selectedNode.id && n.data.id === operatorData.id
    );
    
    return (
      <div className="w-full h-full bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={18} className="text-purple-500" />
            <h2 className="font-bold text-slate-700">Operator Details</h2>
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
              <Label htmlFor="operator-label" className="text-xs font-bold text-slate-400 uppercase">Operator Label</Label>
              <Input 
                id="operator-label"
                value={operatorData.label || `Operator ${operatorData.id}`}
                onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                className="border-slate-200 focus:border-purple-500 transition-colors h-10"
              />
            </div>
          </div>

          {/* ID and Process */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-400 uppercase block">Operator Identity</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operator-id" className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Hash size={12} />
                  ID (Group)
                </Label>
                <Input 
                  id="operator-id"
                  type="number"
                  value={operatorData.id}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0 && val <= 999) {
                      handleOperatorChange('id', val);
                    }
                  }}
                  min={1}
                  max={999}
                  className="border-slate-200 h-10"
                />
                <p className="text-[10px] text-slate-400">
                  Operators with same ID are automatically connected
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator-process" className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <ListOrdered size={12} />
                  Process Order
                </Label>
                <Input 
                  id="operator-process"
                  type="number"
                  value={operatorData.process}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0 && val <= 999) {
                      handleOperatorChange('process', val);
                    }
                  }}
                  min={1}
                  max={999}
                  className="border-slate-200 h-10"
                />
                <p className="text-[10px] text-slate-400">
                  Must be unique for same ID
                </p>
              </div>
            </div>

            {/* Handle Controls */}
            {renderHandleControls()}

            {/* Chair Design Section - Hanya tampil di mode shapes */}
            {viewMode === 'shapes' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 11V9a6 6 0 0 1 12 0v2" />
                    <path d="M6 11h12v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7z" />
                    <path d="M8 20v-2h8v2" />
                  </svg>
                  Chair Design
                </Label>

                {/* Enable/Disable Chair */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-600">Enable Chair Design</Label>
                  <Switch
                    checked={operatorData.chairDesign?.enabled !== false}
                    onCheckedChange={(checked) => {
                      const currentChair = operatorData.chairDesign || {
                        enabled: true,
                        chairColor: operatorData.color || '#a855f7',
                        showIdInChair: true,
                        showProcessInChair: true,
                        chairWidth: 80,
                        chairHeight: 100,
                        seatDepth: 45,
                        backrestHeight: 55,
                      };
                      updateNodeData(selectedNode.id, {
                        chairDesign: { ...currentChair, enabled: checked }
                      });
                    }}
                  />
                </div>

                {operatorData.chairDesign?.enabled !== false && (
                  <>
                    {/* Chair Color */}
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">Chair Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={operatorData.chairDesign?.chairColor || operatorData.color || '#a855f7'}
                          onChange={(e) => {
                            const currentChair = operatorData.chairDesign || {
                              enabled: true,
                              showIdInChair: true,
                              showProcessInChair: true,
                              chairWidth: 80,
                              chairHeight: 100,
                              seatDepth: 45,
                              backrestHeight: 55,
                            };
                            updateNodeData(selectedNode.id, {
                              chairDesign: { ...currentChair, chairColor: e.target.value }
                            });
                          }}
                          className="w-10 h-8 border rounded cursor-pointer"
                        />
                        <Input
                          value={operatorData.chairDesign?.chairColor || operatorData.color || '#a855f7'}
                          onChange={(e) => {
                            const currentChair = operatorData.chairDesign || {
                              enabled: true,
                              showIdInChair: true,
                              showProcessInChair: true,
                              chairWidth: 80,
                              chairHeight: 100,
                              seatDepth: 45,
                              backrestHeight: 55,
                            };
                            updateNodeData(selectedNode.id, {
                              chairDesign: { ...currentChair, chairColor: e.target.value }
                            });
                          }}
                          className="flex-1 h-8 text-sm font-mono"
                        />
                      </div>
                    </div>

                    {/* Show ID/Process Toggles */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-600">Show ID</Label>
                        <Switch
                          checked={operatorData.chairDesign?.showIdInChair !== false}
                          onCheckedChange={(checked) => {
                            const currentChair = operatorData.chairDesign || {
                              enabled: true,
                              chairColor: operatorData.color || '#a855f7',
                              chairWidth: 80,
                              chairHeight: 100,
                              seatDepth: 45,
                              backrestHeight: 55,
                            };
                            updateNodeData(selectedNode.id, {
                              chairDesign: { ...currentChair, showIdInChair: checked }
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-600">Show Process</Label>
                        <Switch
                          checked={operatorData.chairDesign?.showProcessInChair !== false}
                          onCheckedChange={(checked) => {
                            const currentChair = operatorData.chairDesign || {
                              enabled: true,
                              chairColor: operatorData.color || '#a855f7',
                              chairWidth: 80,
                              chairHeight: 100,
                              seatDepth: 45,
                              backrestHeight: 55,
                            };
                            updateNodeData(selectedNode.id, {
                              chairDesign: { ...currentChair, showProcessInChair: checked }
                            });
                          }}
                        />
                      </div>
                    </div>

                    {/* Chair Dimensions */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">Chair Dimensions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-slate-400">Width</Label>
                          <Input
                            type="number"
                            value={operatorData.chairDesign?.chairWidth || 80}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val >= 40 && val <= 200) {
                                const currentChair = operatorData.chairDesign || {};
                                updateNodeData(selectedNode.id, {
                                  chairDesign: { ...currentChair, enabled: currentChair.enabled !== false, chairWidth: val }
                                });
                              }
                            }}
                            className="h-8 text-sm"
                            min={40}
                            max={200}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-400">Height</Label>
                          <Input
                            type="number"
                            value={operatorData.chairDesign?.chairHeight || 100}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val >= 60 && val <= 250) {
                                const currentChair = operatorData.chairDesign || {};
                                updateNodeData(selectedNode.id, {
                                  chairDesign: { ...currentChair, enabled: currentChair.enabled !== false, chairHeight: val }
                                });
                              }
                            }}
                            className="h-8 text-sm"
                            min={60}
                            max={250}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview Chair */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-400 mb-2">Preview</p>
                      <div className="flex items-center justify-center">
                        <svg width="60" height="70" viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
                          {/* Simplified chair preview */}
                          <rect x="15" y="40" width="50" height="8" rx="3" fill={operatorData.chairDesign?.chairColor || operatorData.color || '#a855f7'} />
                          <rect x="18" y="5" width="44" height="37" rx="3" fill={`${operatorData.chairDesign?.chairColor || operatorData.color || '#a855f7'}cc`} />
                          <rect x="20" y="48" width="5" height="20" rx="1" fill="#6b7280" />
                          <rect x="55" y="48" width="5" height="20" rx="1" fill="#6b7280" />
                          <circle cx="40" cy="23" r="10" fill="white" stroke={operatorData.chairDesign?.chairColor || operatorData.color || '#a855f7'} strokeWidth="1.5" />
                          <text x="40" y="21" textAnchor="middle" fill={operatorData.chairDesign?.chairColor || operatorData.color || '#a855f7'} fontSize="8" fontWeight="bold">ID</text>
                          <text x="40" y="29" textAnchor="middle" fill={operatorData.chairDesign?.chairColor || operatorData.color || '#a855f7'} fontSize="6">P</text>
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Info panel about connections */}
            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700">Connection Status</span>
              </div>
              
              {otherOperators.length === 0 ? (
                <p className="text-xs text-purple-600">
                  No other operators with ID {operatorData.id}. Add more to create connections.
                </p>
              ) : (
                <div>
                  <p className="text-xs text-purple-600 mb-2">
                    Connected to {otherOperators.length} operator(s) with same ID:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {otherOperators
                      .sort((a, b) => a.data.process - b.data.process)
                      .map(op => (
                        <div 
                          key={op.id} 
                          className="text-[10px] bg-white p-2 rounded border border-purple-100 flex justify-between items-center hover:bg-purple-50/50 transition-colors"
                          style={{ borderLeftColor: op.data.color || '#a855f7', borderLeftWidth: '3px' }}
                        >
                          <span className="truncate max-w-[120px]">
                            {op.data.label || `Operator ${op.data.id}`}
                          </span>
                          <span className="font-bold text-purple-700 whitespace-nowrap ml-2">
                            P{op.data.process}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100">
          <Button 
            variant="destructive" 
            className="w-full font-bold flex items-center justify-center gap-2 h-11 shadow-sm"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Remove Operator
          </Button>
        </div>
      </div>
    );
  }

  // Render untuk Machine
  if (isMachine && isMachineData(data)) {
    const machineData = data as MachineData;
    const currentTemplateId = nodeTemplates?.[selectedNode.id];
    const currentTemplate = currentTemplateId 
      ? templates.find(t => t.id === currentTemplateId) 
      : null;
    const frameRotation = (machineData as any).frameRotation || 
                          currentTemplate?.frameRotation || 
                          0;

    const handleRotationChange = (rotation: number) => {
      const validRotation = Math.min(360, Math.max(0, rotation));
      updateNodeData(selectedNode.id, { frameRotation: validRotation });
    };

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
                value={machineData.label}
                onChange={(e) => handleMachineChange('label', e.target.value)}
                className="border-slate-200 focus:border-primary transition-colors h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine-status" className="text-xs font-bold text-slate-400 uppercase">Operating Status</Label>
              <Select 
                value={machineData.status} 
                onValueChange={(val: any) => handleMachineChange('status', val)}
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
                  <span className="text-xs font-bold text-slate-700">{machineData.capacity || 100}</span>
                </div>
                <Input 
                  id="capacity"
                  type="number"
                  value={machineData.capacity || 100}
                  onChange={(e) => handleMachineChange('capacity', parseInt(e.target.value))}
                  className="border-slate-200 h-10"
                  min={1}
                  max={1000}
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Current Throughput</span>
                  <TrendingUp size={14} className={cn(machineData.status === 'active' ? 'text-green-500' : 'text-slate-300')} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-800">{machineData.throughput}</span>
                  <span className="text-xs text-slate-500">Items / minute</span>
                </div>
              </div>
            </div>
          </div>

          {/* Handle Controls */}
          {renderHandleControls()}

          {/* Maintenance */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-400 uppercase block">Maintenance Logs</Label>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium">Last Inspection</p>
                <p className="text-xs font-bold text-slate-700">{machineData.lastMaintenance}</p>
              </div>
              <ChevronRight size={14} className="ml-auto text-slate-300" />
            </div>
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
  }

  // Fallback jika tipe tidak dikenal
  return (
    <div className="w-full h-full bg-white border-l border-slate-200 flex items-center justify-center p-8">
      <div className="text-center">
        <AlertCircle size={24} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Unknown node type selected</p>
      </div>
    </div>
  );
};

export default PropertyPanel;