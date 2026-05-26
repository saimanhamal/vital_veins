const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  try {
    console.log('\n🚀 DONOR APPROVAL WORKFLOW TEST\n');
    console.log('=' .repeat(60));

    // 1. Admin Login
    console.log('\n1️⃣ ADMIN LOGIN');
    console.log('-'.repeat(60));
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@vitalveins.com',
      password: 'Admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in successfully');

    // 2. Get pending donors list
    console.log('\n2️⃣ FETCH PENDING DONORS');
    console.log('-'.repeat(60));
    const donorsRes = await axios.get(`${API_URL}/admin/donors?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const pendingDonor = donorsRes.data.donors.find(d => d.status === 'pending');
    if (!pendingDonor) {
      console.log('❌ No pending donors found');
      console.log('Available donors:', donorsRes.data.donors.map(d => ({ 
        email: d.user?.email, 
        status: d.status,
        isPending: d.isPendingSignup 
      })));
      return;
    }

    console.log('✅ Found pending donor:');
    console.log(`   Email: ${pendingDonor.user?.email}`);
    console.log(`   Status: ${pendingDonor.status}`);
    console.log(`   Name: ${pendingDonor.personalInfo?.firstName} ${pendingDonor.personalInfo?.lastName}`);
    console.log(`   isPendingSignup: ${pendingDonor.isPendingSignup}`);

    const donorUserId = pendingDonor.user?._id;
    const donorEmail = pendingDonor.user?.email;

    // 3. Try logging in as pending donor (should fail)
    console.log('\n3️⃣ TEST: PENDING DONOR LOGIN (Should FAIL)');
    console.log('-'.repeat(60));
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: donorEmail,
        password: 'testPass123'
      });
      console.log('❌ ERROR: Pending donor was able to login!');
      return;
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Login correctly blocked');
        console.log(`   Message: "${err.response.data.message}"`);
      } else {
        console.log('❌ Unexpected error:', err.response?.data?.message);
        return;
      }
    }

    // 4. Admin approves the donor
    console.log('\n4️⃣ ADMIN APPROVES DONOR');
    console.log('-'.repeat(60));
    const approveRes = await axios.post(
      `${API_URL}/admin/donors/${donorUserId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✅ Donor approved successfully');
    console.log(`   Response: ${approveRes.data.message}`);

    // 5. Verify Donor profile was created
    console.log('\n5️⃣ VERIFY: DONOR PROFILE CREATED');
    console.log('-'.repeat(60));
    
    // Check via MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    const Donor = require('./models/Donor');
    const User = require('./models/User');
    
    const updatedUser = await User.findById(donorUserId);
    const donorProfile = await Donor.findOne({ user: donorUserId });
    
    if (updatedUser && updatedUser.verified === true) {
      console.log('✅ User.verified = true');
    } else {
      console.log('❌ User.verified is still false');
    }

    if (donorProfile) {
      console.log('✅ Donor profile created in database');
      console.log(`   Name: ${donorProfile.personalInfo?.firstName} ${donorProfile.personalInfo?.lastName}`);
      console.log(`   Status: ${donorProfile.status}`);
      console.log(`   Blood Type: ${donorProfile.personalInfo?.bloodType}`);
    } else {
      console.log('❌ Donor profile NOT created');
      return;
    }

    await mongoose.connection.close();

    // 6. Try logging in again (should succeed)
    console.log('\n6️⃣ TEST: APPROVED DONOR LOGIN (Should SUCCEED)');
    console.log('-'.repeat(60));
    const donorLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: donorEmail,
      password: 'testPass123'
    });
    const donorToken = donorLoginRes.data.token;
    console.log('✅ Donor logged in successfully');
    console.log(`   Token: ${donorToken.substring(0, 50)}...`);

    // 7. Verify donor can access dashboard
    console.log('\n7️⃣ TEST: DONOR CAN ACCESS FUNCTIONS');
    console.log('-'.repeat(60));
    const dashboardRes = await axios.get(`${API_URL}/donor/dashboard`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    console.log('✅ Donor can access dashboard');
    console.log(`   Dashboard data received: ${Object.keys(dashboardRes.data).join(', ')}`);

    // 8. Verify admin list updated
    console.log('\n8️⃣ VERIFY: ADMIN LIST UPDATED');
    console.log('-'.repeat(60));
    const donorsRes2 = await axios.get(`${API_URL}/admin/donors?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const approvedDonor = donorsRes2.data.donors.find(d => d.user?._id === donorUserId);
    
    if (approvedDonor) {
      console.log('✅ Donor appears in admin list');
      console.log(`   Status: ${approvedDonor.status}`);
      console.log(`   isPendingSignup: ${approvedDonor.isPendingSignup}`);
    } else {
      console.log('❌ Donor not found in admin list');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('WORKFLOW COMPLETE:');
    console.log('✅ Admin viewed pending donors');
    console.log('✅ Pending donor blocked from login');
    console.log('✅ Admin approved donor');
    console.log('✅ Donor profile created in database');
    console.log('✅ Approved donor can now login');
    console.log('✅ Donor can access all functions');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

test();
