/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            { source: '/api/auth/:path*', destination: 'http://localhost:3001/api/auth/:path*' },
            { source: '/api/orders/:path*', destination: 'http://localhost:3005/api/orders/:path*' },
            { source: '/api/reviews/:path*', destination: 'http://localhost:3008/api/reviews/:path*' },
            { source: '/api/analytics/:path*', destination: 'http://localhost:3012/api/analytics/:path*' },
            { source: '/api/sellers/:path*', destination: 'http://localhost:3002/api/sellers/:path*' },
        ];
    },
};

export default nextConfig;