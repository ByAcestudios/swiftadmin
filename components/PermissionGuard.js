'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessRoute, getModuleForPath } from '@/lib/rbac';
import { useToast } from '@/hooks/use-toast';

export default function PermissionGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, admin, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const accessGranted =
    !isLoading && canAccessRoute(pathname, { ...admin, isSuperAdmin });

  useEffect(() => {
    if (isLoading || accessGranted) return;

    const moduleKey = getModuleForPath(pathname);
    toast({
      variant: 'destructive',
      title: 'Access denied',
      description:
        moduleKey === 'team'
          ? 'Team & Roles is restricted to super admins.'
          : 'You do not have permission to view this module.',
    });
    router.replace('/dashboard');
  }, [isLoading, accessGranted, pathname, router, toast]);

  useEffect(() => {
    const onPermissionDenied = () => {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'You do not have permission to perform this action.',
      });
    };

    window.addEventListener('permission-denied', onPermissionDenied);
    return () => window.removeEventListener('permission-denied', onPermissionDenied);
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500">
        Loading...
      </div>
    );
  }

  if (!accessGranted) return null;

  return children;
}
