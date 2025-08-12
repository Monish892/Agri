const express = require('express');
const { check } = require('express-validator');
const equipmentController = require('../controllers/equipmentcontrolller');
const { uploadEquipmentImages } = require('../middleware/uploadmiddleware');
const authMiddleware = require('../middleware/authmiddleware');

const router = express.Router();

// Public routes
router.get('/', equipmentController.getAllEquipment); // Get all equipment
router.get('/:id', equipmentController.getEquipmentById); // Get equipment by ID

// Validation for equipment creation
const equipmentValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('category', 'Valid category is required').custom((value) => {
    const validCategories = [
      'tractor', 'harvester', 'plow', 'seeder', 'sprayer', 'irrigation', 'other'
    ];
    return validCategories.includes(value.toLowerCase());
  }),
  check('dailyRate', 'Daily rate must be a positive number').isNumeric({ min: 0 }),
  check('weeklyRate', 'Weekly rate must be a positive number').isNumeric({ min: 0 }),
  check('monthlyRate', 'Monthly rate must be a positive number').isNumeric({ min: 0 }),
  check('location', 'Location is required').not().isEmpty()
];

// Validation for equipment updates (optional fields)
const equipmentUpdateValidation = [
  check('name').optional().not().isEmpty().withMessage('Name cannot be empty'),
  check('description').optional().not().isEmpty().withMessage('Description cannot be empty'),
  check('category').optional().custom((value) => {
    const validCategories = [
      'tractor', 'harvester', 'plow', 'seeder', 'sprayer', 'irrigation', 'other'
    ];
    return validCategories.includes(value.toLowerCase());
  }).withMessage('Invalid category'),
  check('dailyRate').optional().isNumeric({ min: 0 }).withMessage('Daily rate must be positive'),
  check('weeklyRate').optional().isNumeric({ min: 0 }).withMessage('Weekly rate must be positive'),
  check('monthlyRate').optional().isNumeric({ min: 0 }).withMessage('Monthly rate must be positive'),
  check('location').optional().not().isEmpty().withMessage('Location cannot be empty')
];

// Protected routes
router.post(
  '/',
  [
    authMiddleware.verifyToken,
    authMiddleware.isOwner,
    uploadEquipmentImages, // Middleware for image uploads
    ...equipmentValidation
  ],
  equipmentController.createEquipment
);

router.put(
  '/:id',
  [
    authMiddleware.verifyToken,
    authMiddleware.isOwner,
    uploadEquipmentImages, // Middleware for image uploads
    ...equipmentUpdateValidation
  ],
  equipmentController.updateEquipment
);

router.delete(
  '/:id',
  [authMiddleware.verifyToken, authMiddleware.isOwner],
  equipmentController.deleteEquipment
);

// Get owner's equipment listings
router.get(
  '/owner/listings',
  [authMiddleware.verifyToken, authMiddleware.isOwner],
  equipmentController.getOwnerEquipment
);

// Add review to equipment
router.post(
  '/:id/reviews',
  [
    authMiddleware.verifyToken,
    authMiddleware.isFarmer,
    check('rating', 'Rating is required and must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('comment', 'Comment cannot be empty').optional().not().isEmpty()
  ],
  equipmentController.addReview
);

module.exports = router;