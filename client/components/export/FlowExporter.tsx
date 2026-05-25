// ini ngak dipakai bang gans!
// client/components/export/FlowExporter.tsx

import React, { useState, useCallback } from 'react';
import { 
  Download, 
  Code2, 
  Copy, 
  CheckCircle, 
  FileJson,
  Share2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useStore } from '@/store/useStore';
import { toast } from '@/components/ui/use-toast';
import { 
  ExportedFlowData, 
  ExportedNodeData, 
  ExportedEdgeData,
  ExportConfig,
  FlowMetadata,
} from '@/shared/types';
import EmbeddableFlow from './EmbeddableFlow'; // ✅ IMPORT YANG BENAR

// =============================================
// HELPER FUNCTIONS
// =============================================

function buildExportData(
  nodes: any[],
  edges: any[],
  includeMetadata: boolean
): ExportedFlowData {
  const exportedNodes: ExportedNodeData[] = nodes.map(node => {
    const isOperator = node.type === 'operatorNode' || node.type === 'shapeOperatorNode';
    const data = node.data;

    const base: ExportedNodeData = {
      id: node.id,
      type: isOperator ? 'operator' : 'machine',
      label: data.label || `Node ${node.id.substring(0, 8)}`,
      position: {
        x: node.position.x,
        y: node.position.y,
      },
      handles: data.handles,
    };

    if (isOperator) {
      base.operatorId = data.id;
      base.process = data.process;
      base.color = data.color;
      base.chairDesign = data.chairDesign;
      base.width = data.chairDesign?.chairWidth || 80;
      base.height = (data.chairDesign?.chairHeight || 100) + 30;
    } else {
      base.status = data.status || 'idle';
      base.throughput = data.throughput || 0;
      base.capacity = data.capacity || 100;
      base.templateId = data.template?.id;
      base.frameRotation = data.frameRotation || 0;
      base.width = data.template?.width || 220;
      base.height = data.template?.height || 140;
    }

    return base;
  });

  const exportedEdges: ExportedEdgeData[] = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    const isSourceOperator = sourceNode?.type === 'operatorNode';
    const isTargetOperator = targetNode?.type === 'operatorNode';
    
    let type: 'machine' | 'operator' | 'mixed';
    if (isSourceOperator && isTargetOperator) type = 'operator';
    else if (!isSourceOperator && !isTargetOperator) type = 'machine';
    else type = 'mixed';

    const edgeData: ExportedEdgeData = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'bottom-source',
      targetHandle: edge.targetHandle || 'top-target',
      type,
      style: {
        stroke: (edge.style?.stroke as string) || (type === 'operator' ? '#a855f7' : '#1e293b'),
        strokeWidth: (edge.style?.strokeWidth as number) || 2,
        strokeDasharray: edge.style?.strokeDasharray as string,
        animated: edge.animated || false,
      },
    };

    if (edge.data?.operatorId) {
      edgeData.operatorId = edge.data.operatorId;
      edgeData.label = `P${edge.data.sourceProcess} → P${edge.data.targetProcess}`;
    }

    return edgeData;
  });

  let metadata: FlowMetadata | undefined;
  if (includeMetadata) {
    const machineNodes = nodes.filter(n => n.type === 'machineNode' || n.type === 'shapeMachineNode');
    metadata = {
      totalMachines: machineNodes.length,
      totalOperators: nodes.filter(n => n.type === 'operatorNode' || n.type === 'shapeOperatorNode').length,
      activeMachines: machineNodes.filter(n => n.data?.status === 'active').length,
      warningMachines: machineNodes.filter(n => n.data?.status === 'warning').length,
      downMachines: machineNodes.filter(n => n.data?.status === 'down').length,
      totalConnections: edges.length,
      operatorConnections: exportedEdges.filter(e => e.type === 'operator').length,
      machineConnections: exportedEdges.filter(e => e.type === 'machine').length,
    };
  }

  return {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    appName: 'Flow2D',
    nodes: exportedNodes,
    edges: exportedEdges,
    viewMode: 'default',
    ...(metadata && { metadata }),
  };
}

function generateEmbedCode(data: ExportedFlowData): string {
  const jsonData = JSON.stringify(data, null, 2);
  
  return `// =============================================
// Flow2D Exported Layout
// Generated: ${new Date().toLocaleString()}
// Nodes: ${data.nodes.length} | Edges: ${data.edges.length}
// =============================================

import React from 'react';
import EmbeddableFlow from '@/components/export/EmbeddableFlow';

const flowData = ${jsonData};

const MyFlowLayout: React.FC = () => {
  return (
    <EmbeddableFlow
      data={flowData}
      width="100%"
      height={600}
      readOnly={true}
      showControls={true}
      showMiniMap={true}
    />
  );
};

export default MyFlowLayout;`;
}

// =============================================
// MAIN COMPONENT
// =============================================

const FlowExporter: React.FC = () => {
  const { nodes, edges } = useStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    includeTemplates: true,
    includeMetadata: true,
    prettyPrint: true,
    embedMode: false,
    fileName: `flow2d-export-${new Date().toISOString().slice(0, 10)}`,
  });
  const [activeTab, setActiveTab] = useState('json');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Build export data
  const exportData = buildExportData(nodes, edges, exportConfig.includeMetadata);
  const jsonOutput = JSON.stringify(exportData, null, exportConfig.prettyPrint ? 2 : 0);
  const embedCode = generateEmbedCode(exportData);

  // Handle export to file
  const handleExportFile = useCallback(() => {
    if (nodes.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'Add some machines or operators first',
        variant: 'destructive',
      });
      return;
    }

    setExporting(true);
    
    try {
      const dataStr = jsonOutput;
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `${exportConfig.fileName || 'flow2d-export'}.json`);
      linkElement.click();
      
      toast({
        title: 'Export successful',
        description: `File "${exportConfig.fileName}.json" downloaded`,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }, [nodes, jsonOutput, exportConfig.fileName]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'You can now paste this into your application',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please try again or copy manually',
        variant: 'destructive',
      });
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white gap-2"
        >
          <Share2 size={16} className="text-slate-500" />
          <span className="text-xs font-medium">Export/Embed</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download size={20} />
            Export Flow Layout
          </DialogTitle>
          <DialogDescription>
            Export your flow as JSON or generate embeddable React component code
          </DialogDescription>
        </DialogHeader>

        {/* Config */}
        <div className="space-y-3 py-2 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Include Metadata</Label>
              <p className="text-[10px] text-slate-400">Add machine/operator statistics</p>
            </div>
            <Switch
              checked={exportConfig.includeMetadata}
              onCheckedChange={(v) => setExportConfig(prev => ({ ...prev, includeMetadata: v }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Pretty Print JSON</Label>
              <p className="text-[10px] text-slate-400">Formatted output (easier to read)</p>
            </div>
            <Switch
              checked={exportConfig.prettyPrint}
              onCheckedChange={(v) => setExportConfig(prev => ({ ...prev, prettyPrint: v }))}
            />
          </div>

          <div>
            <Label className="text-xs font-medium">File Name</Label>
            <Input
              value={exportConfig.fileName}
              onChange={(e) => setExportConfig(prev => ({ ...prev, fileName: e.target.value }))}
              className="h-8 text-xs mt-1"
              placeholder="flow2d-export"
            />
          </div>
        </div>

        {/* Tabs: JSON | Embed Code */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="json" className="text-xs">
              <FileJson size={14} className="mr-1" />
              JSON Data
            </TabsTrigger>
            <TabsTrigger value="embed" className="text-xs">
              <Code2 size={14} className="mr-1" />
              Embed Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-3">
            <div className="relative">
              <Textarea
                value={jsonOutput}
                readOnly
                className="font-mono text-xs h-64 resize-none bg-slate-50"
                placeholder="No data to export"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 h-7 text-xs"
                onClick={() => handleCopy(jsonOutput)}
              >
                {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleExportFile}
                disabled={nodes.length === 0 || exporting}
                className="flex-1 gap-2"
                size="sm"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Download JSON File
              </Button>
            </div>

            {/* Stats */}
            {exportConfig.includeMetadata && exportData.metadata && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-bold text-slate-600 mb-2">Layout Summary</p>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400">Machines:</span>
                    <span className="font-bold ml-1">{exportData.metadata.totalMachines}</span>
                    <span className="text-green-600 ml-1">({exportData.metadata.activeMachines} active)</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Operators:</span>
                    <span className="font-bold ml-1">{exportData.metadata.totalOperators}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Connections:</span>
                    <span className="font-bold ml-1">{exportData.metadata.totalConnections}</span>
                  </div>
                  <div className="text-red-600">
                    Down: {exportData.metadata.downMachines}
                  </div>
                  <div className="text-amber-600">
                    Warning: {exportData.metadata.warningMachines}
                  </div>
                  <div className="text-purple-600">
                    Op. Connections: {exportData.metadata.operatorConnections}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="embed" className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>How to embed:</strong> Copy the code below and paste it into your React application.
                Make sure <code className="bg-blue-100 px-1 rounded">EmbeddableFlow</code> component is accessible.
              </p>
            </div>

            <div className="relative">
              <Textarea
                value={embedCode}
                readOnly
                className="font-mono text-xs h-64 resize-none bg-slate-50"
                placeholder="Generate embed code first"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 h-7 text-xs"
                onClick={() => handleCopy(embedCode)}
              >
                {copied ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <p className="text-[10px] text-slate-400">
              This code creates a read-only visualization of your flow layout.
              The <code className="bg-slate-100 px-1 rounded">EmbeddableFlow</code> component 
              uses ReactFlow internally with your exported data.
            </p>
          </TabsContent>
        </Tabs>

        {/* ✅ PREVIEW - FIX: Gunakan import yang benar */}
        {nodes.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Preview</p>
            <div className="border border-slate-200 rounded-lg overflow-hidden" style={{ height: 180 }}>
              {/* ✅ Gunakan JSX langsung, bukan React.createElement */}
              <EmbeddableFlow
                data={exportData}
                width="100%"
                height={180}
                readOnly={true}
                showControls={false}
                showMiniMap={false}
                showBackground={true}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FlowExporter;