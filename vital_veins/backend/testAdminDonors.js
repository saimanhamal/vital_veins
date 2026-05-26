const axios = require('axios');

const testAdminDonors = async () => {
  try {
    // 1. Login as admin
    console.log('🔐 Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@vitalveins.com',
      password: 'Admin123'
    });
    
    const adminToken = loginRes.data.token;
    console.log('✅ Admin logged in');
    console.log('Token:', adminToken.substring(0, 20) + '...');
    
    // 2. Get donors list
    console.log('\n📋 Fetching donors list...');
    const donorsRes = await axios.get('http://localhost:5000/api/admin/donors', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Donors fetched successfully');
    console.log(`📊 Total donors: ${donorsRes.data.pagination.total}`);
    console.log('\n👥 Donors:');
    donorsRes.data.donors.forEach((d, i) => {
      console.log(`  ${i+1}. ${d.personalInfo.firstName} ${d.personalInfo.lastName}`);
      console.log(`     Email: ${d.user?.email}`);
      console.log(`     Status: ${d.status}`);
      console.log(`     Blood Type: ${d.personalInfo.bloodType}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testAdminDonors();
