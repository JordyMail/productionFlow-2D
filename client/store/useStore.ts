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

// History item type
interface HistoryItem {
  nodes: Node<MachineData>[];
  edges: Edge[];
  timestamp: number;
  description: string;
}

interface FlowState {
  nodes: Node<MachineData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  lastSaved: string | null;
  
  // History states
  history: HistoryItem[];
  historyIndex: number;
  maxHistorySize: number;
  
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
  
  // Undo/Redo functions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushToHistory: (description: string) => void;
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


export const useStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  lastSaved: null,
  
  // History
  history: [{
    nodes: [],
    edges: [],
    timestamp: Date.now(),
    description: 'Initial state'
  }],
  historyIndex: 0,
  maxHistorySize: 50,

  // Helper to push current state to history
  pushToHistory: (description: string) => {
    const { nodes, edges, history, historyIndex, maxHistorySize } = get();
    
    // Remove any future history if we're not at the latest
    const newHistory = history.slice(0, historyIndex + 1);
    
    // Add new state
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
      description
    });
    
    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    }
    
    set({ 
      history: newHistory, 
      historyIndex: newHistory.length - 1 
    });
  },

  onNodesChange: (changes: NodeChange[]) => {
    const { nodes, pushToHistory } = get();
    const newNodes = applyNodeChanges(changes, nodes);
    
    // Check if there's a meaningful change (position, etc)
    const hasPositionChange = changes.some(change => change.type === 'position' || change.type === 'dimensions');
    
    set({ nodes: newNodes });
    
    // Push to history for significant changes (debounce in the component)
    if (hasPositionChange) {
      // We'll let the component handle debounced history pushes
    }
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const { edges, pushToHistory } = get();
    const newEdges = applyEdgeChanges(changes, edges);
    set({ edges: newEdges });
    pushToHistory('Edge modified');
  },

  onConnect: (connection: Connection) => {
    const { edges, pushToHistory } = get();
    const newEdges = addEdge({
      ...connection,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#1e293b', strokeWidth: 2 },
    }, edges);
    set({ edges: newEdges });
    pushToHistory('Connection created');
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
    get().pushToHistory(`Added ${type} machine`);
  },

  updateNodeData: (nodeId: string, data: Partial<MachineData>) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    });
    get().pushToHistory('Updated machine properties');
  },

  deleteNode: (nodeId: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: null,
    });
    get().pushToHistory('Deleted machine');
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
    // Don't push throughput updates to history (too noisy)
  },

  // Undo function
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      set({ 
        nodes: previousState.nodes, 
        edges: previousState.edges,
        historyIndex: newIndex
      });
    }
  },

  // Redo function
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      set({ 
        nodes: nextState.nodes, 
        edges: nextState.edges,
        historyIndex: newIndex
      });
    }
  },

  canUndo: () => {
    return get().historyIndex > 0;
  },

  canRedo: () => {
    return get().historyIndex < get().history.length - 1;
  },

  saveToLocalStorage: () => {
    try {
      const flowData = {
        nodes: get().nodes,
        edges: get().edges,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };
      
      localStorage.setItem('flow2d-save', JSON.stringify(flowData));
      localStorage.setItem('flow2d-backup', JSON.stringify(flowData));
      set({ lastSaved: new Date().toLocaleString() });
      
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  },

  loadFromLocalStorage: () => {
    try {
      const savedData = localStorage.getItem('flow2d-save');
      if (!savedData) return false;
      
      const flowData = JSON.parse(savedData);
      
      if (flowData.nodes && Array.isArray(flowData.nodes) && 
          flowData.edges && Array.isArray(flowData.edges)) {
        
        set({ 
          nodes: flowData.nodes, 
          edges: flowData.edges,
          lastSaved: new Date(flowData.timestamp).toLocaleString()
        });
        
        // Reset history with loaded state
        get().pushToHistory('Loaded from storage');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return false;
    }
  },

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

  importFromFile: (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const flowData = JSON.parse(content);
          
          if (flowData.nodes && Array.isArray(flowData.nodes) && 
              flowData.edges && Array.isArray(flowData.edges)) {
            
            set({ 
              nodes: flowData.nodes, 
              edges: flowData.edges,
              lastSaved: new Date(flowData.timestamp).toLocaleString()
            });
            
            // Reset history with imported state
            get().pushToHistory('Imported from file');
            
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

  clearAll: () => {
    if (window.confirm('Are you sure you want to clear all machines? This action cannot be undone.')) {
      set({ nodes: [], edges: [], selectedNodeId: null });
      get().pushToHistory('Cleared all machines');
    }
  },
}));

// Auto-save function
export const setupAutoSave = (intervalMs: number = 30000) => {
  const intervalId = setInterval(() => {
    const { saveToLocalStorage, nodes } = useStore.getState();
    if (nodes.length > 0) {
      saveToLocalStorage();
      console.log('Auto-saved at', new Date().toLocaleTimeString());
    }
  }, intervalMs);
  
  return () => clearInterval(intervalId);
};