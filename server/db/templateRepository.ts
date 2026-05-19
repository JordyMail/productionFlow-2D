// server/db/templateRepository.ts
import { executeProc, executeQuery } from './connection';
import { MachineTemplate, Shape } from '../../shared/types';

export class TemplateRepository {
  
  static async getAllTemplates(includeInactive: boolean = false): Promise<MachineTemplate[]> {
    try {
      // Gunakan nama SP yang sudah di-prefix
      const rows = await executeProc<any>('flow2d_sp_GetAllTemplates', {
        IncludeInactive: includeInactive ? 1 : 0,
      });
      return rows.map(row => this.mapRowToTemplate(row));
    } catch (error: any) {
      console.error('[TemplateRepo] Error getting all templates:', error.message);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
  }

  static async getTemplateById(id: string): Promise<MachineTemplate | null> {
    try {
      const rows = await executeProc<any>('flow2d_sp_GetTemplateById', {
        TemplateId: id,
      });
      if (rows.length === 0) return null;
      return this.mapRowToTemplate(rows[0]);
    } catch (error: any) {
      console.error(`[TemplateRepo] Error getting template ${id}:`, error.message);
      throw new Error(`Failed to fetch template: ${error.message}`);
    }
  }

  static async saveTemplate(template: MachineTemplate, updatedBy?: string): Promise<{ action: string; id: string }> {
    try {
      let shapesJson: string;
      try {
        shapesJson = JSON.stringify(template.shapes);
      } catch {
        throw new Error('Invalid shapes data: cannot serialize to JSON');
      }

      let tagsJson: string | null = null;
      if (template.tags && template.tags.length > 0) {
        try {
          tagsJson = JSON.stringify(template.tags);
        } catch {
          throw new Error('Invalid tags data: cannot serialize to JSON');
        }
      }

      const rows = await executeProc<any>('flow2d_sp_UpsertTemplate', {
        Id: template.id,
        Name: template.name,
        Description: template.description || null,
        Thumbnail: template.thumbnail || null,
        Shapes: shapesJson,
        Width: template.width || 200,
        Height: template.height || 200,
        FrameType: template.frameType || 'rectangle',
        FrameColor: template.frameColor || '#f8fafc',
        FrameStrokeColor: template.frameStrokeColor || '#3b82f6',
        FrameStrokeWidth: template.frameStrokeWidth || 2,
        FrameRotation: template.frameRotation || 0,
        Tags: tagsJson,
        UpdatedBy: updatedBy || 'system',
      });

      return {
        action: rows[0]?.action || 'unknown',
        id: rows[0]?.id || template.id,
      };
    } catch (error: any) {
      console.error('[TemplateRepo] Error saving template:', error.message);
      throw new Error(`Failed to save template: ${error.message}`);
    }
  }

  static async deleteTemplate(id: string, hardDelete: boolean = false): Promise<number> {
    try {
      const rows = await executeProc<any>('flow2d_sp_DeleteTemplate', {
        TemplateId: id,
        HardDelete: hardDelete ? 1 : 0,
      });
      return rows[0]?.affected_rows || 0;
    } catch (error: any) {
      console.error(`[TemplateRepo] Error deleting template ${id}:`, error.message);
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  static async duplicateTemplate(sourceId: string, newId: string, newName: string): Promise<{ affectedRows: number; newId: string }> {
    try {
      const rows = await executeProc<any>('flow2d_sp_DuplicateTemplate', {
        SourceId: sourceId,
        NewId: newId,
        NewName: newName,
      });
      return {
        affectedRows: rows[0]?.affected_rows || 0,
        newId: rows[0]?.new_id || newId,
      };
    } catch (error: any) {
      console.error(`[TemplateRepo] Error duplicating template ${sourceId}:`, error.message);
      throw new Error(`Failed to duplicate template: ${error.message}`);
    }
  }

  private static mapRowToTemplate(row: any): MachineTemplate {
    let shapes: Shape[] = [];
    let tags: string[] = [];

    if (row.shapes) {
      try {
        shapes = typeof row.shapes === 'string' ? JSON.parse(row.shapes) : row.shapes;
      } catch (e) {
        console.warn(`[TemplateRepo] Failed to parse shapes for template ${row.id}`);
        shapes = [];
      }
    }

    if (row.tags) {
      try {
        tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
      } catch (e) {
        console.warn(`[TemplateRepo] Failed to parse tags for template ${row.id}`);
        tags = [];
      }
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      thumbnail: row.thumbnail || undefined,
      shapes,
      width: row.width || 200,
      height: row.height || 200,
      frameType: row.frameType || 'rectangle',
      frameColor: row.frameColor || '#f8fafc',
      frameStrokeColor: row.frameStrokeColor || '#3b82f6',
      frameStrokeWidth: row.frameStrokeWidth || 2,
      frameRotation: row.frameRotation || 0,
      tags,
      createdAt: row.createdAt || Date.now(),
      updatedAt: row.updatedAt || Date.now(),
    };
  }
}