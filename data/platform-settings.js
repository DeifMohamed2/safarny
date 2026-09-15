const { DEFAULT_DESTINATIONS, ensureDestinationCatalog, normalizeDestination, normalizeDestinationList } = require('../lib/destinations');

const settings = {
  commissionRate: 12,
  currency: 'EGP',
  defaultLocale: 'en',
  autoApproveTrips: false,
  maintenanceMode: false,
  destinations: DEFAULT_DESTINATIONS.map((item) => ({ ...item })),
  categories: ['Cultural Tour', 'Beach Escape', 'Adventure', 'Umrah & Hajj', 'City Tours', 'Leisure'],
};

function getSettings() {
  return {
    ...settings,
    destinations: ensureDestinationCatalog(settings.destinations),
    categories: [...settings.categories],
  };
}

function updateSettings(patch = {}) {
  if (patch.commissionRate !== undefined) settings.commissionRate = Number(patch.commissionRate) || 0;
  if (patch.currency) settings.currency = String(patch.currency);
  if (patch.defaultLocale) settings.defaultLocale = String(patch.defaultLocale);
  if (patch.autoApproveTrips !== undefined) settings.autoApproveTrips = Boolean(patch.autoApproveTrips);
  if (patch.maintenanceMode !== undefined) settings.maintenanceMode = Boolean(patch.maintenanceMode);
  if (Array.isArray(patch.destinations)) settings.destinations = normalizeDestinationList(patch.destinations);
  if (Array.isArray(patch.categories)) settings.categories = patch.categories.filter(Boolean);
  return getSettings();
}

function addDestination(payload) {
  const incoming = normalizeDestination(typeof payload === 'string' ? { nameEn: payload } : payload);
  if (!incoming) return getSettings();
  if (settings.destinations.some((item) => item.id === incoming.id || String(item.nameEn || item).toLowerCase() === incoming.nameEn.toLowerCase())) {
    return getSettings();
  }
  settings.destinations = normalizeDestinationList([...ensureDestinationCatalog(settings.destinations), incoming]);
  return getSettings();
}

function updateDestination(id, payload = {}) {
  const current = ensureDestinationCatalog(settings.destinations);
  const match = current.find((item) => item.id === String(id));
  if (!match) return getSettings();
  settings.destinations = current.map((item) => (item.id === match.id ? normalizeDestination({ ...item, ...payload, id: match.id }) : item));
  return getSettings();
}

function removeDestination(idOrName) {
  const key = String(idOrName || '').trim().toLowerCase();
  settings.destinations = ensureDestinationCatalog(settings.destinations)
    .filter((item) => item.id !== key && item.nameEn.toLowerCase() !== key);
  return getSettings();
}

function addCategory(name) {
  const value = String(name || '').trim();
  if (!value || settings.categories.includes(value)) return getSettings();
  settings.categories.push(value);
  settings.categories.sort();
  return getSettings();
}

function removeCategory(name) {
  settings.categories = settings.categories.filter((item) => item !== name);
  return getSettings();
}

module.exports = {
  getSettings,
  updateSettings,
  addDestination,
  updateDestination,
  removeDestination,
  addCategory,
  removeCategory,
};
