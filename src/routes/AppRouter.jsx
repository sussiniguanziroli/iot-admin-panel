import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';

import MainLayout from '../components/layout/MainLayout';
import LandingPage from '../pages/LandingPage';
import Dashboard from '../pages/Dashboard'; 
import ConnectionModal from '../components/ui/ConnectionModal';
import UsersManagement from '../pages/UsersManagement';
import AnalyticsView from '../pages/AnalyticsView';

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
      <Route path="/login" element={<LandingPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        
        <Route path="/app" element={
            <MqttGuard>
              <MainLayout />
            </MqttGuard>
        }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="users" element={<UsersManagement />} />
            
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};