// shared/types.ts

// Shape primitives
export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'text' | 'standardWait' | 'qualityConfirm' | 'safetyNote';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type FrameType = 'rectangle' | 'rectangle2x1' | 'rectangle1x2' | 'circle' | 'triangle';
export type HandlePosition = 'top' | 'bottom' | 'left' | 'right';
export type HandleType = 'source' | 'target';
export type EdgeRoutingType = 'straight' | 'smoothstep' | 'step' | 'bezier';

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

// NEW: Standard Wait Shape
export interface StandardWaitShape extends BaseShape {
  type: 'standardWait';
  radius: number;           // Radius lingkaran
  outlineColor: string;     // Warna outline (default: red)
  outlineWidth: number;     // Ketebalan outline
  stripeColor: string;      // Warna garis horizontal
  stripeWidth: number;      // Ketebalan garis horizontal
  stripeSpacing: number;    // Jarak antar garis
  backgroundColor: string;  // Warna background
}

// NEW: Quality Confirm Shape
export interface QualityConfirmShape extends BaseShape {
  type: 'qualityConfirm';
  size: number;             // Ukuran diamond (lebar/tinggi)
  fillColor: string;        // Warna kuning (default: #FFD700)
  outlineColor: string;     // Warna outline (default: black)
  outlineWidth: number;     // Ketebalan outline
}

// NEW: Safety Note Shape
export interface SafetyNoteShape extends BaseShape {
  type: 'safetyNote';
  size: number;             // Ukuran cross
  thickness: number;        // Ketebalan garis cross
  color: string;            // Warna hijau (default: #16A34A)
}

export type Shape = RectangleShape | CircleShape | TriangleShape | LineShape | TextShape | StandardWaitShape | QualityConfirmShape | SafetyNoteShape;

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

    // NEW CASES
    case 'standardWait':
      return {
        ...baseProps,
        type: 'standardWait',
        radius: 40,
        outlineColor: '#DC2626',
        outlineWidth: 3,
        stripeColor: '#DC2626',
        stripeWidth: 2,
        stripeSpacing: 6,
        backgroundColor: '#FFFFFF',
        fillColor: '#FFFFFF',
        strokeColor: '#DC2626',
        strokeWidth: 3,
      } as StandardWaitShape;

    case 'qualityConfirm':
      return {
        ...baseProps,
        type: 'qualityConfirm',
        size: 60,
        fillColor: '#FFD700',
        outlineColor: '#000000',
        outlineWidth: 1.5,
        strokeColor: '#000000',
        strokeWidth: 1.5,
      } as QualityConfirmShape;

    case 'safetyNote':
      return {
        ...baseProps,
        type: 'safetyNote',
        size: 60,
        thickness: 12,
        color: '#16A34A',
        fillColor: '#16A34A',
        strokeColor: '#16A34A',
        strokeWidth: 0,
      } as SafetyNoteShape;
  }
};

// Tambahkan tipe untuk Operator
export interface OperatorData {
  id: number;           // ID operator (bisa sama untuk beberapa operator)
  process: number;      // Process order (harus unik per ID)
  label?: string;       // Label optional
  position?: { x: number; y: number };
  handles?: HandleConfig;
  color?: string;
  // ========== NEW: Chair Design Properties ==========
  chairDesign?: {
    enabled: boolean;          // Default true untuk mode shapes
    chairColor?: string;       // Warna kursi, default ikut color operator
    showIdInChair?: boolean;   // Tampilkan ID di tengah kursi
    showProcessInChair?: boolean; // Tampilkan Process di tengah kursi
    chairWidth?: number;       // Lebar kursi
    chairHeight?: number;      // Tinggi kursi
    seatDepth?: number;        // Kedalaman dudukan
    backrestHeight?: number;   // Tinggi sandaran
  };
}

// Update MachineData jika perlu
export interface MachineData {
  label: string;
  status: 'active' | 'idle' | 'warning' | 'down';
  throughput: number;
  capacity: number;
  lastMaintenance: string;
  template?: MachineTemplate;
  frameRotation?: number;
  handles?: HandleConfig;
}

// Union type untuk semua node data
export type NodeData = MachineData | OperatorData;

// Tambahkan konstanta untuk tipe node
export const NODE_TYPES = {
  MACHINE: 'machineNode',
  OPERATOR: 'operatorNode',
  SHAPE_MACHINE: 'shapeMachineNode',
  SHAPE_OPERATOR: 'shapeOperatorNode', // NEW: untuk operator di mode shapes
} as const;

export const DEFAULT_HANDLE_CONFIG: HandleConfig = {
  top: true,
  bottom: true,
  left: true,
  right: true
};

export const DEFAULT_CHAIR_CONFIG = {
  enabled: false,
  chairWidth: 80,
  chairHeight: 100,
  seatDepth: 45,
  backrestHeight: 55,
  showIdInChair: true,
  showProcessInChair: true,
  chairColor: '#afbfe4',
};

export interface HandleConfig {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export interface EdgeData {
  operatorId?: number;
  sourceProcess?: number;
  targetProcess?: number;
  routingType?: EdgeRoutingType; // NEW: tipe routing edge
  avoidNodes?: string[]; // NEW: daftar node ID yang dihindari
}

// Konstanta untuk edge types
export const EDGE_TYPES = {
  CUSTOM: 'custom',
  STRAIGHT: 'straight-edge',
  OPERATOR_AVOID: 'operator-avoid-edge',
} as const;


export interface ExportedFlowData {
  version: string;
  exportedAt: string;
  appName: string;
  nodes: ExportedNodeData[];
  edges: ExportedEdgeData[];
  viewMode: ViewMode;
  metadata: FlowMetadata;
}

export interface FlowMetadata {
  totalMachines: number;
  totalOperators: number;
  activeMachines: number;
  warningMachines: number;
  downMachines: number;
  totalConnections: number;
  operatorConnections: number;
  machineConnections: number;
}

export interface ExportedNodeData {
  id: string;
  type: 'machine' | 'operator';
  label: string;
  position: {
    x: number;
    y: number;
  };
  // Machine-specific
  status?: 'active' | 'idle' | 'warning' | 'down';
  throughput?: number;
  capacity?: number;
  templateId?: string;
  frameRotation?: number;
  // Operator-specific
  operatorId?: number;
  process?: number;
  color?: string;
  chairDesign?: any;
  // Handle config
  handles?: HandleConfig;
  // Dimension (untuk rendering)
  width?: number;
  height?: number;
}

export interface ExportedEdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  type: 'machine' | 'operator' | 'mixed';
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    animated?: boolean;
  };
  label?: string;
  operatorId?: number;
}

/**
 * Props untuk komponen embeddable
 */
export interface EmbeddableFlowProps {
  data: ExportedFlowData;
  width?: number | string;
  height?: number | string;
  readOnly?: boolean;
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onNodeClick?: (nodeId: string, nodeData: ExportedNodeData) => void;
  onEdgeClick?: (edgeId: string, edgeData: ExportedEdgeData) => void;
}

/**
 * Konfigurasi untuk export
 */
export interface ExportConfig {
  includeTemplates: boolean;
  includeMetadata: boolean;
  prettyPrint: boolean;
  embedMode: boolean; // Jika true, output dalam format embeddable component
  fileName?: string;
}