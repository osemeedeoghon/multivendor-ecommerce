'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const titles = {
    '/': 'Dashboard',
    '/products': 'Products',
    '/orders': 'Orders',
    '/shipments': 'Shipments',
    '/store': 'My Store',
};

export default function Header() {
    const pathname = usePathname();
    const { user } = useAuth();

    return (
        <header className="header">
            <h1 className="header__title">{titles[pathname] || 'Dashboard'}</h1>
            <div className="header__user">
                <span>👋 Hello, {user?.name?.split(' ')[0] || 'Seller'}</span>
            </div>
        </header>
    );
}