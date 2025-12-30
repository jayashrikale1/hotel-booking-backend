// routes/rooms.js - DEPRECATED
// Room routes have been moved to role-specific route files:
// - /api/admin/rooms/* for admin operations
// - /api/vendor/rooms/* for vendor/owner operations  
// - /api/user/rooms/* for user operations
// - /api/hotels/:hotelId/rooms for public browsing

const router = require('express').Router();
const roomCtrl = require('../controllers/roomController');
const userCtrl = require('../controllers/userController');
const { authenticate, requireRole } = require('../middlewares/auth');

// ============ PUBLIC ROOM BROWSING ============
// Public room browsing (no authentication required)
// router.get('/rooms/:roomId', userCtrl.getRoomById);

// ============ LEGACY ROUTES (DEPRECATED) ============
// These routes are maintained for backward compatibility
// Use role-specific routes instead

// Legacy protected routes
// router.use(authenticate);

// DEPRECATED: Use /api/vendor/hotels/:hotelId/rooms instead
// router.post('/hotels/:hotelId/rooms', requireRole(['OWNER','VENDOR','ADMIN']), roomCtrl.addRoom);

// DEPRECATED: Use /api/vendor/rooms/:roomId or /api/admin/rooms/:roomId instead
// router.put('/rooms/:roomId', requireRole(['OWNER','VENDOR','ADMIN']), roomCtrl.updateRoom);
// router.delete('/rooms/:roomId', requireRole(['OWNER','VENDOR','ADMIN']), roomCtrl.deleteRoom);

// DEPRECATED: Use /api/hotels/:hotelId/rooms instead
// router.get('/hotels/:hotelId/rooms', roomCtrl.listRoomsByHotel);

module.exports = router;
