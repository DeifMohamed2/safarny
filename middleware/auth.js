const { createTranslator, supportedLangs } = require('../lib/i18n');
const {
  formatPrice,
  bedTypeLabel,
  roomTypeLabel,
  initials,
  companyLogoUrl,
  companyReviewCount,
  formatCompanyRating,
  navItems,
  tripTypeLabel,
  isSacredTripType,
  localizedText,
  tripTitle,
  tripDescription,
} = require('../lib/helpers');
const { destinationLabel, destinationsForTripType, canonicalDestination, formatDestinationLocation, countryOptions, groupLabel } = require('../lib/destinations');
const {
  occupancyOf,
  maxGuestsForDate,
  clampGuestCount,
  occupancySleepsLabel,
  enabledRoomTypes,
  roomTypesLabel,
} = require('../lib/trip-form-helpers');
const { findById } = require('../services/users');
const { getCompanyById } = require('../services/companies');
const { getSettings } = require('../services/settings');
const { countPendingTrips } = require('../services/trips');
const { countOpenTickets } = require('../services/tickets');
const { countSubmittedPayments } = require('../services/payments');
const { countActivePayouts } = require('../services/payouts');
const { countOpenRefunds } = require('../services/refunds');
const { groupedTripItinerary, staySummary } = require('../lib/itinerary');
const { payoutDetailsComplete } = require('../lib/payout-details');

function ensureViewLocals(req, res) {
  const lang = supportedLangs.includes(req.session?.lang)
    ? req.session.lang
    : (res.locals.lang === 'ar' ? 'ar' : 'en');
  res.locals.lang = lang;
  res.locals.isRtl = lang === 'ar';
  res.locals.dir = lang === 'ar' ? 'rtl' : 'ltr';
  res.locals.t = typeof res.locals.t === 'function' ? res.locals.t : createTranslator(lang);
  if (typeof res.locals.flash === 'undefined') res.locals.flash = null;
  if (typeof res.locals.user === 'undefined') res.locals.user = null;
  if (typeof res.locals.authenticated === 'undefined') res.locals.authenticated = false;
  if (typeof res.locals.isCompany === 'undefined') res.locals.isCompany = false;
  if (typeof res.locals.isAdmin === 'undefined') res.locals.isAdmin = false;
  if (typeof res.locals.payoutReady === 'undefined') res.locals.payoutReady = true;
  if (typeof res.locals.company === 'undefined') res.locals.company = null;
  if (typeof res.locals.currentPath === 'undefined') res.locals.currentPath = req.path || '/';
  if (typeof res.locals.query === 'undefined') res.locals.query = req.query || {};
  if (typeof res.locals.navItems === 'undefined') res.locals.navItems = navItems;
  if (typeof res.locals.favorites === 'undefined') res.locals.favorites = [];
  if (typeof res.locals.adminBadges === 'undefined') {
    res.locals.adminBadges = { trips: 0, support: 0, finance: 0, payouts: 0, refunds: 0 };
  }
  if (typeof res.locals.formatPrice !== 'function') res.locals.formatPrice = formatPrice;
  if (typeof res.locals.tripTitle !== 'function') {
    res.locals.tripTitle = (trip) => tripTitle(trip, lang);
  }
  if (typeof res.locals.isActive !== 'function') {
    res.locals.isActive = (path) => {
      const current = req.path || '/';
      if (path === '/') return current === '/';
      return current === path || current.startsWith(`${path}/`);
    };
  }
}

async function attachLocals(req, res, next) {
  try {
    ensureViewLocals(req, res);
    const lang = res.locals.lang;
    if (req.session) {
      req.session.lang = lang;
      req.session.favorites = req.session.favorites || [];
    }

    if (req.path === '/api/suggest' || req.path === '/api/search-preview') {
      return next();
    }

    let sessionUser = req.session?.user || null;
    if (sessionUser?.id) {
      const fresh = await findById(sessionUser.id);
      if (!fresh || fresh.status === 'suspended') {
        req.session.user = null;
        sessionUser = null;
      } else {
        sessionUser = {
          id: fresh.id,
          avatar: fresh.avatar,
          userName: fresh.userName,
          email: fresh.email,
          phone: fresh.phone,
          role: fresh.role,
          companyId: fresh.companyId,
          status: fresh.status,
        };
        req.session.user = sessionUser;
        if (fresh.role === 'traveler') {
          req.session.favorites = fresh.traveler?.favoriteTripIds || req.session.favorites;
        }
      }
    }

    const isCompany = sessionUser?.role === 'company';
    const isAdmin = sessionUser?.role === 'admin';
    const settings = await getSettings();

    res.locals.lang = lang;
    res.locals.isRtl = lang === 'ar';
    res.locals.dir = lang === 'ar' ? 'rtl' : 'ltr';
    res.locals.t = createTranslator(lang);
    res.locals.user = sessionUser;
    res.locals.authenticated = Boolean(sessionUser);
    res.locals.isCompany = isCompany;
    res.locals.isAdmin = isAdmin;
    res.locals.company = isCompany && sessionUser.companyId ? await getCompanyById(sessionUser.companyId) : null;
    const t = res.locals.t;
    const pickLabel = (keys, fallback) => {
      for (const key of keys) {
        const translated = t(key, '\0');
        if (translated && translated !== '\0' && translated !== key) return translated;
      }
      return fallback;
    };
    res.locals.payoutReady = isCompany ? payoutDetailsComplete(res.locals.company?.payoutDetails) : true;
    res.locals.payoutDetailsComplete = payoutDetailsComplete;
    res.locals.statusLabel = (value) => {
      const raw = String(value || '').trim();
      if (!raw) return '';
      const key = raw.toLowerCase();
      const alt = key.replace(/-/g, '_');
      const hyph = key.replace(/_/g, '-');
      const titled = raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      return pickLabel([
        `status.${key}`,
        `status.${alt}`,
        `status.${hyph}`,
        `admin.status.${key}`,
        `company.bookingStatus.${key}`,
        `company.tripStatus.${key}`,
        `tickets.status${raw.charAt(0).toUpperCase()}${key.slice(1)}`,
      ], titled);
    };
    res.locals.roleLabel = (value) => {
      const key = String(value || '').trim().toLowerCase();
      if (!key) return '';
      return pickLabel([`admin.role.${key}`, `status.${key}`], key);
    };
    res.locals.payoutMethodLabel = (value) => {
      const key = String(value || '').trim();
      if (!key) return '';
      return pickLabel([
        `paymentMethods.${key}`,
        `company.settings.payoutMethods.${key}`,
        `checkout.methods.${key}`,
      ], key.replace(/_/g, ' '));
    };
    res.locals.favorites = req.session.favorites;
    res.locals.currentPath = req.path;
    res.locals.query = req.query;
    res.locals.flash = req.session.flash || null;
    res.locals.formatPrice = formatPrice;
    res.locals.bedTypeLabel = (beds) => bedTypeLabel(beds, res.locals.t);
    res.locals.roomTypeLabel = (typeId) => roomTypeLabel(typeId, res.locals.t);
    res.locals.roomTypesLabel = (trip) => roomTypesLabel(trip, res.locals.t);
    res.locals.enabledRoomTypes = (trip) => enabledRoomTypes(trip);
    res.locals.occupancyOf = (tripOrBeds) => occupancyOf(typeof tripOrBeds === 'object' ? tripOrBeds : { beds: tripOrBeds });
    res.locals.maxGuestsForDate = (trip, dateEntry) => maxGuestsForDate(trip, dateEntry);
    res.locals.clampGuestCount = (trip, dateEntry, guests) => clampGuestCount(trip, dateEntry, guests);
    res.locals.occupancySleepsLabel = (beds) => occupancySleepsLabel(beds, res.locals.t);
    res.locals.groupItinerary = (trip) => groupedTripItinerary(trip, lang, settings.destinations);
    res.locals.staySummary = (trip) => staySummary(trip?.itinerary || [], lang, settings.destinations);
    res.locals.initials = initials;
    res.locals.companyReviewCount = companyReviewCount;
    res.locals.formatCompanyRating = formatCompanyRating;
    res.locals.tripTypeLabel = (type) => tripTypeLabel(type, res.locals.t);
    res.locals.isSacredTripType = isSacredTripType;
    res.locals.companyLogoUrl = companyLogoUrl;
    res.locals.navItems = navItems;
    res.locals.destinations = settings.destinations || [];
    res.locals.destinationLabel = (value) => destinationLabel(value, lang, settings.destinations);
    res.locals.destinationLocation = (value) => formatDestinationLocation(value, lang, settings.destinations);
    res.locals.destinationsForType = (type) => destinationsForTripType(settings.destinations, type);
    res.locals.canonicalDestination = (value) => canonicalDestination(value, settings.destinations);
    res.locals.destinationCountryOptions = countryOptions(lang);
    res.locals.destinationGroupLabel = (group) => groupLabel(group, lang);
    res.locals.localizedText = (en, ar) => localizedText(en, ar, lang);
    res.locals.tripTitle = (trip) => tripTitle(trip, lang);
    res.locals.tripDescription = (trip) => tripDescription(trip, lang);
    res.locals.isActive = (path) => {
      if (path === '/') return req.path === '/';
      return req.path === path || req.path.startsWith(`${path}/`);
    };

    if (isAdmin) {
      const [trips, support, finance, payouts, refunds] = await Promise.all([
        countPendingTrips(),
        countOpenTickets(),
        countSubmittedPayments(),
        countActivePayouts(),
        countOpenRefunds(),
      ]);
      res.locals.adminBadges = { trips, support, finance, payouts, refunds };
    } else {
      res.locals.adminBadges = { trips: 0, support: 0, finance: 0, payouts: 0, refunds: 0 };
    }

    delete req.session.flash;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please sign in to continue.' };
    return res.redirect(`/?signin=1&redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

function requireCompanyAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please sign in to continue.' };
    return res.redirect(`/?signin=1&redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  if (req.session.user.role !== 'company' || !req.session.user.companyId) {
    req.session.flash = { type: 'error', message: 'Company access only.' };
    return res.redirect('/');
  }
  if (!res.locals.company || res.locals.company.status === 'suspended') {
    req.session.flash = { type: 'error', message: 'This company account is not available.' };
    return res.redirect('/');
  }
  next();
}

function requireTravelerAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please sign in to continue.' };
    return res.redirect(`/?signin=1&redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  if (req.session.user.role === 'company') {
    return res.redirect('/company/dashboard');
  }
  next();
}

function requireAdminAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please sign in to continue.' };
    return res.redirect(`/?signin=1&redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  if (req.session.user.role !== 'admin') {
    req.session.flash = { type: 'error', message: 'Admin access only.' };
    return res.redirect('/');
  }
  next();
}

function wantsJson(req) {
  return req.xhr || req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest';
}

function regenerateSession(req, data = {}) {
  return new Promise((resolve, reject) => {
    const { lang, favorites } = req.session;
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.lang = lang || 'en';
      req.session.favorites = data.favorites || favorites || [];
      Object.assign(req.session, data);
      resolve();
    });
  });
}

module.exports = {
  attachLocals,
  ensureViewLocals,
  requireAuth,
  requireCompanyAuth,
  requireTravelerAuth,
  requireAdminAuth,
  wantsJson,
  regenerateSession,
};
