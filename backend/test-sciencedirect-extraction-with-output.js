/**
 * Enhanced Test: ScienceDirect Full-Text Extraction with File Output
 * URL: https://www.sciencedirect.com/science/article/pii/S0305750X21002680?via%3Dihub
 * 
 * This test saves results to a file for review
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001/api';
const TEST_URL = 'https://www.sciencedirect.com/science/article/pii/S0305750X21002680?via%3Dihub';
const OUTPUT_FILE = path.join(__dirname, 'sciencedirect-test-results.txt');

let outputLog = '';

function log(message) {
  console.log(message);
  outputLog += message + '\n';
}

async function testScienceDirectExtraction() {
  log('🧪 Testing ScienceDirect Paper Text Extraction');
  log('='.repeat(80));
  log(`📄 URL: ${TEST_URL}`);
  log(`📝 Output File: ${OUTPUT_FILE}\n`);

  try {
    // Step 1: Check backend health
    log('1️⃣  Checking backend status...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      log('   ✅ Backend is running');
      log(`   📊 Status: ${JSON.stringify(healthResponse.data)}\n`);
    } catch (error) {
      log('   ❌ Backend is not running!');
      log('   Please start: cd backend && npm run start:dev');
      saveOutput();
      process.exit(1);
    }

    // Step 2: Search for the paper
    log('2️⃣  Searching for paper by URL...');
    
    // Try extracting DOI from URL
    const piiMatch = TEST_URL.match(/pii\/([A-Z0-9]+)/);
    let paper = null;
    
    if (piiMatch) {
      const pii = piiMatch[1];
      log(`   📋 Extracted PII: ${pii}`);
      log('   🔍 Searching by PII...');
      
      try {
        const searchResponse = await axios.post(`${API_BASE}/literature/search/public`, {
          query: pii,
          sources: ['crossref', 'semanticscholar', 'pubmed'],
          maxResults: 5
        }, {
          timeout: 30000
        });
        
        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
          paper = searchResponse.data.results[0];
          log(`   ✅ Found paper: ${paper.id}`);
          log(`   📊 Title: ${paper.title}`);
          log(`   📖 DOI: ${paper.doi || 'N/A'}`);
          log(`   🔗 URL: ${paper.url || 'N/A'}`);
          log(`   👥 Authors: ${paper.authors?.slice(0, 3).join(', ') || 'N/A'}`);
          log(`   📅 Year: ${paper.year || 'N/A'}\n`);
        }
      } catch (searchError) {
        log(`   ⚠️  Search by PII failed: ${searchError.message}`);
      }
    }
    
    // If PII search failed, try direct URL search
    if (!paper) {
      log('   🔍 Trying direct URL search...');
      try {
        const searchResponse = await axios.post(`${API_BASE}/literature/search/public`, {
          query: TEST_URL,
          sources: ['crossref', 'semanticscholar'],
          maxResults: 5
        }, {
          timeout: 30000
        });
        
        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
          paper = searchResponse.data.results[0];
          log(`   ✅ Found paper: ${paper.id}`);
          log(`   📊 Title: ${paper.title}`);
          log(`   📖 DOI: ${paper.doi || 'N/A'}\n`);
        }
      } catch (searchError) {
        log(`   ⚠️  URL search failed: ${searchError.message}`);
      }
    }

    if (!paper) {
      log('   ❌ Could not find paper via search');
      log('   💡 This may be because:');
      log('      - Paper is not indexed in CrossRef/Semantic Scholar');
      log('      - PII format not recognized');
      log('      - Network connectivity issues\n');
      saveOutput();
      process.exit(1);
    }

    // Step 3: Save paper to library (required for full-text extraction)
    log('3️⃣  Saving paper to library...');
    try {
      const saveResponse = await axios.post(`${API_BASE}/literature/save/public`, {
        paper: {
          id: paper.id,
          title: paper.title,
          abstract: paper.abstract,
          authors: paper.authors,
          year: paper.year,
          doi: paper.doi,
          url: paper.url || TEST_URL,
          source: paper.source
        }
      }, {
        timeout: 10000
      });
      
      log(`   ✅ Paper saved successfully`);
      log(`   📋 Paper ID: ${saveResponse.data.paper?.id || paper.id}\n`);
      
      // Update paper ID if changed
      if (saveResponse.data.paper?.id) {
        paper.id = saveResponse.data.paper.id;
      }
    } catch (saveError) {
      log(`   ⚠️  Save failed: ${saveError.message}`);
      log('   Continuing with extraction attempt...\n');
    }

    // Step 4: Test full-text extraction
    await testFullTextExtraction(paper);

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    if (error.response) {
      log(`   HTTP Status: ${error.response.status}`);
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    if (error.stack) {
      log(`\n   Stack: ${error.stack}`);
    }
    saveOutput();
    process.exit(1);
  }
}

async function testFullTextExtraction(paper) {
  log('4️⃣  Testing Full-Text Extraction Waterfall...\n');
  
  try {
    log('   🌊 Starting waterfall extraction...');
    log('   ⏱️  This may take 30-90 seconds...');
    log('   📊 Monitoring tier progression:\n');
    
    const startTime = Date.now();
    
    // Call the full-text extraction endpoint
    const extractResponse = await axios.post(
      `${API_BASE}/literature/papers/${paper.id}/full-text`,
      {},
      { 
        timeout: 120000, // 2 minute timeout
        validateStatus: () => true // Accept all status codes
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const result = extractResponse.data;
    
    log('   ✅ Extraction request completed!\n');
    log('='.repeat(80));
    log('📊 EXTRACTION RESULTS');
    log('='.repeat(80));
    log(`HTTP Status: ${extractResponse.status}`);
    log(`Status: ${result.status || 'unknown'}`);
    log(`Source: ${result.source || 'N/A'}`);
    log(`Word Count: ${result.wordCount || 0}`);
    log(`Duration: ${duration}s`);
    log(`Success: ${result.success ? '✅' : '❌'}`);
    
    if (result.error) {
      log(`Error: ${result.error}`);
    }
    
    log('\n' + '='.repeat(80));
    log('🌊 WATERFALL TIER ANALYSIS');
    log('='.repeat(80));
    
    // Analyze which tier was used
    const tierMap = {
      'cached': 'Tier 1: Database Cache',
      'pmc': 'Tier 2: PubMed Central API',
      'html': 'Tier 2: HTML Scraping',
      'html_scrape': 'Tier 2: HTML Scraping',
      'grobid': 'Tier 2.5: GROBID PDF Extraction',
      'unpaywall': 'Tier 3: Unpaywall PDF',
      'direct_pdf': 'Tier 4: Direct Publisher PDF',
      'pdf': 'Tier 3/4: PDF Extraction (legacy)'
    };
    
    const tierUsed = tierMap[result.source] || `Unknown: ${result.source}`;
    log(`Tier Used: ${tierUsed}`);
    
    // Show text preview if available
    if (result.fullText && result.fullText.length > 0) {
      log('\n' + '='.repeat(80));
      log('📖 TEXT PREVIEW (First 1000 characters)');
      log('='.repeat(80));
      log(result.fullText.substring(0, 1000));
      log('...\n');
      
      // Text quality analysis
      log('='.repeat(80));
      log('📈 TEXT QUALITY ANALYSIS');
      log('='.repeat(80));
      
      const lowerText = result.fullText.toLowerCase();
      const hasAbstract = lowerText.includes('abstract');
      const hasIntroduction = lowerText.includes('introduction');
      const hasConclusion = lowerText.includes('conclusion');
      const hasReferences = lowerText.includes('reference');
      const hasMethod = lowerText.includes('method') || lowerText.includes('methodology');
      const hasResults = lowerText.includes('results') || lowerText.includes('findings');
      
      log(`Contains Abstract: ${hasAbstract ? '✅' : '❌'}`);
      log(`Contains Introduction: ${hasIntroduction ? '✅' : '❌'}`);
      log(`Contains Methods: ${hasMethod ? '✅' : '❌'}`);
      log(`Contains Results: ${hasResults ? '✅' : '❌'}`);
      log(`Contains Conclusion: ${hasConclusion ? '✅' : '❌'}`);
      log(`Contains References: ${hasReferences ? '✅' : '❌'}`);
      
      const qualityScore = [hasAbstract, hasIntroduction, hasMethod, hasResults, hasConclusion, hasReferences]
        .filter(Boolean).length;
      
      log(`\nQuality Score: ${qualityScore}/6`);
      
      if (qualityScore >= 5) {
        log('Quality Rating: ✅ EXCELLENT - Full paper structure extracted');
      } else if (qualityScore >= 3) {
        log('Quality Rating: ⚠️  GOOD - Most sections extracted');
      } else {
        log('Quality Rating: ❌ POOR - Limited content extracted');
      }
      
      // Additional metrics
      log('\n' + '='.repeat(80));
      log('📊 ADDITIONAL METRICS');
      log('='.repeat(80));
      log(`Total Characters: ${result.fullText.length}`);
      log(`Estimated Pages: ${Math.ceil(result.wordCount / 250)} (assuming 250 words/page)`);
      log(`Average Word Length: ${(result.fullText.length / result.wordCount).toFixed(1)} characters`);
      
    } else {
      log('\n⚠️  No full text extracted');
    }
    
    log('\n' + '='.repeat(80));
    log('🎯 FINAL VERDICT');
    log('='.repeat(80));
    
    if (result.success && result.wordCount > 1000) {
      log('✅ SUCCESS - Waterfall system extracted full text successfully!');
      log(`   - Tier: ${tierUsed}`);
      log(`   - Word Count: ${result.wordCount}`);
      log(`   - Duration: ${duration}s`);
      log(`   - Quality: ${qualityScore || 'N/A'}/6`);
      saveOutput();
      process.exit(0);
    } else if (result.success && result.wordCount > 100) {
      log('⚠️  PARTIAL SUCCESS - Some text extracted but may be incomplete');
      log(`   - Tier: ${tierUsed}`);
      log(`   - Word Count: ${result.wordCount} (expected >1000 for full paper)`);
      log(`   - Duration: ${duration}s`);
      log(`   - This may be just the abstract or a partial extraction`);
      saveOutput();
      process.exit(1);
    } else {
      log('❌ FAILED - Waterfall system could not extract full text');
      log(`   - All tiers failed or returned insufficient content`);
      log(`   - Error: ${result.error || 'Unknown'}`);
      log(`   - This is expected for paywalled articles without open access`);
      saveOutput();
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ EXTRACTION FAILED: ${error.message}`);
    if (error.response) {
      log(`   HTTP Status: ${error.response.status}`);
      log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    saveOutput();
    process.exit(1);
  }
}

function saveOutput() {
  try {
    fs.writeFileSync(OUTPUT_FILE, outputLog, 'utf8');
    console.log(`\n📝 Test results saved to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error(`Failed to save output: ${error.message}`);
  }
}

// Run the test
(async () => {
  await testScienceDirectExtraction();
})();
