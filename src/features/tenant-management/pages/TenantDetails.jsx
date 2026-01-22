import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useDashboard } from '../../dashboard/context/DashboardContext';
import { Building2, ArrowLeft, Eye } from 'lucide-react';

import OverviewTab from '../components/tabs/OverviewTab';
import LocationsTab from '../components/tabs/LocationsTab';
import UsersTab from '../components/tabs/UsersTab';
import BillingTab from '../components/tabs/BillingTab';

const TenantDetails = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { switchTenant } = useDashboard();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
        if (tenantSnap.exists()) {
          setTenant({ id: tenantSnap.id, ...tenantSnap.data() });
        } else {
          navigate('/app/tenants');
        }
      } catch (e) {
        console.error('Error fetching tenant:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, [tenantId, navigate]);

  const handleImpersonate = () => {
    switchTenant(tenantId);
    navigate('/app/dashboard');
  };

  const handleTenantUpdate = (updatedData) => {
    setTenant(prev => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading Configuration...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'locations', label: 'Locations' },
    { id: 'users', label: 'Users' },
    { id: 'billing', label: 'Billing' }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/tenants')}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft size={22} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <Building2 className="text-blue-600" size={32} />
              {tenant.name}
            </h1>
            <p className="text-slate-500 text-sm font-mono mt-1">
              Tenant ID: {tenant.id}
            </p>
          </div>
        </div>
        <button
          onClick={handleImpersonate}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all"
        >
          <Eye size={20} />
          <span className="hidden sm:inline">View Dashboard</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden mb-6">
        <div className="flex gap-1 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-3 text-sm font-bold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in">
        {activeTab === 'overview' && (
          <OverviewTab 
            tenantId={tenantId} 
            tenantData={tenant} 
            onUpdate={handleTenantUpdate}
          />
        )}
        {activeTab === 'locations' && (
          <LocationsTab tenantId={tenantId} />
        )}
        {activeTab === 'users' && (
          <UsersTab tenantId={tenantId} tenantName={tenant.name} />
        )}
        {activeTab === 'billing' && (
          <BillingTab tenantId={tenantId} />
        )}
      </div>
    </div>
  );
};

export default TenantDetails;