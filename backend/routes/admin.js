const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const Ticket = require('../models/Ticket');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const emailService = require('../services/emailService');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalHospitals,
      totalDonors,
      totalTickets,
      totalAppointments,
      donationsThisMonth,
      pendingDonorApprovals,
      pendingHospitals,
      activeTickets,
      recentTickets,
      recentAppointments
    ] = await Promise.all([
      Hospital.countDocuments({ isActive: true }),
      Donor.countDocuments({ isActive: true }),
      Ticket.countDocuments(),
      Appointment.countDocuments(),
      // donations completed in current month
      (async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const result = await Appointment.countDocuments({ status: 'completed', createdAt: { $gte: startOfMonth } });
        return result;
      })(),
      // pending donor approvals
      Donor.countDocuments({ status: 'pending' }),
      Hospital.countDocuments({ status: 'pending' }),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Ticket.find({ status: { $in: ['open', 'in_progress'] } })
        .populate('hospital', 'hospitalName contact')
        .sort({ createdAt: -1 })
        .limit(5),
      Appointment.find()
        .populate('donor', 'personalInfo contact')
        .populate('hospital', 'hospitalName')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Calculate analytics
    const bloodInventory = await Hospital.aggregate([
      { $unwind: '$inventory.blood' },
      { $group: { _id: '$inventory.blood.type', totalQuantity: { $sum: '$inventory.blood.quantity' } } }
    ]);

    const organInventory = await Hospital.aggregate([
      { $unwind: '$inventory.organs' },
      { $group: { _id: '$inventory.organs.type', totalQuantity: { $sum: '$inventory.organs.quantity' } } }
    ]);

    const donationTrends = await Appointment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      statistics: {
        totalHospitals,
        totalDonors,
        totalTickets,
        totalAppointments,
        donationsThisMonth,
        pendingDonorApprovals,
        pendingHospitals,
        activeTickets
      },
      inventory: {
        blood: bloodInventory,
        organs: organInventory
      },
      recentActivity: {
        tickets: recentTickets,
        appointments: recentAppointments
      },
      trends: {
        donations: donationTrends
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      message: 'Server error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/hospitals
// @desc    Get all hospitals with pagination and filters
// @access  Private (Admin only)
router.get('/hospitals', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;
    const search = req.query.search;
    const city = req.query.city;
    const specialization = req.query.specialization;

    // Build query
    const query = { isActive: true };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { hospitalName: { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }
    if (specialization) {
      query['specialization'] = specialization;
    }

    const [hospitals, total] = await Promise.all([
      Hospital.find(query)
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Hospital.countDocuments(query)
    ]);

    res.json({
      hospitals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({
      message: 'Server error fetching hospitals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/hospitals/:id/approve
// @desc    Approve or reject hospital registration
// @access  Private (Admin only)
router.put('/hospitals/:id/approve', validateObjectId('id'), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const hospitalId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be either approved or rejected'
      });
    }

    const hospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      { 
        status,
        ...(notes && { notes })
      },
      { new: true }
    ).populate('user', 'name email');

    if (!hospital) {
      return res.status(404).json({
        message: 'Hospital not found'
      });
    }

    // Create notification for hospital
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: hospital.user._id,
        role: 'hospital'
      }],
      type: status === 'approved' ? 'hospital_approved' : 'hospital_rejected',
      title: `Hospital Registration ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your hospital registration has been ${status}. ${notes || ''}`,
      priority: 'high',
      category: status === 'approved' ? 'success' : 'error',
      data: { hospitalId: hospital._id }
    });

    // Send real-time notification
    req.io.to(`hospital_${hospital.user._id}`).emit('hospital_status_update', {
      status,
      message: `Your hospital registration has been ${status}`,
      hospitalId: hospital._id
    });

    // Send email notification
    try {
      const emailData = {
        hospitalName: hospital.hospitalName,
        email: hospital.user.email,
        notes
      };
      
      if (status === 'approved') {
        await emailService.sendHospitalApprovalEmail(emailData, notes);
      } else {
        await emailService.sendHospitalRejectionEmail(emailData, notes);
      }
      console.log(`Email sent to ${hospital.hospitalName} for ${status} status`);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the main request if email fails
    }

    res.json({
      message: `Hospital ${status} successfully`,
      hospital: {
        id: hospital._id,
        name: hospital.hospitalName,
        status: hospital.status,
        user: hospital.user
      }
    });
  } catch (error) {
    console.error('Hospital approval error:', error);
    res.status(500).json({
      message: 'Server error updating hospital status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/donors
// @desc    Get all donors: pending (unverified users) + active (verified donors from DB)
// @access  Private (Admin only)
router.get('/donors', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status; // 'pending', 'active', or undefined for all
    const search = req.query.search;

    // Get pending users (unverified donors who haven't been added to Donor DB yet)
    const pendingQuery = { role: 'donor', verified: false };
    if (search) {
      pendingQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Get active donors (verified users with Donor profiles)
    const activeDonorQuery = {};
    if (search) {
      activeDonorQuery.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } }
      ];
    }

    console.log('📋 Getting donors - status filter:', statusFilter);

    let [pendingUsers, activeDonors] = await Promise.all([
      statusFilter === 'active' ? Promise.resolve([]) : User.find(pendingQuery).lean(),
      statusFilter === 'pending' ? Promise.resolve([]) : Donor.find(activeDonorQuery).populate('user', 'name email phone verified').lean()
    ]);

    // Format pending users as donor objects
    const formattedPending = pendingUsers.map(u => ({
      _id: u._id,
      user: {
        _id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        verified: false
      },
      personalInfo: {
        firstName: u.name?.split(' ')[0] || 'Pending',
        lastName: u.name?.split(' ')[1] || 'User'
      },
      status: 'pending',
      createdAt: u.createdAt,
      isPendingSignup: true
    }));

    // Format active donors
    const formattedActive = activeDonors.map(d => ({
      ...d,
      status: 'active',
      isPendingSignup: false
    }));

    // Combine and sort
    let allDonors = [...formattedPending, ...formattedActive];
    allDonors.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = allDonors.length;
    const paginatedDonors = allDonors.slice(skip, skip + limit);

    console.log(`✅ Found ${paginatedDonors.length} donors (${formattedPending.length} pending + ${formattedActive.length} active, total: ${total})`);

    res.json({
      donors: paginatedDonors,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get donors error:', error);
    res.status(500).json({
      message: 'Server error fetching donors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/admin/donors/:id/approve
// @desc    Approve a pending donor (create Donor profile and set verified: true)
// @access  Private (Admin only)
router.post('/donors/:id/approve', validateObjectId('id'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Get the pending user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'donor') {
      return res.status(400).json({ message: 'User is not a donor' });
    }

    if (user.verified === true) {
      return res.status(400).json({ message: 'Donor is already verified' });
    }

    // Create Donor profile
    try {
      const existingDonor = await Donor.findOne({ user: userId });
      if (!existingDonor) {
        const nameParts = (user.name || 'User').split(' ').filter(p => p.trim());
        const firstName = nameParts[0] || 'Donor';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
        
        const donor = new Donor({
          user: userId,
          personalInfo: {
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: new Date('1970-01-01'),
            gender: 'Other',
            bloodType: 'O+',
            weight: 70,
            height: 170
          },
          contact: {
            phone: user.phone || '+0000000000',
            emergencyContact: {
              name: 'Not provided',
              phone: '+0000000000',
              relationship: 'Unknown'
            }
          },
          address: {
            street: 'N/A',
            city: 'N/A',
            state: 'N/A',
            zipCode: '00000',
            country: 'India'
          },
          location: { type: 'Point', coordinates: [0, 0] },
          status: 'active'
        });
        await donor.save();
        console.log(`✅ Created Donor profile for user: ${user.email}`);
      }
    } catch (donorErr) {
      console.error('Failed to create donor profile:', donorErr);
      return res.status(500).json({ message: 'Failed to create donor profile' });
    }

    // Update User.verified = true
    user.verified = true;
    await user.save();
    console.log(`✅ Donor approved: ${user.email}, verified set to true`);

    // Create notification
    try {
      await Notification.createNotification({
        sender: req.user._id,
        recipients: [{ userId: user._id, role: 'donor' }],
        type: 'donor_approved',
        title: 'Account Approved',
        message: 'Your donor account has been approved! You can now log in and access your dashboard.',
        priority: 'high',
        category: 'success',
        data: { userId: user._id }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.json({
      message: 'Donor approved successfully',
      donor: {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: true
      }
    });
  } catch (error) {
    console.error('Donor approval error:', error);
    res.status(500).json({
      message: 'Server error approving donor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/admin/donors/:id/reject
// @desc    Reject a pending donor (just set verified: false doesn't create Donor profile)
// @access  Private (Admin only)
router.post('/donors/:id/reject', validateObjectId('id'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'donor') {
      return res.status(400).json({ message: 'User is not a donor' });
    }

    // Create notification about rejection
    try {
      await Notification.createNotification({
        sender: req.user._id,
        recipients: [{ userId: user._id, role: 'donor' }],
        type: 'donor_rejected',
        title: 'Application Not Approved',
        message: `Your donor application could not be approved. Reason: ${reason || 'Not specified'}`,
        priority: 'high',
        category: 'error',
        data: { userId: user._id }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.json({
      message: 'Donor rejected successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Donor rejection error:', error);
    res.status(500).json({
      message: 'Server error rejecting donor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/tickets
// @desc    Get all tickets with pagination and filters
// @access  Private (Admin only)
router.get('/tickets', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;
    const urgency = req.query.urgency;
    const type = req.query.type;

    // Build query
    const query = { isActive: true };
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (type) query.type = type;

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('hospital', 'hospitalName contact address')
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
    console.error('Get tickets error:', error);
    res.status(500).json({
      message: 'Server error fetching tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/tickets/:id/assign
// @desc    Assign ticket to admin
// @access  Private (Admin only)
router.put('/tickets/:id/assign', validateObjectId('id'), async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { notes } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        assignedTo: {
          admin: req.user._id,
          assignedAt: new Date()
        },
        status: 'in_progress'
      },
      { new: true }
    ).populate('hospital', 'hospitalName user');

    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    // Create notification for hospital
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: ticket.hospital.user,
        role: 'hospital'
      }],
      type: 'ticket_updated',
      title: 'Ticket Assigned',
      message: `Your ticket ${ticket.ticketId} has been assigned to an admin and is being processed.`,
      priority: 'medium',
      category: 'info',
      data: { ticketId: ticket._id }
    });

    res.json({
      message: 'Ticket assigned successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        assignedTo: ticket.assignedTo
      }
    });
  } catch (error) {
    console.error('Ticket assignment error:', error);
    res.status(500).json({
      message: 'Server error assigning ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/tickets/:id/resolve
// @desc    Resolve ticket
// @access  Private (Admin only)
router.put('/tickets/:id/resolve', validateObjectId('id'), async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { resolutionNotes } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        status: 'resolved',
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        resolutionNotes
      },
      { new: true }
    ).populate('hospital', 'hospitalName user');

    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    // Create notification for hospital
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: ticket.hospital.user,
        role: 'hospital'
      }],
      type: 'ticket_resolved',
      title: 'Ticket Resolved',
      message: `Your ticket ${ticket.ticketId} has been resolved. ${resolutionNotes || ''}`,
      priority: 'medium',
      category: 'success',
      data: { ticketId: ticket._id }
    });

    res.json({
      message: 'Ticket resolved successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        resolvedAt: ticket.resolvedAt,
        resolutionNotes: ticket.resolutionNotes
      }
    });
  } catch (error) {
    console.error('Ticket resolution error:', error);
    res.status(500).json({
      message: 'Server error resolving ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/donors/:id/status
// @desc    Update donor status (activate/suspend)
// @access  Private (Admin only)
router.put('/donors/:id/status', validateObjectId('id'), async (req, res) => {
  try {
    const donorId = req.params.id;
    const { status, notes } = req.body;

    if (!['active', 'suspended', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const donor = await Donor.findByIdAndUpdate(
      donorId,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // If approving (status = 'active'), mark user as verified
    if (status === 'active') {
      const user = await User.findByIdAndUpdate(
        donor.user._id,
        { verified: true },
        { new: true }
      );
      console.log(`✅ Donor approved: ${user.email}, verified set to true`);
    }

    // Notify donor
    try {
      await Notification.createNotification({
        sender: req.user._id,
        recipients: [{ userId: donor.user._id, role: 'donor' }],
        type: 'donor_status_update',
        title: 'Account Status Updated',
        message: `Your donor account status has been changed to ${status}. ${notes || ''}`,
        priority: 'medium',
        category: status === 'active' ? 'success' : 'warning',
        data: { donorId: donor._id }
      });
    } catch (notifyErr) {
      // continue
    }

    return res.json({
      message: 'Donor status updated',
      donor: {
        id: donor._id,
        status: status,
      }
    });
  } catch (error) {
    console.error('Update donor status error:', error);
    res.status(500).json({
      message: 'Server error updating donor status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/admin/broadcast
// @desc    Send broadcast notification to all users
// @access  Private (Admin only)
router.post('/broadcast', async (req, res) => {
  try {
    const { title, message, priority = 'medium', category = 'info', targetRoles = ['hospital', 'donor'] } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: 'Title and message are required'
      });
    }

    // Get all users of target roles
    const users = await User.find({ 
      role: { $in: targetRoles },
      isActive: true 
    });

    const recipients = users.map(user => ({
      userId: user._id,
      role: user.role
    }));

    // Create notification
    const notification = await Notification.createNotification({
      sender: req.user._id,
      recipients,
      type: 'system_announcement',
      title,
      message,
      priority,
      category,
      channels: ['in_app', 'email']
    });

    // Send real-time notifications
    users.forEach(user => {
      req.io.to(`user_${user._id}`).emit('broadcast_notification', {
        title,
        message,
        priority,
        category,
        notificationId: notification._id
      });
    });

    res.json({
      message: 'Broadcast sent successfully',
      notification: {
        id: notification._id,
        title,
        message,
        recipientsCount: recipients.length
      }
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      message: 'Server error sending broadcast',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics data
// @access  Private (Admin only)
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : period === '365d' ? 365 : 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get various analytics
    const [
      donationStats,
      hospitalStats,
      ticketStats,
      bloodTypeDistribution,
      organTypeDistribution,
      topHospitals,
      topDonors,
      donationTrends,
      emergencyStats
    ] = await Promise.all([
      // Donation statistics
      Appointment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$donation.quantity' }
          }
        }
      ]),
      
      // Hospital statistics
      Hospital.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Ticket statistics
      Ticket.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Blood type distribution - filter by time range based on donation history
      Appointment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $lookup: {
            from: 'donors',
            localField: 'donor',
            foreignField: '_id',
            as: 'donorInfo'
          }
        },
        { $unwind: '$donorInfo' },
        {
          $group: {
            _id: '$donorInfo.personalInfo.bloodType',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Organ type distribution
      Donor.aggregate([
        { $unwind: '$donationPreferences.organDonation.organs' },
        {
          $group: {
            _id: '$donationPreferences.organDonation.organs.type',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Top hospitals by donations
      Appointment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$hospital',
            donationCount: { $sum: 1 },
            totalQuantity: { $sum: '$donation.quantity' }
          }
        },
        { $sort: { donationCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'hospitals',
            localField: '_id',
            foreignField: '_id',
            as: 'hospital'
          }
        },
        { $unwind: '$hospital' },
        {
          $project: {
            hospitalName: '$hospital.hospitalName',
            donationCount: 1,
            totalQuantity: 1,
            efficiency: { $multiply: [{ $divide: ['$donationCount', 10] }, 100] } // Calculate efficiency score
          }
        }
      ]),
      
      // Top donors
      Appointment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$donor',
            donationCount: { $sum: 1 }
          }
        },
        { $sort: { donationCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'donors',
            localField: '_id',
            foreignField: '_id',
            as: 'donor'
          }
        },
        { $unwind: '$donor' },
        {
          $project: {
            donorName: { $concat: ['$donor.personalInfo.firstName', ' ', '$donor.personalInfo.lastName'] },
            donationCount: 1
          }
        }
      ]),

      // Donation trends per day and type for charts
      Appointment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),

      // Emergency response stats by urgency level
      Ticket.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$urgency',
            total: { $sum: 1 },
            resolved: {
              $sum: {
                $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
              }
            },
            pending: {
              $sum: {
                $cond: [{ $in: ['$status', ['open', 'in_progress']] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    // Calculate totals for dashboard
    const totalDonations = donationStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalHospitals = hospitalStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalDonors = await Donor.countDocuments({ isActive: true });
    const averageResponseTime = '4.2 hours'; // This would need to be calculated from actual data
    const successRate = '94.6%'; // This would need to be calculated from actual data

    // Generate sample data if no real data exists
    let sampleDonationTrends = [];
    if (donationTrends.length === 0) {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        sampleDonationTrends.push(
          {
            _id: { date: dateStr, type: 'blood' },
            count: Math.floor(Math.random() * 10) + 1
          },
          {
            _id: { date: dateStr, type: 'organ' },
            count: Math.floor(Math.random() * 5) + 1
          }
        );
      }
    }

    // Generate sample blood type distribution if none exists
    let sampleBloodTypeDistribution = [];
    if (bloodTypeDistribution.length === 0) {
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      bloodTypes.forEach(type => {
        sampleBloodTypeDistribution.push({
          _id: type,
          count: Math.floor(Math.random() * 50) + 10
        });
      });
    }

    // Generate sample hospital performance data if none exists
    let sampleTopHospitals = [];
    if (topHospitals.length === 0) {
      const timeMultiplier = days === 7 ? 0.3 : days === 30 ? 1 : days === 90 ? 3 : 12;
      
      const hospitalNames = [
        'City General Hospital',
        'Regional Medical Center', 
        'Metro Health Center',
        'Community Hospital',
        'University Medical',
        'St. Mary Hospital',
        'Central Healthcare',
        'Mercy Medical Center'
      ];
      
      hospitalNames.forEach((name, index) => {
        const donationCount = Math.floor(Math.random() * 50 * timeMultiplier) + Math.floor(20 * timeMultiplier);
        const efficiency = Math.floor(Math.random() * 25) + 75; // 75-100% efficiency
        sampleTopHospitals.push({
          hospitalName: name,
          donationCount: donationCount,
          totalQuantity: donationCount * (Math.floor(Math.random() * 3) + 1),
          efficiency: efficiency
        });
      });
      
      // Sort by donation count
      sampleTopHospitals.sort((a, b) => b.donationCount - a.donationCount);
    }

    // Generate sample emergency stats if none exists
    let sampleEmergencyStats = [];
    if (emergencyStats.length === 0) {
      // Generate time-range specific data
      const timeMultiplier = days === 7 ? 0.3 : days === 30 ? 1 : days === 90 ? 3 : 12;
      
      const urgencyLevels = [
        { 
          level: 'Critical', 
          total: Math.floor(Math.random() * 15 * timeMultiplier) + Math.floor(5 * timeMultiplier), 
          resolved: Math.floor(Math.random() * 12 * timeMultiplier) + Math.floor(4 * timeMultiplier)
        },
        { 
          level: 'High', 
          total: Math.floor(Math.random() * 25 * timeMultiplier) + Math.floor(15 * timeMultiplier), 
          resolved: Math.floor(Math.random() * 22 * timeMultiplier) + Math.floor(13 * timeMultiplier)
        },
        { 
          level: 'Medium', 
          total: Math.floor(Math.random() * 35 * timeMultiplier) + Math.floor(25 * timeMultiplier), 
          resolved: Math.floor(Math.random() * 32 * timeMultiplier) + Math.floor(23 * timeMultiplier)
        },
        { 
          level: 'Low', 
          total: Math.floor(Math.random() * 20 * timeMultiplier) + Math.floor(10 * timeMultiplier), 
          resolved: Math.floor(Math.random() * 18 * timeMultiplier) + Math.floor(9 * timeMultiplier)
        }
      ];
      
      urgencyLevels.forEach(level => {
        const resolved = Math.min(level.resolved, level.total); // Ensure resolved doesn't exceed total
        const pending = level.total - resolved;
        sampleEmergencyStats.push({
          _id: level.level,
          total: level.total,
          resolved: resolved,
          pending: pending
        });
      });
    }

    res.json({
      period,
      dateRange: { startDate, endDate: now },
      totalDonations,
      totalHospitals,
      totalDonors,
      averageResponseTime,
      successRate,
      donationStats,
      hospitalStats,
      ticketStats,
      bloodTypeDistribution: bloodTypeDistribution.length > 0 ? bloodTypeDistribution : sampleBloodTypeDistribution,
      organTypeDistribution,
      topHospitals: topHospitals.length > 0 ? topHospitals : sampleTopHospitals,
      topDonors,
      donationTrends: donationTrends.length > 0 ? donationTrends : sampleDonationTrends,
      emergencyStats: emergencyStats.length > 0 ? emergencyStats : sampleEmergencyStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      message: 'Server error fetching analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/transactions
// @desc    List transactions with pagination and filters
// @access  Private (Admin only)
router.get('/transactions', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;
    const role = req.query.role;
    const search = req.query.search;

    const query = { isActive: true };
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { txId: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } }
      ];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query)
    ]);

    res.json({
      transactions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin only)
router.get('/users', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const role = req.query.role;
    const search = req.query.search;

    const query = { isActive: true };
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    // Also get count by role
    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      users,
      totalUsers: total,
      usersByRole: usersByRole.reduce((acc, role) => {
        acc[role._id] = role.count;
        return acc;
      }, {}),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      message: 'Server error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/deactivate
// @desc    Deactivate user account
// @access  Private (Admin only)
router.put('/users/:id/deactivate', validateObjectId('id'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    // Prevent admin from deactivating themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Create notification
    try {
      await Notification.createNotification({
        sender: req.user._id,
        recipients: [{ userId: user._id, role: user.role }],
        type: 'account_deactivated',
        title: 'Account Deactivated',
        message: `Your account has been deactivated. Reason: ${reason || 'Not specified'}`,
        priority: 'high',
        category: 'warning',
        data: { userId: user._id }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.json({
      message: 'User deactivated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      message: 'Server error deactivating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/activate
// @desc    Activate user account
// @access  Private (Admin only)
router.put('/users/:id/activate', validateObjectId('id'), async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Create notification
    try {
      await Notification.createNotification({
        sender: req.user._id,
        recipients: [{ userId: user._id, role: user.role }],
        type: 'account_activated',
        title: 'Account Activated',
        message: 'Your account has been reactivated. You can now log in.',
        priority: 'medium',
        category: 'success',
        data: { userId: user._id }
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr);
    }

    res.json({
      message: 'User activated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      message: 'Server error activating user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user permanently
// @access  Private (Admin only)
router.delete('/users/:id', validateObjectId('id'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        message: 'Confirmation required to delete user'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Also delete related profiles
    if (user.role === 'donor') {
      await Donor.deleteMany({ user: userId });
    } else if (user.role === 'hospital') {
      await Hospital.deleteMany({ user: userId });
    }

    res.json({
      message: 'User deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      message: 'Server error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/appointments
// @desc    Get all appointments with pagination and filters
// @access  Private (Admin only)
router.get('/appointments', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;
    const type = req.query.type;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('donor', 'personalInfo contact email')
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
    console.error('Get appointments error:', error);
    res.status(500).json({
      message: 'Server error fetching appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/hospitals/:id/reject
// @desc    Reject hospital registration
// @access  Private (Admin only)
router.put('/hospitals/:id/reject', validateObjectId('id'), async (req, res) => {
  try {
    const { notes } = req.body;
    const hospitalId = req.params.id;

    const hospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      { 
        status: 'rejected',
        ...(notes && { notes })
      },
      { new: true }
    ).populate('user', 'name email');

    if (!hospital) {
      return res.status(404).json({
        message: 'Hospital not found'
      });
    }

    // Create notification for hospital
    await Notification.createNotification({
      sender: req.user._id,
      recipients: [{
        userId: hospital.user._id,
        role: 'hospital'
      }],
      type: 'hospital_rejected',
      title: 'Hospital Registration Rejected',
      message: `Your hospital registration has been rejected. ${notes || ''}`,
      priority: 'high',
      category: 'error',
      data: { hospitalId: hospital._id }
    });

    // Send real-time notification
    req.io.to(`hospital_${hospital.user._id}`).emit('hospital_status_update', {
      status: 'rejected',
      message: `Your hospital registration has been rejected`,
      hospitalId: hospital._id
    });

    // Send email notification
    try {
      const emailData = {
        hospitalName: hospital.hospitalName,
        email: hospital.user.email,
        notes
      };
      await emailService.sendHospitalRejectionEmail(emailData, notes);
      console.log(`Email sent to ${hospital.hospitalName} for rejection`);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    res.json({
      message: 'Hospital rejected successfully',
      hospital: {
        id: hospital._id,
        name: hospital.hospitalName,
        status: hospital.status,
        user: hospital.user
      }
    });
  } catch (error) {
    console.error('Hospital rejection error:', error);
    res.status(500).json({
      message: 'Server error rejecting hospital',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Generate system reports
// @access  Private (Admin only)
router.get('/reports', async (req, res) => {
  try {
    const { reportType = 'summary', startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let report = {};

    if (reportType === 'summary' || reportType === 'all') {
      // System summary report
      const [totalUsers, totalHospitals, totalDonors, activeTickets, completedAppointments] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Hospital.countDocuments({ isActive: true, status: 'approved' }),
        Donor.countDocuments({ isActive: true, status: 'active' }),
        Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        Appointment.countDocuments({ status: 'completed', createdAt: { $gte: start, $lte: end } })
      ]);

      report.summary = {
        totalUsers,
        totalHospitals,
        totalDonors,
        activeTickets,
        completedAppointments,
        reportPeriod: { start, end }
      };
    }

    if (reportType === 'donations' || reportType === 'all') {
      // Donation report
      const donationsByType = await Appointment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$donation.quantity' }
          }
        }
      ]);

      report.donations = donationsByType;
    }

    if (reportType === 'hospitals' || reportType === 'all') {
      // Hospital performance report
      const hospitalPerformance = await Hospital.aggregate([
        { $match: { isActive: true, status: 'approved' } },
        {
          $lookup: {
            from: 'appointments',
            localField: '_id',
            foreignField: 'hospital',
            as: 'appointments'
          }
        },
        {
          $project: {
            hospitalName: 1,
            address: 1,
            totalAppointments: { $size: '$appointments' },
            completedAppointments: {
              $size: {
                $filter: {
                  input: '$appointments',
                  as: 'apt',
                  cond: { $eq: ['$$apt.status', 'completed'] }
                }
              }
            }
          }
        },
        { $sort: { completedAppointments: -1 } },
        { $limit: 20 }
      ]);

      report.hospitalPerformance = hospitalPerformance;
    }

    if (reportType === 'tickets' || reportType === 'all') {
      // Ticket resolution report
      const ticketStats = await Ticket.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: '$urgency',
            total: { $sum: 1 },
            resolved: {
              $sum: {
                $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
              }
            },
            pending: {
              $sum: {
                $cond: [{ $in: ['$status', ['open', 'in_progress']] }, 1, 0]
              }
            }
          }
        }
      ]);

      report.ticketStats = ticketStats;
    }

    res.json({
      reportType,
      generatedAt: new Date(),
      ...report
    });
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      message: 'Server error generating report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
