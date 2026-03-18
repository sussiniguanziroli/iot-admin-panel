import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { useMqtt } from '../../mqtt/context/MqttContext';
import useIsDark from '../../../shared/hooks/useIsDark';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';

import SchematicView from '../scheme/SchematicView';
import MqttAuditor from '../../mqtt-auditor/MqttAuditor';

import {
  Building, ChevronDown, Loader2, MapPin, AlertCircle,
  Lock, Unlock, Activity, Settings, Plus, Wifi, WifiOff, Signal,
  Layers,} from 'lucide-react';

const Dashboard = () => {
  const navigate    = useNavigate();
  const schemaRef   = useRef(null);

  const {
    isEditMode, toggleEditMode,
    viewedTenantId, switchTenant,
    locations, activeLocation, switchLocation,
    loadingData,
  } = useDashboard();

  const { can, isSuperAdmin } = usePermissions();
  const { connectionStatus, activeConfig } = useMqtt();
  const isDark = useIsDark();

  const [availableTenants,   setAvailableTenants]   = useState([]);
  const [isMqttAuditorOpen,  setIsMqttAuditorOpen]  = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getDocs(collection(db, 'tenants'))
      .then(snap => setAvailableTenants(snap.docs.map(d => ({ id: d.id, name: d.data().name }))))
      .catch(e => console.error('Error fetching tenants:', e));
  }, [isSuperAdmin]);

  const mqttMap = {
    connected:    { color: '#10b981', label: 'Conectado',    icon: Wifi    },
    connecting:   { color: '#f59e0b', label: 'Conectando…',  icon: Signal  },
    disconnected: { color: '#64748b', label: 'Desconectado', icon: WifiOff },
    error:        { color: '#ef4444', label: 'Error',        icon: WifiOff },
  };
  const mqttSt   = mqttMap[connectionStatus] || mqttMap.disconnected;
  const MqttIcon = mqttSt.icon;

  const t = isDark ? {
    bg: '#020617', barBg: 'rgba(15,23,42,0.85)', barBorder: 'rgba(30,41,59,0.9)',
    inputBg: '#1e293b', inputBorder: '#334155',
    textPrimary: '#f1f5f9', textMuted: '#64748b', textSub: '#475569',
    pillBg: '#1e293b', pillBorder: '#334155',
    emptyIcon: '#1e293b', emptyIconFg: '#334155',
    divider: 'rgba(255,255,255,0.07)',
  } : {
    bg: '#f1f5f9', barBg: 'rgba(255,255,255,0.9)', barBorder: 'rgba(226,232,240,0.9)',
    inputBg: '#f8fafc', inputBorder: '#cbd5e1',
    textPrimary: '#0f172a', textMuted: '#64748b', textSub: '#94a3b8',
    pillBg: '#f1f5f9', pillBorder: '#e2e8f0',
    emptyIcon: '#e2e8f0', emptyIconFg: '#cbd5e1',
    divider: 'rgba(0,0,0,0.08)',
  };

  const Divider = () => (
    <div style={{ width: 1, height: 20, backgroundColor: t.divider, flexShrink: 0 }} />
  );

  const selectStyle = {
    appearance: 'none', backgroundColor: 'transparent',
    border: 'none', color: t.textPrimary,
    paddingLeft: 4, paddingRight: 20,
    fontSize: 13, fontWeight: 700,
    cursor: 'pointer', outline: 'none',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      backgroundColor: t.bg,
      overflow: 'hidden',
      transition: 'background-color 0.2s',
    }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>

        {/* ── FLOATING BAR ─────────────────────────────────────── */}
        {(locations.length > 0 || isSuperAdmin) && (
          <div style={{
            position: 'absolute',
            top: 12, left: 12, right: 12,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            backgroundColor: t.barBg,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 12,
            border: `1px solid ${t.barBorder}`,
            padding: '0 10px',
            height: 44,
            boxShadow: isDark
              ? '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
              : '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}>

            {/* Super Admin: tenant selector */}
            {isSuperAdmin && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, backgroundColor: '#4f46e5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building size={12} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                      value={viewedTenantId || ''}
                      onChange={(e) => switchTenant(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="" disabled>Seleccionar tenant…</option>
                      {availableTenants.map(ten => (
                        <option key={ten.id} value={ten.id}>{ten.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} style={{ position: 'absolute', right: 2, color: t.textMuted, pointerEvents: 'none' }} />
                  </div>
                </div>
                <Divider />
              </>
            )}

            {/* Location selector */}
            {locations.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} style={{ color: t.textSub, flexShrink: 0 }} />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                      value={activeLocation?.id || ''}
                      onChange={(e) => switchLocation(e.target.value)}
                      disabled={!can.viewLocations}
                      style={{ ...selectStyle, opacity: can.viewLocations ? 1 : 0.5, cursor: can.viewLocations ? 'pointer' : 'not-allowed' }}
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} style={{ position: 'absolute', right: 2, color: t.textMuted, pointerEvents: 'none' }} />
                  </div>
                </div>
                
              </>
            )}

            

            {!activeLocation?.mqtt_config?.host && locations.length > 0 && (
              <>
                <Divider />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={12} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>Sin broker</span>
                </div>
              </>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Loading */}
            {loadingData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Loader2 size={12} style={{ color: isDark ? '#818cf8' : '#6366f1', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 11, color: isDark ? '#818cf8' : '#6366f1', fontWeight: 600 }}>Sync…</span>
              </div>
            )}

            {/* Read-only badge for viewer/operator */}
            {!can.editDashboard && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                <Lock size={10} style={{ color: t.textMuted }} />
                <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>Solo lectura</span>
              </div>
            )}

            {/* Admin controls */}
            {/* Admin controls */}
{can.editDashboard && (
  <>
    <Divider />

    {/* Edit mode toggle */}
    <button
      onClick={toggleEditMode}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
        border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        backgroundColor: isEditMode
          ? (isDark ? 'rgba(249,115,22,0.18)' : 'rgba(249,115,22,0.12)')
          : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
        color: isEditMode ? '#f97316' : t.textMuted,
        outline: isEditMode ? '1px solid rgba(249,115,22,0.4)' : `1px solid ${t.divider}`,
      }}
    >
      {isEditMode ? <Unlock size={12} /> : <Lock size={12} />}
      {isEditMode ? 'Editando' : 'Bloqueado'}
    </button>

    {/* Botones de edición — solo visibles en edit mode */}
    {isEditMode && (
      <>
        {/* + Nodo */}
        <button
          onClick={() => schemaRef.current?.openAddModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            backgroundColor: '#1d4ed8', color: '#fff',
            boxShadow: '0 2px 8px rgba(29,78,216,0.35)',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
        >
          <Plus size={13} />
          Nodo
        </button>

        {/* + Símbolo */}
        <button
          onClick={() => schemaRef.current?.openSymbolModal()}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            backgroundColor: isDark ? 'rgba(14,79,130,0.7)' : '#0c3d6e',
            color: '#7dd3fc',
            outline: '1px solid rgba(30,77,120,0.8)',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f4f8c'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(14,79,130,0.7)' : '#0c3d6e'}
        >
          <Layers size={13} />
          Símbolo
        </button>
      </>
    )}
  </>
)}

            {/* Super admin actions */}
            {isSuperAdmin && (
              <>
                <Divider />
                <button
                  onClick={() => viewedTenantId && navigate(`/app/tenants/${viewedTenantId}`)}
                  disabled={!viewedTenantId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: 'none', cursor: viewedTenantId ? 'pointer' : 'not-allowed',
                    backgroundColor: viewedTenantId ? '#4f46e5' : (isDark ? 'rgba(255,255,255,0.04)' : '#e2e8f0'),
                    color: viewedTenantId ? '#fff' : t.textMuted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Settings size={12} />
                  Config
                </button>
                <button
                  onClick={() => setIsMqttAuditorOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    backgroundColor: '#0e7490', color: '#fff',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Activity size={12} />
                  Auditor
                </button>
              </>
            )}
          </div>
        )}

        {/* ── EMPTY STATE ──────────────────────────────────────── */}
        {locations.length === 0 && !loadingData && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16, textAlign: 'center', padding: 32,
          }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: t.emptyIcon, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={32} style={{ color: t.emptyIconFg }} />
            </div>
            <h2 style={{ color: t.textMuted, fontSize: 20, fontWeight: 700, margin: 0 }}>Sin ubicaciones</h2>
            <p style={{ color: t.textSub, fontSize: 14, margin: 0, maxWidth: 360 }}>
              {isSuperAdmin
                ? 'Este tenant no tiene ubicaciones. Configuralo desde el panel de administración.'
                : 'No hay ubicaciones disponibles. Contactá a tu administrador.'}
            </p>
          </div>
        )}

        {/* ── LOADING ──────────────────────────────────────────── */}
        {loadingData && locations.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <Loader2 size={36} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: t.textMuted, fontSize: 14, fontWeight: 600, margin: 0 }}>Cargando…</p>
          </div>
        )}

        {/* ── CANVAS ───────────────────────────────────────────── */}
        {activeLocation && <SchematicView ref={schemaRef} />}
      </div>

      {isSuperAdmin && (
        <MqttAuditor isOpen={isMqttAuditorOpen} onClose={() => setIsMqttAuditorOpen(false)} />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Dashboard;