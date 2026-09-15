const settingsService = require('../../services/settings');
const userService = require('../../services/users');
const { withLayout, audit } = require('./_helpers');

async function page(req, res) {
  withLayout(res, 'pages/admin/settings', {
    title: res.locals.t('admin.settings.title', 'Settings'),
    adminActive: 'settings',
    settings: await settingsService.getSettings(),
  });
}

async function update(req, res) {
  await settingsService.updateSettings({
    commissionRate: req.body.commissionRate,
    defaultLocale: req.body.defaultLocale,
    autoApproveTrips: req.body.autoApproveTrips === 'on',
    maintenanceMode: req.body.maintenanceMode === 'on',
  });
  await audit(req, 'settings.update', 'platform', 'settings', 'Updated platform settings');
  req.session.flash = { type: 'success', message: 'Settings saved.' };
  res.redirect('/admin/settings');
}

async function destinations(req, res) {
  const action = String(req.body.action || '').trim();
  if (action === 'add' || action === 'save') {
    const payload = {
      nameEn: req.body.nameEn || req.body.name,
      nameAr: req.body.nameAr,
      country: req.body.country,
      group: req.body.group,
    };
    if (req.body.id) await settingsService.updateDestination(req.body.id, payload);
    else await settingsService.addDestination(payload);
  }
  if (action === 'update') {
    await settingsService.updateDestination(req.body.id, {
      nameEn: req.body.nameEn,
      nameAr: req.body.nameAr,
      country: req.body.country,
      group: req.body.group,
    });
  }
  if (action === 'remove') await settingsService.removeDestination(req.body.id || req.body.name);
  req.session.flash = { type: 'success', message: res.locals.t('admin.settings.destinationsSaved', 'Destinations updated.') };
  res.redirect('/admin/settings#destinations');
}

async function categories(req, res) {
  if (req.body.action === 'add') await settingsService.addCategory(req.body.name);
  if (req.body.action === 'remove') await settingsService.removeCategory(req.body.name);
  res.redirect('/admin/settings');
}

async function profile(req, res) {
  const updated = await userService.updateUser(req.session.user.id, {
    userName: req.body.userName,
    email: req.body.email,
    phone: req.body.phone,
  });
  if (updated) {
    req.session.user = { ...req.session.user, userName: updated.userName, email: updated.email, phone: updated.phone };
  }
  req.session.flash = { type: 'success', message: 'Profile updated.' };
  res.redirect('/admin/settings');
}

async function payoutAccounts(req, res) {
  await settingsService.updatePayoutAccounts({
    instapayIpa: req.body.instapayIpa,
    instapayMobile: req.body.instapayMobile,
    vodafoneCash: req.body.vodafoneCash,
    orangeCash: req.body.orangeCash,
    etisalatCash: req.body.etisalatCash,
    bankName: req.body.bankName,
    bankAccountName: req.body.bankAccountName,
    bankAccountNumber: req.body.bankAccountNumber,
    bankIban: req.body.bankIban,
    instructionsEn: req.body.instructionsEn,
    instructionsAr: req.body.instructionsAr,
  });
  await audit(req, 'settings.payouts', 'platform', 'settings', 'Updated payout accounts');
  req.session.flash = { type: 'success', message: 'Payout accounts saved.' };
  res.redirect('/admin/settings');
}

module.exports = { page, update, destinations, categories, profile, payoutAccounts };
