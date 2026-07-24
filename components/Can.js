'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function Can({ module: moduleKey, action = 'view', children, fallback = null }) {
  const { can } = useAuth();
  if (!can(moduleKey, action)) return fallback;
  return children;
}
