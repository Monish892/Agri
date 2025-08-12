const express = require('express');
const { check } = require('express-validator');
const paymentController = require('../controllers/paymentcontroller');
const authMiddleware = require('../middleware/authmiddleware');

const router = express.Router();

router.post(
  '/create-order',
  [
    authMiddleware.verifyToken,
    authMiddleware.isFarmer,
    check('bookingId', 'Booking ID is required').isMongoId(),
  ],
  paymentController.createPaymentIntent
);

// Confirm PayPal payment (Farmer)
router.post(
  '/confirm-payment',
  [
    authMiddleware.verifyToken,
    authMiddleware.isFarmer,
    check('bookingId', 'Booking ID is required').isMongoId(),
    check('paypalOrderId', 'PayPal Order ID is required').not().isEmpty(),
  ],
  paymentController.confirmPayment
);

// Process refund (Owner)
router.post(
  '/refund',
  [
    authMiddleware.verifyToken,
    authMiddleware.isOwner,
    check('bookingId', 'Booking ID is required').isMongoId(),
  ],
  paymentController.processRefund
);

// Get payment history (Farmer & Owner)
router.get(
  '/history',
  authMiddleware.verifyToken,
  paymentController.getPaymentHistory
);

// Get payment analytics/summary (Owner)
router.get(
  '/summary',
  [
    authMiddleware.verifyToken,
    authMiddleware.isOwner,
  ],
  paymentController.getPaymentSummary
);

// Get payment details by ID (Farmer & Owner)
router.get(
  '/:id',
  authMiddleware.verifyToken,
  paymentController.getPaymentById
);

module.exports = router;
