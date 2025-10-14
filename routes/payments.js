// routes/payments.js
const router = require('express').Router();
const ctrl = require('../controllers/paymentController');

// webhook endpoint for gateways
router.post('/webhook', ctrl.webhook);

module.exports = router;
