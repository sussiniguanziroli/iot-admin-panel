import { useAuth } from '../../features/auth/context/AuthContext';
import { hasPermission as checkPermission } from '../utils/permissions';

export const usePermissions = () => {
  const { userProfile } = useAuth();
  
  const hasPermission = (permission) => {
    return checkPermission(userProfile?.role, permission);
  };
  
  const can = {
    editDashboard: hasPermission('EDIT_DASHBOARD'),
    controlEquipment: hasPermission('CONTROL_EQUIPMENT'),
    viewDashboard: hasPermission('VIEW_DASHBOARD'),
    
    manageUsers: hasPermission('MANAGE_USERS'),
    inviteUsers: hasPermission('INVITE_USERS'),
    deleteUsers: hasPermission('DELETE_USERS'),
    
    manageTenants: hasPermission('MANAGE_TENANTS'),
    viewAllTenants: hasPermission('VIEW_ALL_TENANTS'),
    switchTenants: hasPermission('SWITCH_TENANTS'),
    createTenants: hasPermission('CREATE_TENANTS'),
    
    configureMqtt: hasPermission('CONFIGURE_MQTT'),
    viewMqttStatus: hasPermission('VIEW_MQTT_STATUS'),
    
    exportData: hasPermission('EXPORT_DATA'),
    viewAnalytics: hasPermission('VIEW_ANALYTICS'),
    
    manageLocations: hasPermission('MANAGE_LOCATIONS'),
    viewLocations: hasPermission('VIEW_LOCATIONS'),
    
    importProfile: hasPermission('IMPORT_PROFILE'),
    exportProfile: hasPermission('EXPORT_PROFILE')
  };
  
  return { 
    hasPermission, 
    can,
    role: userProfile?.role,
    isSuperAdmin: userProfile?.role === 'super_admin',
    isAdmin: userProfile?.role === 'admin',
    isOperator: userProfile?.role === 'operator',
    isViewer: userProfile?.role === 'viewer'
  };
};