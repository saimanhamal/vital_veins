const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
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
  type: {
    type: String,
    enum: ['blood_drive', 'awareness_campaign', 'recruitment_drive', 'emergency_drive'],
    default: 'blood_drive'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    zipCode: { type: String, required: true }
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  registrations: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    attended: {
      type: Boolean,
      default: false
    },
    bloodCollected: {
      type: Number, // in ml
      default: 0
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'attended', 'cancelled', 'no_show'],
      default: 'registered'
    },
    notificationSent: {
      type: Boolean,
      default: false
    }
  }],
  targetBloodTypes: [{
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  }],
  incentives: {
    description: String,
    rewardPoints: {
      type: Number,
      default: 25
    },
    giftDescription: String
  },
  statistics: {
    totalDonorsRegistered: {
      type: Number,
      default: 0
    },
    totalDonorsAttended: {
      type: Number,
      default: 0
    },
    totalBloodCollected: {
      type: Number, // in ml
      default: 0
    },
    successRate: {
      type: Number, // percentage
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['planning', 'live', 'completed', 'cancelled'],
    default: 'planning'
  },
  banner: {
    type: String, // URL
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  timestamps: true
});

// GeoJSON Index for location-based queries
eventSchema.index({ location: '2dsphere' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });

// Generate unique event ID
eventSchema.pre('save', function(next) {
  if (!this.eventId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.eventId = `EVT${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Update registration count
eventSchema.methods.updateRegistrationStats = async function() {
  const attended = this.registrations.filter(r => r.attended).length;
  const totalBlood = this.registrations.reduce((sum, r) => sum + (r.bloodCollected || 0), 0);
  
  this.statistics.totalDonorsRegistered = this.registrations.length;
  this.statistics.totalDonorsAttended = attended;
  this.statistics.totalBloodCollected = totalBlood;
  this.statistics.successRate = this.registrations.length > 0 
    ? Math.round((attended / this.registrations.length) * 100)
    : 0;
  
  return this.save();
};

module.exports = mongoose.model('Event', eventSchema);
