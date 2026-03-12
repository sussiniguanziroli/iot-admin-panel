import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { X } from 'lucide-react';
import { getDeviceConfig } from './deviceRegistry';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';

const handleBase = {
  border: 'none',
  width: 10,
  height: 10,
  borderRadius: '50%',
  zIndex: 10,
};

const SchemNode = memo(({ data, selected }) => {
  const { isEditMode, removeMachine, widgets } = useDashboard();
  const { can } = usePermissions();
  const cfg = getDeviceConfig(data.deviceType);
  const Icon = cfg.icon;
  const nodeWidgets = widgets.filter(w => w.machineId === data.machineId);
  const h = { ...handleBase, background: cfg.color };

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        borderColor: selected ? '#3b82f6' : cfg.ring,
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 16,
        width: 120,
        boxShadow: selected
          ? `0 0 0 3px rgba(59,130,246,0.35), 0 8px 32px rgba(0,0,0,0.7)`
          : '0 4px 24px rgba(0,0,0,0.6)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      <Handle type="target" position={Position.Top}    style={{ ...h, left: '50%', top: -5 }} />
      <Handle type="source" position={Position.Bottom} style={{ ...h, left: '50%', bottom: -5 }} />
      <Handle type="target" position={Position.Left}   style={{ ...h, top: '50%', left: -5 }} />
      <Handle type="source" position={Position.Right}  style={{ ...h, top: '50%', right: -5 }} />

      <div style={{ padding: '14px 10px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          backgroundColor: `${cfg.color}18`,
          border: `1px solid ${cfg.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} style={{ color: cfg.color }} />
        </div>

        <span style={{
          fontSize: 11, fontWeight: 700, color: '#e2e8f0',
          textAlign: 'center', lineHeight: 1.35,
          maxWidth: 96, wordBreak: 'break-word',
        }}>
          {data.label}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: nodeWidgets.length > 0 ? cfg.color : '#334155',
          }} />
          <span style={{
            fontSize: 9, fontFamily: 'monospace',
            color: nodeWidgets.length > 0 ? `${cfg.color}cc` : '#475569',
          }}>
            {nodeWidgets.length > 0 ? `${nodeWidgets.length} widget${nodeWidgets.length > 1 ? 's' : ''}` : 'vacío'}
          </span>
        </div>
      </div>

      {isEditMode && can.editDashboard && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); removeMachine(data.machineId); }}
          style={{
            position: 'absolute', top: -9, right: -9,
            width: 20, height: 20, borderRadius: '50%',
            backgroundColor: '#ef4444', color: '#fff', border: '2px solid #0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 20, padding: 0,
            transition: 'background-color 0.15s',
          }}
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}
    </div>
  );
});

SchemNode.displayName = 'SchemNode';
export default SchemNode;