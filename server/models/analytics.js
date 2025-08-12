const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    equipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipment', 
      required: true
    },
    rentalCount: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    lastRented: {
      type: Date
    },
    averageRentalDuration: {
      type: Number, // Duration in hours or days
      default: 0
    },
    totalRentalDuration: {
      type: Number, // Total duration in hours or days
      default: 0
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the user who last updated the analytics
    },
  },
  { timestamps: true }
);

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;