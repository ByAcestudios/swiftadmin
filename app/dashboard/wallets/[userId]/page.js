'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Snowflake,
  Sun,
  PlusCircle,
  MinusCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import Can from '@/components/Can';
import {
  formatNgn,
  formatWalletStatus,
  getWalletStatusColor,
  getVaStatusColor,
  formatUserName,
  formatDate,
  formatTxnType,
  getTxnAmountColor,
  MAX_ADMIN_TOPUP,
} from '@/utils/walletHelpers';

function AmountDialog({
  open,
  onOpenChange,
  mode,
  loading,
  onSubmit,
}) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const isTopup = mode === 'topup';

  useEffect(() => {
    if (open) {
      setAmount('');
      setDescription('');
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return;
    if (isTopup && n > MAX_ADMIN_TOPUP) return;
    onSubmit({ amount: n, description: description.trim() || undefined });
  };

  const n = Number(amount);
  const overCap = isTopup && n > MAX_ADMIN_TOPUP;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isTopup ? 'Top up wallet' : 'Deduct from wallet'}</DialogTitle>
            <DialogDescription>
              {isTopup
                ? `Manual credit. Max ₦${MAX_ADMIN_TOPUP.toLocaleString()} per action.`
                : 'Manual debit. Fails if balance is insufficient.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                max={isTopup ? MAX_ADMIN_TOPUP : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
              {overCap && (
                <p className="text-xs text-red-600">
                  Amount exceeds the ₦{MAX_ADMIN_TOPUP.toLocaleString()} top-up cap.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder={isTopup ? 'Goodwill credit' : 'Correction'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !n || n <= 0 || overCap}
              variant={isTopup ? 'default' : 'destructive'}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : isTopup ? (
                'Credit wallet'
              ) : (
                'Deduct'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeardownDialog({ open, onOpenChange, loading, balance, onSubmit }) {
  const [deactivatePaystack, setDeactivatePaystack] = useState(true);
  const [removeVirtualAccount, setRemoveVirtualAccount] = useState(true);
  const [purgeWallet, setPurgeWallet] = useState(false);
  const [purgeTransactions, setPurgeTransactions] = useState(false);
  const [force, setForce] = useState(false);
  const hasBalance = Number(balance) > 0;

  useEffect(() => {
    if (open) {
      setDeactivatePaystack(true);
      setRemoveVirtualAccount(true);
      setPurgeWallet(false);
      setPurgeTransactions(false);
      setForce(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Teardown wallet</DialogTitle>
          <DialogDescription>
            Stops the virtual account from receiving transfers. Prefer closing over purging in
            production.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {hasBalance && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
              Balance is {formatNgn(balance)}. Deduct to zero first, or enable{' '}
              <strong>force</strong> to proceed.
            </p>
          )}

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={deactivatePaystack}
              onCheckedChange={(c) => setDeactivatePaystack(!!c)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Deactivate virtual account</span>
              <span className="block text-muted-foreground text-xs mt-0.5">
                Stops this account number from receiving transfers on Paystack. User can get a new
                number after teardown.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={removeVirtualAccount}
              onCheckedChange={(c) => setRemoveVirtualAccount(!!c)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Remove local virtual account</span>
              <span className="block text-muted-foreground text-xs mt-0.5">
                Deletes the VA row so the user can call wallet setup again.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={purgeWallet}
              onCheckedChange={(c) => {
                setPurgeWallet(!!c);
                if (!c) setPurgeTransactions(false);
              }}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Purge wallet (test only)</span>
              <span className="block text-muted-foreground text-xs mt-0.5">
                Removes wallet row so setup can be tested again. If off, wallet is closed and history
                kept.
              </span>
            </span>
          </label>

          {purgeWallet && (
            <label className="flex items-start gap-3 text-sm pl-6">
              <Checkbox
                checked={purgeTransactions}
                onCheckedChange={(c) => setPurgeTransactions(!!c)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Purge transactions</span>
                <span className="block text-muted-foreground text-xs mt-0.5">
                  Wipe ledger — avoid in production.
                </span>
              </span>
            </label>
          )}

          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={force}
              onCheckedChange={(c) => setForce(!!c)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Force</span>
              <span className="block text-muted-foreground text-xs mt-0.5">
                Allow close/purge when balance &gt; 0.
              </span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={loading || (hasBalance && !force)}
            onClick={() =>
              onSubmit({
                deactivatePaystack,
                removeVirtualAccount,
                purgeWallet,
                purgeTransactions: purgeWallet ? purgeTransactions : false,
                force,
              })
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Working…
              </>
            ) : (
              'Confirm teardown'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId;
  const { toast } = useToast();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [amountMode, setAmountMode] = useState(null);
  const [teardownOpen, setTeardownOpen] = useState(false);

  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!userId) return;
      if (!silent) setLoading(true);
      try {
        const res = await api.get(`/api/admin/wallets/${userId}`);
        const data = res.data;
        setPayload({
          wallet: data.wallet || data.data?.wallet || data,
          virtualAccount: data.virtualAccount || data.data?.virtualAccount || data.wallet?.virtualAccount,
          paystackDedicatedAccountId:
            data.paystackDedicatedAccountId || data.data?.paystackDedicatedAccountId,
          transactions: data.transactions || data.data?.transactions || [],
          user: data.user || data.wallet?.user || data.data?.user,
        });
      } catch (err) {
        toast({
          variant: 'destructive',
          description: err.response?.data?.message || 'Failed to load wallet.',
        });
        setPayload(null);
      } finally {
        setLoading(false);
      }
    },
    [userId, toast]
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const wallet = payload?.wallet;
  const va = payload?.virtualAccount;
  const user = payload?.user || wallet?.user;
  const transactions = payload?.transactions || [];

  const runAction = async (fn, successMsg) => {
    setActionLoading(true);
    try {
      await fn();
      toast({ description: successMsg });
      await fetchDetail(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Action failed.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAmountSubmit = async ({ amount, description }) => {
    const endpoint =
      amountMode === 'topup'
        ? `/api/admin/wallets/${userId}/topup`
        : `/api/admin/wallets/${userId}/deduct`;
    setActionLoading(true);
    try {
      await api.post(endpoint, { amount, description });
      toast({
        description:
          amountMode === 'topup'
            ? `Credited ${formatNgn(amount)}.`
            : `Deducted ${formatNgn(amount)}.`,
      });
      setAmountMode(null);
      await fetchDetail(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Could not update balance.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTeardown = async (body) => {
    setActionLoading(true);
    try {
      await api.delete(`/api/admin/wallets/${userId}`, { data: body });
      toast({ description: 'Wallet teardown completed.' });
      setTeardownOpen(false);
      if (body.purgeWallet) {
        router.push('/dashboard/wallets');
      } else {
        await fetchDetail(true);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        description: err.response?.data?.message || 'Teardown failed.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/wallets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to wallets
          </Link>
        </Button>
        <p className="text-muted-foreground">Wallet not found.</p>
      </div>
    );
  }

  const isFrozen = wallet.status === 'frozen';
  const isClosed = wallet.status === 'closed';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/wallets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All wallets
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{formatUserName(user)}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getWalletStatusColor(wallet.status)}>
              {formatWalletStatus(wallet.status)}
            </Badge>
            {user?.email && (
              <span className="text-sm text-muted-foreground">{user.email}</span>
            )}
            {user?.phoneNumber && (
              <span className="text-sm text-muted-foreground">· {user.phoneNumber}</span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchDetail(true)} disabled={actionLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Balance</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatNgn(wallet.balance)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime funded</CardDescription>
            <CardTitle className="text-xl tabular-nums text-green-700">
              {formatNgn(wallet.lifetimeFunded)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime spent</CardDescription>
            <CardTitle className="text-xl tabular-nums text-red-700">
              {formatNgn(wallet.lifetimeSpent)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Can module="wallets" action="create">
          <Button
            size="sm"
            disabled={actionLoading || isClosed}
            onClick={() => setAmountMode('topup')}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Top up
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={actionLoading || isClosed || Number(wallet.balance) <= 0}
            onClick={() => setAmountMode('deduct')}
          >
            <MinusCircle className="h-4 w-4 mr-2" />
            Deduct
          </Button>
        </Can>

        <Can module="wallets" action="edit">
          {isFrozen ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={actionLoading || isClosed}
              onClick={() =>
                runAction(
                  () => api.post(`/api/admin/wallets/${userId}/unfreeze`),
                  'Wallet unfrozen.'
                )
              }
            >
              <Sun className="h-4 w-4 mr-2" />
              Unfreeze
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={actionLoading || isClosed}
              onClick={() =>
                runAction(
                  () => api.post(`/api/admin/wallets/${userId}/freeze`),
                  'Wallet frozen — spending blocked.'
                )
              }
            >
              <Snowflake className="h-4 w-4 mr-2" />
              Freeze
            </Button>
          )}
        </Can>

        <Can module="wallets" action="delete">
          <Button
            size="sm"
            variant="destructive"
            disabled={actionLoading}
            onClick={() => setTeardownOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Teardown
          </Button>
        </Can>

        <Button size="sm" variant="ghost" asChild>
          <Link href="/dashboard/wallets/paystack">
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Paystack list
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Virtual account</CardTitle>
            <CardDescription>Dedicated NUBAN for bank transfers</CardDescription>
          </CardHeader>
          <CardContent>
            {va ? (
              <dl className="grid gap-2 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-32 shrink-0">Account number</dt>
                  <dd className="font-mono">{va.accountNumber}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-32 shrink-0">Account name</dt>
                  <dd>{va.accountName || '—'}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-32 shrink-0">Bank</dt>
                  <dd>{va.bankName || '—'}</dd>
                </div>
                <div className="flex gap-2 items-center">
                  <dt className="text-muted-foreground w-32 shrink-0">VA status</dt>
                  <dd>
                    <Badge className={getVaStatusColor(va.provisionStatus, va.active)}>
                      {va.provisionStatus || (va.active ? 'active' : 'inactive')}
                    </Badge>
                  </dd>
                </div>
                {payload.paystackDedicatedAccountId && (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground w-32 shrink-0">Paystack ID</dt>
                    <dd className="font-mono text-xs">{payload.paystackDedicatedAccountId}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No virtual account provisioned for this user.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Wallet meta</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-32 shrink-0">Wallet ID</dt>
                <dd className="font-mono text-xs break-all">{wallet.id}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-32 shrink-0">User ID</dt>
                <dd className="font-mono text-xs break-all">{wallet.userId || userId}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-32 shrink-0">Created</dt>
                <dd>{formatDate(wallet.createdAt)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-32 shrink-0">Updated</dt>
                <dd>{formatDate(wallet.updatedAt)}</dd>
              </div>
              {user?.id && (
                <div className="pt-2">
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link href={`/dashboard/users/${user.id}`}>Open user profile</Link>
                  </Button>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
          <CardDescription>Last {transactions.length || 50} ledger entries</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Description</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">Balance after</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b last:border-0">
                      <td className="p-3">{formatTxnType(txn.type || txn.transactionType)}</td>
                      <td
                        className={`p-3 font-medium tabular-nums ${getTxnAmountColor(
                          txn.type || txn.transactionType,
                          txn.amount
                        )}`}
                      >
                        {formatNgn(txn.amount)}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground max-w-[240px] truncate">
                        {txn.description || txn.narration || '—'}
                      </td>
                      <td className="p-3 hidden lg:table-cell tabular-nums text-muted-foreground">
                        {txn.balanceAfter != null
                          ? formatNgn(txn.balanceAfter)
                          : txn.balance != null
                            ? formatNgn(txn.balance)
                            : '—'}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(txn.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AmountDialog
        open={!!amountMode}
        onOpenChange={(open) => !open && setAmountMode(null)}
        mode={amountMode || 'topup'}
        loading={actionLoading}
        onSubmit={handleAmountSubmit}
      />

      <TeardownDialog
        open={teardownOpen}
        onOpenChange={setTeardownOpen}
        loading={actionLoading}
        balance={wallet.balance}
        onSubmit={handleTeardown}
      />
    </div>
  );
}
