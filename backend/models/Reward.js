const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  rewardId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['points_only', 'badge', 'certificate', 'merchandise', 'discount'],
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
  pointsCost: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String, // URL
    default: null
  },
  value: {
    type: Number, // monetary value if merchandise
    default: 0
  },
  category: {
    type: String,
    enum: ['lifestyle', 'health', 'recognition', 'voucher', 'merchandise'],
    default: 'lifestyle'
  },
  stock: {
    type: Number, // only for merchandise
    required: function() {
      return this.type === 'merchandise';
    }
  },
  expiryDate: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  },
  usageLimit: {
    type: Number, // how many times can be redeemed total
    default: null // null = unlimited
  },
  currentUsageCount: {
    type: Number,
    default: 0
  },
  redemptionHistory: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },
    redeemedAt: {
      type: Date,
      default: Date.now
    },
    pointsUsed: Number,
    quantity: Number,
    status: {
      type: String,
      enum: ['pending', 'processed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    shippingTrackingId: String,
    deliveredDate: Date,
    notes: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
rewardSchema.index({ type: 1, isActive: 1 });
rewardSchema.index({ pointsCost: 1 });
rewardSchema.index({ expiryDate: 1 });

// Check if reward is available
rewardSchema.methods.isAvailable = function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  if (this.expiryDate && this.expiryDate < now) return false;
  if (this.usageLimit && this.currentUsageCount >= this.usageLimit) return false;
  
  // Check stock for merchandise
  if (this.type === 'merchandise' && this.stock <= 0) return false;
  
  return true;
};

module.exports = mongoose.model('Reward', rewardSchema);
