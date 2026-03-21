'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { login, register, getMe } from '../lib/api';
import { saveTokens, clearTokens, saveUser, getUser, getAccessToken } from '../lib/auth';

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
                        setUser(res.data.user);
                        saveUser(res.data.user);
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
    const user = meRes.data.user || meRes.data;
    saveUser(user);
    setUser(user);
    return res.data;
};

const registerUser = async (name, email, password) => {
    const res = await register({ name, email, password, role: 'buyer' });
    saveTokens(res.data.accessToken, res.data.refreshToken);
    const meRes = await getMe();
    const user = meRes.data.user || meRes.data;
    saveUser(user);
    setUser(user);
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