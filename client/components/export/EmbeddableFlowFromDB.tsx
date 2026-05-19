// client/components/export/EmbeddableFlowFromDB.tsx
import React, { useEffect, useState } from 'react';
import { fetchFlowById, fetchLatestFlow } from '@/services/flowApi';
import { ExportedFlowData, EmbeddableFlowProps } from '@/shared/types';
import EmbeddableFlow from './EmbeddableFlow';

interface EmbeddableFlowFromDBProps extends Omit<EmbeddableFlowProps, 'data'> {
  /** 
   * ID flow di database. Jika tidak diberikan, akan mengambil yang terbaru.
   * Format: "flow-{timestamp}-{random}"
   */
  flowId?: string;
  
  /** 
   * Nama flow di database (alternatif dari flowId)
   * Akan mencari flow dengan nama ini
   */
  flowName?: string;
  
  /**
   * Jika true, akan menampilkan loading state
   */
  showLoading?: boolean;
  
  /**
   * Interval refresh dalam ms (default: 0 = no refresh)
   */
  refreshInterval?: number;
  
  /**
   * API base URL (jika aplikasi ini di host terpisah)
   */
  apiBaseUrl?: string;
}

const EmbeddableFlowFromDB: React.FC<EmbeddableFlowFromDBProps> = ({
  flowId,
  flowName,
  showLoading = true,
  refreshInterval = 0,
  apiBaseUrl,
  ...embedProps
}) => {
  const [flowData, setFlowData] = useState<ExportedFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data dari database
  const loadFlowData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ExportedFlowData | null = null;

      if (flowId) {
        // Fetch by ID
        data = await fetchFlowById(flowId);
      } else if (flowName) {
        // Fetch by name (ambil semua lalu filter)
        const { fetchAllFlows } = await import('@/services/flowApi');
        const flows = await fetchAllFlows();
        const matched = flows.find((f: any) => f.name === flowName);
        if (matched) {
          data = await fetchFlowById(matched.id);
        }
      } else {
        // Fetch latest
        data = await fetchLatestFlow();
      }

      if (data) {
        setFlowData(data);
      } else {
        setError('No flow data found in database');
      }
    } catch (err: any) {
      console.error('[EmbeddableFlowFromDB] Error loading flow:', err.message);
      setError(err.message || 'Failed to load flow data');
    } finally {
      setLoading(false);
    }
  }, [flowId, flowName]);

  // Initial load
  useEffect(() => {
    loadFlowData();
  }, [loadFlowData]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(loadFlowData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadFlowData]);

  // Loading state
  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50"
        style={{ width: embedProps.width || '100%', height: embedProps.height || 600 }}>
        <div className="text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-primary rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium">Loading Flow Data...</p>
          <p className="text-xs mt-1">Fetching from database</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center border-2 border-dashed border-red-200 rounded-lg bg-red-50"
        style={{ width: embedProps.width || '100%', height: embedProps.height || 600 }}>
        <div className="text-center text-red-500">
          <p className="text-sm font-medium">Failed to Load Flow</p>
          <p className="text-xs mt-1">{error}</p>
          <button
            onClick={loadFlowData}
            className="mt-3 px-3 py-1 text-xs bg-white border border-red-200 rounded-md hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data
  if (!flowData) {
    return (
      <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50"
        style={{ width: embedProps.width || '100%', height: embedProps.height || 600 }}>
        <div className="text-center text-slate-400">
          <p className="text-sm font-medium">No Flow Data</p>
          <p className="text-xs mt-1">Save a flow in Flow2D first</p>
        </div>
      </div>
    );
  }

  // Render flow
  return <EmbeddableFlow data={flowData} {...embedProps} />;
};

export default EmbeddableFlowFromDB;