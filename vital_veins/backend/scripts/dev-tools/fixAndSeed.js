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

// Clear and recreate with proper error handling
const fixAndSeed = async () => {
  try {
    console.log('🔄 Starting database fix and seed...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await Donor.deleteMany({});
    
    // Create admin user first
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@vitalveins.com',
      password: adminPassword,
      role: 'admin',
      verified: true,
      phone: '+91-9876543210',
      address: 'Admin Office, Delhi',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139]
      },
      isActive: true
    });
    await adminUser.save();
    console.log('✅ Admin user created');
    
    // Test admin login immediately
    const testAdmin = await User.findOne({ email: 'admin@vitalveins.com' }).select('+password');
    const passwordTest = await bcrypt.compare('admin123', testAdmin.password);
    console.log(`🔐 Admin password test: ${passwordTest ? '✅ PASS' : '❌ FAIL'}`);
    
    // Create hospital users
    console.log('🏥 Creating hospital users...');
    const hospitalUsers = [];
    
    const hospitalUserData = [
      {
        name: 'AIIMS Delhi',
        email: 'admin@aiims.edu',
        password: 'hospital123',
        phone: '+91-11-26588500',
        address: 'Ansari Nagar, New Delhi',
        coordinates: [77.2090, 28.5672]
      },
      {
        name: 'Apollo Hospital',
        email: 'info@apollohospitals.com',
        password: 'hospital123',
        phone: '+91-11-71791000',
        address: 'Sarita Vihar, New Delhi',
        coordinates: [77.2773, 28.5245]
      },
      {
        name: 'Fortis Hospital',
        email: 'contact@fortishealthcare.com',
        password: 'hospital123',
        phone: '+91-11-42776222',
        address: 'Sector 62, Noida',
        coordinates: [77.3648, 28.6280]
      },
      {
        name: 'Max Hospital',
        email: 'info@maxhealthcare.com',
        password: 'hospital123',
        phone: '+91-11-26925801',
        address: 'Saket, New Delhi',
        coordinates: [77.2167, 28.5245]
      }
    ];
    
    for (const userData of hospitalUserData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
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
      await user.save();
      hospitalUsers.push(user);
    }
    console.log(`✅ Created ${hospitalUsers.length} hospital users`);
    
    // Create hospitals with inventory
    console.log('🏥 Creating hospitals with inventory...');
    const hospitalData = [
      {
        hospitalName: 'All India Institute of Medical Sciences (AIIMS)',
        license: 'AIIMS-DL-001',
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Neurology', 'Emergency', 'Transplant'],
        address: {
          street: 'Ansari Nagar East',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110029',
          country: 'India'
        },
        contact: {
          phone: '+91-11-26588500',
          email: 'admin@aiims.edu',
          website: 'https://www.aiims.edu'
        },
        capacity: {
          beds: 2500,
          icuBeds: 300,
          operationRooms: 50
        },
        rating: { average: 4.8, count: 1250 }
      },
      {
        hospitalName: 'Apollo Hospital Delhi',
        license: 'APL-DL-002',
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Oncology', 'Emergency'],
        address: {
          street: 'Mathura Road, Sarita Vihar',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110076',
          country: 'India'
        },
        contact: {
          phone: '+91-11-71791000',
          email: 'info@apollohospitals.com',
          website: 'https://www.apollohospitals.com'
        },
        capacity: {
          beds: 700,
          icuBeds: 100,
          operationRooms: 25
        },
        rating: { average: 4.5, count: 890 }
      },
      {
        hospitalName: 'Fortis Hospital Noida',
        license: 'FRT-UP-003',
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Neurology', 'Pediatrics'],
        address: {
          street: 'B-22, Sector 62',
          city: 'Noida',
          state: 'Uttar Pradesh',
          zipCode: '201301',
          country: 'India'
        },
        contact: {
          phone: '+91-11-42776222',
          email: 'contact@fortishealthcare.com',
          website: 'https://www.fortishealthcare.com'
        },
        capacity: {
          beds: 400,
          icuBeds: 60,
          operationRooms: 15
        },
        rating: { average: 4.3, count: 567 }
      },
      {
        hospitalName: 'Max Super Speciality Hospital',
        license: 'MAX-DL-004',
        status: 'approved',
        specialization: ['General', 'Cardiology', 'Transplant', 'Emergency'],
        address: {
          street: '1, 2, Press Enclave Road, Saket',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110017',
          country: 'India'
        },
        contact: {
          phone: '+91-11-26925801',
          email: 'info@maxhealthcare.com',
          website: 'https://www.maxhealthcare.in'
        },
        capacity: {
          beds: 500,
          icuBeds: 80,
          operationRooms: 20
        },
        rating: { average: 4.6, count: 723 }
      }
    ];
    
    const hospitals = [];
    for (let i = 0; i < hospitalData.length; i++) {
      // Create hospital
      const hospital = new Hospital({
        user: hospitalUsers[i]._id,
        location: {
          type: 'Point',
          coordinates: hospitalUsers[i].location.coordinates
        },
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
      
      // Now add inventory using the updateInventory method or direct manipulation
      const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const organTypes = ['Heart', 'Liver', 'Kidney', 'Lung', 'Pancreas', 'Cornea'];
      
      // Clear existing inventory
      hospital.inventory = { blood: [], organs: [] };
      
      // Add blood inventory
      bloodTypes.forEach(bloodType => {
        let quantity;
        if (['O+', 'A+', 'B+'].includes(bloodType)) {
          quantity = Math.floor(Math.random() * 40) + 30; // 30-70 units
        } else if (['O-', 'A-', 'B-'].includes(bloodType)) {
          quantity = Math.floor(Math.random() * 25) + 20; // 20-45 units
        } else {
          quantity = Math.floor(Math.random() * 20) + 15; // 15-35 units
        }
        
        hospital.inventory.blood.push({
          type: bloodType,
          quantity: quantity,
          lastUpdated: new Date()
        });
      });
      
      // Add organ inventory
      organTypes.forEach(organType => {
        let quantity;
        if (['Cornea'].includes(organType)) {
          quantity = Math.floor(Math.random() * 8) + 5; // 5-13 units
        } else if (['Kidney'].includes(organType)) {
          quantity = Math.floor(Math.random() * 4) + 3; // 3-7 units
        } else {
          quantity = Math.floor(Math.random() * 3) + 2; // 2-5 units
        }
        
        hospital.inventory.organs.push({
          type: organType,
          quantity: quantity,
          lastUpdated: new Date()
        });
      });
      
      await hospital.save();
      hospitals.push(hospital);
      
      console.log(`✅ Created ${hospital.hospitalName} with inventory`);
    }
    
    // Create donor users
    console.log('🩸 Creating donor users...');
    const donorUserData = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@gmail.com',
        password: 'donor123',
        phone: '+91-9876543211',
        address: 'Connaught Place, Delhi',
        coordinates: [77.2167, 28.6289]
      },
      {
        name: 'Priya Singh',
        email: 'priya.singh@gmail.com',
        password: 'donor123',
        phone: '+91-9876543212',
        address: 'Lajpat Nagar, Delhi',
        coordinates: [77.2436, 28.5677]
      },
      {
        name: 'Amit Kumar',
        email: 'amit.kumar@gmail.com',
        password: 'donor123',
        phone: '+91-9876543213',
        address: 'Karol Bagh, Delhi',
        coordinates: [77.1909, 28.6519]
      }
    ];
    
    const donorUsers = [];
    for (const userData of donorUserData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
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
      await user.save();
      donorUsers.push(user);
    }
    
    // Create donor profiles
    const donorProfileData = [
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
        ...donorProfileData[i]
      });
      await donor.save();
      donors.push(donor);
    }
    
    console.log(`✅ Created ${donors.length} donors`);
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION:');
    const finalUsers = await User.find({});
    const finalHospitals = await Hospital.find({});
    const finalDonors = await Donor.find({});
    
    console.log(`👤 Total Users: ${finalUsers.length}`);
    console.log(`🏥 Total Hospitals: ${finalHospitals.length}`);
    console.log(`🩸 Total Donors: ${finalDonors.length}`);
    
    // Check inventory
    for (const hospital of finalHospitals) {
      const bloodCount = hospital.inventory?.blood?.length || 0;
      const organCount = hospital.inventory?.organs?.length || 0;
      const totalBloodUnits = hospital.inventory?.blood?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      console.log(`🏥 ${hospital.hospitalName}: ${bloodCount} blood types, ${organCount} organ types, ${totalBloodUnits} total blood units`);
    }
    
    console.log('\n✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('\n🔑 LOGIN CREDENTIALS:');
    console.log('Admin: admin@vitalveins.com / admin123');
    console.log('Hospitals: admin@aiims.edu / hospital123 (and others)');
    console.log('Donors: rahul.sharma@gmail.com / donor123 (and others)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run the fix
fixAndSeed();
