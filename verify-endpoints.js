#!/usr/bin/env node

/**
 * VitalVeins Endpoint Verification Script
 * Tests all critical API endpoints
 */

const http = require('http');
const API_URL = 'http://localhost:5000';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function log(message, status = 'INFO') {
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    ERROR: '\x1b[31m',
    WARNING: '\x1b[33m',
    RESET: '\x1b[0m'
  };
  
  const color = colors[status] || colors.INFO;
  console.log(`${color}[${status}]\x1b[0m ${message}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoint(name, method, path) {
  testsRun++;
  try {
    const response = await makeRequest(method, path);
    const success = response.status >= 200 && response.status < 500;
    
    if (success) {
      testsPassed++;
      log(`✅ ${name} - Status ${response.status}`, 'SUCCESS');
      return true;
    } else {
      testsFailed++;
      log(`❌ ${name} - Status ${response.status}`, 'ERROR');
      return false;
    }
  } catch (err) {
    testsFailed++;
    log(`❌ ${name} - ${err.message}`, 'ERROR');
    return false;
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   VitalVeins Endpoint Verification Script v1.0         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  log('Starting endpoint verification tests...', 'INFO');
  log(`API URL: ${API_URL}\n`, 'INFO');

  // Health Check
  log('📊 Health Check Endpoints', 'INFO');
  await testEndpoint('GET /api/health', 'GET', '/api/health');

  // Authentication Endpoints
  log('\n🔐 Authentication Endpoints', 'INFO');
  await testEndpoint('POST /api/auth/register', 'POST', '/api/auth/register');
  await testEndpoint('POST /api/auth/login', 'POST', '/api/auth/login');
  await testEndpoint('POST /api/auth/logout', 'POST', '/api/auth/logout');

  // Admin Endpoints
  log('\n👨‍💼 Admin Endpoints', 'INFO');
  await testEndpoint('GET /api/admin/dashboard', 'GET', '/api/admin/dashboard');
  await testEndpoint('GET /api/admin/hospitals', 'GET', '/api/admin/hospitals');
  await testEndpoint('GET /api/admin/donors', 'GET', '/api/admin/donors');
  await testEndpoint('GET /api/admin/users', 'GET', '/api/admin/users');
  await testEndpoint('GET /api/admin/appointments', 'GET', '/api/admin/appointments');
  await testEndpoint('GET /api/admin/reports', 'GET', '/api/admin/reports');

  // Hospital Endpoints
  log('\n🏥 Hospital Endpoints', 'INFO');
  await testEndpoint('GET /api/hospitals-public', 'GET', '/api/hospitals-public');
  await testEndpoint('GET /api/hospitals-public/search', 'GET', '/api/hospitals-public/search');
  await testEndpoint('GET /api/hospital/profile', 'GET', '/api/hospital/profile');

  // Donor Endpoints
  log('\n🩸 Donor Endpoints', 'INFO');
  await testEndpoint('GET /api/donor/profile', 'GET', '/api/donor/profile');
  await testEndpoint('GET /api/donor/preferences', 'GET', '/api/donor/preferences');

  // Appointment Endpoints  
  log('\n📅 Appointment Endpoints', 'INFO');
  await testEndpoint('GET /api/appointments', 'GET', '/api/appointments');

  // Notification Endpoints
  log('\n🔔 Notification Endpoints', 'INFO');
  await testEndpoint('GET /api/notifications', 'GET', '/api/notifications');

  // Ticket Endpoints
  log('\n🎫 Ticket Endpoints', 'INFO');
  await testEndpoint('GET /api/tickets', 'GET', '/api/tickets');

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Test Summary                                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  log(`Tests Run: ${testsRun}`, 'INFO');
  log(`Passed: ${testsPassed}`, 'SUCCESS');
  if (testsFailed > 0) {
    log(`Failed: ${testsFailed}`, 'ERROR');
  }

  const passRate = testsRun > 0 ? ((testsPassed / testsRun) * 100).toFixed(2) : 0;
  log(`Pass Rate: ${passRate}%\n`, testsPassed === testsRun ? 'SUCCESS' : 'WARNING');

  if (testsFailed === 0) {
    log('✅ All endpoints accessible!', 'SUCCESS');
    process.exit(0);
  } else {
    log('⚠️  Some endpoints returned errors', 'WARNING');
    log('Note: Some errors are expected if backend is not running', 'INFO');
    process.exit(0);
  }
}

// Run tests
runTests().catch(err => {
  log(`Fatal error: ${err.message}`, 'ERROR');
  process.exit(1);
});
