// Purpose: Wraps HTTP client setup and API service calls.
import axios from 'axios';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor - add JWT token to Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tf_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Clear auth on 401 and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;


