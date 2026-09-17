import axios from 'axios';

const getDynamicApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001/api';
  }
  const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
  if (isIp) {
    return `${protocol}//${hostname}:5001/api`;
  }
  return '/api';
};

const API_BASE_URL = getDynamicApiBase();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add headers to determine session type
api.interceptors.request.use(
  (config) => {
    const isStaff = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/employee') || window.location.pathname.startsWith('/rider');
    config.headers['X-Session-Type'] = isStaff ? 'staff' : 'customer';
    
    // Add token from sessionStorage for staff, or localStorage for customer
    if (isStaff) {
      const staffToken = sessionStorage.getItem('staffToken');
      if (staffToken) {
        config.headers['Authorization'] = `Bearer ${staffToken}`;
      }
    } else {
      const customerToken = localStorage.getItem('customerToken');
      if (customerToken) {
        config.headers['Authorization'] = `Bearer ${customerToken}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthCheck = error.config?.url?.includes('/auth/me') || error.config?.url?.includes('/auth/login');
      const isLoginPage = window.location.pathname.includes('/login');
      
      if (!isAuthCheck && !isLoginPage) {
        const isStaff = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/employee') || window.location.pathname.startsWith('/rider');
        if (isStaff) {
          sessionStorage.removeItem('staffUser');
          sessionStorage.removeItem('staffToken');
          localStorage.removeItem('staffUser'); // Clean up old data if exists
        } else {
          localStorage.removeItem('pizzazone_user');
          localStorage.removeItem('cheezka_user');
          localStorage.removeItem('customerToken');
        }
        window.location.href = isStaff ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
