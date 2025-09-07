#!/usr/bin/env npx tsx

/**
 * Backend Connectivity Test Script
 * Tests actual backend API endpoints and reports integration status
 */

const API_BASE = process.env.API_URL || 'http://localhost:4000/api';
const FRONTEND_BASE = 'http://localhost:3003';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'connected' | 'mock' | 'error' | 'not_found';
  message: string;
  responseTime?: number;
}

const tests: TestResult[] = [];

async function testEndpoint(
  name: string,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<TestResult> {
  const start = Date.now();

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseTime = Date.now() - start;

    if (response.status === 404) {
      return {
        endpoint: name,
        method,
        status: 'not_found',
        message: 'Endpoint not found',
        responseTime,
      };
    }

    if (response.ok || response.status === 401) {
      return {
        endpoint: name,
        method,
        status: 'connected',
        message: `Status: ${response.status}`,
        responseTime,
      };
    }

    return {
      endpoint: name,
      method,
      status: 'error',
      message: `Status: ${response.status}`,
      responseTime,
    };
  } catch (error) {
    return {
      endpoint: name,
      method,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runTests() {
  console.log('🔌 Testing Backend Connectivity...\n');
  console.log(`API Base: ${API_BASE}\n`);

  // Test health check
  tests.push(await testEndpoint('Health Check', '/health'));

  // Test authentication endpoints
  tests.push(
    await testEndpoint('Login', '/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password',
    })
  );

  tests.push(
    await testEndpoint('Register', '/auth/register', 'POST', {
      email: 'new@example.com',
      password: 'password',
      name: 'Test User',
    })
  );

  // Test study endpoints
  tests.push(await testEndpoint('List Studies', '/studies'));
  tests.push(await testEndpoint('Get Study', '/studies/1'));

  // Test analysis endpoints
  tests.push(
    await testEndpoint('Q-Analysis', '/analysis/q-methodology', 'POST', {
      data: [],
    })
  );

  // Test file upload endpoint
  tests.push(await testEndpoint('File Upload', '/upload'));

  // Print results
  console.log('📊 Test Results:\n');
  console.log('| Endpoint | Method | Status | Response Time | Message |');
  console.log('|----------|--------|--------|---------------|---------|');

  let connectedCount = 0;
  let totalCount = tests.length;

  tests.forEach(test => {
    const statusEmoji =
      test.status === 'connected'
        ? '✅'
        : test.status === 'mock'
          ? '🔵'
          : test.status === 'not_found'
            ? '❌'
            : '⚠️';

    if (test.status === 'connected') connectedCount++;

    console.log(
      `| ${test.endpoint.padEnd(20)} | ${test.method.padEnd(6)} | ${statusEmoji} ${test.status.padEnd(10)} | ${
        test.responseTime
          ? `${test.responseTime}ms`.padEnd(13)
          : 'N/A'.padEnd(13)
      } | ${test.message} |`
    );
  });

  const percentage = Math.round((connectedCount / totalCount) * 100);

  console.log('\n📈 Summary:');
  console.log(
    `- Connected Endpoints: ${connectedCount}/${totalCount} (${percentage}%)`
  );
  console.log(
    `- Integration Status: ${percentage > 80 ? '✅ Good' : percentage > 50 ? '⚠️ Partial' : '❌ Poor'}`
  );

  // Test frontend API usage
  console.log('\n🔍 Checking Frontend API Usage...\n');

  try {
    const frontendResponse = await fetch(`${FRONTEND_BASE}/api/studies`);
    if (frontendResponse.ok) {
      const data = await frontendResponse.json();
      console.log(
        `Frontend /api/studies returns: ${data.length ? 'Data' : 'Empty'}`
      );

      // Check if it's mock data
      if (data[0]?.id === 'study-1') {
        console.log('⚠️  Frontend is using MOCK DATA');
      } else {
        console.log('✅ Frontend might be using real data');
      }
    }
  } catch (error) {
    console.log('❌ Could not test frontend API endpoints');
  }

  // Recommendations
  console.log('\n💡 Recommendations:');

  if (percentage < 50) {
    console.log('1. ❗ Backend server may not be running on expected port');
    console.log('2. ❗ Check if backend is using port 4000 or different port');
    console.log('3. ❗ Verify CORS configuration allows frontend connection');
  } else if (percentage < 80) {
    console.log('1. ⚠️  Some endpoints are missing or not implemented');
    console.log('2. ⚠️  Complete backend endpoint implementation');
  } else {
    console.log('1. ✅ Backend connectivity is good');
    console.log('2. 📌 Now connect frontend to use these endpoints');
  }
}

// Run tests
runTests().catch(console.error);
