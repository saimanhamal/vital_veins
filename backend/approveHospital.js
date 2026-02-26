const mongoose = require('mongoose');

async function approveHospital() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink');
    console.log('✅ Connected to MongoDB\n');

    const Hospital = require('./models/Hospital');
    const User = require('./models/User');

    // Find the hospital user
    const user = await User.findOne({ email: 'ok123@gmail.com' });
    if (!user) {
      console.log('❌ Hospital user not found');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found hospital user: ${user.email}\n`);

    // Check if hospital profile exists
    let hospital = await Hospital.findOne({ user: user._id });
    
    if (!hospital) {
      console.log('Creating hospital profile...');
      hospital = new Hospital({
        user: user._id,
        hospitalName: 'Test Hospital',
        license: 'LIC123456',
        address: {
          street: 'Hospital Street',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'India'
        },
        location: { type: 'Point', coordinates: [0, 0] },
        contact: { 
          phone: '9876543210',
          email: user.email 
        },
        status: 'pending'
      });
      await hospital.save();
      console.log('✅ Hospital profile created\n');
    }

    // Update to approved
    console.log('Approving hospital...');
    hospital.status = 'approved';
    await hospital.save();
    console.log('✅ Hospital status set to "approved"\n');

    // Verify
    const updated = await Hospital.findOne({ user: user._id });
    console.log('✅ Hospital approved successfully!');
    console.log(`   Name: ${updated.hospitalName}`);
    console.log(`   Status: ${updated.status}`);
    console.log(`   Email: ${updated.contact.email}\n`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

approveHospital();
