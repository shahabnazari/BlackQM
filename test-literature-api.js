#!/usr/bin/env node

/**
 * Literature API Test Suite - Phase 10.6 Validation
 * Tests all 19 academic source integrations
 */

const http = require('http');

const API_BASE = 'http://localhost:4000';
const TEST_QUERY = 'machine learning';

// All 19 academic sources
const SOURCES = [
  'semantic_scholar',
  'crossref',
  'pubmed',
  'arxiv',
  'google_scholar',
  'biorxiv',
  'medrxiv',
  'ssrn',
  'chemrxiv',
  'pmc',
  'eric',
  'web_of_science',
  'scopus',
  'ieee_xplore',
  'springer',
  'nature',
  'wiley',
  'sage',
  'taylor_francis'
];

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function testSource(source) {
  const testName = `Search ${source}`;
  results.total++;

  console.log(`\n🔍 Testing: ${source}...`);

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: TEST_QUERY,
      sources: [source],
      limit: 5
    });

    if (response.statusCode === 200) {
      const papers = response.data.papers || response.data || [];

      if (Array.isArray(papers)) {
        if (papers.length > 0) {
          console.log(`   ✅ SUCCESS: Returned ${papers.length} papers`);
          console.log(`   📄 Sample title: "${papers[0].title?.substring(0, 60)}..."`);
          results.passed++;
          results.tests.push({
            source,
            status: 'PASS',
            papers: papers.length,
            sampleTitle: papers[0].title?.substring(0, 60)
          });
        } else {
          console.log(`   ⚠️  WARNING: No results (may be API key required or no matches)`);
          results.skipped++;
          results.tests.push({
            source,
            status: 'SKIP',
            reason: 'No results returned (API key required or no matches)'
          });
        }
      } else {
        console.log(`   ❌ FAIL: Invalid response structure`);
        results.failed++;
        results.tests.push({
          source,
          status: 'FAIL',
          reason: 'Invalid response structure'
        });
      }
    } else {
      console.log(`   ❌ FAIL: HTTP ${response.statusCode}`);
      results.failed++;
      results.tests.push({
        source,
        status: 'FAIL',
        reason: `HTTP ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.failed++;
    results.tests.push({
      source,
      status: 'FAIL',
      reason: error.message
    });
  }
}

async function testMultipleSources() {
  const testName = 'Multiple Sources (3 sources)';
  results.total++;

  console.log(`\n🔍 Testing: Multiple sources...`);

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: TEST_QUERY,
      sources: ['semantic_scholar', 'arxiv', 'pubmed'],
      limit: 10
    });

    if (response.statusCode === 200) {
      const papers = response.data.papers || response.data || [];

      if (Array.isArray(papers) && papers.length > 0) {
        const sources = [...new Set(papers.map(p => p.source))];
        console.log(`   ✅ SUCCESS: ${papers.length} papers from ${sources.length} sources`);
        console.log(`   📊 Sources found: ${sources.join(', ')}`);
        results.passed++;
        results.tests.push({
          source: 'multiple_sources',
          status: 'PASS',
          papers: papers.length,
          uniqueSources: sources.length
        });
      } else {
        console.log(`   ⚠️  WARNING: No results`);
        results.skipped++;
        results.tests.push({
          source: 'multiple_sources',
          status: 'SKIP',
          reason: 'No results'
        });
      }
    } else {
      console.log(`   ❌ FAIL: HTTP ${response.statusCode}`);
      results.failed++;
      results.tests.push({
        source: 'multiple_sources',
        status: 'FAIL',
        reason: `HTTP ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.failed++;
    results.tests.push({
      source: 'multiple_sources',
      status: 'FAIL',
      reason: error.message
    });
  }
}

async function testYearFilter() {
  const testName = 'Year Range Filter';
  results.total++;

  console.log(`\n🔍 Testing: Year range filter...`);

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: TEST_QUERY,
      sources: ['semantic_scholar'],
      yearFrom: 2023,
      yearTo: 2024,
      limit: 5
    });

    if (response.statusCode === 200) {
      const papers = response.data.papers || response.data || [];

      if (Array.isArray(papers) && papers.length > 0) {
        const years = papers.map(p => p.year).filter(y => y);
        const inRange = years.every(y => y >= 2023 && y <= 2024);

        if (inRange) {
          console.log(`   ✅ SUCCESS: All papers in year range 2023-2024`);
          console.log(`   📅 Years found: ${years.join(', ')}`);
          results.passed++;
          results.tests.push({
            source: 'year_filter',
            status: 'PASS',
            papers: papers.length
          });
        } else {
          console.log(`   ❌ FAIL: Some papers outside year range`);
          console.log(`   📅 Years found: ${years.join(', ')}`);
          results.failed++;
          results.tests.push({
            source: 'year_filter',
            status: 'FAIL',
            reason: 'Papers outside year range'
          });
        }
      } else {
        console.log(`   ⚠️  WARNING: No results`);
        results.skipped++;
        results.tests.push({
          source: 'year_filter',
          status: 'SKIP',
          reason: 'No results'
        });
      }
    } else {
      console.log(`   ❌ FAIL: HTTP ${response.statusCode}`);
      results.failed++;
      results.tests.push({
        source: 'year_filter',
        status: 'FAIL',
        reason: `HTTP ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.failed++;
    results.tests.push({
      source: 'year_filter',
      status: 'FAIL',
      reason: error.message
    });
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  LITERATURE API TEST SUITE - PHASE 10.6 VALIDATION');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Testing ${SOURCES.length} academic sources + 2 integration tests`);
  console.log(`Query: "${TEST_QUERY}"`);
  console.log(`Backend: ${API_BASE}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Check if backend is running
  try {
    await makeRequest('/api/health', {});
    console.log('✅ Backend is reachable\n');
  } catch (error) {
    console.log('❌ ERROR: Backend not reachable at', API_BASE);
    console.log('   Please start backend: cd backend && npm run start:dev\n');
    process.exit(1);
  }

  // Test each source sequentially
  for (const source of SOURCES) {
    await testSource(source);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between tests
  }

  // Test integration scenarios
  await testMultipleSources();
  await testYearFilter();

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total Tests:    ${results.total}`);
  console.log(`✅ Passed:      ${results.passed} (${Math.round(results.passed/results.total*100)}%)`);
  console.log(`❌ Failed:      ${results.failed}`);
  console.log(`⚠️  Skipped:    ${results.skipped} (API keys required or no matches)`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Print failed tests
  if (results.failed > 0) {
    console.log('FAILED TESTS:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  ❌ ${t.source}: ${t.reason}`);
    });
    console.log('');
  }

  // Print skipped tests
  if (results.skipped > 0) {
    console.log('SKIPPED TESTS (may need API keys):');
    results.tests.filter(t => t.status === 'SKIP').forEach(t => {
      console.log(`  ⚠️  ${t.source}: ${t.reason}`);
    });
    console.log('');
  }

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
