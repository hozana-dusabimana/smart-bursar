const router = require('express').Router();
const {
    login, me, forgotPassword, resetPassword, validateResetToken,
    requestOTP, loginWithOTP
} = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', login);
router.post('/request-otp', requestOTP);
router.post('/login-otp', loginWithOTP);
router.get('/me', auth, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/reset-token/:token', validateResetToken);

module.exports = router;
