const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminAccount() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@vital.com' });
    if (existingAdmin) {
      console.log('❌ Admin account already exists!');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@vital.com',
      password: 'Admin123',
      role: 'admin',
      isActive: true,
      verified: true
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@vital.com');
    console.log('🔐 Password: Admin123');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    process.exit(1);
  }
}

createAdminAccount();
