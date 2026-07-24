'use client';

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  isAdminRole,
  normalizeAdminPayload,
  hasPermission,
  getSidebarItems,
  resolveIsSuperAdmin,
} from '@/lib/rbac';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const applySession = useCallback((sessionUser, adminPayload) => {
    const normalizedAdmin = normalizeAdminPayload(sessionUser, adminPayload);
    if (!normalizedAdmin) {
      return false;
    }

    setUser(sessionUser);
    setAdmin(normalizedAdmin);
    setIsAuthenticated(true);
    return true;
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminContext');
    localStorage.removeItem('userContext');
    setUser(null);
    setAdmin(null);
    setIsAuthenticated(false);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.push('/login');
  }, [clearSession, router]);

  const refreshPermissions = useCallback(async () => {
    const response = await api.get('/api/admin/rbac/me/permissions');
    const payload = response.data?.admin || response.data;
    setAdmin((prev) => {
      const nextAdmin = {
        ...prev,
        isSuperAdmin: payload?.isSuperAdmin ?? prev?.isSuperAdmin ?? false,
        permissions: payload?.permissions || prev?.permissions || {},
        modules: payload?.modules || prev?.modules || [],
        rbacPayload: payload,
      };
      localStorage.setItem('adminContext', JSON.stringify(nextAdmin));
      return nextAdmin;
    });
    return payload;
  }, []);

  const hydrateSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      clearSession();
      return false;
    }

    try {
      const response = await api.get('/api/auth/me');
      let sessionUser = response.data?.user || response.data;
      if (!sessionUser?.email) {
        try {
          const storedUser = localStorage.getItem('userContext');
          if (storedUser) sessionUser = { ...JSON.parse(storedUser), ...sessionUser };
        } catch {
          // ignore
        }
      }
      let adminPayload = response.data?.admin;

      if (!adminPayload) {
        try {
          const stored = localStorage.getItem('adminContext');
          if (stored) adminPayload = JSON.parse(stored);
        } catch {
          // ignore invalid stored admin context
        }
      }

      if (!applySession(sessionUser, adminPayload)) {
        clearSession();
        return false;
      }

      try {
        await refreshPermissions();
      } catch {
        // Keep login/me payload when refresh is unavailable.
      }

      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      clearSession();
      return false;
    }
  }, [applySession, clearSession, refreshPermissions]);

  useEffect(() => {
    hydrateSession().finally(() => setIsLoading(false));
  }, [hydrateSession]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { user: sessionUser, token, admin: adminPayload } = response.data || {};

      if (!token || !isAdminRole(sessionUser?.role)) {
        throw new Error('Not authorized as admin');
      }

      localStorage.setItem('token', token);
      applySession(sessionUser, adminPayload);
      if (adminPayload) {
        localStorage.setItem('adminContext', JSON.stringify(adminPayload));
      }

      try {
        await refreshPermissions();
      } catch {
        // Keep login payload when refresh is unavailable.
      }

      router.push('/dashboard');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      clearSession();
      throw error;
    }
  };

  const isSuperAdmin = useMemo(
    () => resolveIsSuperAdmin(user, admin?.rbacPayload || admin),
    [user, admin]
  );

  const effectiveAdmin = useMemo(() => {
    if (!admin) return null;
    return { ...admin, isSuperAdmin };
  }, [admin, isSuperAdmin]);

  const sidebarItems = useMemo(() => getSidebarItems(effectiveAdmin), [effectiveAdmin]);

  const can = useCallback(
    (moduleKey, action = 'view') =>
      hasPermission(effectiveAdmin?.permissions, moduleKey, action),
    [effectiveAdmin?.permissions]
  );

  const hasModule = useCallback(
    (moduleKey) => can(moduleKey, 'view'),
    [can]
  );

  const value = {
    user,
    admin,
    isAuthenticated,
    isAdmin: isAuthenticated,
    isSuperAdmin,
    isLoading,
    login,
    logout,
    refreshPermissions,
    can,
    hasModule,
    sidebarItems,
    effectiveAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
