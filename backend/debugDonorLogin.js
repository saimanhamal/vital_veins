const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Donor = require('./models/Donor');

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

const debugDonorLogin = async () => {
  try {
    await connectDB();
    
    const email = 'rahul.sharma@gmail.com';
    const password = 'donor123';
    
    console.log(`🔐 Debugging login for: ${email}`);
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.name}`);
    console.log(`📊 Role: ${user.role}`);
    console.log(`📊 Active: ${user.isActive}`);
    console.log(`📊 Verified: ${user.verified}`);
    console.log(`📊 Password hash: ${user.password}`);
    console.log(`📊 Password hash length: ${user.password.length}`);
    
    // Check password using bcrypt
    console.log(`🔍 Testing bcrypt comparison...`);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`🔐 Bcrypt result: ${isPasswordValid}`);
    
    // Check using the model method
    console.log(`🔍 Testing model method...`);
    const methodResult = await user.comparePassword(password);
    console.log(`🔐 Model method result: ${methodResult}`);
    
    // Check if donor profile exists
    if (user.role === 'donor') {
      const donor = await Donor.findOne({ user: user._id });
      console.log(`📊 Donor profile exists: ${donor ? 'Yes' : 'No'}`);
      if (donor) {
        console.log(`📊 Donor status: ${donor.status}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
};

debugDonorLogin();