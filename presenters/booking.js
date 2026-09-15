const { titleCaseStatus, normalizeStatus } = require('../lib/status');
const { methodLabel } = require('../lib/payment-methods');

function isoDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function localeDate(value, locale = 'en') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US');
}

function companyBaseAmount(booking) {
  const base = Number(booking?.basePrice);
  if (Number.isFinite(base) && base > 0) return base;
  const total = Number(booking?.totalPrice) || 0;
  const markup = Number(booking?.markupAmount) || 0;
  return Math.max(0, total - markup);
}

function toCompanyBooking(booking) {
  if (!booking) return null;
  const {
    markupAmount: _markupAmount,
    ...safe
  } = booking;
  const status = titleCaseStatus(booking.status);
  const seats = Number(booking.seats) || 0;
  const basePrice = companyBaseAmount(booking);
  const tripDate = booking.tripDate ? new Date(booking.tripDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilTrip = tripDate && !Number.isNaN(tripDate.getTime())
    ? Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24))
    : null;

  return {
    ...safe,
    id: booking.id || booking._id,
    status,
    bookingDate: isoDate(booking.bookingDate),
    tripDate: isoDate(booking.tripDate),
    totalPrice: basePrice,
    basePrice,
    companyPayout: basePrice,
    pricePerSeat: seats ? Math.round(basePrice / seats) : basePrice,
    pricePerRoom: (Number(booking.rooms) || 0) > 0
      ? Math.round(basePrice / Number(booking.rooms))
      : basePrice,
    daysUntilTrip,
    isUpcoming: daysUntilTrip !== null && daysUntilTrip >= 0,
    paymentMethod: booking.paymentMethod === 'legacy'
      ? (booking.paymentMethodLegacy || 'Online payment')
      : methodLabel(booking.paymentMethod),
    paymentMethodKey: booking.paymentMethod || 'legacy',
    paymentStatus: booking.paymentStatus || 'unpaid',
    paymentId: booking.paymentId || '',
    refundStatus: booking.refundStatus || 'none',
    refundedAmount: Number(booking.refundedAmount) || 0,
    invoiceNumber: booking.invoiceNumber || '',
    referenceCode: booking.referenceCode || `SAF-${booking.code || booking.id || booking._id}`,
    statusHistory: (booking.statusHistory || []).map((item) => ({
      ...item,
      status: titleCaseStatus(item.status),
      date: isoDate(item.at || item.date),
    })),
  };
}

function toAdminBooking(booking) {
  if (!booking) return null;
  const presented = toCompanyBooking(booking);
  const collected = Number(booking.totalPrice) || 0;
  const seats = Number(booking.seats) || 0;
  const rooms = Number(booking.rooms) || 0;
  return {
    ...presented,
    totalPrice: collected,
    markupAmount: Number(booking.markupAmount) || 0,
    pricePerSeat: seats ? Math.round(collected / seats) : collected,
    pricePerRoom: rooms > 0 ? Math.round(collected / rooms) : collected,
  };
}

function withTripDetail(presented, trip) {
  if (!presented) return null;
  return {
    ...presented,
    tripDestination: trip?.destination || '',
    tripImage: trip?.images?.[0] || trip?.image || presented.image || '/assets/trip/trip.jpg',
    tripDays: trip?.days || null,
    tripNights: trip?.nights || null,
    tripStartDate: trip?.startDate || presented.tripDate,
    tripEndDate: trip?.endDate || presented.tripDate,
  };
}

function enrichBookingDetail(booking, trip = null) {
  return withTripDetail(toCompanyBooking(booking), trip);
}

function enrichAdminBookingDetail(booking, trip = null) {
  return withTripDetail(toAdminBooking(booking), trip);
}

function toTravelerBooking(booking, trip = null, locale = 'en') {
  if (!booking) return null;
  const seats = Number(booking.seats) || 1;
  const rooms = Number(booking.rooms) || 0;
  const totalPrice = Number(booking.totalPrice) || 0;
  const perRoom = rooms > 0 ? Math.round(totalPrice / rooms) : totalPrice;
  const status = normalizeStatus(booking.status);
  const image = booking.image || trip?.images?.[0] || trip?.image || '/assets/trip/trip.jpg';
  const days = trip?.days;
  const nights = trip?.nights;
  const duration = booking.duration
    || (days ? `${days} Days / ${nights || 0} Nights` : '');

  return {
    id: booking.id || booking._id,
    tripId: booking.tripId,
    title: booking.tripName || trip?.title || '',
    status,
    category: booking.category || trip?.category || '',
    location: booking.location || trip?.location || (trip?.destination ? `${trip.destination}, Egypt` : ''),
    bookingDate: localeDate(booking.bookingDate, locale),
    travelDate: localeDate(booking.tripDate, locale),
    duration,
    adults: seats,
    rooms,
    price: perRoom,
    totalPrice,
    paymentStatus: booking.paymentStatus || 'unpaid',
    paymentMethod: booking.paymentMethod === 'legacy' ? '' : methodLabel(booking.paymentMethod),
    paymentMethodKey: booking.paymentMethod || 'legacy',
    code: booking.code || booking.id,
    refundStatus: booking.refundStatus || 'none',
    invoiceNumber: booking.invoiceNumber || '',
    image,
  };
}

module.exports = {
  companyBaseAmount,
  toCompanyBooking,
  toAdminBooking,
  enrichBookingDetail,
  enrichAdminBookingDetail,
  toTravelerBooking,
  isoDate,
};
