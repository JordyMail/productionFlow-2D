import React, { useEffect } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const UndoRedoIndicator = () => {
  const { undo, redo, canUndo, canRedo, historyIndex, history } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      
      // Check for Ctrl+Y or Ctrl+Shift+Z (Redo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
      
      // Check for Ctrl+Shift+Z (alternative Redo)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const currentAction = history[historyIndex]?.description || 'No actions';

  return (
    <TooltipProvider>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                canUndo() 
                  ? "hover:bg-slate-100 text-slate-700 cursor-pointer" 
                  : "text-slate-300 cursor-not-allowed"
              )}
            >
              <Undo2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-slate-200" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                canRedo() 
                  ? "hover:bg-slate-100 text-slate-700 cursor-pointer" 
                  : "text-slate-300 cursor-not-allowed"
              )}
            >
              <Redo2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Redo (Ctrl+Y or Ctrl+Shift+Z)</p>
          </TooltipContent>
        </Tooltip>

        <div className="ml-1 text-[10px] text-slate-400 font-medium">
          {historyIndex + 1}/{history.length}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="ml-1 text-[10px] text-slate-500 max-w-[120px] truncate">
              {currentAction}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{currentAction}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default UndoRedoIndicator;