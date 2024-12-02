import axios from 'axios';
import { useRouter } from 'next/navigation';

// const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;


const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear the token from localStorage
      localStorage.removeItem('token');
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data.user;
  } catch (error) {
    console.error('API login error:', error);
    if (error.response && error.response.data) {
        
    //   throw error.response.data;
    } else {
      throw { error: 'An unexpected error occurred' };
    }
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export default api;