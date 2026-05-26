const axios = require('axios');

const testDonorLogin = async () => {
  try {
    console.log('🧪 Testing donor login after fix...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'rahul.sharma@gmail.com',
      password: 'donor123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Donor login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Donor login failed!');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Full error:', error.message);
  }
};

testDonorLogin();
