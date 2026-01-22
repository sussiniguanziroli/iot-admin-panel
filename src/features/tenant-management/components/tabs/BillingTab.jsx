import React from 'react';
import BillingManagement from '../../../billing/components/BillingManagement';
import { CreditCard } from 'lucide-react';

const BillingTab = ({ tenantId }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900">
            <CreditCard size={32} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              Billing & Subscription
            </h2>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Manage plan, usage limits, and payment details
            </p>
          </div>
        </div>
      </div>

      <BillingManagement tenantId={tenantId} isSuperAdmin={true} />
    </div>
  );
};

export default BillingTab;