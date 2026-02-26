const axios = require('axios');

const runTest = async () => {
    try {
        const url = 'http://localhost:5000/api/auth/register';
        const testUser = {
            name: 'API Test User',
            email: 'apitest_' + Date.now() + '@example.com',
            password: 'Password123', // Meets requirements: Upper, Lower, Number
            role: 'donor'
        };

        console.log(`Sending registration request to ${url}...`);
        console.log('Payload:', testUser);

        const response = await axios.post(url, testUser);

        console.log('✅ Registration successful!');
        console.log('Status:', response.status);
        console.log('Data:', response.data);

    } catch (error) {
        console.error('❌ Registration failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received. Is the server running?');
        } else {
            console.error('Error:', error.message);
        }
    }
};

runTest();
