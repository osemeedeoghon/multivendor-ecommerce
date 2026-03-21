/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            { source: '/api/auth/:path*', destination: 'http://localhost:3001/api/auth/:path*' },
            { source: '/api/sellers/:path*', destination: 'http://localhost:3002/api/sellers/:path*' },
            { source: '/api/products/:path*', destination: 'http://localhost:3002/api/products/:path*' },
            { source: '/api/catalog/:path*', destination: 'http://localhost:3003/api/catalog/:path*' },
            { source: '/api/orders/:path*', destination: 'http://localhost:3005/api/orders/:path*' },
            { source: '/api/payments/:path*', destination: 'http://localhost:3006/api/payments/:path*' },
            { source: '/api/shipping/:path*', destination: 'http://localhost:3007/api/shipping/:path*' },
            { source: '/api/reviews/:path*', destination: 'http://localhost:3008/api/reviews/:path*' },
            { source: '/api/messages/:path*', destination: 'http://localhost:3009/api/messages/:path*' },
            { source: '/api/search/:path*', destination: 'http://localhost:3011/api/search/:path*' },
            { source: '/api/analytics/:path*', destination: 'http://localhost:3012/api/analytics/:path*' },
        ];
    },
};

export default nextConfig;