const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('\n🏥 HOSPITAL LOGIN TEST\n');

    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'ok123@gmail.com',
      password: 'testPass123'
    });
    
    console.log('✅ Hospital login successful!');
    console.log('   Token:', loginRes.data.token.substring(0, 50) + '...');
    console.log('   User:', loginRes.data.user?.name);
    console.log('   Role:', loginRes.data.user?.role);

  } catch (error) {
    console.error('❌ Login failed');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error:', error.message);
  }
}

test();
