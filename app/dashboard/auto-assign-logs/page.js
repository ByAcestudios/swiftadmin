'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Search, X, ChevronDown, ChevronUp, Package, Clock, MapPin, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Pagination from '../users/Pagination';
import api from '@/lib/api';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

const riderStatusColor = {
  pending: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
  expired: 'outline',
};

function formatRiderStatus(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function openInGoogleMaps(lat, lng) {
  if (lat == null || lng == null) return;
  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
}

/** Pickup: log.pickupAddress or log.pickupLocation?.address, log.pickupLatitude/longitude or log.pickupLocation */
function getPickupLocation(log) {
  const address = log.pickupAddress ?? log.pickupLocation?.address ?? null;
  const lat = log.pickupLatitude ?? log.pickupLocation?.latitude ?? null;
  const lng = log.pickupLongitude ?? log.pickupLocation?.longitude ?? null;
  return { address, lat, lng };
}

/** Driver location: rider.latitude/longitude, rider.riderLatitude/riderLongitude, or rider.locationAtAssignment */
function getDriverLocation(rider) {
  const loc = rider.locationAtAssignment;
  const address = rider.locationAddress ?? loc?.address ?? rider.address ?? null;
  const lat = rider.latitude ?? rider.riderLatitude ?? loc?.latitude ?? null;
  const lng = rider.longitude ?? rider.riderLongitude ?? loc?.longitude ?? null;
  return { address, lat, lng };
}

/** Distance from rider to pickup: distanceFromPickup or distance */
function getRiderDistance(rider) {
  const d = rider.distanceFromPickup ?? rider.distance;
  return d != null ? d : null;
}

function PickupLocationCell({ log, inline }) {
  const { address, lat, lng } = getPickupLocation(log);
  const hasCoords = lat != null && lng != null;
  const hasAny = address || hasCoords;
  if (!hasAny) return <span className="text-muted-foreground">—</span>;
  const wrap = inline ? 'span' : 'div';
  const Wrapper = wrap;
  return (
    <Wrapper className={inline ? 'inline-flex items-center gap-1 flex-wrap' : 'space-y-0.5'}>
      {address && <span className="block truncate" title={address}>{address}</span>}
      {hasCoords && (
        <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-500">
          {lat.toFixed(5)}, {lng.toFixed(5)}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openInGoogleMaps(lat, lng); }}
            className="inline-flex items-center text-[#62275F] hover:underline"
            title="Open in Google Maps"
          >
            <MapPin className="h-3.5 w-3.5 mr-0.5" />
            <ExternalLink className="h-3 w-3" />
          </button>
        </span>
      )}
    </Wrapper>
  );
}

function DriverLocationCell({ rider }) {
  const { address, lat, lng } = getDriverLocation(rider);
  const hasCoords = lat != null && lng != null;
  const hasAny = address || hasCoords;
  if (!hasAny) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="space-y-0.5">
      {address && <span className="block truncate text-xs" title={address}>{address}</span>}
      {hasCoords && (
        <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-500">
          {lat.toFixed(5)}, {lng.toFixed(5)}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openInGoogleMaps(lat, lng); }}
            className="inline-flex items-center text-[#62275F] hover:underline"
            title="Open in Google Maps"
          >
            <MapPin className="h-3.5 w-3.5 mr-0.5" />
            <ExternalLink className="h-3 w-3" />
          </button>
        </span>
      )}
    </div>
  );
}

function DebugRiderBlock({ debugRider }) {
  if (!debugRider) return null;
  const lat = debugRider.latitude;
  const lng = debugRider.longitude;
  const hasCoords = lat != null && lng != null;
  const exclusionReasons = Array.isArray(debugRider.exclusionReasons) ? debugRider.exclusionReasons : [];
  const included = debugRider.wasIncludedInAssign === true;
  return (
    <div className="mb-3 p-3 rounded-md bg-amber-50 border border-amber-200">
      <div className="text-sm font-medium text-amber-800 mb-2">Debug rider</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
        <span>Email: <span className="font-mono">{debugRider.email ?? '—'}</span></span>
        <span>Rider ID: <span className="font-mono truncate inline-block max-w-[180px] align-bottom" title={debugRider.riderId}>{debugRider.riderId ?? '—'}</span></span>
        <span>Distance to pickup: {debugRider.distanceToPickup != null ? `${debugRider.distanceToPickup} km` : '—'}</span>
        <span>Included in assign: {debugRider.wasIncludedInAssign != null ? (debugRider.wasIncludedInAssign ? 'Yes' : 'No') : '—'}</span>
        <span>Ride request ID: <span className="font-mono truncate inline-block max-w-[180px] align-bottom" title={debugRider.rideRequestId}>{debugRider.rideRequestId ?? '—'}</span></span>
        {hasCoords && (
          <span className="sm:col-span-2 flex items-center gap-1">
            Location: {lat.toFixed(5)}, {lng.toFixed(5)}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openInGoogleMaps(lat, lng); }}
              className="inline-flex items-center text-[#62275F] hover:underline"
              title="Open in Google Maps"
            >
              <MapPin className="h-3.5 w-3.5 mr-0.5" />
              <ExternalLink className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>
      {exclusionReasons.length > 0 && (
        <div className="mt-2 pt-2 border-t border-amber-200">
          <div className="text-xs font-medium text-amber-800 mb-1">
            {included ? 'Reasons (context):' : 'Exclusion reasons (why not assigned):'}
          </div>
          <ul className="list-disc list-inside text-xs text-gray-700 space-y-0.5">
            {exclusionReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AutoAssignLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);

  const [filters, setFilters] = useState({
    orderId: '',
    dateFrom: null,
    dateTo: null,
  });
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [orderIdInput, setOrderIdInput] = useState('');

  const { toast } = useToast();

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(ITEMS_PER_PAGE));
      if (filters.orderId?.trim()) params.set('orderId', filters.orderId.trim());
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        from.setHours(0, 0, 0, 0);
        params.set('from', from.toISOString());
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        params.set('to', to.toISOString());
      }
      const url = `/api/ride-requests/admin/auto-assign-logs?${params.toString()}`;
      const res = await api.get(url);
      const data = res.data;
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotalItems(data.pagination?.totalItems ?? 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching auto-assign logs:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load auto-assign logs.',
        variant: 'destructive',
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters.orderId, filters.dateFrom, filters.dateTo, toast]);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [fetchLogs, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchLogs(page);
  };

  const applyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      orderId: orderIdInput.trim() || null,
      dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
      dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setOrderIdInput('');
    setDateRange({ from: undefined, to: undefined });
    setFilters({ orderId: '', dateFrom: null, dateTo: null });
    setCurrentPage(1);
  };

  const hasActiveFilters = orderIdInput.trim() || dateRange.from || dateRange.to;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-7 w-7" />
            Auto Assign Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ride requests created by auto-assign: order, time, expiry, and riders.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filter by order ID (UUID)"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="pl-9"
              />
            </div>
          </div>
          <div className="min-w-[240px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date range (requests created)</label>
            <DateRangePicker
              value={dateRange}
              onChange={(range) => setDateRange(range || { from: undefined, to: undefined })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={applyFilters}>Apply</Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-gray-500 flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No auto-assign logs found for the current filters.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Pickup location</TableHead>
                  <TableHead>Order created</TableHead>
                  <TableHead>Requests created</TableHead>
                  <TableHead>Expiry (min)</TableHead>
                  <TableHead>Riders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const isExpanded = expandedRow === log.orderId;
                  const riderCount = log.riders?.length ?? 0;
                  return (
                    <Fragment key={log.orderId}>
                      <TableRow
                        key={log.orderId}
                        className={riderCount > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}
                        onClick={() => riderCount > 0 && setExpandedRow(isExpanded ? null : log.orderId)}
                      >
                        <TableCell className="w-10">
                          {riderCount > 0 &&
                            (isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ))}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.orderNumber || log.orderId}</TableCell>
                        <TableCell className="text-gray-600 max-w-[200px]">
                          <PickupLocationCell log={log} />
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {log.orderCreatedAt
                            ? format(new Date(log.orderCreatedAt), 'yyyy-MM-dd HH:mm')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {log.rideRequestsCreatedAt
                            ? format(new Date(log.rideRequestsCreatedAt), 'yyyy-MM-dd HH:mm:ss')
                            : '—'}
                        </TableCell>
                        <TableCell>{log.requestExpiryMinutes ?? '—'}</TableCell>
                        <TableCell>
                          {riderCount === 0
                            ? '—'
                            : `${riderCount} rider${riderCount !== 1 ? 's' : ''}`}
                        </TableCell>
                      </TableRow>
                      {isExpanded && log.riders?.length > 0 && (
                        <TableRow key={`${log.orderId}-riders`} className="bg-gray-50">
                          <TableCell colSpan={7} className="p-4">
                            <div className="text-sm font-medium text-gray-700 mb-2">Pickup (for distance calc)</div>
                            <div className="mb-3 text-xs text-gray-600 flex items-center gap-1 flex-wrap">
                              <PickupLocationCell log={log} inline />
                            </div>
                            {log.debugRider && <DebugRiderBlock debugRider={log.debugRider} />}
                            <div className="text-sm font-medium text-gray-700 mb-2">Riders</div>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-gray-200">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Driver location (at assignment)</TableHead>
                                    <TableHead>Distance (km)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Expires at</TableHead>
                                    <TableHead className="font-mono text-xs">Ride request ID</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {log.riders.map((r, idx) => (
                                    <TableRow key={r.rideRequestId ?? r.riderId ?? idx} className="border-gray-100">
                                      <TableCell>
                                        {[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email || '—'}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">{r.phoneNumber || '—'}</TableCell>
                                      <TableCell className="max-w-[220px]">
                                        <DriverLocationCell rider={r} />
                                      </TableCell>
                                      <TableCell>{getRiderDistance(r) != null ? getRiderDistance(r) : '—'}</TableCell>
                                      <TableCell>
                                        <Badge variant={riderStatusColor[r.status] || 'secondary'}>
                                          {formatRiderStatus(r.status)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-gray-600">
                                        {r.expiresAt
                                          ? format(new Date(r.expiresAt), 'yyyy-MM-dd HH:mm')
                                          : '—'}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-gray-500" title={r.rideRequestId}>
                                        {r.rideRequestId ? `${r.rideRequestId.slice(0, 8)}…` : '—'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {!loading && totalItems > 0 && (
        <p className="text-sm text-gray-500">
          Showing page {currentPage} of {totalPages} ({totalItems} total log{totalItems !== 1 ? 's' : ''})
        </p>
      )}
    </div>
  );
}
