import axios from 'axios';

// =====================
// DYNAMIC BASE URL
// =====================
// - If running in browser on host machine: use localhost
// - If running inside Docker (frontend container), use container name "auth-service"
const getBaseURL = () => {
    if (typeof window === 'undefined') {
        // Running in Node (Next.js SSR / Docker build) – use auth-service container name
        return 'http://auth-service:3001';
    } else {
        // Running in browser on host machine
        return 'http://localhost:3001';
    }
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('sellerAccessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// =====================
// AUTH
// =====================
export const login = (data) => api.post('/api/auth/login', data);
export const register = (data) => api.post('/api/auth/register', data);
export const getMe = () => api.get('/api/auth/me');

// =====================
// STORE
// =====================
export const getMyStore = () => api.get('/api/sellers/store');
export const createStore = (data) => api.post('/api/sellers/store', data);
export const updateStore = (data) => api.put('/api/sellers/store', data);

// =====================
// PRODUCTS
// =====================
export const getMyProducts = () => api.get('/api/products');
export const createProduct = (data) => api.post('/api/products', data);
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// =====================
// ORDERS
// =====================
export const getSellerOrders = () => api.get('/api/orders');
export const updateOrderStatus = (id, status) => api.put(`/api/orders/${id}/status`, { status });

// =====================
// SHIPPING
// =====================
export const createShipment = (data) => api.post('/api/shipping', data);
export const getSellerShipments = () => api.get('/api/shipping/seller');
export const updateShipmentStatus = (id, status) => api.put(`/api/shipping/${id}/status`, { status });

// =====================
// TOKEN & USER STORAGE
// =====================
export const saveTokens = (accessToken, refreshToken) => {
    localStorage.setItem('sellerAccessToken', accessToken);
    localStorage.setItem('sellerRefreshToken', refreshToken);
};

export const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('sellerAccessToken');
};

export const clearTokens = () => {
    localStorage.removeItem('sellerAccessToken');
    localStorage.removeItem('sellerRefreshToken');
    localStorage.removeItem('sellerUser');
};

export const saveUser = (user) => {
    localStorage.setItem('sellerUser', JSON.stringify(user));
};

export const getUser = () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('sellerUser');
    return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => !!getAccessToken();

export default api;