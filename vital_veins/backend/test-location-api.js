#!/usr/bin/env node

/**
 * Test Location API Endpoint
 * Run: node test-location-api.js
 * 
 * Tests if the backend location API is working correctly
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_COORDS = {
  latitude: 27.7172,
  longitude: 85.3240,
  accuracy: 15
};

console.log('\n📍 Location API Test');
console.log('═'.repeat(50));
console.log(`Testing: ${API_URL}/api/location/validate`);
console.log(`Coordinates: ${TEST_COORDS.latitude}, ${TEST_COORDS.longitude}`);
console.log('═'.repeat(50) + '\n');

const postData = JSON.stringify(TEST_COORDS);

const options = {
  hostname: new URL(API_URL).hostname,
  port: new URL(API_URL).port || 5000,
  path: '/api/location/validate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('✅ Response:\n');
      console.log(JSON.stringify(response, null, 2));
      
      // Validation checks
      console.log('\n' + '─'.repeat(50));
      console.log('Validation Results:');
      console.log('─'.repeat(50));
      
      const checks = {
        'Has latitude': !!response.latitude,
        'Has longitude': !!response.longitude,
        'Has address': !!response.address,
        'Has timestamp': !!response.timestamp,
        'Is validated': response.validated === true
      };
      
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${check}`);
      });
      
      const allPassed = Object.values(checks).every(v => v);
      console.log('\n' + '═'.repeat(50));
      console.log(allPassed ? '✅ ALL TESTS PASSED!' : '⚠️  Some tests failed');
      console.log('═'.repeat(50) + '\n');
      
    } catch (e) {
      console.error('❌ Failed to parse response:', e.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.error('\nMake sure:');
  console.error('1. Backend is running: npm start (from backend folder)');
  console.error('2. API URL is correct:', options.hostname + ':' + options.port);
  console.error('3. Google Maps API key is set in .env file');
});

req.write(postData);
req.end();
