import React, { useState } from 'react';
import BillingManagement from '../../../billing/components/BillingManagement';
import PlanUpgradeWizard from '../../../billing/components/PlanUpgradeWizard';
import { CreditCard, Sparkles } from 'lucide-react';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import Swal from 'sweetalert2';

const BillingTab = ({ tenantId, currentPlan }) => {
  const { isSuperAdmin } = usePermissions();
  const [isUpgradeWizardOpen, setIsUpgradeWizardOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpgradeSuccess = () => {
    setRefreshKey(prev => prev + 1);
    Swal.fire({
      icon: 'success',
      title: '¡Plan actualizado!',
      text: 'La suscripción fue actualizada correctamente.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900">
              <CreditCard size={32} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                Facturación y suscripción
              </h2>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {isSuperAdmin ? 'Administrá el plan, límites y detalles de pago del tenant' : 'Gestioná tu plan y método de pago'}
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setIsUpgradeWizardOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all whitespace-nowrap"
            >
              <Sparkles size={20} />
              Override de plan
            </button>
          )}
        </div>
      </div>

      <BillingManagement key={refreshKey} tenantId={tenantId} isSuperAdmin={isSuperAdmin} />

      {isSuperAdmin && (
        <PlanUpgradeWizard
          isOpen={isUpgradeWizardOpen}
          onClose={() => setIsUpgradeWizardOpen(false)}
          tenantId={tenantId}
          currentPlan={currentPlan}
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </div>
  );
};

export default BillingTab;