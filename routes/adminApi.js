// routes/adminApi.js - ADMIN ONLY API ENDPOINTS
const router = require('express').Router();
const adminCtrl = require('../controllers/adminController');
const couponCtrl = require('../controllers/couponController');
const { authenticate, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// ============ ADMIN AUTHENTICATION API ============
const adminAuthRoutes = require('./adminAuth');
router.use('/auth', adminAuthRoutes);

// Authenticate all admin routes
router.use(authenticate);

// ============ USER MANAGEMENT API (ADMIN + VENDOR ACCESS) ============
router.post('/users', requireRole(['ADMIN','VENDOR']), adminCtrl.createUser);

/**
 * @swagger
 * /api/admin/users/paginated:
 *   get:
 *     summary: Get users (paginated)
 *     tags: [Admin - Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by full_name, email, or phone
 *       - in: query
 *         name: is_active
 *         schema: { type: boolean }
 *       - in: query
 *         name: is_verified
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users/paginated', requireRole(['ADMIN','VENDOR']), adminCtrl.getUsersPaginated);

router.get('/users', requireRole(['ADMIN','VENDOR']), adminCtrl.getAllUsers);
router.get('/users/:userId', requireRole(['ADMIN','VENDOR']), adminCtrl.getUserById);
router.put('/users/:userId', requireRole(['ADMIN','VENDOR']), adminCtrl.updateUser);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Admin - Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active: { type: boolean }
 *               is_verified: { type: boolean }
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.patch('/users/:userId/status', requireRole(['ADMIN','VENDOR']), adminCtrl.updateUserStatus);

router.delete('/users/:userId', requireRole(['ADMIN','VENDOR']), adminCtrl.deleteUser);
router.post('/users/:userId/block', requireRole(['ADMIN','VENDOR']), adminCtrl.blockUser);
router.post('/users/:userId/unblock', requireRole(['ADMIN','VENDOR']), adminCtrl.unblockUser);

/**
 * @swagger
 * /api/admin/users/{userId}/bookings:
 *   get:
 *     summary: Get all bookings of a specific user (paginated)
 *     tags: [Admin - Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED] }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: Filter by check-in date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: Filter by check-in date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
 */
router.get('/users/:userId/bookings', requireRole(['ADMIN','VENDOR']), adminCtrl.getUserBookings);

// ============ VENDOR MANAGEMENT API (ADMIN + VENDOR ACCESS FOR GET) ============
/**
 * @swagger
 * /api/admin/vendors:
 *   get:
 *     summary: Get all vendors with pagination
 *     tags: [Admin - Vendors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, ACTIVE, SUSPENDED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search full_name, email, phone, business_name
 *     responses:
 *       200:
 *         description: Vendors retrieved
 */
router.get('/vendors', requireRole(['ADMIN']), adminCtrl.getVendors);

/**
 * @swagger
 * /api/admin/vendors/{vendorId}:
 *   get:
 *     summary: Get vendor by ID (accessible by Admin and Vendor)
 *     tags: [Admin - Vendors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema: { type: integer }
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     vendor:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         full_name: { type: string }
 *                         email: { type: string }
 *                         phone: { type: string }
 *                         business_name: { type: string }
 *                         business_address: { type: string }
 *                         status: { type: string, enum: [PENDING, ACTIVE, SUSPENDED] }
 *                         hotelsCount: { type: integer }
 *                         createdAt: { type: string, format: date-time }
 *                         updatedAt: { type: string, format: date-time }
 *       404:
 *         description: Vendor not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Vendor role required
 */
router.get('/vendors/:vendorId', requireRole(['ADMIN', 'VENDOR']), adminCtrl.getVendorById);

/**
 * @swagger
 * /api/admin/vendors/{vendorId}/hotels:
 *   get:
 *     summary: Get all hotels of a specific vendor
 *     tags: [Admin - Vendors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED, INACTIVE] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, address, or city
 *     responses:
 *       200:
 *         description: Vendor hotels retrieved successfully
 */
router.get('/vendors/:vendorId/hotels', requireRole(['ADMIN']), adminCtrl.getVendorHotels);

// ============ ALL ROUTES BELOW REQUIRE ADMIN ROLE ONLY ============
router.use(requireRole(['ADMIN']));

/**
 * @swagger
 * /api/admin/vendors:
 *   post:
 *     summary: Create vendor
 *     tags: [Admin - Vendors]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, password]
 *             properties:
 *               full_name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               business_name: { type: string }
 *               business_address: { type: string }
 *               status: { type: string, enum: [PENDING, ACTIVE, SUSPENDED] }
 *     responses:
 *       201:
 *         description: Vendor created
 */
router.post('/vendors', adminCtrl.createVendor);

/**
 * @swagger
 * /api/admin/vendors/{vendorId}:
 *   put:
 *     summary: Update vendor
 *     tags: [Admin - Vendors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string }
 *               business_name: { type: string }
 *               business_address: { type: string }
 *               status: { type: string, enum: [PENDING, ACTIVE, SUSPENDED] }
 *     responses:
 *       200:
 *         description: Vendor updated
 */
router.put('/vendors/:vendorId', adminCtrl.updateVendor);

/**
 * @swagger
 * /api/admin/vendors/{vendorId}/activate:
 *   post:
 *     summary: Activate vendor (set status to ACTIVE)
 *     tags: [Admin - Vendors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Vendor activated successfully
 *       400:
 *         description: Vendor is already active
 *       404:
 *         description: Vendor not found
 */
router.post('/vendors/:vendorId/activate', adminCtrl.activateVendor);

/**
 * @swagger
 * /api/admin/vendors/{vendorId}/deactivate:
 *   post:
 *     summary: Deactivate/Suspend vendor (set status to SUSPENDED)
 *     tags: [Admin - Vendors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Vendor suspended successfully
 *       400:
 *         description: Vendor is already suspended
 *       404:
 *         description: Vendor not found
 */
router.post('/vendors/:vendorId/deactivate', adminCtrl.deactivateVendor);

// ============ HOTEL MANAGEMENT API ============

/**
 * @swagger
 * /api/admin/hotels:
 *   get:
 *     summary: Get all hotels (Paginated)
 *     tags: [Admin - Hotels]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED, INACTIVE] }
 *       - in: query
 *         name: vendor_id
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, address, or city
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Hotels retrieved successfully
 */
router.get('/hotels', requireRole(['ADMIN']), adminCtrl.getAllHotels);
router.get('/hotels/:hotelId', requireRole(['ADMIN']), adminCtrl.getHotelById);
router.put('/hotels/:hotelId', requireRole(['ADMIN']), adminCtrl.updateHotel);
router.delete('/hotels/:hotelId', requireRole(['ADMIN']), adminCtrl.deleteHotel);
router.post('/hotels/:hotelId/approve', requireRole(['ADMIN']), adminCtrl.approveHotel);
router.post('/hotels/:hotelId/reject', requireRole(['ADMIN']), adminCtrl.rejectHotel);

/**
 * @swagger
 * /api/admin/hotels/{hotelId}/status:
 *   patch:
 *     summary: Update hotel status
 *     tags: [Admin - Hotels]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PENDING, APPROVED, REJECTED, INACTIVE] }
 *     responses:
 *       200:
 *         description: Hotel status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Hotel not found
 */
router.patch('/hotels/:hotelId/status', requireRole(['ADMIN']), adminCtrl.updateHotelStatus);

// ============ ROOM MANAGEMENT API ============
router.get('/rooms', adminCtrl.getAllRooms);
router.get('/rooms/:roomId', adminCtrl.getRoomById);
router.put('/rooms/:roomId', adminCtrl.updateRoom);
router.delete('/rooms/:roomId', adminCtrl.deleteRoom);

// ============ BOOKING MANAGEMENT API ============
/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Admin - Bookings]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by user name, email, hotel name or booking ID
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get('/bookings', requireRole(['ADMIN']), adminCtrl.getAllBookings);
router.get('/bookings/:bookingId', adminCtrl.getBookingById);
router.put('/bookings/:bookingId', adminCtrl.updateBooking);
router.post('/bookings/:bookingId/cancel', adminCtrl.cancelBooking);

// ============ ANALYTICS & REPORTS API ============
router.get('/dashboard/stats', adminCtrl.getDashboardStats);

// ============ REVIEW MODERATION API ============
router.get('/reviews', (req, res) => {
  // Admin can view all reviews
  res.json({ message: 'Admin reviews list endpoint' });
});

router.put('/reviews/:reviewId/moderate', (req, res) => {
  // Admin can moderate reviews
  res.json({ message: 'Admin review moderation endpoint' });
});

router.delete('/reviews/:reviewId', (req, res) => {
  // Admin can delete reviews
  res.json({ message: 'Admin review delete endpoint' });
});

// ============ PAYMENT MANAGEMENT API ============

/**
 * @swagger
 * /api/admin/payments:
 *   get:
 *     summary: Get all payments (Paginated)
 *     tags: [Admin - Payments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [INITIATED, SUCCESS, FAILED] }
 *       - in: query
 *         name: gateway
 *         schema: { type: string }
 *       - in: query
 *         name: booking_id
 *         schema: { type: integer }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date-time }
 *         description: Filter by creation date
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get('/payments', requireRole(['ADMIN']), adminCtrl.getAllPayments);

/**
 * @swagger
 * /api/admin/payments/{paymentId}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Admin - Payments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get('/payments/:paymentId', requireRole(['ADMIN']), adminCtrl.getPaymentById);

// ============ COUPON MANAGEMENT API (ADMIN ONLY) ============
/**
 * @swagger
 * /api/admin/coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Admin - Coupons]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *   post:
 *     summary: Create coupon
 *     tags: [Admin - Coupons]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, type, value]
 *             properties:
 *               code: { type: string }
 *               type: { type: string, enum: [PERCENT, FLAT] }
 *               value: { type: number }
 *               expiry: { type: string, format: date-time }
 *               usage_limit: { type: integer }
 *               active: { type: boolean }
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */
router.get('/coupons', requireRole(['ADMIN']), couponCtrl.getMyCoupons);
router.post('/coupons', requireRole(['ADMIN']), couponCtrl.createCoupon);

/**
 * @swagger
 * /api/admin/coupons/{couponId}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [Admin - Coupons]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: couponId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Coupon retrieved successfully
 *   put:
 *     summary: Update coupon
 *     tags: [Admin - Coupons]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: couponId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               type: { type: string, enum: [PERCENT, FLAT] }
 *               value: { type: number }
 *               expiry: { type: string, format: date-time }
 *               usage_limit: { type: integer }
 *               active: { type: boolean }
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *   delete:
 *     summary: Delete coupon
 *     tags: [Admin - Coupons]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: couponId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 */
router.get('/coupons/:couponId', requireRole(['ADMIN']), couponCtrl.getCouponById);
router.put('/coupons/:couponId', requireRole(['ADMIN']), couponCtrl.updateCoupon);
router.delete('/coupons/:couponId', requireRole(['ADMIN']), couponCtrl.deleteCoupon);

module.exports = router;
