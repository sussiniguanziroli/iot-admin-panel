import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { DEVICE_REGISTRY, getDeviceConfig } from './deviceRegistry';

const AddNodeModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState('generic');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), deviceType);
    setName('');
    setDeviceType('generic');
  };

  const activeCfg = getDeviceConfig(deviceType);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.8)', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Agregar Nodo</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 8 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Tipo de Dispositivo
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 200, overflowY: 'auto', paddingRight: 2 }}>
              {Object.entries(DEVICE_REGISTRY).map(([key, val]) => {
                const Icon = val.icon;
                const isSel = deviceType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDeviceType(key)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '10px 6px', borderRadius: 12,
                      border: `2px solid ${isSel ? val.color : '#1e293b'}`,
                      backgroundColor: isSel ? `${val.color}12` : '#1e293b',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={18} style={{ color: isSel ? val.color : '#475569' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: isSel ? val.color : '#475569', textAlign: 'center', lineHeight: 1.2 }}>
                      {val.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Nombre del Nodo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bomba Norte, Trafo Principal..."
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', backgroundColor: '#1e293b',
                border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '12px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 12, color: '#fff',
                fontWeight: 700, cursor: 'pointer', fontSize: 14, border: 'none',
                backgroundColor: activeCfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Save size={16} />
              Crear Nodo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNodeModal;