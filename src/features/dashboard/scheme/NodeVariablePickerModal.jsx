import React, { useState, useEffect } from 'react';
import { X, Save, Activity, Zap } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const NodeVariablePickerModal = ({ isOpen, onClose, onSave, machineId, nodeData }) => {
  const { widgets } = useDashboard();

  const [displayWidgetId, setDisplayWidgetId] = useState('');
  const [powerWidgetId,   setPowerWidgetId]   = useState('');

  useEffect(() => {
    setDisplayWidgetId(nodeData?.displayWidgetId || '');
    setPowerWidgetId(nodeData?.powerWidgetId   || '');
  }, [nodeData]);

  if (!isOpen) return null;

  const machineWidgets = widgets.filter(w => w.machineId === machineId);
  const metricWidgets  = machineWidgets.filter(w => ['metric', 'gauge'].includes(w.type));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      displayWidgetId: displayWidgetId || null,
      powerWidgetId:   powerWidgetId   || null,
    });
  };

  const optionStyle = (active) => ({
    padding: '9px 12px',
    borderRadius: 10,
    textAlign: 'left',
    border: `1px solid ${active ? '#3b82f6' : '#1e293b'}`,
    backgroundColor: active ? '#172554' : '#1e293b',
    color: active ? '#93c5fd' : '#64748b',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexShrink: 0,
    transition: 'all 0.1s',
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 20,
          width: '100%',
          maxWidth: 380,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Configurar Nodo</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 8 }}>
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                <Activity size={10} />
                Variable a mostrar
              </div>
              {metricWidgets.length === 0 ? (
                <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>
                  {machineWidgets.length === 0 ? 'No hay widgets configurados en este nodo' : 'No hay widgets de métrica o gauge'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <button type="button" onClick={() => setDisplayWidgetId('')} style={optionStyle(!displayWidgetId)}>
                    <span>Ninguna</span>
                  </button>
                  {metricWidgets.map(w => (
                    <button key={w.id} type="button" onClick={() => setDisplayWidgetId(w.id)} style={optionStyle(displayWidgetId === w.id)}>
                      <span>{w.label || w.title || w.type}</span>
                      {w.unit && <span style={{ fontSize: 10, opacity: 0.55 }}>{w.unit}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                <Zap size={10} />
                Estado de energía
              </div>
              {machineWidgets.length === 0 ? (
                <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>No hay widgets configurados en este nodo</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <button type="button" onClick={() => setPowerWidgetId('')} style={optionStyle(!powerWidgetId)}>
                    <span>Sin estado</span>
                  </button>
                  {machineWidgets.map(w => (
                    <button key={w.id} type="button" onClick={() => setPowerWidgetId(w.id)} style={optionStyle(powerWidgetId === w.id)}>
                      <span>{w.label || w.title || w.type}</span>
                      <span style={{ fontSize: 9, opacity: 0.45, fontFamily: 'monospace' }}>{w.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid #1e293b',
            display: 'flex', gap: 10,
            flexShrink: 0,
            backgroundColor: '#0f172a',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ flex: 1, padding: '10px', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, border: 'none', backgroundColor: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            >
              <Save size={13} />
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeVariablePickerModal;