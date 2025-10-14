// routes/reviews.js
const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

/**
 * @route POST /api/reviews
 */
router.post('/', authenticateToken, ctrl.addReview);

/**
 * @route GET /api/reviews/hotel/:hotelId
 */
router.use(authenticateToken);
router.get('/hotel/:hotelId', ctrl.listReviewsForHotel);

/**
 * @route POST /api/reviews/:reviewId/moderate
 */
router.post('/:reviewId/moderate', authenticateToken, requireRole(['ADMIN']), ctrl.moderateReview);

module.exports = router;
