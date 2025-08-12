const Rental = require('../models/rental');
const Equipment = require('../models/equipment');
const { validationResult } = require('express-validator');

// Get all rentals (for user or admin)
const getRentals = async (req, res) => {
  try {
    const filter = {};

    if (!req.user.isAdmin) {
      filter.user = req.user._id;
    } else if (req.query.userId) {
      filter.user = req.query.userId;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.equipmentId) filter.equipmentId = req.query.equipmentId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const rentals = await Rental.find(filter)
      .populate('equipmentId', 'name images category dailyRate')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Rental.countDocuments(filter);

    res.status(200).json({
      rentals,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get rental by ID
const getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('equipmentId', 'name images category dailyRate weeklyRate monthlyRate location')
      .populate('user', 'name email phone');
    
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }
    
    // Check if user is authorized to view this rental
    if (!req.user.isAdmin && rental.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.status(200).json({ rental });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new rental
const createRental = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { equipmentId, startDate, endDate, rentalType } = req.body;
    
    // Check if equipment exists and is available
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    if (!equipment.availability) {
      return res.status(400).json({ message: 'Equipment is not available for rent' });
    }
    
    // Calculate rental amount based on rental type
    let rentalAmount = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (rentalType === 'daily') {
      rentalAmount = equipment.dailyRate * days;
    } else if (rentalType === 'weekly') {
      rentalAmount = equipment.weeklyRate * Math.ceil(days / 7);
    } else if (rentalType === 'monthly') {
      rentalAmount = equipment.monthlyRate * Math.ceil(days / 30);
    }
    
    const newRental = new Rental({
      user: req.user._id,
      equipmentId,
      startDate,
      endDate,
      rentalType,
      rentalAmount,
      status: 'pending' // Initially pending, needs to be confirmed
    });
    
    const savedRental = await newRental.save();
    
    res.status(201).json({
      message: 'Rental request created successfully',
      rental: savedRental
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update rental status
const updateRentalStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }
    
    // Only admin or equipment owner can update rental status
    const equipment = await Equipment.findById(rental.equipmentId);
    if (!req.user.isAdmin && equipment.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    rental.status = status;
    
    // If completed, update return date
    if (status === 'completed') {
      rental.returnDate = new Date();
    }
    
    const updatedRental = await rental.save();
    
    res.status(200).json({
      message: 'Rental status updated successfully',
      rental: updatedRental
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markRentalOverdue = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const equipment = await Equipment.findById(rental.equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (rental.status !== 'in-progress') {
      return res.status(400).json({ message: 'Only in-progress rentals can be marked as overdue' });
    }

    const currentDate = new Date();
    const endDate = new Date(rental.endDate);

    if (currentDate <= endDate) {
      return res.status(400).json({ message: 'Rental is not yet overdue' });
    }

    rental.isOverdue = true;
    rental.overdueDays = Math.ceil((currentDate - endDate) / (1000 * 60 * 60 * 24));
    rental.overdueCharges = rental.overdueDays * equipment.dailyRate;

    const updatedRental = await rental.save();

    res.status(200).json({
      message: 'Rental marked as overdue',
      rental: updatedRental
    });
  } catch (error) {
    console.error('Error in markRentalOverdue:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add rental review (after completion)
const addRentalReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { rating, comment } = req.body;
    
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }
    
    // Only the user who rented can add a review
    if (rental.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (rental.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed rentals' });
    }
    
    if (rental.review) {
      return res.status(400).json({ message: 'Review already exists for this rental' });
    }
    
    rental.review = {
      rating: Number(rating),
      comment,
      createdAt: Date.now()
    };
    
    const updatedRental = await rental.save();
    
    // Update equipment rating
    const equipment = await Equipment.findById(rental.equipmentId);
    if (equipment) {
      equipment.reviews.push({
        user: req.user._id,
        rating: Number(rating),
        comment: comment || '',
      });
      
      equipment.rating = equipment.reviews.reduce((sum, r) => sum + r.rating, 0) / equipment.reviews.length;
      
      await equipment.save();
    }
    
    res.status(200).json({
      message: 'Review added successfully',
      rental: updatedRental
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRentals,
  getRentalById,
  createRental,
  updateRentalStatus,
  markRentalOverdue,
  addRentalReview
};