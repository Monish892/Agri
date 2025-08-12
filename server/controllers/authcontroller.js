const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const authConfig = require('../config/auth.config');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure Passport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/google/callback",
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // Create new user if doesn't exist
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : '',
          role: 'farmer', // Default role, can be updated later
          isProfileComplete: false
        });
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      location: user.location,
      businessName: user.businessName,
      address: user.address,
      isVerified: user.isVerified,
      isProfileComplete: user.isProfileComplete
    },
    authConfig.jwtSecret,
    { expiresIn: authConfig.jwtExpiration }
  );
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const userData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      contactNumber: req.body.contactNumber,
      isProfileComplete: true
    };

    if (req.body.role === 'farmer') {
      userData.location = req.body.location;
    } else if (req.body.role === 'owner') {
      userData.businessName = req.body.businessName;
      userData.address = req.body.address;

      if (req.body.verificationDocuments) {
        userData.verificationDocuments = req.body.verificationDocuments;
      }
    }

    const user = new User(userData);
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isProfileComplete: user.isProfileComplete
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(req.body.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = generateToken(user);

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handle Google OAuth callback
exports.googleCallback = (req, res) => {
  // Generate token for the authenticated user
  const token = generateToken(req.user);

  // Redirect to frontend with token
  // You might want to adjust this URL to your frontend URL
  res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
};

// Complete profile for Google OAuth users
exports.completeProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user with profile completion info
    user.role = req.body.role;
    user.contactNumber = req.body.contactNumber;
    
    if (req.body.role === 'farmer') {
      user.location = req.body.location;
    } else if (req.body.role === 'owner') {
      user.businessName = req.body.businessName;
      user.address = req.body.address;
      
      if (req.body.verificationDocuments) {
        user.verificationDocuments = req.body.verificationDocuments;
      }
    }
    
    user.isProfileComplete = true;
    await user.save();

    // Generate new token with updated info
    const token = generateToken(user);

    res.status(200).json({
      message: 'Profile completed successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if profile is complete
exports.checkProfileStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      isProfileComplete: user.isProfileComplete,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;