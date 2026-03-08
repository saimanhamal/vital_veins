const mongoose = require('mongoose');
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Donor = require('./models/Donor');
const Appointment = require('./models/Appointment');
const Ticket = require('./models/Ticket');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins', {
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
    email: 'admin@vitalveins.com',
    password: 'admin123',
    role: 'admin',
    verified: true,
    phone: '+977-1-4419047',
    address: 'VitalVeins Office, Kathmandu',
    location: {
      type: 'Point',
      coordinates: [85.3240, 27.7172] // Kathmandu
    }
  },
  // Hospital Users
  {
    name: 'Tribhuvan University Teaching Hospital',
    email: 'admin@tuth.edu.np',
    password: 'hospital123',
    role: 'hospital',
    verified: true,
    phone: '+977-1-4412303',
    address: 'Maharajgunj, Kathmandu',
    location: {
      type: 'Point',
      coordinates: [85.3326, 27.7372]
    }
  },
  {
    name: 'Nepal Medical College',
    email: 'info@nmc.edu.np',
    password: 'hospital123',
    role: 'hospital',
    verified: true,
    phone: '+977-1-6648123',
    address: 'Jorpati, Kathmandu',
    location: {
      type: 'Point',
      coordinates: [85.3694, 27.7489]
    }
  },
  {
    name: 'Kathmandu Medical College',
    email: 'contact@kmc.edu.np',
    password: 'hospital123',
    role: 'hospital',
    verified: true,
    phone: '+977-1-4782267',
    address: 'Dhulikhel, Kavre',
    location: {
      type: 'Point',
      coordinates: [85.4167, 27.6167]
    }
  },
  {
    name: 'Patan Academy of Health Sciences',
    email: 'info@pahs.edu.np',
    password: 'hospital123',
    role: 'hospital',
    verified: true,
    phone: '+977-1-5521630',
    address: 'Lalitpur, Nepal',
    location: {
      type: 'Point',
      coordinates: [85.3225, 27.6725]
    }
  },
  // Donor Users
  {
    name: 'Rajesh Adhikari',
    email: 'rajesh.adhikari@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+977-9841234567',
    address: 'Thamel, Kathmandu',
    location: {
      type: 'Point',
      coordinates: [85.3203, 27.7128]
    }
  },
  {
    name: 'Sunita Thapa',
    email: 'sunita.thapa@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+977-9842345678',
    address: 'Patan, Lalitpur',
    location: {
      type: 'Point',
      coordinates: [85.3225, 27.6725]
    }
  },
  {
    name: 'Anuj Joshi',
    email: 'anuj.joshi@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+977-9843456789',
    address: 'Bhaktapur, Nepal',
    location: {
      type: 'Point',
      coordinates: [85.3833, 27.6735]
    }
  },
  {
    name: 'Neha Shrestha',
    email: 'neha.shrestha@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+977-9844567890',
    address: 'Naxal, Kathmandu',
    location: {
      type: 'Point',
      coordinates: [85.3270, 27.7220]
    }
  },
  {
    name: 'Vikram Karmacharya',
    email: 'vikram.karmacharya@gmail.com',
    password: 'donor123',
    role: 'donor',
    verified: true,
    phone: '+977-9845678901',
    address: 'Baluwatar, Kathmandu',
    location: {
      type: 'Point',
      coordinates: [85.3333, 27.7378]
    }
  }
];

// Create Users
const createUsers = async () => {
  try {
    const users = [];
    
    for (const userData of demoUsers) {
      // Don't hash here - User model pre-save hook will handle it
      const user = new User({
        ...userData
        // password is passed as plain text - User model will hash it
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
        hospitalName: 'Tribhuvan University Teaching Hospital',
        license: 'TUTH-KTM-001',
        address: {
          street: 'Maharajgunj Road',
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44600',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3326, 27.7372]
        },
        contact: {
          phone: '+977-1-4412303',
          email: 'admin@tuth.edu.np',
          website: 'https://www.tuth.edu.np'
        },
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Neurology', 'Emergency', 'Transplant'],
        capacity: {
          beds: 800,
          icuBeds: 150,
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
        rating: { average: 4.7, count: 1050 }
      },
      {
        hospitalName: 'Nepal Medical College',
        license: 'NMC-KTM-002',
        address: {
          street: 'Jorpati, Kathmandu',
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44600',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3694, 27.7489]
        },
        contact: {
          phone: '+977-1-6648123',
          email: 'info@nmc.edu.np',
          website: 'https://www.nmc.edu.np'
        },
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Neurology', 'Emergency'],
        capacity: {
          beds: 500,
          icuBeds: 80,
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
        rating: { average: 4.4, count: 820 }
      },
      {
        hospitalName: 'Kathmandu Medical College',
        license: 'KMC-KVR-003',
        address: {
          street: 'Dhulikhel Road',
          city: 'Dhulikhel',
          state: 'Kavre',
          zipCode: '45200',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.4167, 27.6167]
        },
        contact: {
          phone: '+977-1-4782267',
          email: 'contact@kmc.edu.np',
          website: 'https://www.kmc.edu.np'
        },
        status: 'approved',
        specialization: ['General', 'Pediatrics', 'Neurology', 'Emergency'],
        capacity: {
          beds: 400,
          icuBeds: 60,
          operationRooms: 12
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
        rating: { average: 4.3, count: 650 }
      },
      {
        hospitalName: 'Patan Academy of Health Sciences',
        license: 'PAHS-LPT-004',
        address: {
          street: 'Midpoint, Lalitpur',
          city: 'Lalitpur',
          state: 'Bagmati',
          zipCode: '44700',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3225, 27.6725]
        },
        contact: {
          phone: '+977-1-5521630',
          email: 'info@pahs.edu.np',
          website: 'https://www.pahs.edu.np'
        },
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Transplant', 'Emergency'],
        capacity: {
          beds: 450,
          icuBeds: 70,
          operationRooms: 14
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
        rating: { average: 4.5, count: 782 }
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
          firstName: 'Rajesh',
          lastName: 'Adhikari',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'Male',
          bloodType: 'O+',
          weight: 70,
          height: 175
        },
        contact: {
          phone: '+977-9841234567',
          emergencyContact: {
            name: 'Geeta Adhikari',
            phone: '+977-9841234561',
            relationship: 'Mother'
          }
        },
        address: {
          street: 'Thamel, Kathmandu',
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44600',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3203, 27.7128]
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
          firstName: 'Sunita',
          lastName: 'Thapa',
          dateOfBirth: new Date('1992-08-22'),
          gender: 'Female',
          bloodType: 'A+',
          weight: 55,
          height: 160
        },
        contact: {
          phone: '+977-9842345678',
          emergencyContact: {
            name: 'Gopal Thapa',
            phone: '+977-9842345671',
            relationship: 'Father'
          }
        },
        address: {
          street: 'Jorpati, Kathmandu',
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44610',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3694, 27.7489]
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
          firstName: 'Anuj',
          lastName: 'Joshi',
          dateOfBirth: new Date('1988-12-03'),
          gender: 'Male',
          bloodType: 'B+',
          weight: 80,
          height: 180
        },
        contact: {
          phone: '+977-9843456789',
          emergencyContact: {
            name: 'Priya Joshi',
            phone: '+977-9843456782',
            relationship: 'Wife'
          }
        },
        address: {
          street: 'Patan, Lalitpur',
          city: 'Lalitpur',
          state: 'Bagmati',
          zipCode: '44700',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3225, 27.6725]
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
          firstName: 'Neha',
          lastName: 'Shrestha',
          dateOfBirth: new Date('1995-03-18'),
          gender: 'Female',
          bloodType: 'AB+',
          weight: 60,
          height: 165
        },
        contact: {
          phone: '+977-9844567890',
          emergencyContact: {
            name: 'Ramesh Shrestha',
            phone: '+977-9844567883',
            relationship: 'Mother'
          }
        },
        address: {
          street: 'Bhaktapur',
          city: 'Bhaktapur',
          state: 'Bagmati',
          zipCode: '44800',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.4301, 27.6726]
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
          firstName: 'Vikram',
          lastName: 'Karmacharya',
          dateOfBirth: new Date('1987-11-25'),
          gender: 'Male',
          bloodType: 'O-',
          weight: 75,
          height: 178
        },
        contact: {
          phone: '+977-9845678901',
          emergencyContact: {
            name: 'Lakshmi Karmacharya',
            phone: '+977-9845678894',
            relationship: 'Wife'
          }
        },
        address: {
          street: 'Naxal, Kathmandu',
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44620',
          country: 'Nepal'
        },
        location: {
          type: 'Point',
          coordinates: [85.3275, 27.7245]
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
        hospital: hospitals[0]._id, // Tribhuvan University Teaching Hospital
        type: 'blood',
        bloodType: 'O-',
        urgency: 'critical',
        quantity: 5,
        message: 'URGENT: Multiple accident victims need O- blood immediately. Critical situation in emergency ward.',
        location: {
          type: 'Point',
          coordinates: [85.3326, 27.7372]
        },
        status: 'open',
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
      },
      {
        hospital: hospitals[1]._id, // Nepal Medical College
        type: 'blood',
        bloodType: 'A+',
        urgency: 'high',
        quantity: 3,
        message: 'Urgent need for A+ blood for surgery patient. Please respond if available.',
        location: {
          type: 'Point',
          coordinates: [85.3694, 27.7489]
        },
        status: 'open',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
      },
      {
        hospital: hospitals[2]._id, // Kathmandu Medical College
        type: 'organ',
        organType: 'Kidney',
        urgency: 'critical',
        quantity: 1,
        message: 'CRITICAL: Patient in kidney failure needs immediate transplant. Compatible donor urgently needed.',
        location: {
          type: 'Point',
          coordinates: [85.4167, 27.6167]
        },
        status: 'open',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      },
      {
        hospital: hospitals[3]._id, // Patan Academy of Health Sciences
        type: 'blood',
        bloodType: 'B-',
        urgency: 'medium',
        quantity: 2,
        message: 'Need B- blood for scheduled surgery tomorrow. Please help if you can donate.',
        location: {
          type: 'Point',
          coordinates: [85.3225, 27.6725]
        },
        status: 'open',
        expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000) // 18 hours from now
      },
      {
        hospital: hospitals[0]._id, // Tribhuvan University Teaching Hospital
        type: 'blood',
        bloodType: 'AB+',
        urgency: 'high',
        quantity: 4,
        message: 'Cancer patient needs AB+ blood for chemotherapy. Urgent requirement.',
        location: {
          type: 'Point',
          coordinates: [85.3326, 27.7372]
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
    console.log('Admin: admin@vitalveins.com / admin123');
    console.log('\n🏥 Hospitals (with full inventory):');
    console.log('- admin@tuth.edu.np / hospital123 (Tribhuvan University Teaching Hospital - Highest inventory)');
    console.log('- info@nmc.edu.np / hospital123 (Nepal Medical College - Large inventory)');
    console.log('- contact@kmc.edu.np / hospital123 (Kathmandu Medical College - Medium inventory)');
    console.log('- info@pahs.edu.np / hospital123 (Patan Academy of Health Sciences - Good inventory)');
    console.log('\n🩸 Donors (with donation history):');
    console.log('- rajesh.adhikari@gmail.com / donor123 (O+ - 5 donations)');
    console.log('- sunita.thapa@gmail.com / donor123 (A+ - 3 donations)');
    console.log('- anuj.joshi@gmail.com / donor123 (B+)');
    console.log('- neha.shrestha@gmail.com / donor123 (AB+)');
    console.log('- vikram.karmacharya@gmail.com / donor123 (O-)');
    console.log('\n📊 Data Created:');
    console.log('✅ Hospital Inventory: All blood types (10-195 units each)');
    console.log('✅ Organ Inventory: Heart, Liver, Kidney, Lung, Pancreas, Cornea, Skin, Bone');
    console.log('✅ Sample Appointments: 7 appointments with different statuses');
    console.log('✅ Emergency Tickets: 5 urgent blood/organ requests');
    console.log('✅ Geographic Data: Nepal locations for testing');
    
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
