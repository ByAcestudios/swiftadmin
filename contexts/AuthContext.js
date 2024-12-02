import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token and get user info
          const response = await api.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data && response.data.role === 'admin') {
            setIsAuthenticated(true);
            setIsAdmin(true);
          } else {
            // If not admin, log out
            logout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        router.push('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data && response.data.token && response.data.user.role === 'admin') {
        localStorage.setItem('token', response.data.token);
        setIsAuthenticated(true);
        setIsAdmin(true);
        router.push('/dashboard'); // Redirect to dashboard
        return true;
      } else {
        throw new Error('Not authorized as admin');
        
      }
    } catch (error) {
      console.error('Login failed:', error);
      logout();
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setIsAdmin(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);