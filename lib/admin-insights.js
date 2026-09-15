const { Booking, Trip } = require('../models');
const { toDocs } = require('../lib/document');
const { normalizeStatus } = require('../lib/status');
const { sumBookingSplits } = require('./money');
const { getCompanyById, listCompanies, ensureCompanyDefaults, filterCompaniesAdmin } = require('../services/companies');

function confirmedBookings(bookings) {
  return bookings.filter((b) => normalizeStatus(b.status) === 'confirmed');
}

function calcProfit(bookings, commissionRate) {
  const totals = sumBookingSplits(Array.isArray(bookings) ? bookings : []);
  return {
    revenue: totals.collected,
    platformProfit: totals.platformFee,
    companyProfit: totals.payableToCompany,
    commissionRate: Number(commissionRate) || 0,
  };
}

async function getBookingsForTrip(tripId) {
  return toDocs(await Booking.find({ tripId: String(tripId) }).lean());
}

async function getTripInsights(tripId) {
  const trip = toDocs(await Trip.find({ _id: String(tripId) }).lean())[0];
  if (!trip) return null;
  const company = await getCompanyById(trip.companyId);
  const bookings = await getBookingsForTrip(tripId);
  const confirmed = confirmedBookings(bookings);
  const profit = calcProfit(confirmed, company?.commissionRate);
  const revenue = profit.revenue;
  const totalSeats = Number(trip.totalSeats) || 0;
  const bookedSeats = confirmed.reduce((s, b) => s + Number(b.seats || 0), 0);
  const fillRate = totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  return {
    trip,
    company,
    bookings,
    customers: bookings.map((b) => ({
      id: b.id,
      name: b.customerName,
      email: b.customerEmail,
      phone: b.customerPhone,
      seats: b.seats,
      amount: b.totalPrice,
      status: b.status,
      bookingDate: b.bookingDate,
      tripDate: b.tripDate,
    })),
    stats: {
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      pendingBookings: bookings.filter((b) => normalizeStatus(b.status) === 'pending').length,
      cancelledBookings: bookings.filter((b) => normalizeStatus(b.status) === 'cancelled').length,
      revenue,
      ...profit,
      bookedSeats,
      fillRate,
      avgBookingValue: confirmed.length ? Math.round(revenue / confirmed.length) : 0,
    },
  };
}

async function enrichTripForAdmin(trip, bookingsAll = null, companiesById = null) {
  const company = companiesById
    ? companiesById.get(String(trip.companyId))
    : await getCompanyById(trip.companyId);
  const bookings = bookingsAll
    ? bookingsAll.filter((b) => b.tripId === trip.id)
    : await getBookingsForTrip(trip.id);
  const confirmed = confirmedBookings(bookings);
  const profit = calcProfit(confirmed, company?.commissionRate);
  const totalSeats = Number(trip.totalSeats) || 0;
  const bookedSeats = confirmed.reduce((s, b) => s + Number(b.seats || 0), 0);

  return {
    ...trip,
    companyName: company?.title || `Company ${trip.companyId}`,
    bookingCount: bookings.length,
    confirmedCount: confirmed.length,
    revenue: profit.revenue,
    platformProfit: profit.platformProfit,
    fillRate: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0,
  };
}

async function enrichCompanyForAdmin(company, tripsAll = null, bookingsAll = null) {
  const c = ensureCompanyDefaults(company);
  const trips = tripsAll
    ? tripsAll.filter((t) => String(t.companyId) === String(c.id))
    : toDocs(await Trip.find({ companyId: String(c.id) }).lean());
  const bookings = bookingsAll
    ? bookingsAll.filter((b) => String(b.companyId) === String(c.id))
    : toDocs(await Booking.find({ companyId: String(c.id) }).lean());
  const confirmed = confirmedBookings(bookings);
  const profit = calcProfit(confirmed, c.commissionRate);
  const activeTrips = trips.filter((t) => t.status === 'active').length;
  const reviewCount = Number(c.reviewCount ?? c.reviews) || 0;

  return {
    ...c,
    tripCount: trips.length,
    activeTrips,
    packages: trips.length,
    bookingCount: bookings.length,
    confirmedBookings: confirmed.length,
    revenue: profit.revenue,
    platformProfit: profit.platformProfit,
    companyShare: profit.companyProfit,
    reviewCount,
    rating: reviewCount ? Number(c.rating) || 0 : 0,
    activityScore: activeTrips * 3 + confirmed.length + trips.length,
  };
}

async function getCompanyLeaderboard(limit = 5) {
  const [companies, trips, bookings] = await Promise.all([
    listCompanies(),
    toDocs(await Trip.find().lean()),
    toDocs(await Booking.find().lean()),
  ]);
  const enriched = await Promise.all(companies.map((c) => enrichCompanyForAdmin(c, trips, bookings)));
  return enriched
    .sort((a, b) => b.activityScore - a.activityScore || b.revenue - a.revenue)
    .slice(0, limit)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

async function getTopTripsByBookings(limit = 5) {
  const [trips, bookings, companies] = await Promise.all([
    toDocs(await Trip.find().lean()),
    toDocs(await Booking.find().lean()),
    listCompanies(),
  ]);
  const companiesById = new Map(companies.map((c) => [String(c.id), c]));
  const enriched = await Promise.all(trips.map((t) => enrichTripForAdmin(t, bookings, companiesById)));
  return enriched
    .sort((a, b) => b.bookingCount - a.bookingCount || b.revenue - a.revenue)
    .slice(0, limit)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

async function getAllCompaniesEnriched(filters = {}) {
  const [companies, trips, bookings] = await Promise.all([
    filterCompaniesAdmin(filters),
    toDocs(await Trip.find().lean()),
    toDocs(await Booking.find().lean()),
  ]);
  return Promise.all(companies.map((c) => enrichCompanyForAdmin(c, trips, bookings)));
}

module.exports = {
  getTripInsights,
  enrichTripForAdmin,
  enrichCompanyForAdmin,
  getCompanyLeaderboard,
  getTopTripsByBookings,
  getAllCompaniesEnriched,
  calcProfit,
};
