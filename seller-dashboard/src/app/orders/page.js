'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getSellerOrders, updateOrderStatus } from '../../lib/api';
import Loading from '../../components/ui/Loading';

/**
 * Parse API errors into user-friendly messages with detailed logging
 * Handles: Axios errors, network errors, JSON parsing errors, timeout errors
 */
function parseApiError(err) {
    let userMessage = 'Something went wrong';
    let statusCode = null;
    let details = null;

    // Axios error response
    if (err.response) {
        statusCode = err.response.status;
        details = err.response.data;
        
        if (statusCode === 401 || statusCode === 403) {
            userMessage = 'Access denied. Please log in again.';
        } else if (statusCode === 404) {
            userMessage = 'Resource not found';
        } else if (statusCode === 500) {
            userMessage = 'Server error. Please try again later.';
        } else if (details?.message) {
            userMessage = details.message;
        }
    }
    
    // Network error (no response from server)
    else if (err.request && !err.response) {
        userMessage = 'Network error. Check your connection.';
        details = { request: 'No response received' };
    }
    
    // Request setup error or other
    else if (err.message) {
        userMessage = err.message;
    }

    // Log full details for debugging
    const errorLog = {
        userMessage,
        statusCode,
        message: err.message,
        stack: err.stack,
        details,
        timestamp: new Date().toISOString(),
    };

    return errorLog;
}

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadOrders();
    }, [user, authLoading]);

    const loadOrders = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('[Orders] Starting fetch...');
            const res = await getSellerOrders();
            
            // Validate response structure
            if (!res || !res.data) {
                throw new Error('Invalid response structure: missing data field');
            }
            
            if (!Array.isArray(res.data)) {
                throw new Error(`Expected array of orders, got ${typeof res.data}`);
            }
            
            console.log(`[Orders] ✓ Successfully loaded ${res.data.length} orders`);
            setOrders(res.data);
            setError(null);
            
        } catch (err) {
            const errorInfo = parseApiError(err);
            console.error('[Orders] ✗ Error loading orders:', errorInfo);
            
            setError(errorInfo.userMessage);
            setOrders([]);
            
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, status) => {
        setUpdating(orderId);
        setError(null);
        
        try {
            await updateOrderStatus(orderId, status);
            console.log(`[Orders] ✓ Updated order ${orderId} to ${status}`);
            await loadOrders(); // Refresh list
            
        } catch (err) {
            const errorInfo = parseApiError(err);
            console.error('[Orders] ✗ Error updating status:', errorInfo);
            setError(`Failed to update order: ${errorInfo.userMessage}`);
            
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

            {error && (
                <div className="card" style={{
                    padding: '16px',
                    marginBottom: '20px',
                    background: '#fee2e2',
                    borderLeft: '4px solid #dc2626',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ color: '#991b1b', fontWeight: 500 }}>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '1.25rem' }}
                    >
                        ✕
                    </button>
                </div>
            )}

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