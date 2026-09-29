'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Can from '@/components/Can';
import { formatNgn } from '@/utils/subscriptionHelpers';

const emptyPlan = {
  slug: '',
  name: '',
  creditCount: '',
  price: '',
  deliveryRate: '',
  eligibilityNote: 'For businesses sending at least 7 orders a day.',
  active: true,
  sortOrder: '1',
};

export default function SubscriptionPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPlan);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/subscriptions/plans');
      setPlans(res.data?.plans || res.data?.data || []);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load plans.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyPlan);
    setOpen(true);
  };

  const startEdit = (plan) => {
    setEditing(plan);
    setForm({
      slug: plan.slug || '',
      name: plan.name || '',
      creditCount: String(plan.creditCount ?? ''),
      price: String(plan.price ?? ''),
      deliveryRate: String(plan.deliveryRate ?? ''),
      eligibilityNote: plan.eligibilityNote || '',
      active: plan.active !== false,
      sortOrder: String(plan.sortOrder ?? 1),
    });
    setOpen(true);
  };

  const save = async () => {
    const body = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      creditCount: Number(form.creditCount),
      price: Number(form.price),
      deliveryRate: Number(form.deliveryRate),
      eligibilityNote: form.eligibilityNote.trim(),
      active: form.active,
      sortOrder: Number(form.sortOrder) || 1,
    };
    if (!body.slug || !body.name || !body.creditCount || !body.price || !body.deliveryRate) {
      toast({ variant: 'destructive', description: 'Slug, name, credits, price, and rate are required.' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/api/admin/subscriptions/plans/${editing.id}`, body);
        toast({ description: 'Plan updated. Existing subscribers keep their own rate and price.' });
      } else {
        await api.post('/api/admin/subscriptions/plans', body);
        toast({ description: 'Plan created.' });
      }
      setOpen(false);
      fetchPlans();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Could not save plan.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/subscriptions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Subscribers
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Subscription plans</h1>
          <p className="text-sm text-muted-foreground">
            Changing a plan does not change people already subscribed.
          </p>
        </div>
        <Can module="subscriptions" action="create">
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New plan
          </Button>
        </Can>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-10">Loading plans…</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Plan</th>
                <th className="text-left p-3 font-medium">Credits</th>
                <th className="text-left p-3 font-medium">Price</th>
                <th className="text-left p-3 font-medium">Delivery rate</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.slug}</p>
                    {plan.eligibilityNote && (
                      <p className="text-xs text-muted-foreground mt-1">{plan.eligibilityNote}</p>
                    )}
                  </td>
                  <td className="p-3">{plan.creditCount}</td>
                  <td className="p-3">{formatNgn(plan.price)}</td>
                  <td className="p-3">{formatNgn(plan.deliveryRate)}</td>
                  <td className="p-3">
                    <Badge className={plan.active === false ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-800'}>
                      {plan.active === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Can module="subscriptions" action="edit">
                      <Button size="sm" variant="outline" onClick={() => startEdit(plan)}>Edit</Button>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit plan' : 'New plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input type="number" value={form.creditCount} onChange={(e) => setForm({ ...form, creditCount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price (₦)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rate (₦)</Label>
                <Input type="number" value={form.deliveryRate} onChange={(e) => setForm({ ...form, deliveryRate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Eligibility note</Label>
              <Textarea rows={2} value={form.eligibilityNote} onChange={(e) => setForm({ ...form, eligibilityNote: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: !!c })} />
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
