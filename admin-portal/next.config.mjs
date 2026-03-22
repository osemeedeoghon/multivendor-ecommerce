/** @type {import('next').NextConfig} */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001';
const ORDER = process.env.ORDER_URL || 'http://localhost:3005';
const REVIEW = process.env.REVIEW_URL || 'http://localhost:3008';
const ANALYTICS = process.env.ANALYTICS_URL || 'http://localhost:3012';
const SELLER = process.env.SELLER_URL || 'http://localhost:3002';

const nextConfig = {
    async rewrites() {
        return [
            { source: '/api/auth/:path*', destination: `${AUTH}/api/auth/:path*` },
            { source: '/api/orders/:path*', destination: `${ORDER}/api/orders/:path*` },
            { source: '/api/reviews/:path*', destination: `${REVIEW}/api/reviews/:path*` },
            { source: '/api/analytics/:path*', destination: `${ANALYTICS}/api/analytics/:path*` },
            { source: '/api/sellers/:path*', destination: `${SELLER}/api/sellers/:path*` },
        ];
    },
};

export default nextConfig;