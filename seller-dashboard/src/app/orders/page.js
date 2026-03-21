'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getSellerOrders, updateOrderStatus } from '../../lib/api';
import Loading from '../../components/ui/Loading';

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadOrders();
    }, [user, authLoading]);

    const loadOrders = async () => {
        try {
            const res = await getSellerOrders();
            setOrders(res.data || []);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, status) => {
        setUpdating(orderId);
        try {
            await updateOrderStatus(orderId, status);
            loadOrders();
        } catch (err) {
            alert('Failed to update order status');
        } finally {
            setUpdating(null);
        }
    };

    const getNextStatus = (current) => {
        const flow = {
            pending: 'processing',
            processing: 'shipped',
            shipped: 'delivered',
        };
        return flow[current];
    };

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div className="card" style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
                    No orders yet
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const next = getNextStatus(order.status);
                                return (
                                    <tr key={order._id}>
                                        <td style={{ fontWeight: 600 }}>
                                            #{order._id.slice(-8).toUpperCase()}
                                        </td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            ${(order.totalAmount / 100).toFixed(2)}
                                        </td>
                                        <td>
                                            <span className={`badge badge--${order.status}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            {next && (
                                                <button
                                                    className="btn btn--outline btn--sm"
                                                    disabled={updating === order._id}
                                                    onClick={() => handleStatusUpdate(order._id, next)}
                                                >
                                                    {updating === order._id ? 'Updating...' : `Mark ${next}`}
                                                </button>
                                            )}
                                            {order.status === 'delivered' && (
                                                <span style={{ color: '#16a34a', fontSize: '0.875rem', fontWeight: 500 }}>
                                                    ✓ Complete
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}