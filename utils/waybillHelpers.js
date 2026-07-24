export const WAYBILL_STATUSES = [
  'submitted',
  'under_review',
  'quoted',
  'accepted',
  'processing',
  'shipped',
  'delivered',
  'rejected',
  'cancelled',
];

export const PAYMENT_STATUSES = [
  'unpaid',
  'awaiting_payment',
  'paid',
  'refunded',
  'failed',
];

export const SHIPMENT_TYPES = ['domestic', 'inbound', 'outbound'];

export function formatNaira(amount, currency = 'NGN') {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  if (currency === 'NGN') return `₦${Number(amount).toLocaleString()}`;
  return `${currency} ${Number(amount).toLocaleString()}`;
}

export function formatWaybillStatus(status) {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getWaybillStatusColor(status) {
  const map = {
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-amber-100 text-amber-800',
    quoted: 'bg-purple-100 text-purple-800',
    accepted: 'bg-indigo-100 text-indigo-800',
    processing: 'bg-cyan-100 text-cyan-800',
    shipped: 'bg-teal-100 text-teal-800',
    delivered: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function getPaymentStatusColor(status) {
  const map = {
    unpaid: 'bg-gray-100 text-gray-700',
    awaiting_payment: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function formatShipmentType(type) {
  const map = {
    domestic: 'Domestic (NG → NG)',
    inbound: 'Inbound (International → Nigeria)',
    outbound: 'Outbound (Nigeria → International)',
  };
  return map[type] || type || '—';
}

export function formatLocation(request) {
  const origin = [request?.originCity, request?.originState, request?.originCountry]
    .filter(Boolean)
    .join(', ');
  const dest = [request?.destinationCity, request?.destinationState, request?.destinationCountry]
    .filter(Boolean)
    .join(', ');
  if (!origin && !dest) return '—';
  return `${origin || '?'} → ${dest || '?'}`;
}

export function formatContentsType(type) {
  return (type || '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const PRICING_FORMULA_STEPS = [
  'Location fee — domestic state rates and/or international country rates based on corridor',
  'Weight — flat fee from selected weight band + optional per-kg rate × exact weight',
  'Size — (base + location + weight) × size multiplier',
  'Extras — fragile surcharge (% of subtotal) + insurance (% of declared value)',
  'Clamp — final estimate bounded by minEstimate and maxEstimate',
];
