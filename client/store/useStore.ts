import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';

export interface MachineData {
  label: string;
  status: 'active' | 'idle' | 'warning' | 'down';
  throughput: number;
  lastMaintenance: string;
  capacity?: number;
}

export type MachineNode = Node<MachineData>;

interface FlowState {
  nodes: MachineNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: MachineNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<MachineData>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  updateThroughput: () => void;
}

const initialNodes: MachineNode[] = [
  {
    id: 'm-1',
    type: 'machineNode',
    data: { 
      label: 'CNC Milling', 
      status: 'active', 
      throughput: 45, 
      lastMaintenance: '2024-05-20',
      capacity: 100 
    },
    position: { x: 100, y: 100 },
  },
  {
    id: 'm-2',
    type: 'machineNode',
    data: { 
      label: 'Assembly Line', 
      status: 'idle', 
      throughput: 0, 
      lastMaintenance: '2024-05-22',
      capacity: 80 
    },
    position: { x: 400, y: 100 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'm-1', target: 'm-2', animated: false, style: { stroke: '#001F3F' } },
];

export const useStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as MachineNode[],
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    const sourceNode = get().nodes.find((n) => n.id === connection.source);
    const isDown = sourceNode?.data.status === 'down';
    
    const newEdge: Edge = {
      ...connection,
      id: `e-${connection.source}-${connection.target}`,
      animated: isDown,
      style: { stroke: isDown ? '#ef4444' : '#001F3F' },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isDown ? '#ef4444' : '#001F3F',
      },
    };
    
    set({
      edges: addEdge(newEdge, get().edges),
    });
  },

  setNodes: (nodes: MachineNode[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),

  addNode: (type: string, position: { x: number; y: number }) => {
    const id = `m-${Date.now()}`;
    const newNode: MachineNode = {
      id,
      type: 'machineNode',
      position,
      data: {
        label: `New ${type}`,
        status: 'idle',
        throughput: 0,
        lastMaintenance: new Date().toISOString().split('T')[0],
        capacity: 100,
      },
    };
    set({
      nodes: [...get().nodes, newNode],
    });
  },

  updateNodeData: (nodeId: string, data: Partial<MachineData>) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const updatedData = { ...node.data, ...data };
          return { ...node, data: updatedData };
        }
        return node;
      }),
    });

    // Update edges animation if status changed
    if (data.status) {
      set({
        edges: get().edges.map((edge) => {
          if (edge.source === nodeId) {
            const isDown = data.status === 'down';
            return {
              ...edge,
              animated: isDown,
              style: { ...edge.style, stroke: isDown ? '#ef4444' : '#001F3F' },
              markerEnd: typeof edge.markerEnd === 'object' ? {
                ...edge.markerEnd,
                color: isDown ? '#ef4444' : '#001F3F',
              } : edge.markerEnd,
            };
          }
          return edge;
        }),
      });
    }
  },

  deleteNode: (nodeId: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  setSelectedNodeId: (nodeId: string | null) => set({ selectedNodeId: nodeId }),

  updateThroughput: () => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.data.status === 'active') {
          const variation = Math.floor(Math.random() * 11) - 5; // -5 to +5
          const newThroughput = Math.max(0, (node.data.throughput || 0) + variation);
          return {
            ...node,
            data: { ...node.data, throughput: newThroughput },
          };
        }
        return node;
      }),
    });
  },
}));
