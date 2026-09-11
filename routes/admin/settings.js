const express = require('express');
const c = require('../../controllers/admin/settingsController');

const router = express.Router();
router.get('/settings', c.page);
router.post('/settings', c.update);
router.post('/settings/destinations', c.destinations);
router.post('/settings/categories', c.categories);
router.post('/settings/profile', c.profile);
router.post('/settings/payouts', c.payoutAccounts);
module.exports = router;
