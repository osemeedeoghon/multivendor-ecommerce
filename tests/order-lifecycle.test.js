const axios = require('axios');

const AUTH_URL = 'http://localhost:3001';
const SELLER_URL = 'http://localhost:3002';
const CATALOG_URL = 'http://localhost:3003';
const ORDER_URL = 'http://localhost:3005';
const SEARCH_URL = 'http://localhost:3011';
const GATEWAY_URL = 'http://localhost:3000';

let buyerToken;
let sellerToken;
let buyerEmail;
let orderId;
let productId;

describe('Multi-Vendor E-Commerce — Full Order Lifecycle', () => {

    // ─── Auth ────────────────────────────────────────────────────────────────

    test('Register a buyer', async () => {
        buyerEmail = `buyer_${Date.now()}@test.com`;
        const res = await axios.post(`${AUTH_URL}/api/auth/register`, {
            name: 'Test Buyer',
            email: buyerEmail,
            password: 'password123',
            role: 'buyer'
        });
        expect(res.status).toBe(201);
        expect(res.data.accessToken).toBeDefined();
        buyerToken = res.data.accessToken;
    });

    test('Register a seller', async () => {
        const res = await axios.post(`${AUTH_URL}/api/auth/register`, {
            name: 'Test Seller',
            email: `seller_${Date.now()}@test.com`,
            password: 'password123',
            role: 'seller'
        });
        expect(res.status).toBe(201);
        expect(res.data.accessToken).toBeDefined();
        sellerToken = res.data.accessToken;
    });

    test('Login buyer returns tokens', async () => {
        const res = await axios.post(`${AUTH_URL}/api/auth/login`, {
            email: buyerEmail,
            password: 'password123'
        });
        expect(res.status).toBe(200);
        expect(res.data.accessToken).toBeDefined();
        expect(res.data.refreshToken).toBeDefined();
    });

    // ─── Seller ───────────────────────────────────────────────────────────────

    test('Seller can create a store', async () => {
        const res = await axios.post(
            `${SELLER_URL}/api/sellers/store`,
            { storeName: `Test Store ${Date.now()}`, description: 'A test store' },
            { headers: { Authorization: `Bearer ${sellerToken}` } }
        );
        expect(res.status).toBe(201);
        expect(res.data.storeName).toBeDefined();
    });

    test('Seller can create a product', async () => {
        const res = await axios.post(
            `${SELLER_URL}/api/products`,
            {
                title: 'Test Phone',
                description: 'A great test phone',
                category: 'electronics/phones',
                price: 9999
            },
            { headers: { Authorization: `Bearer ${sellerToken}` } }
        );
        expect(res.status).toBe(201);
        expect(res.data._id).toBeDefined();
        productId = res.data._id;
    });

    // ─── Catalog ──────────────────────────────────────────────────────────────

    test('Anyone can search the catalog', async () => {
        const res = await axios.get(`${CATALOG_URL}/api/catalog/search`);
        expect(res.status).toBe(200);
        expect(res.data.products).toBeDefined();
    });

    test('Anyone can get featured products', async () => {
        const res = await axios.get(`${SEARCH_URL}/api/search/featured`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.data)).toBe(true);
    });

    // ─── Orders ───────────────────────────────────────────────────────────────

    test('Buyer can place an order', async () => {
        const res = await axios.post(
            `${ORDER_URL}/api/orders`,
            {
                items: [{
                    productId: '507f1f77bcf86cd799439011',
                    sellerId: '507f1f77bcf86cd799439012',
                    qty: 1,
                    price: 9999
                }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Toronto',
                    zip: 'M1A 1A1',
                    country: 'Canada'
                }
            },
            { headers: { Authorization: `Bearer ${buyerToken}` } }
        );
        expect(res.status).toBe(201);
        expect(res.data._id).toBeDefined();
        expect(res.data.status).toBe('pending');
        orderId = res.data._id;
    });

    test('Buyer can view their orders', async () => {
        const res = await axios.get(
            `${ORDER_URL}/api/orders`,
            { headers: { Authorization: `Bearer ${buyerToken}` } }
        );
        expect(res.status).toBe(200);
        expect(Array.isArray(res.data)).toBe(true);
    });

    test('Buyer can get a specific order', async () => {
        const res = await axios.get(
            `${ORDER_URL}/api/orders/${orderId}`,
            { headers: { Authorization: `Bearer ${buyerToken}` } }
        );
        expect(res.status).toBe(200);
        expect(res.data._id).toBe(orderId);
    });

    // ─── Auth protection ──────────────────────────────────────────────────────

    test('Protected route rejects request without token', async () => {
        try {
            await axios.get(`${ORDER_URL}/api/orders`);
            fail('Should have thrown');
        } catch (err) {
            expect(err.response.status).toBe(401);
        }
    });

    // ─── Health checks ────────────────────────────────────────────────────────

    test('Health check returns ok for all services', async () => {
        const services = [
            { name: 'api-gateway',          port: 3000, path: '/' },
            { name: 'auth-service',         port: 3001, path: '/health' },
            { name: 'seller-service',       port: 3002, path: '/health' },
            { name: 'catalog-service',      port: 3003, path: '/health' },
            { name: 'inventory-service',    port: 3004, path: '/health' },
            { name: 'order-service',        port: 3005, path: '/health' },
            { name: 'payment-service',      port: 3006, path: '/health' },
            { name: 'shipping-service',     port: 3007, path: '/health' },
            { name: 'review-service',       port: 3008, path: '/health' },
            { name: 'messaging-service',    port: 3009, path: '/health' },
            { name: 'notification-service', port: 3010, path: '/health' },
            { name: 'search-service',       port: 3011, path: '/health' },
            { name: 'analytics-service',    port: 3012, path: '/health' },
        ];

        for (const service of services) {
            const res = await axios.get(`http://localhost:${service.port}${service.path}`);
            expect(res.status).toBe(200);
            console.log(`✅ ${service.name} is healthy`);
        }
    });
});