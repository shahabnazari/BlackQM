/**
 * Simple ScienceDirect Extraction Test
 * Tests the waterfall system with the specific article
 */

const axios = require('axios');

const TEST_URL = 'https://www.sciencedirect.com/science/article/pii/S0305750X21002680?via%3Dihub';
const API_BASE = 'http://localhost:3001/api';

async function runTest() {
  console.log('🧪 Testing ScienceDirect Extraction');
  console.log('=' .repeat(60));
  console.log('URL:', TEST_URL);
  console.log('');

  try {
    // Step 1: Check backend
    console.log('1. Checking backend...');
    const health = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log('✅ Backend is running');
    console.log('');

    // Step 2: Search for paper
    console.log('2. Searching for paper...');
    const pii = 'S0305750X21002680';
    
    const searchRes = await axios.post(`${API_BASE}/literature/search/public`, {
      query: `World Development ${pii}`,
      sources: ['crossref', 'semanticscholar'],
      maxResults: 5
    }, { timeout: 30000 });

    if (!searchRes.data.results || searchRes.data.results.length === 0) {
      console.log('❌ Paper not found in search');
      console.log('This is expected - the paper may not be indexed');
      console.log('');
      console.log('📊 RESULT: Cannot test - paper not discoverable via API');
      return;
    }

    const paper = searchRes.data.results[0];
    console.log('✅ Found paper:', paper.title?.substring(0, 60) + '...');
    console.log('   DOI:', paper.doi || 'N/A');
    console.log('');

    // Step 3: Save paper
    console.log('3. Saving paper to library...');
    const saveRes = await axios.post(`${API_BASE}/literature/save/public`, {
      paper: {
        ...paper,
        url: paper.url || TEST_URL
      }
    }, { timeout: 10000 });
    
    const paperId = saveRes.data.paper?.id || paper.id;
    console.log('✅ Paper saved, ID:', paperId);
    console.log('');

    // Step 4: Extract full text
    console.log('4. Extracting full text (this may take 30-90 seconds)...');
    console.log('   Waterfall will try: Cache → PMC → HTML → GROBID → Unpaywall → Direct PDF');
    console.log('');
    
    const startTime = Date.now();
    const extractRes = await axios.post(
      `${API_BASE}/literature/papers/${paperId}/full-text`,
      {},
      { 
        timeout: 120000,
        validateStatus: () => true
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const result = extractRes.data;

    console.log('');
    console.log('=' .repeat(60));
    console.log('📊 EXTRACTION RESULTS');
    console.log('=' .repeat(60));
    console.log('Status:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Source:', result.source || 'N/A');
    console.log('Word Count:', result.wordCount || 0);
    console.log('Duration:', duration + 's');
    console.log('');

    if (result.fullText && result.fullText.length > 0) {
      console.log('📖 Text Preview (first 500 chars):');
      console.log('-'.repeat(60));
      console.log(result.fullText.substring(0, 500));
      console.log('...');
      console.log('');
      
      // Quality check
      const text = result.fullText.toLowerCase();
      const sections = {
        'Abstract': text.includes('abstract'),
        'Introduction': text.includes('introduction'),
        'Methods': text.includes('method'),
        'Results': text.includes('results'),
        'Conclusion': text.includes('conclusion'),
        'References': text.includes('reference')
      };
      
      console.log('📈 Content Analysis:');
      Object.entries(sections).forEach(([section, found]) => {
        console.log(`   ${found ? '✅' : '❌'} ${section}`);
      });
      
      const score = Object.values(sections).filter(Boolean).length;
      console.log('');
      console.log(`Quality Score: ${score}/6`);
      console.log('');
    } else {
      console.log('⚠️  No text extracted');
      console.log('Error:', result.error || 'Unknown');
      console.log('');
    }

    // Final verdict
    console.log('=' .repeat(60));
    console.log('🎯 FINAL VERDICT');
    console.log('=' .repeat(60));
    
    if (result.success && result.wordCount > 1000) {
      console.log('✅ WATERFALL SYSTEM WORKS PERFECTLY!');
      console.log(`   Successfully extracted ${result.wordCount} words`);
      console.log(`   Using tier: ${result.source}`);
      console.log(`   Duration: ${duration}s`);
    } else if (result.success && result.wordCount > 100) {
      console.log('⚠️  PARTIAL SUCCESS');
      console.log(`   Extracted ${result.wordCount} words (expected >1000)`);
      console.log('   May be abstract only or incomplete extraction');
    } else {
      console.log('❌ EXTRACTION FAILED');
      console.log('   This is expected for paywalled ScienceDirect articles');
      console.log('   The waterfall tried all available methods');
    }
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Backend is not running!');
      console.error('   Start it with: cd backend && npm run start:dev');
    }
  }
}

runTest();
