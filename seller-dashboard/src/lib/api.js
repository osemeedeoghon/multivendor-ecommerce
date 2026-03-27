import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('sellerAccessToken');
        console.log('[API Interceptor] Token retrieved:', token ? 'exists' : 'missing');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[API Interceptor] Authorization header set');
        } else {
            console.warn('[API Interceptor] No token found in localStorage');
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const code = error.response?.data?.code;
            
            // Handle token expiration
            if (code === 'TOKEN_EXPIRED') {
                console.error('[API] Token has expired, clearing storage and redirecting to login');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('sellerAccessToken');
                    localStorage.removeItem('sellerRefreshToken');
                    localStorage.removeItem('sellerUser');
                    // Redirect to login
                    window.location.href = '/login?expired=true';
                }
            }
            
            console.error('[API 401 Error]', error.response.data);
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');

// Store
export const getMyStore = () => api.get('/api/sellers/store');
export const createStore = (data) => {
    console.log('[API] Creating store with data:', data);
    return api.post('/api/sellers/store', data);
};
export const updateStore = (data) => {
    console.log('[API] Updating store with data:', data);
    return api.put('/api/sellers/store', data);
};

// Products
export const getMyProducts = () => api.get('/api/products');
export const createProduct = (data) => api.post('/api/products', data);
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// Inventory
export const getInventory = () => api.get('/api/inventory');
export const updateInventory = (id, data) => api.put(`/api/inventory/${id}`, data);

// Orders
export const getSellerOrders = () => {
    console.log('[API] Calling GET /api/orders/seller');
    return api.get('/api/orders/seller');
};
export const updateOrderStatus = (id, status) => {
    console.log('[API] Calling PUT /api/orders/' + id + '/status with status:', status);
    return api.put(`/api/orders/${id}/status`, { status });
};

// Shipping
export const getSellerShipments = () => api.get('/api/shipping/seller');
export const createShipment = (data) => api.post('/api/shipping', data);
export const updateShipmentStatus = (id, status) => api.put(`/api/shipping/${id}/status`, { status });

// Analytics
export const getSellerAnalytics = () => api.get('/api/analytics/revenue');

export default api;