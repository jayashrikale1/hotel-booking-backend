// routes/hotels.js - PUBLIC ROUTES ONLY
const router = require('express').Router();
const userCtrl = require('../controllers/userController');

// ============ PUBLIC HOTEL BROWSING ============
// These routes are for public hotel browsing (no authentication required)
router.get('/', userCtrl.searchHotels);
router.get('/search', userCtrl.searchHotels);
router.get('/:hotelId', userCtrl.getHotelById);
// router.get('/:hotelId/rooms', userCtrl.getRoomsByHotel);

// Note: Hotel management routes have been moved to:
// - /api/admin/* for admin operations
// - /api/vendor/* for vendor/owner operations
// - /api/user/* for user operations

module.exports = router;
