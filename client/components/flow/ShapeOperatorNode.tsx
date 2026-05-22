// client/components/flow/ShapeOperatorNode.tsx
import React, { memo, useRef, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { User, Hash, ListOrdered } from 'lucide-react';
import { HandleConfig, HandlePosition, OperatorData } from '@/shared/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ShapeOperatorNodeProps extends NodeProps<OperatorData & {
  chairDesign?: OperatorData['chairDesign'];
}> {
  data: OperatorData & {
    chairDesign?: OperatorData['chairDesign'];
  };
}

// Helper untuk mengecek apakah handle aktif
const isHandleActive = (handles: HandleConfig | undefined, position: HandlePosition): boolean => {
  if (!handles) return true; // Default ke aktif jika belum ada config
  return handles[position];
};

const ShapeOperatorNode = ({ data, selected }: ShapeOperatorNodeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { id, process, label, handles, color, chairDesign } = data;

  const nodeColor = color || '#ffffff4f';
  const chairConfig = chairDesign || { enabled: false };
  
  // Ukuran node: gunakan circleDiameter jika ada, default 80px (persegi)
  const nodeSize = chairConfig.circleDiameter || 60; 

  // Draw chair/lingkaran on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!chairConfig.enabled) {
      // Fallback: gambar lingkaran sederhana yang memenuhi canvas
      const radius = Math.min(width, height) / 2 - 5; // radius dengan margin 5px
      const centerX = width / 2;
      const centerY = height / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `${nodeColor}30`;
      ctx.fill();
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw ID dan Process di tengah lingkaran (tanpa teks tambahan)
      ctx.fillStyle = nodeColor;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // tampilkan ID dan Process
      // ctx.font = 'bold 16px Inter, sans-serif';
      // ctx.fillText(`${id}`, centerX, centerY - 7);  
      // ctx.font = 'bold 14px Inter, sans-serif';
      // ctx.fillText(`${process}`, centerX, centerY + 7); 


      // Hanya tampilkan process saja
      ctx.font = 'bold 24px Inter, sans-serif'; 
      ctx.fillText(`${process}`, centerX, centerY);  
      
      return;
    }

    // Jika chair design enabled
    const cw = chairConfig.chairWidth || 80;
    const ch = chairConfig.chairHeight || 100;
    const seatDepth = chairConfig.seatDepth || 45;
    const backrestHeight = chairConfig.backrestHeight || 55;
    const chairColor = chairConfig.chairColor || nodeColor;

    // Posisi tengah
    const cx = width / 2;
    const baseY = height - 10; // bottom margin

    // ===== DRAW CHAIR =====
    
    // 1. Kaki kursi (4 kaki)
    const legWidth = 6;
    const legHeight = 12;
    const legSpacing = (cw / 2) - 8;
    
    ctx.fillStyle = '#6b7280'; // Gray untuk kaki kursi
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;

    // Kaki depan kiri
    ctx.fillRect(cx - legSpacing - legWidth/2, baseY - legHeight, legWidth, legHeight);
    ctx.strokeRect(cx - legSpacing - legWidth/2, baseY - legHeight, legWidth, legHeight);
    // Kaki depan kanan
    ctx.fillRect(cx + legSpacing - legWidth/2, baseY - legHeight, legWidth, legHeight);
    ctx.strokeRect(cx + legSpacing - legWidth/2, baseY - legHeight, legWidth, legHeight);

    // Kaki belakang (lebih pendek, di belakang)
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(cx - legSpacing - legWidth/2 + 2, baseY - legHeight - 5, legWidth - 2, legHeight - 10);
    ctx.fillRect(cx + legSpacing - legWidth/2 + 2, baseY - legHeight - 5, legWidth - 2, legHeight - 10);

    // 2. Dudukan kursi (seat)
    const seatY = baseY - legHeight;
    const seatHeight = 8;
    
    // Gradient untuk dudukan
    const seatGradient = ctx.createLinearGradient(cx - cw/2, seatY, cx + cw/2, seatY);
    seatGradient.addColorStop(0, chairColor);
    seatGradient.addColorStop(0.5, `${chairColor}cc`);
    seatGradient.addColorStop(1, chairColor);
    
    ctx.fillStyle = seatGradient;
    
    // Draw rounded rectangle untuk dudukan
    const seatRadius = 4;
    ctx.beginPath();
    ctx.moveTo(cx - cw/2 + seatRadius, seatY);
    ctx.lineTo(cx + cw/2 - seatRadius, seatY);
    ctx.quadraticCurveTo(cx + cw/2, seatY, cx + cw/2, seatY + seatRadius);
    ctx.lineTo(cx + cw/2, seatY + seatHeight - seatRadius);
    ctx.quadraticCurveTo(cx + cw/2, seatY + seatHeight, cx + cw/2 - seatRadius, seatY + seatHeight);
    ctx.lineTo(cx - cw/2 + seatRadius, seatY + seatHeight);
    ctx.quadraticCurveTo(cx - cw/2, seatY + seatHeight, cx - cw/2, seatY + seatHeight - seatRadius);
    ctx.lineTo(cx - cw/2, seatY + seatRadius);
    ctx.quadraticCurveTo(cx - cw/2, seatY, cx - cw/2 + seatRadius, seatY);
    ctx.closePath();
    ctx.fill();

    // Stroke dudukan
    ctx.strokeStyle = `${chairColor}80`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Sandaran kursi (backrest)
    const backrestY = seatY - backrestHeight;
    const backrestWidth = cw - 20;
    
    const backrestGradient = ctx.createLinearGradient(cx, backrestY, cx, seatY);
    backrestGradient.addColorStop(0, `${chairColor}cc`);
    backrestGradient.addColorStop(1, chairColor);
    
    ctx.fillStyle = backrestGradient;

    // Draw rounded rectangle untuk sandaran
    const brRadius = 4;
    ctx.beginPath();
    ctx.moveTo(cx - backrestWidth/2 + brRadius, backrestY);
    ctx.lineTo(cx + backrestWidth/2 - brRadius, backrestY);
    ctx.quadraticCurveTo(cx + backrestWidth/2, backrestY, cx + backrestWidth/2, backrestY + brRadius);
    ctx.lineTo(cx + backrestWidth/2, seatY - brRadius);
    ctx.quadraticCurveTo(cx + backrestWidth/2, seatY, cx + backrestWidth/2 - brRadius, seatY);
    ctx.lineTo(cx - backrestWidth/2 + brRadius, seatY);
    ctx.quadraticCurveTo(cx - backrestWidth/2, seatY, cx - backrestWidth/2, seatY - brRadius);
    ctx.lineTo(cx - backrestWidth/2, backrestY + brRadius);
    ctx.quadraticCurveTo(cx - backrestWidth/2, backrestY, cx - backrestWidth/2 + brRadius, backrestY);
    ctx.closePath();
    ctx.fill();

    // Stroke sandaran
    ctx.strokeStyle = `${chairColor}80`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4. Tiang penyangga sandaran (2 tiang vertikal)
    const poleWidth = 3;
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(cx - backrestWidth/2 + 3, seatY - 3, poleWidth, backrestHeight - 5);
    ctx.fillRect(cx + backrestWidth/2 - 8, seatY - 3, poleWidth, backrestHeight - 5);

    // ===== DRAW ID & PROCESS DI TENGAH SANDBACK =====
    // Hanya ID dan Process, tanpa teks tambahan
    const textY = backrestY + backrestHeight / 2;
    
    // Background lingkaran untuk teks
    const circleRadius = 18;
    ctx.beginPath();
    ctx.arc(cx, textY, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = chairColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text ID dan Process
    ctx.fillStyle = chairColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Hanya ID dan Process
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText( `${id}`, cx, textY - 5);
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText(`${process}`, cx, textY + 7);

  }, [id, process, label, color, chairConfig, nodeColor]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative inline-block transition-all duration-200',
              selected ? 'ring-2 ring-purple-400 rounded-lg' : '',
            )}
            style={{
              width: nodeSize,
              height: nodeSize,
            }}
          >
            {/* Left Handles */}
            {isHandleActive(handles, 'left') && (
              <>
                <Handle
                  type="target"
                  position={Position.Left}
                  id="left-target"
                  className="w-3 h-3 border-2 border-white"
                  style={{ backgroundColor: nodeColor, top: '40%' }}
                />
                <Handle
                  type="source"
                  position={Position.Left}
                  id="left-source"
                  className="w-3 h-3 border-2 border-white"
                  style={{ backgroundColor: nodeColor, top: '60%' }}
                />
              </>
            )}

            {/* Right Handles */}
            {isHandleActive(handles, 'right') && (
              <>
                <Handle
                  type="target"
                  position={Position.Right}
                  id="right-target"
                  className="w-3 h-3 border-2 border-white"
                  style={{ backgroundColor: nodeColor, top: '40%' }}
                />
                <Handle
                  type="source"
                  position={Position.Right}
                  id="right-source"
                  className="w-3 h-3 border-2 border-white"
                  style={{ backgroundColor: nodeColor, top: '60%' }}
                />
              </>
            )}

            {/* Top Handles */}
            {isHandleActive(handles, 'top') && (
              <>
                <Handle
                  type="target"
                  position={Position.Top}
                  id="top-target"
                  className="w-3 h-3 border-2 border-white"
                  style={{ backgroundColor: nodeColor, left: '40%' }}
                />
                <Handle
                  type="source"
                  position={Position.Top}
                  id="top-source"
                  className="w-3 h-3 border-2 border-white"
                  style={{ backgroundColor: nodeColor, left: '60%' }}
                />
              </>
            )}

            {/* Bottom Handles */}
            {isHandleActive(handles, 'bottom') && (
              <>
                <Handle
                  type="target"
                  position={Position.Bottom}
                  id="bottom-target"
                  className="w-3 h-3 border-2 border-white"
                  style={{ backgroundColor: nodeColor, left: '40%' }}
                />
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id="bottom-source"
                  className="w-3 h-3 border-2 border-white"
                  style={{ backgroundColor: nodeColor, left: '60%' }}
                />
              </>
            )}

            {/* Canvas untuk gambar */}
            <canvas
              ref={canvasRef}
              width={nodeSize}
              height={nodeSize}
              className="mx-auto block w-full h-full"
            />
          </div>
        </TooltipTrigger>

        <TooltipContent side="top" className="bg-slate-800 text-white border-none">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium">
              {label || `Operator ${id}`}
            </p>
            <p className="text-[10px] text-slate-300">
              ID: {id} • Process: {process}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default memo(ShapeOperatorNode);