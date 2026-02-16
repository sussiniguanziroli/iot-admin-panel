// src/shared/hooks/useWidgetAccess.js

import { useAuth } from '../../features/auth/context/AuthContext';
import { usePermissions } from './usePermissions';

export const useWidgetAccess = (widget) => {
  const { userProfile } = useAuth();
  const { isSuperAdmin, isAdmin } = usePermissions();

  // Super Admin y Admin SIEMPRE tienen acceso
  if (isSuperAdmin || isAdmin) {
    return {
      hasAccess: true,
      reason: 'admin_override',
      message: null
    };
  }

  // Si Access Control no está habilitado, usar permisos por defecto
  if (!widget.accessControl?.enabled) {
    const hasDefaultPermission = widget.type === 'switch' 
      ? can.controlEquipment 
      : true; // otros widgets son read-only
    
    return {
      hasAccess: hasDefaultPermission,
      reason: hasDefaultPermission ? 'default_permission' : 'no_permission',
      message: hasDefaultPermission ? null : 'No tiene permisos para controlar equipos'
    };
  }

  // Validación por Access Control configurado
  const { mode, allowedRoles, allowedUserIds, denyMessage } = widget.accessControl;

  // Modo: role-based
  if (mode === 'role-based') {
    const hasRoleAccess = allowedRoles?.includes(userProfile?.role);
    return {
      hasAccess: hasRoleAccess,
      reason: hasRoleAccess ? 'role_allowed' : 'role_denied',
      message: hasRoleAccess ? null : (denyMessage || 'Su rol no tiene acceso a este control')
    };
  }

  // Modo: user-based
  if (mode === 'user-based') {
    const hasUserAccess = allowedUserIds?.includes(userProfile?.uid);
    return {
      hasAccess: hasUserAccess,
      reason: hasUserAccess ? 'user_allowed' : 'user_denied',
      message: hasUserAccess ? null : (denyMessage || 'Su usuario no está autorizado')
    };
  }

  // Modo: hybrid (rol Y usuario)
  if (mode === 'hybrid') {
    const hasRoleAccess = allowedRoles?.includes(userProfile?.role);
    const hasUserAccess = allowedUserIds?.includes(userProfile?.uid);
    const hasAccess = hasRoleAccess || hasUserAccess;
    
    return {
      hasAccess,
      reason: hasAccess ? 'hybrid_allowed' : 'hybrid_denied',
      message: hasAccess ? null : (denyMessage || 'Acceso restringido')
    };
  }

  // Fallback: denegar acceso
  return {
    hasAccess: false,
    reason: 'unknown_mode',
    message: 'Configuración de acceso inválida'
  };
};