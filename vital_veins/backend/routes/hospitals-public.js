const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { validatePagination } = require('../middleware/validation');

// @route   GET /api/hospitals/public/search
// @desc    Search hospitals by name or location (public route)
// @access  Public
router.get('/public/search', validatePagination, async (req, res) => {
  try {
    const { search, city, specialization, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const query = { status: 'approved', isActive: true };

    if (search) {
      query.$or = [
        { hospitalName: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }

    if (specialization && specialization !== 'all') {
      query.specialization = specialization;
    }

    const [hospitals, total] = await Promise.all([
      Hospital.find(query)
        .select('hospitalName address contact location specialization rating')
        .sort({ 'rating.average': -1, hospitalName: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Hospital.countDocuments(query)
    ]);

    res.json({
      hospitals,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Search hospitals error:', error);
    res.status(500).json({
      message: 'Server error searching hospitals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/hospitals/nearby
// @desc    Find nearby hospitals based on donor coordinates and radius
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 50000 } = req.query; // maxDistance in meters

    // Validate coordinates
    if (!longitude || !latitude) {
      return res.status(400).json({
        message: 'Longitude and latitude are required'
      });
    }

    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);

    // Validate coordinate ranges
    if (isNaN(lon) || isNaN(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        message: 'Invalid coordinates provided'
      });
    }

    // Perform geospatial query to get hospitals within maxDistance.
    // Note: using projection with $meta: 'geoDistance' is not supported by the
    // MongoDB driver for 2dsphere queries here, so we fetch matching hospitals
    // and calculate distances in JS instead.
    const nearbyHospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: 'approved',
      isActive: true
    })
      .select('hospitalName address contact location specialization rating inventory')
      .limit(100);

    // Add distance to each hospital response (in km)
    const hospitalsWithDistance = nearbyHospitals.map((hospital) => {
      const hospitalObj = hospital.toObject();
      // Calculate distance from the near query result in MongoDB metadata
      // For simplicity, we'll calculate it here
      const donorCoords = [lon, lat];
      const hospitalCoords = hospital.location.coordinates;
      const distance = calculateDistance(
        donorCoords[1],
        donorCoords[0],
        hospitalCoords[1],
        hospitalCoords[0]
      );
      hospitalObj.distance = distance; // distance in km
      return hospitalObj;
    });

    // Sort by calculated distance ascending and limit to 20 results
    hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
    const limited = hospitalsWithDistance.slice(0, 20);

    res.json({
      hospitals: limited,
      total: hospitalsWithDistance.length,
      userLocation: { latitude: lat, longitude: lon },
      searchRadius: parseInt(maxDistance) / 1000 // convert to km
    });
  } catch (error) {
    console.error('Find nearby hospitals error:', error);
    res.status(500).json({
      message: 'Server error finding nearby hospitals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return parseFloat(distance.toFixed(2));
}

// @route   GET /api/hospitals/get-all
// @desc    Get all approved hospitals (with partial location data)
// @access  Public
router.get('/get-all', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ status: 'approved', isActive: true })
      .select('hospitalName address contact location specialization rating inventory')
      .sort({ 'rating.average': -1 })
      .limit(100);

    res.json({
      hospitals,
      total: hospitals.length
    });
  } catch (error) {
    console.error('Get all hospitals error:', error);
    res.status(500).json({
      message: 'Server error fetching hospitals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
