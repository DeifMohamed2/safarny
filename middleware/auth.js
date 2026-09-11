const { createTranslator, supportedLangs } = require('../lib/i18n');
const { formatPrice, bedTypeLabel, roomTypeLabel, initials, navItems } = require('../lib/helpers');
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
const { countPendingTrips } = require('../services/trips');
const { countOpenTickets } = require('../services/tickets');
const { countSubmittedPayments } = require('../services/payments');
const { groupedTripItinerary, staySummary } = require('../lib/itinerary');
const { getSettings } = require('../services/settings');

async function attachLocals(req, res, next) {
  try {
    const lang = supportedLangs.includes(req.session.lang) ? req.session.lang : 'en';
    req.session.lang = lang;
    req.session.favorites = req.session.favorites || [];

    let sessionUser = req.session.user || null;
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
    res.locals.groupItinerary = (trip) => groupedTripItinerary(trip, lang);
    res.locals.staySummary = (trip) => staySummary(trip?.itinerary || [], lang);
    res.locals.initials = initials;
    res.locals.navItems = navItems;
    res.locals.destinations = settings.destinations || [];
    res.locals.isActive = (path) => {
      if (path === '/') return req.path === '/';
      return req.path === path || req.path.startsWith(`${path}/`);
    };

    if (isAdmin) {
      const [trips, support, finance] = await Promise.all([
        countPendingTrips(),
        countOpenTickets(),
        countSubmittedPayments(),
      ]);
      res.locals.adminBadges = { trips, support, finance };
    } else {
      res.locals.adminBadges = { trips: 0, support: 0, finance: 0 };
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
  requireAuth,
  requireCompanyAuth,
  requireTravelerAuth,
  requireAdminAuth,
  wantsJson,
  regenerateSession,
};
