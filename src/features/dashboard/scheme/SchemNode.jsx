import React, { memo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position } from '@xyflow/react';
import { X, Settings } from 'lucide-react';
import { getDeviceConfig } from './deviceRegistry';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import NodeVariablePickerModal from './NodeVariablePickerModal';

const handleBase = {
  border: 'none',
  width: 10,
  height: 10,
  borderRadius: '50%',
  zIndex: 10,
};

const SchemNode = memo(({ data, selected }) => {
  const { isEditMode, removeMachine, widgets, nodeDisplayValues, updateDiagramNode, diagramEdges } = useDashboard();
  const { can } = usePermissions();

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const cfg  = getDeviceConfig(data.deviceType);
  const Icon = cfg.icon;

  const nodeWidgets   = widgets.filter(w => w.machineId === data.machineId);
  const displayWidget = widgets.find(w => w.id === data.displayWidgetId);
  const displayLabel  = displayWidget?.label || displayWidget?.title || null;

  const displayInfo = nodeDisplayValues[data.machineId] || {};
  const { displayValue, displayUnit, isOnline } = displayInfo;

  const hasStatus  = !!data.powerWidgetId;
  const hasDisplay = !!data.displayWidgetId;
  const isOffline  = hasStatus && isOnline === false;
  const isLive     = hasStatus && isOnline === true;

  const nodeEdges    = diagramEdges.filter(e => e.source === data.machineId || e.target === data.machineId);
  const hasTop       = nodeEdges.some(e => e.target === data.machineId);
  const hasBottom    = nodeEdges.some(e => e.source === data.machineId);
  const hasLeft      = nodeEdges.some(e => e.target === data.machineId);
  const hasRight     = nodeEdges.some(e => e.source === data.machineId);
  const hasAnyEdge   = nodeEdges.length > 0;

  const showHandles  = isEditMode && can.editDashboard;
  const showTop      = showHandles || hasTop;
  const showBottom   = showHandles || hasBottom;
  const showLeft     = showHandles || hasLeft;
  const showRight    = showHandles || hasRight;

  const h = {
    ...handleBase,
    background: isOffline ? '#1e293b' : cfg.color,
    opacity: showHandles ? 1 : 0,
    pointerEvents: showHandles ? 'all' : 'none',
  };

  const hConnected = {
    ...handleBase,
    background: isOffline ? '#334155' : cfg.color,
    opacity: 1,
    pointerEvents: 'none',
  };

  const borderColor = selected
    ? '#3b82f6'
    : isLive
      ? cfg.color
      : isOffline
        ? '#1a2234'
        : cfg.ring;

  const boxShadow = selected
    ? '0 0 0 3px rgba(59,130,246,0.35), 0 8px 32px rgba(0,0,0,0.7)'
    : isLive
      ? `0 0 0 1px ${cfg.color}50, 0 0 18px ${cfg.color}35, 0 8px 28px rgba(0,0,0,0.7)`
      : isOffline
        ? '0 2px 12px rgba(0,0,0,0.8)'
        : '0 4px 20px rgba(0,0,0,0.6)';

  const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'ON' : 'OFF';
    if (typeof val === 'number')  return val % 1 === 0 ? String(val) : val.toFixed(2);
    return String(val);
  };

  const handleSave = ({ displayWidgetId, powerWidgetId }) => {
    updateDiagramNode(data.machineId, { displayWidgetId, powerWidgetId });
    setIsPickerOpen(false);
  };

  return (
    <>
      <div
        style={{
          backgroundColor: isOffline ? '#0a0f1a' : '#0f172a',
          borderColor,
          borderWidth: 2,
          borderStyle: 'solid',
          borderRadius: 16,
          width: 140,
          boxShadow,
          position: 'relative',
          cursor: 'pointer',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease',
        }}
      >
        {showTop
          ? <Handle type="target" position={Position.Top}    style={hasTop ? hConnected : h} />
          : null
        }
        {showBottom
          ? <Handle type="source" position={Position.Bottom} style={hasBottom ? hConnected : h} />
          : null
        }
        {showLeft
          ? <Handle type="target" position={Position.Left}   style={hasLeft ? hConnected : h} />
          : null
        }
        {showRight
          ? <Handle type="source" position={Position.Right}  style={hasRight ? hConnected : h} />
          : null
        }

        <div style={{ padding: '12px 10px 11px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>

          {hasStatus && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 20,
              backgroundColor: isLive ? `${cfg.color}15` : '#111827',
              alignSelf: 'stretch', justifyContent: 'center',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: isLive ? cfg.color : '#1e293b',
                boxShadow: isLive ? `0 0 6px ${cfg.color}` : 'none',
                flexShrink: 0,
                transition: 'all 0.3s',
              }} />
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: isLive ? cfg.color : '#1e3a5f',
                transition: 'color 0.3s',
              }}>
                {isOnline === undefined ? 'esperando' : isOnline ? 'online' : 'offline'}
              </span>
            </div>
          )}

          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: isOffline ? '#0d1525' : `${cfg.color}18`,
            border: `1px solid ${isOffline ? '#1a2234' : `${cfg.color}30`}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s',
          }}>
            <Icon size={22} style={{ color: isOffline ? '#1e293b' : cfg.color, transition: 'color 0.3s' }} />
          </div>

          <span style={{
            fontSize: 11, fontWeight: 700,
            color: isOffline ? '#1e3a5f' : '#e2e8f0',
            textAlign: 'center', lineHeight: 1.35,
            maxWidth: 116, wordBreak: 'break-word',
            transition: 'color 0.3s',
          }}>
            {data.label}
          </span>

          {hasDisplay && (
            <div style={{
              width: '100%',
              borderTop: `1px solid ${isOffline ? '#0d1525' : '#1e293b'}`,
              paddingTop: 7,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{
                  fontSize: 15, fontWeight: 800, fontFamily: 'monospace',
                  color: isOffline ? '#1a2e4a' : isLive ? cfg.color : '#94a3b8',
                  lineHeight: 1,
                  transition: 'color 0.3s',
                }}>
                  {formatValue(displayValue)}
                </span>
                {displayUnit && (
                  <span style={{
                    fontSize: 9, fontWeight: 600,
                    color: isOffline ? '#111827' : isLive ? `${cfg.color}99` : '#475569',
                    transition: 'color 0.3s',
                  }}>
                    {displayUnit}
                  </span>
                )}
              </div>
              {displayLabel && (
                <span style={{ fontSize: 9, color: isOffline ? '#111827' : '#3d4f6b', fontWeight: 600 }}>
                  {displayLabel}
                </span>
              )}
            </div>
          )}

          {nodeWidgets.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                backgroundColor: isOffline ? '#1a2234' : cfg.color,
                transition: 'background-color 0.3s',
              }} />
              <span style={{
                fontSize: 9, fontFamily: 'monospace',
                color: isOffline ? '#1a2234' : `${cfg.color}aa`,
                transition: 'color 0.3s',
              }}>
                {nodeWidgets.length}w
              </span>
            </div>
          )}
        </div>

        {isEditMode && can.editDashboard && (
          <>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setIsPickerOpen(true); }}
              style={{
                position: 'absolute', top: -9, left: -9,
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: '#1e293b', color: '#64748b',
                border: '2px solid #0f172a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 20, padding: 0,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1e293b'; e.currentTarget.style.color = '#64748b'; }}
            >
              <Settings size={10} />
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removeMachine(data.machineId); }}
              style={{
                position: 'absolute', top: -9, right: -9,
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: '#ef4444', color: '#fff',
                border: '2px solid #0f172a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 20, padding: 0,
              }}
            >
              <X size={10} strokeWidth={3} />
            </button>
          </>
        )}
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