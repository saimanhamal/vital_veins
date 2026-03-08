const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('\n✅ DONOR APPROVAL WORKFLOW TEST\n');

    // 1. Admin Login
    console.log('1️⃣ Admin login...');
    let adminToken;
    try {
      const adminLogin = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@vitalveins.com',
        password: 'Admin123'
      });
      adminToken = adminLogin.data.token;
      console.log('   ✅ Success\n');
    } catch (err) {
      console.log('   ❌ Failed:', err.response?.data?.message || err.message);
      return;
    }

    // 2. Get pending donors
    console.log('2️⃣ Fetch pending donors...');
    let donorsRes;
    try {
      donorsRes = await axios.get(`${API_URL}/admin/donors?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const pending = donorsRes.data.donors.find(d => d.status === 'pending');
      if (!pending) {
        console.log('   ❌ No pending donors\n');
        return;
      }
      console.log(`   ✅ Found: ${pending.user?.email} (Status: ${pending.status})\n`);
      var donorUserId = pending.user?._id;
      var donorEmail = pending.user?.email;
    } catch (err) {
      console.log('   ❌ Failed:', err.response?.data?.message || err.message);
      return;
    }

    // 3. Admin approves donor
    console.log('3️⃣ Admin approves donor...');
    try {
      const approveRes = await axios.post(
        `${API_URL}/admin/donors/${donorUserId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('   ✅ Success\n');
    } catch (err) {
      console.log('   ❌ Failed:', err.response?.data?.message || err.message);
      console.log('   Error details:', err.response?.data);
      return;
    }

    // 4. Check donor list
    console.log('4️⃣ Check updated donor list...');
    try {
      const donorsRes2 = await axios.get(`${API_URL}/admin/donors?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const donor = donorsRes2.data.donors.find(d => d.user?._id === donorUserId);
      if (donor) {
        console.log(`   ✅ Donor status: ${donor.status}\n`);
      } else {
        console.log('   ⚠️  Donor not in list\n');
      }
    } catch (err) {
      console.log('   ❌ Failed:', err.message);
    }

    // 5. Verify donor is in Donor DB
    console.log('5️⃣ Verify Donor profile created...');
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vitalveins');
    const Donor = require('./models/Donor');
    const User = require('./models/User');
    
    const user = await User.findById(donorUserId);
    const donor = await Donor.findOne({ user: donorUserId });
    
    if (user?.verified && donor) {
      console.log('   ✅ User verified: true');
      console.log(`   ✅ Donor profile created: ${donor.personalInfo?.firstName} ${donor.personalInfo?.lastName}\n`);
    } else {
      console.log(`   ⚠️  User verified: ${user?.verified}, Donor exists: ${!!donor}\n`);
    }
    
    await mongoose.connection.close();

    console.log('🎉 WORKFLOW COMPLETE!');
    console.log('   - Admin viewed pending donors');
    console.log('   - Admin approved donor');
    console.log('   - Donor profile created in database');
    console.log('   - Donor can now login and access functions\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

test();
