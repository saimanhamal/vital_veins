const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Donor = require('./models/Donor');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifelink');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const addMissingUsers = async () => {
  try {
    await connectDB();
    
    console.log('👥 Adding missing donor users...\n');
    
    // Missing donor users
    const missingDonors = [
      {
        name: 'Sneha Patel',
        email: 'sneha.patel@gmail.com',
        password: 'donor123',
        phone: '+91-9876543214',
        address: 'Rajouri Garden, Delhi',
        coordinates: [77.1025, 28.6519],
        personalInfo: {
          firstName: 'Sneha',
          lastName: 'Patel',
          dateOfBirth: new Date('1995-03-12'),
          gender: 'Female',
          bloodType: 'AB+',
          weight: 58,
          height: 165
        }
      },
      {
        name: 'Vikash Gupta',
        email: 'vikash.gupta@gmail.com',
        password: 'donor123',
        phone: '+91-9876543215',
        address: 'Dwarka, Delhi',
        coordinates: [77.0469, 28.5921],
        personalInfo: {
          firstName: 'Vikash',
          lastName: 'Gupta',
          dateOfBirth: new Date('1987-11-25'),
          gender: 'Male',
          bloodType: 'O-',
          weight: 75,
          height: 178
        }
      }
    ];
    
    for (const donorData of missingDonors) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: donorData.email });
      if (existingUser) {
        console.log(`⚠️ User ${donorData.email} already exists, skipping...`);
        continue;
      }
      
      // Create user
      const hashedPassword = await bcrypt.hash(donorData.password, 12);
      const user = await User.create({
        name: donorData.name,
        email: donorData.email,
        password: hashedPassword,
        role: 'donor',
        verified: true,
        phone: donorData.phone,
        address: donorData.address,
        location: {
          type: 'Point',
          coordinates: donorData.coordinates
        },
        isActive: true
      });
      
      console.log(`✅ Created user: ${donorData.name} (${donorData.email})`);
      
      // Create donor profile
      const donor = new Donor({
        user: user._id,
        location: {
          type: 'Point',
          coordinates: donorData.coordinates
        },
        personalInfo: donorData.personalInfo,
        contact: {
          phone: donorData.phone,
          emergencyContact: {
            name: 'Emergency Contact',
            phone: '+91-9999999999',
            relationship: 'Family'
          }
        },
        address: {
          street: donorData.address,
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        status: 'active'
      });
      
      await donor.save();
      console.log(`✅ Created donor profile for: ${donorData.personalInfo.firstName}`);
    }
    
    // Verify all users now exist
    console.log('\n🔍 VERIFICATION - All Users:');
    const allUsers = await User.find({}).select('name email role');
    allUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n✅ All missing users have been added!');
    console.log('\n🔑 COMPLETE CREDENTIALS LIST:');
    console.log('\n👑 Admin Account:');
    console.log('   Email: admin@lifelink.com');
    console.log('   Password: admin123');
    
    console.log('\n🏥 Hospital Accounts:');
    console.log('   AIIMS: admin@aiims.edu / hospital123');
    console.log('   Apollo: info@apollohospitals.com / hospital123');
    console.log('   Fortis: contact@fortishealthcare.com / hospital123');
    console.log('   Max: info@maxhealthcare.com / hospital123');
    
    console.log('\n🩸 Donor Accounts:');
    console.log('   Rahul: rahul.sharma@gmail.com / donor123');
    console.log('   Priya: priya.singh@gmail.com / donor123');
    console.log('   Amit: amit.kumar@gmail.com / donor123');
    console.log('   Sneha: sneha.patel@gmail.com / donor123');
    console.log('   Vikash: vikash.gupta@gmail.com / donor123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add users:', error);
    process.exit(1);
  }
};

addMissingUsers();
