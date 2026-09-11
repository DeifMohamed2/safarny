const express = require('express');
const c = require('../../controllers/admin/analyticsController');

const router = express.Router();
router.get('/analytics', c.page);
router.get('/analytics/export.csv', c.exportFile);
module.exports = router;
