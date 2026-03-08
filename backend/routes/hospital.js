const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const Ticket = require('../models/Ticket');
const Appointment = require('../models/Appointment');
const Donor = require('../models/Donor');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTicketCreation, validateAppointmentCreation, validateObjectId, validatePagination } = require('../middleware/validation');

// Apply authentication and hospital authorization to all routes
router.use(authenticate);
router.use(authorize('hospital'));

// Middleware to get hospital profile
const getHospitalProfile = async (req, res, next) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({
        message: 'Hospital profile not found'
      });
    }
    req.hospital = hospital;
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Server error fetching hospital profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

router.use(getHospitalProfile);

// @route   GET /api/hospital/dashboard
// @desc    Get hospital dashboard data
// @access  Private (Hospital only)
router.get('/dashboard', async (req, res) => {
  try {
    const hospital = req.hospital;
    
    const [
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      activeTickets,
      recentAppointments,
      upcomingAppointments
    ] = await Promise.all([
      Appointment.countDocuments({ hospital: hospital._id }),
      Appointment.countDocuments({ hospital: hospital._id, status: 'pending' }),
      Appointment.countDocuments({ hospital: hospital._id, status: 'completed' }),
      Ticket.countDocuments({ hospital: hospital._id, status: { $in: ['open', 'in_progress'] } }),
      Appointment.find({ hospital: hospital._id })
        .populate('donor', 'personalInfo contact')
        .sort({ createdAt: -1 })
        .limit(5),
      Appointment.find({ 
        hospital: hospital._id, 
        status: 'confirmed',
        scheduledDate: { $gte: new Date() }
      })
        .populate('donor', 'personalInfo contact')
        .sort({ scheduledDate: 1 })
        .limit(5)
    ]);

    // Calculate inventory summary
    const bloodInventory = hospital.inventory.blood.reduce((acc, item) => {
      acc[item.type] = item.quantity;
      return acc;
    }, {});

    const organInventory = hospital.inventory.organs.reduce((acc, item) => {
      acc[item.type] = item.quantity;
      return acc;
    }, {});

    res.json({
      hospital: {
        id: hospital._id,
        name: hospital.hospitalName,
        status: hospital.status,
        address: hospital.address,
        contact: hospital.contact
      },
      statistics: {
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        activeTickets
      },
      inventory: {
        blood: bloodInventory,
        organs: organInventory
      },
      recentActivity: {
        appointments: recentAppointments,
        upcoming: upcomingAppointments
      }
    });
  } catch (error) {
    console.error('Hospital dashboard error:', error);
    res.status(500).json({
      message: 'Server error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/hospital/profile
// @desc    Get hospital profile
// @access  Private (Hospital only)
router.get('/profile', async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id })
      .populate('user', 'name email phone address');

    res.json({
      hospital
    });
  } catch (error) {
    console.error('Hospital profile error:', error);
    res.status(500).json({
      message: 'Server error fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/hospital/profile
// @desc    Update hospital profile
// @access  Private (Hospital only)
router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    const hospitalId = req.hospital._id;

    // Remove fields that shouldn't be updated directly
    delete updates.status;
    delete updates.user;
    delete updates._id;

    const hospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');

    res.json({
      message: 'Hospital profile updated successfully',
      hospital
    });
  } catch (error) {
    console.error('Hospital profile update error:', error);
    res.status(500).json({
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/hospital/inventory
// @desc    Get hospital inventory
// @access  Private (Hospital only)
router.get('/inventory', async (req, res) => {
  try {
    const hospital = req.hospital;
    
    res.json({
      inventory: {
        blood: hospital.inventory.blood,
        organs: hospital.inventory.organs
      }
    });
  } catch (error) {
    console.error('Hospital inventory error:', error);
    res.status(500).json({
      message: 'Server error fetching inventory',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/hospital/inventory
// @desc    Update hospital inventory
// @access  Private (Hospital only)
router.put('/inventory', async (req, res) => {
  try {
    const { type, bloodType, organType, quantity, operation = 'add' } = req.body;
    const hospital = req.hospital;

    if (!type || !quantity) {
      return res.status(400).json({
        message: 'Type and quantity are required'
      });
    }

    if (type === 'blood' && !bloodType) {
      return res.status(400).json({
        message: 'Blood type is required for blood inventory'
      });
    }

    if (type === 'organ' && !organType) {
      return res.status(400).json({
        message: 'Organ type is required for organ inventory'
      });
    }

    const itemType = type === 'blood' ? bloodType : organType;
    const inventoryArray = type === 'blood' ? hospital.inventory.blood : hospital.inventory.organs;
    
    const existingItem = inventoryArray.find(item => item.type === itemType);
    
    if (existingItem) {
      if (operation === 'add') {
        existingItem.quantity += quantity;
      } else if (operation === 'subtract') {
        existingItem.quantity = Math.max(0, existingItem.quantity - quantity);
      } else if (operation === 'set') {
        existingItem.quantity = quantity;
      }
      existingItem.lastUpdated = new Date();
    } else {
      if (operation === 'add' || operation === 'set') {
        inventoryArray.push({
          type: itemType,
          quantity: quantity,
          lastUpdated: new Date()
        });
      }
    }

    await hospital.save();

    res.json({
      message: 'Inventory updated successfully',
      inventory: {
        blood: hospital.inventory.blood,
        organs: hospital.inventory.organs
      }
    });
  } catch (error) {
    console.error('Hospital inventory update error:', error);
    res.status(500).json({
      message: 'Server error updating inventory',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/hospital/tickets
// @desc    Create emergency ticket
// @access  Private (Hospital only)
router.post('/tickets', validateTicketCreation, async (req, res) => {
  try {
    const hospital = req.hospital;
    const ticketData = {
      ...req.body,
      hospital: hospital._id,
      location: hospital.location
    };

    const ticket = new Ticket(ticketData);
    await ticket.save();

    // Populate hospital data for response
    await ticket.populate('hospital', 'hospitalName contact address');

    // Create notifications for all donors with matching blood type or organ consent
    let targetDonors = [];
    
    if (ticket.type === 'blood') {
      const donors = await Donor.find({
        'personalInfo.bloodType': ticket.bloodType,
        'donationPreferences.bloodDonation.eligible': true,
        isActive: true
      }).populate('user', 'name email');
      targetDonors = donors;
    } else if (ticket.type === 'organ') {
      const donors = await Donor.find({
        'donationPreferences.organDonation.consent': true,
        'donationPreferences.organDonation.organs': {
          $elemMatch: {
            type: ticket.organType,
            consent: true
          }
        },
        isActive: true
      }).populate('user', 'name email');
      targetDonors = donors;
    }

    // Create notifications for donors
    if (targetDonors.length > 0) {
      const recipients = targetDonors.map(donor => ({
        userId: donor.user._id,
        role: 'donor'
      }));

      await Notification.createNotification({
        sender: req.user._id,
        recipients,
        type: 'emergency_alert',
        title: `Urgent ${ticket.type === 'blood' ? 'Blood' : 'Organ'} Need`,
        message: `${hospital.hospitalName} urgently needs ${ticket.displayType}. ${ticket.message}`,
        priority: ticket.urgency === 'critical' ? 'urgent' : 'high',
        category: 'emergency',
        data: { ticketId: ticket._id, hospitalId: hospital._id },
        channels: ['in_app', 'email', 'sms']
      });

      // Send real-time notifications
      targetDonors.forEach(donor => {
        req.io.to(`donor_${donor.user._id}`).emit('emergency_alert', {
          ticketId: ticket._id,
          hospitalName: hospital.hospitalName,
          type: ticket.type,
          displayType: ticket.displayType,
          urgency: ticket.urgency,
          message: ticket.message
        });
      });
    }

    // Notify admin
    const adminUsers = await require('../models/User').find({ role: 'admin', isActive: true });
    if (adminUsers.length > 0) {
      const adminRecipients = adminUsers.map(admin => ({
        userId: admin._id,
        role: 'admin'
      }));

      await Notification.createNotification({
        sender: req.user._id,
        recipients: adminRecipients,
        type: 'ticket_created',
        title: 'New Emergency Ticket',
        message: `${hospital.hospitalName} has created a new emergency ticket for ${ticket.displayType}`,
        priority: 'high',
        category: 'warning',
        data: { ticketId: ticket._id, hospitalId: hospital._id }
      });

      // Send real-time notifications to admins
      adminUsers.forEach(admin => {
        req.io.to(`admin_${admin._id}`).emit('new_ticket', {
          ticketId: ticket._id,
          hospitalName: hospital.hospitalName,
          type: ticket.type,
          displayType: ticket.displayType,
          urgency: ticket.urgency
        });
      });
    }

    res.status(201).json({
      message: 'Emergency ticket created successfully',
      ticket,
      notificationsSent: targetDonors.length
    });
  } catch (error) {
    console.error('Ticket creation error:', error);
    res.status(500).json({
      message: 'Server error creating ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/hospital/tickets
// @desc    Get hospital tickets
// @access  Private (Hospital only)
router.get('/tickets', validatePagination, async (req, res) => {
  try {
    const hospital = req.hospital;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;

    const query = { hospital: hospital._id, isActive: true };
    if (status) query.status = status;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('assignedTo.admin', 'name email')
        .populate('resolvedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query)
    ]);

    res.json({
      tickets,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get hospital tickets error:', error);
    res.status(500).json({
      message: 'Server error fetching tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/hospital/appointments
// @desc    Get hospital appointments
// @access  Private (Hospital only)
router.get('/appointments', validatePagination, async (req, res) => {
  try {
    const hospital = req.hospital;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;
    const date = req.query.date;

    const query = { hospital: hospital._id };
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('donor', 'personalInfo contact donationPreferences')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(query)
    ]);

    res.json({
      appointments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get hospital appointments error:', error);
    res.status(500).json({
      message: 'Server error fetching appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/hospital/appointments/:id/confirm
// @desc    Confirm appointment
// @access  Private (Hospital only)
router.put('/appointments/:id/confirm', validateObjectId('id'), async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { notes } = req.body;

    // Fetch appointment first to check status
    const appointmentCheck = await Appointment.findById(appointmentId);
    
    if (!appointmentCheck) {
      return res.status(404).json({
        message: 'Appointment not found'
      });
    }

    // Check if appointment is in pending status
    if (appointmentCheck.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot confirm appointment. Current status is '${appointmentCheck.status}'. Only pending appointments can be confirmed.`
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { 
        status: 'confirmed',
        'notes.hospital': notes
      },
      { new: true }
    ).populate('donor', 'personalInfo contact user');

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found'
      });
    }

    // Create notification for donor
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: appointment.donor.user._id,
        role: 'donor'
      }],
      type: 'appointment_confirmed',
      title: 'Appointment Confirmed',
      message: `Your appointment at ${req.hospital.hospitalName} has been confirmed for ${appointment.scheduledDate.toDateString()} at ${appointment.scheduledTime}`,
      priority: 'medium',
      category: 'success',
      data: { appointmentId: appointment._id }
    });

    res.json({
      message: 'Appointment confirmed successfully',
      appointment: {
        id: appointment._id,
        appointmentId: appointment.appointmentId,
        status: appointment.status,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime
      }
    });
  } catch (error) {
    console.error('Appointment confirmation error:', error);
    res.status(500).json({
      message: 'Server error confirming appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/hospital/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private (Hospital only)
router.put('/appointments/:id/cancel', validateObjectId('id'), async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { reason } = req.body;

    // Fetch appointment first to check status
    const appointmentCheck = await Appointment.findById(appointmentId);
    
    if (!appointmentCheck) {
      return res.status(404).json({
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be cancelled (not already cancelled or completed)
    if (['cancelled', 'completed'].includes(appointmentCheck.status)) {
      return res.status(400).json({
        message: `Cannot cancel appointment. Current status is '${appointmentCheck.status}'. Only pending, confirmed, or approved appointments can be cancelled.`
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { 
        status: 'cancelled',
        cancellation: {
          reason,
          cancelledBy: req.user._id,
          cancelledAt: new Date()
        }
      },
      { new: true }
    ).populate('donor', 'personalInfo contact user');

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found'
      });
    }

    // Create notification for donor
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: appointment.donor.user._id,
        role: 'donor'
      }],
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Your appointment at ${req.hospital.hospitalName} has been cancelled. Reason: ${reason}`,
      priority: 'medium',
      category: 'warning',
      data: { appointmentId: appointment._id }
    });

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: {
        id: appointment._id,
        appointmentId: appointment.appointmentId,
        status: appointment.status,
        cancellation: appointment.cancellation
      }
    });
  } catch (error) {
    console.error('Appointment cancellation error:', error);
    res.status(500).json({
      message: 'Server error cancelling appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/hospital/donors
// @desc    Get donors who have donated to this hospital
// @access  Private (Hospital only)
router.get('/donors', validatePagination, async (req, res) => {
  try {
    const hospital = req.hospital;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-donationHistory.date';

    const [donors, total] = await Promise.all([
      Donor.find({
        'donationHistory.hospital': hospital._id,
        isActive: true
      })
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Donor.countDocuments({
        'donationHistory.hospital': hospital._id,
        isActive: true
      })
    ]);

    res.json({
      donors,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get hospital donors error:', error);
    res.status(500).json({
      message: 'Server error fetching donors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
