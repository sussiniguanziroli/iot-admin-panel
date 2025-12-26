import { db } from '../firebase/config';
import { collection, addDoc, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- AUDIT LOGGER ---
// Records every important action (who did what, when, and to whom)
export const logAction = async (actor, action, target, details = {}) => {
  try {
    await addDoc(collection(db, "audit_logs"), {
      timestamp: serverTimestamp(),
      actor: actor.email || 'system', // e.g. "admin@solfrut.com"
      actorId: actor.uid || 'system',
      action: action,                 // e.g. "CREATED_INVITE"
      target: target,                 // e.g. "tenant-id-123"
      details: details
    });
  } catch (e) {
    console.error("Logger Failed:", e);
  }
};

// --- INVITATION LOGIC ---

// 1. Create a secure token and save it to Firestore
export const createInvitation = async (adminUser, tenantId, role, email = '') => {
  // Generate a random secure token
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Save invitation to 'invitations' collection
  await setDoc(doc(db, "invitations", token), {
    tenantId,
    role,
    email: email.toLowerCase().trim(), // Optional: Lock invite to specific email
    createdBy: adminUser.email,
    createdAt: new Date().toISOString(),
    status: 'pending', // pending, used, revoked
    token
  });

  // Log the action
  await logAction(adminUser, 'CREATED_INVITE', tenantId, { role, email, token });

  // Return the full registration URL
  const baseUrl = window.location.origin; // Gets "http://localhost:5173" or your production domain
  return `${baseUrl}/register?token=${token}`;
};

// 2. Check if a token is valid (called by Register page)
export const validateInvitation = async (token) => {
  if (!token) return { valid: false, error: "No token provided" };

  const ref = doc(db, "invitations", token);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { valid: false, error: "Invalid Token" };
  
  const data = snap.data();
  if (data.status !== 'pending') return { valid: false, error: "Invitation has already been used or expired." };

  return { valid: true, data };
};

// 3. Mark token as used (called after successful registration)
export const markInvitationUsed = async (token, newUserId) => {
  const ref = doc(db, "invitations", token);
  await updateDoc(ref, { 
    status: 'used',
    usedBy: newUserId,
    usedAt: new Date().toISOString()
  });
};