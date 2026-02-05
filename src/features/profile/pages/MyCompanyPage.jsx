// src/features/profile/pages/MyCompanyPage.jsx

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import OverviewTab from '../../tenant-management/components/tabs/OverviewTab';
import LocationsTab from '../../tenant-management/components/tabs/LocationsTab';
import UsersTab from '../../tenant-management/components/tabs/UsersTab';
import BillingTab from '../../tenant-management/components/tabs/BillingTab';

const MyCompanyPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTenant = async () => {
      if (!userProfile?.tenantId) return;
      
      try {
        const tenantSnap = await getDoc(doc(db, 'tenants', userProfile.tenantId));
        if (tenantSnap.exists()) {
          setTenant({ id: tenantSnap.id, ...tenantSnap.data() });
        }
      } catch (e) {
        console.error('Error fetching tenant:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTenant();
  }, [userProfile]);

  const handleTenantUpdate = (updatedData) => {
    setTenant(prev => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading Company...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
          <Building2 size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
            Company Not Found
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400">
            Your account is not associated with any company. Contact support.
          </p>
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
            onClick={() => navigate('/app/home')}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft size={22} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <Building2 className="text-blue-600" size={32} />
              {tenant.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              My Company Settings
            </p>
          </div>
        </div>
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
            tenantId={tenant.id} 
            tenantData={tenant} 
            onUpdate={handleTenantUpdate}
          />
        )}
        {activeTab === 'locations' && (
          <LocationsTab tenantId={tenant.id} />
        )}
        {activeTab === 'users' && (
          <UsersTab tenantId={tenant.id} tenantName={tenant.name} />
        )}
        {activeTab === 'billing' && (
          <BillingTab tenantId={tenant.id} />
        )}
      </div>
    </div>
  );
};

export default MyCompanyPage;