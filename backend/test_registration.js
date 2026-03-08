const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path if needed
require('dotenv').config();

const runTest = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins';
    console.log(`Using MongoDB URI: ${uri}`);
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const testEmail = 'testuser_' + Date.now() + '@example.com';
    const testPassword = 'password123';

    console.log(`\n--- Steps to Reproduce Registration ---`);
    console.log(`1. Creating user with: Email=${testEmail}, Password=${testPassword}`);

    const newUser = new User({
        name: 'Test User',
        email: testEmail,
        password: testPassword,
        role: 'donor',
        verified: true
    });

    console.log('2. User object created. Password before save:', newUser.password);

    await newUser.save();
    console.log('3. User saved.');
    console.log('4. User object password after save (should be hashed):', newUser.password);

    // Fetch from DB to be sure
    const fetchedUser = await User.findOne({ email: testEmail }).select('+password');
    console.log('5. Fetched user from DB.');
    
    if (!fetchedUser) {
        console.error('❌ User NOT found in database!');
    } else {
        console.log('✅ User found in database.');
        console.log('   Email:', fetchedUser.email);
        console.log('   Password in DB:', fetchedUser.password);
        
        const isMatch = await bcrypt.compare(testPassword, fetchedUser.password);
        console.log(`6. Comparing '${testPassword}' with hash '${fetchedUser.password}'...`);
        console.log(`   Match result: ${isMatch}`);
        
        if (isMatch) {
            console.log('✅ Password authentication SUCCEEDED.');
        } else {
            console.error('❌ Password authentication FAILED.');
        }
    }

    // Cleanup
    // await User.deleteOne({ email: testEmail });
    // console.log('\nCleaned up test user.');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
