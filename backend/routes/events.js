const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePagination, validateObjectId } = require('../middleware/validation');

/**
 * @route   POST /api/admin/events
 * @desc    Create a new donation event/campaign
 * @access  Private (Admin only)
 */
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      eventType, 
      startDate, 
      endDate, 
      location,
      capacity,
      targetBloodTypes = [],
      organizer,
      incentives,
      registrationDeadline
    } = req.body;

    // Validation
    if (!title || !eventType || !startDate || !location) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, eventType, startDate, location' 
      });
    }

    if (!['blood_drive', 'awareness', 'recruitment', 'emergency'].includes(eventType)) {
      return res.status(400).json({ 
        message: 'Invalid eventType. Must be: blood_drive, awareness, recruitment, or emergency' 
      });
    }

    const event = new Event({
      title,
      description,
      eventType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude], // [lng, lat]
        address: location.address,
        city: location.city,
        state: location.state
      },
      capacity,
      targetBloodTypes: targetBloodTypes.length > 0 ? targetBloodTypes : undefined,
      organizer: organizer || 'VitalVeins Platform',
      incentives,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : new Date(startDate),
      createdBy: req.user._id
    });

    await event.save();

    // Notify nearby donors if blood_drive or emergency
    if (['blood_drive', 'emergency'].includes(eventType)) {
      const nearbyDonors = await Donor.find({
        isActive: true,
        status: 'active',
        location: {
          $near: {
            $geometry: event.location,
            $maxDistance: 15000 // 15 km radius
          }
        }
      }).select('user _id');

      if (nearbyDonors.length > 0) {
        const recipientData = nearbyDonors.map(d => ({
          user: d.user,
          role: 'donor'
        }));

        await Notification.createNotification({
          recipients: recipientData,
          type: 'event_nearby',
          title: `🩸 New ${eventType === 'emergency' ? 'EMERGENCY' : 'Blood Drive'} Event Nearby`,
          content: `${title} is happening near you! Register now to help save lives.`,
          data: { eventId: event._id, eventTitle: title }
        });
      }
    }

    res.status(201).json({
      message: 'Event created successfully',
      event: {
        _id: event._id,
        title: event.title,
        eventType: event.eventType,
        startDate: event.startDate,
        location: event.location,
        registrations: event.registrations.length
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      message: 'Server error creating event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/events/nearby
 * @desc    Get events near donor's location
 * @access  Private (Donor)
 */
router.get('/nearby', authenticate, authorize('donor'), async (req, res) => {
  try {
    const { longitude, latitude, radiusKm = 15, limit = 10 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ 
        message: 'Missing required coordinates: longitude, latitude' 
      });
    }

    const radiusInMeters = (parseFloat(radiusKm) || 15) * 1000;

    const events = await Event.find({
      status: 'published',
      startDate: { $gte: new Date() },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radiusInMeters
        }
      }
    })
    .limit(parseInt(limit) || 10)
    .select('_id title eventType startDate endDate location capacity registrations createdAt');

    // Add registration count and distance
    const eventsWithDistance = events.map(event => {
      // Simple distance calculation
      const dx = event.location.coordinates[0] - parseFloat(longitude);
      const dy = event.location.coordinates[1] - parseFloat(latitude);
      const distance = Math.sqrt(dx * dx + dy * dy) * 111; // Approximate km

      return {
        _id: event._id,
        title: event.title,
        eventType: event.eventType,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        capacity: event.capacity,
        registeredCount: event.registrations.length,
        spotsAvailable: event.capacity ? event.capacity - event.registrations.length : null,
        distanceKm: distance.toFixed(2),
        isRegistered: event.registrations.some(r => r.donor.toString() === req.user._id.toString())
      };
    });

    res.json({
      events: eventsWithDistance,
      total: eventsWithDistance.length
    });
  } catch (error) {
    console.error('Error fetching nearby events:', error);
    res.status(500).json({
      message: 'Server error fetching nearby events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/events/:eventId
 * @desc    Get specific event details
 * @access  Private (Authenticated)
 */
router.get('/:eventId', authenticate, validateObjectId('eventId'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('createdBy', 'name email')
      .populate('registrations.donor', 'personalInfo.firstName personalInfo.lastName bloodType');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is registered
    const donor = req.user.role === 'donor' ? 
      await Donor.findOne({ user: req.user._id }) : null;

    const isRegistered = donor && 
      event.registrations.some(r => r.donor.toString() === donor._id.toString());

    res.json({
      ...event.toObject(),
      isRegistered,
      stats: {
        registeredCount: event.registrations.length,
        spotsAvailable: event.capacity ? event.capacity - event.registrations.length : null,
        bloodUnitsPending: event.statistics?.bloodUnitsCollected || 0,
        successRate: event.statistics?.successRate || 0
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      message: 'Server error fetching event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/donor/events/:eventId/register
 * @desc    Register donor for event
 * @access  Private (Donor only)
 */
router.post('/:eventId/register', authenticate, authorize('donor'), validateObjectId('eventId'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not open for registration' });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    // Check already registered
    if (event.registrations.some(r => r.donor.toString() === donor._id.toString())) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // Check capacity
    if (event.capacity && event.registrations.length >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Add registration
    event.registrations.push({
      donor: donor._id,
      registeredAt: new Date(),
      status: 'registered'
    });

    await event.save();

    // Notify event organizer
    await Notification.createNotification({
      recipients: [{ user: event.createdBy, role: 'admin' }],
      type: 'event_registration',
      title: 'New Event Registration',
      content: `${donor.personalInfo.firstName} ${donor.personalInfo.lastName} registered for ${event.title}`,
      data: { eventId: event._id, donorId: donor._id }
    });

    res.json({
      message: 'Successfully registered for event',
      registration: {
        eventId: event._id,
        eventTitle: event.title,
        registeredAt: new Date(),
        status: 'registered'
      }
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({
      message: 'Server error registering for event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/donor/events/:eventId/register
 * @desc    Unregister donor from event
 * @access  Private (Donor only)
 */
router.delete('/:eventId/register', authenticate, authorize('donor'), validateObjectId('eventId'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const donor = await Donor.findOne({ user: req.user._id });
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    // Find and remove registration
    const registrationIndex = event.registrations.findIndex(
      r => r.donor.toString() === donor._id.toString()
    );

    if (registrationIndex === -1) {
      return res.status(400).json({ message: 'You are not registered for this event' });
    }

    // Only allow cancellation before start date
    if (new Date() > new Date(event.startDate)) {
      return res.status(400).json({ message: 'Cannot cancel registration after event start' });
    }

    event.registrations.splice(registrationIndex, 1);
    await event.save();

    res.json({
      message: 'Successfully unregistered from event',
      eventId: event._id
    });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({
      message: 'Server error unregistering from event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/donor/events/registered
 * @desc    Get registered events for donor
 * @access  Private (Donor only)
 */
router.get('/registered', authenticate, authorize('donor'), async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user._id });
    
    if (!donor) {
      return res.status(404).json({ message: 'Donor profile not found' });
    }

    const { status = 'all' } = req.query;

    let statusFilter = {};
    if (status === 'upcoming') {
      statusFilter = { startDate: { $gte: new Date() } };
    } else if (status === 'past') {
      statusFilter = { endDate: { $lt: new Date() } };
    }

    const events = await Event.find({
      'registrations.donor': donor._id,
      ...statusFilter
    })
    .select('_id title eventType startDate endDate location registrations')
    .sort({ startDate: status === 'past' ? -1 : 1 });

    // Enhance with registration details
    const enhancedEvents = events.map(event => {
      const registration = event.registrations.find(
        r => r.donor.toString() === donor._id.toString()
      );
      
      return {
        _id: event._id,
        title: event.title,
        eventType: event.eventType,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        registeredAt: registration.registeredAt,
        status: registration.status,
        bloodAttended: registration.bloodAttended,
        unitsProvided: registration.unitsProvided
      };
    });

    res.json({
      events: enhancedEvents,
      total: enhancedEvents.length
    });
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({
      message: 'Server error fetching registered events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/events
 * @desc    Get all events (admin management)
 * @access  Private (Admin only)
 */
router.get('/admin', authenticate, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, eventType, sortBy = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;

    const events = await Event.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortBy)
      .select('_id title eventType startDate capacity registrations status statistics');

    const total = await Event.countDocuments(filter);

    const enrichedEvents = events.map(event => ({
      _id: event._id,
      title: event.title,
      eventType: event.eventType,
      startDate: event.startDate,
      capacity: event.capacity,
      registrations: event.registrations.length,
      spotsAvailable: event.capacity ? event.capacity - event.registrations.length : 'unlimited',
      status: event.status,
      bloodCollected: event.statistics?.bloodUnitsCollected || 0,
      successRate: event.statistics?.successRate || 0
    }));

    res.json({
      events: enrichedEvents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      message: 'Server error fetching events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/events/:eventId
 * @desc    Update event details
 * @access  Private (Admin only)
 */
router.put('/:eventId', authenticate, authorize('admin'), validateObjectId('eventId'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { title, description, status, capacity, endDate } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (status && ['draft', 'published', 'active', 'completed', 'cancelled'].includes(status)) {
      event.status = status;
    }
    if (capacity) event.capacity = capacity;
    if (endDate) event.endDate = new Date(endDate);

    await event.save();

    res.json({
      message: 'Event updated successfully',
      event: {
        _id: event._id,
        title: event.title,
        status: event.status
      }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      message: 'Server error updating event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/admin/events/:eventId
 * @desc    Delete event
 * @access  Private (Admin only)
 */
router.delete('/:eventId', authenticate, authorize('admin'), validateObjectId('eventId'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Notify registered donors of cancellation
    if (event.registrations.length > 0) {
      const donorIds = event.registrations.map(r => r.donor);
      const donors = await Donor.find({ _id: { $in: donorIds } }).select('user');
      
      const recipients = donors.map(d => ({
        user: d.user,
        role: 'donor'
      }));

      await Notification.createNotification({
        recipients,
        type: 'event_cancelled',
        title: 'Event Cancelled',
        content: `The ${event.title} event has been cancelled.`,
        data: { eventId: event._id }
      });
    }

    res.json({
      message: 'Event deleted successfully',
      eventId: event._id
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      message: 'Server error deleting event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
