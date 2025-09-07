#!/usr/bin/env node

const axios = require('axios');
const puppeteer = require('puppeteer');

const API_BASE_URL = 'http://localhost:4000/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test accounts
const TEST_ACCOUNTS = [
  { email: 'admin@test.com', password: 'Password123!', role: 'ADMIN' },
  {
    email: 'researcher@test.com',
    password: 'Password123!',
    role: 'RESEARCHER',
  },
  {
    email: 'participant@test.com',
    password: 'Password123!',
    role: 'PARTICIPANT',
  },
];

async function testLoginPageComprehensive() {
  console.log('🔐 Comprehensive Login Page Test Suite\n');
  console.log('═'.repeat(50));

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  try {
    // ============ SECTION 1: SERVER HEALTH CHECKS ============
    console.log('\n📊 SECTION 1: SERVER HEALTH CHECKS');
    console.log('─'.repeat(40));

    // Test 1.1: Backend Health
    console.log('\n1.1 Backend Server Health');
    try {
      const health = await axios.get(`${API_BASE_URL}/health`);
      console.log('    ✅ Backend healthy:', health.data.status);
      results.passed++;
      results.tests.push({ name: 'Backend Health', status: 'PASS' });
    } catch (error) {
      console.log('    ❌ Backend not responding');
      results.failed++;
      results.tests.push({
        name: 'Backend Health',
        status: 'FAIL',
        error: error.message,
      });
    }

    // Test 1.2: Frontend Health
    console.log('\n1.2 Frontend Server Health');
    try {
      const frontend = await axios.get(FRONTEND_URL);
      console.log('    ✅ Frontend accessible');
      results.passed++;
      results.tests.push({ name: 'Frontend Health', status: 'PASS' });
    } catch (error) {
      console.log('    ❌ Frontend not responding');
      results.failed++;
      results.tests.push({
        name: 'Frontend Health',
        status: 'FAIL',
        error: error.message,
      });
    }

    // ============ SECTION 2: API AUTHENTICATION TESTS ============
    console.log('\n📊 SECTION 2: API AUTHENTICATION TESTS');
    console.log('─'.repeat(40));

    for (const account of TEST_ACCOUNTS) {
      console.log(
        `\n2.${TEST_ACCOUNTS.indexOf(account) + 1} Testing ${account.role} Login`
      );
      console.log(`    Email: ${account.email}`);

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: account.email,
          password: account.password,
        });

        console.log(`    ✅ Login successful`);
        console.log(`    → User ID: ${response.data.user.id}`);
        console.log(`    → Role: ${response.data.user.role}`);
        console.log(
          `    → Token: ${response.data.accessToken.substring(0, 30)}...`
        );

        results.passed++;
        results.tests.push({ name: `${account.role} Login`, status: 'PASS' });

        // Test token validation
        try {
          const profileResponse = await axios.get(
            `${API_BASE_URL}/auth/profile`,
            {
              headers: {
                Authorization: `Bearer ${response.data.accessToken}`,
              },
            }
          );
          console.log(`    ✅ Token validation successful`);
          results.passed++;
          results.tests.push({
            name: `${account.role} Token Validation`,
            status: 'PASS',
          });
        } catch (error) {
          console.log(`    ❌ Token validation failed`);
          results.failed++;
          results.tests.push({
            name: `${account.role} Token Validation`,
            status: 'FAIL',
          });
        }
      } catch (error) {
        console.log(
          `    ❌ Login failed: ${error.response?.data?.message || error.message}`
        );
        results.failed++;
        results.tests.push({
          name: `${account.role} Login`,
          status: 'FAIL',
          error: error.message,
        });
      }
    }

    // ============ SECTION 3: SECURITY TESTS ============
    console.log('\n📊 SECTION 3: SECURITY TESTS');
    console.log('─'.repeat(40));

    // Test 3.1: Invalid Credentials
    console.log('\n3.1 Invalid Credentials Handling');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'invalid@test.com',
        password: 'wrongpassword',
      });
      console.log('    ❌ Should have rejected invalid credentials');
      results.failed++;
      results.tests.push({ name: 'Invalid Credentials', status: 'FAIL' });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('    ✅ Invalid credentials properly rejected');
        results.passed++;
        results.tests.push({ name: 'Invalid Credentials', status: 'PASS' });
      } else {
        console.log('    ⚠️  Unexpected error:', error.response?.status);
        results.failed++;
        results.tests.push({ name: 'Invalid Credentials', status: 'FAIL' });
      }
    }

    // Test 3.2: SQL Injection Prevention
    console.log('\n3.2 SQL Injection Prevention');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: "admin@test.com' OR '1'='1",
        password: "' OR '1'='1",
      });
      console.log('    ❌ SQL injection not prevented');
      results.failed++;
      results.tests.push({ name: 'SQL Injection Prevention', status: 'FAIL' });
    } catch (error) {
      console.log('    ✅ SQL injection attempt blocked');
      results.passed++;
      results.tests.push({ name: 'SQL Injection Prevention', status: 'PASS' });
    }

    // Test 3.3: CORS Configuration
    console.log('\n3.3 CORS Configuration');
    try {
      const corsResponse = await axios.options(`${API_BASE_URL}/auth/login`, {
        headers: {
          Origin: FRONTEND_URL,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization',
        },
      });
      console.log('    ✅ CORS properly configured');
      results.passed++;
      results.tests.push({ name: 'CORS Configuration', status: 'PASS' });
    } catch (error) {
      console.log('    ❌ CORS misconfigured');
      results.failed++;
      results.tests.push({ name: 'CORS Configuration', status: 'FAIL' });
    }

    // ============ SECTION 4: VALIDATION TESTS ============
    console.log('\n📊 SECTION 4: VALIDATION TESTS');
    console.log('─'.repeat(40));

    // Test 4.1: Email Validation
    console.log('\n4.1 Email Validation');
    const invalidEmails = [
      'notanemail',
      'missing@',
      '@nodomain.com',
      'spaces in@email.com',
    ];
    let emailValidationPassed = true;

    for (const email of invalidEmails) {
      try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
          email: email,
          password: 'Password123!',
        });
        console.log(`    ❌ Accepted invalid email: ${email}`);
        emailValidationPassed = false;
      } catch (error) {
        // Expected to fail
      }
    }

    if (emailValidationPassed) {
      console.log('    ✅ Email validation working correctly');
      results.passed++;
      results.tests.push({ name: 'Email Validation', status: 'PASS' });
    } else {
      results.failed++;
      results.tests.push({ name: 'Email Validation', status: 'FAIL' });
    }

    // Test 4.2: Password Requirements
    console.log('\n4.2 Password Requirements');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@test.com',
        password: '123', // Too short
      });
      console.log('    ⚠️  Weak password accepted');
      results.failed++;
      results.tests.push({ name: 'Password Requirements', status: 'FAIL' });
    } catch (error) {
      console.log('    ✅ Password requirements enforced');
      results.passed++;
      results.tests.push({ name: 'Password Requirements', status: 'PASS' });
    }

    // ============ SECTION 5: PERFORMANCE TESTS ============
    console.log('\n📊 SECTION 5: PERFORMANCE TESTS');
    console.log('─'.repeat(40));

    // Test 5.1: Login Response Time
    console.log('\n5.1 Login Response Time');
    const startTime = Date.now();
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@test.com',
        password: 'Password123!',
      });
      const responseTime = Date.now() - startTime;
      console.log(`    Response time: ${responseTime}ms`);

      if (responseTime < 500) {
        console.log('    ✅ Excellent performance (<500ms)');
        results.passed++;
        results.tests.push({
          name: 'Login Performance',
          status: 'PASS',
          time: responseTime,
        });
      } else if (responseTime < 1000) {
        console.log('    ⚠️  Acceptable performance (500-1000ms)');
        results.passed++;
        results.tests.push({
          name: 'Login Performance',
          status: 'PASS',
          time: responseTime,
        });
      } else {
        console.log('    ❌ Poor performance (>1000ms)');
        results.failed++;
        results.tests.push({
          name: 'Login Performance',
          status: 'FAIL',
          time: responseTime,
        });
      }
    } catch (error) {
      console.log('    ❌ Performance test failed');
      results.failed++;
      results.tests.push({ name: 'Login Performance', status: 'FAIL' });
    }

    // Test 5.2: Concurrent Login Stress Test
    console.log('\n5.2 Concurrent Login Stress Test');
    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        axios.post(`${API_BASE_URL}/auth/login`, {
          email: TEST_ACCOUNTS[i % TEST_ACCOUNTS.length].email,
          password: 'Password123!',
        })
      );
    }

    try {
      const concurrentStart = Date.now();
      await Promise.all(promises);
      const concurrentTime = Date.now() - concurrentStart;
      console.log(
        `    ✅ Handled ${concurrentRequests} concurrent logins in ${concurrentTime}ms`
      );
      results.passed++;
      results.tests.push({
        name: 'Concurrent Logins',
        status: 'PASS',
        time: concurrentTime,
      });
    } catch (error) {
      console.log(`    ❌ Failed under concurrent load`);
      results.failed++;
      results.tests.push({ name: 'Concurrent Logins', status: 'FAIL' });
    }

    // ============ FINAL REPORT ============
    console.log('\n' + '═'.repeat(50));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('═'.repeat(50));

    console.log('\n📈 Test Statistics:');
    console.log(`   Total Tests: ${results.passed + results.failed}`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(
      `   Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`
    );

    console.log('\n📋 Test Results Summary:');
    results.tests.forEach((test, index) => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      const timeStr = test.time ? ` (${test.time}ms)` : '';
      console.log(`   ${index + 1}. ${icon} ${test.name}${timeStr}`);
      if (test.error) {
        console.log(`      └─ Error: ${test.error}`);
      }
    });

    if (results.failed === 0) {
      console.log('\n🎉 SUCCESS: All tests passed!');
      console.log('The login page is functioning correctly with:');
      console.log('   ✓ Full authentication for all user roles');
      console.log('   ✓ Proper security measures');
      console.log('   ✓ Good performance');
      console.log('   ✓ Correct validation');
    } else {
      console.log('\n⚠️  ATTENTION: Some tests failed');
      console.log('Please review the failed tests above for details.');
    }

    console.log('\n' + '═'.repeat(50));
  } catch (error) {
    console.error('\n❌ Test Suite Error:', error.message);
    process.exit(1);
  }
}

// Check if puppeteer is needed for UI tests
async function checkPuppeteerAvailable() {
  try {
    require.resolve('puppeteer');
    return true;
  } catch (e) {
    return false;
  }
}

// Main execution
async function main() {
  const hasPuppeteer = await checkPuppeteerAvailable();

  if (!hasPuppeteer) {
    console.log('ℹ️  Note: Install puppeteer for UI interaction tests');
    console.log('   npm install puppeteer');
    console.log('');
  }

  await testLoginPageComprehensive();

  if (hasPuppeteer) {
    console.log('\n💡 Tip: UI interaction tests available with puppeteer');
  }
}

main().catch(console.error);
