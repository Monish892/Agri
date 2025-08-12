const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticscontroller');

// Route to get all equipment analytics
router.get('/', analyticsController.getAnalytics);

// Route to initialize analytics for all equipment
router.post('/initialize', async (req, res) => {
  try {
    await analyticsController.initializeAnalytics();
    res.status(200).json({ message: 'Analytics initialized successfully' });
  } catch (error) {
    console.error('Error initializing analytics:', error);
    res.status(500).json({ message: 'Failed to initialize analytics', error });
  }
});

// Route to track a rental and update analytics
router.post('/track-rental', async (req, res) => {
  try {
    const rental = req.body; // Expecting rental details in the request body
    await analyticsController.trackRental(rental);
    res.status(200).json({ message: 'Rental tracked and analytics updated successfully' });
  } catch (error) {
    console.error('Error tracking rental:', error);
    res.status(500).json({ message: 'Failed to track rental', error });
  }
});

module.exports = router;