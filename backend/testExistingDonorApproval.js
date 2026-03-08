const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'http://localhost:5000/api';
const testEmail = 'kk123@gmail.com';
const testPassword = 'testPass123';

let adminToken = null;
let donorUserId = null;

async function test() {
  try {
    console.log('🚀 Testing with EXISTING pending donor\n');

    // 1. Get admin token
    console.log('1️⃣ Admin login...');
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@vitalveins.com',
      password: 'Admin123'
    });
    adminToken = adminRes.data.token;
    console.log('✅ Admin logged in\n');

    // 2. Get donor list (pending)
    console.log('2️⃣ Fetching admin donors list...');
    const donorsRes = await axios.get(`${API_URL}/admin/donors?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ Found ${donorsRes.data.donors.length} donors`);
    const pendingDonor = donorsRes.data.donors.find(d => d.status === 'pending');
    
    if (!pendingDonor) {
      console.log('❌ No pending donors found');
      console.log('Donors:', donorsRes.data.donors.map(d => ({ name: d.personalInfo?.firstName, status: d.status, isPending: d.isPendingSignup })));
      return;
    }

    console.log(`   Found pending donor: ${pendingDonor.user?.email}`);
    console.log(`   Status: ${pendingDonor.status}`);
    console.log(`   isPendingSignup: ${pendingDonor.isPendingSignup}\n`);
    
    donorUserId = pendingDonor.user?._id;

    // 3. Try to login as pending donor
    console.log('3️⃣ Attempting to login as pending donor (should fail)...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('❌ Pending donor was able to login!\n');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Login blocked:', err.response.data.message, '\n');
      } else {
        console.log('❌ Unexpected error:', err.response?.data?.message, '\n');
      }
    }

    // 4. Admin approves the donor
    console.log('4️⃣ Admin approving pending donor...');
    const approveRes = await axios.post(
      `${API_URL}/admin/donors/${donorUserId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✅ Donor approved');
    console.log(`   Response: ${approveRes.data.message}\n`);

    // 5. Check admin donors list again
    console.log('5️⃣ Fetching admin donors list after approval...');
    const donorsRes2 = await axios.get(`${API_URL}/admin/donors?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const approvedDonor = donorsRes2.data.donors.find(d => d.user?._id === donorUserId);
    
    if (approvedDonor) {
      console.log(`✅ Donor still in list`);
      console.log(`   Status: ${approvedDonor.status}`);
      console.log(`   isPendingSignup: ${approvedDonor.isPendingSignup}\n`);
    }

    // 6. Try to login again (should work now)
    console.log('6️⃣ Attempting to login as approved donor (should succeed)...');
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('✅ Donor logged in successfully!');
      console.log('   Token:', loginRes.data.token.substring(0, 50) + '...\n');

      console.log('🎉 COMPLETE WORKFLOW TEST PASSED!\n');
      console.log('Summary:');
      console.log('✅ Pending donor found in admin list');
      console.log('✅ Pending donor cannot login');
      console.log('✅ Admin can approve donor');
      console.log('✅ Approved donor can login');

    } catch (err) {
      console.log('❌ Donor still cannot login:', err.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.response?.data || error.message);
  }
}

test();
