const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true
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
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  patientInfo: {
    name: String,
    age: Number,
    condition: String,
    doctorName: String,
    roomNumber: String
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'cancelled'],
    default: 'open'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  assignedTo: {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: Date
  },
  responses: [{
    responder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    responderType: {
      type: String,
      enum: ['admin', 'hospital', 'donor'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['offer', 'question', 'update', 'resolution'],
      default: 'offer'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String,
  notifications: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  expiresAt: {
    type: Date,
    default: function() {
      const now = new Date();
      const urgencyHours = {
        'critical': 2,
        'high': 6,
        'medium': 24,
        'low': 72
      };
      now.setHours(now.getHours() + urgencyHours[this.urgency]);
      return now;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for geospatial queries
ticketSchema.index({ location: '2dsphere' });
ticketSchema.index({ status: 1, urgency: -1 });
ticketSchema.index({ createdAt: -1 });

// Generate unique ticket ID
ticketSchema.pre('save', function(next) {
  if (!this.ticketId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.ticketId = `TKT${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Virtual for display type
ticketSchema.virtual('displayType').get(function() {
  return this.type === 'blood' ? this.bloodType : this.organType;
});

// Virtual for urgency color
ticketSchema.virtual('urgencyColor').get(function() {
  const colors = {
    'critical': 'red',
    'high': 'orange',
    'medium': 'yellow',
    'low': 'green'
  };
  return colors[this.urgency];
});

// Method to add response
ticketSchema.methods.addResponse = function(responderId, responderType, message, status = 'offer') {
  this.responses.push({
    responder: responderId,
    responderType,
    message,
    status,
    createdAt: new Date()
  });
  return this.save();
};

// Method to update status
ticketSchema.methods.updateStatus = function(newStatus, resolvedBy = null, notes = '') {
  this.status = newStatus;
  if (newStatus === 'resolved' || newStatus === 'closed') {
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
    this.resolutionNotes = notes;
  }
  return this.save();
};

// Static method to find nearby tickets
ticketSchema.statics.findNearby = function(coordinates, maxDistance = 50000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: { $in: ['open', 'in_progress'] }
  });
};

module.exports = mongoose.model('Ticket', ticketSchema);
