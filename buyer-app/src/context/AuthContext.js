'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { login, register, getMe } from '../lib/api';
import { saveTokens, clearTokens, saveUser, getUser, getAccessToken } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      console.log('[AuthContext] Init - Token exists:', !!token);
      if (token) {
        const savedUser = getUser();
        if (savedUser) {
          setUser(savedUser);
        } else {
          try {
            const res = await getMe();
            setUser(res.data.user);
            saveUser(res.data.user);
          } catch (err) {
            console.error('[AuthContext] Failed to get user:', err.message);
            clearTokens();
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const loginUser = async (email, password) => {
    const res = await login({ email, password });
    saveTokens(res.data.accessToken, res.data.refreshToken);

    // Decode JWT to get user info
    const decoded = JSON.parse(atob(res.data.accessToken.split('.')[1]));
    const meRes = await getMe();
    const u = { ...decoded, name: meRes.data?.user?.name || meRes.data?.name || email };

    saveUser(u);
    setUser(u);
    return res.data;
  };

  const registerUser = async (name, email, password) => {
    const res = await register({ name, email, password, role: 'buyer' });
    saveTokens(res.data.accessToken, res.data.refreshToken);
    const decoded = JSON.parse(atob(res.data.accessToken.split('.')[1]));
    const u = { ...decoded, name };
    saveUser(u);
    setUser(u);
    return res.data;
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);