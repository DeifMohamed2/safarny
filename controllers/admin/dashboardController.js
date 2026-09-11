const { getPlatformAnalytics, getChartData } = require('../../services/analytics');
const { getRecentAudit } = require('../../services/audit');
const { withLayout } = require('./_helpers');

async function dashboard(req, res) {
  const range = String(req.query.range || '30d');
  const locale = res.locals.lang || 'en';
  const analytics = await getPlatformAnalytics(range, locale);
  const activity = await getRecentAudit(8);
  const [revenueBookings, bookingStatus, tripTypes, topCompanies] = await Promise.all([
    getChartData('revenue-bookings', range, locale),
    getChartData('booking-status', range, locale),
    getChartData('trip-types', range, locale),
    getChartData('top-companies', range, locale),
  ]);
  withLayout(res, 'pages/admin/dashboard', {
    title: res.locals.t('admin.dashboard.title', 'Dashboard'),
    adminActive: 'dashboard',
    range,
    analytics,
    activity,
    chartData: { revenueBookings, bookingStatus, tripTypes, topCompanies },
  });
}

async function chartApi(req, res) {
  const range = String(req.query.range || '30d');
  const data = await getChartData(req.params.metric, range, res.locals.lang || 'en');
  res.json({ ok: true, data });
}

module.exports = { dashboard, chartApi };
