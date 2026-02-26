const express = require('express');
const router = express.Router();
const FraudAlert = require('../models/FraudAlert');
const Donor = require('../models/Donor');
const Ticket = require('../models/Ticket');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePagination, validateObjectId } = require('../middleware/validation');

/**
 * Fraud Detection Rules Engine
 * Detects suspicious patterns and creates alerts
 */
const FraudDetectionRules = {
  // Rule 1: High frequency donation attempts
  checkHighFrequencyAttempts: async (userId) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const appointmentCount = await Appointment.countDocuments({
        donor: userId,
        createdAt: { $gte: thirtyDaysAgo },
        status: { $in: ['pending', 'confirmed'] }
      });

      // Normal: 1-2 appointments per month
      if (appointmentCount > 4) {
        return {
          triggered: true,
          type: 'high_frequency_donation',
          severity: appointmentCount > 8 ? 'critical' : 'high',
          evidence: {
            ruleTriggered: 'Donor attempted >4 donations in 30 days',
            metric: 'appointment_frequency',
            value: appointmentCount,
            threshold: 4
          }
        };
      }

      return { triggered: false };
    } catch (error) {
      console.error('Error in checkHighFrequencyAttempts:', error);
      return { triggered: false };
    }
  },

  // Rule 2: High cancellation rate
  checkHighCancellationRate: async (userId) => {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const totalAppointments = await Appointment.countDocuments({
        donor: userId,
        createdAt: { $gte: ninetyDaysAgo }
      });

      if (totalAppointments < 5) return { triggered: false }; // Need at least 5 to flag

      const cancelledAppointments = await Appointment.countDocuments({
        donor: userId,
        status: 'cancelled',
        createdAt: { $gte: ninetyDaysAgo }
      });

      const cancellationRate = (cancelledAppointments / totalAppointments) * 100;

      if (cancellationRate > 50) {
        return {
          triggered: true,
          type: 'high_cancellation_rate',
          severity: cancellationRate > 80 ? 'high' : 'medium',
          evidence: {
            ruleTriggered: `High cancellation rate (${cancellationRate.toFixed(1)}%)`,
            metric: 'cancellation_rate',
            value: cancellationRate,
            threshold: 50,
            affectedAppointments: await Appointment.find({
              donor: userId,
              status: 'cancelled',
              createdAt: { $gte: ninetyDaysAgo }
            }).select('_id')
          }
        };
      }

      return { triggered: false };
    } catch (error) {
      console.error('Error in checkHighCancellationRate:', error);
      return { triggered: false };
    }
  },

  // Rule 3: Duplicate request pattern (same blood type, same hospital, short timeframe)
  checkDuplicateRequests: async (userId) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const appointments = await Appointment.find({
        donor: userId,
        createdAt: { $gte: sevenDaysAgo }
      }).populate('hospital', '_id bloodType');

      const hospitalMap = {};
      let duplicateFound = false;

      for (const apt of appointments) {
        const key = `${apt.hospital._id}`;
        if (hospitalMap[key]) {
          duplicateFound = true;
          break;
        }
        hospitalMap[key] = true;
      }

      if (duplicateFound && appointments.length > 3) {
        return {
          triggered: true,
          type: 'duplicate_request',
          severity: 'medium',
          evidence: {
            ruleTriggered: 'Multiple requests to same hospital in 7 days',
            metric: 'duplicate_requests',
            value: appointments.length,
            threshold: 2,
            affectedTickets: appointments.map(a => a._id)
          }
        };
      }

      return { triggered: false };
    } catch (error) {
      console.error('Error in checkDuplicateRequests:', error);
      return { triggered: false };
    }
  },

  // Rule 4: Location anomaly
  checkLocationAnomaly: async (userId) => {
    try {
      const donor = await Donor.findOne({ user: userId });
      if (!donor) return { triggered: false };

      const registeredLocation = donor.location.coordinates; // [lng, lat]
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const recentAppointments = await Appointment.find({
        donor: donor._id,
        createdAt: { $gte: sevenDaysAgo }
      }).populate('hospital', 'location address');

      // Calculate distance using simplified formula (Haversine)
      const calculateDistance = (coord1, coord2) => {
        const [lon1, lat1] = coord1;
        const [lon2, lat2] = coord2;
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      for (const apt of recentAppointments) {
        if (apt.hospital.location.coordinates) {
          const distance = calculateDistance(registeredLocation, apt.hospital.location.coordinates);
          
          // Flag if >500km away from registered address
          if (distance > 500) {
            return {
              triggered: true,
              type: 'location_anomaly',
              severity: 'medium',
              evidence: {
                ruleTriggered: `Appointment location ${distance.toFixed(0)}km from registered address`,
                metric: 'distance_from_registered',
                value: distance,
                threshold: 500
              }
            };
          }
        }
      }

      return { triggered: false };
    } catch (error) {
      console.error('Error in checkLocationAnomaly:', error);
      return { triggered: false };
    }
  },

  // Rule 5: Low response rate to matching requests
  checkLowResponseRate: async (userId) => {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const donor = await Donor.findOne({ user: userId });
      if (!donor) return { triggered: false };

      const matchingTickets = await Ticket.countDocuments({
        status: 'open',
        'responses.responder': { $ne: donor._id },
        createdAt: { $gte: ninetyDaysAgo }
      });

      if (matchingTickets < 10) return { triggered: false };

      const respondedTickets = await Ticket.countDocuments({
        'responses.responder': donor._id,
        createdAt: { $gte: ninetyDaysAgo }
      });

      const responseRate = (respondedTickets / matchingTickets) * 100;

      if (responseRate < 30) {
        return {
          triggered: true,
          type: 'low_response_rate',
          severity: 'low',
          evidence: {
            ruleTriggered: `Low response rate to matching requests (${responseRate.toFixed(1)}%)`,
            metric: 'response_rate',
            value: responseRate,
            threshold: 30
          }
        };
      }

      return { triggered: false };
    } catch (error) {
      console.error('Error in checkLowResponseRate:', error);
      return { triggered: false };
    }
  }
};

/**
 * @route   POST /api/admin/fraud/detect
 * @desc    Trigger fraud detection scan
 * @access  Private (Admin only)
 */
router.post('/detect', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { scanType = 'full', userId, days = 30 } = req.body;

    let donors = [];
    
    if (scanType === 'user_id' && userId) {
      const donor = await Donor.findOne({ user: userId });
      if (donor) donors.push(donor);
    } else {
      // Get all active donors
      donors = await Donor.find({ isActive: true })
        .populate('user', '_id email name')
        .limit(scanType === 'recent' ? 100 : undefined);
    }

    const alerts = [];
    const scanStartTime = new Date();

    for (const donor of donors) {
      // Run all fraud detection rules
      const rules = [
        await FraudDetectionRules.checkHighFrequencyAttempts(donor._id),
        await FraudDetectionRules.checkHighCancellationRate(donor._id),
        await FraudDetectionRules.checkDuplicateRequests(donor._id),
        await FraudDetectionRules.checkLocationAnomaly(donor._id),
        await FraudDetectionRules.checkLowResponseRate(donor._id)
      ];

      for (const rule of rules) {
        if (rule.triggered) {
          const alertId = `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

          const alert = new FraudAlert({
            alertId,
            user: donor.user._id,
            type: rule.type,
            severity: rule.severity,
            description: rule.evidence.ruleTriggered,
            evidence: rule.evidence,
            status: 'open',
            action: rule.severity === 'critical' ? 'freeze' : rule.severity === 'high' ? 'flag' : 'alert',
            autoDetected: true
          });

          await alert.save();
          alerts.push(alert);

          // Notify admin if critical
          if (rule.severity === 'critical') {
            await Notification.createNotification({
              recipients: [{ user: null, role: 'admin' }],
              type: 'fraud_alert',
              title: '🚨 Critical Fraud Alert',
              content: `Critical fraud detected for ${donor.personalInfo.firstName} ${donor.personalInfo.lastName}`,
              data: { alertId: alert._id }
            });
          }
        }
      }
    }

    res.json({
      message: `Fraud detection scan completed. ${alerts.length} alerts generated.`,
      scanId: `SCAN_${Date.now()}`,
      startTime: scanStartTime,
      endTime: new Date(),
      donorsScanned: donors.length,
      alertsFound: alerts.length,
      alerts: alerts.map(a => ({
        alertId: a.alertId,
        user: a.user,
        type: a.type,
        severity: a.severity,
        status: a.status
      }))
    });
  } catch (error) {
    console.error('Error in fraud detection:', error);
    res.status(500).json({
      message: 'Server error during fraud detection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/fraud/alerts
 * @desc    Get all fraud alerts
 * @access  Private (Admin only)
 */
router.get('/alerts', authenticate, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const alerts = await FraudAlert.find(filter)
      .populate('user', 'name email')
      .populate('resolvedBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await FraudAlert.countDocuments(filter);

    // Count by status & severity
    const stats = await FraudAlert.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          openCount: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          highSeverity: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
          criticalSeverity: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          investigatingCount: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      alerts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || {}
    });
  } catch (error) {
    console.error('Error fetching fraud alerts:', error);
    res.status(500).json({
      message: 'Server error fetching alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/fraud/alerts/:alertId
 * @desc    Get specific fraud alert
 * @access  Private (Admin only)
 */
router.get('/alerts/:alertId', authenticate, authorize('admin'), validateObjectId('alertId'), async (req, res) => {
  try {
    const alert = await FraudAlert.findById(req.params.alertId)
      .populate('user', 'name email')
      .populate('resolvedBy', 'name')
      .populate('evidence.affectedTickets')
      .populate('evidence.affectedAppointments');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Error fetching fraud alert:', error);
    res.status(500).json({
      message: 'Server error fetching alert',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/fraud/alerts/:alertId
 * @desc    Resolve fraud alert
 * @access  Private (Admin only)
 */
router.put('/alerts/:alertId', authenticate, authorize('admin'), validateObjectId('alertId'), async (req, res) => {
  try {
    const { status, action, notes, escalate } = req.body;

    const alert = await FraudAlert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Update alert
    alert.status = status || alert.status;
    alert.action = action || alert.action;
    alert.adminNotes = notes || alert.adminNotes;
    
    if (escalate) {
      alert.escalated = true;
      alert.escalatedAt = new Date();
      alert.escalatedBy = req.user._id;
    }

    if (status === 'confirmed' || status === 'false_alarm' || status === 'resolved') {
      alert.resolvedBy = req.user._id;
      alert.resolvedAt = new Date();
    }

    await alert.save();

    // If action is freeze/flag, update donor status
    if (action === 'freeze') {
      const donor = await Donor.findOne({ user: alert.user });
      if (donor) {
        donor.status = 'suspended';
        donor.isActive = false;
        await donor.save();

        // Create notification
        await Notification.createNotification({
          recipients: [{ user: alert.user, role: 'donor' }],
          type: 'account_suspended',
          title: 'Account Suspended',
          content: 'Your account has been suspended due to suspicious activity. Please contact support.',
          data: { alertId: alert._id }
        });
      }
    } else if (action === 'verify') {
      const donor = await Donor.findOne({ user: alert.user });
      if (donor && donor.status === 'suspended') {
        donor.status = 'active';
        donor.isActive = true;
        await donor.save();
      }
    }

    res.json({
      message: 'Alert updated successfully',
      alert
    });
  } catch (error) {
    console.error('Error updating fraud alert:', error);
    res.status(500).json({
      message: 'Server error updating alert',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/fraud/dashboard
 * @desc    Get fraud detection dashboard stats
 * @access  Private (Admin only)
 */
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await FraudAlert.aggregate([
      {
        $facet: {
          totalAlerts: [{ $count: 'count' }],
          openAlerts: [{ $match: { status: 'open' } }, { $count: 'count' }],
          criticalAlerts: [{ $match: { severity: 'critical' } }, { $count: 'count' }],
          recentAlerts: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $count: 'count' }
          ],
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    const suspendedDonorsCount = await Donor.countDocuments({ status: 'suspended' });
    const flaggedDonorsCount = await FraudAlert.distinct('user', { status: 'open' });

    res.json({
      summary: {
        totalAlerts: stats[0].totalAlerts[0]?.count || 0,
        openAlerts: stats[0].openAlerts[0]?.count || 0,
        criticalAlerts: stats[0].criticalAlerts[0]?.count || 0,
        recentAlerts: stats[0].recentAlerts[0]?.count || 0,
        suspendedDonors: suspendedDonorsCount,
        flaggedDonors: flaggedDonorsCount.length
      },
      byType: stats[0].byType,
      bySeverity: stats[0].bySeverity
    });
  } catch (error) {
    console.error('Error fetching fraud dashboard:', error);
    res.status(500).json({
      message: 'Server error fetching dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
