const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/usercontroller');
const authMiddleware = require('../middleware/authmiddleware');

const router = express.Router();

// Get current user route
router.get('/auth/me', authMiddleware.verifyToken, userController.getCurrentUser);

// Get user by ID route
router.get('/:id', authMiddleware.verifyToken, userController.getUserById);

// Update profile validation
const updateProfileValidation = [
  check('name', 'Name must be valid').optional().isLength({ min: 2 }),
  check('contactNumber', 'Contact number must be valid').optional().isLength({ min: 5 })
];

// Update profile route (protected)
router.put('/profile', 
  [authMiddleware.verifyToken, ...updateProfileValidation], 
  userController.updateProfile
);

// Upload verification documents route (protected, owner only)
router.post('/verification-documents', 
  authMiddleware.verifyToken, 
  userController.uploadVerificationDocuments
);

// Change password route (protected)
router.post('/change-password', 
  authMiddleware.verifyToken, 
  userController.changePassword
);

module.exports = router;
