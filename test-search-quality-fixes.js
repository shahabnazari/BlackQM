/**
 * Comprehensive Test Suite for Search Quality Fixes
 * Phase 10.7 Day 20 - Quality Scoring v3.1
 * 
 * Tests:
 * 1. Quality score calculation (30/50/20 weights)
 * 2. Recency bonus application
 * 3. Citation bias reduction
 * 4. Edge cases (no year, old papers, etc.)
 */

const { calculateQualityScore, calculateRecencyBoost } = require('./backend/dist/modules/literature/utils/paper-quality.util');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   🧪 SEARCH QUALITY FIXES - COMPREHENSIVE TEST SUITE      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, expected, actual) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
    failedTests++;
    failures.push({ testName, expected, actual });
  }
}

function assertRange(value, min, max, testName) {
  const inRange = value >= min && value <= max;
  if (inRange) {
    console.log(`✅ PASS: ${testName} (${value} in range ${min}-${max})`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Expected: ${min}-${max}`);
    console.log(`   Actual: ${value}`);
    failedTests++;
    failures.push({ testName, expected: `${min}-${max}`, actual: value });
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('TEST SUITE 1: Recency Bonus Calculation');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1.1: 2024 paper (cutting-edge)
const recency2024 = calculateRecencyBoost(2024);
assert(recency2024 === 100, 'Test 1.1: 2024 paper gets 100 points', 100, recency2024);

// Test 1.2: 2023 paper (very recent)
const recency2023 = calculateRecencyBoost(2023);
assert(recency2023 === 80, 'Test 1.2: 2023 paper gets 80 points', 80, recency2023);

// Test 1.3: 2021 paper (recent)
const recency2021 = calculateRecencyBoost(2021);
assert(recency2021 === 60, 'Test 1.3: 2021 paper gets 60 points', 60, recency2021);

// Test 1.4: 2015 paper (established)
const recency2015 = calculateRecencyBoost(2015);
assert(recency2015 === 40, 'Test 1.4: 2015 paper gets 40 points', 40, recency2015);

// Test 1.5: 2010 paper (older)
const recency2010 = calculateRecencyBoost(2010);
assert(recency2010 === 20, 'Test 1.5: 2010 paper gets 20 points', 20, recency2010);

// Test 1.6: No year (neutral)
const recencyNull = calculateRecencyBoost(null);
assert(recencyNull === 50, 'Test 1.6: No year gets neutral 50 points', 50, recencyNull);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('TEST SUITE 2: Quality Score Calculation (v3.1 Weights)');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 2.1: Recent paper with good metrics
const paper2024 = {
  citationCount: 50,
  year: 2024,
  source: 'pubmed',
  impactFactor: 5.0,
  quartile: 'Q1',
};

const score2024 = calculateQualityScore(paper2024);
console.log(`\nTest 2.1: 2024 paper with 50 citations, IF=5.0, Q1`);
console.log(`   Citation Impact: ${score2024.citationImpact.toFixed(1)} (weight: 30%)`);
console.log(`   Journal Prestige: ${score2024.journalPrestige.toFixed(1)} (weight: 50%)`);
console.log(`   Recency Bonus: ${score2024.recencyBoost.toFixed(1)} (weight: 20%)`);
console.log(`   Core Score: ${score2024.coreScore.toFixed(1)}`);
console.log(`   Total Score: ${score2024.totalScore.toFixed(1)}`);

// Verify recency bonus is included
assert(score2024.recencyBoost === 100, 'Test 2.1a: Recency bonus is 100', 100, score2024.recencyBoost);

// Verify core score uses new weights (30/50/20)
const expectedCore2024 = score2024.citationImpact * 0.3 + score2024.journalPrestige * 0.5 + score2024.recencyBoost * 0.2;
assertRange(score2024.coreScore, expectedCore2024 - 0.5, expectedCore2024 + 0.5, 'Test 2.1b: Core score uses 30/50/20 weights');

// Test 2.2: Old paper with high citations (should still rank well)
const paper2010 = {
  citationCount: 500,
  year: 2010,
  source: 'pubmed',
  impactFactor: 10.0,
  quartile: 'Q1',
};

const score2010 = calculateQualityScore(paper2010);
console.log(`\nTest 2.2: 2010 paper with 500 citations, IF=10.0, Q1`);
console.log(`   Citation Impact: ${score2010.citationImpact.toFixed(1)} (weight: 30%)`);
console.log(`   Journal Prestige: ${score2010.journalPrestige.toFixed(1)} (weight: 50%)`);
console.log(`   Recency Bonus: ${score2010.recencyBoost.toFixed(1)} (weight: 20%)`);
console.log(`   Core Score: ${score2010.coreScore.toFixed(1)}`);
console.log(`   Total Score: ${score2010.totalScore.toFixed(1)}`);

// Verify old paper still scores well despite lower recency
assert(score2010.totalScore >= 70, 'Test 2.2a: Old high-quality paper scores ≥70', '≥70', score2010.totalScore.toFixed(1));
assert(score2010.recencyBoost === 20, 'Test 2.2b: Old paper gets 20 recency points', 20, score2010.recencyBoost);

// Test 2.3: Recent paper with low citations (benefits from recency)
const paper2024Low = {
  citationCount: 5,
  year: 2024,
  source: 'arxiv',
  quartile: 'Q2',
};

const score2024Low = calculateQualityScore(paper2024Low);
console.log(`\nTest 2.3: 2024 paper with 5 citations, Q2 journal`);
console.log(`   Citation Impact: ${score2024Low.citationImpact.toFixed(1)} (weight: 30%)`);
console.log(`   Journal Prestige: ${score2024Low.journalPrestige.toFixed(1)} (weight: 50%)`);
console.log(`   Recency Bonus: ${score2024Low.recencyBonus.toFixed(1)} (weight: 20%)`);
console.log(`   Core Score: ${score2024Low.coreScore.toFixed(1)}`);
console.log(`   Total Score: ${score2024Low.totalScore.toFixed(1)}`);

// Verify recency bonus helps recent papers with low citations
assert(score2024Low.recencyBonus === 100, 'Test 2.3a: Recent paper gets full recency bonus', 100, score2024Low.recencyBonus);
assert(score2024Low.totalScore > 40, 'Test 2.3b: Recent low-citation paper scores >40', '>40', score2024Low.totalScore.toFixed(1));

console.log('\n═══════════════════════════════════════════════════════════');
console.log('TEST SUITE 3: Citation Bias Reduction');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 3.1: Math paper (low citations, high quality)
const mathPaper = {
  citationCount: 20,
  year: 2022,
  source: 'arxiv',
  quartile: 'Q1',
  impactFactor: 3.0,
};

const mathScore = calculateQualityScore(mathPaper);
console.log(`\nTest 3.1: Math paper (2022, 20 citations, IF=3.0, Q1)`);
console.log(`   Citation Impact: ${mathScore.citationImpact.toFixed(1)} (30% weight)`);
console.log(`   Journal Prestige: ${mathScore.journalPrestige.toFixed(1)} (50% weight)`);
console.log(`   Recency Bonus: ${mathScore.recencyBoost.toFixed(1)} (20% weight)`);
console.log(`   Total Score: ${mathScore.totalScore.toFixed(1)}`);

// Test 3.2: Biology paper (high citations, high quality)
const bioPaper = {
  citationCount: 100,
  year: 2022,
  source: 'pubmed',
  quartile: 'Q1',
  impactFactor: 3.0,
};

const bioScore = calculateQualityScore(bioPaper);
console.log(`\nTest 3.2: Biology paper (2022, 100 citations, IF=3.0, Q1)`);
console.log(`   Citation Impact: ${bioScore.citationImpact.toFixed(1)} (30% weight)`);
console.log(`   Journal Prestige: ${bioScore.journalPrestige.toFixed(1)} (50% weight)`);
console.log(`   Recency Bonus: ${bioScore.recencyBoost.toFixed(1)} (20% weight)`);
console.log(`   Total Score: ${bioScore.totalScore.toFixed(1)}`);

// Verify citation weight is reduced (30% instead of 60%)
const citationDiff = bioScore.totalScore - mathScore.totalScore;
console.log(`\n   Score difference: ${citationDiff.toFixed(1)} points`);
assert(citationDiff < 20, 'Test 3.3: Citation bias reduced (diff <20 points)', '<20', citationDiff.toFixed(1));

console.log('\n═══════════════════════════════════════════════════════════');
console.log('TEST SUITE 4: Edge Cases');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 4.1: Paper with no year
const noYearPaper = {
  citationCount: 50,
  year: null,
  source: 'pubmed',
  impactFactor: 5.0,
};

const noYearScore = calculateQualityScore(noYearPaper);
console.log(`\nTest 4.1: Paper with no year data`);
console.log(`   Recency Bonus: ${noYearScore.recencyBoost} (should be 50 - neutral)`);
assert(noYearScore.recencyBonus === 50, 'Test 4.1: No year gets neutral 50', 50, noYearScore.recencyBoost);

// Test 4.2: Paper with no citations
const noCitePaper = {
  citationCount: 0,
  year: 2024,
  source: 'arxiv',
  quartile: 'Q1',
};

const noCiteScore = calculateQualityScore(noCitePaper);
console.log(`\nTest 4.2: Paper with 0 citations (2024, Q1)`);
console.log(`   Citation Impact: ${noCiteScore.citationImpact.toFixed(1)}`);
console.log(`   Total Score: ${noCiteScore.totalScore.toFixed(1)}`);
assert(noCiteScore.totalScore > 30, 'Test 4.2: Zero-citation recent paper scores >30', '>30', noCiteScore.totalScore.toFixed(1));

// Test 4.3: Paper with no journal metrics
const noJournalPaper = {
  citationCount: 50,
  year: 2023,
  source: 'arxiv',
};

const noJournalScore = calculateQualityScore(noJournalPaper);
console.log(`\nTest 4.3: Paper with no journal metrics (2023, 50 citations)`);
console.log(`   Journal Prestige: ${noJournalScore.journalPrestige.toFixed(1)}`);
console.log(`   Total Score: ${noJournalScore.totalScore.toFixed(1)}`);
assert(noJournalScore.totalScore > 20, 'Test 4.3: No journal metrics still scores >20', '>20', noJournalScore.totalScore.toFixed(1));

console.log('\n═══════════════════════════════════════════════════════════');
console.log('TEST SUITE 5: Weight Verification');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 5.1: Verify weights sum to 100%
const testPaper = {
  citationCount: 50,
  year: 2023,
  source: 'pubmed',
  impactFactor: 5.0,
  quartile: 'Q1',
};

const testScore = calculateQualityScore(testPaper);
const manualCore = testScore.citationImpact * 0.3 + testScore.journalPrestige * 0.5 + testScore.recencyBoost * 0.2;
const coreDiff = Math.abs(testScore.coreScore - manualCore);

console.log(`\nTest 5.1: Weight calculation verification`);
console.log(`   Citation Impact: ${testScore.citationImpact.toFixed(1)} × 0.30 = ${(testScore.citationImpact * 0.3).toFixed(1)}`);
console.log(`   Journal Prestige: ${testScore.journalPrestige.toFixed(1)} × 0.50 = ${(testScore.journalPrestige * 0.5).toFixed(1)}`);
console.log(`   Recency Bonus: ${testScore.recencyBoost.toFixed(1)} × 0.20 = ${(testScore.recencyBoost * 0.2).toFixed(1)}`);
console.log(`   Manual calculation: ${manualCore.toFixed(1)}`);
console.log(`   Actual core score: ${testScore.coreScore.toFixed(1)}`);
console.log(`   Difference: ${coreDiff.toFixed(2)}`);

assert(coreDiff < 0.5, 'Test 5.1: Weights correctly applied (30/50/20)', '<0.5 diff', coreDiff.toFixed(2));

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    TEST RESULTS SUMMARY                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`✅ Passed: ${passedTests} tests`);
console.log(`❌ Failed: ${failedTests} tests`);
console.log(`📊 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%\n`);

if (failedTests > 0) {
  console.log('❌ FAILED TESTS:');
  failures.forEach((f, i) => {
    console.log(`   ${i + 1}. ${f.testName}`);
    console.log(`      Expected: ${f.expected}`);
    console.log(`      Actual: ${f.actual}`);
  });
  console.log('');
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('VERIFICATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Quality scoring rebalanced (30/50/20)');
  console.log('✅ Recency bonus re-enabled');
  console.log('✅ Citation bias reduced');
  console.log('✅ Edge cases handled correctly');
  console.log('✅ All weights verified\n');
  process.exit(0);
}
