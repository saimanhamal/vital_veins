const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const Ticket = require('../models/Ticket');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Hospital.deleteMany({}),
      Donor.deleteMany({}),
      Ticket.deleteMany({}),
      Appointment.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Admin User
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@vitalveins.com',
      password: 'admin123',
      role: 'admin',
      verified: true,
      phone: '+977-1-4123456',
      address: 'Dilli Bazaar, Kathmandu, Nepal',
      location: {
        type: 'Point',
        coordinates: [85.3240, 27.7172] // Kathmandu, Nepal coordinates
      }
    });
    await adminUser.save();
    console.log('👑 Created admin user');

    // Create Hospital Users and Profiles
    const hospitalUsers = [
      {
        name: 'Dr. Ramesh Kumar',
        email: 'ramesh.kumar@tribhuvan-hospital.com.np',
        password: 'hospital123',
        phone: '+977-1-4123567',
        address: 'Maharajgunj, Kathmandu, Nepal'
      },
      {
        name: 'Dr. Priya Lama',
        email: 'priya.lama@manipal-pokhara.com.np',
        password: 'hospital123',
        phone: '+977-61-234567',
        address: 'Fulbari, Pokhara, Nepal'
      }
    ];

    const hospitals = [
      {
        hospitalName: 'Tribhuvan University Hospital',
        license: 'HOSP001',
        address: {
          street: 'Maharajgunj',
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44600',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3252, 27.7029]
        },
        contact: {
          phone: '+977-1-4123567',
          email: 'ramesh.kumar@tribhuvan-hospital.com.np',
          website: 'https://tribhuvan-hospital.com.np'
        },
        status: 'approved',
        specialization: ['General', 'Emergency', 'Cardiology'],
        capacity: {
          beds: 350,
          icuBeds: 30,
          operationRooms: 12
        },
        workingHours: {
          monday: { open: '06:00', close: '21:00', closed: false },
          tuesday: { open: '06:00', close: '21:00', closed: false },
          wednesday: { open: '06:00', close: '21:00', closed: false },
          thursday: { open: '06:00', close: '21:00', closed: false },
          friday: { open: '06:00', close: '21:00', closed: false },
          saturday: { open: '06:00', close: '18:00', closed: false },
          sunday: { open: '06:00', close: '18:00', closed: false }
        },
        inventory: {
          blood: [
            { type: 'A+', quantity: 25, lastUpdated: new Date() },
            { type: 'A-', quantity: 12, lastUpdated: new Date() },
            { type: 'B+', quantity: 20, lastUpdated: new Date() },
            { type: 'B-', quantity: 8, lastUpdated: new Date() },
            { type: 'AB+', quantity: 5, lastUpdated: new Date() },
            { type: 'AB-', quantity: 3, lastUpdated: new Date() },
            { type: 'O+', quantity: 30, lastUpdated: new Date() },
            { type: 'O-', quantity: 15, lastUpdated: new Date() }
          ],
          organs: [
            { type: 'Heart', quantity: 1, lastUpdated: new Date() },
            { type: 'Liver', quantity: 2, lastUpdated: new Date() },
            { type: 'Kidney', quantity: 4, lastUpdated: new Date() },
            { type: 'Lung', quantity: 1, lastUpdated: new Date() },
            { type: 'Cornea', quantity: 5, lastUpdated: new Date() }
          ]
        },
        rating: {
          average: 4.7,
          count: 280
        }
      },
      {
        hospitalName: 'Manipal Teaching Hospital Pokhara',
        license: 'HOSP002',
        address: {
          street: 'Fulbari',
          city: 'Pokhara',
          state: 'Gandaki',
          zipCode: '33700',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [83.9649, 28.2096]
        },
        contact: {
          phone: '+977-61-234567',
          email: 'priya.lama@manipal-pokhara.com.np',
          website: 'https://manipal-pokhara.com.np'
        },
        status: 'approved',
        specialization: ['General', 'Transplant', 'Neurology'],
        capacity: {
          beds: 250,
          icuBeds: 25,
          operationRooms: 10
        },
        workingHours: {
          monday: { open: '07:00', close: '21:00', closed: false },
          tuesday: { open: '07:00', close: '21:00', closed: false },
          wednesday: { open: '07:00', close: '21:00', closed: false },
          thursday: { open: '07:00', close: '21:00', closed: false },
          friday: { open: '07:00', close: '21:00', closed: false },
          saturday: { open: '08:00', close: '18:00', closed: false },
          sunday: { open: '08:00', close: '18:00', closed: false }
        },
        inventory: {
          blood: [
            { type: 'A+', quantity: 18, lastUpdated: new Date() },
            { type: 'A-', quantity: 10, lastUpdated: new Date() },
            { type: 'B+', quantity: 15, lastUpdated: new Date() },
            { type: 'B-', quantity: 7, lastUpdated: new Date() },
            { type: 'AB+', quantity: 4, lastUpdated: new Date() },
            { type: 'AB-', quantity: 2, lastUpdated: new Date() },
            { type: 'O+', quantity: 22, lastUpdated: new Date() },
            { type: 'O-', quantity: 12, lastUpdated: new Date() }
          ],
          organs: [
            { type: 'Heart', quantity: 1, lastUpdated: new Date() },
            { type: 'Liver', quantity: 1, lastUpdated: new Date() },
            { type: 'Kidney', quantity: 2, lastUpdated: new Date() },
            { type: 'Lung', quantity: 1, lastUpdated: new Date() },
            { type: 'Cornea', quantity: 3, lastUpdated: new Date() }
          ]
        },
        rating: {
          average: 4.4,
          count: 200
        }
      }
    ];

    const createdHospitals = [];
    for (let i = 0; i < hospitalUsers.length; i++) {
      const hospitalUser = new User({
        ...hospitalUsers[i],
        role: 'hospital',
        verified: true,
        location: {
          type: 'Point',
          coordinates: hospitals[i].location.coordinates
        }
      });
      await hospitalUser.save();

      const hospital = new Hospital({
        ...hospitals[i],
        user: hospitalUser._id
      });
      await hospital.save();
      createdHospitals.push(hospital);
      console.log(`🏥 Created hospital: ${hospital.hospitalName}`);
    }

    // Create Donor Users and Profiles
    const donorUsers = [
      {
        name: 'Rajesh Poudel',
        email: 'rajesh.poudel@email.com.np',
        password: 'donor123',
        phone: '+977-1-4456789',
        address: 'Thamel, Kathmandu, Nepal'
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com.np',
        password: 'donor123',
        phone: '+977-61-345678',
        address: 'Lakeside, Pokhara, Nepal'
      },
      {
        name: 'Arjun Thapa',
        email: 'arjun.thapa@email.com.np',
        password: 'donor123',
        phone: '+977-1-5123456',
        address: 'Lalitpur, Nepal'
      }
    ];

    const donors = [
      {
        personalInfo: {
          firstName: 'Rajesh',
          lastName: 'Poudel',
          dateOfBirth: new Date('1988-03-20'),
          gender: 'Male',
          bloodType: 'O+',
          weight: 72,
          height: 172
        },
        contact: {
          phone: '+977-1-4456789',
          emergencyContact: {
            name: 'Sunita Poudel',
            phone: '+977-1-4456790',
            relationship: 'Spouse'
          }
        },
        address: {
          street: 'Thamel',
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44600',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3265, 27.7195]
        },
        donationPreferences: {
          bloodDonation: {
            eligible: true,
            lastDonation: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            nextEligible: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            totalDonations: 8
          },
          organDonation: {
            consent: true,
            organs: [
              { type: 'Heart', consent: true },
              { type: 'Liver', consent: true },
              { type: 'Kidney', consent: true },
              { type: 'Cornea', consent: true }
            ]
          }
        },
        medicalHistory: {
          allergies: ['Aspirin'],
          medications: [],
          chronicConditions: [],
          recentSurgeries: [],
          lastMedicalCheckup: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        status: 'active'
      },
      {
        personalInfo: {
          firstName: 'Priya',
          lastName: 'Sharma',
          dateOfBirth: new Date('1990-07-15'),
          gender: 'Female',
          bloodType: 'A+',
          weight: 58,
          height: 160
        },
        contact: {
          phone: '+977-61-345678',
          emergencyContact: {
            name: 'Vikram Sharma',
            phone: '+977-61-345679',
            relationship: 'Brother'
          }
        },
        address: {
          street: 'Lakeside',
          city: 'Pokhara',
          state: 'Gandaki',
          zipCode: '33700',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [83.9754, 28.2120]
        },
        donationPreferences: {
          bloodDonation: {
            eligible: true,
            lastDonation: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
            nextEligible: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), // 11 days from now
            totalDonations: 5
          },
          organDonation: {
            consent: false,
            organs: []
          }
        },
        medicalHistory: {
          allergies: [],
          medications: ['Iron supplement'],
          chronicConditions: [],
          recentSurgeries: [],
          lastMedicalCheckup: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
        },
        status: 'active'
      },
      {
        personalInfo: {
          firstName: 'Arjun',
          lastName: 'Thapa',
          dateOfBirth: new Date('1995-11-08'),
          gender: 'Male',
          bloodType: 'B-',
          weight: 78,
          height: 178
        },
        contact: {
          phone: '+977-1-5123456',
          emergencyContact: {
            name: 'Devi Thapa',
            phone: '+977-1-5123457',
            relationship: 'Sister'
          }
        },
        address: {
          street: 'Mangalbazar',
          city: 'Lalitpur',
          state: 'Bagmati',
          zipCode: '44700',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3310, 27.6807]
        },
        donationPreferences: {
          bloodDonation: {
            eligible: true,
            lastDonation: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            nextEligible: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000), // 26 days from now
            totalDonations: 2
          },
          organDonation: {
            consent: true,
            organs: [
              { type: 'Kidney', consent: true },
              { type: 'Cornea', consent: true }
            ]
          }
        },
        medicalHistory: {
          allergies: [],
          medications: [],
          chronicConditions: [],
          recentSurgeries: [],
          lastMedicalCheckup: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        },
        status: 'active'
      }
    ];

    const createdDonors = [];
    for (let i = 0; i < donorUsers.length; i++) {
      const donorUser = new User({
        ...donorUsers[i],
        role: 'donor',
        verified: true,
        location: {
          type: 'Point',
          coordinates: donors[i].location.coordinates
        }
      });
      await donorUser.save();

      const donor = new Donor({
        ...donors[i],
        user: donorUser._id
      });
      await donor.save();
      createdDonors.push(donor);
      console.log(`🩸 Created donor: ${donor.fullName}`);
    }

    // Create sample tickets
    const tickets = [
      {
        hospital: createdHospitals[0]._id,
        type: 'blood',
        bloodType: 'O+',
        urgency: 'high',
        quantity: 2,
        message: 'Emergency surgery requiring O+ blood. Patient in critical condition.',
        patientInfo: {
          name: 'Patient A',
          age: 45,
          condition: 'Emergency Surgery',
          doctorName: 'Dr. Emergency',
          roomNumber: 'ICU-101'
        },
        location: createdHospitals[0].location,
        status: 'open'
      },
      {
        hospital: createdHospitals[1]._id,
        type: 'organ',
        organType: 'Kidney',
        urgency: 'critical',
        quantity: 1,
        message: 'Patient urgently needs kidney transplant. Blood type compatible donors needed.',
        patientInfo: {
          name: 'Patient B',
          age: 35,
          condition: 'Kidney Failure',
          doctorName: 'Dr. Transplant',
          roomNumber: 'ICU-205'
        },
        location: createdHospitals[1].location,
        status: 'open'
      }
    ];

    for (const ticketData of tickets) {
      const ticket = new Ticket(ticketData);
      await ticket.save();
      console.log(`🎫 Created ticket: ${ticket.ticketId}`);
    }

    // Create sample appointments
    const appointments = [
      {
        donor: createdDonors[0]._id,
        hospital: createdHospitals[0]._id,
        type: 'blood',
        bloodType: 'O+',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        scheduledTime: '10:00',
        duration: 60,
        status: 'confirmed'
      },
      {
        donor: createdDonors[1]._id,
        hospital: createdHospitals[1]._id,
        type: 'blood',
        bloodType: 'A+',
        scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        scheduledTime: '14:00',
        duration: 60,
        status: 'pending'
      }
    ];

    for (const appointmentData of appointments) {
      const appointment = new Appointment(appointmentData);
      await appointment.save();
      console.log(`📅 Created appointment: ${appointment.appointmentId}`);
    }

    // Create sample notifications
    const notifications = [
      {
        sender: adminUser._id,
        recipients: [
          { userId: createdHospitals[0].user, role: 'hospital' },
          { userId: createdHospitals[1].user, role: 'hospital' }
        ],
        type: 'system_announcement',
        title: 'Welcome to VitalVeins',
        message: 'Welcome to the VitalVeins platform! You can now start managing your donations and connecting with donors.',
        priority: 'medium',
        category: 'info'
      },
      {
        sender: adminUser._id,
        recipients: [
          { userId: createdDonors[0].user, role: 'donor' },
          { userId: createdDonors[1].user, role: 'donor' },
          { userId: createdDonors[2].user, role: 'donor' }
        ],
        type: 'system_announcement',
        title: 'Thank You for Joining',
        message: 'Thank you for joining VitalVeins! Your donations can save lives. Check out nearby hospitals and emergency requests.',
        priority: 'medium',
        category: 'info'
      }
    ];

    for (const notificationData of notifications) {
      const notification = await Notification.createNotification(notificationData);
      console.log(`🔔 Created notification: ${notification.notificationId}`);
    }

    console.log('✅ Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👑 Admin users: 1`);
    console.log(`🏥 Hospital users: ${createdHospitals.length}`);
    console.log(`🩸 Donor users: ${createdDonors.length}`);
    console.log(`🎫 Tickets: ${tickets.length}`);
    console.log(`📅 Appointments: ${appointments.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    
    console.log('\n🔑 Login Credentials (Nepal Localization):');
    console.log('Admin: admin@vitalveins.com / admin123');
    console.log('Hospital 1: ramesh.kumar@tribhuvan-hospital.com.np / hospital123');
    console.log('Hospital 2: priya.lama@manipal-pokhara.com.np / hospital123');
    console.log('Donor 1: rajesh.poudel@email.com.np / donor123 ✅ (Active - Can Login)');
    console.log('Donor 2: priya.sharma@email.com.np / donor123 ✅ (Active - Can Login)');
    console.log('Donor 3: arjun.thapa@email.com.np / donor123 ✅ (Active - Can Login)');
    console.log('\n📍 All locations are now Nepal-based:');
    console.log('   • Kathmandu, Lalitpur, Pokhara');
    console.log('   • Phone numbers: +977 country code');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
seedData();
