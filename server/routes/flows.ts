// server/routes/flows.ts
import { Router, Request, Response } from 'express';
import { FlowRepository } from '../db/flowRepository';
import { checkConnection } from '../db/connection';

const router = Router();

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

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

router.use(checkDbHealth);

// =============================================
// GET /api/flows
// Mendapatkan semua flow saves
// =============================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const flows = await FlowRepository.getAllFlows(includeInactive);
    
    return res.status(200).json(
      createResponse(true, `Found ${flows.length} flow saves`, flows)
    );
  } catch (error: any) {
    console.error('[API] GET /flows error:', error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to fetch flows', undefined, error.message)
    );
  }
});

// =============================================
// GET /api/flows/latest
// Mendapatkan flow terbaru
// =============================================
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const flow = await FlowRepository.getLatestFlow();
    
    if (!flow) {
      return res.status(404).json(
        createResponse(false, 'No flow saves found')
      );
    }

    return res.status(200).json(
      createResponse(true, 'Latest flow found', flow)
    );
  } catch (error: any) {
    console.error('[API] GET /flows/latest error:', error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to fetch latest flow', undefined, error.message)
    );
  }
});

// =============================================
// GET /api/flows/:id
// Mendapatkan flow berdasarkan ID
// =============================================
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, 'Flow ID is required')
      );
    }

    const flow = await FlowRepository.getFlowById(id);
    
    if (!flow) {
      return res.status(404).json(
        createResponse(false, `Flow with ID "${id}" not found`)
      );
    }

    return res.status(200).json(
      createResponse(true, 'Flow found', flow)
    );
  } catch (error: any) {
    console.error(`[API] GET /flows/${req.params.id} error:`, error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to fetch flow', undefined, error.message)
    );
  }
});

// =============================================
// POST /api/flows
// Menyimpan flow data (create atau update)
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const flowData = req.body;
    
    // Validate required fields
    if (!flowData.name || flowData.name.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, 'Flow name is required')
      );
    }
    
    if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
      return res.status(400).json(
        createResponse(false, 'Flow nodes must be an array')
      );
    }
    
    if (!flowData.edges || !Array.isArray(flowData.edges)) {
      return res.status(400).json(
        createResponse(false, 'Flow edges must be an array')
      );
    }

    // Build full flow data
    const saveData = {
      name: flowData.name,
      description: flowData.description || '',
      nodes: flowData.nodes,
      edges: flowData.edges,
      nodeTemplates: flowData.nodeTemplates || {},
      viewMode: flowData.viewMode || 'default',
      version: flowData.version || '2.0.0',
      createdBy: req.headers['x-user-id'] as string || 'system',
    };

    const result = await FlowRepository.saveFlow(saveData);
    
    return res.status(200).json(
      createResponse(true, `Flow ${result.action} successfully`, result)
    );
  } catch (error: any) {
    console.error('[API] POST /flows error:', error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to save flow', undefined, error.message)
    );
  }
});

// =============================================
// DELETE /api/flows/:id
// Menghapus flow (soft delete)
// =============================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hard === 'true';
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, 'Flow ID is required')
      );
    }

    const existing = await FlowRepository.getFlowById(id);
    if (!existing) {
      return res.status(404).json(
        createResponse(false, `Flow with ID "${id}" not found`)
      );
    }

    const affectedRows = await FlowRepository.deleteFlow(id, hardDelete);
    
    return res.status(200).json(
      createResponse(true, `Flow ${hardDelete ? 'permanently deleted' : 'deactivated'} successfully`, { affectedRows })
    );
  } catch (error: any) {
    console.error(`[API] DELETE /flows/${req.params.id} error:`, error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to delete flow', undefined, error.message)
    );
  }
});

// =============================================
// GET /api/flows/health
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