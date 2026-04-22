export const ACCOUNT_ROLES = ['client', 'artisan', 'agency', 'hotel'];

export const BUSINESS_ROLES = ['artisan', 'agency', 'hotel'];

export const ROLE_META = {
  client: {
    label: 'Client',
    route: '/dashboard/client',
    badge: 'Travel Explorer',
    description: 'Plan trips, save itineraries, and review your travel history.',
    emoji: '🧭',
  },
  artisan: {
    label: 'Artisan',
    route: '/dashboard/artisan',
    badge: 'Craft & Services',
    description: 'Manage orders, quotes, and customer history.',
    emoji: '🧵',
  },
  agency: {
    label: 'Agency',
    route: '/dashboard/agency',
    badge: 'Travel Agency',
    description: 'Track packages, requests, and confirmations.',
    emoji: '🧳',
  },
  hotel: {
    label: 'Hotel',
    route: '/dashboard/hotel',
    badge: 'Hospitality',
    description: 'Follow reservations, occupancy, and guest history.',
    emoji: '🏨',
  },
};

export const normalizeRole = (role) => {
  const clean = String(role || 'client').trim().toLowerCase();
  return ACCOUNT_ROLES.includes(clean) ? clean : 'client';
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getDashboardPath = (userOrRole) => {
  const role = typeof userOrRole === 'string'
    ? normalizeRole(userOrRole)
    : normalizeRole(userOrRole?.account_role || userOrRole?.role || userOrRole?.partner_type || (userOrRole?.plan_type === 'partner' ? 'artisan' : 'client'));
  return ROLE_META[role]?.route || ROLE_META.client.route;
};

export const storeSession = (payload) => {
  if (!payload) return null;
  if (payload.token) localStorage.setItem('token', payload.token);
  if (payload.user) localStorage.setItem('user', JSON.stringify(payload.user));
  if (payload.partner) localStorage.setItem('partner', JSON.stringify(payload.partner));
  return payload.user || null;
};

export const getSessionHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
