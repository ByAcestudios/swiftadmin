'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import {
  formatBlastType,
  formatBlastStatus,
  getBlastStatusColor,
} from '@/utils/notificationHelpers';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function AudienceBlock({ audience }) {
  if (!audience) return <p className="text-muted-foreground">—</p>;

  const apps = Array.isArray(audience.apps) ? audience.apps.join(', ') : audience.apps;
  const platforms = Array.isArray(audience.platforms)
    ? audience.platforms.join(', ')
    : audience.platforms;

  return (
    <dl className="grid gap-2 text-sm">
      <div className="flex gap-2">
        <dt className="text-muted-foreground w-28 shrink-0">Apps</dt>
        <dd>{apps || '—'}</dd>
      </div>
      <div className="flex gap-2">
        <dt className="text-muted-foreground w-28 shrink-0">Platforms</dt>
        <dd>{platforms || '—'}</dd>
      </div>
      {audience.emails?.length > 0 && (
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-28 shrink-0">Emails only</dt>
          <dd className="break-all">{audience.emails.join(', ')}</dd>
        </div>
      )}
      {audience.excludeEmails?.length > 0 && (
        <div className="flex gap-2">
          <dt className="text-muted-foreground w-28 shrink-0">Excluded</dt>
          <dd className="break-all">{audience.excludeEmails.join(', ')}</dd>
        </div>
      )}
    </dl>
  );
}

function StatGrid({ stats }) {
  if (!stats) return null;
  const items = [
    { label: 'Users targeted', value: stats.usersTargeted },
    { label: 'Riders targeted', value: stats.ridersTargeted },
    { label: 'Devices targeted', value: stats.devicesTargeted },
    { label: 'In-app created', value: stats.inAppCreated },
    { label: 'Push sent', value: stats.pushSent },
    { label: 'Push failed', value: stats.pushFailed },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">
            {value != null ? value.toLocaleString() : '—'}
          </p>
        </div>
      ))}
    </div>
  );
}

const POLL_STATUSES = ['pending', 'processing'];

export default function BlastDetailPage() {
  const params = useParams();
  const blastId = params.blastId;
  const { toast } = useToast();
  const [blast, setBlast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlast = useCallback(
    async (silent = false) => {
      if (!blastId) return;
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await api.get(`/api/admin/notifications/blasts/${blastId}`);
        setBlast(res.data.blast || res.data.data || res.data);
      } catch (err) {
        toast({
          variant: 'destructive',
          description: err.response?.data?.message || 'Failed to load blast.',
        });
        setBlast(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [blastId, toast]
  );

  useEffect(() => {
    fetchBlast();
  }, [fetchBlast]);

  useEffect(() => {
    if (!blast || !POLL_STATUSES.includes(blast.status)) return undefined;

    const interval = setInterval(() => fetchBlast(true), 5000);
    return () => clearInterval(interval);
  }, [blast, fetchBlast]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!blast) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/notifications/history">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to history
          </Link>
        </Button>
        <p className="text-muted-foreground">Blast not found.</p>
      </div>
    );
  }

  const isPolling = POLL_STATUSES.includes(blast.status);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/notifications/history">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Blast history
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{blast.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getBlastStatusColor(blast.status)}>
              {formatBlastStatus(blast.status)}
            </Badge>
            <Badge variant="outline">{formatBlastType(blast.type)}</Badge>
            {isPolling && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating every 5s…
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBlast(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {blast.status === 'failed' && blast.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-800">Delivery failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{blast.error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{blast.message}</p>
            <dl className="grid gap-2 pt-2 border-t">
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-24">Created</dt>
                <dd>{formatDate(blast.createdAt)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-24">Sent</dt>
                <dd>{formatDate(blast.sentAt)}</dd>
              </div>
              {blast.creator && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24">Creator</dt>
                  <dd>
                    {blast.creator.firstName} {blast.creator.lastName}{' '}
                    <span className="text-muted-foreground">({blast.creator.email})</span>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audience</CardTitle>
            <CardDescription>Who received this blast</CardDescription>
          </CardHeader>
          <CardContent>
            <AudienceBlock audience={blast.audience} />
          </CardContent>
        </Card>
      </div>

      {blast.metadata && Object.keys(blast.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(blast.metadata).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="text-muted-foreground capitalize">{key}</dt>
                  <dd className="break-all">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery stats</CardTitle>
          <CardDescription>
            Push (FCM) and in-app notification counts for this blast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatGrid stats={blast.stats} />
        </CardContent>
      </Card>
    </div>
  );
}
