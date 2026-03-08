const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validateDonorRegistration, validateAppointmentCreation, validateObjectId, validatePagination } = require('../middleware/validation');

// Apply authentication and donor authorization to all routes except public ones
const publicRoutes = ['/register'];

router.use((req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  authenticate(req, res, next);
});

router.use((req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  authorize('donor')(req, res, next);
});

// Middleware to get donor profile
const getDonorProfile = async (req, res, next) => {
  try {
    if (publicRoutes.includes(req.path)) {
      return next();
    }
    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({
        message: 'Donor profile not found'
      });
    }
    req.donor = donor;
    next();
  } catch (error) {
    res.status(500).json({
      message: 'Server error fetching donor profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

router.use(getDonorProfile);

// Middleware to require donor to be active for certain actions
const requireActiveDonor = (req, res, next) => {
  try {
    if (!req.donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }
    if (req.donor.status !== 'active') {
      return res.status(403).json({ message: 'Account not active. Please wait for admin approval.' });
    }
    next();
  } catch (err) {
    console.error('requireActiveDonor error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /api/donor/dashboard
// @desc    Get donor dashboard data
// @access  Private (Donor only)
router.get('/dashboard', async (req, res) => {
  try {
    const donor = req.donor;
    
    const [
      totalDonations,
      upcomingAppointments,
      recentDonations,
      nearbyTickets
    ] = await Promise.all([
      Appointment.countDocuments({ donor: donor._id, status: 'completed' }),
      Appointment.find({ 
        donor: donor._id, 
        status: { $in: ['pending', 'confirmed', 'approved'] }
      })
        .populate('hospital', 'hospitalName address contact')
        .sort({ scheduledDate: 1 }),
      Appointment.find({ donor: donor._id, status: 'completed' })
        .populate('hospital', 'hospitalName')
        .sort({ createdAt: -1 })
        .limit(5),
      Ticket.findNearby(donor.location.coordinates, 50000) // 50km radius
        .populate('hospital', 'hospitalName address contact')
        .limit(5)
    ]);

    // Calculate next eligible donation date
    const nextEligibleDate = donor.calculateNextEligibleDate();
    const isEligible = donor.isEligibleForBloodDonation();

    // Get donation history summary
    const donationHistory = donor.donationHistory.slice(-10);

    console.log(`Dashboard for donor ${donor._id}:`, {
      totalDonations,
      upcomingAppointmentsCount: upcomingAppointments.length,
      upcomingAppointmentsList: upcomingAppointments.map(a => ({
        id: a._id,
        status: a.status,
        scheduledDate: a.scheduledDate
      }))
    });

    res.json({
      donor: {
        id: donor._id,
        donorId: donor.donorId,
        name: donor.fullName,
        bloodType: donor.personalInfo.bloodType,
        age: donor.age
      },
      statistics: {
        totalDonations,
        upcomingAppointments: upcomingAppointments.length,
        isEligibleForBloodDonation: isEligible,
        nextEligibleDate,
        bloodDonationCount: donor.donationPreferences.bloodDonation.totalDonations,
        organConsent: donor.donationPreferences.organDonation.consent,
        nearbyHospitals: nearbyTickets.length
      },
      upcomingAppointments,
      recentDonations,
      nearbyTickets,
      donationHistory
    });
  } catch (error) {
    console.error('Donor dashboard error:', error);
    res.status(500).json({
      message: 'Server error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/donor/profile
// @desc    Get donor profile
// @access  Private (Donor only)
router.get('/profile', async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id })
      .populate('user', 'name email phone address');

    res.json({
      donor
    });
  } catch (error) {
    console.error('Donor profile error:', error);
    res.status(500).json({
      message: 'Server error fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/donor/profile
// @desc    Update donor profile
// @access  Private (Donor only)
router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    const donorId = req.donor._id;

    // Remove fields that shouldn't be updated directly
    delete updates.user;
    delete updates._id;
    delete updates.donorId;

    const donor = await Donor.findByIdAndUpdate(
      donorId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');

    res.json({
      message: 'Donor profile updated successfully',
      donor
    });
  } catch (error) {
    console.error('Donor profile update error:', error);
    res.status(500).json({
      message: 'Server error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/donor/hospitals
// @desc    Get nearby hospitals
// @access  Private (Donor only)
router.get('/hospitals', async (req, res) => {
  try {
    const donor = req.donor;
    const { maxDistance = 50000, limit = 20 } = req.query; // Default 50km radius

    const hospitals = await Hospital.find({
      status: 'approved',
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: donor.location.coordinates
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
      .populate('user', 'name email phone')
      .limit(parseInt(limit));

    res.json({
      hospitals: hospitals.map(hospital => ({
        id: hospital._id,
        name: hospital.hospitalName,
        address: hospital.fullAddress,
        contact: hospital.contact,
        location: hospital.location,
        specialization: hospital.specialization,
        rating: hospital.rating,
        distance: hospital.location.coordinates // You might want to calculate actual distance
      }))
    });
  } catch (error) {
    console.error('Get nearby hospitals error:', error);
    res.status(500).json({
      message: 'Server error fetching nearby hospitals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/donor/appointments
// @desc    Book appointment
// @access  Private (Donor only)
// Only active donors may book appointments
router.post('/appointments', validateAppointmentCreation, requireActiveDonor, async (req, res) => {
  try {
    const donor = req.donor;
    const { hospital, type, bloodType, organType, scheduledDate, scheduledTime, duration = 60 } = req.body;

    // Check if donor is eligible for blood donation
    if (type === 'blood' && !donor.isEligibleForBloodDonation()) {
      return res.status(400).json({
        message: 'You are not eligible for blood donation yet. Please wait until your next eligible date.',
        nextEligibleDate: donor.calculateNextEligibleDate()
      });
    }

    // Check if hospital exists and is approved
    const hospitalDoc = await Hospital.findById(hospital);
    if (!hospitalDoc || hospitalDoc.status !== 'approved') {
      return res.status(400).json({
        message: 'Hospital not found or not approved'
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      donor: donor._id,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        message: 'You already have an appointment at this time'
      });
    }

    // Create appointment
    const appointmentData = {
      donor: donor._id,
      hospital,
      type,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration,
      status: 'pending'
    };

    if (type === 'blood') {
      appointmentData.bloodType = bloodType;
    } else if (type === 'organ') {
      appointmentData.organType = organType;
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();

    // Populate appointment data
    await appointment.populate('hospital', 'hospitalName address contact');

    // Create notification for hospital
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: hospitalDoc.user._id,
        role: 'hospital'
      }],
      type: 'appointment_booked',
      title: 'New Appointment Booking',
      message: `${donor.fullName} has booked a ${type} donation appointment for ${appointment.scheduledDate.toDateString()} at ${appointment.scheduledTime}`,
      priority: 'medium',
      category: 'info',
      data: { appointmentId: appointment._id, donorId: donor._id }
    });

    // Send real-time notification to hospital
    req.io.to(`hospital_${hospitalDoc.user._id}`).emit('new_appointment', {
      appointmentId: appointment._id,
      donorName: donor.fullName,
      type: appointment.type,
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        id: appointment._id,
        appointmentId: appointment.appointmentId,
        hospital: appointment.hospital,
        type: appointment.type,
        displayType: appointment.displayType,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        status: appointment.status
      }
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    res.status(500).json({
      message: 'Server error booking appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/donor/appointments
// @desc    Get donor appointments
// @access  Private (Donor only)
router.get('/appointments', validatePagination, async (req, res) => {
  try {
    const donor = req.donor;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;

    const query = { donor: donor._id };
    if (status) query.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('hospital', 'hospitalName address contact')
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
    console.error('Get donor appointments error:', error);
    res.status(500).json({
      message: 'Server error fetching appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/donor/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private (Donor only)
router.put('/appointments/:id/cancel', validateObjectId('id'), async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { reason } = req.body;
    const donor = req.donor;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      donor: donor._id
    }).populate('hospital', 'hospitalName user');

    if (!appointment) {
      return res.status(404).json({
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        message: 'Cannot cancel completed appointment'
      });
    }

    // Cancel appointment
    appointment.status = 'cancelled';
    appointment.cancellation = {
      reason,
      cancelledBy: req.user._id,
      cancelledAt: new Date()
    };
    await appointment.save();

    // Create notification for hospital
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: appointment.hospital.user._id,
        role: 'hospital'
      }],
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `${donor.fullName} has cancelled their appointment scheduled for ${appointment.scheduledDate.toDateString()} at ${appointment.scheduledTime}. Reason: ${reason}`,
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

// @route   GET /api/donor/tickets
// @desc    Get nearby emergency tickets
// @access  Private (Donor only)
router.get('/tickets', async (req, res) => {
  try {
    const donor = req.donor;
    const { maxDistance = 50000, limit = 20, type, urgency } = req.query;

    const query = {
      status: { $in: ['open', 'in_progress'] },
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: donor.location.coordinates
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    };

    if (type) query.type = type;
    if (urgency) query.urgency = urgency;

    // Filter by blood type or organ consent
    if (type === 'blood') {
      query.bloodType = donor.personalInfo.bloodType;
    } else if (type === 'organ') {
      const consentedOrgans = donor.donationPreferences.organDonation.organs
        .filter(organ => organ.consent)
        .map(organ => organ.type);
      query.organType = { $in: consentedOrgans };
    }

    const tickets = await Ticket.find(query)
      .populate('hospital', 'hospitalName address contact')
      .sort({ urgency: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      tickets: tickets.map(ticket => ({
        id: ticket._id,
        ticketId: ticket.ticketId,
        hospital: ticket.hospital,
        type: ticket.type,
        displayType: ticket.displayType,
        urgency: ticket.urgency,
        quantity: ticket.quantity,
        message: ticket.message,
        createdAt: ticket.createdAt,
        expiresAt: ticket.expiresAt
      }))
    });
  } catch (error) {
    console.error('Get nearby tickets error:', error);
    res.status(500).json({
      message: 'Server error fetching tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/donor/tickets/:id/respond
// @desc    Respond to emergency ticket
// @access  Private (Donor only)
// Only active donors may respond to tickets
router.post('/tickets/:id/respond', validateObjectId('id'), requireActiveDonor, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;
    const donor = req.donor;

    const ticket = await Ticket.findById(ticketId).populate('hospital', 'hospitalName user');
    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return res.status(400).json({
        message: 'Ticket is already closed or resolved'
      });
    }

    // Add response to ticket
    await ticket.addResponse(req.user._id, 'donor', message, 'offer');

    // Create notification for hospital
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: ticket.hospital.user._id,
        role: 'hospital'
      }],
      type: 'ticket_updated',
      title: 'New Response to Ticket',
      message: `${donor.fullName} has responded to your ticket ${ticket.ticketId}: ${message}`,
      priority: 'medium',
      category: 'info',
      data: { ticketId: ticket._id, donorId: donor._id }
    });

    // Send real-time notification to hospital
    req.io.to(`hospital_${ticket.hospital.user._id}`).emit('ticket_response', {
      ticketId: ticket._id,
      donorName: donor.fullName,
      message,
      donorId: donor._id
    });

    res.json({
      message: 'Response sent successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        responsesCount: ticket.responses.length
      }
    });
  } catch (error) {
    console.error('Ticket response error:', error);
    res.status(500).json({
      message: 'Server error sending response',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/donor/tickets/:ticketId/response/:responseId
// @desc    Withdraw/cancel response to emergency ticket
// @access  Private (Donor only)
router.delete('/tickets/:ticketId/response/:responseId', validateObjectId('ticketId'), validateObjectId('responseId'), requireActiveDonor, async (req, res) => {
  try {
    const { ticketId, responseId } = req.params;
    const donor = req.donor;

    const ticket = await Ticket.findById(ticketId).populate('hospital', 'hospitalName user');
    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    // Find the response
    const responseIndex = ticket.responses.findIndex(r => r._id.toString() === responseId);
    if (responseIndex === -1) {
      return res.status(404).json({
        message: 'Response not found'
      });
    }

    // Check if the response belongs to the donor
    if (ticket.responses[responseIndex].responder.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to withdraw this response'
      });
    }

    // Check if ticket is still open (can only withdraw if ticket is open)
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return res.status(400).json({
        message: 'Cannot withdraw response from a closed or resolved ticket'
      });
    }

    // Remove the response
    ticket.responses.splice(responseIndex, 1);
    await ticket.save();

    // Create notification for hospital
    const Notification = require('../models/Notification');
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: ticket.hospital.user._id,
        role: 'hospital'
      }],
      type: 'ticket_updated',
      title: 'Response Withdrawn',
      message: `${donor.fullName} has withdrawn their response from ticket ${ticket.ticketId}`,
      priority: 'medium',
      category: 'info',
      data: { ticketId: ticket._id, donorId: donor._id }
    });

    // Send real-time notification
    req.io.to(`hospital_${ticket.hospital.user._id}`).emit('response_withdrawn', {
      ticketId: ticket._id,
      donorName: donor.fullName,
      responsesCount: ticket.responses.length
    });

    res.json({
      message: 'Response withdrawn successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        responsesCount: ticket.responses.length
      }
    });
  } catch (error) {
    console.error('Withdraw response error:', error);
    res.status(500).json({
      message: 'Server error withdrawing response',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/donor/donation-history
// @desc    Get donor donation history
// @access  Private (Donor only)
router.get('/donation-history', validatePagination, async (req, res) => {
  try {
    const donor = req.donor;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-date';

    const [donations, total] = await Promise.all([
      Appointment.find({ donor: donor._id, status: 'completed' })
        .populate('hospital', 'hospitalName address')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments({ donor: donor._id, status: 'completed' })
    ]);

    res.json({
      donations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get donation history error:', error);
    res.status(500).json({
      message: 'Server error fetching donation history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/donor/preferences
// @desc    Update donation preferences
// @access  Private (Donor only)
router.put('/preferences', async (req, res) => {
  try {
    const donor = req.donor;
    const { bloodDonation, organDonation, notifications, maxDistance, preferredHospitals } = req.body;

    const updates = {};
    if (bloodDonation !== undefined) updates['donationPreferences.bloodDonation'] = bloodDonation;
    if (organDonation !== undefined) updates['donationPreferences.organDonation'] = organDonation;
    if (notifications !== undefined) updates.preferences = { ...donor.preferences, notifications };
    if (maxDistance !== undefined) updates.preferences = { ...donor.preferences, maxDistance };
    if (preferredHospitals !== undefined) updates.preferences = { ...donor.preferences, preferredHospitals };

    const updatedDonor = await Donor.findByIdAndUpdate(
      donor._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        bloodDonation: updatedDonor.donationPreferences.bloodDonation,
        organDonation: updatedDonor.donationPreferences.organDonation,
        notifications: updatedDonor.preferences.notifications,
        maxDistance: updatedDonor.preferences.maxDistance,
        preferredHospitals: updatedDonor.preferences.preferredHospitals
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      message: 'Server error updating preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
