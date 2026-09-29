'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Can from '@/components/Can';
import {
  SUBSCRIPTION_STATUSES,
  formatDate,
  formatNgn,
  formatPaymentStatus,
  formatSubscriptionStatus,
  getSubscriptionStatusColor,
  subscriberName,
  toDateTimeLocal,
} from '@/utils/subscriptionHelpers';

export default function SubscriptionDetailPage() {
  const { subscriptionId } = useParams();
  const { toast } = useToast();
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creditAmount, setCreditAmount] = useState('1');
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [detailRes, plansRes] = await Promise.all([
        api.get(`/api/admin/subscriptions/${subscriptionId}`),
        api.get('/api/admin/subscriptions/plans').catch(() => ({ data: {} })),
      ]);
      const record = detailRes.data?.subscription || detailRes.data?.data || detailRes.data;
      setSub(record);
      setPlans(plansRes.data?.plans || plansRes.data?.data || []);
      setForm({
        planId: record.planId || record.plan?.id || '',
        price: record.price ?? '',
        deliveryRate: record.deliveryRate ?? '',
        creditsTotal: record.creditsTotal ?? '',
        expiresAt: toDateTimeLocal(record.expiresAt),
        paymentStatus: record.paymentStatus || 'unpaid',
        status: record.status || 'active',
        adminNote: record.adminNote || '',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load subscription.',
      });
      setSub(null);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body, message) => {
    setSaving(true);
    try {
      await api.patch(`/api/admin/subscriptions/${subscriptionId}`, body);
      toast({ description: message });
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Update failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = () => {
    if (!form) return;
    const body = {
      price: Number(form.price),
      deliveryRate: Number(form.deliveryRate),
      creditsTotal: Number(form.creditsTotal),
      paymentStatus: form.paymentStatus,
      status: form.status,
      adminNote: form.adminNote,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    if (form.planId) body.planId = form.planId;
    patch(body, 'Subscription updated.');
  };

  const addCredits = async () => {
    const amount = Number(creditAmount);
    if (!amount) return;
    setSaving(true);
    try {
      await api.post(`/api/admin/subscriptions/${subscriptionId}/credits`, { amount });
      toast({ description: `Added ${amount} credit${amount === 1 ? '' : 's'}.` });
      setCreditAmount('1');
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Could not add credits.',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmPaid = async () => {
    setSaving(true);
    try {
      await api.post(`/api/admin/subscriptions/${subscriptionId}/confirm`);
      toast({ description: 'Pack activated.' });
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Could not confirm payment.',
      });
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    setSaving(true);
    try {
      await api.post(`/api/admin/subscriptions/${subscriptionId}/reject`, {
        reason: rejectReason.trim() || undefined,
      });
      toast({ description: 'Checkout rejected.' });
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Could not reject.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sub || !form) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-muted-foreground">Subscription not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/subscriptions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Subscribers
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{subscriberName(sub)}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge className={getSubscriptionStatusColor(sub.status)}>
            {formatSubscriptionStatus(sub.status)}
          </Badge>
          <span>{sub.user?.email}</span>
          <span>· {sub.plan?.name || 'Custom pack'}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Credits left</CardDescription></CardHeader>
          <CardContent className="text-2xl font-bold">
            {sub.creditsRemaining ?? '—'} <span className="text-base font-normal text-muted-foreground">/ {sub.creditsTotal}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Delivery rate</CardDescription></CardHeader>
          <CardContent className="text-2xl font-bold">{formatNgn(sub.deliveryRate)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Pack price</CardDescription></CardHeader>
          <CardContent className="text-2xl font-bold">{formatNgn(sub.price)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Pack fee</CardDescription></CardHeader>
          <CardContent className="text-2xl font-bold">{formatPaymentStatus(sub.paymentStatus)}</CardContent>
        </Card>
      </div>

      <Can module="subscriptions" action="edit">
        <div className="flex flex-wrap gap-2">
          {sub.status === 'active' && (
            <Button variant="secondary" disabled={saving} onClick={() => patch({ status: 'paused' }, 'Paused.')}>
              Pause
            </Button>
          )}
          {sub.status === 'paused' && (
            <Button variant="secondary" disabled={saving} onClick={() => patch({ status: 'active' }, 'Resumed.')}>
              Resume
            </Button>
          )}
          {sub.status !== 'cancelled' && (
            <Button variant="outline" disabled={saving} onClick={() => patch({ status: 'cancelled' }, 'Cancelled.')}>
              Cancel pack
            </Button>
          )}
        </div>
      </Can>

      {sub.status === 'pending' && (
        <Can module="subscriptions" action="create">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Unpaid checkout</CardTitle>
              <CardDescription>
                Activate without Paystack if you already collected the pack fee, or reject the checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Button disabled={saving} onClick={confirmPaid}>Confirm payment</Button>
              <Input
                placeholder="Reject reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Button variant="destructive" disabled={saving} onClick={reject}>Reject</Button>
            </CardContent>
          </Card>
        </Can>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms on this subscriber</CardTitle>
            <CardDescription>
              These values were copied from the plan. Editing them does not change the plan itself.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={form.planId || 'none'} onValueChange={(v) => setForm({ ...form, planId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keep current</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price (₦)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Delivery rate (₦)</Label>
                <Input type="number" value={form.deliveryRate} onChange={(e) => setForm({ ...form, deliveryRate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Credits total</Label>
                <Input type="number" value={form.creditsTotal} onChange={(e) => setForm({ ...form, creditsTotal: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expires</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              <p className="text-xs text-muted-foreground">Leave empty for no expiry.</p>
            </div>
            <div className="space-y-2">
              <Label>Pack fee record</Label>
              <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admin note</Label>
              <Textarea rows={2} value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })} />
            </div>
            <Can module="subscriptions" action="edit">
              <Button onClick={saveDetails} disabled={saving}>Save changes</Button>
            </Can>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add credits</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                type="number"
                min="1"
                className="max-w-[120px]"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
              <Can module="subscriptions" action="edit">
                <Button variant="outline" disabled={saving} onClick={addCredits}>Add</Button>
              </Can>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">Created: </span>{formatDate(sub.createdAt)}</p>
              <p><span className="text-muted-foreground">Expires: </span>{formatDate(sub.expiresAt)}</p>
              {sub.user?.id && (
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={`/dashboard/users/${sub.user.id}`}>Open user profile</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
