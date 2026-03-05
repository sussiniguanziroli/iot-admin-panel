import React, { useState } from 'react';
import { usePlans } from '../../../shared/hooks/usePlans';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CheckCircle, Crown, Loader2, ArrowRight, ArrowLeft, X, CreditCard, Lock, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';

const PlanCheckout = ({ tenantId, currentPlan, onSuccess, onClose }) => {
  const { plans, loading: plansLoading } = usePlans();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payerEmail, setPayerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const payablePlans = Object.values(plans || {}).filter(p => p.price > 0);
  const selectedPlanData = payablePlans.find(p => p.id === selectedPlan);

  const handleConfirm = async () => {
    if (!payerEmail || !selectedPlan || isProcessing) return;

    setIsProcessing(true);
    try {
      const functions = getFunctions(undefined, 'us-central1');
      const subscribeToPlanFn = httpsCallable(functions, 'subscribeToPlan');

      const result = await subscribeToPlanFn({
        tenantId,
        planId: selectedPlan,
        payerEmail
      });

      const { initPoint } = result.data;

      if (!initPoint) throw new Error('No se recibió el link de pago de MercadoPago.');

      window.location.href = initPoint;
    } catch (err) {
      console.error('Subscription error:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Error al iniciar el pago',
        text: err?.message || 'No se pudo conectar con MercadoPago. Intentá de nuevo.',
        confirmButtonColor: '#7c3aed'
      });
      setIsProcessing(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm";
  const labelClass = "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">

        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-purple-600" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              {step === 1 ? 'Elegí tu plan' : 'Confirmar suscripción'}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step > 1 ? <CheckCircle size={16} /> : '1'}
              </div>
              <div className={`w-12 h-1 rounded transition-all ${step > 1 ? 'bg-purple-600' : 'bg-slate-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                2
              </div>
            </div>
            <button onClick={onClose} disabled={isProcessing} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">

          {step === 1 && (
            <div className="space-y-4">
              {plansLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-purple-600" size={32} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payablePlans.map(plan => {
                    const isSelected = selectedPlan === plan.id;
                    const isCurrent = plan.id === currentPlan;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                        className={`relative rounded-2xl border-2 p-5 transition-all ${
                          isCurrent
                            ? 'border-slate-300 dark:border-slate-600 opacity-60 cursor-not-allowed'
                            : isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg cursor-pointer scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 cursor-pointer hover:shadow-md'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-3 -right-3 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle size={16} className="text-white" />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-500 text-white text-xs font-bold rounded-full">
                            PLAN ACTUAL
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {plan.id === 'enterprise' && <Crown size={18} className="text-amber-500" />}
                              <h4 className="font-bold text-slate-800 dark:text-white">{plan.displayName}</h4>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600">${plan.price}</p>
                            <p className="text-xs text-slate-400">/mes</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Ubicaciones</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{plan.limits.maxLocations === 999 ? 'Ilimitadas' : plan.limits.maxLocations}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Usuarios</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{plan.limits.maxUsers === 999 ? 'Ilimitados' : plan.limits.maxUsers}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Retención de datos</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{plan.limits.dataRetentionDays} días</span>
                          </div>
                          {plan.limits.features.mqttAuditor && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                              <CheckCircle size={12} />
                              <span>MQTT Auditor</span>
                            </div>
                          )}
                          {plan.limits.features.advancedAnalytics && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                              <CheckCircle size={12} />
                              <span>Analytics avanzado</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedPlanData && (
            <div className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Plan seleccionado</p>
                  <p className="font-bold text-purple-900 dark:text-purple-100">{selectedPlanData.displayName}</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  ${selectedPlanData.price}<span className="text-sm font-normal text-slate-400">/mes</span>
                </p>
              </div>

              <div>
                <label className={labelClass}>Email de pago</label>
                <input
                  type="email"
                  value={payerEmail}
                  onChange={e => setPayerEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 mt-1.5">Usá el email asociado a tu cuenta de MercadoPago.</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                <ExternalLink size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Serás redirigido a MercadoPago</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Al confirmar, te llevamos al ambiente seguro de MercadoPago para completar el pago. Una vez aprobado, tu suscripción se activa automáticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Lock size={12} className="mt-0.5 flex-shrink-0" />
                <span>El pago es procesado de forma segura por MercadoPago. No almacenamos datos de tu tarjeta.</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between">
          <button
            onClick={() => step === 1 ? onClose() : setStep(1)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            {step === 1 ? 'Cancelar' : 'Volver'}
          </button>

          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!selectedPlan}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
              <ArrowRight size={16} />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={handleConfirm}
              disabled={!payerEmail || isProcessing}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Iniciando...
                </>
              ) : (
                <>
                  <ExternalLink size={16} />
                  Ir a pagar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanCheckout;