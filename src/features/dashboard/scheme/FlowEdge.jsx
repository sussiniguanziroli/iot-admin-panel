import React from 'react';

const getElbowPath = (sx, sy, tx, ty) => {
  const dx = Math.abs(tx - sx);

  if (dx < 12) {
    return `M ${sx} ${sy} L ${sx} ${ty}`;
  }

  const my = (sy + ty) / 2;
  return (
    `M ${sx} ${sy} ` +
    `L ${sx} ${my} ` +
    `L ${tx} ${my} ` +
    `L ${tx} ${ty}`
  );
};

const FlowEdge = ({
  id,
  sourceX, sourceY,
  targetX, targetY,
  data, selected,
}) => {
  const hasFlow   = data?.hasFlow   ?? false;
  const flowColor = data?.flowColor ?? '#22d3ee';

  const path = getElbowPath(sourceX, sourceY, targetX, targetY);

  const conductorColor = selected
    ? '#60a5fa'
    : hasFlow
      ? flowColor
      : '#e2e8f0';

  const sw = hasFlow ? 2.5 : 2;

  return (
    <>
      {hasFlow && (
        <defs>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}

      {/* Halo */}
      <path
        d={path}
        fill="none"
        stroke={hasFlow ? `${flowColor}25` : '#1a2741'}
        strokeWidth={sw + 5}
        strokeLinecap="square"
        strokeLinejoin="miter"
        style={{ pointerEvents: 'none' }}
      />

      {/* Conductor principal */}
      <path
        d={path}
        fill="none"
        stroke={conductorColor}
        strokeWidth={sw}
        strokeLinecap="square"
        strokeLinejoin="miter"
        style={{
          filter:     hasFlow ? `url(#glow-${id})` : 'none',
          transition: 'stroke 0.35s ease, stroke-width 0.35s ease',
          cursor:     'pointer',
        }}
      />

      {/* Overlay de flujo animado */}
      {hasFlow && (
        <path
          d={path}
          fill="none"
          stroke={flowColor}
          strokeWidth={1.5}
          strokeDasharray="8 18"
          strokeLinecap="square"
          style={{
            animation:     'flowDash 1.1s linear infinite',
            opacity:        0.65,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Nodo en source */}
      <circle
        cx={sourceX} cy={sourceY} r={3}
        fill={hasFlow ? flowColor : '#e2e8f0'}
        style={{
          filter:     hasFlow ? `url(#glow-${id})` : 'none',
          transition: 'fill 0.3s',
        }}
      />

      {/* Nodo en target */}
      <circle
        cx={targetX} cy={targetY} r={3}
        fill={hasFlow ? flowColor : '#e2e8f0'}
        style={{
          filter:     hasFlow ? `url(#glow-${id})` : 'none',
          transition: 'fill 0.3s',
        }}
      />
    </>
  );
};

export default FlowEdge;