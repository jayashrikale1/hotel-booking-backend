// routes/userAuth.js
const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Classic email/password login removed in favor of OTP flows

/**
 * @swagger
 * /api/user/auth/signup:
 *   post:
 *     tags:
 *       - User Authentication
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: string
 *               profile_photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User registered successfully. Please verify your email with the OTP sent.
 *       400:
 *         description: Bad request
 */
// Accept optional profile photo upload at signup
router.post('/signup', upload.single('profile_photo'), userAuthController.signup);

/**
 * @swagger
 * /api/user/auth/login-mobile/request-otp:
 *   post:
 *     tags: [User Authentication]
 *     summary: Request OTP for mobile login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent to mobile
 */
router.post('/login-mobile/request-otp', userAuthController.requestMobileLoginOtp);

/**
 * @swagger
 * /api/user/auth/login-mobile:
 *   post:
 *     tags: [User Authentication]
 *     summary: Login with mobile number and password (no OTP)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful with token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login-mobile', userAuthController.loginWithMobilePassword);

/**
 * @swagger
 * /api/user/auth/verify-otp:
 *   post:
 *     tags: [User Authentication]
 *     summary: Verify mobile OTP to complete login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful with token
 */
router.post('/verify-otp', userAuthController.verifyLoginOtp);

/**
 * @swagger
 * /api/user/auth/forgot-password:
 *   post:
 *     tags: [User Authentication]
 *     summary: User forgot password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *       404:
 *         description: User account not found
 *       500:
 *         description: Failed to send reset email
 */
router.post('/forgot-password', userAuthController.forgotPassword);

/**
 * @swagger
 * /api/user/auth/change-password:
 *   post:
 *     tags: [User Authentication]
 *     summary: User change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [old_password, new_password]
 *             properties:
 *               old_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: User password updated successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', authenticate, requireRole(['USER']), upload.none(), userAuthController.changePassword);

/**
 * @swagger
 * /api/user/auth/reset-password:
 *   post:
 *     tags: [User Authentication]
 *     summary: User reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password]
 *             properties:
 *               token:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: User password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', userAuthController.resetPassword);

router.get('/profile', authenticate, requireRole(['USER']), userController.getProfile);
router.put('/profile', authenticate, requireRole(['USER']), upload.single('profile_photo'), userController.updateProfile);


/**
 * @swagger
 * /api/user/auth/logout:
 *   post:
 *     tags: [User Authentication]
 *     summary: User logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
// Logout (requires authentication)
router.post('/logout', authenticate, requireRole(['USER']), userAuthController.logout);

module.exports = router;
