// client/components/dashboard/TemplateSelector.tsx
import React, { useState } from 'react';
import { ChevronDown, Grid, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

  return (
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
      
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500">Select Template</p>
        </div>
        
        <div className="max-h-64 overflow-y-auto p-1">
          {/* Default option */}
          <button
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 flex items-center gap-2",
              !currentTemplateId && "bg-primary/10 text-primary"
            )}
            onClick={() => handleSelectTemplate(null)}
          >
            <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
              <Grid size={12} className="text-slate-500" />
            </div>
            <span>Default Shape</span>
          </button>
          
          {templates.map((template) => (
            <button
              key={template.id}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 flex items-center gap-2",
                currentTemplateId === template.id && "bg-primary/10 text-primary"
              )}
              onClick={() => handleSelectTemplate(template.id)}
            >
              {template.thumbnail ? (
                <img 
                  src={template.thumbnail} 
                  alt={template.name}
                  className="w-6 h-6 rounded object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-primary">
                    {template.shapes.length}
                  </span>
                </div>
              )}
              <span className="flex-1 truncate">{template.name}</span>
            </button>
          ))}
        </div>
        
        <div className="p-2 border-t border-slate-100">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full gap-2 text-xs"
            onClick={() => {
              setOpen(false);
              navigate('/shape-editor/new');
            }}
          >
            <Edit size={12} />
            Create New Template
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TemplateSelector;