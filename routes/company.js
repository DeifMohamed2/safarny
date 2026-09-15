const express = require('express');
const company = require('../controllers/companyController');
const { requireCompanyAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireCompanyAuth);

router.get('/', company.dashboardRedirect);
router.get('/dashboard', company.dashboard);
router.get('/trips', company.trips);
router.get('/trips/new', company.newTripForm);
router.post('/trips/media', company.uploadMedia);
router.post('/trips/new', company.createTrip);
router.get('/trips/:id', company.tripDetails);
router.get('/trips/:id/edit', company.editTripForm);
router.post('/trips/:id/edit', company.editTrip);
router.post('/trips/:id/delete', company.deleteTrip);
router.get('/bookings', company.bookings);
router.get('/bookings/:id', company.bookingDetails);
router.post('/bookings/:id/cancel', company.cancelBooking);
router.get('/chat', company.chatRedirect);
router.get('/support/new', company.newSupportForm);
router.post('/support', company.createSupport);
router.get('/support', company.supportList);
router.get('/support/:id', company.supportDetail);
router.post('/support/:id/reply', company.supportReply);
router.get('/finance', company.financePage);
router.get('/finance/payouts/:id/statement', company.financePayoutStatement);
router.get('/finance/payouts/:id', company.financePayoutDetail);
router.get('/settings', company.settingsPage);
router.post('/settings/logo', company.uploadLogo);
router.post('/settings/docs', company.uploadVerificationDocs);
router.post('/settings/payout', company.updatePayoutDetails);
router.post('/settings', company.updateSettings);

module.exports = router;
