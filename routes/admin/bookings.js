const express = require('express');
const c = require('../../controllers/admin/bookingsController');

const router = express.Router();
router.get('/bookings', c.list);
router.get('/bookings/:id', c.detail);
router.post('/bookings/:id/status', c.updateStatus);
module.exports = router;
