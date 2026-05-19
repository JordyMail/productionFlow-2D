// client/services/flowApi.ts
import { ExportedFlowData } from '@/shared/types';

const API_BASE_URL = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
  }
  
  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || result.message || 'Unknown API error');
  }
  
  return result.data as T;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
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
// FLOW SAVE/LOAD API (via Database)
// =============================================

/**
 * Menyimpan flow data ke database
 */
export async function saveFlowToDatabase(flowData: {
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  nodeTemplates: Record<string, string>;
  viewMode: string;
}): Promise<{ id: string; action: string }> {
  try {
    return await apiFetch<{ id: string; action: string }>('/flows', {
      method: 'POST',
      body: JSON.stringify(flowData),
    });
  } catch (error: any) {
    console.error('[FlowAPI] saveFlowToDatabase error:', error.message);
    throw error;
  }
}

/**
 * Mendapatkan semua flow saves dari database
 */
export async function fetchAllFlows(): Promise<any[]> {
  try {
    return await apiFetch<any[]>('/flows');
  } catch (error: any) {
    console.error('[FlowAPI] fetchAllFlows error:', error.message);
    throw error;
  }
}

/**
 * Mendapatkan flow berdasarkan ID
 */
export async function fetchFlowById(id: string): Promise<ExportedFlowData> {
  try {
    return await apiFetch<ExportedFlowData>(`/flows/${encodeURIComponent(id)}`);
  } catch (error: any) {
    console.error(`[FlowAPI] fetchFlowById(${id}) error:`, error.message);
    throw error;
  }
}

/**
 * Mendapatkan flow terbaru (yang paling baru disimpan)
 */
export async function fetchLatestFlow(): Promise<ExportedFlowData | null> {
  try {
    const flows = await fetchAllFlows();
    if (flows.length === 0) return null;
    
    // Ambil yang paling baru
    const latestFlow = flows.sort((a: any, b: any) => b.updatedAt - a.updatedAt)[0];
    return await fetchFlowById(latestFlow.id);
  } catch (error: any) {
    console.error('[FlowAPI] fetchLatestFlow error:', error.message);
    return null;
  }
}

/**
 * Menghapus flow dari database
 */
export async function deleteFlow(id: string): Promise<{ affectedRows: number }> {
  try {
    return await apiFetch<{ affectedRows: number }>(`/flows/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (error: any) {
    console.error(`[FlowAPI] deleteFlow(${id}) error:`, error.message);
    throw error;
  }
}

/**
 * Check database connection health
 */
export async function checkFlowDatabaseHealth(): Promise<{ connected: boolean }> {
  try {
    return await apiFetch<{ connected: boolean }>('/flows/health');
  } catch (error: any) {
    console.error('[FlowAPI] checkFlowDatabaseHealth error:', error.message);
    return { connected: false };
  }
}