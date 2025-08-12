const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: [
        'tractor',
        'harvester',
        'plow',
        'seeder',
        'sprayer',
        'irrigation',
        'other'
      ],
      required: true
    },
    images: {
      type: [String],
      default: []
    },
    dailyRate: {
      type: Number,
      required: true,
      min: 0
    },
    weeklyRate: {
      type: Number,
      required: true,
      min: 0
    },
    monthlyRate: {
      type: Number,
      required: true,
      min: 0
    },
    availability: {
      type: Boolean,
      default: true
    },
    specifications: {
      manufacturer: String,
      model: String,
      year: Number,
      powerOutput: String,
      dimensions: String,
      weight: String,
      fuelType: String
    },
    location: {
      type: String,
      required: true
    },
    features: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

equipmentSchema.index({ name: 'text', description: 'text', category: 'text' });

const Equipment = mongoose.model('Equipment', equipmentSchema);

module.exports = Equipment;