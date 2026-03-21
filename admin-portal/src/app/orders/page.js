'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getAllOrders, updateOrderStatus } from '../../lib/api';
import Loading from '../../components/ui/Loading';

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadOrders();
    }, [user, authLoading]);

    const loadOrders = async () => {
        try {
            const res = await getAllOrders();
            setOrders(res.data || []);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        setUpdating(id);
        try {
            await updateOrderStatus(id, status);
            loadOrders();
        } catch {
            alert('Failed to update order');
        } finally {
            setUpdating(null);
        }
    };

    const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>Orders</h1>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {orders.length} total orders
                </span>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {statuses.map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`btn btn--sm ${filter === s ? 'btn--primary' : 'btn--ghost'}`}
                        style={filter === s ? { background: '#7c3aed' } : {}}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        <span style={{
                            marginLeft: '4px', background: filter === s ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                            borderRadius: '9999px', padding: '0 6px', fontSize: '0.75rem'
                        }}>
                            {s === 'all' ? orders.length : orders.filter(o => o.status === s).length}
                        </span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="card" style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
                    No {filter === 'all' ? '' : filter} orders
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Buyer</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(order => (
                                <tr key={order._id}>
                                    <td style={{ fontWeight: 600 }}>#{order._id.slice(-8).toUpperCase()}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                                        {String(order.buyerId).slice(-8)}
                                    </td>
                                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td>{order.items?.length}</td>
                                    <td style={{ fontWeight: 600 }}>${(order.totalAmount / 100).toFixed(2)}</td>
                                    <td><span className={`badge badge--${order.status}`}>{order.status}</span></td>
                                    <td>
                                        {order.status === 'pending' && (
                                            <button
                                                className="btn btn--sm btn--outline"
                                                disabled={updating === order._id}
                                                onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                                style={{ borderColor: '#dc2626', color: '#dc2626' }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        {order.status === 'delivered' && (
                                            <span style={{ color: '#16a34a', fontSize: '0.875rem' }}>✓ Complete</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}