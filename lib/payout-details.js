const COMPANY_PAYOUT_METHODS = [
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'instapay', label: 'InstaPay' },
  { id: 'vodafone_cash', label: 'Vodafone Cash' },
  { id: 'orange_cash', label: 'Orange Cash' },
  { id: 'etisalat_cash', label: 'Etisalat Cash' },
];

const REFUND_METHODS = [
  { id: 'instapay', label: 'InstaPay' },
  { id: 'mobile_wallet', label: 'Mobile wallet' },
  { id: 'bank_transfer', label: 'Bank transfer' },
];

const REFUND_REASONS = [
  { id: 'cancellation', label: 'Trip cancellation' },
  { id: 'date_change', label: 'Date change / cannot travel' },
  { id: 'trip_issue', label: 'Issue with the trip' },
  { id: 'duplicate', label: 'Duplicate payment' },
  { id: 'other', label: 'Other' },
];

function normalizeMobile(value) {
  return String(value || '').replace(/[\s-]/g, '');
}

function isEgyptianMobile(value) {
  return /^(\+?20)?01[0125]\d{8}$/.test(normalizeMobile(value));
}

function isIbanLike(value) {
  const raw = String(value || '').replace(/\s+/g, '').toUpperCase();
  return /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(raw);
}

function snapshotPayoutDetails(details = {}) {
  return {
    method: String(details.method || ''),
    bankName: String(details.bankName || '').trim(),
    accountName: String(details.accountName || '').trim(),
    accountNumber: String(details.accountNumber || '').trim(),
    iban: String(details.iban || '').replace(/\s+/g, '').toUpperCase(),
    swift: String(details.swift || '').trim(),
    walletProvider: String(details.walletProvider || '').trim(),
    walletNumber: normalizeMobile(details.walletNumber),
    instapayIpa: String(details.instapayIpa || '').trim(),
  };
}

function parseCompanyPayoutDetails(body = {}) {
  const method = String(body.method || '').trim();
  if (method === 'bank_transfer') {
    return snapshotPayoutDetails({
      method,
      bankName: body.bankName,
      accountName: body.accountName,
      accountNumber: body.accountNumber,
      iban: body.iban,
      swift: body.swift,
    });
  }
  if (method === 'instapay') {
    return snapshotPayoutDetails({
      method,
      walletProvider: 'instapay',
      walletNumber: body.walletNumber,
      instapayIpa: body.instapayIpa,
    });
  }
  return snapshotPayoutDetails({
    method,
    walletProvider: method,
    walletNumber: body.walletNumber,
  });
}

function payoutDetailsComplete(details = {}) {
  const snap = snapshotPayoutDetails(details);
  if (!COMPANY_PAYOUT_METHODS.some((item) => item.id === snap.method)) return false;
  if (snap.method === 'bank_transfer') {
    return Boolean(snap.bankName && snap.accountName && (snap.accountNumber || isIbanLike(snap.iban)));
  }
  if (snap.method === 'instapay') {
    return Boolean(snap.instapayIpa || isEgyptianMobile(snap.walletNumber));
  }
  return isEgyptianMobile(snap.walletNumber);
}

function payoutDetailsVerified(details = {}) {
  return payoutDetailsComplete(details) && Boolean(details.verifiedAt);
}

function fail(message, messageKey) {
  return { ok: false, message, messageKey };
}

function validateCompanyPayoutDetails(details = {}) {
  const snap = snapshotPayoutDetails(details);
  if (!COMPANY_PAYOUT_METHODS.some((item) => item.id === snap.method)) {
    return fail('Choose a payout method.', 'company.settings.payoutErrMethod');
  }
  if (snap.method === 'bank_transfer') {
    if (!snap.bankName || !snap.accountName) {
      return fail('Bank name and account name are required.', 'company.settings.payoutErrBank');
    }
    if (!snap.accountNumber && !snap.iban) {
      return fail('Enter an account number or IBAN.', 'company.settings.payoutErrAccount');
    }
    if (snap.iban && !isIbanLike(snap.iban)) {
      return fail('IBAN looks invalid.', 'company.settings.payoutErrIban');
    }
    return { ok: true, details: snap };
  }
  if (snap.method === 'instapay') {
    if (!snap.instapayIpa && !snap.walletNumber) {
      return fail('Enter an InstaPay IPA or mobile number.', 'company.settings.payoutErrInstapay');
    }
    if (snap.walletNumber && !isEgyptianMobile(snap.walletNumber)) {
      return fail('Enter a valid Egyptian mobile number.', 'company.settings.payoutErrMobile');
    }
    return { ok: true, details: snap };
  }
  if (!isEgyptianMobile(snap.walletNumber)) {
    return fail('Enter a valid Egyptian wallet number.', 'company.settings.payoutErrWallet');
  }
  return { ok: true, details: snap };
}

function parseRefundDestination(body = {}) {
  const method = String(body.method || '').trim();
  return {
    method,
    walletNumber: normalizeMobile(body.walletNumber),
    instapayIpa: String(body.instapayIpa || '').trim(),
    bankName: String(body.bankName || '').trim(),
    accountName: String(body.accountName || '').trim(),
    accountNumber: String(body.accountNumber || '').trim(),
    iban: String(body.iban || '').replace(/\s+/g, '').toUpperCase(),
  };
}

function validateRefundDestination(destination = {}) {
  const dest = parseRefundDestination(destination);
  if (!REFUND_METHODS.some((item) => item.id === dest.method)) {
    return { ok: false, message: 'Choose how we should send the refund.' };
  }
  if (dest.method === 'bank_transfer') {
    if (!dest.accountName || (!dest.accountNumber && !dest.iban)) {
      return { ok: false, message: 'Enter bank account details for the refund.' };
    }
    if (dest.iban && !isIbanLike(dest.iban)) return { ok: false, message: 'IBAN looks invalid.' };
    return { ok: true, destination: dest };
  }
  if (dest.method === 'instapay' && dest.instapayIpa) return { ok: true, destination: dest };
  if (!isEgyptianMobile(dest.walletNumber)) {
    return { ok: false, message: 'Enter a valid Egyptian mobile / wallet number.' };
  }
  return { ok: true, destination: dest };
}

function destinationLines(details = {}, t) {
  const label = (key, fallback) => (typeof t === 'function' ? t(key, fallback) : fallback);
  const snap = snapshotPayoutDetails(details);
  if (snap.method === 'bank_transfer') {
    return [
      snap.bankName && `${label('admin.finance.bankName', 'Bank')}: ${snap.bankName}`,
      snap.accountName && `${label('admin.finance.bankAccountName', 'Account name')}: ${snap.accountName}`,
      snap.accountNumber && `${label('admin.finance.bankAccountNumber', 'Account')}: ${snap.accountNumber}`,
      snap.iban && `IBAN: ${snap.iban}`,
      snap.swift && `SWIFT: ${snap.swift}`,
    ].filter(Boolean);
  }
  if (snap.method === 'instapay') {
    return [
      snap.instapayIpa && `${label('company.settings.instapayIpa', 'IPA')}: ${snap.instapayIpa}`,
      snap.walletNumber && `${label('company.settings.walletNumber', 'Mobile')}: ${snap.walletNumber}`,
    ].filter(Boolean);
  }
  return [
    snap.walletProvider && `${label('company.settings.payoutMethod', 'Wallet')}: ${label(`paymentMethods.${snap.walletProvider}`, snap.walletProvider.replace(/_/g, ' '))}`,
    snap.walletNumber && `${label('company.settings.walletNumber', 'Number')}: ${snap.walletNumber}`,
  ].filter(Boolean);
}

function destinationFields(details = {}, t) {
  const label = (key, fallback) => (typeof t === 'function' ? t(key, fallback) : fallback);
  const snap = snapshotPayoutDetails(details);
  if (snap.method === 'bank_transfer') {
    return [
      snap.bankName && { label: label('admin.finance.bankName', 'Bank'), value: snap.bankName },
      snap.accountName && { label: label('admin.finance.bankAccountName', 'Account name'), value: snap.accountName },
      snap.accountNumber && { label: label('admin.finance.bankAccountNumber', 'Account'), value: snap.accountNumber },
      snap.iban && { label: 'IBAN', value: snap.iban },
      snap.swift && { label: 'SWIFT', value: snap.swift },
    ].filter(Boolean);
  }
  if (snap.method === 'instapay') {
    return [
      snap.instapayIpa && { label: label('company.settings.instapayIpa', 'IPA'), value: snap.instapayIpa },
      snap.walletNumber && { label: label('company.settings.walletNumber', 'Mobile'), value: snap.walletNumber },
    ].filter(Boolean);
  }
  return [
    snap.walletProvider && {
      label: label('company.settings.payoutMethod', 'Wallet'),
      value: label(`paymentMethods.${snap.walletProvider}`, snap.walletProvider.replace(/_/g, ' ')),
    },
    snap.walletNumber && { label: label('company.settings.walletNumber', 'Number'), value: snap.walletNumber },
  ].filter(Boolean);
}

function payoutMethodLabel(method, t) {
  const match = COMPANY_PAYOUT_METHODS.find((item) => item.id === method);
  if (!match) return method || '—';
  return typeof t === 'function' ? t(`paymentMethods.${match.id}`, match.label) : match.label;
}

module.exports = {
  COMPANY_PAYOUT_METHODS,
  REFUND_METHODS,
  REFUND_REASONS,
  snapshotPayoutDetails,
  parseCompanyPayoutDetails,
  payoutDetailsComplete,
  payoutDetailsVerified,
  validateCompanyPayoutDetails,
  parseRefundDestination,
  validateRefundDestination,
  destinationLines,
  destinationFields,
  payoutMethodLabel,
  isEgyptianMobile,
  isIbanLike,
};
