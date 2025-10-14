// controllers/reviewController.js
const { Review } = require('../models');

module.exports = {
  addReview: async (req, res) => {
    try {
      const { hotel_id, rating, comment } = req.body;
      const review = await Review.create({ user_id: req.user.id, hotel_id, rating, comment, status: 'PENDING' });
      res.json({ review });
    } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
  },

  listReviewsForHotel: async (req, res) => {
    try {
      const reviews = await Review.findAll({ where: { hotel_id: req.params.hotelId, status: 'APPROVED' } });
      res.json({ reviews });
    } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
  },

  moderateReview: async (req, res) => {
    try {
      const review = await Review.findByPk(req.params.reviewId);
      if (!review) return res.status(404).json({ message: 'Not found' });
      review.status = req.body.status || 'APPROVED';
      await review.save();
      res.json({ review });
    } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
  }
};
