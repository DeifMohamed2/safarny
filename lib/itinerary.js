const STAY_LOCATIONS = [
  { id: 'makkah', en: 'Makkah', ar: 'مكة' },
  { id: 'madinah', en: 'Madinah', ar: 'المدينة' },
  { id: 'jeddah', en: 'Jeddah', ar: 'جدة' },
];

function parseJsonArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return fallback;
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function toDay(value, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : fallback;
}

function parseItinerary(value) {
  const items = parseJsonArray(value);
  return items
    .map((item, index) => {
      const kind = String(item.kind || '').toLowerCase() === 'stay' ? 'stay' : 'activity';
      const dayFrom = toDay(item.dayFrom ?? item.day, index + 1);
      const dayTo = Math.max(dayFrom, toDay(item.dayTo ?? item.day, dayFrom));
      return {
        kind,
        day: dayFrom,
        dayFrom,
        dayTo,
        location: String(item.location || '').trim().toLowerCase(),
        title: String(item.title || '').trim(),
        titleAr: String(item.titleAr || '').trim(),
        description: String(item.description || '').trim(),
        descriptionAr: String(item.descriptionAr || '').trim(),
      };
    })
    .filter((item) => item.title || item.titleAr || item.description || item.descriptionAr || item.kind === 'stay');
}

function locationLabel(id, lang = 'en', fallback = '') {
  const found = STAY_LOCATIONS.find((item) => item.id === String(id || '').toLowerCase());
  if (found) return lang === 'ar' ? found.ar : found.en;
  return fallback || '';
}

const LEISURE_DAY_TEMPLATES = [
  {
    title: 'Arrival',
    titleAr: 'الوصول',
    description: 'Arrival, hotel check-in, and time to settle in at your own pace.',
    descriptionAr: 'الوصول وتسجيل الدخول في الفندق ووقت للاستقرار.',
  },
  {
    title: 'Highlights',
    titleAr: 'المعالم',
    description: 'Guided visits to key sights and curated experiences with your group.',
    descriptionAr: 'زيارات موجهة لأهم المعالم وتجارب مختارة مع المجموعة.',
  },
  {
    title: 'Free Day',
    titleAr: 'يوم حر',
    description: 'Flexible time for optional activities, shopping, or relaxation.',
    descriptionAr: 'وقت مرن لأنشطة اختيارية أو تسوق أو استرخاء.',
  },
  {
    title: 'Departure',
    titleAr: 'المغادرة',
    description: 'Check-out and departure with smooth transfers arranged.',
    descriptionAr: 'تسجيل الخروج والمغادرة مع تنظيم التنقلات.',
  },
];

function defaultLeisureItinerary(days = 4) {
  const count = Math.max(1, Math.min(14, Number(days) || 4));
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    let tpl = LEISURE_DAY_TEMPLATES[1];
    if (day === 1) tpl = LEISURE_DAY_TEMPLATES[0];
    else if (day === count && count > 1) tpl = LEISURE_DAY_TEMPLATES[3];
    else if ((day - 2) % 2 === 1) tpl = LEISURE_DAY_TEMPLATES[2];
    return {
      kind: 'activity',
      day,
      dayFrom: day,
      dayTo: day,
      location: '',
      title: `Day ${day} – ${tpl.title}`,
      titleAr: `اليوم ${day} – ${tpl.titleAr}`,
      description: tpl.description,
      descriptionAr: tpl.descriptionAr,
    };
  });
}

function resolveItinerary(trip = {}) {
  const stored = parseItinerary(trip.itinerary);
  if (stored.length) return stored;
  if (String(trip.type || '').toLowerCase() === 'umrah') return [];
  return defaultLeisureItinerary(trip.days);
}

function dayRangeLabel(from, to, lang = 'en') {
  const start = toDay(from, 1);
  const end = Math.max(start, toDay(to, start));
  if (start === end) return lang === 'ar' ? `اليوم ${start}` : `Day ${start}`;
  return lang === 'ar' ? `${start}–${end}` : `${start}–${end}`;
}

function localizeItem(item, lang = 'en') {
  const ar = lang === 'ar';
  const title = ar && item.titleAr ? item.titleAr : (item.title || item.titleAr || '');
  const description = ar && item.descriptionAr ? item.descriptionAr : (item.description || item.descriptionAr || '');
  const loc = locationLabel(item.location, lang);
  return {
    ...item,
    title,
    description,
    locationLabel: loc,
    rangeLabel: dayRangeLabel(item.dayFrom, item.dayTo, lang),
  };
}

function groupItinerary(items = [], lang = 'en') {
  const parsed = parseItinerary(items);
  const stays = parsed.filter((item) => item.kind === 'stay').sort((a, b) => a.dayFrom - b.dayFrom || a.dayTo - b.dayTo);
  const activities = parsed.filter((item) => item.kind !== 'stay').sort((a, b) => a.dayFrom - b.dayFrom);
  if (!stays.length) {
    return activities.map((item) => ({
      ...localizeItem(item, lang),
      activities: [],
    }));
  }
  const nestedIds = new Set();
  const groups = stays.map((stay) => {
    const nested = activities.filter((act) => act.dayFrom >= stay.dayFrom && act.dayFrom <= stay.dayTo);
    nested.forEach((act) => nestedIds.add(`${act.dayFrom}|${act.title}|${act.titleAr}`));
    return {
      ...localizeItem(stay, lang),
      activities: nested.map((act) => localizeItem(act, lang)),
    };
  });
  activities
    .filter((act) => !nestedIds.has(`${act.dayFrom}|${act.title}|${act.titleAr}`))
    .forEach((act) => {
      groups.push({ ...localizeItem(act, lang), activities: [] });
    });
  return groups.sort((a, b) => a.dayFrom - b.dayFrom);
}

function staySummary(items = [], lang = 'en') {
  const stays = parseItinerary(items).filter((item) => item.kind === 'stay').sort((a, b) => a.dayFrom - b.dayFrom);
  if (!stays.length) return '';
  const inWord = lang === 'ar' ? 'في' : 'in';
  return stays
    .map((stay) => {
      const loc = locationLabel(stay.location, lang, stay.title || stay.titleAr);
      return `${dayRangeLabel(stay.dayFrom, stay.dayTo, lang)} ${inWord} ${loc}`;
    })
    .join(' · ');
}

function groupedTripItinerary(trip = {}, lang = 'en') {
  return groupItinerary(resolveItinerary(trip), lang);
}

module.exports = {
  STAY_LOCATIONS,
  parseItinerary,
  locationLabel,
  dayRangeLabel,
  localizeItem,
  groupItinerary,
  staySummary,
  defaultLeisureItinerary,
  resolveItinerary,
  groupedTripItinerary,
};
