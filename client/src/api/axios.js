import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('devpad_token') || localStorage.getItem('devpad_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/') || url.includes('/reset/');
    if (!isAuthRoute && (error.response?.status === 401 || error.response?.status === 403)) {
      sessionStorage.removeItem('devpad_token');
      sessionStorage.removeItem('devpad_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
