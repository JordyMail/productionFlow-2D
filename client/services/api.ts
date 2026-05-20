// client/services/api.ts
import { MachineTemplate } from '@/shared/types';

const API_BASE_URL = '/api';

// Type untuk response API
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// Helper untuk handle response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || result.message || 'Unknown API error');
  }
  
  return result.data as T;
}

// Helper untuk fetch dengan error handling
async function apiFetch<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  return handleResponse<T>(response);
}

// =============================================
// Template API
// =============================================

/**
 * Mendapatkan semua template dari database
 */
export async function fetchTemplates(includeInactive: boolean = false): Promise<MachineTemplate[]> {
  try {
    const query = includeInactive ? '?includeInactive=true' : '';
    return await apiFetch<MachineTemplate[]>(`/templates${query}`);
  } catch (error: any) {
    console.error('[API] fetchTemplates error:', error.message);
    throw error;
  }
}

/**
 * Mendapatkan template berdasarkan ID
 */
export async function fetchTemplateById(id: string): Promise<MachineTemplate> {
  try {
    return await apiFetch<MachineTemplate>(`/templates/${encodeURIComponent(id)}`);
  } catch (error: any) {
    console.error(`[API] fetchTemplateById(${id}) error:`, error.message);
    throw error;
  }
}

/**
 * Menyimpan template ke database (create atau update)
 */
export async function saveTemplate(template: MachineTemplate): Promise<{ action: string; id: string }> {
  try {
    return await apiFetch<{ action: string; id: string }>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  } catch (error: any) {
    console.error('[API] saveTemplate error:', error.message);
    throw error;
  }
}

/**
 * Menghapus template dari database
 */
export async function deleteTemplate(id: string, hardDelete: boolean = false): Promise<{ affectedRows: number }> {
  try {
    const query = hardDelete ? '?hard=true' : '';
    return await apiFetch<{ affectedRows: number }>(`/templates/${encodeURIComponent(id)}${query}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`[API] deleteTemplate(${id}) error:`, error.message);
    throw error;
  }
}

/**
 * Menduplikasi template
 */
export async function duplicateTemplate(
  sourceId: string, 
  newId: string, 
  newName: string
): Promise<{ affectedRows: number; newId: string }> {
  try {
    return await apiFetch<{ affectedRows: number; newId: string }>(
      `/templates/${encodeURIComponent(sourceId)}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify({ newId, newName }),
      }
    );
  } catch (error: any) {
    console.error(`[API] duplicateTemplate(${sourceId}) error:`, error.message);
    throw error;
  }
}

/**
 * Check database health
 * ✅ FIXED: Menggunakan endpoint yang benar (/api/health) bukan /api/templates/health
 */
export async function checkDatabaseHealth(): Promise<{ connected: boolean }> {
  try {
    // Coba ke endpoint health check yang benar
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      console.warn('[API] Health check endpoint returned:', response.status);
      // Fallback: coba cek dengan fetch templates (limit 1)
      const templatesResponse = await fetch(`${API_BASE_URL}/templates?limit=1`);
      if (templatesResponse.ok) {
        return { connected: true };
      }
      return { connected: false };
    }
    
    const result = await response.json();
    return { connected: result?.status === 'ok' || result?.connected === true };
  } catch (error: any) {
    console.error('[API] checkDatabaseHealth error:', error.message);
    return { connected: false };
  }
}

// =============================================
// Flow Save API
// =============================================

/**
 * Menyimpan flow berdasarkan line_id ke database
 */
export async function saveFlowByLine(data: {
  lineId: string;
  lineName?: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  nodeTemplates?: Record<string, string>;
  formations?: any;
  viewMode?: string;
}): Promise<any> {
  try {
    return await apiFetch<any>('/flow-saves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error: any) {
    console.error('[API] saveFlowByLine error:', error.message);
    throw error;
  }
}

/**
 * Mendapatkan flow terbaru berdasarkan line_id
 */
export async function fetchFlowByLineId(lineId: string): Promise<any> {
  try {
    return await apiFetch<any>(`/flow-saves/line/${encodeURIComponent(lineId)}`);
  } catch (error: any) {
    console.error(`[API] fetchFlowByLineId(${lineId}) error:`, error.message);
    throw error;
  }
}

/**
 * Mendapatkan daftar semua line yang memiliki saved flow
 */
export async function fetchAllSavedLines(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/flow-saves/lines');
  } catch (error: any) {
    console.error('[API] fetchAllSavedLines error:', error.message);
    throw error;
  }
}

/**
 * Mendapatkan history versi flow berdasarkan line_id
 */
export async function fetchFlowHistoryByLineId(lineId: string): Promise<any[]> {
  try {
    return await apiFetch<any[]>(`/flow-saves/line/${encodeURIComponent(lineId)}/history`);
  } catch (error: any) {
    console.error(`[API] fetchFlowHistoryByLineId(${lineId}) error:`, error.message);
    throw error;
  }
}

/**
 * Menghapus flow berdasarkan line_id
 */
export async function deleteFlowByLineId(lineId: string, hardDelete: boolean = false): Promise<any> {
  try {
    const query = hardDelete ? '?hard=true' : '';
    return await apiFetch<any>(`/flow-saves/line/${encodeURIComponent(lineId)}${query}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`[API] deleteFlowByLineId(${lineId}) error:`, error.message);
    throw error;
  }
}