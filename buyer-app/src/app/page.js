'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFeaturedProducts, searchProducts } from '../lib/api';
import ProductCard from '../components/ui/ProductCard';
import Loading from '../components/ui/Loading';

export default function HomePage() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => {
        getFeaturedProducts()
            .then(res => setFeatured(res.data || []))
            .catch(() => setFeatured([]))
            .finally(() => setLoading(false));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) router.push(`/products?keyword=${search}`);
    };

    return (
        <div>
            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '80px 0',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '16px' }}>
                        Shop from thousands of sellers
                    </h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '40px' }}>
                        Find the best products at the best prices
                    </p>
                    <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div className="search-bar" style={{ background: 'white', padding: '8px 16px' }}>
                            <input
                                type="text"
                                placeholder="Search for products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ fontSize: '1rem', flex: 1 }}
                            />
                            <button type="submit" className="btn btn--primary btn--sm">
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Featured Products */}
            <section className="page">
                <div className="container">
                    <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '32px' }}>
                        Featured Products
                    </h2>
                    {loading ? (
                        <Loading />
                    ) : featured.length > 0 ? (
                        <div className="grid-4">
                            {featured.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '64px', color: '#64748b' }}>
                            <p style={{ fontSize: '1.125rem' }}>No products yet.</p>
                            <p style={{ marginTop: '8px' }}>Check back soon!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}