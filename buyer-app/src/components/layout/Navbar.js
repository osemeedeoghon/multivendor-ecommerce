'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <nav className="navbar">
            <div className="container navbar__inner">
                <Link href="/" className="navbar__logo">
                    🛍️ ShopHub
                </Link>

                <ul className="navbar__links">
                    <li><Link href="/products">Products</Link></li>
                    {user && <li><Link href="/orders">My Orders</Link></li>}
                    {user && <li><Link href="/messages">Messages</Link></li>}
                </ul>

                <div className="navbar__actions">
                    <Link href="/cart" className="navbar__cart">
                        🛒
                        {itemCount > 0 && (
                            <span className="navbar__cart-count">{itemCount}</span>
                        )}
                    </Link>

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                Hi, {user.name?.split(' ')[0]}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="btn btn--ghost btn--sm"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href="/login" className="btn btn--ghost btn--sm">Login</Link>
                            <Link href="/register" className="btn btn--primary btn--sm">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}