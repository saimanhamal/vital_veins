// Simple connection test for frontend
const testConnection = async () => {
  try {
    console.log('🧪 Testing backend connection from frontend...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test login endpoint
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@lifelink.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login test successful:', loginData.message);
    } else {
      console.log('❌ Login test failed:', loginResponse.status, loginResponse.statusText);
      const errorData = await loginResponse.text();
      console.log('Error details:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
  }
};

// Run test if in browser console
if (typeof window !== 'undefined') {
  window.testConnection = testConnection;
  console.log('Run testConnection() in console to test backend connection');
}

export default testConnection;
