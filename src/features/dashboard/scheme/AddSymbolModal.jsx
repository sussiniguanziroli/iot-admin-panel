import React, { useState } from 'react';
import { X, Save, RotateCw } from 'lucide-react';
import { getSymbol } from './ElectricalSymbols';

// Todos los símbolos disponibles como elementos inline
const INLINE_SYMBOL_GROUPS = {
  'Protección': [
    { key: 'disconnector',        label: 'Secc. abierto'   },
    { key: 'disconnector_closed', label: 'Secc. cerrado'   },
    { key: 'fuse',                label: 'Fusible cerrado' },
    { key: 'fuse_open',           label: 'Fusible abierto' },
    { key: 'horn_disconnector',   label: 'Secc. cuernos'   },
    { key: 'breaker',             label: 'Disyuntor'       },
    { key: 'arrester',            label: 'Pararrayos'      },
    { key: 'recloser',            label: 'Reconectador'    },
  ],
  'Medición': [
    { key: 'current_transformer', label: 'TC'              },
    { key: 'voltage_transformer', label: 'TT / TV'         },
    { key: 'energy_meter',        label: 'Medidor'         },
    { key: 'analyzer',            label: 'Analizador'      },
  ],
  'Potencia': [
    { key: 'transformer',         label: 'Transformador'   },
    { key: 'capacitor',           label: 'Capacitor'       },
    { key: 'soft_starter',        label: 'Arrancador suave'},
    { key: 'freq_converter',      label: 'Conv. frec.'     },
  ],
  'Cargas': [
    { key: 'motor',               label: 'Motor'           },
    { key: 'generator',           label: 'Generador'       },
    { key: 'load',                label: 'Carga'           },
  ],
};

const ROTATIONS = [
  { deg: 0,   label: '0°'   },
  { deg: 90,  label: '90°'  },
  { deg: 180, label: '180°' },
  { deg: 270, label: '270°' },
];

const WHITE   = '#e2e8f0';
const MUTED   = '#475569';
const BG_CARD = '#0a1220';
const BG_SEL  = '#0d1f3c';
const BORDER  = '#1a2741';
const BORDER_SEL = '#3b82f6';

const SymbolPreview = ({ symbolKey, size = 52 }) => {
  const Sym = getSymbol(symbolKey);
  return (
    <div style={{
      width:          size, height: size,
      display:       'flex', alignItems: 'center', justifyContent: 'center',
      overflow:      'hidden',
      pointerEvents: 'none',
    }}>
      <div style={{
        transform:       'scale(0.38)',
        transformOrigin: 'center center',
        display:         'flex',
        flexShrink:       0,
      }}>
        <Sym color={WHITE} />
      </div>
    </div>
  );
};

const AddSymbolModal = ({ isOpen, onClose, onSave }) => {
  const [symbolKey, setSymbolKey] = useState('fuse');
  const [rotation,  setRotation]  = useState(0);
  const [label,     setLabel]     = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(symbolKey, label.trim(), rotation);
    setLabel('');
    setRotation(0);
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
          width:           '100%', maxWidth: 520,
          maxHeight:       '90vh',
          display:         'flex', flexDirection: 'column',
          boxShadow:       '0 32px 80px rgba(0,0,0,0.9)',
          overflow:        'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{
          padding:      '18px 22px',
          borderBottom: `1px solid ${BORDER}`,
          display:      'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink:    0,
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              Agregar Símbolo
            </h2>
            <p style={{ fontSize: 10, color: MUTED, margin: '2px 0 0', fontFamily: 'monospace' }}>
              Elemento inline · se coloca sobre el conductor
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 8 }}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Grid de símbolos por grupo ──────────────────────── */}
            {Object.entries(INLINE_SYMBOL_GROUPS).map(([groupName, items]) => (
              <div key={groupName}>
                {/* Separador de grupo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: '#2d3e52', fontFamily: 'monospace',
                  }}>
                    {groupName}
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
                </div>

                <div style={{
                  display:             'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap:                  6,
                }}>
                  {items.map(({ key, label: lbl }) => {
                    const isSel = symbolKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSymbolKey(key)}
                        style={{
                          display:         'flex', flexDirection: 'column',
                          alignItems:      'center', gap: 4,
                          padding:         '8px 4px',
                          borderRadius:     10,
                          border:          `2px solid ${isSel ? BORDER_SEL : BORDER}`,
                          backgroundColor:  isSel ? BG_SEL : BG_CARD,
                          cursor:          'pointer',
                          transition:      'all 0.15s',
                          position:        'relative',
                          minHeight:        80,
                        }}
                      >
                        <SymbolPreview symbolKey={key} size={52} />
                        <span style={{
                          fontSize:   7.5, fontWeight: 700,
                          fontFamily: 'monospace', textAlign: 'center',
                          lineHeight:  1.25,
                          color:       isSel ? '#93c5fd' : '#334155',
                        }}>
                          {lbl}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ── Preview + rotación ──────────────────────────────── */}
            <div style={{
              display:         'flex', alignItems: 'center', gap: 16,
              padding:         '14px 18px',
              backgroundColor:  BG_CARD,
              border:          `1px solid ${BORDER}`,
              borderRadius:     12,
            }}>
              {/* Preview rotado */}
              <div style={{
                width: 80, height: 80, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#070d1a', borderRadius: 10,
                border: `1px solid ${BORDER}`,
              }}>
                <div style={{
                  transform:       `rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  transition:      'transform 0.3s ease',
                  display:         'flex',
                  overflow:        'hidden',
                  width:            64, height: 64,
                  alignItems:      'center', justifyContent: 'center',
                }}>
                  <div style={{ transform: 'scale(0.45)', transformOrigin: 'center', display: 'flex', flexShrink: 0 }}>
                    {React.createElement(getSymbol(symbolKey), { color: WHITE })}
                  </div>
                </div>
              </div>

              {/* Botones de rotación */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', margin: '0 0 8px' }}>
                  Rotación
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {ROTATIONS.map(({ deg, label: rlbl }) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setRotation(deg)}
                      style={{
                        flex:            1,
                        padding:         '7px 4px',
                        borderRadius:     8,
                        border:          `1.5px solid ${rotation === deg ? BORDER_SEL : BORDER}`,
                        backgroundColor:  rotation === deg ? BG_SEL : '#070d1a',
                        color:            rotation === deg ? '#93c5fd' : MUTED,
                        fontSize:         10, fontWeight: 700, fontFamily: 'monospace',
                        cursor:          'pointer',
                        display:         'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                      }}
                    >
                      <RotateCw size={9} />
                      {rlbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Etiqueta opcional ───────────────────────────────── */}
            <div>
              <label style={{
                display:      'block', fontSize: 9, fontWeight: 800,
                color:         MUTED, textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'monospace',
              }}>
                Etiqueta (opcional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: F1, R1, TC-33kV, AS1…"
                style={{
                  width:           '100%', padding: '10px 14px',
                  backgroundColor: '#070d1a',
                  border:          `1px solid ${label ? '#3b82f650' : BORDER}`,
                  borderRadius:     10, color: '#f1f5f9',
                  fontSize:         12, outline: 'none',
                  boxSizing:       'border-box', fontFamily: 'monospace',
                  transition:      'border-color 0.2s',
                }}
              />
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div style={{
            padding:         '12px 20px',
            borderTop:       `1px solid ${BORDER}`,
            display:         'flex', gap: 10, flexShrink: 0,
            backgroundColor: '#06090f',
          }}>
            <button type="button" onClick={onClose}
              style={{
                flex: 1, padding: '11px',
                backgroundColor: '#0d1525',
                border: `1px solid ${BORDER}`, borderRadius: 10,
                color: MUTED, fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <button type="submit"
              style={{
                flex: 2, padding: '11px', borderRadius: 10,
                color: '#fff', fontWeight: 700, fontSize: 13,
                border: 'none', cursor: 'pointer',
                backgroundColor: '#1d4ed8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Save size={14} />
              Colocar Símbolo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSymbolModal;