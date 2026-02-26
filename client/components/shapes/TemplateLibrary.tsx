// client/components/shapes/TemplateLibrary.tsx
import React from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Grid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store/useStore';
import { MachineTemplate } from '@/shared/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TemplateLibraryProps {
  onSelectTemplate: (template: MachineTemplate) => void;
  selectedTemplateId?: string | null;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  selectedTemplateId
}) => {
  const navigate = useNavigate();
  const { templates, deleteTemplate, duplicateTemplate } = useStore();

  const handleDelete = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(templateId);
    }
  };

  const handleDuplicate = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    duplicateTemplate(templateId);
  };

  const handleEdit = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    navigate(`/shape-editor/${templateId}`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-700">Shape Templates</h2>
          <Button 
            size="sm" 
            onClick={() => navigate('/shape-editor/new')}
            className="gap-1"
          >
            <Plus size={14} />
            New
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Select a template to apply to machines
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {/* Default/Blank option */}
          <Card
            className={cn(
              "p-3 cursor-pointer hover:border-primary transition-all",
              !selectedTemplateId && "border-primary ring-1 ring-primary/20"
            )}
            onClick={() => onSelectTemplate(null as any)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center">
                <Grid size={20} className="text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-700">Default Shape</p>
                <p className="text-[10px] text-slate-400">
                  Standard machine node
                </p>
              </div>
            </div>
          </Card>

          {/* Custom templates */}
          {templates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "p-3 cursor-pointer hover:border-primary transition-all group",
                selectedTemplateId === template.id && "border-primary ring-1 ring-primary/20"
              )}
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start gap-3">
                {template.thumbnail ? (
                  <img 
                    src={template.thumbnail} 
                    alt={template.name}
                    className="w-10 h-10 rounded-md object-cover bg-slate-100"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-md flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {template.shapes.length}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-700 truncate">
                      {template.name}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleEdit(e, template.id)}
                      >
                        <Edit size={12} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleDuplicate(e, template.id)}
                      >
                        <Copy size={12} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600"
                        onClick={(e) => handleDelete(e, template.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {template.description || 'No description'}
                  </p>
                  <p className="text-[8px] text-slate-300 mt-1">
                    {template.shapes.length} shapes
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400">No templates yet</p>
              <Button 
                variant="link" 
                size="sm"
                onClick={() => navigate('/shape-editor/new')}
                className="mt-2"
              >
                Create your first template
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TemplateLibrary;