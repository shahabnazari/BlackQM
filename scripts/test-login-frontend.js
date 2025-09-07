// Test login from frontend environment
const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

async function testFrontendLogin() {
  console.log('🔍 Testing login endpoint from frontend perspective...\n');

  const credentials = {
    email: 'admin@test.com',
    password: 'Password123!',
  };

  console.log('📨 Sending login request to:', API_URL + '/auth/login');
  console.log('📧 Email:', credentials.email);
  console.log('🔑 Password:', credentials.password);
  console.log('');

  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    console.log('✅ Login successful!');
    console.log('\n📦 Response data:');
    console.log('User:', response.data.user);
    console.log('\nTokens received:');
    console.log(
      '- Access Token:',
      response.data.access_token ? '✓ Yes' : '✗ No'
    );
    console.log(
      '- Refresh Token:',
      response.data.refresh_token ? '✓ Yes' : '✗ No'
    );
    console.log(
      '- AccessToken (alt):',
      response.data.accessToken ? '✓ Yes' : '✗ No'
    );
    console.log(
      '- RefreshToken (alt):',
      response.data.refreshToken ? '✓ Yes' : '✗ No'
    );

    console.log('\n🔍 Full response keys:', Object.keys(response.data));
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log(
      'Error message:',
      error.response?.data?.message || error.message
    );
    console.log('Full error:', error.response?.data);

    if (error.response?.status === 401) {
      console.log('\n⚠️  Possible causes:');
      console.log('1. Incorrect password');
      console.log('2. User does not exist');
      console.log('3. Account is disabled');
    }
  }
}

testFrontendLogin();
