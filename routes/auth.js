const express = require('express');
const auth = require('../controllers/authController');

const router = express.Router();

router.post('/sign-in', auth.signIn);
router.post('/sign-up', auth.signUp);
router.post('/company-sign-up', auth.signUpCompany);
router.post('/sign-out', auth.signOut);
router.post('/forgot-password', auth.forgotPassword);
router.post('/verify-reset', auth.verifyReset);
router.post('/reset-password', auth.resetPassword);
router.post('/profile', auth.updateProfile);
router.post('/change-password', auth.changePassword);
router.post('/avatar', auth.updateAvatar);

module.exports = router;
