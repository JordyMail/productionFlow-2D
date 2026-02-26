// shared/types.ts

// Shape primitives
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'text';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number; // for circle
  points?: number[]; // for triangle/line
  color: string;
  borderColor?: string;
  borderWidth?: number;
  rotation?: number;
  opacity?: number;
  zIndex: number;
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
  points: number[]; // [x1, y1, x2, y2, ...]
  strokeWidth: number;
  strokeColor: string;
}

export interface TextShape extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export type Shape = RectangleShape | CircleShape | TriangleShape | LineShape | TextShape;

// Machine Template
export interface MachineTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string; // base64 preview
  shapes: Shape[];
  width: number; // canvas width
  height: number; // canvas height
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