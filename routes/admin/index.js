const express = require('express');
const { requireAdminAuth } = require('../../middleware/auth');

const dashboardRoutes = require('./dashboard');
const companiesRoutes = require('./companies');
const tripsRoutes = require('./trips');
const bookingsRoutes = require('./bookings');
const usersRoutes = require('./users');
const supportRoutes = require('./support');
const reviewsRoutes = require('./reviews');
const analyticsRoutes = require('./analytics');
const settingsRoutes = require('./settings');
const auditRoutes = require('./audit');
const financeRoutes = require('./finance');

const router = express.Router();

router.use(requireAdminAuth);
router.use(dashboardRoutes);
router.use(companiesRoutes);
router.use(tripsRoutes);
router.use(bookingsRoutes);
router.use(usersRoutes);
router.use(supportRoutes);
router.use(reviewsRoutes);
router.use(analyticsRoutes);
router.use(settingsRoutes);
router.use(financeRoutes);
router.use(auditRoutes);

router.get('/', (req, res) => res.redirect('/admin/dashboard'));

module.exports = router;
