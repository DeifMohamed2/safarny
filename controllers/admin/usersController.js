const userService = require('../../services/users');
const tripService = require('../../services/trips');
const {
  summarizeTraveler,
  buildTravelerProfile,
  getTravelerListStats,
  getAdminListStats,
} = require('../../lib/traveler-insights');
const { withLayout, audit } = require('./_helpers');

function filterQuery(filters, overrides) {
  const q = Object.assign({}, filters, overrides || {});
  return Object.keys(q)
    .filter((k) => q[k] && q[k] !== 'all')
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(q[k])}`)
    .join('&');
}

function usersRedirect(req, res) {
  res.redirect('/admin/travelers');
}

async function travelers(req, res) {
  const filters = { q: req.query.q, status: req.query.status || 'all', sort: req.query.sort || 'active' };
  const items = await Promise.all((await userService.filterTravelers(filters)).map((u) => summarizeTraveler(u)));
  const { items: pageItems, pagination } = userService.paginateList(items, req.query.page, req.query.perPage || 12);
  withLayout(res, 'pages/admin/travelers', {
    title: res.locals.t('admin.travelers.title', 'Travelers'),
    adminActive: 'travelers',
    travelers: pageItems,
    pagination,
    filters,
    stats: getTravelerListStats(items),
    hasActiveFilters: filters.q || filters.status !== 'all',
    filterQuery: (overrides) => filterQuery(filters, overrides),
  });
}

async function travelerEditForm(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user || user.role !== 'traveler') {
    return res.status(404).render('pages/not-found', { title: 'Traveler not found' });
  }
  withLayout(res, 'pages/admin/traveler-form', {
    title: res.locals.t('admin.travelers.edit', 'Edit traveler'),
    adminActive: 'travelers',
    traveler: user,
    profile: await userService.getTravelerProfile(user.id),
    trips: await tripService.catalog(),
    isEdit: true,
    formError: req.session.formError || null,
  });
  delete req.session.formError;
}

async function travelerEdit(req, res) {
  const result = await userService.updateTraveler(req.params.id, req.body);
  if (result.error) {
    req.session.formError = result.error;
    return res.redirect(`/admin/travelers/${req.params.id}/edit`);
  }
  await userService.updateTravelerProfile(req.params.id, req.body);
  await audit(req, 'traveler.update', 'user', result.user.id, `Updated traveler ${result.user.userName}`);
  req.session.flash = { type: 'success', message: 'Traveler updated successfully.' };
  res.redirect(`/admin/travelers/${req.params.id}`);
}

async function travelerDetail(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user || user.role !== 'traveler') {
    return res.status(404).render('pages/not-found', { title: 'Traveler not found' });
  }
  const detail = await buildTravelerProfile(user);
  withLayout(res, 'pages/admin/traveler-detail', {
    title: user.userName,
    adminActive: 'travelers',
    detail,
    traveler: user,
  });
}

async function travelerSuspend(req, res) {
  const user = await userService.setUserStatus(req.params.id, 'suspended');
  if (user) await audit(req, 'traveler.suspend', 'user', user.id, `Suspended traveler ${user.userName}`);
  req.session.flash = { type: 'success', message: 'Traveler suspended.' };
  res.redirect(`/admin/travelers/${req.params.id}`);
}

async function travelerReactivate(req, res) {
  const user = await userService.setUserStatus(req.params.id, 'active');
  if (user) await audit(req, 'traveler.reactivate', 'user', user.id, `Reactivated traveler ${user.userName}`);
  req.session.flash = { type: 'success', message: 'Traveler reactivated.' };
  res.redirect(`/admin/travelers/${req.params.id}`);
}

async function travelerNotes(req, res) {
  await userService.setTravelerNotes(req.params.id, req.body.notes);
  req.session.flash = { type: 'success', message: 'Notes saved.' };
  res.redirect(`/admin/travelers/${req.params.id}`);
}

async function admins(req, res) {
  const filters = { q: req.query.q, status: req.query.status || 'all', sort: req.query.sort || 'newest' };
  const items = await userService.filterAdmins(filters);
  const { items: pageItems, pagination } = userService.paginateList(items, req.query.page, req.query.perPage || 12);
  withLayout(res, 'pages/admin/admins', {
    title: res.locals.t('admin.admins.title', 'Admins'),
    adminActive: 'admins',
    admins: pageItems,
    pagination,
    filters,
    stats: getAdminListStats(items),
    hasActiveFilters: filters.q || filters.status !== 'all',
    filterQuery: (overrides) => filterQuery(filters, overrides),
  });
}

function adminCreateForm(req, res) {
  withLayout(res, 'pages/admin/admin-form', {
    title: res.locals.t('admin.admins.create', 'Create admin'),
    adminActive: 'admins',
  });
}

async function adminCreate(req, res) {
  const { userName, email, phone, password } = req.body;
  await userService.createAdminUser({ userName, email, phone, password });
  await audit(req, 'admin.create', 'user', email, `Created admin user ${email}`);
  req.session.flash = { type: 'success', message: 'Admin user created.' };
  res.redirect('/admin/admins');
}

async function adminEditForm(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user || user.role !== 'admin') {
    return res.status(404).render('pages/not-found', { title: 'Admin not found' });
  }
  withLayout(res, 'pages/admin/admin-edit-form', {
    title: res.locals.t('admin.admins.edit', 'Edit admin'),
    adminActive: 'admins',
    admin: user,
    isEdit: true,
    formError: req.session.formError || null,
  });
  delete req.session.formError;
}

async function adminEdit(req, res) {
  const result = await userService.updateAdmin(req.params.id, req.body);
  if (result.error) {
    req.session.formError = result.error;
    return res.redirect(`/admin/admins/${req.params.id}/edit`);
  }
  await audit(req, 'admin.update', 'user', result.user.id, `Updated admin ${result.user.userName}`);
  req.session.flash = { type: 'success', message: 'Admin updated successfully.' };
  res.redirect(`/admin/admins/${req.params.id}`);
}

async function adminDetail(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user || user.role !== 'admin') {
    return res.status(404).render('pages/not-found', { title: 'Admin not found' });
  }
  withLayout(res, 'pages/admin/admin-detail', {
    title: user.userName,
    adminActive: 'admins',
    admin: user,
  });
}

async function userDetail(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user) return res.status(404).render('pages/not-found', { title: 'User not found' });
  if (user.role === 'admin') return res.redirect(`/admin/admins/${user.id}`);
  if (user.role === 'traveler') return res.redirect(`/admin/travelers/${user.id}`);
  return res.redirect('/admin/companies');
}

async function userSuspend(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user) return res.redirect('/admin/travelers');
  if (user.role === 'admin') return res.redirect(`/admin/admins/${user.id}`);
  return res.redirect(307, `/admin/travelers/${user.id}/suspend`);
}

async function userReactivate(req, res) {
  const user = await userService.findById(req.params.id);
  if (!user) return res.redirect('/admin/travelers');
  return res.redirect(307, `/admin/travelers/${user.id}/reactivate`);
}

module.exports = {
  usersRedirect,
  travelers,
  travelerEditForm,
  travelerEdit,
  travelerDetail,
  travelerSuspend,
  travelerReactivate,
  travelerNotes,
  admins,
  adminCreateForm,
  adminCreate,
  adminEditForm,
  adminEdit,
  adminDetail,
  userDetail,
  userSuspend,
  userReactivate,
};
