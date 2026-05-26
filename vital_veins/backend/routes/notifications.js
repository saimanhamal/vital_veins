const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', validatePagination, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type;
    const priority = req.query.priority;

    const options = {
      limit,
      skip,
      unreadOnly,
      type,
      priority
    };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.findForUser(userId, options),
      Notification.countDocuments({
        'recipients.user': userId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      }),
      Notification.getUnreadCount(userId)
    ]);

    res.json({
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      message: 'Server error fetching notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      message: 'Server error fetching unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', validateObjectId('id'), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    await notification.markAsRead(userId);

    res.json({
      message: 'Notification marked as read',
      notification: {
        id: notification._id,
        title: notification.title,
        read: true
      }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      message: 'Server error marking notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unread notifications for the user
    const notifications = await Notification.find({
      'recipients.user': userId,
      'recipients.read': false,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    // Mark each notification as read
    for (const notification of notifications) {
      await notification.markAsRead(userId);
    }

    res.json({
      message: 'All notifications marked as read',
      count: notifications.length
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      message: 'Server error marking all notifications as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    // Check if user is a recipient
    const recipient = notification.recipients.find(r => r.user.toString() === userId.toString());
    if (!recipient) {
      return res.status(403).json({
        message: 'Access denied. You can only delete your own notifications.'
      });
    }

    // Remove user from recipients
    await notification.removeRecipient(userId);

    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      message: 'Server error deleting notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (placeholder)
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    // Stats endpoint placeholder
    res.json({ message: 'Notification statistics' });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get single notification
// @access  Private
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId)
      .populate('sender', 'name email role');

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    // Check if user is a recipient
    const recipient = notification.recipients.find(r => r.user.toString() === userId.toString());
    if (!recipient) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own notifications.'
      });
    }

    // Mark as read if not already read
    if (!recipient.read) {
      await notification.markAsRead(userId);
    }

    res.json({
      notification
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      message: 'Server error fetching notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
