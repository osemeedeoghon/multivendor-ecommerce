'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getSellerShipments, createShipment, updateShipmentStatus, getSellerOrders } from '../../lib/api';
import Loading from '../../components/ui/Loading';

export default function ShipmentsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [shipments, setShipments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ orderId: '', carrier: '', trackingNumber: '', estimatedDelivery: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadData();
    }, [user, authLoading]);

    const loadData = async () => {
        try {
            const [shipmentsRes, ordersRes] = await Promise.allSettled([
                getSellerShipments(),
                getSellerOrders(),
            ]);
            setShipments(shipmentsRes.status === 'fulfilled' ? shipmentsRes.value.data || [] : []);
            const allOrders = ordersRes.status === 'fulfilled' ? ordersRes.value.data || [] : [];
            setOrders(allOrders.filter(o => o.status === 'processing'));
        } catch {
            setShipments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await createShipment(form);
            setShowModal(false);
            setForm({ orderId: '', carrier: '', trackingNumber: '', estimatedDelivery: '' });
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create shipment');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateShipmentStatus(id, status);
            loadData();
        } catch {
            alert('Failed to update shipment');
        }
    };

    const statusFlow = {
        created: 'in_transit',
        in_transit: 'out_for_delivery',
        out_for_delivery: 'delivered',
    };

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>Shipments</h1>
                <button className="btn btn--primary" onClick={() => setShowModal(true)}>
                    + Create Shipment
                </button>
            </div>

            {shipments.length === 0 ? (
                <div className="card" style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
                    No shipments yet
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Shipment ID</th>
                                <th>Order</th>
                                <th>Carrier</th>
                                <th>Tracking</th>
                                <th>Est. Delivery</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.map(shipment => {
                                const next = statusFlow[shipment.status];
                                return (
                                    <tr key={shipment._id}>
                                        <td style={{ fontWeight: 600 }}>
                                            #{shipment._id.slice(-8).toUpperCase()}
                                        </td>
                                        <td>#{String(shipment.orderId).slice(-8).toUpperCase()}</td>
                                        <td>{shipment.carrier}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                            {shipment.trackingNumber}
                                        </td>
                                        <td>
                                            {shipment.estimatedDelivery
                                                ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge badge--${shipment.status}`}>
                                                {shipment.status}
                                            </span>
                                        </td>
                                        <td>
                                            {next && (
                                                <button
                                                    className="btn btn--outline btn--sm"
                                                    onClick={() => handleStatusUpdate(shipment._id, next)}
                                                >
                                                    Mark {next.replace('_', ' ')}
                                                </button>
                                            )}
                                            {shipment.status === 'delivered' && (
                                                <span style={{ color: '#16a34a', fontSize: '0.875rem', fontWeight: 500 }}>
                                                    ✓ Delivered
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2>Create Shipment</h2>
                            <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {error && <div className="alert alert--error">{error}</div>}

                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Order</label>
                                <select
                                    value={form.orderId}
                                    onChange={e => setForm({ ...form, orderId: e.target.value })}
                                    required
                                >
                                    <option value="">Select an order</option>
                                    {orders.map(order => (
                                        <option key={order._id} value={order._id}>
                                            #{order._id.slice(-8).toUpperCase()} — ${(order.totalAmount / 100).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Carrier</label>
                                <select
                                    value={form.carrier}
                                    onChange={e => setForm({ ...form, carrier: e.target.value })}
                                    required
                                >
                                    <option value="">Select carrier</option>
                                    <option value="FedEx">FedEx</option>
                                    <option value="UPS">UPS</option>
                                    <option value="DHL">DHL</option>
                                    <option value="Canada Post">Canada Post</option>
                                    <option value="USPS">USPS</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tracking Number</label>
                                <input
                                    value={form.trackingNumber}
                                    onChange={e => setForm({ ...form, trackingNumber: e.target.value })}
                                    placeholder="e.g. FX123456789"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Estimated Delivery</label>
                                <input
                                    type="date"
                                    value={form.estimatedDelivery}
                                    onChange={e => setForm({ ...form, estimatedDelivery: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
                                    {saving ? 'Creating...' : 'Create Shipment'}
                                </button>
                                <button type="button" className="btn btn--ghost btn--full" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}