// Diagnostic script to check admin account status
// Run this in MongoDB shell or as a Node.js script

const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function checkAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vital_veins');

    console.log('🔍 Checking Admin Account Status...\n');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@vital.com' });

    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('Try creating admin with: npm run create-admin');
      return;
    }

    console.log('✅ Admin Found:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Verified: ${admin.verified}`);
    console.log(`   isActive: ${admin.isActive}`);
    console.log(`   Password Hash: ${admin.password ? '✓ Set' : '✗ Not Set'}`);
    console.log(`   Created: ${admin.createdAt}`);
    console.log(`   Last Login: ${admin.lastLogin || 'Never'}\n`);

    // Check if admin can be verified
    if (!admin.isActive) {
      console.log('⚠️  WARNING: Admin.isActive is FALSE');
      console.log('   This will block login. Setting to true...\n');
      admin.isActive = true;
      await admin.save();
      console.log('✅ Fixed: Admin.isActive set to true');
    }

    if (!admin.verified) {
      console.log('⚠️  WARNING: Admin.verified is FALSE');
      console.log('   This might block some features. Setting to true...\n');
      admin.verified = true;
      await admin.save();
      console.log('✅ Fixed: Admin.verified set to true');
    }

    console.log('\n✅ Admin account is ready to login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();
