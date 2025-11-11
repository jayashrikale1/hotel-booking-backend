// routes/user.js
const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate, requireRole(['USER', 'OWNER', 'VENDOR', 'ADMIN']));

// ============ HOTEL BROWSING ============
router.get('/hotels', ctrl.getAllHotels);
router.get('/hotels/search', ctrl.searchHotels);
router.get('/hotels/:hotelId', ctrl.getHotelById);

// ============ ROOM BROWSING ============
router.get('/hotels/:hotelId/rooms', ctrl.getRoomsByHotel);
router.get('/rooms/:roomId', ctrl.getRoomById);

// ============ BOOKING MANAGEMENT ============
router.post('/bookings', ctrl.createBooking);
router.get('/bookings', ctrl.getMyBookings);
router.get('/bookings/:bookingId', ctrl.getBookingById);
router.post('/bookings/:bookingId/cancel', ctrl.cancelBooking);

// ============ REVIEW MANAGEMENT ============
router.post('/reviews', ctrl.createReview);
router.get('/reviews', ctrl.getMyReviews);
router.put('/reviews/:reviewId', ctrl.updateReview);
router.delete('/reviews/:reviewId', ctrl.deleteReview);

// ============ USER PROFILE ============
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);

module.exports = router;
