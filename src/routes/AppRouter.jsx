import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';

import MainLayout from '../components/layout/MainLayout';
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard'; 
import ConnectionModal from '../components/ui/ConnectionModal';
import UsersManagement from '../pages/UsersManagement';
import AnalyticsView from '../pages/AnalyticsView';
import ProfileSettings from '../pages/ProfileSettings';
import TenantsManagement from '../pages/TenantsManagement';
import TenantHome from '../pages/TenantHome';
import TenantDetails from '../pages/TenantDetails';


const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Outlet />;
};

const MqttGuard = ({ children }) => {
  const { config, connectionStatus } = useMqtt();

  if (!config && connectionStatus === 'disconnected') {
      return (
        <>
          {children}
          <ConnectionModal isOpen={true} forceOpen={true} onClose={() => {}} />
        </>
      );
  }

  return children;
};

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={
            <MqttGuard>
              <MainLayout />
            </MqttGuard>
        }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="tenants" element={<TenantsManagement />} />
            <Route path="tenants/:tenantId" element={<TenantDetails />} />
    
            {/* Tenant: Their "Home Base" */}
            <Route path="home" element={<TenantHome />} />  
            
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};