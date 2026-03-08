const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🧪 Testing login endpoint directly...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@vitalveins.com',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Full error:', error.message);
  }
};

testLogin();
