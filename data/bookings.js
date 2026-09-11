const { applyMarkup, resolveMarkup } = require('../lib/markup');
const { getCompanyById } = require('./companies');
const { getTripById } = require('./trips');

function priced(tripId, guests) {
  const trip = getTripById(tripId);
  const company = getCompanyById(trip?.companyId) || {};
  const split = applyMarkup(trip.price, resolveMarkup(trip, company));
  const seats = Number(guests) || 1;
  return {
    title: trip.title,
    category: trip.category,
    location: trip.location,
    duration: `${trip.days} Days / ${trip.nights} Nights`,
    image: trip.image,
    tripId: trip.id,
    adults: seats,
    price: split.total,
    basePrice: split.base * seats,
    markupAmount: split.markup * seats,
    totalPrice: split.total * seats,
  };
}

const bookings = [
  {
    id: 1,
    status: 'confirmed',
    bookingDate: '8/1/2026',
    travelDate: '10/12/2026',
    userId: '21',
    paymentMethod: 'instapay',
    paymentStatus: 'verified',
    settlementStatus: 'settled',
    settledAt: '2026-08-20',
    travelDateId: '1-d1',
    ...priced('1', 2),
  },
  {
    id: 2,
    status: 'pending',
    bookingDate: '8/5/2026',
    travelDate: '10/12/2026',
    userId: '21',
    paymentMethod: 'bank_transfer',
    paymentStatus: 'submitted',
    settlementStatus: 'unsettled',
    travelDateId: '9-d1',
    ...priced('9', 1),
  },
  {
    id: 3,
    status: 'cancelled',
    bookingDate: '8/10/2026',
    travelDate: '10/12/2026',
    userId: '21',
    paymentMethod: 'instapay',
    paymentStatus: 'rejected',
    settlementStatus: 'unsettled',
    travelDateId: '2-d1',
    ...priced('2', 2),
  },
  {
    id: 4,
    status: 'confirmed',
    bookingDate: '8/12/2026',
    travelDate: '11/20/2026',
    userId: '22',
    paymentMethod: 'vodafone_cash',
    paymentStatus: 'verified',
    settlementStatus: 'unsettled',
    travelDateId: '5-d2',
    ...priced('5', 2),
  },
  {
    id: 5,
    status: 'pending',
    bookingDate: '8/15/2026',
    travelDate: '10/12/2026',
    userId: '23',
    paymentMethod: 'orange_cash',
    paymentStatus: 'submitted',
    settlementStatus: 'unsettled',
    travelDateId: '3-d1',
    ...priced('3', 2),
  },
];

module.exports = { bookings };
