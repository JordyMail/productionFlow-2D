// client/components/flow/LineSelector.tsx
import React, { useState, useCallback } from 'react';
import { Database, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStore } from '@/store/useStore';
import { fetchAllSavedLines } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

const LineSelector = () => {
  const { loadFlowFromDatabase, currentLineId } = useStore();
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadLines = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllSavedLines();
      setLines(data || []);
    } catch (err: any) {
      toast({
        title: 'Failed to load lines',
        description: err.message,
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) loadLines();
  };

  const handleSelect = async (lineId: string) => {
    setOpen(false);
    const success = await loadFlowFromDatabase(lineId);
    if (success) {
      toast({
        title: 'Flow loaded',
        description: `Line "${lineId}" loaded from database`,
        duration: 3000,
      });
    } else {
      toast({
        title: 'Load failed',
        description: `Could not load line "${lineId}" from database`,
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white gap-2"
        >
          <Database size={16} className="text-slate-500" />
          <span className="text-xs font-medium max-w-[100px] truncate">
            {currentLineId || 'Select Line'}
          </span>
          <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Available Lines
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              loadLines();
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </Button>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="px-3 py-4 text-center text-xs text-slate-400">Loading...</div>
        ) : lines.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-slate-400">
            No saved lines found
          </div>
        ) : (
          lines.map((line) => (
            <DropdownMenuItem
              key={line.lineId}
              onClick={() => handleSelect(line.lineId)}
              className="gap-2 cursor-pointer py-2"
            >
              <div className="w-4 flex-shrink-0 flex items-center">
                {currentLineId === line.lineId && (
                  <Check size={12} className="text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{line.lineId}</span>
                {line.lineName && (
                  <span className="text-[10px] text-slate-400 truncate block">
                    {line.lineName}
                  </span>
                )}
                <span className="text-[9px] text-slate-300">
                  v{line.versionCount || 1}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LineSelector;