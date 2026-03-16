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

  const isOperatorEdge = style.stroke === '#a855f7';

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
            style={{ fontSize: 10, fill: '#a855f7' }}
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