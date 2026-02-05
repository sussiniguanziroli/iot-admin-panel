// src/features/tenant-management/components/tabs/BillingTab.jsx

import React, { useState } from 'react';
import BillingManagement from '../../../billing/components/BillingManagement';
import PlanUpgradeWizard from '../../../billing/components/PlanUpgradeWizard';
import { CreditCard, ArrowUpCircle, Sparkles } from 'lucide-react';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import Swal from 'sweetalert2';

const BillingTab = ({ tenantId, currentPlan }) => {
  const { isSuperAdmin, can } = usePermissions();
  const [isUpgradeWizardOpen, setIsUpgradeWizardOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRequestUpgrade = () => {
    Swal.fire({
      icon: 'info',
      title: 'Plan Upgrade Request',
      html: `
        <p class="text-slate-600 mb-4">To upgrade your subscription plan, please contact:</p>
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p class="font-bold text-blue-900">Email: sales@fortunato.ctech</p>
          <p class="font-bold text-blue-900">Phone: +1 (555) 123-4567</p>
        </div>
        <p class="text-sm text-slate-500 mt-4">Our team will assist you with the upgrade process</p>
      `,
      confirmButtonText: 'Got it',
      confirmButtonColor: '#3b82f6'
    });
  };

  const handleUpgradeSuccess = () => {
    setRefreshKey(prev => prev + 1);
    
    Swal.fire({
      icon: 'success',
      title: 'Plan Upgraded!',
      text: 'The subscription has been successfully upgraded.',
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
                Billing & Subscription
              </h2>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {isSuperAdmin ? 'Manage plan, usage limits, and payment details' : 'View your current plan and usage'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {isSuperAdmin && (
              <button
                onClick={() => setIsUpgradeWizardOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all whitespace-nowrap"
              >
                <Sparkles size={20} />
                Upgrade Plan
              </button>
            )}
            
            {!isSuperAdmin && can.requestPlanUpgrade && (
              <button
                onClick={handleRequestUpgrade}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all whitespace-nowrap"
              >
                <ArrowUpCircle size={20} />
                Request Upgrade
              </button>
            )}
          </div>
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