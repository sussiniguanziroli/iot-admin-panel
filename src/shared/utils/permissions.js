// src/shared/utils/permissions.js

export const PERMISSIONS = {
    EDIT_DASHBOARD: ['admin', 'super_admin'],
    CONTROL_EQUIPMENT: ['admin', 'super_admin', 'operator'],
    VIEW_DASHBOARD: ['operator', 'viewer', 'admin', 'super_admin'],
    
    MANAGE_USERS: ['admin', 'super_admin'],
    INVITE_USERS: ['admin', 'super_admin'],
    DELETE_USERS: ['admin', 'super_admin'],
    
    MANAGE_TENANTS: ['super_admin'],
    VIEW_ALL_TENANTS: ['super_admin'],
    SWITCH_TENANTS: ['super_admin'],
    CREATE_TENANTS: ['super_admin'],
    
    CONFIGURE_MQTT: ['super_admin'],
    VIEW_MQTT_STATUS: ['operator', 'viewer', 'admin', 'super_admin'],
    
    EXPORT_DATA: ['admin', 'super_admin', 'operator'],
    VIEW_ANALYTICS: ['operator', 'viewer', 'admin', 'super_admin'],
    
    MANAGE_LOCATIONS: ['admin', 'super_admin'],
    VIEW_LOCATIONS: ['operator', 'viewer', 'admin', 'super_admin'],
    
    IMPORT_PROFILE: ['admin', 'super_admin'],
    EXPORT_PROFILE: ['admin', 'super_admin'],
    
    VIEW_AUDIT_LOGS: ['admin', 'super_admin'],
    VIEW_ALL_AUDIT_LOGS: ['super_admin'],
    
    CHANGE_TENANT_PLAN: ['super_admin'],
    CHANGE_TENANT_STATUS: ['super_admin'],
    VIEW_BILLING: ['admin', 'super_admin'],
    REQUEST_PLAN_UPGRADE: ['admin'],
    EDIT_COMPANY_BASIC_INFO: ['admin', 'super_admin'],
    EDIT_TENANT_SENSITIVE_DATA: ['super_admin']
  };
  
  export const hasPermission = (userRole, permission) => {
    if (!userRole || !permission) return false;
    return PERMISSIONS[permission]?.includes(userRole) || false;
  };
  
  export const hasAnyPermission = (userRole, permissions = []) => {
    return permissions.some(permission => hasPermission(userRole, permission));
  };
  
  export const hasAllPermissions = (userRole, permissions = []) => {
    return permissions.every(permission => hasPermission(userRole, permission));
  };