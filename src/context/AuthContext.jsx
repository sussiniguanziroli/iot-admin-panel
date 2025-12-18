import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Simulamos un usuario logueado. 
  // HOY A LA TARDE: Aquí reemplazarás esto con onAuthStateChanged de Firebase
  const [user, setUser] = useState({
    uid: '12345',
    name: 'Patricio Sussini',
    email: 'admin@solfrut.com',
    role: 'admin' // Cambia a 'operador' o 'visualizador' para probar permisos
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Función dummy de login
  const login = (email, password) => {
    // Aquí irá la lógica de Firebase signInWithEmailAndPassword
    console.log("Login simulado para:", email);
    setIsAuthenticated(true);
    setUser({ ...user, email, role: 'admin' });
  };

  const logout = () => {
    // Aquí irá firebase.auth().signOut()
    setIsAuthenticated(false);
    setUser(null);
  };

  // Helper para verificar permisos en componentes
  const hasPermission = (requiredRole) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin puede todo
    return user.role === requiredRole;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);