const Equipment = require('../models/equipment');
const { validationResult } = require('express-validator');

// Get all equipment
const getAllEquipment = async (req, res) => {
  try {
    const { 
      category, location, minPrice, maxPrice, availability,
      sortBy, search, page = 1, limit = 10 
    } = req.query;

    const filter = {};
    if (category) filter.category = category.toLowerCase();
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (availability === 'true') filter.availability = true;

    if (minPrice || maxPrice) {
      filter.dailyRate = {};
      if (minPrice) filter.dailyRate.$gte = Number(minPrice);
      if (maxPrice) filter.dailyRate.$lte = Number(maxPrice);
    }

    if (search) filter.$text = { $search: search };

    let sort = { createdAt: -1 };
    if (sortBy === 'price_asc') sort = { dailyRate: 1 };
    else if (sortBy === 'price_desc') sort = { dailyRate: -1 };
    else if (sortBy === 'rating') sort = { rating: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const equipment = await Equipment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner', 'name businessName isVerified');

    const total = await Equipment.countDocuments(filter);

    res.status(200).json({
      equipment,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get equipment by ID
const getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('owner', 'name businessName contactNumber address isVerified')
      .populate('reviews.user', 'name');

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.status(200).json({ equipment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create equipment with image upload
const createEquipment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, category, dailyRate, weeklyRate, monthlyRate, location, features, specifications } = req.body;

    // Process uploaded images
    const imagePaths = req.files.map(file => `/uploads/${file.filename}`);

    const newEquipment = new Equipment({
      owner: req.user._id,
      name,
      description,
      category: category.toLowerCase(),
      images: imagePaths,
      dailyRate,
      weeklyRate,
      monthlyRate,
      location,
      specifications: JSON.parse(specifications || '{}'),
      features: features.split(',').map(f => f.trim()),
    });

    const saved = await newEquipment.save();
    res.status(201).json({ message: 'Equipment created successfully', equipment: saved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update equipment
const updateEquipment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (equipment.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowedFields = ['name', 'description', 'category', 'images', 'dailyRate', 'weeklyRate', 'monthlyRate', 'availability', 'specifications', 'location', 'features'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        equipment[field] = req.body[field];
      }
    });

    // Process uploaded images if provided
    if (req.files && req.files.length > 0) {
      const imagePaths = req.files.map(file => `/uploads/${file.filename}`);
      equipment.images = imagePaths;
    }

    const updated = await equipment.save();
    res.status(200).json({ message: 'Equipment updated successfully', equipment: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete equipment
const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (equipment.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Equipment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add review
const addReview = async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const alreadyReviewed = equipment.reviews.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Already reviewed' });
    }

    equipment.reviews.push({
      user: req.user._id,
      rating: Number(rating),
      comment: comment || '',
    });

    equipment.rating = equipment.reviews.reduce((sum, r) => sum + r.rating, 0) / equipment.reviews.length;

    await equipment.save();
    res.status(201).json({ message: 'Review added', equipment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all equipment of a specific owner
const getOwnerEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ equipment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  addReview,
  getOwnerEquipment,
};