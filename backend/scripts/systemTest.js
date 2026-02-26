const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let hospitalToken = '';
let donorToken = '';

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

const testCredentials = {
  admin: { email: 'admin@lifelink.com', password: 'admin123' },
  hospital: { email: 'sarah.johnson@cityhospital.com', password: 'hospital123' },
  donor: { email: 'john.smith@email.com', password: 'donor123' }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m', // cyan
    success: '\x1b[32m', // green
    error: '\x1b[31m', // red
    warning: '\x1b[33m' // yellow
  };
  const resetColor = '\x1b[0m';
  
  console.log(`${colors[type]}[${timestamp}] ${message}${resetColor}`);
}

async function runTest(testName, testFunction) {
  try {
    log(`Running: ${testName}`, 'info');
    await testFunction();
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASSED' });
    log(`✅ PASSED: ${testName}`, 'success');
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
    log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
  }
}

// Test Functions
async function testHealthEndpoint() {
  const response = await axios.get(`${BASE_URL}/health`);
  if (response.status !== 200 || response.data.status !== 'OK') {
    throw new Error('Health endpoint not responding correctly');
  }
}

async function testUserAuthentication() {
  // Test admin login
  const adminResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials.admin);
  if (!adminResponse.data.token) {
    throw new Error('Admin login failed - no token received');
  }
  adminToken = adminResponse.data.token;

  // Test hospital login
  const hospitalResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials.hospital);
  if (!hospitalResponse.data.token) {
    throw new Error('Hospital login failed - no token received');
  }
  hospitalToken = hospitalResponse.data.token;

  // Test donor login
  const donorResponse = await axios.post(`${BASE_URL}/auth/login`, testCredentials.donor);
  if (!donorResponse.data.token) {
    throw new Error('Donor login failed - no token received');
  }
  donorToken = donorResponse.data.token;
}

async function testAdminDashboard() {
  const response = await axios.get(`${BASE_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!response.data.statistics || !response.data.recentActivity) {
    throw new Error('Admin dashboard missing required data');
  }
}

async function testHospitalManagement() {
  const response = await axios.get(`${BASE_URL}/admin/hospitals?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!response.data.hospitals || !response.data.pagination) {
    throw new Error('Hospital management endpoint missing required data');
  }
}

async function testDonorManagement() {
  const response = await axios.get(`${BASE_URL}/admin/donors?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!response.data.donors || !response.data.pagination) {
    throw new Error('Donor management endpoint missing required data');
  }
}

async function testHospitalDashboard() {
  const response = await axios.get(`${BASE_URL}/hospital/dashboard`, {
    headers: { Authorization: `Bearer ${hospitalToken}` }
  });
  
  if (!response.data.statistics) {
    throw new Error('Hospital dashboard missing required data');
  }
}

async function testHospitalInventory() {
  const response = await axios.get(`${BASE_URL}/hospital/inventory`, {
    headers: { Authorization: `Bearer ${hospitalToken}` }
  });
  
  if (!response.data.inventory) {
    throw new Error('Hospital inventory endpoint missing required data');
  }
}

async function testDonorDashboard() {
  const response = await axios.get(`${BASE_URL}/donor/dashboard`, {
    headers: { Authorization: `Bearer ${donorToken}` }
  });
  
  if (!response.data.dashboard) {
    throw new Error('Donor dashboard missing required data');
  }
}

async function testDonorAppointments() {
  const response = await axios.get(`${BASE_URL}/donor/appointments`, {
    headers: { Authorization: `Bearer ${donorToken}` }
  });
  
  if (!response.data.appointments) {
    throw new Error('Donor appointments endpoint missing required data');
  }
}

async function testSearchFunctionality() {
  // Test global search
  const globalResponse = await axios.get(`${BASE_URL}/search/global?q=hospital`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!globalResponse.data.results) {
    throw new Error('Global search not returning results');
  }

  // Test hospital search
  const hospitalResponse = await axios.get(`${BASE_URL}/search/hospitals?q=city`, {
    headers: { Authorization: `Bearer ${donorToken}` }
  });
  
  if (!hospitalResponse.data.hospitals) {
    throw new Error('Hospital search not returning results');
  }

  // Test search suggestions
  const suggestionsResponse = await axios.get(`${BASE_URL}/search/suggestions?q=A`, {
    headers: { Authorization: `Bearer ${donorToken}` }
  });
  
  if (!Array.isArray(suggestionsResponse.data.suggestions)) {
    throw new Error('Search suggestions not returning array');
  }
}

async function testNotificationSystem() {
  const response = await axios.get(`${BASE_URL}/notifications?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!response.data.notifications || !response.data.pagination) {
    throw new Error('Notification system endpoint missing required data');
  }
}

async function testTicketSystem() {
  const response = await axios.get(`${BASE_URL}/tickets?limit=5`, {
    headers: { Authorization: `Bearer ${hospitalToken}` }
  });
  
  if (!response.data.tickets) {
    throw new Error('Ticket system endpoint missing required data');
  }
}

async function testUserProfiles() {
  // Test admin profile
  const adminProfile = await axios.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!adminProfile.data.user || adminProfile.data.user.role !== 'admin') {
    throw new Error('Admin profile endpoint not working correctly');
  }

  // Test hospital profile
  const hospitalProfile = await axios.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${hospitalToken}` }
  });
  
  if (!hospitalProfile.data.user || hospitalProfile.data.user.role !== 'hospital') {
    throw new Error('Hospital profile endpoint not working correctly');
  }

  // Test donor profile
  const donorProfile = await axios.get(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${donorToken}` }
  });
  
  if (!donorProfile.data.user || donorProfile.data.user.role !== 'donor') {
    throw new Error('Donor profile endpoint not working correctly');
  }
}

async function testDatabaseConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink');
    const connectionState = mongoose.connection.readyState;
    if (connectionState !== 1) {
      throw new Error(`Database connection state: ${connectionState} (should be 1)`);
    }
    mongoose.connection.close();
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

async function testEmailServiceIntegration() {
  // This test checks if the email service can be initialized without errors
  try {
    const emailService = require('../services/emailService');
    const testTemplate = emailService.generateEmailTemplate('notification', {
      subject: 'Test Email',
      content: '<p>Test email content</p>'
    });
    
    if (!testTemplate || !testTemplate.subject || !testTemplate.html) {
      throw new Error('Email template generation failed');
    }
  } catch (error) {
    throw new Error(`Email service integration failed: ${error.message}`);
  }
}

async function testInventorySearch() {
  const response = await axios.get(`${BASE_URL}/search/inventory?type=blood&minQuantity=1`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!response.data.inventory) {
    throw new Error('Inventory search endpoint missing required data');
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting LifeLink System Tests', 'info');
  log('=====================================', 'info');
  
  const testSuites = [
    // Core System Tests
    { name: 'Health Endpoint', test: testHealthEndpoint },
    { name: 'Database Connection', test: testDatabaseConnection },
    
    // Authentication Tests
    { name: 'User Authentication', test: testUserAuthentication },
    { name: 'User Profiles', test: testUserProfiles },
    
    // Admin Panel Tests
    { name: 'Admin Dashboard', test: testAdminDashboard },
    { name: 'Hospital Management', test: testHospitalManagement },
    { name: 'Donor Management', test: testDonorManagement },
    
    // Hospital Dashboard Tests
    { name: 'Hospital Dashboard', test: testHospitalDashboard },
    { name: 'Hospital Inventory', test: testHospitalInventory },
    
    // Donor Dashboard Tests
    { name: 'Donor Dashboard', test: testDonorDashboard },
    { name: 'Donor Appointments', test: testDonorAppointments },
    
    // Feature Tests
    { name: 'Search Functionality', test: testSearchFunctionality },
    { name: 'Notification System', test: testNotificationSystem },
    { name: 'Ticket System', test: testTicketSystem },
    { name: 'Inventory Search', test: testInventorySearch },
    { name: 'Email Service Integration', test: testEmailServiceIntegration }
  ];

  for (const suite of testSuites) {
    await runTest(suite.name, suite.test);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Display results
  log('=====================================', 'info');
  log('🎯 TEST RESULTS SUMMARY', 'info');
  log('=====================================', 'info');
  log(`✅ Passed: ${testResults.passed}`, 'success');
  log(`❌ Failed: ${testResults.failed}`, 'error');
  log(`📊 Total: ${testResults.passed + testResults.failed}`, 'info');
  log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`, 'info');

  if (testResults.failed > 0) {
    log('🔍 FAILED TESTS:', 'warning');
    testResults.tests
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        log(`  - ${test.name}: ${test.error}`, 'error');
      });
  }

  log('=====================================', 'info');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run the tests
runAllTests().catch((error) => {
  log(`Test runner error: ${error.message}`, 'error');
  process.exit(1);
});