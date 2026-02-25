import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => api.getRole());
  const [isAuth, setIsAuth] = useState(() => api.isAuthenticated());

  const login = (newRole) => {
    setRole(newRole);
    setIsAuth(true);
  };

  const logout = () => {
    api.clearAuth();
    setRole(null);
    setIsAuth(false);
  };

  return (
    <AuthContext.Provider value={{ role, isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
