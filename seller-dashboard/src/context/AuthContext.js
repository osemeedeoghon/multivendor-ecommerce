'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { login, getMe } from '../lib/api';
import { saveTokens, clearTokens, saveUser, getUser, getAccessToken } from '../lib/auth';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            const savedUser = getUser();
            if (savedUser) {
                setUser(savedUser);
            } else {
                getMe()
                    .then(res => {
                        const u = res.data.user || res.data;
                        setUser(u);
                        saveUser(u);
                    })
                    .catch(() => clearTokens());
            }
        }
        setLoading(false);
    }, []);

    const loginUser = async (email, password) => {
        const res = await login({ email, password });
        saveTokens(res.data.accessToken, res.data.refreshToken);
        const meRes = await getMe();
        const u = meRes.data.user || meRes.data;

        if (u.role !== 'seller') {
            clearTokens();
            throw new Error('Access denied. Seller accounts only.');
        }

        saveUser(u);
        setUser(u);
        return u;
    };

    const registerUser = async (name, email, password) => {
        const res = await api.post('/api/auth/register', { name, email, password, role: 'seller' });
        saveTokens(res.data.accessToken, res.data.refreshToken);
        const meRes = await getMe();
        const u = meRes.data.user || meRes.data;
        saveUser(u);
        setUser(u);
        return u;
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