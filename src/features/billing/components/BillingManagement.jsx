// src/features/billing/components/BillingManagement.jsx

import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { 
  CreditCard, Package, TrendingUp, AlertCircle, CheckCircle, 
  Activity, Users, MapPin, Layout, Zap, Database, Calendar, Lock
} from 'lucide-react';

const BillingManagement = ({ tenantId, isSuperAdmin = false }) => {
  const [billingData, setBillingData] = useState(null);
  const [realUsage, setRealUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
        if (tenantDoc.exists()) {
          const data = tenantDoc.data();
          setBillingData({
            subscription: data.subscription,
            limits: data.limits,
            usage: data.usage
          });

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
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) fetchBillingData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!billingData || !billingData.subscription) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-3" size={48} />
        <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">Billing Data Not Found</h3>
        <p className="text-sm text-red-600 dark:text-red-400">This tenant needs to be migrated to the new billing system.</p>
      </div>
    );
  }

  const { subscription, limits, usage } = billingData;
  const planName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
  const isActive = subscription.status === 'active';
  const daysUntilRenewal = Math.ceil((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24));

  const usageMetrics = [
    {
      icon: MapPin,
      label: 'Locations',
      current: realUsage?.locations || 0,
      limit: limits.maxLocations,
      color: 'blue'
    },
    {
      icon: Users,
      label: 'Users',
      current: realUsage?.users || 0,
      limit: limits.maxUsers,
      color: 'purple'
    },
    {
      icon: Layout,
      label: 'Widgets',
      current: realUsage?.widgetsTotal || 0,
      limit: limits.maxWidgetsTotal,
      color: 'emerald'
    },
    {
      icon: Activity,
      label: 'Dashboards',
      current: realUsage?.dashboards || 0,
      limit: limits.maxDashboards,
      color: 'orange'
    }
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
      
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Package size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{planName} Plan</h2>
                <p className="text-purple-200">Active Subscription</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 ${
              isActive 
                ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30' 
                : 'bg-red-500/20 text-red-100 border border-red-400/30'
            }`}>
              {isActive ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {subscription.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-purple-200 text-sm mb-1">Current Period</p>
              <p className="font-mono text-lg font-bold">
                {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Next Billing Date</p>
              <p className="font-mono text-lg font-bold flex items-center gap-2">
                <Calendar size={18} />
                {new Date(subscription.nextBillingDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-sm mb-1">Time Remaining</p>
              <p className="font-mono text-lg font-bold">
                {daysUntilRenewal} days
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
            Resource Usage
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Current utilization vs plan limits</p>
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
                      <p className="text-xs text-slate-500">
                        {isUnlimited ? 'Unlimited' : `Limit: ${metric.limit}`}
                      </p>
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
                          percentage >= 90 ? 'bg-red-500' : 
                          percentage >= 75 ? 'bg-orange-500' : 
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-right">
                      {percentage.toFixed(1)}% used
                    </p>
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
            Plan Features
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
              <span className={`text-sm font-medium ${
                enabled 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
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
            Data & Connectivity
          </h3>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">MQTT Messages Today</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {(usage.mqttMessagesToday || 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Limit: {limits.maxMqttMessagesPerDay.toLocaleString()}/day
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Data Retention</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">
              {limits.dataRetentionDays}
            </p>
            <p className="text-xs text-slate-400 mt-1">days</p>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Aggregation</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
              {limits.aggregationInterval}
            </p>
            <p className="text-xs text-slate-400 mt-1">interval</p>
          </div>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">
                Payment Method
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure your billing details and payment information
              </p>
            </div>
            <button 
              disabled
              className="flex items-center gap-2 bg-slate-300 text-slate-500 px-6 py-3 rounded-xl font-bold cursor-not-allowed"
            >
              <CreditCard size={20} />
              Coming Soon
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingManagement;