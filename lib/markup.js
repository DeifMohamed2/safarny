function roundMoney(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function normalizeType(value, fallback = 'percent') {
  const raw = String(value || '').toLowerCase();
  if (raw === 'fixed' || raw === 'percent' || raw === 'inherit') return raw;
  return fallback;
}

function resolveMarkup(trip = {}, company = {}) {
  const tripType = normalizeType(trip.markupType, 'inherit');
  if (tripType === 'percent' || tripType === 'fixed') {
    return {
      type: tripType,
      percent: Math.max(0, Number(trip.markupPercent) || 0),
      fixed: Math.max(0, Number(trip.markupFixed) || 0),
      source: 'trip',
    };
  }
  const companyType = normalizeType(company.markupType, 'percent');
  return {
    type: companyType === 'fixed' ? 'fixed' : 'percent',
    percent: Math.max(0, Number(company.commissionRate) || 0),
    fixed: Math.max(0, Number(company.markupFixed) || 0),
    source: 'company',
  };
}

function applyMarkup(baseAmount, cfg = {}) {
  const base = roundMoney(baseAmount);
  const type = normalizeType(cfg.type, 'percent');
  const markup = type === 'fixed'
    ? roundMoney(cfg.fixed)
    : roundMoney(base * ((Number(cfg.percent) || 0) / 100));
  return {
    base,
    markup,
    total: base + markup,
    type,
    percent: Number(cfg.percent) || 0,
    fixed: Number(cfg.fixed) || 0,
    source: cfg.source || 'company',
  };
}

function applyMarkupToTrip(trip = {}, company = {}) {
  const cfg = resolveMarkup(trip, company);
  const price = applyMarkup(trip.price, cfg);
  const oldPrice = trip.oldPrice ? applyMarkup(trip.oldPrice, cfg).total : 0;
  const roomTypes = (trip.roomTypes || []).map((room) => ({
    ...room,
    price: applyMarkup(room.price, cfg).total,
  }));
  const travelDates = (trip.travelDates || []).map((date) => ({
    ...date,
    rooms: (date.rooms || []).map((room) => ({
      ...room,
      price: applyMarkup(room.price, cfg).total,
    })),
  }));
  return {
    ...trip,
    price: price.total,
    oldPrice,
    roomTypes,
    travelDates,
    markupConfig: cfg,
  };
}

module.exports = {
  roundMoney,
  resolveMarkup,
  applyMarkup,
  applyMarkupToTrip,
};
