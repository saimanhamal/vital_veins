const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// @route   GET /api/appointments
// @desc    Get all appointments (public with optional auth)
// @access  Public
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;
    const hospital = req.query.hospital;
    const type = req.query.type;

    // Build query
    const query = { isActive: true };
    if (status) query.status = status;
    if (hospital) query.hospital = hospital;
    if (type) query.type = type;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('donor', 'personalInfo contact')
        .populate('hospital', 'hospitalName address contact')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(query)
    ]);

    res.json({
      appointments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      message: 'Server error fetching appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get single appointment
// @access  Public
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('donor', 'personalInfo contact')
      .populate('hospital', 'hospitalName address contact');

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found'
      });
    }

    res.json({
      appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      message: 'Server error fetching appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/appointments/hospital/:hospitalId/available-slots
// @desc    Get available appointment slots for a hospital
// @access  Public
router.get('/hospital/:hospitalId/available-slots', validateObjectId('hospitalId'), async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: 'Date is required'
      });
    }

    const targetDate = new Date(date);
    const availableSlots = await Appointment.findAvailableSlots(hospitalId, targetDate);

    // Generate time slots (9 AM to 5 PM, 1-hour intervals)
    const timeSlots = [];
    for (let hour = 9; hour <= 17; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const isBooked = availableSlots.some(slot => slot.scheduledTime === timeString);
      
      timeSlots.push({
        time: timeString,
        available: !isBooked
      });
    }

    res.json({
      date: targetDate,
      hospitalId,
      availableSlots: timeSlots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      message: 'Server error fetching available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/appointments/book
// @desc    Book new appointment (Donor only)
// @access  Private (Donor)
router.post('/book', authenticate, authorize('donor'), [
  body('hospitalId').isMongoId().withMessage('Valid hospital ID is required'),
  body('type').isIn(['blood', 'organ']).withMessage('Type must be blood or organ'),
  body('scheduledDate').isISO8601().withMessage('Valid date is required'),
  body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { hospitalId, type, scheduledDate, scheduledTime, notes } = req.body;
    
    // Check if hospital exists and is approved
    const hospital = await Hospital.findOne({ 
      _id: hospitalId, 
      status: 'approved', 
      isActive: true 
    });
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found or not approved' });
    }

    // Find donor profile
    const Donor = require('../models/Donor');
    const donor = await Donor.findOne({ user: req.user.id });
    
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    // Check if donor is eligible for blood donation (if blood type)
    if (type === 'blood' && !donor.isEligibleForBloodDonation()) {
      const nextEligible = donor.calculateNextEligibleDate();
      return res.status(400).json({
        message: 'You are not eligible for blood donation yet',
        nextEligibleDate: nextEligible
      });
    }

    // Check if appointment slot is available
    const appointmentDate = new Date(scheduledDate);
    const existingAppointment = await Appointment.findOne({
      hospital: hospitalId,
      scheduledDate: appointmentDate,
      scheduledTime: scheduledTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'Time slot is already booked' });
    }

    // Create appointment
    const appointment = new Appointment({
      donor: donor._id,
      hospital: hospitalId,
      type,
      scheduledDate: appointmentDate,
      scheduledTime,
      status: 'scheduled',
      notes: { donor: notes || '' },
      location: hospital.location
    });

    await appointment.save();
    await appointment.populate([
      { path: 'donor', select: 'personalInfo contact donorId' },
      { path: 'hospital', select: 'hospitalName address contact' }
    ]);

    // Send real-time notification
    if (req.io) {
      req.io.to(`hospital_${hospitalId}`).emit('new_appointment', {
        appointmentId: appointment._id,
        donorName: appointment.donor.personalInfo.firstName + ' ' + appointment.donor.personalInfo.lastName,
        type: appointment.type,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime
      });
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      message: 'Server error booking appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment (Donor or Hospital)
// @access  Private (Donor/Hospital)
router.put('/:id/cancel', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { reason } = req.body;
    const appointmentId = req.params.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('donor', 'personalInfo user')
      .populate('hospital', 'hospitalName user');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user has permission to cancel
    const isDonor = req.user.role === 'donor' && appointment.donor.user.toString() === req.user.id;
    const isHospital = req.user.role === 'hospital' && appointment.hospital.user.toString() === req.user.id;
    
    if (!isDonor && !isHospital) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    appointment.cancellation = {
      reason: reason || '',
      cancelledBy: req.user.id,
      cancelledAt: new Date()
    };

    await appointment.save();

    // Send notification to the other party
    const notificationTarget = isDonor ? 'hospital' : 'donor';
    const targetId = isDonor ? appointment.hospital.user : appointment.donor.user;
    
    if (req.io) {
      req.io.to(`${notificationTarget}_${targetId}`).emit('appointment_cancelled', {
        appointmentId: appointment._id,
        cancelledBy: req.user.role,
        reason: reason
      });
    }

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      message: 'Server error cancelling appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
