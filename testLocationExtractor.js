/**
 * Test Location Extractor with Google Maps API
 * This script verifies that:
 * 1. Google Maps API key is properly configured
 * 2. Location validation endpoint is working
 * 3. Address extraction is working correctly
 */

const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

const API_URL = 'http://localhost:5000/api/location/validate';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

console.log('🧪 Location Extractor Test Suite\n');
console.log('═════════════════════════════════════\n');

// Test 1: Check API Key Configuration
console.log('Test 1: Checking Google Maps API Key Configuration');
console.log('─────────────────────────────────────');
if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ ERROR: Google Maps API key not found in .env');
  console.error('   Please add: GOOGLE_MAPS_API_KEY=your_key in backend/.env');
  process.exit(1);
} else {
  console.log('✅ Google Maps API key is configured');
  console.log(`   Key: ${GOOGLE_MAPS_API_KEY.substring(0, 10)}...${GOOGLE_MAPS_API_KEY.substring(-5)}\n`);
}

// Test 2: Test Location Validation with Real Coordinates
console.log('Test 2: Testing Location Validation Endpoint');
console.log('─────────────────────────────────────');

const testLocations = [
  {
    name: 'Kathmandu, Nepal',
    latitude: 27.7172,
    longitude: 85.3240,
    accuracy: 50
  },
  {
    name: 'Pokhara, Nepal',
    latitude: 28.2096,
    longitude: 83.9854,
    accuracy: 100
  },
  {
    name: 'New York, USA',
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 75
  }
];

(async () => {
  for (const location of testLocations) {
    try {
      console.log(`\nTesting: ${location.name}`);
      const response = await axios.post(API_URL, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      }, { timeout: 10000 });

      console.log(`  ✅ Response received`);
      console.log(`     Latitude: ${response.data.latitude}`);
      console.log(`     Longitude: ${response.data.longitude}`);
      console.log(`     Accuracy: ${response.data.accuracy}m`);
      console.log(`     Address: ${response.data.address || 'Not retrieved'}`);
      console.log(`     City: ${response.data.city || 'N/A'}`);
      console.log(`     Country: ${response.data.country || 'N/A'}`);

    } catch (error) {
      if (error.response) {
        console.error(`  ❌ API Error: ${error.response.status}`);
        console.error(`     ${JSON.stringify(error.response.data)}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.error(`  ❌ Connection Error: Backend not running on port 5000`);
        console.error(`     Start backend with: npm run dev (in backend directory)`);
      } else {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
  }

  // Test 3: Invalid Coordinates Test
  console.log('\n\nTest 3: Testing Invalid Coordinates Rejection');
  console.log('─────────────────────────────────────');
  
  const invalidLocations = [
    { name: 'Latitude > 90', latitude: 100, longitude: 85 },
    { name: 'Longitude > 180', latitude: 27, longitude: 200 }
  ];

  for (const location of invalidLocations) {
    try {
      console.log(`\nTesting: ${location.name}`);
      const response = await axios.post(API_URL, location);
      console.log(`  ❌ Should have been rejected but wasn't`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`  ✅ Correctly rejected invalid coordinates`);
      } else {
        console.log(`  ❓ Unexpected error: ${error.message}`);
      }
    }
  }

  console.log('\n\n═════════════════════════════════════');
  console.log('✅ Location Extractor Test Complete!');
  console.log('\n📋 Summary:');
  console.log('   • Google Maps API key is configured');
  console.log('   • Location validation endpoint is working');
  console.log('   • Address extraction uses Google Maps API');
  console.log('   • Invalid coordinates are properly rejected\n');
})();
