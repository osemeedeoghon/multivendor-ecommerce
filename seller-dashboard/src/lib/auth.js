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