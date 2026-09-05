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
import { ArrowLeft, RefreshCw, Search, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Pagination from '../../users/Pagination';
import { formatDate, getVaStatusColor } from '@/utils/walletHelpers';

export default function PaystackDvasPage() {
  const { toast } = useToast();
  const [dvas, setDvas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeFilter, setActiveFilter] = useState('true');
  const [customer, setCustomer] = useState('');
  const [customerInput, setCustomerInput] = useState('');

  const fetchDvas = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('perPage', '50');
        params.set('currency', 'NGN');
        if (activeFilter !== 'all') params.set('active', activeFilter);
        if (customer.trim()) params.set('customer', customer.trim());

        const res = await api.get(`/api/admin/wallets/paystack/dvas?${params.toString()}`);
        const data = res.data;
        const list = data.data || data.dvas || [];
        setDvas(Array.isArray(list) ? list : []);
        const pag = data.pagination || data.meta || {};
        setTotalPages(pag.totalPages ?? pag.pageCount ?? 1);
        setTotalItems(pag.total ?? pag.totalCount ?? list.length);
        setCurrentPage(page);
      } catch (err) {
        toast({
          variant: 'destructive',
          description: err.response?.data?.message || 'Failed to load Paystack DVAs.',
        });
        setDvas([]);
      } finally {
        setLoading(false);
      }
    },
    [activeFilter, customer, toast]
  );

  useEffect(() => {
    fetchDvas(currentPage);
  }, [fetchDvas, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCustomer(customerInput);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/wallets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All wallets
            </Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Paystack dedicated accounts
          </h1>
          <p className="text-muted-foreground text-sm">
            Live list from Paystack — reconcile what Paystack has vs our wallet DB.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchDvas(currentPage)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Paystack customer code (optional)"
            value={customerInput}
            onChange={(e) => setCustomerInput(e.target.value)}
          />
        </div>
        <Select
          value={activeFilter}
          onValueChange={(v) => {
            setActiveFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active only</SelectItem>
            <SelectItem value="false">Inactive only</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading from Paystack…</div>
      ) : dvas.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20 text-muted-foreground">
          No dedicated virtual accounts returned.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Account</th>
                <th className="text-left p-3 font-medium">Bank</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Customer</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {dvas.map((dva) => {
                const id = dva.id || dva.dedicated_account_id || dva.account_number;
                const active = dva.active ?? dva.is_active;
                const accountNumber = dva.account_number || dva.accountNumber;
                const accountName = dva.account_name || dva.accountName;
                const bankName = dva.bank?.name || dva.bankName || dva.bank_name;
                const customerCode =
                  dva.customer?.customer_code ||
                  dva.customer_code ||
                  dva.customerCode ||
                  '—';
                return (
                  <tr key={id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-mono text-xs">{accountNumber || '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{accountName || '—'}</p>
                    </td>
                    <td className="p-3">{bankName || '—'}</td>
                    <td className="p-3 hidden md:table-cell font-mono text-xs">{customerCode}</td>
                    <td className="p-3">
                      <Badge className={getVaStatusColor(active ? 'active' : 'inactive', active)}>
                        {active ? 'active' : 'inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">
                      {formatDate(dva.created_at || dva.createdAt)}
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
