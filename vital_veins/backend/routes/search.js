const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const Ticket = require('../models/Ticket');
const Appointment = require('../models/Appointment');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/search/global
// @desc    Global search across all entities
// @access  Private
router.get('/global', validatePagination, async (req, res) => {
  try {
    const { q, type, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    const userRole = req.user.role;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = { $regex: q, $options: 'i' };
    const results = {
      hospitals: [],
      donors: [],
      tickets: [],
      appointments: [],
      total: 0
    };

    // Search hospitals (visible to all)
    if (!type || type === 'hospitals') {
      const hospitalQuery = {
        $or: [
          { hospitalName: searchRegex },
          { 'contact.email': searchRegex },
          { 'address.city': searchRegex },
          { 'address.state': searchRegex }
        ],
        status: 'approved',
        isActive: true
      };

      results.hospitals = await Hospital.find(hospitalQuery)
        .populate('user', 'name email')
        .select('hospitalName contact address location rating status')
        .limit(parseInt(limit))
        .skip(skip);
    }

    // Search donors (admin and hospital can see)
    if ((!type || type === 'donors') && ['admin', 'hospital'].includes(userRole)) {
      const donorQuery = {
        $or: [
          { 'personalInfo.firstName': searchRegex },
          { 'personalInfo.lastName': searchRegex },
          { 'personalInfo.bloodType': searchRegex },
          { 'contact.phone': searchRegex }
        ],
        isActive: true
      };

      // If hospital user, only show donors who have appointments with their hospital
      let donorFilter = donorQuery;
      if (userRole === 'hospital') {
        const hospital = await Hospital.findOne({ user: req.user._id });
        if (hospital) {
          const donorAppointments = await Appointment.find({ hospital: hospital._id }).distinct('donor');
          donorFilter = {
            ...donorQuery,
            _id: { $in: donorAppointments }
          };
        }
      }

      results.donors = await Donor.find(donorFilter)
        .populate('user', 'name email')
        .select('personalInfo contact donorId donationPreferences')
        .limit(parseInt(limit))
        .skip(skip);
    }

    // Search tickets
    if (!type || type === 'tickets') {
      let ticketQuery = {
        $or: [
          { ticketId: searchRegex },
          { displayType: searchRegex },
          { urgency: searchRegex },
          { status: searchRegex }
        ]
      };

      // Role-based ticket filtering
      if (userRole === 'hospital') {
        const hospital = await Hospital.findOne({ user: req.user._id });
        if (hospital) {
          ticketQuery.hospital = hospital._id;
        }
      } else if (userRole === 'donor') {
        // Donors can see public tickets
        ticketQuery.isPublic = true;
      }

      results.tickets = await Ticket.find(ticketQuery)
        .populate('hospital', 'hospitalName contact')
        .select('ticketId displayType urgency status quantity createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
    }

    // Search appointments
    if (!type || type === 'appointments') {
      let appointmentQuery = {};

      // Role-based appointment filtering
      if (userRole === 'admin') {
        appointmentQuery = {
          $or: [
            { appointmentId: searchRegex },
            { displayType: searchRegex },
            { status: searchRegex }
          ]
        };
      } else if (userRole === 'hospital') {
        const hospital = await Hospital.findOne({ user: req.user._id });
        if (hospital) {
          appointmentQuery = {
            hospital: hospital._id,
            $or: [
              { appointmentId: searchRegex },
              { displayType: searchRegex },
              { status: searchRegex }
            ]
          };
        }
      } else if (userRole === 'donor') {
        const donor = await Donor.findOne({ user: req.user._id });
        if (donor) {
          appointmentQuery = {
            donor: donor._id,
            $or: [
              { appointmentId: searchRegex },
              { displayType: searchRegex },
              { status: searchRegex }
            ]
          };
        }
      }

      results.appointments = await Appointment.find(appointmentQuery)
        .populate('hospital', 'hospitalName')
        .populate('donor', 'personalInfo')
        .select('appointmentId displayType status scheduledDate createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);
    }

    // Calculate total results
    results.total = results.hospitals.length + results.donors.length + 
                   results.tickets.length + results.appointments.length;

    res.json({
      query: q,
      results,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: results.total
      }
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      message: 'Server error performing search',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/search/hospitals
// @desc    Advanced hospital search with filters
// @access  Private
router.get('/hospitals', validatePagination, async (req, res) => {
  try {
    const {
      q,
      city,
      state,
      bloodTypes,
      organTypes,
      rating,
      latitude,
      longitude,
      radius,
      limit = 10,
      page = 1,
      sort = 'rating.average'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { status: 'approved', isActive: true };

    // Text search
    if (q && q.trim()) {
      query.$or = [
        { hospitalName: { $regex: q, $options: 'i' } },
        { 'contact.email': { $regex: q, $options: 'i' } },
        { 'address.city': { $regex: q, $options: 'i' } }
      ];
    }

    // Location filters
    if (city) query['address.city'] = { $regex: city, $options: 'i' };
    if (state) query['address.state'] = { $regex: state, $options: 'i' };

    // Blood type availability
    if (bloodTypes) {
      const types = Array.isArray(bloodTypes) ? bloodTypes : [bloodTypes];
      query['inventory.blood.type'] = { $in: types };
      query['inventory.blood.quantity'] = { $gt: 0 };
    }

    // Organ type availability
    if (organTypes) {
      const types = Array.isArray(organTypes) ? organTypes : [organTypes];
      query['inventory.organs.type'] = { $in: types };
      query['inventory.organs.quantity'] = { $gt: 0 };
    }

    // Rating filter
    if (rating) {
      query['rating.average'] = { $gte: parseFloat(rating) };
    }

    let hospitals;

    // Geospatial search
    if (latitude && longitude && radius) {
      const aggregationPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            distanceField: 'distance',
            maxDistance: parseFloat(radius) * 1000, // Convert km to meters
            spherical: true
          }
        },
        { $match: query },
        { $sort: { [sort.startsWith('-') ? sort.slice(1) : sort]: sort.startsWith('-') ? -1 : 1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' }
      ];

      hospitals = await Hospital.aggregate(aggregationPipeline);
    } else {
      hospitals = await Hospital.find(query)
        .populate('user', 'name email')
        .sort(sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    const total = await Hospital.countDocuments(query);

    res.json({
      hospitals,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        query: q,
        city,
        state,
        bloodTypes,
        organTypes,
        rating,
        location: latitude && longitude ? { latitude, longitude, radius } : null
      }
    });

  } catch (error) {
    console.error('Hospital search error:', error);
    res.status(500).json({
      message: 'Server error searching hospitals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/search/donors
// @desc    Advanced donor search (Admin and Hospital only)
// @access  Private (Admin, Hospital)
router.get('/donors', authorize(['admin', 'hospital']), validatePagination, async (req, res) => {
  try {
    const {
      q,
      bloodType,
      city,
      state,
      eligibilityStatus,
      lastDonation,
      age,
      limit = 10,
      page = 1,
      sort = 'user.name'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isActive: true };

    // Text search
    if (q && q.trim()) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: q, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: q, $options: 'i' } },
        { donorId: { $regex: q, $options: 'i' } }
      ];
    }

    // Blood type filter
    if (bloodType) {
      query['personalInfo.bloodType'] = bloodType;
    }

    // Location filters
    if (city) query['address.city'] = { $regex: city, $options: 'i' };
    if (state) query['address.state'] = { $regex: state, $options: 'i' };

    // Eligibility filter
    if (eligibilityStatus === 'eligible') {
      query['donationPreferences.bloodDonation.eligible'] = true;
    } else if (eligibilityStatus === 'ineligible') {
      query['donationPreferences.bloodDonation.eligible'] = false;
    }

    // Last donation filter (in days)
    if (lastDonation) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(lastDonation));
      query['donationPreferences.bloodDonation.lastDonation'] = { $gte: daysAgo };
    }

    // Age filter
    if (age) {
      const [minAge, maxAge] = age.split('-').map(a => parseInt(a));
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - minAge);
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - maxAge);

      query['personalInfo.dateOfBirth'] = {
        $gte: minBirthDate,
        $lte: maxBirthDate
      };
    }

    // If hospital user, apply additional filters
    if (req.user.role === 'hospital') {
      // Show only donors who have had appointments with this hospital
      const hospital = await Hospital.findOne({ user: req.user._id });
      if (hospital) {
        const donorIds = await Appointment.find({ hospital: hospital._id }).distinct('donor');
        query._id = { $in: donorIds };
      }
    }

    const donors = await Donor.find(query)
      .populate('user', 'name email phone')
      .sort(sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Donor.countDocuments(query);

    res.json({
      donors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      filters: {
        query: q,
        bloodType,
        city,
        state,
        eligibilityStatus,
        lastDonation,
        age
      }
    });

  } catch (error) {
    console.error('Donor search error:', error);
    res.status(500).json({
      message: 'Server error searching donors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/search/inventory
// @desc    Search blood and organ inventory
// @access  Private
router.get('/inventory', async (req, res) => {
  try {
    const { type, bloodType, organType, city, state, minQuantity = 1 } = req.query;

    let inventoryData = {};

    if (!type || type === 'blood') {
      // Blood inventory search
      const bloodQuery = [
        { $unwind: '$inventory.blood' },
        { $match: { 
          'inventory.blood.quantity': { $gte: parseInt(minQuantity) },
          status: 'approved',
          isActive: true
        }},
        ...(bloodType ? [{ $match: { 'inventory.blood.type': bloodType } }] : []),
        ...(city ? [{ $match: { 'address.city': { $regex: city, $options: 'i' } } }] : []),
        ...(state ? [{ $match: { 'address.state': { $regex: state, $options: 'i' } } }] : []),
        {
          $group: {
            _id: '$inventory.blood.type',
            totalQuantity: { $sum: '$inventory.blood.quantity' },
            hospitals: {
              $push: {
                id: '$_id',
                name: '$hospitalName',
                quantity: '$inventory.blood.quantity',
                location: '$address',
                contact: '$contact',
                lastUpdated: '$inventory.blood.lastUpdated'
              }
            }
          }
        },
        { $sort: { totalQuantity: -1 } }
      ];

      inventoryData.blood = await Hospital.aggregate(bloodQuery);
    }

    if (!type || type === 'organs') {
      // Organ inventory search
      const organQuery = [
        { $unwind: '$inventory.organs' },
        { $match: { 
          'inventory.organs.quantity': { $gte: parseInt(minQuantity) },
          status: 'approved',
          isActive: true
        }},
        ...(organType ? [{ $match: { 'inventory.organs.type': organType } }] : []),
        ...(city ? [{ $match: { 'address.city': { $regex: city, $options: 'i' } } }] : []),
        ...(state ? [{ $match: { 'address.state': { $regex: state, $options: 'i' } } }] : []),
        {
          $group: {
            _id: '$inventory.organs.type',
            totalQuantity: { $sum: '$inventory.organs.quantity' },
            hospitals: {
              $push: {
                id: '$_id',
                name: '$hospitalName',
                quantity: '$inventory.organs.quantity',
                location: '$address',
                contact: '$contact',
                lastUpdated: '$inventory.organs.lastUpdated'
              }
            }
          }
        },
        { $sort: { totalQuantity: -1 } }
      ];

      inventoryData.organs = await Hospital.aggregate(organQuery);
    }

    res.json({
      inventory: inventoryData,
      filters: {
        type,
        bloodType,
        organType,
        city,
        state,
        minQuantity
      }
    });

  } catch (error) {
    console.error('Inventory search error:', error);
    res.status(500).json({
      message: 'Server error searching inventory',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions/autocomplete
// @access  Private
router.get('/suggestions', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchRegex = { $regex: `^${q}`, $options: 'i' };
    const suggestions = [];

    if (type === 'all' || type === 'hospitals') {
      const hospitalSuggestions = await Hospital.find({
        hospitalName: searchRegex,
        status: 'approved',
        isActive: true
      })
      .select('hospitalName')
      .limit(5);

      suggestions.push(...hospitalSuggestions.map(h => ({
        type: 'hospital',
        text: h.hospitalName,
        id: h._id
      })));
    }

    if (type === 'all' || type === 'cities') {
      const citySuggestions = await Hospital.distinct('address.city', {
        'address.city': searchRegex,
        status: 'approved',
        isActive: true
      });

      suggestions.push(...citySuggestions.slice(0, 5).map(city => ({
        type: 'city',
        text: city
      })));
    }

    if (type === 'all' || type === 'bloodTypes') {
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
      const matchingBloodTypes = bloodTypes.filter(bt => 
        bt.toLowerCase().startsWith(q.toLowerCase())
      );

      suggestions.push(...matchingBloodTypes.map(bt => ({
        type: 'bloodType',
        text: bt
      })));
    }

    res.json({
      query: q,
      suggestions: suggestions.slice(0, 10)
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      message: 'Server error getting suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;