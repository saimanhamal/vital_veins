const mongoose = require('mongoose');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
require('dotenv').config();

const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@vitalveins.com',
    password: 'Admin123',
    role: 'admin',
    verified: true,
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@cityhospital.com',
    password: 'Hospital123',
    role: 'hospital',
    verified: true,
    isActive: true,
    hospitalData: {
      hospitalName: 'City Hospital',
      license: `HOSP-${Date.now()}`,
      address: {
        street: '123 Medical Center Drive',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128] // NYC coordinates
      },
      contact: {
        phone: '+1-555-0100',
        email: 'sarah.johnson@cityhospital.com',
        emergencyLine: '+1-555-0911'
      },
      status: 'approved',
      capacity: 500,
      specializations: ['Emergency Care', 'Blood Bank', 'Organ Transplant'],
      facilities: {
        emergencyRoom: true,
        icu: true,
        bloodBank: true,
        organTransplant: true
      }
    }
  },
  {
    name: 'John Smith',
    email: 'john.smith@email.com',
    password: 'Donor123',
    role: 'donor',
    verified: true,
    isActive: true,
    donorData: {
      personalInfo: {
        firstName: 'John',
        lastName: 'Smith',
        bloodType: 'O+',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'Male',
        height: 175,
        weight: 75
      },
      contact: {
        phone: '+1-555-0200',
        emergencyContact: {
          name: 'Jane Smith',
          phone: '+1-555-0201',
          relationship: 'Spouse'
        }
      },
      address: {
        street: '456 Donor Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10002',
        country: 'USA'
      },
      location: {
        type: 'Point',
        coordinates: [-74.003, 40.7150]
      },
      medicalHistory: {
        conditions: [],
        allergies: [],
        medications: [],
        surgeries: [],
        lastCheckup: new Date()
      },
      donationPreferences: {
        bloodDonation: {
          eligible: true,
          totalDonations: 5,
          lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) // 120 days ago
        },
        organDonation: {
          consent: true,
          organs: [
            { type: 'Kidney', consent: true },
            { type: 'Liver', consent: true },
            { type: 'Heart', consent: false }
          ]
        }
      }
    }
  }
];

async function seedDemoUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    console.log('✅ Connected to MongoDB');

    // Clear existing demo users
    console.log('🗑️  Clearing existing demo users...');
    const demoEmails = demoUsers.map(u => u.email);
    const existingUsers = await User.find({ email: { $in: demoEmails } });
    const userIds = existingUsers.map(u => u._id);
    
    // Delete associated profiles
    await Hospital.deleteMany({ user: { $in: userIds } });
    await Donor.deleteMany({ user: { $in: userIds } });
    
    // Delete users
    await User.deleteMany({ email: { $in: demoEmails } });

    // Create demo users
    console.log('👥 Creating demo users...');
    
    for (const userData of demoUsers) {
      const { hospitalData, donorData, ...userFields } = userData;

      // Create user
      const user = new User(userFields);
      await user.save();
      console.log(`✅ Created user: ${user.email} (${user.role})`);

      // Create role-specific profile
      if (user.role === 'hospital' && hospitalData) {
        const hospital = new Hospital({
          user: user._id,
          ...hospitalData
        });
        await hospital.save();
        console.log(`   ✅ Created hospital profile for ${hospitalData.hospitalName}`);
      } else if (user.role === 'donor' && donorData) {
        const donor = new Donor({
          user: user._id,
          ...donorData
        });
        await donor.save();
        console.log(`   ✅ Created donor profile for ${user.name}`);
      }
    }

    console.log('\n🎉 Demo users seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:    admin@vitalveins.com / Admin123');
    console.log('Hospital: sarah.johnson@cityhospital.com / Hospital123');
    console.log('Donor:    john.smith@email.com / Donor123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo users:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDemoUsers();
