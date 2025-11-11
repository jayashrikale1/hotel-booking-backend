// routes/auth.js
const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

/**
 * @route POST /api/auth/register
 */
router.post('/register', ctrl.register);

/**
 * @route POST /api/auth/login
 */
router.post('/login', ctrl.login);

/**
 * @route POST /api/auth/forgot
 */
router.post('/forgot', ctrl.forgotPassword);

/**
 * @route POST /api/auth/change-password
 */
router.post('/change-password', authenticate, ctrl.changePassword);

/**
 * @route POST /api/auth/reset-password
 */
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;
