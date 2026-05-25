const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Donor = require('./models/Donor');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const completeSeed = async () => {
  try {
    await connectDB();
    
    console.log('🚀 COMPLETING DATABASE SEEDING...\n');
    
    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@vitalveins.com' });
    if (!adminExists) {
      console.log('❌ Admin user not found. Please run fixPassword.js first.');
      process.exit(1);
    }
    console.log('✅ Admin user exists');
    
    // Create hospital users
    console.log('🏥 Creating hospital users...');
    const hospitalUserData = [
      {
        name: 'Kathmandu Medical College Teaching Hospital',
        email: 'admin@kmcth.edu.np',
        password: 'hospital123',
        phone: '+977-1-4418006',
        address: 'Sinamangal, Kathmandu',
        coordinates: [85.3390, 27.6896]
      },
      {
        name: 'Civil Hospital Kathmandu',
        email: 'info@civlhospital.gov.np',
        password: 'hospital123',
        phone: '+977-1-4118099',
        address: 'Thapathali, Kathmandu',
        coordinates: [85.3125, 27.6915]
      },
      {
        name: 'Tribhuvan University Teaching Hospital',
        email: 'contact@tuth.edu.np',
        password: 'hospital123',
        phone: '+977-1-4412303',
        address: 'Maharajgunj, Kathmandu',
        coordinates: [85.3265, 27.7204]
      },
      {
        name: 'Nepal Medical College Teaching Hospital',
        email: 'info@nmcth.edu.np',
        password: 'hospital123',
        phone: '+977-1-4903060',
        address: 'Jorpati, Kathmandu',
        coordinates: [85.3543, 27.7095]
      }
    ];
    
    // Clear existing hospital users and hospitals
    await User.deleteMany({ role: 'hospital' });
    await Hospital.deleteMany({});
    
    const hospitalUsers = [];
    for (const userData of hospitalUserData) {
      // Create hash directly to avoid pre-save hook issues
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user directly in database
      const userDoc = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: 'hospital',
        verified: true,
        phone: userData.phone,
        address: userData.address,
        location: {
          type: 'Point',
          coordinates: userData.coordinates
        },
        isActive: true
      });
      
      hospitalUsers.push(userDoc);
      console.log(`   ✅ Created ${userData.name}`);
    }
    
    // Create hospitals with inventory
    console.log('\n🏥 Creating hospitals with inventory...');
    const hospitalData = [
      {
        hospitalName: 'Kathmandu Medical College Teaching Hospital',
        license: 'KMCTH-KTM-001',
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Neurology', 'Emergency', 'Transplant']
      },
      {
        hospitalName: 'Civil Hospital Kathmandu',
        license: 'CHK-KTM-002',
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Oncology', 'Emergency']
      },
      {
        hospitalName: 'Tribhuvan University Teaching Hospital',
        license: 'TUTH-KTM-003',
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Neurology', 'Pediatrics']
      },
      {
        hospitalName: 'Nepal Medical College Teaching Hospital',
        license: 'NMCTH-KTM-004',
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Transplant', 'Emergency']
      }
    ];
    
    const hospitals = [];
    for (let i = 0; i < hospitalData.length; i++) {
      const hospital = new Hospital({
        user: hospitalUsers[i]._id,
        location: {
          type: 'Point',
          coordinates: hospitalUsers[i].location.coordinates
        },
        address: {
          street: hospitalUsers[i].address,
          city: 'Kathmandu',
          state: 'Bagmati',
          zipCode: '44600',
          country: 'Nepal'
        },
        contact: {
          phone: hospitalUsers[i].phone,
          email: hospitalUsers[i].email,
          website: `https://www.${hospitalData[i].hospitalName.toLowerCase().replace(/\s+/g, '')}.com`
        },
        capacity: {
          beds: 100 + (i * 50),
          icuBeds: 20 + (i * 10),
          operationRooms: 5 + (i * 5)
        },
        rating: { average: 4.0 + (i * 0.2), count: 100 + (i * 50) },
        ...hospitalData[i]
      });
      
      // Add working hours
      hospital.workingHours = {
        monday: { open: '06:00', close: '22:00', closed: false },
        tuesday: { open: '06:00', close: '22:00', closed: false },
        wednesday: { open: '06:00', close: '22:00', closed: false },
        thursday: { open: '06:00', close: '22:00', closed: false },
        friday: { open: '06:00', close: '22:00', closed: false },
        saturday: { open: '06:00', close: '22:00', closed: false },
        sunday: { open: '08:00', close: '20:00', closed: false }
      };
      
      await hospital.save();
      
      // Add inventory
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const organTypes = ['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Cornea'];
      
      hospital.inventory = { blood: [], organs: [] };
      
      // Add blood inventory
      bloodTypes.forEach(bloodType => {
        const quantity = Math.floor(Math.random() * 40) + 20; // 20-60 units
        hospital.inventory.blood.push({
          type: bloodType,
          quantity: quantity,
          lastUpdated: new Date()
        });
      });
      
      // Add organ inventory
      organTypes.forEach(organType => {
        const quantity = Math.floor(Math.random() * 5) + 2; // 2-7 units
        hospital.inventory.organs.push({
          type: organType,
          quantity: quantity,
          lastUpdated: new Date()
        });
      });
      
      await hospital.save();
      hospitals.push(hospital);
      
      const bloodCount = hospital.inventory.blood.reduce((sum, item) => sum + item.quantity, 0);
      console.log(`   ✅ Created ${hospital.hospitalName} with ${bloodCount} blood units`);
    }
    
    // Create donor users
    console.log('\n🩸 Creating donor users...');
    const donorUserData = [
      {
        name: 'Ramesh Gurung',
        email: 'ramesh.gurung@gmail.com',
        password: 'donor123',
        phone: '+977-9841234567',
        address: 'Thamel, Kathmandu',
        coordinates: [85.3205, 27.7172]
      },
      {
        name: 'Surajnaa Sharma',
        email: 'surajnaa.sharma@gmail.com',
        password: 'donor123',
        phone: '+977-9812345678',
        address: 'Boudha, Kathmandu',
        coordinates: [85.3572, 27.7212]
      },
      {
        name: 'Arjun Thapa',
        email: 'arjun.thapa@gmail.com',
        password: 'donor123',
        phone: '+977-9823456789',
        address: 'Patan Durbar Square, Lalitpur',
        coordinates: [85.3273, 27.6745]
      }
    ];
    
    // Clear existing donor users and donors
    await User.deleteMany({ role: 'donor' });
    await Donor.deleteMany({});
    
    const donorUsers = [];
    for (const userData of donorUserData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const userDoc = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: 'donor',
        verified: true,
        phone: userData.phone,
        address: userData.address,
        location: {
          type: 'Point',
          coordinates: userData.coordinates
        },
        isActive: true
      });
      
      donorUsers.push(userDoc);
      console.log(`   ✅ Created ${userData.name}`);
    }
    
    // Create donor profiles
    const donorProfileData = [
      {
        personalInfo: {
          firstName: 'Ramesh',
          lastName: 'Gurung',
          dateOfBirth: new Date('1990-05-15'),
          gender: 'Male',
          bloodType: 'O+',
          weight: 70,
          height: 175
        },
        status: 'active'
      },
      {
        personalInfo: {
          firstName: 'Surajnaa',
          lastName: 'Sharma',
          dateOfBirth: new Date('1992-08-22'),
          gender: 'Female',
          bloodType: 'A+',
          weight: 55,
          height: 160
        },
        status: 'active'
      },
      {
        personalInfo: {
          firstName: 'Arjun',
          lastName: 'Thapa',
          dateOfBirth: new Date('1988-12-03'),
          gender: 'Male',
          bloodType: 'B+',
          weight: 80,
          height: 180
        },
        status: 'active'
      }
    ];
    
    const donors = [];
    for (let i = 0; i < donorProfileData.length; i++) {
      const donor = new Donor({
        user: donorUsers[i]._id,
        location: {
          type: 'Point',
          coordinates: donorUsers[i].location.coordinates
        },
        contact: {
          phone: donorUsers[i].phone,
          emergencyContact: {
            name: 'Emergency Contact',
            phone: '+91-9999999999',
            relationship: 'Family'
          }
        },
        address: {
          street: donorUsers[i].address,
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        ...donorProfileData[i]
      });
      
      await donor.save();
      donors.push(donor);
      console.log(`   ✅ Created donor profile for ${donor.personalInfo.firstName}`);
    }
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION:');
    const totalUsers = await User.countDocuments();
    const totalHospitals = await Hospital.countDocuments();
    const totalDonors = await Donor.countDocuments();
    
    console.log(`👤 Total Users: ${totalUsers}`);
    console.log(`🏥 Total Hospitals: ${totalHospitals}`);
    console.log(`🩸 Total Donors: ${totalDonors}`);
    
    console.log('\n✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('Admin: admin@vitalveins.com / admin123');
    console.log('Hospital: admin@aiims.edu / hospital123');
    console.log('Donor: rahul.sharma@gmail.com / donor123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

completeSeed();
