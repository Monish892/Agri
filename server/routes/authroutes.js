const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authcontroller');
const authMiddleware = require('../middleware/authmiddleware');
const passport = require('passport');

const router = express.Router();

// Registration validation middleware
const registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role must be farmer or owner').isIn(['farmer', 'owner']),
  check('contactNumber', 'Contact number is required').not().isEmpty()
];

// Login validation middleware
const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Profile completion validation middleware
const profileCompletionValidation = [
  check('role', 'Role must be farmer or owner').isIn(['farmer', 'owner']),
  check('contactNumber', 'Contact number is required').not().isEmpty(),
  check('location', 'Location is required for farmers').if((value, { req }) => req.body.role === 'farmer').not().isEmpty(),
  check('businessName', 'Business name is required for owners').if((value, { req }) => req.body.role === 'owner').not().isEmpty(),
  check('address', 'Address is required for owners').if((value, { req }) => req.body.role === 'owner').not().isEmpty()
];

// Register route
router.post('/register', registerValidation, authController.register);

// Login route
router.post('/login', loginValidation, authController.login);

// Get current user route (protected)
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login' 
  }),
  authController.googleCallback
);

// Complete profile for Google OAuth users
router.post(
  '/complete-profile',
  authMiddleware.verifyToken,
  profileCompletionValidation,
  authController.completeProfile
);

// Check if profile is complete
router.get(
  '/profile-status',
  authMiddleware.verifyToken,
  authController.checkProfileStatus
);

module.exports = router;