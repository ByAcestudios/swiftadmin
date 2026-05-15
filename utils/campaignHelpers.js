export const CAMPAIGN_STATUSES = ['active', 'scheduled', 'expired', 'paused', 'exhausted'];

export function getCampaignStatusColor(status) {
  const map = {
    active: 'bg-green-100 text-green-800 border-green-200',
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    expired: 'bg-gray-100 text-gray-700 border-gray-200',
    paused: 'bg-amber-100 text-amber-800 border-amber-200',
    exhausted: 'bg-red-100 text-red-800 border-red-200',
  };
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-200';
}

export function formatCampaignStatus(status) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatDiscount(campaign) {
  if (!campaign) return '—';
  if (campaign.discountType === 'flat') {
    return `₦${Number(campaign.discountValue).toLocaleString()} off`;
  }
  const cap = campaign.maxDiscountAmount
    ? ` (max ₦${Number(campaign.maxDiscountAmount).toLocaleString()})`
    : '';
  return `${campaign.discountValue}% off${cap}`;
}

export function formatLocationRules(rules) {
  if (!rules || rules.type === 'everywhere') return 'Everywhere';
  if (rules.type === 'states') return `States: ${(rules.locations || []).join(', ') || '—'}`;
  if (rules.type === 'cities') return `Cities: ${(rules.locations || []).join(', ') || '—'}`;
  if (rules.type === 'pickup_zones') {
    const n = (rules.locations || []).length;
    return `${n} pickup zone${n !== 1 ? 's' : ''}`;
  }
  return rules.type || '—';
}

export function formatTargetingRules(rules) {
  if (!rules) return 'Everyone';
  if (rules.audience === 'all') return 'Everyone';
  if (rules.audience === 'first_order') return 'First order only';
  if (rules.audience === 'nth_order') return `Order #${rules.orderNumber || '?'}`;
  return rules.audience || '—';
}

export const defaultCampaignForm = () => ({
  name: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  startDate: '',
  endDate: '',
  targetingAudience: 'all',
  targetingOrderNumber: '2',
  locationType: 'everywhere',
  locationStrings: '',
  pickupZones: [{ name: '', lat: '', lng: '', radiusKm: '2' }],
  maxUsesPerUser: '',
  maxTotalUses: '',
});

export function campaignToForm(campaign) {
  if (!campaign) return defaultCampaignForm();
  const tr = campaign.targetingRules || { audience: 'all' };
  const lr = campaign.locationRules || { type: 'everywhere', locations: [] };
  let locationStrings = '';
  let pickupZones = [{ name: '', lat: '', lng: '', radiusKm: '2' }];
  if (lr.type === 'states' || lr.type === 'cities') {
    locationStrings = (lr.locations || []).join(', ');
  } else if (lr.type === 'pickup_zones' && lr.locations?.length) {
    pickupZones = lr.locations.map((z) => ({
      name: z.name || '',
      lat: z.lat != null ? String(z.lat) : '',
      lng: z.lng != null ? String(z.lng) : '',
      radiusKm: z.radiusKm != null ? String(z.radiusKm) : '2',
    }));
  }
  return {
    name: campaign.name || '',
    description: campaign.description || '',
    discountType: campaign.discountType || 'percentage',
    discountValue: campaign.discountValue != null ? String(campaign.discountValue) : '',
    maxDiscountAmount: campaign.maxDiscountAmount != null ? String(campaign.maxDiscountAmount) : '',
    minOrderAmount: campaign.minOrderAmount != null ? String(campaign.minOrderAmount) : '',
    startDate: campaign.startDate ? campaign.startDate.slice(0, 16) : '',
    endDate: campaign.endDate ? campaign.endDate.slice(0, 16) : '',
    targetingAudience: tr.audience || 'all',
    targetingOrderNumber: tr.orderNumber != null ? String(tr.orderNumber) : '2',
    locationType: lr.type || 'everywhere',
    locationStrings,
    pickupZones,
    maxUsesPerUser: campaign.maxUsesPerUser != null ? String(campaign.maxUsesPerUser) : '',
    maxTotalUses: campaign.maxTotalUses != null ? String(campaign.maxTotalUses) : '',
  };
}

export function formToPayload(form) {
  const targetingRules =
    form.targetingAudience === 'nth_order'
      ? { audience: 'nth_order', orderNumber: parseInt(form.targetingOrderNumber, 10) || 2 }
      : { audience: form.targetingAudience };

  let locationRules = { type: 'everywhere' };
  if (form.locationType === 'states' || form.locationType === 'cities') {
    const locations = form.locationStrings
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    locationRules = { type: form.locationType, locations };
  } else if (form.locationType === 'pickup_zones') {
    const locations = (form.pickupZones || [])
      .filter((z) => z.name?.trim() && z.lat !== '' && z.lng !== '')
      .map((z) => ({
        name: z.name.trim(),
        lat: parseFloat(z.lat),
        lng: parseFloat(z.lng),
        radiusKm: parseFloat(z.radiusKm) || 2,
      }));
    locationRules = { type: 'pickup_zones', locations };
  }

  const payload = {
    name: form.name.trim(),
    description: form.description?.trim() || undefined,
    discountType: form.discountType,
    discountValue: parseFloat(form.discountValue),
    minOrderAmount: form.minOrderAmount !== '' ? parseFloat(form.minOrderAmount) : undefined,
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString(),
    targetingRules,
    locationRules,
  };

  if (form.discountType === 'percentage' && form.maxDiscountAmount !== '') {
    payload.maxDiscountAmount = parseFloat(form.maxDiscountAmount);
  }
  if (form.maxUsesPerUser !== '') payload.maxUsesPerUser = parseInt(form.maxUsesPerUser, 10);
  if (form.maxTotalUses !== '') payload.maxTotalUses = parseInt(form.maxTotalUses, 10);

  return payload;
}
