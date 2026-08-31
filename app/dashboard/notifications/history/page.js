'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, X, Bell, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Can from '@/components/Can';
import Pagination from '../../users/Pagination';
import {
  formatBlastType,
  formatBlastStatus,
  getBlastStatusColor,
  BLAST_STATUSES,
} from '@/utils/notificationHelpers';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function BlastHistoryPage() {
  const { toast } = useToast();
  const [blasts, setBlasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchBlasts = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '20');
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await api.get(`/api/admin/notifications/blasts?${params.toString()}`);
        const data = res.data;
        setBlasts(data.data || []);
        const pag = data.pagination || {};
        setTotalPages(pag.totalPages ?? 1);
        setTotalItems(pag.total ?? data.data?.length ?? 0);
        setCurrentPage(page);
      } catch (err) {
        toast({
          variant: 'destructive',
          description: err.response?.data?.message || 'Failed to load blast history.',
        });
        setBlasts([]);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search, toast]
  );

  useEffect(() => {
    fetchBlasts(currentPage);
  }, [fetchBlasts, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBlasts(1);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Blast history
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Past push notification blasts and delivery stats.
          </p>
        </div>
        <Can module="notifications" action="create">
          <Button asChild>
            <Link href="/dashboard/notifications">
              <Plus className="h-4 w-4 mr-2" />
              Compose blast
            </Link>
          </Button>
        </Can>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {BLAST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {formatBlastStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {(statusFilter !== 'all' || search) && (
          <Button type="button" variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </form>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading blasts…</div>
      ) : blasts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No blasts found.</p>
          <Can module="notifications" action="create">
            <Button asChild className="mt-4" variant="outline">
              <Link href="/dashboard/notifications">Send your first blast</Link>
            </Button>
          </Can>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Type</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Devices</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Push sent</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Sent</th>
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {blasts.map((blast) => {
                const stats = blast.stats || {};
                return (
                  <tr key={blast.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <Link
                        href={`/dashboard/notifications/history/${blast.id}`}
                        className="font-medium hover:underline"
                      >
                        {blast.title}
                      </Link>
                      {blast.creator?.email && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {blast.creator.firstName || blast.creator.email}
                        </p>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant="outline">{formatBlastType(blast.type)}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={getBlastStatusColor(blast.status)}>
                        {formatBlastStatus(blast.status)}
                      </Badge>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {stats.devicesTargeted?.toLocaleString?.() ?? '—'}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {stats.pushSent != null ? (
                        <>
                          {stats.pushSent.toLocaleString()}
                          {stats.pushFailed > 0 && (
                            <span className="text-red-600 ml-1">
                              ({stats.pushFailed} failed)
                            </span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {formatDate(blast.sentAt || blast.createdAt)}
                    </td>
                    <td className="p-3">
                      <Link href={`/dashboard/notifications/history/${blast.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}
