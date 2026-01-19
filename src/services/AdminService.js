// src/services/AdminService.js
import { db } from '../firebase/config';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const ACTION_CATEGORIES = {
  DEVICE_CONTROL: 'DEVICE_CONTROL',
  USER_MGMT: 'USER_MGMT',
  TENANT_MGMT: 'TENANT_MGMT',
  CONFIG: 'CONFIG',
  AUTH: 'AUTH',
  DATA: 'DATA'
};

export const ACTION_TYPES = {
  CONTROL_RELAY_ON: 'CONTROL_RELAY_ON',
  CONTROL_RELAY_OFF: 'CONTROL_RELAY_OFF',
  CONTROL_RELAY_ERROR: 'CONTROL_RELAY_ERROR',
  CONTROL_MOTOR_START: 'CONTROL_MOTOR_START',
  CONTROL_MOTOR_STOP: 'CONTROL_MOTOR_STOP',
  MQTT_PUBLISH: 'MQTT_PUBLISH',
  
  USER_CREATED: 'USER_CREATED',
  USER_DELETED: 'USER_DELETED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  INVITE_CREATED: 'INVITE_CREATED',
  INVITE_ACCEPTED: 'INVITE_ACCEPTED',
  
  TENANT_CREATED: 'TENANT_CREATED',
  TENANT_UPDATED: 'TENANT_UPDATED',
  TENANT_DELETED: 'TENANT_DELETED',
  LOCATION_CREATED: 'LOCATION_CREATED',
  LOCATION_UPDATED: 'LOCATION_UPDATED',
  LOCATION_DELETED: 'LOCATION_DELETED',
  
  WIDGET_CREATED: 'WIDGET_CREATED',
  WIDGET_UPDATED: 'WIDGET_UPDATED',
  WIDGET_DELETED: 'WIDGET_DELETED',
  DASHBOARD_LAYOUT_CHANGED: 'DASHBOARD_LAYOUT_CHANGED',
  
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  DATA_EXPORTED: 'DATA_EXPORTED',
  AUDIT_LOG_VIEWED: 'AUDIT_LOG_VIEWED'
};

export const logAction = async (actor, action, target, details = {}) => {
  try {
    const logEntry = {
      timestamp: serverTimestamp(),
      actor: actor.email || 'system',
      actorId: actor.uid || 'system',
      actorRole: details.actorRole || 'unknown',
      
      action,
      category: details.category || 'GENERAL',
      target,
      
      tenantId: details.tenantId || null,
      locationId: details.locationId || null,
      
      previousState: details.previousState || null,
      newState: details.newState || null,
      
      metadata: details.metadata || {}
    };

    await addDoc(collection(db, "audit_logs"), logEntry);
  } catch (e) {
    console.error("Logger Failed:", e);
  }
};

export const createInvitation = async (adminUser, tenantId, role, email = '') => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  await setDoc(doc(db, "invitations", token), {
    tenantId,
    role,
    email: email.toLowerCase().trim(),
    createdBy: adminUser.email,
    createdAt: new Date().toISOString(),
    status: 'pending',
    token
  });

  await logAction(
    adminUser, 
    ACTION_TYPES.INVITE_CREATED, 
    tenantId, 
    { 
      category: ACTION_CATEGORIES.USER_MGMT,
      tenantId,
      metadata: { role, email, token }
    }
  );

  const baseUrl = window.location.origin;
  return `${baseUrl}/register?token=${token}`;
};

export const validateInvitation = async (token) => {
  if (!token) return { valid: false, error: "No token provided" };

  const ref = doc(db, "invitations", token);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { valid: false, error: "Invalid Token" };
  
  const data = snap.data();
  if (data.status !== 'pending') return { valid: false, error: "Invitation has already been used or expired." };

  return { valid: true, data };
};

export const markInvitationUsed = async (token, newUserId) => {
  const ref = doc(db, "invitations", token);
  await updateDoc(ref, { 
    status: 'used',
    usedBy: newUserId,
    usedAt: new Date().toISOString()
  });
};