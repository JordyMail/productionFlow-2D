// client/components/shapes/ShapeProperties.tsx
import React from 'react';
import { 
  X, 
  Trash2,
  Palette,
  Move,
  RotateCw,
  Layers,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Shape } from '@/shared/types';

interface ShapePropertiesProps {
  shape: Shape;
  onUpdate: (updates: Partial<Shape>) => void;
  onDelete: () => void;
}

const ShapeProperties: React.FC<ShapePropertiesProps> = ({
  shape,
  onUpdate,
  onDelete
}) => {
  // Guard clause - jika shape undefined, jangan render
  if (!shape) {
    return (
      <div className="p-4 text-center text-slate-400">
        No shape selected
      </div>
    );
  }

  // Helper function untuk safe value
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-700">Shape Properties</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Position */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-slate-500">X</Label>
              <Input
                type="number"
                value={safeNumber(shape.x)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    onUpdate({ x: val });
                  }
                }}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Y</Label>
              <Input
                type="number"
                value={safeNumber(shape.y)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    onUpdate({ y: val });
                  }
                }}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Size (conditional based on shape type) */}
        {(shape.type === 'rectangle' || shape.type === 'circle') && (
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase">Size</Label>
            {shape.type === 'rectangle' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Width</Label>
                  <Input
                    type="number"
                    value={safeNumber(shape.width, 50)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        onUpdate({ width: val });
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Height</Label>
                  <Input
                    type="number"
                    value={safeNumber(shape.height, 50)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        onUpdate({ height: val });
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
            {shape.type === 'circle' && (
              <div>
                <Label className="text-[10px] text-slate-500">Radius</Label>
                <Input
                  type="number"
                  value={safeNumber(shape.radius, 25)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      onUpdate({ radius: val });
                    }
                  }}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Line-specific properties */}
        {shape.type === 'line' && (
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase">Line Properties</Label>
            <div>
              <Label className="text-[10px] text-slate-500">Stroke Width</Label>
              <Input
                type="number"
                value={safeNumber((shape as any).strokeWidth, 2)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    onUpdate({ strokeWidth: val });
                  }
                }}
                className="h-8 text-sm"
                min={1}
                max={20}
              />
            </div>
          </div>
        )}

        {/* Text-specific properties */}
        {shape.type === 'text' && (
          <>
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase">Text Content</Label>
              <Input
                value={(shape as any).text || 'Text'}
                onChange={(e) => onUpdate({ text: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase">Font Size</Label>
              <Input
                type="number"
                value={safeNumber((shape as any).fontSize, 14)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    onUpdate({ fontSize: val });
                  }
                }}
                className="h-8 text-sm"
                min={8}
                max={72}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase">Font Family</Label>
              <Select 
                value={(shape as any).fontFamily || 'Arial'}
                onValueChange={(val) => onUpdate({ fontFamily: val })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Colors */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Colors</Label>
          <div>
            <Label className="text-[10px] text-slate-500">Fill Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={shape.color || '#3b82f6'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="w-10 h-8"
              />
              <Input
                value={shape.color || '#3b82f6'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="flex-1 h-8 text-sm font-mono"
              />
            </div>
          </div>
          
          {shape.type !== 'text' && (
            <div>
              <Label className="text-[10px] text-slate-500">Border Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={shape.borderColor || '#000000'}
                  onChange={(e) => onUpdate({ borderColor: e.target.value })}
                  className="w-10 h-8"
                />
                <Input
                  value={shape.borderColor || '#000000'}
                  onChange={(e) => onUpdate({ borderColor: e.target.value })}
                  className="flex-1 h-8 text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Border Width (if applicable) */}
        {shape.type !== 'text' && shape.type !== 'line' && (
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase">Border</Label>
            <div>
              <Label className="text-[10px] text-slate-500">Border Width</Label>
              <Slider
                value={[safeNumber(shape.borderWidth, 1)]}
                onValueChange={([value]) => onUpdate({ borderWidth: value })}
                min={0}
                max={10}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-slate-500 text-right mt-1">
                {safeNumber(shape.borderWidth, 1)}px
              </div>
            </div>
          </div>
        )}

        {/* Opacity */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Opacity</Label>
          <div>
            <Slider
              value={[safeNumber(shape.opacity, 1)]}
              onValueChange={([value]) => onUpdate({ opacity: value })}
              min={0}
              max={1}
              step={0.1}
              className="mt-2"
            />
            <div className="text-xs text-slate-500 text-right mt-1">
              {Math.round(safeNumber(shape.opacity, 1) * 100)}%
            </div>
          </div>
        </div>

        {/* Z-Index */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Layer</Label>
          <div>
            <Input
              type="number"
              value={safeNumber(shape.zIndex, 0)}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  onUpdate({ zIndex: val });
                }
              }}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShapeProperties;