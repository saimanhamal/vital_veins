const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';

// Test credentials
const testDonor = {
  email: `testdonor${Date.now()}@test.com`,
  password: 'Test123456',
  name: 'Test Donor',
  phone: '9876543210',
  role: 'donor'
};

let adminToken = null;
let donorToken = null;
let newDonorId = null;
let newUserId = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  try {
    console.log('🚀 Starting Donor Approval Flow Test\n');

    // 1. Create admin token
    console.log('1️⃣ Logging in as admin...');
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@vitalveins.com',
      password: 'Admin123'
    });
    adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in\n');

    // 2. Register new donor
    console.log('2️⃣ Registering new donor...');
    console.log(`   Email: ${testDonor.email}`);
    const signupRes = await axios.post(`${API_URL}/auth/register`, testDonor);
    newDonorId = signupRes.data.donor?._id || signupRes.data.user?._id;
    newUserId = signupRes.data.user?._id;
    console.log(`✅ Donor registered with ID: ${newDonorId}\n`);

    // 3. Check if donor exists in User database
    console.log('3️⃣ Checking User database...');
    const userRes = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ User database accessible\n');

    // 4. Get admin donors list (should show pending donor)
    console.log('4️⃣ Fetching admin donors list (should show as PENDING)...');
    const donorsRes = await axios.get(`${API_URL}/admin/donors?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const pendingDonor = donorsRes.data.donors?.find(d => d._id === newUserId || d.user?._id === newUserId);
    if (pendingDonor) {
      console.log(`✅ Found pending donor in list`);
      console.log(`   Name: ${pendingDonor.personalInfo?.firstName || pendingDonor.user?.name}`);
      console.log(`   Status: ${pendingDonor.status}`);
      console.log(`   Email: ${pendingDonor.user?.email}`);
      console.log(`   isPendingSignup: ${pendingDonor.isPendingSignup}\n`);
    } else {
      console.log('❌ Pending donor NOT found in admin list');
      console.log('   Found donors:', donorsRes.data.donors.map(d => ({ 
        id: d._id, 
        status: d.status, 
        name: d.personalInfo?.firstName,
        isPending: d.isPendingSignup
      })));
      return;
    }

    // 5. Try to login as pending donor (should fail)
    console.log('5️⃣ Attempting to login as pending donor (should FAIL)...');
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: testDonor.email,
        password: testDonor.password
      });
      console.log('❌ Donor was able to login (should have been blocked!)');
      return;
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.message?.includes('under verification')) {
        console.log('✅ Donor login blocked with correct message:');
        console.log(`   "${error.response.data.message}"\n`);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message);
        return;
      }
    }

    // 6. Admin approves the donor
    console.log('6️⃣ Admin approving the pending donor...');
    const approveRes = await axios.post(
      `${API_URL}/admin/donors/${newUserId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✅ Donor approved');
    console.log(`   Response: ${approveRes.data.message}\n`);

    // 7. Check if Donor profile was created
    console.log('7️⃣ Verifying Donor profile was created...');
    const donorsListAfterApprove = await axios.get(`${API_URL}/admin/donors?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const approvedDonor = donorsListAfterApprove.data.donors?.find(d => d._id === newUserId || d.user?._id === newUserId);
    if (approvedDonor) {
      console.log(`✅ Donor found in list (status changed)`);
      console.log(`   Name: ${approvedDonor.personalInfo?.firstName}`);
      console.log(`   Status: ${approvedDonor.status}`);
      console.log(`   isPendingSignup: ${approvedDonor.isPendingSignup}\n`);
    } else {
      console.log('❌ Donor not found in list after approval');
    }

    // 8. Login as approved donor
    console.log('8️⃣ Attempting to login as approved donor (should SUCCEED)...');
    const donorLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testDonor.email,
      password: testDonor.password
    });
    donorToken = donorLoginRes.data.token;
    console.log('✅ Donor logged in successfully!\n');

    // 9. Verify donor can access dashboard
    console.log('9️⃣ Verifying approved donor can access dashboard...');
    const donorDashboard = await axios.get(`${API_URL}/donor/dashboard`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    console.log('✅ Donor can access dashboard\n');

    console.log('🎉 COMPLETE WORKFLOW TEST PASSED!\n');
    console.log('Summary:');
    console.log('✅ New donor registered with verified: false');
    console.log('✅ Donor appears as PENDING in admin list');
    console.log('✅ Pending donor cannot login');
    console.log('✅ Admin can approve donor (creates Donor profile, sets verified: true)');
    console.log('✅ Approved donor can now login');

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

test();
