const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'duplicate_request',
      'high_frequency_donation',
      'location_anomaly',
      'high_cancellation_rate',
      'low_response_rate',
      'payment_anomaly',
      'duplicate_account',
      'fake_donation_claim'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  evidence: {
    ruleTriggered: String,
    metric: String, // e.g., "donation_frequency"
    value: mongoose.Schema.Types.Mixed, // numeric or object
    threshold: mongoose.Schema.Types.Mixed,
    affectedTickets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket'
    }],
    affectedAppointments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    }],
    suspiciousPattern: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'confirmed', 'false_alarm', 'resolved'],
    default: 'open'
  },
  action: {
    type: String,
    enum: ['flag', 'freeze', 'alert', 'verify', 'none'],
    default: 'alert'
  },
  adminNotes: String,
  investigationNotes: String,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionDetails: {
    action: String,
    reason: String,
    evidenceReviewed: Boolean
  },
  resolvedAt: Date,
  autoDetected: {
    type: Boolean,
    default: true // true if detected automatically, false if manually reported
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: Date,
  escalatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
fraudAlertSchema.index({ user: 1, createdAt: -1 });
fraudAlertSchema.index({ status: 1, severity: 1 });
fraudAlertSchema.index({ type: 1 });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
