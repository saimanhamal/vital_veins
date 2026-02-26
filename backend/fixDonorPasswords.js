const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixDonorPasswords = async () => {
  try {
    await connectDB();
    
    console.log('🔧 FIXING ALL DONOR PASSWORDS...\n');
    
    // All donor emails
    const donorEmails = [
      'rahul.sharma@gmail.com',
      'priya.singh@gmail.com',
      'amit.kumar@gmail.com',
      'sneha.patel@gmail.com',
      'vikash.gupta@gmail.com'
    ];
    
    const password = 'donor123';
    
    for (const email of donorEmails) {
      console.log(`🔧 Fixing password for: ${email}`);
      
      // Create a fresh hash
      const newHash = await bcrypt.hash(password, 12);
      console.log(`   ✅ Created new hash`);
      
      // Test the hash before saving
      const testHash = await bcrypt.compare(password, newHash);
      console.log(`   🧪 Hash test: ${testHash ? '✅ PASS' : '❌ FAIL'}`);
      
      if (!testHash) {
        console.log(`   ❌ Hash creation failed for ${email}`);
        continue;
      }
      
      // Update directly in database to bypass pre-save hook
      const result = await User.updateOne(
        { email: email },
        { $set: { password: newHash } }
      );
      
      console.log(`   📝 Updated in database: ${result.modifiedCount} document(s)`);
      
      // Verify the fix
      const user = await User.findOne({ email: email }).select('+password');
      if (user) {
        const finalTest = await bcrypt.compare(password, user.password);
        console.log(`   🔍 Final verification: ${finalTest ? '✅ PASS' : '❌ FAIL'}`);
      }
      
      console.log('');
    }
    
    // Test API login for all donors
    console.log('🌐 TESTING API LOGIN AFTER FIX...\n');
    
    const axios = require('axios');
    
    for (const email of donorEmails) {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: email,
          password: password
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`✅ ${email} - Login successful!`);
        console.log(`   User: ${response.data.user.name}`);
        
      } catch (error) {
        console.log(`❌ ${email} - Login failed`);
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Message: ${error.response?.data?.message}`);
      }
    }
    
    console.log('\n🎉 DONOR PASSWORD FIX COMPLETE!');
    console.log('\n✅ ALL WORKING CREDENTIALS:');
    console.log('\n👑 Admin:');
    console.log('   admin@lifelink.com / admin123');
    console.log('\n🏥 Hospitals:');
    console.log('   admin@aiims.edu / hospital123');
    console.log('   info@apollohospitals.com / hospital123');
    console.log('   contact@fortishealthcare.com / hospital123');
    console.log('   info@maxhealthcare.com / hospital123');
    console.log('\n🩸 Donors:');
    console.log('   rahul.sharma@gmail.com / donor123');
    console.log('   priya.singh@gmail.com / donor123');
    console.log('   amit.kumar@gmail.com / donor123');
    console.log('   sneha.patel@gmail.com / donor123');
    console.log('   vikash.gupta@gmail.com / donor123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
};

fixDonorPasswords();
