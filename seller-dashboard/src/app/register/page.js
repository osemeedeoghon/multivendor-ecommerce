'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { registerUser } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await registerUser(name, email, password);
            router.push('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '48px', width: '100%', maxWidth: '420px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>🏪 SellerHub</h1>
                    <p style={{ color: '#64748b' }}>Create your seller account</p>
                </div>

                {error && <div className="alert alert--error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="seller@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <button type="submit" className="btn btn--primary btn--full" disabled={loading} style={{ marginTop: '8px' }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '0.875rem' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#2563eb', fontWeight: 500 }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
