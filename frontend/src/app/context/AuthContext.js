'use client';
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        if (mounted) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      if (!API_URL) {
        console.error('NEXT_PUBLIC_API_URL is not configured');
        localStorage.removeItem('token');
        if (mounted) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        setUser({ userId: res.data._id, username: res.data.username, ...res.data });
        setIsLoggedIn(true);
        setIsAdmin(Boolean(res.data.isAdmin));
      } catch (error) {
        console.error('Auth check error:', error.response?.data || error.message);
        localStorage.removeItem('token');
        if (mounted) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setUser(null);
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [API_URL]);

  const login = async (token) => {
    if (!token || !API_URL) {
      throw new Error('Authentication configuration is missing');
    }

    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.setItem('token', token);
      setUser({ userId: res.data._id, username: res.data.username, ...res.data });
      setIsLoggedIn(true);
      setIsAdmin(Boolean(res.data.isAdmin));
    } catch (error) {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, authLoading, isAdmin, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
