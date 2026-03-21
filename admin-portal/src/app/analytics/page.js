'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
            await loginUser(email, password);
            router.push('/');
        } catch (err) {
            setError(err.message || err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
        }}>
            <div style={{
                background: 'white', borderRadius: '16px',
                padding: '48px', width: '100%', maxWidth: '420px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⚡</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>AdminHub</h1>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Platform Administration</p>
                </div>

                {error && <div className="alert alert--error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="admin@example.com"
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
                        style={{ marginTop: '8px', background: '#7c3aed' }}
                    >
                        {loading ? 'Signing in...' : 'Sign In as Admin'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Admin accounts only. Unauthorized access is prohibited.
                </p>
            </div>
        </div>
    );
}