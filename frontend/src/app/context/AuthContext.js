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
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser({ userId: res.data._id, username: res.data.username, ...res.data });
          setIsLoggedIn(true);
          setIsAdmin(res.data.isAdmin || false);
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error.response?.data || error.message);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [API_URL]);

  const login = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);

    axios
      .get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser({ userId: res.data._id, username: res.data.username, ...res.data });
        setIsAdmin(res.data.isAdmin || false);
      })
      .catch((error) => {
        console.error('Login fetch error:', error.response?.data || error.message);
        setUser(null);
        setIsAdmin(false);
      });
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
