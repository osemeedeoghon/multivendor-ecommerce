'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchProducts } from '../../lib/api';
import ProductCard from '../../components/ui/ProductCard';
import Loading from '../../components/ui/Loading';
import { Suspense } from 'react';

function ProductsContent() {
    const searchParams = useSearchParams();
    const keyword = searchParams.get('keyword') || '';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(keyword);
    const [category, setCategory] = useState('');

    const fetchProducts = async (kw = keyword, cat = category) => {
        setLoading(true);
        try {
            const params = {};
            if (kw) params.keyword = kw;
            if (cat) params.category = cat;
            const res = await searchProducts(params);
            setProducts(res.data.products || []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [keyword]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts(search, category);
    };

    const categories = [
        'electronics/phones', 'electronics/laptops', 'electronics/accessories',
        'clothing', 'home', 'sports', 'books'
    ];

    return (
        <div className="page">
            <div className="container">
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '24px' }}>
                    {keyword ? `Results for "${keyword}"` : 'All Products'}
                </h1>

                {/* Search & Filter */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px' }}>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <button type="submit">Search</button>
                        </div>
                    </form>
                    <select
                        value={category}
                        onChange={e => { setCategory(e.target.value); fetchProducts(search, e.target.value); }}
                        style={{
                            padding: '10px 16px', borderRadius: '8px',
                            border: '1.5px solid #cbd5e1', fontSize: '1rem',
                            background: 'white', cursor: 'pointer'
                        }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Results */}
                {loading ? (
                    <Loading />
                ) : products.length > 0 ? (
                    <>
                        <p style={{ color: '#64748b', marginBottom: '16px' }}>
                            {products.length} product{products.length !== 1 ? 's' : ''} found
                        </p>
                        <div className="grid-4">
                            {products.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '64px', color: '#64748b' }}>
                        <p style={{ fontSize: '1.125rem' }}>No products found.</p>
                        <p style={{ marginTop: '8px' }}>Try a different search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ProductsContent />
        </Suspense>
    );
}