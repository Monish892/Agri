const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      // Not required when using OAuth
      required: function() {
        return !this.googleId; // Password required only if not using Google auth
      },
      minlength: 6
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true
    },
    role: {
      type: String,
      enum: ['farmer', 'owner'],
      required: true
    },
    contactNumber: {
      type: String,
      required: function() {
        return !this.googleId; // Not required for Google OAuth signup initially
      }
    },
    location: {
      type: String,
      required: function() {
        return this.role === 'farmer' && !this.googleId;
      }
    },
    businessName: {
      type: String,
      required: function() {
        return this.role === 'owner' && !this.googleId;
      }
    },
    address: {
      type: String,
      required: function() {
        return this.role === 'owner' && !this.googleId;
      }
    },
    verificationDocuments: {
      type: [String],
      default: []
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    profilePicture: {
      type: String,
      default: ''
    },
    stripeCustomerId: {
      type: String,
      default: ''
    },
    stripeAccountId: {
      type: String,
      default: ''
    },
    isProfileComplete: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function(next) {
  // Only hash the password if it's been modified or is new
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;