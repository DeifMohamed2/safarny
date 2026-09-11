const { Review } = require('../models');
const { toDoc, toDocs } = require('../lib/document');

async function listReviews(filter = {}) {
  return toDocs(await Review.find(filter).sort({ createdAt: -1 }).lean());
}

async function getPublishedReviews(companyId) {
  const filter = { status: 'published' };
  if (companyId) filter.companyId = String(companyId);
  return listReviews(filter);
}

async function filterReviews(filters = {}) {
  const status = String(filters.status || 'all');
  const rating = String(filters.rating || 'all');
  const companyId = String(filters.companyId || 'all');
  const q = String(filters.q || '').trim().toLowerCase();
  const query = {};
  if (status !== 'all') query.status = status;
  if (companyId !== 'all') query.companyId = companyId;
  if (rating !== 'all') query.rating = Number(rating);
  let items = toDocs(await Review.find(query).sort({ createdAt: -1 }).lean());
  if (q) {
    items = items.filter((r) => {
      const haystack = `${r.name} ${r.message} ${r.tripTitle || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  return items;
}

async function getReviewById(id) {
  return toDoc(await Review.findById(String(id)).lean());
}

async function setReviewStatus(id, status) {
  if (!['published', 'hidden', 'flagged'].includes(status)) return null;
  return toDoc(await Review.findByIdAndUpdate(String(id), { $set: { status } }, { new: true }).lean());
}

async function deleteReview(id) {
  const result = await Review.deleteOne({ _id: String(id) });
  return result.deletedCount > 0;
}

async function getReviewStats() {
  const reviews = await listReviews();
  const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Number(r.rating) || 0));
    if (star) byRating[star] += 1;
    sum += Number(r.rating) || 0;
  });
  return {
    total: reviews.length,
    published: reviews.filter((r) => r.status === 'published').length,
    hidden: reviews.filter((r) => r.status === 'hidden').length,
    flagged: reviews.filter((r) => r.status === 'flagged').length,
    avgRating: reviews.length ? (sum / reviews.length).toFixed(1) : '0.0',
    byRating,
  };
}

module.exports = {
  listReviews,
  getPublishedReviews,
  filterReviews,
  getReviewById,
  setReviewStatus,
  deleteReview,
  getReviewStats,
};
