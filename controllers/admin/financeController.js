const paymentService = require('../../services/payments');
const bookingService = require('../../services/bookings');
const tripService = require('../../services/trips');
const companyService = require('../../services/companies');
const userService = require('../../services/users');
const { methodLabel } = require('../../lib/payment-methods');
const { withLayout, audit } = require('./_helpers');

async function enrichPayment(payment, locale = 'en') {
  if (!payment) return null;
  const booking = await bookingService.getBookingById(payment.bookingId);
  const [trip, company, user] = await Promise.all([
    booking ? tripService.getTripById(booking.tripId) : null,
    booking ? companyService.getCompanyById(booking.companyId) : null,
    payment.userId ? userService.findById(payment.userId) : null,
  ]);
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  const bookingCode = booking?.code || payment.bookingId || '';
  return {
    ...payment,
    booking,
    bookingCode,
    referenceCode: booking ? `SAF-${bookingCode}` : '',
    tripName: booking?.tripName || trip?.title || '',
    customerName: booking?.customerName || user?.userName || payment.senderName || '',
    customerEmail: booking?.customerEmail || user?.email || '',
    customerPhone: booking?.customerPhone || user?.phone || payment.senderPhone || '',
    companyName: company?.title || booking?.companyId || '',
    methodLabel: methodLabel(payment.method),
    submittedAt: payment.createdAt
      ? new Date(payment.createdAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })
      : '',
    reviewedAtLabel: payment.reviewedAt
      ? new Date(payment.reviewedAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })
      : '',
  };
}

async function dashboard(req, res) {
  const [summary, settlements] = await Promise.all([
    paymentService.getFinanceSummary(),
    paymentService.getCompanySettlements(),
  ]);
  withLayout(res, 'pages/admin/finance', {
    title: res.locals.t('admin.finance.title', 'Finance'),
    adminActive: 'finance',
    summary,
    settlements,
  });
}

async function paymentsList(req, res) {
  const filters = {
    status: req.query.status || 'all',
    method: req.query.method || 'all',
    q: req.query.q,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };
  const items = await paymentService.filterPayments(filters);
  const { items: pageItems, pagination } = paymentService.paginateList(items, req.query.page, req.query.perPage || 20);
  const locale = res.locals.lang || 'en';
  const payments = await Promise.all(pageItems.map((item) => enrichPayment(item, locale)));
  withLayout(res, 'pages/admin/finance-payments', {
    title: res.locals.t('admin.finance.payments', 'Payments'),
    adminActive: 'finance-payments',
    payments,
    pagination,
    filters,
    meta: { total: items.length },
    hasActiveFilters: Boolean(
      filters.q || filters.status !== 'all' || filters.method !== 'all' || filters.dateFrom || filters.dateTo
    ),
  });
}

async function paymentDetail(req, res) {
  const payment = await paymentService.getPaymentById(req.params.id);
  if (!payment) return res.status(404).render('pages/not-found', { title: 'Payment not found' });
  const enriched = await enrichPayment(payment, res.locals.lang || 'en');
  withLayout(res, 'pages/admin/finance-payment-detail', {
    title: payment.id,
    adminActive: 'finance-payments',
    payment: enriched,
  });
}

async function verify(req, res) {
  const payment = await paymentService.getPaymentById(req.params.id);
  if (!payment) return res.status(404).render('pages/not-found', { title: 'Not found' });
  if (payment.status === 'verified') {
    req.session.flash = { type: 'info', message: 'Payment is already verified.' };
    return res.redirect(`/admin/finance/payments/${req.params.id}`);
  }
  await paymentService.verifyPayment(req.params.id, req.session.user);
  await bookingService.confirmBookingFromPayment(payment.bookingId, req.session.user);
  await audit(req, 'payment.verify', 'payment', payment.id, `Verified payment ${payment.id} and confirmed booking ${payment.bookingId}`);
  req.session.flash = { type: 'success', message: 'Payment verified and booking confirmed.' };
  res.redirect(`/admin/finance/payments/${req.params.id}`);
}

async function reject(req, res) {
  const note = String(req.body.reviewNote || '').trim();
  if (!note) {
    req.session.flash = { type: 'error', message: 'Rejection note is required.' };
    return res.redirect(`/admin/finance/payments/${req.params.id}`);
  }
  const payment = await paymentService.getPaymentById(req.params.id);
  if (!payment) return res.status(404).render('pages/not-found', { title: 'Not found' });
  if (payment.status === 'verified') {
    req.session.flash = { type: 'error', message: 'Verified payments cannot be rejected.' };
    return res.redirect(`/admin/finance/payments/${req.params.id}`);
  }
  await paymentService.rejectPayment(req.params.id, req.session.user, note);
  await bookingService.rejectBookingPayment(payment.bookingId);
  await audit(req, 'payment.reject', 'payment', payment.id, `Rejected payment ${payment.id}: ${note}`);
  req.session.flash = { type: 'success', message: 'Payment rejected. Traveler can re-upload proof.' };
  res.redirect(`/admin/finance/payments/${req.params.id}`);
}

async function settleCompany(req, res) {
  const company = await companyService.getCompanyById(req.params.id);
  if (!company) return res.status(404).render('pages/not-found', { title: 'Company not found' });
  const count = await paymentService.settleCompanyBookings(company.id);
  if (count) {
    await audit(req, 'finance.settle', 'company', company.id, `Marked ${count} booking(s) settled for ${company.title}`);
  }
  req.session.flash = {
    type: 'success',
    message: count
      ? `Marked ${count} booking(s) as settled for ${company.title}.`
      : 'No unsettled confirmed bookings for this company.',
  };
  res.redirect('/admin/finance');
}

async function exportCsv(req, res) {
  const filters = {
    status: req.query.status || 'all',
    method: req.query.method || 'all',
    q: req.query.q,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };
  const items = await paymentService.filterPayments(filters);
  const enriched = await Promise.all(items.map((item) => enrichPayment(item, res.locals.lang || 'en')));
  const csv = paymentService.exportPaymentsCsv(items, enriched);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="safarny-payments-${Date.now()}.csv"`);
  res.send(csv);
}

module.exports = {
  dashboard,
  paymentsList,
  paymentDetail,
  verify,
  reject,
  exportCsv,
  settleCompany,
};
