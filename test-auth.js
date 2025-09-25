// Test authentication flow
const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing authentication...\n');
    
    // Test backend directly
    console.log('1. Testing backend API directly...');
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'test@example.com',
      password: 'Test123456'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Backend login successful!');
    console.log('   User:', response.data.user.name);
    console.log('   Email:', response.data.user.email);
    console.log('   Role:', response.data.user.role);
    console.log('   Token received:', !!response.data.accessToken);
    
  } catch (error) {
    console.error('❌ Authentication failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message || error.message);
  }
}

testAuth();