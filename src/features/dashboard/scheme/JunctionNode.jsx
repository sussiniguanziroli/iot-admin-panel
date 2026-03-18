import React, { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';

const WHITE = '#e2e8f0';
const DOT   = 10;   // diámetro del punto visual
const NODE  = 12;   // wrapper = casi igual al punto → líneas convergen al centro

const JunctionNode = memo(({ data, selected, id }) => {
  const { isEditMode, diagramEdges, removeDiagramNode } = useDashboard();
  const { can } = usePermissions();

  const connectedHandleIds = useMemo(() => {
    const s = new Set();
    diagramEdges.forEach(e => {
      if (e.source === id) s.add(e.sourceHandle ?? 'bottom');
      if (e.target === id) s.add(e.targetHandle ?? 'top');
    });
    return s;
  }, [diagramEdges, id]);

  // Handle invisible — solo área de conexión
  const hStyle = (isLR = false) => ({
    width:           8,
    height:          8,
    backgroundColor: 'transparent',
    border:          'none',
    borderRadius:   '50%',
    opacity:          0,
    zIndex:           20,
    ...(isLR ? { top: '50%', transform: 'translateY(-50%)' } : {}),
  });

  return (
    <div style={{
      position:       'relative',
      width:           NODE,
      height:          NODE,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      userSelect:     'none',
      overflow:       'visible',
    }}>

      {/* ── Handles en los 4 bordes del wrapper de 12px ─────────
          Las líneas se conectan aquí → muy cerca del centro dot  */}
      <Handle id="top"    type="source" position={Position.Top}    style={hStyle()} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={hStyle()} />
      <Handle id="left"   type="source" position={Position.Left}   style={hStyle(true)} />
      <Handle id="right"  type="source" position={Position.Right}  style={hStyle(true)} />

      {/* ── Punto visual ──────────────────────────────────────── */}
      <div style={{
        width:           selected ? 14 : DOT,
        height:          selected ? 14 : DOT,
        borderRadius:   '50%',
        backgroundColor: WHITE,
        boxShadow:       selected
          ? `0 0 0 3px rgba(96,165,250,0.3), 0 0 10px ${WHITE}70`
          : `0 0 5px ${WHITE}55`,
        transition:     'all 0.15s ease',
        pointerEvents:  'none',
        zIndex:          10,
        flexShrink:      0,
      }} />

      {/* ── Zona de drag — solo en edit mode ──────────────────────
          Clase .jct-drag → ReactFlow la usa como dragHandle.
          Grande para agarrar fácil, z-index por debajo de handles
          para no interferir con las conexiones.               */}
      {isEditMode && (
        <div
          className="jct-drag"
          style={{
            position:        'absolute',
            top:             '50%',
            left:            '50%',
            transform:       'translate(-50%, -50%)',
            width:            40,
            height:           40,
            borderRadius:   '50%',
            cursor:          'grab',
            zIndex:           2,   // debajo de handles (z:20) y del punto (z:10)
            backgroundColor:  selected
              ? 'rgba(96,165,250,0.09)'
              : 'rgba(255,255,255,0.05)',
            border:           selected
              ? '1px dashed rgba(96,165,250,0.3)'
              : '1px dashed rgba(255,255,255,0.10)',
            transition:      'background-color 0.2s',
          }}
        />
      )}

      {/* ── Botón eliminar ────────────────────────────────────── */}
      {isEditMode && can.editDashboard && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); removeDiagramNode(id); }}
          title="Eliminar empalme"
          style={{
            position:        'absolute',
            top:             -14,
            right:           -14,
            width:            18,
            height:           18,
            borderRadius:   '50%',
            backgroundColor: '#ef4444',
            color:           '#fff',
            border:          '1.5px solid #020617',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            cursor:         'pointer',
            zIndex:          50,
            padding:          0,
            boxShadow:      '0 2px 6px rgba(0,0,0,0.6)',
          }}
        >
          <X size={8} strokeWidth={3} />
        </button>
      )}
    </div>
  );
});

JunctionNode.displayName = 'JunctionNode';
export default JunctionNode;