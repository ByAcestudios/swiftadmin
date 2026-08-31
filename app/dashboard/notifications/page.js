'use client';

import { useRouter } from 'next/navigation';
import BlastForm, { BlastFormPageHeader } from './BlastForm';

export default function NotificationsComposePage() {
  const router = useRouter();

  const handleSent = (blast) => {
    if (blast?.id) {
      router.push(`/dashboard/notifications/history/${blast.id}`);
    } else {
      router.push('/dashboard/notifications/history');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BlastFormPageHeader />
      <BlastForm onSent={handleSent} />
    </div>
  );
}
