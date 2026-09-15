const fs = require('fs');
const { Booking, Payout, Refund, nextSeq } = require('../models');
const { toDoc } = require('../lib/document');
const { cachePath, renderToFile, sendPdf } = require('../lib/pdf');
const { buildInvoice, buildPayoutStatement, buildCreditNote } = require('../lib/finance-docs');
const companyService = require('./companies');
const paymentService = require('./payments');
const settingsService = require('./settings');

async function nextDocNumber(name, prefix) {
  const seq = await nextSeq(name);
  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

async function getOrCreateInvoiceNumber(booking) {
  if (booking.invoiceNumber) return booking.invoiceNumber;
  const number = await nextDocNumber('invoice', 'INV');
  await Booking.updateOne({ _id: String(booking.id || booking._id) }, { $set: { invoiceNumber: number } });
  booking.invoiceNumber = number;
  return number;
}

async function getOrCreateStatementNumber(payout) {
  if (payout.statementNumber) return payout.statementNumber;
  const number = await nextDocNumber('statement', 'STM');
  await Payout.updateOne({ _id: String(payout.id || payout._id) }, { $set: { statementNumber: number } });
  payout.statementNumber = number;
  return number;
}

async function getOrCreateCreditNoteNumber(refund) {
  if (refund.creditNoteNumber) return refund.creditNoteNumber;
  const number = await nextDocNumber('credit-note', 'CRN');
  await Refund.updateOne({ _id: String(refund.id || refund._id) }, { $set: { creditNoteNumber: number } });
  refund.creditNoteNumber = number;
  return number;
}

async function ensurePdf(kind, number, builder) {
  const dest = cachePath(kind, number);
  if (fs.existsSync(dest)) return dest;
  const doc = builder();
  await renderToFile(doc, dest);
  return dest;
}

async function streamInvoice(res, booking) {
  if (!booking) return false;
  if (booking.paymentStatus !== 'verified' && booking.status !== 'confirmed' && booking.status !== 'refunded') {
    return false;
  }
  const [company, payment, settings] = await Promise.all([
    companyService.getCompanyById(booking.companyId),
    booking.paymentId
      ? paymentService.getPaymentById(booking.paymentId)
      : paymentService.getPaymentByBookingId(booking.id || booking._id),
    settingsService.getSettings(),
  ]);
  const number = await getOrCreateInvoiceNumber(booking);
  const filePath = await ensurePdf('invoice', `${number}-v2`, () => buildInvoice({
    number,
    booking,
    payment,
    company,
    settings,
  }));
  await sendPdf(res, filePath, `${number}.pdf`);
  return true;
}

async function streamStatement(res, payout) {
  if (!payout) return false;
  const [company, bookings] = await Promise.all([
    companyService.getCompanyById(payout.companyId),
    Promise.all((payout.bookingIds || []).map(async (id) => toDoc(await Booking.findById(String(id)).lean()))),
  ]);
  const number = await getOrCreateStatementNumber(payout);
  const filePath = await ensurePdf('statement', `${number}-v2`, () => buildPayoutStatement({
    number,
    payout,
    bookings: bookings.filter(Boolean),
    company,
  }));
  await sendPdf(res, filePath, `${number}.pdf`);
  return true;
}

async function streamCreditNote(res, refund, booking) {
  if (!refund || refund.status !== 'refunded') return false;
  const company = await companyService.getCompanyById(refund.companyId);
  const number = await getOrCreateCreditNoteNumber(refund);
  const filePath = await ensurePdf('credit-note', `${number}-v2`, () => buildCreditNote({
    number,
    refund,
    booking,
    company,
  }));
  await sendPdf(res, filePath, `${number}.pdf`);
  return true;
}

module.exports = {
  getOrCreateInvoiceNumber,
  getOrCreateStatementNumber,
  getOrCreateCreditNoteNumber,
  streamInvoice,
  streamStatement,
  streamCreditNote,
};
