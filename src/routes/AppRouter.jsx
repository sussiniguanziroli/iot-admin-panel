import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMqtt } from '../context/MqttContext';

// Importaciones de Layout y Páginas
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/Dashboard'; 
import ConnectionModal from '../components/ui/ConnectionModal';
import UsersManagement from '../pages/UsersManagement';
import AnalyticsView from '../pages/AnalyticsView';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  
  // 🔥 FIX: Si ya estoy autenticado, redirigir automáticamente al Dashboard
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="p-8 bg-white rounded-2xl shadow-xl text-center w-96">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">SolFrut SCADA</h1>
        <p className="text-slate-500 mb-6 text-sm">Acceso al Panel de Control</p>
        
        <button 
          onClick={() => login('admin@test.com', '123')} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-200"
        >
          Ingresar como Admin
        </button>
        
        <div className="mt-4 text-xs text-slate-400">
          Modo Simulación Activo
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  // Si NO estoy autenticado, me manda al Login
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const MqttGuard = ({ children }) => {
  const { config, connectionStatus } = useMqtt();

  // Si no hay config, mostramos el modal forzosamente
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
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rutas Privadas */}
      <Route element={<ProtectedRoute />}>
        {/* Redirección inicial: Si entras a "/", te lleva al dashboard */}
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        
        <Route path="/app" element={
            <MqttGuard>
              <MainLayout />
            </MqttGuard>
        }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="users" element={<UsersManagement />} />
            
            {/* Si pones una ruta mala dentro de /app, te lleva al dashboard */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      {/* Catch-all: Cualquier otra cosa te manda al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};