import axios from 'axios';

const api = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const refreshToken = (token) => api.post('/api/auth/refresh', { refreshToken: token });
export const getMe = () => api.get('/api/auth/me');

// Catalog
export const searchProducts = (params) => api.get('/api/catalog/search', { params });
export const getProductById = (id) => api.get(`/api/catalog/${id}`);
export const getProductsByCategory = (category) => api.get(`/api/catalog/category/${category}`);

// Search
export const getFeaturedProducts = () => api.get('/api/search/featured');
export const getCategories = () => api.get('/api/search/categories');

// Orders
export const placeOrder = (data) => api.post('/api/orders', data);
export const getMyOrders = () => api.get('/api/orders');
export const getOrderById = (id) => api.get(`/api/orders/${id}`);
export const cancelOrder = (id) => api.post(`/api/orders/${id}/cancel`);

// Reviews
export const getReviewsByProduct = (productId) => api.get(`/api/reviews/product/${productId}`);
export const submitReview = (data) => api.post('/api/reviews', data);

// Messages
export const getMyThreads = () => api.get('/api/messages/threads');
export const getThreadMessages = (threadId) => api.get(`/api/messages/thread/${threadId}`);
export const sendMessage = (data) => api.post('/api/messages', data);
export const markThreadRead = (threadId) => api.put(`/api/messages/thread/${threadId}/read`);

export default api;