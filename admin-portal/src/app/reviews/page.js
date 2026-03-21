'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getPendingReviews, approveReview, flagReview } from '../../lib/api';
import Loading from '../../components/ui/Loading';

export default function ReviewsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadReviews();
    }, [user, authLoading]);

    const loadReviews = async () => {
        try {
            const res = await getPendingReviews();
            setReviews(res.data || []);
        } catch {
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        setActing(id);
        try {
            await approveReview(id);
            loadReviews();
        } catch { alert('Failed to approve review'); }
        finally { setActing(null); }
    };

    const handleFlag = async (id) => {
        setActing(id);
        try {
            await flagReview(id);
            loadReviews();
        } catch { alert('Failed to flag review'); }
        finally { setActing(null); }
    };

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>Review Moderation</h1>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    {reviews.length} pending review{reviews.length !== 1 ? 's' : ''}
                </span>
            </div>

            {reviews.length === 0 ? (
                <div className="card" style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '1.125rem', marginBottom: '8px' }}>✅ All caught up!</p>
                    <p>No pending reviews to moderate</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map(review => (
                        <div key={review._id} className="card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', gap: '2px', color: '#d97706' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} style={{ opacity: i < review.rating ? 1 : 0.3 }}>★</span>
                                            ))}
                                        </div>
                                        <span className="badge badge--pending">Pending</span>
                                    </div>
                                    <p style={{ color: '#334155', lineHeight: 1.7, marginBottom: '12px', fontSize: '0.9375rem' }}>
                                        "{review.body}"
                                    </p>
                                    <div style={{ display: 'flex', gap: '24px', fontSize: '0.8125rem', color: '#64748b' }}>
                                        <span>Product: <code style={{ fontFamily: 'monospace' }}>{String(review.productId).slice(-8)}</code></span>
                                        <span>Order: <code style={{ fontFamily: 'monospace' }}>{String(review.orderId).slice(-8)}</code></span>
                                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginLeft: '24px', flexShrink: 0 }}>
                                    <button
                                        className="btn btn--success btn--sm"
                                        disabled={acting === review._id}
                                        onClick={() => handleApprove(review._id)}
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        className="btn btn--danger btn--sm"
                                        disabled={acting === review._id}
                                        onClick={() => handleFlag(review._id)}
                                    >
                                        🚩 Flag
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}