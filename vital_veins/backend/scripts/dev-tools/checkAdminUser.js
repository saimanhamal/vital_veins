const mongoose = require('mongoose');
const User = require('./models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    console.log('✅ Connected to MongoDB\n');

    // Check if admin exists
    const admin = await User.findOne({ email: 'admin@vitalveins.com' });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('   Email:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   Verified:', admin.verified);
    } else {
      console.log('❌ Admin user NOT found');
      console.log('\n📝 Creating admin user...');
      
      const newAdmin = new User({
        name: 'Admin',
        email: 'admin@vitalveins.com',
        password: 'Admin123',
        role: 'admin',
        phone: '9000000000',
        verified: true
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully');
    }

    // Check all users
    const allUsers = await User.find({}, 'email role verified createdAt');
    console.log('\n📋 All users in database:');
    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.role}, verified: ${u.verified})`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdmin();
