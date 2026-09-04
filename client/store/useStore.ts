// client/store/useStore.ts
import { create } from 'zustand';
import {
  MachineTemplate,
  ViewMode,
  TemplatesStore,
  OperatorData,
  NODE_TYPES,
  HandleConfig,
  HandlePosition,
  DEFAULT_HANDLE_CONFIG,
} from '@/shared/types';
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
  applyEdgeChanges,
} from 'reactflow';
import { MarkerType } from 'reactflow';

import {
  fetchTemplates,
  saveTemplate as apiSaveTemplate,
  deleteTemplate as apiDeleteTemplate,
  duplicateTemplate as apiDuplicateTemplate,
  saveFlowByLine,
  fetchFlowByLineId,
  fetchAllSavedLines,
} from '@/services/api';
import { fa } from 'zod/v4/locales';

export type MachineStatus = 'active' | 'idle' | 'warning' | 'down';

export interface MachineData {
  label: string;
  status: MachineStatus;
  throughput: number;
  capacity: number;
  lastMaintenance: string;
  template?: MachineTemplate;
  frameRotation?: number;
  handles?: HandleConfig;
}

export type NodeData = MachineData | OperatorData;

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
  currentLineId: string | null;
  currentLineName: string | null;
  setCurrentLineId: (lineId: string | null) => void;

  history: HistoryItem[];
  historyIndex: number;
  maxHistorySize: number;

  viewMode: ViewMode;
  templates: MachineTemplate[];
  nodeTemplates: Record<string, string>;
  selectedTemplateId: string | null;
  isDbConnected: boolean;

  // UI state
  isToolsHidden: boolean;
  setIsToolsHidden: (hidden: boolean) => void;

  // View & Templates
  setViewMode: (mode: ViewMode) => void;
  loadTemplates: () => Promise<void>;
  saveTemplate: (template: MachineTemplate) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  duplicateTemplate: (templateId: string) => Promise<void>;
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

  // Handle management
  toggleHandle: (nodeId: string, position: HandlePosition) => void;
  getActiveHandles: (nodeId: string) => HandlePosition[];

  // Operator
  updateOperatorConnections: () => void;

  // Save & Load
  saveToLocalStorage: () => boolean;
  loadFromLocalStorage: () => boolean;
  exportToFile: () => void;
  importFromFile: (file: File) => Promise<void>;
  clearAll: () => void;

  // Database operations
  saveFlowToDatabase: (
    lineId: string,
    lineName?: string,
    name?: string,
    description?: string
  ) => Promise<boolean>;
  loadFlowFromDatabase: (lineId: string) => Promise<boolean>;
  checkDbConnection: () => Promise<boolean>;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushToHistory: (description: string) => void;

  // Edge
  deleteEdge: (edgeId: string) => void;
}

// =============================================
// HELPERS
// =============================================

const generateOperatorColor = (id: number): string => {
  const hue = (id * 137.5) % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

const getDefaultHandleConfig = (): HandleConfig => ({
  top: true,
  bottom: true,
  left: true,
  right: true,
});

const getActiveHandlesFromConfig = (config?: HandleConfig): HandlePosition[] => {
  if (!config) return ['top', 'bottom', 'left', 'right'];
  return (['top', 'bottom', 'left', 'right'] as HandlePosition[]).filter(
    (pos) => config[pos]
  );
};

const createMachineData = (type: string): MachineData => ({
  label: `${type || 'New Machine'} ${Math.floor(Math.random() * 1000)}`,
  status: 'idle',
  throughput: Math.floor(Math.random() * 80) + 20,
  capacity: 100,
  lastMaintenance: new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
  handles: getDefaultHandleConfig(),
});

const createDefaultChairConfig = (color?: string) => ({
  enabled: false,
  chairColor: color || '#afbfe4',
  showIdInChair: true,
  showProcessInChair: true,
  chairWidth: 80,
  chairHeight: 100,
  seatDepth: 45,
  backrestHeight: 55,
});

const createOperatorData = (): OperatorData =>
  ({
    id: null,
    process: null,
    label: null,
    handles: getDefaultHandleConfig(),
    color: null,
    chairDesign: createDefaultChairConfig(),
  } as OperatorData);

const manualAddEdge = (edgeParams: any, existingEdges: Edge[]) => {
  const newEdge: Edge = {
    id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...edgeParams,
  };
  return [...existingEdges, newEdge];
};

const getNearestHandles = (
  sourceNode: Node<OperatorData | MachineData>,
  targetNode: Node<OperatorData | MachineData>,
  sourceActiveHandles: HandlePosition[] = ['top', 'bottom', 'left', 'right'],
  targetActiveHandles: HandlePosition[] = ['top', 'bottom', 'left', 'right']
) => {
  const sourcePos = sourceNode.position;
  const targetPos = targetNode.position;

  const deltaX = targetPos.x - sourcePos.x;
  const deltaY = targetPos.y - sourcePos.y;

  const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

  let preferredSourcePositions: HandlePosition[] = [];
  let preferredTargetPositions: HandlePosition[] = [];

  if (isHorizontal) {
    if (deltaX > 0) {
      preferredSourcePositions = ['right', 'top', 'bottom', 'left'];
      preferredTargetPositions = ['left', 'top', 'bottom', 'right'];
    } else {
      preferredSourcePositions = ['left', 'top', 'bottom', 'right'];
      preferredTargetPositions = ['right', 'top', 'bottom', 'left'];
    }
  } else {
    if (deltaY > 0) {
      preferredSourcePositions = ['bottom', 'left', 'right', 'top'];
      preferredTargetPositions = ['top', 'left', 'right', 'bottom'];
    } else {
      preferredSourcePositions = ['top', 'left', 'right', 'bottom'];
      preferredTargetPositions = ['bottom', 'left', 'right', 'top'];
    }
  }

  const sourceHandle =
    preferredSourcePositions.find((pos) => sourceActiveHandles.includes(pos)) ||
    sourceActiveHandles[0];

  const targetHandle =
    preferredTargetPositions.find((pos) => targetActiveHandles.includes(pos)) ||
    targetActiveHandles[0];

  return {
    sourceHandle: `${sourceHandle}-source`,
    targetHandle: `${targetHandle}-target`,
  };
};

// =============================================
// STORE
// =============================================

export const useStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  lastSaved: null,
  currentLineId: null,
  currentLineName: null,

  history: [
    {
      nodes: [],
      edges: [],
      timestamp: Date.now(),
      description: 'Initial state',
    },
  ],
  historyIndex: 0,
  maxHistorySize: 50,

  viewMode: 'default',
  templates: [],
  nodeTemplates: {},
  selectedTemplateId: null,
  isDbConnected: false,

  // UI state
  isToolsHidden: false,
  setIsToolsHidden: (hidden: boolean) => set({ isToolsHidden: hidden }),
  // ================================
  // CURRENT LINE
  // ================================
  setCurrentLineId: (lineId: string | null) => {

    set({
      currentLineId: lineId,
    });

  },
  // =============================================
  // CHECK DATABASE CONNECTION
  // =============================================
  checkDbConnection: async () => {
    try {
      const { checkDatabaseHealth } = await import('@/services/api');
      const result = await checkDatabaseHealth();
      set({ isDbConnected: result?.connected || false });
      return result?.connected || false;
    } catch {
      set({ isDbConnected: false });
      return false;
    }
  },

  // =============================================
  // LOAD TEMPLATES
  // =============================================
  loadTemplates: async () => {
    try {
      try {
        const dbTemplates = await fetchTemplates();
        if (dbTemplates && dbTemplates.length > 0) {
          set({ templates: dbTemplates, isDbConnected: true });
          localStorage.setItem('flow2d-templates', JSON.stringify(dbTemplates));
          return;
        }
      } catch (dbError: any) {
        console.warn('[Store] Failed to load templates from DB:', dbError.message);
      }

      const saved = localStorage.getItem('flow2d-templates');
      if (saved) {
        const localTemplates = JSON.parse(saved);
        set({ templates: localTemplates });

        if (localTemplates.length > 0) {
          try {
            for (const template of localTemplates) {
              await apiSaveTemplate(template);
            }
            set({ isDbConnected: true });
          } catch (syncError: any) {
            console.warn('[Store] Failed to sync templates to database:', syncError.message);
          }
        }
      }
    } catch (error) {
      console.error('[Store] Failed to load templates:', error);
    }
  },

  // =============================================
  // SAVE TEMPLATE
  // =============================================
  saveTemplate: async (template: MachineTemplate) => {
    set((state) => {
      const existingIndex = state.templates.findIndex((t) => t.id === template.id);
      let newTemplates;

      if (existingIndex >= 0) {
        newTemplates = [...state.templates];
        newTemplates[existingIndex] = template;
      } else {
        newTemplates = [...state.templates, template];
      }

      try {
        localStorage.setItem('flow2d-templates', JSON.stringify(newTemplates));
      } catch (e) {
        console.warn('[Store] Failed to save templates to localStorage');
      }

      return { templates: newTemplates };
    });

    try {
      const result = await apiSaveTemplate(template);
      console.log(`[Store] Template "${template.name}" saved to database:`, result.action);
      set({ isDbConnected: true });
    } catch (error: any) {
      console.warn('[Store] Failed to save template to database:', error.message);
    }

    get().pushToHistory(`Saved template: ${template.name}`);
  },

  // =============================================
  // DELETE TEMPLATE
  // =============================================
  deleteTemplate: async (templateId: string) => {
    set((state) => {
      const newTemplates = state.templates.filter((t) => t.id !== templateId);

      const newNodeTemplates = { ...state.nodeTemplates };
      Object.keys(newNodeTemplates).forEach((nodeId) => {
        if (newNodeTemplates[nodeId] === templateId) {
          delete newNodeTemplates[nodeId];
        }
      });

      localStorage.setItem('flow2d-templates', JSON.stringify(newTemplates));

      const flowData = {
        nodes: state.nodes,
        edges: state.edges,
        nodeTemplates: newNodeTemplates,
        timestamp: new Date().toISOString(),
        version: '1.4',
      };
      localStorage.setItem('flow2d-save', JSON.stringify(flowData));

      return { templates: newTemplates, nodeTemplates: newNodeTemplates };
    });

    try {
      await apiDeleteTemplate(templateId);
    } catch (error: any) {
      console.warn('[Store] Failed to delete template from database:', error.message);
    }

    get().pushToHistory(`Deleted template`);
  },

  // =============================================
  // DUPLICATE TEMPLATE
  // =============================================
  duplicateTemplate: async (templateId: string) => {
    const { templates } = get();
    const original = templates.find((t) => t.id === templateId);
    if (!original) return;

    const newId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newName = `${original.name} (Copy)`;

    const duplicate: MachineTemplate = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: newName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => {
      const newTemplates = [...state.templates, duplicate];
      localStorage.setItem('flow2d-templates', JSON.stringify(newTemplates));
      return { templates: newTemplates };
    });

    try {
      const result = await apiDuplicateTemplate(templateId, newId, newName);
      console.log(`[Store] Template duplicated in database:`, result.newId);
    } catch (error: any) {
      console.warn('[Store] Failed to duplicate in database, saving as new:', error.message);
      try {
        await apiSaveTemplate(duplicate);
      } catch (saveError: any) {
        console.warn('[Store] Fallback save also failed:', saveError.message);
      }
    }

    get().pushToHistory(`Duplicated template: ${original.name}`);
  },

  getTemplateById: (id: string | null) => {
    if (!id) return undefined;
    return get().templates.find((t) => t.id === id);
  },

  assignTemplateToNode: (nodeId: string, templateId: string | null) => {
    set((state) => {
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
    return templates.find((t) => t.id === templateId);
  },

  // =============================================
  // SAVE FLOW TO DATABASE
  // =============================================
  saveFlowToDatabase: async (
    lineId: string,
    lineName?: string,
    name?: string,
    description?: string
  ) => {
    const { nodes, edges, nodeTemplates, viewMode, templates } = get();

    if (!lineId || lineId.trim().length === 0) {
      console.warn('[Store] Line ID is required');
      return false;
    }

    if (nodes.length === 0) {
      console.warn('[Store] No nodes to save');
      return false;
    }

    try {
      const enrichedNodes = nodes.map((node) => {
        const nodeData = { ...node.data };

        const templateId = nodeTemplates[node.id];
        if (
          templateId &&
          (node.type === 'machineNode' || node.type === 'shapeMachineNode')
        ) {
          const fullTemplate = templates.find((t) => t.id === templateId);
          if (fullTemplate) {
            nodeData.template = fullTemplate;
          }
        }

        const { ...cleanData } = nodeData;

        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: cleanData,
        };
      });

      const result = await saveFlowByLine({
        lineId: lineId.trim(),
        lineName: lineName || `Line ${lineId}`,
        name: name || `Flow for ${lineId}`,
        description: description || '',
        nodes: enrichedNodes,
        edges: edges,
        nodeTemplates: nodeTemplates || {},
        formations: null,
        viewMode: viewMode || 'shapes',
      });

      set({
        currentLineId: lineId,
        currentLineName: lineName || null,
        lastSaved: new Date().toLocaleString(),
        isDbConnected: true,
      });

      get().saveToLocalStorage();

      return true;
    } catch (error: any) {
      console.error('[Store] Failed to save flow to database:', error.message);
      return false;
    }
  },

  // =============================================
  // LOAD FLOW FROM DATABASE
  // =============================================
  loadFlowFromDatabase: async (lineId: string) => {
    if (!lineId) return false;

    try {
      const flow = await fetchFlowByLineId(lineId);

      if (!flow || !flow.nodes) {
        console.warn(`[Store] No flow found for line "${lineId}"`);
        return false;
      }

      set({
        nodes: flow.nodes || [],
        edges: flow.edges || [],
        nodeTemplates: flow.nodeTemplates || {},
        currentLineId: lineId,
        currentLineName: flow.lineName || null,
        lastSaved: new Date(flow.updatedAt || Date.now()).toLocaleString(),
        isDbConnected: true,
      });

      get().saveToLocalStorage();

      setTimeout(() => {
        get().updateOperatorConnections();
      }, 200);

      get().pushToHistory(`Loaded flow from database for line "${lineId}"`);

      return true;
    } catch (error: any) {
      console.error('[Store] Failed to load flow from database:', error.message);
      return false;
    }
  },

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  pushToHistory: (description: string) => {
    const { nodes, edges, history, historyIndex, maxHistorySize } = get();

    const newHistory = history.slice(0, historyIndex + 1);

    newHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
      description,
    });

    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    }

    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  onNodesChange: (changes: NodeChange[]) => {
    const { nodes } = get();
    const newNodes = applyNodeChanges(changes, nodes);
    const hasPositionChange = changes.some(
      (change) => change.type === 'position' || change.type === 'dimensions'
    );

    set({ nodes: newNodes });

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

    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return;

    const sourceActiveHandles = get().getActiveHandles(sourceNode.id);
    const targetActiveHandles = get().getActiveHandles(targetNode.id);

    if (sourceActiveHandles.length === 0 || targetActiveHandles.length === 0) {
      console.warn('Cannot connect: Node has no active handles');
      return;
    }

    const edgeType = 'smart-avoid';

    if (
      sourceNode?.type === 'operatorNode' &&
      targetNode?.type === 'operatorNode'
    ) {
      const sourceData = sourceNode.data as OperatorData;
      const targetData = targetNode.data as OperatorData;

      if (sourceData.id !== targetData.id) {
        console.warn('Cannot connect operators with different IDs');
        return;
      }

      let sourceHandle = connection.sourceHandle;
      let targetHandle = connection.targetHandle;

      if (!sourceHandle || !targetHandle) {
        const handles = getNearestHandles(
          sourceNode as Node<OperatorData>,
          targetNode as Node<OperatorData>,
          sourceActiveHandles,
          targetActiveHandles
        );
        sourceHandle = handles.sourceHandle;
        targetHandle = handles.targetHandle;
      }

      const newEdges = manualAddEdge(
        {
          ...connection,
          sourceHandle,
          targetHandle,
          type: edgeType,
          animated: true,
          style: {
            stroke: sourceData.color || generateOperatorColor(sourceData.id),
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          markerEnd: {
            type: 'arrow',
            color: sourceData.color || generateOperatorColor(sourceData.id),
            width: 15,
            height: 15,
          },
          data: {
            operatorId: sourceData.id,
            sourceProcess: sourceData.process,
            targetProcess: targetData.process,
          },
        },
        edges
      );

      set({ edges: newEdges });
      pushToHistory('Operator connection created');
    } else {
      let sourceHandle = connection.sourceHandle;
      let targetHandle = connection.targetHandle;

      if (!sourceHandle || !targetHandle) {
        const handles = getNearestHandles(
          sourceNode,
          targetNode,
          sourceActiveHandles,
          targetActiveHandles
        );
        sourceHandle = handles.sourceHandle;
        targetHandle = handles.targetHandle;
      }

      const newEdges = manualAddEdge(
        {
          ...connection,
          sourceHandle,
          targetHandle,
          type: edgeType,
          animated: false,
          style: { stroke: '#1e293b', strokeWidth: 2 },
          markerEnd: {
            type: 'arrowclosed',
            color: '#1e293b',
            width: 12,
            height: 12,
          },
        },
        edges
      );

      set({ edges: newEdges });
      pushToHistory('Connection created');
    }
  },

  setSelectedNodeId: (id: string | null) => set({ selectedNodeId: id }),

  toggleHandle: (nodeId: string, position: HandlePosition) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const currentHandles =
      (node.data as any).handles || getDefaultHandleConfig();
    const newHandles = {
      ...currentHandles,
      [position]: !currentHandles[position],
    };

    set({
      nodes: nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, handles: newHandles } } : n
      ),
    });

    get().updateOperatorConnections();
    get().pushToHistory(`Toggled handle ${position}`);
  },

  getActiveHandles: (nodeId: string) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return [];
    const handles = (node.data as any).handles;
    return getActiveHandlesFromConfig(handles);
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

  addOperator: (position: { x: number; y: number }) => {
    const { nodes } = get();
    const operatorData = createOperatorData();

    const newNode: Node<OperatorData> = {
      id: `operator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'operatorNode',
      position,
      data: {
        ...operatorData,
        chairDesign: createDefaultChairConfig(),
      },
    };

    set({ nodes: [...nodes, newNode] });
    get().updateOperatorConnections();
    get().pushToHistory(`Added operator`);
  },

  updateOperatorConnections: () => {
    const { nodes, edges } = get();

    const operatorNodes = nodes.filter(
      (n) => n.type === 'operatorNode'
    ) as Node<OperatorData>[];

    if (operatorNodes.length < 2) {
      const nonOperatorEdges = edges.filter((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        return (
          sourceNode?.type !== 'operatorNode' &&
          targetNode?.type !== 'operatorNode'
        );
      });
      set({ edges: nonOperatorEdges });
      return;
    }

    const nodesWithColor = operatorNodes.map((node) => {
      if (!node.data.color && node.data.id) {
        node.data.color = generateOperatorColor(node.data.id);
      }
      return node;
    });

    set({
      nodes: nodes.map((n) => {
        const updated = nodesWithColor.find((un) => un.id === n.id);
        return updated || n;
      }),
    });

    const operatorsById: Record<number, Node<OperatorData>[]> = {};
    nodesWithColor.forEach((node) => {
      const id = node.data.id;
      if (id && !operatorsById[id]) operatorsById[id] = [];
      if (id) operatorsById[id].push(node);
    });

    const nonOperatorEdges = edges.filter((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      return (
        sourceNode?.type !== 'operatorNode' &&
        targetNode?.type !== 'operatorNode'
      );
    });

    const newOperatorEdges: Edge[] = [];

    Object.entries(operatorsById).forEach(([idStr, nodesWithSameId]) => {
      const id = parseInt(idStr);

      if (nodesWithSameId.length >= 2) {
        const sortedNodes = [...nodesWithSameId].sort(
          (a, b) => a.data.process - b.data.process
        );

        for (let i = 0; i < sortedNodes.length; i++) {
          const sourceNode = sortedNodes[i];
          const targetNode = sortedNodes[(i + 1) % sortedNodes.length];

          const sourceActiveHandles = get().getActiveHandles(sourceNode.id);
          const targetActiveHandles = get().getActiveHandles(targetNode.id);

          if (
            sourceActiveHandles.length === 0 ||
            targetActiveHandles.length === 0
          )
            continue;

          const handles = getNearestHandles(
            sourceNode,
            targetNode,
            sourceActiveHandles,
            targetActiveHandles
          );

          const edgeId = `operator-edge-${id}-${sourceNode.data.process}-${targetNode.data.process}-${Date.now()}-${i}`;

          const edgeExists =
            nonOperatorEdges.some(
              (e) =>
                e.source === sourceNode.id && e.target === targetNode.id
            ) ||
            newOperatorEdges.some(
              (e) =>
                e.source === sourceNode.id && e.target === targetNode.id
            );

          if (!edgeExists) {
            newOperatorEdges.push({
              id: edgeId,
              source: sourceNode.id,
              target: targetNode.id,
              sourceHandle: handles.sourceHandle,
              targetHandle: handles.targetHandle,
              type: 'z',
              animated: true,
              style: {
                stroke: sourceNode.data.color || generateOperatorColor(id),
                strokeWidth: 4,
                strokeDasharray: '6,4',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: sourceNode.data.color || generateOperatorColor(id),
                width: 10,
                height: 10,
              },
              data: {
                operatorId: id,
                sourceProcess: sourceNode.data.process,
                targetProcess: targetNode.data.process,
              },
            });
          }
        }
      }
    });

    set({ edges: [...nonOperatorEdges, ...newOperatorEdges] });
  },

  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    const { nodes } = get();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    if (
      node?.type === 'operatorNode' &&
      (data.hasOwnProperty('id') ||
        data.hasOwnProperty('process') ||
        data.hasOwnProperty('chairDesign'))
    ) {
      const currentData = node.data as OperatorData;
      const newId =
        (data as Partial<OperatorData>).id ?? currentData.id;
      const newProcess =
        (data as Partial<OperatorData>).process ?? currentData.process;

      if (data.hasOwnProperty('process')) {
        const operatorsWithSameId = nodes.filter(
          (n) =>
            n.type === 'operatorNode' &&
            n.id !== nodeId &&
            (n.data as OperatorData).id === newId
        ) as Node<OperatorData>[];

        const isDuplicate = operatorsWithSameId.some(
          (n) => n.data.process === newProcess
        );
        if (isDuplicate) {
          console.warn(`Process ${newProcess} already used for ID ${newId}`);
          return;
        }
      }

      const newColor = newId ? generateOperatorColor(newId) : currentData.color;

      let updatedChairDesign = currentData.chairDesign;
      if (
        newColor &&
        (!currentData.chairDesign?.chairColor ||
          currentData.chairDesign?.chairColor === currentData.color)
      ) {
        updatedChairDesign = {
          ...(currentData.chairDesign || createDefaultChairConfig()),
          chairColor: newColor,
        };
      }
      if ((data as any).chairDesign) {
        updatedChairDesign = {
          ...updatedChairDesign,
          ...(data as any).chairDesign,
        };
      }

      const updatedData = {
        ...currentData,
        ...data,
        label: `Operator ${newId}.${newProcess}`,
        color: newColor,
        chairDesign: updatedChairDesign,
      };

      set({
        nodes: nodes.map((n) =>
          n.id === nodeId ? { ...n, data: updatedData } : n
        ),
      });

      get().updateOperatorConnections();
    } else {
      set({
        nodes: nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
        ),
      });
    }

    get().pushToHistory('Updated node properties');
  },

  deleteNode: (nodeId: string) => {
    const { nodes, edges } = get();
    const nodeToDelete = nodes.find((n) => n.id === nodeId);

    set({
      nodes: nodes.filter((node) => node.id !== nodeId),
      edges: edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: null,
    });

    if (nodeToDelete?.type === 'operatorNode') {
      get().updateOperatorConnections();
    }

    get().pushToHistory('Deleted node');
  },

  deleteEdge: (edgeId: string) => {
    const { edges, pushToHistory } = get();
    set({ edges: edges.filter((edge) => edge.id !== edgeId) });
    pushToHistory('Edge deleted');
  },

  updateThroughput: () => {
    set({
      nodes: get().nodes.map((node) => {
        const isMachineNode = (
          node: Node<NodeData>
        ): node is Node<MachineData> => {
          return (
            node.type === 'machineNode' || node.type === 'shapeMachineNode'
          );
        };

        if (isMachineNode(node) && node.data.status === 'active') {
          const machineData = node.data as MachineData;
          const variation = Math.floor(Math.random() * 10) - 3;
          const newThroughput = Math.max(
            0,
            Math.min(100, machineData.throughput + variation)
          );
          return {
            ...node,
            data: { ...machineData, throughput: newThroughput },
          };
        }
        return node;
      }),
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousState = history[newIndex];
      set({
        nodes: previousState.nodes,
        edges: previousState.edges,
        historyIndex: newIndex,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      set({
        nodes: nextState.nodes,
        edges: nextState.edges,
        historyIndex: newIndex,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  saveToLocalStorage: () => {
    try {
      const flowData = {
        nodes: get().nodes,
        edges: get().edges,
        nodeTemplates: get().nodeTemplates,
        currentLineId: get().currentLineId,
        currentLineName: get().currentLineName,
        timestamp: new Date().toISOString(),
        version: '1.5',
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

      if (
        flowData.nodes &&
        Array.isArray(flowData.nodes) &&
        flowData.edges &&
        Array.isArray(flowData.edges)
      ) {
        const migratedNodes = flowData.nodes.map((node: any) => {
          if (!node.data.handles) {
            node.data.handles = getDefaultHandleConfig();
          }
          if (
            node.type === 'operatorNode' &&
            node.data.id &&
            !node.data.color
          ) {
            node.data.color = generateOperatorColor(node.data.id);
          }
          return node;
        });

        set({
          nodes: migratedNodes,
          edges: flowData.edges,
          nodeTemplates: flowData.nodeTemplates || {},
          currentLineId: flowData.currentLineId || null,
          currentLineName: flowData.currentLineName || null,
          lastSaved: new Date(flowData.timestamp).toLocaleString(),
        });

        get().pushToHistory('Loaded from storage');

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
        version: '1.5',
        appName: 'Flow2D Machine Schema',
      };

      const dataStr = JSON.stringify(flowData, null, 2);
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `flow2d-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

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

          if (
            flowData.nodes &&
            Array.isArray(flowData.nodes) &&
            flowData.edges &&
            Array.isArray(flowData.edges)
          ) {
            const migratedNodes = flowData.nodes.map((node: any) => {
              if (!node.data.handles) {
                node.data.handles = getDefaultHandleConfig();
              }
              if (
                node.type === 'operatorNode' &&
                node.data.id &&
                !node.data.color
              ) {
                node.data.color = generateOperatorColor(node.data.id);
              }
              return node;
            });

            set({
              nodes: migratedNodes,
              edges: flowData.edges,
              nodeTemplates: flowData.nodeTemplates || {},
              lastSaved: new Date(flowData.timestamp).toLocaleString(),
            });

            get().pushToHistory('Imported from file');

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
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      nodeTemplates: {},
      currentLineId: null,
      currentLineName: null,
      lastSaved: null,
    });
    get().pushToHistory('Cleared all');
    localStorage.removeItem(
      'flow2d-save'
    );
  },
}));

// =============================================
// INITIALIZATION
// =============================================

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

// Load templates from database
useStore.getState().loadTemplates();

// Check database connection
useStore.getState().checkDbConnection();

// =============================================
// LOAD SAVED FLOW CONDITION
// =============================================
const params = new URLSearchParams(
  window.location.search
);
const mode = params.get('mode');
// Jangan load localStorage kalau create new
if (mode !== 'new') {
  const savedFlow = localStorage.getItem(
    'flow2d-save'
  );
  if (savedFlow) {
    try {
      const flowData = JSON.parse(savedFlow);
      const savedTime = flowData.timestamp
        ? new Date(flowData.timestamp).getTime()
        : 0;
      const isRecent =
        Date.now() - savedTime <= THIRTY_MINUTES_MS;
      if (
        isRecent &&
        flowData.nodes &&
        flowData.nodes.length > 0
      ) {
        useStore
          .getState()
          .loadFromLocalStorage();
      }
      if (flowData.currentLineId) {
        useStore
          .getState()
          .loadFlowFromDatabase(
            flowData.currentLineId
          )
          .catch(() => {
            console.log(
              '[Init] Database unavailable'
            );
          });
      }
    } catch(e) {

      console.warn(
        '[Init] Failed parse saved flow'
      );

    }

  }

}

// Auto-save function
export const setupAutoSave = (intervalMs: number = 30000) => {
  const intervalId = setInterval(() => {
    const { saveToLocalStorage, nodes } = useStore.getState();
    if (nodes.length > 0) {
      saveToLocalStorage();
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
};