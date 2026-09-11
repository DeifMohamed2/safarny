const { PlatformSettings } = require('../models');
const { toDoc } = require('../lib/document');

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
  destinations: ['Cairo', 'Hurghada', 'Sharm El Sheikh', 'Luxor', 'Aswan', 'Dahab', 'Siwa', 'Alexandria', 'Marsa Alam'],
  categories: ['Cultural Tour', 'Beach Escape', 'Adventure', 'Umrah Package', 'City Tours', 'Leisure'],
  payoutAccounts: { ...DEFAULT_PAYOUTS },
};

async function getSettings() {
  let doc = toDoc(await PlatformSettings.findById('default').lean());
  if (!doc) {
    doc = toDoc(await PlatformSettings.create(DEFAULTS));
  }
  return {
    ...DEFAULTS,
    ...doc,
    destinations: [...(doc.destinations || DEFAULTS.destinations)],
    categories: [...(doc.categories || DEFAULTS.categories)],
    payoutAccounts: { ...DEFAULT_PAYOUTS, ...(doc.payoutAccounts || {}) },
  };
}

async function updateSettings(patch = {}) {
  const $set = {};
  if (patch.commissionRate !== undefined) $set.commissionRate = Number(patch.commissionRate) || 0;
  if (patch.currency) $set.currency = String(patch.currency);
  if (patch.defaultLocale) $set.defaultLocale = String(patch.defaultLocale);
  if (patch.autoApproveTrips !== undefined) $set.autoApproveTrips = Boolean(patch.autoApproveTrips);
  if (patch.maintenanceMode !== undefined) $set.maintenanceMode = Boolean(patch.maintenanceMode);
  if (Array.isArray(patch.destinations)) $set.destinations = patch.destinations.filter(Boolean);
  if (Array.isArray(patch.categories)) $set.categories = patch.categories.filter(Boolean);
  await PlatformSettings.updateOne({ _id: 'default' }, { $set }, { upsert: true });
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
  return getSettings();
}

async function addDestination(name) {
  const value = String(name || '').trim();
  if (!value) return getSettings();
  await PlatformSettings.updateOne(
    { _id: 'default' },
    { $addToSet: { destinations: value } },
    { upsert: true }
  );
  const settings = await getSettings();
  settings.destinations.sort();
  await PlatformSettings.updateOne({ _id: 'default' }, { $set: { destinations: settings.destinations } });
  return getSettings();
}

async function removeDestination(name) {
  await PlatformSettings.updateOne({ _id: 'default' }, { $pull: { destinations: name } });
  return getSettings();
}

async function addCategory(name) {
  const value = String(name || '').trim();
  if (!value) return getSettings();
  await PlatformSettings.updateOne(
    { _id: 'default' },
    { $addToSet: { categories: value } },
    { upsert: true }
  );
  const settings = await getSettings();
  settings.categories.sort();
  await PlatformSettings.updateOne({ _id: 'default' }, { $set: { categories: settings.categories } });
  return getSettings();
}

async function removeCategory(name) {
  await PlatformSettings.updateOne({ _id: 'default' }, { $pull: { categories: name } });
  return getSettings();
}

module.exports = {
  DEFAULTS,
  getSettings,
  updateSettings,
  updatePayoutAccounts,
  addDestination,
  removeDestination,
  addCategory,
  removeCategory,
};
