// client/components/shapes/ShapeCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Shape } from '@/shared/types';
import { cn } from '@/lib/utils';

interface ShapeCanvasProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
  showGrid?: boolean;
  width: number;
  height: number;
}

const ShapeCanvas: React.FC<ShapeCanvasProps> = ({
  shapes,
  selectedShapeId,
  onSelectShape,
  onUpdateShape,
  showGrid = true,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Helper function untuk hit detection
  const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
    switch (shape.type) {
      case 'rectangle':
        return x >= shape.x && 
               x <= shape.x + (shape.width || 50) &&
               y >= shape.y && 
               y <= shape.y + (shape.height || 50);
      
      case 'circle':
        const centerX = shape.x + (shape.radius || 25);
        const centerY = shape.y + (shape.radius || 25);
        const dx = x - centerX;
        const dy = y - centerY;
        return Math.sqrt(dx * dx + dy * dy) <= (shape.radius || 25);
      
      case 'triangle':
        if (shape.points && shape.points.length >= 6) {
          // Point-in-triangle test using barycentric coordinates
          const x1 = shape.x + shape.points[0];
          const y1 = shape.y + shape.points[1];
          const x2 = shape.x + shape.points[2];
          const y2 = shape.y + shape.points[3];
          const x3 = shape.x + shape.points[4];
          const y3 = shape.y + shape.points[5];
          
          const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
          const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
          const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
          const c = 1 - a - b;
          
          return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
        }
        return false;
      
      case 'line':
        if (shape.points && shape.points.length >= 4) {
          // Check distance to line segments
          for (let i = 0; i < shape.points.length - 2; i += 2) {
            const x1 = shape.x + shape.points[i];
            const y1 = shape.y + shape.points[i + 1];
            const x2 = shape.x + shape.points[i + 2];
            const y2 = shape.y + shape.points[i + 3];
            
            // Calculate distance from point to line segment
            const A = x - x1;
            const B = y - y1;
            const C = x2 - x1;
            const D = y2 - y1;
            
            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            
            if (len_sq !== 0) param = dot / len_sq;
            
            let xx, yy;
            
            if (param < 0) {
              xx = x1;
              yy = y1;
            } else if (param > 1) {
              xx = x2;
              yy = y2;
            } else {
              xx = x1 + param * C;
              yy = y1 + param * D;
            }
            
            const dx = x - xx;
            const dy = y - yy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 10) { // Threshold for line selection
              return true;
            }
          }
        }
        return false;
      
      case 'text':
        // Approximate text bounding box
        const textWidth = ((shape as any).text?.length || 4) * ((shape as any).fontSize || 14) * 0.6;
        const textHeight = (shape as any).fontSize || 14;
        return x >= shape.x && 
               x <= shape.x + textWidth &&
               y >= shape.y - textHeight && 
               y <= shape.y;
      
      default:
        return false;
    }
  };

  // Draw shapes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i <= width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
      }
      
      for (let i = 0; i <= height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
      }
    }

    // Sort shapes by zIndex
    const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // Draw each shape
    sortedShapes.forEach(shape => {
      ctx.save();
      
      // Set opacity
      ctx.globalAlpha = shape.opacity ?? 1;
      
      // Draw based on shape type
      switch (shape.type) {
        case 'rectangle':
          ctx.fillStyle = shape.color;
          ctx.fillRect(shape.x, shape.y, shape.width || 50, shape.height || 50);
          
          if (shape.borderColor && shape.borderWidth) {
            ctx.strokeStyle = shape.borderColor;
            ctx.lineWidth = shape.borderWidth;
            ctx.strokeRect(shape.x, shape.y, shape.width || 50, shape.height || 50);
          }
          break;
          
        case 'circle':
          ctx.beginPath();
          ctx.arc(shape.x + (shape.radius || 25), shape.y + (shape.radius || 25), shape.radius || 25, 0, Math.PI * 2);
          ctx.fillStyle = shape.color;
          ctx.fill();
          
          if (shape.borderColor && shape.borderWidth) {
            ctx.strokeStyle = shape.borderColor;
            ctx.lineWidth = shape.borderWidth;
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
            ctx.fillStyle = shape.color;
            ctx.fill();
            
            if (shape.borderColor && shape.borderWidth) {
              ctx.strokeStyle = shape.borderColor;
              ctx.lineWidth = shape.borderWidth;
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
            ctx.strokeStyle = (shape as any).strokeColor || shape.color || '#000000';
            ctx.lineWidth = (shape as any).strokeWidth || 2;
            ctx.stroke();
          }
          break;
          
        case 'text':
          ctx.font = `${(shape as any).fontSize || 14}px ${(shape as any).fontFamily || 'Arial'}`;
          ctx.fillStyle = shape.color;
          ctx.fillText((shape as any).text || 'Text', shape.x, shape.y);
          break;
      }
      
      ctx.restore();

      // Draw selection outline if selected
      if (shape.id === selectedShapeId) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Draw bounding box based on shape type
        switch (shape.type) {
          case 'rectangle':
            ctx.strokeRect(shape.x - 2, shape.y - 2, (shape.width || 50) + 4, (shape.height || 50) + 4);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(shape.x + (shape.radius || 25), shape.y + (shape.radius || 25), (shape.radius || 25) + 2, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'triangle':
            if (shape.points) {
              ctx.beginPath();
              ctx.moveTo(shape.x + shape.points[0] - 2, shape.y + shape.points[1] - 2);
              ctx.lineTo(shape.x + shape.points[2] + 2, shape.y + shape.points[3] - 2);
              ctx.lineTo(shape.x + shape.points[4] - 2, shape.y + shape.points[5] + 2);
              ctx.closePath();
              ctx.stroke();
            }
            break;
          case 'line':
            if (shape.points) {
              // Draw bounding box for line
              const minX = Math.min(...shape.points.filter((_, i) => i % 2 === 0)) + shape.x - 5;
              const minY = Math.min(...shape.points.filter((_, i) => i % 2 === 1)) + shape.y - 5;
              const maxX = Math.max(...shape.points.filter((_, i) => i % 2 === 0)) + shape.x + 5;
              const maxY = Math.max(...shape.points.filter((_, i) => i % 2 === 1)) + shape.y + 5;
              ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            }
            break;
          case 'text':
            const textWidth = ((shape as any).text?.length || 4) * ((shape as any).fontSize || 14) * 0.6;
            const textHeight = (shape as any).fontSize || 14;
            ctx.strokeRect(shape.x - 2, shape.y - textHeight - 2, textWidth + 4, textHeight + 4);
            break;
        }
        
        ctx.restore();
      }
    });
  }, [shapes, selectedShapeId, showGrid, width, height]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check from top-most shape (reverse order)
    const reversedShapes = [...shapes].reverse();
    let clickedShape: Shape | null = null;
    
    for (const shape of reversedShapes) {
      if (isPointInShape(mouseX, mouseY, shape)) {
        clickedShape = shape;
        break;
      }
    }

    if (clickedShape) {
      onSelectShape(clickedShape.id);
      setIsDragging(true);
      setDragStart({ x: mouseX, y: mouseY });
      setDragOffset({
        x: mouseX - clickedShape.x,
        y: mouseY - clickedShape.y
      });
    } else {
      onSelectShape(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedShapeId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;

    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    if (!selectedShape) return;

    // Update position
    const newX = selectedShape.x + deltaX;
    const newY = selectedShape.y + deltaY;

    // Snap to grid (10px grid)
    const snappedX = Math.round(newX / 10) * 10;
    const snappedY = Math.round(newY / 10) * 10;

    onUpdateShape(selectedShapeId, {
      x: snappedX,
      y: snappedY
    });

    setDragStart({ x: mouseX, y: mouseY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn(
        "cursor-default",
        isDragging && "cursor-move"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default ShapeCanvas;