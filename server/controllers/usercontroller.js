const User = require('../models/user');
const { validationResult } = require('express-validator');

// Get current user profile ("/me")
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user._id;

    // Create update object based on user role
    const updateData = {};

    // Common fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.contactNumber) updateData.contactNumber = req.body.contactNumber;
    if (req.body.profilePicture) updateData.profilePicture = req.body.profilePicture;

    // Role-specific fields
    if (req.user.role === 'farmer' && req.body.location) {
      updateData.location = req.body.location;
    }

    if (req.user.role === 'owner') {
      if (req.body.businessName) updateData.businessName = req.body.businessName;
      if (req.body.address) updateData.address = req.body.address;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload verification documents (for equipment owners)
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Only equipment owners can upload verification documents' });
    }

    if (!req.body.documents || !Array.isArray(req.body.documents)) {
      return res.status(400).json({ message: 'Documents are required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          verificationDocuments: req.body.documents,
          isVerified: false // Reset verification status
        } 
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Verification documents uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Get user with password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


