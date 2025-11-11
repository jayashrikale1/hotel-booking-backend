// routes/reviews.js
const router = require('express').Router();
const ctrl = require('../controllers/reviewController');
const { authenticate, requireRole } = require('../middlewares/auth');

/**
 * @route POST /api/reviews
 */
router.post('/', authenticate, ctrl.addReview);

/**
 * @route GET /api/reviews/hotel/:hotelId
 */
router.use(authenticate);
router.get('/hotel/:hotelId', ctrl.listReviewsForHotel);

/**
 * @route POST /api/reviews/:reviewId/moderate
 */
router.post('/:reviewId/moderate', authenticate, requireRole(['ADMIN']), ctrl.moderateReview);

module.exports = router;
