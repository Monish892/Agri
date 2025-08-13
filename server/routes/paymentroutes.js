const express = require('express');
const { check } = require('express-validator');
const paymentController = require('../controllers/paymentcontroller');
const authMiddleware = require('../middleware/authmiddleware');

const router = express.Router();

// Create Razorpay order
router.post(
  '/create-razorpay-order',
  authMiddleware.verifyToken,
  authMiddleware.isFarmer,
  check('bookingId', 'Booking ID is required').isMongoId(),
  paymentController.createRazorpayOrder
);

// Verify Razorpay payment
router.post(
  '/verify-razorpay-payment',
  authMiddleware.verifyToken,
  authMiddleware.isFarmer,
  check('bookingId', 'Booking ID is required').isMongoId(),
  check('razorpayPaymentId', 'Payment ID is required').notEmpty(),
  check('razorpayOrderId', 'Order ID is required').notEmpty(),
  check('razorpaySignature', 'Signature is required').notEmpty(),
  paymentController.verifyRazorpayPayment
);

module.exports = router;