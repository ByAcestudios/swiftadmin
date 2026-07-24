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
import { Plus, Search, X, Megaphone, Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Can from '@/components/Can';
import Pagination from '../users/Pagination';
import CampaignForm from './CampaignForm';
import {
  getCampaignStatusColor,
  formatCampaignStatus,
  formatDiscount,
  formatLocationRules,
  formatTargetingRules,
} from '@/utils/campaignHelpers';

export default function CampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const fetchCampaigns = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.search?.trim()) params.set('search', filters.search.trim());
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      const res = await api.get(`/api/admin/campaigns?${params.toString()}`);
      const data = res.data;
      setCampaigns(data.campaigns || data.data || []);
      const pag = data.pagination || data.metadata || {};
      setTotalPages(pag.totalPages ?? 1);
      setTotalItems(pag.totalItems ?? pag.totalCampaigns ?? (data.campaigns || data.data || []).length);
      setCurrentPage(page);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load campaigns.',
      });
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchCampaigns(currentPage);
  }, [fetchCampaigns, currentPage]);

  const handleToggle = async (e, campaign) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.patch(`/api/admin/campaigns/${campaign.id}/toggle`);
      toast({ description: campaign.isActive ? 'Campaign paused.' : 'Campaign resumed.' });
      fetchCampaigns(currentPage);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to update campaign.',
      });
    }
  };

  const hasActiveFilters = filters.status !== 'all' || filters.search?.trim();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="h-7 w-7" />
            Campaigns
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Automatic promotions by region and audience — no coupon code needed.
          </p>
        </div>
        {!isCreating && !editingCampaign && (
          <Can module="campaigns" action="create">
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-[#733E70] hover:bg-[#62275F] text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create campaign
            </Button>
          </Can>
        )}
      </div>

      {isCreating ? (
        <CampaignForm
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false);
            fetchCampaigns(1);
          }}
        />
      ) : editingCampaign ? (
        <CampaignForm
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSuccess={() => {
            setEditingCampaign(null);
            fetchCampaigns(currentPage);
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns…"
                className="pl-8"
                value={filters.search}
                onChange={(e) => {
                  setFilters((p) => ({ ...p, search: e.target.value }));
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(v) => {
                setFilters((p) => ({ ...p, status: v }));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="exhausted">Exhausted</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sortBy}
              onValueChange={(v) => setFilters((p) => ({ ...p, sortBy: v }))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="startDate">Start date</SelectItem>
                <SelectItem value="endDate">End date</SelectItem>
                <SelectItem value="usageCount">Usage</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({ status: 'all', search: '', sortBy: 'createdAt', sortOrder: 'DESC' });
                  setCurrentPage(1);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="relative min-h-[200px]">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-lg">
                <span className="text-sm text-gray-500">Loading campaigns…</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!loading && campaigns.length === 0 && (
                <p className="col-span-full text-center text-gray-500 py-12">
                  No campaigns found. Create one to start regional promotions.
                </p>
              )}
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col"
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <Link href={`/dashboard/campaigns/${c.id}`} className="group flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[#62275F] truncate">
                        {c.name}
                      </h3>
                    </Link>
                    <Badge className={getCampaignStatusColor(c.computedStatus || (c.isActive ? 'active' : 'paused'))}>
                      {formatCampaignStatus(c.computedStatus || (c.isActive ? 'active' : 'paused'))}
                    </Badge>
                  </div>
                  {c.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>
                  )}
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-[#62275F]">{formatDiscount(c)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Audience</span>
                      <span>{formatTargetingRules(c.targetingRules)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region</span>
                      <span className="text-right max-w-[55%] truncate" title={formatLocationRules(c.locationRules)}>
                        {formatLocationRules(c.locationRules)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uses</span>
                      <span>
                        {c.usageCount ?? 0}
                        {c.maxTotalUses != null ? ` / ${c.maxTotalUses}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingCampaign(c)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleToggle(e, c)}
                      title={c.isActive ? 'Pause' : 'Resume'}
                    >
                      {c.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/campaigns/${c.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={fetchCampaigns} />
          )}
          {totalItems > 0 && (
            <p className="text-sm text-gray-500 text-center">
              {totalItems} campaign{totalItems !== 1 ? 's' : ''} total
            </p>
          )}
        </>
      )}
    </div>
  );
}
