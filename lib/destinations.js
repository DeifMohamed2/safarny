const {
  EGYPT_DESTINATIONS,
  EGYPT_REGION_LABELS,
  EGYPT_REGION_ORDER,
} = require('./egypt-destinations');

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `dest-${Date.now().toString(36)}`;
}

function d(id, nameEn, nameAr, country, group = 'leisure', aliases = [], region = '', popular = false) {
  return { id, nameEn, nameAr, country, group, aliases, region, popular };
}

const COUNTRY_LABELS = {
  EG: { en: 'Egypt', ar: 'مصر' },
  SA: { en: 'Saudi Arabia', ar: 'السعودية' },
  TR: { en: 'Turkey', ar: 'تركيا' },
  AE: { en: 'United Arab Emirates', ar: 'الإمارات' },
  JO: { en: 'Jordan', ar: 'الأردن' },
  MA: { en: 'Morocco', ar: 'المغرب' },
  TN: { en: 'Tunisia', ar: 'تونس' },
  OM: { en: 'Oman', ar: 'عمان' },
  QA: { en: 'Qatar', ar: 'قطر' },
  KW: { en: 'Kuwait', ar: 'الكويت' },
  BH: { en: 'Bahrain', ar: 'البحرين' },
  LB: { en: 'Lebanon', ar: 'لبنان' },
  GE: { en: 'Georgia', ar: 'جورجيا' },
  AZ: { en: 'Azerbaijan', ar: 'أذربيجان' },
  MV: { en: 'Maldives', ar: 'المالديف' },
  MY: { en: 'Malaysia', ar: 'ماليزيا' },
  ID: { en: 'Indonesia', ar: 'إندونيسيا' },
  TH: { en: 'Thailand', ar: 'تايلاند' },
  GR: { en: 'Greece', ar: 'اليونان' },
  CY: { en: 'Cyprus', ar: 'قبرص' },
  IT: { en: 'Italy', ar: 'إيطاليا' },
  ES: { en: 'Spain', ar: 'إسبانيا' },
  FR: { en: 'France', ar: 'فرنسا' },
  GB: { en: 'United Kingdom', ar: 'بريطانيا' },
  AT: { en: 'Austria', ar: 'النمسا' },
  DE: { en: 'Germany', ar: 'ألمانيا' },
  CZ: { en: 'Czechia', ar: 'التشيك' },
  HU: { en: 'Hungary', ar: 'المجر' },
  CH: { en: 'Switzerland', ar: 'سويسرا' },
  NL: { en: 'Netherlands', ar: 'هولندا' },
  PT: { en: 'Portugal', ar: 'البرتغال' },
  HR: { en: 'Croatia', ar: 'كرواتيا' },
  ME: { en: 'Montenegro', ar: 'الجبل الأسود' },
  AL: { en: 'Albania', ar: 'ألبانيا' },
  US: { en: 'United States', ar: 'أمريكا' },
  JP: { en: 'Japan', ar: 'اليابان' },
  SG: { en: 'Singapore', ar: 'سنغافورة' },
  LK: { en: 'Sri Lanka', ar: 'سريلانكا' },
  IN: { en: 'India', ar: 'الهند' },
  KE: { en: 'Kenya', ar: 'كينيا' },
  TZ: { en: 'Tanzania', ar: 'تنزانيا' },
  ZA: { en: 'South Africa', ar: 'جنوب أفريقيا' },
  MU: { en: 'Mauritius', ar: 'موريشيوس' },
  SC: { en: 'Seychelles', ar: 'سيشل' },
  OTHER: { en: 'Other', ar: 'أخرى' },
};

const DEFAULT_DESTINATIONS = [
  ...EGYPT_DESTINATIONS,
  d('makkah', 'Makkah', 'مكة', 'SA', 'sacred', ['مكة المكرمة', 'mecca', 'makkah al mukarramah']),
  d('madinah', 'Madinah', 'المدينة المنورة', 'SA', 'sacred', ['المدينة', 'medina', 'al madinah']),
  d('jeddah', 'Jeddah', 'جدة', 'SA', 'both', ['جده']),
  d('taif', 'Taif', 'الطائف', 'SA', 'both'),
  d('yanbu', 'Yanbu', 'ينبع', 'SA', 'both'),
];

function normalizeCountry(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw) return 'OTHER';
  if (raw === 'OTHER') return 'OTHER';
  if (/^[A-Z]{2}$/.test(raw)) return raw;
  return 'OTHER';
}

function normalizeGroup(group, country) {
  if (['leisure', 'sacred', 'both'].includes(group)) return group;
  return country === 'SA' ? 'sacred' : 'leisure';
}

function uniqueStrings(values) {
  const seen = new Set();
  return (values || []).map((value) => String(value || '').trim()).filter((value) => {
    if (!value) return false;
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countryRank(code) {
  const keys = Object.keys(COUNTRY_LABELS);
  const idx = keys.indexOf(normalizeCountry(code));
  return idx === -1 ? 999 : idx;
}

function regionRank(item) {
  if ((item.country || 'EG') === 'EG') {
    const idx = EGYPT_REGION_ORDER.indexOf(item.region);
    return idx === -1 ? 80 : idx;
  }
  return 100 + countryRank(item.country);
}

function destinationName(item, lang = 'en') {
  if (!item) return '';
  return lang === 'ar' ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr);
}

function regionLabel(item, lang = 'en') {
  if (!item) return '';
  if (item.country === 'EG' && item.region && EGYPT_REGION_LABELS[item.region]) {
    const row = EGYPT_REGION_LABELS[item.region];
    return lang === 'ar' ? row.ar : row.en;
  }
  return countryLabel(item.country, lang);
}

function attachRegionLabels(item) {
  if (!item) return item;
  const egypt = item.country === 'EG' && item.region && EGYPT_REGION_LABELS[item.region];
  const row = egypt || COUNTRY_LABELS[normalizeCountry(item.country)] || COUNTRY_LABELS.OTHER;
  return {
    ...item,
    regionEn: row.en,
    regionAr: row.ar,
  };
}

function sortDestinationsForPicker(list, lang = 'en') {
  const locale = lang === 'ar' ? 'ar' : 'en';
  return [...list].sort((a, b) => {
    const region = regionRank(a) - regionRank(b);
    if (region) return region;
    const popular = Number(Boolean(b.popular)) - Number(Boolean(a.popular));
    if (popular) return popular;
    return String(destinationName(a, lang)).localeCompare(String(destinationName(b, lang)), locale, { sensitivity: 'base' });
  });
}

function normalizeDestination(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const name = raw.trim();
    if (!name) return null;
    const known = findDestination(DEFAULT_DESTINATIONS, name);
    if (known) return { ...known };
    return attachRegionLabels({
      id: slugify(name),
      nameEn: name,
      nameAr: name,
      country: 'OTHER',
      group: 'both',
      aliases: [],
      region: '',
      popular: false,
    });
  }
  const nameEn = String(raw.nameEn || raw.name || raw.en || '').trim();
  const nameAr = String(raw.nameAr || raw.ar || '').trim();
  if (!nameEn && !nameAr) return null;
  const country = normalizeCountry(raw.country);
  const aliases = uniqueStrings(raw.aliases);
  const fallback = DEFAULT_DESTINATIONS.find((item) => item.id === String(raw.id || '').trim())
    || DEFAULT_DESTINATIONS.find((item) => matchesDestinationRecord(item, nameEn || nameAr));
  return attachRegionLabels({
    id: String(raw.id || slugify(nameEn || nameAr)),
    nameEn: nameEn || nameAr,
    nameAr: nameAr || nameEn,
    country,
    group: normalizeGroup(raw.group, country),
    aliases: uniqueStrings([...(fallback?.aliases || []), ...aliases]),
    region: String(raw.region || fallback?.region || '').trim(),
    popular: raw.popular != null ? Boolean(raw.popular) : Boolean(fallback?.popular),
  });
}

function normalizeDestinationList(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const seen = new Set();
  const destinations = list
    .map(normalizeDestination)
    .filter(Boolean)
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  return sortDestinationsForPicker(destinations, 'ar');
}

function haystack(dest) {
  return [dest.id, dest.nameEn, dest.nameAr, dest.regionEn, dest.regionAr, dest.region, ...(dest.aliases || [])]
    .map((value) => String(value || '').toLowerCase().trim())
    .filter(Boolean);
}

function matchesDestinationRecord(dest, query) {
  const needle = String(query || '').toLowerCase().trim();
  if (!needle || !dest) return false;
  return haystack(dest).some((value) => value === needle || value.includes(needle) || needle.includes(value));
}

function findDestination(list, query) {
  const destinations = normalizeDestinationList(list);
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return null;
  const exact = destinations.find((item) => haystack(item).some((value) => value === needle));
  if (exact) return exact;
  return destinations.find((item) => matchesDestinationRecord(item, needle)) || null;
}

function destinationLabel(value, lang, list = DEFAULT_DESTINATIONS) {
  if (value && typeof value === 'object') {
    return lang === 'ar' ? (value.nameAr || value.nameEn) : (value.nameEn || value.nameAr);
  }
  const found = findDestination(list, value);
  if (!found) return String(value || '').trim();
  return lang === 'ar' ? found.nameAr : found.nameEn;
}

function canonicalDestination(value, list = DEFAULT_DESTINATIONS) {
  const found = findDestination(list, value);
  return found ? found.nameEn : String(value || '').trim();
}

function sameDestination(a, b, list = DEFAULT_DESTINATIONS) {
  const left = String(a || '').trim();
  const right = String(b || '').trim();
  if (!left || !right) return false;
  if (left.toLowerCase() === right.toLowerCase()) return true;
  const da = findDestination(list, left);
  const db = findDestination(list, right);
  return Boolean(da && db && da.id === db.id);
}

function isEgyptDestination(item) {
  return String(item?.country || '').toUpperCase() === 'EG';
}

function isSacredDestination(item) {
  return item && (item.group === 'sacred' || item.group === 'both');
}

function isAllowedCatalogItem(item) {
  if (!item) return false;
  if (isEgyptDestination(item)) return true;
  return isSacredDestination(item) && String(item.country || '').toUpperCase() === 'SA';
}

function destinationsForTripType(list, type) {
  const destinations = normalizeDestinationList(list).filter(isAllowedCatalogItem);
  const key = String(type || '').toLowerCase();
  if (key === 'umrah' || key === 'hajj' || key === 'sacred') {
    return destinations.filter(isSacredDestination);
  }
  return destinations.filter(isEgyptDestination);
}

function ensureDestinationCatalog(raw) {
  const byId = new Map();
  DEFAULT_DESTINATIONS.forEach((item) => byId.set(item.id, { ...item }));
  const stored = Array.isArray(raw) ? raw : [];
  stored.forEach((entry) => {
    const item = normalizeDestination(entry);
    if (!item) return;
    if (byId.has(item.id)) {
      const existing = byId.get(item.id);
      byId.set(item.id, {
        ...existing,
        aliases: uniqueStrings([...(existing.aliases || []), ...(item.aliases || [])]),
      });
      return;
    }
    byId.set(item.id, item);
  });
  return normalizeDestinationList([...byId.values()].filter(isAllowedCatalogItem));
}

function catalogNeedsPersist(stored) {
  if (!Array.isArray(stored) || !stored.length) return true;
  if (stored.some((item) => typeof item === 'string')) return true;
  const ids = new Set(stored.map((item) => item && item.id).filter(Boolean));
  if (DEFAULT_DESTINATIONS.some((item) => !ids.has(item.id))) return true;
  if (stored.some((item) => item && !isAllowedCatalogItem(item))) return true;
  return stored.some((item) => item && item.country === 'EG' && !item.region);
}

function countryLabel(code, lang = 'en') {
  const row = COUNTRY_LABELS[normalizeCountry(code)] || COUNTRY_LABELS.OTHER;
  return lang === 'ar' ? row.ar : row.en;
}

function groupLabel(group, lang = 'en') {
  if (group === 'sacred') return lang === 'ar' ? 'عمرة وحج' : 'Umrah & Hajj';
  if (group === 'both') return lang === 'ar' ? 'الكل' : 'All trips';
  return lang === 'ar' ? 'ترفيهية' : 'Leisure';
}

function searchDestinations(list, query, type, lang = 'ar') {
  const scoped = destinationsForTripType(list, type);
  const needle = String(query || '').toLowerCase().trim();
  const matches = needle
    ? scoped.filter((item) => haystack(item).some((value) => value.includes(needle)))
    : scoped;
  return sortDestinationsForPicker(matches, lang);
}

function formatDestinationLocation(value, lang, list = DEFAULT_DESTINATIONS) {
  const found = findDestination(list, value);
  if (!found) return String(value || '').trim();
  const name = lang === 'ar' ? found.nameAr : found.nameEn;
  const country = countryLabel(found.country, lang);
  return `${name}${country ? (lang === 'ar' ? '، ' : ', ') + country : ''}`;
}

function countryOptions(lang = 'en') {
  return ['EG', 'SA', 'OTHER'].map((code) => ({
    code,
    label: countryLabel(code, lang),
  }));
}

module.exports = {
  DEFAULT_DESTINATIONS,
  COUNTRY_LABELS,
  EGYPT_REGION_LABELS,
  EGYPT_REGION_ORDER,
  slugify,
  normalizeDestination,
  normalizeDestinationList,
  findDestination,
  destinationLabel,
  canonicalDestination,
  sameDestination,
  destinationsForTripType,
  ensureDestinationCatalog,
  catalogNeedsPersist,
  matchesDestinationRecord,
  countryLabel,
  groupLabel,
  regionLabel,
  sortDestinationsForPicker,
  searchDestinations,
  formatDestinationLocation,
  countryOptions,
};
