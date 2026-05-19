// src/components/flow2d/EmbeddableFlow.tsx
import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// =============================================
// TYPES (self-contained, tidak depend ke shared)
// =============================================

interface ExportedNodeData {
  id: string;
  type: 'machine' | 'operator';
  label: string;
  position: { x: number; y: number };
  status?: 'active' | 'idle' | 'warning' | 'down';
  throughput?: number;
  capacity?: number;
  templateId?: string;
  frameRotation?: number;
  operatorId?: number;
  process?: number;
  color?: string;
  chairDesign?: any;
  handles?: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
  width?: number;
  height?: number;
}

interface ExportedEdgeData {
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

interface FlowMetadata {
  totalMachines: number;
  totalOperators: number;
  activeMachines: number;
  warningMachines: number;
  downMachines: number;
  totalConnections: number;
  operatorConnections: number;
  machineConnections: number;
}

interface ExportedFlowData {
  version: string;
  exportedAt: string;
  appName: string;
  nodes: ExportedNodeData[];
  edges: ExportedEdgeData[];
  viewMode: 'default' | 'shapes';
  metadata?: FlowMetadata;
}

interface EmbeddableFlowProps {
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
  formations?: Record<number, number[]>; // NEW: Formasi operator
}

// =============================================
// STATUS COLOR CONFIG
// =============================================

const statusConfig: Record<string, {
  bg: string;
  border: string;
  text: string;
  dot: string;
  label: string;
}> = {
  active: {
    bg: '#f0fdf4',
    border: '#22c55e',
    text: '#166534',
    dot: '#22c55e',
    label: 'Running',
  },
  idle: {
    bg: '#f8fafc',
    border: '#94a3b8',
    text: '#475569',
    dot: '#94a3b8',
    label: 'Idle',
  },
  warning: {
    bg: '#fffbeb',
    border: '#f59e0b',
    text: '#92400e',
    dot: '#f59e0b',
    label: 'Warning',
  },
  down: {
    bg: '#fef2f2',
    border: '#ef4444',
    text: '#991b1b',
    dot: '#ef4444',
    label: 'Down',
  },
};

// =============================================
// MACHINE NODE COMPONENT (Embedded Version)
// =============================================

const EmbedMachineNode: React.FC<{ 
  data: any; 
  selected?: boolean;
  onClick?: (event: React.MouseEvent, nodeId: string) => void;
}> = ({ data, selected }) => {
  const status = data.status || 'idle';
  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div
      className="embed-machine-node"
      style={{
        padding: '10px 14px',
        borderRadius: '10px',
        border: `2px solid ${selected ? '#3b82f6' : config.border}`,
        backgroundColor: '#ffffff',
        boxShadow: selected 
          ? '0 0 0 2px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(0,0,0,0.1)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        width: 180,
        fontSize: 11,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Handles - Left */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          top: '50%',
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          top: '50%',
        }}
      />

      {/* Handles - Right */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          top: '50%',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          top: '50%',
        }}
      />

      {/* Handles - Top */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          left: '50%',
        }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          left: '50%',
        }}
      />

      {/* Handles - Bottom */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          left: '50%',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{
          width: 10,
          height: 10,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          left: '50%',
        }}
      />

      {/* Content */}
      <div style={{
        backgroundColor: config.bg,
        borderRadius: '6px',
        padding: '8px 10px',
        border: `1px solid ${config.border}40`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{
            color: '#64748b',
            fontWeight: 700,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            ⚙ Machine
          </span>
          <span style={{
            color: config.text,
            fontSize: 9,
            fontWeight: 700,
            backgroundColor: config.bg,
            padding: '2px 8px',
            borderRadius: '10px',
            border: `1px solid ${config.border}60`,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: config.dot,
              display: 'inline-block',
            }} />
            {config.label}
          </span>
        </div>

        {/* Label */}
        <div style={{
          fontWeight: 700,
          color: '#1e293b',
          fontSize: 12,
          marginBottom: 2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {data.label || 'Unnamed Machine'}
        </div>

        {/* Throughput */}
        {data.throughput !== undefined && data.throughput !== null && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            padding: '4px 8px',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>Throughput</span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#1e293b',
            }}>
              {data.throughput}
              <span style={{ fontSize: 8, color: '#94a3b8', fontWeight: 400 }}> pcs/min</span>
            </span>
          </div>
        )}

        {/* Capacity bar */}
        {data.capacity !== undefined && data.capacity > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 8,
              color: '#94a3b8',
              marginBottom: 2,
            }}>
              <span>Capacity</span>
              <span>{Math.round((data.throughput || 0) / data.capacity * 100)}%</span>
            </div>
            <div style={{
              width: '100%',
              height: 3,
              backgroundColor: '#e2e8f0',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(100, Math.round((data.throughput || 0) / data.capacity * 100))}%`,
                height: '100%',
                backgroundColor: config.border,
                borderRadius: '2px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================
// OPERATOR NODE COMPONENT (Embedded Version)
// =============================================

const EmbedOperatorNode: React.FC<{ 
  data: any; 
  selected?: boolean;
  onClick?: (event: React.MouseEvent, nodeId: string) => void;
}> = ({ data, selected }) => {
  const color = data.color || '#a855f7';

  return (
    <div
      className="embed-operator-node"
      style={{
        padding: '10px 14px',
        borderRadius: '10px',
        border: `2px solid ${selected ? '#3b82f6' : color}80`,
        backgroundColor: `${color}10`,
        boxShadow: selected
          ? '0 0 0 2px rgba(168, 85, 247, 0.2), 0 4px 12px rgba(0,0,0,0.1)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        width: 150,
        fontSize: 11,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Handles - Left */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          border: '2px solid white',
          top: '40%',
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          border: '2px solid white',
          top: '60%',
        }}
      />

      {/* Handles - Right */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          border: '2px solid white',
          top: '40%',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          border: '2px solid white',
          top: '60%',
        }}
      />

      {/* Handles - Top */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          border: '2px solid white',
          left: '40%',
        }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          border: '2px solid white',
          left: '60%',
        }}
      />

      {/* Handles - Bottom */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          border: '2px solid white',
          left: '40%',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{
          width: 10,
          height: 10,
          backgroundColor: color,
          border: '2px solid white',
          left: '60%',
        }}
      />

      {/* Content */}
      <div style={{ textAlign: 'center' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 14 }}>👤</span>
          <span style={{
            color,
            fontWeight: 700,
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Operator
          </span>
        </div>

        {/* Label */}
        <div style={{
          fontWeight: 700,
          color,
          fontSize: 12,
          marginBottom: 8,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {data.label || `Operator ${data.operatorId || ''}`}
        </div>

        {/* ID & Process Box */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          padding: '6px',
          borderRadius: '6px',
          backgroundColor: `${color}15`,
          border: `1px solid ${color}25`,
        }}>
          {/* ID */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color,
              fontSize: 7,
              opacity: 0.7,
              marginBottom: 2,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              ID
            </div>
            <div style={{
              color,
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1,
            }}>
              {data.operatorId || '-'}
            </div>
          </div>

          {/* Process */}
          <div style={{
            textAlign: 'center',
            borderLeft: `1px solid ${color}20`,
          }}>
            <div style={{
              color,
              fontSize: 7,
              opacity: 0.7,
              marginBottom: 2,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}>
              Process
            </div>
            <div style={{
              color,
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1,
            }}>
              {data.process || '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// NODE TYPES REGISTRATION
// =============================================

const nodeTypes = {
  machineNode: EmbedMachineNode,
  operatorNode: EmbedOperatorNode,
};

// =============================================
// MAIN EMBEDDABLE FLOW COMPONENT
// =============================================

const EmbeddableFlow: React.FC<EmbeddableFlowProps> = ({
  data,
  width = '100%',
  height = 600,
  readOnly = true,
  showControls = true,
  showMiniMap = true,
  showBackground = true,
  className = '',
  style = {},
  onNodeClick,
  onEdgeClick,
  formations,
}) => {
  
  // =============================================
  // Convert exported data ke ReactFlow format
  // =============================================
  
  const nodes: Node[] = useMemo(() => {
    if (!data?.nodes || !Array.isArray(data.nodes)) return [];
    
    return data.nodes.map((node, index) => {
      // Tentukan tipe node
      const nodeType = node.type === 'operator' ? 'operatorNode' : 'machineNode';
      
      // Build data untuk node
      const nodeData: any = {
        ...node,
        // Jika ada formations, tandai operator mana yang assigned
        formationInfo: undefined,
      };

      // Jika ada formations dan ini operator node, cari formasi yang sesuai
      if (formations && node.type === 'operator' && node.operatorId) {
        const assignedFormation = Object.entries(formations).find(
          ([_, processes]) => processes.includes(node.process || 0)
        );
        if (assignedFormation) {
          nodeData.formationInfo = {
            formationId: assignedFormation[0],
            processes: assignedFormation[1],
          };
        }
      }

      return {
        id: node.id,
        type: nodeType,
        position: {
          x: node.position?.x || 0,
          y: node.position?.y || 0,
        },
        data: nodeData,
        draggable: !readOnly,
        selectable: !readOnly,
        // Style tambahan jika ada formasi
        style: nodeData.formationInfo ? {
          border: '2px solid #3b82f6',
          borderRadius: '10px',
        } : undefined,
      };
    });
  }, [data, readOnly, formations]);

  // =============================================
  // Convert edges ke ReactFlow format
  // =============================================
  
  const edges: Edge[] = useMemo(() => {
    if (!data?.edges || !Array.isArray(data.edges)) return [];
    
    return data.edges.map((edge) => {
      const isOperatorEdge = edge.type === 'operator';
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || 'bottom-source',
        targetHandle: edge.targetHandle || 'top-target',
        type: 'smoothstep',
        animated: edge.style?.animated || isOperatorEdge,
        style: {
          stroke: edge.style?.stroke || (isOperatorEdge ? '#a855f7' : '#1e293b'),
          strokeWidth: edge.style?.strokeWidth || 2,
          strokeDasharray: edge.style?.strokeDasharray || (isOperatorEdge ? '6,4' : 'none'),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.style?.stroke || (isOperatorEdge ? '#a855f7' : '#1e293b'),
          width: 12,
          height: 12,
        },
        label: edge.label || undefined,
        labelStyle: {
          fontSize: 9,
          fontWeight: 600,
          fill: edge.style?.stroke || '#a855f7',
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.9,
        },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        data: {
          operatorId: edge.operatorId,
          edgeType: edge.type,
        },
      };
    });
  }, [data]);

  // =============================================
  // Event Handlers
  // =============================================
  
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeClick && data?.nodes) {
        const nodeData = data.nodes.find(n => n.id === node.id);
        if (nodeData) {
          onNodeClick(node.id, nodeData);
        }
      }
    },
    [onNodeClick, data]
  );

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (onEdgeClick && data?.edges) {
        const edgeData = data.edges.find(e => e.id === edge.id);
        if (edgeData) {
          onEdgeClick(edge.id, edgeData);
        }
      }
    },
    [onEdgeClick, data]
  );

  // =============================================
  // Render: Empty State
  // =============================================
  
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div
        className={`embed-flow-empty ${className}`}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #e2e8f0',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          ...style,
        }}
      >
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ margin: '0 auto 12px', opacity: 0.5 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            No Flow Data
          </p>
          <p style={{ fontSize: 11 }}>
            Import a Flow2D export to visualize the layout
          </p>
        </div>
      </div>
    );
  }

  // =============================================
  // Render: Flow
  // =============================================
  
  return (
    <div
      className={`embed-flow-container ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        ...style,
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        fitViewOptions={{
          padding: 0.3,
          maxZoom: 1.5,
          minZoom: 0.3,
        }}
        nodesDraggable={!readOnly}
        nodesConnectable={false}
        elementsSelectable={!readOnly}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnDoubleClick={true}
        preventScrolling={true}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        {/* Background Grid */}
        {showBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#cbd5e1"
          />
        )}

        {/* Controls (Zoom, Fit View, etc.) */}
        {showControls && (
          <Controls
            showInteractive={false}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
        )}

        {/* Mini Map */}
        {showMiniMap && (
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'operatorNode') {
                return (n.data as any)?.color || '#a855f7';
              }
              const status = (n.data as any)?.status;
              if (status === 'active') return '#22c55e';
              if (status === 'warning') return '#f59e0b';
              if (status === 'down') return '#ef4444';
              return '#94a3b8';
            }}
            maskColor="rgba(241, 245, 249, 0.7)"
            style={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            nodeStrokeWidth={2}
          />
        )}
      </ReactFlow>

      {/* ============================================= */}
      {/* INFO BADGE - Top Left */}
      {/* ============================================= */}
      <div
        className="embed-flow-badge"
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          fontSize: 10,
          color: '#64748b',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 700, color: '#3b82f6' }}>
          Flow2D
        </span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span>
          {data.nodes.length} <span style={{ color: '#94a3b8' }}>nodes</span>
        </span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span>
          {data.edges.length} <span style={{ color: '#94a3b8' }}>connections</span>
        </span>
        {data.metadata && (
          <>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ color: '#22c55e', fontWeight: 600 }}>
              {data.metadata.activeMachines} active
            </span>
          </>
        )}
      </div>

      {/* ============================================= */}
      {/* FORMATION BADGE - Top Right (jika ada) */}
      {/* ============================================= */}
      {formations && Object.keys(formations).length > 0 && (
        <div
          className="embed-formation-badge"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(59, 130, 246, 0.95)',
            backdropFilter: 'blur(4px)',
            padding: '6px 12px',
            borderRadius: '8px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            fontSize: 10,
            color: 'white',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>👥</span>
          <span style={{ fontWeight: 600 }}>
            {Object.keys(formations).length} Formations
          </span>
        </div>
      )}

      {/* ============================================= */}
      {/* LEGEND - Bottom Left */}
      {/* ============================================= */}
      <div
        className="embed-legend"
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          fontSize: 9,
          color: '#64748b',
          zIndex: 10,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          <span>Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#94a3b8' }} />
          <span>Idle</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
          <span>Warning</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <span>Down</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#a855f7' }} />
          <span>Operator</span>
        </div>
      </div>
    </div>
  );
};

// =============================================
// EXPORT
// =============================================

export default EmbeddableFlow;

// Named exports untuk digunakan di tempat lain
export { EmbedMachineNode, EmbedOperatorNode };
export type { 
  ExportedFlowData, 
  ExportedNodeData, 
  ExportedEdgeData, 
  FlowMetadata, 
  EmbeddableFlowProps 
};