'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { getMyProducts, getSellerOrders, getSellerShipments } from '../lib/api';
import StatCard from '../components/ui/StatCard';
import Loading from '../components/ui/Loading';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        products: 0, orders: 0, shipments: 0, revenue: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadDashboard();
    }, [user, authLoading]);

    const loadDashboard = async () => {
        try {
            const [productsRes, ordersRes] = await Promise.allSettled([
                getMyProducts(),
                getSellerOrders(),
            ]);

            const products = productsRes.status === 'fulfilled' ? productsRes.value.data : [];
            const orders = ordersRes.status === 'fulfilled' ? ordersRes.value.data : [];

            const revenue = orders
                .filter(o => o.status !== 'cancelled')
                .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            setStats({
                products: Array.isArray(products) ? products.length : 0,
                orders: Array.isArray(orders) ? orders.length : 0,
                revenue,
            });

            setRecentOrders(Array.isArray(orders) ? orders.slice(0, 5) : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
            </div>

            <div className="stats-grid">
                <StatCard label="Total Products" value={stats.products} icon="📦" />
                <StatCard label="Total Orders" value={stats.orders} icon="🛒" />
                <StatCard
                    label="Total Revenue"
                    value={`$${(stats.revenue / 100).toFixed(2)}`}
                    icon="💰"
                />
                <StatCard label="Store Status" value="Active" icon="✅" />
            </div>

            {/* Recent Orders */}
            <div>
                <h2 style={{ fontWeight: 600, marginBottom: '16px', fontSize: '1.125rem' }}>
                    Recent Orders
                </h2>
                {recentOrders.length === 0 ? (
                    <div className="card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No orders yet
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order._id} style={{ cursor: 'pointer' }}
                                        onClick={() => router.push('/orders')}>
                                        <td style={{ fontWeight: 500 }}>
                                            #{order._id.slice(-8).toUpperCase()}
                                        </td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>${(order.totalAmount / 100).toFixed(2)}</td>
                                        <td>
                                            <span className={`badge badge--${order.status}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}