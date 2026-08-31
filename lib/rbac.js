import {
  LayoutDashboard,
  ShoppingCart,
  Globe,
  Users,
  Bike,
  Tag,
  Megaphone,
  Wallet,
  UserCircle,
  Settings,
  Users2,
  Bell,
  Receipt,
  Package,
} from 'lucide-react';

export const ACTIONS = ['view', 'create', 'edit', 'delete', 'export'];

export const MODULE_KEYS = [
  'dashboard',
  'orders',
  'birds_eye',
  'riders',
  'bikes',
  'coupons',
  'campaigns',
  'finance',
  'users',
  'settings',
  'notifications',
  'transactions',
  'team',
  'waybill',
];

const LEGACY_MODULES = MODULE_KEYS.filter((key) => key !== 'team');

export const MODULE_LABELS = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  birds_eye: 'Birds Eye View',
  riders: 'Riders',
  bikes: 'Bikes',
  coupons: 'Coupons',
  campaigns: 'Promotions',
  finance: 'Finance',
  users: 'Users',
  settings: 'Settings',
  notifications: 'Push Blasts',
  transactions: 'Transactions',
  team: 'Team & Roles',
  waybill: 'Waybill',
};

const MODULE_SIDEBAR = {
  dashboard: {
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  orders: {
    href: '/dashboard/orders',
    icon: ShoppingCart,
    subItems: [
      { name: 'All Orders', href: '/dashboard/orders' },
      { name: 'Assigned Orders', href: '/dashboard/orders/assigned' },
      { name: 'Unassigned Orders', href: '/dashboard/orders/unassigned' },
      { name: 'Auto Assign Logs', href: '/dashboard/auto-assign-logs' },
    ],
  },
  birds_eye: {
    href: '/dashboard/birds-eye',
    icon: Globe,
  },
  riders: {
    href: '/dashboard/riders',
    icon: Users,
  },
  bikes: {
    href: '/dashboard/bikes',
    icon: Bike,
  },
  coupons: {
    href: '/dashboard/coupons',
    icon: Tag,
  },
  campaigns: {
    href: '/dashboard/campaigns',
    icon: Megaphone,
    subItems: [{ name: 'Campaigns', href: '/dashboard/campaigns' }],
  },
  finance: {
    href: '/dashboard/finance',
    icon: Wallet,
  },
  users: {
    href: '/dashboard/users',
    icon: UserCircle,
    subItems: [{ name: 'All Users', href: '/dashboard/users' }],
  },
  settings: {
    href: '/dashboard/settings',
    icon: Settings,
    subItems: [
      { name: 'Order Management', href: '/dashboard/settings#order-management' },
      { name: 'Delivery Restrictions', href: '/dashboard/settings#delivery-restrictions' },
      { name: 'App Version Control', href: '/dashboard/settings#app-version-control' },
      { name: 'Admin Notifications', href: '/dashboard/settings#admin-notifications' },
    ],
  },
  notifications: {
    href: '/dashboard/notifications',
    icon: Bell,
    subItems: [
      { name: 'Compose Blast', href: '/dashboard/notifications' },
      { name: 'Blast History', href: '/dashboard/notifications/history' },
    ],
  },
  transactions: {
    href: '/dashboard/transactions',
    icon: Receipt,
    inSidebar: false,
  },
  team: {
    href: '/dashboard/team',
    icon: Users2,
    superAdminOnly: true,
  },
  waybill: {
    href: '/dashboard/waybill',
    icon: Package,
    subItems: [
      { name: 'Requests', href: '/dashboard/waybill' },
      { name: 'Pricing & Areas', href: '/dashboard/waybill/settings' },
    ],
  },
};

export function isAdminRole(role) {
  return role === 'admin' || role === 'sub-admin';
}

export function getModuleForPath(pathname) {
  if (!pathname?.startsWith('/dashboard')) return null;
  if (pathname === '/dashboard') return 'dashboard';
  if (pathname.startsWith('/dashboard/orders') || pathname.startsWith('/dashboard/auto-assign-logs')) {
    return 'orders';
  }
  if (pathname.startsWith('/dashboard/birds-eye')) return 'birds_eye';
  if (pathname.startsWith('/dashboard/riders')) return 'riders';
  if (pathname.startsWith('/dashboard/bikes')) return 'bikes';
  if (pathname.startsWith('/dashboard/coupons')) return 'coupons';
  if (pathname.startsWith('/dashboard/campaigns')) return 'campaigns';
  if (pathname.startsWith('/dashboard/finance')) return 'finance';
  if (pathname.startsWith('/dashboard/users')) return 'users';
  if (pathname.startsWith('/dashboard/settings')) return 'settings';
  if (pathname.startsWith('/dashboard/notifications')) return 'notifications';
  if (pathname.startsWith('/dashboard/transactions')) return 'transactions';
  if (pathname.startsWith('/dashboard/waybill')) return 'waybill';
  if (pathname.startsWith('/dashboard/team')) return 'team';
  return null;
}

export function buildLegacyPermissions(isSuperAdmin = false) {
  const permissions = {};
  for (const key of LEGACY_MODULES) {
    permissions[key] = [...ACTIONS];
  }
  if (isSuperAdmin) {
    permissions.team = [...ACTIONS];
  }
  return permissions;
}

export function buildLegacyModules(isSuperAdmin = false) {
  return Object.entries(MODULE_SIDEBAR)
    .filter(([key, config]) => {
      if (config.superAdminOnly) return isSuperAdmin;
      return config.inSidebar !== false;
    })
    .map(([key, config]) => ({
      key,
      label: MODULE_LABELS[key],
      route: config.href,
      inSidebar: config.inSidebar !== false,
      actions: [...ACTIONS],
    }));
}

export const DEFAULT_SUPER_ADMIN_EMAIL = 'dev@bopropertiesng.com';

export function resolveIsSuperAdmin(user, adminPayload) {
  if (adminPayload?.isSuperAdmin === true) return true;
  if (user?.isSuperAdmin === true) return true;

  const email = (user?.email || '').toLowerCase().trim();
  const configured = (
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL
  )
    .toLowerCase()
    .trim();

  return !!email && email === configured;
}

export function normalizeAdminPayload(user, adminPayload) {
  if (!isAdminRole(user?.role)) return null;

  const isSuperAdmin = resolveIsSuperAdmin(user, adminPayload);

  if (adminPayload) {
    return {
      isSuperAdmin,
      permissions: adminPayload.permissions || {},
      modules: adminPayload.modules || [],
      rbacPayload: adminPayload,
    };
  }

  return {
    isSuperAdmin,
    permissions: buildLegacyPermissions(isSuperAdmin),
    modules: buildLegacyModules(isSuperAdmin),
  };
}

/** Backend sometimes ships wrong paths (e.g. /dashboard/orders/auto-assign-logs). */
const ROUTE_ALIASES = {
  '/dashboard/orders/auto-assign-logs': '/dashboard/auto-assign-logs',
};

function resolveHref(href) {
  if (!href) return href;
  return ROUTE_ALIASES[href] || href;
}

function mapModuleSubItems(module) {
  const config = MODULE_SIDEBAR[module.key];
  // Prefer local sidebar routes — they match actual Next.js pages.
  if (config?.subItems?.length) {
    return config.subItems;
  }

  const routes = module.subRoutes || module.subItems || [];
  if (!routes.length) return undefined;

  return routes.map((route) => ({
    name: route.label || route.name,
    href: resolveHref(route.route || route.href),
  }));
}

export function getSidebarItems(adminState) {
  const { isSuperAdmin, permissions, modules } = adminState || {};

  const sourceModules = modules?.length ? modules : buildLegacyModules(isSuperAdmin);

  const items = sourceModules
    .filter((module) => {
      const hasView = hasPermission(permissions, module.key, 'view');
      if (module.inSidebar === false) {
        // Team is super-admin only and backend marks it hidden from default sidebar
        if (module.key === 'team' && isSuperAdmin && hasView) return true;
        // Push blasts: show when admin has notifications.view (backend may mark hidden)
        if (module.key === 'notifications' && hasView) return true;
        return false;
      }
      return hasView;
    })
    .map((module) => {
      const config = MODULE_SIDEBAR[module.key];
      if (!config) return null;
      if (config.superAdminOnly && !isSuperAdmin) return null;

      return {
        key: module.key,
        name: module.label || MODULE_LABELS[module.key] || module.key,
        href: module.route || config.href,
        icon: config.icon,
        subItems: mapModuleSubItems(module),
      };
    })
    .filter(Boolean);

  // Ensure team appears for super admin even if missing from modules array
  if (isSuperAdmin && !items.some((item) => item.key === 'team')) {
    const teamConfig = MODULE_SIDEBAR.team;
    items.push({
      key: 'team',
      name: MODULE_LABELS.team,
      href: teamConfig.href,
      icon: teamConfig.icon,
    });
  }

  return items;
}

export function hasPermission(permissions, moduleKey, action = 'view') {
  return Array.isArray(permissions?.[moduleKey]) && permissions[moduleKey].includes(action);
}

export function canAccessRoute(pathname, adminState) {
  const moduleKey = getModuleForPath(pathname);
  if (!moduleKey) return true;

  if (moduleKey === 'team') {
    return !!adminState?.isSuperAdmin;
  }

  return hasPermission(adminState?.permissions, moduleKey, 'view');
}

export const ROLE_ASSIGNABLE_MODULE_KEYS = MODULE_KEYS.filter((key) => key !== 'team');

export function emptyPermissions(moduleCatalog = MODULE_KEYS) {
  return moduleCatalog.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});
}

export function emptyRolePermissions() {
  return emptyPermissions(ROLE_ASSIGNABLE_MODULE_KEYS);
}

export function permissionsForEditor(stored) {
  const base = emptyRolePermissions();
  for (const key of ROLE_ASSIGNABLE_MODULE_KEYS) {
    if (Array.isArray(stored?.[key])) {
      base[key] = stored[key];
    }
  }
  return base;
}

/** Strip team and empty modules before sending to role API */
export function sanitizeRolePermissions(permissions) {
  const sanitized = {};
  for (const key of ROLE_ASSIGNABLE_MODULE_KEYS) {
    const actions = permissions?.[key];
    if (Array.isArray(actions) && actions.length > 0) {
      sanitized[key] = actions;
    }
  }
  return sanitized;
}
