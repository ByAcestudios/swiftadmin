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
import { Landmark, Search, X, ChevronRight, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Pagination from '../users/Pagination';
import {
  WALLET_STATUSES,
  formatNgn,
  formatWalletStatus,
  getWalletStatusColor,
  getVaStatusColor,
  formatUserName,
  formatDate,
} from '@/utils/walletHelpers';

export default function WalletsListPage() {
  const { toast } = useToast();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchWallets = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '20');
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (search.trim()) params.set('search', search.trim());

        const res = await api.get(`/api/admin/wallets?${params.toString()}`);
        const data = res.data;
        setWallets(data.data || []);
        const pag = data.pagination || {};
        setTotalPages(pag.totalPages ?? 1);
        setTotalItems(pag.total ?? data.data?.length ?? 0);
        setCurrentPage(page);
      } catch (err) {
        toast({
          variant: 'destructive',
          description: err.response?.data?.message || 'Failed to load wallets.',
        });
        setWallets([]);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search, toast]
  );

  useEffect(() => {
    fetchWallets(currentPage);
  }, [fetchWallets, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setSearchInput('');
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Wallets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            User wallet balances, virtual accounts, and funding activity.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/wallets/paystack">
            <ExternalLink className="h-4 w-4 mr-2" />
            Paystack DVAs
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Search name, email, or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {WALLET_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
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
        <div className="text-center py-12 text-muted-foreground">Loading wallets…</div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Landmark className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No wallets found.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Balance</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Account</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Bank</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">VA</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Updated</th>
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => {
                const va = wallet.virtualAccount;
                const userId = wallet.userId || wallet.user?.id;
                return (
                  <tr key={wallet.id || userId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <Link
                        href={`/dashboard/wallets/${userId}`}
                        className="font-medium hover:underline"
                      >
                        {formatUserName(wallet.user)}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {wallet.user?.email}
                        {wallet.user?.phoneNumber ? ` · ${wallet.user.phoneNumber}` : ''}
                      </p>
                    </td>
                    <td className="p-3 font-semibold tabular-nums">{formatNgn(wallet.balance)}</td>
                    <td className="p-3">
                      <Badge className={getWalletStatusColor(wallet.status)}>
                        {formatWalletStatus(wallet.status)}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell font-mono text-xs">
                      {va?.accountNumber || '—'}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {va?.bankName || '—'}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {va ? (
                        <Badge className={getVaStatusColor(va.provisionStatus, va.active)}>
                          {va.provisionStatus || (va.active ? 'active' : 'inactive')}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {formatDate(wallet.updatedAt)}
                    </td>
                    <td className="p-3">
                      <Link href={`/dashboard/wallets/${userId}`}>
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
