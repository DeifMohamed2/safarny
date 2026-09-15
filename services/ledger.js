const { LedgerEntry, nextSeq } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { roundMoney, bookingSplit } = require('../lib/money');

async function nextLedgerId() {
  const seq = await nextSeq('ledger');
  return `LED-${String(seq).padStart(6, '0')}`;
}

async function hasEntries(refId, type) {
  if (!refId) return false;
  const match = { refId: String(refId) };
  if (type) match.type = type;
  return Boolean(await LedgerEntry.exists(match));
}

async function record(entries = [], { createdBy = '', occurredAt = new Date() } = {}) {
  const rows = (Array.isArray(entries) ? entries : [entries]).filter((entry) => entry && roundMoney(entry.amount) > 0);
  if (!rows.length) return [];
  const docs = [];
  for (const entry of rows) {
    const id = await nextLedgerId();
    docs.push({
      _id: id,
      type: entry.type,
      direction: entry.direction === 'out' ? 'out' : 'in',
      amount: roundMoney(entry.amount),
      currency: entry.currency || 'EGP',
      companyId: String(entry.companyId || ''),
      bookingId: String(entry.bookingId || ''),
      refId: String(entry.refId || ''),
      note: String(entry.note || ''),
      createdBy: String(entry.createdBy || createdBy || ''),
      occurredAt: entry.occurredAt || occurredAt,
    });
  }
  const created = await LedgerEntry.insertMany(docs);
  return toDocs(created);
}

async function recordPaymentVerified(booking, payment, adminUser) {
  const refId = String(payment?.id || booking?.paymentId || '');
  if (!refId || await hasEntries(refId, 'collection')) return [];
  const split = bookingSplit(booking);
  return record([
    {
      type: 'collection',
      direction: 'in',
      amount: split.collected,
      companyId: booking.companyId,
      bookingId: booking.id || booking._id,
      refId,
      note: `Collected for booking ${booking.code || booking.id}`,
    },
    {
      type: 'platform_fee',
      direction: 'in',
      amount: split.platformFee,
      companyId: booking.companyId,
      bookingId: booking.id || booking._id,
      refId,
      note: `Platform markup on booking ${booking.code || booking.id}`,
    },
  ], { createdBy: adminUser?.id, occurredAt: payment?.reviewedAt || new Date() });
}

async function recordPayoutPaid(payout, adminUser) {
  if (!payout?.id || await hasEntries(payout.id, 'payout')) return [];
  return record([{
    type: 'payout',
    direction: 'out',
    amount: payout.netPayable,
    companyId: payout.companyId,
    refId: payout.id,
    note: `Payout ${payout.id} to company ${payout.companyId}`,
  }], { createdBy: adminUser?.id, occurredAt: payout.paidAt || new Date() });
}

async function recordRefundPaid(refund, booking, adminUser) {
  if (!refund?.id || await hasEntries(refund.id, 'refund')) return [];
  const entries = [{
    type: 'refund',
    direction: 'out',
    amount: refund.approvedAmount,
    companyId: refund.companyId,
    bookingId: refund.bookingId,
    refId: refund.id,
    note: `Refund ${refund.id} for booking ${refund.bookingId}`,
  }];
  if (roundMoney(refund.companyClawback) > 0) {
    entries.push({
      type: 'clawback',
      direction: 'in',
      amount: refund.companyClawback,
      companyId: refund.companyId,
      bookingId: refund.bookingId,
      refId: refund.id,
      note: `Company clawback on refund ${refund.id}`,
    });
  }
  if (roundMoney(refund.platformFeeRefunded) > 0) {
    entries.push({
      type: 'adjustment',
      direction: 'out',
      amount: refund.platformFeeRefunded,
      companyId: refund.companyId,
      bookingId: refund.bookingId,
      refId: refund.id,
      note: `Platform fee reversed on refund ${refund.id}`,
    });
  }
  return record(entries, { createdBy: adminUser?.id, occurredAt: refund.refundedAt || new Date() });
}

function sumBy(docs, pred) {
  return docs.filter(pred).reduce((sum, row) => sum + roundMoney(row.amount), 0);
}

async function loadEntries({ companyId, from, to } = {}) {
  const match = {};
  if (companyId) match.companyId = String(companyId);
  if (from || to) {
    match.occurredAt = {};
    if (from) match.occurredAt.$gte = from;
    if (to) match.occurredAt.$lte = to;
  }
  return toDocs(await LedgerEntry.find(match).sort({ occurredAt: -1 }).lean());
}

async function balanceForCompany(companyId) {
  const entries = await loadEntries({ companyId });
  const collected = sumBy(entries, (row) => row.type === 'collection' && row.direction === 'in');
  const platformFee = sumBy(entries, (row) => row.type === 'platform_fee' && row.direction === 'in');
  const paidOut = sumBy(entries, (row) => row.type === 'payout' && row.direction === 'out');
  const refunded = sumBy(entries, (row) => row.type === 'refund' && row.direction === 'out');
  const clawback = sumBy(entries, (row) => row.type === 'clawback');
  const feeReversed = sumBy(entries, (row) => row.type === 'adjustment' && row.direction === 'out');
  return {
    collected,
    platformFee: Math.max(0, platformFee - feeReversed),
    paidOut,
    refunded,
    clawback,
    earned: Math.max(0, collected - platformFee),
    netPaid: paidOut,
  };
}

async function platformTotals({ from, to } = {}) {
  const entries = await loadEntries({ from, to });
  const collected = sumBy(entries, (row) => row.type === 'collection' && row.direction === 'in');
  const platformFee = sumBy(entries, (row) => row.type === 'platform_fee' && row.direction === 'in');
  const paidOut = sumBy(entries, (row) => row.type === 'payout' && row.direction === 'out');
  const refunded = sumBy(entries, (row) => row.type === 'refund' && row.direction === 'out');
  const feeReversed = sumBy(entries, (row) => row.type === 'adjustment' && row.direction === 'out');
  const netPlatformRevenue = Math.max(0, platformFee - feeReversed);
  return {
    collected,
    platformFee: netPlatformRevenue,
    paidOut,
    refunded,
    cashHeld: Math.max(0, collected - paidOut - refunded),
    netPlatformRevenue,
    count: entries.length,
  };
}

module.exports = {
  record,
  hasEntries,
  recordPaymentVerified,
  recordPayoutPaid,
  recordRefundPaid,
  balanceForCompany,
  platformTotals,
  loadEntries,
};
