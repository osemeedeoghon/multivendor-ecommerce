'use client';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { placeOrder } from '../../lib/api';
import { useState } from 'react';

export default function CartPage() {
    const { cart, removeFromCart, updateQty, clearCart, total } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [address, setAddress] = useState({
        street: '', city: '', zip: '', country: 'Canada'
    });

    const handleCheckout = async () => {
        if (!user) return router.push('/login');
        setError('');
        setLoading(true);
        try {
            const res = await placeOrder({
                items: cart.map(item => ({
                    productId: item.productId,
                    sellerId: item.sellerId,
                    qty: item.qty,
                    price: item.price,
                })),
                shippingAddress: address,
            });
            clearCart();
            router.push(`/orders/${res.data._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="page flex-center" style={{ flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '1.25rem', color: '#64748b' }}>Your cart is empty</p>
                <button onClick={() => router.push('/products')} className="btn btn--primary">
                    Browse Products
                </button>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '32px' }}>
                    Shopping Cart
                </h1>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
                    {/* Cart Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {cart.map(item => (
                            <div key={item.productId} className="card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{
                                    width: '80px', height: '80px', background: '#f1f5f9',
                                    borderRadius: '8px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No img</span>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>{item.title}</h3>
                                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                        ${(item.price / 100).toFixed(2)} each
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button onClick={() => updateQty(item.productId, item.qty - 1)} className="btn btn--outline btn--sm" style={{ width: '32px', padding: 0 }}>−</button>
                                    <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                                    <button onClick={() => updateQty(item.productId, item.qty + 1)} className="btn btn--outline btn--sm" style={{ width: '32px', padding: 0 }}>+</button>
                                </div>
                                <p style={{ fontWeight: 700, minWidth: '80px', textAlign: 'right' }}>
                                    ${((item.price * item.qty) / 100).toFixed(2)}
                                </p>
                                <button onClick={() => removeFromCart(item.productId)} className="btn btn--ghost btn--sm" style={{ color: '#dc2626' }}>✕</button>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div>
                        <div className="card" style={{ padding: '24px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>Order Summary</h2>

                            {/* Shipping Address */}
                            <h3 style={{ fontWeight: 600, marginBottom: '12px', fontSize: '0.875rem', color: '#475569', textTransform: 'uppercase' }}>
                                Shipping Address
                            </h3>
                            <div className="form-group">
                                <input placeholder="Street address" value={address.street}
                                    onChange={e => setAddress({ ...address, street: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div className="form-group">
                                    <input placeholder="City" value={address.city}
                                        onChange={e => setAddress({ ...address, city: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <input placeholder="ZIP" value={address.zip}
                                        onChange={e => setAddress({ ...address, zip: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <input placeholder="Country" value={address.country}
                                    onChange={e => setAddress({ ...address, country: e.target.value })} />
                            </div>

                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#64748b' }}>Subtotal</span>
                                    <span style={{ fontWeight: 600 }}>${(total / 100).toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ color: '#64748b' }}>Shipping</span>
                                    <span style={{ color: '#16a34a', fontWeight: 500 }}>Free</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>
                                    <span>Total</span>
                                    <span>${(total / 100).toFixed(2)}</span>
                                </div>
                            </div>

                            {error && <div className="alert alert--error">{error}</div>}

                            <button
                                onClick={handleCheckout}
                                className="btn btn--primary btn--full"
                                disabled={loading || !address.street || !address.city}
                                style={{ fontSize: '1rem', padding: '14px' }}
                            >
                                {loading ? 'Placing Order...' : 'Place Order'}
                            </button>

                            {!user && (
                                <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.875rem', color: '#64748b' }}>
                                    You need to <a href="/login" style={{ color: '#2563eb' }}>login</a> to checkout
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}