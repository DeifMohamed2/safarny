const fs = require('fs');
const companyService = require('../services/companies');
const tripService = require('../services/trips');
const bookingService = require('../services/bookings');
const paymentService = require('../services/payments');
const ticketService = require('../services/tickets');
const { wantsJson } = require('../middleware/auth');
const {
  tripMediaUpload,
  validateUploadedFile,
  publicUploadPath,
  MAX_IMAGES,
  MAX_VIDEOS,
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
} = require('../lib/trip-media');
const {
  companyLogoUpload,
  validateLogoFile,
  publicLogoPath,
  LOGO_MAX_BYTES,
} = require('../lib/company-logo');
const {
  ticketAttachmentUpload,
  mapUploadedAttachments,
  uploadErrorResponse,
} = require('../lib/ticket-attachments');
const {
  companyDocsUpload,
  DOC_FIELDS,
  fileFromField,
  finalizeUploadedDocs,
  removeUploadedFiles,
  hasBothDocs,
  uploadErrorMessage,
} = require('../lib/company-docs');

function companyId(req) {
  return req.session.user.companyId;
}

function withLayout(res, view, data) {
  return res.render(view, { layout: 'layouts/company', ...data });
}

function dashboardRedirect(req, res) {
  res.redirect('/company/dashboard');
}

async function dashboard(req, res) {
  const cid = companyId(req);
  const trips = await tripService.getTripsByCompany(cid);
  const stats = await bookingService.getDashboardStats(cid, trips, { locale: res.locals.lang || 'en' });
  withLayout(res, 'pages/company/dashboard', {
    title: 'Company Dashboard',
    companyActive: 'dashboard',
    trips,
    stats,
  });
}

async function trips(req, res) {
  const filters = {
    status: String(req.query.status || 'all'),
    q: String(req.query.q || '').trim(),
    destination: String(req.query.destination || 'all'),
    type: String(req.query.type || 'all'),
    offer: String(req.query.offer || 'all'),
    availability: String(req.query.availability || 'all'),
    sort: String(req.query.sort || 'newest'),
    priceMin: req.query.priceMin,
    priceMax: req.query.priceMax,
  };
  const view = String(req.query.view || 'grid');
  const cid = companyId(req);
  const bookings = await bookingService.getBookingsByCompany(cid);
  const meta = await tripService.getTripListMeta(cid);
  const items = (await tripService.getTripsByCompany(cid, filters)).map((trip) => tripService.enrichTripForList(trip, bookings));
  const hasActiveFilters =
    filters.q ||
    filters.status !== 'all' ||
    filters.destination !== 'all' ||
    filters.type !== 'all' ||
    filters.offer !== 'all' ||
    filters.availability !== 'all' ||
    filters.sort !== 'newest' ||
    filters.priceMin ||
    filters.priceMax;

  withLayout(res, 'pages/company/trips', {
    title: 'Trips',
    companyActive: 'trips',
    items,
    meta,
    filters,
    view: view === 'list' ? 'list' : 'grid',
    hasActiveFilters,
    resultCount: items.length,
  });
}

function newTripForm(req, res) {
  withLayout(res, 'pages/company/trip-form', {
    title: 'Create trip',
    companyActive: 'trips',
    mode: 'create',
    formTrip: null,
    mediaLimits: {
      maxImages: MAX_IMAGES,
      maxVideos: MAX_VIDEOS,
      imageMaxBytes: IMAGE_MAX_BYTES,
      videoMaxBytes: VIDEO_MAX_BYTES,
    },
  });
}

function uploadMedia(req, res) {
  tripMediaUpload.single('file')(req, res, (error) => {
    if (error) {
      if (error.message === 'UNSUPPORTED_TYPE') {
        return res.status(400).json({ ok: false, message: 'Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, WEBM, or MOV.' });
      }
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, message: 'File exceeds the maximum allowed size.' });
      }
      return res.status(400).json({ ok: false, message: error.message || 'Upload failed.' });
    }
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file received.' });
    const validation = validateUploadedFile(req.file);
    if (!validation.ok) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      return res.status(400).json({ ok: false, message: validation.message, code: validation.code });
    }
    return res.json({
      ok: true,
      url: publicUploadPath(companyId(req), req.file.filename),
      kind: validation.kind,
      size: req.file.size,
      name: req.file.originalname,
    });
  });
}

async function createTrip(req, res) {
  if (!req.body.title || !req.body.destination) {
    req.session.flash = { type: 'error', message: 'Title and destination are required.' };
    return res.redirect('/company/trips/new');
  }
  if (res.locals.company?.verification !== 'verified' && req.body.status === 'active') {
    req.body.status = 'pending';
  }
  await tripService.createCompanyTrip(companyId(req), req.body);
  req.session.flash = { type: 'success', message: 'Trip created.' };
  res.redirect('/company/trips');
}

async function tripDetails(req, res) {
  const trip = await tripService.getCompanyTrip(req.params.id, companyId(req));
  if (!trip) return res.status(404).render('pages/not-found', { title: 'Not found' });
  const bookings = (await bookingService.getBookingsByCompany(companyId(req))).filter((item) => item.tripId === trip.id);
  withLayout(res, 'pages/company/trip-details', {
    title: trip.title,
    companyActive: 'trips',
    trip,
    bookings,
  });
}

async function editTripForm(req, res) {
  const trip = await tripService.getCompanyTrip(req.params.id, companyId(req));
  if (!trip) return res.status(404).render('pages/not-found', { title: 'Not found' });
  withLayout(res, 'pages/company/trip-form', {
    title: 'Edit trip',
    companyActive: 'trips',
    mode: 'edit',
    trip,
    formTrip: tripService.ensureTripDefaults(trip),
    mediaLimits: {
      maxImages: MAX_IMAGES,
      maxVideos: MAX_VIDEOS,
      imageMaxBytes: IMAGE_MAX_BYTES,
      videoMaxBytes: VIDEO_MAX_BYTES,
    },
  });
}

async function editTrip(req, res) {
  if (res.locals.company?.verification !== 'verified' && req.body.status === 'active') {
    req.body.status = 'pending';
  }
  const trip = await tripService.updateCompanyTrip(req.params.id, companyId(req), req.body);
  if (!trip) return res.status(404).render('pages/not-found', { title: 'Not found' });
  req.session.flash = { type: 'success', message: 'Trip updated.' };
  res.redirect(`/company/trips/${trip.id}`);
}

async function deleteTrip(req, res) {
  await tripService.deleteCompanyTrip(req.params.id, companyId(req));
  req.session.flash = { type: 'success', message: 'Trip deleted.' };
  res.redirect('/company/trips');
}

async function bookings(req, res) {
  const filters = {
    status: String(req.query.status || 'all'),
    q: String(req.query.q || '').trim(),
    tripId: String(req.query.tripId || 'all'),
    dateField: String(req.query.dateField || 'booked'),
    dateFrom: req.query.dateFrom || '',
    dateTo: req.query.dateTo || '',
    sort: String(req.query.sort || 'newest'),
    page: req.query.page || 1,
    perPage: req.query.perPage || 10,
  };
  const cid = companyId(req);
  const allForMeta = await bookingService.getBookingsByCompany(cid);
  const meta = bookingService.getBookingListMeta(cid, allForMeta);
  const allItems = await bookingService.filterBookingsByCompany(cid, filters);
  const { items, pagination } = bookingService.paginateList(
    allItems.map((item) => bookingService.enrichBookingForList(item)),
    filters.page,
    filters.perPage
  );
  const hasActiveFilters =
    filters.q ||
    filters.status !== 'all' ||
    filters.tripId !== 'all' ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sort !== 'newest' ||
    filters.dateField !== 'booked';

  withLayout(res, 'pages/company/bookings', {
    title: 'Bookings',
    companyActive: 'bookings',
    items,
    meta,
    filters,
    pagination,
    hasActiveFilters,
  });
}

async function bookingDetails(req, res) {
  const booking = await bookingService.getCompanyBooking(req.params.id, companyId(req));
  if (!booking) return res.status(404).render('pages/not-found', { title: 'Not found' });
  const [trip, payment] = await Promise.all([
    tripService.getCompanyTrip(booking.tripId, companyId(req)),
    booking.paymentId
      ? paymentService.getPaymentById(booking.paymentId)
      : paymentService.getPaymentByBookingId(booking.id),
  ]);
  withLayout(res, 'pages/company/booking-details', {
    title: `Booking ${booking.id}`,
    companyActive: 'bookings',
    booking: bookingService.enrichBookingDetail(booking, trip),
    trip,
    payment,
  });
}

async function updateBookingStatus(req, res) {
  const status = String(req.body.status || '');
  if (!['Pending', 'Confirmed', 'Cancelled'].includes(status)) {
    req.session.flash = { type: 'error', message: 'Invalid status.' };
    return res.redirect(`/company/bookings/${req.params.id}`);
  }
  const booking = await bookingService.updateBookingStatus(req.params.id, companyId(req), status, {
    byUserId: req.session.user.id,
  });
  if (!booking) return res.status(404).render('pages/not-found', { title: 'Not found' });
  req.session.flash = { type: 'success', message: 'Booking updated.' };
  res.redirect(`/company/bookings/${booking.id}`);
}

function chatRedirect(req, res) {
  res.redirect('/company/support');
}

function newSupportForm(req, res) {
  withLayout(res, 'pages/company/support-new', {
    title: 'New ticket',
    companyActive: 'support',
    categories: ticketService.TICKET_CATEGORIES,
  });
}

async function createSupport(req, res) {
  const company = await companyService.getCompanyById(companyId(req));
  const ticket = await ticketService.createCompanyTicket(companyId(req), company?.title, {
    subject: req.body.subject,
    category: req.body.category,
    priority: req.body.priority,
    message: req.body.message,
  });
  if (!ticket) {
    req.session.flash = { type: 'error', message: 'Please fill in all required fields.' };
    return res.redirect('/company/support/new');
  }
  req.session.flash = { type: 'success', message: 'Ticket submitted successfully.' };
  res.redirect(`/company/support/${ticket.id}`);
}

async function supportList(req, res) {
  if (req.query.ticket) return res.redirect(`/company/support/${req.query.ticket}`);
  const filters = {
    status: String(req.query.status || 'all'),
    q: String(req.query.q || '').trim(),
    category: String(req.query.category || 'all'),
    priority: String(req.query.priority || 'all'),
    sort: String(req.query.sort || 'newest'),
    page: req.query.page || 1,
    perPage: 10,
  };
  const cid = companyId(req);
  const meta = await ticketService.getTicketListMeta(cid);
  const allItems = await ticketService.filterTicketsByCompany(cid, filters);
  const { items, pagination } = ticketService.paginateList(allItems, filters.page, filters.perPage);
  const hasActiveFilters =
    filters.q ||
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.priority !== 'all' ||
    filters.sort !== 'newest';

  withLayout(res, 'pages/company/support', {
    title: 'Support',
    companyActive: 'support',
    items,
    meta,
    filters,
    pagination,
    hasActiveFilters,
  });
}

async function supportDetail(req, res) {
  const cid = companyId(req);
  const ticket = await ticketService.getCompanyTicket(req.params.id, cid);
  if (!ticket) return res.status(404).render('pages/not-found', { title: 'Not found' });
  await ticketService.markTicketRead(ticket.id, cid);
  withLayout(res, 'pages/company/support-detail', {
    title: ticket.ticketNo,
    companyActive: 'support',
    ticket,
    threadItems: await ticketService.getTicketThread(ticket.id),
    supportName: ticketService.SUPPORT_NAME,
    supportAvatar: ticketService.SUPPORT_AVATAR,
  });
}

function supportReply(req, res) {
  ticketAttachmentUpload.array('attachments')(req, res, async (uploadError) => {
    if (uploadError) {
      if (wantsJson(req)) return uploadErrorResponse(uploadError, res);
      req.session.flash = { type: 'error', message: uploadError.message || 'Upload failed.' };
      return res.redirect(`/company/support/${req.params.id}`);
    }
    const text = String(req.body.text || '').trim();
    const attachments = mapUploadedAttachments(req);
    const company = await companyService.getCompanyById(companyId(req));
    const cid = companyId(req);
    if (!text && !attachments.length) {
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Message or attachment is required.' });
      req.session.flash = { type: 'error', message: 'Message or attachment is required.' };
      return res.redirect(`/company/support/${req.params.id}`);
    }
    const reply = await ticketService.addTicketReply(req.params.id, cid, text, company?.title, attachments);
    if (!reply) {
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Could not send reply.' });
      req.session.flash = { type: 'error', message: 'Could not send reply.' };
      return res.redirect(`/company/support/${req.params.id}`);
    }
    if (wantsJson(req)) return res.json({ ok: true, message: 'Reply sent.', reply });
    req.session.flash = { type: 'success', message: 'Reply sent.' };
    res.redirect(`/company/support/${req.params.id}`);
  });
}

function settingsPage(req, res) {
  withLayout(res, 'pages/company/settings', {
    title: 'Settings',
    companyActive: 'settings',
    logoMaxBytes: LOGO_MAX_BYTES,
  });
}

function uploadLogo(req, res) {
  companyLogoUpload.single('file')(req, res, async (error) => {
    if (error) {
      if (error.message === 'UNSUPPORTED_TYPE') {
        return res.status(400).json({ ok: false, message: 'Use JPG, PNG, WEBP, or GIF.' });
      }
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, message: 'Logo must be 2 MB or less.' });
      }
      return res.status(400).json({ ok: false, message: error.message || 'Upload failed.' });
    }
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file received.' });
    const validation = validateLogoFile(req.file);
    if (!validation.ok) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
      return res.status(400).json({ ok: false, message: validation.message, code: validation.code });
    }
    const url = publicLogoPath(companyId(req), req.file.filename);
    await companyService.updateCompany(companyId(req), { image: url });
    return res.json({ ok: true, url, size: req.file.size, name: req.file.originalname });
  });
}

function uploadVerificationDocs(req, res) {
  companyDocsUpload.fields(DOC_FIELDS)(req, res, async (error) => {
    const fail = (message) => {
      removeUploadedFiles(req);
      req.session.flash = { type: 'error', message };
      return res.redirect('/company/settings');
    };
    if (error) return fail(uploadErrorMessage(error));
    if (!fileFromField(req, 'commercialRegister') && !fileFromField(req, 'taxCard')) {
      return fail('Please choose at least one document to upload.');
    }
    const cid = companyId(req);
    const current = await companyService.getCompanyById(cid);
    const uploaded = finalizeUploadedDocs(req, cid);
    const verificationDocs = {
      commercialRegister: uploaded.commercialRegister || current?.verificationDocs?.commercialRegister,
      taxCard: uploaded.taxCard || current?.verificationDocs?.taxCard,
    };
    const patch = { verificationDocs };
    if (current?.verification === 'rejected' && hasBothDocs(verificationDocs)) {
      patch.verification = 'pending';
    }
    await companyService.updateCompany(cid, patch);
    req.session.flash = {
      type: 'success',
      message: patch.verification === 'pending'
        ? 'Documents updated. Your company is back under review.'
        : 'Verification documents updated.',
    };
    res.redirect('/company/settings');
  });
}

async function updateSettings(req, res) {
  const cid = companyId(req);
  const current = await companyService.getCompanyById(cid);
  await companyService.updateCompany(cid, {
    title: req.body.title,
    description: req.body.description,
    location: req.body.location,
    contactNumber: req.body.contactNumber,
    image: req.body.image || current?.image,
  });
  req.session.flash = { type: 'success', message: 'Company profile updated.' };
  res.redirect('/company/settings');
}

module.exports = {
  dashboardRedirect,
  dashboard,
  trips,
  newTripForm,
  uploadMedia,
  createTrip,
  tripDetails,
  editTripForm,
  editTrip,
  deleteTrip,
  bookings,
  bookingDetails,
  updateBookingStatus,
  chatRedirect,
  newSupportForm,
  createSupport,
  supportList,
  supportDetail,
  supportReply,
  settingsPage,
  uploadLogo,
  uploadVerificationDocs,
  updateSettings,
};
