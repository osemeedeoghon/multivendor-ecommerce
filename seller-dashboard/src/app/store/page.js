'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getMyStore, createStore, updateStore } from '../../lib/api';
import Loading from '../../components/ui/Loading';

export default function StorePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ storeName: '', description: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadStore();
    }, [user, authLoading]);

    const loadStore = async () => {
        try {
            const res = await getMyStore();
            setStore(res.data);
            setForm({ storeName: res.data.storeName, description: res.data.description || '' });
        } catch {
            setStore(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);
        try {
            if (store) {
                await updateStore(form);
                setSuccess('Store updated successfully');
            } else {
                await createStore(form);
                setSuccess('Store created successfully');
            }
            setEditing(false);
            loadStore();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save store');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>My Store</h1>
                {store && !editing && (
                    <button className="btn btn--outline" onClick={() => setEditing(true)}>
                        Edit Store
                    </button>
                )}
            </div>

            {error && <div className="alert alert--error">{error}</div>}
            {success && <div className="alert alert--success">{success}</div>}

            {!store && !editing ? (
                <div className="card" style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '1.125rem', marginBottom: '16px' }}>
                        You don't have a store yet
                    </p>
                    <button className="btn btn--primary" onClick={() => setEditing(true)}>
                        Create Store
                    </button>
                </div>
            ) : editing ? (
                <div className="card" style={{ padding: '32px', maxWidth: '600px' }}>
                    <h2 style={{ fontWeight: 600, marginBottom: '24px' }}>
                        {store ? 'Edit Store' : 'Create Store'}
                    </h2>
                    <form onSubmit={handleSave}>
                        <div className="form-group">
                            <label>Store Name</label>
                            <input
                                value={form.storeName}
                                onChange={e => setForm({ ...form, storeName: e.target.value })}
                                placeholder="My Awesome Store"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Tell buyers about your store..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="submit" className="btn btn--primary" disabled={saving}>
                                {saving ? 'Saving...' : store ? 'Update Store' : 'Create Store'}
                            </button>
                            {store && (
                                <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="card" style={{ padding: '32px' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '8px' }}>
                            {store.storeName}
                        </h2>
                        <p style={{ color: '#64748b', lineHeight: 1.7 }}>
                            {store.description || 'No description yet'}
                        </p>
                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                Store ID: <span style={{ fontFamily: 'monospace' }}>{store._id}</span>
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
                                Created: {new Date(store.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>Store Status</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', background: '#16a34a', borderRadius: '50%' }} />
                            <span style={{ fontWeight: 500, color: '#16a34a' }}>Active</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '8px' }}>
                            Your store is live and visible to buyers
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}