import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { usePlans } from '../../../shared/hooks/usePlans';
import {
  CreditCard, Package, TrendingUp, AlertCircle, CheckCircle,
  Activity, Users, MapPin, Layout, Zap, Database, Calendar, Lock, AlertTriangle, Receipt, ArrowUpCircle, XCircle, Loader2
} from 'lucide-react';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Swal from 'sweetalert2';
import PlanCheckout from './PlanCheckout';

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-AR' });

const BillingManagement = ({ tenantId, isSuperAdmin = false, comingFromPayment = false, paymentStatus = null }) => {
  const { getPlanById, loading: plansLoading } = usePlans();
  const [billingData, setBillingData] = useState(null);
  const [realUsage, setRealUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlanCheckoutOpen, setIsPlanCheckoutOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [awaitingActivation, setAwaitingActivation] = useState(comingFromPayment && paymentStatus === 'approved');
  const activationTimeoutRef = useRef(null);

  const fetchSecondaryData = async () => {
    try {
      const locationsSnapshot = await getDocs(collection(db, 'tenants', tenantId, 'locations'));
      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('tenantId', '==', tenantId)));

      let totalWidgets = 0;
      let totalDashboards = 0;

      for (const locDoc of locationsSnapshot.docs) {
        const layout = locDoc.data().layout;
        if (layout?.widgets) totalWidgets += layout.widgets.length;
        if (layout?.machines) totalDashboards += layout.machines.length;
      }

      setRealUsage({
        locations: locationsSnapshot.size,
        users: usersSnapshot.size,
        widgetsTotal: totalWidgets,
        dashboards: totalDashboards
      });

      const invoicesSnapshot = await getDocs(
        query(collection(db, 'tenants', tenantId, 'invoices'), orderBy('date', 'desc'))
      );
      setInvoices(invoicesSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!tenantId) return;

    const unsub = onSnapshot(doc(db, 'tenants', tenantId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const newStatus = data.subscription?.status;

        setBillingData({
          subscription: data.subscription,
          limits: data.limits,
          usage: data.usage
        });

        if (awaitingActivation && newStatus === 'active') {
          setAwaitingActivation(false);
          if (activationTimeoutRef.current) clearTimeout(activationTimeoutRef.current);
        }
      }
      setLoading(false);
    });

    fetchSecondaryData();

    if (awaitingActivation) {
      activationTimeoutRef.current = setTimeout(() => {
        setAwaitingActivation(false);
      }, 30000);
    }

    return () => {
      unsub();
      if (activationTimeoutRef.current) clearTimeout(activationTimeoutRef.current);
    };
  }, [tenantId]);

  useEffect(() => {
    if (!awaitingActivation && billingData?.subscription?.status === 'active') {
      fetchSecondaryData();
    }
  }, [awaitingActivation]);

  const handleCheckoutSuccess = () => {
    setIsPlanCheckoutOpen(false);
  };

  const handleCancelSubscription = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar suscripción?',
      html: `
        <p class="text-slate-600 dark:text-slate-400">Tu suscripción seguirá activa hasta el fin del período ya pagado. Después de esa fecha, tu cuenta pasará al plan gratuito.</p>
        <p class="text-slate-600 dark:text-slate-400 mt-3 font-bold">Esta acción no se puede deshacer.</p>
      `,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Volver',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (!result.isConfirmed) return;

    setIsCancelling(true);
    try {
      const functions = getFunctions(undefined, 'us-central1');
      const cancelSubscriptionFn = httpsCallable(functions, 'cancelSubscription');
      await cancelSubscriptionFn({ tenantId });

      await Swal.fire({
        icon: 'success',
        title: 'Suscripción cancelada',
        text: 'Tu acceso se mantendrá hasta el fin del período actual.',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo cancelar la suscripción. Intentá de nuevo.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Cargando información de facturación...</p>
        </div>
      </div>
    );
  }

  if (!billingData || !billingData.subscription) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-3" size={48} />
        <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">Datos de facturación no encontrados</h3>
        <p className="text-sm text-red-600 dark:text-red-400">Este tenant necesita ser migrado al nuevo sistema de billing.</p>
      </div>
    );
  }

  const { subscription, limits, usage } = billingData;
  const planData = getPlanById(subscription.plan);
  const planName = planData?.displayName || subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
  const isTrial = subscription.status === 'trialing';
  const isActive = subscription.status === 'active';
  const isPending = subscription.status === 'pending';
  const isPastDue = subscription.status === 'past_due';
  const isCancelled = subscription.status === 'cancelled';
  const daysUntilRenewal = subscription.currentPeriodEnd
    ? Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const hasPaymentMethod = !!subscription.paymentMethod;
  const canCancel = !isSuperAdmin && isActive && !!subscription.gatewaySubscriptionId;

  const usageMetrics = [
    { icon: MapPin, label: 'Ubicaciones', current: realUsage?.locations || 0, limit: limits.maxLocations, color: 'blue' },
    { icon: Users, label: 'Usuarios', current: realUsage?.users || 0, limit: limits.maxUsers, color: 'purple' },
    { icon: Layout, label: 'Widgets', current: realUsage?.widgetsTotal || 0, limit: limits.maxWidgetsTotal, color: 'emerald' },
    { icon: Activity, label: 'Dashboards', current: realUsage?.dashboards || 0, limit: limits.maxDashboards, color: 'orange' }
  ];

  const getUsagePercentage = (current, limit) => {
    if (limit === 999) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    if (percentage >= 75) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  return (
    <div className="space-y-6">

      {awaitingActivation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-xl p-6 flex items-center gap-4 animate-in fade-in">
          <Loader2 size={24} className="text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Verificando tu pago...</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">Estamos confirmando tu suscripción con MercadoPago. Esto puede tardar unos segundos.</p>
          </div>
        </div>
      )}

      {!awaitingActivation && comingFromPayment && paymentStatus === 'approved' && isActive && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl p-6 flex items-center gap-4 animate-in fade-in">
          <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">¡Suscripción activada!</h3>
            <p className="text-emerald-700 dark:text-emerald-300 text-sm">Tu plan {planName} está activo. Ya podés usar todas las funcionalidades.</p>
          </div>
        </div>
      )}

      {isPending && !awaitingActivation && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-800/50 rounded-full text-amber-600 dark:text-amber-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Pago pendiente</h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">Tu suscripción está esperando confirmación de pago.</p>
            </div>
          </div>
        </div>
      )}

      {isTrial && !isSuperAdmin && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-800/50 rounded-full text-amber-600 dark:text-amber-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Período de prueba activo</h3>
              <p className="text-amber-700 dark:text-amber-300">
                Te quedan {daysUntilRenewal} días. Elegí un plan para continuar sin interrupciones.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPlanCheckoutOpen(true)}
            className="whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/30"
          >
            Elegir plan
          </button>
        </div>
      )}

      {isPastDue && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-800/50 rounded-full text-red-600 dark:text-red-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100">Pago fallido</h3>
              <p className="text-red-700 dark:text-red-300">
                Tu último pago no pudo procesarse. Actualizá tu plan para restaurar el acceso completo.
              </p>
            </div>
          </div>
          {!isSuperAdmin && (
            <button
              onClick={() => setIsPlanCheckoutOpen(true)}
              className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-500/30"
            >
              Actualizar plan
            </button>
          )}
        </div>
      )}

      {isCancelled && !isSuperAdmin && (
        <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-500">
              <XCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Suscripción cancelada</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Tu acceso se mantiene hasta el {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. Podés reactivar tu plan en cualquier momento.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPlanCheckoutOpen(true)}
            className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-purple-500/30"
          >
            Reactivar plan
          </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Package size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{planName} Plan</h2>
                <p className="text-purple-200">
                  {isTrial ? 'Suscripción en prueba' : isCancelled ? 'Suscripción cancelada' : isPending ? 'Pago pendiente' : 'Suscripción activa'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30'
                  : isTrial
                  ? 'bg-amber-500/20 text-amber-100 border border-amber-400/30'
                  : isCancelled
                  ? 'bg-slate-500/20 text-slate-100 border border-slate-400/30'
                  : 'bg-red-500/20 text-red-100 border border-red-400/30'
              }`}>
                {isActive ? <CheckCircle size={16} /> : isTrial ? <AlertTriangle size={16} /> : <AlertCircle size={16} />}
                {subscription.status.toUpperCase()}
              </div>
              {!isSuperAdmin && !isCancelled && !isPending && (
                <button
                  onClick={() => setIsPlanCheckoutOpen(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-bold transition-colors border border-white/30"
                >
                  <ArrowUpCircle size={16} />
                  Gestionar plan
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-purple-200 text-sm mb-1">Período actual</p>
              <p className="font-mono text-lg font-bold">
                {subscription.currentPeriodStart
                  ? `${new Date(subscription.currentPeriodStart).toLocaleDateString()} - ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">{isCancelled ? 'Acceso hasta' : 'Próximo cobro'}</p>
              <p className="font-mono text-lg font-bold flex items-center gap-2">
                <Calendar size={18} />
                {subscription.nextBillingDate || subscription.currentPeriodEnd
                  ? new Date(isCancelled ? subscription.currentPeriodEnd : subscription.nextBillingDate).toLocaleDateString()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Tiempo restante</p>
              <p className="font-mono text-lg font-bold">
                {daysUntilRenewal !== null ? (daysUntilRenewal > 0 ? `${daysUntilRenewal} días` : 'Expirado') : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-600" />
            Uso de recursos
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Utilización actual vs límites del plan</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {usageMetrics.map((metric) => {
            const Icon = metric.icon;
            const percentage = getUsagePercentage(metric.current, metric.limit);
            const colorClass = getUsageColor(percentage);
            const isUnlimited = metric.limit === 999;
            return (
              <div key={metric.label} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/30`}>
                      <Icon size={20} className={`text-${metric.color}-600 dark:text-${metric.color}-400`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{metric.label}</p>
                      <p className="text-xs text-slate-500">{isUnlimited ? 'Ilimitado' : `Límite: ${metric.limit}`}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                    {metric.current} / {isUnlimited ? '∞' : metric.limit}
                  </div>
                </div>
                {!isUnlimited && (
                  <>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          percentage >= 90 ? 'bg-red-500' : percentage >= 75 ? 'bg-orange-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">{percentage.toFixed(1)}% utilizado</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Zap size={20} className="text-yellow-600" />
            Características del plan
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(limits.features).map(([feature, enabled]) => (
            <div
              key={feature}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                enabled
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-50'
              }`}
            >
              {enabled ? (
                <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : (
                <Lock size={18} className="text-slate-400 flex-shrink-0" />
              )}
              <span className={`text-sm font-medium ${enabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {feature.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Database size={20} className="text-cyan-600" />
            Datos y conectividad
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Mensajes MQTT hoy</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{(usage?.mqttMessagesToday || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Límite: {limits.maxMqttMessagesPerDay.toLocaleString()}/día</p>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Retención de datos</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{limits.dataRetentionDays}</p>
            <p className="text-xs text-slate-400 mt-1">días</p>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Agregación</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white capitalize">{limits.aggregationInterval}</p>
            <p className="text-xs text-slate-400 mt-1">intervalo</p>
          </div>
        </div>
      </div>

      {!isSuperAdmin && hasPaymentMethod && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">Método de pago activo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Utilizado para los cobros automáticos mensuales</p>
            </div>
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full md:w-auto">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                <CreditCard className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white capitalize">
                  {subscription.paymentMethod.brand} terminada en {subscription.paymentMethod.last4}
                </p>
                <button
                  onClick={() => setIsPlanCheckoutOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Cambiar plan o tarjeta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canCancel && (
        <div className="border border-red-200 dark:border-red-900 rounded-xl p-6 bg-red-50/50 dark:bg-red-900/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Cancelar suscripción</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tu acceso se mantendrá hasta el {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. Después pasarás al plan gratuito.
              </p>
            </div>
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="flex items-center gap-2 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 px-5 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <XCircle size={18} />
              {isCancelling ? 'Cancelando...' : 'Cancelar suscripción'}
            </button>
          </div>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Receipt size={20} className="text-indigo-600" />
              Historial de pagos
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Facturas y pagos anteriores</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-bold">Fecha</th>
                  <th className="px-6 py-4 font-bold">Monto</th>
                  <th className="px-6 py-4 font-bold">Método</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold">ID de recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">${inv.amount} {inv.currency}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">{inv.method}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{inv.gatewayPaymentId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPlanCheckoutOpen && (
        <PlanCheckout
          tenantId={tenantId}
          currentPlan={subscription.plan}
          onSuccess={handleCheckoutSuccess}
          onClose={() => setIsPlanCheckoutOpen(false)}
        />
      )}
    </div>
  );
};

export default BillingManagement;