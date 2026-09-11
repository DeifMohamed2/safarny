const { getPlatformAnalytics, getChartData, exportCsv } = require('../../services/analytics');
const { withLayout } = require('./_helpers');

async function page(req, res) {
  const range = String(req.query.range || '12m');
  const locale = res.locals.lang || 'en';
  const analytics = await getPlatformAnalytics(range, locale);
  const [revenueBookings, bookingStatus, tripTypes, topCompanies, commission, categories] = await Promise.all([
    getChartData('revenue-bookings', range, locale),
    getChartData('booking-status', range, locale),
    getChartData('trip-types', range, locale),
    getChartData('top-companies', range, locale),
    getChartData('commission', range, locale),
    getChartData('categories', range, locale),
  ]);
  withLayout(res, 'pages/admin/analytics', {
    title: res.locals.t('admin.analytics.title', 'Analytics'),
    adminActive: 'analytics',
    range,
    analytics,
    chartData: { revenueBookings, bookingStatus, tripTypes, topCompanies, commission, categories },
  });
}

async function exportFile(req, res) {
  const type = String(req.query.type || 'revenue');
  const csv = await exportCsv(type);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="safarny-${type}-${Date.now()}.csv"`);
  res.send(csv);
}

module.exports = { page, exportFile };
