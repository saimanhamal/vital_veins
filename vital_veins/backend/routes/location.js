const express = require('express');
const { body, validationResult } = require('express-validator');
const { processLocation } = require('../services/locationService');

const router = express.Router();

/**
 * POST /api/location/validate
 * Validates coordinates and returns exact location with address
 * Body: { latitude, longitude, accuracy?, altitude? }
 */
router.post('/validate', [
  body('latitude').isFloat({ min: -90, max: 90 }).toFloat(),
  body('longitude').isFloat({ min: -180, max: 180 }).toFloat(),
  body('accuracy').optional().isFloat({ min: 0 }).toFloat(),
  body('altitude').optional().isFloat().toFloat()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const enrichedLocation = await processLocation(req.body);

    if (enrichedLocation.error) {
      return res.status(enrichedLocation.status || 400).json(enrichedLocation);
    }

    res.json(enrichedLocation);
  } catch (error) {
    console.error('Location validation error:', error);
    res.status(500).json({ error: 'Location processing failed' });
  }
});

module.exports = router;
