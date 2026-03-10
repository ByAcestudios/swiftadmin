'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Map, RefreshCw, Users, Package, Circle, CircleOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

const POLL_INTERVAL_MS = 8000;
const DEFAULT_CENTER = [6.5244, 3.3792];

const BirdsEyeMap = dynamic(() => import('./BirdsEyeMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-lg bg-gray-200 animate-pulse flex items-center justify-center">
      <span className="text-gray-500">Loading map…</span>
    </div>
  ),
});

export default function BirdsEyePage() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [tripFilter, setTripFilter] = useState('all');
  const { toast } = useToast();

  const fetchRiders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (tripFilter && tripFilter !== 'all') params.set('trip', tripFilter);
      const url = `/api/admin/live-map/riders${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await api.get(url);
      setRiders(res.data.riders || []);
    } catch (err) {
      console.error('Birds eye fetch error:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load live riders.',
        variant: 'destructive',
      });
      setRiders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tripFilter, toast]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  useEffect(() => {
    const t = setInterval(fetchRiders, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchRiders]);

  const online = riders.filter((r) => r.status === 'online');
  const offline = riders.filter((r) => r.status !== 'online');
  const onTrip = riders.filter((r) => r.tripState === 'on_trip');
  const idle = riders.filter((r) => r.status === 'online' && r.tripState !== 'on_trip');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Map className="h-7 w-7" />
            Birds Eye View
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live map of drivers and deliveries. Updates every {POLL_INTERVAL_MS / 1000}s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tripFilter} onValueChange={setTripFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Trip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="on_trip">On trip</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => { setLoading(true); fetchRiders(); }} title="Refresh now">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">Total riders</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{riders.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-green-600">
            <Circle className="h-5 w-5" />
            <span className="text-sm font-medium">Online</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{online.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <Package className="h-5 w-5" />
            <span className="text-sm font-medium">On trip</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{onTrip.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <CircleOff className="h-5 w-5" />
            <span className="text-sm font-medium">Idle (online)</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{idle.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-500">Legend:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow" />
            Idle (online)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow" />
            On trip
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-400 border border-white shadow" />
            Offline
          </span>
        </div>
        <div className="h-[500px]">
          {loading && riders.length === 0 ? (
            <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500">Loading riders…</span>
            </div>
          ) : (
            <BirdsEyeMap riders={riders} center={DEFAULT_CENTER} zoom={12} />
          )}
        </div>
      </div>
    </div>
  );
}
