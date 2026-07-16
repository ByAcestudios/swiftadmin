'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Wallet,
  TrendingUp,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Pagination from '../users/Pagination';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const BRAND = {
  primary: '#62275f',
  primaryLight: 'rgba(98, 39, 95, 0.15)',
  secondary: '#97bb3d',
};

function formatNaira(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return `₦${Number(amount).toLocaleString()}`;
}

function formatPeriodLabel(period, groupBy) {
  if (!period) return '';
  const d = new Date(period);
  if (groupBy === 'month') return format(d, 'MMM yyyy');
  if (groupBy === 'week') return `Week of ${format(d, 'MMM d')}`;
  return format(d, 'MMM d');
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'success' || s === 'successful') {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (s === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s === 'failed') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

function defaultDateRange() {
  const to = new Date();
  const from = subDays(to, 30);
  return { from, to };
}

export default function FinancePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    groupBy: 'day',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDashboard = useCallback(async (page = 1) => {
    if (!dateRange.from || !dateRange.to) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('startDate', format(dateRange.from, 'yyyy-MM-dd'));
      params.set('endDate', format(dateRange.to, 'yyyy-MM-dd'));
      params.set('groupBy', filters.groupBy);
      params.set('page', String(page));
      params.set('limit', '20');
      params.set('includePaystackBalance', 'true');
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        params.set('paymentMethod', filters.paymentMethod);
      }
      if (filters.search?.trim()) params.set('search', filters.search.trim());

      const res = await api.get(`/api/transactions/admin/finance/dashboard?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      console.error('Finance dashboard error:', err);
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load finance dashboard.',
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, filters, toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange.from, dateRange.to, filters.status, filters.paymentMethod, filters.groupBy, filters.search]);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchDashboard(currentPage);
    }
  }, [fetchDashboard, currentPage, dateRange.from, dateRange.to]);

  const applySearch = () => {
    setFilters((p) => ({ ...p, search: searchInput.trim() }));
    setCurrentPage(1);
  };

  const summary = data?.summary;
  const timeline = data?.timeline || [];
  const byPaymentMethod = data?.byPaymentMethod || [];
  const transactions = data?.recentTransactions?.data || [];
  const pagination = data?.recentTransactions?.pagination || {};
  const totalPages = pagination.totalPages ?? 1;
  const paystackBalance = data?.paystack?.balance?.[0];

  const timelineChart = {
    labels: timeline.map((t) => formatPeriodLabel(t.period, filters.groupBy)),
    datasets: [
      {
        label: 'Inflow',
        data: timeline.map((t) => t.inflow ?? 0),
        backgroundColor: BRAND.primary,
      },
      {
        label: 'Pending',
        data: timeline.map((t) => t.pending ?? 0),
        backgroundColor: '#f59e0b',
      },
      {
        label: 'Failed',
        data: timeline.map((t) => t.failed ?? 0),
        backgroundColor: '#ef4444',
      },
    ],
  };

  const pieChart = {
    labels: byPaymentMethod.map((m) => (m.paymentMethod || 'unknown').toUpperCase()),
    datasets: [
      {
        data: byPaymentMethod.map((m) => m.amount ?? 0),
        backgroundColor: ['#62275f', '#97bb3d', '#4f46e5', '#f59e0b', '#06b6d4', '#ec4899'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="h-7 w-7" />
            Finance & Transactions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customer payment inflows, Paystack balance, and transaction history.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchDashboard(currentPage)}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="min-w-[240px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Date range</label>
          <DateRangePicker value={dateRange} onChange={(r) => setDateRange(r || { from: undefined, to: undefined })} />
        </div>
        <div className="w-[140px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
          <Select value={filters.status} onValueChange={(v) => { setFilters((p) => ({ ...p, status: v })); setCurrentPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[140px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Payment method</label>
          <Select value={filters.paymentMethod} onValueChange={(v) => { setFilters((p) => ({ ...p, paymentMethod: v })); setCurrentPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank">Bank</SelectItem>
              <SelectItem value="ussd">USSD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[120px]">
          <label className="text-xs font-medium text-gray-600 block mb-1">Group by</label>
          <Select value={filters.groupBy} onValueChange={(v) => setFilters((p) => ({ ...p, groupBy: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px] flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search reference…"
              className="pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            />
          </div>
          <Button variant="outline" onClick={applySearch}>Search</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Total inflows
          </div>
          <p className="text-2xl font-bold mt-1 text-gray-900">{formatNaira(summary?.inflows?.amount)}</p>
          <p className="text-xs text-gray-500">{summary?.inflows?.count ?? 0} successful</p>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Pending
          </div>
          <p className="text-2xl font-bold mt-1">{formatNaira(summary?.pending?.amount)}</p>
          <p className="text-xs text-gray-500">{summary?.pending?.count ?? 0} transactions</p>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Failed
          </div>
          <p className="text-2xl font-bold mt-1">{formatNaira(summary?.failed?.amount)}</p>
          <p className="text-xs text-gray-500">{summary?.failed?.count ?? 0} transactions</p>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#62275F] text-sm font-medium">
            <Percent className="h-4 w-4" />
            Success rate
          </div>
          <p className="text-2xl font-bold mt-1">{summary?.successRate != null ? `${summary.successRate}%` : '—'}</p>
          <p className="text-xs text-gray-500">{summary?.totalTransactions ?? 0} total</p>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-[#62275F] text-sm font-medium">
            <Wallet className="h-4 w-4" />
            Paystack balance
          </div>
          <p className="text-2xl font-bold mt-1">
            {paystackBalance
              ? formatNaira(paystackBalance.balance)
              : data?.paystack
                ? '—'
                : 'N/A'}
          </p>
          <p className="text-xs text-gray-500">
            {data?.paystack?.mode ? `${data.paystack.mode}${data.paystack.isTest ? ' (test)' : ''}` : 'Live balance'}
          </p>
        </div>
      </div>

      {data?.note && (
        <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
          {data.note}
        </p>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border p-4 shadow-sm relative min-h-[320px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg">
              <span className="text-sm text-gray-500">Loading…</span>
            </div>
          )}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Inflows timeline</h2>
          <div className="h-[260px]">
            {timeline.length > 0 ? (
              <Bar data={timelineChart} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No timeline data for this period
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 shadow-sm relative min-h-[320px]">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg" />
          )}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment methods</h2>
          <div className="h-[260px]">
            {byPaymentMethod.length > 0 ? (
              <Pie data={pieChart} options={pieOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No payment breakdown
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <span className="text-sm text-gray-500">Loading transactions…</span>
          </div>
        )}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Recent transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                    No transactions found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((tx) => (
                <TableRow key={tx.id || tx.reference}>
                  <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                    {tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm') : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[140px] truncate" title={tx.reference || tx.paystackReference}>
                    {tx.reference || tx.paystackReference || '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tx.user?.name || tx.user?.email || '—'}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {tx.order?.orderNumber || '—'}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{tx.paymentMethod || '—'}</TableCell>
                  <TableCell className="text-right font-medium">{formatNaira(tx.amount)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(tx.status)}>
                      {(tx.status || '—').toString()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
