const fs = require('fs');
const tripService = require('../../services/trips');
const companyService = require('../../services/companies');
const bookingService = require('../../services/bookings');
const { enrichTripForAdmin, getTripInsights, getTopTripsByBookings } = require('../../lib/admin-insights');
const { withLayout, audit } = require('./_helpers');
const {
  tripMediaUpload,
  validateUploadedFile,
  publicUploadPath,
  MAX_IMAGES,
  MAX_VIDEOS,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
} = require('../../lib/trip-media');

const mediaLimits = {
  maxImages: MAX_IMAGES,
  maxVideos: MAX_VIDEOS,
  imageMaxBytes: IMAGE_MAX_BYTES,
  videoMaxBytes: VIDEO_MAX_BYTES,
};

async function list(req, res) {
  const filters = {
    status: req.query.status || 'all',
    q: req.query.q,
    companyId: req.query.companyId || 'all',
    type: req.query.type || 'all',
    sort: req.query.sort || 'bookings',
  };
  let items = await Promise.all((await tripService.getAllTrips(filters)).map((t) => enrichTripForAdmin(t)));
  if (filters.sort === 'revenue') items.sort((a, b) => b.revenue - a.revenue);
  else if (filters.sort === 'newest') items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else items.sort((a, b) => b.bookingCount - a.bookingCount);
  const { items: pageItems, pagination } = bookingService.paginateList(items, req.query.page, req.query.perPage || 10);
  const companies = await companyService.listCompanies();
  withLayout(res, 'pages/admin/trips', {
    title: res.locals.t('admin.trips.title', 'Trips'),
    adminActive: 'trips',
    trips: pageItems,
    topTrips: await getTopTripsByBookings(5),
    pagination,
    filters,
    companies: companies.map((c) => ({ id: c.id, title: c.title })),
    pendingCount: (await tripService.getPendingTrips()).length,
    hasActiveFilters: filters.q || filters.status !== 'all' || filters.companyId !== 'all' || filters.type !== 'all',
  });
}

async function createForm(req, res) {
  const companies = await companyService.listCompanies();
  withLayout(res, 'pages/admin/trip-form', {
    title: res.locals.t('admin.trips.create', 'Create trip'),
    adminActive: 'trips',
    trip: null,
    formTrip: null,
    companies: companies.map((c) => ({ id: c.id, title: c.title })),
    query: req.query,
    mediaLimits,
  });
}

function uploadMedia(req, res) {
  tripMediaUpload.single('file')(req, res, async (error) => {
    if (error) return res.status(400).json({ ok: false, message: error.message || 'Upload failed.' });
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file received.' });
    const companyId = req.query.companyId || req.body.companyId;
    if (!companyId || !(await companyService.getCompanyById(companyId))) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      return res.status(400).json({ ok: false, message: 'Select a company before uploading media.' });
    }
    const validation = validateUploadedFile(req.file);
    if (!validation.ok) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      return res.status(400).json({ ok: false, message: validation.message });
    }
    return res.json({
      ok: true,
      url: publicUploadPath(companyId, req.file.filename),
      kind: validation.kind,
      size: req.file.size,
      name: req.file.originalname,
    });
  });
}

async function create(req, res) {
  const companyId = req.body.companyId;
  if (!companyId) {
    req.session.flash = { type: 'error', message: 'Please select a company.' };
    return res.redirect('/admin/trips/new');
  }
  const trip = await tripService.adminCreateTrip(companyId, {
    ...req.body,
    status: req.body.status || 'active',
    offer: req.body.offer === 'on',
  });
  if (trip) await audit(req, 'trip.create', 'trip', trip.id, `Created trip ${trip.title}`);
  req.session.flash = { type: 'success', message: 'Trip created.' };
  res.redirect(`/admin/trips/${trip?.id || ''}`);
}

async function approvals(req, res) {
  const pending = await Promise.all((await tripService.getPendingTrips()).map((t) => enrichTripForAdmin(t)));
  withLayout(res, 'pages/admin/trip-approvals', {
    title: res.locals.t('admin.trips.approvals', 'Trip approvals'),
    adminActive: 'trips',
    trips: pending,
  });
}

async function editForm(req, res) {
  const trip = await tripService.getTripById(req.params.id);
  if (!trip) return res.status(404).render('pages/not-found', { title: 'Trip not found' });
  const companies = await companyService.listCompanies();
  withLayout(res, 'pages/admin/trip-form', {
    title: `Edit ${trip.title}`,
    adminActive: 'trips',
    trip,
    formTrip: tripService.ensureTripDefaults(trip),
    isEdit: true,
    companies: companies.map((c) => ({ id: c.id, title: c.title })),
    mediaLimits,
  });
}

async function edit(req, res) {
  const trip = await tripService.adminUpdateTrip(req.params.id, { ...req.body, offer: req.body.offer === 'on' });
  if (trip) await audit(req, 'trip.update', 'trip', trip.id, `Updated trip ${trip.title}`);
  req.session.flash = { type: 'success', message: 'Trip updated.' };
  res.redirect(`/admin/trips/${req.params.id}`);
}

async function detail(req, res) {
  const insights = await getTripInsights(req.params.id);
  if (!insights) return res.status(404).render('pages/not-found', { title: 'Trip not found' });
  withLayout(res, 'pages/admin/trip-detail', {
    title: insights.trip.title,
    adminActive: 'trips',
    ...insights,
  });
}

async function approve(req, res) {
  const trip = await tripService.approveTrip(req.params.id);
  if (trip) await audit(req, 'trip.approve', 'trip', trip.id, `Approved trip ${trip.title}`);
  req.session.flash = { type: 'success', message: 'Trip approved.' };
  res.redirect(req.headers.referer || `/admin/trips/${req.params.id}`);
}

async function reject(req, res) {
  const trip = await tripService.rejectTrip(req.params.id, req.body.reason);
  if (trip) await audit(req, 'trip.reject', 'trip', trip.id, `Rejected trip ${trip.title}`);
  req.session.flash = { type: 'success', message: 'Trip rejected.' };
  res.redirect(req.headers.referer || `/admin/trips/${req.params.id}`);
}

async function feature(req, res) {
  const trip = await tripService.setTripFeatured(req.params.id, req.body.featured === 'on');
  if (trip) await audit(req, 'trip.feature', 'trip', trip.id, `${trip.featured ? 'Featured' : 'Unfeatured'} trip ${trip.title}`);
  req.session.flash = { type: 'success', message: 'Trip updated.' };
  res.redirect(`/admin/trips/${req.params.id}`);
}

async function remove(req, res) {
  const trip = await tripService.getTripById(req.params.id);
  await tripService.adminDeleteTrip(req.params.id);
  if (trip) await audit(req, 'trip.delete', 'trip', trip.id, `Deleted trip ${trip.title}`);
  req.session.flash = { type: 'success', message: 'Trip deleted.' };
  res.redirect('/admin/trips');
}

async function bulkApprove(req, res) {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : String(req.body.ids || '').split(',').filter(Boolean);
  await tripService.bulkApproveTrips(ids);
  await audit(req, 'trip.bulk-approve', 'trip', ids.join(','), `Bulk approved ${ids.length} trips`);
  req.session.flash = { type: 'success', message: `${ids.length} trips approved.` };
  res.redirect('/admin/trips/approvals');
}

module.exports = {
  list, createForm, uploadMedia, create, approvals, editForm, edit, detail, approve, reject, feature, remove, bulkApprove,
};
