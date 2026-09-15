const ROOM_TYPE_DEFS = [
  { id: 'single', occupancy: 1, labelKey: 'filter.bedSingle', label: 'Single' },
  { id: 'double', occupancy: 2, labelKey: 'filter.bedDouble', label: 'Double' },
  { id: 'triple', occupancy: 3, labelKey: 'filter.bedTriple', label: 'Triple' },
  { id: 'quad', occupancy: 4, labelKey: 'filter.bedQuadruple', label: 'Quadruple' },
];

function parseJsonArray(value, fallback = []) {
  if (!value) return [...fallback];
  if (Array.isArray(value)) return value;
  const raw = String(value).trim();
  if (!raw) return [...fallback];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch (error) {
    return [...fallback];
  }
}

function parseIncludedList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value)
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

const { parseItinerary } = require('./itinerary');

function occupancyOf(trip) {
  const beds = Number(trip?.beds);
  if (beds >= 1 && beds <= 4) return beds;
  const types = Array.isArray(trip?.roomTypes) ? trip.roomTypes : [];
  const occupancies = types.map((item) => Number(item.occupancy)).filter((n) => n >= 1 && n <= 4);
  if (occupancies.length) return Math.max(...occupancies);
  return 2;
}

function occupancyForType(typeId) {
  const def = ROOM_TYPE_DEFS.find((item) => item.id === String(typeId || '').toLowerCase());
  return def ? def.occupancy : 2;
}

function typeIdFromOccupancy(beds) {
  const occupancy = Number(beds);
  const def = ROOM_TYPE_DEFS.find((item) => item.occupancy === occupancy);
  return def ? def.id : 'double';
}

function normalizeRoomEntry(item, fallback = {}) {
  if (!item && !fallback.type) return null;
  const rawType = String(item?.type || item?.id || fallback.type || '').toLowerCase();
  const def = ROOM_TYPE_DEFS.find((entry) => entry.id === rawType)
    || ROOM_TYPE_DEFS.find((entry) => entry.occupancy === Number(item?.occupancy || fallback.occupancy));
  if (!def) return null;
  if (item && item.enabled === false) return null;
  const totalRooms = Math.max(0, Number(item?.totalRooms ?? item?.rooms ?? fallback.totalRooms) || 0);
  const availableRooms = Math.max(0, Number(item?.availableRooms ?? item?.available ?? totalRooms) || 0);
  return {
    type: def.id,
    occupancy: def.occupancy,
    price: Math.max(0, Number(item?.price ?? fallback.price) || 0),
    totalRooms,
    availableRooms,
  };
}

function parseRoomTypes(value, trip = {}) {
  const items = parseJsonArray(value, trip.roomTypes || []);
  const normalized = items.map((item) => normalizeRoomEntry(item)).filter(Boolean);
  if (normalized.length) return normalized;
  return [{
    type: typeIdFromOccupancy(occupancyOf(trip)),
    occupancy: occupancyOf(trip),
    price: Number(trip.price) || 0,
    totalRooms: 0,
    availableRooms: 0,
  }];
}

function enabledRoomTypes(trip = {}) {
  return parseRoomTypes(trip.roomTypes, trip);
}

function roomsForDate(trip, dateEntry) {
  const fromDate = Array.isArray(dateEntry?.rooms)
    ? dateEntry.rooms.map((item) => normalizeRoomEntry(item)).filter(Boolean)
    : [];
  if (fromDate.length) return fromDate;
  const types = enabledRoomTypes(trip);
  if (types.some((item) => item.totalRooms > 0 || item.availableRooms > 0)) return types;
  return [];
}

function hasRoomInventory(trip, dateEntry) {
  const rooms = roomsForDate(trip, dateEntry);
  return rooms.some((item) => item.totalRooms > 0 || item.availableRooms > 0);
}

function leftoverSpotsForDate(trip, dateEntry) {
  const rooms = roomsForDate(trip, dateEntry);
  if (hasRoomInventory(trip, dateEntry)) {
    return rooms.reduce((sum, item) => sum + (Number(item.availableRooms) || 0) * (Number(item.occupancy) || 1), 0);
  }
  if (dateEntry && Number.isFinite(Number(dateEntry.availableSpots))) {
    return Math.max(0, Number(dateEntry.availableSpots));
  }
  return Math.max(0, Number(trip?.availableSeats ?? trip?.availableSpots ?? 0));
}

function guestCapacityForDate(trip, dateEntry) {
  const rooms = roomsForDate(trip, dateEntry);
  if (hasRoomInventory(trip, dateEntry)) {
    return rooms.reduce((sum, item) => sum + (Number(item.totalRooms) || 0) * (Number(item.occupancy) || 1), 0);
  }
  return Math.max(0, Number(dateEntry?.totalSpots ?? trip?.totalSeats ?? 0));
}

function priceForRoomType(trip, dateEntry, typeId) {
  const wanted = String(typeId || '').toLowerCase() || typeIdFromOccupancy(occupancyOf(trip));
  const dateRoom = roomsForDate(trip, dateEntry).find((item) => item.type === wanted);
  if (dateRoom && Number(dateRoom.price) > 0) return Number(dateRoom.price);
  const tripRoom = enabledRoomTypes(trip).find((item) => item.type === wanted);
  if (tripRoom && Number(tripRoom.price) > 0) return Number(tripRoom.price);
  return Number(trip?.price) || 0;
}

function lowestTripPrice(trip) {
  const prices = enabledRoomTypes(trip)
    .map((item) => Number(item.price) || 0)
    .filter((price) => price > 0);
  if (prices.length) return Math.min(...prices);
  return Number(trip?.price) || 0;
}

function defaultRoomTypeId(trip, dateEntry) {
  const rooms = roomsForDate(trip, dateEntry);
  const available = rooms.find((item) => Number(item.availableRooms) > 0);
  if (available) return available.type;
  const types = enabledRoomTypes(trip);
  return types[0]?.type || typeIdFromOccupancy(occupancyOf(trip));
}

function maxGuestsForDate(trip, dateEntry) {
  return leftoverSpotsForDate(trip, dateEntry);
}

function maxRoomsForDate(trip, dateEntry, typeId) {
  const inventory = hasRoomInventory(trip, dateEntry);
  if (typeId && inventory) {
    const entry = roomsForDate(trip, dateEntry).find((item) => item.type === typeId);
    if (entry) return Math.max(0, Number(entry.availableRooms) || 0);
    return 0;
  }
  if (inventory) {
    return roomsForDate(trip, dateEntry).reduce((sum, item) => sum + (Number(item.availableRooms) || 0), 0);
  }
  const spots = leftoverSpotsForDate(trip, dateEntry);
  const occupancy = typeId ? occupancyForType(typeId) : occupancyOf(trip);
  if (spots <= 0) return 0;
  if (spots < occupancy) return 1;
  return Math.floor(spots / occupancy);
}

function guestsFromRooms(trip, dateEntry, rooms, typeId) {
  const occupancy = typeId ? occupancyForType(typeId) : occupancyOf(trip);
  const spots = leftoverSpotsForDate(trip, dateEntry);
  const qty = Math.max(1, Number(rooms) || 1);
  if (!typeId && qty === 1 && spots < occupancy) return spots;
  if (typeId && hasRoomInventory(trip, dateEntry)) return qty * occupancy;
  return Math.min(qty * occupancy, spots);
}

function clampRoomCount(trip, dateEntry, rooms, typeId) {
  const maxRooms = maxRoomsForDate(trip, dateEntry, typeId);
  const qty = Math.max(1, Number(rooms) || 1);
  if (maxRooms <= 0) return 0;
  return Math.min(qty, maxRooms);
}

function validateRoomCount(trip, dateEntry, rooms, typeId) {
  const occupancy = typeId ? occupancyForType(typeId) : occupancyOf(trip);
  const maxRooms = maxRoomsForDate(trip, dateEntry, typeId);
  const qty = Math.max(1, Number(rooms) || 1);

  if (maxRooms <= 0) {
    return { ok: false, code: 'NO_SEATS', maxRooms: 0, occupancy, guests: 0, rooms: 0 };
  }
  if (qty > maxRooms) {
    return {
      ok: false,
      code: 'OVER_ROOMS',
      maxRooms,
      occupancy,
      guests: guestsFromRooms(trip, dateEntry, maxRooms, typeId),
      rooms: maxRooms,
    };
  }
  const guests = guestsFromRooms(trip, dateEntry, qty, typeId);
  return { ok: true, maxRooms, occupancy, guests, rooms: qty };
}

function clampGuestCount(trip, dateEntry, guests) {
  const maxGuests = maxGuestsForDate(trip, dateEntry);
  const qty = Math.max(1, Number(guests) || 1);
  if (maxGuests <= 0) return 0;
  return Math.min(qty, maxGuests);
}

function validateGuestCount(trip, dateEntry, guests) {
  const occupancy = occupancyOf(trip);
  const maxGuests = maxGuestsForDate(trip, dateEntry);
  const qty = Math.max(1, Number(guests) || 1);

  if (maxGuests <= 0) {
    return { ok: false, code: 'NO_SEATS', maxGuests: 0, occupancy };
  }
  if (qty > leftoverSpotsForDate(trip, dateEntry)) {
    return { ok: false, code: 'NO_SEATS', maxGuests, occupancy };
  }
  return { ok: true, maxGuests, occupancy };
}

function occupancySleepsLabel(beds, translate) {
  const occupancy = occupancyOf({ beds });
  const room = translate
    ? translate(`tripDetails.bed${['', 'Single', 'Double', 'Triple', 'Quadruple'][occupancy]}`, ['', 'Single', 'Double', 'Triple', 'Quadruple'][occupancy])
    : ['', 'Single', 'Double', 'Triple', 'Quadruple'][occupancy];
  const sleepsText = translate
    ? translate('tripDetails.sleepsN', `sleeps ${occupancy}`).replace('{n}', String(occupancy))
    : `sleeps ${occupancy}`;
  return `${room} · ${sleepsText}`;
}

function roomTypeLabel(typeId, translate) {
  const def = ROOM_TYPE_DEFS.find((item) => item.id === String(typeId || '').toLowerCase());
  if (!def) return '';
  if (typeof translate === 'function') return translate(def.labelKey, def.label);
  return def.label;
}

function roomTypesLabel(trip, translate) {
  const types = enabledRoomTypes(trip);
  return types.map((item) => roomTypeLabel(item.type, translate)).filter(Boolean).join(', ');
}

function parseDateRooms(value, trip = {}) {
  const items = parseJsonArray(value);
  const types = enabledRoomTypes(trip);
  if (items.length) {
    return items.map((item) => normalizeRoomEntry(item)).filter(Boolean);
  }
  return types.map((item) => ({ ...item }));
}

function syncTravelDateRooms(dates, roomTypes, priceMode = 'shared') {
  const types = Array.isArray(roomTypes) ? roomTypes : [];
  return dates.map((date) => {
    const existing = Array.isArray(date.rooms) ? date.rooms : [];
    const rooms = types.map((type) => {
      const prev = existing.find((item) => item.type === type.type) || {};
      const totalRooms = Math.max(0, Number(prev.totalRooms ?? type.totalRooms) || 0);
      const availableRooms = Math.max(0, Number(prev.availableRooms ?? prev.totalRooms ?? type.availableRooms ?? type.totalRooms) || 0);
      const price = priceMode === 'per-date'
        ? (Number(prev.price) || Number(type.price) || 0)
        : (Number(type.price) || 0);
      return {
        type: type.type,
        occupancy: type.occupancy,
        price,
        totalRooms,
        availableRooms,
      };
    });
    const derivedTotal = rooms.reduce((sum, item) => sum + item.totalRooms * item.occupancy, 0);
    const derivedAvailable = rooms.reduce((sum, item) => sum + item.availableRooms * item.occupancy, 0);
    return {
      ...date,
      rooms,
      totalSpots: derivedTotal || Number(date.totalSpots) || 0,
      availableSpots: derivedAvailable || Number(date.availableSpots) || 0,
    };
  });
}

function durationFromRange(startDate, endDate) {
  const start = String(startDate || '').trim();
  const end = String(endDate || start).trim();
  if (!start) return { days: 1, nights: 0 };
  const from = new Date(`${start}T00:00:00`);
  const to = new Date(`${end}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return { days: 1, nights: 0 };
  const nights = Math.max(0, Math.round((to - from) / 86400000));
  return { days: nights + 1, nights };
}

function inferSchedule(travelDates = []) {
  const starts = (Array.isArray(travelDates) ? travelDates : [])
    .map((item) => String(item?.startDate || '').trim())
    .filter(Boolean)
    .map((iso) => new Date(`${iso}T00:00:00`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a - b);
  if (starts.length < 2) return 'custom';
  const gaps = [];
  for (let i = 1; i < starts.length; i += 1) {
    gaps.push(Math.round((starts[i] - starts[i - 1]) / 86400000));
  }
  if (gaps.every((gap) => gap === 1)) return 'daily';
  if (gaps.every((gap) => gap >= 6 && gap <= 8)) return 'weekly';
  return 'custom';
}

function parseTravelDates(value, trip = {}) {
  const items = parseJsonArray(value);
  const fallback = durationFromRange(trip.startDate, trip.endDate);
  const days = Number(trip.days) || fallback.days;
  const nights = Number(trip.nights) || fallback.nights;
  const roomTypes = parseRoomTypes(trip.roomTypes, trip);

  const normalized = items
    .map((item, index) => {
      const startDate = String(item.startDate || item.start || '').trim();
      const endDate = String(item.endDate || item.end || startDate).trim();
      const rooms = parseDateRooms(item.rooms, { ...trip, roomTypes });
      const derivedTotal = rooms.reduce((sum, entry) => sum + entry.totalRooms * entry.occupancy, 0);
      const derivedAvailable = rooms.reduce((sum, entry) => sum + entry.availableRooms * entry.occupancy, 0);
      const totalSpots = derivedTotal || Number(item.totalSpots ?? item.totalSeats ?? trip.totalSeats) || 0;
      const availableSpots = derivedAvailable || Number(item.availableSpots ?? item.availableSeats ?? totalSpots) || 0;
      if (!startDate) return null;
      const span = durationFromRange(startDate, endDate);
      return {
        id: String(item.id || `td-${index + 1}`),
        startDate,
        endDate,
        days: span.days,
        nights: span.nights,
        totalSpots,
        availableSpots,
        rooms,
      };
    })
    .filter(Boolean);

  if (normalized.length) return normalized;

  if (trip.startDate) {
    return [
      {
        id: 'td-1',
        startDate: trip.startDate,
        endDate: trip.endDate || trip.startDate,
        days,
        nights,
        totalSpots: Number(trip.totalSeats) || 0,
        availableSpots: Number(trip.availableSeats) || 0,
        rooms: parseDateRooms(null, { ...trip, roomTypes }),
      },
    ];
  }

  return [];
}

function formatDateRangeLabel(startDate, endDate, locale = 'en') {
  const start = new Date(startDate);
  const end = new Date(endDate || startDate);
  if (Number.isNaN(start.getTime())) return startDate;
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  const startLabel = start.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
  if (Number.isNaN(end.getTime()) || startDate === endDate) {
    return `${startLabel}, ${start.getFullYear()}`;
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const endLabel = end.toLocaleDateString(dateLocale, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  return `${startLabel}–${endLabel}${sameYear ? `, ${start.getFullYear()}` : ''}`;
}

function travelDatesForDisplay(trip, locale = 'en') {
  const dates = parseTravelDates(trip.travelDates, trip);
  return dates.map((item) => ({
    id: item.id,
    date: formatDateRangeLabel(item.startDate, item.endDate, locale),
    startDate: item.startDate,
    endDate: item.endDate,
    availableSpots: item.availableSpots,
    days: item.days,
    nights: item.nights,
    rooms: item.rooms || [],
  }));
}

function scheduleLabel(schedule, translate) {
  const key = String(schedule || 'daily').toLowerCase();
  const labels = {
    daily: translate ? translate('tripDetails.scheduleDaily', 'Daily') : 'Daily',
    weekly: translate ? translate('tripDetails.scheduleWeekly', 'Weekly') : 'Weekly',
    custom: translate ? translate('tripDetails.scheduleCustom', 'Custom') : 'Custom',
  };
  return labels[key] || labels.daily;
}

function ensureTripDefaults(trip) {
  if (!trip) return trip;
  const includedList = trip.includedList?.length
    ? trip.includedList
    : parseIncludedList(trip.includedServices);
  const itinerary = trip.itinerary?.length ? trip.itinerary : [];
  const roomTypes = parseRoomTypes(trip.roomTypes, trip);
  const priceMode = trip.priceMode === 'per-date' ? 'per-date' : 'shared';
  const travelDates = syncTravelDateRooms(parseTravelDates(trip.travelDates, { ...trip, roomTypes }), roomTypes, priceMode);
  const price = lowestTripPrice({ ...trip, roomTypes });
  return {
    ...trip,
    schedule: trip.schedule || 'daily',
    includedList,
    itinerary,
    roomTypes,
    priceMode,
    travelDates,
    price,
    frequency: scheduleLabel(trip.schedule),
  };
}

function normalizeTripPayload(body = {}) {
  const includedList = parseIncludedList(body.includedList || body.includedServices);
  const itinerary = parseItinerary(body.itinerary);
  const roomTypes = parseRoomTypes(body.roomTypes, body);
  const priceMode = body.priceMode === 'per-date' ? 'per-date' : 'shared';
  const travelDates = syncTravelDateRooms(parseTravelDates(body.travelDates, { ...body, roomTypes }), roomTypes, priceMode);
  const primary = travelDates[0];
  const totalSeats = travelDates.reduce((sum, date) => sum + guestCapacityForDate({ roomTypes }, date), 0)
    || Number(body.totalSeats) || 0;
  const availableSeats = travelDates.reduce((sum, date) => sum + leftoverSpotsForDate({ roomTypes }, date), 0)
    || Number(body.availableSeats) || 0;
  const price = lowestTripPrice({ ...body, roomTypes });
  const beds = roomTypes[0]?.occupancy || Number(body.beds) || 2;
  const startDate = primary?.startDate || body.startDate || '';
  const endDate = primary?.endDate || body.endDate || '';
  const span = durationFromRange(startDate, endDate);

  return {
    ...body,
    schedule: inferSchedule(travelDates),
    includedList,
    includedServices: includedList.length ? includedList.join('\n') : String(body.includedServices || ''),
    itinerary,
    roomTypes,
    priceMode,
    travelDates,
    startDate,
    endDate,
    days: span.days,
    nights: span.nights,
    beds,
    price,
    totalSeats,
    availableSeats,
  };
}

module.exports = {
  ROOM_TYPE_DEFS,
  parseJsonArray,
  parseIncludedList,
  parseItinerary,
  parseTravelDates,
  parseRoomTypes,
  durationFromRange,
  inferSchedule,
  formatDateRangeLabel,
  travelDatesForDisplay,
  scheduleLabel,
  ensureTripDefaults,
  normalizeTripPayload,
  occupancyOf,
  occupancyForType,
  typeIdFromOccupancy,
  leftoverSpotsForDate,
  guestCapacityForDate,
  maxGuestsForDate,
  maxRoomsForDate,
  guestsFromRooms,
  clampRoomCount,
  validateRoomCount,
  clampGuestCount,
  validateGuestCount,
  occupancySleepsLabel,
  enabledRoomTypes,
  roomsForDate,
  hasRoomInventory,
  priceForRoomType,
  lowestTripPrice,
  defaultRoomTypeId,
  roomTypeLabel,
  roomTypesLabel,
  syncTravelDateRooms,
};
