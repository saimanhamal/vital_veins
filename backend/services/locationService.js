const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_MAPS_PREVIEW_URL = 'https://www.google.com/maps';

/**
 * Validate coordinates are within reasonable bounds
 */
const validateCoordinates = (latitude, longitude) => {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

/**
 * Get address from coordinates using Google Maps Reverse Geocoding API
 */
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await axios.get(GOOGLE_GEOCODING_URL, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });

    if (response.data.status !== 'OK' || !response.data.results.length) {
      return { address: 'Location found', formatted_address: null };
    }

    const result = response.data.results[0];
    const components = result.address_components;

    return {
      address: result.formatted_address,
      street: components.find(c => c.types.includes('route'))?.long_name || '',
      city: components.find(c => c.types.includes('locality'))?.long_name || '',
      state: components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '',
      country: components.find(c => c.types.includes('country'))?.long_name || ''
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    return { address: 'Location extracted' };
  }
};

/**
 * Generate Google Maps preview URL for verification
 */
const generateMapsPreviewUrl = (latitude, longitude) => {
  return `${GOOGLE_MAPS_PREVIEW_URL}?q=${latitude},${longitude}&z=18`;
};

/**
 * Process and enrich location data with address information
 * Returns super precise coordinates (8 decimal places = 1.1mm accuracy)
 */
const processLocation = async (locationData) => {
  const { latitude, longitude, accuracy, altitude } = locationData;

  if (!validateCoordinates(latitude, longitude)) {
    return { error: 'Invalid coordinates', status: 400 };
  }

  const addressData = await getAddressFromCoordinates(latitude, longitude);
  const mapsPreviewUrl = generateMapsPreviewUrl(latitude, longitude);

  return {
    latitude: parseFloat(latitude).toFixed(8), // 8 decimals = 1.1mm precision
    longitude: parseFloat(longitude).toFixed(8), // 8 decimals = 1.1mm precision
    accuracy: accuracy ? Math.round(accuracy) : null,
    altitude: altitude ? Math.round(altitude) : null,
    address: addressData.address,
    street: addressData.street,
    city: addressData.city,
    state: addressData.state,
    country: addressData.country,
    mapsPreviewUrl: mapsPreviewUrl, // Google Maps verification link
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  validateCoordinates,
  getAddressFromCoordinates,
  processLocation,
  generateMapsPreviewUrl
};
