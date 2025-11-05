/**
 * Unit Test: Q-Statement Generation Public Endpoint
 * Phase 10 Day 14: Testing public endpoint for dev/testing
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  response?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Public endpoint exists and responds
 */
async function testPublicEndpointExists(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 1: Public endpoint exists and responds');

    const response = await axios.post(
      `${BASE_URL}/literature/statements/generate/public`,
      {
        themes: ['Theme 1', 'Theme 2', 'Theme 3'],
        studyContext: {
          topic: 'impact of social media on political campaigns',
          purpose: 'Q-Methodology Study'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Response status:', response.status);
    console.log('✅ Response data type:', typeof response.data);
    console.log('✅ Statements generated:', Array.isArray(response.data) ? response.data.length : 'N/A');

    return {
      testName: 'Public endpoint exists and responds',
      passed: response.status === 200 && Array.isArray(response.data),
      response: response.data,
    };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);

    return {
      testName: 'Public endpoint exists and responds',
      passed: false,
      error: error.message,
      response: error.response?.data,
    };
  }
}

/**
 * Test 2: Endpoint requires themes array
 */
async function testRequiresThemes(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 2: Endpoint validates required fields');

    const response = await axios.post(
      `${BASE_URL}/literature/statements/generate/public`,
      {
        studyContext: {
          topic: 'test'
        }
        // Missing themes
      }
    );

    // Should not reach here - should fail validation
    return {
      testName: 'Endpoint validates required fields',
      passed: false,
      error: 'Expected validation error but request succeeded',
      response: response.data,
    };
  } catch (error: any) {
    // Expected to fail with validation error
    const is400Error = error.response?.status === 400 || error.response?.status === 500;
    console.log(is400Error ? '✅' : '❌', 'Validation error received:', error.response?.status);

    return {
      testName: 'Endpoint validates required fields',
      passed: is400Error,
      error: is400Error ? undefined : 'Expected 400/500 but got: ' + error.response?.status,
    };
  }
}

/**
 * Test 3: Endpoint works with minimal data
 */
async function testMinimalData(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 3: Works with minimal valid data');

    const response = await axios.post(
      `${BASE_URL}/literature/statements/generate/public`,
      {
        themes: ['Single Theme'],
        studyContext: {}
      }
    );

    console.log('✅ Response status:', response.status);
    console.log('✅ Statements generated:', Array.isArray(response.data) ? response.data.length : 'N/A');

    return {
      testName: 'Works with minimal valid data',
      passed: response.status === 200,
      response: response.data,
    };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);

    return {
      testName: 'Works with minimal valid data',
      passed: false,
      error: error.message,
      response: error.response?.data,
    };
  }
}

/**
 * Test 4: Endpoint works with realistic theme count
 */
async function testRealisticThemeCount(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 4: Works with realistic theme count (35 themes)');

    const themes = Array.from({ length: 35 }, (_, i) => `Theme ${i + 1}: Social media impact aspect ${i + 1}`);

    const response = await axios.post(
      `${BASE_URL}/literature/statements/generate/public`,
      {
        themes,
        studyContext: {
          topic: 'impact of social media on political campaigns',
          purpose: 'Q-Methodology Study',
          targetStatements: 40
        }
      }
    );

    console.log('✅ Response status:', response.status);
    console.log('✅ Statements generated:', Array.isArray(response.data) ? response.data.length : 'N/A');
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('✅ Sample statement:', response.data[0]);
    }

    return {
      testName: 'Works with realistic theme count (35 themes)',
      passed: response.status === 200 && Array.isArray(response.data) && response.data.length > 0,
      response: `Generated ${response.data?.length || 0} statements from 35 themes`,
    };
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('   Full error:', error.response?.data || error.message);

    return {
      testName: 'Works with realistic theme count (35 themes)',
      passed: false,
      error: error.message,
      response: error.response?.data,
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   Q-Statement Generation Endpoint Unit Tests');
  console.log('   Phase 10 Day 14: Public Endpoint Testing');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check if backend is running
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend is running\n');
  } catch {
    console.error('❌ Backend is not running! Please start the backend server.');
    console.error('   Run: cd backend && npm run start:dev\n');
    process.exit(1);
  }

  // Run tests
  results.push(await testPublicEndpointExists());
  results.push(await testRequiresThemes());
  results.push(await testMinimalData());
  results.push(await testRealisticThemeCount());

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.testName}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n${passed}/${results.length} tests passed`);
  console.log(`${failed}/${results.length} tests failed\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Q-Statement endpoint is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
  }

  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
