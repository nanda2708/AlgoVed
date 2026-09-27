'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import api from '../../lib/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser({ ...data, userId: data._id });
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setAuthLoading(false);
      return;
    }
    loadUser()
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setAuthLoading(false));
  }, [loadUser]);

  const login = async (token) => {
    localStorage.setItem('token', token);
    try {
      await loadUser();
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: Boolean(user), isAdmin: Boolean(user?.isAdmin), authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
