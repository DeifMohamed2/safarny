const { PlatformSettings } = require('../models');
const { toDoc } = require('../lib/document');
const {
  DEFAULT_DESTINATIONS,
  ensureDestinationCatalog,
  catalogNeedsPersist,
  normalizeDestination,
  normalizeDestinationList,
} = require('../lib/destinations');

const DEFAULT_PAYOUTS = {
  instapayIpa: 'safarny@instapay',
  instapayMobile: '01000000000',
  vodafoneCash: '01000000000',
  orangeCash: '01000000000',
  etisalatCash: '01000000000',
  bankName: 'National Bank of Egypt',
  bankAccountName: 'Safarny Travel LLC',
  bankAccountNumber: '1234567890123456',
  bankIban: 'EG000000000000000000000000000',
  instructionsEn: 'Transfer the exact total amount shown at checkout, then upload a clear screenshot of the successful transfer.',
  instructionsAr: 'حوّل المبلغ الإجمالي بالكامل ثم ارفع لقطة شاشة واضحة للتحويل الناجح.',
};

const DEFAULTS = {
  _id: 'default',
  commissionRate: 12,
  currency: 'EGP',
  defaultLocale: 'en',
  autoApproveTrips: false,
  maintenanceMode: false,
  destinations: DEFAULT_DESTINATIONS.map((item) => ({ ...item })),
  categories: ['Cultural Tour', 'Beach Escape', 'Adventure', 'Umrah & Hajj', 'City Tours', 'Leisure'],
  payoutAccounts: { ...DEFAULT_PAYOUTS },
};

let settingsCache = { value: null, at: 0 };
const SETTINGS_TTL_MS = 60_000;

function invalidateSettingsCache() {
  settingsCache = { value: null, at: 0 };
}

async function persistDestinations(list) {
  const destinations = normalizeDestinationList(list);
  await PlatformSettings.updateOne(
    { _id: 'default' },
    { $set: { destinations } },
    { upsert: true }
  );
  invalidateSettingsCache();
  return getSettings();
}

async function loadSettings() {
  let doc = toDoc(await PlatformSettings.findById('default').lean());
  if (!doc) {
    doc = toDoc(await PlatformSettings.create(DEFAULTS));
  }
  const destinations = ensureDestinationCatalog(doc.destinations);
  if (catalogNeedsPersist(doc.destinations)) {
    await PlatformSettings.updateOne({ _id: 'default' }, { $set: { destinations } }, { upsert: true });
  }
  return {
    ...DEFAULTS,
    ...doc,
    destinations,
    categories: [...(doc.categories || DEFAULTS.categories)],
    payoutAccounts: { ...DEFAULT_PAYOUTS, ...(doc.payoutAccounts || {}) },
  };
}

async function getSettings() {
  if (settingsCache.value && Date.now() - settingsCache.at < SETTINGS_TTL_MS) {
    return settingsCache.value;
  }
  const value = await loadSettings();
  settingsCache = { value, at: Date.now() };
  return value;
}

async function updateSettings(patch = {}) {
  const $set = {};
  if (patch.commissionRate !== undefined) $set.commissionRate = Number(patch.commissionRate) || 0;
  if (patch.defaultLocale) $set.defaultLocale = String(patch.defaultLocale);
  if (patch.autoApproveTrips !== undefined) $set.autoApproveTrips = Boolean(patch.autoApproveTrips);
  if (patch.maintenanceMode !== undefined) $set.maintenanceMode = Boolean(patch.maintenanceMode);
  if (Array.isArray(patch.destinations)) $set.destinations = normalizeDestinationList(patch.destinations);
  if (Array.isArray(patch.categories)) $set.categories = patch.categories.filter(Boolean);
  await PlatformSettings.updateOne({ _id: 'default' }, { $set }, { upsert: true });
  invalidateSettingsCache();
  return getSettings();
}

async function updatePayoutAccounts(patch = {}) {
  const fields = [
    'instapayIpa', 'instapayMobile', 'vodafoneCash', 'orangeCash', 'etisalatCash',
    'bankName', 'bankAccountName', 'bankAccountNumber', 'bankIban',
    'instructionsEn', 'instructionsAr',
  ];
  const $set = {};
  fields.forEach((key) => {
    if (patch[key] !== undefined) $set[`payoutAccounts.${key}`] = String(patch[key] || '').trim();
  });
  if (Object.keys($set).length) {
    await PlatformSettings.updateOne({ _id: 'default' }, { $set }, { upsert: true });
  }
  invalidateSettingsCache();
  return getSettings();
}

async function addDestination(payload = {}) {
  const incoming = normalizeDestination({
    nameEn: payload.nameEn || payload.name,
    nameAr: payload.nameAr,
    country: payload.country,
    group: payload.group,
  });
  if (!incoming) return getSettings();
  const settings = await getSettings();
  if (settings.destinations.some((item) => item.id === incoming.id || item.nameEn.toLowerCase() === incoming.nameEn.toLowerCase())) {
    return settings;
  }
  return persistDestinations([...settings.destinations, incoming]);
}

async function updateDestination(id, payload = {}) {
  const settings = await getSettings();
  const current = settings.destinations.find((item) => item.id === String(id));
  if (!current) return settings;
  const next = normalizeDestination({
    ...current,
    ...payload,
    id: current.id,
    nameEn: payload.nameEn || current.nameEn,
    nameAr: payload.nameAr != null ? payload.nameAr : current.nameAr,
  });
  return persistDestinations(settings.destinations.map((item) => (item.id === current.id ? next : item)));
}

async function removeDestination(idOrName) {
  const settings = await getSettings();
  const key = String(idOrName || '').trim().toLowerCase();
  return persistDestinations(settings.destinations.filter((item) => item.id !== key && item.nameEn.toLowerCase() !== key));
}

async function addCategory(name) {
  const value = String(name || '').trim();
  if (!value) return getSettings();
  await PlatformSettings.updateOne(
    { _id: 'default' },
    { $addToSet: { categories: value } },
    { upsert: true }
  );
  invalidateSettingsCache();
  const settings = await getSettings();
  settings.categories.sort();
  await PlatformSettings.updateOne({ _id: 'default' }, { $set: { categories: settings.categories } });
  invalidateSettingsCache();
  return getSettings();
}

async function removeCategory(name) {
  await PlatformSettings.updateOne({ _id: 'default' }, { $pull: { categories: name } });
  invalidateSettingsCache();
  return getSettings();
}

module.exports = {
  DEFAULTS,
  getSettings,
  updateSettings,
  updatePayoutAccounts,
  addDestination,
  updateDestination,
  removeDestination,
  addCategory,
  removeCategory,
};
