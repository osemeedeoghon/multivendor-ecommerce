'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login, register, getMe } from '../lib/api';
import { saveTokens, clearTokens, saveUser, getUser, getAccessToken } from '../lib/auth';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginUser: (email: string, password: string) => Promise<any>;
    registerUser: (name: string, email: string, password: string) => Promise<any>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            const savedUser = getUser();
            if (savedUser) {
                setUser(savedUser);
            } else {
                getMe()
                    .then((res: any) => {
                        setUser(res.data.user);
                        saveUser(res.data.user);
                    })
                    .catch(() => clearTokens());
            }
        }
        setLoading(false);
    }, []);

    const loginUser = async (email: string, password: string) => {
        const res = await login({ email, password });
        saveTokens(res.data.accessToken, res.data.refreshToken);
        const meRes = await getMe();
        saveUser(meRes.data.user);
        setUser(meRes.data.user);
        return res.data;
    };

    const registerUser = async (name: string, email: string, password: string) => {
        const res = await register({ name, email, password, role: 'buyer' });
        saveTokens(res.data.accessToken, res.data.refreshToken);
        const meRes = await getMe();
        saveUser(meRes.data.user);
        setUser(meRes.data.user);
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};