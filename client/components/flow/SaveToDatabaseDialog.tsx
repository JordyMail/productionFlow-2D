// client/components/flow/SaveToDatabaseDialog.tsx
import React, { useState, useCallback } from 'react';
import { 
  Database, 
  Save, 
  Loader2, 
  List,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from '@/components/ui/use-toast';
import { fetchAllSavedLines, fetchFlowByLineId } from '@/services/api';

const SaveToDatabaseDialog: React.FC = () => {
  const { saveFlowToDatabase, nodes } = useStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [lineId, setLineId] = useState('');
  const [lineName, setLineName] = useState('');
  const [flowName, setFlowName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingLines, setLoadingLines] = useState(false);
  const [savedLines, setSavedLines] = useState<any[]>([]);
  const [loadLineId, setLoadLineId] = useState('');

  // Load daftar line yang sudah tersimpan
  const loadSavedLines = useCallback(async () => {
    setLoadingLines(true);
    try {
      const lines = await fetchAllSavedLines();
      setSavedLines(lines || []);
    } catch (error: any) {
      toast({
        title: 'Failed to load saved lines',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingLines(false);
    }
  }, []);

  // Handle save
  const handleSave = async () => {
    if (!lineId.trim()) {
      toast({
        title: 'Line ID required',
        description: 'Please enter a Line ID to identify this layout',
        variant: 'destructive',
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: 'No nodes to save',
        description: 'Add some machines or operators first',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const success = await saveFlowToDatabase(
        lineId.trim(),
        lineName || undefined,
        flowName || undefined,
        description || undefined
      );

      if (success) {
        toast({
          title: 'Saved to database!',
          description: `Flow for line "${lineId}" has been saved to SQL Server`,
        });
        setIsOpen(false);
        // Reset form
        setLineId('');
        setLineName('');
        setFlowName('');
        setDescription('');
      } else {
        toast({
          title: 'Save failed',
          description: 'Could not save to database. Check connection.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle load
  const handleLoad = async () => {
    if (!loadLineId) return;
    
    setSaving(true);
    try {
      const flow = await fetchFlowByLineId(loadLineId);
      
      if (flow && flow.nodes && flow.edges) {
        const { nodes: loadedNodes, edges: loadedEdges, nodeTemplates } = flow;
        
        useStore.setState({
          nodes: loadedNodes,
          edges: loadedEdges,
          nodeTemplates: nodeTemplates || {},
        });
        
        toast({
          title: 'Flow loaded!',
          description: `Loaded layout for line "${loadLineId}" (${loadedNodes.length} nodes)`,
        });
        setIsOpen(false);
      } else {
        toast({
          title: 'No data found',
          description: `No flow found for line "${loadLineId}"`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Load failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) loadSavedLines();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white gap-2"
        >
          <Database size={16} className="text-slate-500" />
          <span className="text-xs font-medium">Save to DB</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database size={20} />
            Save Flow to Database
          </DialogTitle>
          <DialogDescription>
            Save your layout to SQL Server with a Line ID for later use in other applications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Line ID */}
          <div className="space-y-2">
            <Label htmlFor="lineId" className="text-xs font-bold text-slate-500 uppercase">
              Line ID <span className="text-red-400">*</span>
            </Label>
            <Input
              id="lineId"
              value={lineId}
              onChange={(e) => {
                setLineId(e.target.value);
                // Auto-fill flow name jika kosong
                if (!flowName) setFlowName(`Flow for ${e.target.value}`);
              }}
              placeholder="e.g., LINE-001, ASSY-LINE-05"
              className="h-10"
            />
            <p className="text-[10px] text-slate-400">
              This ID will be used to fetch this layout from other applications
            </p>
          </div>

          {/* Line Name */}
          <div className="space-y-2">
            <Label htmlFor="lineName" className="text-xs font-bold text-slate-500 uppercase">
              Line Name
            </Label>
            <Input
              id="lineName"
              value={lineName}
              onChange={(e) => setLineName(e.target.value)}
              placeholder="e.g., Assembly Line 5"
              className="h-10"
            />
          </div>

          {/* Flow Name */}
          <div className="space-y-2">
            <Label htmlFor="flowName" className="text-xs font-bold text-slate-500 uppercase">
              Flow Name
            </Label>
            <Input
              id="flowName"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="e.g., Production Layout v1"
              className="h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Stats */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs font-medium text-slate-600 mb-1">Layout Summary</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <span className="text-slate-400">
                Machines: <span className="font-bold text-slate-700">
                  {nodes.filter(n => n.type === 'machineNode' || n.type === 'shapeMachineNode').length}
                </span>
              </span>
              <span className="text-slate-400">
                Operators: <span className="font-bold text-slate-700">
                  {nodes.filter(n => n.type === 'operatorNode' || n.type === 'shapeOperatorNode').length}
                </span>
              </span>
              <span className="text-slate-400">
                Connections: <span className="font-bold text-slate-700">
                  {useStore.getState().edges.length}
                </span>
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3">
          {/* Load existing */}
          <div className="w-full space-y-2 pt-3 border-t border-slate-100">
            <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <List size={12} />
              Load Saved Line from Database
            </Label>
            <div className="flex gap-2">
              <Select value={loadLineId} onValueChange={setLoadLineId}>
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue placeholder="Select a saved line..." />
                </SelectTrigger>
                <SelectContent>
                  {savedLines.length === 0 ? (
                    <div className="p-2 text-xs text-slate-400 text-center">
                      No saved lines found
                    </div>
                  ) : (
                    savedLines.map((line: any) => (
                      <SelectItem key={line.lineId} value={line.lineId} className="text-xs">
                        {line.lineId} {line.lineName ? `- ${line.lineName}` : ''} 
                        <span className="text-slate-400 ml-1">(v{line.versionCount})</span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={loadSavedLines}
                disabled={loadingLines}
                title="Refresh list"
              >
                <RefreshCw size={14} className={loadingLines ? 'animate-spin' : ''} />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleLoad}
              disabled={!loadLineId || saving}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Download size={14} className="mr-1" />
              )}
              Load Selected Line
            </Button>
          </div>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={!lineId.trim() || nodes.length === 0 || saving}
            className="w-full gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving...' : 'Save to Database'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveToDatabaseDialog;