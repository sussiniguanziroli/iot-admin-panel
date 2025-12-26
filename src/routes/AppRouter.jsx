import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import MainLayout from '../components/layout/MainLayout';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Register from '../pages/Register'; // <--- NEW IMPORT
import Dashboard from '../pages/Dashboard'; 
import UsersManagement from '../pages/UsersManagement';
import AnalyticsView from '../pages/AnalyticsView';
import TenantsManagement from '../pages/TenantsManagement';
import TenantDetails from '../pages/TenantDetails';
import TenantHome from '../pages/TenantHome';
import ProfileSettings from '../pages/ProfileSettings'; 
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
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> {/* <--- NEW ROUTE */}
      <Route path="/demo" element={<DemoDashboard />} />
      
      {/* PROTECTED ROUTES */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<MainLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="home" element={<TenantHome />} />
            
            {/* Super Admin */}
            <Route path="tenants" element={<TenantsManagement />} />
            <Route path="tenants/:tenantId" element={<TenantDetails />} />
            
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};