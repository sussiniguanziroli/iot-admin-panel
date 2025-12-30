import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext';
import { getDefaultPath } from '../config/routes.config';

export const RoleBasedRoute = ({ allowedRoles, redirectTo, children }) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const hasAccess = allowedRoles.includes(userProfile.role);
  
  if (!hasAccess) {
    const defaultPath = redirectTo || getDefaultPath(userProfile.role);
    return <Navigate to={defaultPath} replace />;
  }
  
  return children || <Outlet />;
};