const { createDocument, drawHeader, kv, drawTable, money, headingFont, bodyFont } = require('./pdf');
const { bookingSplit } = require('./money');
const { destinationLines, payoutMethodLabel } = require('./payout-details');

function iso(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildInvoice({ number, booking, payment, company, settings }) {
  const doc = createDocument();
  const split = bookingSplit(booking);
  drawHeader(doc, { title: 'Invoice', number, date: iso(booking.bookingDate || booking.createdAt) });
  kv(doc, 'Bill to', booking.customerName);
  kv(doc, 'Email', booking.customerEmail);
  kv(doc, 'Phone', booking.customerPhone);
  kv(doc, 'Booking', `${booking.code || booking.id} · ${booking.tripName || ''}`);
  kv(doc, 'Company', company?.title || booking.companyId);
  kv(doc, 'Travel date', iso(booking.tripDate));
  kv(doc, 'Payment', payment ? `${payment.id} · ${payment.status}` : '—');
  doc.moveDown(0.6);
  drawTable(doc, [
    { key: 'item', label: 'Item', width: 280 },
    { key: 'qty', label: 'Qty', width: 50, align: 'right' },
    { key: 'amount', label: 'Amount', width: 165, align: 'right' },
  ], [
    {
      item: booking.tripName || 'Trip booking',
      qty: String(booking.rooms || booking.seats || 1),
      amount: money(split.collected, booking.currency || 'EGP'),
    },
  ]);
  doc.moveDown(0.3);
  doc.font(headingFont(doc)).fontSize(12).fillColor('#122445');
  doc.text(`Total paid: ${money(split.collected)}`, { align: 'right' });
  doc.moveDown();
  doc.font(bodyFont(doc)).fontSize(8).fillColor('#64748b');
  doc.text(settings?.payoutAccounts?.instructionsEn || 'Paid by manual bank or wallet transfer to Safarny.');
  return doc;
}

function buildPayoutStatement({ number, payout, bookings = [], company }) {
  const doc = createDocument();
  drawHeader(doc, { title: 'Payout statement', number, date: iso(payout.paidAt || payout.createdAt) });
  kv(doc, 'Company', company?.title || payout.companyId);
  kv(doc, 'Payout', payout.id);
  kv(doc, 'Status', String(payout.status || '').replace(/_/g, ' '));
  kv(doc, 'Method', payoutMethodLabel(payout.method));
  kv(doc, 'Reference', payout.reference);
  const dest = destinationLines(payout.destination || {}).join(' · ');
  if (dest) kv(doc, 'Paid to', dest);
  doc.moveDown(0.4);
  drawTable(doc, [
    { key: 'code', label: 'Booking', width: 90 },
    { key: 'trip', label: 'Trip', width: 175 },
    { key: 'guest', label: 'Traveler', width: 110 },
    { key: 'payable', label: 'Payable', width: 120, align: 'right' },
  ], bookings.map((booking) => {
    const split = bookingSplit(booking);
    return {
      code: booking.code || booking.id,
      trip: booking.tripName || '',
      guest: booking.customerName || '',
      payable: money(split.payableToCompany),
    };
  }));
  (payout.adjustments || []).forEach((row) => {
    doc.font(bodyFont(doc)).fontSize(9).fillColor('#b45309')
      .text(`${row.label}: ${money(row.amount)}`, { align: 'right' });
  });
  doc.moveDown(0.3);
  doc.font(headingFont(doc)).fontSize(12).fillColor('#122445');
  doc.text(`Amount paid: ${money(payout.netPayable)}`, { align: 'right' });
  return doc;
}

function buildCreditNote({ number, refund, booking, company }) {
  const doc = createDocument();
  drawHeader(doc, { title: 'Credit note', number, date: iso(refund.refundedAt || refund.createdAt) });
  kv(doc, 'Traveler', booking?.customerName || refund.userId);
  kv(doc, 'Booking', booking?.code || refund.bookingId);
  kv(doc, 'Company', company?.title || refund.companyId);
  kv(doc, 'Refund', refund.id);
  kv(doc, 'Reason', refund.reason || refund.reasonCategory);
  kv(doc, 'Reference', refund.reference);
  doc.moveDown(0.5);
  drawTable(doc, [
    { key: 'item', label: 'Item', width: 330 },
    { key: 'amount', label: 'Amount', width: 165, align: 'right' },
  ], [
    { item: 'Refund', amount: money(refund.approvedAmount) },
  ]);
  doc.font(headingFont(doc)).fontSize(12).fillColor('#122445');
  doc.text(`Credit total: ${money(refund.approvedAmount)}`, { align: 'right' });
  return doc;
}

module.exports = {
  buildInvoice,
  buildPayoutStatement,
  buildCreditNote,
};
