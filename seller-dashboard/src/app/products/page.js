'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getMyProducts, createProduct, updateProduct, deleteProduct } from '../../lib/api';
import Loading from '../../components/ui/Loading';

export default function ProductsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', category: '', price: '', images: []
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) return router.push('/login');
        if (user) loadProducts();
    }, [user, authLoading]);

    const loadProducts = async () => {
        try {
            const res = await getMyProducts();
            setProducts(res.data || []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ title: '', description: '', category: '', price: '', images: [] });
        setError('');
        setShowModal(true);
    };

    const openEdit = (product) => {
        setEditing(product);
        setForm({
            title: product.title,
            description: product.description,
            category: product.category,
            price: (product.price / 100).toString(),
            images: product.images || []
        });
        setError('');
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const data = {
                ...form,
                price: Math.round(parseFloat(form.price) * 100),
            };
            if (editing) {
                await updateProduct(editing._id, data);
            } else {
                await createProduct(data);
            }
            setShowModal(false);
            loadProducts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return;
        try {
            await deleteProduct(id);
            loadProducts();
        } catch (err) {
            alert('Failed to delete product');
        }
    };

    if (authLoading || loading) return <Loading />;

    return (
        <div>
            <div className="page-header">
                <h1>Products</h1>
                <button className="btn btn--primary" onClick={openCreate}>
                    + Add Product
                </button>
            </div>

            {products.length === 0 ? (
                <div className="card" style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '1.125rem', marginBottom: '16px' }}>No products yet</p>
                    <button className="btn btn--primary" onClick={openCreate}>
                        Create your first product
                    </button>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Rating</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product._id}>
                                    <td>
                                        <div>
                                            <p style={{ fontWeight: 600 }}>{product.title}</p>
                                            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                                {product.description?.slice(0, 60)}...
                                            </p>
                                        </div>
                                    </td>
                                    <td>{product.category}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        ${(product.price / 100).toFixed(2)}
                                    </td>
                                    <td>
                                        <span style={{ color: '#d97706' }}>★</span>
                                        {product.avgRating?.toFixed(1) || '0.0'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn--outline btn--sm"
                                                onClick={() => openEdit(product)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn--danger btn--sm"
                                                onClick={() => handleDelete(product._id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2>{editing ? 'Edit Product' : 'New Product'}</h2>
                            <button className="btn btn--ghost btn--sm" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {error && <div className="alert alert--error">{error}</div>}

                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Product title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Product description"
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Select category</option>
                                        <option value="electronics/phones">Electronics / Phones</option>
                                        <option value="electronics/laptops">Electronics / Laptops</option>
                                        <option value="electronics/accessories">Electronics / Accessories</option>
                                        <option value="clothing">Clothing</option>
                                        <option value="home">Home</option>
                                        <option value="sports">Sports</option>
                                        <option value="books">Books</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.price}
                                        onChange={e => setForm({ ...form, price: e.target.value })}
                                        placeholder="99.99"
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
                                    {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
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