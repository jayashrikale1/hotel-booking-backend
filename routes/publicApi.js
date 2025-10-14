// routes/publicApi.js - PUBLIC API ENDPOINTS (NO AUTHENTICATION REQUIRED)
const router = require('express').Router();
const userCtrl = require('../controllers/userController');

// ============ PUBLIC HOTEL BROWSING API ============
// These endpoints are accessible without authentication

// Browse all approved hotels
router.get('/hotels', userCtrl.getAllHotels);

// Search hotels with filters
router.get('/hotels/search', userCtrl.searchHotels);

// Get specific hotel details
router.get('/hotels/:hotelId', userCtrl.getHotelById);

// Get rooms for a specific hotel
router.get('/hotels/:hotelId/rooms', userCtrl.getRoomsByHotel);

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

module.exports = router;
