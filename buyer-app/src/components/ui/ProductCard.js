'use client';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import Button from './Button';

export default function ProductCard({ product }) {
    const router = useRouter();
    const { addToCart } = useCart();

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(product);
    };

    const price = (product.price / 100).toFixed(2);
    const rating = product.avgRating?.toFixed(1) || '0.0';

    return (
        <div className="product-card" onClick={() => router.push(`/products/${product._id}`)}>
            <div className="product-card__image">
                {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                ) : (
                    <div style={{
                        width: '100%', height: '200px', background: '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#94a3b8', fontSize: '0.875rem'
                    }}>
                        No Image
                    </div>
                )}
            </div>
            <div className="product-card__body">
                <p className="product-card__category">{product.category}</p>
                <h3 className="product-card__title">{product.title}</h3>
                <div className="product-card__rating">
                    <span>★</span>
                    <span>{rating}</span>
                </div>
                <div className="product-card__footer">
                    <span className="product-card__price">${price}</span>
                    <Button variant="primary" size="sm" onClick={handleAddToCart}>
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}