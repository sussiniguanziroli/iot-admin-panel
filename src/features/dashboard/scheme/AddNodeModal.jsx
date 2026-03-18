import React, { useState } from 'react';
import { X, Save, Eye, Zap } from 'lucide-react';
import {
  DEVICE_CATEGORIES, getDevicesByCategory, getDeviceConfig,
} from './deviceRegistry';
import { getSymbol } from './ElectricalSymbols';

const WHITE  = '#e2e8f0';
const MUTED  = '#334155';
const BORDER = '#1a2741';

// Preview SVG a escala reducida
const SymPreview = ({ deviceType, active }) => {
  const Sym = getSymbol(deviceType);
  return (
    <div style={{
      width: 40, height: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        transform:       'scale(0.3)',
        transformOrigin: 'center center',
        display:         'flex',
        flexShrink:       0,
      }}>
        <Sym color={active ? WHITE : '#3d5068'} />
      </div>
    </div>
  );
};

const AddNodeModal = ({ isOpen, onClose, onSave }) => {
  const [name,       setName]       = useState('');
  const [deviceType, setDeviceType] = useState('generic');

  if (!isOpen) return null;

  const grouped = getDevicesByCategory();
  const cfg     = getDeviceConfig(deviceType);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), deviceType);
    setName('');
    setDeviceType('generic');
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#06090f',
          border:          `1px solid ${BORDER}`,
          borderRadius:     20,
          width:           '100%', maxWidth: 500,
          maxHeight:       '90vh',
          display:         'flex', flexDirection: 'column',
          boxShadow:       '0 32px 80px rgba(0,0,0,0.9)',
          overflow:        'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding:      '18px 22px',
          borderBottom: `1px solid ${BORDER}`,
          display:      'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink:    0,
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              Agregar Nodo
            </h2>
            <p style={{ fontSize: 10, color: '#475569', margin: '2px 0 0', fontFamily: 'monospace' }}>
              Esquema Unifilar
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }} onSubmit={handleSubmit}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Categorías */}
            {Object.entries(DEVICE_CATEGORIES)
              .sort((a, b) => a[1].order - b[1].order)
              .map(([catKey, catMeta]) => {
                const devices = grouped[catKey];
                if (!devices?.length) return null;
                return (
                  <div key={catKey}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{
                        fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
                        textTransform: 'uppercase', color: '#2d3e52', fontFamily: 'monospace',
                      }}>
                        {catMeta.label}
                      </span>
                      <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {devices.map(({ key, label, interactive }) => {
                        const isSel = deviceType === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setDeviceType(key)}
                            style={{
                              display:         'flex', flexDirection: 'column',
                              alignItems:      'center', gap: 3,
                              padding:         '8px 4px', borderRadius: 10,
                              border:          `2px solid ${isSel ? '#3b82f6' : BORDER}`,
                              backgroundColor:  isSel ? '#0d1f3c' : '#0a1220',
                              cursor:          'pointer', transition: 'all 0.15s',
                              position:        'relative', minHeight: 72,
                            }}
                          >
                            {/* SVG preview real */}
                            <SymPreview deviceType={key} active={isSel} />
                            <span style={{
                              fontSize:   7, fontWeight: 700, textAlign: 'center',
                              lineHeight: 1.2, fontFamily: 'monospace',
                              color:       isSel ? '#93c5fd' : '#475569',
                            }}>
                              {label}
                            </span>
                            {!interactive && (
                              <span style={{
                                position: 'absolute', top: 3, right: 4,
                                fontSize: 6, fontWeight: 800, color: '#2d3e52',
                                fontFamily: 'monospace',
                              }}>
                                REF
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {/* Info del tipo seleccionado */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              backgroundColor: '#0a1220',
              border: `1px solid ${BORDER}`,
            }}>
              {cfg.interactive
                ? <Zap size={12} style={{ color: '#e2e8f0', flexShrink: 0 }} />
                : <Eye size={12} style={{ color: '#475569', flexShrink: 0 }} />}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{cfg.label}</p>
                <p style={{ fontSize: 10, color: '#475569', margin: '1px 0 0', lineHeight: 1.3 }}>
                  {cfg.description}
                  {!cfg.interactive && <span style={{ color: '#2d3e52', fontStyle: 'italic' }}> — Solo referencia</span>}
                </p>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label style={{
                display: 'block', fontSize: 8, fontWeight: 800,
                color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: 8, fontFamily: 'monospace',
              }}>
                Identificador *
              </label>
              <input
                type="text" required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Barra 33kV, R1, Motor M2…"
                autoFocus
                style={{
                  width: '100%', padding: '11px 14px',
                  backgroundColor: '#070d1a',
                  border: `1px solid ${name ? '#3b82f650' : BORDER}`,
                  borderRadius: 10, color: '#f1f5f9',
                  fontSize: 13, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'monospace',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px 20px', borderTop: `1px solid ${BORDER}`,
            display: 'flex', gap: 10, flexShrink: 0,
            backgroundColor: '#06090f',
          }}>
            <button type="button" onClick={onClose}
              style={{
                flex: 1, padding: '11px', backgroundColor: '#0a1220',
                border: `1px solid ${BORDER}`, borderRadius: 10,
                color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}>
              Cancelar
            </button>
            <button type="submit"
              style={{
                flex: 2, padding: '11px', borderRadius: 10,
                color: '#fff', fontWeight: 700, fontSize: 13,
                border: 'none',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                backgroundColor: name.trim() ? '#1d4ed8' : '#1a2741',
                opacity: name.trim() ? 1 : 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background-color 0.2s, opacity 0.2s',
              }}>
              <Save size={14} />
              Crear Nodo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNodeModal;