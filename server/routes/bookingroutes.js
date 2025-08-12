const express = require('express');
const { check } = require('express-validator');
const bookingController = require('../controllers/bookingcontroller');
const authMiddleware = require('../middleware/authmiddleware');

const router = express.Router();

// Validation for booking creation
const bookingValidation = [
  check('equipmentId', 'Equipment ID is required').isMongoId(),
  check('startDate', 'Valid start date is required').isISO8601(),
  check('endDate', 'Valid end date is required').isISO8601()
];

// Validation for updating booking status
const statusValidation = [
  check('status', 'Valid status is required').isIn(['pending', 'approved', 'rejected', 'in-progress', 'completed', 'canceled'])
];

// Validation for pickup details
const pickupValidation = [
  check('address', 'Address is required').notEmpty(),
  check('contactPerson', 'Contact person is required').notEmpty(),
  check('contactNumber', 'Contact number is required').notEmpty()
];

// Create booking (Farmer only)
router.post(
  '/',
  [authMiddleware.verifyToken, authMiddleware.isFarmer, ...bookingValidation],
  bookingController.createBooking
);

// Request booking from owner (Farmer only) [Optional, currently using the same method]
router.post(
  '/request',
  [authMiddleware.verifyToken, authMiddleware.isFarmer, ...bookingValidation],
  bookingController.createBooking
);

// Get all bookings for farmer (Farmer only)
router.get(
  '/farmer',
  [authMiddleware.verifyToken, authMiddleware.isFarmer],
  bookingController.getFarmerBookings
);

// Get all bookings for owner (Owner only)
router.get(
  '/owner',
  [authMiddleware.verifyToken, authMiddleware.isOwner],
  bookingController.getOwnerBookings
);

// Get booking by ID (Farmer or Owner)
router.get(
  '/:id',
  authMiddleware.verifyToken,
  bookingController.getBookingById
);

// Update booking status (Owner only)
router.put(
  '/:id/status',
  [authMiddleware.verifyToken, authMiddleware.isOwner, ...statusValidation],
  bookingController.updateBookingStatus
);

// Cancel booking (Farmer only)
router.put(
  '/:id/cancel',
  [authMiddleware.verifyToken, authMiddleware.isFarmer],
  bookingController.cancelBooking
);

// Add pickup details (Farmer only)
router.put(
  '/:id/pickup-details',
  [authMiddleware.verifyToken, authMiddleware.isFarmer, ...pickupValidation],
  bookingController.addPickupDetails
);

// Get all pending booking requests for the owner (Owner only)
router.get(
  '/owner/requests',
  [authMiddleware.verifyToken, authMiddleware.isOwner],
  bookingController.getOwnerBookingRequests
);

// ------------------- Analytics Route -------------------
// Get equipment usage analytics (Owner only)
router.get(
  '/analytics',
  [authMiddleware.verifyToken, authMiddleware.isOwner],
  bookingController.getEquipmentUsageAnalytics
);

module.exports = router;
