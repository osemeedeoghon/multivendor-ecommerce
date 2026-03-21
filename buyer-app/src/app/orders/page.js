'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyOrders } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/ui/Loading';

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) {
            getMyOrders()
                .then(res => setOrders(res.data || []))
                .catch(() => setOrders([]))
                .finally(() => setLoading(false));
        }
    }, [user, authLoading]);

    if (loading || authLoading) return <Loading />;

    return (
        <div className="page">
            <div className="container">
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '32px' }}>
                    My Orders
                </h1>

                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px', color: '#64748b' }}>
                        <p style={{ fontSize: '1.125rem', marginBottom: '16px' }}>No orders yet</p>
                        <button onClick={() => router.push('/products')} className="btn btn--primary">
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map(order => (
                            <div
                                key={order._id}
                                className="card"
                                style={{ padding: '24px', cursor: 'pointer' }}
                                onClick={() => router.push(`/orders/${order._id}`)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                                            Order #{order._id.slice(-8).toUpperCase()}
                                        </p>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span className={`badge badge--${order.status}`}>
                                            {order.status}
                                        </span>
                                        <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                                            ${(order.totalAmount / 100).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}