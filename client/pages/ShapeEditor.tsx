// client/pages/ShapeEditor.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Square, 
  Circle, 
  Triangle,
  Minus,
  Type,
  Trash2,
  Copy,
  Eye,
  Grid,
  ZoomIn,
  ZoomOut,
  Move,
  Palette,
  RotateCw,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { useStore } from '@/store/useStore';
import { 
    Shape, 
    MachineTemplate, 
    TextShape, 
    LineShape, 
    TriangleShape, 
    CircleShape, 
    RectangleShape 
} from '@/shared/types';
import ShapeCanvas from '@/components/shapes/ShapeCanvas';
import ShapeProperties from '@/components/shapes/ShapeProperties';
import ShapeLibrary from '@/components/shapes/ShapeLibrary';
import { cn } from '@/lib/utils';

const ShapeEditor = () => {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { templates, saveTemplate } = useStore();
  
  // State declarations
  const [template, setTemplate] = useState<MachineTemplate | null>(null);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  // Helper function untuk merge shape updates
  const mergeShapeUpdates = (original: Shape, updates: Partial<Shape>): Shape => {
    // Pastikan type tidak berubah
    if (updates.type && updates.type !== original.type) {
      console.warn('Cannot change shape type');
      delete updates.type;
    }
    
    // Merge berdasarkan type
    switch (original.type) {
      case 'rectangle':
        return { ...original, ...updates } as RectangleShape;
      case 'circle':
        return { ...original, ...updates } as CircleShape;
      case 'triangle':
        return { ...original, ...updates } as TriangleShape;
      case 'line':
        return { ...original, ...updates } as LineShape;
      case 'text':
        return { ...original, ...updates } as TextShape;
      default:
        return original;
    }
  };

  // Load template berdasarkan ID
  useEffect(() => {
    if (templateId && templateId !== 'new') {
      const existing = templates.find(t => t.id === templateId);
      if (existing) {
        // Deep clone untuk menghindari mutasi
        setTemplate(JSON.parse(JSON.stringify(existing)));
        toast({
          title: "Template loaded",
          description: `Editing "${existing.name}"`,
          duration: 3000,
        });
      } else {
        // Template not found, redirect to new
        toast({
          title: "Template not found",
          description: "Creating new template instead",
          variant: "destructive",
          duration: 3000,
        });
        navigate('/shape-editor/new');
      }
    } else {
      // Create new template
      setTemplate({
        id: `template-${Date.now()}`,
        name: 'New Template',
        description: '',
        shapes: [],
        width: 300,
        height: 200,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: []
      });
    }
  }, [templateId, templates, navigate]);

  const handleAddShape = (shapeType: string) => {
    if (!template) return;
    
    let newShape: Shape;
    const baseId = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    switch (shapeType) {
      case 'rectangle':
        newShape = {
          id: baseId,
          type: 'rectangle',
          x: template.width / 2 - 25,
          y: template.height / 2 - 25,
          width: 50,
          height: 50,
          color: '#3b82f6',
          borderColor: '#1e293b',
          borderWidth: 1,
          opacity: 1,
          zIndex: template.shapes.length,
        } as RectangleShape;
        break;
        
      case 'circle':
        newShape = {
          id: baseId,
          type: 'circle',
          x: template.width / 2 - 25,
          y: template.height / 2 - 25,
          radius: 25,
          color: '#10b981',
          borderColor: '#1e293b',
          borderWidth: 1,
          opacity: 1,
          zIndex: template.shapes.length,
        } as CircleShape;
        break;
        
      case 'triangle':
        newShape = {
          id: baseId,
          type: 'triangle',
          x: template.width / 2 - 25,
          y: template.height / 2 - 25,
          points: [25, 0, 50, 50, 0, 50],
          color: '#f59e0b',
          borderColor: '#1e293b',
          borderWidth: 1,
          opacity: 1,
          zIndex: template.shapes.length,
        } as TriangleShape;
        break;
        
      case 'line':
        newShape = {
          id: baseId,
          type: 'line',
          x: template.width / 2 - 40,
          y: template.height / 2,
          points: [0, 0, 80, 0], // Horizontal line from (0,0) to (80,0)
          color: '#ef4444',
          strokeColor: '#ef4444',
          strokeWidth: 2,
          opacity: 1,
          zIndex: template.shapes.length,
        } as LineShape;
        break;
        
      case 'text':
        newShape = {
          id: baseId,
          type: 'text',
          x: template.width / 2 - 30,
          y: template.height / 2,
          text: 'Text',
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#000000',
          opacity: 1,
          zIndex: template.shapes.length,
        } as TextShape;
        break;
        
      default:
        return;
    }
    
    setTemplate({
      ...template,
      shapes: [...template.shapes, newShape]
    });
    setSelectedShapeId(newShape.id);
    setIsDirty(true);
  };

  const handleUpdateShape = (shapeId: string, updates: Partial<Shape>) => {
    if (!template) return;
    
    setTemplate({
      ...template,
      shapes: template.shapes.map(s => 
        s.id === shapeId ? mergeShapeUpdates(s, updates) : s
      )
    });
    setIsDirty(true);
  };

  const handleDeleteShape = (shapeId: string) => {
    if (!template) return;
    
    setTemplate({
      ...template,
      shapes: template.shapes.filter(s => s.id !== shapeId)
    });
    if (selectedShapeId === shapeId) {
      setSelectedShapeId(null);
    }
    setIsDirty(true);
  };

  const handleDuplicateShape = (shapeId: string) => {
    if (!template) return;
    
    const shape = template.shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    const newShape: Shape = {
      ...JSON.parse(JSON.stringify(shape)),
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: shape.x + 20,
      y: shape.y + 20,
      zIndex: template.shapes.length
    };
    
    setTemplate({
      ...template,
      shapes: [...template.shapes, newShape]
    });
    setSelectedShapeId(newShape.id);
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!template) return;
    
    if (!template.name.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for this template",
        variant: "destructive"
      });
      return;
    }
    
    const updatedTemplate = {
      ...template,
      updatedAt: Date.now()
    };
    
    saveTemplate(updatedTemplate);
    setIsDirty(false);
    
    toast({
      title: "Template saved",
      description: `"${template.name}" has been saved successfully`
    });
    
    navigate('/shape-editor');
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  if (!template) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar - Shape Library */}
      <div className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="text-slate-500"
            >
              <ArrowLeft size={16} />
            </Button>
            <h2 className="font-bold text-slate-700">Shape Editor</h2>
          </div>
          
          <Input
            value={template.name}
            onChange={(e) => {
              setTemplate({...template, name: e.target.value});
              setIsDirty(true);
            }}
            placeholder="Template name"
            className="mb-2"
          />
          
          <Textarea
            value={template.description}
            onChange={(e) => {
              setTemplate({...template, description: e.target.value});
              setIsDirty(true);
            }}
            placeholder="Description (optional)"
            rows={2}
            className="text-xs"
          />
        </div>
        
        <ShapeLibrary onAddShape={handleAddShape} />
        
        <div className="p-4 border-t border-slate-100 mt-auto">
          <Button 
            onClick={handleSave}
            className="w-full gap-2"
            disabled={!isDirty}
          >
            <Save size={16} />
            Save Template
          </Button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b border-slate-200 bg-white flex items-center px-4 gap-2">
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut size={16} />
          </Button>
          <span className="text-xs text-slate-500 w-16">
            {Math.round(zoom * 100)}%
          </span>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button 
            variant={showGrid ? "default" : "ghost"} 
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid size={16} />
          </Button>
          
          <div className="flex-1" />
          
          {selectedShapeId && (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDuplicateShape(selectedShapeId)}
              >
                <Copy size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDeleteShape(selectedShapeId)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
          
          {isDirty && (
            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Unsaved changes
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 bg-slate-100 flex items-center justify-center">
          <div 
            className="relative shadow-lg bg-white border border-slate-200"
            style={{
              width: template.width,
              height: template.height,
              transform: `scale(${zoom})`,
              transformOrigin: 'center'
            }}
          >
            <ShapeCanvas
              shapes={template.shapes}
              selectedShapeId={selectedShapeId}
              onSelectShape={setSelectedShapeId}
              onUpdateShape={handleUpdateShape}
              showGrid={showGrid}
              width={template.width}
              height={template.height}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      {selectedShapeId && (
        <div className="w-72 border-l border-slate-200 bg-white">
          <ShapeProperties
            shape={template.shapes.find(s => s.id === selectedShapeId)!}
            onUpdate={(updates) => handleUpdateShape(selectedShapeId, updates)}
            onDelete={() => handleDeleteShape(selectedShapeId)}
          />
        </div>
      )}
    </div>
  );
};

export default ShapeEditor;