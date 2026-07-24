'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { Package, Search, Settings, RefreshCw, Inbox, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Pagination from '../users/Pagination';
import {
  formatNaira,
  formatWaybillStatus,
  getWaybillStatusColor,
  getPaymentStatusColor,
  formatShipmentType,
  formatLocation,
  WAYBILL_STATUSES,
  SHIPMENT_TYPES,
} from '@/utils/waybillHelpers';

export default function WaybillInboxPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    status: 'all',
    shipmentType: 'all',
    search: '',
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/waybill/admin/stats');
      setStats(res.data?.stats || res.data);
    } catch {
      setStats(null);
    }
  }, []);

  const fetchRequests = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '20');
        if (filters.status !== 'all') params.set('status', filters.status);
        if (filters.shipmentType !== 'all') params.set('shipmentType', filters.shipmentType);
        if (filters.search?.trim()) params.set('search', filters.search.trim());

        const res = await api.get(`/api/waybill/admin/requests?${params.toString()}`);
        const data = res.data;
        const list = data.data || [];
        setRequests(list);
        const pag = data.pagination || {};
        setTotalPages(pag.totalPages ?? 1);
        setTotalItems(pag.total ?? list.length);
        setCurrentPage(page);
      } catch (err) {
        toast({
          variant: 'destructive',
          description: err.response?.data?.message || 'Failed to load waybill requests.',
        });
        setRequests([]);
      } finally {
        setLoading(false);
      }
    },
    [filters, toast]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRequests(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-7 w-7 text-[#62275F]" />
            Waybill Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            International & domestic shipping quotes — handled by ops, not riders.
          </p>
        </div>
        <Link href="/dashboard/waybill/settings">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Pricing & Areas
          </Button>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
            <Inbox className="h-8 w-8 text-[#62275F]" />
            <div>
              <p className="text-sm text-gray-500">Total requests</p>
              <p className="text-2xl font-bold">{stats.total ?? 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-sm text-gray-500">Pending review</p>
              <p className="text-2xl font-bold">{stats.pendingReview ?? 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 mb-2">By status</p>
            <div className="flex flex-wrap gap-2">
              {(stats.byStatus || []).slice(0, 4).map((row) => (
                <Badge key={row.status} className={getWaybillStatusColor(row.status)}>
                  {formatWaybillStatus(row.status)}: {row.count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by reference, sender, receiver..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="pl-9"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters((f) => ({ ...f, status: value }))}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {WAYBILL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {formatWaybillStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.shipmentType}
            onValueChange={(value) => setFilters((f) => ({ ...f, shipmentType: value }))}
          >
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Shipment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {SHIPMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {formatShipmentType(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">Search</Button>
          <Button type="button" variant="outline" onClick={() => fetchRequests(currentPage)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <p className="text-gray-500">Loading requests...</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estimate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!loading && requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No waybill requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/waybill/${req.id}`}
                        className="font-medium text-[#62275F] hover:underline"
                      >
                        {req.requestNumber || req.id?.slice(0, 8)}
                      </Link>
                      <p className="text-xs text-gray-500">{formatShipmentType(req.shipmentType)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                      {formatLocation(req)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p>{req.itemCategory || '—'}</p>
                      <p className="text-xs text-gray-500">
                        {[req.sizeLabel || req.sizeKey, req.weightLabel || req.weightKey].filter(Boolean).join(' · ')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getWaybillStatusColor(req.status)}>{formatWaybillStatus(req.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getPaymentStatusColor(req.paymentStatus)}>
                        {formatWaybillStatus(req.paymentStatus)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatNaira(req.finalQuotedCost ?? req.estimatedCost, req.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={fetchRequests} />
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500">{totalItems} request(s) total</p>
    </div>
  );
}
