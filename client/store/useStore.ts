// client/store/useStore.ts
import { create } from 'zustand';
import { MachineTemplate, ViewMode, TemplatesStore, OperatorData, NODE_TYPES } from '@/shared/types';
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
import { MarkerType } from 'reactflow';

export type MachineStatus = 'active' | 'idle' | 'warning' | 'down';

export interface MachineData {
  label: string;
  status: MachineStatus;
  throughput: number;
  capacity: number;
  lastMaintenance: string;
  template?: MachineTemplate;
  frameRotation?: number;
}

// Union type untuk semua node data
export type NodeData = MachineData | OperatorData;

// History item type
interface HistoryItem {
  nodes: Node<NodeData>[];
  edges: Edge[];
  timestamp: number;
  description: string;
}

interface FlowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  lastSaved: string | null;
  
  // History states
  history: HistoryItem[];
  historyIndex: number;
  maxHistorySize: number;
  
  // View and templates
  viewMode: ViewMode;
  templates: MachineTemplate[];
  nodeTemplates: Record<string, string>;
  selectedTemplateId: string | null;
  
  // Methods
  setViewMode: (mode: ViewMode) => void;
  loadTemplates: () => void;
  saveTemplate: (template: MachineTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  duplicateTemplate: (templateId: string) => void;
  getTemplateById: (id: string | null) => MachineTemplate | undefined;
  assignTemplateToNode: (nodeId: string, templateId: string | null) => void;
  getNodeTemplate: (nodeId: string) => MachineTemplate | undefined;
  
  // Node operations
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setSelectedNodeId: (id: string | null) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  addOperator: (position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  updateThroughput: () => void;
  
  // Operator specific methods
  updateOperatorConnections: () => void;
  
  // Save & Load
  saveToLocalStorage: () => boolean;
  loadFromLocalStorage: () => boolean;
  exportToFile: () => void;
  importFromFile: (file: File) => Promise<void>;
  clearAll: () => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushToHistory: (description: string) => void;
  
  // Edge deletion
  deleteEdge: (edgeId: string) => void;
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

const manualAddEdge = (edgeParams: any, existingEdges: Edge[]) => {
  const newEdge: Edge = {
    id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...edgeParams,
  };
  return [...existingEdges, newEdge];
};

// Helper function untuk menentukan handle terdekat antara dua node
const getNearestHandles = (sourceNode: Node<OperatorData>, targetNode: Node<OperatorData>) => {
  const sourcePos = sourceNode.position;
  const targetPos = targetNode.position;
  
  // Hitung selisih posisi
  const deltaX = targetPos.x - sourcePos.x;
  const deltaY = targetPos.y - sourcePos.y;
  
  // Tentukan arah dominan
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal - lebih besar pergerakan horizontal
    if (deltaX > 0) {
      // Target di sebelah KANAN source
      return {
        sourceHandle: 'right-source',  // Source pake handle kanan
        targetHandle: 'left-target'     // Target pake handle kiri
      };
    } else {
      // Target di sebelah KIRI source
      return {
        sourceHandle: 'left-source',    // Source pake handle kiri
        targetHandle: 'right-target'    // Target pake handle kanan
      };
    }
  } else {
    // Vertical - lebih besar pergerakan vertikal
    if (deltaY > 0) {
      // Target di BAWAH source
      return {
        sourceHandle: 'bottom-source',  // Source pake handle bawah
        targetHandle: 'top-target'      // Target pake handle atas
      };
    } else {
      // Target di ATAS source
      return {
        sourceHandle: 'top-source',     // Source pake handle atas
        targetHandle: 'bottom-target'   // Target pake handle bawah
      };
    }
  }
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
  
  // New state
  viewMode: 'default',
  templates: [],
  nodeTemplates: {},
  selectedTemplateId: null,

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
    const { nodes } = get();
    const newNodes = applyNodeChanges(changes, nodes);
    
    const hasPositionChange = changes.some(change => change.type === 'position' || change.type === 'dimensions');
    
    set({ nodes: newNodes });
    
    // Jika ada perubahan posisi, update koneksi operator
    if (hasPositionChange) {
      get().updateOperatorConnections();
    }
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const { edges, pushToHistory } = get();
    const newEdges = applyEdgeChanges(changes, edges);
    set({ edges: newEdges });
    pushToHistory('Edge modified');
  },

  onConnect: (connection: Connection) => {
    const { edges, nodes, pushToHistory } = get();
    
    // Cek source dan target nodes
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    // Jika kedua node adalah operator, cek apakah mereka memiliki ID yang sama
    if (sourceNode?.type === 'operatorNode' && targetNode?.type === 'operatorNode') {
      const sourceData = sourceNode.data as OperatorData;
      const targetData = targetNode.data as OperatorData;
      
      // Jika ID berbeda, tolak koneksi
      if (sourceData.id !== targetData.id) {
        console.warn('Cannot connect operators with different IDs');
        return;
      }
      
      // Jika ID sama, izinkan koneksi manual
      // Tapi tetap gunakan nearest handle jika tidak ditentukan
      let sourceHandle = connection.sourceHandle;
      let targetHandle = connection.targetHandle;
      
      // Jika handle tidak ditentukan (koneksi dari panel), gunakan nearest
      if (!sourceHandle || !targetHandle) {
        const handles = getNearestHandles(
          sourceNode as Node<OperatorData>, 
          targetNode as Node<OperatorData>
        );
        sourceHandle = handles.sourceHandle;
        targetHandle = handles.targetHandle;
      }
      
      const newEdges = manualAddEdge({
        ...connection,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: '#a855f7', 
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrow',
          color: '#a855f7',
          width: 15,
          height: 15,
        },
        data: { 
          operatorId: sourceData.id,
          sourceProcess: sourceData.process,
          targetProcess: targetData.process
        },
      }, edges);
      
      set({ edges: newEdges });
      pushToHistory('Manual operator connection created');
    } else {
      // Untuk koneksi yang melibatkan machine, gunakan style default dengan arrow
      const newEdges = manualAddEdge({
        ...connection,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: '#1e293b', 
          strokeWidth: 2 
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#1e293b',
          width: 12,
          height: 12,
        },
      }, edges);
      
      set({ edges: newEdges });
      pushToHistory('Connection created');
    }
  },

  setSelectedNodeId: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  // New methods
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },
  
  loadTemplates: () => {
    try {
      const saved = localStorage.getItem('flow2d-templates');
      if (saved) {
        const templates = JSON.parse(saved);
        set({ templates });
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  },
  
  saveTemplate: (template: MachineTemplate) => {
    set(state => {
      const existingIndex = state.templates.findIndex(t => t.id === template.id);
      let newTemplates;
      
      if (existingIndex >= 0) {
        // Update existing
        newTemplates = [...state.templates];
        newTemplates[existingIndex] = template;
      } else {
        // Add new
        newTemplates = [...state.templates, template];
      }
      
      // Save to localStorage
      try {
        localStorage.setItem('flow2d-templates', JSON.stringify(newTemplates));
      } catch (error) {
        console.error('Failed to save templates:', error);
      }
      
      return { templates: newTemplates };
    });
    
    get().pushToHistory(`Saved template: ${template.name}`);
  },
  
  deleteTemplate: (templateId: string) => {
    set(state => {
      const newTemplates = state.templates.filter(t => t.id !== templateId);
      
      // Remove from any nodes using this template
      const newNodeTemplates = { ...state.nodeTemplates };
      Object.keys(newNodeTemplates).forEach(nodeId => {
        if (newNodeTemplates[nodeId] === templateId) {
          delete newNodeTemplates[nodeId];
        }
      });
      
      // Save to localStorage
      try {
        localStorage.setItem('flow2d-templates', JSON.stringify(newTemplates));
        
        // Also update the main save to reflect node template changes
        const flowData = {
          nodes: state.nodes,
          edges: state.edges,
          nodeTemplates: newNodeTemplates,
          timestamp: new Date().toISOString(),
          version: '1.1',
        };
        localStorage.setItem('flow2d-save', JSON.stringify(flowData));
      } catch (error) {
        console.error('Failed to save templates:', error);
      }
      
      return { 
        templates: newTemplates,
        nodeTemplates: newNodeTemplates
      };
    });
    
    get().pushToHistory(`Deleted template`);
  },
  
  duplicateTemplate: (templateId: string) => {
    const { templates } = get();
    const original = templates.find(t => t.id === templateId);
    if (!original) return;
    
    const duplicate: MachineTemplate = {
      ...JSON.parse(JSON.stringify(original)),
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    set(state => {
      const newTemplates = [...state.templates, duplicate];
      
      // Save to localStorage
      try {
        localStorage.setItem('flow2d-templates', JSON.stringify(newTemplates));
      } catch (error) {
        console.error('Failed to save templates:', error);
      }
      
      return { templates: newTemplates };
    });
    
    get().pushToHistory(`Duplicated template: ${original.name}`);
  },
  
  getTemplateById: (id: string | null) => {
    if (!id) return undefined;
    return get().templates.find(t => t.id === id);
  },
  
  assignTemplateToNode: (nodeId: string, templateId: string | null) => {
    set(state => {
      const newNodeTemplates = { ...state.nodeTemplates };
      
      if (templateId === null) {
        delete newNodeTemplates[nodeId];
      } else {
        newNodeTemplates[nodeId] = templateId;
      }
      
      return { nodeTemplates: newNodeTemplates };
    });
    
    get().pushToHistory(`Assigned template to node`);
  },
  
  getNodeTemplate: (nodeId: string) => {
    const { nodeTemplates, templates } = get();
    const templateId = nodeTemplates[nodeId];
    if (!templateId) return undefined;
    return templates.find(t => t.id === templateId);
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

  // Method baru: addOperator
  addOperator: (position: { x: number; y: number }) => {
    const { nodes } = get();
    const operatorNodes = nodes.filter(n => n.type === 'operatorNode') as Node<OperatorData>[];
    
    const operatorData = { id: null, process: null, label: null } as OperatorData;// null data karena akan diisi setelah validasi ID dan process
    
    const newNode: Node<OperatorData> = {
      id: `operator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'operatorNode',
      position,
      data: operatorData,
    };

    set({ nodes: [...nodes, newNode] });
    
    // Update koneksi otomatis setelah menambah operator
    get().updateOperatorConnections();
    get().pushToHistory(`Added operator with ID ${operatorData.id}, Process ${operatorData.process}`);
  },

  // Method baru: updateOperatorConnections - untuk auto-connect berdasarkan ID dan process dengan nearest handle
  updateOperatorConnections: () => {
    const { nodes, edges } = get();
    
    // Filter hanya operator nodes
    const operatorNodes = nodes.filter(n => n.type === 'operatorNode') as Node<OperatorData>[];
    
    if (operatorNodes.length < 2) {
      // Hapus semua operator edges jika kurang dari 2 operator
      const nonOperatorEdges = edges.filter(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        return sourceNode?.type !== 'operatorNode' && targetNode?.type !== 'operatorNode';
      });
      set({ edges: nonOperatorEdges });
      return;
    }
    
    // Group operators by ID
    const operatorsById: Record<number, Node<OperatorData>[]> = {};
    
    operatorNodes.forEach(node => {
      const id = node.data.id;
      if (!operatorsById[id]) {
        operatorsById[id] = [];
      }
      operatorsById[id].push(node);
    });
    
    // Hapus semua edges yang terkait operator (yang bukan machine)
    const nonOperatorEdges = edges.filter(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      // Keep edges that involve machines
      return sourceNode?.type !== 'operatorNode' && targetNode?.type !== 'operatorNode';
    });
    
    // Buat edges baru berdasarkan grouping ID dengan nearest handle
    const newOperatorEdges: Edge[] = [];
    
    Object.entries(operatorsById).forEach(([idStr, nodesWithSameId]) => {
      const id = parseInt(idStr);
      
      if (nodesWithSameId.length >= 2) {
        // Sort by process number (ascending)
        const sortedNodes = [...nodesWithSameId].sort((a, b) => a.data.process - b.data.process);
        
        // Connect in order: smallest process to next, and last back to first (cycle)
        for (let i = 0; i < sortedNodes.length; i++) {
          const sourceNode = sortedNodes[i];
          const targetNode = sortedNodes[(i + 1) % sortedNodes.length]; // Cycle back to first
          
          // Dapatkan handle terdekat berdasarkan posisi
          const handles = getNearestHandles(sourceNode, targetNode);
          
          const edgeId = `operator-edge-${id}-${sourceNode.data.process}-${targetNode.data.process}-${Date.now()}-${i}`;
          
          // Cek apakah edge sudah ada
          const edgeExists = nonOperatorEdges.some(e => 
            e.source === sourceNode.id && e.target === targetNode.id
          ) || newOperatorEdges.some(e => 
            e.source === sourceNode.id && e.target === targetNode.id
          );
          
          if (!edgeExists) {
            newOperatorEdges.push({
              id: edgeId,
              source: sourceNode.id,
              target: targetNode.id,
              sourceHandle: handles.sourceHandle,
              targetHandle: handles.targetHandle,
              type: 'smoothstep',
              animated: true,
              style: { 
                stroke: '#a855f7', 
                strokeWidth: 2,
                strokeDasharray: '5,5' // Hanya untuk operator edges
              },
              markerEnd: {
                type: MarkerType.ArrowClosed ,
                color: '#a855f7',
                width: 15,
                height: 15,
              },
              data: { 
                operatorId: id,
                sourceProcess: sourceNode.data.process,
                targetProcess: targetNode.data.process
              },
            });
          }
        }
      }
    });
    
    // Gabungkan edges yang ada (non-operator) dengan edges baru
    set({ edges: [...nonOperatorEdges, ...newOperatorEdges] });
  },

  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    const { nodes } = get();
    const node = nodes.find(n => n.id === nodeId);
    
    if (!node) return;
    
    // Jika node adalah operator dan data yang diubah adalah id atau process
    if (node?.type === 'operatorNode' && (data.hasOwnProperty('id') || data.hasOwnProperty('process'))) {
      const currentData = node.data as OperatorData;
      const newId = (data as Partial<OperatorData>).id ?? currentData.id;
      const newProcess = (data as Partial<OperatorData>).process ?? currentData.process;
      
      // Validasi: jika mengubah process, pastikan tidak duplicate untuk ID yang sama
      if (data.hasOwnProperty('process')) {
        const operatorsWithSameId = nodes.filter(n => 
          n.type === 'operatorNode' && 
          n.id !== nodeId && 
          (n.data as OperatorData).id === newId
        ) as Node<OperatorData>[];
        
        const isDuplicate = operatorsWithSameId.some(n => n.data.process === newProcess);
        
        if (isDuplicate) {
          console.warn(`Process ${newProcess} already used for ID ${newId}`);
          return; // Batalkan update
        }
      }
      
      // Update label jika id atau process berubah
      const updatedData = {
        ...currentData,
        ...data,
        label: `Operator ${newId}.${newProcess}`
      };
      
      set({
        nodes: nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: updatedData }
            : n
        ),
      });
      
      get().updateOperatorConnections();
    } else {
      // Untuk machine node atau update biasa
      set({
        nodes: nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...data } }
            : n
        ),
      });
    }
    
    get().pushToHistory('Updated node properties');
  },

  deleteNode: (nodeId: string) => {
    const { nodes, edges } = get();
    
    // Cek apakah node yang dihapus adalah operator
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    
    set({
      nodes: nodes.filter((node) => node.id !== nodeId),
      edges: edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: null,
    });
    
    // Jika yang dihapus adalah operator, update koneksi operator lainnya
    if (nodeToDelete?.type === 'operatorNode') {
      get().updateOperatorConnections();
    }
    
    get().pushToHistory('Deleted node');
  },

  // Method baru: deleteEdge
  deleteEdge: (edgeId: string) => {
    const { edges, pushToHistory } = get();
    const newEdges = edges.filter(edge => edge.id !== edgeId);
    set({ edges: newEdges });
    pushToHistory('Edge deleted');
  },

  updateThroughput: () => {
    set({
      nodes: get().nodes.map((node) => {
        const isMachineNode = (node: Node<NodeData>): node is Node<MachineData> => {
          return node.type === 'machineNode' || node.type === 'shapeMachineNode';
        };

        // Only update machine nodes, not operator nodes
        if (isMachineNode(node) && node.data.status === 'active') {
          const machineData = node.data as MachineData;
          const variation = Math.floor(Math.random() * 10) - 3;
          const newThroughput = Math.max(0, Math.min(100, machineData.throughput + variation));
          return {
            ...node,
            data: { ...machineData, throughput: newThroughput },
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
        nodeTemplates: get().nodeTemplates,
        timestamp: new Date().toISOString(),
        version: '1.3', // Update version for nearest handle support
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
          nodeTemplates: flowData.nodeTemplates || {},
          lastSaved: new Date(flowData.timestamp).toLocaleString()
        });
        
        // Reset history with loaded state
        get().pushToHistory('Loaded from storage');
        
        // Update operator connections after loading
        setTimeout(() => {
          get().updateOperatorConnections();
        }, 100);
        
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
        nodeTemplates: get().nodeTemplates,
        timestamp: new Date().toISOString(),
        version: '1.3',
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
              nodeTemplates: flowData.nodeTemplates || {},
              lastSaved: new Date(flowData.timestamp).toLocaleString()
            });
            
            // Reset history with imported state
            get().pushToHistory('Imported from file');
            
            // Update operator connections after import
            setTimeout(() => {
              get().updateOperatorConnections();
            }, 100);
            
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
    set({ nodes: [], edges: [], selectedNodeId: null, nodeTemplates: {} });
    get().pushToHistory('Cleared all');
  },
}));

// Load templates on store creation
useStore.getState().loadTemplates();

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