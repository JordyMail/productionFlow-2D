// client/components/shapes/ShapeLibrary.tsx
import React from 'react';
import { 
  Square, 
  Circle, 
  Triangle,
  Minus,
  Type,
  Image
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

interface ShapeLibraryProps {
  onAddShape: (shapeType: string) => void;
}

const shapes = [
  { type: 'rectangle', icon: Square, label: 'Rectangle', color: '#3b82f6' },
  { type: 'circle', icon: Circle, label: 'Circle', color: '#10b981' },
  { type: 'triangle', icon: Triangle, label: 'Triangle', color: '#f59e0b' },
  { type: 'line', icon: Minus, label: 'Line', color: '#ef4444' },
  { type: 'text', icon: Type, label: 'Text', color: '#8b5cf6' },
];

const ShapeLibrary: React.FC<ShapeLibraryProps> = ({ onAddShape }) => {
  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Basic Shapes
        </h3>
        
        {shapes.map((shape) => {
          const Icon = shape.icon;
          return (
            <Card
              key={shape.type}
              className="p-3 hover:border-primary cursor-pointer transition-all group"
              onClick={() => onAddShape(shape.type)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${shape.color}20` }}
                >
                  <Icon size={16} style={{ color: shape.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">
                    {shape.label}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Click to add to canvas
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ShapeLibrary;