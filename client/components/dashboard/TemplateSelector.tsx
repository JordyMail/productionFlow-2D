// client/components/dashboard/TemplateSelector.tsx
import React, { useState } from 'react';
import { ChevronDown, Grid, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStore } from '@/store/useStore';
import { MachineTemplate } from '@/shared/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TemplateSelectorProps {
  nodeId: string;
  currentTemplateId?: string;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  nodeId,
  currentTemplateId
}) => {
  const navigate = useNavigate();
  const { templates, assignTemplateToNode, getTemplateById } = useStore();
  const [open, setOpen] = useState(false);

  const currentTemplate = currentTemplateId ? getTemplateById(currentTemplateId) : null;

  const handleSelectTemplate = (templateId: string | null) => {
    assignTemplateToNode(nodeId, templateId);
    setOpen(false);
  };

  const handleEditTemplate = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setOpen(false);
    navigate(`/shape-editor/${templateId}`);
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            size="sm"
          >
            <span className="flex items-center gap-2">
              <Grid size={14} />
              {currentTemplate ? currentTemplate.name : 'Default Shape'}
            </span>
            <ChevronDown size={14} className="opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Select Template</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => {
                setOpen(false);
                navigate('/shape-editor/new');
              }}
            >
              <Plus size={12} className="mr-1" />
              New
            </Button>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-1">
            {/* Default option */}
            <button
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 flex items-center gap-2 group",
                !currentTemplateId && "bg-primary/10 text-primary"
              )}
              onClick={() => handleSelectTemplate(null)}
            >
              <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                <Grid size={14} className="text-slate-500" />
              </div>
              <div className="flex-1">
                <span className="font-medium">Default Shape</span>
                <p className="text-[10px] text-slate-400">Standard machine node</p>
              </div>
            </button>
            
            {/* Custom templates */}
            {templates.map((template) => (
              <div
                key={template.id}
                className={cn(
                  "relative group rounded-md",
                  currentTemplateId === template.id && "bg-primary/5"
                )}
              >
                <button
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 flex items-center gap-2",
                    currentTemplateId === template.id && "text-primary"
                  )}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  {template.thumbnail ? (
                    <img 
                      src={template.thumbnail} 
                      alt={template.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/5 rounded flex items-center justify-center">
                      <span className="text-[8px] font-bold text-primary">
                        {template.shapes.length}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{template.name}</span>
                    <p className="text-[10px] text-slate-400 truncate">
                      {template.description || 'No description'}
                    </p>
                  </div>
                </button>
                
                {/* Edit button on hover */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleEditTemplate(e, template.id)}
                    >
                      <Edit size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">Edit template</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-slate-400">No custom templates</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default TemplateSelector;