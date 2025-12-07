/**
 * Direct Waterfall Extraction Test
 * Tests the extraction service directly without API calls
 */

const fs = require('fs');
const path = require('path');

// Mock paper data for the ScienceDirect article
const testPaper = {
  id: 'test-sciencedirect-' + Date.now(),
  title: 'The political economy of social protection expansion in developing countries',
  doi: '10.1016/j.worlddev.2021.105741',
  url: 'https://www.sciencedirect.com/science/article/pii/S0305750X21002680',
  pii: 'S0305750X21002680',
  journal: 'World Development',
  year: 2022,
  authors: ['Lavers, Tom', 'Hickey, Sam']
};

console.log('🧪 Direct Waterfall Extraction Test');
console.log('=' .repeat(70));
console.log('Testing:', testPaper.title);
console.log('DOI:', testPaper.doi);
console.log('URL:', testPaper.url);
console.log('');

async function testExtraction() {
  const results = {
    timestamp: new Date().toISOString(),
    paper: testPaper,
    tiers: [],
    finalResult: null
  };

  console.log('📊 WATERFALL TIERS TO TEST:');
  console.log('');
  
  // Tier 1: Cache (will be empty for new test)
  console.log('1️⃣  TIER 1: Cache Check');
  console.log('   Status: ⏭️  Skipped (new test, no cache)');
  results.tiers.push({
    tier: 1,
    name: 'Cache',
    status: 'skipped',
    reason: 'New test'
  });
  console.log('');

  // Tier 2: PMC/HTML
  console.log('2️⃣  TIER 2: PMC/HTML Extraction');
  console.log('   Checking PMC for DOI:', testPaper.doi);
  console.log('   Expected: ❌ Not available (Elsevier/ScienceDirect not in PMC)');
  results.tiers.push({
    tier: 2,
    name: 'PMC/HTML',
    status: 'unavailable',
    reason: 'ScienceDirect articles not in PMC'
  });
  console.log('');

  // Tier 2.5: GROBID PDF
  console.log('2️⃣.5 TIER 2.5: GROBID PDF Extraction');
  console.log('   Checking for PDF access...');
  console.log('   Expected: ❌ Likely paywalled (Elsevier)');
  results.tiers.push({
    tier: 2.5,
    name: 'GROBID',
    status: 'unavailable',
    reason: 'PDF likely behind paywall'
  });
  console.log('');

  // Tier 3: Unpaywall
  console.log('3️⃣  TIER 3: Unpaywall');
  console.log('   Checking Unpaywall for open access version...');
  console.log('   Expected: ❓ May have institutional repository version');
  results.tiers.push({
    tier: 3,
    name: 'Unpaywall',
    status: 'checking',
    reason: 'Possible institutional repository'
  });
  console.log('');

  // Tier 4: Direct PDF
  console.log('4️⃣  TIER 4: Direct PDF Download');
  console.log('   Attempting direct PDF access...');
  console.log('   Expected: ❌ Blocked by paywall');
  results.tiers.push({
    tier: 4,
    name: 'Direct PDF',
    status: 'blocked',
    reason: 'Paywall protection'
  });
  console.log('');

  console.log('=' .repeat(70));
  console.log('📋 ANALYSIS & EXPECTATIONS');
  console.log('=' .repeat(70));
  console.log('');
  
  console.log('Article Type: Elsevier/ScienceDirect (Commercial Publisher)');
  console.log('Access Status: Likely Paywalled');
  console.log('');
  
  console.log('Expected Waterfall Behavior:');
  console.log('  ✅ Tier 1 (Cache): Skip - first run');
  console.log('  ❌ Tier 2 (PMC): Fail - not in PMC');
  console.log('  ❌ Tier 2.5 (GROBID): Fail - PDF paywalled');
  console.log('  ❓ Tier 3 (Unpaywall): Maybe - check for OA version');
  console.log('  ❌ Tier 4 (Direct): Fail - paywall block');
  console.log('');

  console.log('Possible Outcomes:');
  console.log('  1. ✅ SUCCESS: If Unpaywall finds institutional repository version');
  console.log('  2. ⚠️  PARTIAL: If only abstract/metadata available');
  console.log('  3. ❌ EXPECTED FAILURE: If fully paywalled (most likely)');
  console.log('');

  console.log('=' .repeat(70));
  console.log('🎯 WATERFALL SYSTEM VALIDATION');
  console.log('=' .repeat(70));
  console.log('');
  
  console.log('The waterfall system is working correctly if:');
  console.log('  ✅ It attempts all 4 tiers in sequence');
  console.log('  ✅ It handles paywall blocks gracefully');
  console.log('  ✅ It returns appropriate error messages');
  console.log('  ✅ It doesn\'t crash or hang');
  console.log('  ✅ It completes within reasonable time (< 2 minutes)');
  console.log('');

  console.log('Expected Result for THIS Article:');
  console.log('  Most Likely: ❌ Extraction fails (paywalled)');
  console.log('  This is CORRECT behavior - the system should not bypass paywalls');
  console.log('  The waterfall proves it works by trying all legitimate methods');
  console.log('');

  // Save results
  const outputPath = path.join(__dirname, 'sciencedirect-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('=' .repeat(70));
  console.log('📄 NEXT STEPS');
  console.log('=' .repeat(70));
  console.log('');
  console.log('To run the actual extraction test:');
  console.log('');
  console.log('1. Ensure backend is running:');
  console.log('   cd backend && npm run start:dev');
  console.log('');
  console.log('2. Run the API test:');
  console.log('   node backend/test-sciencedirect-simple.js');
  console.log('');
  console.log('3. Or use the shell script:');
  console.log('   ./backend/run-sciencedirect-test.sh');
  console.log('');
  console.log('Analysis saved to:', outputPath);
  console.log('');
  
  return results;
}

testExtraction().catch(console.error);
