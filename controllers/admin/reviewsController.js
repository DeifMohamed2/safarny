const reviewService = require('../../services/reviews');
const companyService = require('../../services/companies');
const bookingService = require('../../services/bookings');
const { withLayout, audit } = require('./_helpers');

async function list(req, res) {
  const filters = {
    q: req.query.q,
    status: req.query.status || 'all',
    rating: req.query.rating || 'all',
    companyId: req.query.companyId || 'all',
  };
  const items = await Promise.all((await reviewService.filterReviews(filters)).map(async (review) => ({
    ...review,
    company: await companyService.getCompanyById(review.companyId),
  })));
  const { items: pageItems, pagination } = bookingService.paginateList(items, req.query.page, req.query.perPage || 12);
  withLayout(res, 'pages/admin/reviews', {
    title: res.locals.t('admin.reviews.title', 'Reviews'),
    adminActive: 'reviews',
    reviews: pageItems,
    pagination,
    filters,
    stats: await reviewService.getReviewStats(),
    companies: await companyService.listCompanies(),
    hasActiveFilters: filters.q || filters.status !== 'all' || filters.rating !== 'all' || filters.companyId !== 'all',
  });
}

async function publish(req, res) {
  const review = await reviewService.setReviewStatus(req.params.id, 'published');
  if (review) await audit(req, 'review.publish', 'review', review.id, `Published review by ${review.name}`);
  req.session.flash = { type: 'success', message: 'Review published.' };
  res.redirect('/admin/reviews');
}

async function hide(req, res) {
  const review = await reviewService.setReviewStatus(req.params.id, 'hidden');
  if (review) await audit(req, 'review.hide', 'review', review.id, `Hidden review by ${review.name}`);
  req.session.flash = { type: 'success', message: 'Review hidden.' };
  res.redirect('/admin/reviews');
}

async function remove(req, res) {
  await reviewService.deleteReview(req.params.id);
  await audit(req, 'review.delete', 'review', req.params.id, `Deleted review ${req.params.id}`);
  req.session.flash = { type: 'success', message: 'Review deleted.' };
  res.redirect('/admin/reviews');
}

module.exports = { list, publish, hide, remove };
