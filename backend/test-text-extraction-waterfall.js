/**
 * Test script for text extraction waterfall system
 * Tests all 4 tiers with real papers
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test papers covering different scenarios
const TEST_PAPERS = [
  {
    name: 'PMC Paper (Tier 2 - PMC API)',
    pmid: '33301246',
    doi: '10.1038/s41586-020-2649-2',
    expectedTier: 'pmc',
    description: 'Should extract from PubMed Central'
  },
  {
    name: 'MDPI Paper (Tier 2 - HTML Scraping)',
    doi: '10.3390/ijms21239103',
    url: 'https://www.mdpi.com/1422-0067/21/23/9103',
    expectedTier: 'html',
    description: 'Should extract from MDPI HTML'
  },
  {
    name: 'PDF Paper (Tier 2.5 - GROBID)',
    doi: '10.1016/j.cell.2020.04.011',
    expectedTier: 'grobid',
    description: 'Should extract using GROBID from PDF'
  },
  {
    name: 'Open Access Paper (Tier 3 - Unpaywall)',
    doi: '10.1371/journal.pone.0123456',
    expectedTier: 'unpaywall',
    description: 'Should extract from Unpaywall PDF'
  }
];

async function testTextExtraction() {
  console.log('🧪 Testing Text Extraction Waterfall System\n');
  console.log('=' .repeat(80));
  
  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const testPaper of TEST_PAPERS) {
    console.log(`\n📄 Testing: ${testPaper.name}`);
    console.log(`   Description: ${testPaper.description}`);
    console.log(`   Expected Tier: ${testPaper.expectedTier}`);
    
    try {
      // First, search for the paper to get its ID
      console.log('   🔍 Searching for paper...');
      
      const searchQuery = testPaper.doi || testPaper.pmid || testPaper.url;
      const searchResponse = await axios.post(`${API_BASE}/literature/search`, {
        query: searchQuery,
        sources: ['pubmed', 'semanticscholar'],
        maxResults: 5
      }, {
        timeout: 30000
      });

      if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
        console.log('   ❌ Paper not found in search');
        results.failed++;
        results.details.push({
          paper: testPaper.name,
          status: 'FAILED',
          reason: 'Paper not found'
        });
        continue;
      }

      const paper = searchResponse.data.results[0];
      console.log(`   ✅ Found paper: ${paper.id}`);
      console.log(`   📊 Title: ${paper.title.substring(0, 60)}...`);

      // Now trigger full-text extraction
      console.log('   📥 Triggering full-text extraction...');
      
      const extractResponse = await axios.post(
        `${API_BASE}/literature/papers/${paper.id}/full-text`,
        {},
        { timeout: 60000 }
      );

      const extractResult = extractResponse.data;
      
      console.log(`   📝 Extraction Status: ${extractResult.status}`);
      console.log(`   🎯 Source: ${extractResult.source || 'N/A'}`);
      console.log(`   📏 Word Count: ${extractResult.wordCount || 0}`);
      
      if (extractResult.status === 'success' && extractResult.wordCount > 100) {
        console.log('   ✅ PASSED - Full text extracted successfully');
        
        // Show preview
        if (extractResult.fullText) {
          const preview = extractResult.fullText.substring(0, 200);
          console.log(`   📖 Preview: ${preview}...`);
        }
        
        results.passed++;
        results.details.push({
          paper: testPaper.name,
          status: 'PASSED',
          source: extractResult.source,
          wordCount: extractResult.wordCount,
          expectedTier: testPaper.expectedTier,
          actualTier: extractResult.source
        });
      } else {
        console.log(`   ⚠️  PARTIAL - Extraction completed but low quality`);
        console.log(`   Reason: ${extractResult.error || 'Low word count'}`);
        
        results.failed++;
        results.details.push({
          paper: testPaper.name,
          status: 'PARTIAL',
          reason: extractResult.error || 'Low word count',
          wordCount: extractResult.wordCount
        });
      }

    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message}`);
      
      if (error.response) {
        console.log(`   HTTP Status: ${error.response.status}`);
        console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      results.failed++;
      results.details.push({
        paper: testPaper.name,
        status: 'FAILED',
        reason: error.message
      });
    }
    
    console.log('-'.repeat(80));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${results.passed}/${TEST_PAPERS.length}`);
  console.log(`❌ Failed: ${results.failed}/${TEST_PAPERS.length}`);
  console.log(`📈 Success Rate: ${((results.passed / TEST_PAPERS.length) * 100).toFixed(1)}%`);
  
  console.log('\n📋 DETAILED RESULTS:');
  results.details.forEach((detail, index) => {
    console.log(`\n${index + 1}. ${detail.paper}`);
    console.log(`   Status: ${detail.status}`);
    if (detail.source) {
      console.log(`   Source: ${detail.source}`);
      console.log(`   Expected: ${detail.expectedTier}`);
      console.log(`   Match: ${detail.source === detail.expectedTier ? '✅' : '⚠️'}`);
    }
    if (detail.wordCount) {
      console.log(`   Word Count: ${detail.wordCount}`);
    }
    if (detail.reason) {
      console.log(`   Reason: ${detail.reason}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  
  if (results.passed === TEST_PAPERS.length) {
    console.log('🎉 ALL TESTS PASSED - Waterfall system is working correctly!');
    process.exit(0);
  } else if (results.passed > 0) {
    console.log('⚠️  SOME TESTS FAILED - Waterfall system needs attention');
    process.exit(1);
  } else {
    console.log('❌ ALL TESTS FAILED - Waterfall system has critical issues');
    process.exit(1);
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log('✅ Backend is running\n');
    return true;
  } catch (error) {
    console.log('❌ Backend is not running!');
    console.log('Please start the backend with: cd backend && npm run start:dev');
    process.exit(1);
  }
}

// Main execution
(async () => {
  console.log('🚀 Text Extraction Waterfall Test Suite');
  console.log('=' .repeat(80));
  
  await checkBackend();
  await testTextExtraction();
})();
