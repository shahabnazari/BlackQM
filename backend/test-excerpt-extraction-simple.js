#!/usr/bin/env node
/**
 * Simple Synchronous Test for Excerpt Extraction
 * Tests the core algorithm improvements without async dependencies
 */

const fs = require('fs');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   Theme Extraction Excerpt Fix - Core Algorithm Tests        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper: Escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: Enhanced excerpt extraction (mirrors the actual implementation)
function extractRelevantExcerpts(keywords, content, maxExcerpts = 3) {
  const excerpts = [];
  
  // Better sentence splitting
  const sentences = content.match(/[^.!?]+[.!?]+/g) || content.split(/[.!?]+/);
  
  // Score each sentence by keyword relevance
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    let matchedKeywords = 0;
    
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();
      const regex = new RegExp(`\\b${escapeRegex(lowerKeyword)}\\b`, 'gi');
      const matches = sentence.match(regex);
      
      if (matches) {
        matchedKeywords++;
        score += matches.length;
      }
    }
    
    // Bonus for matching multiple keywords
    if (matchedKeywords > 1) {
      score *= 1.5;
    }
    
    return { 
      sentence: sentence.trim(), 
      score, 
      matchedKeywords 
    };
  });
  
  // Sort by score (best matches first)
  scoredSentences.sort((a, b) => b.score - a.score);
  
  // Return top N sentences with at least 1 keyword match
  for (const item of scoredSentences) {
    if (item.matchedKeywords > 0 && item.sentence.length > 20) {
      excerpts.push(item.sentence);
      if (excerpts.length >= maxExcerpts) break;
    }
  }
  
  return excerpts;
}

// Test runner
function runTest(testName, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result.passed) {
      passedTests++;
      console.log(`✅ ${testName}: PASSED`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    } else {
      failedTests++;
      console.log(`❌ ${testName}: FAILED`);
      console.log(`   ${result.details}`);
    }
  } catch (error) {
    failedTests++;
    console.log(`❌ ${testName}: ERROR`);
    console.log(`   ${error.message}`);
  }
  console.log('');
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log('📋 Test 1: Regex Escape Function\n');

runTest('Escape basic characters', () => {
  const input = 'test.com';
  const expected = 'test\\.com';
  const actual = escapeRegex(input);
  return {
    passed: actual === expected,
    details: `Input: "${input}" → Output: "${actual}" (Expected: "${expected}")`
  };
});

runTest('Escape special regex chars', () => {
  const input = 'a+b*c|d(e)[f]^g$h';
  const result = escapeRegex(input);
  const hasEscapes = result.includes('\\+') && result.includes('\\*') && result.includes('\\|');
  return {
    passed: hasEscapes,
    details: `All special characters properly escaped: ${hasEscapes}`
  };
});

console.log('📋 Test 2: Multi-Keyword Matching\n');

runTest('Prioritize multi-keyword sentences', () => {
  const keywords = ['climate', 'adaptation', 'strategies'];
  const content = 'Climate change is real. Climate adaptation strategies are essential. The weather is changing.';
  const excerpts = extractRelevantExcerpts(keywords, content, 1);
  
  const topExcerpt = excerpts[0] || '';
  const hasAllKeywords = keywords.every(k => topExcerpt.toLowerCase().includes(k));
  
  return {
    passed: hasAllKeywords && excerpts.length > 0,
    details: `Top excerpt has all 3 keywords: ${hasAllKeywords}\n   Excerpt: "${topExcerpt}"`
  };
});

console.log('📋 Test 3: Whole-Word Matching\n');

runTest('Avoid substring false positives', () => {
  const keywords = ['AI'];
  const content = 'AI is transforming healthcare. We said that technology helps. AI systems are advanced.';
  const excerpts = extractRelevantExcerpts(keywords, content, 3);
  
  // Should match "AI is" and "AI systems", but NOT "sAId"
  const hasFalsePositive = excerpts.some(e => e.includes('said') && !e.match(/\bAI\b/));
  const hasCorrectMatches = excerpts.length >= 2;
  
  return {
    passed: !hasFalsePositive && hasCorrectMatches,
    details: `No false positives: ${!hasFalsePositive}, Found ${excerpts.length} correct matches\n   Excerpts: ${excerpts.map(e => `"${e}"`).join(', ')}`
  };
});

console.log('📋 Test 4: Relevance Scoring\n');

runTest('Rank by keyword frequency', () => {
  const keywords = ['energy', 'renewable'];
  const content = 'Energy is important. Renewable energy sources are growing. The renewable energy sector has renewable power and energy solutions.';
  const excerpts = extractRelevantExcerpts(keywords, content, 1);
  
  const topExcerpt = excerpts[0] || '';
  const keywordCount = (topExcerpt.match(/\b(energy|renewable)\b/gi) || []).length;
  
  return {
    passed: keywordCount >= 3 && excerpts.length > 0,
    details: `Top excerpt has ${keywordCount} keyword occurrences (expected ≥3)\n   Excerpt: "${topExcerpt}"`
  };
});

console.log('📋 Test 5: Short Sentence Filtering\n');

runTest('Filter out very short sentences', () => {
  const keywords = ['test'];
  const content = 'Test. This is a proper test sentence with sufficient length. Test again.';
  const excerpts = extractRelevantExcerpts(keywords, content, 3);
  
  const allLongEnough = excerpts.every(e => e.length > 20);
  const hasCorrectSentence = excerpts.some(e => e.includes('proper test sentence'));
  
  return {
    passed: allLongEnough && hasCorrectSentence,
    details: `All excerpts >20 chars: ${allLongEnough}, Has correct sentence: ${hasCorrectSentence}\n   Excerpts: ${excerpts.map(e => `"${e}" (${e.length} chars)`).join(', ')}`
  };
});

console.log('📋 Test 6: GPT-4 Prompt Structure\n');

runTest('Verify improved prompt exists', () => {
  try {
    const serviceFile = fs.readFileSync(
      './src/modules/literature/services/unified-theme-extraction.service.ts',
      'utf8'
    );
    
    const hasRequirements = serviceFile.includes('CRITICAL REQUIREMENTS:');
    const hasMandateExcerpts = /Each code MUST include.*excerpts/i.test(serviceFile);
    const hasVerbatim = /VERBATIM/i.test(serviceFile);
    const hasWarning = /will be REJECTED/i.test(serviceFile);
    const hasExample = serviceFile.includes('EXAMPLE:');
    const hasReminder = /IMPORTANT:.*Every code MUST/i.test(serviceFile);
    
    const allPresent = hasRequirements && hasMandateExcerpts && hasVerbatim && 
                       hasWarning && hasExample && hasReminder;
    
    return {
      passed: allPresent,
      details: `Requirements: ${hasRequirements}, Mandate: ${hasMandateExcerpts}, Verbatim: ${hasVerbatim}\n   Warning: ${hasWarning}, Example: ${hasExample}, Reminder: ${hasReminder}`
    };
  } catch (error) {
    return {
      passed: false,
      details: `Could not read service file: ${error.message}`
    };
  }
});

console.log('📋 Test 7: Enhanced Extraction Implementation\n');

runTest('Verify enhanced extraction exists', () => {
  try {
    const serviceFile = fs.readFileSync(
      './src/modules/literature/services/unified-theme-extraction.service.ts',
      'utf8'
    );
    
    const hasScoring = serviceFile.includes('scoredSentences');
    const hasWholeWord = serviceFile.includes('\\\\b');
    const hasMultiKeywordBonus = serviceFile.includes('* 1.5');
    const hasSorting = serviceFile.includes('.sort((a, b) => b.score - a.score)');
    const hasLengthFilter = serviceFile.includes('sentence.length > 20');
    
    const allPresent = hasScoring && hasWholeWord && hasMultiKeywordBonus && 
                       hasSorting && hasLengthFilter;
    
    return {
      passed: allPresent,
      details: `Scoring: ${hasScoring}, Whole-word: ${hasWholeWord}, Bonus: ${hasMultiKeywordBonus}\n   Sorting: ${hasSorting}, Length filter: ${hasLengthFilter}`
    };
  } catch (error) {
    return {
      passed: false,
      details: `Could not read service file: ${error.message}`
    };
  }
});

runTest('Verify escapeRegex helper exists', () => {
  try {
    const serviceFile = fs.readFileSync(
      './src/modules/literature/services/unified-theme-extraction.service.ts',
      'utf8'
    );
    
    const hasEscapeRegex = serviceFile.includes('escapeRegex');
    const hasImplementation = serviceFile.includes('replace(/[.*+?^${}()|[\\]\\\\]/g');
    
    return {
      passed: hasEscapeRegex && hasImplementation,
      details: `Function exists: ${hasEscapeRegex}, Implementation found: ${hasImplementation}`
    };
  } catch (error) {
    return {
      passed: false,
      details: `Could not read service file: ${error.message}`
    };
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                        TEST SUMMARY                            ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`Total Tests:    ${totalTests}`);
console.log(`✅ Passed:      ${passedTests}`);
console.log(`❌ Failed:      ${failedTests}`);
console.log('');

const successRate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(`Success Rate: ${successRate}%\n`);

// Save results
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: parseFloat(successRate)
  }
};

fs.writeFileSync('test-results-simple.json', JSON.stringify(results, null, 2));
console.log('📄 Results saved to: test-results-simple.json\n');

if (failedTests > 0) {
  console.log('❌ Some tests failed. Please review the results above.\n');
  process.exit(1);
} else {
  console.log('✅ All tests passed successfully!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Start the application (frontend + backend)');
  console.log('   2. Search for "lemonade" (172 papers)');
  console.log('   3. Extract themes using Q-Methodology');
  console.log('   4. Check browser console for:');
  console.log('      - Theme count >0 (was 0 before fix)');
  console.log('      - "Code X has Y excerpts from GPT-4 ✅" messages');
  console.log('      - Excerpt source distribution (Tier 1/2/3)\n');
  process.exit(0);
}
