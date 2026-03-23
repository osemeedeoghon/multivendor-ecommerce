import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('adminAccessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');

// Users
export const getAllUsers = () => api.get('/api/auth/users');

// Orders
export const getAllOrders = () => api.get('/api/orders/admin/all');
export const updateOrderStatus = (id, status) => api.put(`/api/orders/${id}/status`, { status });

// Reviews
export const getPendingReviews = () => api.get('/api/reviews/pending');
export const approveReview = (id) => api.put(`/api/reviews/${id}/approve`);
export const flagReview = (id) => api.put(`/api/reviews/${id}/flag`);

// Analytics
export const getPlatformStats = () => api.get('/api/analytics/stats');
export const getTopProducts = () => api.get('/api/analytics/top-products');
export const getDailyGMV = () => api.get('/api/analytics/gmv');
export const getOrderTrends = () => api.get('/api/analytics/trends');
export const getRevenueBysSeller = () => api.get('/api/analytics/revenue');

export default api;