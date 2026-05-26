const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  badgeId: {
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
  icon: {
    type: String, // URL to badge icon
    default: null
  },
  requirement: {
    type: {
      type: String,
      enum: ['donation_count', 'donation_volume', 'consecutive_months', 'time_based'],
      required: true
    },
    value: {
      type: Number,
      required: true
      // For donation_count: "First donation" = 1, "Five Donations" = 5
      // For donation_volume: amount in ml (e.g., 1500)
      // For consecutive_months: number of months (e.g., 12)
      // For time_based: days since registration (e.g., 365)
    }
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  reward: {
    points: {
      type: Number,
      default: 10
    },
    description: {
      type: String,
      default: 'Badge earned'
    }
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

module.exports = mongoose.model('Badge', badgeSchema);
