/** @type {import('next').NextConfig} */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001';
const SELLER = process.env.SELLER_URL || 'http://localhost:3002';
const ORDER = process.env.ORDER_URL || 'http://localhost:3005';
const SHIPPING = process.env.SHIPPING_URL || 'http://localhost:3007';
const ANALYTICS = process.env.ANALYTICS_URL || 'http://localhost:3012';
const MESSAGING = process.env.MESSAGING_URL || 'http://localhost:3009';

const nextConfig = {
    async rewrites() {
        return [
            { source: '/api/auth/:path*', destination: `${AUTH}/api/auth/:path*` },
            { source: '/api/sellers/:path*', destination: `${SELLER}/api/sellers/:path*` },
            { source: '/api/products/:path*', destination: `${SELLER}/api/products/:path*` },
            { source: '/api/orders/:path*', destination: `${ORDER}/api/orders/:path*` },
            { source: '/api/shipping/:path*', destination: `${SHIPPING}/api/shipping/:path*` },
            { source: '/api/analytics/:path*', destination: `${ANALYTICS}/api/analytics/:path*` },
            { source: '/api/messages/:path*', destination: `${MESSAGING}/api/messages/:path*` },
        ];
    },
};

export default nextConfig;