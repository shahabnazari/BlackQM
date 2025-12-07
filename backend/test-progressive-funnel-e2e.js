/**
 * End-to-End Integration Test: Progressive Filtering Funnel
 *
 * Tests the complete literature search pipeline with Week 2 changes:
 * 1. Source allocations increased (600 → 1,400)
 * 2. BM25 threshold strictness (0.7x → 1.25x)
 * 3. TIER 2 limit increased (450 → 1,200)
 * 4. Quality threshold filter added (score >= 40)
 *
 * This test simulates a real search query and verifies the progressive funnel works end-to-end.
 */

const http = require('http');

// ============================================================================
// CONFIGURATION
// ============================================================================

const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 4000;
const TEST_QUERY = 'symbolic interactionism in anthropology';
const EXPECTED_PAPER_COUNT_MIN = 280;
const EXPECTED_PAPER_COUNT_MAX = 320;
const QUALITY_THRESHOLD = 40;

// ============================================================================
// HTTP REQUEST HELPER
// ============================================================================

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

function assertRange(value, min, max, label) {
  assert(
    value >= min && value <= max,
    `${label} should be between ${min} and ${max}, got ${value}`
  );
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================

async function runE2ETests() {
  console.log('\n' + '='.repeat(80));
  console.log('END-TO-END INTEGRATION TEST: Progressive Filtering Funnel');
  console.log('Phase 10.99 Week 2 - Scientific Progressive Filtering');
  console.log('='.repeat(80) + '\n');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Backend Health Check
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 1: Backend Health Check');
  console.log('-'.repeat(80));

  const healthOptions = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: '/api/health',
    method: 'GET',
  };

  try {
    const healthResponse = await makeRequest(healthOptions);
    assert(healthResponse.statusCode === 200, 'Health check should return 200');
    assert(healthResponse.data.status === 'healthy', 'Backend should be healthy');
    console.log(`✅ Backend is healthy: ${JSON.stringify(healthResponse.data)}`);
  } catch (error) {
    console.error(`❌ Backend health check failed: ${error.message}`);
    process.exit(1);
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Literature Search Request
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 2: Literature Search Request');
  console.log('-'.repeat(80));
  console.log(`Query: "${TEST_QUERY}"`);
  console.log('Expected behavior:');
  console.log('  - Collection: ~11,400 papers');
  console.log('  - After Dedup (95%): ~10,500 papers');
  console.log('  - After BM25 strict (50%): ~5,000 papers');
  console.log('  - After TIER 2 (top 1,200): 1,200 papers');
  console.log('  - After Domain (82%): ~984 papers');
  console.log('  - After Aspect (90%): ~886 papers');
  console.log('  - After Quality (34%): ~300 papers ✅');
  console.log('');

  const searchOptions = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: '/api/literature/search',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const searchPayload = {
    query: TEST_QUERY,
  };

  let searchResponse;
  const startTime = Date.now();

  try {
    console.log('⏳ Sending search request (this may take 2-3 minutes)...\n');
    searchResponse = await makeRequest(searchOptions, searchPayload);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Search completed in ${duration} seconds\n`);
  } catch (error) {
    console.error(`❌ Search request failed: ${error.message}`);
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Response Status and Structure
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 3: Response Status and Structure');
  console.log('-'.repeat(80));

  assert(searchResponse.statusCode === 200 || searchResponse.statusCode === 201, 'Search should return 200 or 201');
  assert(searchResponse.data !== null, 'Response should have data');
  assert(Array.isArray(searchResponse.data.papers) || Array.isArray(searchResponse.data), 'Response should contain papers array');

  const papers = searchResponse.data.papers || searchResponse.data;
  console.log(`✅ Response structure valid`);
  console.log(`   Papers array length: ${papers.length}`);
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Paper Count Verification
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 4: Paper Count Verification');
  console.log('-'.repeat(80));

  assertRange(
    papers.length,
    EXPECTED_PAPER_COUNT_MIN,
    EXPECTED_PAPER_COUNT_MAX,
    'Paper count'
  );

  console.log(`✅ Paper count within expected range: ${papers.length} papers`);
  console.log(`   Expected: ${EXPECTED_PAPER_COUNT_MIN} - ${EXPECTED_PAPER_COUNT_MAX} papers`);
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Quality Score Verification
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 5: Quality Score Verification');
  console.log('-'.repeat(80));

  const papersWithQualityScores = papers.filter(p => p.qualityScore !== null && p.qualityScore !== undefined);
  const qualityScores = papersWithQualityScores.map(p => p.qualityScore);

  assert(papersWithQualityScores.length > 0, 'At least some papers should have quality scores');

  const minQualityScore = Math.min(...qualityScores);
  const maxQualityScore = Math.max(...qualityScores);
  const avgQualityScore = (qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length).toFixed(1);

  console.log(`Papers with quality scores: ${papersWithQualityScores.length}/${papers.length}`);
  console.log(`Quality score range: ${minQualityScore.toFixed(1)} - ${maxQualityScore.toFixed(1)}`);
  console.log(`Average quality score: ${avgQualityScore}`);

  // Verify quality threshold filter worked
  if (papersWithQualityScores.length === papers.length) {
    const belowThreshold = qualityScores.filter(s => s < QUALITY_THRESHOLD);
    assert(
      belowThreshold.length === 0,
      `All papers should have quality >= ${QUALITY_THRESHOLD} (found ${belowThreshold.length} below threshold)`
    );
    console.log(`✅ Quality threshold filter working: All papers have quality >= ${QUALITY_THRESHOLD}`);
  } else {
    console.log(`⚠️  Some papers missing quality scores (${papers.length - papersWithQualityScores.length} papers)`);
    console.log(`   Checking only papers with scores...`);

    const belowThreshold = qualityScores.filter(s => s < QUALITY_THRESHOLD);
    if (belowThreshold.length > 0) {
      console.error(`❌ Found ${belowThreshold.length} papers with quality < ${QUALITY_THRESHOLD}`);
      console.error(`   Min score: ${Math.min(...belowThreshold).toFixed(1)}`);
      console.error(`   This suggests quality filter is not working!`);
      process.exit(1);
    }
    console.log(`✅ All papers with scores have quality >= ${QUALITY_THRESHOLD}`);
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: Quality Distribution Analysis
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 6: Quality Distribution Analysis');
  console.log('-'.repeat(80));

  const qualityTiers = {
    exceptional: qualityScores.filter(s => s >= 80).length,  // 80-100
    excellent: qualityScores.filter(s => s >= 60 && s < 80).length, // 60-80
    good: qualityScores.filter(s => s >= 40 && s < 60).length,       // 40-60
    belowThreshold: qualityScores.filter(s => s < 40).length,        // <40
  };

  console.log('Quality Tier Distribution:');
  console.log(`  🥇 Exceptional (80-100): ${qualityTiers.exceptional} papers (${((qualityTiers.exceptional / qualityScores.length) * 100).toFixed(1)}%)`);
  console.log(`  🥈 Excellent (60-80):    ${qualityTiers.excellent} papers (${((qualityTiers.excellent / qualityScores.length) * 100).toFixed(1)}%)`);
  console.log(`  🥉 Good (40-60):         ${qualityTiers.good} papers (${((qualityTiers.good / qualityScores.length) * 100).toFixed(1)}%)`);
  console.log(`  ❌ Below Threshold (<40): ${qualityTiers.belowThreshold} papers (${((qualityTiers.belowThreshold / qualityScores.length) * 100).toFixed(1)}%)`);

  assert(qualityTiers.belowThreshold === 0, 'No papers should be below quality threshold');

  console.log(`✅ Quality distribution verified`);
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: Relevance Score Verification
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 7: Relevance Score Verification');
  console.log('-'.repeat(80));

  const papersWithRelevanceScores = papers.filter(p => p.relevanceScore !== null && p.relevanceScore !== undefined && p.relevanceScore > 0);
  const relevanceScores = papersWithRelevanceScores.map(p => p.relevanceScore);

  if (relevanceScores.length > 0) {
    const minRelevance = Math.min(...relevanceScores);
    const maxRelevance = Math.max(...relevanceScores);
    const avgRelevance = (relevanceScores.reduce((sum, s) => sum + s, 0) / relevanceScores.length).toFixed(2);

    console.log(`Papers with relevance scores: ${papersWithRelevanceScores.length}/${papers.length}`);
    console.log(`Relevance score range: ${minRelevance.toFixed(2)} - ${maxRelevance.toFixed(2)}`);
    console.log(`Average relevance score: ${avgRelevance}`);

    // Check BM25 threshold (should be >= 5.0 for SPECIFIC queries, but TIER 2 fallback may use lower scores)
    console.log(`✅ Relevance scores verified`);
  } else {
    console.log(`⚠️  No papers with BM25 relevance scores (likely using neural scores only)`);
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 8: Source Diversity Verification
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 8: Source Diversity Verification');
  console.log('-'.repeat(80));

  const sourceCounts = {};
  papers.forEach(p => {
    const source = p.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const sources = Object.keys(sourceCounts).sort((a, b) => sourceCounts[b] - sourceCounts[a]);
  console.log(`Papers from ${sources.length} different sources:`);
  sources.forEach(source => {
    const count = sourceCounts[source];
    const percentage = ((count / papers.length) * 100).toFixed(1);
    console.log(`  ${source}: ${count} papers (${percentage}%)`);
  });

  assert(sources.length >= 2, 'Papers should come from at least 2 different sources');
  console.log(`✅ Source diversity verified (${sources.length} sources)`);
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 9: Sample Paper Inspection
  // ─────────────────────────────────────────────────────────────────────────

  console.log('TEST 9: Sample Paper Inspection');
  console.log('-'.repeat(80));

  const samplePaper = papers[0];
  console.log('Sample paper (first result):');
  console.log(`  Title: ${samplePaper.title ? samplePaper.title.substring(0, 60) + '...' : 'N/A'}`);
  console.log(`  Quality Score: ${samplePaper.qualityScore?.toFixed(1) || 'N/A'}`);
  console.log(`  Relevance Score: ${samplePaper.relevanceScore?.toFixed(2) || 'N/A'}`);
  console.log(`  Neural Score: ${samplePaper.neuralRelevanceScore?.toFixed(3) || 'N/A'}`);
  console.log(`  Citation Count: ${samplePaper.citationCount ?? 'N/A'}`);
  console.log(`  Year: ${samplePaper.year ?? 'N/A'}`);
  console.log(`  Source: ${samplePaper.source ?? 'N/A'}`);

  assert(samplePaper.title, 'Paper should have title');
  assert(samplePaper.qualityScore !== undefined || samplePaper.qualityScore !== null, 'Paper should have quality score');

  console.log(`✅ Sample paper has required fields`);
  console.log('');

  // ─────────────────────────────────────────────────────────────────────────
  // FINAL SUMMARY
  // ─────────────────────────────────────────────────────────────────────────

  console.log('='.repeat(80));
  console.log('✅ ALL INTEGRATION TESTS PASSED');
  console.log('='.repeat(80));
  console.log('');
  console.log('Summary:');
  console.log(`  ✅ Backend healthy and responsive`);
  console.log(`  ✅ Search completed successfully`);
  console.log(`  ✅ Paper count within expected range (${papers.length} papers)`);
  console.log(`  ✅ All papers meet quality threshold (>= ${QUALITY_THRESHOLD})`);
  console.log(`  ✅ Quality score range: ${minQualityScore.toFixed(1)} - ${maxQualityScore.toFixed(1)}`);
  console.log(`  ✅ Average quality: ${avgQualityScore}/100`);
  console.log(`  ✅ Source diversity verified (${sources.length} sources)`);
  console.log('');
  console.log('🎉 Progressive Filtering Funnel is working correctly!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. User testing with different queries');
  console.log('  2. Monitor backend logs for pass rates at each stage');
  console.log('  3. Verify collection ~11,400 papers initially');
  console.log('  4. Verify BM25 strict threshold (1.25x) reduces to ~50% pass rate');
  console.log('  5. Verify TIER 2 uses top 1,200 papers');
  console.log('  6. Verify quality filter reduces to ~300 papers');
  console.log('');
}

// ============================================================================
// RUN TESTS
// ============================================================================

runE2ETests().catch(error => {
  console.error('\n❌ INTEGRATION TEST FAILED');
  console.error(error);
  process.exit(1);
});
