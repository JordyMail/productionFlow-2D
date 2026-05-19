// server/routes/templates.ts
import { Router, Request, Response } from 'express';
import { TemplateRepository } from '../db/templateRepository';
import { checkConnection } from '../db/connection';

const router = Router();

// Type untuk response standar
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// Helper untuk membuat response
const createResponse = <T>(success: boolean, message: string, data?: T, error?: string): ApiResponse<T> => ({
  success,
  message,
  ...(data !== undefined && { data }),
  ...(error && { error }),
  timestamp: new Date().toISOString(),
});

// Middleware: Check database health
const checkDbHealth = async (req: Request, res: Response, next: Function) => {
  try {
    const isConnected = await checkConnection();
    if (!isConnected) {
      return res.status(503).json(
        createResponse(false, 'Database connection unavailable', undefined, 'DB_CONNECTION_ERROR')
      );
    }
    next();
  } catch (error: any) {
    return res.status(503).json(
      createResponse(false, 'Database health check failed', undefined, error.message)
    );
  }
};

// Apply health check to all routes
router.use(checkDbHealth);

// =============================================
// GET /api/templates
// Mendapatkan semua template
// =============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const templates = await TemplateRepository.getAllTemplates(includeInactive);
    
    return res.status(200).json(
      createResponse(true, `Found ${templates.length} templates`, templates)
    );
  } catch (error: any) {
    console.error('[API] GET /templates error:', error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to fetch templates', undefined, error.message)
    );
  }
});

// =============================================
// GET /api/templates/:id
// Mendapatkan template berdasarkan ID
// =============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, 'Template ID is required')
      );
    }

    const template = await TemplateRepository.getTemplateById(id);
    
    if (!template) {
      return res.status(404).json(
        createResponse(false, `Template with ID "${id}" not found`)
      );
    }

    return res.status(200).json(
      createResponse(true, 'Template found', template)
    );
  } catch (error: any) {
    console.error(`[API] GET /templates/${req.params.id} error:`, error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to fetch template', undefined, error.message)
    );
  }
});

// =============================================
// POST /api/templates
// Membuat atau mengupdate template
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const template = req.body;
    
    // Validate required fields
    if (!template.id) {
      return res.status(400).json(
        createResponse(false, 'Template ID is required')
      );
    }
    
    if (!template.name || template.name.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, 'Template name is required')
      );
    }
    
    if (!template.shapes || !Array.isArray(template.shapes)) {
      return res.status(400).json(
        createResponse(false, 'Template shapes must be an array')
      );
    }
    
    // Validate frameType
    const validFrameTypes = ['rectangle', 'rectangle2x1', 'rectangle1x2', 'circle', 'triangle'];
    if (template.frameType && !validFrameTypes.includes(template.frameType)) {
      return res.status(400).json(
        createResponse(false, `Invalid frameType. Must be one of: ${validFrameTypes.join(', ')}`)
      );
    }
    
    // Validate dimensions
    if (template.width && (template.width < 1 || template.width > 2000)) {
      return res.status(400).json(
        createResponse(false, 'Width must be between 1 and 2000')
      );
    }
    
    if (template.height && (template.height < 1 || template.height > 2000)) {
      return res.status(400).json(
        createResponse(false, 'Height must be between 1 and 2000')
      );
    }

    const updatedBy = req.headers['x-user-id'] as string || 'system';
    const result = await TemplateRepository.saveTemplate(template, updatedBy);
    
    return res.status(200).json(
      createResponse(true, `Template ${result.action} successfully`, result)
    );
  } catch (error: any) {
    console.error('[API] POST /templates error:', error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to save template', undefined, error.message)
    );
  }
});

// =============================================
// DELETE /api/templates/:id
// Menghapus template (soft delete)
// =============================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hard === 'true';
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, 'Template ID is required')
      );
    }

    // Cek apakah template exists
    const existing = await TemplateRepository.getTemplateById(id);
    if (!existing) {
      return res.status(404).json(
        createResponse(false, `Template with ID "${id}" not found`)
      );
    }

    const affectedRows = await TemplateRepository.deleteTemplate(id, hardDelete);
    
    if (affectedRows === 0) {
      return res.status(404).json(
        createResponse(false, 'No template was deleted')
      );
    }

    return res.status(200).json(
      createResponse(true, `Template ${hardDelete ? 'permanently deleted' : 'deactivated'} successfully`, { affectedRows })
    );
  } catch (error: any) {
    console.error(`[API] DELETE /templates/${req.params.id} error:`, error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to delete template', undefined, error.message)
    );
  }
});

// =============================================
// POST /api/templates/:id/duplicate
// Menduplikasi template
// =============================================
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newId, newName } = req.body;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, 'Source template ID is required')
      );
    }
    
    if (!newId) {
      return res.status(400).json(
        createResponse(false, 'New template ID is required')
      );
    }
    
    if (!newName || newName.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, 'New template name is required')
      );
    }

    // Cek source template exists
    const existing = await TemplateRepository.getTemplateById(id);
    if (!existing) {
      return res.status(404).json(
        createResponse(false, `Source template with ID "${id}" not found`)
      );
    }

    // Cek newId belum digunakan
    const existingNew = await TemplateRepository.getTemplateById(newId);
    if (existingNew) {
      return res.status(409).json(
        createResponse(false, `Template with ID "${newId}" already exists`)
      );
    }

    const result = await TemplateRepository.duplicateTemplate(id, newId, newName);
    
    return res.status(200).json(
      createResponse(true, 'Template duplicated successfully', result)
    );
  } catch (error: any) {
    console.error(`[API] POST /templates/${req.params.id}/duplicate error:`, error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to duplicate template', undefined, error.message)
    );
  }
});

// =============================================
// GET /api/templates/health
// Check database health
// =============================================
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const isConnected = await checkConnection();
    return res.status(200).json(
      createResponse(true, isConnected ? 'Database connected' : 'Database disconnected', { connected: isConnected })
    );
  } catch (error: any) {
    return res.status(500).json(
      createResponse(false, 'Health check failed', { connected: false }, error.message)
    );
  }
});

export default router;