const MOBILE_WALLET_METHODS = ['mobile_wallet', 'vodafone_cash', 'orange_cash', 'etisalat_cash'];

const PAYMENT_METHODS = [
  { id: 'instapay', labelKey: 'checkout.methods.instapay', label: 'InstaPay' },
  { id: 'mobile_wallet', labelKey: 'checkout.methods.mobileWallet', label: 'Mobile wallet' },
];

const VALID_METHODS = PAYMENT_METHODS.map((m) => m.id);

const PAYMENT_STATUSES = ['unpaid', 'submitted', 'verified', 'rejected'];

function isValidMethod(method) {
  return VALID_METHODS.includes(String(method || '').trim());
}

function isMobileWalletMethod(method) {
  return MOBILE_WALLET_METHODS.includes(String(method || '').trim());
}

function methodLabel(method, t) {
  if (isMobileWalletMethod(method)) {
    if (typeof t === 'function') return t('checkout.methods.mobileWallet', 'Mobile wallet');
    return 'Mobile wallet';
  }
  if (method === 'bank_transfer') {
    if (typeof t === 'function') return t('checkout.methods.bankTransfer', 'Bank transfer');
    return 'Bank transfer';
  }
  const match = PAYMENT_METHODS.find((m) => m.id === method);
  if (!match) return method || 'Unknown';
  if (typeof t === 'function') return t(match.labelKey, match.label);
  return match.label;
}

function mobileWalletPayoutLines(payouts) {
  return [
    payouts.vodafoneCash ? `Vodafone Cash: ${payouts.vodafoneCash}` : null,
    payouts.orangeCash ? `Orange Cash: ${payouts.orangeCash}` : null,
    payouts.etisalatCash ? `Etisalat Cash: ${payouts.etisalatCash}` : null,
  ].filter(Boolean);
}

function payoutDetailsForMethod(settings, method) {
  const payouts = settings?.payoutAccounts || {};
  switch (method) {
    case 'instapay':
      return {
        title: 'InstaPay',
        lines: [
          payouts.instapayIpa ? `IPA: ${payouts.instapayIpa}` : null,
          payouts.instapayMobile ? `Mobile: ${payouts.instapayMobile}` : null,
        ].filter(Boolean),
        instructions: payouts.instructionsEn || payouts.instructionsAr || '',
      };
    case 'mobile_wallet':
    case 'vodafone_cash':
    case 'orange_cash':
    case 'etisalat_cash':
      return {
        title: 'Mobile wallet',
        lines: mobileWalletPayoutLines(payouts),
        instructions: payouts.instructionsEn || '',
      };
    case 'bank_transfer':
      return {
        title: 'Bank transfer',
        lines: [
          payouts.bankName ? `Bank: ${payouts.bankName}` : null,
          payouts.bankAccountName ? `Account name: ${payouts.bankAccountName}` : null,
          payouts.bankAccountNumber ? `Account: ${payouts.bankAccountNumber}` : null,
          payouts.bankIban ? `IBAN: ${payouts.bankIban}` : null,
        ].filter(Boolean),
        instructions: payouts.instructionsEn || '',
      };
    default:
      return { title: 'Transfer', lines: [], instructions: '' };
  }
}

module.exports = {
  PAYMENT_METHODS,
  MOBILE_WALLET_METHODS,
  VALID_METHODS,
  PAYMENT_STATUSES,
  isValidMethod,
  isMobileWalletMethod,
  methodLabel,
  payoutDetailsForMethod,
};
