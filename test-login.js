const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@test.com',
      password: 'Password123!',
    });
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
    if (response.data.access_token) {
      console.log('Access Token: ✓ Received');
    }
    if (response.data.refresh_token) {
      console.log('Refresh Token: ✓ Received');
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();
