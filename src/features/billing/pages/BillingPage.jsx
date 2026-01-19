// src/features/billing/pages/BillingPage.jsx

import React from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import BillingManagement from '../components/BillingManagement';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BillingPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/app/home')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Billing & Subscription
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your plan, usage, and payment details
          </p>
        </div>
      </div>

      <BillingManagement 
        tenantId={userProfile?.tenantId} 
        isSuperAdmin={false} 
      />
    </div>
  );
};

export default BillingPage;