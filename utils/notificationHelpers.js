export const BLAST_TYPES = [
  { value: 'PROMO', label: 'Promotion', description: 'Campaigns, discounts, promos' },
  { value: 'SYSTEM', label: 'System', description: 'Feature announcements, maintenance' },
  { value: 'PAYMENT', label: 'Payment', description: 'Payment-related alerts' },
];

export const BLAST_STATUSES = ['pending', 'processing', 'completed', 'failed'];

export function formatBlastType(type) {
  return BLAST_TYPES.find((t) => t.value === type)?.label || type || '—';
}

export function formatBlastStatus(status) {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getBlastStatusColor(status) {
  const map = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export function buildBlastPayload(form) {
  const audience = {};

  if (form.appsMode === 'all') {
    audience.apps = 'all';
  } else {
    const apps = [];
    if (form.appsUser) apps.push('user');
    if (form.appsRider) apps.push('rider');
    audience.apps = apps.length === 1 ? apps[0] : apps;
  }

  if (form.platformsMode === 'all') {
    audience.platforms = 'all';
  } else {
    const platforms = [];
    if (form.platformAndroid) platforms.push('android');
    if (form.platformIos) platforms.push('ios');
    audience.platforms = platforms.length === 1 ? platforms[0] : platforms;
  }

  if (form.targetMode === 'include' && form.emails.length) {
    audience.emails = form.emails;
  }
  if (form.targetMode === 'exclude' && form.excludeEmails.length) {
    audience.excludeEmails = form.excludeEmails;
  }

  const payload = {
    title: form.title.trim(),
    message: form.message.trim(),
    type: form.type,
    audience,
  };

  const metadata = {};
  if (form.deepLink?.trim()) metadata.deepLink = form.deepLink.trim();
  if (form.campaignId?.trim()) metadata.campaignId = form.campaignId.trim();
  if (Object.keys(metadata).length) payload.metadata = metadata;

  return payload;
}

export const defaultBlastForm = () => ({
  title: '',
  message: '',
  type: 'PROMO',
  appsMode: 'all',
  appsUser: true,
  appsRider: true,
  platformsMode: 'all',
  platformAndroid: true,
  platformIos: true,
  targetMode: 'all',
  emails: [],
  excludeEmails: [],
  deepLink: '',
  campaignId: '',
  emailInput: '',
  excludeEmailInput: '',
});
