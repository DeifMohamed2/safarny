const { Payment, Booking, Company, nextSeq } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { paginateList } = require('../lib/paginate');
const { methodLabel, MOBILE_WALLET_METHODS } = require('../lib/payment-methods');
const { bookingSplit, roundMoney } = require('../lib/money');
const { payoutDetailsVerified } = require('../lib/payout-details');

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseFilterDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function presentProof(proof) {
  if (!proof?.url) return null;
  const name = proof.name || 'payment-proof';
  const isImage = String(proof.mime || '').startsWith('image/');
  return {
    ...proof,
    viewUrl: proof.url,
    downloadUrl: proof.url,
    downloadName: name,
    isImage,
  };
}

async function nextPaymentId() {
  const seq = await nextSeq('payment');
  return `PAY-${String(seq).padStart(4, '0')}`;
}

function presentPayment(payment, locale = 'en') {
  if (!payment) return null;
  const doc = payment.id ? payment : toDoc(payment);
  return {
    ...doc,
    id: doc.id || doc._id,
    methodLabel: methodLabel(doc.method),
    statusLabel: doc.status === 'verified' ? 'Verified' : doc.status === 'rejected' ? 'Rejected' : 'Submitted',
    isImageProof: String(doc.proof?.mime || '').startsWith('image/'),
    proof: presentProof(doc.proof),
  };
}

async function getPaymentById(id) {
  if (!id) return null;
  return presentPayment(toDoc(await Payment.findById(String(id)).lean()));
}

async function getPaymentByBookingId(bookingId) {
  if (!bookingId) return null;
  return presentPayment(toDoc(await Payment.findOne({ bookingId: String(bookingId) }).sort({ createdAt: -1 }).lean()));
}

async function createPayment(payload) {
  const id = await nextPaymentId();
  const created = await Payment.create({
    _id: id,
    bookingId: String(payload.bookingId),
    userId: String(payload.userId),
    companyId: String(payload.companyId),
    tripId: String(payload.tripId),
    method: payload.method,
    amount: Number(payload.amount) || 0,
    currency: payload.currency || 'EGP',
    senderName: String(payload.senderName || '').trim(),
    senderPhone: String(payload.senderPhone || '').trim(),
    transferRef: String(payload.transferRef || '').trim(),
    proof: payload.proof || {},
    status: 'submitted',
    basePrice: Number(payload.basePrice) || 0,
    markupAmount: Number(payload.markupAmount) || 0,
  });
  return presentPayment(toDoc(created));
}

async function resubmitPayment(paymentId, userId, payload) {
  const existing = toDoc(await Payment.findById(String(paymentId)).lean());
  if (!existing || String(existing.userId) !== String(userId)) return null;
  if (existing.status !== 'rejected') return null;
  const updated = await Payment.findByIdAndUpdate(
    String(paymentId),
    {
      $set: {
        method: payload.method || existing.method,
        senderName: String(payload.senderName || existing.senderName).trim(),
        senderPhone: String(payload.senderPhone || existing.senderPhone).trim(),
        transferRef: String(payload.transferRef || existing.transferRef).trim(),
        proof: payload.proof || existing.proof,
        status: 'submitted',
        reviewedAt: null,
        reviewedBy: '',
        reviewNote: '',
      },
    },
    { new: true }
  ).lean();
  return presentPayment(toDoc(updated));
}

async function filterPayments(filters = {}) {
  const status = String(filters.status || 'all');
  const method = String(filters.method || 'all');
  const q = String(filters.q || '').trim();
  const dateFrom = parseFilterDate(filters.dateFrom);
  const dateTo = parseFilterDate(filters.dateTo);

  const match = {};
  if (status !== 'all') match.status = status;
  if (method !== 'all') {
    match.method = method === 'mobile_wallet' ? { $in: MOBILE_WALLET_METHODS } : method;
  }
  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = dateFrom;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'booking',
      },
    },
    { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ];

  if (q) {
    const tokens = q.split(/\s+/).filter(Boolean);
    const amountQuery = Number(q.replace(/[, ]/g, ''));
    pipeline.push({
      $addFields: {
        searchText: {
          $toLower: {
            $concat: [
              { $ifNull: ['$_id', ''] }, ' ',
              { $ifNull: ['$bookingId', ''] }, ' ',
              { $ifNull: ['$booking.code', ''] }, ' ',
              'saf-', { $ifNull: ['$booking.code', ''] }, ' ',
              { $ifNull: ['$booking.customerName', ''] }, ' ',
              { $ifNull: ['$booking.customerEmail', ''] }, ' ',
              { $ifNull: ['$booking.customerPhone', ''] }, ' ',
              { $ifNull: ['$booking.tripName', ''] }, ' ',
              { $ifNull: ['$senderName', ''] }, ' ',
              { $ifNull: ['$senderPhone', ''] }, ' ',
              { $ifNull: ['$transferRef', ''] }, ' ',
              { $ifNull: ['$userId', ''] }, ' ',
              { $ifNull: ['$user.userName', ''] }, ' ',
              { $ifNull: ['$user.email', ''] }, ' ',
              { $ifNull: ['$user.phone', ''] }, ' ',
              { $ifNull: ['$method', ''] }, ' ',
              { $toString: { $ifNull: ['$amount', ''] } },
            ],
          },
        },
      },
    });

    const tokenMatch = tokens.map((token) => ({
      searchText: { $regex: escapeRegex(token), $options: 'i' },
    }));

    if (!Number.isNaN(amountQuery) && String(amountQuery) === q.replace(/[, ]/g, '')) {
      pipeline.push({
        $match: {
          $or: [
            { $and: tokenMatch },
            { amount: amountQuery },
          ],
        },
      });
    } else {
      pipeline.push({ $match: { $and: tokenMatch } });
    }
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  const docs = await Payment.aggregate(pipeline);
  return docs.map((doc) => {
    const { booking, user, searchText, ...payment } = doc;
    return presentPayment(toDoc(payment));
  });
}

async function countSubmittedPayments() {
  return Payment.countDocuments({ status: 'submitted' });
}

async function getFinanceSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [submitted, verifiedMonth, rejected, verifiedAll] = await Promise.all([
    Payment.countDocuments({ status: 'submitted' }),
    Payment.aggregate([
      { $match: { status: 'verified', reviewedAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ status: 'rejected' }),
    Payment.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);
  const methodMix = await Payment.aggregate([
    { $match: { status: 'verified' } },
    { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
  ]);
  const pendingGmv = await Payment.aggregate([
    { $match: { status: 'submitted' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return {
    awaitingReview: submitted,
    verifiedThisMonth: verifiedMonth[0]?.total || 0,
    verifiedThisMonthCount: verifiedMonth[0]?.count || 0,
    rejectedCount: rejected,
    verifiedTotal: verifiedAll[0]?.total || 0,
    verifiedCount: verifiedAll[0]?.count || 0,
    pendingGmv: pendingGmv[0]?.total || 0,
    pendingCount: pendingGmv[0]?.count || 0,
    methodMix: methodMix.map((row) => ({ method: row._id, count: row.count, total: row.total })),
  };
}

function splitForSettlement(booking) {
  const split = bookingSplit(booking);
  return {
    collected: split.collected,
    platformCut: split.platformFee,
    payableToCompany: split.payableToCompany,
  };
}

async function getCompanySettlements() {
  const [bookings, companies] = await Promise.all([
    toDocs(await Booking.find({ status: 'confirmed' }).lean()),
    toDocs(await Company.find().lean()),
  ]);
  const companyById = Object.fromEntries(companies.map((company) => [String(company.id || company._id), company]));
  const groups = new Map();

  bookings.forEach((booking) => {
    const companyId = String(booking.companyId || '');
    if (!groups.has(companyId)) {
      const company = companyById[companyId];
      groups.set(companyId, {
        companyId,
        companyName: company?.title || companyId,
        collected: 0,
        platformCut: 0,
        payableToCompany: 0,
        unsettledPayable: 0,
        settledPayable: 0,
        availablePayable: 0,
        bookingCount: 0,
        unsettledCount: 0,
        settledCount: 0,
        availableCount: 0,
        payoutReady: payoutDetailsVerified(company?.payoutDetails),
        method: company?.payoutDetails?.method || '',
      });
    }
    const row = groups.get(companyId);
    const split = splitForSettlement(booking);
    row.collected += split.collected;
    row.platformCut += split.platformCut;
    row.payableToCompany += split.payableToCompany;
    row.bookingCount += 1;
    if (booking.settlementStatus === 'settled') {
      row.settledCount += 1;
      row.settledPayable += split.payableToCompany;
    } else {
      row.unsettledCount += 1;
      row.unsettledPayable += split.payableToCompany;
      if (!booking.payoutId) {
        row.availableCount += 1;
        row.availablePayable += split.payableToCompany;
      }
    }
  });

  return [...groups.values()]
    .map((row) => ({
      ...row,
      collected: roundMoney(row.collected),
      platformCut: roundMoney(row.platformCut),
      payableToCompany: roundMoney(row.payableToCompany),
      unsettledPayable: roundMoney(row.unsettledPayable),
      settledPayable: roundMoney(row.settledPayable),
      availablePayable: roundMoney(row.availablePayable),
    }))
    .sort((a, b) => b.unsettledPayable - a.unsettledPayable || b.payableToCompany - a.payableToCompany);
}

function summarizeSettlements(rows = []) {
  const summary = rows.reduce((acc, row) => {
    acc.unsettledPayable += Number(row.unsettledPayable || 0);
    acc.settledPayable += Number(row.settledPayable || 0);
    acc.payableToCompany += Number(row.payableToCompany || 0);
    acc.unsettledBookings += Number(row.unsettledCount || 0);
    acc.settledBookings += Number(row.settledCount || 0);
    acc.availablePayable += Number(row.availablePayable || 0);
    acc.availableBookings += Number(row.availableCount || 0);
    if (Number(row.unsettledCount || 0) > 0) {
      acc.unsettledCompanies += 1;
      if (row.payoutReady) acc.readyCompanies += 1;
      else acc.blockedCompanies += 1;
    }
    return acc;
  }, {
    unsettledPayable: 0,
    settledPayable: 0,
    payableToCompany: 0,
    unsettledBookings: 0,
    settledBookings: 0,
    availablePayable: 0,
    availableBookings: 0,
    unsettledCompanies: 0,
    readyCompanies: 0,
    blockedCompanies: 0,
  });
  return {
    ...summary,
    unsettledPayable: roundMoney(summary.unsettledPayable),
    settledPayable: roundMoney(summary.settledPayable),
    payableToCompany: roundMoney(summary.payableToCompany),
    availablePayable: roundMoney(summary.availablePayable),
    dueCompanies: rows.filter((row) => Number(row.unsettledCount || 0) > 0),
  };
}

async function settleCompanyBookings(companyId) {
  if (!companyId) return 0;
  const result = await Booking.updateMany(
    {
      companyId: String(companyId),
      status: 'confirmed',
      settlementStatus: { $ne: 'settled' },
    },
    { $set: { settlementStatus: 'settled', settledAt: new Date() } }
  );
  return result.modifiedCount || 0;
}

async function verifyPayment(paymentId, adminUser) {
  const payment = toDoc(await Payment.findById(String(paymentId)).lean());
  if (!payment || payment.status === 'verified') return null;
  const updated = await Payment.findByIdAndUpdate(
    String(paymentId),
    {
      $set: {
        status: 'verified',
        reviewedAt: new Date(),
        reviewedBy: String(adminUser?.id || ''),
        reviewNote: '',
      },
    },
    { new: true }
  ).lean();
  return presentPayment(toDoc(updated));
}

async function rejectPayment(paymentId, adminUser, note) {
  const payment = toDoc(await Payment.findById(String(paymentId)).lean());
  if (!payment || payment.status === 'verified') return null;
  const updated = await Payment.findByIdAndUpdate(
    String(paymentId),
    {
      $set: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: String(adminUser?.id || ''),
        reviewNote: String(note || '').trim(),
      },
    },
    { new: true }
  ).lean();
  return presentPayment(toDoc(updated));
}

function exportPaymentsCsv(items = [], enriched = []) {
  const rows = [[
    'Payment ID', 'Booking', 'Reference', 'Customer', 'Email', 'Phone',
    'Trip', 'Method', 'Amount', 'Currency', 'Status', 'Sender', 'Transfer ref', 'Submitted',
  ]];
  const lookup = new Map((enriched || []).map((item) => [item.id, item]));
  items.forEach((p) => {
    const extra = lookup.get(p.id) || {};
    rows.push([
      p.id,
      p.bookingId,
      extra.referenceCode || '',
      extra.customerName || p.senderName,
      extra.customerEmail || '',
      extra.customerPhone || p.senderPhone,
      extra.tripName || '',
      p.method,
      p.amount,
      p.currency,
      p.status,
      p.senderName,
      p.transferRef,
      p.createdAt ? new Date(p.createdAt).toISOString() : '',
    ]);
  });
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

module.exports = {
  nextPaymentId,
  presentPayment,
  getPaymentById,
  getPaymentByBookingId,
  createPayment,
  resubmitPayment,
  filterPayments,
  countSubmittedPayments,
  getFinanceSummary,
  getCompanySettlements,
  summarizeSettlements,
  settleCompanyBookings,
  verifyPayment,
  rejectPayment,
  exportPaymentsCsv,
  paginateList,
  bookingSplit,
};
