export const saveTokens = (accessToken, refreshToken) => {
    localStorage.setItem('adminAccessToken', accessToken);
    localStorage.setItem('adminRefreshToken', refreshToken);
};

export const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('adminAccessToken');
};

export const clearTokens = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
};

export const saveUser = (user) => {
    localStorage.setItem('adminUser', JSON.stringify(user));
};

export const getUser = () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
};

export const isLoggedIn = () => !!getAccessToken();