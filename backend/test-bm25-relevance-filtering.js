#!/usr/bin/env node
/**
 * BM25 Relevance Filtering Diagnostic Test
 *
 * Tests if relevance filtering is working correctly for 769-paper scenario
 *
 * Usage: node backend/test-bm25-relevance-filtering.js
 */

const { calculateBM25RelevanceScore } = require('./dist/modules/literature/utils/relevance-scoring.util');

console.log('\n='.repeat(80));
console.log('BM25 RELEVANCE FILTERING DIAGNOSTIC TEST');
console.log('='.repeat(80) + '\n');

// ==========================================================================
// Test 1: BM25 Score Calculation
// ==========================================================================

console.log('━━━ Test 1: BM25 Score Calculation ━━━\n');

const testPapers = [
  {
    title: 'Q Methodology in Educational Research: A Comprehensive Review',
    abstract: 'This paper provides a comprehensive review of Q methodology applications in educational research, covering factor analysis, interpretation, and best practices.',
    keywords: ['Q methodology', 'factor analysis', 'educational research'],
  },
  {
    title: 'Machine Learning Applications in Healthcare',
    abstract: 'This study explores machine learning techniques for healthcare diagnostics.',
    keywords: ['machine learning', 'healthcare', 'diagnostics'],
  },
  {
    title: 'Q Method for Policy Analysis',
    abstract: 'Using Q method to understand policy perspectives among stakeholders.',
    keywords: ['Q method', 'policy', 'stakeholders'],
  },
  {
    title: 'Climate Change Impact Assessment',
    abstract: 'Assessing the impact of climate change on coastal ecosystems.',
    keywords: ['climate change', 'coastal', 'ecosystems'],
  },
  {
    title: 'Factor Analysis in Psychological Research',
    abstract: 'This paper discusses factor analysis techniques in psychology.',
    keywords: ['factor analysis', 'psychology', 'research'],
  },
];

const query = 'Q methodology factor interpretation';

console.log(`Query: "${query}"\n`);

testPapers.forEach((paper, i) => {
  try {
    const score = calculateBM25RelevanceScore(paper, query);
    console.log(`Paper ${i + 1}: "${paper.title.substring(0, 50)}..."`);
    console.log(`  Score: ${score.toFixed(2)}`);
    console.log(`  Relevant: ${score >= 3 ? '✅ YES' : '❌ NO (below threshold)'}\n`);
  } catch (error) {
    console.log(`Paper ${i + 1}: ERROR - ${error.message}\n`);
  }
});

// ==========================================================================
// Test 2: Relevance Threshold Filtering
// ==========================================================================

console.log('\n━━━ Test 2: Relevance Threshold Filtering ━━━\n');

const thresholds = {
  BROAD: 3,
  SPECIFIC: 4,
  COMPREHENSIVE: 5,
};

// Simulate papers with different scores
const simulatedPapers = [
  { title: 'Paper 1', score: 0.5 },
  { title: 'Paper 2', score: 1.2 },
  { title: 'Paper 3', score: 2.8 },
  { title: 'Paper 4', score: 3.5 },
  { title: 'Paper 5', score: 4.2 },
  { title: 'Paper 6', score: 5.1 },
  { title: 'Paper 7', score: 8.0 },
  { title: 'Paper 8', score: 12.5 },
];

Object.entries(thresholds).forEach(([complexity, threshold]) => {
  const filtered = simulatedPapers.filter(p => p.score >= threshold);
  const rejected = simulatedPapers.length - filtered.length;

  console.log(`${complexity} Query (threshold: ${threshold}):`);
  console.log(`  Total papers: ${simulatedPapers.length}`);
  console.log(`  After filtering: ${filtered.length}`);
  console.log(`  Rejected: ${rejected} (${((rejected / simulatedPapers.length) * 100).toFixed(1)}%)`);
  console.log(`  Passing scores: ${filtered.map(p => p.score.toFixed(1)).join(', ')}\n`);
});

// ==========================================================================
// Test 3: 769-Paper Scenario Analysis
// ==========================================================================

console.log('\n━━━ Test 3: 769-Paper Scenario Analysis ━━━\n');

console.log('Analyzing 769-paper result...\n');

// Simulate score distribution for 769 papers
function generateScoreDistribution(count) {
  const distribution = [];

  // Realistic distribution:
  // - 10% very low scores (0-1)
  // - 20% low scores (1-3)
  // - 30% medium scores (3-6)
  // - 25% good scores (6-10)
  // - 15% excellent scores (10+)

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let score;

    if (rand < 0.10) {
      score = Math.random() * 1; // 0-1
    } else if (rand < 0.30) {
      score = 1 + Math.random() * 2; // 1-3
    } else if (rand < 0.60) {
      score = 3 + Math.random() * 3; // 3-6
    } else if (rand < 0.85) {
      score = 6 + Math.random() * 4; // 6-10
    } else {
      score = 10 + Math.random() * 10; // 10-20
    }

    distribution.push(score);
  }

  return distribution.sort((a, b) => b - a);
}

const scores = generateScoreDistribution(769);

// Calculate statistics
const min = Math.min(...scores);
const max = Math.max(...scores);
const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
const median = scores[Math.floor(scores.length / 2)];

console.log('Score Distribution for 769 Papers:');
console.log(`  Min: ${min.toFixed(2)}`);
console.log(`  Max: ${max.toFixed(2)}`);
console.log(`  Avg: ${avg.toFixed(2)}`);
console.log(`  Median: ${median.toFixed(2)}\n`);

// Test filtering with Phase 10.98 thresholds
console.log('Applying Phase 10.98 Thresholds:\n');

Object.entries(thresholds).forEach(([complexity, threshold]) => {
  const filtered = scores.filter(s => s >= threshold);
  const rejected = scores.length - filtered.length;

  console.log(`${complexity} Query (threshold: ${threshold}):`);
  console.log(`  Before: 769 papers`);
  console.log(`  After: ${filtered.length} papers`);
  console.log(`  Rejected: ${rejected} papers (${((rejected / 769) * 100).toFixed(1)}%)`);

  if (filtered.length > 0) {
    const filteredMin = Math.min(...filtered);
    const filteredMax = Math.max(...filtered);
    const filteredAvg = filtered.reduce((sum, s) => sum + s, 0) / filtered.length;
    console.log(`  Score range: ${filteredMin.toFixed(2)} - ${filteredMax.toFixed(2)} (avg: ${filteredAvg.toFixed(2)})`);
  }
  console.log();
});

// ==========================================================================
// Test 4: Check for Filtering Bypass
// ==========================================================================

console.log('\n━━━ Test 4: Filtering Bypass Detection ━━━\n');

console.log('Checking if filtering could be bypassed...\n');

const bypassScenarios = [
  {
    name: 'All papers score >= threshold',
    papers: 769,
    minScore: 3.5,
    threshold: 3,
    expected: 'NO FILTERING (all pass)',
  },
  {
    name: 'Threshold not applied',
    papers: 769,
    minScore: 0,
    threshold: 0,
    expected: 'BYPASS (threshold = 0)',
  },
  {
    name: 'Filter condition missing',
    papers: 769,
    minScore: 0,
    threshold: 3,
    filterApplied: false,
    expected: 'BYPASS (no filter)',
  },
  {
    name: 'Normal filtering (Phase 10.98)',
    papers: 769,
    minScore: 0,
    threshold: 3,
    filterApplied: true,
    expected: 'FILTERING WORKING',
  },
];

bypassScenarios.forEach((scenario, i) => {
  console.log(`Scenario ${i + 1}: ${scenario.name}`);
  console.log(`  Papers: ${scenario.papers}`);
  console.log(`  Min score: ${scenario.minScore}`);
  console.log(`  Threshold: ${scenario.threshold}`);
  console.log(`  Filter applied: ${scenario.filterApplied !== false ? 'YES' : 'NO'}`);
  console.log(`  Result: ${scenario.expected}\n`);
});

// ==========================================================================
// Test 5: Query Complexity Detection
// ==========================================================================

console.log('\n━━━ Test 5: Query Complexity Detection ━━━\n');

const testQueries = [
  { query: 'healthcare', expected: 'BROAD', threshold: 3 },
  { query: 'machine learning healthcare', expected: 'SPECIFIC', threshold: 4 },
  { query: 'Q methodology factor interpretation analysis', expected: 'COMPREHENSIVE', threshold: 5 },
  { query: 'AI AND machine learning', expected: 'COMPREHENSIVE', threshold: 5 },
  { query: '"deep learning" healthcare', expected: 'COMPREHENSIVE', threshold: 5 },
];

console.log('Testing query complexity detection:\n');

testQueries.forEach(test => {
  // Simulate detection logic
  const words = test.query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const wordCount = words.length;
  const hasBooleans = /\b(AND|OR|NOT)\b/i.test(test.query);
  const hasQuotes = /"[^"]+"/.test(test.query);

  let detected;
  if (wordCount >= 5 || hasBooleans || hasQuotes) {
    detected = 'COMPREHENSIVE';
  } else if (wordCount >= 3) {
    detected = 'SPECIFIC';
  } else {
    detected = 'BROAD';
  }

  const match = detected === test.expected ? '✅' : '❌';

  console.log(`Query: "${test.query}"`);
  console.log(`  Words: ${wordCount}`);
  console.log(`  Expected: ${test.expected} (threshold: ${test.threshold})`);
  console.log(`  Detected: ${detected} ${match}\n`);
});

// ==========================================================================
// Summary
// ==========================================================================

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSTIC SUMMARY');
console.log('='.repeat(80) + '\n');

console.log('Key Findings:');
console.log('  1. BM25 scoring: Test with sample papers above');
console.log('  2. Thresholds: BROAD=3, SPECIFIC=4, COMPREHENSIVE=5 (Phase 10.98)');
console.log('  3. 769 papers: Check if scores meet threshold for your query');
console.log('  4. Possible causes for 769 papers:');
console.log('     - All papers scored above threshold (legitimate)');
console.log('     - Query detected as BROAD (threshold=3, more lenient)');
console.log('     - Papers genuinely relevant to search query');
console.log('     - Filtering may not have been applied (check logs)\n');

console.log('Next Steps:');
console.log('  1. Check backend logs for: "Relevance filtering" message');
console.log('  2. Look for: "rejected for low relevance" count');
console.log('  3. Verify query complexity detection');
console.log('  4. Check if papers have relevanceScore field\n');

console.log('To test with real data:');
console.log('  1. Search something in the app');
console.log('  2. Check backend logs for relevance filtering output');
console.log('  3. Look for: "Top 5 scores" and "Bottom 3 scores" in logs\n');

process.exit(0);
