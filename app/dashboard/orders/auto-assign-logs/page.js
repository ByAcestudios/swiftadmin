'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Backend RBAC links here; the real page lives at /dashboard/auto-assign-logs */
export default function AutoAssignLogsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/auto-assign-logs');
  }, [router]);

  return (
    <div className="py-12 text-center text-gray-500">
      Redirecting to Auto Assign Logs...
    </div>
  );
}
