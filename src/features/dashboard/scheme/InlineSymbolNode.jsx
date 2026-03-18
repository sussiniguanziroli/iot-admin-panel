import React, { memo, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { X, Settings } from 'lucide-react';
import { getSymbol } from './ElectricalSymbols';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import EditSymbolModal from './EditSymbolModal';

const WHITE = '#e2e8f0';

const SymbolScaleWrapper = memo(({ SymbolComponent, color }) => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <style>{`
      .sym-scale > svg {
        width: 100% !important;
        height: 100% !important;
        max-width: unset !important;
        overflow: visible;
      }
    `}</style>
    <div className="sym-scale" style={{ width: '100%', height: '100%' }}>
      <SymbolComponent color={color} />
    </div>
  </div>
));

// Offset en px entre el borde del nodo y la etiqueta
const LABEL_GAP = 6;

const labelStyle = (pos) => {
  const base = {
    position:      'absolute',
    fontSize:       9,
    fontWeight:     700,
    fontFamily:    '"SFMono-Regular", Consolas, monospace',
    color:         '#94a3b8',
    whiteSpace:    'nowrap',
    letterSpacing: '0.04em',
    pointerEvents: 'none',
    textTransform: 'uppercase',
    lineHeight:     1,
    zIndex:         5,
  };
  switch (pos) {
    case 'top':
      return { ...base, bottom: `calc(100% + ${LABEL_GAP}px)`, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom':
      return { ...base, top:    `calc(100% + ${LABEL_GAP}px)`, left: '50%', transform: 'translateX(-50%)' };
    case 'left':
      return { ...base, right:  `calc(100% + ${LABEL_GAP}px)`, top:  '50%', transform: 'translateY(-50%)', textAlign: 'right' };
    case 'right':
      return { ...base, left:   `calc(100% + ${LABEL_GAP}px)`, top:  '50%', transform: 'translateY(-50%)' };
    default:
      return { ...base, top:    `calc(100% + ${LABEL_GAP}px)`, left: '50%', transform: 'translateX(-50%)' };
  }
};

const BTN = {
  display:      'flex', alignItems: 'center', justifyContent: 'center',
  cursor:       'pointer',
  zIndex:        9999,
  padding:        0,
  position:     'absolute',
  width:         26, height: 26,
  borderRadius: '50%',
  boxShadow:    '0 2px 8px rgba(0,0,0,0.6)',
  pointerEvents:'all',
};

const InlineSymbolNode = memo(({ data, selected, id }) => {
  const {
    isEditMode,
    diagramEdges,
    updateDiagramNode,
    removeDiagramNode,
  } = useDashboard();
  const { can } = usePermissions();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const symbolType = data.symbolType ?? 'fuse';
  const rotation   = data.rotation   ?? 0;
  const label      = data.label      ?? '';
  const labelPos   = data.labelPos   ?? 'bottom';
  const isVertical = rotation === 0 || rotation === 180;

  const SymbolComponent = getSymbol(symbolType);

  const connected = new Set();
  diagramEdges.forEach(e => {
    if (e.source === id) connected.add(e.sourceHandle ?? (isVertical ? 'bottom' : 'right'));
    if (e.target === id) connected.add(e.targetHandle ?? (isVertical ? 'top'    : 'left'));
  });

  const hStyle = (hId) => {
    const isConn = connected.has(hId);
    return {
      width:           10, height: 10,
      backgroundColor: isConn ? WHITE : (isEditMode ? '#2d3e52' : 'transparent'),
      border:          isConn ? '2px solid #020617' : isEditMode ? '1px dashed #1e3a5f' : 'none',
      borderRadius:    '50%',
      opacity:         (isEditMode || isConn) ? 1 : 0,
      zIndex:          10,
      boxShadow:       isConn ? `0 0 5px ${WHITE}55` : 'none',
      transition:      'opacity 0.25s ease',
    };
  };

  const remove = useCallback((e) => {
    e.stopPropagation();
    removeDiagramNode(id);
  }, [id, removeDiagramNode]);

  const handleSaveEdit = useCallback(({ symbolType: st, rotation: r, label: l, labelPos: lp }) => {
    updateDiagramNode(id, { symbolType: st, rotation: r, label: l, labelPos: lp });
  }, [id, updateDiagramNode]);

  return (
    <>
      <div style={{
        position:       'relative',
        width:          '100%',
        height:         '100%',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        userSelect:     'none',
        // overflow visible para que label y botones no se corten
        overflow:       'visible',
      }}>

        {/* Resizer */}
        {isEditMode && can.editDashboard && (
          <NodeResizer
            isVisible={true}
            minWidth={40}  maxWidth={400}
            minHeight={40} maxHeight={400}
            lineStyle={{ border: '1.5px dashed #3b82f655', borderRadius: 4 }}
            handleStyle={{
              width: 14, height: 14,
              backgroundColor: '#1e3a5f',
              border: '2px solid #3b82f6',
              borderRadius: 3, zIndex: 40,
            }}
          />
        )}

        {/* Handles */}
        {isVertical ? (
          <>
            <Handle id="top"    type="target" position={Position.Top}    style={hStyle('top')} />
            <Handle id="bottom" type="source" position={Position.Bottom} style={hStyle('bottom')} />
          </>
        ) : (
          <>
            <Handle id="left"  type="target" position={Position.Left}  style={hStyle('left')} />
            <Handle id="right" type="source" position={Position.Right} style={hStyle('right')} />
          </>
        )}

        {/* Símbolo escalado */}
        <div style={{
          position:       'absolute',
          inset:           isEditMode ? 10 : 0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          transform:      `rotate(${rotation}deg)`,
          transformOrigin:'center center',
          transition:     'transform 0.3s ease',
          overflow:       'visible',
          outline:         selected ? '1.5px dashed rgba(96,165,250,0.45)' : 'none',
          outlineOffset:   3,
          borderRadius:    3,
        }}>
          <SymbolScaleWrapper SymbolComponent={SymbolComponent} color={WHITE} />
        </div>

        {/* Label en el costado elegido */}
        {label && (
          <span style={labelStyle(labelPos)}>
            {label}
          </span>
        )}

        {/* Botones de edición */}
        {isEditMode && can.editDashboard && (
          <>
            {/* Engranaje — editar */}
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
              title="Editar símbolo"
              style={{
                ...BTN,
                top: -14, left: -14,
                backgroundColor: '#0f172a',
                color:           '#94a3b8',
                border:          '2px solid #3b82f6',
                transition:      'background-color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0f172a'; }}
            >
              <Settings size={12} />
            </button>

            {/* Eliminar */}
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={remove}
              title="Eliminar símbolo"
              style={{
                ...BTN,
                top: -14, right: -14,
                backgroundColor: '#ef4444',
                color:           '#fff',
                border:          '2px solid #020617',
              }}
            >
              <X size={11} strokeWidth={3} />
            </button>
          </>
        )}
      </div>

      {isEditModalOpen && ReactDOM.createPortal(
        <EditSymbolModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          initialData={{ symbolType, rotation, label, labelPos }}
        />,
        document.body
      )}
    </>
  );
});

InlineSymbolNode.displayName = 'InlineSymbolNode';
export default InlineSymbolNode;