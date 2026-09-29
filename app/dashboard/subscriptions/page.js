'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronRight, Layers, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Can from '@/components/Can';
import Pagination from '../users/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import {
  SUBSCRIPTION_STATUSES,
  formatNgn,
  formatPaymentStatus,
  formatSubscriptionStatus,
  getSubscriptionStatusColor,
  subscriberName,
} from '@/utils/subscriptionHelpers';

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const debouncedUserQuery = useDebounce(userQuery, 300);
  const [assigning, setAssigning] = useState(false);
  const [form, setForm] = useState({
    planId: '',
    price: '',
    deliveryRate: '',
    creditsTotal: '',
    expiresAt: '',
    paymentStatus: 'paid',
    adminNote: '',
  });

  const fetchRows = useCallback(async (nextPage = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(nextPage));
      params.set('limit', '20');
      if (status !== 'all') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/api/admin/subscriptions?${params.toString()}`);
      const data = res.data;
      const list = data.data || data.subscriptions || [];
      setRows(list);
      const pag = data.pagination || {};
      setTotalPages(pag.totalPages ?? 1);
      setTotal(pag.total ?? list.length);
      setPage(nextPage);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Failed to load subscriptions.',
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, toast]);

  useEffect(() => {
    fetchRows(page);
  }, [fetchRows, page]);

  const openAssign = async () => {
    setAssignOpen(true);
    setSelectedUser(null);
    setUserQuery('');
    setUserResults([]);
    setForm({
      planId: '',
      price: '',
      deliveryRate: '',
      creditsTotal: '',
      expiresAt: '',
      paymentStatus: 'paid',
      adminNote: '',
    });
    try {
      const res = await api.get('/api/admin/subscriptions/plans');
      const list = res.data?.plans || res.data?.data || [];
      setPlans(list.filter((p) => p.active !== false));
    } catch {
      setPlans([]);
    }
  };

  useEffect(() => {
    if (!assignOpen) return undefined;
    const q = debouncedUserQuery.trim();
    const selectedLabel = selectedUser?.fullName || selectedUser?.email || '';
    if (!q || q.length < 2 || (selectedUser && (q === selectedLabel || q === selectedUser.email))) {
      setUserResults([]);
      setSearchingUsers(false);
      return undefined;
    }

    let cancelled = false;
    setSearchingUsers(true);
    api.get(`/api/users?search=${encodeURIComponent(q)}&page=1`)
      .then((res) => {
        if (!cancelled) setUserResults(res.data?.users || res.data?.data || []);
      })
      .catch(() => {
        if (!cancelled) setUserResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearchingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assignOpen, debouncedUserQuery, selectedUser]);

  const applyPlanDefaults = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    setForm((prev) => ({
      ...prev,
      planId,
      price: plan ? String(plan.price ?? '') : prev.price,
      deliveryRate: plan ? String(plan.deliveryRate ?? '') : prev.deliveryRate,
      creditsTotal: plan ? String(plan.creditCount ?? plan.creditsTotal ?? '') : prev.creditsTotal,
    }));
  };

  const submitAssign = async () => {
    if (!selectedUser?.id || !form.planId) {
      toast({ variant: 'destructive', description: 'Pick a user and a plan.' });
      return;
    }
    const body = {
      userId: selectedUser.id,
      planId: form.planId,
      paymentStatus: form.paymentStatus,
    };
    if (form.price !== '') body.price = Number(form.price);
    if (form.deliveryRate !== '') body.deliveryRate = Number(form.deliveryRate);
    if (form.creditsTotal !== '') body.creditsTotal = Number(form.creditsTotal);
    if (form.expiresAt) body.expiresAt = new Date(form.expiresAt).toISOString();
    if (form.adminNote.trim()) body.adminNote = form.adminNote.trim();

    setAssigning(true);
    try {
      await api.post('/api/admin/subscriptions/assign', body);
      toast({ description: 'Pack assigned.' });
      setAssignOpen(false);
      fetchRows(1);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Could not assign pack.',
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Prepaid delivery packs. Credits are not wallet money.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/subscriptions/plans">Plans</Link>
          </Button>
          <Can module="subscriptions" action="create">
            <Button onClick={openAssign}>
              <Plus className="h-4 w-4 mr-2" />
              Assign pack
            </Button>
          </Can>
        </div>
      </div>

      <form
        className="flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(searchInput);
          setPage(1);
        }}
      >
        <Input
          className="max-w-xs"
          placeholder="Search name or email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SUBSCRIPTION_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      {loading ? (
        <p className="text-muted-foreground py-10 text-center">Loading subscribers…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center border rounded-lg">No subscriptions yet.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Plan</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Credits</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Rate</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Payment</th>
                <th className="p-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((sub) => (
                <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link href={`/dashboard/subscriptions/${sub.id}`} className="font-medium hover:underline">
                      {subscriberName(sub)}
                    </Link>
                    <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                  </td>
                  <td className="p-3">{sub.plan?.name || sub.planName || '—'}</td>
                  <td className="p-3">
                    <Badge className={getSubscriptionStatusColor(sub.status)}>
                      {formatSubscriptionStatus(sub.status)}
                    </Badge>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {sub.creditsRemaining ?? '—'} / {sub.creditsTotal ?? '—'}
                  </td>
                  <td className="p-3 hidden lg:table-cell">{formatNgn(sub.deliveryRate)}</td>
                  <td className="p-3 hidden lg:table-cell">{formatPaymentStatus(sub.paymentStatus)}</td>
                  <td className="p-3">
                    <Link href={`/dashboard/subscriptions/${sub.id}`}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} />
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign a pack</DialogTitle>
            <DialogDescription>
              For clients who already paid offline. They can use Pay with subscription immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input
                placeholder="Start typing a name or email"
                value={userQuery}
                onChange={(e) => {
                  const next = e.target.value;
                  setUserQuery(next);
                  const selectedLabel = selectedUser?.fullName || selectedUser?.email || '';
                  if (selectedUser && next !== selectedLabel && next !== selectedUser.email) {
                    setSelectedUser(null);
                  }
                }}
                autoComplete="off"
              />
              {searchingUsers && (
                <p className="text-xs text-muted-foreground">Looking up customers…</p>
              )}
              {!searchingUsers && userResults.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {userResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => {
                        setSelectedUser(user);
                        setUserQuery(user.fullName || user.email);
                        setUserResults([]);
                      }}
                    >
                      {user.fullName || user.email}
                      <span className="text-muted-foreground"> · {user.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {!searchingUsers && debouncedUserQuery.trim().length >= 2 && !selectedUser && userResults.length === 0 && (
                <p className="text-xs text-muted-foreground">No customers match that.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={form.planId} onValueChange={applyPlanDefaults}>
                <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} · {plan.creditCount} credits · {formatNgn(plan.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Price (₦)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rate (₦)</Label>
                <Input type="number" value={form.deliveryRate} onChange={(e) => setForm({ ...form, deliveryRate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input type="number" value={form.creditsTotal} onChange={(e) => setForm({ ...form, creditsTotal: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Expires</Label>
                <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Pack fee</Label>
                <Select value={form.paymentStatus} onValueChange={(v) => setForm({ ...form, paymentStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid (collected)</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                rows={2}
                placeholder="Spoonful of Beauty — Dozen"
                value={form.adminNote}
                onChange={(e) => setForm({ ...form, adminNote: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={submitAssign} disabled={assigning}>
              {assigning ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
