const { Payout, Booking, Company, Refund, nextSeq } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { paginateList } = require('../lib/paginate');
const { roundMoney, bookingSplit } = require('../lib/money');
const { presentProof } = require('../lib/finance-proof');
const {
  snapshotPayoutDetails,
  payoutDetailsVerified,
  destinationLines,
} = require('../lib/payout-details');
const ledger = require('./ledger');

const ACTIVE_PAYOUT_STATUSES = ['draft', 'processing'];

async function nextPayoutId() {
  const seq = await nextSeq('payout');
  return `PO-${String(seq).padStart(4, '0')}`;
}

function presentPayout(payout) {
  if (!payout) return null;
  const doc = payout.id ? payout : toDoc(payout);
  const adjustmentTotal = (doc.adjustments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return {
    ...doc,
    id: doc.id || doc._id,
    proof: presentProof(doc.proof),
    destinationLines: destinationLines(doc.destination || {}),
    adjustmentTotal,
  };
}

async function getPayoutById(id) {
  if (!id) return null;
  return presentPayout(toDoc(await Payout.findById(String(id)).lean()));
}

async function listUnsettledBookings(companyId) {
  const items = toDocs(await Booking.find({
    companyId: String(companyId),
    status: 'confirmed',
    settlementStatus: { $ne: 'settled' },
    refundStatus: { $nin: ['requested', 'approved', 'refunded'] },
    $or: [{ payoutId: '' }, { payoutId: { $exists: false } }, { payoutId: null }],
  }).sort({ bookingDate: 1 }).lean());
  return items.filter((booking) => {
    // Exclude bookings already locked in an active payout (stale payoutId).
    return !booking.payoutId;
  }).map((booking) => {
    const split = bookingSplit(booking);
    return {
      ...booking,
      ...split,
      tripDateLabel: booking.tripDate ? new Date(booking.tripDate).toISOString().slice(0, 10) : '',
      bookingDateLabel: booking.bookingDate ? new Date(booking.bookingDate).toISOString().slice(0, 10) : '',
    };
  });
}

async function pendingClawbacks(companyId) {
  const items = toDocs(await Refund.find({
    companyId: String(companyId),
    status: 'refunded',
    companyClawback: { $gt: 0 },
    $or: [{ clawbackPayoutId: '' }, { clawbackPayoutId: { $exists: false } }, { clawbackPayoutId: null }],
  }).lean());
  return items.map((refund) => ({
    label: `Clawback ${refund.id} · booking ${refund.bookingId}`,
    amount: -roundMoney(refund.companyClawback),
    refundId: refund.id,
  }));
}

async function lockedBookingIds(companyId, exceptPayoutId) {
  const match = {
    companyId: String(companyId),
    status: { $in: ACTIVE_PAYOUT_STATUSES },
  };
  if (exceptPayoutId) match._id = { $ne: String(exceptPayoutId) };
  const payouts = toDocs(await Payout.find(match).lean());
  return new Set(payouts.flatMap((payout) => payout.bookingIds || []));
}

function companyFromDoc(company) {
  return company?.id ? company : toDoc(company);
}

async function createPayout(companyId, bookingIds, adminUser) {
  const company = companyFromDoc(await Company.findById(String(companyId)).lean());
  if (!company) return { ok: false, code: 'COMPANY_NOT_FOUND', message: 'Company not found.' };
  if (!payoutDetailsVerified(company.payoutDetails)) {
    return { ok: false, code: 'PAYOUT_UNVERIFIED', message: 'Company payout details must be complete and verified first.' };
  }
  const ids = [...new Set((bookingIds || []).map(String).filter(Boolean))];
  if (!ids.length) return { ok: false, code: 'NO_BOOKINGS', message: 'Select at least one booking.' };

  const locked = await lockedBookingIds(companyId);
  if (ids.some((id) => locked.has(id))) {
    return { ok: false, code: 'BOOKING_LOCKED', message: 'A selected booking is already in another payout.' };
  }

  const bookings = toDocs(await Booking.find({
    _id: { $in: ids },
    companyId: String(companyId),
    status: 'confirmed',
    settlementStatus: { $ne: 'settled' },
    refundStatus: { $nin: ['requested', 'approved', 'refunded'] },
  }).lean());
  if (bookings.length !== ids.length) {
    return { ok: false, code: 'INVALID_BOOKINGS', message: 'Some bookings cannot be included in this payout.' };
  }

  let grossCollected = 0;
  let platformFee = 0;
  let payable = 0;
  bookings.forEach((booking) => {
    const split = bookingSplit(booking);
    grossCollected += split.collected;
    platformFee += split.platformFee;
    payable += split.payableToCompany;
  });
  const adjustments = await pendingClawbacks(companyId);
  const adjustmentTotal = adjustments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const netPayable = Math.max(0, roundMoney(payable + adjustmentTotal));
  const destination = snapshotPayoutDetails(company.payoutDetails);
  const id = await nextPayoutId();

  const created = await Payout.create({
    _id: id,
    companyId: String(companyId),
    currency: 'EGP',
    method: destination.method,
    destination,
    bookingIds: ids,
    grossCollected: roundMoney(grossCollected),
    platformFee: roundMoney(platformFee),
    adjustments,
    netPayable,
    status: 'draft',
    createdBy: String(adminUser?.id || ''),
  });

  await Booking.updateMany(
    { _id: { $in: ids } },
    { $set: { payoutId: id } }
  );
  if (adjustments.length) {
    await Refund.updateMany(
      { _id: { $in: adjustments.map((row) => row.refundId) } },
      { $set: { clawbackPayoutId: id } }
    );
  }
  return { ok: true, payout: presentPayout(toDoc(created)) };
}

async function setPayoutStatus(payoutId, status, extra = {}) {
  const payout = toDoc(await Payout.findById(String(payoutId)).lean());
  if (!payout) return null;
  const updated = await Payout.findByIdAndUpdate(
    String(payoutId),
    { $set: { status, ...extra } },
    { new: true }
  ).lean();
  return presentPayout(toDoc(updated));
}

async function markProcessing(payoutId) {
  const payout = await getPayoutById(payoutId);
  if (!payout) return { ok: false, message: 'Payout not found.' };
  if (!['draft', 'failed'].includes(payout.status)) {
    return { ok: false, message: 'Only draft or failed payouts can move to processing.' };
  }
  return { ok: true, payout: await setPayoutStatus(payoutId, 'processing') };
}

async function markPaid(payoutId, { reference, proof, note } = {}, adminUser) {
  const payout = await getPayoutById(payoutId);
  if (!payout) return { ok: false, message: 'Payout not found.' };
  if (!['draft', 'processing', 'failed'].includes(payout.status)) {
    return { ok: false, message: 'This payout cannot be marked paid.' };
  }
  if (!String(reference || payout.reference || '').trim()) {
    return { ok: false, message: 'Transfer reference is required.' };
  }
  const nextProof = proof?.url ? proof : (payout.proof?.url ? payout.proof : null);
  if (!nextProof?.url) {
    return { ok: false, message: 'Transfer proof is required.' };
  }
  const paidAt = new Date();
  const updated = await setPayoutStatus(payoutId, 'paid', {
    reference: String(reference || payout.reference).trim(),
    proof: nextProof,
    note: String(note || payout.note || '').trim(),
    paidAt,
  });
  await Booking.updateMany(
    { _id: { $in: payout.bookingIds || [] } },
    { $set: { settlementStatus: 'settled', settledAt: paidAt, payoutId: payout.id } }
  );
  await ledger.recordPayoutPaid(updated, adminUser);
  return { ok: true, payout: updated };
}

async function markFailed(payoutId, note, adminUser) {
  const payout = await getPayoutById(payoutId);
  if (!payout) return { ok: false, message: 'Payout not found.' };
  if (payout.status === 'paid' || payout.status === 'cancelled') {
    return { ok: false, message: 'Paid or cancelled payouts cannot be marked failed.' };
  }
  if (!String(note || '').trim()) {
    return { ok: false, message: 'Add a failure note.' };
  }
  return {
    ok: true,
    payout: await setPayoutStatus(payoutId, 'failed', {
      note: String(note || payout.note || '').trim(),
    }),
  };
}

async function cancelPayout(payoutId) {
  const payout = await getPayoutById(payoutId);
  if (!payout) return { ok: false, message: 'Payout not found.' };
  if (payout.status === 'paid') return { ok: false, message: 'Paid payouts cannot be cancelled.' };
  if (payout.status === 'cancelled') return { ok: true, payout };
  await Booking.updateMany(
    { _id: { $in: payout.bookingIds || [] }, payoutId: payout.id, settlementStatus: { $ne: 'settled' } },
    { $set: { payoutId: '' } }
  );
  await Refund.updateMany(
    { clawbackPayoutId: payout.id },
    { $set: { clawbackPayoutId: '' } }
  );
  return { ok: true, payout: await setPayoutStatus(payoutId, 'cancelled') };
}

function parseFilterDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function filterPayouts(filters = {}) {
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
  let items = toDocs(await Payout.find(match).sort({ createdAt: -1 }).lean()).map(presentPayout);
  const q = String(filters.q || '').trim().toLowerCase();
  if (q) {
    const companies = toDocs(await Company.find({}).select('_id title').lean());
    const titles = Object.fromEntries(companies.map((company) => [company.id, company.title || '']));
    items = items.filter((item) => {
      const hay = `${item.id} ${item.companyId} ${titles[item.companyId] || ''} ${item.reference} ${item.bookingIds.join(' ')} ${item.method}`.toLowerCase();
      return hay.includes(q);
    });
  }
  return items;
}

async function countActivePayouts() {
  return Payout.countDocuments({ status: { $in: ACTIVE_PAYOUT_STATUSES } });
}

async function getPayoutSummary() {
  const [draft, processing, failed, paidMonth] = await Promise.all([
    Payout.countDocuments({ status: 'draft' }),
    Payout.countDocuments({ status: 'processing' }),
    Payout.countDocuments({ status: 'failed' }),
    Payout.aggregate([
      {
        $match: {
          status: 'paid',
          paidAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      },
      { $group: { _id: null, total: { $sum: '$netPayable' }, count: { $sum: 1 } } },
    ]),
  ]);
  const dueRows = await Booking.aggregate([
    { $match: { status: 'confirmed', settlementStatus: { $ne: 'settled' } } },
    {
      $group: {
        _id: null,
        payable: { $sum: { $ifNull: ['$basePrice', 0] } },
        count: { $sum: 1 },
      },
    },
  ]);
  return {
    draftCount: draft,
    processingCount: processing,
    failedCount: failed,
    paidThisMonth: paidMonth[0]?.total || 0,
    paidThisMonthCount: paidMonth[0]?.count || 0,
    payoutsDue: dueRows[0]?.payable || 0,
    payoutsDueCount: dueRows[0]?.count || 0,
  };
}

async function listPayoutsForCompany(companyId) {
  return toDocs(await Payout.find({ companyId: String(companyId) }).sort({ createdAt: -1 }).lean()).map(presentPayout);
}

function exportPayoutsCsv(items = [], companiesById = {}) {
  const rows = [[
    'Payout ID', 'Company', 'Status', 'Method', 'Net payable', 'Gross collected', 'Platform fee',
    'Bookings', 'Reference', 'Created', 'Paid at',
  ]];
  items.forEach((payout) => {
    rows.push([
      payout.id,
      companiesById[payout.companyId]?.title || payout.companyId,
      payout.status,
      payout.method,
      payout.netPayable,
      payout.grossCollected,
      payout.platformFee,
      (payout.bookingIds || []).join(' '),
      payout.reference || '',
      payout.createdAt ? new Date(payout.createdAt).toISOString() : '',
      payout.paidAt ? new Date(payout.paidAt).toISOString() : '',
    ]);
  });
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

module.exports = {
  nextPayoutId,
  presentPayout,
  getPayoutById,
  listUnsettledBookings,
  pendingClawbacks,
  createPayout,
  markProcessing,
  markPaid,
  markFailed,
  cancelPayout,
  filterPayouts,
  countActivePayouts,
  getPayoutSummary,
  listPayoutsForCompany,
  exportPayoutsCsv,
  paginateList,
};
