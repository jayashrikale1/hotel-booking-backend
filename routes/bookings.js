// routes/bookings.js - LEGACY ROUTES (DEPRECATED)
// Booking routes have been moved to role-specific route files:
// - /api/user/bookings/* for user booking operations
// - /api/vendor/bookings/* for vendor booking management
// - /api/admin/bookings/* for admin booking management

const router = require('express').Router();
const ctrl = require('../controllers/bookingController');
const { authenticate, requireRole } = require('../middlewares/auth');

// ============ LEGACY ROUTES (DEPRECATED) ============
// These routes are maintained for backward compatibility
// Use role-specific routes instead

/**
 * @route POST /api/bookings
 * @deprecated Use /api/user/bookings instead
 */
router.post('/', authenticate, requireRole(['USER']), ctrl.createBooking);

/**
 * @route POST /api/bookings/complete
 * @deprecated Use payment gateway webhooks instead
 */
router.post('/complete', ctrl.completePayment);

/**
 * @route GET /api/bookings/my
 * @deprecated Use /api/user/bookings instead
 */
router.get('/my', authenticate, ctrl.getMyBookings);

/**
 * @route GET /api/bookings/owner
 * @deprecated Use /api/vendor/bookings instead
 */
router.get('/owner', authenticate, requireRole(['OWNER', 'VENDOR']), ctrl.ownerBookings);

/**
 * @route POST /api/bookings/:bookingId/cancel
 * @deprecated Use /api/user/bookings/:bookingId/cancel instead
 */
router.post('/:bookingId/cancel', authenticate, ctrl.cancelBooking);

module.exports = router;
