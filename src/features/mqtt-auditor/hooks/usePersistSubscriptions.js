import { useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useDashboard } from '../../dashboard/context/DashboardContext';

export const usePersistSubscriptions = (subscriptions, addSubscription) => {
  const { viewedTenantId, activeLocation } = useDashboard();

  const getAuditorDocPath = useCallback(() => {
    if (!viewedTenantId || !activeLocation?.id) return null;
    return `mqtt-auditor/${viewedTenantId}_${activeLocation.id}`;
  }, [viewedTenantId, activeLocation]);

  const saveSubscriptions = useCallback(async () => {
    const docPath = getAuditorDocPath();
    if (!docPath) return;

    try {
      const data = {
        tenantId: viewedTenantId,
        locationId: activeLocation.id,
        locationName: activeLocation.name,
        subscriptions: subscriptions.map(sub => ({
          topic: sub.topic,
          qos: sub.qos,
          subscribedAt: sub.subscribedAt
        })),
        updatedAt: new Date()
      };

      await setDoc(doc(db, docPath), data, { merge: true });
      console.log('[MQTT Auditor] Subscriptions saved to Firestore');
    } catch (error) {
      console.error('[MQTT Auditor] Error saving subscriptions:', error);
    }
  }, [subscriptions, getAuditorDocPath, viewedTenantId, activeLocation]);

  const loadSubscriptions = useCallback(async () => {
    const docPath = getAuditorDocPath();
    if (!docPath) return;

    try {
      const docSnap = await getDoc(doc(db, docPath));
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('[MQTT Auditor] Loaded subscriptions from Firestore:', data.subscriptions);
        
        data.subscriptions?.forEach(sub => {
          addSubscription(sub.topic, sub.qos);
        });
      }
    } catch (error) {
      console.error('[MQTT Auditor] Error loading subscriptions:', error);
    }
  }, [getAuditorDocPath, addSubscription]);

  useEffect(() => {
    if (subscriptions.length > 0) {
      const timeoutId = setTimeout(saveSubscriptions, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [subscriptions, saveSubscriptions]);

  return { loadSubscriptions };
};