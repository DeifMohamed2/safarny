#!/usr/bin/env node
require('../config/env');

const bcrypt = require('bcryptjs');
const { connectDb, disconnectDb } = require('../config/db');
const {
  User,
  Company,
  Trip,
  Booking,
  Ticket,
  Review,
  Conversation,
  PlatformSettings,
  AuditLog,
  Counter,
  PasswordResetToken,
  Payment,
  Payout,
  Refund,
  LedgerEntry,
} = require('../models');
const { ROUNDS } = require('../lib/password');
const { parseTravelDates } = require('../lib/trip-form-helpers');
const { users } = require('../data/users');
const { companies } = require('../data/companies');
const { trips: catalogTrips } = require('../data/trips');
const { companyTrips } = require('../data/company-trips');
const { companyBookings } = require('../data/company-bookings');
const { bookings: travelerBookings } = require('../data/bookings');
const { tickets: travelerTickets, repliesByTicket: travelerReplies } = require('../data/tickets');
const { companyTickets, repliesByTicket: companyReplies } = require('../data/company-tickets');
const { reviews } = require('../data/reviews');
const { travelerProfiles } = require('../data/traveler-profiles');
const { companyChats, repliesByChat } = require('../data/company-chats');
const { getSettings: getSeedSettings } = require('../data/platform-settings');
const { DEFAULTS: platformDefaults } = require('../services/settings');
const { auditLog } = require('../data/admin-audit');
const { normalizeStatus } = require('../lib/status');
const { bookingSplit, roundMoney } = require('../lib/money');

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDisplayRange(label) {
  const match = String(label || '').match(/^([A-Za-z]+)\s+(\d+)(?:–(\d+))?,\s*(\d{4})$/);
  if (!match) return { startDate: '2026-01-10', endDate: '2026-01-13' };
  const month = MONTHS[match[1].slice(0, 3).toLowerCase()] ?? 0;
  const startDay = Number(match[2]);
  const endDay = Number(match[3] || match[2]);
  const year = Number(match[4]);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    startDate: `${year}-${pad(month + 1)}-${pad(startDay)}`,
    endDate: `${year}-${pad(month + 1)}-${pad(endDay)}`,
  };
}

function parseLooseDate(value, fallback) {
  if (!value) return fallback;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime()) && String(value).includes('-') && String(value).length >= 8) {
    return direct;
  }
  const us = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) return new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
  const named = String(value).match(/^([A-Za-z]+)\s+(\d+),\s*(\d{4})$/);
  if (named) {
    const month = MONTHS[named[1].slice(0, 3).toLowerCase()] ?? 0;
    return new Date(Number(named[3]), month, Number(named[2]));
  }
  const relative = String(value).toLowerCase();
  const now = fallback || new Date('2026-08-26T16:00:00.000Z');
  if (relative.includes('now') || relative === 'today' || relative.includes('just')) return now;
  const hours = relative.match(/(\d+)h/);
  if (hours) return new Date(now.getTime() - Number(hours[1]) * 3600000);
  const days = relative.match(/(\d+)d/);
  if (days) return new Date(now.getTime() - Number(days[1]) * 86400000);
  const weeks = relative.match(/(\d+)w/);
  if (weeks) return new Date(now.getTime() - Number(weeks[1]) * 7 * 86400000);
  return now;
}

function parseReplyDate(reply, fallback) {
  if (reply.date && reply.date !== 'Today') return parseLooseDate(reply.date, fallback);
  return fallback;
}

async function upsert(Model, docs) {
  if (!docs.length) return;
  await Model.bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc },
        upsert: true,
      },
    }))
  );
}

async function primeCounter(name, seq) {
  await Counter.findOneAndUpdate({ _id: name }, { $max: { seq } }, { upsert: true });
}

async function seed(options = {}) {
  const reset = Boolean(options.reset);
  const dropSessions = Boolean(options.all);
  await connectDb();

  if (reset) {
    await User.deleteMany({});
    await Company.deleteMany({});
    await Trip.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Payout.deleteMany({});
    await Refund.deleteMany({});
    await LedgerEntry.deleteMany({});
    await Ticket.deleteMany({});
    await Review.deleteMany({});
    await Conversation.deleteMany({});
    await PlatformSettings.deleteMany({});
    await AuditLog.deleteMany({});
    await Counter.deleteMany({});
    await PasswordResetToken.deleteMany({});
    if (dropSessions) {
      await User.db.collection('sessions').deleteMany({}).catch(() => {});
    }
  }

  const passwordHash = await bcrypt.hash('123Qwe', ROUNDS);
  const settings = getSeedSettings();
  await PlatformSettings.updateOne(
    { _id: 'default' },
    { $set: { ...settings, payoutAccounts: platformDefaults.payoutAccounts, _id: 'default' } },
    { upsert: true }
  );

  await upsert(Company, companies.map((company) => {
    const { id, ...rest } = company;
    return {
      ...rest,
      _id: String(id),
      verification: company.verification || 'verified',
      status: company.status || 'active',
      joinedAt: parseLooseDate(company.joinedAt, new Date('2024-01-01')),
      commissionRate: company.commissionRate || 12,
      markupType: company.markupType === 'fixed' ? 'fixed' : 'percent',
      markupFixed: Number(company.markupFixed) || 0,
      payoutDetails: ['1', '2'].includes(String(id))
        ? {
            method: 'bank_transfer',
            bankName: 'National Bank of Egypt',
            accountName: company.title,
            accountNumber: `1000${String(id).padStart(8, '0')}`,
            iban: `EG380003000${String(id).padStart(16, '0')}`,
            swift: 'NBEGEGCX',
            walletProvider: '',
            walletNumber: '',
            instapayIpa: '',
            verifiedAt: new Date('2026-08-01'),
            verifiedBy: 'a1',
          }
        : {},
    };
  }));

  await upsert(User, users.map((user) => {
    const profile = travelerProfiles[user.id];
    return {
      _id: String(user.id),
      avatar: user.avatar,
      userName: user.userName,
      email: String(user.email).toLowerCase(),
      phone: user.phone || '',
      passwordHash,
      role: user.role,
      companyId: user.companyId || null,
      status: user.status || 'active',
      city: user.city || '',
      country: user.country || '',
      lastLoginAt: user.lastLoginAt ? parseLooseDate(user.lastLoginAt) : null,
      lastActiveAt: profile?.lastActiveAt ? parseLooseDate(profile.lastActiveAt) : null,
      createdAt: parseLooseDate(user.createdAt, new Date('2025-01-01')),
      traveler: profile
        ? {
            favoriteTripIds: profile.favoriteTripIds || [],
            preferredDestinations: profile.preferredDestinations || [],
            language: profile.language || 'en',
            notifications: profile.notifications || { email: true, sms: false, push: false },
            notes: profile.notes || '',
            activity: (profile.activity || []).map((item) => ({
              ...item,
              at: parseLooseDate(item.at),
            })),
          }
        : {
            favoriteTripIds: [],
            preferredDestinations: [],
            language: 'en',
            notifications: { email: true, sms: false, push: false },
            notes: '',
            activity: [],
          },
    };
  }));

  const catalogDocs = catalogTrips.map((trip) => {
    const travelDates = Array.isArray(trip.travelDates) && trip.travelDates.length
      ? trip.travelDates
      : [];
    return {
      _id: String(trip.id),
      companyId: String(trip.companyId),
      title: trip.title,
      titleAr: trip.titleAr || '',
      location: trip.location,
      destination: trip.destination,
      category: trip.category,
      type: trip.type,
      description: trip.description || trip.about,
      about: trip.about || trip.description,
      price: trip.price,
      oldPrice: trip.oldPrice,
      discountPercent: trip.discountPercent,
      totalSeats: trip.totalSeats || 12,
      availableSeats: trip.availableSeats ?? trip.availableSpots,
      startDate: travelDates[0]?.startDate || trip.startDate || '2026-10-12',
      endDate: travelDates[0]?.endDate || trip.endDate || '2026-10-16',
      days: trip.days,
      nights: trip.nights,
      beds: trip.beds,
      schedule: trip.type === 'umrah' ? 'weekly' : 'daily',
      frequency: trip.frequency,
      images: trip.gallery || trip.images || [],
      videos: [],
      status: trip.status || 'active',
      offer: Boolean(trip.offer),
      featured: trip.type === 'umrah',
      catalog: true,
      travelDates,
      roomTypes: trip.roomTypes || [],
      itinerary: trip.itinerary || [],
      includedList: trip.includedList || [],
      markupType: trip.markupType || 'inherit',
      markupPercent: Number(trip.markupPercent) || 0,
      markupFixed: Number(trip.markupFixed) || 0,
      createdAt: new Date('2026-01-01'),
    };
  });

  const companyDocs = companyTrips.map((trip) => {
    const { id, createdAt, ...rest } = trip;
    const travelDates = parseTravelDates(trip.travelDates, trip);
    const availableSeats = Number(trip.availableSeats) || 0;
    return {
      ...rest,
      _id: String(id),
      location: trip.location || `${trip.destination}, ${trip.type === 'umrah' ? 'Saudi Arabia' : 'Egypt'}`,
      about: trip.description,
      catalog: false,
      images: trip.images || [],
      videos: trip.videos || [],
      itinerary: trip.itinerary || [],
      travelDates,
      includedList: trip.includedList || [],
      availableSeats,
      status: availableSeats <= 0 && (trip.status === 'active' || !trip.status) ? 'sold-out' : (trip.status || 'draft'),
      createdAt: parseLooseDate(createdAt, new Date('2026-02-01')),
    };
  });

  await upsert(Trip, [...catalogDocs, ...companyDocs]);

  const companyBookingDocs = companyBookings.map((booking) => {
    const status = normalizeStatus(booking.status);
    const paymentMethod = booking.paymentMethod && booking.paymentMethod !== 'legacy'
      ? booking.paymentMethod
      : 'instapay';
    return {
      _id: booking.id,
      code: booking.id,
      companyId: String(booking.companyId),
      tripId: String(booking.tripId),
      userId: booking.userId || null,
      tripName: booking.tripName,
      customerName: booking.customerName,
      customerEmail: String(booking.customerEmail || '').toLowerCase(),
      customerPhone: booking.customerPhone || '',
      seats: booking.seats,
      rooms: booking.rooms || 1,
      roomType: booking.roomType || '',
      occupancy: booking.occupancy || 0,
      totalPrice: booking.totalPrice,
      basePrice: booking.basePrice || 0,
      markupAmount: booking.markupAmount || 0,
      settlementStatus: booking.settlementStatus || (status === 'confirmed' ? 'unsettled' : 'unsettled'),
      settledAt: booking.settledAt ? parseLooseDate(booking.settledAt) : null,
      bookingDate: parseLooseDate(booking.bookingDate),
      tripDate: parseLooseDate(booking.tripDate),
      travelDateId: booking.travelDateId || '',
      status,
      notes: booking.notes || '',
      image: '',
      category: '',
      location: '',
      statusHistory: [
        { status: 'pending', at: parseLooseDate(booking.bookingDate), label: 'Booking placed' },
        ...(status !== 'pending'
          ? [{ status, at: parseLooseDate(booking.bookingDate), label: `Booking ${status}` }]
          : []),
      ],
      paymentMethod,
      paymentStatus: booking.paymentStatus || (status === 'confirmed' ? 'verified' : 'unpaid'),
      paymentId: '',
      payoutId: '',
      refundStatus: 'none',
      refundedAmount: 0,
    };
  });

  const tripById = new Map([...catalogDocs, ...companyDocs].map((t) => [String(t._id), t]));
  const travelerBookingDocs = travelerBookings.map((booking, index) => {
    const trip = tripById.get(String(booking.tripId));
    const code = `T${String(index + 1).padStart(3, '0')}`;
    const bookingDate = parseLooseDate(booking.bookingDate, new Date('2026-08-01'));
    const tripDate = parseLooseDate(booking.travelDate, new Date('2026-10-01'));
    const status = normalizeStatus(booking.status);
    const paymentMethod = booking.paymentMethod && booking.paymentMethod !== 'legacy'
      ? booking.paymentMethod
      : 'instapay';
    return {
      _id: code,
      code,
      companyId: String(trip?.companyId || '1'),
      tripId: String(booking.tripId),
      userId: booking.userId || '21',
      tripName: booking.title,
      customerName: users.find((user) => String(user.id) === String(booking.userId || '21'))?.userName || 'Ahmed Ali',
      customerEmail: users.find((user) => String(user.id) === String(booking.userId || '21'))?.email || 'ahmedali@email.com',
      customerPhone: users.find((user) => String(user.id) === String(booking.userId || '21'))?.phone || '+201227375904',
      seats: booking.adults || 1,
      rooms: Math.max(1, Math.ceil(Number(booking.adults || 1) / 2)),
      roomType: Number(booking.adults) === 1 ? 'single' : 'double',
      occupancy: Number(booking.adults) === 1 ? 1 : 2,
      totalPrice: Number(booking.totalPrice || (booking.price || 0) * (booking.adults || 1)),
      basePrice: Number(booking.basePrice) || 0,
      markupAmount: Number(booking.markupAmount) || 0,
      settlementStatus: booking.settlementStatus || 'unsettled',
      settledAt: booking.settledAt ? parseLooseDate(booking.settledAt) : null,
      bookingDate,
      tripDate,
      travelDateId: booking.travelDateId || '',
      status,
      notes: '',
      image: booking.image,
      category: booking.category,
      location: booking.location,
      duration: booking.duration,
      statusHistory: [
        { status: 'pending', at: bookingDate, label: 'Booking placed' },
        ...(status !== 'pending' ? [{ status, at: bookingDate, label: `Booking ${status}` }] : []),
      ],
      paymentMethod,
      paymentStatus: booking.paymentStatus || (status === 'confirmed' ? 'verified' : 'unpaid'),
      paymentId: '',
      payoutId: '',
      refundStatus: 'none',
      refundedAmount: 0,
    };
  });

  const allBookingDocs = [...companyBookingDocs, ...travelerBookingDocs];
  const paymentDocs = allBookingDocs
    .filter((booking) => ['submitted', 'verified', 'rejected'].includes(booking.paymentStatus))
    .map((booking, index) => {
      const id = `PAY-${String(index + 1).padStart(4, '0')}`;
      booking.paymentId = id;
      const method = ['instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash', 'bank_transfer'].includes(booking.paymentMethod)
        ? booking.paymentMethod
        : 'instapay';
      return {
        _id: id,
        bookingId: booking.code,
        userId: String(booking.userId || '21'),
        companyId: String(booking.companyId),
        tripId: String(booking.tripId),
        method,
        amount: Number(booking.totalPrice) || 0,
        basePrice: Number(booking.basePrice) || 0,
        markupAmount: Number(booking.markupAmount) || 0,
        currency: 'EGP',
        senderName: booking.customerName,
        senderPhone: booking.customerPhone,
        transferRef: `${booking.code}-TRF`,
        proof: { url: '/user.png', name: `${booking.code}-proof.png`, mime: 'image/png', size: 18432 },
        status: booking.paymentStatus,
        reviewedAt: booking.paymentStatus === 'submitted' ? null : parseLooseDate(booking.bookingDate),
        reviewedBy: booking.paymentStatus === 'submitted' ? '' : 'a1',
        reviewNote: booking.paymentStatus === 'rejected' ? 'Transfer reference did not match the uploaded proof.' : '',
        createdAt: parseLooseDate(booking.bookingDate),
      };
    });

  await upsert(Booking, allBookingDocs);
  await upsert(Payment, paymentDocs);

  const ledgerDocs = [];
  let ledgerSeq = 0;
  function pushLedger(entry) {
    ledgerSeq += 1;
    ledgerDocs.push({
      _id: `LED-${String(ledgerSeq).padStart(6, '0')}`,
      currency: 'EGP',
      createdBy: 'a1',
      ...entry,
    });
  }

  paymentDocs.filter((payment) => payment.status === 'verified').forEach((payment) => {
    const booking = allBookingDocs.find((item) => item.code === payment.bookingId || item._id === payment.bookingId);
    if (!booking) return;
    const split = bookingSplit(booking);
    pushLedger({
      type: 'collection',
      direction: 'in',
      amount: split.collected,
      companyId: String(booking.companyId),
      bookingId: booking._id,
      refId: payment._id,
      note: `Collected for booking ${booking.code}`,
      occurredAt: payment.reviewedAt || booking.bookingDate,
    });
    if (split.platformFee) {
      pushLedger({
        type: 'platform_fee',
        direction: 'in',
        amount: split.platformFee,
        companyId: String(booking.companyId),
        bookingId: booking._id,
        refId: payment._id,
        note: `Platform markup on booking ${booking.code}`,
        occurredAt: payment.reviewedAt || booking.bookingDate,
      });
    }
  });

  const settledByCompany = new Map();
  allBookingDocs.forEach((booking) => {
    if (normalizeStatus(booking.status) !== 'confirmed' || booking.settlementStatus !== 'settled') return;
    const companyId = String(booking.companyId);
    if (!settledByCompany.has(companyId)) settledByCompany.set(companyId, []);
    settledByCompany.get(companyId).push(booking);
  });

  const payoutDocs = [];
  let payoutSeq = 0;
  settledByCompany.forEach((bookings, companyId) => {
    payoutSeq += 1;
    const id = `PO-${String(payoutSeq).padStart(4, '0')}`;
    let grossCollected = 0;
    let platformFee = 0;
    let payable = 0;
    bookings.forEach((booking) => {
      const split = bookingSplit(booking);
      grossCollected += split.collected;
      platformFee += split.platformFee;
      payable += split.payableToCompany;
      booking.payoutId = id;
    });
    const paidAt = bookings[0].settledAt || new Date('2026-08-28');
    payoutDocs.push({
      _id: id,
      companyId,
      currency: 'EGP',
      method: 'bank_transfer',
      destination: {
        method: 'bank_transfer',
        bankName: 'National Bank of Egypt',
        accountName: companies.find((company) => String(company.id) === companyId)?.title || companyId,
        accountNumber: `1000${String(companyId).padStart(8, '0')}`,
        iban: `EG380003000${String(companyId).padStart(16, '0')}`,
      },
      bookingIds: bookings.map((booking) => booking._id),
      grossCollected: roundMoney(grossCollected),
      platformFee: roundMoney(platformFee),
      adjustments: [],
      netPayable: roundMoney(payable),
      status: 'paid',
      reference: `${id}-TRF`,
      proof: { url: '/user.png', name: `${id}-proof.png`, mime: 'image/png', size: 12000 },
      statementNumber: `STM-${String(payoutSeq).padStart(4, '0')}`,
      createdBy: 'a1',
      paidAt,
      createdAt: paidAt,
    });
    pushLedger({
      type: 'payout',
      direction: 'out',
      amount: roundMoney(payable),
      companyId,
      refId: id,
      note: `Payout ${id}`,
      occurredAt: paidAt,
    });
  });

  const refundTarget = allBookingDocs.find((booking) => booking._id === 'B002')
    || allBookingDocs.find((booking) => booking.settlementStatus === 'settled' && normalizeStatus(booking.status) === 'confirmed');
  const openRefundTarget = allBookingDocs.find((booking) => booking._id === 'B001')
    || allBookingDocs.find((booking) => booking.paymentStatus === 'verified' && booking.settlementStatus !== 'settled');

  const refundDocs = [];
  if (openRefundTarget) {
    refundDocs.push({
      _id: 'RF-0001',
      bookingId: openRefundTarget._id,
      paymentId: openRefundTarget.paymentId || '',
      userId: String(openRefundTarget.userId || '21'),
      companyId: String(openRefundTarget.companyId),
      requestedAmount: roundMoney(openRefundTarget.totalPrice),
      approvedAmount: 0,
      currency: 'EGP',
      reasonCategory: 'date_change',
      reason: 'Cannot travel on the booked date.',
      method: 'instapay',
      destination: { method: 'instapay', walletNumber: '01012345678', instapayIpa: '' },
      status: 'requested',
      createdAt: new Date('2026-09-01'),
    });
    openRefundTarget.refundStatus = 'requested';
  }
  if (refundTarget) {
    const split = bookingSplit(refundTarget);
    refundDocs.push({
      _id: 'RF-0002',
      bookingId: refundTarget._id,
      paymentId: refundTarget.paymentId || '',
      userId: String(refundTarget.userId || '22'),
      companyId: String(refundTarget.companyId),
      requestedAmount: split.collected,
      approvedAmount: split.collected,
      currency: 'EGP',
      reasonCategory: 'cancellation',
      reason: 'Trip cancelled after payout.',
      method: 'vodafone_cash',
      destination: { method: 'mobile_wallet', walletNumber: '01098765432' },
      status: 'refunded',
      platformFeeRefunded: split.platformFee,
      companyClawback: split.payableToCompany,
      clawbackPayoutId: '',
      reference: 'RF-0002-TRF',
      proof: { url: '/user.png', name: 'refund-proof.png', mime: 'image/png', size: 11000 },
      reviewedBy: 'a1',
      reviewNote: 'Approved full refund.',
      creditNoteNumber: 'CRN-0001',
      reviewedAt: new Date('2026-09-05'),
      refundedAt: new Date('2026-09-06'),
      createdAt: new Date('2026-09-04'),
    });
    refundTarget.refundStatus = 'refunded';
    refundTarget.refundedAmount = split.collected;
    refundTarget.status = 'refunded';
    pushLedger({
      type: 'refund',
      direction: 'out',
      amount: split.collected,
      companyId: String(refundTarget.companyId),
      bookingId: refundTarget._id,
      refId: 'RF-0002',
      note: 'Refund RF-0002',
      occurredAt: new Date('2026-09-06'),
    });
    pushLedger({
      type: 'clawback',
      direction: 'in',
      amount: split.payableToCompany,
      companyId: String(refundTarget.companyId),
      bookingId: refundTarget._id,
      refId: 'RF-0002',
      note: 'Company clawback on RF-0002',
      occurredAt: new Date('2026-09-06'),
    });
    if (split.platformFee) {
      pushLedger({
        type: 'adjustment',
        direction: 'out',
        amount: split.platformFee,
        companyId: String(refundTarget.companyId),
        bookingId: refundTarget._id,
        refId: 'RF-0002',
        note: 'Platform fee reversed on RF-0002',
        occurredAt: new Date('2026-09-06'),
      });
    }
  }

  await upsert(Booking, allBookingDocs);
  await upsert(Payout, payoutDocs);
  await upsert(Refund, refundDocs);
  await upsert(LedgerEntry, ledgerDocs);

  function mapMessages(replies, fallback) {
    return (replies || []).map((reply) => ({
      from: reply.from,
      author: reply.author,
      text: reply.text,
      attachments: reply.attachments || [],
      createdAt: parseReplyDate(reply, fallback),
    }));
  }

  const travelerTicketDocs = travelerTickets.map((ticket) => {
    const createdAt = parseLooseDate(ticket.createdAt, new Date('2026-08-26'));
    const updatedAt = parseLooseDate(ticket.updatedAt, createdAt);
    return {
      _id: `traveler-${ticket.id}`,
      ticketNo: ticket.ticketNo,
      source: 'traveler',
      userId: ticket.userId || null,
      companyId: null,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority || 'normal',
      unread: ticket.unread || 0,
      lastReply: ticket.lastReply,
      lastFrom: ticket.lastFrom,
      messages: mapMessages(travelerReplies[ticket.id], createdAt),
      createdAt,
      updatedAt,
    };
  });

  const companyTicketDocs = companyTickets.map((ticket) => {
    const createdAt = parseLooseDate(ticket.createdAt, new Date('2026-08-26'));
    const updatedAt = parseLooseDate(ticket.updatedAt, createdAt);
    return {
      _id: `company-${ticket.id}`,
      ticketNo: ticket.ticketNo,
      source: 'company',
      userId: null,
      companyId: String(ticket.companyId),
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority || 'normal',
      unread: ticket.unread || 0,
      lastReply: ticket.lastReply,
      lastFrom: ticket.lastFrom,
      messages: mapMessages(companyReplies[ticket.id], createdAt),
      createdAt,
      updatedAt,
    };
  });

  await upsert(Ticket, [...travelerTicketDocs, ...companyTicketDocs]);

  await upsert(Review, reviews.map((review) => {
    const match = [...catalogDocs, ...companyDocs].find((trip) => trip.title === review.tripTitle);
    return {
      _id: String(review.id),
      name: review.name,
      message: review.message,
      avatar: review.avatar,
      companyId: String(review.companyId),
      tripId: match?._id || null,
      tripTitle: review.tripTitle,
      rating: review.rating,
      status: review.status,
      createdAt: parseLooseDate(review.createdAt),
    };
  }));

  await upsert(Conversation, companyChats.map((chat) => ({
    _id: `chat-${chat.companyId}-${chat.id}`,
    companyId: String(chat.companyId),
    customerName: chat.customerName,
    customerEmail: chat.customerEmail,
    subject: chat.subject,
    unread: chat.unread || 0,
    lastReply: chat.lastReply,
    lastFrom: chat.lastFrom,
    messages: mapMessages(repliesByChat[chat.id], parseLooseDate(chat.updatedAt, new Date('2026-08-26'))),
    updatedAt: parseLooseDate(chat.updatedAt, new Date('2026-08-26')),
  })));

  await upsert(AuditLog, auditLog.map((entry) => {
    const { id, ...rest } = entry;
    return {
      ...rest,
      _id: String(id),
      at: parseLooseDate(entry.at),
    };
  }));

  await primeCounter('booking', 40);
  await primeCounter('payment', paymentDocs.length);
  await primeCounter('payout', payoutDocs.length);
  await primeCounter('refund', refundDocs.length);
  await primeCounter('ledger', ledgerDocs.length);
  await primeCounter('invoice', 0);
  await primeCounter('statement', payoutDocs.length);
  await primeCounter('credit-note', refundDocs.some((item) => item.creditNoteNumber) ? 1 : 0);
  await primeCounter('ticket-tkt', 1043);
  await primeCounter('ticket-cmp', 1048);
  await primeCounter('ticket-traveler', travelerTickets.length);
  await primeCounter('ticket-company', companyTickets.length);
  await primeCounter('company', companies.length);

  await Promise.all([
    User.syncIndexes(),
    Company.syncIndexes(),
    Trip.syncIndexes(),
    Booking.syncIndexes(),
    Payment.syncIndexes(),
    Payout.syncIndexes(),
    Refund.syncIndexes(),
    LedgerEntry.syncIndexes(),
    Ticket.syncIndexes(),
    Review.syncIndexes(),
    Conversation.syncIndexes(),
    AuditLog.syncIndexes(),
    PasswordResetToken.syncIndexes(),
  ]);

  const { refreshOperationalStats } = require('../services/companies');
  await refreshOperationalStats();

  console.log('Safarny MongoDB seed complete.');
}

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset') || args.includes('reset');
  const all = args.includes('--all');
  try {
    await seed({ reset, all });
  } finally {
    await disconnectDb();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { seed };
