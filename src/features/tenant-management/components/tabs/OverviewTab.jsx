// src/features/tenant-management/components/tabs/OverviewTab.jsx

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import { getPlanById } from '../../../../config/plans';
import Swal from 'sweetalert2';
import { 
  Building2, Save, Package, Calendar, TrendingUp, 
  Crown, Zap, CheckCircle, AlertCircle, Lock, Info
} from 'lucide-react';
import { usePlans } from '../../../../shared/hooks/usePlans';

const OverviewTab = ({ tenantId, tenantData, onUpdate }) => {
  const { can, isSuperAdmin } = usePermissions();
  const { getPlanById } = usePlans();
  const [formData, setFormData] = useState({
    name: tenantData?.name || '',
    plan: tenantData?.plan || 'basic',
    status: tenantData?.status || 'active',
    contactEmail: tenantData?.contactEmail || '',
    industry: tenantData?.industry || '',
    companySize: tenantData?.companySize || ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updateData = {
        updatedAt: new Date().toISOString()
      };

      if (can.editCompanyBasicInfo) {
        updateData.name = formData.name;
        updateData.contactEmail = formData.contactEmail;
        updateData.industry = formData.industry;
        updateData.companySize = formData.companySize;
      }

      if (can.changeTenantPlan && formData.plan !== tenantData?.plan) {
        const newPlan = getPlanById(formData.plan);
        updateData.plan = formData.plan;
        updateData.limits = newPlan.limits;
        
        updateData.subscription = {
          ...tenantData.subscription,
          plan: formData.plan
        };
      }

      if (can.changeTenantStatus) {
        updateData.status = formData.status;
      }

      await updateDoc(doc(db, 'tenants', tenantId), updateData);
      if (onUpdate) onUpdate({ ...formData, limits: updateData.limits });
      
      Swal.fire({
        icon: 'success',
        title: 'Configuration Updated!',
        text: 'Tenant settings have been saved successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update configuration. Please try again.',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const plans = [
    { value: 'free', label: 'Starter', color: 'blue' },
    { value: 'professional', label: 'Professional', color: 'purple' },
    { value: 'enterprise', label: 'Enterprise', color: 'amber' }
  ];

  const statuses = [
    { value: 'active', label: 'Active', icon: CheckCircle, color: 'emerald' },
    { value: 'suspended', label: 'Suspended', icon: AlertCircle, color: 'orange' },
    { value: 'trial', label: 'Trial', icon: Zap, color: 'blue' }
  ];

  const industries = [
    'Manufacturing', 'Agriculture', 'Energy', 'Water Treatment',
    'Food & Beverage', 'Pharmaceuticals', 'Mining', 'Other'
  ];

  const companySizes = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <Building2 size={32} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {tenantData?.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
              ID: {tenantId}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Current Plan
              </p>
              <p className="text-xl font-bold text-slate-800 dark:text-white capitalize">
                {tenantData?.plan || 'Basic'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              tenantData?.status === 'active' 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-orange-100 dark:bg-orange-900/30'
            }`}>
              {tenantData?.status === 'active' ? (
                <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle size={24} className="text-orange-600 dark:text-orange-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Status
              </p>
              <p className="text-xl font-bold text-slate-800 dark:text-white capitalize">
                {tenantData?.status || 'Active'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Member Since
              </p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">
                {tenantData?.createdAt 
                  ? new Date(tenantData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Company Configuration
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Update tenant information and settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {!can.editCompanyBasicInfo && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-start gap-3">
              <Lock size={20} className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                  Read-Only Mode
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Only Super Admins can modify tenant configuration
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Company Name
              </label>
              <input
                type="text"
                required
                disabled={!can.editCompanyBasicInfo}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sol Frut S.R.L."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Contact Email
              </label>
              <input
                type="email"
                disabled={!can.editCompanyBasicInfo}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="admin@company.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Industry
              </label>
              <select
                disabled={!can.editCompanyBasicInfo}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
              >
                <option value="">Select Industry</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Company Size
              </label>
              <select
                disabled={!can.editCompanyBasicInfo}
                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.companySize}
                onChange={e => setFormData({ ...formData, companySize: e.target.value })}
              >
                <option value="">Select Size</option>
                {companySizes.map(size => (
                  <option key={size} value={size}>{size} employees</option>
                ))}
              </select>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">
                Subscription Settings
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    Subscription Plan
                    <Lock size={14} className="text-purple-500" />
                  </label>
                  
                  <div className="space-y-2">
                    {plans.map(plan => (
                      <label
                        key={plan.value}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.plan === plan.value
                            ? `border-${plan.color}-500 bg-${plan.color}-50 dark:bg-${plan.color}-900/20`
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="plan"
                          value={plan.value}
                          checked={formData.plan === plan.value}
                          onChange={e => setFormData({ ...formData, plan: e.target.value })}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          {plan.value === 'enterprise' && <Crown size={16} className="text-amber-500" />}
                          <span className="font-bold text-slate-800 dark:text-white">
                            {plan.label}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    Account Status
                    <Lock size={14} className="text-orange-500" />
                  </label>
                  
                  <div className="space-y-2">
                    {statuses.map(status => {
                      const Icon = status.icon;
                      return (
                        <label
                          key={status.value}
                          className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.status === status.value
                              ? `border-${status.color}-500 bg-${status.color}-50 dark:bg-${status.color}-900/20`
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status.value}
                            checked={formData.status === status.value}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-4 h-4"
                          />
                          <div className="flex items-center gap-2">
                            <Icon size={16} className={`text-${status.color}-600 dark:text-${status.color}-400`} />
                            <span className="font-bold text-slate-800 dark:text-white">
                              {status.label}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {can.editCompanyBasicInfo && (
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default OverviewTab;