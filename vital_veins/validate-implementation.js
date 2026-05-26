#!/usr/bin/env node

/**
 * VitalVeins Implementation Validation Script
 * Verifies all new features are properly integrated
 * Run with: node validate-implementation.js
 */

const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, 'backend');
const MODELS_DIR = path.join(BACKEND_DIR, 'models');
const ROUTES_DIR = path.join(BACKEND_DIR, 'routes');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

console.log('\n🔍 VitalVeins Implementation Validation\n');
console.log('=' .repeat(50));

// Check 1: Verify all model files exist
console.log('\n1️⃣  Checking Model Files...');
const requiredModels = [
  'Badge.js',
  'FraudAlert.js',
  'Event.js',
  'Reward.js',
  'Donor.js'
];

requiredModels.forEach(model => {
  const filePath = path.join(MODELS_DIR, model);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    checks.passed.push(`✅ ${model} exists (${(stats.size / 1024).toFixed(1)}KB)`);
    console.log(`   ✅ ${model} (${(stats.size / 1024).toFixed(1)}KB)`);
  } else {
    checks.failed.push(`❌ ${model} missing`);
    console.log(`   ❌ ${model} NOT FOUND`);
  }
});

// Check 2: Verify all route files exist
console.log('\n2️⃣  Checking Route Files...');
const requiredRoutes = [
  'badges.js',
  'fraud.js',
  'events.js',
  'rewards.js'
];

requiredRoutes.forEach(route => {
  const filePath = path.join(ROUTES_DIR, route);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const endpointCount = (content.match(/router\.(get|post|put|delete)/g) || []).length;
    checks.passed.push(`✅ ${route} exists with ${endpointCount} endpoints (${(stats.size / 1024).toFixed(1)}KB)`);
    console.log(`   ✅ ${route} (${endpointCount} endpoints, ${(stats.size / 1024).toFixed(1)}KB)`);
  } else {
    checks.failed.push(`❌ ${route} missing`);
    console.log(`   ❌ ${route} NOT FOUND`);
  }
});

// Check 3: Verify server.js integration
console.log('\n3️⃣  Checking Server Integration...');
const serverPath = path.join(BACKEND_DIR, 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  
  const requiredImports = [
    "'/api/badges'",
    "'/api/admin/fraud'",
    "'/api/events'",
    "'/api/rewards'"
  ];

  let allImportsPresent = true;
  requiredImports.forEach(imp => {
    if (serverContent.includes(imp)) {
      checks.passed.push(`✅ Route ${imp} registered in server.js`);
      console.log(`   ✅ Route ${imp} registered`);
    } else {
      checks.failed.push(`❌ Route ${imp} NOT in server.js`);
      console.log(`   ❌ Route ${imp} NOT registered`);
      allImportsPresent = false;
    }
  });

  if (!allImportsPresent) {
    checks.warnings.push('⚠️  Some routes not registered in server.js');
  }
} else {
  checks.failed.push('❌ server.js not found');
  console.log('   ❌ server.js NOT FOUND');
}

// Check 4: Model Content Validation
console.log('\n4️⃣  Checking Model Schemas...');

// Check Badge model
const badgePath = path.join(MODELS_DIR, 'Badge.js');
if (fs.existsSync(badgePath)) {
  const badgeContent = fs.readFileSync(badgePath, 'utf8');
  const hasRequiredFields = [
    'name',
    'tier',
    'pointsReward',
    'requirement',
    'isActive'
  ].every(field => badgeContent.includes(field));
  
  if (hasRequiredFields) {
    checks.passed.push('✅ Badge schema has all required fields');
    console.log('   ✅ Badge - all required fields present');
  } else {
    checks.warnings.push('⚠️  Badge schema may be missing some fields');
    console.log('   ⚠️  Badge - some fields may be missing');
  }
}

// Check FraudAlert model
const fraudPath = path.join(MODELS_DIR, 'FraudAlert.js');
if (fs.existsSync(fraudPath)) {
  const fraudContent = fs.readFileSync(fraudPath, 'utf8');
  const fraudTypes = ['high_frequency', 'high_cancellation', 'location_anomaly', 'low_response'];
  const hasTypes = fraudTypes.some(type => fraudContent.includes(type));
  
  if (hasTypes) {
    checks.passed.push('✅ FraudAlert schema has fraud detection types');
    console.log('   ✅ FraudAlert - fraud types defined');
  } else {
    checks.warnings.push('⚠️  FraudAlert fraud types not found');
    console.log('   ⚠️  FraudAlert - fraud types check');
  }
}

// Check Event model
const eventPath = path.join(MODELS_DIR, 'Event.js');
if (fs.existsSync(eventPath)) {
  const eventContent = fs.readFileSync(eventPath, 'utf8');
  const has2dsphere = eventContent.includes("'2dsphere'");
  
  if (has2dsphere) {
    checks.passed.push('✅ Event schema has geospatial indexing');
    console.log('   ✅ Event - geospatial index present');
  } else {
    checks.warnings.push('⚠️  Event schema missing geospatial index');
    console.log('   ⚠️  Event - geospatial index check');
  }
}

// Check Reward model
const rewardPath = path.join(MODELS_DIR, 'Reward.js');
if (fs.existsSync(rewardPath)) {
  const rewardContent = fs.readFileSync(rewardPath, 'utf8');
  const hasRedemption = rewardContent.includes('redemptionHistory');
  
  if (hasRedemption) {
    checks.passed.push('✅ Reward schema has redemption tracking');
    console.log('   ✅ Reward - redemption history present');
  } else {
    checks.warnings.push('⚠️  Reward schema missing redemption tracking');
    console.log('   ⚠️  Reward - redemption history check');
  }
}

// Check 5: Route Content Validation
console.log('\n5️⃣  Checking Route Implementations...');

// Check fraud routes have detection logic
const fraudRoutePath = path.join(ROUTES_DIR, 'fraud.js');
if (fs.existsSync(fraudRoutePath)) {
  const fraudRouteContent = fs.readFileSync(fraudRoutePath, 'utf8');
  const hasDetectionRules = fraudRouteContent.includes('FraudDetectionRules');
  const hasDashboard = fraudRouteContent.includes('/dashboard');
  
  if (hasDetectionRules && hasDashboard) {
    checks.passed.push('✅ Fraud routes have detection rules and dashboard');
    console.log('   ✅ Fraud routes - complete implementation');
  } else {
    checks.warnings.push('⚠️  Fraud routes may be incomplete');
    console.log('   ⚠️  Fraud routes - completeness check');
  }
}

// Check event routes have geolocation
const eventRoutePath = path.join(ROUTES_DIR, 'events.js');
if (fs.existsSync(eventRoutePath)) {
  const eventRouteContent = fs.readFileSync(eventRoutePath, 'utf8');
  const hasNearby = eventRouteContent.includes('/nearby');
  const hasRegistration = eventRouteContent.includes('/register');
  
  if (hasNearby && hasRegistration) {
    checks.passed.push('✅ Event routes have nearby discovery and registration');
    console.log('   ✅ Event routes - discovery and registration');
  } else {
    checks.warnings.push('⚠️  Event routes may be incomplete');
    console.log('   ⚠️  Event routes - completeness check');
  }
}

// Check reward routes have redemption
const rewardRoutePath = path.join(ROUTES_DIR, 'rewards.js');
if (fs.existsSync(rewardRoutePath)) {
  const rewardRouteContent = fs.readFileSync(rewardRoutePath, 'utf8');
  const hasRedeem = rewardRouteContent.includes('/redeem');
  const hasHistory = rewardRouteContent.includes('/history');
  
  if (hasRedeem && hasHistory) {
    checks.passed.push('✅ Reward routes have redemption and history');
    console.log('   ✅ Reward routes - redemption and history');
  } else {
    checks.warnings.push('⚠️  Reward routes may be incomplete');
    console.log('   ⚠️  Reward routes - completeness check');
  }
}

// Check badge routes have eligibility
const badgeRoutePath = path.join(ROUTES_DIR, 'badges.js');
if (fs.existsSync(badgeRoutePath)) {
  const badgeRouteContent = fs.readFileSync(badgeRoutePath, 'utf8');
  const hasEligibility = badgeRouteContent.includes('/check-eligibility') || badgeRouteContent.includes('eligibility');
  const hasMilestones = badgeRouteContent.includes('/milestones');
  
  if (hasEligibility && hasMilestones) {
    checks.passed.push('✅ Badge routes have eligibility check and milestones');
    console.log('   ✅ Badge routes - eligibility and milestones');
  } else {
    checks.warnings.push('⚠️  Badge routes may be incomplete');
    console.log('   ⚠️  Badge routes - completeness check');
  }
}

// Check 6: Environment & Configuration
console.log('\n6️⃣  Checking Configuration...');
const envExamplePath = path.join(BACKEND_DIR, 'env.example');
if (fs.existsSync(envExamplePath)) {
  checks.passed.push('✅ env.example exists');
  console.log('   ✅ env.example found');
} else {
  checks.warnings.push('⚠️  env.example not found');
  console.log('   ⚠️  env.example missing');
}

const packagePath = path.join(BACKEND_DIR, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const hasMongoose = packageContent.dependencies && packageContent.dependencies.mongoose;
  const hasExpress = packageContent.dependencies && packageContent.dependencies.express;
  
  if (hasMongoose && hasExpress) {
    checks.passed.push('✅ Required dependencies (mongoose, express) in package.json');
    console.log('   ✅ Required dependencies present');
  } else {
    checks.warnings.push('⚠️  Missing required dependencies');
    console.log('   ⚠️  Required dependencies check');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 VALIDATION SUMMARY\n');
console.log(`✅ Passed: ${checks.passed.length}`);
console.log(`⚠️  Warnings: ${checks.warnings.length}`);
console.log(`❌ Failed: ${checks.failed.length}`);

if (checks.failed.length === 0 && checks.warnings.length === 0) {
  console.log('\n🎉 All validation checks passed! Ready for testing.\n');
  process.exit(0);
} else if (checks.failed.length === 0) {
  console.log('\n✅ All critical checks passed. Some warnings found.\n');
  process.exit(0);
} else {
  console.log('\n❌ Some validation checks failed. Please review above.\n');
  process.exit(1);
}
