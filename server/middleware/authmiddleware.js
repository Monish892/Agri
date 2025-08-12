const jwt = require('jsonwebtoken');
const User = require('../models/user'); 
require('dotenv').config()

/**
 * Middleware to verify JWT token
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id (Fix: Use decoded.id instead of decoded.userId)
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user data to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Middleware to check if user is a farmer
 */
const isFarmer = (req, res, next) => {
  if (!req.user || req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Access denied. Farmers only.' });
  }
  next();
};

/**
 * Middleware to check if user is an owner
 */
const isOwner = (req, res, next) => {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ message: 'Access denied. Owners only.' });
  }
  next();
};

/**
 * Middleware to check if user is an admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

/**
 * Middleware to check if user matches requested user ID or is admin
 */
const isUserOrAdmin = (req, res, next) => {
  if (
    !req.user || 
    (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin')
  ) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Export all middleware functions
module.exports = {
  verifyToken,
  isFarmer,
  isOwner,
  isAdmin,
  isUserOrAdmin
};
