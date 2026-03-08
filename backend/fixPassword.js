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

const fixPassword = async () => {
  try {
    await connectDB();
    
    console.log('🔧 FIXING ADMIN PASSWORD...\n');
    
    // Create a new hash for admin123
    const correctHash = await bcrypt.hash('admin123', 12);
    console.log('✅ Created new password hash');
    
    // Test the hash before saving
    const testHash = await bcrypt.compare('admin123', correctHash);
    console.log(`🔐 Hash test: ${testHash ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!testHash) {
      console.log('❌ Hash creation failed');
      process.exit(1);
    }
    
    // Update directly in database to bypass pre-save hook
    const result = await User.updateOne(
      { email: 'admin@vitalveins.com' },
      { $set: { password: correctHash } }
    );
    
    console.log(`✅ Password updated directly in database (${result.modifiedCount} document(s) modified)`);
    
    // Verify the fix
    const adminUser = await User.findOne({ email: 'admin@vitalveins.com' }).select('+password');
    if (adminUser) {
      const finalTest = await bcrypt.compare('admin123', adminUser.password);
      console.log(`🔐 Final verification: ${finalTest ? '✅ PASS' : '❌ FAIL'}`);
      
      if (finalTest) {
        console.log('\n🎉 SUCCESS! Admin password is now working.');
        console.log('You can now login with:');
        console.log('   Email: admin@vitalveins.com');
        console.log('   Password: admin123');
      } else {
        console.log('\n❌ Password fix failed');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
};

fixPassword();
