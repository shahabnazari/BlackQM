#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

const API_URL = 'http://localhost:3001/api';

async function testAuthFlow() {
  console.log(chalk.blue('🔐 Testing Authentication Flow...\n'));
  
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User'
  };
  
  let authToken = null;
  
  try {
    // 1. Test Registration
    console.log(chalk.yellow('1. Testing Registration...'));
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
      console.log(chalk.green('✓ Registration successful'));
      console.log(`  User ID: ${registerResponse.data.user.id}`);
      authToken = registerResponse.data.accessToken || registerResponse.data.token;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(chalk.yellow('  User already exists, attempting login...'));
      } else {
        throw error;
      }
    }
    
    // 2. Test Login
    console.log(chalk.yellow('\n2. Testing Login...'));
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log(chalk.green('✓ Login successful'));
    authToken = loginResponse.data.accessToken || loginResponse.data.token;
    if (!authToken) {
      console.log(chalk.red('  Warning: No token received in response'));
      console.log('  Response:', JSON.stringify(loginResponse.data, null, 2));
    } else {
      console.log(`  Token received: ${authToken.substring(0, 20)}...`);
    }
    
    // 3. Test Authenticated Request
    console.log(chalk.yellow('\n3. Testing Authenticated Request...'));
    const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    console.log(chalk.green('✓ Authenticated request successful'));
    console.log(`  User Email: ${profileResponse.data.email}`);
    console.log(`  User Name: ${profileResponse.data.name}`);
    
    // 4. Test Token Refresh
    console.log(chalk.yellow('\n4. Testing Token Refresh...'));
    const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    console.log(chalk.green('✓ Token refresh successful'));
    const newToken = refreshResponse.data.accessToken || refreshResponse.data.token;
    if (newToken) {
      console.log(`  New token received: ${newToken.substring(0, 20)}...`);
    }
    
    // 5. Test Logout
    console.log(chalk.yellow('\n5. Testing Logout...'));
    await axios.post(`${API_URL}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${newToken}`
      }
    });
    console.log(chalk.green('✓ Logout successful'));
    
    // 6. Verify token is invalid after logout
    console.log(chalk.yellow('\n6. Verifying token invalidation...'));
    try {
      await axios.get(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${newToken}`
        }
      });
      console.log(chalk.red('✗ Token still valid after logout!'));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(chalk.green('✓ Token properly invalidated'));
      } else {
        throw error;
      }
    }
    
    console.log(chalk.green('\n✅ All authentication tests passed!'));
    
  } catch (error) {
    console.log(chalk.red('\n❌ Authentication test failed:'));
    if (error.response) {
      console.log(chalk.red(`  Status: ${error.response.status}`));
      console.log(chalk.red(`  Message: ${error.response.data.message || error.response.statusText}`));
    } else if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('  Backend server is not running!'));
      console.log(chalk.yellow('  Please start the backend with: cd backend && npm run start:dev'));
    } else {
      console.log(chalk.red(`  Error: ${error.message}`));
    }
    process.exit(1);
  }
}

// Run the test
testAuthFlow().catch(console.error);