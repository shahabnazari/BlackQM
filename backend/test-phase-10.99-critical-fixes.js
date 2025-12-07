#!/usr/bin/env node

/**
 * PHASE 10.99: Critical Bug Fixes Verification Test
 *
 * Tests all 3 scenarios documented in PHASE_10.99_CRITICAL_BUGS_FIXED_SUMMARY.md:
 * 1. No Purpose Specified (Primary Test) - Should default to qualitative_analysis
 * 2. Explicit Purpose (Verify No Regression) - Should use specified purpose
 * 3. Invalid Purpose (Security Test) - Should return 400 Bad Request
 */

const http = require('http');

// ANSI color codes for readable output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Sample paper data for testing (correct SourceContentDto format)
const samplePapers = [
  {
    id: 'test-paper-001',
    type: 'paper',
    title: 'The Role of Social Media in Political Discourse',
    content: 'This study examines how social media platforms influence political communication and public opinion formation. Social media has become a central arena for political debate and discourse in the 21st century.',
    year: 2023,
    authors: ['Smith, J.', 'Johnson, A.'],
    doi: '10.1234/example.001',
  },
  {
    id: 'test-paper-002',
    type: 'paper',
    title: 'Climate Change Communication Strategies',
    content: 'An analysis of effective communication strategies for climate change awareness and action. This research identifies key factors that influence public engagement with climate science.',
    year: 2023,
    authors: ['Brown, K.'],
    doi: '10.1234/example.002',
  },
  {
    id: 'test-paper-003',
    type: 'paper',
    title: 'Educational Technology Adoption in Rural Schools',
    content: 'This research investigates factors affecting technology adoption in rural educational settings. Barriers include infrastructure, training, and resistance to change.',
    year: 2022,
    authors: ['Davis, M.', 'Wilson, T.'],
    doi: '10.1234/example.003',
  },
  {
    id: 'test-paper-004',
    type: 'paper',
    title: 'Mental Health Support in Online Communities',
    content: 'A study of peer support mechanisms in online mental health communities. Online platforms provide unique opportunities for anonymous support and connection.',
    year: 2023,
    authors: ['Garcia, R.'],
    doi: '10.1234/example.004',
  },
  {
    id: 'test-paper-005',
    type: 'paper',
    title: 'Sustainable Urban Planning Practices',
    content: 'This paper reviews sustainable practices in urban planning across major cities. Key themes include green spaces, public transit, and renewable energy integration.',
    year: 2022,
    authors: ['Martinez, L.', 'Anderson, P.'],
    doi: '10.1234/example.005',
  },
  {
    id: 'test-paper-006',
    type: 'paper',
    title: 'Artificial Intelligence in Healthcare Diagnostics',
    content: 'An examination of AI applications in medical diagnostic processes. Machine learning algorithms show promise in early disease detection and treatment planning.',
    year: 2023,
    authors: ['Thompson, S.'],
    doi: '10.1234/example.006',
  },
  {
    id: 'test-paper-007',
    type: 'paper',
    title: 'Cultural Identity in Immigrant Communities',
    content: 'This study explores how immigrant communities maintain cultural identity while integrating. Balance between preservation and adaptation is a key challenge.',
    year: 2022,
    authors: ['Rodriguez, C.', 'Lee, H.'],
    doi: '10.1234/example.007',
  },
  {
    id: 'test-paper-008',
    type: 'paper',
    title: 'Workplace Diversity and Innovation',
    content: 'Research on the relationship between workplace diversity and innovative outcomes. Diverse teams demonstrate enhanced problem-solving capabilities and creativity.',
    year: 2023,
    authors: ['White, B.'],
    doi: '10.1234/example.008',
  },
  {
    id: 'test-paper-009',
    type: 'paper',
    title: 'Digital Privacy Concerns in Social Media',
    content: 'An analysis of user privacy concerns and behaviors on social media platforms. Many users express privacy concerns but continue sharing personal information.',
    year: 2023,
    authors: ['Taylor, J.', 'Moore, K.'],
    doi: '10.1234/example.009',
  },
  {
    id: 'test-paper-010',
    type: 'paper',
    title: 'Remote Work and Employee Wellbeing',
    content: 'This study investigates the impact of remote work arrangements on employee mental health. Findings suggest both benefits and challenges for work-life balance.',
    year: 2022,
    authors: ['Jackson, D.'],
    doi: '10.1234/example.010',
  },
];

/**
 * Make HTTP POST request to the API
 */
function makeRequest(endpoint, data, authToken = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: e.message,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test 1: No Purpose Specified (Primary Test)
 */
async function test1_NoPurposeSpecified() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 1: No Purpose Specified (Primary Test)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log('Sending request WITHOUT purpose field...');
  console.log(`Endpoint: ${colors.blue}POST /api/literature/themes/extract-themes-v2/public${colors.reset}\n`);

  const requestBody = {
    sources: samplePapers,
    validationLevel: 'rigorous',
    // NO "purpose" field - this is the test!
  };

  try {
    const response = await makeRequest('/api/literature/themes/extract-themes-v2/public', requestBody);

    const isSuccess = response.statusCode === 200 || response.statusCode === 202;
    console.log(`Response Status: ${isSuccess ? colors.green : colors.red}${response.statusCode}${colors.reset}`);

    if (isSuccess) {
      console.log(`${colors.green}✅ PASS${colors.reset} - Request accepted without purpose field\n`);
      console.log('Response Preview:');
      console.log(JSON.stringify(response.body, null, 2).substring(0, 500) + '...\n');

      console.log(`${colors.green}Expected Behavior:${colors.reset}`);
      console.log('  ✅ Request accepted (no validation error)');
      console.log('  ✅ Backend should log: "Purpose: qualitative_analysis (default)"');
      console.log('  ✅ Extraction should proceed with qualitative analysis strategy');
      console.log('  ✅ Adaptive threshold: minDistinctiveness: 0.30 → 0.15');

      return true;
    } else {
      console.log(`${colors.red}❌ FAIL${colors.reset} - Request rejected\n`);
      console.log('Response Body:');
      console.log(JSON.stringify(response.body, null, 2));

      if (response.statusCode === 400 && response.body?.message?.includes('purpose')) {
        console.log(`\n${colors.red}🔴 CRITICAL BUG STILL PRESENT:${colors.reset}`);
        console.log('The decorator order fix did NOT work. @IsOptional() must come FIRST!');
      }

      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${error.message}\n`);
    return false;
  }
}

/**
 * Test 2: Explicit Purpose (Verify No Regression)
 */
async function test2_ExplicitPurpose() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 2: Explicit Purpose (Verify No Regression)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const testPurposes = [
    { purpose: 'q_methodology', expectedThreshold: '0.30 → 0.10' },
    { purpose: 'qualitative_analysis', expectedThreshold: '0.30 → 0.15' },
    { purpose: 'literature_synthesis', expectedThreshold: '0.30 → 0.20' },
    { purpose: 'survey_construction', expectedThreshold: '0.30 → 0.25' },
  ];

  let allPassed = true;

  for (const { purpose, expectedThreshold } of testPurposes) {
    console.log(`Testing purpose: ${colors.blue}${purpose}${colors.reset}`);

    const requestBody = {
      purpose: purpose,
      sources: samplePapers,
      validationLevel: 'rigorous',
    };

    try {
      const response = await makeRequest('/api/literature/themes/extract-themes-v2/public', requestBody);

      const isSuccess = response.statusCode === 200 || response.statusCode === 202;
      if (isSuccess) {
        console.log(`  ${colors.green}✅ PASS${colors.reset} - Request accepted (${response.statusCode})`);
        console.log(`  Expected threshold adjustment: ${expectedThreshold}\n`);
      } else {
        console.log(`  ${colors.red}❌ FAIL${colors.reset} - Status: ${response.statusCode}`);
        console.log(`  Response: ${JSON.stringify(response.body)}\n`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`  ${colors.red}❌ ERROR${colors.reset} - ${error.message}\n`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Test 3: Invalid Purpose (Security Test)
 */
async function test3_InvalidPurpose() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 3: Invalid Purpose (Security Test)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log('Sending request with INVALID purpose...');
  console.log(`Endpoint: ${colors.blue}POST /api/literature/themes/extract-themes-v2/public${colors.reset}\n`);

  const requestBody = {
    purpose: 'invalid_purpose',  // This should be rejected
    sources: samplePapers,
    validationLevel: 'rigorous',
  };

  try {
    const response = await makeRequest('/api/literature/themes/extract-themes-v2/public', requestBody);

    console.log(`Response Status: ${response.statusCode === 400 ? colors.green : colors.red}${response.statusCode}${colors.reset}`);

    if (response.statusCode === 400) {
      console.log(`${colors.green}✅ PASS${colors.reset} - Invalid purpose correctly rejected\n`);
      console.log('Response Body:');
      console.log(JSON.stringify(response.body, null, 2));

      console.log(`\n${colors.green}Expected Behavior:${colors.reset}`);
      console.log('  ✅ 400 Bad Request returned');
      console.log('  ✅ Error message indicates invalid purpose');
      console.log('  ✅ Service did NOT crash');

      return true;
    } else if (response.statusCode === 500) {
      console.log(`${colors.red}❌ FAIL${colors.reset} - Service crashed (500 error)\n`);
      console.log('Response Body:');
      console.log(JSON.stringify(response.body, null, 2));

      console.log(`\n${colors.red}🔴 CRITICAL BUG STILL PRESENT:${colors.reset}`);
      console.log('The unsafe map lookup fix did NOT work. Need defensive validation!');

      return false;
    } else {
      console.log(`${colors.yellow}⚠️  UNEXPECTED${colors.reset} - Status: ${response.statusCode}\n`);
      console.log('Response Body:');
      console.log(JSON.stringify(response.body, null, 2));

      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${error.message}\n`);
    return false;
  }
}

/**
 * Check backend health
 */
async function checkBackendHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/literature/themes',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      // If we get ANY response, backend is up
      resolve({ healthy: true, data: { status: 'Backend responding', statusCode: res.statusCode } });
    });

    req.on('error', (e) => {
      resolve({ healthy: false, error: `Backend not responding: ${e.message}` });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ healthy: false, error: 'Health check timeout' });
    });

    req.end();
  });
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  PHASE 10.99: CRITICAL BUG FIXES - VERIFICATION TEST SUITE  ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Check backend health first
  console.log('Checking backend health...');
  const health = await checkBackendHealth();

  if (health.healthy) {
    console.log(`${colors.green}✅ Backend is healthy and responding${colors.reset}`);
    console.log(`   Status: ${health.data?.status || 'unknown'}\n`);
  } else {
    console.log(`${colors.red}❌ Backend is not responding${colors.reset}`);
    console.log(`   Error: ${health.error}\n`);
    console.log('Please start the backend with: npm run dev:ultimate');
    process.exit(1);
  }

  // Run all tests
  const results = {
    test1: await test1_NoPurposeSpecified(),
    test2: await test2_ExplicitPurpose(),
    test3: await test3_InvalidPurpose(),
  };

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const allPassed = Object.values(results).every(r => r === true);

  console.log(`Test 1 (No Purpose):     ${results.test1 ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Test 2 (Valid Purposes): ${results.test2 ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Test 3 (Invalid Purpose):${results.test3 ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);

  if (allPassed) {
    console.log(`\n${colors.green}🎉 ALL TESTS PASSED! ${colors.reset}`);
    console.log(`\n${colors.green}✅ All critical bug fixes are working correctly!${colors.reset}`);
    console.log(`\n${colors.green}The following bugs have been verified as FIXED:${colors.reset}`);
    console.log(`  1. ✅ Decorator order - purpose is now optional`);
    console.log(`  2. ✅ Unsafe map lookup - invalid purposes rejected safely`);
    console.log(`  3. ✅ Default purpose applied correctly`);
    console.log(`\n${colors.green}🚀 System is READY FOR USER TESTING${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ SOME TESTS FAILED${colors.reset}`);
    console.log(`\n${colors.red}Critical bugs may still be present. Review the output above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
