// client/components/flow/ViewModeToggle.tsx
import React from 'react';
import { Layout, Shapes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStore } from '@/store/useStore';
import { ViewMode } from '@/shared/types';
import { cn } from '@/lib/utils';

const ViewModeToggle = () => {
  const { viewMode, setViewMode } = useStore();

  return (
    <TooltipProvider>
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm flex p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 rounded-md transition-all",
                viewMode === 'default' 
                  ? "bg-primary text-white hover:bg-primary/90" 
                  : "text-slate-500 hover:text-slate-700"
              )}
              onClick={() => setViewMode('default')}
            >
              <Layout size={16} className="mr-2" />
              Default
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Standard machine view with details</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 rounded-md transition-all",
                viewMode === 'shapes' 
                  ? "bg-primary text-white hover:bg-primary/90" 
                  : "text-slate-500 hover:text-slate-700"
              )}
              onClick={() => setViewMode('shapes')}
            >
              <Shapes size={16} className="mr-2" />
              Shapes
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Custom shape mode with tooltips</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ViewModeToggle;