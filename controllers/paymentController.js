// controllers/paymentController.js
const { Payment, Booking } = require('../models');

module.exports = {
  webhook: async (req, res) => {
    // Implement the gateway webhook processing here
    // For razorpay, verify signature, then update Payment and Booking
    res.json({ message: 'Webhook received (implement logic)' });
  }
};
