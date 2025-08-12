const paypal = require('@paypal/checkout-server-sdk');
const Payment = require('../models/payment');
const Booking = require('../models/booking');
const { validationResult } = require('express-validator');
require('dotenv').config();

// PayPal environment setup
const env = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const paypalClient = new paypal.core.PayPalHttpClient(env);

const sendError = (res, status, message) => res.status(status).json({ message });

/* ====================
   CREATE PAYPAL ORDER
======================= */
const createPaymentIntent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { bookingId } = req.body;

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

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'INR', // Ensure this matches the frontend SDK currency
          value: booking.totalAmount.toFixed(2),
        },
        description: `Booking #${booking._id}`
      }]
    });

    const order = await paypalClient.execute(request);
    const approvalLink = order.result.links?.find(link => link.rel === 'approve')?.href;

    if (!approvalLink) {
      console.error('Missing approval link:', order.result);
      return sendError(res, 500, 'Approval link not found in PayPal response');
    }

    res.status(200).json({
      paypalOrderId: order.result.id,
      approvalLink
    });
  } catch (error) {
    console.error('Create payment intent error:', error.message);
    sendError(res, 500, error.message);
  }
};

/* ============================
   CONFIRM PAYPAL PAYMENT
============================== */
const confirmPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { bookingId, paypalOrderId } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return sendError(res, 404, 'Booking not found');
    if (!booking.renter.equals(req.user._id)) return sendError(res, 403, 'Unauthorized');
    if (!['pending', 'approved'].includes(booking.status)) {
      return sendError(res, 400, `Cannot confirm payment for booking with status: ${booking.status}`);
    }
    if (booking.paymentStatus === 'paid') return sendError(res, 400, 'Already paid');

    // Capture PayPal payment
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    const capture = await paypalClient.execute(request);

    const transactionId = capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    if (!transactionId) return sendError(res, 500, 'Transaction ID not found in PayPal response');

    // Update booking and save payment
    booking.paymentStatus = 'paid';
    booking.paymentId = transactionId;
    booking.status = booking.status === 'pending' ? 'approved' : booking.status;
    await booking.save();

    const payment = new Payment({
      booking: booking._id,
      payer: booking.renter,
      recipient: booking.owner,
      amount: booking.totalAmount,
      paymentMethod: 'paypal',
      status: 'completed',
      transactionId,
      paypalOrderId
    });

    await payment.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('equipment', 'name category images dailyRate')
      .populate('owner', 'name businessName contactNumber')
      .populate('renter', 'name contactNumber');

    res.status(200).json({
      message: 'Payment confirmed',
      booking: populatedBooking,
      payment
    });
  } catch (error) {
    console.error('Confirm payment error:', error.message);
    sendError(res, 500, error.message);
  }
};

/* ====================
   PROCESS REFUND
======================= */
const processRefund = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { bookingId, reason = 'Requested by owner' } = req.body;

    // Validate booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return sendError(res, 404, 'Booking not found');
    if (!booking.owner.equals(req.user._id)) return sendError(res, 403, 'Unauthorized');
    if (booking.paymentStatus !== 'paid') return sendError(res, 400, 'No payment to refund');

    // Find payment record
    const payment = await Payment.findOne({ booking: booking._id, status: 'completed' });
    if (!payment) return sendError(res, 404, 'Payment record not found');

    // Process refund
    const refundRequest = new paypal.payments.CapturesRefundRequest(payment.transactionId);
    refundRequest.requestBody({ reason });

    const refund = await paypalClient.execute(refundRequest);
    const refundTransactionId = refund.result.id;

    // Update payment and booking
    payment.status = 'refunded';
    payment.refundReason = reason;
    payment.refundAmount = booking.totalAmount;
    payment.refundDate = new Date();
    payment.refundTransactionId = refundTransactionId;
    await payment.save();

    booking.paymentStatus = 'refunded';
    booking.status = 'canceled';
    await booking.save();

    res.status(200).json({ message: 'Refund processed', booking, payment });
  } catch (error) {
    console.error('Refund processing error:', error.message);
    sendError(res, 500, error.message);
  }
};

/* ==============================
   GET PAYMENT HISTORY (User)
================================= */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const history = await Payment.find({
      $or: [{ payer: userId }, { recipient: userId }]
    })
      .populate('booking')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({
      $or: [{ payer: userId }, { recipient: userId }]
    });

    res.status(200).json({
      page,
      totalPages: Math.ceil(total / limit),
      totalPayments: total,
      payments: history
    });
  } catch (error) {
    console.error('Get payment history error:', error.message);
    sendError(res, 500, error.message);
  }
};

/* ==============================
   GET PAYMENT SUMMARY (Owner)
================================= */
const getPaymentSummary = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const payments = await Payment.find({ recipient: ownerId, status: 'completed' });
    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      totalEarnings,
      totalPayments: payments.length,
      recentPayments: payments.slice(-5)
    });
  } catch (error) {
    console.error('Get payment summary error:', error.message);
    sendError(res, 500, error.message);
  }
};

/* ==============================
   GET PAYMENT BY ID (User)
================================= */
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('booking')
      .populate('payer', 'name email')
      .populate('recipient', 'name businessName email');

    if (!payment) return sendError(res, 404, 'Payment not found');

    const isOwnerOrPayer = [payment.payer.toString(), payment.recipient.toString()].includes(req.user._id.toString());
    if (!isOwnerOrPayer) return sendError(res, 403, 'Unauthorized');

    res.status(200).json(payment);
  } catch (error) {
    console.error('Get payment by ID error:', error.message);
    sendError(res, 500, error.message);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentHistory,
  getPaymentSummary,
  getPaymentById
};