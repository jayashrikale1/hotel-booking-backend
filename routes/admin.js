// routes/admin.js
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middlewares/auth');

router.use(authenticate, requireRole(['ADMIN']));

// ============ USER MANAGEMENT ============
router.post('/users', ctrl.createUser);
router.get('/users', ctrl.getAllUsers);
router.get('/users/:userId', ctrl.getUserById);
router.put('/users/:userId', ctrl.updateUser);
router.delete('/users/:userId', ctrl.deleteUser);
router.post('/users/:userId/block', ctrl.blockUser);
router.post('/users/:userId/unblock', ctrl.unblockUser);

// ============ VENDOR MANAGEMENT ============
router.get('/vendors', ctrl.getVendors);
router.post('/vendors', ctrl.createVendor);
router.put('/vendors/:vendorId', ctrl.updateVendor);
router.delete('/vendors/:vendorId', ctrl.deleteVendor);

// ============ HOTEL MANAGEMENT ============
router.get('/hotels', ctrl.getAllHotels);
router.get('/hotels/:hotelId', ctrl.getHotelById);
router.put('/hotels/:hotelId', ctrl.updateHotel);
router.delete('/hotels/:hotelId', ctrl.deleteHotel);
router.post('/hotels/:hotelId/approve', ctrl.approveHotel);
router.post('/hotels/:hotelId/reject', ctrl.rejectHotel);

// ============ BOOKING MANAGEMENT ============
router.get('/bookings', ctrl.getAllBookings);
router.get('/bookings/:bookingId', ctrl.getBookingById);
router.put('/bookings/:bookingId', ctrl.updateBooking);
router.post('/bookings/:bookingId/cancel', ctrl.cancelBooking);

// ============ ROOM MANAGEMENT ============
// router.get('/rooms', ctrl.getAllRooms);
// router.get('/rooms/:roomId', ctrl.getRoomById);
// router.put('/rooms/:roomId', ctrl.updateRoom);
// router.delete('/rooms/:roomId', ctrl.deleteRoom);

// ============ DASHBOARD ============
router.get('/dashboard/stats', ctrl.getDashboardStats);

module.exports = router;
