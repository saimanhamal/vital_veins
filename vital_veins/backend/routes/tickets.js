const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// @route   GET /api/tickets
// @desc    Get all tickets (public with optional auth)
// @access  Public
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-createdAt';
    const status = req.query.status;
    const urgency = req.query.urgency;
    const type = req.query.type;
    const city = req.query.city;

    // Build query
    const query = { isActive: true };
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (type) query.type = type;
    if (city) {
      // This would require a more sophisticated location search
      // For now, we'll just filter by status
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('hospital', 'hospitalName address contact')
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

// @route   GET /api/tickets/:id
// @desc    Get single ticket
// @access  Public
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('hospital', 'hospitalName address contact')
      .populate('responses.responder', 'name email role')
      .populate('assignedTo.admin', 'name email')
      .populate('resolvedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({
        message: 'Ticket not found'
      });
    }

    res.json({
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      message: 'Server error fetching ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/tickets/nearby/:lat/:lng
// @desc    Get nearby tickets
// @access  Public
router.get('/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { maxDistance = 50000, limit = 20 } = req.query;

    const coordinates = [parseFloat(lng), parseFloat(lat)];

    const tickets = await Ticket.findNearby(coordinates, parseInt(maxDistance))
      .populate('hospital', 'hospitalName address contact')
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
      message: 'Server error fetching nearby tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/tickets/create
// @desc    Create emergency ticket (Hospital only)
// @access  Private (Hospital)
router.post('/create', authenticate, authorize('hospital'), [
  body('type').isIn(['blood', 'organ']).withMessage('Type must be blood or organ'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('urgency').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),
  body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findOne({ user: req.user.id });
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found' });
    }

    const { type, bloodType, organType, quantity, urgency, message, patientInfo } = req.body;

    // Validate type-specific fields
    if (type === 'blood' && !bloodType) {
      return res.status(400).json({ message: 'Blood type is required for blood requests' });
    }
    if (type === 'organ' && !organType) {
      return res.status(400).json({ message: 'Organ type is required for organ requests' });
    }

    const ticketData = {
      hospital: hospital._id,
      type,
      bloodType: type === 'blood' ? bloodType : undefined,
      organType: type === 'organ' ? organType : undefined,
      quantity,
      urgency,
      message,
      patientInfo,
      location: hospital.location,
      status: 'open'
    };

    const ticket = new Ticket(ticketData);
    await ticket.save();
    await ticket.populate('hospital', 'hospitalName address contact');

    // Send real-time notification via socket.io
    if (req.io) {
      req.io.emit('new_emergency_ticket', {
        ticketId: ticket._id,
        hospitalName: hospital.hospitalName,
        type: ticket.type,
        displayType: ticket.displayType,
        urgency: ticket.urgency,
        quantity: ticket.quantity,
        message: ticket.message,
        createdAt: ticket.createdAt
      });
    }

    res.status(201).json({
      message: 'Emergency ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      message: 'Server error creating ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/tickets/:id/status
// @desc    Update ticket status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', authenticate, authorize('admin'), validateObjectId('id'), [
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, resolutionNotes } = req.body;
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId)
      .populate('hospital', 'hospitalName contact');
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedBy = req.user.id;
      ticket.resolvedAt = new Date();
      ticket.resolutionNotes = resolutionNotes || '';
    }
    if (status === 'in_progress' && !ticket.assignedTo.admin) {
      ticket.assignedTo.admin = req.user.id;
      ticket.assignedTo.assignedAt = new Date();
    }

    await ticket.save();

    // Send real-time notification
    if (req.io) {
      req.io.emit('ticket_status_updated', {
        ticketId: ticket._id,
        status: ticket.status,
        hospitalName: ticket.hospital.hospitalName
      });
    }

    res.json({
      message: 'Ticket status updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      message: 'Server error updating ticket status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
