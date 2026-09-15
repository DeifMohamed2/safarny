const paymentService = require('../../services/payments');
const bookingService = require('../../services/bookings');
const tripService = require('../../services/trips');
const companyService = require('../../services/companies');
const userService = require('../../services/users');
const payoutService = require('../../services/payouts');
const refundService = require('../../services/refunds');
const invoiceService = require('../../services/invoices');
const ledger = require('../../services/ledger');
const { methodLabel } = require('../../lib/payment-methods');
const { financeProofUpload, mapUploadedProof, uploadErrorMessage } = require('../../lib/finance-proof');
const { payoutDetailsVerified, destinationLines, destinationFields, payoutMethodLabel } = require('../../lib/payout-details');
const { withLayout, audit } = require('./_helpers');
const { createTranslator } = require('../../lib/i18n');
const { bookingSplit } = require('../../lib/money');

function csvDownload(res, filename, body) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}

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

async function enrichPayout(payout, locale = 'en') {
  if (!payout) return null;
  const company = await companyService.getCompanyById(payout.companyId);
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  const bookings = await Promise.all((payout.bookingIds || []).map((id) => bookingService.getBookingById(id)));
  const t = createTranslator(locale);
  return {
    ...payout,
    company,
    companyName: company?.title || payout.companyId,
    payoutReady: payoutDetailsVerified(company?.payoutDetails),
    methodLabel: payoutMethodLabel(payout.method || payout.destination?.method, t),
    destinationLines: destinationLines(payout.destination || company?.payoutDetails || {}, t),
    destinationFields: destinationFields(payout.destination || company?.payoutDetails || {}, t),
    bookings: bookings.filter(Boolean).map((booking) => {
      const split = bookingSplit(booking);
      return {
        ...booking,
        collected: split.collected,
        payableToCompany: split.payableToCompany,
      };
    }),
    bookingCount: (payout.bookingIds || []).length,
    createdAtLabel: payout.createdAt
      ? new Date(payout.createdAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })
      : '',
    paidAtLabel: payout.paidAt
      ? new Date(payout.paidAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })
      : '',
    updatedAtLabel: payout.updatedAt
      ? new Date(payout.updatedAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })
      : '',
  };
}

async function enrichRefund(refund, locale = 'en') {
  if (!refund) return null;
  const [booking, company, user] = await Promise.all([
    bookingService.getBookingById(refund.bookingId),
    companyService.getCompanyById(refund.companyId),
    refund.userId ? userService.findById(refund.userId) : null,
  ]);
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  return {
    ...refund,
    booking,
    company,
    companyName: company?.title || refund.companyId,
    customerName: booking?.customerName || user?.userName || '',
    tripName: booking?.tripName || '',
    createdAtLabel: refund.createdAt
      ? new Date(refund.createdAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })
      : '',
    refundedAtLabel: refund.refundedAt
      ? new Date(refund.refundedAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })
      : '',
  };
}

async function dashboard(req, res) {
  const [summary, settlements, payoutSummary, refundSummary, ledgerTotals] = await Promise.all([
    paymentService.getFinanceSummary(),
    paymentService.getCompanySettlements(),
    payoutService.getPayoutSummary(),
    refundService.getRefundSummary(),
    ledger.platformTotals(),
  ]);
  withLayout(res, 'pages/admin/finance', {
    title: res.locals.t('admin.finance.title', 'Finance'),
    adminActive: 'finance',
    summary: { ...summary, ...payoutSummary, ...refundSummary, ...ledgerTotals },
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
  const verified = await paymentService.verifyPayment(req.params.id, req.session.user);
  const booking = await bookingService.confirmBookingFromPayment(payment.bookingId, req.session.user);
  if (booking) await ledger.recordPaymentVerified(booking, verified || payment, req.session.user);
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
  csvDownload(res, `safarny-payments-${Date.now()}.csv`, paymentService.exportPaymentsCsv(items, enriched));
}

async function payoutsList(req, res) {
  const filters = {
    status: req.query.status || 'all',
    companyId: req.query.companyId || 'all',
    q: req.query.q,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };
  const items = await payoutService.filterPayouts(filters);
  const { items: pageItems, pagination } = payoutService.paginateList(items, req.query.page, req.query.perPage || 20);
  const locale = res.locals.lang || 'en';
  const payouts = await Promise.all(pageItems.map((item) => enrichPayout(item, locale)));
  const [companies, queue, settlements] = await Promise.all([
    companyService.listCompanies(),
    payoutService.getPayoutSummary(),
    paymentService.getCompanySettlements(),
  ]);
  const overview = paymentService.summarizeSettlements(settlements);
  withLayout(res, 'pages/admin/finance-payouts', {
    title: res.locals.t('admin.finance.payouts.title', 'Payouts'),
    adminActive: 'finance-payouts',
    payouts,
    companies,
    queue,
    settlements,
    overview,
    pagination,
    filters,
    meta: { total: items.length },
    hasActiveFilters: Boolean(
      filters.q || filters.status !== 'all' || filters.companyId !== 'all' || filters.dateFrom || filters.dateTo
    ),
  });
}

async function payoutNew(req, res) {
  const companies = await companyService.listCompanies();
  const settlements = await paymentService.getCompanySettlements();
  const overview = paymentService.summarizeSettlements(settlements);
  const companyId = String(req.query.companyId || '');
  const company = companyId ? await companyService.getCompanyById(companyId) : null;
  const settlement = company
    ? settlements.find((row) => String(row.companyId) === String(company.id)) || null
    : null;
  const [bookings, clawbacks] = company
    ? await Promise.all([payoutService.listUnsettledBookings(company.id), payoutService.pendingClawbacks(company.id)])
    : [[], []];
  withLayout(res, 'pages/admin/finance-payout-new', {
    title: res.locals.t('admin.finance.payouts.create', 'Create payout'),
    adminActive: 'finance-payouts',
    companies,
    company,
    companyId,
    bookings,
    clawbacks,
    settlements,
    overview,
    settlement,
    payoutReady: payoutDetailsVerified(company?.payoutDetails),
    destinationLines: destinationLines(company?.payoutDetails || {}, res.locals.t),
    destinationFields: destinationFields(company?.payoutDetails || {}, res.locals.t),
    methodLabel: payoutMethodLabel(company?.payoutDetails?.method, res.locals.t),
  });
}

async function payoutCreate(req, res) {
  const companyId = String(req.body.companyId || '');
  const bookingIds = [].concat(req.body.bookingIds || []).filter(Boolean);
  const result = await payoutService.createPayout(companyId, bookingIds, req.session.user);
  if (!result.ok) {
    req.session.flash = { type: 'error', message: result.message };
    return res.redirect(`/admin/finance/payouts/new?companyId=${encodeURIComponent(companyId)}`);
  }
  await audit(req, 'payout.create', 'payout', result.payout.id, `Created payout ${result.payout.id} for company ${companyId}`);
  req.session.flash = { type: 'success', message: `Payout ${result.payout.id} created.` };
  res.redirect(`/admin/finance/payouts/${result.payout.id}`);
}

async function payoutDetail(req, res) {
  const payout = await payoutService.getPayoutById(req.params.id);
  if (!payout) return res.status(404).render('pages/not-found', { title: 'Payout not found' });
  withLayout(res, 'pages/admin/finance-payout-detail', {
    title: payout.id,
    adminActive: 'finance-payouts',
    payout: await enrichPayout(payout, res.locals.lang || 'en'),
  });
}

async function payoutProcessing(req, res) {
  const result = await payoutService.markProcessing(req.params.id);
  if (!result.ok) req.session.flash = { type: 'error', message: result.message };
  else {
    await audit(req, 'payout.processing', 'payout', req.params.id, `Marked payout ${req.params.id} processing`);
    req.session.flash = { type: 'success', message: 'Payout moved to processing.' };
  }
  res.redirect(`/admin/finance/payouts/${req.params.id}`);
}

function payoutPaid(req, res) {
  financeProofUpload.single('proof')(req, res, async (error) => {
    if (error) {
      req.session.flash = { type: 'error', message: uploadErrorMessage(error) };
      return res.redirect(`/admin/finance/payouts/${req.params.id}`);
    }
    const result = await payoutService.markPaid(req.params.id, {
      reference: req.body.reference,
      proof: mapUploadedProof(req),
      note: req.body.note,
    }, req.session.user);
    if (!result.ok) {
      req.session.flash = { type: 'error', message: result.message };
      return res.redirect(`/admin/finance/payouts/${req.params.id}`);
    }
    await audit(req, 'payout.paid', 'payout', result.payout.id, `Marked payout ${result.payout.id} paid`);
    req.session.flash = { type: 'success', message: 'Payout marked paid and bookings settled.' };
    res.redirect(`/admin/finance/payouts/${req.params.id}`);
  });
}

async function payoutFailed(req, res) {
  const result = await payoutService.markFailed(req.params.id, req.body.note, req.session.user);
  if (!result.ok) req.session.flash = { type: 'error', message: result.message };
  else {
    await audit(req, 'payout.failed', 'payout', req.params.id, `Marked payout ${req.params.id} failed`);
    req.session.flash = { type: 'success', message: 'Payout marked failed.' };
  }
  res.redirect(`/admin/finance/payouts/${req.params.id}`);
}

async function payoutCancel(req, res) {
  const result = await payoutService.cancelPayout(req.params.id);
  if (!result.ok) req.session.flash = { type: 'error', message: result.message };
  else {
    await audit(req, 'payout.cancel', 'payout', req.params.id, `Cancelled payout ${req.params.id}`);
    req.session.flash = { type: 'success', message: 'Payout cancelled. Bookings are available again.' };
  }
  res.redirect(`/admin/finance/payouts/${req.params.id}`);
}

async function payoutStatement(req, res) {
  const payout = await payoutService.getPayoutById(req.params.id);
  if (!payout) return res.status(404).render('pages/not-found', { title: 'Payout not found' });
  const ok = await invoiceService.streamStatement(res, payout);
  if (!ok) {
    req.session.flash = { type: 'error', message: 'Statement is not available yet.' };
    res.redirect(`/admin/finance/payouts/${req.params.id}`);
  }
}

async function payoutsExport(req, res) {
  const filters = {
    status: req.query.status || 'all',
    companyId: req.query.companyId || 'all',
    q: req.query.q,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };
  const items = await payoutService.filterPayouts(filters);
  const companies = await companyService.listCompanies();
  const byId = Object.fromEntries(companies.map((company) => [String(company.id), company]));
  csvDownload(res, `safarny-payouts-${Date.now()}.csv`, payoutService.exportPayoutsCsv(items, byId));
}

async function refundsList(req, res) {
  const filters = {
    status: req.query.status || 'all',
    companyId: req.query.companyId || 'all',
    q: req.query.q,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  };
  const items = await refundService.filterRefunds(filters);
  const { items: pageItems, pagination } = refundService.paginateList(items, req.query.page, req.query.perPage || 20);
  const locale = res.locals.lang || 'en';
  const refunds = await Promise.all(pageItems.map((item) => enrichRefund(item, locale)));
  withLayout(res, 'pages/admin/finance-refunds', {
    title: res.locals.t('admin.finance.refunds.title', 'Refunds'),
    adminActive: 'finance-refunds',
    refunds,
    pagination,
    filters,
    meta: { total: items.length },
    hasActiveFilters: Boolean(
      filters.q || filters.status !== 'all' || filters.companyId !== 'all' || filters.dateFrom || filters.dateTo
    ),
  });
}

async function refundDetail(req, res) {
  const refund = await refundService.getRefundById(req.params.id);
  if (!refund) return res.status(404).render('pages/not-found', { title: 'Refund not found' });
  withLayout(res, 'pages/admin/finance-refund-detail', {
    title: refund.id,
    adminActive: 'finance-refunds',
    refund: await enrichRefund(refund, res.locals.lang || 'en'),
  });
}

async function refundApprove(req, res) {
  const result = await refundService.approveRefund(req.params.id, {
    approvedAmount: req.body.approvedAmount,
    note: req.body.reviewNote,
  }, req.session.user);
  if (!result.ok) req.session.flash = { type: 'error', message: result.message };
  else {
    await audit(req, 'refund.approve', 'refund', req.params.id, `Approved refund ${req.params.id}`);
    req.session.flash = { type: 'success', message: 'Refund approved.' };
  }
  res.redirect(`/admin/finance/refunds/${req.params.id}`);
}

async function refundDecline(req, res) {
  const result = await refundService.declineRefund(req.params.id, req.body.reviewNote, req.session.user);
  if (!result.ok) req.session.flash = { type: 'error', message: result.message };
  else {
    await audit(req, 'refund.decline', 'refund', req.params.id, `Declined refund ${req.params.id}`);
    req.session.flash = { type: 'success', message: 'Refund declined.' };
  }
  res.redirect(`/admin/finance/refunds/${req.params.id}`);
}

function refundPaid(req, res) {
  financeProofUpload.single('proof')(req, res, async (error) => {
    if (error) {
      req.session.flash = { type: 'error', message: uploadErrorMessage(error) };
      return res.redirect(`/admin/finance/refunds/${req.params.id}`);
    }
    const result = await refundService.markRefundPaid(req.params.id, {
      reference: req.body.reference,
      proof: mapUploadedProof(req),
      note: req.body.note,
    }, req.session.user);
    if (!result.ok) {
      req.session.flash = { type: 'error', message: result.message };
      return res.redirect(`/admin/finance/refunds/${req.params.id}`);
    }
    await audit(req, 'refund.paid', 'refund', result.refund.id, `Recorded refund transfer ${result.refund.id}`);
    req.session.flash = { type: 'success', message: 'Refund transfer recorded.' };
    res.redirect(`/admin/finance/refunds/${req.params.id}`);
  });
}

async function refundCreditNote(req, res) {
  const refund = await refundService.getRefundById(req.params.id);
  if (!refund) return res.status(404).render('pages/not-found', { title: 'Refund not found' });
  const booking = await bookingService.getBookingById(refund.bookingId);
  const ok = await invoiceService.streamCreditNote(res, refund, booking);
  if (!ok) {
    req.session.flash = { type: 'error', message: 'Credit note is available after the refund is paid.' };
    res.redirect(`/admin/finance/refunds/${req.params.id}`);
  }
}

async function refundsExport(req, res) {
  const items = await refundService.filterRefunds({
    status: req.query.status || 'all',
    companyId: req.query.companyId || 'all',
    q: req.query.q,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  });
  csvDownload(res, `safarny-refunds-${Date.now()}.csv`, refundService.exportRefundsCsv(items));
}

async function bookingInvoice(req, res) {
  const booking = await bookingService.getBookingById(req.params.id);
  if (!booking) return res.status(404).render('pages/not-found', { title: 'Booking not found' });
  const ok = await invoiceService.streamInvoice(res, booking);
  if (!ok) {
    req.session.flash = { type: 'error', message: 'Invoice is available after payment is verified.' };
    res.redirect(`/admin/bookings/${req.params.id}`);
  }
}

module.exports = {
  dashboard,
  paymentsList,
  paymentDetail,
  verify,
  reject,
  exportCsv,
  payoutsList,
  payoutNew,
  payoutCreate,
  payoutDetail,
  payoutProcessing,
  payoutPaid,
  payoutFailed,
  payoutCancel,
  payoutStatement,
  payoutsExport,
  refundsList,
  refundDetail,
  refundApprove,
  refundDecline,
  refundPaid,
  refundCreditNote,
  refundsExport,
  bookingInvoice,
};
