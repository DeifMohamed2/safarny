const tripService = require('../services/trips');
const bookingService = require('../services/bookings');
const reviewService = require('../services/reviews');
const ticketService = require('../services/tickets');
const userService = require('../services/users');
const { buildPagination, pageUrl, isSacredTripType } = require('../lib/helpers');
const { wantsJson } = require('../middleware/auth');
const { supportedLangs } = require('../lib/i18n');
const {
  ticketAttachmentUpload,
  mapUploadedAttachments,
  uploadErrorResponse,
} = require('../lib/ticket-attachments');
const { toTravelerBooking } = require('../presenters/booking');
const settingsService = require('../services/settings');
const paymentService = require('../services/payments');
const { PAYMENT_METHODS, isValidMethod } = require('../lib/payment-methods');
const { paymentProofUpload, mapUploadedProof } = require('../lib/payment-proof');
const refundService = require('../services/refunds');
const invoiceService = require('../services/invoices');
const { REFUND_METHODS, REFUND_REASONS } = require('../lib/payout-details');
const companyService = require('../services/companies');
const { resolveMarkup, applyMarkup } = require('../lib/markup');
const {
  clampGuestCount,
  validateGuestCount,
  occupancyOf,
  occupancyForType,
  maxRoomsForDate,
  clampRoomCount,
  validateRoomCount,
  guestsFromRooms,
  enabledRoomTypes,
  defaultRoomTypeId,
  priceForRoomType,
  roomTypeLabel,
  ensureTripDefaults,
} = require('../lib/trip-form-helpers');

function listContext(req, items, perPage = 12) {
  const paged = tripService.paginate(items, req.query.page, perPage);
  return {
    ...paged,
    pagination: buildPagination(paged.currentPage, paged.totalPages),
    pageUrl: (page) => pageUrl(req.path, req.query, page),
  };
}

const TRIP_FILTER_KEYS = ['q', 'destination', 'date', 'guests', 'beds', 'tripType', 'priceFrom', 'priceTo', 'duration'];

function tripFilterParams(query = {}) {
  const offersOnly = query.offersOnly === '1' || query.offersOnly === 'true' || query.offersOnly === true;
  return {
    q: query.q,
    destination: query.destination,
    date: query.date,
    guests: query.guests,
    beds: query.beds,
    tripType: query.tripType,
    type: query.type,
    priceFrom: query.priceFrom,
    priceTo: query.priceTo,
    duration: query.duration,
    offersOnly,
  };
}

function hasTripFilters(query = {}) {
  return TRIP_FILTER_KEYS.some((key) => {
    const value = query[key];
    if (value === undefined || value === null || String(value).trim() === '') return false;
    if (key === 'guests' && String(value).trim() === '1') return false;
    if (key === 'tripType') return false;
    return true;
  });
}

function sacredFilterType(query = {}) {
  const type = String(query.tripType || query.type || '').trim().toLowerCase();
  if (type === 'hajj' || type === 'umrah') return type;
  return 'sacred';
}

function redirectIfSacredTripType(req, res) {
  const type = String(req.query.tripType || req.query.type || '').trim().toLowerCase();
  if (type !== 'umrah' && type !== 'hajj') return false;
  const params = new URLSearchParams(req.query);
  params.delete('type');
  params.set('tripType', type);
  const qs = params.toString();
  res.redirect(qs ? `/umrah?${qs}` : '/umrah');
  return true;
}

async function setLang(req, res) {
  const code = supportedLangs.includes(req.params.code) ? req.params.code : 'en';
  req.session.lang = code;
  if (req.session.user?.role === 'traveler') {
    await userService.setLanguage(req.session.user.id, code);
  }
  res.redirect(req.query.redirect || req.get('referer') || '/');
}

async function toggleFavorite(req, res) {
  const id = String(req.params.id);
  req.session.favorites = req.session.favorites || [];
  if (req.session.user?.role === 'traveler') {
    req.session.favorites = await userService.toggleFavorite(req.session.user.id, id);
  } else {
    const index = req.session.favorites.indexOf(id);
    if (index >= 0) req.session.favorites.splice(index, 1);
    else req.session.favorites.push(id);
  }
  if (wantsJson(req)) {
    return res.json({ ok: true, favorite: req.session.favorites.includes(id), favorites: req.session.favorites });
  }
  res.redirect(req.get('referer') || '/trips');
}

async function home(req, res) {
  const [allTrips, reviews] = await Promise.all([
    tripService.catalog(),
    reviewService.getPublishedReviews(),
  ]);
  const featuredTrips = allTrips.filter((trip) => !isSacredTripType(trip.type)).slice(0, 6);
  const umrahTrips = allTrips.filter((trip) => isSacredTripType(trip.type)).slice(0, 8);
  res.render('pages/home', {
    title: 'Safarny',
    featuredTrips,
    umrahTrips,
    reviews,
    openSignIn: req.query.signin === '1',
  });
}

async function suggest(req, res) {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 6));
  const lang = req.query.lang === 'ar' || req.query.lang === 'en' ? req.query.lang : res.locals.lang;
  res.set('Cache-Control', 'private, max-age=20');
  res.json({ ok: true, q, ...(await tripService.suggestTrips(q, limit, tripFilterParams(req.query), lang)) });
}

async function searchPreview(req, res) {
  const filtered = await tripService.filterTrips(tripFilterParams(req.query));
  res.json({ ok: true, count: filtered.length });
}

async function search(req, res) {
  if (redirectIfSacredTripType(req, res)) return;
  const filtered = await tripService.filterTrips(tripFilterParams(req.query));
  const ctx = listContext(req, filtered, 8);
  res.render('pages/search', {
    title: 'Search',
    ...ctx,
    filters: req.query,
    hasActiveFilters: hasTripFilters(req.query),
    clearUrl: '/search',
  });
}

async function trips(req, res) {
  if (redirectIfSacredTripType(req, res)) return;
  const all = await tripService.catalog();
  const leisure = all.filter((trip) => !isSacredTripType(trip.type));
  const filtered = await tripService.filterTrips({ ...tripFilterParams(req.query), type: 'leisure' });
  const ctx = listContext(req, filtered, 12);
  res.render('pages/trips', {
    title: 'Trips',
    ...ctx,
    offerTrips: leisure.filter((trip) => trip.offer),
    filters: req.query,
    hasActiveFilters: hasTripFilters(req.query),
    clearUrl: '/trips',
  });
}

async function offers(req, res) {
  if (redirectIfSacredTripType(req, res)) return;
  const filtered = await tripService.filterTrips({ ...tripFilterParams(req.query), offersOnly: true, type: 'leisure' });
  const ctx = listContext(req, filtered, 12);
  res.render('pages/offers', {
    title: 'Offers',
    ...ctx,
    filters: req.query,
    hasActiveFilters: hasTripFilters(req.query),
    clearUrl: '/trips/offers',
  });
}

async function tripDetails(req, res) {
  const trip = await tripService.getPublicTripById(req.params.id);
  if (!trip) {
    return res.status(404).render('pages/not-found', { title: 'Not found' });
  }
  const resolvedTripDates = tripService.resolveTripDates(trip, res.locals.lang || 'en');
  const recommended = (await tripService.catalog())
    .filter((item) => item.id !== trip.id && item.type === trip.type)
    .slice(0, 8);
  res.render('pages/trip-details', {
    title: trip.title,
    trip,
    tripDates: resolvedTripDates,
    recommendedTrips: recommended,
  });
}

async function checkoutForm(req, res) {
  const trip = await tripService.getPublicTripById(req.params.id);
  if (!trip) return res.status(404).render('pages/not-found', { title: 'Not found' });
  const tripDates = tripService.resolveTripDates(trip, res.locals.lang || 'en');
  const dateId = String(req.query.dateId || tripDates[0]?.id || '');
  const selectedDate = tripDates.find((d) => d.id === dateId) || tripDates[0];
  const types = enabledRoomTypes(trip);
  const roomType = String(req.query.roomType || defaultRoomTypeId(trip, selectedDate) || types[0]?.type || '');
  const occupancy = occupancyForType(roomType) || occupancyOf(trip);
  const maxRooms = maxRoomsForDate(trip, selectedDate, roomType);
  const rooms = clampRoomCount(trip, selectedDate, Number(req.query.rooms) || 1, roomType);
  const guestCount = guestsFromRooms(trip, selectedDate, rooms || 1, roomType);
  const settings = await settingsService.getSettings();
  const roomPrice = priceForRoomType(trip, selectedDate, roomType);
  const total = roomPrice * (rooms || 1);
  const roomHint = res.locals.t('checkout.roomLimitHint', '{room} · sleeps {n} · up to {max} rooms · {price} EGP per room')
    .replace('{room}', roomTypeLabel(roomType, res.locals.t) || res.locals.bedTypeLabel(trip.beds))
    .replace('{n}', String(occupancy))
    .replace('{max}', String(maxRooms))
    .replace('{price}', res.locals.formatPrice(roomPrice));
  res.render('pages/checkout', {
    title: res.locals.t('checkout.title', 'Checkout'),
    trip,
    tripDates,
    selectedDate,
    dateId: selectedDate?.id || '',
    roomType,
    roomTypes: types,
    rooms: rooms || 1,
    guestCount,
    maxRooms,
    occupancy,
    canBook: maxRooms > 0,
    roomHint,
    roomPrice,
    perPerson: roomPrice,
    total,
    currency: settings.currency || 'EGP',
    paymentMethods: PAYMENT_METHODS,
    payoutAccounts: settings.payoutAccounts || {},
    scripts: '<script src="/js/checkout.js"></script>',
  });
}

function submitCheckout(req, res) {
  paymentProofUpload.single('proof')(req, res, async (uploadError) => {
    if (uploadError) {
      if (wantsJson(req)) return uploadErrorResponse(uploadError, res);
      req.session.flash = { type: 'error', message: uploadError.message || 'Upload failed.' };
      return res.redirect(`/trips/${req.params.id}/checkout`);
    }
    const trip = await tripService.getPublicTripById(req.params.id);
    if (!trip) return res.status(404).render('pages/not-found', { title: 'Not found' });

    const method = String(req.body.paymentMethod || '').trim();
    const proof = mapUploadedProof(req);
    if (!isValidMethod(method)) {
      req.session.flash = { type: 'error', message: 'Please select a payment method.' };
      return res.redirect(`/trips/${trip.id}/checkout?dateId=${req.body.dateId || ''}&roomType=${req.body.roomType || ''}&rooms=${req.body.rooms || 1}`);
    }
    if (!proof) {
      req.session.flash = { type: 'error', message: 'Payment proof is required.' };
      return res.redirect(`/trips/${trip.id}/checkout?dateId=${req.body.dateId || ''}&roomType=${req.body.roomType || ''}&rooms=${req.body.rooms || 1}`);
    }
    if (!req.body.terms) {
      req.session.flash = { type: 'error', message: 'Please accept the terms to continue.' };
      return res.redirect(`/trips/${trip.id}/checkout?dateId=${req.body.dateId || ''}&roomType=${req.body.roomType || ''}&rooms=${req.body.rooms || 1}`);
    }

    const dates = tripService.resolveTripDates(trip, res.locals.lang || 'en');
    const dateId = String(req.body.dateId || '');
    const selected = dates.find((item) => item.id === dateId) || dates[0];
    const roomType = String(req.body.roomType || defaultRoomTypeId(trip, selected) || '');
    const rooms = Math.max(1, Number(req.body.rooms) || 1);
    const roomCheck = validateRoomCount(trip, selected, rooms, roomType);
    if (!roomCheck.ok) {
      const message = roomCheck.code === 'OVER_ROOMS'
        ? res.locals.t('occupancy.overRooms', 'Too many rooms for this date.')
        : res.locals.t('occupancy.noSpots', 'No rooms left for that date.');
      req.session.flash = { type: 'error', message };
      return res.redirect(`/trips/${trip.id}/checkout?dateId=${selected?.id || ''}&roomType=${roomType}&rooms=${Math.min(rooms, roomCheck.maxRooms || 1)}`);
    }

    const rawTrip = await tripService.getTripById(req.params.id);
    const company = rawTrip ? await companyService.getCompanyById(rawTrip.companyId) : null;
    const pricedTrip = ensureTripDefaults(rawTrip || trip);
    const rawDate = (pricedTrip.travelDates || []).find((item) => item.id === selected?.id) || selected;
    const baseRoomPrice = priceForRoomType(pricedTrip, rawDate, roomType);
    const split = applyMarkup(baseRoomPrice, resolveMarkup(pricedTrip, company || {}));
    const result = await bookingService.createCheckoutBooking({
      trip,
      user: req.session.user,
      seats: roomCheck.guests,
      rooms: roomCheck.rooms,
      roomType,
      occupancy: roomCheck.occupancy,
      travelDateId: selected?.id,
      travelDateLabel: selected?.date,
      totalPrice: split.total * roomCheck.rooms,
      basePrice: split.base * roomCheck.rooms,
      markupAmount: split.markup * roomCheck.rooms,
      paymentMethod: method,
      paymentPayload: {
        senderName: String(req.body.senderName || req.session.user.userName || '').trim(),
        senderPhone: String(req.body.senderPhone || req.session.user.phone || '').trim(),
        transferRef: String(req.body.transferRef || '').trim(),
        proof,
      },
    });

    if (!result.ok) {
      const message = result.code === 'OVER_ROOMS'
        ? res.locals.t('occupancy.overRooms', 'Too many rooms for this date.')
        : result.code === 'NO_SEATS'
          ? res.locals.t('occupancy.noSpots', 'No rooms left for that date.')
          : 'Could not complete checkout. Please try again.';
      req.session.flash = { type: 'error', message };
      return res.redirect(`/trips/${trip.id}/checkout?dateId=${selected?.id || ''}&roomType=${roomType}&rooms=${rooms}`);
    }

    await userService.appendActivity(req.session.user.id, {
      type: 'booking',
      label: `Booked ${trip.title}`,
      meta: result.booking.code,
    });

    if (wantsJson(req)) return res.json({ ok: true, redirect: `/bookings/${result.booking.code}` });
    res.redirect(`/bookings/${result.booking.code}`);
  });
}

async function bookingConfirmation(req, res) {
  const booking = await bookingService.getBookingByCode(req.params.code, req.session.user.id);
  if (!booking) return res.status(404).render('pages/not-found', { title: 'Not found' });
  const [trip, payment] = await Promise.all([
    tripService.getPublicTripById(booking.tripId),
    paymentService.getPaymentByBookingId(booking.id),
  ]);
  const presented = toTravelerBooking(booking, trip, res.locals.lang);
  const refund = await refundService.getRefundByBookingId(booking.id);
  const refundOpen = booking.paymentStatus === 'verified'
    && !['cancelled', 'refunded'].includes(booking.status)
    && !['requested', 'approved', 'processing', 'refunded'].includes(booking.refundStatus);
  const refundWindowClosed = refundService.tripStartHasArrived(booking.tripDate);
  res.render('pages/booking-confirmation', {
    title: res.locals.t('checkout.confirmationTitle', 'Booking confirmation'),
    booking: presented,
    trip,
    payment,
    refund,
    refundMethods: REFUND_METHODS,
    refundReasons: REFUND_REASONS,
    canResubmit: payment?.status === 'rejected',
    canRefund: refundOpen && !refundWindowClosed,
    refundWindowClosed: refundOpen && refundWindowClosed,
    scripts: payment?.status === 'rejected' ? '<script src="/js/checkout.js"></script>' : '',
  });
}

function resubmitPayment(req, res) {
  paymentProofUpload.single('proof')(req, res, async (uploadError) => {
    if (uploadError) {
      if (wantsJson(req)) return uploadErrorResponse(uploadError, res);
      req.session.flash = { type: 'error', message: uploadError.message || 'Upload failed.' };
      return res.redirect(`/bookings/${req.params.code}`);
    }
    const booking = await bookingService.getBookingByCode(req.params.code, req.session.user.id);
    if (!booking) return res.status(404).render('pages/not-found', { title: 'Not found' });
    const proof = mapUploadedProof(req);
    const method = String(req.body.paymentMethod || booking.paymentMethod || '').trim();
    if (!proof && !req.body.keepProof) {
      req.session.flash = { type: 'error', message: 'Please upload a new payment proof.' };
      return res.redirect(`/bookings/${req.params.code}`);
    }
    const existing = await paymentService.getPaymentByBookingId(booking.id);
    if (!existing || existing.status !== 'rejected') {
      req.session.flash = { type: 'error', message: 'This booking cannot be updated.' };
      return res.redirect(`/bookings/${req.params.code}`);
    }
    const updated = await paymentService.resubmitPayment(existing.id, req.session.user.id, {
      method: isValidMethod(method) ? method : existing.method,
      senderName: String(req.body.senderName || existing.senderName).trim(),
      senderPhone: String(req.body.senderPhone || existing.senderPhone).trim(),
      transferRef: String(req.body.transferRef || existing.transferRef).trim(),
      proof: proof || existing.proof,
    });
    if (!updated) {
      req.session.flash = { type: 'error', message: 'Could not resubmit payment.' };
      return res.redirect(`/bookings/${req.params.code}`);
    }
    await bookingService.markPaymentResubmitted(booking.id, updated.id);
    req.session.flash = { type: 'success', message: 'Payment proof resubmitted for review.' };
    res.redirect(`/bookings/${req.params.code}`);
  });
}

async function requestRefund(req, res) {
  const booking = await bookingService.getBookingByCode(req.params.code, req.session.user.id);
  if (!booking) return res.status(404).render('pages/not-found', { title: 'Not found' });
  const result = await refundService.requestRefund(booking, req.session.user.id, {
    amount: req.body.amount,
    reasonCategory: req.body.reasonCategory,
    reason: req.body.reason,
    method: req.body.method,
    walletNumber: req.body.walletNumber,
    instapayIpa: req.body.instapayIpa,
    bankName: req.body.bankName,
    accountName: req.body.accountName,
    accountNumber: req.body.accountNumber,
    iban: req.body.iban,
  });
  req.session.flash = result.ok
    ? { type: 'success', message: 'Refund request submitted.' }
    : { type: 'error', message: result.message };
  res.redirect(`/bookings/${req.params.code}`);
}

async function downloadInvoice(req, res) {
  const booking = await bookingService.getBookingByCode(req.params.code, req.session.user.id);
  if (!booking) return res.status(404).render('pages/not-found', { title: 'Not found' });
  const ok = await invoiceService.streamInvoice(res, booking);
  if (!ok) {
    req.session.flash = { type: 'error', message: 'Invoice is available after payment is verified.' };
    res.redirect(`/bookings/${req.params.code}`);
  }
}

async function downloadCreditNote(req, res) {
  const booking = await bookingService.getBookingByCode(req.params.code, req.session.user.id);
  if (!booking) return res.status(404).render('pages/not-found', { title: 'Not found' });
  const refund = await refundService.getRefundByBookingId(booking.id);
  const ok = await invoiceService.streamCreditNote(res, refund, booking);
  if (!ok) {
    req.session.flash = { type: 'error', message: 'Credit note is available after the refund is paid.' };
    res.redirect(`/bookings/${req.params.code}`);
  }
}

async function bookTrip(req, res) {
  const trip = await tripService.getPublicTripById(req.params.id);
  if (!trip) return res.status(404).json({ ok: false });
  if (!req.session.user) {
    if (wantsJson(req)) return res.status(401).json({ ok: false, authRequired: true });
    return res.redirect(`/?signin=1&redirect=/trips/${trip.id}`);
  }
  const dates = tripService.resolveTripDates(trip, res.locals.lang || 'en');
  const requested = String(req.body.dateId || req.body.date || '');
  const selected = dates.find((item) => item.id === requested || item.date === requested) || dates[0];
  const result = await bookingService.createBooking({
    trip,
    user: req.session.user,
    seats: Number(req.body.persons) || 1,
    travelDateId: selected?.id,
    travelDateLabel: selected?.date,
  });
  if (!result.ok) {
    const message = result.code === 'NO_SEATS' ? 'Not enough seats available for that date.' : 'Could not complete booking.';
    if (wantsJson(req)) return res.status(409).json({ ok: false, message });
    req.session.flash = { type: 'error', message };
    return res.redirect(`/trips/${trip.id}`);
  }
  await userService.appendActivity(req.session.user.id, {
    type: 'booking',
    label: `Booked ${trip.title}`,
    meta: result.booking.code,
  });
  if (wantsJson(req)) return res.json({ ok: true });
  req.session.flash = { type: 'success', message: 'Booking request submitted.' };
  res.redirect('/booking-history');
}

async function umrah(req, res) {
  const sacredType = sacredFilterType(req.query);
  const filtered = await tripService.filterTrips({ ...tripFilterParams(req.query), type: sacredType });
  const ctx = listContext(req, filtered, 12);
  const dests = [...new Set((await tripService.filterTrips({ type: 'sacred' })).map((trip) => trip.destination))].filter(Boolean);
  res.render('pages/umrah', {
    title: res.locals.t('umrah.title', 'Umrah & Hajj'),
    ...ctx,
    filters: req.query,
    hasActiveFilters: hasTripFilters(req.query),
    clearUrl: '/umrah',
    umrahDestinations: dests,
  });
}

async function profile(req, res) {
  const [bookings, tickets] = await Promise.all([
    bookingService.getBookingsForUser(req.session.user),
    ticketService.getTicketsByUser(req.session.user.id),
  ]);
  res.render('pages/profile', {
    title: 'My Profile',
    accountActive: 'profile',
    bookingCount: bookings.length,
    savedCount: (req.session.favorites || []).length,
    ticketCount: tickets.length,
  });
}

async function saved(req, res) {
  const favoriteIds = req.session.favorites || [];
  const all = await tripService.catalog();
  const items = all.filter((trip) => favoriteIds.includes(String(trip.id)));
  res.render('pages/saved', {
    title: 'Saved Trips',
    accountActive: 'saved',
    items,
  });
}

function settingsPage(req, res) {
  res.render('pages/settings', {
    title: 'Settings',
    accountActive: 'settings',
  });
}

async function bookingHistory(req, res) {
  const bookings = await bookingService.getBookingsForUser(req.session.user);
  const trips = await Promise.all(bookings.map((b) => tripService.getTripById(b.tripId)));
  const presented = bookings.map((booking, index) => toTravelerBooking(booking, trips[index], res.locals.lang));
  const ctx = listContext(req, presented, 5);
  res.render('pages/booking-history', {
    title: 'Booking History',
    accountActive: 'bookings',
    ...ctx,
  });
}

function contactUs(req, res) {
  res.render('pages/contact-us', {
    title: 'Contact Us',
    accountActive: 'contact',
  });
}

async function submitContact(req, res) {
  const subject = String(req.body.subject || req.body.topic || 'Contact request').trim() || 'Contact request';
  const message = String(req.body.message || '').trim();
  if (message) {
    await ticketService.createTicket({
      subject,
      category: String(req.body.category || 'General'),
      message,
      userId: req.session.user.id,
      userName: req.session.user.userName,
    });
  }
  req.session.flash = { type: 'success', message: 'Your message has been sent.' };
  if (wantsJson(req)) return res.json({ ok: true });
  res.redirect('/contact-us');
}

async function ticketsPage(req, res) {
  const tickets = await ticketService.getTicketsByUser(req.session.user.id);
  const ticketParam = req.query.ticket ? String(req.query.ticket) : null;
  const view = ticketParam ? 'detail' : 'list';
  const activeTicket = ticketParam ? tickets.find((item) => item.id === ticketParam) || await ticketService.getTicket(ticketParam) : null;
  if (ticketParam && (!activeTicket || String(activeTicket.userId) !== String(req.session.user.id))) {
    return res.redirect('/tickets');
  }
  if (ticketParam) await ticketService.markRead(ticketParam, { userId: req.session.user.id });
  res.render('pages/tickets', {
    title: 'Support Tickets',
    accountActive: 'tickets',
    tickets,
    view,
    activeId: ticketParam,
    activeTicket,
    threadItems: ticketParam ? await ticketService.getThreadItems(ticketParam) : [],
    countByStatus: ticketService.countByStatusFactory(tickets),
    supportAvatar: ticketService.SUPPORT_AVATAR,
    supportName: ticketService.SUPPORT_NAME,
  });
}

function replyTicket(req, res) {
  ticketAttachmentUpload.array('attachments')(req, res, async (uploadError) => {
    if (uploadError) {
      if (wantsJson(req)) return uploadErrorResponse(uploadError, res);
      req.session.flash = { type: 'error', message: uploadError.message || 'Upload failed.' };
      return res.redirect(`/tickets?ticket=${req.params.id}`);
    }
    const text = String(req.body.text || '').trim();
    const attachments = mapUploadedAttachments(req);
    if (!text && !attachments.length) {
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Message or attachment is required.' });
      req.session.flash = { type: 'error', message: 'Message or attachment is required.' };
      return res.redirect(`/tickets?ticket=${req.params.id}`);
    }
    const reply = await ticketService.addReply(req.params.id, text, attachments, {
      from: 'user',
      author: req.session.user.userName || 'You',
      userId: req.session.user.id,
    });
    if (!reply) {
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Could not send reply.' });
      req.session.flash = { type: 'error', message: 'Could not send reply.' };
      return res.redirect(`/tickets?ticket=${req.params.id}`);
    }
    if (wantsJson(req)) {
      return res.json({
        ok: true,
        reply,
        replies: await ticketService.getReplies(req.params.id),
        tickets: await ticketService.getTicketsByUser(req.session.user.id),
      });
    }
    res.redirect(`/tickets?ticket=${req.params.id}`);
  });
}

async function newTicket(req, res) {
  const subject = String(req.body.subject || '').trim();
  const category = String(req.body.category || 'General').trim();
  const message = String(req.body.message || '').trim();
  if (!subject || !message) {
    if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Subject and message are required.' });
    req.session.flash = { type: 'error', message: 'Subject and message are required.' };
    return res.redirect('/tickets');
  }
  const ticket = await ticketService.createTicket({
    subject,
    category,
    message,
    userId: req.session.user.id,
    userName: req.session.user.userName,
  });
  if (wantsJson(req)) {
    return res.json({ ok: true, ticket, redirect: `/tickets?ticket=${ticket.id}` });
  }
  res.redirect(`/tickets?ticket=${ticket.id}`);
}

function chatRedirect(req, res) {
  const query = req.query.with ? `?ticket=${req.query.with}` : '';
  res.redirect(`/tickets${query}`);
}

async function chatReply(req, res) {
  const text = String(req.body.text || '').trim();
  if (text) {
    await ticketService.addReply(req.params.id, text, [], {
      from: 'user',
      author: req.session.user.userName || 'You',
      userId: req.session.user.id,
    });
  }
  if (wantsJson(req)) {
    return res.json({
      ok: true,
      messages: await ticketService.getReplies(req.params.id),
      conversations: await ticketService.getTicketsByUser(req.session.user.id),
    });
  }
  res.redirect(`/tickets?ticket=${req.params.id}`);
}

function companyRegister(req, res) {
  if (req.session.user?.role === 'company') return res.redirect('/company/dashboard');
  if (req.session.user?.role === 'admin') return res.redirect('/admin/companies');
  if (req.session.user) {
    req.session.flash = { type: 'error', message: res.locals.t('partner.signOutFirst', 'Please sign out of your traveler account before creating a company.') };
    return res.redirect('/');
  }
  const formDraft = req.session.formDraft || null;
  delete req.session.formDraft;
  res.render('pages/company-register', {
    title: res.locals.t('partner.title', 'Create your company account'),
    formDraft,
  });
}

function renderLegal(title) {
  return (req, res) => {
    res.render('pages/legal', { title, heading: title });
  };
}

module.exports = {
  setLang,
  toggleFavorite,
  home,
  suggest,
  searchPreview,
  search,
  trips,
  offers,
  tripDetails,
  checkoutForm,
  submitCheckout,
  bookingConfirmation,
  resubmitPayment,
  requestRefund,
  downloadInvoice,
  downloadCreditNote,
  bookTrip,
  umrah,
  profile,
  saved,
  settingsPage,
  bookingHistory,
  contactUs,
  submitContact,
  ticketsPage,
  replyTicket,
  newTicket,
  chatRedirect,
  chatReply,
  companyRegister,
  renderLegal,
};
