const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('Testing API connection...\n');
    
    // 1. Test health check
    console.log('1️⃣ Testing health check...');
    const health = await axios.get(`${API_URL}/health`);
    console.log('✅ API is healthy:', health.data);

    // 2. Try logging in with admin
    console.log('\n2️⃣ Attempting admin login...');
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@vitalveins.com',
        password: 'Admin123'
      });
      console.log('✅ Admin login successful');
      console.log('Token:', loginRes.data.token?.substring(0, 50) + '...');
    } catch (err) {
      console.log('❌ Admin login failed:');
      console.log('Status:', err.response?.status);
      console.log('Message:', err.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

test();
