import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, disabled, isDark, t }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: t.inputBg,
          border: `1px solid ${open ? t.focusBorder : t.inputBorder}`,
          color: t.textPrimary,
          paddingLeft: 10, paddingRight: 8, paddingTop: 4, paddingBottom: 4,
          borderRadius: 8, fontSize: 12, fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          opacity: disabled ? 0.55 : 1,
          minWidth: 120,
          transition: 'border-color 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>{selected?.label || 'Seleccionar…'}</span>
        <ChevronDown size={11} style={{
          color: t.textMuted, flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
        }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 5px)',
          left: 0,
          minWidth: '100%',
          backgroundColor: t.dropdownBg,
          border: `1px solid ${t.dropdownBorder}`,
          borderRadius: 10,
          boxShadow: isDark
            ? '0 8px 32px rgba(0,0,0,0.6)'
            : '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
          overflow: 'hidden',
          padding: '4px',
        }}>
          {options.map(opt => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left',
                  padding: '6px 10px',
                  borderRadius: 7,
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  color: isActive ? t.activeText : t.dropdownText,
                  backgroundColor: isActive ? t.activeBg : 'transparent',
                  border: 'none', cursor: 'pointer',
                  transition: 'background-color 0.1s',
                  whiteSpace: 'nowrap',
                  gap: 8,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = t.hoverBg; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span>{opt.label}</span>
                {isActive && <Check size={11} style={{ color: t.activeText, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;