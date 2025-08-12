const Analytics = require('../models/analytics');
const Rental = require('../models/rental'); 
const Equipment = require('../models/equipment'); 

// Initialize analytics for all equipment
exports.initializeAnalytics = async () => {
  try {
    const equipmentList = await Equipment.find(); // Fetch all equipment from the database

    for (const equipment of equipmentList) {
      const existingAnalytics = await Analytics.findOne({ equipmentId: equipment._id });

      if (!existingAnalytics) {
        // Create a new analytics entry if it doesn't exist
        const newAnalytics = new Analytics({
          equipmentId: equipment._id,
          rentalCount: 0,
          totalRevenue: 0,
          totalRentalDuration: 0,
          averageRentalDuration: 0,
          lastRented: null,
          lastUpdatedBy: null,
        });

        await newAnalytics.save();
        console.log(`Initialized analytics for equipment: ${equipment.name}`);
      }
    }
  } catch (error) {
    console.error('Error initializing analytics:', error);
    throw new Error('Failed to initialize analytics');
  }
};

// Fetch all analytics for equipment
exports.getAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.aggregate([
      {
        $lookup: {
          from: 'equipments', // Ensure this matches your equipment collection name
          localField: 'equipmentId',
          foreignField: '_id',
          as: 'equipment',
        },
      },
      {
        $unwind: {
          path: '$equipment',
          preserveNullAndEmptyArrays: true, // Allow null values if no matching equipment is found
        },
      },
      {
        $project: {
          equipmentName: { $ifNull: ['$equipment.name', 'Unknown Equipment'] },
          rentalCount: { $ifNull: ['$rentalCount', 0] },
          totalRevenue: { $ifNull: ['$totalRevenue', 0] },
          totalRentalDuration: { $ifNull: ['$totalRentalDuration', 0] },
          averageRentalDuration: { $ifNull: ['$averageRentalDuration', 0] },
          lastRented: { $ifNull: ['$lastRented', null] },
          lastUpdatedBy: { $ifNull: ['$lastUpdatedBy', null] },
        },
      },
    ]);

    if (analytics.length === 0) {
      return res.status(200).json({ message: 'No analytics data available', data: [] });
    }

    res.status(200).json({ message: 'Analytics data fetched successfully', data: analytics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching analytics', error });
  }
};

// Update or create analytics for an equipment
exports.updateAnalytics = async (equipmentId, rentalAmount, rentalDuration, userId) => {
  try {
    let analytics = await Analytics.findOne({ equipmentId });

    if (!analytics) {
      // If analytics for the equipment doesn't exist, create it
      analytics = new Analytics({
        equipmentId,
        rentalCount: 1,
        totalRevenue: rentalAmount,
        totalRentalDuration: rentalDuration,
        averageRentalDuration: rentalDuration,
        lastRented: new Date(),
        lastUpdatedBy: userId,
      });
    } else {
      // If analytics exist, update it
      analytics.rentalCount += 1;
      analytics.totalRevenue += rentalAmount;
      analytics.totalRentalDuration += rentalDuration;
      analytics.averageRentalDuration = analytics.totalRentalDuration / analytics.rentalCount;
      analytics.lastRented = new Date();
      analytics.lastUpdatedBy = userId;
    }

    await analytics.save();
  } catch (error) {
    console.error(error);
    throw new Error('Error updating analytics');
  }
};

// Call this function after a successful rental
exports.trackRental = async (rental) => {
    const rentalAmount = rental.amount; // Rental amount
    const rentalDuration = rental.duration; // Rental duration
    const equipmentId = rental.equipment; // Equipment ID
    const userId = rental.user; // User ID
  
    try {
      let analytics = await Analytics.findOne({ equipmentId });
  
      if (!analytics) {
        // Create new analytics entry if it doesn't exist
        analytics = new Analytics({
          equipmentId,
          rentalCount: 1,
          totalRevenue: rentalAmount,
          totalRentalDuration: rentalDuration,
          averageRentalDuration: rentalDuration,
          lastRented: new Date(),
          lastUpdatedBy: userId,
        });
      } else {
        // Update existing analytics entry
        analytics.rentalCount += 1;
        analytics.totalRevenue += rentalAmount;
        analytics.totalRentalDuration += rentalDuration;
        analytics.averageRentalDuration = analytics.totalRentalDuration / analytics.rentalCount;
        analytics.lastRented = new Date();
        analytics.lastUpdatedBy = userId;
      }
  
      await analytics.save();
    } catch (error) {
      console.error('Error tracking rental:', error);
      throw new Error('Failed to track rental');
    }
  };