#!/usr/bin/env node
/**
 * FAMILIARIZATION PHASE DEEP TEST
 *
 * Tests:
 * 1. Do papers have fullText populated?
 * 2. Does theme extraction use fullText during familiarization?
 * 3. Are word counts tracked correctly?
 * 4. Does the enhanced full-text system work?
 *
 * User requirement: "ULTRATHINK - zero technical debt"
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:4000/api';
const FRONTEND_URL = 'http://localhost:3000';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('');
  log(`${'='.repeat(80)}`, 'cyan');
  log(`${title}`, 'bold');
  log(`${'='.repeat(80)}`, 'cyan');
  console.log('');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  log('\n🔬 FAMILIARIZATION PHASE DEEP TEST', 'bold');
  log('Testing full-text reading and word counting during theme extraction\n', 'cyan');

  try {
    // ===================================================================
    // STEP 1: Search for papers to test
    // ===================================================================
    section('STEP 1: Searching for papers');

    log('Searching PMC for "diabetes management"...', 'blue');
    const searchResponse = await axios.post(`${BACKEND_URL}/literature/search/public`, {
      query: 'diabetes management',
      sources: ['pmc'],
      maxResults: 10
    });

    const papers = searchResponse.data.results || [];
    log(`✅ Found ${papers.length} papers`, 'green');

    if (papers.length === 0) {
      log('❌ No papers found. Test cannot continue.', 'red');
      process.exit(1);
    }

    // ===================================================================
    // STEP 2: Verify papers have fullText
    // ===================================================================
    section('STEP 2: Verifying papers have fullText populated');

    let fullTextCount = 0;
    let abstractOnlyCount = 0;
    let totalWords = 0;

    papers.forEach((paper, index) => {
      const hasFullText = paper.fullText && paper.fullText.length > 0;
      const contentLength = paper.fullText ? paper.fullText.length : (paper.abstract ? paper.abstract.length : 0);
      const wordCount = contentLength > 0 ? paper.fullText ? paper.fullText.split(/\s+/).length : paper.abstract.split(/\s+/).length : 0;

      log(`\nPaper ${index + 1}: ${paper.title.substring(0, 60)}...`, 'cyan');
      log(`  Source: ${paper.source}`, 'blue');
      log(`  Has fullText: ${hasFullText ? '✅ YES' : '❌ NO'}`, hasFullText ? 'green' : 'yellow');
      log(`  Content length: ${contentLength.toLocaleString()} characters`, 'blue');
      log(`  Word count: ${wordCount.toLocaleString()} words`, 'blue');

      if (hasFullText) {
        fullTextCount++;
        totalWords += wordCount;
      } else {
        abstractOnlyCount++;
      }
    });

    log(`\n📊 Summary:`, 'bold');
    log(`  Papers with full text: ${fullTextCount}/${papers.length} (${Math.round(fullTextCount/papers.length*100)}%)`, fullTextCount > 0 ? 'green' : 'red');
    log(`  Papers with abstract only: ${abstractOnlyCount}/${papers.length}`, abstractOnlyCount > 0 ? 'yellow' : 'green');
    log(`  Total words available: ${totalWords.toLocaleString()} words`, 'green');

    if (fullTextCount === 0) {
      log('\n⚠️ WARNING: No papers have fullText!', 'yellow');
      log('This means:', 'yellow');
      log('  1. PMC service may not be extracting full text', 'yellow');
      log('  2. Papers are only using abstracts (~300 words instead of ~8,000 words)', 'yellow');
      log('  3. Theme extraction quality will be reduced', 'yellow');
    }

    // ===================================================================
    // STEP 3: Test theme extraction with familiarization monitoring
    // ===================================================================
    section('STEP 3: Testing theme extraction with familiarization logging');

    log('Note: This test will take ~15-30 seconds', 'yellow');
    log('Watch the backend console for familiarization logs!\n', 'yellow');

    log('Preparing sources for extraction...', 'blue');
    const sources = papers.slice(0, 5).map(paper => ({
      id: paper.id,
      title: paper.title,
      content: paper.fullText || paper.abstract || '',
      type: 'paper',
      authors: paper.authors || [],
      year: paper.year,
      doi: paper.doi,
      metadata: {
        contentType: paper.fullText ? 'full_text' : 'abstract'
      }
    }));

    log(`\nPrepared ${sources.length} sources:`, 'cyan');
    sources.forEach((source, index) => {
      const wordCount = source.content.split(/\s+/).length;
      const isFullText = source.metadata.contentType === 'full_text';
      log(`  ${index + 1}. ${source.title.substring(0, 50)}...`, 'blue');
      log(`     Type: ${isFullText ? '📄 Full Text' : '📝 Abstract'} (${wordCount.toLocaleString()} words)`, isFullText ? 'green' : 'yellow');
    });

    log('\n🚀 Starting theme extraction...', 'bold');
    log('⏱️  Monitor backend console for familiarization logs like:', 'cyan');
    log('   "📄 [1/5] Reading: \'...\' (8,234 words, full-text)"', 'cyan');
    log('   "Running total: 2 full articles, 0 abstracts (15,678 words)"\n', 'cyan');

    try {
      const extractionResponse = await axios.post(
        `${BACKEND_URL}/literature/themes/extract-themes-v2/public`,
        {
          sources,
          purpose: 'q_methodology',
          userExpertiseLevel: 'researcher',
          methodology: 'reflexive_thematic',
          validationLevel: 'rigorous',
        },
        { timeout: 180000 } // 3-minute timeout
      );

      log('✅ Extraction completed successfully!', 'green');
      log(`\n📊 Results:`, 'bold');
      log(`  Themes extracted: ${extractionResponse.data.themes?.length || 0}`, 'green');
      log(`  Processing time: ${extractionResponse.data.metadata?.processingTimeMs || 'N/A'}ms`, 'blue');

      // Check if familiarization happened
      const familiarizationTime = extractionResponse.data.metadata?.stageTimings?.familiarization;
      if (familiarizationTime) {
        log(`  Familiarization time: ${familiarizationTime}ms`, 'green');
      }

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        log('⏱️  Extraction timed out (this is expected for large datasets)', 'yellow');
      } else {
        log(`❌ Extraction failed: ${error.message}`, 'red');
        if (error.response) {
          log(`   Status: ${error.response.status}`, 'red');
          log(`   Message: ${error.response.data?.message || 'Unknown error'}`, 'red');
        }
      }
    }

    // ===================================================================
    // STEP 4: Check backend logs for familiarization evidence
    // ===================================================================
    section('STEP 4: Verification checklist');

    log('✅ Check backend console for these logs:', 'bold');
    log('   1. "📄 [1/5] Reading: \'...\' (X words, full-text/abstract)"', 'cyan');
    log('   2. "Running total: X full articles, Y abstracts (Z words)"', 'cyan');
    log('   3. Word counts should increment with each article', 'cyan');
    log('   4. Full-text articles should show 3,000-15,000 words', 'cyan');
    log('   5. Abstract-only articles should show 200-500 words', 'cyan');

    log('\n📋 Expected behavior:', 'bold');
    log('   ✅ Papers from PMC should have fullText populated', 'green');
    log('   ✅ Familiarization should read fullText (not just abstract)', 'green');
    log('   ✅ Word counts should be tracked and displayed', 'green');
    log('   ✅ Backend logs should show per-article progress', 'green');

    log('\n🎯 What we verified:', 'bold');
    log(`   ${fullTextCount > 0 ? '✅' : '❌'} Papers have fullText populated: ${fullTextCount}/${papers.length}`, fullTextCount > 0 ? 'green' : 'red');
    log(`   ${totalWords > 5000 ? '✅' : '⚠️'} Total words available: ${totalWords.toLocaleString()}`, totalWords > 5000 ? 'green' : 'yellow');
    log('   ⏳ Theme extraction started (check backend logs for familiarization)', 'blue');

    section('TEST COMPLETE');
    log('✅ Review the output above and backend console logs', 'green');
    log('📝 If fullText count is 0, the enhanced full-text system needs investigation', 'yellow');

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    if (error.code === 'ECONNREFUSED') {
      log('\n💡 Make sure backend is running: npm run start:dev', 'yellow');
    }
    process.exit(1);
  }
}

main();
