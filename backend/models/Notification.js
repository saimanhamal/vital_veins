const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'hospital', 'donor'],
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: Date
  }],
  type: {
    type: String,
    enum: [
      'ticket_created',
      'ticket_updated',
      'ticket_resolved',
      'appointment_booked',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_reminder',
      'donation_completed',
      'hospital_approved',
      'hospital_rejected',
      'emergency_alert',
      'system_announcement',
      'inventory_low',
      'donor_registered',
      'hospital_registered',
      'general',
      'info'
    ],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'emergency'],
    default: 'info'
  },
  data: {
    ticketId: mongoose.Schema.Types.ObjectId,
    appointmentId: mongoose.Schema.Types.ObjectId,
    hospitalId: mongoose.Schema.Types.ObjectId,
    donorId: mongoose.Schema.Types.ObjectId,
    customData: mongoose.Schema.Types.Mixed
  },
  channels: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push', 'in_app'],
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    failed: {
      type: Boolean,
      default: false
    },
    failureReason: String
  }],
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30); // 30 days default expiry
      return expiry;
    }
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: String,
  actionText: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ 'recipients.user': 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: -1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });

// Generate unique notification ID
notificationSchema.pre('save', function(next) {
  if (!this.notificationId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.notificationId = `NOT${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Virtual for unread count
notificationSchema.virtual('unreadCount').get(function() {
  return this.recipients.filter(recipient => !recipient.read).length;
});

// Virtual for read count
notificationSchema.virtual('readCount').get(function() {
  return this.recipients.filter(recipient => recipient.read).length;
});

// Method to mark as read for specific user
notificationSchema.methods.markAsRead = function(userId) {
  const recipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (recipient && !recipient.read) {
    recipient.read = true;
    recipient.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark as read for all recipients
notificationSchema.methods.markAllAsRead = function() {
  this.recipients.forEach(recipient => {
    if (!recipient.read) {
      recipient.read = true;
      recipient.readAt = new Date();
    }
  });
  return this.save();
};

// Method to add recipient
notificationSchema.methods.addRecipient = function(userId, role) {
  const existingRecipient = this.recipients.find(r => r.user.toString() === userId.toString());
  if (!existingRecipient) {
    this.recipients.push({
      user: userId,
      role: role,
      read: false
    });
  }
  return this.save();
};

// Method to remove recipient
notificationSchema.methods.removeRecipient = function(userId) {
  this.recipients = this.recipients.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

// Method to update channel status
notificationSchema.methods.updateChannelStatus = function(channelType, status, additionalData = {}) {
  const channel = this.channels.find(c => c.type === channelType);
  if (channel) {
    Object.assign(channel, status, additionalData);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  const {
    sender,
    recipients,
    type,
    title,
    message,
    priority = 'medium',
    category = 'info',
    data: notificationData = {},
    channels = ['in_app'],
    scheduledFor = new Date(),
    actionRequired = false,
    actionUrl = null,
    actionText = null
  } = data;

  const recipientsArray = recipients.map(recipient => ({
    user: recipient.userId || recipient.user,
    role: recipient.role,
    read: false
  }));

  const channelsArray = channels.map(channel => ({
    type: channel,
    sent: false,
    delivered: false,
    failed: false
  }));

  return this.create({
    sender,
    recipients: recipientsArray,
    type,
    title,
    message,
    priority,
    category,
    data: notificationData,
    channels: channelsArray,
    scheduledFor,
    actionRequired,
    actionUrl,
    actionText
  });
};

// Static method to find notifications for user
notificationSchema.statics.findForUser = function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    unreadOnly = false,
    type = null,
    priority = null
  } = options;

  const query = {
    'recipients.user': userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  };

  if (unreadOnly) {
    query['recipients.read'] = false;
  }

  if (type) {
    query.type = type;
  }

  if (priority) {
    query.priority = priority;
  }

  return this.find(query)
    .populate('sender', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    'recipients.user': userId,
    'recipients.read': false,
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
