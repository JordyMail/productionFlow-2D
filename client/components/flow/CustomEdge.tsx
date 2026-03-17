// client/components/flow/CustomEdge.tsx
import React from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isOperatorEdge = data && data.operatorId;
  const edgeColor = style.stroke as string || (isOperatorEdge ? '#a855f7' : '#1e293b');

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      {isOperatorEdge && data && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ 
              fontSize: 10, 
              fill: edgeColor,
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(255,255,255,0.8)'
            }}
            startOffset="50%"
            textAnchor="middle"
          >
            {data.sourceProcess} → {data.targetProcess}
          </textPath>
        </text>
      )}
    </>
  );
};

export default CustomEdge;