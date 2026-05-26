const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Donor = require('./models/Donor');

const fixDonorStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all donors and their users
    const donors = await Donor.find({}).populate('user', 'name email verified');
    console.log(`\n📋 Found ${donors.length} donors`);
    
    // Check user verified status and update donor status
    let updated = 0;
    for (const donor of donors) {
      const user = await User.findById(donor.user);
      
      if (user && user.verified === false) {
        // User not verified, set donor to pending
        donor.status = 'pending';
        await donor.save();
        console.log(`✅ Updated ${donor.personalInfo?.firstName} to pending (user verified: ${user.verified})`);
        updated++;
      } else {
        // User verified, set donor to active
        donor.status = 'active';
        await donor.save();
        console.log(`✅ Updated ${donor.personalInfo?.firstName} to active (user verified: ${user.verified})`);
        updated++;
      }
    }
    
    console.log(`\n✅ Updated ${updated} donors`);
    
    // Show final status
    const finalDonors = await Donor.find({}).populate('user', 'name email');
    console.log('\n📊 Final donor statuses:');
    finalDonors.forEach((d, i) => {
      console.log(`  ${i+1}. ${d.personalInfo?.firstName} - Status: ${d.status}`);
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixDonorStatus();
