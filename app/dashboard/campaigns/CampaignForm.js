'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { defaultCampaignForm, campaignToForm, formToPayload } from '@/utils/campaignHelpers';

export default function CampaignForm({ campaign, onClose, onSuccess }) {
  const isEdit = !!campaign?.id;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(() => (campaign ? campaignToForm(campaign) : defaultCampaignForm()));

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateZone = (index, field, value) => {
    setForm((prev) => {
      const zones = [...prev.pickupZones];
      zones[index] = { ...zones[index], [field]: value };
      return { ...prev, pickupZones: zones };
    });
  };

  const addZone = () => {
    setForm((prev) => ({
      ...prev,
      pickupZones: [...prev.pickupZones, { name: '', lat: '', lng: '', radiusKm: '2' }],
    }));
  };

  const removeZone = (index) => {
    setForm((prev) => ({
      ...prev,
      pickupZones: prev.pickupZones.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ variant: 'destructive', description: 'Campaign name is required.' });
      return;
    }
    if (!form.discountValue || !form.startDate || !form.endDate) {
      toast({ variant: 'destructive', description: 'Discount, start date, and end date are required.' });
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = formToPayload(form);
      if (isEdit) {
        await api.put(`/api/admin/campaigns/${campaign.id}`, payload);
        toast({ description: 'Campaign updated successfully.' });
      } else {
        await api.post('/api/admin/campaigns', payload);
        toast({ description: 'Campaign created successfully.' });
      }
      onSuccess?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to save campaign.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          {isEdit ? 'Edit campaign' : 'Create campaign'}
        </h2>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Lagos University Activation" className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className="mt-1" />
        </div>
        <div>
          <Label>Discount type *</Label>
          <Select value={form.discountType} onValueChange={(v) => set('discountType', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="flat">Flat amount (₦)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{form.discountType === 'percentage' ? 'Discount % *' : 'Discount amount (₦) *'}</Label>
          <Input type="number" min="0" value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} className="mt-1" />
        </div>
        {form.discountType === 'percentage' && (
          <div>
            <Label>Max discount cap (₦)</Label>
            <Input type="number" min="0" value={form.maxDiscountAmount} onChange={(e) => set('maxDiscountAmount', e.target.value)} placeholder="e.g. 2000" className="mt-1" />
          </div>
        )}
        <div>
          <Label>Min order amount (₦)</Label>
          <Input type="number" min="0" value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Start date *</Label>
          <Input type="datetime-local" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>End date *</Label>
          <Input type="datetime-local" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Max uses per user</Label>
          <Input type="number" min="1" value={form.maxUsesPerUser} onChange={(e) => set('maxUsesPerUser', e.target.value)} placeholder="Leave empty = unlimited" className="mt-1" />
        </div>
        <div>
          <Label>Max total uses</Label>
          <Input type="number" min="1" value={form.maxTotalUses} onChange={(e) => set('maxTotalUses', e.target.value)} placeholder="Leave empty = unlimited" className="mt-1" />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-800 mb-3">Who qualifies (targeting)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Audience</Label>
            <Select value={form.targetingAudience} onValueChange={(v) => set('targetingAudience', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="first_order">First order only</SelectItem>
                <SelectItem value="nth_order">Specific order number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.targetingAudience === 'nth_order' && (
            <div>
              <Label>Order number (e.g. 2 = 2nd order)</Label>
              <Input type="number" min="2" value={form.targetingOrderNumber} onChange={(e) => set('targetingOrderNumber', e.target.value)} className="mt-1" />
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-800 mb-3">Region / location</h3>
        <div className="space-y-4">
          <div>
            <Label>Location rule</Label>
            <Select value={form.locationType} onValueChange={(v) => set('locationType', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="everywhere">Everywhere</SelectItem>
                <SelectItem value="states">States (address contains)</SelectItem>
                <SelectItem value="cities">Cities / areas (address contains)</SelectItem>
                <SelectItem value="pickup_zones">Pickup zones (coordinates)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(form.locationType === 'states' || form.locationType === 'cities') && (
            <div>
              <Label>{form.locationType === 'states' ? 'State names' : 'City / area names'} (comma-separated)</Label>
              <Input value={form.locationStrings} onChange={(e) => set('locationStrings', e.target.value)} placeholder="Lagos, Abuja, Ikeja" className="mt-1" />
              <p className="text-xs text-gray-500 mt-1">Matched case-insensitively against pickup address.</p>
            </div>
          )}
          {form.locationType === 'pickup_zones' && (
            <div className="space-y-3">
              {form.pickupZones.map((zone, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end p-3 bg-gray-50 rounded-md">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Zone name</Label>
                    <Input value={zone.name} onChange={(e) => updateZone(i, 'name', e.target.value)} placeholder="UNILAG" />
                  </div>
                  <div>
                    <Label className="text-xs">Lat</Label>
                    <Input value={zone.lat} onChange={(e) => updateZone(i, 'lat', e.target.value)} placeholder="6.5158" />
                  </div>
                  <div>
                    <Label className="text-xs">Lng</Label>
                    <Input value={zone.lng} onChange={(e) => updateZone(i, 'lng', e.target.value)} placeholder="3.3898" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Radius (km)</Label>
                      <Input value={zone.radiusKm} onChange={(e) => updateZone(i, 'radiusKm', e.target.value)} />
                    </div>
                    {form.pickupZones.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => removeZone(i)} className="mt-5">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addZone}>
                <Plus className="h-4 w-4 mr-2" /> Add zone
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[#733E70] hover:bg-[#62275F] text-white">
          {isSubmitting ? 'Saving…' : isEdit ? 'Update campaign' : 'Create campaign'}
        </Button>
      </div>
    </form>
  );
}
