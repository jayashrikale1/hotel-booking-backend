// routes/publicApi.js - PUBLIC API ENDPOINTS (NO AUTHENTICATION REQUIRED)
const router = require('express').Router();
const userCtrl = require('../controllers/userController');
const couponCtrl = require('../controllers/couponController');
const paymentCtrl = require('../controllers/paymentController');

// ============ PUBLIC HOTEL BROWSING API ============
// These endpoints are accessible without authentication

// Browse all approved hotels
router.get('/hotels', userCtrl.searchHotels);

// Search hotels with filters
router.get('/hotels/search', userCtrl.searchHotels);

// Get specific hotel details
router.get('/hotels/:hotelId', userCtrl.getHotelById);

// Get rooms for a specific hotel
router.get('/hotels/:hotelId/rooms', userCtrl.getRoomsByHotel);

/**
 * @swagger
 * /api/public/hotels/{hotelId}/room-types:
 *   get:
 *     summary: Get hotel room types with prices and availability
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the hotel
 *       - in: query
 *         name: check_in
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional check-in date (YYYY-MM-DD) to compute availability
 *       - in: query
 *         name: check_out
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional check-out date (YYYY-MM-DD) to compute availability
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional hotel name to verify/search
 *     responses:
 *       200:
 *         description: Room types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     hotel_id:
 *                       type: integer
 *                     types:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [AC, NON_AC]
 *                           price_per_night:
 *                             type: number
 *                           total:
 *                             type: integer
 *                           available:
 *                             type: integer
 */
router.get('/hotels/:hotelId/room-types', userCtrl.getHotelRoomTypes);

// Get specific room details
router.get('/rooms/:roomId', userCtrl.getRoomById);

// ============ PUBLIC INFORMATION API ============

// Get hotel amenities list
router.get('/amenities', (req, res) => {
  res.json({
    amenities: [
      'WiFi', 'Parking', 'Pool', 'Gym', 'Spa', 'Restaurant', 
      'Room Service', 'Laundry', 'Air Conditioning', 'TV',
      'Mini Bar', 'Balcony', 'Kitchen', 'Pet Friendly'
    ]
  });
});

// Get cities with hotels
router.get('/cities', (req, res) => {
  res.json({
    cities: [
      'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
      'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Goa'
    ]
  });
});

// Get room types
router.get('/room-types', (req, res) => {
  res.json({
    roomTypes: [
      'Standard', 'Deluxe', 'Premium', 'Suite', 'Executive',
      'Family Room', 'Twin Room', 'Single Room', 'Double Room'
    ]
  });
});

// Health check for public API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Public API is running',
    timestamp: new Date().toISOString()
  });
});

// Get payment key
router.get('/payment-key', paymentCtrl.getPaymentKey);

// ============ PUBLIC COUPON API ============
/**
 * @swagger
 * /api/public/coupons:
 *   get:
 *     summary: Get all active global coupons
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Available coupons retrieved successfully
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
 *                     coupons: { type: array, items: { $ref: '#/components/schemas/Coupon' } }
 *                     count: { type: integer }
 */
router.get('/coupons', couponCtrl.getAvailableCoupons);

module.exports = router;
