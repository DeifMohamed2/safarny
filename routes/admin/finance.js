const express = require('express');
const c = require('../../controllers/admin/financeController');

const router = express.Router();

router.get('/finance', c.dashboard);
router.post('/finance/companies/:id/settle', c.settleCompany);
router.get('/finance/payments', c.paymentsList);
router.get('/finance/payments/export.csv', c.exportCsv);
router.get('/finance/payments/:id', c.paymentDetail);
router.post('/finance/payments/:id/verify', c.verify);
router.post('/finance/payments/:id/reject', c.reject);

module.exports = router;
