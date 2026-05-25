// ini ngak dipakai bang gans!
// client/components/export/EmbeddableFlowStandalone.tsx
// =============================================
// STANDALONE COMPONENT - Bisa di-copy ke aplikasi lain
// Tidak memiliki dependensi ke productionFlow-2D store
// Hanya perlu React + ReactFlow + fetch API
// =============================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// =============================================
// TYPES (standalone - tidak import dari shared/types)
// =============================================

interface FlowNodeData {
  id: string;
  type: 'machine' | 'operator';
  label: string;
  position: { x: number; y: number };
  status?: string;
  throughput?: number;
  operatorId?: number;
  process?: number;
  color?: string;
  width?: number;
  height?: number;
}

interface FlowEdgeData {
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
}

interface FlowData {
  version: string;
  exportedAt: string;
  nodes: FlowNodeData[];
  edges: FlowEdgeData[];
  metadata?: {
    totalMachines: number;
    totalOperators: number;
    activeMachines: number;
    totalConnections: number;
  };
}

// =============================================
// SIMPLE NODE COMPONENTS (no external deps)
// =============================================

const EmbedMachineNode: React.FC<{ data: any }> = ({ data }) => {
  const statusColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    active: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#22c55e' },
    idle: { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', dot: '#94a3b8' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
    down: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#ef4444' },
  };

  const colors = statusColors[data.status] || statusColors.idle;

  return (
    <div style={{
      padding: '12px 16px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      backgroundColor: 'white',
      border: `2px solid ${colors.border}`,
      width: '200px',
    }}>
      <div style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        padding: '8px 12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: '#64748b' }}>
            Machine
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '999px',
            backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: colors.dot }} />
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: colors.text }}>
              {data.status?.charAt(0).toUpperCase() + data.status?.slice(1) || 'Idle'}
            </span>
          </div>
        </div>
        <h3 style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.label}
        </h3>
        {data.throughput !== undefined && (
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#94a3b8' }}>Throughput</span>
            <span style={{ fontWeight: 'bold', color: '#334155' }}>{data.throughput} pcs/min</span>
          </div>
        )}
      </div>
    </div>
  );
};

const EmbedOperatorNode: React.FC<{ data: any }> = ({ data }) => {
  const color = data.color || '#a855f7';

  return (
    <div style={{
      padding: '12px 16px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      border: `2px solid ${color}80`,
      backgroundColor: `${color}15`,
      width: '160px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color }}>
          Operator
        </span>
      </div>
      <h3 style={{ fontWeight: 'bold', fontSize: '14px', margin: 0, color, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || `Operator ${data.operatorId}`}
      </h3>
      <div style={{
        marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        padding: '8px', borderRadius: '6px', border: `1px solid ${color}30`,
        backgroundColor: `${color}10`,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', opacity: 0.7, color }}>ID</div>
          <div style={{ fontWeight: 'bold', fontSize: '18px', color }}>{data.operatorId}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', opacity: 0.7, color }}>Process</div>
          <div style={{ fontWeight: 'bold', fontSize: '18px', color }}>{data.process}</div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// PROPS
// =============================================

interface EmbeddableFlowStandaloneProps {
  /**
   * API URL untuk fetch flow data
   * Contoh: "http://localhost:3000/api/flows/latest"
   * Atau: "http://10.125.20.42:3000/api/flows/latest"
   */
  apiUrl?: string;
  
  /**
   * Atau bisa langsung provide data (tanpa fetch)
   */
  data?: FlowData;
  
  /**
   * Flow ID spesifik (jika tidak mau latest)
   */
  flowId?: string;
  
  width?: number | string;
  height?: number | string;
  readOnly?: boolean;
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
  className?: string;
  style?: React.CSSProperties;
  refreshInterval?: number;
}

// =============================================
// COMPONENT
// =============================================

const EmbeddableFlowStandalone: React.FC<EmbeddableFlowStandaloneProps> = ({
  apiUrl,
  data: providedData,
  flowId,
  width = '100%',
  height = 600,
  readOnly = true,
  showControls = true,
  showMiniMap = true,
  showBackground = true,
  className = '',
  style = {},
  refreshInterval = 0,
}) => {
  const [flowData, setFlowData] = useState<FlowData | null>(providedData || null);
  const [loading, setLoading] = useState(!providedData);
  const [error, setError] = useState<string | null>(null);

  // Fetch data dari API (jika apiUrl disediakan dan tidak ada providedData)
  const fetchData = useCallback(async () => {
    if (providedData) {
      setFlowData(providedData);
      setLoading(false);
      return;
    }

    if (!apiUrl) {
      // Build default API URL
      const baseUrl = window.location.origin;
      const endpoint = flowId ? `/api/flows/${flowId}` : '/api/flows/latest';
      apiUrl = `${baseUrl}${endpoint}`;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setFlowData(result.data);
      } else if (result.nodes) {
        // Direct flow data (without wrapper)
        setFlowData(result);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('[EmbeddableFlow] Fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, flowId, providedData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && apiUrl) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchData, apiUrl]);

  // Convert to ReactFlow format
  const nodes: Node[] = useMemo(() => {
    if (!flowData?.nodes) return [];
    
    return flowData.nodes.map(node => ({
      id: node.id,
      type: node.type === 'machine' ? 'machineNode' : 'operatorNode',
      position: node.position,
      data: {
        label: node.label,
        status: node.status || 'idle',
        throughput: node.throughput,
        operatorId: node.operatorId,
        process: node.process,
        color: node.color,
      },
      draggable: !readOnly,
      selectable: !readOnly,
    }));
  }, [flowData, readOnly]);

  const edges: Edge[] = useMemo(() => {
    if (!flowData?.edges) return [];
    
    return flowData.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: 'smoothstep',
      animated: edge.style?.animated || false,
      style: {
        stroke: edge.style?.stroke || '#1e293b',
        strokeWidth: edge.style?.strokeWidth || 2,
        strokeDasharray: edge.style?.strokeDasharray,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edge.style?.stroke || '#1e293b',
        width: 12,
        height: 12,
      },
      label: edge.label,
    }));
  }, [flowData]);

  const nodeTypes = useMemo(() => ({
    machineNode: EmbedMachineNode,
    operatorNode: EmbedOperatorNode,
  }), []);

  // Loading
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px dashed #e2e8f0', borderRadius: '8px',
        backgroundColor: '#f8fafc', width, height, ...style,
      }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{
            width: '32px', height: '32px', border: '2px solid #e2e8f0',
            borderTopColor: '#3b82f6', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Loading Flow Data...</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Fetching from server</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px dashed #fecaca', borderRadius: '8px',
        backgroundColor: '#fef2f2', width, height, ...style,
      }}>
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Failed to Load Flow</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>{error}</p>
          <button
            onClick={fetchData}
            style={{
              marginTop: '12px', padding: '6px 16px', fontSize: '12px',
              backgroundColor: 'white', border: '1px solid #fecaca',
              borderRadius: '6px', cursor: 'pointer', color: '#dc2626',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data
  if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px dashed #e2e8f0', borderRadius: '8px',
        backgroundColor: '#f8fafc', width, height, ...style,
      }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: '14px', fontWeight: 500 }}>No Flow Data</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            Save a flow layout in Flow2D first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: '8px',
      overflow: 'hidden', position: 'relative', width, height, ...style,
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={!readOnly}
        nodesConnectable={false}
        elementsSelectable={!readOnly}
        panOnDrag={!readOnly}
        zoomOnScroll={!readOnly}
        zoomOnDoubleClick={!readOnly}
        preventScrolling={readOnly}
        attributionPosition="bottom-right"
      >
        {showBackground && (
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        )}
        {showControls && <Controls showInteractive={false} />}
        {showMiniMap && (
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'operatorNode') return '#a855f7';
              if (n.data?.status === 'active') return '#22c55e';
              if (n.data?.status === 'warning') return '#f59e0b';
              if (n.data?.status === 'down') return '#ef4444';
              return '#94a3b8';
            }}
            maskColor="rgba(241, 245, 249, 0.7)"
          />
        )}
      </ReactFlow>

      {/* Info badge */}
      <div style={{
        position: 'absolute', top: '8px', left: '8px',
        backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
        padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: '10px', color: '#64748b',
        zIndex: 10,
      }}>
        Flow2D · {flowData.nodes.length} nodes · {flowData.edges.length} connections
      </div>
    </div>
  );
};

// Add spin animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
  
export default EmbeddableFlowStandalone;