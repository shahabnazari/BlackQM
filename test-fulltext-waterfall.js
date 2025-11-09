/**
 * Phase 10 Day 32: Full-Text Waterfall System Test
 *
 * Tests all 4 tiers of the waterfall strategy:
 * - Tier 1: Database Cache
 * - Tier 2A: PMC API (HTML)
 * - Tier 2B: HTML Scraping
 * - Tier 3: Unpaywall PDF
 *
 * Usage: node test-fulltext-waterfall.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Test paper samples representing different sources
const TEST_PAPERS = {
  pmc: {
    name: 'PMC Paper (Biomedical)',
    query: 'depression treatment anxiety PMC',
    expectedSource: 'pmc',
    minWords: 2000,
  },
  plos: {
    name: 'PLOS Paper (Open Access HTML)',
    query: 'climate change ecology PLOS',
    expectedSource: 'html_scrape',
    minWords: 2000,
  },
  pdf: {
    name: 'PDF Paper (Unpaywall)',
    query: 'machine learning neural networks',
    expectedSource: 'unpaywall',
    minWords: 2000,
  },
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color =
    status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }

  if (status === 'pass') testResults.passed++;
  else if (status === 'fail') testResults.failed++;
  else testResults.skipped++;
}

async function login() {
  try {
    logSection('🔐 AUTHENTICATION');

    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'researcher@test.com',
      password: 'password123',
    });

    if (response.data.accessToken || response.data.token) {
      authToken = response.data.accessToken || response.data.token;
      logTest(
        'Login successful',
        'pass',
        `Token: ${authToken.substring(0, 20)}...`
      );
      return true;
    } else {
      logTest('Login failed', 'fail', 'No token in response');
      return false;
    }
  } catch (error) {
    logTest('Login failed', 'fail', error.message);
    return false;
  }
}

async function testBackendHealth() {
  logSection('🏥 BACKEND HEALTH CHECK');

  try {
    const response = await axios.get(`${BASE_URL}/health`);

    if (response.data.status === 'healthy') {
      logTest('Backend is healthy', 'pass', JSON.stringify(response.data));
      return true;
    } else {
      logTest('Backend unhealthy', 'fail', response.data.status);
      return false;
    }
  } catch (error) {
    logTest('Backend health check failed', 'fail', error.message);
    return false;
  }
}

async function searchPapers(query) {
  try {
    log(`\n🔍 Searching: "${query}"`, 'blue');

    const response = await axios.post(
      `${BASE_URL}/literature/search`,
      { query },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const papers = response.data.papers || [];
    log(`   Found ${papers.length} papers`, 'cyan');

    return papers;
  } catch (error) {
    log(`   ❌ Search failed: ${error.message}`, 'red');
    return [];
  }
}

async function savePaper(paper) {
  try {
    const response = await axios.post(
      `${BASE_URL}/literature/papers`,
      { paperId: paper.id, source: 'semantic_scholar' },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    // Paper might already be saved
    if (error.response?.status === 409) {
      log(`   ℹ️  Paper already saved`, 'yellow');
      return paper;
    }
    throw error;
  }
}

async function fetchFullText(paperId) {
  try {
    log(`\n📥 Fetching full-text for paper: ${paperId}`, 'blue');

    const response = await axios.post(
      `${BASE_URL}/pdf/queue`,
      { paperId },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Wait for processing (queue system is async)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check status
    const statusResponse = await axios.get(
      `${BASE_URL}/pdf/status/${paperId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return statusResponse.data;
  } catch (error) {
    log(`   ❌ Full-text fetch failed: ${error.message}`, 'red');
    return null;
  }
}

async function getSavedPapers() {
  try {
    const response = await axios.get(`${BASE_URL}/literature/papers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return response.data.papers || response.data || [];
  } catch (error) {
    log(`   ❌ Failed to get saved papers: ${error.message}`, 'red');
    return [];
  }
}

async function testPaperType(testConfig) {
  logSection(`📄 TESTING: ${testConfig.name}`);

  try {
    // Step 1: Search for papers
    const papers = await searchPapers(testConfig.query);

    if (papers.length === 0) {
      logTest(`${testConfig.name} - Search`, 'skip', 'No papers found');
      return null;
    }

    // Find a suitable test paper
    let testPaper = null;

    for (const paper of papers.slice(0, 5)) {
      log(`\n   Checking paper: "${paper.title.substring(0, 60)}..."`, 'cyan');
      log(`      DOI: ${paper.doi || 'N/A'}`, 'cyan');
      log(`      Has PDF: ${paper.hasPdf ? '✅' : '❌'}`, 'cyan');
      log(`      Has Full-Text: ${paper.hasFullText ? '✅' : '❌'}`, 'cyan');
      log(
        `      Full-Text Status: ${paper.fullTextStatus || 'not_fetched'}`,
        'cyan'
      );
      log(`      URL: ${paper.url ? '✅' : '❌'}`, 'cyan');

      // For PMC test, prefer papers with PMID/PMC info
      if (testConfig.expectedSource === 'pmc') {
        if (
          paper.url &&
          (paper.url.includes('pmc') || paper.url.includes('pubmed'))
        ) {
          testPaper = paper;
          log(`      ✅ Selected for PMC test`, 'green');
          break;
        }
      }
      // For HTML scraping, prefer papers from known publishers
      else if (testConfig.expectedSource === 'html_scrape') {
        if (
          paper.url &&
          (paper.url.includes('plos') ||
            paper.url.includes('mdpi') ||
            paper.url.includes('frontiersin'))
        ) {
          testPaper = paper;
          log(`      ✅ Selected for HTML scraping test`, 'green');
          break;
        }
      }
      // For PDF test, prefer papers with DOI and PDF available
      else if (testConfig.expectedSource === 'unpaywall') {
        if (paper.doi && paper.hasPdf) {
          testPaper = paper;
          log(`      ✅ Selected for PDF test`, 'green');
          break;
        }
      }
    }

    if (!testPaper) {
      logTest(
        `${testConfig.name} - Paper Selection`,
        'skip',
        'No suitable paper found'
      );
      return null;
    }

    logTest(
      `${testConfig.name} - Paper Selection`,
      'pass',
      `Selected: ${testPaper.title.substring(0, 60)}...`
    );

    // Step 2: Save paper
    const savedPaper = await savePaper(testPaper);
    logTest(
      `${testConfig.name} - Save Paper`,
      'pass',
      `Paper ID: ${savedPaper.id}`
    );

    // Step 3: Check if full-text already exists
    const savedPapers = await getSavedPapers();
    const paperWithDetails = savedPapers.find(p => p.id === savedPaper.id);

    if (
      paperWithDetails &&
      paperWithDetails.fullText &&
      paperWithDetails.fullText.length > 100
    ) {
      log(`\n   ℹ️  Full-text already cached!`, 'yellow');
      log(`      Source: ${paperWithDetails.fullTextSource}`, 'yellow');
      log(`      Word Count: ${paperWithDetails.fullTextWordCount}`, 'yellow');

      logTest(
        `${testConfig.name} - Full-Text (Cached)`,
        paperWithDetails.fullTextWordCount >= testConfig.minWords
          ? 'pass'
          : 'fail',
        `${paperWithDetails.fullTextWordCount} words from ${paperWithDetails.fullTextSource}`
      );

      return {
        paper: paperWithDetails,
        source: paperWithDetails.fullTextSource,
        wordCount: paperWithDetails.fullTextWordCount,
        cached: true,
      };
    }

    // Step 4: Fetch full-text
    const fullTextStatus = await fetchFullText(savedPaper.id);

    if (!fullTextStatus) {
      logTest(
        `${testConfig.name} - Full-Text Fetch`,
        'fail',
        'Failed to fetch full-text'
      );
      return null;
    }

    // Step 5: Verify results
    const finalPaper = savedPapers.find(p => p.id === savedPaper.id);

    if (finalPaper && finalPaper.fullText && finalPaper.fullText.length > 100) {
      const sourceMatch =
        finalPaper.fullTextSource === testConfig.expectedSource;
      const wordCountOk = finalPaper.fullTextWordCount >= testConfig.minWords;

      logTest(
        `${testConfig.name} - Full-Text Fetch`,
        wordCountOk ? 'pass' : 'fail',
        `${finalPaper.fullTextWordCount} words from ${finalPaper.fullTextSource}`
      );

      if (!sourceMatch) {
        log(
          `   ⚠️  Expected source: ${testConfig.expectedSource}, got: ${finalPaper.fullTextSource}`,
          'yellow'
        );
      }

      return {
        paper: finalPaper,
        source: finalPaper.fullTextSource,
        wordCount: finalPaper.fullTextWordCount,
        cached: false,
      };
    } else {
      logTest(
        `${testConfig.name} - Full-Text Fetch`,
        'fail',
        'No full-text content retrieved'
      );
      return null;
    }
  } catch (error) {
    logTest(`${testConfig.name} - Error`, 'fail', error.message);
    console.error(error);
    return null;
  }
}

async function testWaterfallCoverage() {
  logSection('📊 WATERFALL COVERAGE TEST');

  const results = {
    pmc: 0,
    html_scrape: 0,
    unpaywall: 0,
    failed: 0,
  };

  try {
    // Search for diverse papers
    const papers = await searchPapers(
      'psychology research methods qualitative'
    );

    if (papers.length === 0) {
      logTest('Waterfall Coverage', 'skip', 'No papers to test');
      return;
    }

    log(`\n   Testing ${Math.min(10, papers.length)} papers...`, 'cyan');

    for (const paper of papers.slice(0, 10)) {
      try {
        const savedPaper = await savePaper(paper);
        const fullTextStatus = await fetchFullText(savedPaper.id);

        if (fullTextStatus?.source) {
          results[fullTextStatus.source] =
            (results[fullTextStatus.source] || 0) + 1;
        } else {
          results.failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
      }
    }

    // Display results
    log(`\n   Coverage Results:`, 'cyan');
    log(
      `      PMC (HTML): ${results.pmc} papers`,
      results.pmc > 0 ? 'green' : 'yellow'
    );
    log(
      `      HTML Scraping: ${results.html_scrape} papers`,
      results.html_scrape > 0 ? 'green' : 'yellow'
    );
    log(
      `      Unpaywall (PDF): ${results.unpaywall} papers`,
      results.unpaywall > 0 ? 'green' : 'yellow'
    );
    log(
      `      Failed: ${results.failed} papers`,
      results.failed === 0 ? 'green' : 'red'
    );

    const totalSuccess = results.pmc + results.html_scrape + results.unpaywall;
    const coverage = (totalSuccess / (totalSuccess + results.failed)) * 100;

    logTest(
      'Waterfall Coverage',
      coverage >= 80 ? 'pass' : 'fail',
      `${coverage.toFixed(1)}% success rate (${totalSuccess}/${totalSuccess + results.failed} papers)`
    );
  } catch (error) {
    logTest('Waterfall Coverage', 'fail', error.message);
  }
}

async function printSummary() {
  logSection('📈 TEST SUMMARY');

  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate =
    total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;

  log(`Total Tests: ${total}`, 'cyan');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⏭️  Skipped: ${testResults.skipped}`, 'yellow');
  log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

  if (testResults.failed === 0 && testResults.passed > 0) {
    log(
      '\n🎉 ALL TESTS PASSED! Full-text waterfall system is working correctly!',
      'green'
    );
  } else if (testResults.failed > 0) {
    log('\n⚠️  SOME TESTS FAILED. Review the errors above.', 'red');
  } else {
    log(
      '\n⚠️  NO TESTS COMPLETED. Check backend connection and authentication.',
      'yellow'
    );
  }
}

async function runTests() {
  console.clear();
  logSection('🚀 FULL-TEXT WATERFALL SYSTEM TEST SUITE');
  log(
    'Phase 10 Day 32: Testing all 4 tiers of the waterfall strategy\n',
    'cyan'
  );

  // Step 1: Check backend health
  const backendHealthy = await testBackendHealth();
  if (!backendHealthy) {
    log('\n❌ Backend is not healthy. Aborting tests.', 'red');
    process.exit(1);
  }

  // Step 2: Authenticate
  const authenticated = await login();
  if (!authenticated) {
    log('\n❌ Authentication failed. Aborting tests.', 'red');
    process.exit(1);
  }

  // Step 3: Test each paper type
  const pmcResult = await testPaperType(TEST_PAPERS.pmc);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const plosResult = await testPaperType(TEST_PAPERS.plos);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const pdfResult = await testPaperType(TEST_PAPERS.pdf);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 4: Test overall coverage
  // Commenting out to avoid too many API calls
  // await testWaterfallCoverage();

  // Step 5: Print summary
  await printSummary();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
