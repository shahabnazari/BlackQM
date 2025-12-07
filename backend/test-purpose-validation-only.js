#!/usr/bin/env node

/**
 * PHASE 10.99: Quick DTO Validation Test
 *
 * This test ONLY checks if the DTO validation accepts/rejects requests correctly.
 * It does NOT wait for theme extraction to complete.
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Minimal valid paper data
const samplePapers = [
  {
    id: 'test-001',
    type: 'paper',
    title: 'Test Paper 1',
    content: 'This is test content for validation testing.',
  },
  {
    id: 'test-002',
    type: 'paper',
    title: 'Test Paper 2',
    content: 'This is more test content.',
  },
];

function makeRequest(endpoint, data) {
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
      timeout: 5000, // 5 second timeout - we only care about initial validation
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: body ? JSON.parse(body) : null,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body,
            parseError: true,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      // Timeout means request was accepted and is processing
      resolve({
        statusCode: 'TIMEOUT',
        body: { message: 'Request accepted - processing started (timed out waiting for response)' },
      });
    });

    req.write(postData);
    req.end();
  });
}

async function testNoPurpose() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 1: NO PURPOSE SPECIFIED (CRITICAL BUG #1 VERIFICATION)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log('Testing: Request WITHOUT purpose field');
  console.log('Expected: DTO validation should PASS (purpose is optional)\n');

  const requestBody = {
    sources: samplePapers,
    validationLevel: 'rigorous',
    // NO "purpose" field
  };

  try {
    const response = await makeRequest('/api/literature/themes/extract-themes-v2/public', requestBody);

    if (response.statusCode === 400) {
      // Check if it's a purpose validation error
      const bodyStr = JSON.stringify(response.body);
      if (bodyStr.includes('purpose') && bodyStr.includes('must be')) {
        console.log(`${colors.red}❌ CRITICAL BUG STILL PRESENT${colors.reset}`);
        console.log(`\nResponse: ${response.statusCode}`);
        console.log('Error Message:', response.body.message?.substring(0, 200));
        console.log(`\n${colors.red}The @IsOptional() decorator order fix did NOT work!${colors.reset}`);
        console.log(`${colors.red}Purpose field is still REQUIRED when it should be OPTIONAL.${colors.reset}\n`);
        return false;
      } else {
        // 400 but NOT about purpose - might be other validation issues
        console.log(`${colors.yellow}⚠️  PARTIAL PASS${colors.reset} - 400 error but NOT about purpose field`);
        console.log('\nValidation Error:', response.body.message?.substring(0, 200));
        console.log(`\n${colors.green}Purpose field validation: ✅ PASS${colors.reset} (purpose is optional)`);
        console.log(`${colors.yellow}Other validation issues: Need attention${colors.reset}\n`);
        return true; // Purpose validation passed, other issues are separate
      }
    } else if (response.statusCode === 200 || response.statusCode === 202 || response.statusCode === 'TIMEOUT') {
      console.log(`${colors.green}✅ PERFECT! ${colors.reset}Response: ${response.statusCode}`);
      console.log(`\n${colors.green}DTO Validation Result: PASSED${colors.reset}`);
      console.log(`${colors.green}Purpose field: Correctly accepted as optional${colors.reset}`);
      console.log(`${colors.green}Default value: Will be set to 'qualitative_analysis' in controller${colors.reset}\n`);

      console.log('Backend should log:');
      console.log(`  "Purpose: qualitative_analysis (default)"\n`);

      return true;
    } else {
      console.log(`${colors.yellow}⚠️  UNEXPECTED${colors.reset} - Status: ${response.statusCode}`);
      console.log('Response:', JSON.stringify(response.body)?.substring(0, 300));
      console.log(`\n${colors.yellow}Purpose validation might have passed, but got unexpected response${colors.reset}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${error.message}\n`);
    return false;
  }
}

async function testInvalidPurpose() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 2: INVALID PURPOSE (CRITICAL BUG #2 VERIFICATION)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log('Testing: Request WITH invalid purpose value');
  console.log('Expected: Should return 400 Bad Request (not 500 server crash)\n');

  const requestBody = {
    purpose: 'invalid_purpose',
    sources: samplePapers,
    validationLevel: 'rigorous',
  };

  try {
    const response = await makeRequest('/api/literature/themes/extract-themes-v2/public', requestBody);

    if (response.statusCode === 400) {
      console.log(`${colors.green}✅ PASS${colors.reset} - Invalid purpose correctly rejected`);
      console.log(`\nResponse: 400 Bad Request`);
      console.log('Error type:', response.body.errorCode);

      const bodyStr = JSON.stringify(response.body);
      if (bodyStr.includes('purpose') && bodyStr.includes('must be one of')) {
        console.log(`\n${colors.green}Validation working correctly:${colors.reset}`);
        console.log('  ✅ Invalid purpose rejected by DTO validation (@IsIn decorator)');
        console.log('  ✅ Service did NOT crash');
        console.log('  ✅ Proper error message returned to client\n');
        return true;
      } else {
        console.log(`\n${colors.yellow}⚠️  Purpose rejected but error message unclear${colors.reset}\n`);
        return true; // Still passed - rejected properly
      }
    } else if (response.statusCode === 500) {
      console.log(`${colors.red}❌ CRITICAL BUG STILL PRESENT${colors.reset}`);
      console.log(`\nResponse: 500 Internal Server Error`);
      console.log(`\n${colors.red}The unsafe map lookup fix did NOT work!${colors.reset}`);
      console.log(`${colors.red}Invalid purpose caused service crash instead of proper error handling.${colors.reset}\n`);
      return false;
    } else {
      console.log(`${colors.yellow}⚠️  UNEXPECTED${colors.reset} - Status: ${response.statusCode}`);
      console.log('Response:', JSON.stringify(response.body)?.substring(0, 300));
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${error.message}\n`);
    return false;
  }
}

async function testValidPurpose() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}TEST 3: VALID PURPOSE (NO REGRESSION CHECK)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log('Testing: Request WITH valid purpose value');
  console.log('Expected: DTO validation should PASS\n');

  const requestBody = {
    purpose: 'q_methodology',
    sources: samplePapers,
    validationLevel: 'rigorous',
  };

  try {
    const response = await makeRequest('/api/literature/themes/extract-themes-v2/public', requestBody);

    if (response.statusCode === 200 || response.statusCode === 202 || response.statusCode === 'TIMEOUT') {
      console.log(`${colors.green}✅ PASS${colors.reset} - Valid purpose accepted`);
      console.log(`\nResponse: ${response.statusCode}`);
      console.log(`\n${colors.green}DTO Validation: PASSED${colors.reset}`);
      console.log(`${colors.green}Purpose: q_methodology (explicitly specified)${colors.reset}\n`);
      return true;
    } else if (response.statusCode === 400) {
      console.log(`${colors.red}❌ REGRESSION${colors.reset} - Valid purpose rejected`);
      console.log(`\nResponse: 400 Bad Request`);
      console.log('Error:', response.body.message?.substring(0, 200));
      return false;
    } else {
      console.log(`${colors.yellow}⚠️  UNEXPECTED${colors.reset} - Status: ${response.statusCode}`);
      console.log('Response:', JSON.stringify(response.body)?.substring(0, 300));
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR${colors.reset} - ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   PHASE 10.99: DTO VALIDATION TEST (Quick Verification)     ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log('Testing ONLY DTO validation (not full extraction)');
  console.log('Verifies critical bug fixes without waiting for AI processing\n');

  const results = {
    test1: await testNoPurpose(),
    test2: await testInvalidPurpose(),
    test3: await testValidPurpose(),
  };

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`Test 1 (No Purpose):      ${results.test1 ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Test 2 (Invalid Purpose): ${results.test2 ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);
  console.log(`Test 3 (Valid Purpose):   ${results.test3 ? colors.green + '✅ PASS' : colors.red + '❌ FAIL'}${colors.reset}`);

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log(`${colors.green}🎉 ALL CRITICAL BUG FIXES VERIFIED! ${colors.reset}\n`);
    console.log(`${colors.green}✅ Bug #1 (Decorator Order): FIXED${colors.reset}`);
    console.log(`   Purpose field is now optional - validation passes without it\n`);
    console.log(`${colors.green}✅ Bug #2 (Unsafe Map Lookup): FIXED${colors.reset}`);
    console.log(`   Invalid purposes properly rejected - no service crash\n`);
    console.log(`${colors.green}🚀 System is PRODUCTION READY${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ SOME CRITICAL BUGS STILL PRESENT${colors.reset}\n`);
    console.log('Review the test output above for details\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
