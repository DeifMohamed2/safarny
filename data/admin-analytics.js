const { companyBookings } = require('./company-bookings');
const { companyTrips } = require('./company-trips');
const { companies } = require('./companies');
const { users, getUserStats } = require('./users');
const { getSupportMeta } = require('./admin-support');
const { getCompanyStats } = require('./companies');
const { getReviewStats } = require('./reviews');
const { getSettings } = require('./platform-settings');

const RANGE_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
  all: null,
};

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inRange(dateValue, start, end) {
  const date = parseDate(dateValue);
  if (!date) return true;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function getRangeBounds(range = '30d') {
  const days = RANGE_DAYS[range] ?? RANGE_DAYS['30d'];
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  if (!days) return { start: null, end, prevStart: null, prevEnd: null };
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days + 1);
  prevStart.setHours(0, 0, 0, 0);
  return { start, end, prevStart, prevEnd };
}

function filterBookingsByRange(bookings, start, end) {
  return bookings.filter((b) => inRange(b.bookingDate, start, end));
}

function calcDelta(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildMonthlySeries(bookings, monthCount = 12, locale = 'en') {
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  const now = new Date();
  const series = [];
  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthBookings = bookings.filter((b) => {
      const booked = parseDate(b.bookingDate);
      return booked && booked.getFullYear() === year && booked.getMonth() === month;
    });
    const revenue = monthBookings
      .filter((b) => b.status === 'Confirmed')
      .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
    series.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString(dateLocale, { month: 'short' }),
      bookings: monthBookings.length,
      revenue,
    });
  }
  return series;
}

function getPlatformAnalytics(range = '30d', locale = 'en') {
  const { start, end, prevStart, prevEnd } = getRangeBounds(range);
  const allBookings = [...companyBookings];
  const currentBookings = filterBookingsByRange(allBookings, start, end);
  const previousBookings = filterBookingsByRange(allBookings, prevStart, prevEnd);

  const confirmed = currentBookings.filter((b) => b.status === 'Confirmed');
  const prevConfirmed = previousBookings.filter((b) => b.status === 'Confirmed');
  const gmv = confirmed.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
  const prevGmv = prevConfirmed.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

  const platformProfit = confirmed.reduce((sum, booking) => {
    const company = companies.find((c) => c.id === booking.companyId);
    const commission = company?.commissionRate || settings.commissionRate || 12;
    return sum + Math.round(Number(booking.totalPrice || 0) * (commission / 100));
  }, 0);
  const prevPlatformProfit = prevConfirmed.reduce((sum, booking) => {
    const company = companies.find((c) => c.id === booking.companyId);
    const commission = company?.commissionRate || settings.commissionRate || 12;
    return sum + Math.round(Number(booking.totalPrice || 0) * (commission / 100));
  }, 0);

  const conversionRate = currentBookings.length
    ? Math.round((confirmed.length / currentBookings.length) * 100)
    : 0;
  const prevConversionRate = previousBookings.length
    ? Math.round((prevConfirmed.length / previousBookings.length) * 100)
    : 0;

  const userStats = getUserStats();
  const companyStats = getCompanyStats();
  const supportMeta = getSupportMeta();
  const reviewStats = getReviewStats();
  const settings = getSettings();

  const bookingStatus = {
    confirmed: currentBookings.filter((b) => b.status === 'Confirmed').length,
    pending: currentBookings.filter((b) => b.status === 'Pending').length,
    cancelled: currentBookings.filter((b) => b.status === 'Cancelled').length,
    refunded: currentBookings.filter((b) => b.status === 'Refunded').length,
  };

  const tripTypes = { leisure: 0, umrah: 0 };
  companyTrips.forEach((trip) => {
    if (tripTypes[trip.type] !== undefined) tripTypes[trip.type] += 1;
  });

  const destinationMap = {};
  currentBookings.forEach((booking) => {
    const trip = companyTrips.find((t) => t.id === booking.tripId);
    const dest = trip?.destination || 'Other';
    destinationMap[dest] = (destinationMap[dest] || 0) + 1;
  });
  const topDestinations = Object.entries(destinationMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxDestinationCount = topDestinations[0]?.count || 1;

  const categoryMap = {};
  currentBookings.forEach((booking) => {
    const trip = companyTrips.find((t) => t.id === booking.tripId);
    const category = trip?.type === 'umrah' ? 'Umrah' : trip?.type === 'leisure' ? 'Leisure' : 'Other';
    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const bookingFunnel = {
    total: currentBookings.length,
    confirmed: bookingStatus.confirmed,
    pending: bookingStatus.pending,
    lost: bookingStatus.cancelled + bookingStatus.refunded,
  };

  const companyRevenue = {};
  confirmed.forEach((booking) => {
    companyRevenue[booking.companyId] = (companyRevenue[booking.companyId] || 0) + Number(booking.totalPrice || 0);
  });
  const topCompanies = Object.entries(companyRevenue)
    .map(([id, revenue]) => {
      const company = companies.find((c) => c.id === id);
      const companyBookingsList = confirmed.filter((b) => b.companyId === id);
      const commission = company?.commissionRate || settings.commissionRate || 12;
      const platformProfit = Math.round(revenue * (commission / 100));
      const trips = companyTrips.filter((t) => String(t.companyId) === id);
      const activeTrips = trips.filter((t) => t.status === 'active').length;
      return {
        id,
        name: company?.title || `Company ${id}`,
        revenue,
        platformProfit,
        bookings: companyBookingsList.length,
        activeTrips,
        tripCount: trips.length,
        image: company?.image,
        location: company?.location,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const topTrips = companyTrips
    .map((trip) => {
      const tripBookings = allBookings.filter((b) => b.tripId === trip.id);
      const tripConfirmed = tripBookings.filter((b) => b.status === 'Confirmed');
      const revenue = tripConfirmed.reduce((s, b) => s + Number(b.totalPrice || 0), 0);
      const company = companies.find((c) => c.id === trip.companyId);
      const commission = company?.commissionRate || settings.commissionRate || 12;
      return {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        companyName: company?.title,
        bookingCount: tripBookings.length,
        revenue,
        platformProfit: Math.round(revenue * (commission / 100)),
        image: trip.images?.[0],
        status: trip.status,
      };
    })
    .sort((a, b) => b.bookingCount - a.bookingCount || b.revenue - a.revenue)
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const monthlySeries = buildMonthlySeries(allBookings, range === '12m' || range === 'all' ? 12 : 8, locale);
  const commissionSeries = monthlySeries.map((item) => {
    const monthBookings = allBookings.filter((b) => {
      const booked = parseDate(b.bookingDate);
      if (!booked || b.status !== 'Confirmed') return false;
      const [year, month] = item.key.split('-').map(Number);
      return booked.getFullYear() === year && booked.getMonth() + 1 === month;
    });
    const profit = monthBookings.reduce((sum, booking) => {
      const company = companies.find((c) => c.id === booking.companyId);
      const commission = company?.commissionRate || settings.commissionRate || 12;
      return sum + Math.round(Number(booking.totalPrice || 0) * (commission / 100));
    }, 0);
    return { ...item, profit };
  });

  const pendingTrips = companyTrips.filter((t) => t.status === 'pending');
  const activeCompanies = companies.filter((c) => (c.status || 'active') === 'active').length;
  const verifiedCompanies = companies.filter((c) => (c.verification || 'verified') === 'verified').length;

  return {
    range,
    currency: settings.currency,
    kpis: {
      gmv: { value: gmv, delta: calcDelta(gmv, prevGmv) },
      platformProfit: { value: platformProfit, delta: calcDelta(platformProfit, prevPlatformProfit) },
      bookings: { value: currentBookings.length, delta: calcDelta(currentBookings.length, previousBookings.length) },
      avgOrder: {
        value: confirmed.length ? Math.round(gmv / confirmed.length) : 0,
        delta: calcDelta(
          confirmed.length ? gmv / confirmed.length : 0,
          prevConfirmed.length ? prevGmv / prevConfirmed.length : 0
        ),
      },
      conversion: { value: conversionRate, delta: calcDelta(conversionRate, prevConversionRate) },
      companies: { value: companyStats.total, delta: 0 },
      trips: { value: companyTrips.length, delta: 0 },
      users: { value: userStats.travelers, delta: 0 },
      openTickets: { value: supportMeta.open, delta: 0 },
      avgRating: { value: Number(reviewStats.avgRating), delta: 0 },
    },
    health: {
      activeCompanies,
      verifiedCompanies,
      activeTrips: companyTrips.filter((t) => t.status === 'active').length,
      pendingTrips: pendingTrips.length,
      publishedReviews: reviewStats.published,
      flaggedReviews: reviewStats.flagged,
      openTickets: supportMeta.open,
      resolvedTickets: supportMeta.resolved,
      conversionRate,
      avgRating: reviewStats.avgRating,
    },
    bookingFunnel,
    categoryBreakdown,
    maxDestinationCount,
    bookingStatus,
    tripTypes,
    topDestinations,
    topCompanies,
    topTrips,
    monthlySeries,
    commissionSeries,
    pendingTrips: pendingTrips.slice(0, 5),
    recentBookings: [...allBookings].sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)).slice(0, 8),
    totals: {
      users: userStats,
      companies: companyStats,
      reviews: reviewStats,
      trips: {
        total: companyTrips.length,
        active: companyTrips.filter((t) => t.status === 'active').length,
        pending: pendingTrips.length,
      },
    },
  };
}

function getChartData(metric, range = '30d', locale = 'en') {
  const analytics = getPlatformAnalytics(range, locale);
  const tripTypeLabels = locale === 'ar' ? ['ترفيهية', 'عمرة'] : ['Leisure', 'Umrah'];
  const statusLabels = locale === 'ar'
    ? ['مؤكدة', 'قيد الانتظار', 'ملغاة', 'مستردة']
    : ['Confirmed', 'Pending', 'Cancelled', 'Refunded'];
  const revenueLabel = locale === 'ar' ? 'الإيرادات' : 'Revenue';
  const bookingsLabel = locale === 'ar' ? 'الحجوزات' : 'Bookings';
  const profitLabel = locale === 'ar' ? 'عمولة المنصة' : 'Platform profit';
  const tripsLabel = locale === 'ar' ? 'الرحلات' : 'Trips';

  if (metric === 'revenue-bookings') {
    return {
      labels: analytics.monthlySeries.map((item) => item.label),
      datasets: [
        { label: revenueLabel, data: analytics.monthlySeries.map((item) => item.revenue), type: 'line' },
        { label: bookingsLabel, data: analytics.monthlySeries.map((item) => item.bookings), type: 'bar' },
      ],
      summary: {
        revenue: analytics.kpis.gmv.value,
        bookings: analytics.kpis.bookings.value,
      },
    };
  }
  if (metric === 'booking-status') {
    const total = Object.values(analytics.bookingStatus).reduce((sum, n) => sum + n, 0);
    return {
      labels: statusLabels,
      data: [
        analytics.bookingStatus.confirmed,
        analytics.bookingStatus.pending,
        analytics.bookingStatus.cancelled,
        analytics.bookingStatus.refunded,
      ],
      total,
      confirmed: analytics.bookingStatus.confirmed,
    };
  }
  if (metric === 'trip-types') {
    return {
      labels: tripTypeLabels,
      data: [analytics.tripTypes.leisure, analytics.tripTypes.umrah],
      label: tripsLabel,
    };
  }
  if (metric === 'top-companies') {
    return {
      labels: analytics.topCompanies.map((c) => c.name),
      data: analytics.topCompanies.map((c) => c.revenue),
      label: revenueLabel,
    };
  }
  if (metric === 'commission') {
    return {
      labels: analytics.commissionSeries.map((item) => item.label),
      data: analytics.commissionSeries.map((item) => item.profit),
      label: profitLabel,
    };
  }
  if (metric === 'categories') {
    return {
      labels: analytics.categoryBreakdown.map((item) => item.name),
      data: analytics.categoryBreakdown.map((item) => item.count),
      label: bookingsLabel,
    };
  }
  return analytics;
}

function exportCsv(type) {
  const rows = [];
  if (type === 'bookings') {
    rows.push(['ID', 'Customer', 'Trip', 'Company', 'Amount', 'Status', 'Booked', 'Trip Date']);
    companyBookings.forEach((b) => {
      const company = companies.find((c) => c.id === b.companyId);
      rows.push([b.id, b.customerName, b.tripName, company?.title || b.companyId, b.totalPrice, b.status, b.bookingDate, b.tripDate]);
    });
  } else if (type === 'companies') {
    rows.push(['ID', 'Name', 'Location', 'Rating', 'Verification', 'Status', 'Commission']);
    companies.forEach((c) => {
      rows.push([c.id, c.title, c.location, c.rating, c.verification || 'verified', c.status || 'active', c.commissionRate || 12]);
    });
  } else {
    rows.push(['Month', 'Bookings', 'Revenue']);
    buildMonthlySeries(companyBookings, 12).forEach((item) => {
      rows.push([item.label, item.bookings, item.revenue]);
    });
  }
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

module.exports = {
  getPlatformAnalytics,
  getChartData,
  exportCsv,
  RANGE_DAYS,
};
