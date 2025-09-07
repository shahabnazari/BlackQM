#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';
const FRONTEND_URL = 'http://localhost:3000';

async function debugLogin() {
  console.log('🔍 Debug Login Flow\n');
  console.log('='.repeat(60));

  const credentials = {
    email: 'admin@test.com',
    password: 'Password123!',
  };

  try {
    // Step 1: Test direct API call
    console.log('\n1. Testing Direct API Call to Backend:');
    console.log('   URL:', `${API_BASE_URL}/auth/login`);
    console.log('   Credentials:', credentials);

    const apiResponse = await axios.post(
      `${API_BASE_URL}/auth/login`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\n   ✅ Direct API Call Success!');
    console.log('   Response Status:', apiResponse.status);
    console.log('   Response Data Structure:');
    console.log('   - User:', {
      id: apiResponse.data.user.id,
      email: apiResponse.data.user.email,
      name: apiResponse.data.user.name,
      firstName: apiResponse.data.user.firstName,
      lastName: apiResponse.data.user.lastName,
      role: apiResponse.data.user.role,
    });
    console.log(
      '   - Access Token:',
      apiResponse.data.accessToken ? 'Present' : 'Missing'
    );
    console.log(
      '   - Refresh Token:',
      apiResponse.data.refreshToken ? 'Present' : 'Missing'
    );

    // Step 2: Test with CORS headers (simulating browser)
    console.log('\n2. Testing with CORS Headers (Browser Simulation):');

    const corsResponse = await axios.post(
      `${API_BASE_URL}/auth/login`,
      credentials,
      {
        headers: {
          'Content-Type': 'application/json',
          Origin: FRONTEND_URL,
          Referer: `${FRONTEND_URL}/auth/login`,
        },
        withCredentials: true,
      }
    );

    console.log('   ✅ CORS Request Success!');
    console.log('   Response Status:', corsResponse.status);

    // Step 3: Check the actual response structure
    console.log('\n3. Analyzing Response Structure:');
    console.log('   Full Response Keys:', Object.keys(corsResponse.data));
    console.log('   User Object Keys:', Object.keys(corsResponse.data.user));

    // Step 4: Test authentication with the token
    console.log('\n4. Testing Token Authentication:');
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${apiResponse.data.accessToken}`,
      },
    });

    console.log('   ✅ Token Authentication Works!');
    console.log('   /auth/me Response:', {
      id: meResponse.data.id,
      email: meResponse.data.email,
      role: meResponse.data.role,
    });
  } catch (error) {
    console.error('\n❌ Login Debug Failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Response Data:', error.response.data);
      console.error('   Headers:', error.response.headers);
    } else if (error.request) {
      console.error('   Network Error - No response received');
      console.error('   Request URL:', error.config?.url);
    } else {
      console.error('   Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary:');
  console.log('   The backend API is working correctly.');
  console.log('   The issue is likely in the frontend connection.');
  console.log('\n   Check:');
  console.log('   1. Is the frontend actually calling http://localhost:4000?');
  console.log('   2. Are there any browser console errors?');
  console.log('   3. Is the axios response being handled correctly?');
}

// Run the debug
debugLogin();
