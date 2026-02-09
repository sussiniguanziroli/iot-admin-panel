import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../../firebase/config';
import { hasPermission } from '../../../shared/utils/permissions';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            setUser({ ...currentUser, ...data });
          } else {
            console.warn("Auth OK, but Profile missing in Firestore.");
            setUser(currentUser);
            setUserProfile(null); 
          }
        } catch (error) {
          console.error("Profile Fetch Error:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  
  const registerSuperAdmin = (email, password) => {
      return createUserWithEmailAndPassword(auth, email, password);
  };

  const sendEmailVerification = async () => {
    if (auth.currentUser) {
      try {
        await firebaseSendEmailVerification(auth.currentUser);
        return { success: true };
      } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'No user logged in' };
  };

  const checkPermission = (permission) => {
    return hasPermission(userProfile?.role, permission);
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    registerSuperAdmin,
    sendEmailVerification,
    hasPermission: checkPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};