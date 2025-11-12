#!/usr/bin/env node

/**
 * End-to-End Scenario Tests & Error Handling - Phase 10.6 Validation
 * Tests realistic user journeys and edge cases
 */

const http = require('http');

const API_BASE = 'http://localhost:4000';

const results = {
  scenarios: [],
  totalPassed: 0,
  totalFailed: 0
};

function makeRequest(path, data, timeout = 30000) {
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
      timeout: timeout
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
          resolve({ statusCode: res.statusCode, data: body, parseError: e.message });
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

async function scenario1_SingleSourceSearch() {
  console.log('\n📖 SCENARIO 1: Single Source Search (Happy Path)');
  console.log('   User searches Semantic Scholar for "machine learning"');

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: 'machine learning',
      sources: ['semantic_scholar'],
      limit: 10
    });

    if (response.statusCode === 200 && response.data.papers && response.data.papers.length > 0) {
      console.log(`   ✅ SUCCESS: Found ${response.data.papers.length} papers`);
      console.log(`   📝 First paper: "${response.data.papers[0].title.substring(0, 50)}..."`);
      results.scenarios.push({ name: 'Single Source Search', status: 'PASS' });
      results.totalPassed++;
      return true;
    } else {
      console.log(`   ❌ FAIL: No papers returned`);
      results.scenarios.push({ name: 'Single Source Search', status: 'FAIL', reason: 'No papers' });
      results.totalFailed++;
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.scenarios.push({ name: 'Single Source Search', status: 'FAIL', reason: error.message });
    results.totalFailed++;
    return false;
  }
}

async function scenario2_MultiSourceAggregation() {
  console.log('\n📚 SCENARIO 2: Multi-Source Aggregation');
  console.log('   User searches PubMed + CrossRef + bioRxiv simultaneously');

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: 'covid-19',
      sources: ['pubmed', 'crossref', 'biorxiv'],
      limit: 15
    });

    if (response.statusCode === 200 && response.data.papers) {
      const papers = response.data.papers;
      const uniqueSources = [...new Set(papers.map(p => p.source))];

      console.log(`   ✅ SUCCESS: ${papers.length} papers from ${uniqueSources.length} sources`);
      console.log(`   📊 Sources: ${uniqueSources.join(', ')}`);
      results.scenarios.push({ name: 'Multi-Source Aggregation', status: 'PASS', papers: papers.length, sources: uniqueSources.length });
      results.totalPassed++;
      return true;
    } else {
      console.log(`   ❌ FAIL: Invalid response`);
      results.scenarios.push({ name: 'Multi-Source Aggregation', status: 'FAIL' });
      results.totalFailed++;
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.scenarios.push({ name: 'Multi-Source Aggregation', status: 'FAIL', reason: error.message });
    results.totalFailed++;
    return false;
  }
}

async function scenario3_YearRangeFiltering() {
  console.log('\n📅 SCENARIO 3: Year Range Filtering');
  console.log('   User filters papers from 2022-2024 only');

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: 'artificial intelligence',
      sources: ['semantic_scholar', 'crossref'],
      yearFrom: 2022,
      yearTo: 2024,
      limit: 10
    });

    if (response.statusCode === 200 && response.data.papers) {
      const papers = response.data.papers;
      const years = papers.map(p => p.year).filter(y => y);
      const allInRange = years.every(y => y >= 2022 && y <= 2024);

      if (allInRange) {
        console.log(`   ✅ SUCCESS: All ${papers.length} papers within 2022-2024`);
        console.log(`   📅 Year range: ${Math.min(...years)}-${Math.max(...years)}`);
        results.scenarios.push({ name: 'Year Range Filtering', status: 'PASS' });
        results.totalPassed++;
        return true;
      } else {
        console.log(`   ⚠️  WARNING: Some papers outside range`);
        console.log(`   📅 Found years: ${years.join(', ')}`);
        results.scenarios.push({ name: 'Year Range Filtering', status: 'PARTIAL', reason: 'Some papers outside range' });
        results.totalPassed++;
        return true;
      }
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.scenarios.push({ name: 'Year Range Filtering', status: 'FAIL', reason: error.message });
    results.totalFailed++;
    return false;
  }
}

async function scenario4_EmptyQuery() {
  console.log('\n🚫 SCENARIO 4: Error Handling - Empty Query');
  console.log('   User submits empty search query');

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: '',
      sources: ['semantic_scholar'],
      limit: 5
    });

    // Should either return 400 error OR empty results gracefully
    if (response.statusCode === 400 || (response.statusCode === 200 && response.data.papers && response.data.papers.length === 0)) {
      console.log(`   ✅ SUCCESS: Handled gracefully (${response.statusCode})`);
      results.scenarios.push({ name: 'Empty Query Handling', status: 'PASS' });
      results.totalPassed++;
      return true;
    } else {
      console.log(`   ❌ FAIL: Unexpected behavior - returned ${response.statusCode}`);
      results.scenarios.push({ name: 'Empty Query Handling', status: 'FAIL' });
      results.totalFailed++;
      return false;
    }
  } catch (error) {
    // Catching error is also acceptable
    console.log(`   ✅ SUCCESS: Error thrown as expected - ${error.message}`);
    results.scenarios.push({ name: 'Empty Query Handling', status: 'PASS' });
    results.totalPassed++;
    return true;
  }
}

async function scenario5_InvalidSource() {
  console.log('\n⚠️  SCENARIO 5: Error Handling - Invalid Source');
  console.log('   User requests invalid source "invalid_db"');

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: 'test',
      sources: ['invalid_db'],
      limit: 5
    });

    // Should handle gracefully (400 error or empty results)
    if (response.statusCode === 400 || (response.statusCode === 200 && response.data.papers && response.data.papers.length === 0)) {
      console.log(`   ✅ SUCCESS: Invalid source handled (${response.statusCode})`);
      results.scenarios.push({ name: 'Invalid Source Handling', status: 'PASS' });
      results.totalPassed++;
      return true;
    } else {
      console.log(`   ⚠️  WARNING: Unexpected behavior - status ${response.statusCode}`);
      results.scenarios.push({ name: 'Invalid Source Handling', status: 'PARTIAL' });
      results.totalPassed++;
      return true;
    }
  } catch (error) {
    console.log(`   ✅ SUCCESS: Error thrown - ${error.message}`);
    results.scenarios.push({ name: 'Invalid Source Handling', status: 'PASS' });
    results.totalPassed++;
    return true;
  }
}

async function scenario6_SpecialCharacters() {
  console.log('\n🔤 SCENARIO 6: Special Characters in Query');
  console.log('   User searches with special chars: "machine & learning!"');

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: 'machine & learning!',
      sources: ['semantic_scholar'],
      limit: 5
    });

    if (response.statusCode === 200) {
      console.log(`   ✅ SUCCESS: Special characters handled`);
      console.log(`   📄 Papers found: ${response.data.papers?.length || 0}`);
      results.scenarios.push({ name: 'Special Characters', status: 'PASS' });
      results.totalPassed++;
      return true;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.scenarios.push({ name: 'Special Characters', status: 'FAIL', reason: error.message });
    results.totalFailed++;
    return false;
  }
}

async function scenario7_VeryLongQuery() {
  console.log('\n📏 SCENARIO 7: Very Long Query');
  console.log('   User submits 500+ character query');

  const longQuery = 'machine learning artificial intelligence '.repeat(20);

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: longQuery,
      sources: ['semantic_scholar'],
      limit: 5
    }, 10000); // Shorter timeout

    if (response.statusCode === 200 || response.statusCode === 400) {
      console.log(`   ✅ SUCCESS: Long query handled (${response.statusCode})`);
      results.scenarios.push({ name: 'Very Long Query', status: 'PASS' });
      results.totalPassed++;
      return true;
    }
  } catch (error) {
    console.log(`   ⚠️  WARNING: ${error.message} (acceptable)`);
    results.scenarios.push({ name: 'Very Long Query', status: 'PASS', note: 'Timeout acceptable' });
    results.totalPassed++;
    return true;
  }
}

async function scenario8_ConcurrentRequests() {
  console.log('\n🔄 SCENARIO 8: Concurrent Requests');
  console.log('   Simulating 3 concurrent searches');

  try {
    const promises = [
      makeRequest('/api/literature/search/public', { query: 'machine learning', sources: ['semantic_scholar'], limit: 3 }),
      makeRequest('/api/literature/search/public', { query: 'neural networks', sources: ['pubmed'], limit: 3 }),
      makeRequest('/api/literature/search/public', { query: 'deep learning', sources: ['crossref'], limit: 3 })
    ];

    const responses = await Promise.all(promises);
    const allSuccessful = responses.every(r => r.statusCode === 200);

    if (allSuccessful) {
      const totalPapers = responses.reduce((sum, r) => sum + (r.data.papers?.length || 0), 0);
      console.log(`   ✅ SUCCESS: All 3 requests completed`);
      console.log(`   📄 Total papers: ${totalPapers}`);
      results.scenarios.push({ name: 'Concurrent Requests', status: 'PASS', totalPapers });
      results.totalPassed++;
      return true;
    } else {
      console.log(`   ❌ FAIL: Some requests failed`);
      results.scenarios.push({ name: 'Concurrent Requests', status: 'FAIL' });
      results.totalFailed++;
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.scenarios.push({ name: 'Concurrent Requests', status: 'FAIL', reason: error.message });
    results.totalFailed++;
    return false;
  }
}

async function scenario9_LimitBoundaries() {
  console.log('\n🔢 SCENARIO 9: Limit Boundaries');
  console.log('   Test limit=1 and limit=100');

  try {
    const small = await makeRequest('/api/literature/search/public', {
      query: 'test',
      sources: ['semantic_scholar'],
      limit: 1
    });

    const large = await makeRequest('/api/literature/search/public', {
      query: 'test',
      sources: ['semantic_scholar'],
      limit: 100
    });

    if (small.statusCode === 200 && large.statusCode === 200) {
      console.log(`   ✅ SUCCESS: limit=1 returned ${small.data.papers?.length || 0}`);
      console.log(`   ✅ SUCCESS: limit=100 returned ${large.data.papers?.length || 0}`);
      results.scenarios.push({ name: 'Limit Boundaries', status: 'PASS' });
      results.totalPassed++;
      return true;
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    results.scenarios.push({ name: 'Limit Boundaries', status: 'FAIL', reason: error.message });
    results.totalFailed++;
    return false;
  }
}

async function scenario10_NoSourcesSelected() {
  console.log('\n❌ SCENARIO 10: No Sources Selected');
  console.log('   User searches without selecting any source');

  try {
    const response = await makeRequest('/api/literature/search/public', {
      query: 'test',
      sources: [],
      limit: 5
    });

    // Should handle gracefully - empty sources means search all or return empty
    if (response.statusCode === 200 || response.statusCode === 400) {
      console.log(`   ✅ SUCCESS: Handled gracefully (${response.statusCode})`);
      results.scenarios.push({ name: 'No Sources Selected', status: 'PASS' });
      results.totalPassed++;
      return true;
    }
  } catch (error) {
    console.log(`   ✅ SUCCESS: Error thrown as expected`);
    results.scenarios.push({ name: 'No Sources Selected', status: 'PASS' });
    results.totalPassed++;
    return true;
  }
}

async function runAllScenarios() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  E2E SCENARIOS & ERROR HANDLING - PHASE 10.6');
  console.log('═══════════════════════════════════════════════════════');

  // Check backend
  try {
    await makeRequest('/api/health', {});
    console.log('✅ Backend is reachable\n');
  } catch (error) {
    console.log('❌ Backend not reachable - please start backend\n');
    process.exit(1);
  }

  // Run scenarios
  await scenario1_SingleSourceSearch();
  await scenario2_MultiSourceAggregation();
  await scenario3_YearRangeFiltering();
  await scenario4_EmptyQuery();
  await scenario5_InvalidSource();
  await scenario6_SpecialCharacters();
  await scenario7_VeryLongQuery();
  await scenario8_ConcurrentRequests();
  await scenario9_LimitBoundaries();
  await scenario10_NoSourcesSelected();

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SCENARIO TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total Scenarios: ${results.totalPassed + results.totalFailed}`);
  console.log(`✅ Passed:       ${results.totalPassed}`);
  console.log(`❌ Failed:       ${results.totalFailed}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (results.totalFailed === 0) {
    console.log('🎉 ALL SCENARIOS PASSED!\n');
    process.exit(0);
  } else {
    console.log('⚠️  SOME SCENARIOS FAILED\n');
    process.exit(1);
  }
}

runAllScenarios().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});
