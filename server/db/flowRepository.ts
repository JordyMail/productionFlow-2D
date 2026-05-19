// server/db/flowRepository.ts
import { executeProc } from './connection';
import { ExportedFlowData, ExportedNodeData, ExportedEdgeData, FlowMetadata } from '../../shared/types';

interface FlowSaveInput {
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  nodeTemplates: Record<string, string>;
  viewMode: string;
  version?: string;
  createdBy?: string;
}

export class FlowRepository {

  /**
   * Mendapatkan semua flow saves
   */
  static async getAllFlows(includeInactive: boolean = false): Promise<any[]> {
    try {
      const rows = await executeProc<any>('flow2d_sp_GetAllFlows', {
        IncludeInactive: includeInactive ? 1 : 0,
      });

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        viewMode: row.view_mode || 'default',
        version: row.version || '1.0',
        nodeCount: row.node_count || 0,
        edgeCount: row.edge_count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by || 'system',
        isActive: row.is_active,
      }));
    } catch (error: any) {
      console.error('[FlowRepo] Error getting all flows:', error.message);
      throw new Error(`Failed to fetch flows: ${error.message}`);
    }
  }

  /**
   * Mendapatkan flow berdasarkan ID (dengan data lengkap)
   */
  static async getFlowById(id: string): Promise<ExportedFlowData | null> {
    try {
      const rows = await executeProc<any>('flow2d_sp_GetFlowById', {
        FlowId: id,
      });

      if (rows.length === 0) return null;
      return this.mapRowToExportedFlow(rows[0]);
    } catch (error: any) {
      console.error(`[FlowRepo] Error getting flow ${id}:`, error.message);
      throw new Error(`Failed to fetch flow: ${error.message}`);
    }
  }

  /**
   * Mendapatkan flow terbaru
   */
  static async getLatestFlow(): Promise<ExportedFlowData | null> {
    try {
      const rows = await executeProc<any>('flow2d_sp_GetLatestFlow');

      if (rows.length === 0) return null;
      return this.mapRowToExportedFlow(rows[0]);
    } catch (error: any) {
      console.error('[FlowRepo] Error getting latest flow:', error.message);
      throw new Error(`Failed to fetch latest flow: ${error.message}`);
    }
  }

  /**
   * Menyimpan flow (insert atau update)
   */
  static async saveFlow(data: FlowSaveInput): Promise<{ action: string; id: string }> {
    try {
      // Generate ID jika tidak ada
      const id = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      let nodesJson: string;
      let edgesJson: string;
      let nodeTemplatesJson: string | null = null;

      try {
        nodesJson = JSON.stringify(data.nodes);
        edgesJson = JSON.stringify(data.edges);
      } catch {
        throw new Error('Invalid nodes/edges data: cannot serialize to JSON');
      }

      if (data.nodeTemplates && Object.keys(data.nodeTemplates).length > 0) {
        try {
          nodeTemplatesJson = JSON.stringify(data.nodeTemplates);
        } catch {
          throw new Error('Invalid nodeTemplates data: cannot serialize to JSON');
        }
      }

      const rows = await executeProc<any>('flow2d_sp_UpsertFlow', {
        Id: id,
        Name: data.name,
        Description: data.description || null,
        Nodes: nodesJson,
        Edges: edgesJson,
        NodeTemplates: nodeTemplatesJson,
        ViewMode: data.viewMode || 'default',
        Version: data.version || '2.0.0',
        UpdatedBy: data.createdBy || 'system',
      });

      return {
        action: rows[0]?.action || 'inserted',
        id: rows[0]?.id || id,
      };
    } catch (error: any) {
      console.error('[FlowRepo] Error saving flow:', error.message);
      throw new Error(`Failed to save flow: ${error.message}`);
    }
  }

  /**
   * Menghapus flow (soft delete)
   */
  static async deleteFlow(id: string, hardDelete: boolean = false): Promise<number> {
    try {
      const rows = await executeProc<any>('flow2d_sp_DeleteFlow', {
        FlowId: id,
        HardDelete: hardDelete ? 1 : 0,
      });

      return rows[0]?.affected_rows || 0;
    } catch (error: any) {
      console.error(`[FlowRepo] Error deleting flow ${id}:`, error.message);
      throw new Error(`Failed to delete flow: ${error.message}`);
    }
  }

  /**
   * Mapping database row ke ExportedFlowData
   */
  private static mapRowToExportedFlow(row: any): ExportedFlowData {
    let nodes: any[] = [];
    let edges: any[] = [];
    let nodeTemplates: Record<string, string> = {};

    // Parse nodes JSON
    if (row.nodes) {
      try {
        nodes = typeof row.nodes === 'string' ? JSON.parse(row.nodes) : row.nodes;
      } catch {
        nodes = [];
      }
    }

    // Parse edges JSON
    if (row.edges) {
      try {
        edges = typeof row.edges === 'string' ? JSON.parse(row.edges) : row.edges;
      } catch {
        edges = [];
      }
    }

    // Parse nodeTemplates JSON
    if (row.node_templates) {
      try {
        nodeTemplates = typeof row.node_templates === 'string' ? JSON.parse(row.node_templates) : row.node_templates;
      } catch {
        nodeTemplates = {};
      }
    }

    // Build exported nodes
    const exportedNodes: ExportedNodeData[] = nodes.map((node: any) => {
      const isOperator = node.type === 'operatorNode' || node.type === 'shapeOperatorNode';
      const data = node.data || {};

      const base: ExportedNodeData = {
        id: node.id,
        type: isOperator ? 'operator' : 'machine',
        label: data.label || `Node ${node.id?.substring(0, 8) || 'unknown'}`,
        position: {
          x: node.position?.x || 0,
          y: node.position?.y || 0,
        },
        handles: data.handles,
      };

      if (isOperator) {
        base.operatorId = data.id;
        base.process = data.process;
        base.color = data.color;
        base.chairDesign = data.chairDesign;
        base.width = data.chairDesign?.chairWidth || 80;
        base.height = (data.chairDesign?.chairHeight || 100) + 30;
      } else {
        base.status = data.status || 'idle';
        base.throughput = data.throughput || 0;
        base.capacity = data.capacity || 100;
        base.templateId = data.template?.id;
        base.frameRotation = data.frameRotation || 0;
        base.width = data.template?.width || 220;
        base.height = data.template?.height || 140;
      }

      return base;
    });

    // Build exported edges
    const exportedEdges: ExportedEdgeData[] = edges.map((edge: any) => {
      const sourceNode = nodes.find((n: any) => n.id === edge.source);
      const targetNode = nodes.find((n: any) => n.id === edge.target);
      
      const isSourceOperator = sourceNode?.type === 'operatorNode';
      const isTargetOperator = targetNode?.type === 'operatorNode';
      
      let type: 'machine' | 'operator' | 'mixed';
      if (isSourceOperator && isTargetOperator) type = 'operator';
      else if (!isSourceOperator && !isTargetOperator) type = 'machine';
      else type = 'mixed';

      const edgeData: ExportedEdgeData = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || 'bottom-source',
        targetHandle: edge.targetHandle || 'top-target',
        type,
        style: {
          stroke: (edge.style?.stroke as string) || (type === 'operator' ? '#a855f7' : '#1e293b'),
          strokeWidth: (edge.style?.strokeWidth as number) || 2,
          strokeDasharray: edge.style?.strokeDasharray as string,
          animated: edge.animated || false,
        },
      };

      if (edge.data?.operatorId) {
        edgeData.operatorId = edge.data.operatorId;
        edgeData.label = `P${edge.data.sourceProcess} → P${edge.data.targetProcess}`;
      }

      return edgeData;
    });

    // Build metadata
    const machineNodes = exportedNodes.filter(n => n.type === 'machine');
    const operatorNodes = exportedNodes.filter(n => n.type === 'operator');
    const operatorEdges = exportedEdges.filter(e => e.type === 'operator');
    const machineEdges = exportedEdges.filter(e => e.type === 'machine');

    const metadata: FlowMetadata = {
      totalMachines: machineNodes.length,
      totalOperators: operatorNodes.length,
      activeMachines: machineNodes.filter(n => n.status === 'active').length,
      warningMachines: machineNodes.filter(n => n.status === 'warning').length,
      downMachines: machineNodes.filter(n => n.status === 'down').length,
      totalConnections: exportedEdges.length,
      operatorConnections: operatorEdges.length,
      machineConnections: machineEdges.length,
    };

    return {
      version: row.version || '2.0.0',
      exportedAt: new Date(row.updated_at || Date.now()).toISOString(),
      appName: 'Flow2D',
      nodes: exportedNodes,
      edges: exportedEdges,
      viewMode: row.view_mode || 'default',
      metadata,
    };
  }
}