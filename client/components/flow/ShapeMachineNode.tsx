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

interface ShapeMachineNodeProps extends NodeProps<MachineData & { template?: MachineTemplate }> {
  data: MachineData & { template?: MachineTemplate };
}

const ShapeMachineNode = ({ data, selected }: ShapeMachineNodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { label, template } = data;

  // Draw shapes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, template.width, template.height);

    // Sort shapes by zIndex
    const sortedShapes = [...template.shapes].sort((a, b) => a.zIndex - b.zIndex);

    // Draw each shape
    sortedShapes.forEach(shape => {
      ctx.save();
      
      // Set opacity
      ctx.globalAlpha = shape.opacity ?? 1;
      
      switch (shape.type) {
        case 'rectangle':
          ctx.fillStyle = shape.fillColor;
          ctx.fillRect(shape.x, shape.y, shape.width || 50, shape.height || 50);
          
          if (shape.strokeColor) {
            ctx.strokeStyle = shape.strokeColor;
            ctx.lineWidth = shape.strokeWidth || 1;
            ctx.strokeRect(shape.x, shape.y, shape.width || 50, shape.height || 50);
          }
          break;
          
        case 'circle':
          ctx.beginPath();
          ctx.arc(shape.x + (shape.radius || 25), shape.y + (shape.radius || 25), shape.radius || 25, 0, Math.PI * 2);
          ctx.fillStyle = shape.fillColor;
          ctx.fill();
          
          if (shape.strokeColor) {
            ctx.strokeStyle = shape.strokeColor;
            ctx.lineWidth = shape.strokeWidth || 1;
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
            
            if (shape.strokeColor) {
              ctx.strokeStyle = shape.strokeColor;
              ctx.lineWidth = shape.strokeWidth || 1;
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
            ctx.strokeStyle = shape.strokeColor || shape.fillColor;
            ctx.lineWidth = shape.strokeWidth || 2;
            ctx.stroke();
          }
          break;
          
        case 'text':
          ctx.font = `${shape.fontSize || 14}px ${shape.fontFamily || 'Arial'}`;
          ctx.fillStyle = shape.fillColor;
          ctx.fillText(shape.text || '', shape.x, shape.y + (shape.fontSize || 14));
          break;
      }
      
      ctx.restore();
    });
  }, [template]);

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

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'shadow-md rounded-lg bg-white border-2 transition-all duration-200 relative',
              selected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'
            )}
            style={{
              width: template.width,
              height: template.height,
              borderColor: template.frameStrokeColor || '#3b82f6',
              borderWidth: template.frameStrokeWidth || 2,
              borderRadius: template.frameType === 'circle' ? '50%' : 
                            template.frameType === 'rectangle' ? '8px' : '0',
              backgroundColor: template.frameColor || '#f8fafc',
              clipPath: template.frameType === 'triangle' 
                ? 'polygon(50% 0%, 0% 100%, 100% 100%)' 
                : 'none'
            }}
          >
            {/* Handles */}
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

            {/* Canvas for shapes */}
            <canvas
              ref={canvasRef}
              width={template.width}
              height={template.height}
              className="rounded-lg"
            />
          </div>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="bg-slate-800 text-white border-none">
          <p className="text-xs font-medium">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default memo(ShapeMachineNode);