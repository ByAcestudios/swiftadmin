'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Pause, Play, Trash2, AlertTriangle, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import CampaignForm from '../CampaignForm';
import {
  getCampaignStatusColor,
  formatCampaignStatus,
  formatDiscount,
  formatLocationRules,
  formatTargetingRules,
} from '@/utils/campaignHelpers';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.campaignId;

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [preview, setPreview] = useState({
    pickupAddress: '',
    lat: '',
    lng: '',
    orderAmount: '',
  });
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [campRes, statsRes] = await Promise.all([
        api.get(`/api/admin/campaigns/${id}`),
        api.get(`/api/admin/campaigns/${id}/stats`).catch(() => null),
      ]);
      const c = campRes.data.campaign || campRes.data;
      setCampaign(c);
      if (statsRes?.data) {
        setStats(statsRes.data.stats || null);
        setRecentRedemptions(statsRes.data.recentRedemptions || []);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load campaign.',
      });
      router.push('/dashboard/campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const handleToggle = async () => {
    try {
      await api.patch(`/api/admin/campaigns/${id}/toggle`);
      toast({ description: campaign.isActive ? 'Campaign paused.' : 'Campaign resumed.' });
      load();
    } catch (err) {
      toast({ variant: 'destructive', description: err.response?.data?.message || 'Failed to toggle.' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/admin/campaigns/${id}`);
      toast({ description: 'Campaign deleted.' });
      router.push('/dashboard/campaigns');
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Cannot delete (may have redemptions). Pause instead.',
      });
    } finally {
      setShowDelete(false);
    }
  };

  const runPreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewResult(null);
      const body = {
        campaignId: id,
        pickupAddress: preview.pickupAddress,
        orderAmount: parseFloat(preview.orderAmount) || 0,
      };
      if (preview.lat && preview.lng) {
        body.originCoordinates = [parseFloat(preview.lng), parseFloat(preview.lat)];
      }
      const res = await api.post('/api/admin/campaigns/preview-eligibility', body);
      setPreviewResult(res.data);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Preview failed.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading campaign…</div>;
  if (!campaign) return null;

  const status = campaign.computedStatus || (campaign.isActive ? 'active' : 'paused');

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/campaigns')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to campaigns
      </Button>

      {isEditing ? (
        <CampaignForm
          campaign={campaign}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            load();
          }}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Megaphone className="h-7 w-7" />
                {campaign.name}
              </h1>
              <Badge className={`mt-2 ${getCampaignStatusColor(status)}`}>
                {formatCampaignStatus(status)}
              </Badge>
              {campaign.description && (
                <p className="text-gray-600 mt-2 max-w-2xl">{campaign.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
              <Button variant="outline" onClick={handleToggle}>
                {campaign.isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" /> Resume
                  </>
                )}
              </Button>
              <Button variant="outline" className="text-red-600" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Discount</p>
              <p className="text-lg font-semibold text-[#62275F]">{formatDiscount(campaign)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Audience</p>
              <p className="text-lg font-semibold">{formatTargetingRules(campaign.targetingRules)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Region</p>
              <p className="text-lg font-semibold">{formatLocationRules(campaign.locationRules)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Redemptions</p>
              <p className="text-lg font-semibold">
                {campaign.usageCount ?? stats?.totalRedemptions ?? 0}
                {campaign.maxTotalUses != null ? ` / ${campaign.maxTotalUses}` : ''}
              </p>
            </div>
          </div>

          {stats && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total redemptions</p>
                  <p className="text-xl font-bold">{stats.totalRedemptions ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Unique users</p>
                  <p className="text-xl font-bold">{stats.uniqueUsers ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total discount given</p>
                  <p className="text-xl font-bold">₦{(stats.totalDiscountGiven ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining uses</p>
                  <p className="text-xl font-bold">
                    {stats.remainingUses != null ? stats.remainingUses : '∞'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {recentRedemptions.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <h2 className="text-lg font-semibold p-4 border-b">Recent redemptions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Discount</th>
                      <th className="text-left p-3">Order amount</th>
                      <th className="text-left p-3">Used at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRedemptions.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="p-3">
                          {r.user?.name || '—'}
                          {r.user?.email && (
                            <span className="block text-xs text-gray-500">{r.user.email}</span>
                          )}
                        </td>
                        <td className="p-3">₦{(r.discountAmount ?? 0).toLocaleString()}</td>
                        <td className="p-3">₦{(r.orderAmount ?? 0).toLocaleString()}</td>
                        <td className="p-3 text-gray-600">
                          {r.usedAt ? new Date(r.usedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-2">Preview eligibility</h2>
            <p className="text-sm text-gray-500 mb-4">
              Test if a pickup location and order amount would match this campaign (location only; user targeting not checked).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <Label>Pickup address</Label>
                <Input
                  value={preview.pickupAddress}
                  onChange={(e) => setPreview((p) => ({ ...p, pickupAddress: e.target.value }))}
                  placeholder="University of Lagos, Akoka, Lagos"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Order amount (₦)</Label>
                <Input
                  type="number"
                  value={preview.orderAmount}
                  onChange={(e) => setPreview((p) => ({ ...p, orderAmount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Lat (optional)</Label>
                <Input value={preview.lat} onChange={(e) => setPreview((p) => ({ ...p, lat: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Lng (optional)</Label>
                <Input value={preview.lng} onChange={(e) => setPreview((p) => ({ ...p, lng: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <Button className="mt-4" onClick={runPreview} disabled={previewLoading}>
              {previewLoading ? 'Checking…' : 'Run preview'}
            </Button>
            {previewResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm space-y-1">
                <p>
                  <strong>Location match:</strong>{' '}
                  {previewResult.locationMatch ? (
                    <span className="text-green-600">Yes</span>
                  ) : (
                    <span className="text-red-600">No</span>
                  )}
                </p>
                {previewResult.sampleDiscount != null && (
                  <p>
                    <strong>Sample discount:</strong> ₦{Number(previewResult.sampleDiscount).toLocaleString()}
                  </p>
                )}
                {previewResult.note && <p className="text-gray-600">{previewResult.note}</p>}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete campaign
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-4">
            Delete <strong>{campaign.name}</strong>? Only allowed when usage count is zero. Otherwise pause the campaign.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
