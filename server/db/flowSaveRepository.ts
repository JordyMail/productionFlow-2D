// server/db/flowSaveRepository.ts
import { executeProc } from './connection';

interface FlowSaveData {
  id: string;
  lineId: string;
  lineName?: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  nodeTemplates?: Record<string, string>;
  formations?: any;
  viewMode?: string;
}

interface SavedLine {
  lineId: string;
  lineName?: string;
  flowName?: string;
  lastUpdated: number;
  versionCount: number;
  latestFlowId: string;
}

export class FlowSaveRepository {
  
  /**
   * Menyimpan flow berdasarkan line_id
   */
  static async saveFlowByLine(data: FlowSaveData): Promise<any> {
    try {
      const rows = await executeProc<any>('flow2d_sp_SaveFlowByLine', {
        Id: data.id,
        LineId: data.lineId,
        LineName: data.lineName || null,
        Name: data.name,
        Description: data.description || null,
        Nodes: JSON.stringify(data.nodes),
        Edges: JSON.stringify(data.edges),
        NodeTemplates: data.nodeTemplates ? JSON.stringify(data.nodeTemplates) : null,
        Formations: data.formations ? JSON.stringify(data.formations) : null,
        ViewMode: data.viewMode || 'default',
        CreatedBy: 'flow2d-app',
      });

      return rows[0] || null;
    } catch (error: any) {
      console.error('[FlowSaveRepo] Error saving flow:', error.message);
      throw new Error(`Failed to save flow: ${error.message}`);
    }
  }

  /**
   * Mendapatkan flow terbaru berdasarkan line_id
   */
  static async getFlowByLineId(lineId: string): Promise<any | null> {
    try {
      const rows = await executeProc<any>('flow2d_sp_GetFlowByLineId', {
        LineId: lineId,
      });

      if (rows.length === 0) return null;

      const row = rows[0];
      
      // Parse JSON fields
      return {
        ...row,
        nodes: row.nodes ? JSON.parse(row.nodes) : [],
        edges: row.edges ? JSON.parse(row.edges) : [],
        nodeTemplates: row.nodeTemplates ? JSON.parse(row.nodeTemplates) : {},
        formations: row.formations ? JSON.parse(row.formations) : null,
      };
    } catch (error: any) {
      console.error('[FlowSaveRepo] Error getting flow:', error.message);
      throw new Error(`Failed to fetch flow: ${error.message}`);
    }
  }

  /**
   * Mendapatkan semua versi flow berdasarkan line_id
   */
  static async getFlowHistoryByLineId(lineId: string): Promise<any[]> {
    try {
      const rows = await executeProc<any>('flow2d_sp_GetFlowHistoryByLineId', {
        LineId: lineId,
      });

      return rows.map(row => ({
        ...row,
        nodes: row.nodes ? JSON.parse(row.nodes) : [],
        edges: row.edges ? JSON.parse(row.edges) : [],
        nodeTemplates: row.nodeTemplates ? JSON.parse(row.nodeTemplates) : {},
        formations: row.formations ? JSON.parse(row.formations) : null,
      }));
    } catch (error: any) {
      console.error('[FlowSaveRepo] Error getting flow history:', error.message);
      throw new Error(`Failed to fetch flow history: ${error.message}`);
    }
  }

  /**
   * Mendapatkan daftar semua line yang memiliki saved flow
   */
  static async getAllSavedLines(): Promise<SavedLine[]> {
    try {
      const rows = await executeProc<any>('flow2d_sp_GetAllSavedLines');
      return rows;
    } catch (error: any) {
      console.error('[FlowSaveRepo] Error getting saved lines:', error.message);
      throw new Error(`Failed to fetch saved lines: ${error.message}`);
    }
  }

  /**
   * Menghapus flow berdasarkan line_id
   */
  static async deleteFlowByLineId(lineId: string, hardDelete: boolean = false): Promise<number> {
    try {
      const rows = await executeProc<any>('flow2d_sp_DeleteFlowByLineId', {
        LineId: lineId,
        HardDelete: hardDelete ? 1 : 0,
      });
      return rows[0]?.affected_rows || 0;
    } catch (error: any) {
      console.error('[FlowSaveRepo] Error deleting flow:', error.message);
      throw new Error(`Failed to delete flow: ${error.message}`);
    }
  }
}