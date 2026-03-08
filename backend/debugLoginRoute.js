const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
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

const debugLoginRoute = async () => {
  try {
    await connectDB();
    
    const email = 'rahul.sharma@gmail.com';
    const password = 'donor123';
    
    console.log(`🔐 Simulating login route for: ${email}`);
    
    // This is exactly what happens in the login route
    console.log(`🔍 Finding user...`);
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.name} (Role: ${user.role})`);
    console.log(`📊 User active: ${user.isActive}, verified: ${user.verified}`);
    
    // Check if account is active
    if (!user.isActive) {
      console.log(`❌ Account inactive: ${email}`);
      process.exit(1);
    }
    
    // Check password using direct bcrypt comparison
    console.log(`🔍 Checking password for: ${email}`);
    console.log(`🔍 Password hash exists: ${user.password ? 'Yes' : 'No'}`);
    
    if (!user.password) {
      console.log(`❌ No password hash found for: ${email}`);
      process.exit(1);
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`🔐 Password valid: ${isPasswordValid} for ${email}`);
    
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${email}`);
      process.exit(1);
    }
    
    // For hospitals, check approval status
    if (user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: user._id });
      if (hospital && hospital.status !== 'approved') {
        console.log(`❌ Hospital not approved: ${email}`);
        process.exit(1);
      }
    }
    
    // For donors, ensure donor profile exists
    if (user.role === 'donor') {
      const donor = await Donor.findOne({ user: user._id });
      console.log(`📊 Donor profile check: ${donor ? 'Found' : 'Not found'}`);
      if (!donor) {
        console.log(`⚠️ No donor profile found for: ${email}`);
        // Create a basic donor profile if it doesn't exist
        const newDonor = new Donor({
          user: user._id,
          personalInfo: {
            firstName: user.name.split(' ')[0] || 'Unknown',
            lastName: user.name.split(' ')[1] || '',
            bloodType: 'Unknown'
          },
          status: 'active'
        });
        await newDonor.save();
        console.log(`✅ Created donor profile for: ${email}`);
      }
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = user.generateAuthToken();
    
    console.log(`✅ Login successful: ${email}`);
    console.log(`🔐 Token: ${token.substring(0, 20)}...`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
};

debugLoginRoute();