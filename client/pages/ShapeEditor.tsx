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
  Layers,
  Frame
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
    RectangleShape,
    FrameType 
} from '@/shared/types';
import ShapeCanvas from '@/components/shapes/ShapeCanvas';
import ShapeProperties from '@/components/shapes/ShapeProperties';
import ShapeLibrary from '@/components/shapes/ShapeLibrary';
import TemplateLibrary from '@/components/shapes/TemplateLibrary';
import { cn } from '@/lib/utils';

// Frame Type Selector
const FrameTypeSelector: React.FC<{
  frameType: FrameType;
  onChange: (type: FrameType) => void;
}> = ({ frameType, onChange }) => {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-bold text-slate-400 uppercase">Frame Shape</Label>
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant={frameType === 'rectangle' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "h-16 flex-col gap-1",
            frameType === 'rectangle' && "border-primary ring-1 ring-primary/20"
          )}
          onClick={() => onChange('rectangle')}
        >
          <Square size={20} />
          <span className="text-[10px]">Square 1x1</span>
        </Button>
        
        <Button
          variant={frameType === 'rectangle2x1' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "h-16 flex-col gap-1",
            frameType === 'rectangle2x1' && "border-primary ring-1 ring-primary/20"
          )}
          onClick={() => onChange('rectangle2x1')}
        >
          <Square size={20} className="rotate-90" />
          <span className="text-[10px]">X-Rectangle</span>
        </Button>

        <Button
          variant={frameType === 'rectangle1x2' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "h-16 flex-col gap-1",
            frameType === 'rectangle1x2' && "border-primary ring-1 ring-primary/20"
          )}
          onClick={() => onChange('rectangle1x2')}
        >
          <Square size={20} className="rotate-90" />
          <span className="text-[10px]">Y-Rectangle</span>
        </Button>
        
        <Button
          variant={frameType === 'circle' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "h-16 flex-col gap-1",
            frameType === 'circle' && "border-primary ring-1 ring-primary/20"
          )}
          onClick={() => onChange('circle')}
        >
          <Circle size={20} />
          <span className="text-[10px]">Circle</span>
        </Button>
        
        <Button
          variant={frameType === 'triangle' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "h-16 flex-col gap-1",
            frameType === 'triangle' && "border-primary ring-1 ring-primary/20"
          )}
          onClick={() => onChange('triangle')}
        >
          <Triangle size={20} />
          <span className="text-[10px]">Triangle</span>
        </Button>
      </div>
    </div>
  );
};

// Size Preset Selector
const SizePresetSelector: React.FC<{
  frameType: FrameType;
  onSelectSize: (width: number, height: number) => void;
}> = ({ frameType, onSelectSize }) => {
  // Ukuran untuk setiap frame type
  const getPresets = () => {
    switch (frameType) {
      case 'rectangle': // Square 1x1
        return {
          small: { width: 120, height: 120, label: 'Small (120x120)' },
          medium: { width: 200, height: 200, label: 'Medium (200x200)' },
          large: { width: 300, height: 300, label: 'Large (300x300)' }
        };
      case 'rectangle2x1': // Rectangle 2x1
        return {
          small: { width: 120, height: 60, label: 'Small (120x60)' },
          medium: { width: 240, height: 120, label: 'Medium (240x120)' },
          large: { width: 360, height: 180, label: 'Large (360x180)' }
        };
      case 'rectangle1x2': // Rectangle 1x2
        return {
          small: { width: 60, height: 120, label: 'Small (60x120)' },
          medium: { width: 120, height: 240, label: 'Medium (120x240)' },
          large: { width: 180, height: 360, label: 'Large (180x360)' }
        };
      case 'circle':
        return {
          small: { width: 100, height: 100, label: 'Small (100x100)' },
          medium: { width: 200, height: 200, label: 'Medium (200x200)' },
          large: { width: 300, height: 300, label: 'Large (300x300)' }
        };
      case 'triangle':
        return {
          small: { width: 100, height: 100, label: 'Small (100x100)' },
          medium: { width: 200, height: 200, label: 'Medium (200x200)' },
          large: { width: 300, height: 300, label: 'Large (300x300)' }
        };
      default:
        return {
          small: { width: 100, height: 100, label: 'Small (100x100)' },
          medium: { width: 200, height: 200, label: 'Medium (200x200)' },
          large: { width: 300, height: 300, label: 'Large (300x300)' }
        };
    }
  };

  const presets = getPresets();

  return (
    <div className="space-y-3">
      <Label className="text-xs font-bold text-slate-400 uppercase">Frame Size</Label>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-12 flex-col gap-0"
          onClick={() => onSelectSize(presets.small.width, presets.small.height)}
        >
          <span className="text-xs font-bold">Small</span>
          <span className="text-[8px] text-slate-400">{presets.small.label}</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-12 flex-col gap-0"
          onClick={() => onSelectSize(presets.medium.width, presets.medium.height)}
        >
          <span className="text-xs font-bold">Medium</span>
          <span className="text-[8px] text-slate-400">{presets.medium.label}</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="h-12 flex-col gap-0"
          onClick={() => onSelectSize(presets.large.width, presets.large.height)}
        >
          <span className="text-xs font-bold">Large</span>
          <span className="text-[8px] text-slate-400">{presets.large.label}</span>
        </Button>
      </div>
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState<'library' | 'templates'>('library');

  // Default sizes berdasarkan frame type
  const getDefaultSize = (frameType: FrameType) => {
    switch (frameType) {
      case 'rectangle': // Square 1x1
        return { width: 200, height: 200 };
      case 'rectangle2x1': // Rectangle
        return { width: 240, height: 120 };
      case 'rectangle1x2': // Rectangle
        return { width: 120, height: 240 };
      case 'circle':
        return { width: 200, height: 200 };
      case 'triangle':
        return { width: 200, height: 200 };
      default:
        return { width: 200, height: 200 };
    }
  };

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
      // Create new template dengan ukuran default medium
      const defaultSize = getDefaultSize('rectangle');
      setTemplate({
        id: `template-${Date.now()}`,
        name: 'New Template',
        description: '',
        shapes: [],
        width: defaultSize.width,
        height: defaultSize.height,
        frameType: 'rectangle',
        frameColor: '#f8fafc',
        frameStrokeColor: '#3b82f6',
        frameStrokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: []
      });
    }
  }, [templateId, templates, navigate]);

  const handleSelectTemplate = (selectedTemplate: MachineTemplate | null) => {
    if (selectedTemplate) {
      navigate(`/shape-editor/${selectedTemplate.id}`);
    } else {
      if (templateId !== 'new') {
        navigate('/shape-editor/new');
      }
    }
  };

  const handleFrameTypeChange = (frameType: FrameType) => {
    if (!template) return;
    
    // Adjust ukuran berdasarkan frame type (gunakan medium)
    const defaultSize = getDefaultSize(frameType);
    
    setTemplate({
      ...template,
      frameType,
      width: defaultSize.width,
      height: defaultSize.height
    });
    setIsDirty(true);
  };

  const handleSizeSelect = (width: number, height: number) => {
    if (!template) return;
    setTemplate({
      ...template,
      width,
      height
    });
    setIsDirty(true);
  };

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
          fillColor: '#3b82f6',
          strokeColor: '#1e293b',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: template.shapes.length,
          rotation: 0,
          borderRadius: 0
        } as RectangleShape;
        break;
        
      case 'circle':
        newShape = {
          id: baseId,
          type: 'circle',
          x: template.width / 2 - 25,
          y: template.height / 2 - 25,
          radius: 25,
          fillColor: '#10b981',
          strokeColor: '#1e293b',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: template.shapes.length,
          rotation: 0
        } as CircleShape;
        break;
        
      case 'triangle':
        newShape = {
          id: baseId,
          type: 'triangle',
          x: template.width / 2 - 25,
          y: template.height / 2 - 25,
          points: [25, 0, 50, 50, 0, 50],
          fillColor: '#f59e0b',
          strokeColor: '#1e293b',
          strokeWidth: 1,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: template.shapes.length,
          rotation: 0
        } as TriangleShape;
        break;
        
      case 'line':
        newShape = {
          id: baseId,
          type: 'line',
          x: template.width / 2 - 40,
          y: template.height / 2,
          points: [0, 0, 80, 0],
          fillColor: 'transparent',
          strokeColor: '#ef4444',
          strokeWidth: 2,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: template.shapes.length,
          rotation: 0
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
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'left',
          fillColor: '#000000',
          strokeColor: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid',
          opacity: 1,
          zIndex: template.shapes.length,
          rotation: 0
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
      {/* Left Sidebar */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col overflow-y-auto">
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
        
        {/* Frame Settings */}
        <div className="p-4 border-b border-slate-100 space-y-4">
          <FrameTypeSelector 
            frameType={template.frameType}
            onChange={handleFrameTypeChange}
          />
          
          <Separator />
          
          <SizePresetSelector
            frameType={template.frameType}
            onSelectSize={handleSizeSelect}
          />
        </div>
        
        {/* Tabs untuk Shape Library dan Template Library */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="library">Shapes</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="flex-1 overflow-hidden">
            <ShapeLibrary onAddShape={handleAddShape} />
          </TabsContent>
          
          <TabsContent value="templates" className="flex-1 overflow-hidden">
            <TemplateLibrary 
              onSelectTemplate={handleSelectTemplate}
              selectedTemplateId={templateId !== 'new' ? templateId : null}
            />
          </TabsContent>
        </Tabs>
        
        <div className="p-4 border-t border-slate-100">
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
          
          {/* Frame info */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-md">
            <Frame size={14} className="text-slate-500" />
            <span className="text-xs font-medium text-slate-600">
              {template.width} x {template.height}
            </span>
          </div>
          
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

        {/* Canvas dengan frame yang bisa diatur ukurannya */}
        <div className="flex-1 overflow-auto p-8 bg-slate-100 flex items-center justify-center">
          <div 
            className="relative shadow-lg bg-white border-2 transition-all duration-300"
            style={{
              width: template.width,
              height: template.height,
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
              borderColor: template.frameStrokeColor || '#3b82f6',
              borderWidth: template.frameStrokeWidth || 2,
              borderRadius: template.frameType === 'circle' ? '50%' : 
              (template.frameType === 'rectangle' || template.frameType === 'rectangle2x1' || template.frameType === 'rectangle1x2') ? '8px' : '0',
              backgroundColor: template.frameColor || '#f8fafc',
              clipPath: template.frameType === 'triangle' 
                ? 'polygon(50% 0%, 0% 100%, 100% 100%)' 
                : 'none'
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
            
            {/* Frame dimension indicator */}
            <div className="absolute -top-6 left-0 text-[10px] text-slate-400">
              {template.width} x {template.height} px
            </div>
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