/** @type {import('next').NextConfig} */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001';
const SELLER = process.env.SELLER_URL || 'http://localhost:3002';
const CATALOG = process.env.CATALOG_URL || 'http://localhost:3003';
const ORDER = process.env.ORDER_URL || 'http://localhost:3005';
const PAYMENT = process.env.PAYMENT_URL || 'http://localhost:3006';
const SHIPPING = process.env.SHIPPING_URL || 'http://localhost:3007';
const REVIEW = process.env.REVIEW_URL || 'http://localhost:3008';
const MESSAGING = process.env.MESSAGING_URL || 'http://localhost:3009';
const SEARCH = process.env.SEARCH_URL || 'http://localhost:3011';
const ANALYTICS = process.env.ANALYTICS_URL || 'http://localhost:3012';

const nextConfig = {
    async rewrites() {
        return [
            { source: '/api/auth/:path*', destination: `${AUTH}/api/auth/:path*` },
            { source: '/api/sellers/:path*', destination: `${SELLER}/api/sellers/:path*` },
            { source: '/api/products/:path*', destination: `${SELLER}/api/products/:path*` },
            { source: '/api/catalog/:path*', destination: `${CATALOG}/api/catalog/:path*` },
            { source: '/api/orders/:path*', destination: `${ORDER}/api/orders/:path*` },
            { source: '/api/payments/:path*', destination: `${PAYMENT}/api/payments/:path*` },
            { source: '/api/shipping/:path*', destination: `${SHIPPING}/api/shipping/:path*` },
            { source: '/api/reviews/:path*', destination: `${REVIEW}/api/reviews/:path*` },
            { source: '/api/messages/:path*', destination: `${MESSAGING}/api/messages/:path*` },
            { source: '/api/search/:path*', destination: `${SEARCH}/api/search/:path*` },
            { source: '/api/analytics/:path*', destination: `${ANALYTICS}/api/analytics/:path*` },
        ];
    },
};

export default nextConfig;