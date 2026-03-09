import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../../auth/context/AuthContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { useMqtt } from '../../mqtt/context/MqttContext';
import useIsDark from '../../../shared/hooks/useIsDark';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';

import SchematicView from '../scheme/SchematicView';
import MqttAuditor from '../../mqtt-auditor/MqttAuditor';

import {
  Building, ChevronDown, Loader2, MapPin, AlertCircle,
  Lock, Activity, Settings, Wifi, WifiOff, Signal
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    isEditMode,
    viewedTenantId, switchTenant,
    locations, activeLocation, switchLocation,
    loadingData,
  } = useDashboard();

  const { userProfile } = useAuth();
  const { can, isSuperAdmin } = usePermissions();
  const { connectionStatus, activeConfig } = useMqtt();
  const isDark = useIsDark();

  const [availableTenants, setAvailableTenants]   = useState([]);
  const [isMqttAuditorOpen, setIsMqttAuditorOpen] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getDocs(collection(db, 'tenants'))
      .then(snap => setAvailableTenants(snap.docs.map(d => ({ id: d.id, name: d.data().name }))))
      .catch(e => console.error('Error fetching tenants:', e));
  }, [isSuperAdmin]);

  const t = isDark ? {
    bg:          '#020617',
    barBg:       '#0f172a',
    barBorder:   '#1e293b',
    inputBg:     '#1e293b',
    inputBorder: '#334155',
    textPrimary: '#f1f5f9',
    textMuted:   '#64748b',
    textSub:     '#475569',
    pillBg:      '#1e293b',
    pillBorder:  '#334155',
    emptyIcon:   '#1e293b',
    emptyIconFg: '#334155',
  } : {
    bg:          '#f1f5f9',
    barBg:       '#ffffff',
    barBorder:   '#e2e8f0',
    inputBg:     '#f8fafc',
    inputBorder: '#cbd5e1',
    textPrimary: '#0f172a',
    textMuted:   '#64748b',
    textSub:     '#94a3b8',
    pillBg:      '#f1f5f9',
    pillBorder:  '#e2e8f0',
    emptyIcon:   '#e2e8f0',
    emptyIconFg: '#cbd5e1',
  };

  const mqttMap = {
    connected:    { color: '#10b981', label: 'Conectado',   icon: Wifi    },
    connecting:   { color: '#f59e0b', label: 'Conectando…', icon: Signal  },
    disconnected: { color: '#64748b', label: 'Desconectado',icon: WifiOff },
    error:        { color: '#ef4444', label: 'Error',       icon: WifiOff },
  };
  const mqttSt   = mqttMap[connectionStatus] || mqttMap.disconnected;
  const MqttIcon = mqttSt.icon;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      backgroundColor: t.bg,
      overflow: 'hidden',
      transition: 'background-color 0.2s',
    }}>

      {/* ── SUPER ADMIN BANNER ───────────────────────── */}
      {isSuperAdmin && (
        <div style={{
          backgroundColor: t.barBg,
          borderBottom: `1px solid ${t.barBorder}`,
          padding: '10px 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16, flexShrink: 0, flexWrap: 'wrap',
          transition: 'background-color 0.2s, border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: 6, backgroundColor: '#4f46e5', borderRadius: 8, display: 'flex' }}>
              <Building size={16} style={{ color: '#fff' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 9, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Super Admin
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: t.textMuted }}>Tenant:</span>
                <div style={{ position: 'relative' }}>
                  <select
                    value={viewedTenantId || ''}
                    onChange={(e) => switchTenant(e.target.value)}
                    style={{
                      appearance: 'none', backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`, color: t.textPrimary,
                      paddingLeft: 10, paddingRight: 28, paddingTop: 4, paddingBottom: 4,
                      borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="" disabled>Seleccionar…</option>
                    {availableTenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => viewedTenantId && navigate(`/app/tenants/${viewedTenantId}`)}
              disabled={!viewedTenantId}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: viewedTenantId ? 'pointer' : 'not-allowed',
                backgroundColor: viewedTenantId ? '#4f46e5' : t.inputBg,
                color: viewedTenantId ? '#fff' : t.textMuted,
                transition: 'background-color 0.15s',
              }}
            >
              <Settings size={14} />
              Configurar
            </button>

            <button
              onClick={() => setIsMqttAuditorOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                backgroundColor: '#0e7490', color: '#fff',
              }}
            >
              <Activity size={14} />
              MQTT Auditor
            </button>

            {loadingData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', backgroundColor: t.inputBg, borderRadius: 8, outline: `1px solid ${t.pillBorder}` }}>
                <Loader2 size={12} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600 }}>Sincronizando…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOCATION + MQTT STATUS BAR ───────────────── */}
      {locations.length > 0 && (
        <div style={{
          backgroundColor: t.barBg,
          borderBottom: `1px solid ${t.barBorder}`,
          padding: '8px 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16, flexShrink: 0, flexWrap: 'wrap',
          transition: 'background-color 0.2s, border-color 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={14} style={{ color: t.textSub, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: t.textSub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Ubicación
            </span>
            <div style={{ position: 'relative' }}>
              <select
                value={activeLocation?.id || ''}
                onChange={(e) => switchLocation(e.target.value)}
                disabled={!can.viewLocations}
                style={{
                  appearance: 'none', backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`, color: t.textPrimary,
                  paddingLeft: 12, paddingRight: 32, paddingTop: 6, paddingBottom: 6,
                  borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: can.viewLocations ? 'pointer' : 'not-allowed',
                  outline: 'none', opacity: can.viewLocations ? 1 : 0.5,
                  transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
                }}
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: t.textMuted, pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              backgroundColor: t.pillBg,
              border: `1px solid ${mqttSt.color}33`,
              transition: 'background-color 0.2s',
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                backgroundColor: mqttSt.color,
                boxShadow: connectionStatus === 'connected' ? `0 0 6px ${mqttSt.color}` : 'none',
                animation: connectionStatus === 'connecting' ? 'mqttPulse 1.5s infinite' : 'none',
              }} />
              <MqttIcon size={12} style={{ color: mqttSt.color }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: mqttSt.color }}>
                {mqttSt.label}
              </span>
              {connectionStatus === 'connected' && activeConfig?.host && (
                <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'monospace', marginLeft: 4 }}>
                  {activeConfig.host}
                </span>
              )}
            </div>

            {!activeLocation?.mqtt_config?.host && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <AlertCircle size={13} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>Sin broker</span>
              </div>
            )}

            {!can.editDashboard && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', backgroundColor: t.pillBg, borderRadius: 8, border: `1px solid ${t.pillBorder}` }}>
                <Lock size={11} style={{ color: t.textMuted }} />
                <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>Solo lectura</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN CANVAS ──────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>

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
            {!can.editDashboard && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 13 }}>
                <Lock size={14} />
                <span>Permisos insuficientes para crear ubicaciones</span>
              </div>
            )}
          </div>
        )}

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

        {activeLocation && <SchematicView />}
      </div>

      {isSuperAdmin && (
        <MqttAuditor isOpen={isMqttAuditorOpen} onClose={() => setIsMqttAuditorOpen(false)} />
      )}

      <style>{`
        @keyframes spin       { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mqttPulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
};

export default Dashboard;