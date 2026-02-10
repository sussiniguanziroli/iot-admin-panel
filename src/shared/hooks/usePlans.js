// src/shared/hooks/usePlans.js

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PLANS as FALLBACK_PLANS, getPlanById as getFallbackPlan } from '../../config/plans';

export const usePlans = () => {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('fallback');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansSnapshot = await getDocs(collection(db, 'plans'));
        
        if (!plansSnapshot.empty) {
          const firestorePlans = {};
          plansSnapshot.forEach(doc => {
            firestorePlans[doc.id] = doc.data();
          });
          
          setPlans(firestorePlans);
          setSource('firestore');
          console.log('✅ Plans loaded from Firestore');
        } else {
          console.log('⚠️ No plans in Firestore, using fallback');
        }
      } catch (error) {
        console.error('❌ Error loading plans from Firestore:', error);
        console.log('⚠️ Using fallback plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getPlanById = (planId) => {
    return plans[planId] || getFallbackPlan(planId);
  };

  return { plans, getPlanById, loading, source };
};