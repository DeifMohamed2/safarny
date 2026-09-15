function roundMoney(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function signedMoney(value) {
  return Math.round(Number(value) || 0);
}

function bookingSplit(booking = {}) {
  const collected = roundMoney(booking.totalPrice);
  const markup = Number(booking.markupAmount);
  const storedBase = Number(booking.basePrice);
  const platformFee = Number.isFinite(markup) && markup >= 0 ? roundMoney(markup) : 0;
  const payableToCompany = Number.isFinite(storedBase) && storedBase > 0
    ? roundMoney(storedBase)
    : Math.max(0, collected - platformFee);
  return { collected, platformFee, payableToCompany };
}

function refundSplit(booking = {}, approvedAmount) {
  const split = bookingSplit(booking);
  const remaining = Math.max(0, split.collected - roundMoney(booking.refundedAmount));
  const amount = Math.min(remaining, roundMoney(approvedAmount));
  if (!split.collected || amount <= 0) {
    return {
      approvedAmount: 0,
      platformFeeRefunded: 0,
      companyClawback: 0,
      remaining,
    };
  }
  const ratio = amount / split.collected;
  const platformFeeRefunded = roundMoney(split.platformFee * ratio);
  const companyClawback = Math.max(0, amount - platformFeeRefunded);
  return {
    approvedAmount: amount,
    platformFeeRefunded,
    companyClawback,
    remaining,
  };
}

function formatMoney(value) {
  return roundMoney(value).toLocaleString('en-EG');
}

function sumBookingSplits(bookings = []) {
  return bookings.reduce((acc, booking) => {
    const split = bookingSplit(booking);
    acc.collected += split.collected;
    acc.platformFee += split.platformFee;
    acc.payableToCompany += split.payableToCompany;
    return acc;
  }, { collected: 0, platformFee: 0, payableToCompany: 0 });
}

module.exports = {
  roundMoney,
  signedMoney,
  bookingSplit,
  refundSplit,
  formatMoney,
  sumBookingSplits,
};
