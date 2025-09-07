#!/usr/bin/env ts-node

/**
 * Integration Test Script for Phase 6.7
 * Tests the complete frontend-backend integration
 */

import axios from 'axios';
import colors from 'colors';

const API_URL = 'http://localhost:4000/api';
const FRONTEND_URL = 'http://localhost:3000';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  time?: number;
}

const results: TestResult[] = [];

// Helper function to log test results
function logTest(
  test: string,
  status: 'pass' | 'fail' | 'skip',
  message?: string,
  time?: number
) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color =
    status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';

  console.log(colors[color](`${icon} ${test}${time ? ` (${time}ms)` : ''}`));
  if (message) {
    console.log(colors.gray(`   ${message}`));
  }

  results.push({ test, status, message, time });
}

// Test backend health
async function testBackendHealth() {
  const start = Date.now();
  try {
    const response = await axios.get(`${API_URL}/health`);
    const time = Date.now() - start;

    if (response.status === 200) {
      logTest('Backend Health Check', 'pass', 'Backend is running', time);
      return true;
    }
  } catch (error: any) {
    logTest('Backend Health Check', 'fail', error.message);
    return false;
  }
  return false;
}

// Test frontend availability
async function testFrontendHealth() {
  const start = Date.now();
  try {
    const response = await axios.get(FRONTEND_URL);
    const time = Date.now() - start;

    if (response.status === 200) {
      logTest('Frontend Health Check', 'pass', 'Frontend is running', time);
      return true;
    }
  } catch (error: any) {
    logTest('Frontend Health Check', 'fail', error.message);
    return false;
  }
  return false;
}

// Test authentication flow
async function testAuthFlow() {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'researcher',
  };

  let accessToken = '';

  // Test registration
  const startReg = Date.now();
  try {
    const regResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    const timeReg = Date.now() - startReg;

    if (regResponse.data.accessToken) {
      accessToken = regResponse.data.accessToken;
      logTest(
        'User Registration',
        'pass',
        'User registered successfully',
        timeReg
      );
    } else {
      logTest('User Registration', 'fail', 'No access token received');
      return false;
    }
  } catch (error: any) {
    logTest(
      'User Registration',
      'fail',
      error.response?.data?.message || error.message
    );
    return false;
  }

  // Test login
  const startLogin = Date.now();
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    const timeLogin = Date.now() - startLogin;

    if (loginResponse.data.accessToken) {
      accessToken = loginResponse.data.accessToken;
      logTest('User Login', 'pass', 'Login successful', timeLogin);
    } else {
      logTest('User Login', 'fail', 'No access token received');
      return false;
    }
  } catch (error: any) {
    logTest(
      'User Login',
      'fail',
      error.response?.data?.message || error.message
    );
    return false;
  }

  // Test protected route
  const startMe = Date.now();
  try {
    const meResponse = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const timeMe = Date.now() - startMe;

    if (meResponse.data.email === testUser.email) {
      logTest(
        'Protected Route Access',
        'pass',
        'User profile retrieved',
        timeMe
      );
      return true;
    } else {
      logTest('Protected Route Access', 'fail', 'Invalid user data');
      return false;
    }
  } catch (error: any) {
    logTest(
      'Protected Route Access',
      'fail',
      error.response?.data?.message || error.message
    );
    return false;
  }
}

// Test study CRUD operations
async function testStudyOperations(token: string) {
  let studyId = '';

  // Create study
  const startCreate = Date.now();
  try {
    const createResponse = await axios.post(
      `${API_URL}/studies`,
      {
        title: 'Integration Test Study',
        description: 'Testing backend integration',
        settings: {
          requireAuth: false,
          allowAnonymous: true,
          sortingMethod: 'grid',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const timeCreate = Date.now() - startCreate;

    if (createResponse.data.id) {
      studyId = createResponse.data.id;
      logTest('Create Study', 'pass', `Study created: ${studyId}`, timeCreate);
    } else {
      logTest('Create Study', 'fail', 'No study ID received');
      return false;
    }
  } catch (error: any) {
    logTest(
      'Create Study',
      'fail',
      error.response?.data?.message || error.message
    );
    return false;
  }

  // Get study
  const startGet = Date.now();
  try {
    const getResponse = await axios.get(`${API_URL}/studies/${studyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const timeGet = Date.now() - startGet;

    if (getResponse.data.id === studyId) {
      logTest('Get Study', 'pass', 'Study retrieved successfully', timeGet);
    } else {
      logTest('Get Study', 'fail', 'Invalid study data');
      return false;
    }
  } catch (error: any) {
    logTest(
      'Get Study',
      'fail',
      error.response?.data?.message || error.message
    );
    return false;
  }

  // Update study
  const startUpdate = Date.now();
  try {
    const updateResponse = await axios.patch(
      `${API_URL}/studies/${studyId}`,
      {
        title: 'Updated Integration Test Study',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const timeUpdate = Date.now() - startUpdate;

    if (updateResponse.data.title === 'Updated Integration Test Study') {
      logTest('Update Study', 'pass', 'Study updated successfully', timeUpdate);
    } else {
      logTest('Update Study', 'fail', 'Study not updated');
      return false;
    }
  } catch (error: any) {
    logTest(
      'Update Study',
      'fail',
      error.response?.data?.message || error.message
    );
    return false;
  }

  // Delete study
  const startDelete = Date.now();
  try {
    await axios.delete(`${API_URL}/studies/${studyId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const timeDelete = Date.now() - startDelete;

    logTest('Delete Study', 'pass', 'Study deleted successfully', timeDelete);
    return true;
  } catch (error: any) {
    logTest(
      'Delete Study',
      'fail',
      error.response?.data?.message || error.message
    );
    return false;
  }
}

// Test WebSocket connection
async function testWebSocket() {
  // This would require a WebSocket client library
  logTest('WebSocket Connection', 'skip', 'WebSocket test not implemented');
  return true;
}

// Main test runner
async function runIntegrationTests() {
  console.log(colors.cyan.bold('\n🧪 Running Phase 6.7 Integration Tests\n'));
  console.log(colors.gray('='.repeat(50) + '\n'));

  // Test backend
  console.log(colors.yellow.bold('Testing Backend Connectivity...'));
  const backendOk = await testBackendHealth();

  if (!backendOk) {
    console.log(colors.red.bold('\n❌ Backend is not running!'));
    console.log(
      colors.gray(
        'Please start the backend with: cd backend && npm run start:dev\n'
      )
    );
    return;
  }

  // Test frontend
  console.log(colors.yellow.bold('\nTesting Frontend Connectivity...'));
  const frontendOk = await testFrontendHealth();

  if (!frontendOk) {
    console.log(colors.yellow('\n⚠️  Frontend is not running'));
    console.log(
      colors.gray('Start the frontend with: cd frontend && npm run dev\n')
    );
  }

  // Test authentication
  console.log(colors.yellow.bold('\nTesting Authentication Flow...'));
  const authOk = await testAuthFlow();

  if (!authOk) {
    console.log(colors.red('\n❌ Authentication flow failed!'));
    return;
  }

  // Get a fresh token for remaining tests
  const loginResponse = await axios
    .post(`${API_URL}/auth/login`, {
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123!',
    })
    .catch(() => null);

  if (loginResponse?.data?.accessToken) {
    // Test study operations
    console.log(colors.yellow.bold('\nTesting Study Operations...'));
    await testStudyOperations(loginResponse.data.accessToken);
  }

  // Test WebSocket
  console.log(colors.yellow.bold('\nTesting Real-time Features...'));
  await testWebSocket();

  // Print summary
  console.log(colors.gray('\n' + '='.repeat(50)));
  console.log(colors.cyan.bold('\n📊 Test Summary\n'));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;

  console.log(colors.green(`✅ Passed: ${passed}`));
  console.log(colors.red(`❌ Failed: ${failed}`));
  console.log(colors.yellow(`⏭️  Skipped: ${skipped}`));

  const totalTime = results.reduce((sum, r) => sum + (r.time || 0), 0);
  console.log(colors.gray(`\n⏱️  Total time: ${totalTime}ms`));

  if (failed === 0) {
    console.log(
      colors.green.bold('\n🎉 All tests passed! Integration is working!\n')
    );
  } else {
    console.log(
      colors.red.bold(`\n😞 ${failed} test(s) failed. Please fix the issues.\n`)
    );

    // Show failed tests
    console.log(colors.red.bold('Failed Tests:'));
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(colors.red(`  - ${r.test}: ${r.message}`));
      });
  }
}

// Run tests
runIntegrationTests().catch(error => {
  console.error(colors.red.bold('Test runner failed:'), error);
  process.exit(1);
});
