'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getPlatformStats, getTopProducts, getDailyGMV, getOrderTrends } from '../../lib/api';
import Loading from '../../components/ui/Loading';
import StatCard from '../../components/ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [gmv, setGmv] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadData();
    }, [user, authLoading]);

    const loadData = async () => {
        try {
            const [statsRes, topRes, gmvRes, trendsRes] = await Promise.allSettled([
                getPlatformStats(),
                getTopProducts(),
                getDailyGMV(),
                getOrderTrends(),
            ]);
            if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
            if (topRes.status === 'fulfilled') setTopProducts(topRes.value.data || []);
            if (gmvRes.status === 'fulfilled') setGmv(gmvRes.value.data || []);
            if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data || []);
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
                <h1>Analytics</h1>
            </div>

            <div className="stats-grid">
                <StatCard label="Total Revenue" value={`$${((stats?.totalRevenue || 0) / 100).toFixed(2)}`} icon="💰" color="#16a34a" />
                <StatCard label="Total Orders" value={stats?.totalOrders || 0} icon="🛒" color="#7c3aed" />
                <StatCard label="Total Users" value={stats?.totalUsers || 0} icon="👥" color="#2563eb" />
                <StatCard label="Avg Order Value" value={`$${stats?.totalOrders ? ((stats?.totalRevenue || 0) / stats.totalOrders / 100).toFixed(2) : '0.00'}`} icon="📊" color="#d97706" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <h2 style={{ fontWeight: 600, marginBottom: '20px', fontSize: '1rem' }}>Daily GMV</h2>
                    {gmv.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={gmv}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/100).toFixed(0)}`} />
                                <Tooltip formatter={v => `$${(v/100).toFixed(2)}`} />
                                <Bar dataKey="totalGMV" fill="#7c3aed" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            No data yet
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h2 style={{ fontWeight: 600, marginBottom: '20px', fontSize: '1rem' }}>Order Trends</h2>
                    {trends.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            No data yet
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontWeight: 600, marginBottom: '20px', fontSize: '1rem' }}>Top Products by Revenue</h2>
                {topProducts.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px' }}>No data yet</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>#</th>
                                <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Product</th>
                                <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Units Sold</th>
                                <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((p, i) => (
                                <tr key={p._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 8px', color: '#94a3b8', fontWeight: 600 }}>#{i + 1}</td>
                                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                        {String(p._id).slice(-12)}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>{p.totalQty}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                                        ${(p.totalRevenue / 100).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}