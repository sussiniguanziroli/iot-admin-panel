import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { 
  Activity, Users, CreditCard, ArrowRight, Server, 
  ShieldCheck, AlertCircle 
} from 'lucide-react';

const TenantHome = () => {
  const { userProfile } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuperAdmin) {
      navigate('/app/super-admin-home', { replace: true });
    }
  }, [isSuperAdmin, navigate]);

  if (isSuperAdmin) {
    return null;
  }

  const stats = {
    activeDevices: 4,
    alerts: 0,
    nextBill: 'Jan 01, 2026'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {userProfile?.name}</h1>
            <p className="text-blue-100 text-lg mb-6">Organization: <span className="font-bold">{userProfile?.tenantId?.replace(/-/g, ' ').toUpperCase()}</span></p>
            
            <button 
                onClick={() => navigate('/app/dashboard')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-lg"
            >
                Open SCADA Dashboard <ArrowRight size={20} />
            </button>
        </div>
        
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform translate-x-12"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Activity size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-700 dark:text-white">System Status</h3>
                    <p className="text-xs text-slate-400">Real-time health</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Operational
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{stats.activeDevices} devices online.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-700 dark:text-white">Plan: Enterprise</h3>
                    <p className="text-xs text-slate-400">Billing Status</p>
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">Active</div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Next invoice: {stats.nextBill}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-700 dark:text-white">Access Control</h3>
                    <p className="text-xs text-slate-400">Your role: {userProfile?.role}</p>
                </div>
            </div>
             <button 
                onClick={() => navigate('/app/users')}
                className="w-full py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
             >
                Manage Staff Access
             </button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Server className="text-slate-400" />
            <div>
                <h4 className="font-bold text-slate-700 dark:text-white">Need technical support?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contact the Fortunato Engineering Team directly.</p>
            </div>
         </div>
         <button className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Contact Support</button>
      </div>
    </div>
  );
};

export default TenantHome;