// server/routes/flowSaves.ts
import { Router, Request, Response } from 'express';
import { FlowSaveRepository } from '../db/flowSaveRepository';

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

// =============================================
// POST /api/flow-saves
// Menyimpan flow berdasarkan line_id
// =============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      lineId, lineName, name, description,
      nodes, edges, nodeTemplates, formations, viewMode 
    } = req.body;

    // Validasi
    if (!lineId || lineId.trim().length === 0) {
      return res.status(400).json(createResponse(false, 'Line ID is required'));
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json(createResponse(false, 'Flow name is required'));
    }

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json(createResponse(false, 'Nodes must be an array'));
    }

    if (!edges || !Array.isArray(edges)) {
      return res.status(400).json(createResponse(false, 'Edges must be an array'));
    }

    const flowData = {
      id: `flow-${lineId}-${Date.now()}`,
      lineId: lineId.trim(),
      lineName: lineName || null,
      name,
      description: description || null,
      nodes,
      edges,
      nodeTemplates: nodeTemplates || {},
      formations: formations || null,
      viewMode: viewMode || 'default',
    };

    const result = await FlowSaveRepository.saveFlowByLine(flowData);

    return res.status(200).json(
      createResponse(true, `Flow for line "${lineId}" saved successfully`, result)
    );
  } catch (error: any) {
    console.error('[API] POST /flow-saves error:', error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to save flow', undefined, error.message)
    );
  }
});

// =============================================
// GET /api/flow-saves/line/:lineId
// Mendapatkan flow terbaru berdasarkan line_id
// =============================================
router.get('/line/:lineId', async (req: Request, res: Response) => {
  try {
    const { lineId } = req.params;

    if (!lineId || lineId.trim().length === 0) {
      return res.status(400).json(createResponse(false, 'Line ID is required'));
    }

    const flow = await FlowSaveRepository.getFlowByLineId(lineId);

    if (!flow) {
      return res.status(404).json(
        createResponse(false, `No flow found for line "${lineId}"`)
      );
    }

    return res.status(200).json(
      createResponse(true, 'Flow found', flow)
    );
  } catch (error: any) {
    console.error(`[API] GET /flow-saves/line/${req.params.lineId} error:`, error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to fetch flow', undefined, error.message)
    );
  }
});

// =============================================
// GET /api/flow-saves/lines
// Mendapatkan daftar semua line yang memiliki saved flow
// =============================================
router.get('/lines', async (_req: Request, res: Response) => {
  try {
    const lines = await FlowSaveRepository.getAllSavedLines();

    return res.status(200).json(
      createResponse(true, `Found ${lines.length} saved lines`, lines)
    );
  } catch (error: any) {
    console.error('[API] GET /flow-saves/lines error:', error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to fetch saved lines', undefined, error.message)
    );
  }
});

// =============================================
// GET /api/flow-saves/line/:lineId/history
// Mendapatkan history versi flow
// =============================================
router.get('/line/:lineId/history', async (req: Request, res: Response) => {
  try {
    const { lineId } = req.params;
    const history = await FlowSaveRepository.getFlowHistoryByLineId(lineId);

    return res.status(200).json(
      createResponse(true, `Found ${history.length} versions`, history)
    );
  } catch (error: any) {
    console.error(`[API] GET /flow-saves/line/${req.params.lineId}/history error:`, error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to fetch flow history', undefined, error.message)
    );
  }
});

// =============================================
// DELETE /api/flow-saves/line/:lineId
// Menghapus flow berdasarkan line_id
// =============================================
router.delete('/line/:lineId', async (req: Request, res: Response) => {
  try {
    const { lineId } = req.params;
    const hardDelete = req.query.hard === 'true';

    const affectedRows = await FlowSaveRepository.deleteFlowByLineId(lineId, hardDelete);

    if (affectedRows === 0) {
      return res.status(404).json(
        createResponse(false, `No flow found for line "${lineId}"`)
      );
    }

    return res.status(200).json(
      createResponse(true, `Flow for line "${lineId}" deleted`, { affectedRows })
    );
  } catch (error: any) {
    console.error(`[API] DELETE /flow-saves/line/${req.params.lineId} error:`, error.message);
    return res.status(500).json(
      createResponse(false, 'Failed to delete flow', undefined, error.message)
    );
  }
});

export default router;