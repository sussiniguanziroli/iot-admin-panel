import React from 'react';
import { BaseEdge, getSmoothStepPath } from '@xyflow/react';

const FlowEdge = ({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, selected,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const hasFlow   = data?.hasFlow   || false;
  const flowColor = data?.flowColor || '#22d3ee';

  return (
    <>
      {hasFlow && (
        <defs>
          <filter id={`ef-${id}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      <BaseEdge
        path={edgePath}
        id={id}
        interactionWidth={20}
        style={{
          stroke: selected ? '#60a5fa' : hasFlow ? flowColor : '#2d3748',
          strokeWidth: hasFlow ? 2.5 : 1.5,
          strokeDasharray: hasFlow ? 'none' : '5 5',
          filter: hasFlow ? `url(#ef-${id})` : 'none',
          transition: 'stroke 0.3s, stroke-width 0.3s',
        }}
      />

      {hasFlow && (
        <path
          d={edgePath}
          fill="none"
          stroke={flowColor}
          strokeWidth={2}
          strokeDasharray="10 18"
          strokeLinecap="round"
          style={{
            animation: 'flowDash 1.4s linear infinite',
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

export default FlowEdge;