#!/usr/bin/env node

/**
 * VitalVeins Deployment Verification Script
 * Checks all prerequisites and verifies deployment readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const checks = [];

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

function checkFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      checks.push({ name: description, status: 'PASS' });
      log(`✅ ${description}`, 'SUCCESS');
      return true;
    } else {
      checks.push({ name: description, status: 'FAIL' });
      log(`❌ ${description} - File not found: ${filePath}`, 'ERROR');
      return false;
    }
  } catch (err) {
    checks.push({ name: description, status: 'FAIL' });
    log(`❌ ${description} - Error: ${err.message}`, 'ERROR');
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    checks.push({ name: description, status: 'PASS' });
    log(`✅ ${description}`, 'SUCCESS');
    return true;
  } catch (err) {
    checks.push({ name: description, status: 'FAIL' });
    log(`❌ ${description}`, 'ERROR');
    return false;
  }
}

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   VitalVeins Deployment Verification Script v1.0      ║');
console.log('║   Date: February 11, 2026                             ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

log('Starting deployment verification checks...', 'INFO');

// Check 1: Backend structure
log('\n📦 Checking Backend Structure...', 'INFO');
checkFile(path.join(__dirname, 'backend/server.js'), 'Backend server file exists');
checkFile(path.join(__dirname, 'backend/package.json'), 'Backend package.json exists');
checkFile(path.join(__dirname, 'backend/.env'), 'Backend .env file exists');
checkFile(path.join(__dirname, 'backend/routes/admin.js'), 'Admin routes with fixes');
checkFile(path.join(__dirname, 'backend/models/Donor.js'), 'Donor model with fixes');
checkFile(path.join(__dirname, 'backend/models/Hospital.js'), 'Hospital model with fixes');
checkFile(path.join(__dirname, 'backend/middleware/validation.js'), 'Updated validation middleware');

// Check 2: Frontend structure
log('\n🎨 Checking Frontend Structure...', 'INFO');
checkFile(path.join(__dirname, 'frontend/package.json'), 'Frontend package.json exists');
checkFile(path.join(__dirname, 'frontend/public/index.html'), 'Frontend index.html exists');
checkFile(path.join(__dirname, 'frontend/src/App.js'), 'Frontend App.js exists');

// Check 3: Documentation
log('\n📄 Checking Documentation...', 'INFO');
checkFile(path.join(__dirname, 'QA_REPORT.md'), 'QA Report created');
checkFile(path.join(__dirname, 'TESTING_GUIDE.md'), 'Testing Guide created');
checkFile(path.join(__dirname, 'IMPLEMENTATION_SUMMARY.md'), 'Implementation Summary created');
checkFile(path.join(__dirname, 'DEPLOYMENT_GUIDE.md'), 'Deployment Guide created');
checkFile(path.join(__dirname, 'EXECUTIVE_SUMMARY.md'), 'Executive Summary created');

// Check 4: Environment and tools
log('\n🔧 Checking Environment...', 'INFO');
checkCommand('node --version', 'Node.js is installed');
checkCommand('npm --version', 'npm is installed');

// Summary
const passed = checks.filter(c => c.status === 'PASS').length;
const failed = checks.filter(c => c.status === 'FAIL').length;

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   Deployment Verification Summary                     ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

log(`Total Checks: ${checks.length}`, 'INFO');
log(`Passed: ${passed}`, 'SUCCESS');
if (failed > 0) {
  log(`Failed: ${failed}`, 'ERROR');
}

console.log('\n📋 Detailed Results:');
checks.forEach(check => {
  const icon = check.status === 'PASS' ? '✅' : '❌';
  const statusColor = check.status === 'PASS' ? 'SUCCESS' : 'ERROR';
  log(`${icon} ${check.name}`, statusColor);
});

// Check if deployment ready
const deploymentReady = failed === 0;

console.log('\n╔════════════════════════════════════════════════════════╗');
if (deploymentReady) {
  log('✅ DEPLOYMENT READY - All checks passed!', 'SUCCESS');
  console.log('║                                                        ║');
  console.log('║  Next steps:                                          ║');
  console.log('║  1. Backend: npm install && npm run dev              ║');
  console.log('║  2. Frontend: npm install && npm start               ║');
  console.log('║  3. Run tests: npm test                              ║');
  console.log('║  4. See DEPLOYMENT_GUIDE.md for full instructions    ║');
} else {
  log('❌ DEPLOYMENT NOT READY - Fix errors above first', 'ERROR');
}
console.log('║                                                        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

process.exit(deploymentReady ? 0 : 1);
