import React, { useState, useRef } from 'react';
import { 
  Save, 
  Upload, 
  Download, 
  Trash2, 
  Clock,
  CheckCircle,
  AlertCircle,
  FileJson,
  HardDrive
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const SaveLoadPanel = () => {
  const { 
    saveToLocalStorage, 
    loadFromLocalStorage, 
    exportToFile, 
    importFromFile, 
    clearAll,
    lastSaved,
    nodes 
  } = useStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleSave = () => {
    const success = saveToLocalStorage();
    if (success) {
      toast({
        title: "Saved successfully",
        description: `Flow saved to browser storage at ${new Date().toLocaleTimeString()}`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Save failed",
        description: "Could not save to localStorage",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleLoad = () => {
    const success = loadFromLocalStorage();
    if (success) {
      toast({
        title: "Loaded successfully",
        description: "Flow restored from browser storage",
        duration: 3000,
      });
    } else {
      toast({
        title: "No saved data found",
        description: "There is no saved flow in browser storage",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleExport = () => {
    if (nodes.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Add some machines first before exporting",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    exportToFile();
    toast({
      title: "Export started",
      description: "Your file is being downloaded",
      duration: 3000,
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await importFromFile(file);
      toast({
        title: "Import successful",
        description: `Loaded ${file.name}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Invalid file format",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    clearAll();
    toast({
      title: "Canvas cleared",
      description: "All machines have been removed",
      duration: 3000,
    });
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white gap-2"
          >
            <HardDrive size={16} className="text-slate-500" />
            <span className="text-xs font-medium">Save/Load</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Data Management
          </DropdownMenuLabel>
          
          <DropdownMenuItem onClick={handleSave} className="gap-2 cursor-pointer">
            <Save size={14} className="text-slate-500" />
            <span>Save to Browser</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleLoad} className="gap-2 cursor-pointer">
            <Upload size={14} className="text-slate-500" />
            <span>Load from Browser</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleExport} className="gap-2 cursor-pointer">
            <Download size={14} className="text-slate-500" />
            <span>Export to File</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleImportClick} className="gap-2 cursor-pointer" disabled={isImporting}>
            <FileJson size={14} className="text-slate-500" />
            <span>{isImporting ? 'Importing...' : 'Import from File'}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleClear} className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
            <Trash2 size={14} />
            <span>Clear All</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Last saved indicator */}
      {lastSaved && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2 text-xs z-50">
          <Clock size={12} className="text-slate-400" />
          <span className="text-slate-500">Last saved:</span>
          <span className="font-medium text-slate-700">{lastSaved}</span>
          <CheckCircle size={12} className="text-green-500" />
        </div>
      )}
    </>
  );
};

export default SaveLoadPanel;