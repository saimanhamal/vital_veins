const User = require('../../models/User');
const Donor = require('../../models/Donor');
const Hospital = require('../../models/Hospital');

/**
 * Create a test user
 */
const createTestUser = async (overrides = {}) => {
  const defaultData = {
    name: 'Test User',
    email: `test${Date.now()}@test.com`,
    password: 'Password123',
    role: 'donor',
    verified: true,
    isActive: true,
    phone: '+1234567890',
  };

  const user = new User({ ...defaultData, ...overrides });
  await user.save();
  return user;
};

/**
 * Create a test donor
 */
const createTestDonor = async (user = null, overrides = {}) => {
  if (!user) {
    user = await createTestUser({ role: 'donor' });
  }

  const defaultData = {
    user: user._id,
    personalInfo: {
      firstName: 'Test',
      lastName: 'Donor',
      bloodType: 'O+',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      height: 175,
      weight: 70,
    },
    contact: {
      phone: '+1234567890',
      emergencyContact: {
        name: 'Emergency Contact',
        phone: '+0987654321',
        relationship: 'Spouse',
      },
    },
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country',
    },
    location: {
      type: 'Point',
      coordinates: [0, 0],
    },
    donationPreferences: {
      bloodDonation: {
        eligible: true,
        totalDonations: 0,
        lastDonationDate: null,
      },
      organDonation: {
        consent: false,
        organs: [],
      },
    },
    isActive: true,
  };

  const donor = new Donor({ ...defaultData, ...overrides });
  await donor.save();
  return donor;
};

/**
 * Create a test hospital
 */
const createTestHospital = async (user = null, overrides = {}) => {
  if (!user) {
    user = await createTestUser({ role: 'hospital' });
  }

  const defaultData = {
    user: user._id,
    hospitalName: 'Test Hospital',
    license: 'TEST-LICENSE-123',
    address: {
      street: '456 Hospital Rd',
      city: 'Hospital City',
      state: 'Test State',
      zipCode: '54321',
      country: 'Test Country',
    },
    location: {
      type: 'Point',
      coordinates: [0, 0],
    },
    contact: {
      phone: '+1122334455',
      email: user.email,
      emergencyLine: '+9988776655',
    },
    status: 'approved',
    isActive: true,
    inventory: {
      blood: [
        { type: 'A+', quantity: 10, lastUpdated: new Date() },
        { type: 'O+', quantity: 15, lastUpdated: new Date() },
      ],
      organs: [],
    },
  };

  const hospital = new Hospital({ ...defaultData, ...overrides });
  await hospital.save();
  return hospital;
};

/**
 * Create a test admin user
 */
const createTestAdmin = async (overrides = {}) => {
  return await createTestUser({
    role: 'admin',
    name: 'Admin User',
    email: `admin${Date.now()}@test.com`,
    verified: true,
    ...overrides,
  });
};

/**
 * Generate auth token for user
 */
const generateAuthToken = (user) => {
  return user.generateAuthToken();
};

module.exports = {
  createTestUser,
  createTestDonor,
  createTestHospital,
  createTestAdmin,
  generateAuthToken,
};
