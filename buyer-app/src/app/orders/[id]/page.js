'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import Loading from '../../../components/ui/Loading';

export default function OrderDetailPage() {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) {
            getOrderById(id)
                .then(res => setOrder(res.data))
                .catch(() => router.push('/orders'))
                .finally(() => setLoading(false));
        }
    }, [user, authLoading, id]);

    if (loading || authLoading) return <Loading />;
    if (!order) return null;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '800px' }}>
                <button
                    onClick={() => router.push('/orders')}
                    className="btn btn--ghost btn--sm"
                    style={{ marginBottom: '24px' }}
                >
                    ← Back to Orders
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>
                            Order #{order._id.slice(-8).toUpperCase()}
                        </h1>
                        <p style={{ color: '#64748b', marginTop: '4px' }}>
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                    <span className={`badge badge--${order.status}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                        {order.status}
                    </span>
                </div>

                {/* Items */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontWeight: 600 }}>Items</h2>
                    </div>
                    {order.items?.map((item, i) => (
                        <div key={i} style={{
                            padding: '16px 20px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: i < order.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}>
                            <div>
                               <p style={{ fontWeight: 500 }}>{item.title || item.productId}</p>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Qty: {item.qty}</p>
                            </div>
                            <p style={{ fontWeight: 600 }}>${((item.price * item.qty) / 100).toFixed(2)}</p>
                        </div>
                    ))}
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', background: '#f8fafc' }}>
                        <span style={{ fontWeight: 700 }}>Total</span>
                        <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                            ${(order.totalAmount / 100).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
                    <h2 style={{ fontWeight: 600, marginBottom: '12px' }}>Shipping Address</h2>
                    <p style={{ color: '#475569' }}>{order.shippingAddress?.street}</p>
                    <p style={{ color: '#475569' }}>{order.shippingAddress?.city}, {order.shippingAddress?.zip}</p>
                    <p style={{ color: '#475569' }}>{order.shippingAddress?.country}</p>
                </div>

                {/* Timeline */}
                {order.timeline?.length > 0 && (
                    <div className="card" style={{ padding: '20px' }}>
                        <h2 style={{ fontWeight: 600, marginBottom: '20px' }}>Order Timeline</h2>
                        <ul className="timeline">
                            {order.timeline.map((event, i) => (
                                <li key={i} className="timeline__item">
                                    <p className="timeline__status">{event.status}</p>
                                    <p className="timeline__time">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}