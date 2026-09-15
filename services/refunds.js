const { Refund, Booking, nextSeq } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { paginateList } = require('../lib/paginate');
const { roundMoney, refundSplit } = require('../lib/money');
const { presentProof } = require('../lib/finance-proof');
const {
  REFUND_REASONS,
  parseRefundDestination,
  validateRefundDestination,
} = require('../lib/payout-details');
const { methodLabel } = require('../lib/payment-methods');
const ledger = require('./ledger');
const bookingService = require('./bookings');

const OPEN_STATUSES = ['requested', 'approved', 'processing'];

function tripStartHasArrived(tripDate) {
  if (!tripDate) return false;
  const start = new Date(tripDate);
  if (Number.isNaN(start.getTime())) return false;
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() >= start.getTime();
}

async function nextRefundId() {
  const seq = await nextSeq('refund');
  return `RF-${String(seq).padStart(4, '0')}`;
}

function presentRefund(refund) {
  if (!refund) return null;
  const doc = refund.id ? refund : toDoc(refund);
  return {
    ...doc,
    id: doc.id || doc._id,
    proof: presentProof(doc.proof),
    methodLabel: methodLabel(doc.method) || doc.method,
    reasonLabel: (REFUND_REASONS.find((item) => item.id === doc.reasonCategory) || {}).label || doc.reasonCategory,
  };
}

async function getRefundById(id) {
  if (!id) return null;
  return presentRefund(toDoc(await Refund.findById(String(id)).lean()));
}

async function getRefundByBookingId(bookingId) {
  if (!bookingId) return null;
  return presentRefund(toDoc(await Refund.findOne({ bookingId: String(bookingId) }).sort({ createdAt: -1 }).lean()));
}

async function requestRefund(booking, userId, payload = {}) {
  if (!booking) return { ok: false, message: 'Booking not found.' };
  if (String(booking.userId) !== String(userId)) return { ok: false, message: 'Booking not found.' };
  if (booking.paymentStatus !== 'verified') {
    return { ok: false, message: 'Refunds are only available after payment is verified.' };
  }
  if (['cancelled', 'refunded'].includes(booking.status)) {
    return { ok: false, message: 'This booking cannot be refunded.' };
  }
  if (tripStartHasArrived(booking.tripDate)) {
    return { ok: false, message: 'Refunds close on the trip start date.' };
  }
  const existingOpen = await Refund.findOne({
    bookingId: String(booking.id || booking._id),
    status: { $in: OPEN_STATUSES },
  }).lean();
  if (existingOpen) return { ok: false, message: 'A refund request is already in progress.' };

  const remaining = Math.max(0, roundMoney(booking.totalPrice) - roundMoney(booking.refundedAmount));
  if (remaining <= 0) return { ok: false, message: 'This booking has already been refunded.' };
  const requestedAmount = Math.min(remaining, roundMoney(payload.amount || remaining));
  if (requestedAmount <= 0) return { ok: false, message: 'Enter a valid refund amount.' };

  const dest = validateRefundDestination(payload);
  if (!dest.ok) return dest;

  const reasonCategory = REFUND_REASONS.some((item) => item.id === payload.reasonCategory)
    ? payload.reasonCategory
    : 'other';
  const id = await nextRefundId();
  const created = await Refund.create({
    _id: id,
    bookingId: String(booking.id || booking._id),
    paymentId: String(booking.paymentId || ''),
    userId: String(userId),
    companyId: String(booking.companyId),
    requestedAmount,
    approvedAmount: 0,
    currency: 'EGP',
    reasonCategory,
    reason: String(payload.reason || '').trim(),
    method: dest.destination.method,
    destination: dest.destination,
    status: 'requested',
  });
  await Booking.updateOne(
    { _id: String(booking.id || booking._id) },
    { $set: { refundStatus: 'requested' } }
  );
  return { ok: true, refund: presentRefund(toDoc(created)) };
}

async function approveRefund(id, { approvedAmount, note } = {}, adminUser) {
  const refund = await getRefundById(id);
  if (!refund) return { ok: false, message: 'Refund not found.' };
  if (!['requested', 'approved'].includes(refund.status)) {
    return { ok: false, message: 'This refund cannot be approved.' };
  }
  const booking = toDoc(await Booking.findById(String(refund.bookingId)).lean());
  if (!booking) return { ok: false, message: 'Booking not found.' };
  const split = refundSplit(booking, approvedAmount || refund.requestedAmount);
  if (split.approvedAmount <= 0) return { ok: false, message: 'Approved amount is invalid.' };
  const updated = await Refund.findByIdAndUpdate(
    String(id),
    {
      $set: {
        status: 'approved',
        approvedAmount: split.approvedAmount,
        platformFeeRefunded: split.platformFeeRefunded,
        companyClawback: booking.settlementStatus === 'settled' ? split.companyClawback : 0,
        reviewNote: String(note || '').trim(),
        reviewedBy: String(adminUser?.id || ''),
        reviewedAt: new Date(),
      },
    },
    { new: true }
  ).lean();
  await Booking.updateOne(
    { _id: String(refund.bookingId) },
    { $set: { refundStatus: 'approved' } }
  );
  return { ok: true, refund: presentRefund(toDoc(updated)), booking };
}

async function declineRefund(id, note, adminUser) {
  const refund = await getRefundById(id);
  if (!refund) return { ok: false, message: 'Refund not found.' };
  if (!['requested', 'approved', 'processing'].includes(refund.status)) {
    return { ok: false, message: 'This refund cannot be declined.' };
  }
  if (!String(note || '').trim()) return { ok: false, message: 'A decline note is required.' };
  const updated = await Refund.findByIdAndUpdate(
    String(id),
    {
      $set: {
        status: 'declined',
        reviewNote: String(note).trim(),
        reviewedBy: String(adminUser?.id || ''),
        reviewedAt: new Date(),
      },
    },
    { new: true }
  ).lean();
  await Booking.updateOne(
    { _id: String(refund.bookingId) },
    { $set: { refundStatus: 'declined' } }
  );
  return { ok: true, refund: presentRefund(toDoc(updated)) };
}

async function markRefundProcessing(id) {
  const refund = await getRefundById(id);
  if (!refund) return { ok: false, message: 'Refund not found.' };
  if (refund.status !== 'approved') return { ok: false, message: 'Approve the refund before recording a transfer.' };
  const updated = await Refund.findByIdAndUpdate(String(id), { $set: { status: 'processing' } }, { new: true }).lean();
  return { ok: true, refund: presentRefund(toDoc(updated)) };
}

async function markRefundPaid(id, { reference, proof, note } = {}, adminUser) {
  const refund = await getRefundById(id);
  if (!refund) return { ok: false, message: 'Refund not found.' };
  if (!['approved', 'processing'].includes(refund.status)) {
    return { ok: false, message: 'This refund cannot be marked paid.' };
  }
  if (!String(reference || refund.reference || '').trim()) {
    return { ok: false, message: 'Transfer reference is required.' };
  }
  const booking = toDoc(await Booking.findById(String(refund.bookingId)).lean());
  if (!booking) return { ok: false, message: 'Booking not found.' };
  const amount = roundMoney(refund.approvedAmount || refund.requestedAmount);
  const split = refundSplit(booking, amount);
  const clawback = booking.settlementStatus === 'settled' ? split.companyClawback : 0;
  const refundedAt = new Date();
  const updated = await Refund.findByIdAndUpdate(
    String(id),
    {
      $set: {
        status: 'refunded',
        approvedAmount: split.approvedAmount,
        platformFeeRefunded: split.platformFeeRefunded,
        companyClawback: clawback,
        reference: String(reference || refund.reference).trim(),
        proof: proof || refund.proof || {},
        reviewNote: String(note || refund.reviewNote || '').trim(),
        reviewedBy: String(adminUser?.id || refund.reviewedBy || ''),
        refundedAt,
      },
    },
    { new: true }
  ).lean();

  const nextRefundedAmount = roundMoney(booking.refundedAmount) + split.approvedAmount;
  const fullyRefunded = nextRefundedAmount >= roundMoney(booking.totalPrice);
  await Booking.updateOne(
    { _id: String(refund.bookingId) },
    {
      $set: {
        refundStatus: 'refunded',
        refundedAmount: nextRefundedAmount,
        ...(fullyRefunded ? { status: 'refunded' } : {}),
      },
      $push: {
        statusHistory: {
          status: fullyRefunded ? 'refunded' : booking.status,
          at: refundedAt,
          byUserId: String(adminUser?.id || ''),
          note: `Refund ${id} paid (${split.approvedAmount} EGP)`,
          label: fullyRefunded ? 'Booking refunded' : 'Partial refund paid',
        },
      },
    }
  );
  if (fullyRefunded) {
    await bookingService.returnSeatsIfNeeded(booking, 'refunded');
  }
  const presented = presentRefund(toDoc(updated));
  await ledger.recordRefundPaid(presented, booking, adminUser);
  return { ok: true, refund: presented, booking };
}

function parseFilterDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function filterRefunds(filters = {}) {
  const match = {};
  if (filters.status && filters.status !== 'all') match.status = filters.status;
  if (filters.companyId && filters.companyId !== 'all') match.companyId = String(filters.companyId);
  const dateFrom = parseFilterDate(filters.dateFrom);
  const dateTo = parseFilterDate(filters.dateTo);
  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = dateFrom;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }
  let items = toDocs(await Refund.find(match).sort({ createdAt: -1 }).lean()).map(presentRefund);
  const q = String(filters.q || '').trim().toLowerCase();
  if (q) {
    items = items.filter((item) => {
      const hay = `${item.id} ${item.bookingId} ${item.userId} ${item.reference} ${item.reason}`.toLowerCase();
      return hay.includes(q);
    });
  }
  return items;
}

async function countOpenRefunds() {
  return Refund.countDocuments({ status: { $in: ['requested', 'approved'] } });
}

async function getRefundSummary() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [open, refundedMonth] = await Promise.all([
    Refund.countDocuments({ status: { $in: ['requested', 'approved', 'processing'] } }),
    Refund.aggregate([
      { $match: { status: 'refunded', refundedAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$approvedAmount' }, count: { $sum: 1 } } },
    ]),
  ]);
  const requested = await Refund.countDocuments({ status: 'requested' });
  return {
    openCount: open,
    requestedCount: requested,
    refundedThisMonth: refundedMonth[0]?.total || 0,
    refundedThisMonthCount: refundedMonth[0]?.count || 0,
  };
}

function exportRefundsCsv(items = []) {
  const rows = [[
    'Refund ID', 'Booking', 'Status', 'Requested', 'Approved', 'Method', 'Reason', 'Reference', 'Submitted',
  ]];
  items.forEach((item) => {
    rows.push([
      item.id,
      item.bookingId,
      item.status,
      item.requestedAmount,
      item.approvedAmount,
      item.method,
      item.reasonCategory,
      item.reference || '',
      item.createdAt ? new Date(item.createdAt).toISOString() : '',
    ]);
  });
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

module.exports = {
  nextRefundId,
  presentRefund,
  getRefundById,
  getRefundByBookingId,
  tripStartHasArrived,
  requestRefund,
  approveRefund,
  declineRefund,
  markRefundProcessing,
  markRefundPaid,
  filterRefunds,
  countOpenRefunds,
  getRefundSummary,
  exportRefundsCsv,
  paginateList,
  parseRefundDestination,
};
