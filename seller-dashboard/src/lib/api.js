import axios from 'axios';

const api = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('sellerAccessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');

// Store
export const getMyStore = () => api.get('/api/sellers/store');
export const createStore = (data) => api.post('/api/sellers/store', data);
export const updateStore = (data) => api.put('/api/sellers/store', data);

// Products
export const getMyProducts = () => api.get('/api/products');
export const createProduct = (data) => api.post('/api/products', data);
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// Orders
export const getSellerOrders = () => api.get('/api/orders');
export const updateOrderStatus = (id, status) => api.put(`/api/orders/${id}/status`, { status });

// Shipping
export const createShipment = (data) => api.post('/api/shipping', data);
export const getSellerShipments = () => api.get('/api/shipping/seller');
export const updateShipmentStatus = (id, status) => api.put(`/api/shipping/${id}/status`, { status });

export default api;