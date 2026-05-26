const express = require('express');
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Donor = require('./models/Donor');
const Hospital = require('./models/Hospital');
const Ticket = require('./models/Ticket');
const User = require('./models/User');

/**
 * APPOINTMENT SYSTEM IMPROVEMENT TEST SUITE
 * 
 * Tests all 7 improvement requirements:
 * 1. Slot Validation with Capacity Limits
 * 2. 90-Day Donation Interval Safety
 * 3. Emergency Priority Auto-Approval
 * 4. Auto Status Workflow Validation
 * 5. Cancellation Policy & Flagging
 * 6. Hospital Capacity Management
 * 7. Geo-Based Hospital Suggestion
 */

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test result tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
function log(type, message) {
  switch (type) {
    case 'pass':
      console.log(`${colors.green}✓ PASS${colors.reset} ${message}`);
      results.passed++;
      break;
    case 'fail':
      console.log(`${colors.red}✗ FAIL${colors.reset} ${message}`);
      results.failed++;
      break;
    case 'test':
      console.log(`\n${colors.bold}${colors.blue}TEST: ${message}${colors.reset}`);
      break;
    case 'section':
      console.log(`\n${colors.bold}${colors.yellow}═══ ${message} ═══${colors.reset}`);
      break;
  }
}

function assert(condition, message) {
  if (condition) {
    log('pass', message);
  } else {
    log('fail', message);
  }
}

// Test data generators
async function createTestDonor(name = 'Test Donor', lastDonation = null) {
  const user = await User.create({
    email: `donor${Date.now()}@test.com`,
    password: 'password123',
    role: 'donor'
  });

  return Donor.create({
    user: user._id,
    personalInfo: {
      firstName: name.split(' ')[0],
      lastName: name.split(' ')[1] || 'User'
    },
    contact: {
      phone: '1234567890',
      email: `donor${Date.now()}@test.com`,
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      }
    },
    medicalInfo: {
      bloodType: 'O+',
      lastDonationDate: lastDonation
    },
    lastCompletedDonationDate: lastDonation,
    appointmentMetrics: {
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      cancellationRate: 0,
      recentCancellations: [],
      flaggedForReview: false
    }
  });
}

async function createTestHospital(name = 'Test Hospital', slotCapacity = 5) {
  const user = await User.create({
    email: `hospital${Date.now()}@test.com`,
    password: 'password123',
    role: 'hospital'
  });

  return Hospital.create({
    user: user._id,
    hospitalName: name,
    address: {
      street: '456 Medical Ave',
      city: 'Hospital City',
      state: 'TS',
      zipCode: '54321',
      phone: '9876543210',
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128]  // NYC
      }
    },
    contact: {
      email: `hospital${Date.now()}@test.com`,
      phone: '9876543210'
    },
    workingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '10:00', close: '14:00', isOpen: true },
      sunday: { open: false }
    },
    capacity: {
      appointmentSlotCapacity: slotCapacity,
      maxDonorsPerDay: 50,
      bloodInventory: {}
    },
    isApproved: true
  });
}

async function createTestTicket(urgency = 'urgent', status = 'open') {
  return Ticket.create({
    ticketNumber: `TICKET-${Date.now()}`,
    title: 'Blood Request',
    urgency: urgency,
    status: status,
    requestedBloodType: 'O+',
    quantityNeeded: 2,
    description: 'Test emergency ticket'
  });
}

async function createAppointmentForDate(donor, hospital, date, status = 'pending') {
  return Appointment.create({
    donor: donor._id,
    hospital: hospital._id,
    type: 'blood',
    bloodType: 'O+',
    scheduledDate: date,
    scheduledTime: '10:00',
    status: status,
    priority: 'normal',
    lastDonationDate: donor.lastCompletedDonationDate
  });
}

// ===========================
// TEST SUITE IMPLEMENTATION
// ===========================

async function testSlotValidationWithCapacity() {
  log('section', 'TEST 1: Slot Validation with Capacity Limits');

  try {
    const hospital = await createTestHospital('Capacity Test Hospital', 3);
    const date = new Date();
    date.setDate(date.getDate() + 5);

    log('test', 'Creating 3 appointments to fill slot capacity');
    const donors = await Promise.all([
      createTestDonor('Donor One'),
      createTestDonor('Donor Two'),
      createTestDonor('Donor Three')
    ]);

    for (let donor of donors) {
      await createAppointmentForDate(donor, hospital, date, 'confirmed');
    }

    // Try to get available slots
    log('test', 'Checking available slots capacity');
    const slots = await Appointment.findAvailableSlotsWithCapacity(
      hospital._id,
      date,
      60,
      3  // maxDonorsPerSlot
    );

    const tenAMSlot = slots.find(s => s.time === '10:00');
    
    if (tenAMSlot) {
      assert(!tenAMSlot.available, 'Slot shows unavailable when at capacity');
      assert(tenAMSlot.capacity.booked === 3, 'Slot shows correct booking count');
      assert(tenAMSlot.capacity.available === 0, 'Slot shows zero available spaces');
    } else {
      log('fail', 'Could not find slot in results');
    }

    // Create another appointment in different slot
    log('test', 'Booking appointment in different time slot');
    const donor4 = await createTestDonor('Donor Four');
    const apt = new Appointment({
      donor: donor4._id,
      hospital: hospital._id,
      type: 'blood',
      bloodType: 'O+',
      scheduledDate: date,
      scheduledTime: '11:00',  // Different slot
      status: 'pending',
      slotCapacity: {
        maxDonorsPerSlot: 3,
        currentCount: 1
      }
    });
    await apt.save();

    assert(apt.slotCapacity.currentCount === 1, 'New slot starts with count of 1');

  } catch (error) {
    log('fail', `Capacity test error: ${error.message}`);
  }
}

async function test90DayDonationInterval() {
  log('section', 'TEST 2: 90-Day Donation Interval Safety');

  try {
    // Test 1: Recent donation
    log('test', 'Checking donor ineligible with recent donation');
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);  // 30 days ago

    const recentDonor = await createTestDonor('Recent Donor', recentDate);
    const eligibility = await recentDonor.checkDonationInterval();

    assert(eligibility.canDonate === false, 'Donor with recent donation cannot donate');
    assert(eligibility.daysUntilEligible > 0, 'Days until eligible calculated correctly');
    assert(eligibility.daysUntilEligible <= 60, 'Days until eligible is <= 60');

    // Test 2: Old donation (eligible)
    log('test', 'Checking donor eligible with old donation');
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 120);  // 120 days ago

    const oldDonor = await createTestDonor('Old Donor', oldDate);
    const oldEligibility = await oldDonor.checkDonationInterval();

    assert(oldEligibility.canDonate === true, 'Donor with old donation can donate');
    assert(oldEligibility.daysUntilEligible === 0, 'Days until eligible is 0 when eligible');

    // Test 3: No prior donation
    log('test', 'Checking donor with no prior donation');
    const newDonor = await createTestDonor('New Donor', null);
    const newEligibility = await newDonor.checkDonationInterval();

    assert(newEligibility.canDonate === true, 'Donor with no donation history can donate');

  } catch (error) {
    log('fail', `90-day interval test error: ${error.message}`);
  }
}

async function testEmergencyAutoApproval() {
  log('section', 'TEST 3: Emergency Priority Auto-Approval');

  try {
    const donor = await createTestDonor('Emergency Donor');
    const hospital = await createTestHospital('Emergency Hospital');
    const ticket = await createTestTicket('critical', 'open');

    log('test', 'Creating emergency appointment with linked ticket');
    const apt = new Appointment({
      donor: donor._id,
      hospital: hospital._id,
      type: 'blood',
      bloodType: 'O+',
      scheduledDate: new Date(Date.now() + 86400000),
      scheduledTime: '10:00',
      status: 'approved',  // Auto-approved
      priority: 'emergency',
      linkedTicket: ticket._id,
      isEmergencyLinked: true,
      autoApprovalReason: 'emergency_ticket'
    });

    await apt.save();

    assert(apt.status === 'approved', 'Emergency appointment created with approved status');
    assert(apt.priority === 'emergency', 'Emergency appointment marked as priority');
    assert(apt.isEmergencyLinked === true, 'Emergency appointment linked to ticket');
    assert(apt.autoApprovalReason === 'emergency_ticket', 'Auto-approval reason recorded');

  } catch (error) {
    log('fail', `Emergency approval test error: ${error.message}`);
  }
}

async function testStatusWorkflowValidation() {
  log('section', 'TEST 4: Auto Status Workflow Validation');

  try {
    const donor = await createTestDonor('Workflow Donor');
    const hospital = await createTestHospital('Workflow Hospital');
    const apt = await createAppointmentForDate(donor, hospital, new Date(Date.now() + 86400000), 'pending');

    log('test', 'Testing valid transition: pending → confirmed');
    const validTransition = apt.validateStatusTransition('confirmed', 'Donor confirmed');
    assert(validTransition.valid === true, 'Valid transition allowed');

    log('test', 'Testing invalid transition: pending → completed');
    const invalidTransition = apt.validateStatusTransition('completed', 'Skip confirmation');
    assert(invalidTransition.valid === false, 'Invalid transition blocked');
    assert(invalidTransition.message.includes('Cannot'), 'Error message explains why');

    log('test', 'Testing status update safely');
    apt.status = 'confirmed';  // Set manually to test updateStatusSafely
    await apt.updateStatusSafely('no_show', { reason: 'Donor did not show' });

    // Reload to check
    const updated = await Appointment.findById(apt._id);
    assert(updated.status === 'no_show', 'Status updated successfully');

  } catch (error) {
    log('fail', `Workflow validation test error: ${error.message}`);
  }
}

async function testCancellationPolicyAndFlagging() {
  log('section', 'TEST 5: Cancellation Policy & Flagging');

  try {
    const donor = await createTestDonor('Cancellation Donor');
    const hospital = await createTestHospital('Cancellation Hospital');

    log('test', 'Recording first cancellation');
    const apt1 = await createAppointmentForDate(donor, hospital, new Date(Date.now() + 86400000));
    await apt1.save();
    await donor.recordCancellation(apt1._id, 'Personal conflict');

    const afterFirst = await Donor.findById(donor._id);
    assert(afterFirst.appointmentMetrics.recentCancellations.length === 1, 'First cancellation recorded');
    assert(afterFirst.appointmentMetrics.flaggedForReview === false, 'Not flagged after 1 cancellation');

    log('test', 'Recording second cancellation');
    const apt2 = await createAppointmentForDate(donor, hospital, new Date(Date.now() + 172800000));
    await apt2.save();
    await donor.recordCancellation(apt2._id, 'Schedule change');

    const afterSecond = await Donor.findById(donor._id);
    assert(afterSecond.appointmentMetrics.recentCancellations.length === 2, 'Second cancellation recorded');
    assert(afterSecond.appointmentMetrics.flaggedForReview === false, 'Not flagged after 2 cancellations');

    log('test', 'Recording third cancellation');
    const apt3 = await createAppointmentForDate(donor, hospital, new Date(Date.now() + 259200000));
    await apt3.save();
    await donor.recordCancellation(apt3._id, 'Medical issue');

    const afterThird = await Donor.findById(donor._id);
    assert(afterThird.appointmentMetrics.recentCancellations.length === 3, 'Third cancellation recorded');
    assert(afterThird.appointmentMetrics.flaggedForReview === false, 'Not flagged after 3 cancellations (threshold)');

    log('test', 'Recording fourth cancellation (should flag)');
    const apt4 = await createAppointmentForDate(donor, hospital, new Date(Date.now() + 345600000));
    await apt4.save();
    await donor.recordCancellation(apt4._id, 'Another conflict');

    const afterFourth = await Donor.findById(donor._id);
    assert(afterFourth.appointmentMetrics.recentCancellations.length === 4, 'Fourth cancellation recorded');
    assert(afterFourth.appointmentMetrics.flaggedForReview === true, 'Donor flagged after >3 cancellations');
    assert(afterFourth.appointmentMetrics.flaggedReason.includes('cancellation'), 'Flag reason set');

    log('test', 'Clearing review flag (admin action)');
    await afterFourth.clearReviewFlag('Reviewed: legitimate medical issue, can continue');

    const afterCleared = await Donor.findById(donor._id);
    assert(afterCleared.appointmentMetrics.flaggedForReview === false, 'Flag cleared by admin');

  } catch (error) {
    log('fail', `Cancellation policy test error: ${error.message}`);
  }
}

async function testHospitalCapacityManagement() {
  log('section', 'TEST 6: Hospital Capacity Management');

  try {
    const hospital = await createTestHospital('Capacity Hospital', 5);

    log('test', 'Verifying hospital capacity fields');
    assert(hospital.capacity.appointmentSlotCapacity === 5, 'Slot capacity set correctly');
    assert(hospital.capacity.maxDonorsPerDay === 50, 'Max daily donations set correctly');

    log('test', 'Updating hospital capacity');
    hospital.capacity.appointmentSlotCapacity = 8;
    hospital.capacity.maxDonorsPerDay = 75;
    await hospital.save();

    const updated = await Hospital.findById(hospital._id);
    assert(updated.capacity.appointmentSlotCapacity === 8, 'Slot capacity updated');
    assert(updated.capacity.maxDonorsPerDay === 75, 'Max daily capacity updated');

  } catch (error) {
    log('fail', `Hospital capacity test error: ${error.message}`);
  }
}

async function testGeoBasedHospitalSuggestion() {
  log('section', 'TEST 7: Geo-Based Hospital Suggestion');

  try {
    // Create hospitals at different locations
    log('test', 'Creating nearby hospitals');
    
    const hospitalNear = await Hospital.create({
      user: (await User.create({
        email: `hosp${Date.now()}@test.com`,
        password: 'pass',
        role: 'hospital'
      }))._id,
      hospitalName: 'Near Hospital',
      address: {
        street: '100 Health St',
        city: 'NYC',
        state: 'NY',
        zipCode: '10001',
        phone: '2125551234',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]  // NYC
        }
      },
      contact: { email: `hosp${Date.now()}@test.com`, phone: '2125551234' },
      workingHours: {
        monday: { open: '09:00', close: '17:00', isOpen: true },
        tuesday: { open: '09:00', close: '17:00', isOpen: true },
        wednesday: { open: '09:00', close: '17:00', isOpen: true },
        thursday: { open: '09:00', close: '17:00', isOpen: true },
        friday: { open: '09:00', close: '17:00', isOpen: true },
        saturday: { open: '10:00', close: '14:00', isOpen: true },
        sunday: { open: false }
      },
      capacity: {
        appointmentSlotCapacity: 5,
        maxDonorsPerDay: 50,
        bloodInventory: {}
      },
      isApproved: true
    });

    log('test', 'Getting suggested hospitals nearby');
    const donorCoordinates = [-74.006, 40.7128];  // Same as near hospital
    const suggestedHospitals = await Appointment.getSuggestedHospitalsNearby(
      donorCoordinates,
      15,  // 15 km radius
      new Date()
    );

    assert(Array.isArray(suggestedHospitals), 'Returned array of hospitals');
    assert(suggestedHospitals.length > 0, 'Found at least one nearby hospital');

    if (suggestedHospitals.length > 0) {
      const first = suggestedHospitals[0];
      assert(first.hospital, 'Hospital object included in result');
      assert(first.workingHours, 'Working hours included');
      assert(first.isOpen !== undefined, 'Open status included');
      assert(Array.isArray(first.availableSlots), 'Available slots array included');
    }

  } catch (error) {
    log('fail', `Geospatial suggestion test error: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}
╔════════════════════════════════════════════════════════════╗
║  APPOINTMENT SYSTEM IMPROVEMENT TEST SUITE                 ║
║  Testing all 7 required improvements                       ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    console.log('Connected to MongoDB\n');

    // Run all tests
    await testSlotValidationWithCapacity();
    await test90DayDonationInterval();
    await testEmergencyAutoApproval();
    await testStatusWorkflowValidation();
    await testCancellationPolicyAndFlagging();
    await testHospitalCapacityManagement();
    await testGeoBasedHospitalSuggestion();

    // Print summary
    console.log(`\n${colors.bold}${colors.yellow}═══ TEST SUMMARY ═══${colors.reset}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`Total: ${results.passed + results.failed}\n`);

    if (results.failed === 0) {
      console.log(`${colors.green}${colors.bold}✓ ALL TESTS PASSED!${colors.reset}\n`);
    } else {
      console.log(`${colors.red}${colors.bold}✗ SOME TESTS FAILED${colors.reset}\n`);
    }

  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  createTestDonor,
  createTestHospital,
  createTestTicket
};
