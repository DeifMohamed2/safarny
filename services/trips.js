const { Trip } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { parseMediaList } = require('../lib/trip-media');
const {
  normalizeTripPayload,
  ensureTripDefaults,
  travelDatesForDisplay,
  occupancyOf,
  occupancyForType,
  maxGuestsForDate,
  maxRoomsForDate,
  enabledRoomTypes,
  leftoverSpotsForDate,
  lowestTripPrice,
  priceForRoomType,
  defaultRoomTypeId,
} = require('../lib/trip-form-helpers');
const { toPublicTrip } = require('../presenters/trip');
const { paginateSimple } = require('../lib/paginate');
const companyService = require('./companies');

const localImages = [
  '/assets/trip/trip.jpg',
  '/assets/trip/card1.jpg',
  '/assets/trip/card2.jpg',
  '/assets/trip/card3.jpg',
  '/assets/trip/card4.jpg',
];

const PUBLIC_STATUSES = ['active', 'sold-out'];

async function listTrips(filter = {}) {
  return toDocs(await Trip.find(filter).lean());
}

async function getTripById(id) {
  if (!id) return null;
  return toDoc(await Trip.findById(String(id)).lean());
}

async function companyMap() {
  const companies = await companyService.listCompanies();
  return Object.fromEntries(companies.map((company) => [String(company.id), company]));
}

function presentPublic(trip, companies) {
  return toPublicTrip(trip, companies?.[String(trip.companyId)]);
}

async function getPublicTripById(id) {
  const trip = await getTripById(id);
  if (!trip || !PUBLIC_STATUSES.includes(trip.status)) return null;
  const company = await companyService.getCompanyById(trip.companyId);
  return toPublicTrip(trip, company);
}

async function catalog() {
  const [trips, companies] = await Promise.all([
    listTrips({ status: { $in: PUBLIC_STATUSES } }),
    companyMap(),
  ]);
  return trips.map((trip) => presentPublic(trip, companies));
}

function text(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function truthyFlag(value) {
  const raw = String(value || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || value === true;
}

function parseAmount(value) {
  const amount = Number(String(value || '').replace(/[^\d.]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function parseDay(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const iso = raw.length >= 10 ? raw.slice(0, 10) : raw;
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function tripDateEntries(trip) {
  if (Array.isArray(trip.travelDates) && trip.travelDates.length) return trip.travelDates;
  if (trip.startDate) {
    return [
      {
        startDate: trip.startDate,
        endDate: trip.endDate || trip.startDate,
        availableSpots: trip.availableSpots ?? trip.availableSeats,
      },
    ];
  }
  return [];
}

function matchesDuration(days, duration) {
  if (!duration) return true;
  const length = Number(days) || 0;
  if (duration === '3-4') return length >= 3 && length <= 4;
  if (duration === '5-7') return length >= 5 && length <= 7;
  if (duration === '8+') return length >= 8;
  return true;
}

function matchesBeds(trip, beds) {
  if (!beds) return true;
  const needed = Number(beds);
  if (!Number.isFinite(needed) || needed <= 0) return true;
  const occupancies = enabledRoomTypes(trip).map((item) => Number(item.occupancy));
  if (occupancies.includes(needed)) return true;
  return Number(trip.beds) === needed;
}

function dateInRange(selected, start, end) {
  const from = Math.min(start.getTime(), end.getTime());
  const to = Math.max(start.getTime(), end.getTime());
  const time = selected.getTime();
  return time >= from && time <= to;
}

function matchingDateEntries(trip, dateValue) {
  const selected = parseDay(dateValue);
  const entries = tripDateEntries(trip);
  if (!selected) return entries;
  return entries.filter((entry) => {
    const start = parseDay(entry.startDate || entry.date);
    if (!start) return false;
    const end = parseDay(entry.endDate) || start;
    return dateInRange(selected, start, end);
  });
}

function matchesPreferredDate(trip, dateValue) {
  const selected = parseDay(dateValue);
  if (!selected) return true;
  const entries = tripDateEntries(trip);
  const dated = entries.filter((entry) => parseDay(entry.startDate || entry.date));
  if (!dated.length) return true;
  if (matchingDateEntries(trip, dateValue).length) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasUpcoming = dated.some((entry) => {
    const end = parseDay(entry.endDate) || parseDay(entry.startDate || entry.date);
    return end && end.getTime() >= today.getTime();
  });
  return !hasUpcoming;
}

function matchesGuests(trip, guests, dateValue) {
  const needed = Number(guests);
  if (!Number.isFinite(needed) || needed <= 0) return true;
  const openSeats = Number(trip.availableSpots ?? trip.availableSeats ?? 0);
  if (!parseDay(dateValue)) return openSeats >= needed;
  const dated = matchingDateEntries(trip, dateValue);
  if (!dated.length) return openSeats >= needed;
  return dated.some((entry) => leftoverSpotsForDate(trip, entry) >= needed);
}

function matchesDestination(trip, destination) {
  const needle = text(destination);
  if (!needle) return true;
  const dest = text(trip.destination);
  const loc = text(trip.location);
  return dest === needle || dest.includes(needle) || loc.includes(needle) || needle.includes(dest);
}

function matchesQuery(trip, q) {
  const query = text(q);
  if (!query) return true;
  const haystack = [trip.title, trip.titleAr, trip.location, trip.category, trip.destination, trip.about, trip.description]
    .map(text)
    .join(' ');
  return haystack.includes(query);
}

async function filterTrips(filters = {}) {
  const {
    q,
    destination,
    type,
    tripType,
    offersOnly,
    date,
    guests,
    beds,
    priceFrom,
    priceTo,
    duration,
  } = filters;
  const effectiveType = text(type || tripType);
  const dest = text(destination);
  const query = text(q);
  const queryIsDestination = Boolean(dest && query && dest === query);
  const minPrice = parseAmount(priceFrom);
  const maxPrice = parseAmount(priceTo);
  const all = await catalog();
  return all.filter((trip) => {
    if (truthyFlag(offersOnly) && !trip.offer) return false;
    if (effectiveType === 'umrah' && trip.type !== 'umrah') return false;
    if (effectiveType === 'leisure' && trip.type === 'umrah') return false;
    if (!matchesDestination(trip, destination)) return false;
    if (!queryIsDestination && !matchesQuery(trip, q)) return false;
    if (!matchesGuests(trip, guests, date)) return false;
    if (!matchesBeds(trip, beds)) return false;
    const price = lowestTripPrice(trip);
    if (minPrice && price < minPrice) return false;
    if (maxPrice && price > maxPrice) return false;
    if (!matchesDuration(trip.days, duration)) return false;
    if (!matchesPreferredDate(trip, date)) return false;
    return true;
  });
}

function popularDestinations(all) {
  return [...new Set(all.map((trip) => trip.destination))]
    .map((name) => ({
      name,
      count: all.filter((trip) => trip.destination === name).length,
    }))
    .sort((a, b) => b.count - a.count);
}

function mapDeal(trip) {
  return {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    location: trip.location,
    price: trip.price,
    image: trip.image,
    offer: Boolean(trip.offer),
    category: trip.category,
  };
}

async function suggestTrips(q, limit = 6, extraFilters = {}) {
  const all = await catalog();
  const query = String(q || '').trim();
  const scopedFilters = { ...extraFilters, q: undefined, destination: extraFilters.destination };
  const scoped = await filterTrips(scopedFilters);
  const destSource = scoped.length ? scoped : all;

  if (!query) {
    const deals = scoped.filter((trip) => trip.offer).slice(0, limit);
    const featured = deals.length ? deals : scoped.slice(0, limit);
    return {
      popular: true,
      destinations: popularDestinations(destSource).slice(0, 6),
      deals: featured.map(mapDeal),
    };
  }

  const needle = query.toLowerCase();
  const destinations = popularDestinations(destSource)
    .filter((item) => item.name.toLowerCase().includes(needle))
    .slice(0, 6);
  const deals = (await filterTrips({ ...extraFilters, q: query })).slice(0, limit).map(mapDeal);
  return { popular: false, destinations, deals };
}

function filterTripsByCompany(items, companyId, filters = {}) {
  const status = String(filters.status || 'all');
  const q = String(filters.q || '').trim().toLowerCase();
  const destination = String(filters.destination || 'all');
  const type = String(filters.type || 'all');
  const offer = String(filters.offer || 'all');
  const availability = String(filters.availability || 'all');
  const sort = String(filters.sort || 'newest');
  const priceMin = filters.priceMin !== undefined && filters.priceMin !== '' ? Number(filters.priceMin) : null;
  const priceMax = filters.priceMax !== undefined && filters.priceMax !== '' ? Number(filters.priceMax) : null;

  let next = items.filter((trip) => String(trip.companyId) === String(companyId));
  if (status !== 'all') next = next.filter((trip) => trip.status === status);
  if (destination !== 'all') next = next.filter((trip) => trip.destination === destination);
  if (type !== 'all') next = next.filter((trip) => trip.type === type);
  if (offer === 'yes') next = next.filter((trip) => trip.offer);
  if (offer === 'no') next = next.filter((trip) => !trip.offer);
  if (availability === 'available') next = next.filter((trip) => trip.availableSeats > 0);
  if (availability === 'low') {
    next = next.filter((trip) => trip.totalSeats > 0 && trip.availableSeats > 0 && trip.availableSeats / trip.totalSeats <= 0.25);
  }
  if (availability === 'sold-out') next = next.filter((trip) => trip.availableSeats <= 0);
  if (Number.isFinite(priceMin)) next = next.filter((trip) => Number(trip.price) >= priceMin);
  if (Number.isFinite(priceMax)) next = next.filter((trip) => Number(trip.price) <= priceMax);
  if (q) {
    next = next.filter((trip) => {
      const haystack = `${trip.title} ${trip.titleAr || ''} ${trip.destination} ${trip.category}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    'price-asc': (a, b) => Number(a.price) - Number(b.price),
    'price-desc': (a, b) => Number(b.price) - Number(a.price),
    'seats-desc': (a, b) => Number(b.availableSeats) - Number(a.availableSeats),
    'seats-asc': (a, b) => Number(a.availableSeats) - Number(b.availableSeats),
    name: (a, b) => String(a.title).localeCompare(String(b.title)),
    date: (a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0),
  };
  next.sort(sorters[sort] || sorters.newest);
  return next;
}

async function getTripsByCompany(companyId, filters = {}) {
  const items = await listTrips({ companyId: String(companyId) });
  return filterTripsByCompany(items, companyId, filters);
}

async function getTripListMeta(companyId) {
  const items = await listTrips({ companyId: String(companyId) });
  const statusCounts = { all: items.length, active: 0, pending: 0, draft: 0, 'sold-out': 0, rejected: 0 };
  items.forEach((trip) => {
    if (statusCounts[trip.status] !== undefined) statusCounts[trip.status] += 1;
  });
  return {
    total: items.length,
    statusCounts,
    destinations: [...new Set(items.map((trip) => trip.destination))].sort(),
    categories: [...new Set(items.map((trip) => trip.category))].sort(),
    priceRange: {
      min: items.length ? Math.min(...items.map((trip) => Number(trip.price) || 0)) : 0,
      max: items.length ? Math.max(...items.map((trip) => Number(trip.price) || 0)) : 0,
    },
  };
}

function enrichTripForList(trip, bookings = []) {
  const bookingCount = bookings.filter((item) => item.tripId === trip.id).length;
  const totalSeats = Number(trip.totalSeats) || 0;
  const availableSeats = Number(trip.availableSeats) || 0;
  const bookedSeats = Math.max(0, totalSeats - availableSeats);
  const fillRate = totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0;
  return {
    ...trip,
    bookingCount,
    bookedSeats,
    fillRate,
    isLowStock: totalSeats > 0 && availableSeats > 0 && availableSeats / totalSeats <= 0.25,
    isSoldOut: availableSeats <= 0,
  };
}

async function getCompanyTrip(id, companyId) {
  const trip = await getTripById(id);
  if (!trip || String(trip.companyId) !== String(companyId)) return null;
  return trip;
}

function buildTripDoc(companyId, payload, existing = null) {
  const normalized = normalizeTripPayload({ ...(existing || {}), ...payload });
  const images = parseMediaList(normalized.images, existing?.images || []);
  const videos = parseMediaList(normalized.videos, existing?.videos || []);
  return {
    companyId: String(companyId),
    title: normalized.title,
    titleAr: normalized.titleAr || '',
    destination: normalized.destination,
    location: `${normalized.destination}, ${normalized.type === 'umrah' ? 'Saudi Arabia' : 'Egypt'}`,
    category: normalized.type === 'umrah'
      ? (normalized.category && normalized.category !== 'Leisure' ? normalized.category : 'Umrah Package')
      : (normalized.category || 'Leisure'),
    type: normalized.type === 'umrah' ? 'umrah' : 'leisure',
    description: normalized.description || '',
    descriptionAr: normalized.descriptionAr || '',
    about: normalized.description || '',
    price: Number(normalized.price) || 0,
    totalSeats: Number(normalized.totalSeats) || 0,
    availableSeats: Number(normalized.availableSeats || normalized.totalSeats) || 0,
    startDate: normalized.startDate || '',
    endDate: normalized.endDate || '',
    days: Number(normalized.days) || 1,
    nights: Number(normalized.nights) || 0,
    beds: Number(normalized.beds) || 2,
    priceMode: normalized.priceMode === 'per-date' ? 'per-date' : 'shared',
    roomTypes: normalized.roomTypes || [],
    schedule: normalized.schedule || 'daily',
    includedServices: normalized.includedServices || '',
    includedList: normalized.includedList || [],
    itinerary: normalized.itinerary || [],
    travelDates: normalized.travelDates || [],
    cancellationPolicy: normalized.cancellationPolicy || '',
    images: images.length ? images : existing?.images?.length ? existing.images : [localImages[0]],
    videos,
    status: normalized.status || existing?.status || 'draft',
    offer: 'offer' in payload ? payload.offer === 'on' || payload.offer === true : Boolean(existing?.offer),
    markupType: payload.markupType || existing?.markupType || 'inherit',
    markupPercent: Number(payload.markupPercent ?? existing?.markupPercent) || 0,
    markupFixed: Number(payload.markupFixed ?? existing?.markupFixed) || 0,
  };
}

async function createCompanyTrip(companyId, payload) {
  const id = `ct-${Date.now()}`;
  const data = buildTripDoc(companyId, payload);
  const created = await Trip.create({ _id: id, ...data });
  return toDoc(created);
}

async function updateCompanyTrip(id, companyId, payload) {
  const trip = await getCompanyTrip(id, companyId);
  if (!trip) return null;
  const data = buildTripDoc(companyId, payload, trip);
  const updated = await Trip.findByIdAndUpdate(String(id), { $set: data }, { new: true }).lean();
  return toDoc(updated);
}

async function deleteCompanyTrip(id, companyId) {
  const result = await Trip.deleteOne({ _id: String(id), companyId: String(companyId) });
  return result.deletedCount > 0;
}

async function listPublishedPublicTrips(companyId) {
  const filter = { status: { $in: PUBLIC_STATUSES } };
  if (companyId) filter.companyId = String(companyId);
  const trips = toDocs(await Trip.find(filter).lean());
  const companies = await companyMap();
  return trips.map((trip) => presentPublic(trip, companies));
}

async function getAllTrips(filters = {}) {
  const status = String(filters.status || 'all');
  const q = String(filters.q || '').trim().toLowerCase();
  const companyId = String(filters.companyId || 'all');
  const type = String(filters.type || 'all');
  const query = {};
  if (status !== 'all') query.status = status;
  if (companyId !== 'all') query.companyId = companyId;
  if (type !== 'all') query.type = type;
  let items = toDocs(await Trip.find(query).sort({ createdAt: -1 }).lean());
  if (q) {
    items = items.filter((trip) => {
      const haystack = `${trip.title} ${trip.destination} ${trip.category}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  return items;
}

async function getPendingTrips() {
  return toDocs(await Trip.find({ status: 'pending' }).lean());
}

async function countPendingTrips() {
  return Trip.countDocuments({ status: 'pending' });
}

async function approveTrip(id) {
  const updated = await Trip.findByIdAndUpdate(
    String(id),
    { $set: { status: 'active' }, $unset: { rejectionReason: 1 } },
    { new: true }
  ).lean();
  return toDoc(updated);
}

async function rejectTrip(id, reason) {
  const updated = await Trip.findByIdAndUpdate(
    String(id),
    { $set: { status: 'rejected', rejectionReason: String(reason || 'Rejected by admin.') } },
    { new: true }
  ).lean();
  return toDoc(updated);
}

async function setTripFeatured(id, featured) {
  const updated = await Trip.findByIdAndUpdate(String(id), { $set: { featured: Boolean(featured) } }, { new: true }).lean();
  return toDoc(updated);
}

async function adminDeleteTrip(id) {
  const result = await Trip.deleteOne({ _id: String(id) });
  return result.deletedCount > 0;
}

async function bulkApproveTrips(ids = []) {
  const results = [];
  for (const id of ids) {
    const trip = await approveTrip(id);
    if (trip) results.push(trip);
  }
  return results;
}

async function adminCreateTrip(companyId, payload) {
  return createCompanyTrip(companyId, payload);
}

async function adminUpdateTrip(id, payload) {
  const trip = await getTripById(id);
  if (!trip) return null;
  return updateCompanyTrip(id, trip.companyId, payload);
}

function resolveTripDates(trip, locale = 'en') {
  const types = enabledRoomTypes(trip);
  const enrich = (entry) => {
    const rooms = (entry.rooms || types).map((item) => ({
      ...item,
      price: priceForRoomType(trip, entry, item.type),
      maxRooms: maxRoomsForDate(trip, entry, item.type),
    }));
    return {
      ...entry,
      occupancy: occupancyOf(trip),
      maxGuests: leftoverSpotsForDate(trip, entry),
      maxRooms: maxRoomsForDate(trip, entry),
      rooms,
      defaultRoomType: defaultRoomTypeId(trip, entry),
    };
  };
  const custom = travelDatesForDisplay(trip, locale);
  if (custom.length) return custom.map(enrich);
  return [
    enrich({
      id: 'td-fallback',
      date: trip.startDate || 'Upcoming',
      startDate: trip.startDate || '',
      endDate: trip.endDate || trip.startDate || '',
      availableSpots: Number(trip.availableSeats) || 0,
      days: trip.days || 1,
      nights: trip.nights || 0,
      rooms: types,
    }),
  ];
}

async function decrementSeats(tripId, dateId, seats, options = {}) {
  const qty = Number(seats) || 1;
  const roomType = String(options.roomType || '').toLowerCase();
  const rooms = Math.max(0, Number(options.rooms) || 0);

  if (roomType && rooms > 0) {
    const occupancy = occupancyForType(roomType);
    const guestQty = qty > 0 ? qty : rooms * occupancy;
    const filter = dateId
      ? {
          _id: String(tripId),
          travelDates: {
            $elemMatch: {
              id: dateId,
              rooms: { $elemMatch: { type: roomType, availableRooms: { $gte: rooms } } },
            },
          },
        }
      : { _id: String(tripId), availableSeats: { $gte: guestQty } };
    const update = dateId
      ? {
          $inc: {
            'travelDates.$[d].rooms.$[r].availableRooms': -rooms,
            'travelDates.$[d].availableSpots': -guestQty,
            availableSeats: -guestQty,
          },
        }
      : { $inc: { availableSeats: -guestQty } };
    const queryOptions = dateId
      ? { new: true, arrayFilters: [{ 'd.id': dateId }, { 'r.type': roomType }] }
      : { new: true };
    const trip = await Trip.findOneAndUpdate(filter, update, queryOptions).lean();
    if (!trip) return null;
    if ((trip.availableSeats || 0) <= 0 && trip.status === 'active') {
      await Trip.updateOne({ _id: trip._id, status: 'active' }, { $set: { status: 'sold-out' } });
      trip.status = 'sold-out';
    }
    return toDoc(trip);
  }

  const filter = dateId
    ? { _id: String(tripId), travelDates: { $elemMatch: { id: dateId, availableSpots: { $gte: qty } } } }
    : { _id: String(tripId), availableSeats: { $gte: qty } };
  const update = dateId
    ? { $inc: { 'travelDates.$.availableSpots': -qty, availableSeats: -qty } }
    : { $inc: { availableSeats: -qty } };
  const trip = await Trip.findOneAndUpdate(filter, update, { new: true }).lean();
  if (!trip) return null;
  if ((trip.availableSeats || 0) <= 0 && trip.status === 'active') {
    await Trip.updateOne({ _id: trip._id, status: 'active' }, { $set: { status: 'sold-out' } });
    trip.status = 'sold-out';
  }
  return toDoc(trip);
}

async function incrementSeats(tripId, dateId, seats, options = {}) {
  const qty = Number(seats) || 1;
  const roomType = String(options.roomType || '').toLowerCase();
  const rooms = Math.max(0, Number(options.rooms) || 0);

  if (roomType && rooms > 0) {
    const occupancy = occupancyForType(roomType);
    const guestQty = qty > 0 ? qty : rooms * occupancy;
    const filter = dateId
      ? { _id: String(tripId), travelDates: { $elemMatch: { id: dateId } } }
      : { _id: String(tripId) };
    const update = dateId
      ? {
          $inc: {
            'travelDates.$[d].rooms.$[r].availableRooms': rooms,
            'travelDates.$[d].availableSpots': guestQty,
            availableSeats: guestQty,
          },
        }
      : { $inc: { availableSeats: guestQty } };
    const queryOptions = dateId
      ? { new: true, arrayFilters: [{ 'd.id': dateId }, { 'r.type': roomType }] }
      : { new: true };
    const trip = await Trip.findOneAndUpdate(filter, update, queryOptions).lean();
    if (trip && trip.status === 'sold-out' && (trip.availableSeats || 0) > 0) {
      await Trip.updateOne({ _id: trip._id, status: 'sold-out' }, { $set: { status: 'active' } });
    }
    return toDoc(trip);
  }

  const filter = dateId
    ? { _id: String(tripId), travelDates: { $elemMatch: { id: dateId } } }
    : { _id: String(tripId) };
  const update = dateId
    ? { $inc: { 'travelDates.$.availableSpots': qty, availableSeats: qty } }
    : { $inc: { availableSeats: qty } };
  const trip = await Trip.findOneAndUpdate(filter, update, { new: true }).lean();
  if (trip && trip.status === 'sold-out' && (trip.availableSeats || 0) > 0) {
    await Trip.updateOne({ _id: trip._id, status: 'sold-out' }, { $set: { status: 'active' } });
  }
  return toDoc(trip);
}

module.exports = {
  listTrips,
  catalog,
  getTripById,
  getPublicTripById,
  filterTrips,
  suggestTrips,
  paginate: paginateSimple,
  getTripsByCompany,
  filterTripsByCompany,
  getTripListMeta,
  enrichTripForList,
  getCompanyTrip,
  createCompanyTrip,
  updateCompanyTrip,
  deleteCompanyTrip,
  toPublicTrip,
  listPublishedPublicTrips,
  getAllTrips,
  getPendingTrips,
  countPendingTrips,
  approveTrip,
  rejectTrip,
  setTripFeatured,
  adminDeleteTrip,
  bulkApproveTrips,
  adminCreateTrip,
  adminUpdateTrip,
  ensureTripDefaults,
  getTripTravelDates: (trip, locale) => travelDatesForDisplay(ensureTripDefaults(trip), locale),
  resolveTripDates,
  decrementSeats,
  incrementSeats,
};
