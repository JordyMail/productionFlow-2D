import React, { useEffect } from 'react';
import { useStore, setupAutoSave } from '@/store/useStore';
import Sidebar from '@/components/dashboard/Sidebar';
import FlowCanvas from '@/components/flow/FlowCanvas';
import PropertyPanel from '@/components/dashboard/PropertyPanel';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

export default function Index() {
  const { updateThroughput, selectedNodeId } = useStore();

  // Real-time Simulation Logic
  useEffect(() => {
    const interval = setInterval(() => {
      updateThroughput();
    }, 3000);

    return () => clearInterval(interval);
  }, [updateThroughput]);

  // Auto-save every 30 seconds (optional)
  useEffect(() => {
    const cleanup = setupAutoSave(30000); // 30 seconds
    return () => cleanup;
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Sidebar - Machine Selection & Stats */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <Sidebar />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Main Canvas Area */}
        <ResizablePanel defaultSize={selectedNodeId ? 55 : 80}>
          <FlowCanvas />
        </ResizablePanel>
        
        {/* Right Property Panel - CRUD Operations */}
        {selectedNodeId && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <PropertyPanel />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}