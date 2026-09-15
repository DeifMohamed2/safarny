const { Booking, nextSeq } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { normalizeStatus, titleCaseStatus } = require('../lib/status');
const { paginateList } = require('../lib/paginate');
const { toCompanyBooking, toAdminBooking, enrichBookingDetail, enrichAdminBookingDetail, toTravelerBooking, companyBaseAmount } = require('../presenters/booking');
const tripService = require('./trips');

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inDateRange(value, from, to) {
  const date = parseDate(value);
  if (!date) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function isConfirmed(booking) {
  return normalizeStatus(booking.status) === 'confirmed';
}

async function nextBookingCode() {
  const seq = await nextSeq('booking');
  return `B${String(seq).padStart(3, '0')}`;
}

function historyEntry(status, note, byUserId, label) {
  return {
    status: normalizeStatus(status),
    at: new Date(),
    byUserId: byUserId || '',
    note: note || '',
    label: label || `Booking ${normalizeStatus(status)}`,
  };
}

async function getBookingById(id) {
  if (!id) return null;
  return toDoc(await Booking.findById(String(id)).lean());
}

async function getCompanyBooking(id, companyId) {
  const booking = await getBookingById(id);
  if (!booking || String(booking.companyId) !== String(companyId)) return null;
  return booking;
}

function filterBookingsList(items, filters = {}, companyId) {
  const status = String(filters.status || 'all');
  const paymentStatus = String(filters.paymentStatus || 'all');
  const q = String(filters.q || '').trim().toLowerCase();
  const tripId = String(filters.tripId || 'all');
  const filterCompanyId = String(filters.companyId || companyId || 'all');
  const dateField = filters.dateField === 'trip' ? 'trip' : 'booked';
  const sort = String(filters.sort || 'newest');
  const dateFrom = parseDate(filters.dateFrom);
  const dateTo = parseDate(filters.dateTo);
  const endDate = dateTo ? new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999) : null;

  let next = items.filter((booking) => {
    if (filterCompanyId !== 'all' && String(booking.companyId) !== String(filterCompanyId)) return false;
    if (status !== 'all' && normalizeStatus(booking.status) !== normalizeStatus(status)) return false;
    if (paymentStatus !== 'all' && String(booking.paymentStatus || 'unpaid') !== paymentStatus) return false;
    if (tripId !== 'all' && booking.tripId !== tripId) return false;
    const rangeValue = dateField === 'trip' ? booking.tripDate : booking.bookingDate;
    if (!inDateRange(rangeValue, dateFrom, endDate)) return false;
    if (q) {
      const haystack = `${booking.tripName} ${booking.customerName} ${booking.customerEmail} ${booking.customerPhone} ${booking.id} ${booking.code} ${booking.referenceCode || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorters = {
    newest: (a, b) => new Date(b.bookingDate) - new Date(a.bookingDate),
    oldest: (a, b) => new Date(a.bookingDate) - new Date(b.bookingDate),
    'trip-soon': (a, b) => new Date(a.tripDate) - new Date(b.tripDate),
    'trip-late': (a, b) => new Date(b.tripDate) - new Date(a.tripDate),
    'amount-desc': (a, b) => Number(b.totalPrice) - Number(a.totalPrice),
    'amount-asc': (a, b) => Number(a.totalPrice) - Number(b.totalPrice),
  };
  next.sort(sorters[sort] || sorters.newest);
  return next;
}

async function getAllBookings(filters = {}) {
  const items = toDocs(await Booking.find().lean());
  return filterBookingsList(items, filters).map(toAdminBooking);
}

async function getBookingsByCompany(companyId, filters = {}) {
  const items = toDocs(await Booking.find({ companyId: String(companyId) }).lean());
  return filterBookingsList(items, filters, companyId).map(toCompanyBooking);
}

async function filterBookingsByCompany(companyId, filters = {}) {
  return getBookingsByCompany(companyId, filters);
}

function getBookingListMeta(companyId, bookings = []) {
  const items = bookings;
  const statusCounts = {
    all: items.length,
    pending: items.filter((item) => normalizeStatus(item.status) === 'pending').length,
    confirmed: items.filter((item) => normalizeStatus(item.status) === 'confirmed').length,
    cancelled: items.filter((item) => normalizeStatus(item.status) === 'cancelled').length,
  };
  const trips = [...new Set(items.map((item) => item.tripId))].map((id) => {
    const booking = items.find((item) => item.tripId === id);
    return { id, name: booking?.tripName || id };
  });
  return {
    total: items.length,
    statusCounts,
    trips,
    revenue: items.filter((item) => normalizeStatus(item.status) === 'confirmed').reduce((sum, item) => sum + companyBaseAmount(item), 0),
    earningsBase: items.filter((item) => normalizeStatus(item.status) === 'confirmed').reduce((sum, item) => sum + companyBaseAmount(item), 0),
    unsettledBase: items
      .filter((item) => normalizeStatus(item.status) === 'confirmed' && item.settlementStatus !== 'settled')
      .reduce((sum, item) => sum + companyBaseAmount(item), 0),
    settledBase: items
      .filter((item) => normalizeStatus(item.status) === 'confirmed' && item.settlementStatus === 'settled')
      .reduce((sum, item) => sum + companyBaseAmount(item), 0),
    seats: items.reduce((sum, item) => sum + Number(item.seats || 0), 0),
  };
}

async function getBookingListMetaForCompany(companyId) {
  const items = await getBookingsByCompany(companyId);
  return getBookingListMeta(companyId, items);
}

function enrichBookingForList(booking) {
  return toCompanyBooking(booking);
}

async function returnSeatsIfNeeded(previous, nextStatus) {
  const wasActive = ['pending', 'confirmed'].includes(normalizeStatus(previous.status));
  const nowInactive = ['cancelled', 'refunded'].includes(normalizeStatus(nextStatus));
  const nowActive = ['pending', 'confirmed'].includes(normalizeStatus(nextStatus));
  const wasInactive = ['cancelled', 'refunded'].includes(normalizeStatus(previous.status));
  if (wasActive && nowInactive) {
    await tripService.incrementSeats(previous.tripId, previous.travelDateId, previous.seats, {
      roomType: previous.roomType,
      rooms: previous.rooms,
    });
  } else if (wasInactive && nowActive) {
    await tripService.decrementSeats(previous.tripId, previous.travelDateId, previous.seats, {
      roomType: previous.roomType,
      rooms: previous.rooms,
    });
  }
}

const COMPANY_CANCEL_REASONS = ['traveler_request', 'operational', 'overbooking', 'duplicate', 'invalid_details', 'other'];

async function updateBookingStatus(id, companyId, status, { byUserId, note } = {}) {
  if (normalizeStatus(status) !== 'cancelled') {
    return { ok: false, code: 'FORBIDDEN', message: 'Companies can only cancel bookings.' };
  }
  return cancelCompanyBooking(id, companyId, { byUserId, reason: 'other', note });
}

async function cancelCompanyBooking(id, companyId, { byUserId, reason, note } = {}) {
  const booking = await getCompanyBooking(id, companyId);
  if (!booking) return { ok: false, code: 'NOT_FOUND' };
  const current = normalizeStatus(booking.status);
  if (current === 'cancelled' || current === 'refunded') {
    return { ok: false, code: 'ALREADY_CLOSED', message: 'This booking is already closed.' };
  }
  const reasonId = COMPANY_CANCEL_REASONS.includes(String(reason || '')) ? String(reason) : '';
  if (!reasonId) return { ok: false, code: 'REASON_REQUIRED', message: 'Choose a cancellation reason.' };
  const extra = String(note || '').trim();
  if (reasonId === 'other' && extra.length < 4) {
    return { ok: false, code: 'NOTE_REQUIRED', message: 'Please explain the cancellation reason.' };
  }
  const historyNote = extra ? `${reasonId}: ${extra}` : reasonId;
  await returnSeatsIfNeeded(booking, 'cancelled');
  const updated = await Booking.findByIdAndUpdate(
    String(id),
    {
      $set: {
        status: 'cancelled',
        cancelReason: reasonId,
        cancelNote: extra,
        cancelledBy: 'company',
        cancelledAt: new Date(),
      },
      $push: {
        statusHistory: historyEntry('cancelled', historyNote, byUserId, 'Cancelled by company'),
      },
    },
    { new: true }
  ).lean();
  return { ok: true, booking: toCompanyBooking(toDoc(updated)) };
}

async function adminUpdateBookingStatus(id, status, reason, byUserId) {
  const booking = await getBookingById(id);
  if (!booking) return null;
  const match = ['pending', 'confirmed', 'cancelled', 'refunded'].find((item) => item === normalizeStatus(status));
  if (!match) return null;
  await returnSeatsIfNeeded(booking, match);
  const $set = { status: match };
  if (reason) $set.adminNote = String(reason);
  if (match === 'cancelled') {
    $set.cancelReason = $set.cancelReason || 'admin';
    $set.cancelNote = String(reason || '');
    $set.cancelledBy = 'admin';
    $set.cancelledAt = new Date();
  }
  const updated = await Booking.findByIdAndUpdate(
    String(id),
    {
      $set,
      $push: { statusHistory: historyEntry(match, reason, byUserId, `Booking ${titleCaseStatus(match).toLowerCase()}`) },
    },
    { new: true }
  ).lean();
  return toCompanyBooking(toDoc(updated));
}

function buildChartTicks(max) {
  if (max <= 0) return [0, 1];
  if (max <= 5) return Array.from({ length: max + 1 }, (_, index) => index);
  const step = Math.max(1, Math.ceil(max / 4));
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return ticks;
}

function buildMonthlyBookingSeries(bookings, { monthCount = 8, locale = 'en' } = {}) {
  const now = new Date();
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  const series = [];
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const value = bookings.filter((booking) => {
      const booked = new Date(booking.bookingDate);
      return booked.getFullYear() === year && booked.getMonth() === month;
    }).length;
    series.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      monthLabel: date.toLocaleDateString(dateLocale, { month: 'short' }),
      monthFull: date.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' }),
      value,
      year,
      month,
    });
  }
  return series;
}

async function getDashboardStats(companyId, trips = [], { locale = 'en', monthCount = 8 } = {}) {
  const bookings = await getBookingsByCompany(companyId);
  const confirmed = bookings.filter((item) => normalizeStatus(item.status) === 'confirmed');
  const pending = bookings.filter((item) => normalizeStatus(item.status) === 'pending');
  const cancelled = bookings.filter((item) => normalizeStatus(item.status) === 'cancelled');
  const earningsBase = confirmed.reduce((sum, item) => sum + companyBaseAmount(item), 0);
  const unsettledBase = confirmed
    .filter((item) => item.settlementStatus !== 'settled')
    .reduce((sum, item) => sum + companyBaseAmount(item), 0);
  const settledBase = confirmed
    .filter((item) => item.settlementStatus === 'settled')
    .reduce((sum, item) => sum + companyBaseAmount(item), 0);
  const revenue = earningsBase;
  const statusCounts = trips.reduce((acc, trip) => {
    acc[trip.status] = (acc[trip.status] || 0) + 1;
    return acc;
  }, {});
  const monthlyBookings = buildMonthlyBookingSeries(bookings, { monthCount, locale });
  const monthlyValues = monthlyBookings.map((item) => item.value);
  const monthlyPeak = Math.max(0, ...monthlyValues);
  const chartMax = Math.max(1, monthlyPeak);
  const monthlyBookingsTotal = monthlyValues.reduce((sum, value) => sum + value, 0);
  const lastMonth = monthlyBookings[monthlyBookings.length - 1]?.value || 0;
  const prevMonth = monthlyBookings[monthlyBookings.length - 2]?.value || 0;
  const monthlyTrend = prevMonth === 0 ? (lastMonth > 0 ? 100 : 0) : Math.round(((lastMonth - prevMonth) / prevMonth) * 100);

  return {
    totalTrips: trips.length,
    activeTrips: trips.filter((trip) => trip.status === 'active').length,
    pendingTrips: trips.filter((trip) => trip.status === 'pending').length,
    totalBookings: bookings.length,
    confirmedBookings: confirmed.length,
    pendingBookings: pending.length,
    cancelledBookings: cancelled.length,
    revenue,
    earningsBase,
    unsettledBase,
    settledBase,
    statusCounts,
    bookingStatusCounts: { confirmed: confirmed.length, pending: pending.length, cancelled: cancelled.length },
    monthlyBookings,
    monthlyBookingsTotal,
    monthlyBookingsPeak: monthlyPeak,
    monthlyBookingsChartMax: chartMax,
    monthlyBookingsTicks: buildChartTicks(chartMax),
    monthlyTrend,
    recentBookings: [...bookings]
      .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
      .slice(0, 5)
      .map(toCompanyBooking),
  };
}

async function getBookingsForUser(user) {
  if (!user) return [];
  const email = String(user.email || '').toLowerCase();
  const items = toDocs(await Booking.find({
    $or: [
      { userId: String(user.id) },
      { customerEmail: email },
    ],
  }).sort({ bookingDate: -1 }).lean());
  return items;
}

async function createBooking({ trip, user, seats, rooms, roomType, occupancy, travelDateId, travelDateLabel, paymentMethod, paymentStatus, paymentId, totalPrice }) {
  const qty = Math.max(1, Number(seats) || 1);
  const roomQty = Math.max(1, Number(rooms) || 1);
  const reserved = await tripService.decrementSeats(trip.id, travelDateId, qty, {
    roomType,
    rooms: roomType ? roomQty : 0,
  });
  if (!reserved) return { ok: false, code: 'NO_SEATS' };

  const code = await nextBookingCode();
  const selected = (reserved.travelDates || []).find((item) => item.id === travelDateId);
  const tripDate = selected?.startDate || reserved.startDate || null;
  try {
    const created = await Booking.create({
      _id: code,
      code,
      companyId: reserved.companyId,
      tripId: reserved.id,
      userId: user?.id || null,
      tripName: reserved.title,
      customerName: user?.userName || '',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
      seats: qty,
      rooms: roomQty,
      roomType: roomType || '',
      occupancy: Number(occupancy) || 0,
      totalPrice: Number(totalPrice != null ? totalPrice : Number(reserved.price || 0) * qty),
      basePrice: Number(totalPrice != null ? totalPrice : Number(reserved.price || 0) * qty),
      markupAmount: 0,
      settlementStatus: 'unsettled',
      bookingDate: new Date(),
      tripDate: tripDate ? new Date(tripDate) : null,
      travelDateId: travelDateId || '',
      status: 'pending',
      notes: travelDateLabel || '',
      paymentMethod: paymentMethod || 'legacy',
      paymentStatus: paymentStatus || 'unpaid',
      paymentId: paymentId || '',
      image: reserved.images?.[0] || reserved.image || '',
      category: reserved.category || '',
      location: reserved.location || `${reserved.destination}, Egypt`,
      duration: `${reserved.days || 1} Days / ${reserved.nights || 0} Nights`,
      statusHistory: [historyEntry('pending', '', user?.id, 'Booking placed')],
    });
    return { ok: true, booking: toDoc(created) };
  } catch (error) {
    await tripService.incrementSeats(trip.id, travelDateId, qty, {
      roomType,
      rooms: roomType ? roomQty : 0,
    });
    return { ok: false, code: 'CREATE_FAILED', error };
  }
}

async function createCheckoutBooking({
  trip,
  user,
  seats,
  rooms,
  roomType,
  occupancy,
  travelDateId,
  travelDateLabel,
  paymentMethod,
  paymentPayload,
  totalPrice: quotedTotal,
  basePrice: quotedBase,
  markupAmount: quotedMarkup,
}) {
  const paymentService = require('./payments');
  const { leftoverSpotsForDate } = require('../lib/trip-form-helpers');
  const qty = Math.max(1, Number(seats) || 1);
  const roomQty = Math.max(1, Number(rooms) || 1);
  const dateEntry = (trip.travelDates || []).find((item) => item.id === travelDateId)
    || { availableSpots: trip.availableSeats ?? trip.availableSpots };
  if (leftoverSpotsForDate(trip, dateEntry) < qty) {
    return { ok: false, code: 'NO_SEATS' };
  }

  const reserved = await tripService.decrementSeats(trip.id, travelDateId, qty, {
    roomType,
    rooms: roomType ? roomQty : 0,
  });
  if (!reserved) return { ok: false, code: 'NO_SEATS' };

  const code = await nextBookingCode();
  const selected = (reserved.travelDates || []).find((item) => item.id === travelDateId);
  const tripDate = selected?.startDate || reserved.startDate || null;
  const totalPrice = Number(quotedTotal != null ? quotedTotal : Number(reserved.price || 0) * qty);
  const basePrice = Number(quotedBase != null ? quotedBase : totalPrice);
  const markupAmount = Number(quotedMarkup != null ? quotedMarkup : Math.max(0, totalPrice - basePrice));

  let bookingDoc = null;
  let paymentDoc = null;
  try {
    bookingDoc = await Booking.create({
      _id: code,
      code,
      companyId: reserved.companyId,
      tripId: reserved.id,
      userId: user?.id || null,
      tripName: reserved.title,
      customerName: user?.userName || '',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
      seats: qty,
      rooms: roomQty,
      roomType: roomType || '',
      occupancy: Number(occupancy) || 0,
      totalPrice,
      basePrice,
      markupAmount,
      settlementStatus: 'unsettled',
      bookingDate: new Date(),
      tripDate: tripDate ? new Date(tripDate) : null,
      travelDateId: travelDateId || '',
      status: 'pending',
      notes: travelDateLabel || '',
      paymentMethod,
      paymentStatus: 'submitted',
      paymentId: '',
      image: reserved.images?.[0] || reserved.image || '',
      category: reserved.category || '',
      location: reserved.location || `${reserved.destination}, Egypt`,
      duration: `${reserved.days || 1} Days / ${reserved.nights || 0} Nights`,
      statusHistory: [historyEntry('pending', '', user?.id, 'Booking placed')],
    });

    paymentDoc = await paymentService.createPayment({
      bookingId: code,
      userId: user.id,
      companyId: reserved.companyId,
      tripId: reserved.id,
      method: paymentMethod,
      amount: totalPrice,
      basePrice,
      markupAmount,
      currency: 'EGP',
      senderName: paymentPayload.senderName,
      senderPhone: paymentPayload.senderPhone,
      transferRef: paymentPayload.transferRef || code,
      proof: paymentPayload.proof,
    });

    await Booking.updateOne(
      { _id: code },
      { $set: { paymentId: paymentDoc.id } }
    );

    return {
      ok: true,
      booking: toDoc({ ...bookingDoc.toObject(), paymentId: paymentDoc.id }),
      payment: paymentDoc,
    };
  } catch (error) {
    if (paymentDoc?.id) await require('../models').Payment.deleteOne({ _id: paymentDoc.id }).catch(() => {});
    if (bookingDoc?._id) await Booking.deleteOne({ _id: bookingDoc._id }).catch(() => {});
    await tripService.incrementSeats(trip.id, travelDateId, qty, {
      roomType,
      rooms: roomType ? roomQty : 0,
    });
    return { ok: false, code: 'CREATE_FAILED', error };
  }
}

async function getBookingByCode(code, userId) {
  const booking = await getBookingById(code);
  if (!booking) return null;
  if (userId && String(booking.userId) !== String(userId)) return null;
  return booking;
}

async function confirmBookingFromPayment(bookingId, adminUser, note = '') {
  const booking = await getBookingById(bookingId);
  if (!booking) return null;
  await returnSeatsIfNeeded(booking, 'confirmed');
  const updated = await Booking.findByIdAndUpdate(
    String(bookingId),
    {
      $set: { status: 'confirmed', paymentStatus: 'verified' },
      $push: { statusHistory: historyEntry('confirmed', note, adminUser?.id, 'Payment verified — booking confirmed') },
    },
    { new: true }
  ).lean();
  return toCompanyBooking(toDoc(updated));
}

async function rejectBookingPayment(bookingId) {
  const updated = await Booking.findByIdAndUpdate(
    String(bookingId),
    { $set: { paymentStatus: 'rejected', status: 'pending' } },
    { new: true }
  ).lean();
  return toDoc(updated);
}

async function markPaymentResubmitted(bookingId, paymentId) {
  const updated = await Booking.findByIdAndUpdate(
    String(bookingId),
    { $set: { paymentStatus: 'submitted', paymentId: String(paymentId) } },
    { new: true }
  ).lean();
  return toDoc(updated);
}

module.exports = {
  getBookingById,
  getCompanyBooking,
  getAllBookings,
  getBookingsByCompany,
  filterBookingsByCompany,
  getBookingListMeta,
  getBookingListMetaForCompany,
  enrichBookingForList,
  enrichBookingDetail,
  enrichAdminBookingDetail,
  toCompanyBooking,
  toAdminBooking,
  toTravelerBooking,
  COMPANY_CANCEL_REASONS,
  updateBookingStatus,
  cancelCompanyBooking,
  adminUpdateBookingStatus,
  getDashboardStats,
  buildMonthlyBookingSeries,
  getBookingsForUser,
  createBooking,
  createCheckoutBooking,
  getBookingByCode,
  confirmBookingFromPayment,
  rejectBookingPayment,
  markPaymentResubmitted,
  returnSeatsIfNeeded,
  paginateList,
  isConfirmed,
};
