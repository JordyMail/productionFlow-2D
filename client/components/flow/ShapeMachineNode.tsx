// client/components/flow/ShapeMachineNode.tsx
import React, { memo, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MachineData } from '@/store/useStore';
import { MachineTemplate } from '@/shared/types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ShapeMachineNodeProps extends NodeProps<MachineData & { 
  template?: MachineTemplate;
  frameRotation?: number;
}> {
  data: MachineData & { 
    template?: MachineTemplate;
    frameRotation?: number;
  };
}

const ShapeMachineNode = ({ data, selected }: ShapeMachineNodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { label, template, frameRotation } = data;

  // Draw shapes on canvas - TANPA ROTASI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, template.width, template.height);

    // Sort shapes by zIndex
    const sortedShapes = [...template.shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Draw each shape - TANPA rotasi
    sortedShapes.forEach(shape => {
      ctx.save();
      
      // Set opacity
      ctx.globalAlpha = shape.opacity ?? 1;
      
      switch (shape.type) {
        case 'rectangle':
          ctx.fillStyle = shape.fillColor;
          ctx.fillRect(shape.x, shape.y, shape.width || 50, shape.height || 50);
          
          if (shape.strokeWidth > 0) {
            ctx.strokeStyle = shape.strokeColor;
            ctx.lineWidth = shape.strokeWidth;
            ctx.strokeRect(shape.x, shape.y, shape.width || 50, shape.height || 50);
          }
          break;
          
        case 'circle':
          ctx.beginPath();
          ctx.arc(shape.x + (shape.radius || 25), shape.y + (shape.radius || 25), shape.radius || 25, 0, Math.PI * 2);
          ctx.fillStyle = shape.fillColor;
          ctx.fill();
          
          if (shape.strokeWidth > 0) {
            ctx.strokeStyle = shape.strokeColor;
            ctx.lineWidth = shape.strokeWidth;
            ctx.stroke();
          }
          break;
          
        case 'triangle':
          if (shape.points && shape.points.length >= 6) {
            ctx.beginPath();
            ctx.moveTo(shape.x + shape.points[0], shape.y + shape.points[1]);
            ctx.lineTo(shape.x + shape.points[2], shape.y + shape.points[3]);
            ctx.lineTo(shape.x + shape.points[4], shape.y + shape.points[5]);
            ctx.closePath();
            ctx.fillStyle = shape.fillColor;
            ctx.fill();
            
            if (shape.strokeWidth > 0) {
              ctx.strokeStyle = shape.strokeColor;
              ctx.lineWidth = shape.strokeWidth;
              ctx.stroke();
            }
          }
          break;
          
        case 'line':
          if (shape.points && shape.points.length >= 4) {
            ctx.beginPath();
            ctx.moveTo(shape.x + shape.points[0], shape.y + shape.points[1]);
            for (let i = 2; i < shape.points.length; i += 2) {
              ctx.lineTo(shape.x + shape.points[i], shape.y + shape.points[i + 1]);
            }
            ctx.strokeStyle = shape.strokeColor;
            ctx.lineWidth = shape.strokeWidth || 2;
            ctx.stroke();
          }
          break;
          
        case 'text':
          ctx.font = `${shape.fontStyle || 'normal'} ${shape.fontWeight || 'normal'} ${shape.fontSize}px ${shape.fontFamily}`;
          ctx.fillStyle = shape.fillColor;
          ctx.textAlign = shape.textAlign || 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(shape.text || 'Text', shape.x, shape.y);
          break;
      }
      
      ctx.restore();
    });
  }, [template]); // ✅ Hanya template sebagai dependency, TIDAK frameRotation

  // Function to get frame style based on type and rotation
  const getFrameStyle = () => {
    if (!template) return {};

    // Get rotation value (priority: node data > template)
    const rotation = frameRotation ?? template.frameRotation ?? 0;

    const baseStyle: React.CSSProperties = {
      width: template.width,
      height: template.height,
      borderColor: template.frameStrokeColor || '#3b82f6',
      borderWidth: template.frameStrokeWidth || 2,
      backgroundColor: template.frameColor || '#f8fafc',
      transform: rotation ? `rotate(${rotation}deg)` : 'none',
      transition: 'transform 0.2s ease',
    };

    // Apply border radius and clip path based on frame type
    switch (template.frameType) {
      case 'rectangle':
      case 'rectangle2x1':
        return {
          ...baseStyle,
          borderRadius: '8px',
          borderStyle: 'solid',
        };
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: '50%',
          borderStyle: 'solid',
        };
      case 'triangle':
        return {
          ...baseStyle,
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          borderStyle: 'solid',
        };
      default:
        return baseStyle;
    }
  };

  if (!template) {
    // Fallback to default node if no template
    return (
      <div className="px-4 py-3 shadow-md rounded-lg bg-white border-2 border-slate-200">
        <div className="text-center">
          <span className="text-xs text-slate-400">No template</span>
        </div>
      </div>
    );
  }

  // Get rotation for display
  const rotation = frameRotation ?? template.frameRotation ?? 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'shadow-md rounded-lg bg-white border-2 transition-all duration-200 relative',
              selected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'
            )}
            style={getFrameStyle()}
          >
            {/* Rotation indicator - small dot to show orientation */}
            {rotation !== 0 && (
              <div 
                className="absolute w-2 h-2 bg-primary rounded-full"
                style={{
                  top: '5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 0 2px white',
                }}
              />
            )}

            {/* Handles - tetap di posisi yang sama secara visual */}
            <Handle
              type="target"
              position={Position.Left}
              id="left-target"
              className="w-3 h-3 bg-primary border-2 border-white"
              style={{ top: '50%' }}
            />
            <Handle
              type="source"
              position={Position.Left}
              id="left-source"
              className="w-3 h-3 bg-primary border-2 border-white"
              style={{ top: '50%' }}
            />
            
            <Handle
              type="target"
              position={Position.Right}
              id="right-target"
              className="w-3 h-3 bg-primary border-2 border-white"
              style={{ top: '50%' }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="right-source"
              className="w-3 h-3 bg-primary border-2 border-white"
              style={{ top: '50%' }}
            />

            <Handle
              type="target"
              position={Position.Top}
              id="top-target"
              className="w-3 h-3 bg-primary border-2 border-white"
              style={{ left: '50%' }}
            />
            <Handle
              type="source"
              position={Position.Top}
              id="top-source"
              className="w-3 h-3 bg-primary border-2 border-white"
              style={{ left: '50%' }}
            />

            <Handle
              type="target"
              position={Position.Bottom}
              id="bottom-target"
              className="w-3 h-3 bg-primary border-2 border-white"
              style={{ left: '50%' }}
            />
            <Handle
              type="source"
              position={Position.Bottom}
              id="bottom-source"
              className="w-3 h-3 bg-primary border-2 border-white"
              style={{ left: '50%' }}
            />

            {/* Canvas untuk shapes - TANPA ROTASI */}
            <canvas
              ref={canvasRef}
              width={template.width}
              height={template.height}
              className="rounded-lg"
              // ✅ HAPUS transform rotate dari canvas
              // style={{
              //   transform: rotation ? `rotate(${rotation}deg)` : 'none',
              // }}
            />
          </div>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="bg-slate-800 text-white border-none">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium">{label}</p>
            {rotation !== 0 && (
              <p className="text-[10px] text-slate-300">Frame rotated: {rotation}°</p>
            )}
            <p className="text-[10px] text-slate-400">
              {template.frameType === 'rectangle' && 'Square 1x1'}
              {template.frameType === 'rectangle2x1' && 'Rectangle'}
              {template.frameType === 'circle' && 'Circle'}
              {template.frameType === 'triangle' && 'Triangle'}
            </p>
            <p className="text-[8px] text-slate-500">
              {template.width} x {template.height} • {template.shapes.length} shapes
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default memo(ShapeMachineNode);