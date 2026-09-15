const { ensureTripDefaults, scheduleLabel, lowestTripPrice, enabledRoomTypes, roomTypesLabel } = require('../lib/trip-form-helpers');
const { applyMarkupToTrip } = require('../lib/markup');
const { isSacredTripType } = require('../lib/helpers');

const FALLBACK_IMAGE = '/assets/trip/trip.jpg';

function toPublicTrip(trip, company) {
  if (!trip) return null;
  const enriched = ensureTripDefaults(trip);
  const priced = applyMarkupToTrip(enriched, company || {});
  const {
    markupConfig,
    markupType,
    markupPercent,
    markupFixed,
    ...publicTrip
  } = priced;
  const images = publicTrip.images?.length ? publicTrip.images : [publicTrip.image || FALLBACK_IMAGE].filter(Boolean);
  const image = images[0] || FALLBACK_IMAGE;
  const price = lowestTripPrice(publicTrip);
  const types = enabledRoomTypes(publicTrip);
  return {
    ...publicTrip,
    id: publicTrip.id || publicTrip._id,
    location: publicTrip.location || `${publicTrip.destination}, ${isSacredTripType(publicTrip.type) ? 'Saudi Arabia' : 'Egypt'}`,
    image,
    gallery: images,
    availableSpots: Number(publicTrip.availableSeats) || 0,
    price,
    oldPrice: Number(publicTrip.oldPrice) > 0 ? publicTrip.oldPrice : 0,
    discountPercent: Number(publicTrip.discountPercent) > 0 ? publicTrip.discountPercent : 0,
    about: publicTrip.about || publicTrip.description || '',
    frequency: publicTrip.frequency || scheduleLabel(publicTrip.schedule),
    source: publicTrip.catalog ? 'catalog' : 'company',
    roomTypes: types,
    hasMultipleRoomTypes: types.length > 1,
    roomTypesLabel: roomTypesLabel(publicTrip),
  };
}

module.exports = { toPublicTrip };
