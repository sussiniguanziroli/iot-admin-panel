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
import { getDashboardTheme } from '../ui/dashboardTheme';
import CustomSelect from '../ui/CustomSelect';

import {
  Building, Loader2, MapPin, AlertCircle,
  Lock, Activity, Settings
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    viewedTenantId, switchTenant,
    locations, activeLocation, switchLocation,
    loadingData,
  } = useDashboard();

  const { can, isSuperAdmin } = usePermissions();
  const isDark = useIsDark();

  const [availableTenants, setAvailableTenants] = useState([]);
  const [isMqttAuditorOpen, setIsMqttAuditorOpen] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    getDocs(collection(db, 'tenants'))
      .then(snap => setAvailableTenants(snap.docs.map(d => ({ id: d.id, name: d.data().name }))))
      .catch(e => console.error('Error fetching tenants:', e));
  }, [isSuperAdmin]);

  const t = getDashboardTheme(isDark);

  const tenantOptions = availableTenants.map(ten => ({ value: ten.id, label: ten.name }));
  const locationOptions = locations.map(loc => ({ value: loc.id, label: loc.name }));

  const showFloatingBar = locations.length > 0 || isSuperAdmin;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      backgroundColor: t.bg,
      overflow: 'hidden',
      transition: 'background-color 0.2s',
    }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>

        {showFloatingBar && (
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
            padding: '6px 12px',
            minHeight: 44,
            boxShadow: isDark
              ? '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
              : '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}>

            {isSuperAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 24, height: 24, backgroundColor: '#4f46e5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building size={13} style={{ color: '#fff' }} />
                </div>
                <CustomSelect
                  value={viewedTenantId || ''}
                  onChange={(val) => switchTenant(val)}
                  options={tenantOptions}
                  isDark={isDark}
                  t={t}
                />
              </div>
            )}

            {isSuperAdmin && locations.length > 0 && (
              <div style={{ width: 1, height: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)', flexShrink: 0 }} />
            )}

            {locations.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} style={{ color: t.textSub, flexShrink: 0 }} />
                <CustomSelect
                  value={activeLocation?.id || ''}
                  onChange={(val) => switchLocation(val)}
                  options={locationOptions}
                  disabled={!can.viewLocations}
                  isDark={isDark}
                  t={t}
                />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 8 }} />

            {!activeLocation?.mqtt_config?.host && locations.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={12} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', whiteSpace: 'nowrap' }}>Sin broker</span>
              </div>
            )}

            {!can.editDashboard && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 6,
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              }}>
                <Lock size={10} style={{ color: t.textMuted }} />
                <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>Solo lectura</span>
              </div>
            )}

            {isSuperAdmin && (
              <>
                {loadingData && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Loader2 size={12} style={{ color: '#818cf8', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600 }}>Sync…</span>
                  </div>
                )}
                <div style={{ width: 1, height: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)', flexShrink: 0 }} />
                <button
                  onClick={() => viewedTenantId && navigate(`/app/tenants/${viewedTenantId}`)}
                  disabled={!viewedTenantId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    border: 'none', cursor: viewedTenantId ? 'pointer' : 'not-allowed',
                    backgroundColor: viewedTenantId ? '#4f46e5' : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'),
                    color: viewedTenantId ? '#fff' : t.textMuted,
                    whiteSpace: 'nowrap',
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Settings size={12} />
                  Config
                </button>
                <button
                  onClick={() => setIsMqttAuditorOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
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
        @keyframes spin      { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mqttPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
};

export default Dashboard;