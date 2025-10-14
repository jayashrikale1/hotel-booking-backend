// routes/userAuth.js
const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: User Authentication
 *   description: User authentication and account management
 */

/**
 * @swagger
 * /api/user/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request - Missing fields or email exists
 */
router.post('/register', userAuthController.register);

/**
 * @swagger
 * /api/user/auth/login:
 *   post:
 *     tags: [User Authentication]
 *     summary: User login
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
 *         description: User login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid user credentials
 *       403:
 *         description: Account suspended
 */
router.post('/login', userAuthController.login);

/**
 * @swagger
 * /api/user/auth/forgot:
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
router.post('/change-password', authenticateToken, requireRole(['USER']), userAuthController.changePassword);

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

module.exports = router;
