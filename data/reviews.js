const reviews = [
  { id: '1', name: 'Ahmed Ali', message: 'Naama Bay hotel was quiet and the Ras Mohamed boat left on time with a proper briefing.', avatar: '/user.png', companyId: '1', tripTitle: 'Sharm El Sheikh Getaway', rating: 5, status: 'published', createdAt: '2026-07-01' },
  { id: '2', name: 'Said Ahmed', message: 'West Bank start at 6am was worth it — our Egyptologist kept the group small and the tombs uncrowded.', avatar: '/user.png', companyId: '2', tripTitle: 'Luxor Ancient Tour', rating: 4, status: 'published', createdAt: '2026-07-05' },
  { id: '3', name: 'Omar Khaled', message: 'Blue Hole snorkel was well marshalled. Lagoon rooms are simple but clean.', avatar: '/user.png', companyId: '1', tripTitle: 'Dahab Blue Hole Week', rating: 5, status: 'published', createdAt: '2026-07-10' },
  { id: '4', name: 'Nour Hassan', message: 'Haramain handled Ihram, the Haram hotel walk, and the Madinah transfer without a missed prayer window.', avatar: '/user.png', companyId: '5', tripTitle: '10-Day Makkah & Madinah Umrah', rating: 5, status: 'published', createdAt: '2026-07-15' },
  { id: '5', name: 'Mona Samir', message: 'Qaitbay and the library in one day was tight but the Corniche hotel made the weekend easy.', avatar: '/user.png', companyId: '3', tripTitle: 'Alexandria Corniche Weekend', rating: 4, status: 'published', createdAt: '2026-07-20' },
  { id: '6', name: 'Ahmed Ali', message: 'House reef at Marsa Alam had turtles on the second morning. Transfers from the airport were slow.', avatar: '/user.png', companyId: '7', tripTitle: 'Marsa Alam Reef Escape', rating: 5, status: 'flagged', createdAt: '2026-08-01' },
  { id: '7', name: 'Layla Ibrahim', message: 'Salt-lake stop was cut short and the camp dinner arrived late. Asking for a partial refund.', avatar: '/user.png', companyId: '4', tripTitle: 'Siwa Oasis Escape', rating: 2, status: 'hidden', createdAt: '2026-08-10' },
];

function filterReviews(filters = {}) {
  const status = String(filters.status || 'all');
  const rating = String(filters.rating || 'all');
  const companyId = String(filters.companyId || 'all');
  const q = String(filters.q || '').trim().toLowerCase();
  let items = [...reviews];
  if (status !== 'all') items = items.filter((r) => r.status === status);
  if (rating !== 'all') items = items.filter((r) => r.rating === Number(rating));
  if (companyId !== 'all') items = items.filter((r) => r.companyId === companyId);
  if (q) {
    items = items.filter((r) => {
      const haystack = `${r.name} ${r.message} ${r.tripTitle || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getReviewById(id) {
  return reviews.find((r) => r.id === String(id));
}

function setReviewStatus(id, status) {
  const review = getReviewById(id);
  if (!review || !['published', 'hidden', 'flagged'].includes(status)) return null;
  review.status = status;
  return review;
}

function deleteReview(id) {
  const index = reviews.findIndex((r) => r.id === String(id));
  if (index < 0) return false;
  reviews.splice(index, 1);
  return true;
}

function getReviewStats() {
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
  reviews,
  filterReviews,
  getReviewById,
  setReviewStatus,
  deleteReview,
  getReviewStats,
};
