const { methodLabel } = require('../lib/payment-methods');

function presentPaymentStatus(status) {
  const map = {
    unpaid: 'Unpaid',
    submitted: 'Submitted',
    verified: 'Verified',
    rejected: 'Rejected',
  };
  return map[status] || status;
}

module.exports = {
  methodLabel,
  presentPaymentStatus,
};
