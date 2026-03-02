// shared/types.ts

// Shape primitives
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'text';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type FrameType = 'rectangle' | 'rectangle2x1' | 'rectangle1x2' | 'circle' | 'triangle';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  rotation?: number;
  opacity: number;
  zIndex: number;
  
  // Visual properties
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: LineStyle;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
  borderRadius?: number;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;
}

export interface TriangleShape extends BaseShape {
  type: 'triangle';
  points: [number, number, number, number, number, number]; // 6 coordinates
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: number[]; // minimal 4 angka [x1, y1, x2, y2, ...]
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: 'normal' | 'bold' | 'lighter';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
}

export type Shape = RectangleShape | CircleShape | TriangleShape | LineShape | TextShape;

// Machine Template
export interface MachineTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  shapes: Shape[];
  width: number;
  height: number;
  frameType: FrameType;
  frameColor?: string; 
  frameStrokeColor?: string; 
  frameStrokeWidth?: number;
  frameRotation?: number;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

// View Mode
export type ViewMode = 'default' | 'shapes';

// Global templates store
export interface TemplatesStore {
  templates: MachineTemplate[];
  selectedTemplateId: string | null;
}

// Editor state
export interface EditorState {
  currentTemplate: MachineTemplate | null;
  selectedShapeId: string | null;
  history: EditorHistoryItem[];
  historyIndex: number;
}

export interface EditorHistoryItem {
  shapes: Shape[];
  timestamp: number;
}

// Helper function untuk create default shapes
export const createDefaultShape = (type: ShapeType, id: string): Shape => {
  const baseProps = {
    id,
    type,
    x: 100,
    y: 100,
    opacity: 1,
    zIndex: 0,
    fillColor: '#3b82f6',
    strokeColor: '#000000',
    strokeWidth: 1,
    strokeStyle: 'solid' as LineStyle,
    rotation: 0
  };

  switch (type) {
    case 'rectangle':
      return {
        ...baseProps,
        type: 'rectangle',
        width: 100,
        height: 80,
        borderRadius: 0
      } as RectangleShape;
    
    case 'circle':
      return {
        ...baseProps,
        type: 'circle',
        radius: 40
      } as CircleShape;
    
    case 'triangle':
      return {
        ...baseProps,
        type: 'triangle',
        points: [100, 100, 150, 100, 125, 50] // example triangle
      } as TriangleShape;
    
    case 'line':
      return {
        ...baseProps,
        type: 'line',
        points: [100, 100, 200, 100], // horizontal line
        strokeWidth: 2,
        fillColor: 'transparent' // line doesn't use fill
      } as LineShape;
    
    case 'text':
      return {
        ...baseProps,
        type: 'text',
        text: 'Text',
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left'
      } as TextShape;
  }
};