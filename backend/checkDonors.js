const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Donor = require('./models/Donor');

const checkDonors = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    console.log('✅ Connected to MongoDB');
    
    // Show all donors with their status
    const allDonors = await Donor.find({}).populate('user', 'name email role');
    console.log('\n📋 ALL DONORS IN DATABASE:');
    allDonors.forEach((d, i) => {
      console.log(`  ${i+1}. ${d.user?.name} (${d.user?.email}) - Status: ${d.status} - isActive: ${d.isActive}`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total: ${allDonors.length}`);
    console.log(`  Pending: ${allDonors.filter(d => d.status === 'pending').length}`);
    console.log(`  Active: ${allDonors.filter(d => d.status === 'active').length}`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkDonors();
