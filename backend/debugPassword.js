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

const debugPassword = async () => {
  try {
    await connectDB();
    
    console.log('🔍 DEBUGGING PASSWORD ISSUE...\n');
    
    // Get the admin user
    const adminUser = await User.findOne({ email: 'admin@lifelink.com' }).select('+password');
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }
    
    console.log('👤 Admin User Details:');
    console.log(`   - Name: ${adminUser.name}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Password Hash: ${adminUser.password ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - Password Length: ${adminUser.password ? adminUser.password.length : 0}`);
    
    if (adminUser.password) {
      console.log('\n🔐 Testing Password Methods:');
      
      // Test with bcrypt directly
      const directTest = await bcrypt.compare('admin123', adminUser.password);
      console.log(`   - Direct bcrypt.compare: ${directTest ? '✅ PASS' : '❌ FAIL'}`);
      
      // Test with user method
      const methodTest = await adminUser.comparePassword('admin123');
      console.log(`   - User.comparePassword: ${methodTest ? '✅ PASS' : '❌ FAIL'}`);
      
      // Test wrong password
      const wrongTest = await adminUser.comparePassword('wrongpassword');
      console.log(`   - Wrong password test: ${wrongTest ? '❌ UNEXPECTED PASS' : '✅ CORRECTLY FAILED'}`);
      
      // Check if password looks like a hash
      const isHash = adminUser.password.startsWith('$2');
      console.log(`   - Password format: ${isHash ? '✅ Proper bcrypt hash' : '❌ Not a bcrypt hash'}`);
      
      if (!directTest) {
        console.log('\n🔧 ATTEMPTING TO FIX PASSWORD:');
        
        // Create a new hash
        const newHash = await bcrypt.hash('admin123', 12);
        console.log(`   - New hash created: ${newHash.substring(0, 20)}...`);
        
        // Test the new hash
        const newHashTest = await bcrypt.compare('admin123', newHash);
        console.log(`   - New hash test: ${newHashTest ? '✅ PASS' : '❌ FAIL'}`);
        
        if (newHashTest) {
          // Update the user with the new hash
          adminUser.password = newHash;
          await adminUser.save();
          console.log('   - ✅ Password updated in database');
          
          // Test again
          const finalTest = await adminUser.comparePassword('admin123');
          console.log(`   - Final test: ${finalTest ? '✅ PASS' : '❌ FAIL'}`);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
};

debugPassword();
