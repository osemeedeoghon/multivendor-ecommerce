'use client';
import { usePathname } from 'next/navigation';

const titles = {
    '/': 'Overview',
    '/orders': 'Orders',
    '/reviews': 'Reviews',
    '/analytics': 'Analytics',
    '/users': 'Users',
};

export default function Header() {
    return (
        <header className="header">
            <h1 className="header__title">{titles[usePathname()] || 'Admin'}</h1>
            <div className="header__user">
                <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    ADMIN
                </span>
            </div>
        </header>
    );
}