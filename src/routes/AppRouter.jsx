import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import MainLayout from '../components/layout/MainLayout';
import LandingPage from '../pages/LandingPage';
import Dashboard from '../pages/Dashboard'; 
import UsersManagement from '../pages/UsersManagement';
import AnalyticsView from '../pages/AnalyticsView';

// --- IMPORT MISSING PAGES ---
import TenantsManagement from '../pages/TenantsManagement';
import TenantDetails from '../pages/TenantDetails';
import TenantHome from '../pages/TenantHome';
import ProfileSettings from '../pages/ProfileSettings'; // <--- Critical for your error
import DemoDashboard from '../pages/DemoDashboard';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Outlet />;
};

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LandingPage />} />
      <Route path="/demo" element={<DemoDashboard />} />
      
      <Route element={<ProtectedRoute />}>
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        
        {/* Main App Routes */}
        <Route path="/app" element={<MainLayout />}>
            
            {/* Standard Routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="profile" element={<ProfileSettings />} /> {/* <--- Route Restored */}
            <Route path="home" element={<TenantHome />} />
            
            {/* Super Admin Routes */}
            <Route path="tenants" element={<TenantsManagement />} />
            <Route path="tenants/:tenantId" element={<TenantDetails />} />
            
            {/* Catch-all: Redirect to Absolute Path to prevent loops */}
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Route>
      </Route>

      {/* Catch-all for unknown root paths */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};