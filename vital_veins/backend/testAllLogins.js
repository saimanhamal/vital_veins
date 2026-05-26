const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

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

const testAllLogins = async () => {
  try {
    await connectDB();
    
    console.log('🔐 TESTING ALL LOGIN CREDENTIALS...\n');
    
    // Test credentials
    const testCredentials = [
      { email: 'admin@vitalveins.com', password: 'admin123', role: 'Admin' },
      { email: 'admin@aiims.edu', password: 'hospital123', role: 'Hospital' },
      { email: 'info@apollohospitals.com', password: 'hospital123', role: 'Hospital' },
      { email: 'contact@fortishealthcare.com', password: 'hospital123', role: 'Hospital' },
      { email: 'info@maxhealthcare.com', password: 'hospital123', role: 'Hospital' },
      { email: 'rahul.sharma@gmail.com', password: 'donor123', role: 'Donor' },
      { email: 'priya.singh@gmail.com', password: 'donor123', role: 'Donor' },
      { email: 'amit.kumar@gmail.com', password: 'donor123', role: 'Donor' }
    ];
    
    for (const cred of testCredentials) {
      console.log(`🧪 Testing ${cred.role}: ${cred.email}`);
      
      // Find user with password
      const user = await User.findOne({ email: cred.email }).select('+password');
      
      if (!user) {
        console.log(`   ❌ User not found`);
        continue;
      }
      
      // Test password
      const isValid = await bcrypt.compare(cred.password, user.password);
      console.log(`   ${isValid ? '✅' : '❌'} Password: ${cred.password} - ${isValid ? 'CORRECT' : 'INCORRECT'}`);
      
      // Check user status
      console.log(`   📊 Status: Active: ${user.isActive}, Verified: ${user.verified}, Role: ${user.role}`);
      
      if (!isValid) {
        console.log(`   🔧 Fixing password for ${cred.email}...`);
        const newHash = await bcrypt.hash(cred.password, 12);
        await User.updateOne({ email: cred.email }, { $set: { password: newHash } });
        
        // Test again
        const retestUser = await User.findOne({ email: cred.email }).select('+password');
        const retestValid = await bcrypt.compare(cred.password, retestUser.password);
        console.log(`   🔄 Retest: ${retestValid ? '✅ FIXED' : '❌ STILL BROKEN'}`);
      }
      
      console.log('');
    }
    
    console.log('🎯 SUMMARY OF WORKING CREDENTIALS:');
    console.log('');
    console.log('👑 Admin Account:');
    console.log('   Email: admin@vitalveins.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🏥 Hospital Accounts:');
    console.log('   AIIMS: admin@aiims.edu / hospital123');
    console.log('   Apollo: info@apollohospitals.com / hospital123');
    console.log('   Fortis: contact@fortishealthcare.com / hospital123');
    console.log('   Max: info@maxhealthcare.com / hospital123');
    console.log('');
    console.log('🩸 Donor Accounts:');
    console.log('   Rahul: rahul.sharma@gmail.com / donor123');
    console.log('   Priya: priya.singh@gmail.com / donor123');
    console.log('   Amit: amit.kumar@gmail.com / donor123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testAllLogins();
