import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';

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
      setLoading(true); // 🔒 LOCK APP
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            setUser({ ...currentUser, ...data });
          } else {
            // If user exists in Auth but not in Firestore
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
      setLoading(false); // 🔓 UNLOCK APP
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);
  
  const registerSuperAdmin = (email, password) => {
      return createUserWithEmailAndPassword(auth, email, password);
  };

  const hasPermission = (requiredRole) => {
      if (!userProfile) return false;
      if (userProfile.role === 'super_admin') return true; 
      return userProfile.role === requiredRole;
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    loginWithGoogle,
    logout,
    registerSuperAdmin,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 🛑 BLOCK RENDER UNTIL LOADING IS DONE */}
      {!loading && children} 
    </AuthContext.Provider>
  );
};