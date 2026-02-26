const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const testFullFlow = async () => {
  try {
    console.log('🧪 Testing Complete Flow...\n');
    
    // 1. Register a new donor
    console.log('1️⃣ Signing up new donor...');
    const donorEmail = `donor${Date.now()}@test.com`;
    const signupRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test Donor',
      email: donorEmail,
      password: 'Password123',
      role: 'donor',
      personalInfo: {
        firstName: 'Test',
        lastName: 'Donor',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        bloodType: 'O+',
        weight: 70,
        height: 180
      },
      contact: {
        phone: '+1234567890',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '+1234567890',
          relationship: 'Friend'
        }
      },
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001'
      }
    });
    
    if (signupRes.status === 201) {
      console.log('✅ Donor registered successfully');
      console.log('   Email:', donorEmail);
      console.log('   Message:', signupRes.data.message);
    }
    
    // 2. Check database for the donor
    console.log('\n2️⃣ Checking database...');
    await mongoose.connect(process.env.MONGODB_URI);
    const Donor = require('./models/Donor');
    const allDonors = await Donor.find({}).populate('user', 'name email');
    console.log(`✅ Found ${allDonors.length} donors in database`);
    allDonors.forEach((d, i) => {
      console.log(`   ${i+1}. ${d.personalInfo?.firstName} - Status: ${d.status}`);
    });
    await mongoose.connection.close();
    
    // 3. Admin login and check donors list
    console.log('\n3️⃣ Admin login and checking donors list...');
    const adminLoginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@lifelink.com',
      password: 'Admin123'
    });
    const adminToken = adminLoginRes.data.token;
    console.log('✅ Admin logged in');
    
    // 4. Get donors list from admin API
    console.log('\n4️⃣ Fetching donors from admin API...');
    const donorsRes = await axios.get('http://localhost:5000/api/admin/donors', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`✅ API returned ${donorsRes.data.pagination.total} donors`);
    donorsRes.data.donors.forEach((d, i) => {
      console.log(`   ${i+1}. ${d.personalInfo?.firstName} ${d.personalInfo?.lastName} - Status: ${d.status}`);
    });
    
    // 5. Try to login as the new donor (should fail with pending message)
    console.log('\n5️⃣ Testing login for pending donor...');
    try {
      const donorLoginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: donorEmail,
        password: 'Password123'
      });
      console.log('❌ UNEXPECTED: Pending donor was able to login!');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Pending donor blocked from login');
        console.log('   Message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
      }
    }
    
    console.log('\n✅ Full flow test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
};

testFullFlow();
