import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const tokens = localStorage.getItem('tokens');
    if (storedUser && tokens) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    await authService.login(email, password);
    const profile = await authService.getProfile();
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const isAuthenticated = !!user && !!localStorage.getItem('tokens');

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
