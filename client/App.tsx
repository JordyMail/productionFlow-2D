// client/App.tsx
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ShapeEditor from "./pages/ShapeEditor";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  // Cek embed mode dan sembunyikan nav bar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isEmbed = params.get('embed') === 'true';
    const hideTools = params.get('hideTools') === 'true';
    
    if (isEmbed && hideTools) {
      // Sembunyikan semua nav/header elements
      document.body.style.overflow = 'hidden';
      
      // Sembunyikan nav bar jika ada
      const navElements = document.querySelectorAll('nav, header, .navbar, .top-bar, [data-nav]');
      navElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/shape-editor" element={<ShapeEditor />} />
            <Route path="/shape-editor/:templateId" element={<ShapeEditor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);