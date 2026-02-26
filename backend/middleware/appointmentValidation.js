const Appointment = require('../models/Appointment');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const Ticket = require('../models/Ticket');
const { body, validationResult } = require('express-validator');

/**
 * Middleware to validate appointment booking request
 * Checks: 90-day interval, slot capacity, hospital working hours, cancellation pattern
 */
const validateAppointmentBooking = [
  body('hospitalId')
    .isMongoId()
    .withMessage('Valid hospital ID is required')
    .custom(async (hospitalId) => {
      const hospital = await Hospital.findOne({ 
        _id: hospitalId, 
        status: 'approved', 
        isActive: true 
      });
      if (!hospital) {
        throw new Error('Hospital not found or not approved');
      }
    }),
  
  body('type')
    .isIn(['blood', 'organ'])
    .withMessage('Type must be blood or organ'),
  
  body('bloodType')
    .if(() => body('type').equals('blood'))
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Valid blood type is required for blood donation'),
  
  body('scheduledDate')
    .isISO8601()
    .withMessage('Valid date is required')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        throw new Error('Cannot schedule appointment in the past');
      }
      // Prevent scheduling too far in future (max 90 days)
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 90);
      if (appointmentDate > maxDate) {
        throw new Error('Cannot schedule appointment more than 90 days in advance');
      }
      return true;
    }),
  
  body('scheduledTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid time format (HH:MM) is required')
    .custom((time) => {
      const [hours] = time.split(':').map(Number);
      if (hours < 9 || hours > 17) {
        throw new Error('Hospital operates between 9 AM and 5 PM');
      }
      return true;
    }),
  
  body('notes')
    .optional()
    .isString()
    .trim()
    .withMessage('Notes must be a string')
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Middleware to check donor eligibility for appointment
 * Validates: 90-day interval, cancellation pattern, donor status
 */
const checkDonorEligibility = async (req, res, next) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    // Check donor account status
    if (donor.status === 'suspended') {
      return res.status(403).json({
        message: 'Your account is suspended. Please contact admin for support.',
        status: donor.status
      });
    }

    // Check donor availability
    if (!donor.availability.isAvailable) {
      const unavailableUntil = donor.availability.unavailableUntil;
      const daysUntil = Math.ceil((unavailableUntil - Date.now()) / (1000 * 60 * 60 * 24));
      return res.status(400).json({
        message: 'You are currently unavailable for donations',
        reason: donor.availability.unavailableReason,
        unavailableUntil,
        daysUntil
      });
    }

    // Check 90-day donation interval (MEDICAL COMPLIANCE)
    const intervalCheck = donor.checkDonationInterval();
    if (!intervalCheck.canDonate) {
      return res.status(400).json({
        message: 'You are not eligible for donation yet',
        ...intervalCheck
      });
    }

    // Check cancellation pattern (FRAUD PREVENTION)
    const appointmentMetrics = donor.appointmentMetrics;
    if (appointmentMetrics.flaggedForReview) {
      return res.status(403).json({
        message: 'Your account is flagged for review due to high cancellation rate',
        reason: appointmentMetrics.flaggedReason,
        contactAdmin: true
      });
    }

    // Attach donor to request for later use
    req.donor = donor;
    next();
  } catch (error) {
    console.error('Error in checkDonorEligibility:', error);
    res.status(500).json({
      message: 'Server error checking donor eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to check slot availability and capacity
 * Prevents double-booking and enforces slot limits
 */
const checkSlotAvailability = async (req, res, next) => {
  try {
    const { hospitalId, scheduledDate, scheduledTime } = req.body;
    const appointmentDate = new Date(scheduledDate);

    // Get hospital with appointment settings
    const hospital = await Hospital.findById(hospitalId)
      .select('capacity workingHours');

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const maxDonorsPerSlot = hospital.capacity?.appointmentSlotCapacity || 5;

    // Check if slot is available using improved capacity method
    const availableSlots = await Appointment.findAvailableSlotsWithCapacity(
      hospitalId,
      appointmentDate,
      60,
      maxDonorsPerSlot
    );

    const slot = availableSlots.find(s => s.time === scheduledTime);

    if (!slot || !slot.available) {
      return res.status(400).json({
        message: 'This time slot is not available',
        slot: scheduledTime,
        capacity: slot?.capacity || { max: maxDonorsPerSlot, booked: maxDonorsPerSlot, available: 0 }
      });
    }

    // Check working hours
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayOfWeek[appointmentDate.getDay()];
    const dayHours = hospital.workingHours?.[dayName];

    if (dayHours?.closed) {
      return res.status(400).json({
        message: `Hospital is closed on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`
      });
    }

    // Verify requested time is within working hours
    const [reqHour, reqMin] = scheduledTime.split(':').map(Number);
    const [openHour, openMin] = (dayHours?.open || '09:00').split(':').map(Number);
    const [closeHour, closeMin] = (dayHours?.close || '17:00').split(':').map(Number);

    const reqTime = reqHour * 60 + reqMin;
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    if (reqTime < openTime || reqTime >= closeTime) {
      return res.status(400).json({
        message: 'Requested time is outside hospital working hours',
        workingHours: `${dayHours?.open || '09:00'} - ${dayHours?.close || '17:00'}`
      });
    }

    // Attach slot info to request
    req.slotInfo = {
      available: true,
      capacity: slot.capacity,
      workingHours: `${dayHours?.open || '09:00'} - ${dayHours?.close || '17:00'}`
    };

    next();
  } catch (error) {
    console.error('Error in checkSlotAvailability:', error);
    res.status(500).json({
      message: 'Server error checking slot availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to handle emergency priority appointments
 * Links to urgent blood request and enables auto-approval
 */
const checkEmergencyLink = async (req, res, next) => {
  try {
    const { linkedTicketId } = req.body;

    if (!linkedTicketId) {
      // Not an emergency appointment
      req.isEmergency = false;
      return next();
    }

    // Verify ticket exists and is urgent
    const ticket = await Ticket.findById(linkedTicketId)
      .select('_id urgency status');

    if (!ticket) {
      return res.status(404).json({ message: 'Linked ticket not found' });
    }

    if (ticket.urgency !== 'critical' && ticket.urgency !== 'urgent') {
      return res.status(400).json({
        message: 'Ticket must be marked as urgent or critical for emergency appointment'
      });
    }

    if (ticket.status === 'closed' || ticket.status === 'fulfilled') {
      return res.status(400).json({
        message: 'Cannot link to closed or fulfilled ticket'
      });
    }

    req.isEmergency = true;
    req.linkedTicket = ticket;
    next();
  } catch (error) {
    console.error('Error in checkEmergencyLink:', error);
    res.status(500).json({
      message: 'Server error checking emergency link',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware to validate status transition
 */
const validateStatusTransition = (req, res, next) => {
  const { newStatus, reason } = req.body;

  if (!newStatus) {
    return res.status(400).json({ message: 'New status is required' });
  }

  const validStatuses = ['requested', 'approved', 'confirmed', 'completed', 
                        'no_show', 'cancelled', 'verified', 'rescheduled'];

  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  next();
};

module.exports = {
  validateAppointmentBooking,
  handleValidationErrors,
  checkDonorEligibility,
  checkSlotAvailability,
  checkEmergencyLink,
  validateStatusTransition
};
