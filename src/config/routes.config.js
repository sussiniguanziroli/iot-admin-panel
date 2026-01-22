// src/config/routes.config.js

export const ROUTE_CONFIG = {
    super_admin: {
      defaultPath: '/app/super-admin-home',
      allowedPaths: [
        '/app/super-admin-home',
        '/app/tenants',
        '/app/tenants/:tenantId',
        '/app/dashboard',
        '/app/analytics',
        '/app/users',
        '/app/audit-logs',      // ✅ Super admin ve TODOS los logs
        '/app/profile'
      ],
      layout: 'SuperAdminLayout'
    },
    
    admin: {
      defaultPath: '/app/home',
      allowedPaths: [
        '/app/home',
        '/app/dashboard',
        '/app/analytics',
        '/app/users',
        '/app/billing', 
        '/app/audit-logs',      // ✅ Admin ve logs de SU tenant
        '/app/profile'
      ],
      layout: 'AdminLayout'
    },
    
    operator: {
      defaultPath: '/app/dashboard',
      allowedPaths: [
        '/app/dashboard',
        '/app/analytics',
        '/app/profile'
      ],
      layout: 'OperatorLayout'
    },
    
    viewer: {
      defaultPath: '/app/dashboard',
      allowedPaths: [
        '/app/dashboard',
        '/app/profile'
      ],
      layout: 'OperatorLayout'
    }
  };
  
  export const getDefaultPath = (role) => {
    return ROUTE_CONFIG[role]?.defaultPath || '/app/dashboard';
  };
  
  export const isPathAllowed = (role, path) => {
    const allowedPaths = ROUTE_CONFIG[role]?.allowedPaths || [];
    return allowedPaths.some(allowedPath => {
      const pattern = new RegExp(`^${allowedPath.replace(/:\w+/g, '[^/]+')}$`);
      return pattern.test(path);
    });
  };