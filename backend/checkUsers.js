const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    console.log('✅ Connected to MongoDB');
    
    const allUsers = await User.find({});
    console.log('\n📋 ALL USERS IN DATABASE:');
    allUsers.forEach((u, i) => {
      console.log(`  ${i+1}. ${u.name} (${u.email}) - Role: ${u.role}`);
    });
    
    console.log(`\n📊 Total users: ${allUsers.length}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkUsers();
