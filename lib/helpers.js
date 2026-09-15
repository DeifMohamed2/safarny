function formatPrice(value) {
  return Number(value || 0).toLocaleString();
}

const bedTypeKeys = {
  1: 'bedSingle',
  2: 'bedDouble',
  3: 'bedTriple',
  4: 'bedQuadruple',
};

function bedTypeLabel(beds, translate) {
  const key = bedTypeKeys[Number(beds)];
  if (!key) return '';
  if (typeof translate === 'function') {
    const defaults = {
      bedSingle: 'Single',
      bedDouble: 'Double',
      bedTriple: 'Triple',
      bedQuadruple: 'Quadruple',
    };
    return translate(`tripDetails.${key}`, defaults[key]);
  }
  return key;
}

function roomTypeLabel(typeId, translate) {
  const occupancy = { single: 1, double: 2, triple: 3, quad: 4 }[String(typeId || '').toLowerCase()];
  if (occupancy) return bedTypeLabel(occupancy, translate);
  return bedTypeLabel(typeId, translate);
}

function initials(title) {
  if (!title) return '';
  const words = String(title).trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function companyReviewCount(company) {
  return Math.max(0, Number(company?.reviewCount ?? company?.reviews) || 0);
}

function formatCompanyRating(company) {
  const count = companyReviewCount(company);
  const rating = Number(company?.rating);
  if (!count || !Number.isFinite(rating) || rating <= 0) return '';
  return `★ ${rating.toFixed(1)}`;
}

const PLACEHOLDER_COMPANY_LOGOS = new Set([
  '',
  '/assets/companies/company.png',
  '/user.png',
]);

function companyLogoUrl(image) {
  const value = String(image || '').trim();
  if (!value || PLACEHOLDER_COMPANY_LOGOS.has(value)) return '';
  return value;
}

const TRIP_TYPES = ['leisure', 'umrah', 'hajj'];
const SACRED_TRIP_TYPES = new Set(['umrah', 'hajj']);
const TRIP_TYPE_LABELS = {
  leisure: 'Leisure',
  umrah: 'Umrah',
  hajj: 'Hajj',
};

function normalizeTripType(value) {
  const type = String(value || '').trim().toLowerCase();
  if (type === 'hajj') return 'hajj';
  if (type === 'umrah') return 'umrah';
  return 'leisure';
}

function isSacredTripType(value) {
  return SACRED_TRIP_TYPES.has(normalizeTripType(value));
}

function tripTypeMatches(tripType, filterType) {
  const filter = String(filterType || '').trim().toLowerCase();
  const type = normalizeTripType(tripType);
  if (!filter || filter === 'all') return true;
  if (filter === 'sacred') return isSacredTripType(type);
  if (filter === 'leisure') return type === 'leisure';
  return type === filter;
}

function tripTypeLabel(value, translate) {
  const type = normalizeTripType(value);
  const fallback = TRIP_TYPE_LABELS[type] || TRIP_TYPE_LABELS.leisure;
  if (typeof translate === 'function') return translate(`filter.${type}`, fallback);
  return fallback;
}

function categoryFromTripType(value) {
  return TRIP_TYPE_LABELS[normalizeTripType(value)] || TRIP_TYPE_LABELS.leisure;
}

function buildPagination(currentPage, totalPages) {
  const current = Math.min(Math.max(1, currentPage), totalPages);
  const pages = [];
  const windowSize = 5;
  let start = Math.max(1, current - 2);
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);
  return { current, totalPages, pages };
}

function pageUrl(basePath, query, page) {
  const params = new URLSearchParams(query || {});
  params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function formatDisplayDate(value, locale = 'en') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const now = new Date();
  const dateLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return locale === 'ar' ? 'اليوم' : 'Today';
  return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(value, locale = 'en') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' });
}

function relativeTime(value, locale = 'en') {
  if (!value) return '';
  if (typeof value === 'string' && !value.includes('T') && Number.isNaN(Date.parse(value))) {
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const ar = locale === 'ar';
  if (diffMs < minute) return ar ? 'الآن' : 'now';
  if (diffMs < hour) {
    const n = Math.max(1, Math.round(diffMs / minute));
    return ar ? `منذ ${n} د` : `${n}m ago`;
  }
  if (diffMs < day) {
    const n = Math.max(1, Math.round(diffMs / hour));
    return ar ? `منذ ${n} س` : `${n}h ago`;
  }
  if (diffMs < 7 * day) {
    const n = Math.max(1, Math.round(diffMs / day));
    return ar ? `منذ ${n} ي` : `${n}d ago`;
  }
  if (diffMs < 30 * day) {
    const n = Math.max(1, Math.round(diffMs / (7 * day)));
    return ar ? `منذ ${n} أ` : `${n}w ago`;
  }
  return formatDisplayDate(date, locale);
}

const navItems = [
  { key: 'home', path: '/', translateKey: 'nav.home' },
  { key: 'trips', path: '/trips', translateKey: 'nav.trips' },
  { key: 'umrah', path: '/umrah', translateKey: 'nav.umrah' },
];

function localizedText(en, ar, lang = 'en') {
  const enVal = String(en || '').trim();
  const arVal = String(ar || '').trim();
  if (lang === 'ar') return arVal || enVal;
  return enVal || arVal;
}

function tripTitle(trip, lang = 'en') {
  if (!trip) return '';
  if (typeof trip === 'string') return trip;
  return localizedText(trip.title, trip.titleAr, lang);
}

function tripDescription(trip, lang = 'en') {
  if (!trip || typeof trip === 'string') return '';
  const en = trip.description || trip.about || '';
  const ar = trip.descriptionAr || '';
  return localizedText(en, ar, lang);
}

module.exports = {
  formatPrice,
  bedTypeLabel,
  roomTypeLabel,
  initials,
  companyReviewCount,
  formatCompanyRating,
  companyLogoUrl,
  TRIP_TYPES,
  normalizeTripType,
  isSacredTripType,
  tripTypeMatches,
  tripTypeLabel,
  categoryFromTripType,
  buildPagination,
  pageUrl,
  formatDisplayDate,
  formatTime,
  relativeTime,
  navItems,
  localizedText,
  tripTitle,
  tripDescription,
};
