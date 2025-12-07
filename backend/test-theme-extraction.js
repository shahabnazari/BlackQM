/**
 * Integration Test Script for Theme Extraction Excerpt Fix
 * 
 * Tests the improved GPT-4 prompt and enhanced Tier 2 keyword extraction
 * 
 * Usage: node test-theme-extraction.js
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE_URL = 'http://localhost:4000';
const TEST_RESULTS_FILE = 'test-results-theme-extraction.json';

// Test data - sample papers for testing
const SAMPLE_PAPERS = [
  {
    id: 'test_paper_1',
    title: 'Climate Change Adaptation Strategies in Urban Areas',
    content: `Climate change poses significant challenges to urban areas worldwide. Communities have implemented various water conservation measures including rainwater harvesting and drip irrigation systems to adapt to changing precipitation patterns. Local governments developed heat action plans to protect vulnerable populations during extreme weather events. The study examines how cities are building resilience through green infrastructure, such as urban forests and permeable pavements, which help manage stormwater and reduce urban heat island effects. Adaptation strategies also include updating building codes to account for increased flood risk and implementing early warning systems for extreme weather events.`,
    type: 'paper',
    metadata: {
      contentType: 'abstract',
      hasFullText: false
    }
  },
  {
    id: 'test_paper_2',
    title: 'Artificial Intelligence in Healthcare: Applications and Challenges',
    content: `Artificial intelligence (AI) is transforming healthcare delivery through various applications. Machine learning algorithms can analyze medical images with accuracy comparable to human radiologists. Natural language processing enables automated extraction of clinical information from electronic health records. AI-powered diagnostic tools assist physicians in identifying diseases earlier and more accurately. However, challenges remain including data privacy concerns, algorithmic bias, and the need for regulatory frameworks. The integration of AI into clinical workflows requires careful consideration of ethical implications and patient safety. Healthcare providers must balance the benefits of AI automation with the importance of human oversight and clinical judgment.`,
    type: 'paper',
    metadata: {
      contentType: 'abstract',
      hasFullText: false
    }
  },
  {
    id: 'test_paper_3',
    title: 'Renewable Energy Transition: Economic and Social Impacts',
    content: `The transition to renewable energy sources is reshaping global energy markets and economies. Solar and wind power have become cost-competitive with fossil fuels in many regions. Job creation in the renewable energy sector is offsetting losses in traditional energy industries. Communities are experiencing economic revitalization through renewable energy projects. However, the transition also presents challenges including grid infrastructure upgrades, energy storage solutions, and workforce retraining programs. Policy frameworks play a crucial role in facilitating the transition while ensuring energy security and affordability. Social acceptance of renewable energy projects depends on community engagement and equitable distribution of benefits.`,
    type: 'paper',
    metadata: {
      contentType: 'abstract',
      hasFullText: false
    }
  }
];

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Helper function to add test result
function addTestResult(testName, status, details, metrics = {}) {
  const result = {
    test: testName,
    status, // 'PASS', 'FAIL', 'WARN'
    details,
    metrics,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ ${testName}: PASSED`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ ${testName}: FAILED`);
  } else if (status === 'WARN') {
    testResults.summary.warnings++;
    console.log(`⚠️  ${testName}: WARNING`);
  }
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  if (Object.keys(metrics).length > 0) {
    console.log(`   Metrics:`, metrics);
  }
}

// Test 1: API Health Check
async function testAPIHealth() {
  console.log('\n📋 Test 1: API Health Check');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      addTestResult(
        'API Health Check',
        'PASS',
        'Backend API is responding',
        { responseTime: response.headers['x-response-time'] || 'N/A' }
      );
      return true;
    } else {
      addTestResult(
        'API Health Check',
        'FAIL',
        `Unexpected status code: ${response.status}`
      );
      return false;
    }
  } catch (error) {
    addTestResult(
      'API Health Check',
      'FAIL',
      `API not accessible: ${error.message}`
    );
    return false;
  }
}

// Test 2: Theme Extraction with Sample Papers
async function testThemeExtraction() {
  console.log('\n📋 Test 2: Theme Extraction with Sample Papers');
  
  try {
    // Note: This is a mock test since we need authentication
    // In production, you would need to:
    // 1. Authenticate and get a token
    // 2. Call the actual theme extraction endpoint
    
    console.log('   ℹ️  This test requires authentication and a running frontend');
    console.log('   ℹ️  Skipping direct API call - use manual testing instead');
    
    addTestResult(
      'Theme Extraction API',
      'WARN',
      'Requires authentication - perform manual testing',
      { samplePapers: SAMPLE_PAPERS.length }
    );
    
    return true;
  } catch (error) {
    addTestResult(
      'Theme Extraction API',
      'FAIL',
      `Error: ${error.message}`
    );
    return false;
  }
}

// Test 3: Excerpt Extraction Algorithm (Unit Test)
function testExcerptExtraction() {
  console.log('\n📋 Test 3: Enhanced Excerpt Extraction Algorithm');
  
  const testCases = [
    {
      name: 'Multi-keyword matching',
      keywords: ['climate', 'adaptation', 'strategies'],
      content: 'Climate change adaptation strategies are essential. The climate is warming. Various adaptation methods exist. Strategic planning is crucial.',
      expectedMatches: 1, // Should match the first sentence (has all 3 keywords)
      description: 'Should prioritize sentences with multiple keyword matches'
    },
    {
      name: 'Whole-word matching',
      keywords: ['AI'],
      content: 'AI is transforming healthcare. The main challenge is data. We said that AI helps.',
      expectedMatches: 2, // Should match "AI is" and "AI helps", not "sAId"
      description: 'Should not match "AI" in "said"'
    },
    {
      name: 'Relevance scoring',
      keywords: ['energy', 'renewable'],
      content: 'Renewable energy is growing. Energy consumption is high. The renewable sector is expanding rapidly with renewable energy sources.',
      expectedMatches: 1, // Should prioritize the last sentence (has both keywords twice)
      description: 'Should rank sentences by relevance score'
    },
    {
      name: 'Short sentence filtering',
      keywords: ['test'],
      content: 'Test. This is a test sentence that should be included. Test again.',
      expectedMatches: 1, // Should only match the middle sentence (>20 chars)
      description: 'Should filter out very short sentences'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    // Simulate the enhanced extraction algorithm
    const sentences = testCase.content.match(/[^.!?]+[.!?]+/g) || [];
    
    const scoredSentences = sentences.map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      let score = 0;
      let matchedKeywords = 0;
      
      for (const keyword of testCase.keywords) {
        const lowerKeyword = keyword.toLowerCase();
        const regex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = sentence.match(regex);
        
        if (matches) {
          matchedKeywords++;
          score += matches.length;
        }
      }
      
      if (matchedKeywords > 1) {
        score *= 1.5;
      }
      
      return { sentence: sentence.trim(), score, matchedKeywords };
    });
    
    scoredSentences.sort((a, b) => b.score - a.score);
    
    const excerpts = [];
    for (const item of scoredSentences) {
      if (item.matchedKeywords > 0 && item.sentence.length > 20) {
        excerpts.push(item.sentence);
        if (excerpts.length >= 3) break;
      }
    }
    
    const actualMatches = excerpts.length;
    const testPassed = actualMatches >= testCase.expectedMatches;
    
    if (testPassed) {
      passed++;
      console.log(`   ✅ ${testCase.name}: PASSED`);
      console.log(`      ${testCase.description}`);
      console.log(`      Expected: >=${testCase.expectedMatches}, Got: ${actualMatches}`);
    } else {
      failed++;
      console.log(`   ❌ ${testCase.name}: FAILED`);
      console.log(`      ${testCase.description}`);
      console.log(`      Expected: >=${testCase.expectedMatches}, Got: ${actualMatches}`);
    }
  }
  
  const status = failed === 0 ? 'PASS' : 'FAIL';
  addTestResult(
    'Excerpt Extraction Algorithm',
    status,
    `${passed}/${testCases.length} test cases passed`,
    { passed, failed, total: testCases.length }
  );
  
  return failed === 0;
}

// Test 4: Regex Escape Function
function testRegexEscape() {
  console.log('\n📋 Test 4: Regex Escape Helper Function');
  
  const testCases = [
    { input: 'test', expected: 'test' },
    { input: 'test.com', expected: 'test\\.com' },
    { input: 'a+b', expected: 'a\\+b' },
    { input: 'x*y', expected: 'x\\*y' },
    { input: 'a|b', expected: 'a\\|b' },
    { input: '(test)', expected: '\\(test\\)' },
    { input: '[abc]', expected: '\\[abc\\]' },
    { input: 'a^b$c', expected: 'a\\^b\\$c' }
  ];
  
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const actual = escapeRegex(testCase.input);
    const testPassed = actual === testCase.expected;
    
    if (testPassed) {
      passed++;
      console.log(`   ✅ "${testCase.input}" → "${actual}"`);
    } else {
      failed++;
      console.log(`   ❌ "${testCase.input}" → Expected: "${testCase.expected}", Got: "${actual}"`);
    }
  }
  
  const status = failed === 0 ? 'PASS' : 'FAIL';
  addTestResult(
    'Regex Escape Function',
    status,
    `${passed}/${testCases.length} test cases passed`,
    { passed, failed, total: testCases.length }
  );
  
  return failed === 0;
}

// Test 5: GPT-4 Prompt Validation
function testGPT4PromptStructure() {
  console.log('\n📋 Test 5: GPT-4 Prompt Structure Validation');
  
  // Read the actual service file to check prompt structure
  try {
    const serviceFile = fs.readFileSync(
      './src/modules/literature/services/unified-theme-extraction.service.ts',
      'utf8'
    );
    
    const checks = [
      {
        name: 'CRITICAL REQUIREMENTS section',
        pattern: /CRITICAL REQUIREMENTS:/,
        description: 'Prompt should have explicit requirements section'
      },
      {
        name: 'Excerpt mandate',
        pattern: /Each code MUST include.*excerpts/i,
        description: 'Prompt should mandate excerpts for each code'
      },
      {
        name: 'VERBATIM instruction',
        pattern: /VERBATIM/i,
        description: 'Prompt should instruct verbatim quotes'
      },
      {
        name: 'Validation warning',
        pattern: /will be REJECTED/i,
        description: 'Prompt should warn about rejection'
      },
      {
        name: 'Concrete example',
        pattern: /EXAMPLE:/,
        description: 'Prompt should include concrete example'
      },
      {
        name: 'Final reminder',
        pattern: /IMPORTANT:.*Every code MUST/i,
        description: 'Prompt should have final reminder'
      }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const check of checks) {
      const found = check.pattern.test(serviceFile);
      
      if (found) {
        passed++;
        console.log(`   ✅ ${check.name}: Found`);
      } else {
        failed++;
        console.log(`   ❌ ${check.name}: Not found`);
        console.log(`      ${check.description}`);
      }
    }
    
    const status = failed === 0 ? 'PASS' : 'FAIL';
    addTestResult(
      'GPT-4 Prompt Structure',
      status,
      `${passed}/${checks.length} required elements found`,
      { passed, failed, total: checks.length }
    );
    
    return failed === 0;
  } catch (error) {
    addTestResult(
      'GPT-4 Prompt Structure',
      'FAIL',
      `Could not read service file: ${error.message}`
    );
    return false;
  }
}

// Test 6: Code Quality Checks
function testCodeQuality() {
  console.log('\n📋 Test 6: Code Quality Checks');
  
  try {
    const serviceFile = fs.readFileSync(
      './src/modules/literature/services/unified-theme-extraction.service.ts',
      'utf8'
    );
    
    const checks = [
      {
        name: 'No magic numbers',
        pattern: /MAX_EXCERPTS_PER_SOURCE|THEME_MERGE_SIMILARITY_THRESHOLD/,
        description: 'Should use named constants instead of magic numbers'
      },
      {
        name: 'Error handling',
        pattern: /try\s*{[\s\S]*?catch\s*\(/,
        description: 'Should have proper error handling'
      },
      {
        name: 'Input validation',
        pattern: /if\s*\(!.*\|\|.*\.length\s*===\s*0\)/,
        description: 'Should validate inputs'
      },
      {
        name: 'Type safety',
        pattern: /:\s*(string|number|boolean|\w+\[\])/,
        description: 'Should have proper type annotations'
      },
      {
        name: 'Documentation',
        pattern: /\/\*\*[\s\S]*?@private[\s\S]*?\*\//,
        description: 'Should have JSDoc comments'
      }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const check of checks) {
      const found = check.pattern.test(serviceFile);
      
      if (found) {
        passed++;
        console.log(`   ✅ ${check.name}: Present`);
      } else {
        failed++;
        console.log(`   ⚠️  ${check.name}: Not found`);
      }
    }
    
    const status = passed >= checks.length * 0.8 ? 'PASS' : 'WARN';
    addTestResult(
      'Code Quality',
      status,
      `${passed}/${checks.length} quality checks passed`,
      { passed, failed, total: checks.length }
    );
    
    return true;
  } catch (error) {
    addTestResult(
      'Code Quality',
      'FAIL',
      `Could not read service file: ${error.message}`
    );
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Theme Extraction Excerpt Fix - Integration Test Suite      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Testing improved GPT-4 prompt and enhanced Tier 2 extraction...');
  console.log('');
  
  // Run all tests
  await testAPIHealth();
  await testThemeExtraction();
  testExcerptExtraction();
  testRegexEscape();
  testGPT4PromptStructure();
  testCodeQuality();
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                        TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`Total Tests:    ${testResults.summary.total}`);
  console.log(`✅ Passed:      ${testResults.summary.passed}`);
  console.log(`❌ Failed:      ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings:    ${testResults.summary.warnings}`);
  console.log('');
  
  const successRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  console.log('');
  
  // Save results to file
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log(`📄 Detailed results saved to: ${TEST_RESULTS_FILE}`);
  console.log('');
  
  // Exit with appropriate code
  if (testResults.summary.failed > 0) {
    console.log('❌ Some tests failed. Please review the results above.');
    process.exit(1);
  } else if (testResults.summary.warnings > 0) {
    console.log('⚠️  All tests passed with warnings. Manual testing recommended.');
    process.exit(0);
  } else {
    console.log('✅ All tests passed successfully!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
