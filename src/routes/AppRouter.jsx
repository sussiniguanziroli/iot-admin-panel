// src/router/AppRouter.jsx

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleBasedRoute } from './RoleBasedRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../features/auth/context/AuthContext';
import { getDefaultPath } from '../config/routes.config';
import TenantSetupWizard from '../features/tenant-management/utils/TenantSetupWizard';

const LandingPage = lazy(() => import('../features/landing/pages/LandingPage'));
const Login = lazy(() => import('../features/auth/pages/Login'));
const Register = lazy(() => import('../features/auth/pages/Register'));
const DemoDashboard = lazy(() => import('../features/demo/pages/DemoDashboard'));

const MainLayout = lazy(() => import('../shared/components/layout/MainLayout'));
const Dashboard = lazy(() => import('../features/dashboard/pages/Dashboard'));
const AnalyticsView = lazy(() => import('../features/analytics/pages/AnalyticsView'));
const UsersManagement = lazy(() => import('../features/user-management/pages/UsersManagement'));
const ProfileSettings = lazy(() => import('../features/profile/pages/ProfileSettings'));
const TenantHome = lazy(() => import('../features/profile/pages/TenantHome'));
const TenantsManagement = lazy(() => import('../features/tenant-management/pages/TenantsManagement'));
const TenantDetails = lazy(() => import('../features/tenant-management/pages/TenantDetails'));
const SuperAdminHome = lazy(() => import('../features/super-admin/pages/SuperAdminHome'));
const AuditLogViewer = lazy(() => import('../features/admin/components/AuditLogViewer'));
const BillingPage = lazy(() => import('../features/billing/pages/BillingPage'));
const MyCompanyPage = lazy(() => import('../features/profile/pages/MyCompanyPage'));

const LoadingScreen = () => (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
        </div>
    </div>
);

export const AppRouter = () => {
    const { userProfile } = useAuth();

    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/demo" element={<DemoDashboard />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/app" element={<MainLayout />}>

                        <Route index element={
                            <Navigate
                                to={userProfile ? getDefaultPath(userProfile.role) : '/app/dashboard'}
                                replace
                            />
                        } />

                        <Route element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} />}>
                            <Route path="home" element={<TenantHome />} />
                            <Route path="my-company" element={<MyCompanyPage />} />
                            <Route path="users" element={<UsersManagement />} />
                            <Route path="billing" element={<BillingPage />} />
                            <Route path="audit-logs" element={<AuditLogViewer />} />
                        </Route>

                        <Route element={<RoleBasedRoute allowedRoles={['super_admin']} />}>
                            <Route path="super-admin-home" element={<SuperAdminHome />} />
                            <Route path="tenants" element={<TenantsManagement />} />
                            <Route path="tenants/setup" element={<TenantSetupWizard />} />
                            <Route path="tenants/:tenantId" element={<TenantDetails />} />
                        </Route>

                        <Route element={<RoleBasedRoute allowedRoles={['admin', 'super_admin']} />}>
                            <Route path="home" element={<TenantHome />} />
                            <Route path="users" element={<UsersManagement />} />
                            <Route path="billing" element={<BillingPage />} />
                            <Route path="audit-logs" element={<AuditLogViewer />} />
                        </Route>

                        <Route element={<RoleBasedRoute allowedRoles={['operator', 'viewer', 'admin', 'super_admin']} />}>
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="analytics" element={<AnalyticsView />} />
                            <Route path="profile" element={<ProfileSettings />} />
                        </Route>

                        <Route path="*" element={
                            <Navigate
                                to={userProfile ? getDefaultPath(userProfile.role) : '/app/dashboard'}
                                replace
                            />
                        } />

                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};