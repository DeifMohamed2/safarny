const { Trip, Company } = require('../models');
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
const { normalizeTripType, tripTypeMatches, isSacredTripType, categoryFromTripType, tripTitle } = require('../lib/helpers');
const {
  findDestination,
  canonicalDestination,
  sameDestination,
  searchDestinations,
  destinationLabel,
  countryLabel,
  matchesDestinationRecord,
} = require('../lib/destinations');
const companyService = require('./companies');
const settingsService = require('./settings');

const localImages = [
  '/assets/trip/trip.jpg',
  '/assets/trip/card1.jpg',
  '/assets/trip/card2.jpg',
  '/assets/trip/card3.jpg',
  '/assets/trip/card4.jpg',
];

const PUBLIC_STATUSES = ['active', 'sold-out'];
const CATALOG_TTL_MS = 120_000;
const SUGGEST_TTL_MS = 20_000;

let catalogCache = { value: null, at: 0, inflight: null };
let suggestMemo = new Map();

function invalidateCatalogCache() {
  catalogCache = { value: null, at: 0, inflight: null };
  suggestMemo.clear();
}

function finishSeatUpdate(trip) {
  if (!trip) return null;
  invalidateCatalogCache();
  return toDoc(trip);
}

async function listTrips(filter = {}) {
  return toDocs(await Trip.find(filter).lean());
}

async function getTripById(id) {
  if (!id) return null;
  return toDoc(await Trip.findById(String(id)).lean());
}

async function companyMap() {
  const companies = toDocs(
    await Company.find({}, { markupType: 1, markupPercent: 1, markupFixed: 1, commissionRate: 1 }).lean()
  );
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
  const now = Date.now();
  if (catalogCache.value && now - catalogCache.at < CATALOG_TTL_MS) return catalogCache.value;
  if (catalogCache.inflight) return catalogCache.inflight;
  catalogCache.inflight = (async () => {
    const [trips, companies] = await Promise.all([
      listTrips({ status: { $in: PUBLIC_STATUSES } }),
      companyMap(),
    ]);
    const value = trips.map((trip) => presentPublic(trip, companies));
    catalogCache = { value, at: Date.now(), inflight: null };
    return value;
  })().catch((error) => {
    catalogCache.inflight = null;
    throw error;
  });
  return catalogCache.inflight;
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

function matchesDestination(trip, destination, list = []) {
  const needle = text(destination);
  if (!needle) return true;
  if (sameDestination(trip.destination, destination, list)) return true;
  const dest = text(trip.destination);
  const loc = text(trip.location);
  return dest === needle || dest.includes(needle) || loc.includes(needle) || needle.includes(dest);
}

function matchesQuery(trip, q, list = []) {
  const query = text(q);
  if (!query) return true;
  const haystack = [trip.title, trip.titleAr, trip.location, trip.category, trip.destination, trip.about, trip.description]
    .map(text)
    .join(' ');
  if (haystack.includes(query)) return true;
  const record = findDestination(list, trip.destination);
  return Boolean(record && matchesDestinationRecord(record, q));
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
  const settings = await settingsService.getSettings();
  const list = settings.destinations || [];
  const queryIsDestination = Boolean(dest && query && sameDestination(dest, query, list));
  const minPrice = parseAmount(priceFrom);
  const maxPrice = parseAmount(priceTo);
  const all = await catalog();
  return all.filter((trip) => {
    if (truthyFlag(offersOnly) && !trip.offer) return false;
    if (effectiveType && !tripTypeMatches(trip.type, effectiveType)) return false;
    if (!matchesDestination(trip, destination, list)) return false;
    if (!queryIsDestination && !matchesQuery(trip, q, list)) return false;
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

function popularDestinations(all, list = [], lang = 'en') {
  const counts = new Map();
  all.forEach((trip) => {
    const name = trip.destination;
    if (!name) return;
    const record = findDestination(list, name);
    const key = record ? record.nameEn : name;
    const current = counts.get(key);
    if (current) {
      current.count += 1;
      return;
    }
    counts.set(key, {
      name: key,
      nameEn: record ? record.nameEn : name,
      nameAr: record ? record.nameAr : name,
      label: destinationLabel(name, lang, list),
      count: 1,
    });
  });
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function mapDeal(trip, lang = 'en', list = []) {
  return {
    id: trip.id,
    title: tripTitle(trip, lang),
    titleAr: String(trip.titleAr || '').trim(),
    destination: destinationLabel(trip.destination, lang, list),
    destinationEn: trip.destination,
    destinationAr: destinationLabel(trip.destination, 'ar', list),
    location: trip.location,
    price: trip.price,
    image: trip.image,
    offer: Boolean(trip.offer),
    category: trip.category,
  };
}

async function suggestTrips(q, limit = 6, extraFilters = {}, lang = 'en') {
  const query = String(q || '').trim();
  const tripType = extraFilters.type || extraFilters.tripType;
  const memoKey = `${lang}|${String(tripType || '')}|${query.toLowerCase()}|${limit}|${truthyFlag(extraFilters.offersOnly) ? '1' : '0'}`;
  const memoHit = suggestMemo.get(memoKey);
  if (memoHit && Date.now() - memoHit.at < SUGGEST_TTL_MS) return memoHit.value;
  const [all, settings] = await Promise.all([catalog(), settingsService.getSettings()]);
  const list = settings.destinations || [];
  const scoped = all.filter((trip) => {
    if (tripType && !tripTypeMatches(trip.type, tripType)) return false;
    if (truthyFlag(extraFilters.offersOnly) && !trip.offer) return false;
    return true;
  });
  const tripDests = popularDestinations(scoped, list, lang);

  const mapCatalogHit = (item) => {
    const counted = tripDests.find((row) => sameDestination(row.name, item.nameEn, list));
    return {
      name: item.nameEn,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      label: destinationLabel(item, lang, list),
      count: counted ? counted.count : 0,
    };
  };

  if (!query) {
    const deals = scoped.filter((trip) => trip.offer).slice(0, limit);
    const featured = deals.length ? deals : scoped.slice(0, limit);
    const catalogTop = searchDestinations(list, '', tripType).slice(0, 8).map(mapCatalogHit);
    const merged = [...tripDests, ...catalogTop.filter((item) => !tripDests.some((row) => row.name === item.name))];
    const value = {
      popular: true,
      destinations: merged.slice(0, 8),
      deals: featured.map((trip) => mapDeal(trip, lang, list)),
    };
    suggestMemo.set(memoKey, { at: Date.now(), value });
    return value;
  }

  const needle = query.toLowerCase();
  const catalogHits = searchDestinations(list, query, tripType).slice(0, 8).map(mapCatalogHit);
  const extraTripHits = tripDests.filter((item) => {
    const hay = `${item.nameEn} ${item.nameAr} ${item.label}`.toLowerCase();
    return hay.includes(needle) && !catalogHits.some((row) => row.name === item.name);
  });
  const destinations = [...catalogHits, ...extraTripHits].slice(0, 8);
  const deals = scoped
    .filter((trip) => matchesQuery(trip, query, list))
    .slice(0, limit)
    .map((trip) => mapDeal(trip, lang, list));
  const value = { popular: false, destinations, deals };
  suggestMemo.set(memoKey, { at: Date.now(), value });
  return value;
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
  if (destination !== 'all') next = next.filter((trip) => sameDestination(trip.destination, destination));
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

function resolveTripStatus(payload, existing, actor) {
  const requested = String(payload?.status || '').toLowerCase();
  const current = String(existing?.status || '');
  if (actor === 'admin') {
    if (current === 'sold-out' && requested !== 'active' && requested !== 'draft' && requested !== 'pending') {
      return 'sold-out';
    }
    if (['draft', 'pending', 'active', 'rejected'].includes(requested)) return requested;
    return current || 'active';
  }
  if (!existing) return requested === 'draft' ? 'draft' : 'pending';
  if (current === 'sold-out') return 'sold-out';
  if (current === 'rejected') return requested === 'draft' ? 'draft' : 'pending';
  if (current === 'active') return requested === 'draft' ? 'draft' : 'active';
  return requested === 'draft' ? 'draft' : 'pending';
}

async function buildTripDoc(companyId, payload, existing = null, options = {}) {
  const normalized = normalizeTripPayload({ ...(existing || {}), ...payload });
  const images = parseMediaList(normalized.images, existing?.images || []);
  const videos = parseMediaList(normalized.videos, existing?.videos || []);
  const actor = options.actor || 'company';
  const settings = await settingsService.getSettings();
  const list = settings.destinations || [];
  const destRecord = findDestination(list, normalized.destination);
  const destination = destRecord ? destRecord.nameEn : canonicalDestination(normalized.destination, list);
  const country = destRecord
    ? countryLabel(destRecord.country, 'en')
    : (isSacredTripType(normalized.type) ? 'Saudi Arabia' : 'Egypt');
  return {
    companyId: String(companyId),
    title: normalized.title,
    titleAr: normalized.titleAr || '',
    destination,
    location: `${destination}, ${country}`,
    category: categoryFromTripType(normalized.type),
    type: normalizeTripType(normalized.type),
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
    schedule: normalized.schedule || 'custom',
    includedServices: normalized.includedServices || '',
    includedList: normalized.includedList || [],
    itinerary: normalized.itinerary || [],
    travelDates: normalized.travelDates || [],
    cancellationPolicy: normalized.cancellationPolicy || '',
    images: images.length ? images : existing?.images?.length ? existing.images : [localImages[0]],
    videos,
    status: resolveTripStatus(payload, existing, actor),
    offer: 'offer' in payload ? payload.offer === 'on' || payload.offer === true : Boolean(existing?.offer),
    markupType: actor === 'admin' ? (payload.markupType || existing?.markupType || 'inherit') : (existing?.markupType || 'inherit'),
    markupPercent: actor === 'admin' ? (Number(payload.markupPercent ?? existing?.markupPercent) || 0) : (Number(existing?.markupPercent) || 0),
    markupFixed: actor === 'admin' ? (Number(payload.markupFixed ?? existing?.markupFixed) || 0) : (Number(existing?.markupFixed) || 0),
  };
}

async function createCompanyTrip(companyId, payload) {
  const id = `ct-${Date.now()}`;
  const data = await buildTripDoc(companyId, payload, null, { actor: 'company' });
  const created = await Trip.create({ _id: id, ...data });
  invalidateCatalogCache();
  return toDoc(created);
}

async function updateCompanyTrip(id, companyId, payload) {
  const trip = await getCompanyTrip(id, companyId);
  if (!trip) return null;
  const data = await buildTripDoc(companyId, payload, trip, { actor: 'company' });
  const updated = await Trip.findByIdAndUpdate(String(id), { $set: data }, { new: true }).lean();
  invalidateCatalogCache();
  return toDoc(updated);
}

async function deleteCompanyTrip(id, companyId) {
  const result = await Trip.deleteOne({ _id: String(id), companyId: String(companyId) });
  if (result.deletedCount > 0) invalidateCatalogCache();
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
  invalidateCatalogCache();
  return toDoc(updated);
}

async function rejectTrip(id, reason) {
  const updated = await Trip.findByIdAndUpdate(
    String(id),
    { $set: { status: 'rejected', rejectionReason: String(reason || 'Rejected by admin.') } },
    { new: true }
  ).lean();
  invalidateCatalogCache();
  return toDoc(updated);
}

async function setTripFeatured(id, featured) {
  const updated = await Trip.findByIdAndUpdate(String(id), { $set: { featured: Boolean(featured) } }, { new: true }).lean();
  invalidateCatalogCache();
  return toDoc(updated);
}

async function adminDeleteTrip(id) {
  const result = await Trip.deleteOne({ _id: String(id) });
  if (result.deletedCount > 0) invalidateCatalogCache();
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
  const id = `ct-${Date.now()}`;
  const data = await buildTripDoc(companyId, { ...payload, status: payload.status || 'active' }, null, { actor: 'admin' });
  const created = await Trip.create({ _id: id, ...data });
  invalidateCatalogCache();
  return toDoc(created);
}

async function adminUpdateTrip(id, payload) {
  const trip = await getTripById(id);
  if (!trip) return null;
  const data = await buildTripDoc(trip.companyId, payload, trip, { actor: 'admin' });
  const updated = await Trip.findByIdAndUpdate(String(id), { $set: data }, { new: true }).lean();
  invalidateCatalogCache();
  return toDoc(updated);
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
    return finishSeatUpdate(trip);
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
  return finishSeatUpdate(trip);
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
    return finishSeatUpdate(trip);
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
  return finishSeatUpdate(trip);
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
