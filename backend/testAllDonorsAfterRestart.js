const axios = require('axios');

const testAllDonors = async () => {
  console.log('🧪 Testing all donor accounts after server restart...\n');
  
  const donorCredentials = [
    { email: 'rahul.sharma@gmail.com', password: 'donor123', name: 'Rahul Sharma' },
    { email: 'priya.singh@gmail.com', password: 'donor123', name: 'Priya Singh' },
    { email: 'amit.kumar@gmail.com', password: 'donor123', name: 'Amit Kumar' },
    { email: 'sneha.patel@gmail.com', password: 'donor123', name: 'Sneha Patel' },
    { email: 'vikash.gupta@gmail.com', password: 'donor123', name: 'Vikash Gupta' }
  ];
  
  let successCount = 0;
  
  for (const cred of donorCredentials) {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: cred.email,
        password: cred.password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`✅ ${cred.name} - Login successful!`);
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      console.log(`   User ID: ${response.data.user.id}`);
      successCount++;
      
    } catch (error) {
      console.log(`❌ ${cred.name} - Login failed`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}`);
    }
    console.log('');
  }
  
  console.log(`🎯 SUMMARY: ${successCount}/${donorCredentials.length} donor accounts working`);
  
  if (successCount === donorCredentials.length) {
    console.log('🎉 ALL DONOR ACCOUNTS ARE NOW WORKING!');
    console.log('\n✅ You can now login with any of these donor credentials:');
    donorCredentials.forEach(cred => {
      console.log(`   ${cred.email} / ${cred.password}`);
    });
  } else {
    console.log('⚠️ Some donor accounts still need fixing');
  }
};

testAllDonors();
