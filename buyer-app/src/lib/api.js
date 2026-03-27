import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token added to request:', config.url);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] 401 Unauthorized:', {
        url: error.config?.url,
        hasToken: !!localStorage.getItem('accessToken'),
        authHeader: error.config?.headers?.Authorization,
      });
    }
    return Promise.reject(error);
  }
);

export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const refreshToken = (token) => api.post('/api/auth/refresh', { refreshToken: token });
export const getMe = () => api.get('/api/auth/me');

export const searchProducts = (params) => api.get('/api/catalog/search', { params });
export const getProductById = (id) => api.get(`/api/catalog/${id}`);
export const getProductsByCategory = (category) => api.get(`/api/catalog/category/${category}`);
export const getFeaturedProducts = () => api.get('/api/search/featured');
export const getCategories = () => api.get('/api/search/categories');
export const placeOrder = (data) => api.post('/api/orders', data);
export const getMyOrders = () => api.get('/api/orders');
export const getOrderById = (id) => api.get(`/api/orders/${id}`);
export const cancelOrder = (id) => api.post(`/api/orders/${id}/cancel`);
export const getReviewsByProduct = (productId) => api.get(`/api/reviews/product/${productId}`);
export const submitReview = (data) => api.post('/api/reviews', data);
export const getMyThreads = () => api.get('/api/messages/threads');
export const getThreadMessages = (threadId) => api.get(`/api/messages/thread/${threadId}`);
export const sendMessage = (data) => api.post('/api/messages', data);
export const markThreadRead = (threadId) => api.put(`/api/messages/thread/${threadId}/read`);
export const processPayment = (data) => api.post('/api/payments', data);
export default api;