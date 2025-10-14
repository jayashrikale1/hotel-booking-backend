// routes/adminAuth.js
const router = require('express').Router();
const ctrl = require('../controllers/adminAuthController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

/**
 * @swagger
 * /api/admin/auth/register:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Admin registration (NO authentication required)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "Password123"
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 admin:
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
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request - Missing fields or validation error
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Server error
 */
router.post('/register', ctrl.register);

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Admin login
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
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 admin:
 *                   type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post('/login', ctrl.login);

/**
 * @swagger
 * /api/admin/auth/forgot:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Admin forgot password (NO authentication required)
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
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent (or not, for security)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/forgot', ctrl.forgotPassword);

/**
 * @swagger
 * /api/admin/auth/reset-password:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Admin reset password with token (NO authentication required)
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
 *                 description: "Reset token received in email"
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword123"
 *     responses:
 *       200:
 *         description: Admin password reset successfully
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', ctrl.resetPassword);

/**
 * @swagger
 * /api/admin/auth/change-password:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Admin change password (requires authentication)
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
 *                 example: "OldPassword123"
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewPassword123"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Unauthorized or missing token
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.post('/change-password', authenticateToken, requireRole(['ADMIN']), ctrl.changePassword);

/**
 * @swagger
 * /api/admin/auth/logout:
 *   post:
 *     tags: [Admin Authentication]
 *     summary: Admin logout (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/logout', authenticateToken, requireRole(['ADMIN']), ctrl.logout);

module.exports = router;