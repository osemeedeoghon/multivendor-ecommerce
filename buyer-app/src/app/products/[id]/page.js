'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, getReviewsByProduct, sendMessage } from '../../../lib/api';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import Loading from '../../../components/ui/Loading';

export default function ProductPage() {
    const { id } = useParams();
    const router = useRouter();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [messageSent, setMessageSent] = useState(false);
    const [messageSending, setMessageSending] = useState(false);

    useEffect(() => {
        Promise.all([
            getProductById(id),
            getReviewsByProduct(id)
        ]).then(([productRes, reviewsRes]) => {
            setProduct(productRes.data);
            setReviews(reviewsRes.data || []);
        }).catch(() => router.push('/products'))
          .finally(() => setLoading(false));
    }, [id]);

    const handleAddToCart = () => {
        addToCart(product, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleSendMessage = async () => {
        setMessageSending(true);
        try {
            console.log('Product object:', product);
            console.log('Product userId:', product.userId);
            console.log('Product sellerId:', product.sellerId);

            // Validate that we have a valid recipient
            // Use userId if available, otherwise fall back to sellerId (which is the userId in catalog)
            const recipientId = product.userId || product.sellerId;
            if (!recipientId) {
                throw new Error('Cannot identify seller. No valid recipient ID found.');
            }

            await sendMessage({
                recipientId: recipientId,
                productId: product._id,
                body: messageText,
            });
            setMessageSent(true);
            setMessageText('');
        } catch (err) {
            console.error('Failed to send message:', err);
            alert(`Error: ${err.message || 'Failed to send message'}`);
        } finally {
            setMessageSending(false);
        }
    };

    if (loading) return <Loading />;
    if (!product) return null;

    const price = (product.price / 100).toFixed(2);

    return (
        <div className="page">
            <div className="container">
                {/* Product Detail */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '64px' }}>
                    {/* Image */}
                    <div style={{
                        background: '#f1f5f9', borderRadius: '12px',
                        aspectRatio: '1', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ color: '#94a3b8', fontSize: '1rem' }}>No Image</span>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        <p style={{ color: '#2563eb', fontWeight: 500, marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.875rem' }}>
                            {product.category}
                        </p>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px', lineHeight: 1.3 }}>
                            {product.title}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <span style={{ color: '#d97706', fontSize: '1.25rem' }}>★</span>
                            <span style={{ fontWeight: 600 }}>{product.avgRating?.toFixed(1) || '0.0'}</span>
                            <span style={{ color: '#64748b' }}>({reviews.length} reviews)</span>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '24px' }}>
                            ${price}
                        </p>
                        {product.description ? (
                            <p style={{ color: '#475569', lineHeight: 1.7, marginBottom: '32px', fontSize: '1.0625rem' }}>
                                {product.description}
                            </p>
                        ) : (
                            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '32px', fontSize: '1.0625rem', fontStyle: 'italic' }}>
                                No description available
                            </p>
                        )}

                        {/* Quantity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <label style={{ fontWeight: 500 }}>Quantity:</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="btn btn--outline btn--sm"
                                    style={{ width: '36px', padding: '0' }}
                                >−</button>
                                <span style={{ fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>{qty}</span>
                                <button
                                    onClick={() => setQty(qty + 1)}
                                    className="btn btn--outline btn--sm"
                                    style={{ width: '36px', padding: '0' }}
                                >+</button>
                            </div>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className={`btn btn--full ${added ? 'btn--ghost' : 'btn--primary'}`}
                            style={{ fontSize: '1.125rem', padding: '14px' }}
                        >
                            {added ? '✓ Added to Cart!' : 'Add to Cart'}
                        </button>

                        {user && (
                            <button
                                onClick={() => setShowMessageModal(true)}
                                className="btn btn--outline btn--full"
                                style={{ marginTop: '12px', fontSize: '1rem', padding: '14px' }}
                            >
                                💬 Message Seller
                            </button>
                        )}
                    </div>
                </div>

                {/* Reviews */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>
                        Reviews ({reviews.length})
                    </h2>
                    {reviews.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {reviews.map(review => (
                                <div key={review._id} className="card" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', gap: '4px', color: '#d97706' }}>
                                            {[...Array(review.rating)].map((_, i) => <span key={i}>★</span>)}
                                        </div>
                                        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ color: '#334155' }}>{review.body}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#64748b' }}>No reviews yet.</p>
                    )}
                </div>
            </div>

            {/* Message Seller Modal */}
            {showMessageModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: '12px',
                        padding: '32px', width: '100%', maxWidth: '480px',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Message Seller</h2>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '24px' }}>
                            About: <strong>{product.title}</strong>
                        </p>

                        {messageSent ? (
                            <div style={{ textAlign: 'center', padding: '24px' }}>
                                <p style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</p>
                                <p style={{ fontWeight: 600, marginBottom: '4px' }}>Message sent!</p>
                                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                    Check your Messages tab to see the reply
                                </p>
                                <button
                                    className="btn btn--primary"
                                    style={{ marginTop: '20px' }}
                                    onClick={() => { setShowMessageModal(false); setMessageSent(false); }}
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    placeholder="Ask about this product..."
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px',
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: '8px', fontSize: '1rem',
                                        minHeight: '120px', resize: 'vertical',
                                        outline: 'none', fontFamily: 'inherit',
                                        marginBottom: '16px'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        className="btn btn--primary btn--full"
                                        disabled={!messageText.trim() || messageSending}
                                        onClick={handleSendMessage}
                                    >
                                        {messageSending ? 'Sending...' : 'Send Message'}
                                    </button>
                                    <button
                                        className="btn btn--ghost btn--full"
                                        onClick={() => { setShowMessageModal(false); setMessageText(''); }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}