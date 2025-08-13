const Booking = require('../models/booking');
const Equipment = require('../models/equipment');
const { validationResult } = require('express-validator');

const BOOKING_STATUSES = ['pending', 'approved', 'rejected', 'in-progress', 'completed', 'canceled'];

const sendError = (res, status, message) => res.status(status).json({ message });

// --------------------- CREATE BOOKING ---------------------
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendError(res, 400, 'Invalid booking data');

  try {
    const { equipmentId, startDate, endDate, specialRequirements } = req.body;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return sendError(res, 404, 'Equipment not found');
    if (!equipment.availability) return sendError(res, 400, 'Equipment not available');

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) return sendError(res, 400, 'Start date must be before end date');
    if (start < new Date()) return sendError(res, 400, 'Start date must be in the future');

    const conflicts = await Booking.find({
      equipment: equipmentId,
      status: { $in: ['pending', 'approved', 'in-progress'] },
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }]
    });

    if (conflicts.length > 0) {
      return res.status(400).json({
        message: 'Equipment is already booked for selected dates',
        conflicts: conflicts.map(b => ({ startDate: b.startDate, endDate: b.endDate }))
      });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let totalAmount = 0;

    if (days <= 7) totalAmount = days * equipment.dailyRate;
    else if (days <= 30) totalAmount = Math.ceil(days / 7) * equipment.weeklyRate;
    else totalAmount = Math.ceil(days / 30) * equipment.monthlyRate;

    const booking = new Booking({
      equipment: equipmentId,
      renter: req.user._id,
      owner: equipment.owner,
      startDate: start,
      endDate: end,
      totalAmount,
      specialRequirements: specialRequirements || ''
    });

    const saved = await booking.save();

    const populated = await Booking.findById(saved._id)
      .populate('equipment', 'name category images')
      .populate('owner', 'name businessName contactNumber')
      .populate('renter', 'name contactNumber');

    res.status(201).json({ message: 'Booking created', booking: populated });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// --------------------- DELETE BOOKING ---------------------
exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return sendError(res, 404, 'Booking not found');

    // Only the renter can delete their booking
    if (!booking.renter.equals(userId)) {
      return sendError(res, 403, 'Unauthorized: You can only delete your own bookings.');
    }

    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({ message: 'Booking deleted successfully.' });
  } catch (err) {
    console.error('Delete booking error:', err);
    sendError(res, 500, 'Failed to delete booking.');
  }
};

// --------------------- FARMER BOOKINGS ---------------------
exports.getFarmerBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { renter: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('equipment', 'name category images')
      .populate('owner', 'name businessName');

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      bookings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// --------------------- OWNER BOOKINGS ---------------------
exports.getOwnerBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { owner: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('equipment', 'name category images')
      .populate('renter', 'name contactNumber location');

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      bookings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// --------------------- EQUIPMENT USAGE ANALYTICS ---------------------
exports.getEquipmentUsageAnalytics = async (req, res) => {
  try {
    const totalRentals = await Booking.countDocuments({ status: 'completed' });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const mostRentedEquipment = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$equipment', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: {
        from: 'equipments',
        localField: '_id',
        foreignField: '_id',
        as: 'equipment'
      }},
      { $unwind: '$equipment' },
      { $project: { _id: 0, equipmentName: '$equipment.name', count: 1 } }
    ]);

    res.status(200).json({
      totalRentals,
      totalRevenue: totalRevenue[0]?.total || 0,
      mostRentedEquipment: mostRentedEquipment[0] || {}
    });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// --------------------- GET BOOKING BY ID ---------------------
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('equipment', 'name category images dailyRate weeklyRate monthlyRate')
      .populate('owner', 'name businessName contactNumber address')
      .populate('renter', 'name contactNumber location');

    if (!booking) return sendError(res, 404, 'Booking not found');

    const isAuthorized =
      booking.renter._id.toString() === req.user._id.toString() ||
      booking.owner._id.toString() === req.user._id.toString();

    if (!isAuthorized) return sendError(res, 403, 'Unauthorized access');

    res.status(200).json({ booking });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// --------------------- OWNER UPDATE STATUS ---------------------
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, condition, notes } = req.body;
    if (!BOOKING_STATUSES.includes(status)) return sendError(res, 400, 'Invalid status');

    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 404, 'Booking not found');
    if (booking.owner.toString() !== req.user._id.toString())
      return sendError(res, 403, 'Unauthorized to update this booking');
    if (['completed', 'rejected', 'canceled'].includes(booking.status))
      return sendError(res, 400, `Cannot update a ${booking.status} booking`);

    booking.status = status;

    if (status === 'completed') {
      booking.returnDetails = {
        date: new Date(),
        condition: condition || 'Good',
        notes: notes || ''
      };
    }

    await booking.save();

    res.status(200).json({ message: `Booking ${status}`, booking });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// --------------------- CANCEL BOOKING ---------------------
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 404, 'Booking not found');
    if (booking.renter.toString() !== req.user._id.toString())
      return sendError(res, 403, 'Unauthorized cancellation');

    if (['completed', 'rejected', 'canceled', 'in-progress'].includes(booking.status))
      return sendError(res, 400, `Cannot cancel a ${booking.status} booking`);

    const daysDiff = Math.ceil((new Date(booking.startDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 1)
      return sendError(res, 400, 'Bookings must be canceled at least 24 hours in advance');

    booking.status = 'canceled';
    await booking.save();

    res.status(200).json({ message: 'Booking canceled', booking });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// --------------------- ADD PICKUP DETAILS ---------------------
exports.addPickupDetails = async (req, res) => {
  try {
    const { address, contactPerson, contactNumber, instructions } = req.body;
    if (!address || !contactPerson || !contactNumber)
      return sendError(res, 400, 'All pickup fields are required');

    const booking = await Booking.findById(req.params.id);
    if (!booking) return sendError(res, 404, 'Booking not found');
    if (booking.renter.toString() !== req.user._id.toString())
      return sendError(res, 403, 'Unauthorized update');

    booking.pickupDetails = {
      address,
      contactPerson,
      contactNumber,
      instructions: instructions || ''
    };

    await booking.save();

    res.status(200).json({ message: 'Pickup details updated', booking });
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

// --------------------- OWNER BOOKING REQUESTS ---------------------
exports.getOwnerBookingRequests = async (req, res) => {
  try {
    const bookings = await Booking.find({
      owner: req.user._id,
      status: 'pending'
    })
      .sort({ createdAt: -1 })
      .populate('equipment', 'name category images')
      .populate('renter', 'name contactNumber location');

    res.status(200).json(bookings);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};

module.exports = exports;