const express = require('express');
const c = require('../../controllers/admin/financeController');

const router = express.Router();

router.get('/finance', c.dashboard);
router.get('/finance/payments', c.paymentsList);
router.get('/finance/payments/export.csv', c.exportCsv);
router.get('/finance/payments/:id', c.paymentDetail);
router.post('/finance/payments/:id/verify', c.verify);
router.post('/finance/payments/:id/reject', c.reject);

router.get('/finance/payouts', c.payoutsList);
router.get('/finance/payouts/export.csv', c.payoutsExport);
router.get('/finance/payouts/new', c.payoutNew);
router.post('/finance/payouts', c.payoutCreate);
router.get('/finance/payouts/:id', c.payoutDetail);
router.post('/finance/payouts/:id/processing', c.payoutProcessing);
router.post('/finance/payouts/:id/paid', c.payoutPaid);
router.post('/finance/payouts/:id/failed', c.payoutFailed);
router.post('/finance/payouts/:id/cancel', c.payoutCancel);
router.get('/finance/payouts/:id/statement', c.payoutStatement);

router.get('/finance/refunds', c.refundsList);
router.get('/finance/refunds/export.csv', c.refundsExport);
router.get('/finance/refunds/:id', c.refundDetail);
router.post('/finance/refunds/:id/approve', c.refundApprove);
router.post('/finance/refunds/:id/decline', c.refundDecline);
router.post('/finance/refunds/:id/paid', c.refundPaid);
router.get('/finance/refunds/:id/credit-note', c.refundCreditNote);

router.get('/bookings/:id/invoice', c.bookingInvoice);

module.exports = router;
