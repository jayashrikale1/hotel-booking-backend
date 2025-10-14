// routes/userApi.js - USER ONLY API ENDPOINTS
const router = require('express').Router();
const userCtrl = require('../controllers/userController');
const couponCtrl = require('../controllers/couponController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

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
router.use(authenticateToken, requireRole(['USER', 'OWNER', 'VENDOR', 'ADMIN']));

/**
 * @swagger
 * /api/user/hotels:
 *   get:
 *     summary: Get all hotels
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 */
router.get('/hotels', userCtrl.getAllHotels);

/**
 * @swagger
 * /api/user/hotels/search:
 *   get:
 *     summary: Search hotels
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City to search in
 *       - in: query
 *         name: checkin
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-in date
 *       - in: query
 *         name: checkout
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/hotels/search', userCtrl.searchHotels);

/**
 * @swagger
 * /api/user/hotels/{hotelId}:
 *   get:
 *     summary: Get hotel by ID
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
 *         description: Hotel details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 */
router.get('/hotels/:hotelId', userCtrl.getHotelById);

/**
 * @swagger
 * /api/user/hotels/{hotelId}/rooms:
 *   get:
 *     summary: Get rooms by hotel
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
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get('/hotels/:hotelId/rooms', userCtrl.getRoomsByHotel);

/**
 * @swagger
 * /api/user/rooms/{roomId}:
 *   get:
 *     summary: Get room by ID
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 */
router.get('/rooms/:roomId', userCtrl.getRoomById);

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
 *               - room_id
 *               - check_in_date
 *               - check_out_date
 *               - guests
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               room_id:
 *                 type: integer
 *               check_in_date:
 *                 type: string
 *                 format: date
 *               check_out_date:
 *                 type: string
 *                 format: date
 *               guests:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *   get:
 *     summary: Get my bookings
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
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
 *     summary: Create a review
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
 *               - booking_id
 *               - rating
 *               - comment
 *             properties:
 *               hotel_id:
 *                 type: integer
 *               booking_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
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
 *               $ref: '#/components/schemas/User'
 *   put:
 *     summary: Update user profile
 *     tags: [User API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.get('/profile', userCtrl.getProfile);
router.put('/profile', userCtrl.updateProfile);

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