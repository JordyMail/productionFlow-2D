// client/components/shapes/TemplateLibrary.tsx
import React from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Grid,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { toast } from '@/components/ui/use-toast';

interface TemplateLibraryProps {
  onSelectTemplate: (template: MachineTemplate | null) => void;
  selectedTemplateId?: string | null;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  selectedTemplateId
}) => {
  const navigate = useNavigate();
  const { templates, deleteTemplate, duplicateTemplate } = useStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [templateToDelete, setTemplateToDelete] = React.useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete);
      toast({
        title: "Template deleted",
        description: "The template has been removed",
        duration: 3000,
      });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDuplicate = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    duplicateTemplate(templateId);
    toast({
      title: "Template duplicated",
      description: "A copy has been created",
      duration: 3000,
    });
  };

  const handleEdit = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    navigate(`/shape-editor/${templateId}`);
  };

  const handlePreview = (e: React.MouseEvent, template: MachineTemplate) => {
    e.stopPropagation();
    // Bisa implement preview modal jika diperlukan
    onSelectTemplate(template);
  };

  return (
    <TooltipProvider>
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
                "p-3 cursor-pointer hover:border-primary transition-all group",
                !selectedTemplateId && "border-primary ring-1 ring-primary/20"
              )}
              onClick={() => onSelectTemplate(null)}
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
                  "p-3 cursor-pointer hover:border-primary transition-all group relative",
                  selectedTemplateId === template.id && "border-primary ring-1 ring-primary/20"
                )}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start gap-3">
                  {/* Template Preview */}
                  <div className="relative w-10 h-10 rounded-md overflow-hidden bg-slate-100">
                    {template.thumbnail ? (
                      <img 
                        src={template.thumbnail} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {template.shapes.length}
                        </span>
                      </div>
                    )}
                    
                    {/* Preview overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye size={14} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-700 truncate">
                        {template.name}
                      </p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleEdit(e, template.id)}
                            >
                              <Edit size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Edit template</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => handleDuplicate(e, template.id)}
                            >
                              <Copy size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Duplicate</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={(e) => handleDelete(e, template.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">Delete</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 truncate">
                      {template.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[8px] text-slate-300">
                        {template.shapes.length} shapes
                      </span>
                      <span className="text-[8px] text-slate-300">
                        • Updated {new Date(template.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this template. 
                Machines using this template will revert to default shape.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default TemplateLibrary;