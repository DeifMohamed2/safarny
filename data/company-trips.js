const { makeRooms, makeDates, leisureItinerary, umrahStay, IMG } = require('./trips');

const companyTrips = [
  {
    id: 'ct-1',
    companyId: '1',
    title: 'Hurghada House Reef Week',
    titleAr: 'أسبوع شعاب الغردقة',
    destination: 'Hurghada',
    category: 'Beach Escape',
    type: 'leisure',
    description: 'Seven days on Giftun with two boat days and a hotel that sits on a house reef.',
    descriptionAr: 'سبعة أيام في الجفتون مع يومين بحريين وفندق على شعاب خاصة.',
    price: 10400,
    totalSeats: 36,
    availableSeats: 28,
    days: 7,
    nights: 6,
    beds: 2,
    includedList: ['All-inclusive resort', 'Two boat trips', 'Airport transfers'],
    itinerary: leisureItinerary(7, [
      { title: 'Hurghada arrival', description: 'Airport pickup and a first snorkel on the house reef.' },
      { title: 'Giftun island', description: 'Full-day boat to Giftun with lunch on board.' },
    ]),
    cancellationPolicy: 'Full refund 14 days before departure, 50% up to 7 days.',
    images: [IMG.trip, IMG.card1, IMG.card4],
    status: 'active',
    offer: true,
    createdAt: '2026-02-01',
    dateStarts: ['2026-10-18', '2026-11-15', '2026-12-20'],
  },
  {
    id: 'ct-2',
    companyId: '1',
    title: 'Brothers Islands Liveaboard Prep',
    titleAr: 'تجهيز لايف أورد الإخوة',
    destination: 'Hurghada',
    category: 'Diving',
    type: 'leisure',
    description: 'A sold-out advanced-diver long weekend used for inventory testing.',
    descriptionAr: 'عطلة غوص متقدم نفدت بالكامل لاختبار المخزون.',
    price: 15600,
    totalSeats: 12,
    availableSeats: 0,
    days: 4,
    nights: 3,
    beds: 2,
    includedList: ['Twin cabin', 'Full board', 'Tanks and weights'],
    itinerary: leisureItinerary(4),
    cancellationPolicy: 'Non-refundable within 21 days of departure.',
    images: [IMG.card3, IMG.card1],
    status: 'sold-out',
    offer: false,
    createdAt: '2026-01-15',
    dateStarts: ['2026-09-12', '2026-10-10'],
    soldOut: true,
  },
  {
    id: 'ct-3',
    companyId: '2',
    title: 'Luxor to Aswan Overland',
    titleAr: 'من الأقصر إلى أسوان براً',
    destination: 'Luxor',
    category: 'Cultural Tour',
    type: 'leisure',
    description: 'A guided overland from Luxor through Edfu and Kom Ombo, ending with a Nubian dinner in Aswan.',
    descriptionAr: 'رحلة برية من الأقصر عبر إدفو وكوم أمبو وتنتهي بعشاء نوبي في أسوان.',
    price: 8900,
    totalSeats: 24,
    availableSeats: 18,
    days: 5,
    nights: 4,
    beds: 2,
    includedList: ['Hotels', 'Coach', 'Guide', 'Temple tickets'],
    itinerary: leisureItinerary(5, [
      { title: 'Luxor West Bank', description: 'Valley of the Kings before the road trip south.' },
      { title: 'Edfu & Kom Ombo', description: 'Two temple stops en route to Aswan.' },
    ]),
    cancellationPolicy: 'Full refund 10 days before departure.',
    images: [IMG.card2, IMG.card3],
    status: 'active',
    offer: false,
    createdAt: '2026-03-04',
    dateStarts: ['2026-10-22', '2026-11-19'],
  },
  {
    id: 'ct-4',
    companyId: '3',
    title: 'Giza Sunset & GEM Evening',
    titleAr: 'غروب الجيزة ومساء المتحف',
    destination: 'Cairo',
    category: 'City Tour',
    type: 'leisure',
    description: 'A short Cairo package: plateau at sunset, then a timed GEM evening slot.',
    descriptionAr: 'باقة قصيرة في القاهرة: الهضبة عند الغروب ثم المتحف الكبير مساءً.',
    price: 4800,
    totalSeats: 20,
    availableSeats: 14,
    days: 2,
    nights: 1,
    beds: 2,
    includedList: ['Hotel', 'Private van', 'GEM tickets'],
    itinerary: leisureItinerary(2, [
      { title: 'Giza sunset', description: 'Late-afternoon plateau visit with a Sphinx terrace stop.' },
    ]),
    cancellationPolicy: 'Full refund 48 hours before.',
    images: [IMG.trip, IMG.card2],
    status: 'active',
    offer: true,
    createdAt: '2026-04-12',
    dateStarts: ['2026-10-03', '2026-10-17', '2026-11-07'],
  },
  {
    id: 'ct-5',
    companyId: '5',
    title: 'Umrah Plus Jeddah Stopover',
    titleAr: 'عمرة مع توقف في جدة',
    destination: 'Jeddah',
    category: 'Umrah Package',
    type: 'umrah',
    description: 'Nine-day Umrah with a Jeddah corniche night at the start, then Makkah and Madinah.',
    descriptionAr: 'عمرة تسعة أيام تبدأ بليلة في جدة ثم مكة والمدينة.',
    price: 31200,
    totalSeats: 28,
    availableSeats: 20,
    days: 9,
    nights: 8,
    beds: 2,
    includedList: ['Jeddah hotel night', 'Makkah and Madinah hotels', 'Mutawwif', 'Coaches'],
    itinerary: [
      { kind: 'stay', day: 1, dayFrom: 1, dayTo: 1, location: 'jeddah', title: 'Jeddah night', titleAr: 'ليلة جدة', description: 'Corniche hotel after landing.', descriptionAr: 'فندق على الكورنيش بعد الهبوط.' },
      ...umrahStay(9, 5).map((item) => (
        item.kind === 'stay' && item.location === 'makkah'
          ? { ...item, dayFrom: 2, dayTo: 6, day: 2 }
          : item.kind === 'stay' && item.location === 'madinah'
            ? { ...item, dayFrom: 7, dayTo: 9, day: 7 }
            : item
      )),
    ],
    cancellationPolicy: 'Full refund 21 days before departure.',
    images: [IMG.card3, IMG.trip],
    status: 'active',
    offer: false,
    createdAt: '2026-02-20',
    dateStarts: ['2026-10-08', '2026-11-12'],
  },
  {
    id: 'ct-6',
    companyId: '4',
    title: 'Siwa Salt Lakes Camp',
    titleAr: 'مخيم بحيرات سيوة',
    destination: 'Siwa',
    category: 'Adventure',
    type: 'leisure',
    description: 'Three nights camping beside the salt lakes with a Great Sand Sea sunset drive.',
    descriptionAr: 'ثلاث ليالٍ بجانب البحيرات المالحة مع غروب في بحر الرمال العظيم.',
    price: 5400,
    totalSeats: 16,
    availableSeats: 12,
    days: 4,
    nights: 3,
    beds: 2,
    includedList: ['Camp', 'All meals', '4x4'],
    itinerary: leisureItinerary(4),
    cancellationPolicy: 'Full refund 7 days before.',
    images: [IMG.card4, IMG.card1],
    status: 'draft',
    offer: false,
    createdAt: '2026-06-01',
    dateStarts: ['2026-11-05'],
  },
];

const companyTripsWithRooms = companyTrips.map((trip) => {
  const rooms = makeRooms(trip.price, trip.type === 'umrah'
    ? { single: 2, double: 8, triple: 4, quad: 2 }
    : { single: 3, double: 8, triple: 2, quad: 1 });
  const travelDates = makeDates(trip.id, {
    days: trip.days,
    nights: trip.nights,
    starts: trip.dateStarts,
    rooms,
    soldOutIndex: trip.soldOut ? 0 : -1,
  });
  if (trip.soldOut) {
    travelDates.forEach((date) => {
      date.availableSpots = 0;
      date.rooms = date.rooms.map((room) => ({ ...room, availableRooms: 0 }));
    });
  }
  const { dateStarts, soldOut, ...rest } = trip;
  const availableSeats = travelDates.reduce((sum, date) => sum + date.availableSpots, 0);
  return {
    ...rest,
    roomTypes: rooms,
    travelDates,
    location: `${trip.destination}, ${trip.type === 'umrah' ? 'Saudi Arabia' : 'Egypt'}`,
    startDate: travelDates[0].startDate,
    endDate: travelDates[0].endDate,
    totalSeats: rooms.reduce((sum, room) => sum + room.totalRooms * room.occupancy, 0),
    availableSeats: trip.soldOut ? 0 : availableSeats,
    catalog: false,
    schedule: trip.type === 'umrah' ? 'weekly' : 'daily',
  };
});

module.exports = {
  companyTrips: companyTripsWithRooms,
};
