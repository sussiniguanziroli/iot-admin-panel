// src/shared/hooks/useAuditLog.js
import { useCallback } from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useDashboard } from '../../features/dashboard/context/DashboardContext';
import { logAction, ACTION_CATEGORIES } from '../../services/AdminService';

export const useAuditLog = () => {
  const { user, userProfile } = useAuth();
  const { viewedTenantId, activeLocation } = useDashboard();

  const log = useCallback(async (action, category, target, metadata = {}) => {
    if (!user || !userProfile) {
      console.warn('[AUDIT LOG] No user context');
      return;
    }

    try {
      await logAction(
        { email: user.email, uid: user.uid },
        action,
        target,
        {
          category,
          actorRole: userProfile.role,
          tenantId: viewedTenantId || userProfile.tenantId,
          locationId: activeLocation?.id || null,
          metadata: {
            ...metadata,
            userAgent: navigator.userAgent
          }
        }
      );

      console.log(`[AUDIT LOG] ${action} - ${target}`);
    } catch (error) {
      console.error('[AUDIT LOG ERROR]', error);
    }
  }, [user, userProfile, viewedTenantId, activeLocation]);

  return { log };
};