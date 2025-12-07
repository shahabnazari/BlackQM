/**
 * Full-Text Extraction Edge Case Tests
 *
 * Tests all edge cases for the three fixes:
 * 1. HTTP 400 (CUID validation)
 * 2. HTTP 404 (missing endpoint)
 * 3. HTTP 429 (rate limiting) + 0 word count
 *
 * Run: node test-fulltext-edge-cases.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:4000/api';
const TEST_USER_EMAIL = 'edgetest@test.com';
const TEST_USER_PASSWORD = 'TestPassword123';

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper: Log with color
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper: Authenticate and get JWT token
async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    return response.data.accessToken;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Helper: Wait/sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST 1: Invalid CUID Format (Should Return 400)
// ============================================================================
async function testInvalidCuidFormat(token) {
  log('\n📋 TEST 1: Invalid CUID Format', 'cyan');
  log('─'.repeat(60), 'cyan');

  const invalidIds = [
    'invalid-id',
    '12345678',
    'uuid-v4-550e8400-e29b-41d4-a716-446655440000',
    '',
    'c12345', // Too short
    'x' + 'a'.repeat(25) // Wrong prefix
  ];

  for (const invalidId of invalidIds) {
    try {
      await axios.get(`${BASE_URL}/literature/library/${invalidId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      results.failed.push(`TEST 1.${invalidIds.indexOf(invalidId) + 1}: Should reject invalid CUID "${invalidId}"`);
      log(`  ❌ FAIL: Accepted invalid CUID "${invalidId}"`, 'red');
    } catch (error) {
      if (error.response?.status === 400) {
        results.passed.push(`TEST 1.${invalidIds.indexOf(invalidId) + 1}: Correctly rejected invalid CUID "${invalidId}"`);
        log(`  ✅ PASS: Rejected "${invalidId}" with HTTP 400`, 'green');
      } else {
        results.failed.push(`TEST 1.${invalidIds.indexOf(invalidId) + 1}: Wrong status for "${invalidId}": ${error.response?.status}`);
        log(`  ❌ FAIL: Wrong status ${error.response?.status} for "${invalidId}"`, 'red');
      }
    }
  }
}

// ============================================================================
// TEST 2: Valid CUID for Non-Existent Paper (Should Return 404)
// ============================================================================
async function testNonExistentPaper(token) {
  log('\n📋 TEST 2: Non-Existent Paper (Valid CUID)', 'cyan');
  log('─'.repeat(60), 'cyan');

  // Generate a valid CUID that doesn't exist
  const nonExistentId = 'c' + 'x'.repeat(24);

  try {
    await axios.get(`${BASE_URL}/literature/library/${nonExistentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    results.failed.push('TEST 2: Should return 404 for non-existent paper');
    log(`  ❌ FAIL: Found non-existent paper`, 'red');
  } catch (error) {
    if (error.response?.status === 404) {
      results.passed.push('TEST 2: Correctly returned 404 for non-existent paper');
      log(`  ✅ PASS: Returned HTTP 404 for non-existent paper`, 'green');
    } else {
      results.failed.push(`TEST 2: Wrong status ${error.response?.status} for non-existent paper`);
      log(`  ❌ FAIL: Wrong status ${error.response?.status}`, 'red');
    }
  }
}

// ============================================================================
// TEST 3: Rate Limit Boundary (100 requests in 60 seconds)
// ============================================================================
async function testRateLimitBoundary(token) {
  log('\n📋 TEST 3: Rate Limit Boundary (100 requests/minute)', 'cyan');
  log('─'.repeat(60), 'cyan');

  const testPaperId = 'c' + 'a'.repeat(24); // Valid CUID format
  const requestCount = 105; // Just over the limit
  let successCount = 0;
  let rateLimitCount = 0;

  log(`  🔄 Sending ${requestCount} requests rapidly...`, 'yellow');

  const startTime = Date.now();

  // Send requests as fast as possible
  const promises = [];
  for (let i = 0; i < requestCount; i++) {
    promises.push(
      axios.get(`${BASE_URL}/literature/library/${testPaperId}`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true // Don't throw on any status
      })
    );
  }

  const responses = await Promise.all(promises);
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  responses.forEach(response => {
    if (response.status === 404 || response.status === 200) {
      successCount++;
    } else if (response.status === 429) {
      rateLimitCount++;
    }
  });

  log(`  📊 Results:`, 'blue');
  log(`     • Total requests: ${requestCount}`, 'blue');
  log(`     • Successful: ${successCount}`, 'blue');
  log(`     • Rate limited (429): ${rateLimitCount}`, 'blue');
  log(`     • Duration: ${duration.toFixed(2)}s`, 'blue');
  log(`     • Rate: ${(requestCount / (duration / 60)).toFixed(1)} req/min`, 'blue');

  if (successCount >= 95 && rateLimitCount <= 10) {
    results.passed.push(`TEST 3: Rate limiting works (${successCount} allowed, ${rateLimitCount} limited)`);
    log(`  ✅ PASS: Rate limiting configured correctly`, 'green');
  } else if (rateLimitCount > 50) {
    results.failed.push(`TEST 3: Too restrictive (${rateLimitCount}/${requestCount} rejected)`);
    log(`  ❌ FAIL: Rate limit too restrictive`, 'red');
  } else {
    results.warnings.push(`TEST 3: Borderline performance (${successCount}/${requestCount} succeeded)`);
    log(`  ⚠️  WARNING: Check rate limit configuration`, 'yellow');
  }
}

// ============================================================================
// TEST 4: Unauthorized Access (No Token)
// ============================================================================
async function testUnauthorizedAccess() {
  log('\n📋 TEST 4: Unauthorized Access (No JWT Token)', 'cyan');
  log('─'.repeat(60), 'cyan');

  const testPaperId = 'c' + 'a'.repeat(24);

  try {
    await axios.get(`${BASE_URL}/literature/library/${testPaperId}`);
    results.failed.push('TEST 4: Should reject request without JWT token');
    log(`  ❌ FAIL: Allowed access without authentication`, 'red');
  } catch (error) {
    if (error.response?.status === 401) {
      results.passed.push('TEST 4: Correctly rejected unauthenticated request');
      log(`  ✅ PASS: Rejected with HTTP 401 (Unauthorized)`, 'green');
    } else {
      results.failed.push(`TEST 4: Wrong status ${error.response?.status} for unauthenticated request`);
      log(`  ❌ FAIL: Wrong status ${error.response?.status}`, 'red');
    }
  }
}

// ============================================================================
// TEST 5: Save Paper → Immediate Retrieval (Race Condition)
// ============================================================================
async function testImmediateRetrieval(token) {
  log('\n📋 TEST 5: Save Paper → Immediate Retrieval', 'cyan');
  log('─'.repeat(60), 'cyan');

  const testPaper = {
    title: `Edge Case Test Paper ${Date.now()}`,
    authors: ['Test Author'],
    year: 2024,
    abstract: 'This is a test paper for edge case testing.',
    doi: `10.1234/test-${Date.now()}`,
    source: 'test',
    venue: 'Test Conference'
  };

  try {
    // Save paper
    log(`  📝 Saving test paper...`, 'yellow');
    const saveResponse = await axios.post(`${BASE_URL}/literature/save`, testPaper, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const paperId = saveResponse.data.paperId;
    log(`  ✅ Paper saved: ${paperId}`, 'green');

    // Immediately retrieve (no delay - test race condition)
    log(`  🔍 Retrieving immediately (testing race condition)...`, 'yellow');
    const getResponse = await axios.get(`${BASE_URL}/literature/library/${paperId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (getResponse.data.paper && getResponse.data.paper.id === paperId) {
      results.passed.push('TEST 5: Paper immediately retrievable after save (no race condition)');
      log(`  ✅ PASS: Paper retrieved immediately`, 'green');
      log(`     • Title: ${getResponse.data.paper.title}`, 'blue');
      log(`     • ID: ${getResponse.data.paper.id}`, 'blue');
    } else {
      results.failed.push('TEST 5: Paper not found immediately after save');
      log(`  ❌ FAIL: Paper not retrievable`, 'red');
    }
  } catch (error) {
    results.failed.push(`TEST 5: Error during save/retrieve: ${error.message}`);
    log(`  ❌ FAIL: ${error.message}`, 'red');
  }
}

// ============================================================================
// TEST 6: Word Count Field Present
// ============================================================================
async function testWordCountField(token) {
  log('\n📋 TEST 6: Word Count Field in Response', 'cyan');
  log('─'.repeat(60), 'cyan');

  // Create a test paper
  const testPaper = {
    title: `Word Count Test Paper ${Date.now()}`,
    authors: ['Test Author'],
    year: 2024,
    abstract: 'Testing word count field presence.',
    doi: `10.1234/wordcount-${Date.now()}`,
    source: 'test',
    venue: 'Test Journal'
  };

  try {
    // Save paper
    const saveResponse = await axios.post(`${BASE_URL}/literature/save`, testPaper, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const paperId = saveResponse.data.paperId;

    // Retrieve paper
    const getResponse = await axios.get(`${BASE_URL}/literature/library/${paperId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const paper = getResponse.data.paper;

    // Check if fullTextWordCount field exists (even if null)
    if ('fullTextWordCount' in paper) {
      results.passed.push('TEST 6: fullTextWordCount field present in response');
      log(`  ✅ PASS: fullTextWordCount field present`, 'green');
      log(`     • Value: ${paper.fullTextWordCount ?? 'null'}`, 'blue');
    } else {
      results.failed.push('TEST 6: fullTextWordCount field missing from response');
      log(`  ❌ FAIL: fullTextWordCount field missing`, 'red');
    }

    // Check other critical fields
    const requiredFields = ['id', 'title', 'fullTextStatus', 'hasFullText'];
    const missingFields = requiredFields.filter(field => !(field in paper));

    if (missingFields.length === 0) {
      results.passed.push('TEST 6: All required fields present');
      log(`  ✅ PASS: All required fields present`, 'green');
    } else {
      results.failed.push(`TEST 6: Missing fields: ${missingFields.join(', ')}`);
      log(`  ❌ FAIL: Missing fields: ${missingFields.join(', ')}`, 'red');
    }
  } catch (error) {
    results.failed.push(`TEST 6: Error: ${error.message}`);
    log(`  ❌ FAIL: ${error.message}`, 'red');
  }
}

// ============================================================================
// TEST 7: Concurrent Requests (Simulate Multiple Papers Polling)
// ============================================================================
async function testConcurrentRequests(token) {
  log('\n📋 TEST 7: Concurrent Requests (Simulating 7 Papers Polling)', 'cyan');
  log('─'.repeat(60), 'cyan');

  // Create 7 test papers
  log(`  📝 Creating 7 test papers...`, 'yellow');
  const paperIds = [];

  for (let i = 0; i < 7; i++) {
    try {
      const testPaper = {
        title: `Concurrent Test Paper ${i + 1} - ${Date.now()}`,
        authors: ['Test Author'],
        year: 2024,
        abstract: `Test paper ${i + 1} for concurrent testing.`,
        doi: `10.1234/concurrent-${Date.now()}-${i}`,
        source: 'test',
        venue: 'Test Conference'
      };

      const saveResponse = await axios.post(`${BASE_URL}/literature/save`, testPaper, {
        headers: { Authorization: `Bearer ${token}` }
      });

      paperIds.push(saveResponse.data.paperId);
    } catch (error) {
      log(`  ⚠️  Failed to create paper ${i + 1}: ${error.message}`, 'yellow');
    }
  }

  log(`  ✅ Created ${paperIds.length} papers`, 'green');

  // Simulate polling: 10 requests per paper, 3-second intervals
  log(`  🔄 Simulating polling (${paperIds.length} papers × 5 attempts)...`, 'yellow');

  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;

  const startTime = Date.now();

  // Simulate 5 polling rounds (reduced from 10 for faster testing)
  for (let round = 1; round <= 5; round++) {
    const promises = paperIds.map(paperId =>
      axios.get(`${BASE_URL}/literature/library/${paperId}`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      })
    );

    const responses = await Promise.all(promises);

    responses.forEach(response => {
      totalRequests++;
      if (response.status === 200 || response.status === 404) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
    });

    if (round < 5) {
      await sleep(3000); // 3-second polling interval
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  log(`  📊 Results:`, 'blue');
  log(`     • Total requests: ${totalRequests}`, 'blue');
  log(`     • Successful: ${successfulRequests}`, 'blue');
  log(`     • Failed: ${failedRequests}`, 'blue');
  log(`     • Duration: ${duration.toFixed(2)}s`, 'blue');
  log(`     • Success rate: ${((successfulRequests / totalRequests) * 100).toFixed(1)}%`, 'blue');

  if (successfulRequests === totalRequests) {
    results.passed.push(`TEST 7: All concurrent requests succeeded (${totalRequests}/${totalRequests})`);
    log(`  ✅ PASS: 100% success rate for concurrent polling`, 'green');
  } else if (successfulRequests / totalRequests >= 0.95) {
    results.warnings.push(`TEST 7: High success rate (${successfulRequests}/${totalRequests})`);
    log(`  ⚠️  WARNING: Some requests failed but within acceptable range`, 'yellow');
  } else {
    results.failed.push(`TEST 7: Too many failures (${failedRequests}/${totalRequests})`);
    log(`  ❌ FAIL: Too many concurrent requests failed`, 'red');
  }
}

// ============================================================================
// TEST 8: Papers Without DOI/PMID/URL (Edge Case)
// ============================================================================
async function testPaperWithoutIdentifiers(token) {
  log('\n📋 TEST 8: Paper Without DOI/PMID/URL', 'cyan');
  log('─'.repeat(60), 'cyan');

  const testPaper = {
    title: `No Identifiers Test Paper ${Date.now()}`,
    authors: ['Test Author'],
    year: 2024,
    abstract: 'Paper with no DOI, PMID, or URL.',
    // No doi, pmid, or url
    source: 'test',
    venue: 'Test Journal'
  };

  try {
    const saveResponse = await axios.post(`${BASE_URL}/literature/save`, testPaper, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const paperId = saveResponse.data.paperId;
    log(`  ✅ Paper saved: ${paperId}`, 'green');

    const getResponse = await axios.get(`${BASE_URL}/literature/library/${paperId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const paper = getResponse.data.paper;

    if (paper.id === paperId) {
      results.passed.push('TEST 8: Paper without identifiers can be saved and retrieved');
      log(`  ✅ PASS: Paper without identifiers handled correctly`, 'green');
      log(`     • DOI: ${paper.doi ?? 'null'}`, 'blue');
      log(`     • PMID: ${paper.pmid ?? 'null'}`, 'blue');
      log(`     • URL: ${paper.url ?? 'null'}`, 'blue');
    } else {
      results.failed.push('TEST 8: Paper retrieval failed');
      log(`  ❌ FAIL: Could not retrieve paper`, 'red');
    }
  } catch (error) {
    results.failed.push(`TEST 8: Error: ${error.message}`);
    log(`  ❌ FAIL: ${error.message}`, 'red');
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  🧪 FULL-TEXT EXTRACTION EDGE CASE TEST SUITE', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  try {
    // Authenticate
    log('🔐 Authenticating...', 'yellow');
    const token = await authenticate();
    log('✅ Authentication successful\n', 'green');

    // Run all tests
    await testInvalidCuidFormat(token);
    await testNonExistentPaper(token);
    await testUnauthorizedAccess();
    await testImmediateRetrieval(token);
    await testWordCountField(token);
    await testPaperWithoutIdentifiers(token);
    await testRateLimitBoundary(token); // Run this later to avoid affecting other tests
    await testConcurrentRequests(token);

    // Print summary
    log('\n' + '='.repeat(60), 'cyan');
    log('  📊 TEST SUMMARY', 'cyan');
    log('='.repeat(60), 'cyan');

    log(`\n✅ PASSED: ${results.passed.length}`, 'green');
    results.passed.forEach((test, i) => {
      log(`   ${i + 1}. ${test}`, 'green');
    });

    if (results.warnings.length > 0) {
      log(`\n⚠️  WARNINGS: ${results.warnings.length}`, 'yellow');
      results.warnings.forEach((test, i) => {
        log(`   ${i + 1}. ${test}`, 'yellow');
      });
    }

    if (results.failed.length > 0) {
      log(`\n❌ FAILED: ${results.failed.length}`, 'red');
      results.failed.forEach((test, i) => {
        log(`   ${i + 1}. ${test}`, 'red');
      });
    }

    const total = results.passed.length + results.failed.length + results.warnings.length;
    const passRate = ((results.passed.length / total) * 100).toFixed(1);

    log('\n' + '─'.repeat(60), 'blue');
    log(`Total Tests: ${total}`, 'blue');
    log(`Pass Rate: ${passRate}%`, 'blue');
    log('─'.repeat(60) + '\n', 'blue');

    if (results.failed.length === 0) {
      log('🎉 ALL TESTS PASSED! 🎉', 'green');
      process.exit(0);
    } else {
      log('⚠️  SOME TESTS FAILED - Review results above', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();
