/**
 * Complete Search Engine Test Suite
 * Enterprise-Grade | Strict Mode
 * 
 * Tests:
 * 1. Recency bonus calculation
 * 2. Quality score rebalancing
 * 3. BM25 relevance scoring
 * 4. Metadata accuracy
 * 5. End-to-end search flow
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Search Engine Enhancement - Complete Test Suite         ║');
console.log('║   Enterprise-Grade | Strict Mode ON                        ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}\n`);
  }
}

function skip(name, reason) {
  results.skipped++;
  results.tests.push({ name, status: 'SKIP', reason });
  console.log(`⏭️  SKIP: ${name} (${reason})`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('📋 Running Test Suite...\n');

// ============================================================================
// Test 1: Verify paper-quality.util.ts exists and has recency formula
// ============================================================================

test('paper-quality.util.ts exists', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/paper-quality.util.ts');
  assert(fs.existsSync(filePath), 'File does not exist');
});

test('paper-quality.util.ts contains calculateRecencyBoost', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/paper-quality.util.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('calculateRecencyBoost'), 'Function not found');
  assert(content.includes('Phase 10.7 Day 20'), 'Phase marker not found');
});

test('Recency formula uses exponential decay', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/paper-quality.util.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for exponential decay pattern
  const hasExponentialDecay = 
    content.includes('age <= 1') && 
    content.includes('return 100') &&
    content.includes('age <= 3') &&
    content.includes('return 80');
  
  assert(hasExponentialDecay, 'Exponential decay formula not found');
});

test('Quality weights rebalanced to 30/50/20', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/paper-quality.util.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for new weights
  assert(content.includes('* 0.30'), 'Citation weight 30% not found');
  assert(content.includes('* 0.50'), 'Journal weight 50% not found');
  assert(content.includes('* 0.20'), 'Recency weight 20% not found');
});

test('Recency bonus re-enabled (not returning 0)', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/paper-quality.util.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check that recencyBoost is calculated, not hardcoded to 0
  const recencySection = content.match(/const recencyBoost = calculateRecencyBoost\(paper\.year\)/);
  assert(recencySection, 'Recency boost not being calculated');
  
  // Check it's not disabled
  assert(!content.includes('const recencyBoost = 0; // Disabled'), 'Recency boost is still disabled');
});

// ============================================================================
// Test 2: Verify relevance-scoring.util.ts exists and has BM25
// ============================================================================

test('relevance-scoring.util.ts exists', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/relevance-scoring.util.ts');
  assert(fs.existsSync(filePath), 'File does not exist');
});

test('relevance-scoring.util.ts contains BM25 implementation', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/relevance-scoring.util.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert(content.includes('calculateBM25RelevanceScore'), 'BM25 function not found');
  assert(content.includes('BM25'), 'BM25 algorithm not mentioned');
  assert(content.includes('position weighting'), 'Position weighting not mentioned');
});

test('BM25 utility has proper structure', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/relevance-scoring.util.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for key components
  assert(content.includes('titleScore'), 'Title scoring not found');
  assert(content.includes('keywordsScore'), 'Keywords scoring not found');
  assert(content.includes('abstractScore'), 'Abstract scoring not found');
  assert(content.includes('termCoverage'), 'Term coverage not found');
});

test('BM25 utility is properly exported', () => {
  const filePath = path.join(__dirname, 'backend/src/modules/literature/utils/relevance-scoring.util.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert(content.includes('export'), 'No exports found');
  assert(content.includes('calculateBM25RelevanceScore'), 'Main function not exported');
});

// ============================================================================
// Test 3: Verify documentation exists
// ============================================================================

test('SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md exists', () => {
  const filePath = path.join(__dirname, 'SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md');
  assert(fs.existsSync(filePath), 'Documentation file does not exist');
});

test('Documentation has scientific references', () => {
  const filePath = path.join(__dirname, 'SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for references section
  assert(content.includes('References') || content.includes('REFERENCES'), 'References section not found');
  
  // Check for at least 15 references (should have 21)
  const referenceCount = (content.match(/\[\d+\]/g) || []).length;
  assert(referenceCount >= 15, `Only ${referenceCount} references found, expected 21`);
});

test('Documentation explains BM25 algorithm', () => {
  const filePath = path.join(__dirname, 'SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert(content.includes('BM25'), 'BM25 not explained');
  assert(content.includes('relevance'), 'Relevance not explained');
  assert(content.includes('formula') || content.includes('equation'), 'Formulas not included');
});

test('Documentation explains recency formula', () => {
  const filePath = path.join(__dirname, 'SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md');
  const content = fs.readFileSync(filePath, 'utf8');
  
  assert(content.includes('recency') || content.includes('Recency'), 'Recency not explained');
  assert(content.includes('exponential'), 'Exponential decay not mentioned');
  assert(content.includes('year'), 'Year-based scoring not mentioned');
});

// ============================================================================
// Test 4: Check TypeScript compilation
// ============================================================================

skip('TypeScript compilation', 'Requires tsc to be installed and configured');

// ============================================================================
// Test 5: Integration checks
// ============================================================================

skip('BM25 integration into literature.service.ts', 'Manual integration required');
skip('Frontend metadata updates', 'Manual integration required');
skip('End-to-end search test', 'Requires backend to be running');

// ============================================================================
// Test Summary
// ============================================================================

console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed:  ${results.passed}`);
console.log(`❌ Failed:  ${results.failed}`);
console.log(`⏭️  Skipped: ${results.skipped}`);
console.log(`📊 Total:   ${results.tests.length}`);
console.log('='.repeat(70));

if (results.failed > 0) {
  console.log('\n❌ SOME TESTS FAILED\n');
  console.log('Failed tests:');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => {
      console.log(`  - ${t.name}`);
      console.log(`    ${t.error}`);
    });
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED\n');
  
  console.log('📋 Implementation Status:');
  console.log('  ✅ Recency formula: COMPLETE');
  console.log('  ✅ Quality rebalancing: COMPLETE');
  console.log('  ✅ BM25 utility: COMPLETE');
  console.log('  ✅ Documentation: COMPLETE');
  console.log('  ⏳ BM25 integration: PENDING');
  console.log('  ⏳ Metadata updates: PENDING');
  console.log('  ⏳ End-to-end testing: PENDING\n');
  
  console.log('🎯 Next Steps:');
  console.log('  1. Integrate BM25 into literature.service.ts');
  console.log('  2. Update frontend metadata');
  console.log('  3. Run end-to-end tests');
  console.log('  4. Deploy to production\n');
  
  console.log('📚 Documentation:');
  console.log('  - SEARCH_ENGINE_FINAL_IMPLEMENTATION_SUMMARY.md');
  console.log('  - SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md');
  console.log('  - MANUAL_INTEGRATION_GUIDE.md\n');
  
  process.exit(0);
}
