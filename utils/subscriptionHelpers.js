export const SUBSCRIPTION_STATUSES = [
  { value: 'pending', label: 'Pending payment' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'exhausted', label: 'Exhausted' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function formatNgn(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '—';
  return `₦${n.toLocaleString()}`;
}

export function formatSubscriptionStatus(status) {
  if (!status) return 'Unknown';
  return SUBSCRIPTION_STATUSES.find((s) => s.value === status)?.label
    || status.charAt(0).toUpperCase() + status.slice(1);
}

export function getSubscriptionStatusColor(status) {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-blue-100 text-blue-800',
    exhausted: 'bg-gray-100 text-gray-700',
    expired: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function formatPaymentStatus(status) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function subscriberName(sub) {
  const user = sub?.user || {};
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.name || user.fullName || user.email || '—';
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function toDateTimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
