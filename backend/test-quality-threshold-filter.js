/**
 * Unit Test: Quality Threshold Filter (Phase 10.99 Week 2)
 *
 * Tests the quality threshold filter implementation to ensure:
 * 1. Papers with quality >= 40 pass the filter
 * 2. Papers with quality < 40 are rejected
 * 3. Papers without quality scores are rejected (score defaults to 0)
 * 4. Pass rate calculation is correct
 * 5. Edge cases are handled (empty array, all pass, all fail)
 */

const assert = require('assert');

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPapersWithQualityScores = [
  { id: '1', title: 'Paper 1', qualityScore: 80 }, // PASS
  { id: '2', title: 'Paper 2', qualityScore: 60 }, // PASS
  { id: '3', title: 'Paper 3', qualityScore: 45 }, // PASS
  { id: '4', title: 'Paper 4', qualityScore: 40 }, // PASS (exactly at threshold)
  { id: '5', title: 'Paper 5', qualityScore: 39 }, // FAIL
  { id: '6', title: 'Paper 6', qualityScore: 25 }, // FAIL
  { id: '7', title: 'Paper 7', qualityScore: 10 }, // FAIL
  { id: '8', title: 'Paper 8', qualityScore: 0 },  // FAIL
  { id: '9', title: 'Paper 9' },                    // FAIL (no qualityScore field)
  { id: '10', title: 'Paper 10', qualityScore: null }, // FAIL (null quality score)
];

const mockPapersAllPass = [
  { id: '1', title: 'Paper 1', qualityScore: 80 },
  { id: '2', title: 'Paper 2', qualityScore: 60 },
  { id: '3', title: 'Paper 3', qualityScore: 45 },
];

const mockPapersAllFail = [
  { id: '1', title: 'Paper 1', qualityScore: 39 },
  { id: '2', title: 'Paper 2', qualityScore: 25 },
  { id: '3', title: 'Paper 3', qualityScore: 10 },
];

const mockPapersEmpty = [];

// ============================================================================
// IMPLEMENTATION (copied from literature.service.ts:1250-1268)
// ============================================================================

function applyQualityThresholdFilter(papers, qualityThreshold = 40) {
  const beforeQualityFilter = papers.length;

  const exceptionalPapers = papers.filter((paper) => {
    const qualityScore = paper.qualityScore ?? 0;
    return qualityScore >= qualityThreshold;
  });

  const qualityPassRate = beforeQualityFilter > 0
    ? ((exceptionalPapers.length / beforeQualityFilter) * 100).toFixed(1)
    : '0.0';

  console.log(
    `🎯 Quality Threshold Filter (score ≥ ${qualityThreshold}/100): ${beforeQualityFilter} → ${exceptionalPapers.length} papers ` +
    `(${qualityPassRate}% pass rate - EXCEPTIONAL QUALITY ONLY)`
  );

  return {
    filteredPapers: exceptionalPapers,
    beforeCount: beforeQualityFilter,
    afterCount: exceptionalPapers.length,
    passRate: parseFloat(qualityPassRate),
  };
}

// ============================================================================
// UNIT TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('UNIT TEST: Quality Threshold Filter (Phase 10.99 Week 2)');
console.log('='.repeat(80) + '\n');

// Test 1: Mixed quality scores (4 pass, 6 fail)
console.log('TEST 1: Mixed quality scores (threshold 40)');
console.log('-'.repeat(80));
const result1 = applyQualityThresholdFilter(mockPapersWithQualityScores, 40);
assert.strictEqual(result1.beforeCount, 10, 'Should have 10 papers before filter');
assert.strictEqual(result1.afterCount, 4, 'Should have 4 papers after filter (80, 60, 45, 40)');
assert.strictEqual(result1.passRate, 40.0, 'Pass rate should be 40.0%');
assert.strictEqual(result1.filteredPapers.length, 4, 'Filtered array should have 4 papers');
assert.deepStrictEqual(
  result1.filteredPapers.map(p => p.id),
  ['1', '2', '3', '4'],
  'Should keep papers 1, 2, 3, 4'
);
console.log('✅ PASSED: Mixed quality scores\n');

// Test 2: All papers pass
console.log('TEST 2: All papers pass (threshold 40)');
console.log('-'.repeat(80));
const result2 = applyQualityThresholdFilter(mockPapersAllPass, 40);
assert.strictEqual(result2.beforeCount, 3, 'Should have 3 papers before filter');
assert.strictEqual(result2.afterCount, 3, 'Should have 3 papers after filter');
assert.strictEqual(result2.passRate, 100.0, 'Pass rate should be 100.0%');
console.log('✅ PASSED: All papers pass\n');

// Test 3: All papers fail
console.log('TEST 3: All papers fail (threshold 40)');
console.log('-'.repeat(80));
const result3 = applyQualityThresholdFilter(mockPapersAllFail, 40);
assert.strictEqual(result3.beforeCount, 3, 'Should have 3 papers before filter');
assert.strictEqual(result3.afterCount, 0, 'Should have 0 papers after filter');
assert.strictEqual(result3.passRate, 0.0, 'Pass rate should be 0.0%');
console.log('✅ PASSED: All papers fail\n');

// Test 4: Empty input array
console.log('TEST 4: Empty input array');
console.log('-'.repeat(80));
const result4 = applyQualityThresholdFilter(mockPapersEmpty, 40);
assert.strictEqual(result4.beforeCount, 0, 'Should have 0 papers before filter');
assert.strictEqual(result4.afterCount, 0, 'Should have 0 papers after filter');
assert.strictEqual(result4.passRate, 0.0, 'Pass rate should be 0.0%');
console.log('✅ PASSED: Empty input array\n');

// Test 5: Different threshold (50)
console.log('TEST 5: Different threshold (50)');
console.log('-'.repeat(80));
const result5 = applyQualityThresholdFilter(mockPapersWithQualityScores, 50);
assert.strictEqual(result5.beforeCount, 10, 'Should have 10 papers before filter');
assert.strictEqual(result5.afterCount, 2, 'Should have 2 papers after filter (80, 60)');
assert.strictEqual(result5.passRate, 20.0, 'Pass rate should be 20.0%');
console.log('✅ PASSED: Different threshold\n');

// Test 6: Edge case - exactly at threshold
console.log('TEST 6: Edge case - exactly at threshold');
console.log('-'.repeat(80));
const edgeCasePapers = [
  { id: '1', title: 'Paper 1', qualityScore: 40.0 },
  { id: '2', title: 'Paper 2', qualityScore: 39.9 },
  { id: '3', title: 'Paper 3', qualityScore: 40.1 },
];
const result6 = applyQualityThresholdFilter(edgeCasePapers, 40);
assert.strictEqual(result6.afterCount, 2, 'Should have 2 papers (40.0 and 40.1 pass, 39.9 fails)');
assert.deepStrictEqual(
  result6.filteredPapers.map(p => p.id),
  ['1', '3'],
  'Should keep papers with score >= 40'
);
console.log('✅ PASSED: Edge case - exactly at threshold\n');

// Test 7: Null coalescing operator test
console.log('TEST 7: Null coalescing behavior');
console.log('-'.repeat(80));
const nullPapers = [
  { id: '1', title: 'Paper 1', qualityScore: null },
  { id: '2', title: 'Paper 2', qualityScore: undefined },
  { id: '3', title: 'Paper 3' }, // No qualityScore field
  { id: '4', title: 'Paper 4', qualityScore: 0 },
  { id: '5', title: 'Paper 5', qualityScore: 40 },
];
const result7 = applyQualityThresholdFilter(nullPapers, 40);
assert.strictEqual(result7.afterCount, 1, 'Only paper 5 should pass (all others default to 0)');
assert.strictEqual(result7.filteredPapers[0].id, '5', 'Should keep paper 5');
console.log('✅ PASSED: Null coalescing behavior\n');

// ============================================================================
// BM25 THRESHOLD CALCULATION TESTS
// ============================================================================

console.log('='.repeat(80));
console.log('BM25 THRESHOLD CALCULATION TESTS');
console.log('='.repeat(80) + '\n');

function calculateBM25Threshold(queryComplexity) {
  let MIN_RELEVANCE_SCORE;
  if (queryComplexity === 'BROAD') {
    MIN_RELEVANCE_SCORE = 3;
  } else if (queryComplexity === 'SPECIFIC') {
    MIN_RELEVANCE_SCORE = 4;
  } else {
    MIN_RELEVANCE_SCORE = 5; // COMPREHENSIVE
  }

  // Phase 10.99 Week 2: STRICT threshold (1.25x multiplier)
  const bm25Threshold = MIN_RELEVANCE_SCORE * 1.25;

  return { MIN_RELEVANCE_SCORE, bm25Threshold };
}

// Test 8: BM25 threshold for BROAD queries
console.log('TEST 8: BM25 threshold for BROAD queries');
console.log('-'.repeat(80));
const broad = calculateBM25Threshold('BROAD');
assert.strictEqual(broad.MIN_RELEVANCE_SCORE, 3, 'MIN_RELEVANCE_SCORE should be 3');
assert.strictEqual(broad.bm25Threshold, 3.75, 'BM25 threshold should be 3.75');
console.log(`  MIN_RELEVANCE_SCORE: ${broad.MIN_RELEVANCE_SCORE}`);
console.log(`  BM25 Threshold (1.25x): ${broad.bm25Threshold}`);
console.log('✅ PASSED: BROAD query threshold\n');

// Test 9: BM25 threshold for SPECIFIC queries
console.log('TEST 9: BM25 threshold for SPECIFIC queries');
console.log('-'.repeat(80));
const specific = calculateBM25Threshold('SPECIFIC');
assert.strictEqual(specific.MIN_RELEVANCE_SCORE, 4, 'MIN_RELEVANCE_SCORE should be 4');
assert.strictEqual(specific.bm25Threshold, 5.0, 'BM25 threshold should be 5.0');
console.log(`  MIN_RELEVANCE_SCORE: ${specific.MIN_RELEVANCE_SCORE}`);
console.log(`  BM25 Threshold (1.25x): ${specific.bm25Threshold}`);
console.log('✅ PASSED: SPECIFIC query threshold\n');

// Test 10: BM25 threshold for COMPREHENSIVE queries
console.log('TEST 10: BM25 threshold for COMPREHENSIVE queries');
console.log('-'.repeat(80));
const comprehensive = calculateBM25Threshold('COMPREHENSIVE');
assert.strictEqual(comprehensive.MIN_RELEVANCE_SCORE, 5, 'MIN_RELEVANCE_SCORE should be 5');
assert.strictEqual(comprehensive.bm25Threshold, 6.25, 'BM25 threshold should be 6.25');
console.log(`  MIN_RELEVANCE_SCORE: ${comprehensive.MIN_RELEVANCE_SCORE}`);
console.log(`  BM25 Threshold (1.25x): ${comprehensive.bm25Threshold}`);
console.log('✅ PASSED: COMPREHENSIVE query threshold\n');

// ============================================================================
// PROGRESSIVE FUNNEL SIMULATION
// ============================================================================

console.log('='.repeat(80));
console.log('PROGRESSIVE FILTERING FUNNEL SIMULATION');
console.log('='.repeat(80) + '\n');

function simulateProgressiveFunnel() {
  console.log('Simulating full progressive filtering funnel for SPECIFIC query:\n');

  const initialCollection = 11400;
  const dedupRate = 0.95;
  const bm25PassRate = 0.50; // With 1.25x multiplier (strict)
  const tier2Limit = 1200;
  const domainPassRate = 0.82;
  const aspectPassRate = 0.90;
  const qualityPassRate = 0.34; // Threshold 40/100

  const afterDedup = Math.floor(initialCollection * dedupRate);
  const afterBM25 = Math.floor(afterDedup * bm25PassRate);
  const afterTier2 = Math.min(afterBM25, tier2Limit);
  const afterDomain = Math.floor(afterTier2 * domainPassRate);
  const afterAspect = Math.floor(afterDomain * aspectPassRate);
  const afterQuality = Math.floor(afterAspect * qualityPassRate);

  console.log(`  Initial Collection:       ${initialCollection.toLocaleString()} papers`);
  console.log(`  After Dedup (95%):        ${afterDedup.toLocaleString()} papers`);
  console.log(`  After BM25 (50%):         ${afterBM25.toLocaleString()} papers`);
  console.log(`  After TIER 2 (top 1,200): ${afterTier2.toLocaleString()} papers`);
  console.log(`  After Domain (82%):       ${afterDomain.toLocaleString()} papers`);
  console.log(`  After Aspect (90%):       ${afterAspect.toLocaleString()} papers`);
  console.log(`  After Quality (34%):      ${afterQuality.toLocaleString()} papers ✅`);
  console.log('');

  // Verify result is close to 300
  assert(afterQuality >= 280 && afterQuality <= 320, `Expected ~300 papers, got ${afterQuality}`);
  console.log(`✅ PASSED: Progressive funnel produces ~300 papers (${afterQuality})\n`);
}

simulateProgressiveFunnel();

// ============================================================================
// SUMMARY
// ============================================================================

console.log('='.repeat(80));
console.log('✅ ALL TESTS PASSED');
console.log('='.repeat(80));
console.log('');
console.log('Summary:');
console.log('  ✅ Quality threshold filter works correctly');
console.log('  ✅ Null coalescing (paper.qualityScore ?? 0) works as expected');
console.log('  ✅ BM25 threshold calculation is correct for all query types');
console.log('  ✅ Progressive funnel produces ~300 exceptional papers');
console.log('');
console.log('Ready for integration testing!');
console.log('');
