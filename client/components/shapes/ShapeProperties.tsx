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
  EyeOff,
  Minus,
  Plus,
  ArrowLeftRight,
  ArrowUpDown
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
import { Shape, LineStyle, RectangleShape, CircleShape, LineShape, TextShape } from '@/shared/types';
import { cn } from '@/lib/utils';

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

  // Type guards
  const isLine = (shape: Shape): shape is LineShape => shape.type === 'line';
  const isRectangle = (shape: Shape): shape is RectangleShape => shape.type === 'rectangle';
  const isCircle = (shape: Shape): shape is CircleShape => shape.type === 'circle';
  const isText = (shape: Shape): shape is TextShape => shape.type === 'text';
  const isShapeWithBorder = (shape: Shape): boolean => {
    return ['rectangle', 'circle', 'triangle'].includes(shape.type);
  };

  // Line-specific functions
  const extendLine = (direction: 'left' | 'right' | 'up' | 'down', amount: number = 10) => {
    if (!isLine(shape) || !shape.points || shape.points.length < 4) return;

    const newPoints = [...shape.points];
    const lastIdx = newPoints.length - 2;

    switch (direction) {
      case 'left':
        newPoints[0] -= amount;
        break;
      case 'right':
        newPoints[lastIdx] += amount;
        break;
      case 'up':
        newPoints[1] -= amount;
        break;
      case 'down':
        newPoints[lastIdx + 1] += amount;
        break;
    }

    onUpdate({ points: newPoints });
  };

  const rotateLine = (direction: 'clockwise' | 'counterclockwise') => {
    if (!isLine(shape) || !shape.points || shape.points.length < 4) return;

    const angle = direction === 'clockwise' ? Math.PI / 4 : -Math.PI / 4;
    
    const centerX = (shape.points[0] + shape.points[shape.points.length - 2]) / 2;
    const centerY = (shape.points[1] + shape.points[shape.points.length - 1]) / 2;

    const newPoints = [...shape.points];
    for (let i = 0; i < shape.points.length; i += 2) {
      const dx = shape.points[i] - centerX;
      const dy = shape.points[i + 1] - centerY;
      
      const rotatedX = centerX + dx * Math.cos(angle) - dy * Math.sin(angle);
      const rotatedY = centerY + dx * Math.sin(angle) + dy * Math.cos(angle);
      
      newPoints[i] = Math.round(rotatedX);
      newPoints[i + 1] = Math.round(rotatedY);
    }

    onUpdate({ points: newPoints });
  };

  const flipLine = (axis: 'horizontal' | 'vertical') => {
    if (!isLine(shape) || !shape.points || shape.points.length < 4) return;

    const centerX = (shape.points[0] + shape.points[shape.points.length - 2]) / 2;
    const centerY = (shape.points[1] + shape.points[shape.points.length - 1]) / 2;

    const newPoints = [...shape.points];
    for (let i = 0; i < shape.points.length; i += 2) {
      if (axis === 'horizontal') {
        newPoints[i] = 2 * centerX - shape.points[i];
      } else {
        newPoints[i + 1] = 2 * centerY - shape.points[i + 1];
      }
    }

    onUpdate({ points: newPoints });
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
        {/* Position - always show */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-slate-500">X</Label>
              <Input
                type="number"
                value={shape.x}
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
                value={shape.y}
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

        {/* Size for rectangle and circle */}
        {(isRectangle(shape) || isCircle(shape)) && (
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase">Size</Label>
            {isRectangle(shape) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Width</Label>
                  <Input
                    type="number"
                    value={shape.width}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) {
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
                    value={shape.height}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        onUpdate({ height: val });
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
            {isCircle(shape) && (
              <div>
                <Label className="text-[10px] text-slate-500">Radius</Label>
                <Input
                  type="number"
                  value={shape.radius}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      onUpdate({ radius: val });
                    }
                  }}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Rectangle-specific properties */}
        {isRectangle(shape) && (
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase">Rectangle</Label>
            <div>
              <Label className="text-[10px] text-slate-500">Border Radius</Label>
              <Input
                type="number"
                value={shape.borderRadius || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    onUpdate({ borderRadius: val });
                  }
                }}
                className="h-8 text-sm"
                min={0}
              />
            </div>
          </div>
        )}

        {/* Line-specific properties */}
        {isLine(shape) && (
          <>
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase">Line Controls</Label>
              
              {/* Extend Line */}
              <div>
                <Label className="text-[10px] text-slate-500 mb-2 block">Extend Line</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => extendLine('left', 10)}
                    title="Extend left"
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => extendLine('right', 10)}
                    title="Extend right"
                  >
                    →
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => extendLine('up', 10)}
                    title="Extend up"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => extendLine('down', 10)}
                    title="Extend down"
                  >
                    ↓
                  </Button>
                </div>
              </div>

              {/* Rotate Line */}
              <div>
                <Label className="text-[10px] text-slate-500 mb-2 block">Rotate</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => rotateLine('counterclockwise')}
                  >
                    <RotateCw size={14} className="rotate-180" />
                    <span>45° Left</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => rotateLine('clockwise')}
                  >
                    <RotateCw size={14} />
                    <span>45° Right</span>
                  </Button>
                </div>
              </div>

              {/* Flip Line */}
              <div>
                <Label className="text-[10px] text-slate-500 mb-2 block">Flip</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => flipLine('horizontal')}
                  >
                    <ArrowLeftRight size={14} />
                    <span>Horizontal</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => flipLine('vertical')}
                  >
                    <ArrowUpDown size={14} />
                    <span>Vertical</span>
                  </Button>
                </div>
              </div>

              <Separator />
            </div>
          </>
        )}

        {/* Text-specific properties */}
        {isText(shape) && (
          <>
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase">Text Content</Label>
              <Input
                value={shape.text}
                onChange={(e) => onUpdate({ text: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase">Font Size</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (shape.fontSize > 8) onUpdate({ fontSize: shape.fontSize - 1 });
                  }}
                >
                  <Minus size={14} />
                </Button>
                <Input
                  type="number"
                  value={shape.fontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 8 && val <= 72) {
                      onUpdate({ fontSize: val });
                    }
                  }}
                  className="h-8 text-sm text-center"
                  min={8}
                  max={72}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (shape.fontSize < 72) onUpdate({ fontSize: shape.fontSize + 1 });
                  }}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-400 uppercase">Font Family</Label>
              <Select 
                value={shape.fontFamily}
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

        {/* Stroke Width - for all shapes except text? */}
        {!isText(shape) && (
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase">
              {isLine(shape) ? 'Line Width' : 'Stroke Width'}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  if (shape.strokeWidth > 1) onUpdate({ strokeWidth: shape.strokeWidth - 1 });
                }}
              >
                <Minus size={14} />
              </Button>
              <Input
                type="number"
                value={shape.strokeWidth}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 20) {
                    onUpdate({ strokeWidth: val });
                  }
                }}
                className="h-8 text-sm text-center"
                min={1}
                max={20}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  if (shape.strokeWidth < 20) onUpdate({ strokeWidth: shape.strokeWidth + 1 });
                }}
              >
                <Plus size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Stroke Style - for all shapes */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Stroke Style</Label>
          <Select 
            value={shape.strokeStyle}
            onValueChange={(val: LineStyle) => onUpdate({ strokeStyle: val })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Colors</Label>
          
          {/* Fill Color - untuk shape yang punya fill */}
          {!isLine(shape) && (
            <div>
              <Label className="text-[10px] text-slate-500">Fill Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={shape.fillColor}
                  onChange={(e) => onUpdate({ fillColor: e.target.value })}
                  className="w-10 h-8"
                />
                <Input
                  value={shape.fillColor}
                  onChange={(e) => onUpdate({ fillColor: e.target.value })}
                  className="flex-1 h-8 text-sm font-mono"
                />
              </div>
            </div>
          )}
          
          {/* Stroke Color - untuk semua shape */}
          <div>
            <Label className="text-[10px] text-slate-500">Stroke Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={shape.strokeColor}
                onChange={(e) => onUpdate({ strokeColor: e.target.value })}
                className="w-10 h-8"
              />
              <Input
                value={shape.strokeColor}
                onChange={(e) => onUpdate({ strokeColor: e.target.value })}
                className="flex-1 h-8 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Opacity</Label>
          <div>
            <Slider
              value={[shape.opacity]}
              onValueChange={([value]) => onUpdate({ opacity: value })}
              min={0}
              max={1}
              step={0.1}
              className="mt-2"
            />
            <div className="text-xs text-slate-500 text-right mt-1">
              {Math.round(shape.opacity * 100)}%
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Rotation</Label>
          <div>
            <Slider
              value={[shape.rotation || 0]}
              onValueChange={([value]) => onUpdate({ rotation: value })}
              min={0}
              max={360}
              step={1}
              className="mt-2"
            />
            <div className="text-xs text-slate-500 text-right mt-1">
              {Math.round(shape.rotation || 0)}°
            </div>
          </div>
        </div>

        {/* Z-Index */}
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-400 uppercase">Layer</Label>
          <div>
            <Input
              type="number"
              value={shape.zIndex}
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