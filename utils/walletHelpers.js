export const WALLET_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'closed', label: 'Closed' },
];

export const MAX_ADMIN_TOPUP = 5_000_000;

export function formatNgn(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '₦0.00';
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatWalletStatus(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getWalletStatusColor(status) {
  const map = {
    active: 'bg-green-100 text-green-800',
    frozen: 'bg-amber-100 text-amber-800',
    closed: 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function getVaStatusColor(provisionStatus, active) {
  if (active === false || provisionStatus === 'inactive' || provisionStatus === 'deactivated') {
    return 'bg-gray-100 text-gray-700';
  }
  if (provisionStatus === 'active') return 'bg-green-100 text-green-800';
  if (provisionStatus === 'pending') return 'bg-amber-100 text-amber-800';
  return 'bg-blue-100 text-blue-800';
}

export function formatUserName(user) {
  if (!user) return '—';
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email || '—';
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function formatTxnType(type) {
  if (!type) return '—';
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getTxnAmountColor(type, amount) {
  const t = String(type || '').toLowerCase();
  const n = Number(amount);
  if (t.includes('credit') || t.includes('topup') || t.includes('fund') || t.includes('deposit')) {
    return 'text-green-700';
  }
  if (t.includes('debit') || t.includes('deduct') || t.includes('spend') || t.includes('payment')) {
    return 'text-red-700';
  }
  return n < 0 ? 'text-red-700' : 'text-green-700';
}

/** Normalize API transaction payloads that may be array | { data } | { rows }. */
export function normalizeTransactions(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.transactions)) return raw.transactions;
  return [];
}
