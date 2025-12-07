/**
 * Test text extraction for specific ScienceDirect paper
 * URL: https://www.sciencedirect.com/science/article/pii/S0305750X21002680?via%3Dihub
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const TEST_URL = 'https://www.sciencedirect.com/science/article/pii/S0305750X21002680?via%3Dihub';

async function testScienceDirectExtraction() {
  console.log('🧪 Testing ScienceDirect Paper Text Extraction');
  console.log('=' .repeat(80));
  console.log(`📄 URL: ${TEST_URL}\n`);

  try {
    // Step 1: Check backend health
    console.log('1️⃣  Checking backend status...');
    try {
      await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      console.log('   ✅ Backend is running\n');
    } catch (error) {
      console.log('   ❌ Backend is not running!');
      console.log('   Please start: cd backend && npm run start:dev');
      process.exit(1);
    }

    // Step 2: Search for the paper
    console.log('2️⃣  Searching for paper by URL...');
    const searchResponse = await axios.post(`${API_BASE}/literature/search`, {
      query: TEST_URL,
      sources: ['pubmed', 'semanticscholar', 'crossref'],
      maxResults: 5
    }, {
      timeout: 30000
    });

    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      console.log('   ⚠️  Paper not found via search, trying DOI extraction...');
      
      // Try to extract DOI from URL
      const doiMatch = TEST_URL.match(/pii\/([A-Z0-9]+)/);
      if (doiMatch) {
        const pii = doiMatch[1];
        console.log(`   📋 Extracted PII: ${pii}`);
        console.log('   🔍 Searching by PII...');
        
        const doiSearchResponse = await axios.post(`${API_BASE}/literature/search`, {
          query: pii,
          sources: ['crossref', 'semanticscholar'],
          maxResults: 5
        }, {
          timeout: 30000
        });
        
        if (doiSearchResponse.data.results && doiSearchResponse.data.results.length > 0) {
          const paper = doiSearchResponse.data.results[0];
          console.log(`   ✅ Found paper: ${paper.id}`);
          console.log(`   📊 Title: ${paper.title}`);
          console.log(`   📖 DOI: ${paper.doi || 'N/A'}`);
          console.log(`   🔗 URL: ${paper.url || 'N/A'}\n`);
          
          await testFullTextExtraction(paper);
          return;
        }
      }
      
      console.log('   ❌ Could not find paper');
      process.exit(1);
    }

    const paper = searchResponse.data.results[0];
    console.log(`   ✅ Found paper: ${paper.id}`);
    console.log(`   📊 Title: ${paper.title}`);
    console.log(`   📖 DOI: ${paper.doi || 'N/A'}`);
    console.log(`   🔗 URL: ${paper.url || 'N/A'}\n`);

    await testFullTextExtraction(paper);

  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.stack) {
      console.log(`\n   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

async function testFullTextExtraction(paper) {
  console.log('3️⃣  Testing Full-Text Extraction Waterfall...\n');
  
  try {
    console.log('   🌊 Starting waterfall extraction...');
    console.log('   ⏱️  This may take 30-60 seconds...\n');
    
    const startTime = Date.now();
    
    const extractResponse = await axios.post(
      `${API_BASE}/literature/papers/${paper.id}/full-text`,
      {},
      { timeout: 90000 } // 90 second timeout
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const result = extractResponse.data;
    
    console.log('   ✅ Extraction completed!\n');
    console.log('=' .repeat(80));
    console.log('📊 EXTRACTION RESULTS');
    console.log('=' .repeat(80));
    console.log(`Status: ${result.status}`);
    console.log(`Source: ${result.source || 'N/A'}`);
    console.log(`Word Count: ${result.wordCount || 0}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🌊 WATERFALL TIER ANALYSIS');
    console.log('=' .repeat(80));
    
    // Analyze which tier was used
    const tierMap = {
      'cached': 'Tier 1: Database Cache',
      'pmc': 'Tier 2: PubMed Central API',
      'html': 'Tier 2: HTML Scraping',
      'grobid': 'Tier 2.5: GROBID PDF Extraction',
      'unpaywall': 'Tier 3: Unpaywall PDF',
      'direct_pdf': 'Tier 4: Direct Publisher PDF',
      'pdf': 'Tier 3/4: PDF Extraction (legacy)'
    };
    
    const tierUsed = tierMap[result.source] || `Unknown: ${result.source}`;
    console.log(`Tier Used: ${tierUsed}`);
    
    // Show text preview
    if (result.fullText && result.fullText.length > 0) {
      console.log('\n' + '='.repeat(80));
      console.log('📖 TEXT PREVIEW (First 500 characters)');
      console.log('=' .repeat(80));
      console.log(result.fullText.substring(0, 500));
      console.log('...\n');
      
      // Text quality analysis
      console.log('=' .repeat(80));
      console.log('📈 TEXT QUALITY ANALYSIS');
      console.log('=' .repeat(80));
      
      const hasAbstract = result.fullText.toLowerCase().includes('abstract');
      const hasIntroduction = result.fullText.toLowerCase().includes('introduction');
      const hasConclusion = result.fullText.toLowerCase().includes('conclusion');
      const hasReferences = result.fullText.toLowerCase().includes('reference');
      
      console.log(`Contains Abstract: ${hasAbstract ? '✅' : '❌'}`);
      console.log(`Contains Introduction: ${hasIntroduction ? '✅' : '❌'}`);
      console.log(`Contains Conclusion: ${hasConclusion ? '✅' : '❌'}`);
      console.log(`Contains References: ${hasReferences ? '✅' : '❌'}`);
      
      const qualityScore = [hasAbstract, hasIntroduction, hasConclusion, hasReferences]
        .filter(Boolean).length;
      
      console.log(`\nQuality Score: ${qualityScore}/4`);
      
      if (qualityScore >= 3) {
        console.log('Quality Rating: ✅ EXCELLENT - Full paper structure extracted');
      } else if (qualityScore >= 2) {
        console.log('Quality Rating: ⚠️  GOOD - Most sections extracted');
      } else {
        console.log('Quality Rating: ❌ POOR - Limited content extracted');
      }
    } else {
      console.log('\n⚠️  No full text extracted');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 FINAL VERDICT');
    console.log('=' .repeat(80));
    
    if (result.success && result.wordCount > 1000) {
      console.log('✅ SUCCESS - Waterfall system extracted full text successfully!');
      console.log(`   - Tier: ${tierUsed}`);
      console.log(`   - Word Count: ${result.wordCount}`);
      console.log(`   - Duration: ${duration}s`);
      process.exit(0);
    } else if (result.success && result.wordCount > 100) {
      console.log('⚠️  PARTIAL SUCCESS - Some text extracted but may be incomplete');
      console.log(`   - Tier: ${tierUsed}`);
      console.log(`   - Word Count: ${result.wordCount} (expected >1000)`);
      console.log(`   - Duration: ${duration}s`);
      process.exit(1);
    } else {
      console.log('❌ FAILED - Waterfall system could not extract full text');
      console.log(`   - All tiers failed or returned insufficient content`);
      console.log(`   - Error: ${result.error || 'Unknown'}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.log(`\n❌ EXTRACTION FAILED: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Run the test
(async () => {
  await testScienceDirectExtraction();
})();
