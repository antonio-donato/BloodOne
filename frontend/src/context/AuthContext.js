import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { userAPI } from '../api/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setLoading(false);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const response = await userAPI.getCurrentUser();
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user:', error);
      logout();
    }
  }, [logout]);

  useEffect(() => {
    // Controlla se c'è un token salvato
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Verifica se il token è scaduto
        if (decoded.exp * 1000 > Date.now()) {
          loadUser();
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    } else {
      setLoading(false);
    }
  }, [loadUser, logout]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setLoading(false);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
