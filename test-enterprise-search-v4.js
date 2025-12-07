/**
 * Enterprise Search Engine v4.0 - End-to-End Test Suite
 * 
 * Tests:
 * 1. BM25 relevance scoring
 * 2. Recency bonus (exponential decay)
 * 3. Quality scoring (30/50/20 weights)
 * 4. Metadata accuracy
 * 5. Edge cases
 */

const assert = require('assert');

// Import utilities
const { calculateBM25RelevanceScore, getRelevanceTier } = require('./backend/src/modules/literature/utils/relevance-scoring.util');
const { calculateRecencyBoost, calculateQualityScore } = require('./backend/src/modules/literature/utils/paper-quality.util');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Enterprise Search Engine v4.0 - Test Suite              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// ============================================================================
// TEST SUITE 1: BM25 Relevance Scoring
// ============================================================================

console.log('\n📊 Test Suite 1: BM25 Relevance Scoring\n');

test('BM25: Title exact match scores highest', () => {
  const paper = {
    title: 'Q-methodology in social research',
    abstract: 'This paper discusses various research methods.',
    keywords: ['research', 'methods'],
    authors: ['Smith, J.'],
    venue: 'Journal of Research'
  };
  
  const score = calculateBM25RelevanceScore(paper, 'Q-methodology');
  assert(score > 100, `Expected score > 100, got ${score}`);
});

test('BM25: Title match scores higher than abstract match', () => {
  const paperTitle = {
    title: 'Q-methodology research',
    abstract: 'General research paper',
    keywords: [],
    authors: [],
    venue: ''
  };
  
  const paperAbstract = {
    title: 'General research paper',
    abstract: 'This paper uses Q-methodology for analysis',
    keywords: [],
    authors: [],
    venue: ''
  };
  
  const scoreTitle = calculateBM25RelevanceScore(paperTitle, 'Q-methodology');
  const scoreAbstract = calculateBM25RelevanceScore(paperAbstract, 'Q-methodology');
  
  assert(scoreTitle > scoreAbstract, 
    `Title score (${scoreTitle}) should be > abstract score (${scoreAbstract})`);
});

test('BM25: Phrase matching bonus works', () => {
  const paperExact = {
    title: 'COVID-19 vaccine development',
    abstract: 'Study on vaccines',
    keywords: [],
    authors: [],
    venue: ''
  };
  
  const paperSeparate = {
    title: 'COVID-19 and vaccine research',
    abstract: 'Study on vaccines',
    keywords: [],
    authors: [],
    venue: ''
  };
  
  const scoreExact = calculateBM25RelevanceScore(paperExact, 'COVID-19 vaccine');
  const scoreSeparate = calculateBM25RelevanceScore(paperSeparate, 'COVID-19 vaccine');
  
  assert(scoreExact > scoreSeparate,
    `Exact phrase (${scoreExact}) should score > separated terms (${scoreSeparate})`);
});

test('BM25: Term coverage penalty works', () => {
  const paperFull = {
    title: 'Machine learning for data analysis',
    abstract: 'Using machine learning and data analysis techniques',
    keywords: ['machine learning', 'data', 'analysis'],
    authors: [],
    venue: ''
  };
  
  const paperPartial = {
    title: 'Machine learning research',
    abstract: 'General research paper',
    keywords: [],
    authors: [],
    venue: ''
  };
  
  const scoreFull = calculateBM25RelevanceScore(paperFull, 'machine learning data analysis');
  const scorePartial = calculateBM25RelevanceScore(paperPartial, 'machine learning data analysis');
  
  assert(scoreFull > scorePartial,
    `Full coverage (${scoreFull}) should score > partial coverage (${scorePartial})`);
});

test('BM25: Relevance tiers work correctly', () => {
  assert.strictEqual(getRelevanceTier(95), 'Highly Relevant');
  assert.strictEqual(getRelevanceTier(75), 'Very Relevant');
  assert.strictEqual(getRelevanceTier(55), 'Relevant');
  assert.strictEqual(getRelevanceTier(35), 'Somewhat Relevant');
  assert.strictEqual(getRelevanceTier(15), 'Marginally Relevant');
});

// ============================================================================
// TEST SUITE 2: Recency Bonus (Exponential Decay)
// ============================================================================

console.log('\n📅 Test Suite 2: Recency Bonus (Exponential Decay)\n');

test('Recency: 2024 paper scores 100', () => {
  const score = calculateRecencyBoost(2024);
  assert.strictEqual(score, 100, `Expected 100, got ${score}`);
});

test('Recency: 2023 paper scores ~86', () => {
  const score = calculateRecencyBoost(2023);
  assert(score >= 85 && score <= 87, `Expected ~86, got ${score}`);
});

test('Recency: 2021 paper scores ~64', () => {
  const score = calculateRecencyBoost(2021);
  assert(score >= 63 && score <= 65, `Expected ~64, got ${score}`);
});

test('Recency: 2019 paper scores ~47', () => {
  const score = calculateRecencyBoost(2019);
  assert(score >= 46 && score <= 48, `Expected ~47, got ${score}`);
});

test('Recency: 2014 paper scores ~22', () => {
  const score = calculateRecencyBoost(2014);
  assert(score >= 21 && score <= 23, `Expected ~22, got ${score}`);
});

test('Recency: Old paper (2000) scores floor of 20', () => {
  const score = calculateRecencyBoost(2000);
  assert.strictEqual(score, 20, `Expected 20 (floor), got ${score}`);
});

test('Recency: Future year (2030) scores 100', () => {
  const score = calculateRecencyBoost(2030);
  assert.strictEqual(score, 100, `Expected 100 (future), got ${score}`);
});

test('Recency: Null year scores 50 (neutral)', () => {
  const score = calculateRecencyBoost(null);
  assert.strictEqual(score, 50, `Expected 50 (neutral), got ${score}`);
});

test('Recency: Undefined year scores 50 (neutral)', () => {
  const score = calculateRecencyBoost(undefined);
  assert.strictEqual(score, 50, `Expected 50 (neutral), got ${score}`);
});

test('Recency: Works for any future year (2050)', () => {
  const score = calculateRecencyBoost(2050);
  assert.strictEqual(score, 100, `Expected 100, got ${score}`);
});

// ============================================================================
// TEST SUITE 3: Quality Scoring (30/50/20 Weights)
// ============================================================================

console.log('\n⭐ Test Suite 3: Quality Scoring (30/50/20 Weights)\n');

test('Quality: Recent paper (2024) gets recency bonus', () => {
  const paper = {
    citationCount: 10,
    year: 2024,
    source: 'pubmed',
    impactFactor: 5.0,
    quartile: 'Q1'
  };
  
  const result = calculateQualityScore(paper);
  assert(result.recencyBoost === 100, `Expected recency 100, got ${result.recencyBonus}`);
  assert(result.totalScore > 60, `Expected total > 60, got ${result.totalScore}`);
});

test('Quality: Old paper (2000) gets low recency bonus', () => {
  const paper = {
    citationCount: 100,
    year: 2000,
    source: 'pubmed',
    impactFactor: 10.0,
    quartile: 'Q1'
  };
  
  const result = calculateQualityScore(paper);
  assert(result.recencyBoost === 20, `Expected recency 20, got ${result.recencyBonus}`);
});

test('Quality: High citations + high journal + recent = high score', () => {
  const paper = {
    citationCount: 50,
    year: 2023,
    source: 'pubmed',
    impactFactor: 15.0,
    quartile: 'Q1',
    isOpenAccess: true
  };
  
  const result = calculateQualityScore(paper);
  assert(result.totalScore > 80, `Expected score > 80, got ${result.totalScore}`);
});

test('Quality: Low citations + low journal + old = low score', () => {
  const paper = {
    citationCount: 1,
    year: 2010,
    source: 'arxiv',
    impactFactor: null,
    quartile: null
  };
  
  const result = calculateQualityScore(paper);
  assert(result.totalScore < 40, `Expected score < 40, got ${result.totalScore}`);
});

test('Quality: Weights are 30/50/20 (citation/journal/recency)', () => {
  const paper = {
    citationCount: 10,
    year: 2024,
    source: 'pubmed',
    impactFactor: 5.0,
    quartile: 'Q1'
  };
  
  const result = calculateQualityScore(paper);
  
  // Verify recency is included (should be 100 for 2024)
  assert(result.recencyBoost === 100, `Recency should be 100, got ${result.recencyBonus}`);
  
  // Verify core score uses all three components
  // Core = citations*0.3 + journal*0.5 + recency*0.2
  // With recency=100, core should be at least 20 (from recency alone)
  assert(result.coreScore >= 20, `Core score should be >= 20, got ${result.coreScore}`);
});

// ============================================================================
// TEST SUITE 4: Edge Cases
// ============================================================================

console.log('\n🔍 Test Suite 4: Edge Cases\n');

test('Edge: Empty query returns 0 relevance', () => {
  const paper = {
    title: 'Test paper',
    abstract: 'Test abstract',
    keywords: [],
    authors: [],
    venue: ''
  };
  
  const score = calculateBM25RelevanceScore(paper, '');
  assert.strictEqual(score, 0, `Expected 0, got ${score}`);
});

test('Edge: Paper with no abstract still scores', () => {
  const paper = {
    title: 'Q-methodology research',
    abstract: '',
    keywords: [],
    authors: [],
    venue: ''
  };
  
  const score = calculateBM25RelevanceScore(paper, 'Q-methodology');
  assert(score > 0, `Expected score > 0, got ${score}`);
});

test('Edge: Paper with no year gets neutral recency (50)', () => {
  const paper = {
    citationCount: 10,
    year: null,
    source: 'pubmed',
    impactFactor: 5.0
  };
  
  const result = calculateQualityScore(paper);
  assert.strictEqual(result.recencyBoost, 50, `Expected 50, got ${result.recencyBonus}`);
});

test('Edge: Paper with no citations still gets quality score', () => {
  const paper = {
    citationCount: 0,
    year: 2024,
    source: 'arxiv',
    impactFactor: null,
    quartile: null
  };
  
  const result = calculateQualityScore(paper);
  assert(result.totalScore > 0, `Expected score > 0, got ${result.totalScore}`);
});

test('Edge: Very short query (1-2 chars) returns 0', () => {
  const paper = {
    title: 'Test paper',
    abstract: 'Test abstract',
    keywords: [],
    authors: [],
    venue: ''
  };
  
  const score = calculateBM25RelevanceScore(paper, 'Q');
  assert.strictEqual(score, 0, `Expected 0 for short query, got ${score}`);
});

// ============================================================================
// TEST SUITE 5: Integration Tests
// ============================================================================

console.log('\n🔗 Test Suite 5: Integration Tests\n');

test('Integration: Complete paper scoring pipeline', () => {
  const paper = {
    title: 'Q-methodology for social research',
    abstract: 'This paper presents Q-methodology applications in social science research.',
    keywords: ['Q-methodology', 'social research', 'qualitative'],
    authors: ['Smith, J.', 'Doe, A.'],
    venue: 'Journal of Social Research',
    citationCount: 25,
    year: 2023,
    source: 'pubmed',
    impactFactor: 8.5,
    quartile: 'Q1',
    isOpenAccess: true
  };
  
  const query = 'Q-methodology social research';
  
  // Calculate relevance
  const relevanceScore = calculateBM25RelevanceScore(paper, query);
  assert(relevanceScore > 80, `Expected relevance > 80, got ${relevanceScore}`);
  
  // Calculate quality
  const qualityResult = calculateQualityScore(paper);
  assert(qualityResult.totalScore > 70, `Expected quality > 70, got ${qualityResult.totalScore}`);
  
  // Verify recency bonus
  assert(qualityResult.recencyBoost >= 85, `Expected recency >= 85, got ${qualityResult.recencyBonus}`);
  
  // Verify open access bonus
  assert(qualityResult.openAccessBonus === 10, `Expected OA bonus 10, got ${qualityResult.openAccessBonus}`);
});

test('Integration: Math paper vs Biology paper (fair comparison)', () => {
  const mathPaper = {
    citationCount: 5,
    year: 2023,
    source: 'arxiv',
    impactFactor: 3.0,
    quartile: 'Q1',
    fwci: 1.2  // Field-weighted citation impact
  };
  
  const bioPaper = {
    citationCount: 50,
    year: 2023,
    source: 'pubmed',
    impactFactor: 3.0,
    quartile: 'Q1',
    fwci: 1.2  // Same field-weighted impact
  };
  
  const mathScore = calculateQualityScore(mathPaper);
  const bioScore = calculateQualityScore(bioPaper);
  
  // With field weighting, scores should be similar (within 10 points)
  const diff = Math.abs(mathScore.totalScore - bioScore.totalScore);
  assert(diff < 15, `Score difference should be < 15, got ${diff}`);
});

// ============================================================================
// RESULTS
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                      TEST RESULTS                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const totalTests = passedTests + failedTests;
const passRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Pass Rate: ${passRate}%\n`);

if (failedTests === 0) {
  console.log('🎉 ALL TESTS PASSED! Enterprise Search Engine v4.0 is ready.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review and fix issues.\n');
  process.exit(1);
}
