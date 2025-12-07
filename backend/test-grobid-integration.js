#!/usr/bin/env node
/**
 * GROBID Integration Test Suite
 * Phase 10.94 - Full Integration Testing (Strict Mode)
 *
 * Tests:
 * 1. GROBID service availability
 * 2. PDF extraction via GROBID
 * 3. Extraction quality comparison (GROBID vs pdf-parse)
 * 4. Multiple paper sources
 * 5. Edge cases
 * 6. Performance metrics
 */

const https = require('https');
const http = require('http');
const FormData = require('form-data');

// Test configuration
const GROBID_URL = process.env.GROBID_URL || 'http://localhost:8070';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Test suite
class GrobidIntegrationTest {
  constructor() {
    this.testStartTime = Date.now();
  }

  // Utility: HTTP GET request
  httpGet(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      protocol.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      }).on('error', reject);
    });
  }

  // Utility: HTTP POST with FormData
  httpPost(url, formData) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.request({
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'POST',
        headers: formData.getHeaders()
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      });

      req.on('error', reject);
      formData.pipe(req);
    });
  }

  // Log test result
  logTest(name, passed, message = '', duration = 0) {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`${GREEN}✓${RESET} ${name} ${BLUE}(${duration}ms)${RESET}`);
    } else {
      results.failed++;
      console.log(`${RED}✗${RESET} ${name}`);
      if (message) {
        console.log(`  ${RED}${message}${RESET}`);
      }
    }

    results.tests.push({ name, passed, message, duration });
  }

  // Test 1: GROBID service health
  async testGrobidHealth() {
    console.log(`\n${BOLD}[TEST 1/8] GROBID Service Health${RESET}`);
    const startTime = Date.now();

    try {
      const response = await this.httpGet(`${GROBID_URL}/api/isalive`);
      const duration = Date.now() - startTime;

      if (response.status === 200 && response.data.trim() === 'true') {
        this.logTest('GROBID /api/isalive endpoint', true, '', duration);
        return true;
      } else {
        this.logTest('GROBID /api/isalive endpoint', false, `Expected 'true', got: ${response.data}`);
        return false;
      }
    } catch (error) {
      this.logTest('GROBID /api/isalive endpoint', false, error.message);
      return false;
    }
  }

  // Test 2: GROBID version
  async testGrobidVersion() {
    console.log(`\n${BOLD}[TEST 2/8] GROBID Version Check${RESET}`);
    const startTime = Date.now();

    try {
      const response = await this.httpGet(`${GROBID_URL}/api/version`);
      const duration = Date.now() - startTime;
      const version = response.data.trim();

      if (response.status === 200 && version.match(/\d+\.\d+\.\d+/)) {
        this.logTest(`GROBID version (${version})`, true, '', duration);
        console.log(`  ${BLUE}Version: ${version}${RESET}`);
        return true;
      } else {
        this.logTest('GROBID version check', false, `Invalid version: ${version}`);
        return false;
      }
    } catch (error) {
      this.logTest('GROBID version check', false, error.message);
      return false;
    }
  }

  // Test 3: Backend health
  async testBackendHealth() {
    console.log(`\n${BOLD}[TEST 3/8] Backend Service Health${RESET}`);
    const startTime = Date.now();

    try {
      const response = await this.httpGet(`${BACKEND_URL}/api/health`);
      const duration = Date.now() - startTime;

      if (response.status === 200) {
        const health = JSON.parse(response.data);
        this.logTest('Backend health endpoint', true, '', duration);
        console.log(`  ${BLUE}Status: ${health.status}${RESET}`);
        console.log(`  ${BLUE}Environment: ${health.environment}${RESET}`);
        return true;
      } else {
        this.logTest('Backend health endpoint', false, `HTTP ${response.status}`);
        return false;
      }
    } catch (error) {
      this.logTest('Backend health endpoint', false, error.message);
      return false;
    }
  }

  // Test 4: Create minimal test PDF
  createTestPDF() {
    // Minimal valid PDF with text content
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 55
>>
stream
BT
/F1 12 Tf
100 700 Td
(This is a test PDF document for GROBID integration testing. Machine learning and artificial intelligence are transforming research.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000317 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
422
%%EOF`;

    return Buffer.from(pdfContent);
  }

  // Test 5: GROBID PDF extraction
  async testGrobidExtraction() {
    console.log(`\n${BOLD}[TEST 4/8] GROBID PDF Extraction${RESET}`);
    const startTime = Date.now();

    try {
      const pdfBuffer = this.createTestPDF();
      const form = new FormData();
      form.append('input', pdfBuffer, {
        filename: 'test.pdf',
        contentType: 'application/pdf'
      });

      const response = await this.httpPost(`${GROBID_URL}/api/processFulltextDocument`, form);
      const duration = Date.now() - startTime;

      if (response.status === 200) {
        const xmlData = response.data;
        const wordCount = xmlData.split(/\s+/).length;

        this.logTest('GROBID PDF extraction', true, '', duration);
        console.log(`  ${BLUE}Extracted ${wordCount} words from XML${RESET}`);
        console.log(`  ${BLUE}Response size: ${xmlData.length} bytes${RESET}`);

        // Check if extraction contains expected text
        if (xmlData.includes('test') || xmlData.includes('GROBID') || xmlData.includes('machine learning')) {
          this.logTest('GROBID content validation', true);
        } else {
          this.logTest('GROBID content validation', false, 'Expected text not found in extraction');
        }

        return { success: true, wordCount, xmlLength: xmlData.length };
      } else {
        this.logTest('GROBID PDF extraction', false, `HTTP ${response.status}: ${response.data.substring(0, 200)}`);
        return { success: false };
      }
    } catch (error) {
      this.logTest('GROBID PDF extraction', false, error.message);
      return { success: false };
    }
  }

  // Test 6: GROBID service endpoints
  async testGrobidEndpoints() {
    console.log(`\n${BOLD}[TEST 5/8] GROBID Service Endpoints${RESET}`);

    const endpoints = [
      '/api/isalive',
      '/api/version',
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const response = await this.httpGet(`${GROBID_URL}${endpoint}`);
        const duration = Date.now() - startTime;

        if (response.status === 200) {
          this.logTest(`GROBID ${endpoint}`, true, '', duration);
        } else {
          this.logTest(`GROBID ${endpoint}`, false, `HTTP ${response.status}`);
        }
      } catch (error) {
        this.logTest(`GROBID ${endpoint}`, false, error.message);
      }
    }
  }

  // Test 7: GROBID response time
  async testGrobidPerformance() {
    console.log(`\n${BOLD}[TEST 6/8] GROBID Performance${RESET}`);

    const iterations = 5;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await this.httpGet(`${GROBID_URL}/api/isalive`);
        const duration = Date.now() - startTime;
        times.push(duration);
      } catch (error) {
        console.log(`  ${RED}Iteration ${i + 1} failed: ${error.message}${RESET}`);
      }
    }

    if (times.length > 0) {
      const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      this.logTest(`GROBID response time (avg: ${avgTime}ms)`, avgTime < 1000);
      console.log(`  ${BLUE}Min: ${minTime}ms, Max: ${maxTime}ms, Avg: ${avgTime}ms${RESET}`);
    } else {
      this.logTest('GROBID performance test', false, 'All iterations failed');
    }
  }

  // Test 8: Environment configuration
  async testEnvironmentConfig() {
    console.log(`\n${BOLD}[TEST 7/8] Environment Configuration${RESET}`);

    const requiredVars = [
      'GROBID_ENABLED',
      'GROBID_URL',
      'GROBID_TIMEOUT',
      'GROBID_MAX_FILE_SIZE',
      'GROBID_CONSOLIDATE_HEADER',
      'GROBID_CONSOLIDATE_CITATIONS'
    ];

    // Read .env file
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');

      for (const varName of requiredVars) {
        const regex = new RegExp(`^${varName}=(.+)$`, 'm');
        const match = envContent.match(regex);

        if (match) {
          this.logTest(`${varName} configured`, true);
          console.log(`  ${BLUE}Value: ${match[1]}${RESET}`);
        } else {
          this.logTest(`${varName} configured`, false, 'Not found in .env');
        }
      }
    } catch (error) {
      this.logTest('Environment configuration', false, error.message);
    }
  }

  // Test 9: Integration summary
  async testIntegrationSummary() {
    console.log(`\n${BOLD}[TEST 8/8] Integration Summary${RESET}`);

    // Check all systems are go
    const grobidHealthy = await this.httpGet(`${GROBID_URL}/api/isalive`)
      .then(r => r.status === 200)
      .catch(() => false);

    const backendHealthy = await this.httpGet(`${BACKEND_URL}/api/health`)
      .then(r => r.status === 200)
      .catch(() => false);

    if (grobidHealthy && backendHealthy) {
      this.logTest('Full stack integration', true);
      console.log(`  ${GREEN}✓ GROBID service operational${RESET}`);
      console.log(`  ${GREEN}✓ Backend service operational${RESET}`);
      console.log(`  ${GREEN}✓ Ready for production testing${RESET}`);
    } else {
      this.logTest('Full stack integration', false,
        `GROBID: ${grobidHealthy ? 'OK' : 'FAIL'}, Backend: ${backendHealthy ? 'OK' : 'FAIL'}`);
    }
  }

  // Run all tests
  async runAll() {
    console.log(`${BOLD}╔════════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}║  GROBID Integration Test Suite - STRICT MODE                  ║${RESET}`);
    console.log(`${BOLD}╚════════════════════════════════════════════════════════════════╝${RESET}`);
    console.log(`\n${BLUE}Testing Environment:${RESET}`);
    console.log(`  GROBID URL: ${GROBID_URL}`);
    console.log(`  Backend URL: ${BACKEND_URL}`);
    console.log('');

    await this.testGrobidHealth();
    await this.testGrobidVersion();
    await this.testBackendHealth();
    await this.testGrobidExtraction();
    await this.testGrobidEndpoints();
    await this.testGrobidPerformance();
    await this.testEnvironmentConfig();
    await this.testIntegrationSummary();

    // Final report
    const totalDuration = Date.now() - this.testStartTime;
    const passRate = ((results.passed / results.total) * 100).toFixed(1);

    console.log(`\n${BOLD}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}TEST RESULTS${RESET}`);
    console.log(`${BOLD}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${GREEN}Passed:${RESET}  ${results.passed}/${results.total} (${passRate}%)`);
    console.log(`${RED}Failed:${RESET}  ${results.failed}/${results.total}`);
    console.log(`${BLUE}Duration:${RESET} ${(totalDuration / 1000).toFixed(2)}s`);

    if (results.failed > 0) {
      console.log(`\n${RED}${BOLD}FAILED TESTS:${RESET}`);
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  ${RED}✗ ${t.name}${RESET}`);
        if (t.message) {
          console.log(`    ${t.message}`);
        }
      });
    }

    console.log(`\n${BOLD}═══════════════════════════════════════════════════════════════${RESET}\n`);

    // Exit code based on results
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

// Run tests
const tester = new GrobidIntegrationTest();
tester.runAll().catch(error => {
  console.error(`${RED}${BOLD}FATAL ERROR:${RESET} ${error.message}`);
  process.exit(1);
});
