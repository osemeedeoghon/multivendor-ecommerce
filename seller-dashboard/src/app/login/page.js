'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginUser } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await loginUser(email, password);
            router.push('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#f8fafc'
        }}>
            <div style={{
                background: 'white', borderRadius: '12px',
                border: '1px solid #e2e8f0', padding: '48px',
                width: '100%', maxWidth: '420px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
            }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                        🏪 SellerHub
                    </h1>
                    <p style={{ color: '#64748b' }}>Sign in to your seller account</p>
                </div>

                {error && <div className="alert alert--error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="seller@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn--primary btn--full"
                        disabled={loading}
                        style={{ marginTop: '8px' }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '16px', color: '#64748b', fontSize: '0.875rem' }}>
                    New seller?{' '}
                    <Link href="/register" style={{ color: '#2563eb', fontWeight: 500 }}>
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}