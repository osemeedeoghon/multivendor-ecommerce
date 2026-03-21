'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const links = [
    { href: '/', label: 'Overview', icon: '📊' },
    { href: '/orders', label: 'Orders', icon: '🛒' },
    { href: '/reviews', label: 'Reviews', icon: '⭐' },
    { href: '/analytics', label: 'Analytics', icon: '📈' },
    { href: '/users', label: 'Users', icon: '👥' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar__logo">
                <h2>⚡ AdminHub</h2>
                <p>Admin Portal</p>
            </div>
            <nav className="sidebar__nav">
                {links.map(link => (
                    <div
                        key={link.href}
                        className={`sidebar__link ${pathname === link.href ? 'sidebar__link--active' : ''}`}
                        onClick={() => router.push(link.href)}
                    >
                        <span>{link.icon}</span>
                        <span>{link.label}</span>
                    </div>
                ))}
            </nav>
            <div className="sidebar__footer">
                <div style={{ marginBottom: '12px' }}>
                    <p style={{ color: '#a5b4fc', fontSize: '0.75rem', marginBottom: '2px' }}>Logged in as</p>
                    <p style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500 }}>{user?.name || 'Admin'}</p>
                    <p style={{ color: '#a5b4fc', fontSize: '0.75rem', marginTop: '2px' }}>Administrator</p>
                </div>
                <button onClick={handleLogout} className="btn btn--ghost btn--sm btn--full"
                    style={{ color: '#a5b4fc', justifyContent: 'flex-start' }}>
                    🚪 Logout
                </button>
            </div>
        </aside>
    );
}