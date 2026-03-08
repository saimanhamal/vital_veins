const mongoose = require('mongoose');

async function checkHospitals() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    console.log('✅ Connected to MongoDB\n');

    const User = require('./models/User');
    const Hospital = require('./models/Hospital');

    // Check all hospital users
    const hospitalUsers = await User.find({ role: 'hospital' });
    console.log('📋 Hospital Users:');
    if (hospitalUsers.length === 0) {
      console.log('   No hospital users found\n');
    } else {
      for (const user of hospitalUsers) {
        const hospital = await Hospital.findOne({ user: user._id });
        console.log(`   Email: ${user.email}`);
        console.log(`   Status: ${hospital?.status || 'NO HOSPITAL PROFILE'}`);
        console.log(`   User verified: ${user.verified}`);
        console.log('');
      }
    }

    // Show all users
    const allUsers = await User.find({}, 'email role verified createdAt');
    console.log('📋 All Users:');
    allUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} (${u.role}, verified: ${u.verified})`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkHospitals();
