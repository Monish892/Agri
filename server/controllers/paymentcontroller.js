const Razorpay = require('razorpay');
const Payment = require('../models/payment');
const Booking = require('../models/booking');
const { validationResult } = require('express-validator');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const sendError = (res, status, message) => res.status(status).json({ message });

/* ====================
   CREATE RAZORPAY ORDER
======================= */
const createRazorpayOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { bookingId } = req.body;
    console.log('Received bookingId:', bookingId);
    console.log('User:', req.user);

    // Validate booking
    const booking = await Booking.findById(bookingId).populate('equipment owner');
    if (!booking) return sendError(res, 404, 'Booking not found');
    if (!booking.renter.equals(req.user._id)) return sendError(res, 403, 'Unauthorized');
    if (!['pending', 'approved'].includes(booking.status)) {
      return sendError(res, 400, `Cannot pay for booking with status: ${booking.status}`);
    }
    if (booking.paymentStatus === 'paid') return sendError(res, 400, 'Already paid');
    if (!booking.totalAmount || isNaN(booking.totalAmount)) {
      return sendError(res, 400, 'Invalid total amount');
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(booking.totalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_${booking._id}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error.message);
    sendError(res, 500, error.message);
  }
};

/* ====================
   VERIFY RAZORPAY PAYMENT
======================= */
const verifyRazorpayPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return sendError(res, 404, 'Booking not found');
    if (!booking.renter.equals(req.user._id)) return sendError(res, 403, 'Unauthorized');
    if (booking.paymentStatus === 'paid') return sendError(res, 400, 'Already paid');

    // Verify signature
    const crypto = require('crypto');
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return sendError(res, 400, 'Invalid payment signature');
    }

    // Update booking and save payment
    booking.paymentStatus = 'paid';
    booking.paymentId = razorpayPaymentId;
    booking.status = booking.status === 'pending' ? 'approved' : booking.status;
    await booking.save();

    const payment = new Payment({
      booking: booking._id,
      payer: booking.renter,
      recipient: booking.owner,
      amount: booking.totalAmount,
      paymentMethod: 'razorpay',
      status: 'completed',
      transactionId: razorpayPaymentId,
      razorpayOrderId
    });

    await payment.save();

    res.status(200).json({
      message: 'Payment confirmed',
      booking,
      payment
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error.message);
    sendError(res, 500, error.message);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment
  
};