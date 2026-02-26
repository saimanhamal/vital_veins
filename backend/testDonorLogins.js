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

const testDonorLogins = async () => {
  try {
    await connectDB();
    
    console.log('🩸 TESTING ALL DONOR ACCOUNTS...\n');
    
    // All donor credentials
    const donorCredentials = [
      { email: 'rahul.sharma@gmail.com', password: 'donor123', name: 'Rahul Sharma' },
      { email: 'priya.singh@gmail.com', password: 'donor123', name: 'Priya Singh' },
      { email: 'amit.kumar@gmail.com', password: 'donor123', name: 'Amit Kumar' },
      { email: 'sneha.patel@gmail.com', password: 'donor123', name: 'Sneha Patel' },
      { email: 'vikash.gupta@gmail.com', password: 'donor123', name: 'Vikash Gupta' }
    ];
    
    for (const cred of donorCredentials) {
      console.log(`🧪 Testing: ${cred.name} (${cred.email})`);
      
      // Find user with password
      const user = await User.findOne({ email: cred.email }).select('+password');
      
      if (!user) {
        console.log(`   ❌ User not found in database`);
        continue;
      }
      
      console.log(`   📊 User found: ${user.name}`);
      console.log(`   📊 Role: ${user.role}`);
      console.log(`   📊 Active: ${user.isActive}`);
      console.log(`   📊 Verified: ${user.verified}`);
      console.log(`   📊 Password exists: ${user.password ? 'Yes' : 'No'}`);
      
      if (user.password) {
        // Test password
        const isValid = await bcrypt.compare(cred.password, user.password);
        console.log(`   🔐 Password test: ${isValid ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (!isValid) {
          console.log(`   🔧 Fixing password...`);
          const newHash = await bcrypt.hash(cred.password, 12);
          await User.updateOne({ email: cred.email }, { $set: { password: newHash } });
          
          // Test again
          const retestUser = await User.findOne({ email: cred.email }).select('+password');
          const retestValid = await bcrypt.compare(cred.password, retestUser.password);
          console.log(`   🔄 Retest: ${retestValid ? '✅ FIXED' : '❌ STILL BROKEN'}`);
        }
        
        // Test the comparePassword method
        const methodTest = await user.comparePassword(cred.password);
        console.log(`   🔧 Method test: ${methodTest ? '✅ WORKS' : '❌ BROKEN'}`);
      }
      
      console.log('');
    }
    
    // Test API login for each donor
    console.log('🌐 TESTING API LOGIN FOR DONORS...\n');
    
    const axios = require('axios');
    
    for (const cred of donorCredentials) {
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: cred.email,
          password: cred.password
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`✅ API Login Success: ${cred.name}`);
        console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
        console.log(`   User ID: ${response.data.user.id}`);
        
      } catch (error) {
        console.log(`❌ API Login Failed: ${cred.name}`);
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Message: ${error.response?.data?.message}`);
      }
      console.log('');
    }
    
    console.log('🎯 SUMMARY:');
    console.log('If API login works but frontend doesn\'t, it\'s a CORS/frontend issue.');
    console.log('If API login fails, it\'s a backend/database issue.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testDonorLogins();
