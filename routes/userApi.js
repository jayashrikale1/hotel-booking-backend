// routes/userApi.js - USER ONLY API ENDPOINTS
const router = require('express').Router();
const userCtrl = require('../controllers/userController');
const couponCtrl = require('../controllers/couponController');
const { authenticate, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: User API
 *   description: User operations - hotel browsing, bookings, reviews
 */

// ============ USER AUTHENTICATION API ============
const userAuthRoutes = require('./userAuth');
router.use('/auth', userAuthRoutes);

// All user routes require authentication
router.use(authenticate, requireRole(['USER', 'OWNER', 'VENDOR', 'ADMIN']));

/**
 * @swagger
 * /api/user/hotels/{hotelId}:
 *   get:
 *     summary: Get hotel details by ID
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hotel details retrieved successfully
 */
router.get('/hotels/:hotelId', userCtrl.getHotelById);




// Room-based endpoints removed; schema no longer present

// Room-based endpoints removed; schema no longer present

/**
 * @swagger
 * /api/user/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - room_type
 *               - check_in
 *               - check_out
 *             properties:
 *               hotel_id:
 *                 type: integer
 *                 description: ID of the hotel
 *                 example: 1
 *               room_type:
 *                 type: string
 *                 enum: [AC, NON_AC]
 *                 description: Type of room (AC or NON_AC)
 *                 example: AC
 *               check_in:
 *                 type: string
 *                 format: date
 *                 description: Check-in date (YYYY-MM-DD)
 *                 example: "2025-12-28"
 *               check_out:
 *                 type: string
 *                 format: date
 *                 description: Check-out date (YYYY-MM-DD)
 *                 example: "2025-12-30"
 *               guests:
 *                 type: integer
 *                 default: 1
 *                 description: Number of guests
 *                 example: 2
 *               coupon_code:
 *                 type: string
 *                 description: Optional coupon code for discount
 *                 example: "WELCOME2025"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Booking created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     booking:
 *                       $ref: '#/components/schemas/Booking'
 *                     price_per_night:
 *                       type: number
 *                       description: Price per night used for calculation
 *                     amount:
 *                       type: number
 *                       description: Final booking amount after discount
 *                     base_amount:
 *                       type: number
 *                       description: Original booking amount
 *                     discount_amount:
 *                       type: number
 *                       description: Discount applied
 *                     nights:
 *                       type: integer
 *                       description: Number of nights
 *                     coupon_applied:
 *                       type: string
 *                       description: Applied coupon code if any
 *   get:
 *     summary: Get my bookings
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *         description: Filter by booking status
 *     responses:
 *       200:
 *         description: List of user bookings with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bookings retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */
router.post('/bookings', userCtrl.createBooking);
router.get('/bookings', userCtrl.getMyBookings);

/**
 * @swagger
 * /api/user/bookings/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 */
router.get('/bookings/:bookingId', userCtrl.getBookingById);

/**
 * @swagger
 * /api/user/payment-key:
 *   get:
 *     summary: Get Razorpay key ID
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment key retrieved
 */
router.get('/payment-key', userCtrl.getPaymentKey);

/**
 * @swagger
 * /api/user/bookings/{bookingId}/pay:
 *   post:
 *     summary: Initiate payment for a booking (creates Razorpay order)
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment initiated with order details
 */
router.post('/bookings/:bookingId/pay', userCtrl.initiatePayment);

/**
 * @swagger
 * /api/user/bookings/{bookingId}/payment/complete:
 *   post:
 *     summary: Complete payment (test) and update booking status
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gateway_payment_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [success, failed]
 *     responses:
 *       200:
 *         description: Payment updated successfully
 */
router.post('/bookings/:bookingId/payment/complete', userCtrl.completePayment);

/**
 * @swagger
 * /api/user/bookings/{bookingId}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 */
router.post('/bookings/:bookingId/cancel', userCtrl.cancelBooking);

/**
 * @swagger
 * /api/user/reviews:
 *   post:
 *     summary: Create a review for a hotel
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotel_id
 *               - rating
 *               - comment
 *             properties:
 *               hotel_id:
 *                 type: integer
 *                 description: ID of the hotel to review
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 description: Review comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: User has already reviewed this hotel
 *   get:
 *     summary: Get my reviews
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Reviews retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 */
router.post('/reviews', userCtrl.createReview);
router.get('/reviews', userCtrl.getMyReviews);

/**
 * @swagger
 * /api/user/reviews/{reviewId}:
 *   put:
 *     summary: Update a review
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *   delete:
 *     summary: Delete a review
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.put('/reviews/:reviewId', userCtrl.updateReview);
router.delete('/reviews/:reviewId', userCtrl.deleteReview);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *   put:
 *     summary: Update user profile
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               address:
 *                 type: string
 *                 description: User's address
 *               profile_photo:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo image file
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 */
router.get('/profile', userCtrl.getProfile);
router.put('/profile', upload.single('profile_photo'), userCtrl.updateProfile);

/**
 * @swagger
 * /api/user/payments/initiate:
 *   post:
 *     summary: Initiate payment for booking
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *               - amount
 *             properties:
 *               booking_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 */
router.post('/payments/initiate', (req, res) => {
  res.json({ message: 'User payment initiation endpoint' });
});

/**
 * @swagger
 * /api/user/payments:
 *   get:
 *     summary: Get user payments
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user payments
 */
router.get('/payments', (req, res) => {
  res.json({ message: 'User payments list endpoint' });
});

/**
 * @swagger
 * /api/user/payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get('/payments/:paymentId', (req, res) => {
  res.json({ message: 'User payment details endpoint' });
});

// ============ COUPON API ============
/**
 * @swagger
 * /api/user/coupons/available:
 *   get:
 *     summary: Get available coupons for a vendor
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID to get coupons for
 *     responses:
 *       200:
 *         description: List of available coupons
 */
router.get('/coupons/available', couponCtrl.getAvailableCoupons);

/**
 * @swagger
 * /api/user/coupons/apply:
 *   post:
 *     summary: Apply/validate coupon code
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - vendor_id
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SAVE20"
 *               vendor_id:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Coupon validated successfully
 */
router.post('/coupons/apply', couponCtrl.applyCoupon);

/**
 * @swagger
 * /api/user/wishlist/hotels/{hotelId}:
 *   post:
 *     summary: Add hotel to wishlist
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hotel added to wishlist
 *   delete:
 *     summary: Remove hotel from wishlist
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hotel removed from wishlist
 */
router.post('/wishlist/hotels/:hotelId', (req, res) => {
  res.json({ message: 'Add hotel to wishlist endpoint' });
});

/**
 * @swagger
 * /api/user/wishlist:
 *   get:
 *     summary: Get user wishlist
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 */
router.get('/wishlist', (req, res) => {
  res.json({ message: 'User wishlist endpoint' });
});

router.delete('/wishlist/hotels/:hotelId', (req, res) => {
  res.json({ message: 'Remove hotel from wishlist endpoint' });
});

module.exports = router;
