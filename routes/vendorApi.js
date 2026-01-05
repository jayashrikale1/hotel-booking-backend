// routes/vendorApi.js - VENDOR/OWNER ONLY API ENDPOINTS
const router = require('express').Router();
const vendorCtrl = require('../controllers/vendorController');
const { authenticate, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: Vendor API
 *   description: Vendor/Hotel owner operations - hotel management, bookings, analytics
 */


/**
 * @swagger
 * /api/vendor/public/hotels:
 *   get:
 *     summary: Get all approved hotels (public)
 *     tags: [Public]
 *     description: Returns a list of all approved hotels with full details including vendor, images, and rooms.
 *     parameters:
 *       - name: city
 *         in: query
 *         description: Filter by city name
 *         schema:
 *           type: string
 *       - name: state
 *         in: query
 *         description: Filter by state name
 *         schema:
 *           type: string
 *       - name: country
 *         in: query
 *         description: Filter by country name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of approved hotels with all details
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
 *                     hotels:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Hotel'
 */
router.get('/public/hotels', vendorCtrl.getAllHotelsPublic);



/**
 * @swagger
 * /api/vendor/public/hotels/{hotelId}:
 *   get:
 *     summary: Get hotel by ID (public)
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Hotel details
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
 *                     hotel:
 *                       $ref: '#/components/schemas/Hotel'
 */
router.get('/public/hotels/:hotelId', vendorCtrl.getHotelByIdPublic);


// ============ VENDOR AUTHENTICATION API ============
const vendorAuthRoutes = require('./vendorAuth');
router.use('/auth', vendorAuthRoutes);

// All vendor routes require OWNER/VENDOR role
router.use(authenticate, requireRole(['OWNER', 'VENDOR', 'ADMIN']));

// ============ PROFILE MANAGEMENT ============
/**
 * @swagger
 * /api/vendor/profile:
 *   get:
 *     summary: Get vendor profile
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
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
 *                         status: { type: string }
 *   put:
 *     summary: Update vendor profile
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name: { type: string }
 *               phone: { type: string }
 *               business_name: { type: string }
 *               business_address: { type: string }
 *     responses:
 *       200:
 *         description: Vendor profile updated successfully
 */
router.get('/profile', vendorCtrl.getVendorProfile);
router.put('/profile', vendorCtrl.updateVendorProfile);

/**
 * @swagger
 * /api/vendor/hotels:
 *   post:
 *     summary: Create a new hotel
 *     tags: [Vendor API]
 *     description: Creates a new hotel. Note that vendor_id and status are set automatically. Status is admin-controlled.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, city]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Grand Plaza Hotel
 *               description:
 *                 type: string
 *                 example: A luxurious 5-star hotel in the heart of the city
 *               address:
 *                 type: string
 *                 example: 123 Main Street
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               pincode:
 *                 type: string
 *                 example: "400001"
 *               country:
 *                 type: string
 *                 example: India
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 19.0760
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 72.8777
 *               map_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://maps.google.com/?q=19.0760,72.8777"
 *               amenities:
 *                 description: List of amenities (array or comma-separated string)
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                     example: ["WiFi","Pool","Gym","Spa","Restaurant","Parking"]
 *                   - type: string
 *                     example: "WiFi, Pool, Gym, Spa, Restaurant, Parking"
 *               hotel_features:
 *                 description: Key features of the hotel (array or comma-separated string)
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                     example: ["Sea View","Airport Shuttle","Pet Friendly"]
 *                   - type: string
 *                     example: "Sea View, Airport Shuttle, Pet Friendly"
 *               phone:
 *                 type: string
 *                 example: "+91-22-12345678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@grandplaza.com
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 4.5
 *               total_rooms:
 *                 type: integer
 *                 example: 50
 *               available_rooms:
 *                 type: integer
 *                 example: 50
 *               ac_rooms:
 *                 type: integer
 *                 example: 25
 *               non_ac_rooms:
 *                 type: integer
 *                 example: 25
 *               base_price:
 *                 type: number
 *                 format: float
 *                 example: 2499.00
 *               ac_room_price:
 *                 type: number
 *                 format: float
 *                 example: 3499.00
 *               non_ac_room_price:
 *                 type: number
 *                 format: float
 *                 example: 2499.00
 *               check_in_time:
 *                 type: string
 *                 example: "12:00 PM"
 *               check_out_time:
 *                 type: string
 *                 example: "11:00 AM"
 *               cancellation_policy:
 *                 type: string
 *                 example: "Free cancellation up to 24 hours before check-in"
 *               gst_number:
 *                 type: string
 *                 example: "27AAAAA0000A1Z5"
 *               featured:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *   get:
 *     summary: Get all hotels created by the logged-in vendor
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vendor hotels
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Hotel'
 *                     pagination:
 *                       type: object
 */
router.post('/hotels', requireRole(['VENDOR']), vendorCtrl.createHotel);
router.get('/hotels', requireRole(['VENDOR']), vendorCtrl.getMyHotels);


/**
 * @swagger
 * /api/vendor/hotels/{hotelId}:
 *   get:
 *     summary: Get hotel by ID
 *     tags: [Vendor API]
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     hotel:
 *                       $ref: '#/components/schemas/Hotel'
 *   put:
 *     summary: Update hotel details
 *     tags: [Vendor API]
 *     description: Update hotel details. Note that status and vendor_id cannot be changed by vendor.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the hotel to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Grand Plaza Hotel - Renovated
 *               description:
 *                 type: string
 *                 example: A luxurious 5-star hotel in the heart of the city with newly renovated facilities
 *               address:
 *                 type: string
 *                 example: 123 Main Street
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               country:
 *                 type: string
 *                 example: India
 *               pincode:
 *                 type: string
 *                 example: "400001"
 *               latitude:
 *                 type: number
 *                 format: float
 *                 example: 19.0760
 *               longitude:
 *                 type: number
 *                 format: float
 *                 example: 72.8777
 *               amenities:
 *                 description: List of amenities (array or comma-separated string)
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                     example: ["WiFi","Pool","Gym","Spa","Restaurant","Parking","Conference Room"]
 *                   - type: string
 *                     example: "WiFi, Pool, Gym, Spa, Restaurant, Parking, Conference Room"
 *               hotel_features:
 *                 description: Key features of the hotel (array or comma-separated string)
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                     example: ["Sea View","Airport Shuttle","Pet Friendly"]
 *                   - type: string
 *                     example: "Sea View, Airport Shuttle, Pet Friendly"
 *               phone:
 *                 type: string
 *                 example: "+91-22-12345678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contact@grandplaza.com
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 4.7
 *               total_rooms:
 *                 type: integer
 *                 example: 55
 *               available_rooms:
 *                 type: integer
 *                 example: 48
 *               ac_rooms:
 *                 type: integer
 *                 example: 28
 *               non_ac_rooms:
 *                 type: integer
 *                 example: 27
 *               base_price:
 *                 type: number
 *                 format: float
 *                 example: 2699.00
 *               ac_room_price:
 *                 type: number
 *                 format: float
 *                 example: 3699.00
 *               non_ac_room_price:
 *                 type: number
 *                 format: float
 *                 example: 2699.00
 *               check_in_time:
 *                 type: string
 *                 example: "12:00 PM"
 *               check_out_time:
 *                 type: string
 *                 example: "11:00 AM"
 *               cancellation_policy:
 *                 type: string
 *                 example: "Free cancellation up to 48 hours before check-in"
 *               gst_number:
 *                 type: string
 *                 example: "27AAAAA0000A1Z5"
 *               featured:
 *                 type: boolean
 *                 example: false
 *             example:
 *             name: Grand Plaza Hotel - Renovated
 *             description: A luxurious 5-star hotel in the heart of the city with newly renovated facilities
 *             address: 123 Main Street
 *             city: Mumbai
 *             state: Maharashtra
 *             country: India
 *             pincode: "400001"
 *             latitude: 19.0760
 *             longitude: 72.8777
 *             map_url: "https://maps.google.com/?q=19.0760,72.8777"
 *             amenities: ["WiFi","Pool","Gym","Spa","Restaurant","Parking","Conference Room"]
 *             hotel_features: ["Sea View","Airport Shuttle","Pet Friendly"]
 *             phone: "+91-22-12345678"
 *             email: contact@grandplaza.com
 *             rating: 4.7
 *             total_rooms: 55
 *             available_rooms: 48
 *             ac_rooms: 28
 *             non_ac_rooms: 27
 *             base_price: 2699.00
 *             ac_room_price: 3699.00
 *             non_ac_room_price: 2699.00
 *             check_in_time: "12:00 PM"
 *             check_out_time: "11:00 AM"
 *             cancellation_policy: "Free cancellation up to 48 hours before check-in"
 *             gst_number: "27AAAAA0000A1Z5"
 *             featured: false
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *   delete:
 *     summary: Delete hotel
 *     tags: [Vendor API]
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
 *         description: Hotel deleted successfully
 */
router.get('/hotels/:hotelId', vendorCtrl.getHotelById);
router.put('/hotels/:hotelId', vendorCtrl.updateHotel);
router.delete('/hotels/:hotelId', vendorCtrl.deleteHotel);



// In routes/vendorApi.js
// Place this block just BEFORE the existing POST /hotels/{hotelId}/images

/**
 * @swagger
 * /api/vendor/hotels/{hotelId}/images:
 *   get:
 *     summary: Get hotel images
 *     tags: [Vendor API]
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
 *         description: Images retrieved successfully
 */
router.get('/hotels/:hotelId/images', vendorCtrl.getHotelImages);


/**
 * @swagger
 * /api/vendor/hotels/{hotelId}/images:
 *   post:
 *     summary: Upload hotel images
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post('/hotels/:hotelId/images', upload.array('images', 10), vendorCtrl.uploadHotelImages);

/**
 * @swagger
 * /api/vendor/images/{imageId}:
 *   delete:
 *     summary: Delete hotel image
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Image deleted successfully
 */
router.delete('/images/:imageId', vendorCtrl.deleteHotelImage);

/**
 * @swagger
 * /api/vendor/bookings:
 *   get:
 *     summary: Get my bookings
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vendor bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get('/bookings', vendorCtrl.getMyBookings);

/**
 * @swagger
 * /api/vendor/users/{userId}/bookings:
 *   get:
 *     summary: Get bookings of a specific user (scoped to current vendor)
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully (vendor scoped)
 */
router.get('/users/:userId/bookings', vendorCtrl.getUserBookings);

/**
 * @swagger
 * /api/vendor/bookings/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Vendor API]
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
router.get('/bookings/:bookingId', vendorCtrl.getBookingById);

/**
 * @swagger
 * /api/vendor/bookings/{bookingId}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Vendor API]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 */
router.put('/bookings/:bookingId/status', vendorCtrl.updateBookingStatus);

/**
 * @swagger
 * /api/vendor/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_hotels:
 *                   type: integer
 *                 total_rooms:
 *                   type: integer
 *                 total_bookings:
 *                   type: integer
 *                 total_revenue:
 *                   type: number
 *                   format: float
 *                 occupancy_rate:
 *                   type: number
 *                   format: float
 */
router.get('/dashboard/stats', vendorCtrl.getDashboardStats);

/**
 * @swagger
 * /api/vendor/reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *     responses:
 *       200:
 *         description: Revenue report data
 */
router.get('/reports/revenue', vendorCtrl.getRevenueReport);

/**
 * @swagger
 * /api/vendor/rooms/{roomId}/availability:
 *   put:
 *     summary: Update room availability
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availability
 *             properties:
 *               availability:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Room availability updated successfully
 */
// router.put('/rooms/:roomId/availability', (req, res) => {
//   res.json({ message: 'Vendor room availability update endpoint' });
// });

/**
 * @swagger
 * /api/vendor/inventory/summary:
 *   get:
 *     summary: Get inventory summary
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_rooms:
 *                   type: integer
 *                 available_rooms:
 *                   type: integer
 *                 occupied_rooms:
 *                   type: integer
 *                 maintenance_rooms:
 *                   type: integer
 */
// router.get('/inventory/summary', (req, res) => {
//   res.json({ message: 'Vendor inventory summary endpoint' });
// });

/**
 * @swagger
 * /api/vendor/rooms/{roomId}/pricing:
 *   put:
 *     summary: Update room pricing
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - price_per_night
 *             properties:
 *               price_per_night:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Room pricing updated successfully
 */
// router.put('/rooms/:roomId/pricing', (req, res) => {
//   res.json({ message: 'Vendor room pricing update endpoint' });
// });

/**
 * @swagger
 * /api/vendor/pricing/bulk-update:
 *   post:
 *     summary: Bulk update room pricing
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_ids
 *               - price_per_night
 *             properties:
 *               room_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               price_per_night:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Bulk pricing updated successfully
 */
// router.post('/pricing/bulk-update', (req, res) => {
//   res.json({ message: 'Vendor bulk pricing update endpoint' });
// });

/**
 * @swagger
 * /api/vendor/guests:
 *   get:
 *     summary: Get guest list
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of guests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/guests', (req, res) => {
  res.json({ message: 'Vendor guests list endpoint' });
});

/**
 * @swagger
 * /api/vendor/guests/{guestId}:
 *   get:
 *     summary: Get guest details
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guestId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Guest details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/guests/:guestId', (req, res) => {
  res.json({ message: 'Vendor guest details endpoint' });
});

/**
 * @swagger
 * /api/vendor/reviews:
 *   get:
 *     summary: Get hotel reviews
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hotel reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 */
router.get('/reviews', (req, res) => {
  res.json({ message: 'Vendor reviews list endpoint' });
});


/**
 * @swagger
 * /api/vendor/reviews/{reviewId}/respond:
 *   post:
 *     summary: Respond to a review
 *     tags: [Vendor API]
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
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response added successfully
 */
router.post('/reviews/:reviewId/respond', (req, res) => {
  res.json({ message: 'Vendor review response endpoint' });
});

/**
 * @swagger
 * /api/vendor/reports/bookings:
 *   get:
 *     summary: Get booking reports
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Booking reports data
 */
router.get('/reports/bookings', (req, res) => {
  res.json({ message: 'Vendor booking reports endpoint' });
});

/**
 * @swagger
 * /api/vendor/reports/occupancy:
 *   get:
 *     summary: Get occupancy reports
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Occupancy reports data
 */
router.get('/reports/occupancy', (req, res) => {
  res.json({ message: 'Vendor occupancy reports endpoint' });
});

/**
 * @swagger
 * /api/vendor/reports/financial:
 *   get:
 *     summary: Get financial reports
 *     tags: [Vendor API]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Financial reports data
 */
router.get('/reports/financial', (req, res) => {
  res.json({ message: 'Vendor financial reports endpoint' });
});

module.exports = router;
