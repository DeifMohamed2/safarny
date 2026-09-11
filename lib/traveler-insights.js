const { normalizeStatus } = require('./status');
const { getBookingsForUser } = require('../services/bookings');
const { getTravelerProfile } = require('../services/users');
const { listReviews } = require('../services/reviews');
const { getTicketsByUser } = require('../services/tickets');
const { getTripById } = require('../services/trips');
const { getCompanyById } = require('../services/companies');
const { toPublicTrip } = require('../presenters/trip');

async function getTicketsForUser(userId) {
  return getTicketsByUser(userId);
}

async function getReviewsForUser(user) {
  if (!user) return [];
  const name = String(user.userName || '').toLowerCase();
  const reviews = await listReviews();
  return reviews.filter((review) => String(review.name || '').toLowerCase() === name);
}

async function resolveFavoriteTrips(favoriteTripIds = []) {
  const trips = await Promise.all(favoriteTripIds.map((id) => getTripById(id)));
  const companies = await Promise.all(
    [...new Set(trips.filter(Boolean).map((trip) => String(trip.companyId)))].map((id) => getCompanyById(id))
  );
  const companyById = Object.fromEntries(companies.filter(Boolean).map((company) => [String(company.id), company]));
  return trips.filter(Boolean).map((trip) => {
    const pub = toPublicTrip(trip, companyById[String(trip.companyId)]);
    return {
      id: pub.id,
      title: pub.title,
      destination: pub.destination,
      image: pub.image || pub.gallery?.[0] || '/assets/trip/trip.jpg',
      price: pub.price,
    };
  });
}

async function summarizeTraveler(user) {
  const profile = await getTravelerProfile(user.id);
  const bookings = await getBookingsForUser(user);
  const ticketsList = await getTicketsForUser(user.id);
  const reviewsList = await getReviewsForUser(user);
  const totalSpent = bookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);
  const confirmed = bookings.filter((b) => normalizeStatus(b.status) === 'confirmed').length;

  return {
    ...user,
    bookingCount: bookings.length,
    confirmedBookings: confirmed,
    totalSpent,
    favoriteCount: (profile.favoriteTripIds || []).length,
    ticketCount: ticketsList.length,
    reviewCount: reviewsList.length,
    lastActiveAt: profile.lastActiveAt || user.createdAt,
  };
}

async function buildTravelerProfile(user) {
  const profile = await getTravelerProfile(user.id);
  const bookingsRaw = await getBookingsForUser(user);
  const bookings = await Promise.all(bookingsRaw.map(async (booking) => ({
    ...booking,
    company: await getCompanyById(booking.companyId),
  })));
  const ticketsList = await getTicketsForUser(user.id);
  const reviewsList = await getReviewsForUser(user);
  const favorites = await resolveFavoriteTrips(profile.favoriteTripIds);
  const totalSpent = bookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);
  const confirmedBookings = bookings.filter((b) => normalizeStatus(b.status) === 'confirmed');
  const cancelledBookings = bookings.filter((b) => normalizeStatus(b.status) === 'cancelled');

  return {
    user,
    profile,
    stats: {
      bookings: bookings.length,
      confirmed: confirmedBookings.length,
      cancelled: cancelledBookings.length,
      totalSpent,
      favorites: favorites.length,
      tickets: ticketsList.length,
      reviews: reviewsList.length,
      avgBookingValue: bookings.length ? Math.round(totalSpent / bookings.length) : 0,
    },
    bookings,
    favorites,
    tickets: ticketsList,
    reviews: reviewsList,
    activity: [...(profile.activity || [])].sort((a, b) => new Date(b.at) - new Date(a.at)),
  };
}

function getTravelerListStats(travelers = []) {
  const active = travelers.filter((t) => (t.status || 'active') === 'active').length;
  const suspended = travelers.filter((t) => t.status === 'suspended').length;
  const totalBookings = travelers.reduce((sum, t) => sum + (t.bookingCount || 0), 0);
  const totalSpent = travelers.reduce((sum, t) => sum + (t.totalSpent || 0), 0);
  return { total: travelers.length, active, suspended, totalBookings, totalSpent };
}

function getAdminListStats(admins = []) {
  return {
    total: admins.length,
    active: admins.filter((a) => (a.status || 'active') === 'active').length,
  };
}

module.exports = {
  getBookingsForUser,
  getTicketsForUser,
  getReviewsForUser,
  summarizeTraveler,
  buildTravelerProfile,
  getTravelerListStats,
  getAdminListStats,
};
