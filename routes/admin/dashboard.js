const express = require('express');
const { dashboard, chartApi } = require('../../controllers/admin/dashboardController');

const router = express.Router();
router.get('/dashboard', dashboard);
router.get('/api/analytics/:metric', chartApi);
module.exports = router;
