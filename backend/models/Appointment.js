const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  type: {
    type: String,
    enum: ['blood', 'organ'],
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: function() {
      return this.type === 'blood';
    }
  },
  organType: {
    type: String,
    enum: ['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Intestine', 'Cornea', 'Skin', 'Bone'],
    required: function() {
      return this.type === 'organ';
    }
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  duration: {
    type: Number,
    default: 60, // minutes
    min: 15,
    max: 240
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  notes: {
    donor: String,
    hospital: String,
    admin: String
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    scheduledFor: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  checkIn: {
    time: Date,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  checkOut: {
    time: Date,
    notes: String,
    complications: [String],
    recoveryTime: Number // minutes
  },
  donation: {
    quantity: Number,
    quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    },
    complications: [String],
    notes: String
  },
  feedback: {
    donor: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    },
    hospital: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    }
  },
  rescheduleHistory: [{
    fromDate: Date,
    toDate: Date,
    reason: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: Date
  }],
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date
  },
  // Medical Compliance Fields
  lastDonationDate: {
    type: Date,
    default: null
  },
  linkedTicket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    default: null
  },
  slotCapacity: {
    maxDonorsPerSlot: { type: Number, default: 5 },
    currentCount: { type: Number, default: 1 }
  },
  isEmergencyLinked: {
    type: Boolean,
    default: false
  },
  autoApprovalReason: {
    type: String,
    enum: ['emergency_ticket', 'matching_request'],
    default: null
  },
  workflowValidation: {
    isStatusTransitionValid: { type: Boolean, default: true },
    validTransitions: [String],
    lastStatusChangeReason: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
appointmentSchema.index({ scheduledDate: 1, scheduledTime: 1 });
appointmentSchema.index({ donor: 1, status: 1 });
appointmentSchema.index({ hospital: 1, status: 1 });
appointmentSchema.index({ status: 1, scheduledDate: 1 });
appointmentSchema.index({ hospital: 1, scheduledDate: 1 });
appointmentSchema.index({ donor: 1, createdAt: -1 }); // For donation history
appointmentSchema.index({ status: 1, priority: 1, scheduledDate: 1 }); // For emergency querying

// Generate unique appointment ID
appointmentSchema.pre('save', function(next) {
  if (!this.appointmentId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.appointmentId = `APT${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Virtual for display type
appointmentSchema.virtual('displayType').get(function() {
  return this.type === 'blood' ? this.bloodType : this.organType;
});

// Virtual for full scheduled datetime
appointmentSchema.virtual('scheduledDateTime').get(function() {
  const date = new Date(this.scheduledDate);
  const [hours, minutes] = this.scheduledTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Method to check if appointment is upcoming
appointmentSchema.methods.isUpcoming = function() {
  const now = new Date();
  const appointmentTime = this.scheduledDateTime;
  return appointmentTime > now && this.status === 'confirmed';
};

// Method to check if appointment is overdue
appointmentSchema.methods.isOverdue = function() {
  const now = new Date();
  const appointmentTime = this.scheduledDateTime;
  return appointmentTime < now && ['pending', 'confirmed'].includes(this.status);
};

// Method to reschedule appointment
appointmentSchema.methods.reschedule = function(newDate, newTime, reason, requestedBy) {
  this.rescheduleHistory.push({
    fromDate: this.scheduledDate,
    toDate: newDate,
    reason,
    requestedBy,
    requestedAt: new Date()
  });
  
  this.scheduledDate = newDate;
  this.scheduledTime = newTime;
  this.status = 'rescheduled';
  
  return this.save();
};

/**
 * IMPROVED: Cancel appointment with donation frequency tracking
 * Tracks cancellations for fraud/abuse detection
 * @param {string} reason - Cancellation reason
 * @param {string} cancelledBy - User ID who cancelled
 * @param {object} cancellationMetadata - Additional info for tracking
 * @returns {Promise}
 */
appointmentSchema.methods.cancelAppointment = function(reason, cancelledBy, cancellationMetadata = {}) {
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    cancelledBy,
    cancelledAt: new Date()
  };
  this.workflowValidation.lastStatusChangeReason = `Cancelled: ${reason}`;
  return this.save();
};

/**
 * IMPROVED: Complete appointment with proper donation record
 * @param {object} donationData - Donation details (quantity, quality, complications)
 * @returns {Promise}
 */
appointmentSchema.methods.completeAppointment = function(donationData) {
  // Validate status transition
  if (!['confirmed', 'pending'].includes(this.status)) {
    throw new Error(`Cannot complete appointment in ${this.status} status`);
  }

  this.status = 'completed';
  this.lastDonationDate = new Date(); // Record last donation for interval check
  this.checkOut = {
    time: new Date(),
    notes: donationData.notes || '',
    complications: donationData.complications || [],
    recoveryTime: donationData.recoveryTime || 0
  };
  this.donation = {
    quantity: donationData.quantity,
    quality: donationData.quality,
    complications: donationData.complications || [],
    notes: donationData.notes
  };
  this.workflowValidation.lastStatusChangeReason = 'Donation completed successfully';
  return this.save();
};

/**
 * IMPROVED: Validate and transition status with workflow rules
 * Prevents invalid state transitions
 * @param {string} newStatus - New status to transition to
 * @param {string} reason - Reason for status change
 * @returns {object} { valid: boolean, message: string }
 */
appointmentSchema.methods.validateStatusTransition = function(newStatus, reason = '') {
  const validTransitions = {
    'requested': ['approved', 'cancelled'],
    'approved': ['completed', 'no_show', 'cancelled'],
    'confirmed': ['completed', 'no_show', 'cancelled'],
    'pending': ['confirmed', 'cancelled', 'no_show'],
    'completed': ['verified'], // Only verified status allowed after completed
    'no_show': [],
    'cancelled': [],
    'verified': [],
    'rescheduled': ['confirmed', 'cancelled']
  };

  const currentStatus = this.status;
  const allowed = validTransitions[currentStatus] || [];

  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition from '${currentStatus}' to '${newStatus}'`
    };
  }

  return { valid: true, message: 'Status transition allowed' };
};

/**
 * IMPROVED: Safe status update with workflow validation
 * @param {string} newStatus - New status
 * @param {object} updateData - Additional data for the update
 * @returns {Promise}
 */
appointmentSchema.methods.updateStatusSafely = async function(newStatus, updateData = {}) {
  const validation = this.validateStatusTransition(newStatus, updateData.reason);
  
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  this.status = newStatus;
  this.workflowValidation.lastStatusChangeReason = updateData.reason || `Status changed to ${newStatus}`;
  
  // Handle emergency auto-approval
  if (this.isEmergencyLinked && newStatus === 'approved') {
    this.priority = 'emergency';
    this.autoApprovalReason = 'emergency_ticket';
  }

  return this.save();
};

/**
 * IMPROVED: Check 90-day donation interval safety
 * Medical compliance - ensures donor safety between donations
 * @returns {object} { eligible: boolean, daysUntilEligible: number, lastDonationRate: number }
 */
appointmentSchema.methods.checkDonationInterval = function() {
  if (!this.lastDonationDate) {
    return { eligible: true, daysUntilEligible: 0 };
  }

  const MINIMUM_INTERVAL_DAYS = 90;
  const daysSinceLastDonation = Math.floor(
    (Date.now() - this.lastDonationDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const eligible = daysSinceLastDonation >= MINIMUM_INTERVAL_DAYS;
  const daysUntilEligible = Math.max(0, MINIMUM_INTERVAL_DAYS - daysSinceLastDonation);

  return {
    eligible,
    daysUntilEligible,
    lastDonationRate: daysSinceLastDonation
  };
};

// Static method to find appointments by date range
appointmentSchema.statics.findByDateRange = function(startDate, endDate, hospitalId = null) {
  const query = {
    scheduledDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (hospitalId) {
    query.hospital = hospitalId;
  }
  
  return this.find(query).populate('donor hospital');
};

/**
 * IMPROVED: Find available slots with capacity constraints
 * Ensures slot capacity not exceeded
 * @param {string} hospitalId - Hospital ID
 * @param {Date} date - Date to check
 * @param {number} duration - Appointment duration in minutes
 * @param {number} maxDonorsPerSlot - Max donors allowed per time slot
 * @returns {Promise<Array>} Available slots with capacity info
 */
appointmentSchema.statics.findAvailableSlotsWithCapacity = async function(
  hospitalId, 
  date, 
  duration = 60, 
  maxDonorsPerSlot = 5
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Get all appointments for this hospital on this date
  const appointments = await this.find({
    hospital: hospitalId,
    scheduledDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['confirmed', 'pending', 'approved'] }
  }).select('scheduledTime duration slotCapacity');

  // Generate time slots (9 AM to 5 PM, 1-hour intervals)
  const availableSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    
    // Count donors already booked for this time slot
    const donorsInSlot = appointments.filter(apt => apt.scheduledTime === timeString).length;
    const slotsAvailable = maxDonorsPerSlot - donorsInSlot;
    
    availableSlots.push({
      time: timeString,
      available: slotsAvailable > 0,
      capacity: {
        max: maxDonorsPerSlot,
        booked: donorsInSlot,
        available: Math.max(0, slotsAvailable)
      }
    });
  }

  return availableSlots;
};

/**
 * IMPROVED: Check donor's cancellation pattern for abuse detection
 * Flags donors with >3 cancellations in 30 days
 * @param {string} donorId - Donor ID
 * @returns {Promise<object>} Cancellation stats and flagging status
 */
appointmentSchema.statics.checkCancellationPattern = async function(donorId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const cancellations = await this.countDocuments({
    donor: donorId,
    status: 'cancelled',
    'cancellation.cancelledAt': { $gte: thirtyDaysAgo }
  });

  const CANCELLATION_THRESHOLD = 3;
  const shouldFlag = cancellations > CANCELLATION_THRESHOLD;

  return {
    cancellationCount: cancellations,
    threshold: CANCELLATION_THRESHOLD,
    shouldFlag,
    flagReason: shouldFlag ? `High cancellation rate: ${cancellations} in last 30 days` : null
  };
};

/**
 * IMPROVED: Get suggested hospitals near donor location with available slots
 * Uses geospatial queries for proximity and checks capacity
 * @param {Array<number>} donorCoordinates - [longitude, latitude]
 * @param {number} radiusKm - Search radius in kilometers
 * @param {Date} preferredDate - Preferred date for appointment
 * @returns {Promise<Array>} Nearby hospitals with available slots
 */
appointmentSchema.statics.getSuggestedHospitalsNearby = async function(
  donorCoordinates,
  radiusKm = 15,
  preferredDate = new Date()
) {
  const Hospital = require('./Hospital');
  
  const radiusInMeters = radiusKm * 1000;

  try {
    // Find hospitals within radius using geospatial query
    const nearbyHospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: donorCoordinates // [lng, lat]
          },
          $maxDistance: radiusInMeters
        }
      },
      status: 'approved',
      isActive: true
    }).select('hospitalName location address contact capacity workingHours');

    if (!nearbyHospitals.length) {
      return [];
    }

    // For each hospital, check available slots
    const suggestedHospitals = await Promise.all(
      nearbyHospitals.map(async (hospital) => {
        const availableSlots = await this.findAvailableSlotsWithCapacity(
          hospital._id,
          preferredDate,
          60,
          hospital.capacity?.appointmentSlotCapacity || 5
        );

        const hasAvailableSlots = availableSlots.some(slot => slot.available);

        return {
          hospital: {
            _id: hospital._id,
            name: hospital.hospitalName,
            address: hospital.address,
            contact: hospital.contact,
            location: hospital.location
          },
          availableSlots: availableSlots.filter(s => s.available),
          workingHours: hospital.workingHours,
          isOpen: hasAvailableSlots
        };
      })
    );

    // Return only hospitals with available slots, sorted by distance
    return suggestedHospitals.filter(h => h.isOpen);
  } catch (error) {
    console.error('Error in getSuggestedHospitalsNearby:', error);
    throw error;
  }
};

/**
 * IMPROVED: Legacy method for backward compatibility
 */
appointmentSchema.statics.findAvailableSlots = function(hospitalId, date, duration = 60) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    hospital: hospitalId,
    scheduledDate: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['confirmed', 'pending'] }
  }).select('scheduledTime duration');
};

module.exports = mongoose.model('Appointment', appointmentSchema);
