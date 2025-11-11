// routes/vendorAuth.js
const express = require('express');
const router = express.Router();
const vendorAuthController = require('../controllers/vendorAuthController');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Vendor Authentication
 *   description: Vendor/Hotel owner authentication and account management
 */


/**
 * @swagger
 * /api/vendor/auth/login:
 *   post:
 *     tags: [Vendor Authentication]
 *     summary: Vendor login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vendor login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     full_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid vendor credentials
 *       403:
 *         description: Account pending approval or suspended
 */
router.post('/login', vendorAuthController.login);

/**
 * @swagger
 * /api/vendor/auth/forgot:
 *   post:
 *     tags: [Vendor Authentication]
 *     summary: Vendor forgot password
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
 *         description: Vendor account not found
 *       500:
 *         description: Failed to send reset email
 */
router.post('/forgot-password', vendorAuthController.forgotPassword);

/**
 * @swagger
 * /api/vendor/auth/change-password:
 *   post:
 *     tags: [Vendor Authentication]
 *     summary: Vendor change password
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
 *         description: Vendor password updated successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', authenticate, requireRole(['VENDOR']), vendorAuthController.changePassword);

/**
 * @swagger
 * /api/vendor/auth/reset-password:
 *   post:
 *     tags: [Vendor Authentication]
 *     summary: Vendor reset password with token
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
 *         description: Vendor password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', vendorAuthController.resetPassword);

/**
 * @swagger
 * /api/vendor/auth/logout:
 *   post:
 *     tags: [Vendor Authentication]
 *     summary: Vendor logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, requireRole(['VENDOR']), vendorAuthController.logout);

module.exports = router;
