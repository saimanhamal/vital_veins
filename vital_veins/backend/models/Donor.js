const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donorId: {
    type: String,
    unique: true
  },
  personalInfo: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    dateOfBirth: { type: Date, default: () => new Date('1970-01-01') },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other', lowercase: true },
    bloodType: { 
      type: String, 
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], 
      default: 'O+'
    },
    weight: { type: Number, default: 70 },
    height: { type: Number, default: 170 }
  },
  contact: {
    phone: { type: String, default: '' },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' }
    }
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'Nepal' }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  donationPreferences: {
    bloodDonation: {
      eligible: { type: Boolean, default: true }
    },
    organDonation: {
      consent: { type: Boolean, default: false },
      organs: [{
        type: { 
          type: String, 
          enum: ['heart', 'liver', 'kidney', 'lung', 'pancreas', 'intestine', 'cornea', 'skin', 'bone'],
          lowercase: true
        },
        consent: { type: Boolean, default: false }
      }]
    }
  },
  medicalHistory: {
    allergies: [String],
    medications: [String],
    chronicConditions: [String],
    recentSurgeries: [String],
    lastMedicalCheckup: Date
  },
  documents: [{
    name: String,
    url: String,
    type: { type: String, enum: ['id', 'medical', 'consent', 'other'] },
    uploadedAt: { type: Date, default: Date.now }
  }],
  donationHistory: [{
    type: { type: String, enum: ['blood', 'organ'], required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    date: { type: Date, required: true },
    quantity: { type: Number, default: 1 },
    status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' },
    notes: String
  }],
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    maxDistance: { type: Number, default: 50 }, // km
    preferredHospitals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  // Gamification & Milestones
  milestones: [{
    badge: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
    awardedAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
  }],
  donationPoints: {
    total: { type: Number, default: 0 }, // Total points earned
    lifetime: { type: Number, default: 0 }, // Lifetime (never reset)
    current: { type: Number, default: 0 }, // Current balance
    lastUpdated: { type: Date, default: Date.now }
  },
  // Reward System
  rewards: {
    certificates: [{
      certificateNumber: String,
      type: String, // "1st Donation", "10 Donations", etc.
      issuedAt: { type: Date, default: Date.now },
      downloadUrl: String
    }],
    redemptionHistory: [{
      reward: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward' },
      pointsUsed: Number,
      quantity: Number,
      redeemedAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['pending', 'processed', 'delivered', 'cancelled'], default: 'pending' },
      trackingId: String,
      deliveredAt: Date
    }]
  },
  // Availability Management
  availability: {
    isAvailable: { type: Boolean, default: true },
    unavailableUntil: Date,
    unavailableReason: { 
      type: String, 
      enum: ['on_vacation', 'post_donation_rest', 'medical', 'other'],
      default: null
    },
    lastAvailabilityToggle: { type: Date, default: Date.now }
  },
  // Appointment System Improvements
  appointmentMetrics: {
    totalAppointments: { type: Number, default: 0 },
    completedAppointments: { type: Number, default: 0 },
    cancelledAppointments: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 }, // Percentage
    recentCancellations: [{
      appointmentId: mongoose.Schema.Types.ObjectId,
      cancelledAt: Date,
      reason: String
    }],
    flaggedForReview: {
      type: Boolean,
      default: false
    },
    flaggedReason: String,
    flaggedAt: Date,
    reviewNotes: String
  },
  lastCompletedDonationDate: {
    type: Date,
    default: null
  }
} , {
  timestamps: true
});

// Index for geospatial queries
donorSchema.index({ location: '2dsphere' });
donorSchema.index({ 'appointmentMetrics.flaggedForReview': 1 });
donorSchema.index({ 'appointmentMetrics.recentCancellations': 1 });
donorSchema.index({ lastCompletedDonationDate: 1 });

// Add status to align with admin UI expectations
donorSchema.add({
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'inactive'],
    default: 'pending'
  }
});

// Generate unique donor ID
donorSchema.pre('save', function(next) {
  if (!this.donorId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.donorId = `DON${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Virtual for full name
donorSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for age
donorSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Method to check donation eligibility
donorSchema.methods.isEligibleForBloodDonation = function() {
  const now = new Date();
  const lastDonation = this.donationPreferences.bloodDonation.lastDonation;
  
  if (!lastDonation) return true;
  
  const daysSinceLastDonation = Math.floor((now - lastDonation) / (1000 * 60 * 60 * 24));
  return daysSinceLastDonation >= 56; // 8 weeks for blood donation
};

// Method to calculate next eligible date
donorSchema.methods.calculateNextEligibleDate = function() {
  const lastDonation = this.donationPreferences.bloodDonation.lastDonation;
  if (!lastDonation) return null;
  
  const nextEligible = new Date(lastDonation);
  nextEligible.setDate(nextEligible.getDate() + 56);
  return nextEligible;
};

/**
 * IMPROVED: Check strict 90-day donation interval for medical safety
 * @returns {object} { canDonate: boolean, daysUntilEligible: number, lastDonationDate: Date }
 */
donorSchema.methods.checkDonationInterval = function() {
  const MINIMUM_INTERVAL_DAYS = 90; // Medical safety requirement
  
  if (!this.lastCompletedDonationDate) {
    return {
      canDonate: true,
      daysUntilEligible: 0,
      lastDonationDate: null,
      message: 'First-time donor - eligible to donate'
    };
  }

  const now = new Date();
  const daysSinceLastDonation = Math.floor(
    (now - this.lastCompletedDonationDate) / (1000 * 60 * 60 * 24)
  );

  const canDonate = daysSinceLastDonation >= MINIMUM_INTERVAL_DAYS;
  const daysUntilEligible = Math.max(0, MINIMUM_INTERVAL_DAYS - daysSinceLastDonation);

  return {
    canDonate,
    daysUntilEligible,
    lastDonationDate: this.lastCompletedDonationDate,
    message: canDonate 
      ? `Eligible to donate. Last donation: ${daysSinceLastDonation} days ago`
      : `Not eligible yet. Please wait ${daysUntilEligible} more days`
  };
};

/**
 * IMPROVED: Track appointment cancellation and flag for review if threshold exceeded
 * @param {string} appointmentId - Appointment ID being cancelled
 * @param {string} reason - Cancellation reason
 * @returns {object} { flagged: boolean, cancellationCount: number, message: string }
 */
donorSchema.methods.recordCancellation = function(appointmentId, reason = '') {
  const CANCELLATION_THRESHOLD = 3;
  const DAYS_LOOKBACK = 30;

  // Add recent cancellation
  this.appointmentMetrics.recentCancellations.push({
    appointmentId,
    cancelledAt: new Date(),
    reason
  });

  // Clean up cancellations older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - DAYS_LOOKBACK);
  
  this.appointmentMetrics.recentCancellations = 
    this.appointmentMetrics.recentCancellations.filter(c => c.cancelledAt >= thirtyDaysAgo);

  this.appointmentMetrics.cancelledAppointments++;
  
  // Calculate cancellation rate
  const total = this.appointmentMetrics.totalAppointments;
  if (total > 0) {
    this.appointmentMetrics.cancellationRate = 
      Math.round((this.appointmentMetrics.cancelledAppointments / total) * 100);
  }

  // Flag for review if threshold exceeded
  const recentCancellationCount = this.appointmentMetrics.recentCancellations.length;
  const shouldFlag = recentCancellationCount > CANCELLATION_THRESHOLD;

  if (shouldFlag && !this.appointmentMetrics.flaggedForReview) {
    this.appointmentMetrics.flaggedForReview = true;
    this.appointmentMetrics.flaggedReason = 
      `High cancellation rate: ${recentCancellationCount} cancellations in last 30 days (threshold: ${CANCELLATION_THRESHOLD})`;
    this.appointmentMetrics.flaggedAt = new Date();
  }

  return {
    flagged: this.appointmentMetrics.flaggedForReview,
    cancellationCount: recentCancellationCount,
    threshold: CANCELLATION_THRESHOLD,
    message: shouldFlag 
      ? `Donor flagged for review. Cancellations: ${recentCancellationCount}`
      : `Cancellation recorded. Count: ${recentCancellationCount}/${CANCELLATION_THRESHOLD}`
  };
};

/**
 * IMPROVED: Record successful donation completion
 * Updates metrics and eligibility tracking
 */
donorSchema.methods.recordDonationCompletion = function() {
  this.appointmentMetrics.completedAppointments++;
  this.appointmentMetrics.totalAppointments++;
  this.lastCompletedDonationDate = new Date();
  
  // Recalculate cancellation rate
  if (this.appointmentMetrics.totalAppointments > 0) {
    this.appointmentMetrics.cancellationRate = Math.round(
      (this.appointmentMetrics.cancelledAppointments / this.appointmentMetrics.totalAppointments) * 100
    );
  }

  return this.save();
};

/**
 * IMPROVED: Clear flag after admin review and resolution
 */
donorSchema.methods.clearReviewFlag = function(reviewNotes = '') {
  this.appointmentMetrics.flaggedForReview = false;
  this.appointmentMetrics.flaggedReason = null;
  this.appointmentMetrics.reviewNotes = reviewNotes;
  
  return this.save();
};

module.exports = mongoose.model('Donor', donorSchema);
