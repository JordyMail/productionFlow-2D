import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';

export type MachineStatus = 'active' | 'idle' | 'warning' | 'down';

export interface MachineData {
  label: string;
  status: MachineStatus;
  throughput: number;
  capacity: number;
  lastMaintenance: string;
}

interface FlowState {
  nodes: Node<MachineData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  lastSaved: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNodeId: (id: string | null) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<MachineData>) => void;
  deleteNode: (nodeId: string) => void;
  updateThroughput: () => void;
  
  // Save & Load functions
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  exportToFile: () => void;
  importFromFile: (file: File) => Promise<void>;
  clearAll: () => void;
}

// Helper function to generate initial machine data
const createMachineData = (type: string): MachineData => {
  const baseLabel = type || 'New Machine';
  return {
    label: `${baseLabel} ${Math.floor(Math.random() * 1000)}`,
    status: 'idle',
    throughput: Math.floor(Math.random() * 80) + 20,
    capacity: 100,
    lastMaintenance: new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
  };
};

// Initial nodes for demo
const initialNodes: Node<MachineData>[] = [
  {
    id: 'node-1',
    type: 'machineNode',
    position: { x: 100, y: 100 },
    data: {
      label: 'CNC Milling A1',
      status: 'active',
      throughput: 85,
      capacity: 100,
      lastMaintenance: 'Mar 15, 2024',
    },
  },
  {
    id: 'node-2',
    type: 'machineNode',
    position: { x: 400, y: 200 },
    data: {
      label: 'Assembly Line B2',
      status: 'idle',
      throughput: 45,
      capacity: 100,
      lastMaintenance: 'Mar 10, 2024',
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#1e293b', strokeWidth: 2 },
  },
];

export const useStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  lastSaved: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    set({
      edges: addEdge({
        ...connection,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#1e293b', strokeWidth: 2 },
      }, get().edges),
    });
  },

  setSelectedNodeId: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  addNode: (type: string, position: { x: number; y: number }) => {
    const newNode: Node<MachineData> = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'machineNode',
      position,
      data: createMachineData(type),
    };

    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (nodeId: string, data: Partial<MachineData>) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
  },

  deleteNode: (nodeId: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: null,
    });
  },

  updateThroughput: () => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.data.status === 'active') {
          const variation = Math.floor(Math.random() * 10) - 3;
          const newThroughput = Math.max(0, Math.min(100, node.data.throughput + variation));
          return {
            ...node,
            data: { ...node.data, throughput: newThroughput },
          };
        }
        return node;
      }),
    });
  },

  // Save current flow to localStorage
  saveToLocalStorage: () => {
    try {
      const flowData = {
        nodes: get().nodes,
        edges: get().edges,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };
      
      localStorage.setItem('flow2d-save', JSON.stringify(flowData));
      set({ lastSaved: new Date().toLocaleString() });
      
      // Also save as backup
      localStorage.setItem('flow2d-backup', JSON.stringify(flowData));
      
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  },

  // Load flow from localStorage
  loadFromLocalStorage: () => {
    try {
      const savedData = localStorage.getItem('flow2d-save');
      if (!savedData) return false;
      
      const flowData = JSON.parse(savedData);
      
      // Validate data structure
      if (flowData.nodes && Array.isArray(flowData.nodes) && 
          flowData.edges && Array.isArray(flowData.edges)) {
        
        set({ 
          nodes: flowData.nodes, 
          edges: flowData.edges,
          lastSaved: new Date(flowData.timestamp).toLocaleString()
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return false;
    }
  },

  // Export flow to JSON file
  exportToFile: () => {
    try {
      const flowData = {
        nodes: get().nodes,
        edges: get().edges,
        timestamp: new Date().toISOString(),
        version: '1.0',
        appName: 'Flow2D Machine Schema',
      };
      
      const dataStr = JSON.stringify(flowData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `flow2d-export-${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
    } catch (error) {
      console.error('Failed to export file:', error);
    }
  },

  // Import flow from JSON file
  importFromFile: (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const flowData = JSON.parse(content);
          
          // Validate data structure
          if (flowData.nodes && Array.isArray(flowData.nodes) && 
              flowData.edges && Array.isArray(flowData.edges)) {
            
            set({ 
              nodes: flowData.nodes, 
              edges: flowData.edges,
              lastSaved: new Date(flowData.timestamp).toLocaleString()
            });
            
            resolve();
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  // Clear all nodes and edges
  clearAll: () => {
    if (window.confirm('Are you sure you want to clear all machines? This action cannot be undone.')) {
      set({ nodes: [], edges: [], selectedNodeId: null });
    }
  },
}));

// Auto-save function (optional)
export const setupAutoSave = (intervalMs: number = 30000) => {
  setInterval(() => {
    const { saveToLocalStorage, nodes } = useStore.getState();
    if (nodes.length > 0) {
      saveToLocalStorage();
      console.log('Auto-saved at', new Date().toLocaleTimeString());
    }
  }, intervalMs);
};