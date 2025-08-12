const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalcontroller'); // Ensure this is correct
const auth = require('../middleware/authmiddleware'); // Ensure this is correct

// Define routes
router.get('/', auth, rentalController.getRentals); // Ensure rentalController.getRentals is a valid function
router.get('/:id', auth, rentalController.getRentalById); // Ensure rentalController.getRentalById is a valid function
router.post('/', auth, rentalController.createRental); // Ensure rentalController.createRental is a valid function
router.patch('/:id/status', auth, rentalController.updateRentalStatus); 
router.patch('/:id/overdue', auth, rentalController.markRentalOverdue); 
router.post('/:id/review', auth, rentalController.addRentalReview);

module.exports = router;