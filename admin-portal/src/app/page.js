'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { getPlatformStats, getAllOrders } from '../lib/api';
import StatCard from '../components/ui/StatCard';
import Loading from '../components/ui/Loading';

export default function OverviewPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadData();
    }, [user, authLoading]);

    const loadData = async () => {
        try {
            const [statsRes, ordersRes] = await Promise.allSettled([
                getPlatformStats(),
                getAllOrders(),
            ]);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (ordersRes.status === 'fulfilled') {
                setRecentOrders((ordersRes.value.data || []).slice(0, 5));
            }
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
                <h1>Platform Overview</h1>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>

            <div className="stats-grid">
                <StatCard
                    label="Total Orders"
                    value={stats?.totalOrders ?? recentOrders.length}
                    icon="🛒"
                    color="#7c3aed"
                />
                <StatCard
                    label="Total Revenue"
                    value={`$${((stats?.totalRevenue || 0) / 100).toFixed(2)}`}
                    icon="💰"
                    color="#16a34a"
                />
                <StatCard
                    label="Total Users"
                    value={stats?.totalUsers ?? '—'}
                    icon="👥"
                    color="#2563eb"
                />
                <StatCard
                    label="Pending Reviews"
                    value={stats?.pendingReviews ?? '—'}
                    icon="⭐"
                    color="#d97706"
                />
            </div>

            {/* Recent Orders */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Recent Orders</h2>
                    <button className="btn btn--ghost btn--sm" onClick={() => router.push('/orders')}>
                        View all →
                    </button>
                </div>
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
                                    <tr key={order._id}>
                                        <td style={{ fontWeight: 600 }}>#{order._id.slice(-8).toUpperCase()}</td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td style={{ fontWeight: 600 }}>${(order.totalAmount / 100).toFixed(2)}</td>
                                        <td><span className={`badge badge--${order.status}`}>{order.status}</span></td>
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