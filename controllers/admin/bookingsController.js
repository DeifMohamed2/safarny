const bookingService = require('../../services/bookings');
const tripService = require('../../services/trips');
const companyService = require('../../services/companies');
const paymentService = require('../../services/payments');
const { normalizeStatus } = require('../../lib/status');
const { withLayout, audit } = require('./_helpers');

async function list(req, res) {
  const filters = {
    status: req.query.status || 'all',
    paymentStatus: req.query.paymentStatus || 'all',
    q: req.query.q,
    companyId: req.query.companyId || 'all',
    sort: req.query.sort || 'newest',
  };
  const items = await bookingService.getAllBookings(filters);
  const { items: pageItems, pagination } = bookingService.paginateList(items, req.query.page, req.query.perPage || 15);
  const revenue = items
    .filter((b) => normalizeStatus(b.status) === 'confirmed')
    .reduce((s, b) => s + Number(b.totalPrice || 0), 0);
  const companies = await companyService.listCompanies();
  const bookings = await Promise.all(pageItems.map(async (b) => ({ ...b, company: await companyService.getCompanyById(b.companyId) })));
  withLayout(res, 'pages/admin/bookings', {
    title: res.locals.t('admin.bookings.title', 'Bookings'),
    adminActive: 'bookings',
    bookings,
    pagination,
    filters,
    companies: companies.map((c) => ({ id: c.id, title: c.title })),
    revenue,
    hasActiveFilters: Boolean(filters.q || filters.status !== 'all' || filters.companyId !== 'all' || filters.paymentStatus !== 'all'),
  });
}

async function detail(req, res) {
  const booking = await bookingService.getBookingById(req.params.id);
  if (!booking) return res.status(404).render('pages/not-found', { title: 'Booking not found' });
  const [trip, company, payment] = await Promise.all([
    tripService.getTripById(booking.tripId),
    companyService.getCompanyById(booking.companyId),
    booking.paymentId
      ? paymentService.getPaymentById(booking.paymentId)
      : paymentService.getPaymentByBookingId(booking.id),
  ]);
  withLayout(res, 'pages/admin/booking-detail', {
    title: `Booking ${booking.id}`,
    adminActive: 'bookings',
    booking: bookingService.enrichAdminBookingDetail(booking, trip),
    company,
    trip,
    payment,
  });
}

async function updateStatus(req, res) {
  const booking = await bookingService.adminUpdateBookingStatus(
    req.params.id,
    req.body.status,
    req.body.reason,
    req.session.user.id
  );
  if (booking) {
    await audit(req, 'booking.status', 'booking', booking.id, `Changed booking ${booking.id} status to ${booking.status}`);
  }
  req.session.flash = { type: 'success', message: 'Booking status updated.' };
  res.redirect(`/admin/bookings/${req.params.id}`);
}

module.exports = { list, detail, updateStatus };
