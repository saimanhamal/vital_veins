const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Donor = require('./models/Donor');
const Appointment = require('./models/Appointment');
const Ticket = require('./models/Ticket');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await Donor.deleteMany({});
    await Appointment.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

// Demo Users Data
const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@lifelink.com',
    password: 'admin123',
    role: 'admin',
    verified: true,
    phone: '+91-9876543210',
    address: 'Admin Office, Delhi',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139] // Delhi
    }
  },
  // Hospital Users
  {
    name: 'AIIMS Delhi',
    email: 'admin@aiims.edu',
    password: 'hospital123',
    role: 'hospital',
    verified: true,
    phone: '+91-11-26588500',
    address: 'Ansari Nagar, New Delhi',
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.5672]
    }
  },
  {
    name: 'Apollo Hospital',
    email: 'info@apollohospitals.com',
    password: 'hospital123',
    role: 'hospital',
    verified: true,
    phone: '+91-11-71791000',
    address: 'Sarita Vihar, New Delhi',
    location: {
      type: 'Point',
      coordinates: [77.2773, 28.5245]
    }
  },
  {
    name: 'Fortis Hospital',
    email: 'contact@fortishealthcare.com',
    password: 'hospital123',
    role: 'hospital',
    verified: true,
    phone: '+91-11-42776222',
    address: 'Sector 62, Noida',
    location: {
      type: 'Point',
      coordinates: [77.3648, 28.6280]
    }
  },
  {
    name: 'Max Hospital',
    email: 'info@maxhealthcare.com',
    password: 'hospital123',
    role: 'hospital',
    verified: true,
    phone: '+91-11-26925801',
    address: 'Saket, New Delhi',
    location: {
      type: 'Point',
      coordinates: [77.2167, 28.5245]
    }
  },
  // Donor Users
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+91-9876543211',
    address: 'Connaught Place, Delhi',
    location: {
      type: 'Point',
      coordinates: [77.2167, 28.6289]
    }
  },
  {
    name: 'Priya Singh',
    email: 'priya.singh@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+91-9876543212',
    address: 'Lajpat Nagar, Delhi',
    location: {
      type: 'Point',
      coordinates: [77.2436, 28.5677]
    }
  },
  {
    name: 'Amit Kumar',
    email: 'amit.kumar@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+91-9876543213',
    address: 'Karol Bagh, Delhi',
    location: {
      type: 'Point',
      coordinates: [77.1909, 28.6519]
    }
  },
  {
    name: 'Sneha Patel',
    email: 'sneha.patel@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+91-9876543214',
    address: 'Dwarka, Delhi',
    location: {
      type: 'Point',
      coordinates: [77.0469, 28.5921]
    }
  },
  {
    name: 'Vikash Gupta',
    email: 'vikash.gupta@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+91-9876543215',
    address: 'Rohini, Delhi',
    location: {
      type: 'Point',
      coordinates: [77.1025, 28.7041]
    }
  }
];

// Create Users
const createUsers = async () => {
  try {
    const users = [];
    
    for (const userData of demoUsers) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      users.push(user);
    }
    
    console.log(`Created ${users.length} users successfully`);
    return users;
  } catch (error) {
    console.error('Error creating users:', error);
    throw error;
  }
};

// Create Hospitals
const createHospitals = async (users) => {
  try {
    const hospitalUsers = users.filter(user => user.role === 'hospital');
    const hospitals = [];
    
    const hospitalData = [
      {
        hospitalName: 'All India Institute of Medical Sciences (AIIMS)',
        license: 'AIIMS-DL-001',
        address: {
          street: 'Ansari Nagar East',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110029',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.5672]
        },
        contact: {
          phone: '+91-11-26588500',
          email: 'admin@aiims.edu',
          website: 'https://www.aiims.edu'
        },
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Neurology', 'Emergency', 'Transplant'],
        capacity: {
          beds: 2500,
          icuBeds: 300,
          operationRooms: 50
        },
        workingHours: {
          monday: { open: '00:00', close: '23:59', closed: false },
          tuesday: { open: '00:00', close: '23:59', closed: false },
          wednesday: { open: '00:00', close: '23:59', closed: false },
          thursday: { open: '00:00', close: '23:59', closed: false },
          friday: { open: '00:00', close: '23:59', closed: false },
          saturday: { open: '00:00', close: '23:59', closed: false },
          sunday: { open: '00:00', close: '23:59', closed: false }
        },
        rating: { average: 4.8, count: 1250 }
      },
      {
        hospitalName: 'Apollo Hospital Delhi',
        license: 'APL-DL-002',
        address: {
          street: 'Mathura Road, Sarita Vihar',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110076',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.2773, 28.5245]
        },
        contact: {
          phone: '+91-11-71791000',
          email: 'info@apollohospitals.com',
          website: 'https://www.apollohospitals.com'
        },
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Oncology', 'Emergency'],
        capacity: {
          beds: 700,
          icuBeds: 100,
          operationRooms: 25
        },
        workingHours: {
          monday: { open: '06:00', close: '22:00', closed: false },
          tuesday: { open: '06:00', close: '22:00', closed: false },
          wednesday: { open: '06:00', close: '22:00', closed: false },
          thursday: { open: '06:00', close: '22:00', closed: false },
          friday: { open: '06:00', close: '22:00', closed: false },
          saturday: { open: '06:00', close: '22:00', closed: false },
          sunday: { open: '08:00', close: '20:00', closed: false }
        },
        rating: { average: 4.5, count: 890 }
      },
      {
        hospitalName: 'Fortis Hospital Noida',
        license: 'FRT-UP-003',
        address: {
          street: 'B-22, Sector 62',
          city: 'Noida',
          state: 'Uttar Pradesh',
          zipCode: '201301',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.3648, 28.6280]
        },
        contact: {
          phone: '+91-11-42776222',
          email: 'contact@fortishealthcare.com',
          website: 'https://www.fortishealthcare.com'
        },
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Neurology', 'Pediatrics'],
        capacity: {
          beds: 400,
          icuBeds: 60,
          operationRooms: 15
        },
        workingHours: {
          monday: { open: '06:00', close: '22:00', closed: false },
          tuesday: { open: '06:00', close: '22:00', closed: false },
          wednesday: { open: '06:00', close: '22:00', closed: false },
          thursday: { open: '06:00', close: '22:00', closed: false },
          friday: { open: '06:00', close: '22:00', closed: false },
          saturday: { open: '06:00', close: '22:00', closed: false },
          sunday: { open: '08:00', close: '20:00', closed: false }
        },
        rating: { average: 4.3, count: 567 }
      },
      {
        hospitalName: 'Max Super Speciality Hospital',
        license: 'MAX-DL-004',
        address: {
          street: '1, 2, Press Enclave Road, Saket',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110017',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.2167, 28.5245]
        },
        contact: {
          phone: '+91-11-26925801',
          email: 'info@maxhealthcare.com',
          website: 'https://www.maxhealthcare.in'
        },
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Transplant', 'Emergency'],
        capacity: {
          beds: 500,
          icuBeds: 80,
          operationRooms: 20
        },
        workingHours: {
          monday: { open: '00:00', close: '23:59', closed: false },
          tuesday: { open: '00:00', close: '23:59', closed: false },
          wednesday: { open: '00:00', close: '23:59', closed: false },
          thursday: { open: '00:00', close: '23:59', closed: false },
          friday: { open: '00:00', close: '23:59', closed: false },
          saturday: { open: '00:00', close: '23:59', closed: false },
          sunday: { open: '00:00', close: '23:59', closed: false }
        },
        rating: { average: 4.6, count: 723 }
      }
    ];
    
    for (let i = 0; i < hospitalData.length; i++) {
      const hospital = new Hospital({
        user: hospitalUsers[i]._id,
        ...hospitalData[i]
      });
      
      await hospital.save();
      hospitals.push(hospital);
    }
    
    console.log(`Created ${hospitals.length} hospitals successfully`);
    return hospitals;
  } catch (error) {
    console.error('Error creating hospitals:', error);
    throw error;
  }
};

// Add Inventory to Hospitals
const addInventoryToHospitals = async (hospitals) => {
  try {
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const organTypes = ['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Cornea', 'Skin', 'Bone'];
    
    for (let i = 0; i < hospitals.length; i++) {
      const hospital = hospitals[i];
      
      // Different inventory levels based on hospital size/type
      let bloodMultiplier = 1;
      let organMultiplier = 1;
      
      // AIIMS - Largest hospital, highest inventory
      if (i === 0) {
        bloodMultiplier = 3;
        organMultiplier = 2;
      }
      // Apollo - Large private hospital
      else if (i === 1) {
        bloodMultiplier = 2.5;
        organMultiplier = 1.8;
      }
      // Fortis - Medium hospital
      else if (i === 2) {
        bloodMultiplier = 2;
        organMultiplier = 1.5;
      }
      // Max - Good inventory
      else if (i === 3) {
        bloodMultiplier = 2.2;
        organMultiplier = 1.6;
      }
      
      // Add blood inventory - ensure minimum quantities
      hospital.inventory.blood = bloodTypes.map(type => {
        let baseQuantity;
        // Common blood types have higher quantities
        if (['O+', 'A+', 'B+'].includes(type)) {
          baseQuantity = Math.floor(Math.random() * 40) + 25; // 25-65 units
        } else if (['O-', 'A-', 'B-'].includes(type)) {
          baseQuantity = Math.floor(Math.random() * 25) + 15; // 15-40 units
        } else { // AB+, AB-
          baseQuantity = Math.floor(Math.random() * 20) + 10; // 10-30 units
        }
        
        return {
          type,
          quantity: Math.floor(baseQuantity * bloodMultiplier),
          lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
        };
      });
      
      // Add organ inventory - ensure some availability
      hospital.inventory.organs = organTypes.map(type => {
        let baseQuantity;
        // More common organs/tissues have higher availability
        if (['Cornea', 'Skin', 'Bone'].includes(type)) {
          baseQuantity = Math.floor(Math.random() * 8) + 3; // 3-11 units
        } else if (['Kidney'].includes(type)) {
          baseQuantity = Math.floor(Math.random() * 4) + 2; // 2-6 units
        } else if (['Liver', 'Lung'].includes(type)) {
          baseQuantity = Math.floor(Math.random() * 3) + 1; // 1-4 units
        } else { // Heart, Pancreas - rarest
          baseQuantity = Math.floor(Math.random() * 2) + 1; // 1-3 units
        }
        
        return {
          type,
          quantity: Math.floor(baseQuantity * organMultiplier),
          lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        };
      });
      
      await hospital.save();
    }
    
    console.log('Added comprehensive inventory to all hospitals successfully');
  } catch (error) {
    console.error('Error adding inventory:', error);
    throw error;
  }
};

// Create Donors
const createDonors = async (users) => {
  try {
    const donorUsers = users.filter(user => user.role === 'donor');
    const donors = [];
    
    const donorData = [
      {
        personalInfo: {
          firstName: 'Rahul',
          lastName: 'Sharma',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'Male',
          bloodType: 'O+',
          weight: 70,
          height: 175
        },
        contact: {
          phone: '+91-9876543211',
          emergencyContact: {
            name: 'Sunita Sharma',
            phone: '+91-9876543201',
            relationship: 'Mother'
          }
        },
        address: {
          street: 'Block A, Connaught Place',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.2167, 28.6289]
        },
        donationPreferences: {
          bloodDonation: {
            eligible: true
          },
          organDonation: {
            consent: true,
            organs: [
              { type: 'Heart', consent: true },
              { type: 'Liver', consent: true },
              { type: 'Kidney', consent: true }
            ]
          }
        },
        medicalHistory: {
          allergies: [],
          medications: [],
          chronicConditions: [],
          recentSurgeries: [],
          lastMedicalCheckup: new Date('2024-09-01')
        },
        status: 'active'
      },
      {
        personalInfo: {
          firstName: 'Priya',
          lastName: 'Singh',
          dateOfBirth: new Date('1992-08-22'),
          gender: 'Female',
          bloodType: 'A+',
          weight: 55,
          height: 160
        },
        contact: {
          phone: '+91-9876543212',
          emergencyContact: {
            name: 'Rajesh Singh',
            phone: '+91-9876543202',
            relationship: 'Father'
          }
        },
        address: {
          street: 'Lajpat Nagar IV',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110024',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.2436, 28.5677]
        },
        donationPreferences: {
          bloodDonation: {
            eligible: true
          },
          organDonation: {
            consent: false,
            organs: []
          }
        },
        medicalHistory: {
          }
        ],
        medicalHistory: {
          allergies: ['Penicillin'],
          medications: [],
          chronicConditions: [],
          recentSurgeries: [],
          lastMedicalCheckup: new Date('2024-08-20')
        },
        status: 'active'
      },
      {
        personalInfo: {
          firstName: 'Amit',
          lastName: 'Kumar',
          dateOfBirth: new Date('1988-12-03'),
          gender: 'Male',
          bloodType: 'B+',
          weight: 80,
          height: 180
        },
        contact: {
          phone: '+91-9876543213',
          emergencyContact: {
            name: 'Meera Kumar',
            phone: '+91-9876543203',
            relationship: 'Wife'
          }
        },
        address: {
          street: 'Karol Bagh Market',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110005',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.1909, 28.6519]
        },
        donationPreferences: {
          bloodDonation: {
            eligible: true
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
          medications: ['Multivitamin'],
          chronicConditions: [],
          recentSurgeries: [],
          lastMedicalCheckup: new Date('2024-09-15')
        },
        status: 'active'
      },
      {
        personalInfo: {
          firstName: 'Sneha',
          lastName: 'Patel',
          dateOfBirth: new Date('1995-03-18'),
          gender: 'Female',
          bloodType: 'AB+',
          weight: 60,
          height: 165
        },
        contact: {
          phone: '+91-9876543214',
          emergencyContact: {
            name: 'Kiran Patel',
            phone: '+91-9876543204',
            relationship: 'Mother'
          }
        },
        address: {
          street: 'Sector 12, Dwarka',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110078',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.0469, 28.5921]
        },
        donationPreferences: {
          bloodDonation: {
            eligible: true
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
          allergies: ['Dust', 'Pollen'],
          medications: ['Antihistamine'],
          chronicConditions: ['Mild Asthma'],
          recentSurgeries: [],
          lastMedicalCheckup: new Date('2024-10-01')
        },
        status: 'active'
      },
      {
        personalInfo: {
          firstName: 'Vikash',
          lastName: 'Gupta',
          dateOfBirth: new Date('1987-11-25'),
          gender: 'Male',
          bloodType: 'O-',
          weight: 75,
          height: 178
        },
        contact: {
          phone: '+91-9876543215',
          emergencyContact: {
            name: 'Pooja Gupta',
            phone: '+91-9876543205',
            relationship: 'Wife'
          }
        },
        address: {
          street: 'Sector 7, Rohini',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110085',
          country: 'India'
        },
        location: {
          type: 'Point',
          coordinates: [77.1025, 28.7041]
        },
        donationPreferences: {
          bloodDonation: {
            eligible: true
          },
          organDonation: {
            consent: true,
            organs: [
              { type: 'Heart', consent: true },
              { type: 'Liver', consent: true },
              { type: 'Kidney', consent: true },
              { type: 'Lung', consent: true },
              { type: 'Cornea', consent: true }
            ]
          }
        },
        medicalHistory: {
          allergies: [],
          medications: [],
          chronicConditions: [],
          recentSurgeries: [],
          lastMedicalCheckup: new Date('2024-09-25')
        },
        status: 'active'
      }
    ];
    
    for (let i = 0; i < donorData.length; i++) {
      const donor = new Donor({
        user: donorUsers[i]._id,
        ...donorData[i]
      });
      
      await donor.save();
      donors.push(donor);
    }
    
    console.log(`Created ${donors.length} donors successfully`);
    return donors;
  } catch (error) {
    console.error('Error creating donors:', error);
    throw error;
  }
};

// Create Sample Appointments
const createSampleAppointments = async (donors, hospitals) => {
  try {
    const appointments = [];
    const appointmentData = [
      {
        donor: donors[0]._id,
        hospital: hospitals[0]._id,
        type: 'blood',
        bloodType: 'O+',
        scheduledDate: new Date('2024-10-20'),
        scheduledTime: '10:00',
        status: 'confirmed',
        notes: { donor: 'Regular donation appointment' }
      },
      {
        donor: donors[1]._id,
        hospital: hospitals[1]._id,
        type: 'blood',
        bloodType: 'A+',
        scheduledDate: new Date('2024-10-22'),
        scheduledTime: '14:00',
        status: 'pending',
        notes: { donor: 'First time donor, please guide' }
      },
      {
        donor: donors[2]._id,
        hospital: hospitals[2]._id,
        type: 'blood',
        bloodType: 'B+',
        scheduledDate: new Date('2024-10-18'),
        scheduledTime: '09:30',
        status: 'completed',
        notes: { donor: 'Emergency donation', hospital: 'Donation completed successfully' }
      },
      {
        donor: donors[3]._id,
        hospital: hospitals[3]._id,
        type: 'blood',
        bloodType: 'AB+',
        scheduledDate: new Date('2024-10-25'),
        scheduledTime: '11:30',
        status: 'confirmed',
        notes: { donor: 'Universal plasma donor' }
      },
      {
        donor: donors[4]._id,
        hospital: hospitals[0]._id,
        type: 'blood',
        bloodType: 'O-',
        scheduledDate: new Date('2024-10-19'),
        scheduledTime: '15:00',
        status: 'completed',
        notes: { donor: 'Universal donor O-', hospital: 'High demand blood type - thank you!' }
      },
      {
        donor: donors[0]._id,
        hospital: hospitals[1]._id,
        type: 'organ',
        organType: 'Kidney',
        scheduledDate: new Date('2024-11-05'),
        scheduledTime: '08:00',
        status: 'pending',
        notes: { donor: 'Organ donation consultation' }
      },
      {
        donor: donors[2]._id,
        hospital: hospitals[2]._id,
        type: 'blood',
        bloodType: 'B+',
        scheduledDate: new Date('2024-10-15'),
        scheduledTime: '16:30',
        status: 'cancelled',
        notes: { donor: 'Unable to attend due to illness' }
      }
    ];
    
    for (const data of appointmentData) {
      const appointment = new Appointment(data);
      await appointment.save();
      appointments.push(appointment);
    }
    
    console.log(`Created ${appointments.length} sample appointments`);
    return appointments;
  } catch (error) {
    console.error('Error creating appointments:', error);
    throw error;
  }
};

// Create Emergency Tickets
const createEmergencyTickets = async (hospitals) => {
  try {
    const tickets = [];
    const ticketData = [
      {
        hospital: hospitals[0]._id, // AIIMS
        type: 'blood',
        bloodType: 'O-',
        urgency: 'critical',
        quantity: 5,
        message: 'URGENT: Multiple accident victims need O- blood immediately. Critical situation in emergency ward.',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.5672]
        },
        status: 'open',
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
      },
      {
        hospital: hospitals[1]._id, // Apollo
        type: 'blood',
        bloodType: 'A+',
        urgency: 'high',
        quantity: 3,
        message: 'Urgent need for A+ blood for surgery patient. Please respond if available.',
        location: {
          type: 'Point',
          coordinates: [77.2773, 28.5245]
        },
        status: 'open',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
      },
      {
        hospital: hospitals[2]._id, // Fortis
        type: 'organ',
        organType: 'Kidney',
        urgency: 'critical',
        quantity: 1,
        message: 'CRITICAL: Patient in kidney failure needs immediate transplant. Compatible donor urgently needed.',
        location: {
          type: 'Point',
          coordinates: [77.3648, 28.6280]
        },
        status: 'open',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      },
      {
        hospital: hospitals[3]._id, // Max
        type: 'blood',
        bloodType: 'B-',
        urgency: 'medium',
        quantity: 2,
        message: 'Need B- blood for scheduled surgery tomorrow. Please help if you can donate.',
        location: {
          type: 'Point',
          coordinates: [77.2167, 28.5245]
        },
        status: 'open',
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000) // 18 hours from now
      },
      {
        hospital: hospitals[0]._id, // AIIMS
        type: 'blood',
        bloodType: 'AB+',
        urgency: 'high',
        quantity: 4,
        message: 'Cancer patient needs AB+ blood for chemotherapy. Urgent requirement.',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.5672]
        },
        status: 'in_progress',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours from now
      }
    ];
    
    for (const data of ticketData) {
      const ticket = new Ticket(data);
      await ticket.save();
      tickets.push(ticket);
    }
    
    console.log(`Created ${tickets.length} emergency tickets`);
    return tickets;
  } catch (error) {
    console.error('Error creating emergency tickets:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    await connectDB();
    await clearDatabase();
    
    const users = await createUsers();
    const hospitals = await createHospitals(users);
    await addInventoryToHospitals(hospitals);
    const donors = await createDonors(users);
    await createSampleAppointments(donors, hospitals);
    await createEmergencyTickets(hospitals);
    
    console.log('\n=== Database Seeding Completed Successfully! ===');
    console.log('\n🎯 COMPREHENSIVE DEMO DATA CREATED:');
    console.log('\n👤 Demo Accounts:');
    console.log('Admin: admin@lifelink.com / admin123');
    console.log('\n🏥 Hospitals (with full inventory):');
    console.log('- admin@aiims.edu / hospital123 (AIIMS - Highest inventory)');
    console.log('- info@apollohospitals.com / hospital123 (Apollo - Large inventory)');
    console.log('- contact@fortishealthcare.com / hospital123 (Fortis - Medium inventory)');
    console.log('- info@maxhealthcare.com / hospital123 (Max - Good inventory)');
    console.log('\n🩸 Donors (with donation history):');
    console.log('- rahul.sharma@gmail.com / donor123 (O+ - 5 donations)');
    console.log('- priya.singh@gmail.com / donor123 (A+ - 3 donations)');
    console.log('- amit.kumar@gmail.com / donor123 (B+)');
    console.log('- sneha.patel@gmail.com / donor123 (AB+)');
    console.log('- vikash.gupta@gmail.com / donor123 (O-)');
    console.log('\n📊 Data Created:');
    console.log('✅ Hospital Inventory: All blood types (10-195 units each)');
    console.log('✅ Organ Inventory: Heart, Liver, Kidney, Lung, Pancreas, Cornea, Skin, Bone');
    console.log('✅ Sample Appointments: 7 appointments with different statuses');
    console.log('✅ Emergency Tickets: 5 urgent blood/organ requests');
    console.log('✅ Geographic Data: Delhi NCR locations for testing');
    
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
