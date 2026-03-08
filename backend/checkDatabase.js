const mongoose = require('mongoose');
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Donor = require('./models/Donor');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check database contents
const checkDatabase = async () => {
  try {
    await connectDB();
    
    console.log('\n=== DATABASE STATUS CHECK ===\n');
    
    // Check Users
    const users = await User.find({});
    console.log(`👤 Users in database: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check Hospitals
    const hospitals = await Hospital.find({});
    console.log(`\n🏥 Hospitals in database: ${hospitals.length}`);
    hospitals.forEach(hospital => {
      console.log(`   - ${hospital.hospitalName} - Status: ${hospital.status}`);
      console.log(`     Blood Inventory: ${hospital.inventory?.blood?.length || 0} types`);
      console.log(`     Organ Inventory: ${hospital.inventory?.organs?.length || 0} types`);
      
      // Show some inventory details
      if (hospital.inventory?.blood?.length > 0) {
        const totalBlood = hospital.inventory.blood.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`     Total Blood Units: ${totalBlood}`);
      }
    });
    
    // Check Donors
    const donors = await Donor.find({});
    console.log(`\n🩸 Donors in database: ${donors.length}`);
    donors.forEach(donor => {
      console.log(`   - ${donor.personalInfo?.firstName} ${donor.personalInfo?.lastName} - Blood Type: ${donor.personalInfo?.bloodType} - Status: ${donor.status}`);
    });
    
    // Check specific admin user
    console.log('\n🔍 CHECKING ADMIN LOGIN:');
    const adminUser = await User.findOne({ email: 'admin@vitalveins.com' }).select('+password');
    if (adminUser) {
      console.log('✅ Admin user found in database');
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Verified: ${adminUser.verified}`);
      console.log(`   - Active: ${adminUser.isActive}`);
      
      // Test password
      const bcrypt = require('bcryptjs');
      if (adminUser.password) {
        const passwordMatch = await bcrypt.compare('admin123', adminUser.password);
        console.log(`   - Password Test: ${passwordMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
      } else {
        console.log('   - Password Test: ❌ PASSWORD NOT FOUND');
      }
    } else {
      console.log('❌ Admin user NOT found in database');
    }
    
    // Check hospital users
    console.log('\n🔍 CHECKING HOSPITAL USERS:');
    const hospitalUsers = await User.find({ role: 'hospital' });
    hospitalUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Verified: ${user.verified}`);
    });
    
    // Check if hospitals are linked to users
    console.log('\n🔍 CHECKING HOSPITAL-USER LINKS:');
    for (const hospital of hospitals) {
      const linkedUser = await User.findById(hospital.user);
      if (linkedUser) {
        console.log(`   - ${hospital.hospitalName} → ${linkedUser.email} ✅`);
      } else {
        console.log(`   - ${hospital.hospitalName} → NO USER LINKED ❌`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error);
    process.exit(1);
  }
};

// Run the check
checkDatabase();
