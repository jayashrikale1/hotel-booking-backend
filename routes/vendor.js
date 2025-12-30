// routes/vendor.js
const router = require('express').Router();
const ctrl = require('../controllers/vendorController');
const { authenticate, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.use(authenticate, requireRole(['OWNER', 'VENDOR', 'ADMIN']));

// ============ HOTEL MANAGEMENT ============
router.post('/hotels', requireRole(['VENDOR']), ctrl.createHotel);
router.get('/hotels', ctrl.getMyHotels);
router.get('/hotels/:hotelId', ctrl.getHotelById);
router.put('/hotels/:hotelId', ctrl.updateHotel);
router.delete('/hotels/:hotelId', ctrl.deleteHotel);

// ============ HOTEL IMAGE MANAGEMENT ============
router.post('/hotels/:hotelId/images', upload.array('images', 10), ctrl.uploadHotelImages);
router.delete('/images/:imageId', ctrl.deleteHotelImage);

// ============ BOOKING MANAGEMENT ============
router.get('/bookings', ctrl.getMyBookings);
router.get('/bookings/:bookingId', ctrl.getBookingById);
router.put('/bookings/:bookingId/status', ctrl.updateBookingStatus);

// ============ ANALYTICS & REPORTS ============
router.get('/dashboard/stats', ctrl.getDashboardStats);
router.get('/reports/revenue', ctrl.getRevenueReport);

module.exports = router;
