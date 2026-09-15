const { Review, Company } = require('../models');
const { toDoc, toDocs } = require('../lib/document');

const EMPTY_REVIEW_STATS = { reviewCount: 0, rating: 0 };

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

function emptyReviewStats() {
  return { ...EMPTY_REVIEW_STATS };
}

async function publishedReviewStatsByCompany(companyIds) {
  const match = { status: 'published' };
  if (Array.isArray(companyIds) && companyIds.length) {
    match.companyId = { $in: companyIds.map(String) };
  }
  const rows = await Review.aggregate([
    { $match: match },
    { $group: { _id: '$companyId', count: { $sum: 1 }, sum: { $sum: '$rating' } } },
  ]);
  const map = new Map();
  rows.forEach((row) => {
    const count = Number(row.count) || 0;
    map.set(String(row._id), {
      reviewCount: count,
      rating: count ? Math.round((Number(row.sum) / count) * 10) / 10 : 0,
    });
  });
  return map;
}

function applyReviewStats(company, stats) {
  if (!company) return company;
  const next = stats || emptyReviewStats();
  return {
    ...company,
    rating: next.rating,
    reviews: next.reviewCount,
    reviewCount: next.reviewCount,
  };
}

async function attachReviewStats(companies) {
  const list = (Array.isArray(companies) ? companies : [companies]).filter(Boolean);
  if (!list.length) return Array.isArray(companies) ? [] : null;
  const map = await publishedReviewStatsByCompany(list.map((company) => company.id || company._id));
  const attached = list.map((company) => applyReviewStats(company, map.get(String(company.id || company._id))));
  return Array.isArray(companies) ? attached : attached[0];
}

async function persistCompanyReviewStats(companyId) {
  if (!companyId) return emptyReviewStats();
  const map = await publishedReviewStatsByCompany([companyId]);
  const stats = map.get(String(companyId)) || emptyReviewStats();
  await Company.updateOne(
    { _id: String(companyId) },
    { $set: { rating: stats.rating, reviews: stats.reviewCount } }
  );
  return stats;
}

async function persistAllCompanyReviewStats() {
  const companies = await Company.find({}, { _id: 1 }).lean();
  const map = await publishedReviewStatsByCompany();
  await Promise.all(companies.map((company) => {
    const stats = map.get(String(company._id)) || emptyReviewStats();
    return Company.updateOne(
      { _id: String(company._id) },
      { $set: { rating: stats.rating, reviews: stats.reviewCount } }
    );
  }));
  return companies.length;
}

async function setReviewStatus(id, status) {
  if (!['published', 'hidden', 'flagged'].includes(status)) return null;
  const review = toDoc(await Review.findByIdAndUpdate(String(id), { $set: { status } }, { new: true }).lean());
  if (review?.companyId) await persistCompanyReviewStats(review.companyId);
  return review;
}

async function deleteReview(id) {
  const existing = await Review.findById(String(id)).lean();
  const result = await Review.deleteOne({ _id: String(id) });
  if (result.deletedCount > 0 && existing?.companyId) {
    await persistCompanyReviewStats(existing.companyId);
  }
  return result.deletedCount > 0;
}

async function getReviewStats() {
  const reviews = await listReviews();
  const published = reviews.filter((r) => r.status === 'published');
  const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Number(r.rating) || 0));
    if (star) byRating[star] += 1;
  });
  let sum = 0;
  published.forEach((r) => {
    sum += Number(r.rating) || 0;
  });
  return {
    total: reviews.length,
    published: published.length,
    hidden: reviews.filter((r) => r.status === 'hidden').length,
    flagged: reviews.filter((r) => r.status === 'flagged').length,
    avgRating: published.length ? (sum / published.length).toFixed(1) : '0.0',
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
  emptyReviewStats,
  publishedReviewStatsByCompany,
  applyReviewStats,
  attachReviewStats,
  persistCompanyReviewStats,
  persistAllCompanyReviewStats,
};
