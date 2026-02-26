const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('\n🚀 HOSPITAL LOGIN TEST\n');
    console.log('=' .repeat(60));

    // Try hospital login
    console.log('\n1️⃣ Testing Hospital Login');
    console.log('-'.repeat(60));
    console.log('Email: ok123@gmail.com');
    console.log('Password: testPass123\n');

    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'ok123@gmail.com',
        password: 'testPass123'
      });
      
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log(`   Token: ${loginRes.data.token.substring(0, 50)}...`);
      console.log(`   User: ${loginRes.data.user?.name}`);
      console.log(`   Role: ${loginRes.data.user?.role}\n`);

      // Try accessing hospital dashboard
      console.log('2️⃣ Testing Hospital Dashboard Access');
      console.log('-'.repeat(60));
      try {
        const dashRes = await axios.get(`${API_URL}/hospital/dashboard`, {
          headers: { Authorization: `Bearer ${loginRes.data.token}` }
        });
        console.log('✅ Hospital can access dashboard');
        console.log(`   Data: ${Object.keys(dashRes.data).join(', ')}\n`);
      } catch (err) {
        console.log('⚠️  Dashboard access error:', err.response?.data?.message);
      }

    } catch (err) {
      console.log('❌ Login failed:', err.response?.data?.message || err.message);
      return;
    }

    console.log('=' .repeat(60));
    console.log('🎉 HOSPITAL LOGIN WORKING!\n');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
}

test();
