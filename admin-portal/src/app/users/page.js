'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';
import api from '../../lib/api';

export default function UsersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadUsers();
    }, [user, authLoading]);

    const loadUsers = async () => {
        try {
            const res = await api.get('/api/auth/users');
            setUsers(res.data || []);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const roles = ['all', 'buyer', 'seller', 'admin'];
    const filtered = users
        .filter(u => filter === 'all' || u.role === filter)
        .filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()));

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>Users</h1>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{users.length} total users</span>
            </div>

            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        flex: 1, padding: '10px 16px', border: '1.5px solid #e2e8f0',
                        borderRadius: '8px', fontSize: '0.9375rem', outline: 'none'
                    }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                    {roles.map(r => (
                        <button
                            key={r}
                            onClick={() => setFilter(r)}
                            className={`btn btn--sm ${filter === r ? 'btn--primary' : 'btn--ghost'}`}
                            style={filter === r ? { background: '#7c3aed' } : {}}
                        >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>User ID</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filtered.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: u.role === 'admin' ? '#ede9fe' : u.role === 'seller' ? '#d1fae5' : '#dbeafe',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.875rem', fontWeight: 600,
                                                color: u.role === 'admin' ? '#7c3aed' : u.role === 'seller' ? '#16a34a' : '#2563eb'
                                            }}>
                                                {u.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#64748b' }}>{u.email}</td>
                                    <td><span className={`badge badge--${u.role}`}>{u.role}</span></td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#94a3b8' }}>
                                        {u._id}
                                    </td>
                                    <td style={{ color: '#64748b' }}>
                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}