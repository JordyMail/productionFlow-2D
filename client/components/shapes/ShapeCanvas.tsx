// client/components/shapes/ShapeCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Shape, LineShape, RectangleShape, CircleShape, TriangleShape, TextShape } from '@/shared/types';
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
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStartAngle, setRotateStartAngle] = useState(0);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);

  // Type guards
  const isLine = (shape: Shape): shape is LineShape => shape.type === 'line';
  const isRectangle = (shape: Shape): shape is RectangleShape => shape.type === 'rectangle';
  const isCircle = (shape: Shape): shape is CircleShape => shape.type === 'circle';
  const isTriangle = (shape: Shape): shape is TriangleShape => shape.type === 'triangle';
  const isText = (shape: Shape): shape is TextShape => shape.type === 'text';

  // Hit detection untuk resize handles pada line
  const getLineHandles = (shape: LineShape) => {
    if (!shape.points || shape.points.length < 4) {
      return [];
    }

    const handles = [];
    // Handle untuk setiap point pada line
    for (let i = 0; i < shape.points.length; i += 2) {
      handles.push({
        id: `point-${i}`,
        x: shape.x + shape.points[i],
        y: shape.y + shape.points[i + 1],
        type: 'point' as const
      });
    }

    // Handle untuk rotate (di tengah line)
    if (shape.points.length >= 4) {
      const centerX = shape.x + (shape.points[0] + shape.points[shape.points.length - 2]) / 2;
      const centerY = shape.y + (shape.points[1] + shape.points[shape.points.length - 1]) / 2;
      handles.push({
        id: 'rotate',
        x: centerX,
        y: centerY - 30, // Di atas line
        type: 'rotate' as const
      });
    }

    return handles;
  };

  // Check if mouse is over any handle
  const getHandleAtPoint = (x: number, y: number, shape: Shape) => {
    if (shape.id !== selectedShapeId || !isLine(shape)) return null;

    const handles = getLineHandles(shape);
    for (const handle of handles) {
      const distance = Math.sqrt(
        Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2)
      );
      if (distance < 10) {
        return handle;
      }
    }
    return null;
  };

  // Helper function untuk hit detection
  const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
    switch (shape.type) {
      case 'rectangle': {
        const rect = shape as RectangleShape;
        return x >= rect.x && 
               x <= rect.x + (rect.width || 50) &&
               y >= rect.y && 
               y <= rect.y + (rect.height || 50);
      }
      
      case 'circle': {
        const circle = shape as CircleShape;
        const centerX = circle.x + (circle.radius || 25);
        const centerY = circle.y + (circle.radius || 25);
        const dx = x - centerX;
        const dy = y - centerY;
        return Math.sqrt(dx * dx + dy * dy) <= (circle.radius || 25);
      }
      
      case 'triangle': {
        const triangle = shape as TriangleShape;
        if (triangle.points && triangle.points.length >= 6) {
          // Point-in-triangle test using barycentric coordinates
          const x1 = triangle.x + triangle.points[0];
          const y1 = triangle.y + triangle.points[1];
          const x2 = triangle.x + triangle.points[2];
          const y2 = triangle.y + triangle.points[3];
          const x3 = triangle.x + triangle.points[4];
          const y3 = triangle.y + triangle.points[5];
          
          const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
          const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
          const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
          const c = 1 - a - b;
          
          return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
        }
        return false;
      }
      
      case 'line': {
        const line = shape as LineShape;
        if (line.points && line.points.length >= 4) {
          // Check distance to line segments
          for (let i = 0; i < line.points.length - 2; i += 2) {
            const x1 = line.x + line.points[i];
            const y1 = line.y + line.points[i + 1];
            const x2 = line.x + line.points[i + 2];
            const y2 = line.y + line.points[i + 3];
            
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
      }
      
      case 'text': {
        const text = shape as TextShape;
        // Approximate text bounding box
        const textWidth = (text.text?.length || 4) * (text.fontSize || 14) * 0.6;
        const textHeight = text.fontSize || 14;
        return x >= text.x && 
               x <= text.x + textWidth &&
               y >= text.y - textHeight && 
               y <= text.y;
      }
      
      default:
        return false;
    }
  };

  // Rotate line function
  const rotateLine = (shape: LineShape, angle: number): LineShape => {
    if (!shape.points) return shape;

    // Find center of line
    const centerX = (shape.points[0] + shape.points[shape.points.length - 2]) / 2;
    const centerY = (shape.points[1] + shape.points[shape.points.length - 1]) / 2;

    // Rotate each point around center
    const newPoints = [...shape.points];
    for (let i = 0; i < shape.points.length; i += 2) {
      const dx = shape.points[i] - centerX;
      const dy = shape.points[i + 1] - centerY;
      
      const rotatedX = centerX + dx * Math.cos(angle) - dy * Math.sin(angle);
      const rotatedY = centerY + dx * Math.sin(angle) + dy * Math.cos(angle);
      
      newPoints[i] = Math.round(rotatedX);
      newPoints[i + 1] = Math.round(rotatedY);
    }

    return {
      ...shape,
      points: newPoints
    };
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
      
      // Apply rotation if any
      if (shape.rotation && shape.rotation !== 0) {
        const centerX = shape.x + (getShapeWidth(shape) / 2);
        const centerY = shape.y + (getShapeHeight(shape) / 2);
        ctx.translate(centerX, centerY);
        ctx.rotate((shape.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }
      
      // Draw based on shape type
      switch (shape.type) {
        case 'rectangle': {
          const rect = shape as RectangleShape;
          ctx.fillStyle = rect.fillColor;
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
          
          // Draw stroke
          ctx.strokeStyle = rect.strokeColor;
          ctx.lineWidth = rect.strokeWidth;
          ctx.setLineDash(getLineDash(rect.strokeStyle));
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
          
          // Reset line dash
          ctx.setLineDash([]);
          break;
        }
          
        case 'circle': {
          const circle = shape as CircleShape;
          ctx.beginPath();
          ctx.arc(circle.x + circle.radius, circle.y + circle.radius, circle.radius, 0, Math.PI * 2);
          ctx.fillStyle = circle.fillColor;
          ctx.fill();
          
          ctx.strokeStyle = circle.strokeColor;
          ctx.lineWidth = circle.strokeWidth;
          ctx.setLineDash(getLineDash(circle.strokeStyle));
          ctx.stroke();
          
          // Reset line dash
          ctx.setLineDash([]);
          break;
        }
          
        case 'triangle': {
          const triangle = shape as TriangleShape;
          if (triangle.points && triangle.points.length >= 6) {
            ctx.beginPath();
            ctx.moveTo(triangle.x + triangle.points[0], triangle.y + triangle.points[1]);
            ctx.lineTo(triangle.x + triangle.points[2], triangle.y + triangle.points[3]);
            ctx.lineTo(triangle.x + triangle.points[4], triangle.y + triangle.points[5]);
            ctx.closePath();
            ctx.fillStyle = triangle.fillColor;
            ctx.fill();
            
            ctx.strokeStyle = triangle.strokeColor;
            ctx.lineWidth = triangle.strokeWidth;
            ctx.setLineDash(getLineDash(triangle.strokeStyle));
            ctx.stroke();
            
            // Reset line dash
            ctx.setLineDash([]);
          }
          break;
        }
          
        case 'line': {
          const line = shape as LineShape;
          if (line.points && line.points.length >= 4) {
            ctx.beginPath();
            ctx.moveTo(line.x + line.points[0], line.y + line.points[1]);
            for (let i = 2; i < line.points.length; i += 2) {
              ctx.lineTo(line.x + line.points[i], line.y + line.points[i + 1]);
            }
            ctx.strokeStyle = line.strokeColor;
            ctx.lineWidth = line.strokeWidth;
            ctx.setLineDash(getLineDash(line.strokeStyle));
            ctx.stroke();
            
            // Reset line dash
            ctx.setLineDash([]);
          }
          break;
        }
          
        case 'text': {
          const text = shape as TextShape;
          ctx.font = `${text.fontStyle || 'normal'} ${text.fontWeight || 'normal'} ${text.fontSize}px ${text.fontFamily}`;
          ctx.fillStyle = text.fillColor;
          ctx.textAlign = text.textAlign || 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(text.text || 'Text', text.x, text.y);
          
          // Draw stroke for text if needed
          if (text.strokeWidth > 0) {
            ctx.strokeStyle = text.strokeColor;
            ctx.lineWidth = text.strokeWidth;
            ctx.setLineDash(getLineDash(text.strokeStyle));
            ctx.strokeText(text.text || 'Text', text.x, text.y);
            
            // Reset line dash
            ctx.setLineDash([]);
          }
          break;
        }
      }
      
      ctx.restore();

      // Draw selection outline and handles if selected
      if (shape.id === selectedShapeId) {
        drawSelectionHandles(ctx, shape);
      }
    });
  }, [shapes, selectedShapeId, showGrid, width, height, hoveredHandle]);

  // Helper function untuk mendapatkan line dash array
  const getLineDash = (style: string): number[] => {
    switch (style) {
      case 'dashed':
        return [8, 4];
      case 'dotted':
        return [2, 4];
      default:
        return [];
    }
  };

  // Helper function untuk mendapatkan lebar shape
  const getShapeWidth = (shape: Shape): number => {
    switch (shape.type) {
      case 'rectangle':
        return (shape as RectangleShape).width;
      case 'circle':
        return (shape as CircleShape).radius * 2;
      case 'triangle':
        return 100; // Approximate
      case 'line':
        return 100; // Approximate
      case 'text':
        return (shape as TextShape).text.length * (shape as TextShape).fontSize * 0.6;
      default:
        return 50;
    }
  };

  // Helper function untuk mendapatkan tinggi shape
  const getShapeHeight = (shape: Shape): number => {
    switch (shape.type) {
      case 'rectangle':
        return (shape as RectangleShape).height;
      case 'circle':
        return (shape as CircleShape).radius * 2;
      case 'triangle':
        return 100; // Approximate
      case 'line':
        return 100; // Approximate
      case 'text':
        return (shape as TextShape).fontSize;
      default:
        return 50;
    }
  };

  // Draw selection handles
  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    switch (shape.type) {
      case 'rectangle': {
        const rect = shape as RectangleShape;
        ctx.strokeRect(rect.x - 2, rect.y - 2, rect.width + 4, rect.height + 4);
        
        // Draw resize handles at corners
        ctx.setLineDash([]);
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        
        const corners = [
          { x: rect.x - 4, y: rect.y - 4 },
          { x: rect.x + rect.width + 4, y: rect.y - 4 },
          { x: rect.x - 4, y: rect.y + rect.height + 4 },
          { x: rect.x + rect.width + 4, y: rect.y + rect.height + 4 }
        ];
        
        corners.forEach(corner => {
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        break;
      }
        
      case 'circle': {
        const circle = shape as CircleShape;
        ctx.beginPath();
        ctx.arc(circle.x + circle.radius, circle.y + circle.radius, circle.radius + 2, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
        
      case 'triangle': {
        const triangle = shape as TriangleShape;
        if (triangle.points) {
          ctx.beginPath();
          ctx.moveTo(triangle.x + triangle.points[0] - 2, triangle.y + triangle.points[1] - 2);
          ctx.lineTo(triangle.x + triangle.points[2] + 2, triangle.y + triangle.points[3] - 2);
          ctx.lineTo(triangle.x + triangle.points[4] - 2, triangle.y + triangle.points[5] + 2);
          ctx.closePath();
          ctx.stroke();
        }
        break;
      }
        
      case 'line': {
        const line = shape as LineShape;
        if (line.points) {
          // Draw bounding box for line
          const minX = Math.min(...line.points.filter((_, i) => i % 2 === 0)) + line.x - 8;
          const minY = Math.min(...line.points.filter((_, i) => i % 2 === 1)) + line.y - 8;
          const maxX = Math.max(...line.points.filter((_, i) => i % 2 === 0)) + line.x + 8;
          const maxY = Math.max(...line.points.filter((_, i) => i % 2 === 1)) + line.y + 8;
          ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
          
          // Draw point handles
          ctx.setLineDash([]);
          for (let i = 0; i < line.points.length; i += 2) {
            const handleX = line.x + line.points[i];
            const handleY = line.y + line.points[i + 1];
            
            // Highlight hovered handle
            if (hoveredHandle === `point-${i}`) {
              ctx.fillStyle = '#f59e0b';
            } else {
              ctx.fillStyle = '#3b82f6';
            }
            
            ctx.beginPath();
            ctx.arc(handleX, handleY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          
          // Draw rotate handle
          const centerX = (line.points[0] + line.points[line.points.length - 2]) / 2 + line.x;
          const centerY = (line.points[1] + line.points[line.points.length - 1]) / 2 + line.y - 30;
          
          // Draw line to rotate handle
          ctx.beginPath();
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.moveTo(
            (line.points[0] + line.points[line.points.length - 2]) / 2 + line.x,
            (line.points[1] + line.points[line.points.length - 1]) / 2 + line.y
          );
          ctx.lineTo(centerX, centerY);
          ctx.stroke();
          
          // Draw rotate handle
          ctx.setLineDash([]);
          if (hoveredHandle === 'rotate') {
            ctx.fillStyle = '#f59e0b';
          } else {
            ctx.fillStyle = '#8b5cf6';
          }
          ctx.beginPath();
          ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw rotate icon
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.fillText('↻', centerX - 4, centerY + 4);
        }
        break;
      }
        
      case 'text': {
        const text = shape as TextShape;
        const textWidth = (text.text?.length || 4) * (text.fontSize || 14) * 0.6;
        const textHeight = text.fontSize || 14;
        ctx.strokeRect(text.x - 2, text.y - textHeight - 2, textWidth + 4, textHeight + 4);
        break;
      }
    }
    
    ctx.restore();
  };

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check if clicking on selected shape's handles
    if (selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (selectedShape && isLine(selectedShape)) {
        const handle = getHandleAtPoint(mouseX, mouseY, selectedShape);
        
        if (handle) {
          if (handle.type === 'rotate') {
            setIsRotating(true);
            setResizeHandle('rotate');
            
            // Calculate initial angle
            if (selectedShape.points) {
              const centerX = (selectedShape.points[0] + selectedShape.points[selectedShape.points.length - 2]) / 2 + selectedShape.x;
              const centerY = (selectedShape.points[1] + selectedShape.points[selectedShape.points.length - 1]) / 2 + selectedShape.y;
              const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
              setRotateStartAngle(startAngle);
            }
            return;
          } else if (handle.type === 'point') {
            setIsResizing(true);
            setResizeHandle(handle.id);
            setDragStart({ x: mouseX, y: mouseY });
            return;
          }
        }
      }
    }

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
  const canvas = canvasRef.current;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  // Update hovered handle untuk cursor change
  if (selectedShapeId && !isDragging && !isResizing && !isRotating) {
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    if (selectedShape) {
      const handle = getHandleAtPoint(mouseX, mouseY, selectedShape);
      setHoveredHandle(handle?.id || null);
      
      // Change cursor based on handle type
      if (canvas) {
        if (handle?.type === 'rotate') {
          canvas.style.cursor = 'grab';
        } else if (handle?.type === 'point') {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'default';
        }
      }
    }
  } else {
    setHoveredHandle(null);
  }

  // Handle rotating
  if (isRotating && selectedShapeId && resizeHandle === 'rotate') {
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    if (selectedShape && isLine(selectedShape) && selectedShape.points) {
      const centerX = (selectedShape.points[0] + selectedShape.points[selectedShape.points.length - 2]) / 2 + selectedShape.x;
      const centerY = (selectedShape.points[1] + selectedShape.points[selectedShape.points.length - 1]) / 2 + selectedShape.y;
      
      const currentAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
      const deltaAngle = currentAngle - rotateStartAngle;
      
      // Rotate line
      const rotatedLine = rotateLine(selectedShape, deltaAngle);
      onUpdateShape(selectedShapeId, { points: rotatedLine.points });
      
      setRotateStartAngle(currentAngle);
    }
    return;
  }

  // Handle resizing (moving line points)
  if (isResizing && selectedShapeId && resizeHandle) {
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    if (selectedShape && isLine(selectedShape) && selectedShape.points) {
      const pointIndex = parseInt(resizeHandle.split('-')[1]);
      
      if (!isNaN(pointIndex)) {
        const newPoints = [...selectedShape.points];
        
        // Hitung posisi baru relatif terhadap shape origin
        const relativeX = mouseX - selectedShape.x;
        const relativeY = mouseY - selectedShape.y;
        
        // Smooth movement - langsung update tanpa snap dulu
        newPoints[pointIndex] = relativeX;
        newPoints[pointIndex + 1] = relativeY;
        
        onUpdateShape(selectedShapeId, { points: newPoints });
      }
    }
    return;
  }

  // Handle dragging seluruh shape
  if (!isDragging || !selectedShapeId) return;

  const deltaX = mouseX - dragStart.x;
  const deltaY = mouseY - dragStart.y;

  const selectedShape = shapes.find(s => s.id === selectedShapeId);
  if (!selectedShape) return;

  // Update posisi - smooth tanpa snap dulu
  const newX = selectedShape.x + deltaX;
  const newY = selectedShape.y + deltaY;

  onUpdateShape(selectedShapeId, {
    x: newX,
    y: newY
  });

  setDragStart({ x: mouseX, y: mouseY });
};



const snapToGrid = (value: number, gridSize: number = 10): number => {
  return Math.round(value / gridSize) * gridSize;
};

// Update handleMouseUp
const handleMouseUp = () => {
  if (selectedShapeId && (isDragging || isResizing)) {
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    
    if (selectedShape) {
      if (isDragging) {
        // Snap posisi ke grid setelah drag selesai
        const snappedX = snapToGrid(selectedShape.x);
        const snappedY = snapToGrid(selectedShape.y);
        
        if (snappedX !== selectedShape.x || snappedY !== selectedShape.y) {
          onUpdateShape(selectedShapeId, {
            x: snappedX,
            y: snappedY
          });
        }
      } else if (isResizing && isLine(selectedShape) && selectedShape.points) {
        // Snap points ke grid setelah resize selesai
        const pointIndex = parseInt(resizeHandle?.split('-')[1] || '0');
        if (!isNaN(pointIndex)) {
          const newPoints = [...selectedShape.points];
          newPoints[pointIndex] = snapToGrid(newPoints[pointIndex]);
          newPoints[pointIndex + 1] = snapToGrid(newPoints[pointIndex + 1]);
          onUpdateShape(selectedShapeId, { points: newPoints });
        }
      }
    }
  }
  
  setIsDragging(false);
  setIsResizing(false);
  setIsRotating(false);
  setResizeHandle(null);
};

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setResizeHandle(null);
    setHoveredHandle(null);
  };

  

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn(
        "cursor-default",
        isDragging && "cursor-move",
        isRotating && "cursor-grabbing",
        hoveredHandle === 'rotate' && "cursor-grab",
        hoveredHandle?.startsWith('point-') && "cursor-move"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default ShapeCanvas;