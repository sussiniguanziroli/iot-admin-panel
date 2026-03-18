import React, { memo, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position } from '@xyflow/react';
import { X, Settings } from 'lucide-react';
import { getDeviceConfig } from './deviceRegistry';
import { getSymbol } from './ElectricalSymbols';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import NodeVariablePickerModal from './NodeVariablePickerModal';

const HANDLE_BASE = {
  width:        10,
  height:       10,
  borderRadius: '50%',
  zIndex:       10,
  transition:   'opacity 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease',
};

const HANDLE_DEFS = [
  { id: 'top',    type: 'target', position: Position.Top    },
  { id: 'bottom', type: 'source', position: Position.Bottom },
  { id: 'left',   type: 'target', position: Position.Left   },
  { id: 'right',  type: 'source', position: Position.Right  },
];

const SchemNode = memo(({ data, selected, id }) => {
  const {
    isEditMode, removeMachine,
    nodeDisplayValues, updateDiagramNode,
    diagramEdges,
  } = useDashboard();
  const { can } = usePermissions();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const cfg             = getDeviceConfig(data.deviceType);
  const isInteractive   = cfg.interactive !== false;
  const SymbolComponent = getSymbol(data.deviceType);

  const displayInfo = nodeDisplayValues[data.machineId] || {};
  const { displayValue, displayUnit, isOnline } = displayInfo;
  const hasStatus = !!data.powerWidgetId && isInteractive;
  const isLive    = hasStatus && isOnline === true;
  const isOffline = hasStatus && isOnline === false;
  const symbolColor = isOffline ? '#1e3a5f' : '#e2e8f0';

  const connectedHandleIds = useMemo(() => {
    const set = new Set();
    diagramEdges.forEach(edge => {
      if (edge.source === id) set.add(edge.sourceHandle ?? 'bottom');
      if (edge.target === id) set.add(edge.targetHandle ?? 'top');
    });
    return set;
  }, [diagramEdges, id]);

  const handleStyle = (handleId) => {
    const connected = connectedHandleIds.has(handleId);
    const visible   = isEditMode || connected;
    const base = {
      ...HANDLE_BASE,
      backgroundColor: connected ? '#e2e8f0' : isEditMode ? '#334155' : 'transparent',
      border:          connected ? '2px solid #020617' : isEditMode ? '2px dashed #1e3a5f' : 'none',
      opacity:         visible ? 1 : 0,
      pointerEvents:   isEditMode ? 'all' : 'none',
      boxShadow:       connected ? '0 0 6px #e2e8f080' : 'none',
    };
    if (handleId === 'left' || handleId === 'right') {
      return { ...base, top: '50%', transform: 'translateY(-50%)' };
    }
    return base;
  };

  const containerBorder = selected
    ? '2px solid #3b82f6'
    : isLive ? `2px solid ${cfg.color}55`
    : isInteractive ? '1.5px solid #1a2741' : '1.5px solid transparent';

  const containerShadow = selected
    ? '0 0 0 3px rgba(59,130,246,0.35), 0 4px 24px rgba(0,0,0,0.8)'
    : isLive ? `0 0 0 1px ${cfg.color}30, 0 0 18px ${cfg.color}28`
    : isInteractive ? '0 2px 14px rgba(0,0,0,0.65)' : 'none';

  const handleSave = ({ displayWidgetId, powerWidgetId }) => {
    updateDiagramNode(data.machineId, { displayWidgetId, powerWidgetId });
    setIsPickerOpen(false);
  };

  const BTN_BASE = {
    position:        'absolute',
    width:            22, height: 22,
    borderRadius:    '50%',
    display:         'flex', alignItems: 'center', justifyContent: 'center',
    cursor:          'pointer',
    // z-index alto pero dentro del mismo nodo
    zIndex:           9999,
    padding:           0,
    border:           '2px solid #020617',
    pointerEvents:   'all',
  };

  return (
    <>
      {/*
        Wrapper externo: overflow visible para que los botones
        absolutos salgan fuera del borde sin ser cortados.
        Sin transform ni opacity aquí para no crear stacking context.
      */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        position:      'relative',
        cursor:         isInteractive ? 'pointer' : 'default',
        userSelect:    'none',
        // overflow visible es crítico — permite que los botones
        // salgan del bounding box del nodo sin recortarse
        overflow:      'visible',
      }}>

        {HANDLE_DEFS.map(({ id: hId, type, position }) => (
          <Handle key={hId} id={hId} type={type} position={position}
            style={handleStyle(hId)} />
        ))}

        {hasStatus && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 20, marginBottom: 2,
            backgroundColor: isLive ? `${cfg.color}18` : '#06080f',
            border: `1px solid ${isLive ? `${cfg.color}35` : '#0d1525'}`,
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: isLive ? cfg.color : '#1e293b',
              boxShadow: isLive ? `0 0 7px ${cfg.color}` : 'none',
              transition: 'all 0.4s',
            }} />
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', fontFamily: 'monospace',
              color: isLive ? cfg.color : '#1e3a5f',
            }}>
              {isOnline === undefined ? 'esp.' : isOnline ? 'ON' : 'OFF'}
            </span>
          </div>
        )}

        {/*
          Contenedor del símbolo: position relative para anclar
          los botones de edición. overflow visible para no recortar.
        */}
        <div style={{
          position:        'relative',
          borderRadius:     isInteractive ? 10 : 4,
          border:           containerBorder,
          backgroundColor:  isInteractive ? (selected ? '#0d1f3c' : '#07101e') : 'transparent',
          boxShadow:        containerShadow,
          transition:      'all 0.3s ease',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          // SIN overflow hidden — permite que los botones salgan
          overflow:        'visible',
        }}>

          {/* Símbolo */}
          <div style={{ padding: '8px 8px 4px' }}>
            <SymbolComponent color={symbolColor} />
          </div>

          {/* Label + valor dentro de la caja */}
          <div style={{
            width:         '100%',
            padding:       '4px 6px 6px',
            borderTop:     `1px solid ${isInteractive ? '#0f1e36' : 'transparent'}`,
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:            2,
          }}>
            <span style={{
              fontSize:      9, fontWeight: 800,
              color:          isOffline ? '#1e3a5f' : '#94a3b8',
              textAlign:     'center', maxWidth: 110,
              wordBreak:     'break-word', lineHeight: 1.3,
              fontFamily:   '"SFMono-Regular", Consolas, monospace',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {data.label}
            </span>

            {isInteractive && data.displayWidgetId && displayValue !== undefined && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 1 }}>
                <span style={{
                  fontSize: 12, fontWeight: 800, fontFamily: 'monospace',
                  color: isLive ? cfg.color : '#2d3d54',
                }}>
                  {typeof displayValue === 'number'
                    ? (Number.isInteger(displayValue) ? String(displayValue) : displayValue.toFixed(2))
                    : String(displayValue)}
                </span>
                {displayUnit && (
                  <span style={{ fontSize: 8, color: '#3d5068', fontWeight: 600 }}>
                    {displayUnit}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Botones de edición — absolutos dentro del contenedor */}
          {isEditMode && can.editDashboard && (
            <>
              {isInteractive && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setIsPickerOpen(true); }}
                  title="Configurar variables"
                  style={{
                    ...BTN_BASE,
                    top: -11, left: -11,
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
                >
                  <Settings size={11} />
                </button>
              )}
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); removeMachine(data.machineId); }}
                title="Eliminar nodo"
                style={{
                  ...BTN_BASE,
                  top: -11, right: -11,
                  backgroundColor: '#ef4444',
                  color: '#fff',
                }}
              >
                <X size={10} strokeWidth={3} />
              </button>
            </>
          )}
        </div>
      </div>

      {isPickerOpen && ReactDOM.createPortal(
        <NodeVariablePickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSave={handleSave}
          machineId={data.machineId}
          nodeData={data}
        />,
        document.body
      )}
    </>
  );
});

SchemNode.displayName = 'SchemNode';
export default SchemNode;