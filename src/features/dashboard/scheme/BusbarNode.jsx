import React, { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { X, Pencil, Check } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';

const TAP_POSITIONS = [10, 25, 40, 55, 70, 85];

const BusbarNode = memo(({ data, selected, id }) => {
  const { isEditMode, removeMachine, updateDiagramNode, diagramEdges } = useDashboard();
  const { can } = usePermissions();

  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(data.label ?? 'Barra');

  const color   = data.busbarColor ?? '#94a3b8';
  const label   = data.label       ?? 'Barra';
  const voltage = data.voltage      ?? '';

  const connectedHandleIds = useMemo(() => {
    const s = new Set();
    diagramEdges.forEach(e => {
      if (e.source === id && e.sourceHandle) s.add(e.sourceHandle);
      if (e.target === id && e.targetHandle) s.add(e.targetHandle);
    });
    return s;
  }, [diagramEdges, id]);

  const hStyle = (hId, pos) => {
    const conn    = connectedHandleIds.has(hId);
    const visible = isEditMode || conn;
    return {
      width:           conn ? 10 : 7,
      height:          conn ? 10 : 7,
      backgroundColor: conn ? color : (isEditMode ? '#2d3e52' : 'transparent'),
      border:          conn ? '2px solid #020617' : isEditMode ? '1px dashed #1e3a5f' : 'none',
      borderRadius:    '50%',
      opacity:          visible ? 1 : 0,
      zIndex:           20,
      boxShadow:        conn ? `0 0 6px ${color}80` : 'none',
      transition:      'opacity 0.25s ease',
    };
  };

  const commitLabel = useCallback(() => {
    if (draft.trim()) updateDiagramNode(data.machineId, { label: draft.trim() });
    setEditing(false);
  }, [draft, data.machineId, updateDiagramNode]);

  const onKey = (e) => {
    if (e.key === 'Enter')  commitLabel();
    if (e.key === 'Escape') { setDraft(label); setEditing(false); }
  };

  return (
    <div style={{
      position:  'relative',
      width:     '100%',
      // Altura fija: 4px de barra + espacio para handles top/bottom
      height:     4,
    }}>

      {/* ── Resizer solo horizontal ──────────────────────────────────── */}
      {isEditMode && can.editDashboard && (
        <NodeResizer
          isVisible={selected}
          minWidth={80}   maxWidth={1600}
          minHeight={4}   maxHeight={4}
          handleStyle={{
            width: 10, height: 10,
            backgroundColor: color,
            border: '2px solid #020617', borderRadius: 3,
          }}
          lineStyle={{ border: `1px dashed ${color}40` }}
        />
      )}

      {/* ── Handles top — target ────────────────────────────────────── */}
      {TAP_POSITIONS.map(pct => (
        <Handle
          key={`t-${pct}`} id={`t-${pct}`}
          type="target" position={Position.Top}
          style={{ ...hStyle(`t-${pct}`, Position.Top), left: `${pct}%`, top: -4 }}
        />
      ))}

      {/* ── Handles bottom — source ─────────────────────────────────── */}
      {TAP_POSITIONS.map(pct => (
        <Handle
          key={`b-${pct}`} id={`b-${pct}`}
          type="source" position={Position.Bottom}
          style={{ ...hStyle(`b-${pct}`, Position.Bottom), left: `${pct}%`, bottom: -4 }}
        />
      ))}

      {/* Extremos izq/der */}
      <Handle id="left"  type="target" position={Position.Left}
        style={{ ...hStyle('left',  Position.Top), left: -5, top: '50%' }} />
      <Handle id="right" type="source" position={Position.Right}
        style={{ ...hStyle('right', Position.Top), right: -5, top: '50%' }} />

      {/* ── Línea de barra ──────────────────────────────────────────── */}
      <div style={{
        position:        'absolute',
        inset:            0,
        backgroundColor:  selected ? '#cbd5e1' : color,
        borderRadius:     2,
        boxShadow:        selected
          ? `0 0 0 2px rgba(203,213,225,0.4), 0 0 14px ${color}50`
          : `0 0 10px ${color}35`,
        transition:      'background-color 0.2s, box-shadow 0.2s',
      }} />

      {/* ── Label superpuesto ENCIMA de la barra ────────────────────── */}
      {/* position absolute con top negativo → flota justo sobre la línea */}
      <div style={{
        position:    'absolute',
        top:         -18,
        left:          0,
        display:     'flex',
        alignItems:  'center',
        gap:          6,
        pointerEvents: isEditMode ? 'auto' : 'none',
      }}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={commitLabel}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize:    9,
              fontWeight:  800,
              fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
              color:        color,
              background:  'transparent',
              border:      'none',
              outline:     'none',
              width:        120,
              letterSpacing:'0.06em',
              textTransform:'uppercase',
            }}
          />
        ) : (
          <span style={{
            fontSize:     9,
            fontWeight:   800,
            fontFamily:  '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
            color:         color,
            whiteSpace:   'nowrap',
            letterSpacing:'0.06em',
            textTransform:'uppercase',
            cursor:        isEditMode ? 'text' : 'default',
          }}
            onDoubleClick={() => isEditMode && setEditing(true)}
          >
            {label}
          </span>
        )}

        {voltage && (
          <span style={{
            fontSize:     8,
            fontWeight:   700,
            fontFamily:  '"SFMono-Regular", Consolas, monospace',
            color:         color,
            opacity:       0.65,
            letterSpacing:'0.04em',
          }}>
            {voltage}
          </span>
        )}
      </div>

      {/* ── Controles de edición ────────────────────────────────────── */}
      {isEditMode && can.editDashboard && (
        <>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (editing) commitLabel(); else setEditing(true);
            }}
            style={{
              position: 'absolute', top: -18, left: -20,
              width: 18, height: 18, borderRadius: '50%',
              backgroundColor: editing ? '#10b981' : '#1e293b',
              color: editing ? '#fff' : '#64748b',
              border: '1.5px solid #020617',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 30, padding: 0,
            }}
          >
            {editing ? <Check size={9} strokeWidth={3} /> : <Pencil size={9} />}
          </button>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); removeMachine(data.machineId); }}
            style={{
              position: 'absolute', top: -14, right: -14,
              width: 20, height: 20, borderRadius: '50%',
              backgroundColor: '#ef4444', color: '#fff',
              border: '2px solid #020617',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 30, padding: 0,
            }}
          >
            <X size={9} strokeWidth={3} />
          </button>
        </>
      )}
    </div>
  );
});

BusbarNode.displayName = 'BusbarNode';
export default BusbarNode;