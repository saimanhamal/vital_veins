const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');
const {
  validateAppointmentBooking,
  handleValidationErrors,
  checkDonorEligibility,
  checkSlotAvailability,
  checkEmergencyLink,
  validateStatusTransition
} = require('../middleware/appointmentValidation');

/**
 * @route   GET /api/appointments
 * @desc    Get appointments with filters
 * @access  Public
 */
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;
    const hospital = req.query.hospital;
    const type = req.query.type;

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

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment with full details
 * @access  Public
 */
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('donor', 'personalInfo contact appointmentMetrics')
      .populate('hospital', 'hospitalName address contact workingHours')
      .populate('linkedTicket', '_id urgency status');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      message: 'Server error fetching appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/appointments/hospital/:hospitalId/available-slots
 * @desc    Get hospital's available appointment slots with capacity info
 * @access  Public
 */
router.get('/hospital/:hospitalId/available-slots', validateObjectId('hospitalId'), async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const hospital = await Hospital.findById(hospitalId)
      .select('capacity workingHours');

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const maxDonorsPerSlot = hospital.capacity?.appointmentSlotCapacity || 5;
    const targetDate = new Date(date);

    // Get IMPROVED available slots with capacity constraints
    const availableSlots = await Appointment.findAvailableSlotsWithCapacity(
      hospitalId,
      targetDate,
      60,
      maxDonorsPerSlot
    );

    res.json({
      date: targetDate,
      hospitalId,
      maxDonorsPerSlot,
      availableSlots,
      totalSlots: availableSlots.length,
      availableCount: availableSlots.filter(s => s.available).length
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      message: 'Server error fetching available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/appointments/hospital/:hospitalId/suggested
 * @desc    Get nearby hospitals with available slots (geo-based)
 * @access  Private (Donor)
 */
router.get('/hospital/nearby/suggestions', authenticate, authorize('donor'), async (req, res) => {
  try {
    const { longitude, latitude, radiusKm = 15, date } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        message: 'Donor coordinates (longitude, latitude) are required'
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const preferredDate = date ? new Date(date) : new Date();

    // Get IMPROVED hospital suggestions with geolocation and available slots
    const suggestedHospitals = await Appointment.getSuggestedHospitalsNearby(
      coordinates,
      parseFloat(radiusKm) || 15,
      preferredDate
    );

    res.json({
      searchRadius: `${radiusKm} km`,
      searchDate: preferredDate,
      hospitalsFound: suggestedHospitals.length,
      hospitals: suggestedHospitals
    });
  } catch (error) {
    console.error('Get suggested hospitals error:', error);
    res.status(500).json({
      message: 'Server error fetching suggested hospitals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/appointments/book
 * @desc    Book new appointment (IMPROVED with full validation)
 * @access  Private (Donor)
 * 
 * Validates:
 * - 90-day donation interval (medical compliance)
 * - Donor eligibility and status
 * - Slot capacity limits
 * - Hospital working hours
 * - Cancellation pattern (abuse detection)
 * - Emergency linking
 */
router.post(
  '/book',
  authenticate,
  authorize('donor'),
  validateAppointmentBooking,
  handleValidationErrors,
  checkDonorEligibility,        // Check 90-day interval, eligibility, status
  checkSlotAvailability,        // Check slot capacity and working hours
  checkEmergencyLink,           // Check for urgent request linking
  async (req, res) => {
    try {
      const { 
        hospitalId, 
        type, 
        bloodType,
        scheduledDate, 
        scheduledTime, 
        notes,
        linkedTicketId 
      } = req.body;
      
      const donor = req.donor;
      const appointmentDate = new Date(scheduledDate);

      // Create appointment with all enhanced fields
      const appointment = new Appointment({
        donor: donor._id,
        hospital: hospitalId,
        type,
        bloodType: type === 'blood' ? bloodType : undefined,
        scheduledDate: appointmentDate,
        scheduledTime,
        status: req.isEmergency ? 'approved' : 'pending', // Auto-approve emergency
        priority: req.isEmergency ? 'emergency' : 'normal',
        notes: { donor: notes || '' },
        linkedTicket: req.isEmergency ? req.linkedTicket._id : null,
        isEmergencyLinked: req.isEmergency || false,
        autoApprovalReason: req.isEmergency ? 'emergency_ticket' : null,
        lastDonationDate: donor.lastCompletedDonationDate,
        slotCapacity: {
          maxDonorsPerSlot: req.slotInfo?.capacity?.max || 5,
          currentCount: 1
        }
      });

      await appointment.save();
      await appointment.populate([
        { path: 'donor', select: 'personalInfo contact donorId' },
        { path: 'hospital', select: 'hospitalName address contact' }
      ]);

      // Update donor appointment metrics
      donor.appointmentMetrics.totalAppointments++;
      await donor.save();

      // Send real-time notification to hospital
      if (req.io) {
        req.io.to(`hospital_${hospitalId}`).emit('new_appointment', {
          appointmentId: appointment._id,
          donorName: `${donor.personalInfo.firstName} ${donor.personalInfo.lastName}`,
          type: appointment.type,
          priority: appointment.priority,
          scheduledDate: appointment.scheduledDate,
          scheduledTime: appointment.scheduledTime,
          isEmergency: req.isEmergency
        });
      }

      // Log emergency approvals
      if (req.isEmergency) {
        console.log(`[EMERGENCY] Appointment ${appointment._id} auto-approved for ticket ${req.linkedTicket._id}`);
      }

      res.status(201).json({
        message: req.isEmergency 
          ? 'Emergency appointment booked and auto-approved' 
          : 'Appointment booked successfully',
        appointment,
        emergency: req.isEmergency
      });
    } catch (error) {
      console.error('Book appointment error:', error);
      res.status(500).json({
        message: 'Server error booking appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Update appointment status with workflow validation
 * @access  Private (Hospital/Admin)
 * 
 * Validates status transitions:
 * pending → confirmed, cancelled
 * confirmed → completed, no_show, cancelled
 * completed → verified
 */
router.put(
  '/:id/status',
  authenticate,
  authorize('hospital', 'admin'),
  validateObjectId('id'),
  validateStatusTransition,
  async (req, res) => {
    try {
      const { newStatus, reason = '' } = req.body;
      const appointmentId = req.params.id;

      const appointment = await Appointment.findById(appointmentId)
        .populate('donor', 'personalInfo user')
        .populate('hospital', 'hospitalName user');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Validate authorization
      const isHospital = req.user.role === 'hospital' && 
        appointment.hospital.user.toString() === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isHospital && !isAdmin) {
        return res.status(403).json({ 
          message: 'Not authorized to update this appointment' 
        });
      }

      // IMPROVED: Validate status transition with workflow rules
      const validation = appointment.validateStatusTransition(newStatus, reason);
      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message,
          currentStatus: appointment.status,
          attemptedStatus: newStatus
        });
      }

      // Update status safely
      try {
        await appointment.updateStatusSafely(newStatus, { reason });
      } catch (error) {
        return res.status(400).json({
          message: error.message,
          currentStatus: appointment.status
        });
      }

      // If marking as completed, update donor metrics
      if (newStatus === 'completed') {
        const donor = await Donor.findById(appointment.donor);
        if (donor) {
          await donor.recordDonationCompletion();
        }
      }

      // Notify donor of status change
      if (req.io) {
        req.io.to(`donor_${appointment.donor.user}`).emit('appointment_status_change', {
          appointmentId: appointment._id,
          newStatus: newStatus,
          message: `Your appointment status has been updated to ${newStatus.toUpperCase()}`
        });
      }

      res.json({
        message: `Appointment status updated to ${newStatus}`,
        appointment,
        workflow: {
          from: validation.currentStatus || appointment.status,
          to: newStatus,
          reason
        }
      });
    } catch (error) {
      console.error('Update appointment status error:', error);
      res.status(500).json({
        message: 'Server error updating appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   PUT /api/appointments/:id/cancel
 * @desc    Cancel appointment (IMPROVED with cancellation tracking and flagging)
 * @access  Private (Donor/Hospital)
 * 
 * Tracks cancellations and flags donors with >3 in 30 days
 */
router.put(
  '/:id/cancel',
  authenticate,
  validateObjectId('id'),
  async (req, res) => {
    try {
      const { reason = '' } = req.body;
      const appointmentId = req.params.id;

      const appointment = await Appointment.findById(appointmentId)
        .populate('donor', 'personalInfo user appointmentMetrics')
        .populate('hospital', 'hospitalName user');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check authorization
      const isDonor = req.user.role === 'donor' && 
        appointment.donor.user.toString() === req.user.id;
      const isHospital = req.user.role === 'hospital' && 
        appointment.hospital.user.toString() === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isDonor && !isHospital && !isAdmin) {
        return res.status(403).json({ 
          message: 'Not authorized to cancel this appointment' 
        });
      }

      // IMPROVED: Cancel with cancellation tracking
      await appointment.cancelAppointment(reason, req.user.id);

      // IMPROVED: Track cancellation pattern and flag if threshold exceeded
      const donor = appointment.donor;
      const cancellationResult = donor.recordCancellation(appointmentId, reason);
      await donor.save();

      // Notify other party
      const notificationTarget = isDonor ? 'hospital' : 'donor';
      const targetId = isDonor ? appointment.hospital.user : appointment.donor.user;

      if (req.io) {
        req.io.to(`${notificationTarget}_${targetId}`).emit('appointment_cancelled', {
          appointmentId: appointment._id,
          cancelledBy: req.user.role,
          reason: reason,
          timestamp: new Date()
        });
      }

      // Alert admin if donor is flagged
      if (cancellationResult.flagged && !appointment.donor.appointmentMetrics.flaggedForReview) {
        // First time flagging - notify admin
        if (req.io) {
          req.io.to('admin').emit('donor_flagged', {
            donorId: donor._id,
            donorName: `${donor.personalInfo.firstName} ${donor.personalInfo.lastName}`,
            reason: cancellationResult.message,
            cancellationCount: cancellationResult.cancellationCount
          });
        }
      }

      res.json({
        message: 'Appointment cancelled successfully',
        appointment,
        cancellationTracking: cancellationResult,
        donorFlagged: cancellationResult.flagged
      });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({
        message: 'Server error cancelling appointment',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

/**
 * @route   GET /api/appointments/donor/:donorId/history
 * @desc    Get donor's appointment history with metrics
 * @access  Private (Donor/Admin)
 */
router.get(
  '/donor/:donorId/history',
  authenticate,
  validateObjectId('donorId'),
  async (req, res) => {
    try {
      const donorId = req.params.donorId;

      // Authorization check
      const donor = await Donor.findById(donorId).select('user appointmentMetrics');
      if (!donor) {
        return res.status(404).json({ message: 'Donor not found' });
      }

      const isDonor = req.user.role === 'donor' && donor.user.toString() === req.user.id;
      const isAdmin = req.user.role === 'admin';

      if (!isDonor && !isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const appointments = await Appointment.find({ donor: donorId })
        .populate('hospital', 'hospitalName address')
        .sort({ createdAt: -1 });

      res.json({
        donor: {
          _id: donor._id,
          metrics: donor.appointmentMetrics
        },
        appointments,
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length
      });
    } catch (error) {
      console.error('Get donor history error:', error);
      res.status(500).json({
        message: 'Server error fetching appointments',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;
