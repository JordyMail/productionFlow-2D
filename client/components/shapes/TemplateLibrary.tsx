// client/components/shapes/TemplateLibrary.tsx
import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Grid,
  MoreVertical
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleDelete = (templateId: string) => {
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
      
      // If the deleted template was selected, clear selection
      if (selectedTemplateId === templateToDelete) {
        onSelectTemplate(null);
      }
    }
  };

  const handleDuplicate = (templateId: string) => {
    duplicateTemplate(templateId);
    toast({
      title: "Template duplicated",
      description: "A copy has been created",
      duration: 3000,
    });
  };

  const handleEdit = (templateId: string) => {
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
                "p-3 cursor-pointer hover:border-primary transition-all relative",
                selectedTemplateId === template.id && "border-primary ring-1 ring-primary/20"
              )}
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start gap-3">
                {/* Template Preview */}
                <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
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
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-700 truncate">
                      {template.name}
                    </p>
                    
                    {/* Action Buttons - SELALU TAMPAK (untuk testing) */}
                    <div className="flex gap-1 ml-2">
                      {/* Edit Button */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template.id);
                        }}
                        title="Edit template"
                      >
                        <Edit size={14} />
                      </Button>

                      {/* Duplicate Button */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(template.id);
                        }}
                        title="Duplicate template"
                      >
                        <Copy size={14} />
                      </Button>

                      {/* Delete Button */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                        title="Delete template"
                      >
                        <Trash2 size={14} />
                      </Button>
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
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template
              and remove it from all machines that are using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateLibrary;