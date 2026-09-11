const settings = {
  commissionRate: 12,
  currency: 'EGP',
  defaultLocale: 'en',
  autoApproveTrips: false,
  maintenanceMode: false,
  destinations: ['Cairo', 'Hurghada', 'Sharm El Sheikh', 'Luxor', 'Aswan', 'Dahab', 'Siwa', 'Alexandria', 'Marsa Alam'],
  categories: ['Cultural Tour', 'Beach Escape', 'Adventure', 'Umrah Package', 'City Tours', 'Leisure'],
};

function getSettings() {
  return { ...settings, destinations: [...settings.destinations], categories: [...settings.categories] };
}

function updateSettings(patch = {}) {
  if (patch.commissionRate !== undefined) settings.commissionRate = Number(patch.commissionRate) || 0;
  if (patch.currency) settings.currency = String(patch.currency);
  if (patch.defaultLocale) settings.defaultLocale = String(patch.defaultLocale);
  if (patch.autoApproveTrips !== undefined) settings.autoApproveTrips = Boolean(patch.autoApproveTrips);
  if (patch.maintenanceMode !== undefined) settings.maintenanceMode = Boolean(patch.maintenanceMode);
  if (Array.isArray(patch.destinations)) settings.destinations = patch.destinations.filter(Boolean);
  if (Array.isArray(patch.categories)) settings.categories = patch.categories.filter(Boolean);
  return getSettings();
}

function addDestination(name) {
  const value = String(name || '').trim();
  if (!value || settings.destinations.includes(value)) return getSettings();
  settings.destinations.push(value);
  settings.destinations.sort();
  return getSettings();
}

function removeDestination(name) {
  settings.destinations = settings.destinations.filter((item) => item !== name);
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
  removeDestination,
  addCategory,
  removeCategory,
};
