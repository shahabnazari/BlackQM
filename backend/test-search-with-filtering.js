#!/usr/bin/env node
/**
 * Live Search Test with Filtering Analysis
 *
 * Tests a real search query to see if relevance filtering is applied
 *
 * Usage: node backend/test-search-with-filtering.js "your search query"
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

const searchQuery = process.argv[2] || 'Q methodology';

console.log('\n' + '='.repeat(80));
console.log('LIVE SEARCH TEST - RELEVANCE FILTERING ANALYSIS');
console.log('='.repeat(80) + '\n');

console.log(`Query: "${searchQuery}"\n`);

async function testSearch() {
  try {
    console.log('Sending search request...\n');

    const response = await axios.post(
      `${API_URL}/literature/search`,
      {
        query: searchQuery,
        filters: {
          sortBy: 'relevance',
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    const papers = response.data.papers || [];

    console.log('━━━ SEARCH RESULTS ━━━\n');
    console.log(`Total papers returned: ${papers.length}\n`);

    // Check if papers have relevanceScore
    const papersWithScores = papers.filter(p => p.relevanceScore !== undefined && p.relevanceScore !== null);
    const papersWithoutScores = papers.length - papersWithScores.length;

    console.log('━━━ RELEVANCE SCORES ━━━\n');
    console.log(`Papers with scores: ${papersWithScores.length}`);
    console.log(`Papers without scores: ${papersWithoutScores}`);

    if (papersWithScores.length === 0) {
      console.log('\n❌ WARNING: No papers have relevanceScore!');
      console.log('   This means BM25 scoring may not have been applied.\n');
      return;
    }

    // Analyze score distribution
    const scores = papersWithScores.map(p => p.relevanceScore).sort((a, b) => b - a);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const median = scores[Math.floor(scores.length / 2)];

    console.log('\nScore Distribution:');
    console.log(`  Min: ${min.toFixed(2)}`);
    console.log(`  Max: ${max.toFixed(2)}`);
    console.log(`  Avg: ${avg.toFixed(2)}`);
    console.log(`  Median: ${median.toFixed(2)}\n`);

    // Show top 5 and bottom 5 scores
    console.log('Top 5 Papers:');
    papersWithScores
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5)
      .forEach((p, i) => {
        console.log(`  ${i + 1}. [Score: ${p.relevanceScore.toFixed(2)}] ${p.title.substring(0, 60)}...`);
      });

    console.log('\nBottom 5 Papers:');
    papersWithScores
      .sort((a, b) => (a.relevanceScore || 0) - (b.relevanceScore || 0))
      .slice(0, 5)
      .forEach((p, i) => {
        console.log(`  ${i + 1}. [Score: ${p.relevanceScore.toFixed(2)}] ${p.title.substring(0, 60)}...`);
      });

    // Check filtering
    console.log('\n━━━ FILTERING ANALYSIS ━━━\n');

    // Simulate query complexity detection
    const words = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const wordCount = words.length;
    const hasBooleans = /\b(AND|OR|NOT)\b/i.test(searchQuery);
    const hasQuotes = /"[^"]+"/.test(searchQuery);

    let complexity;
    let threshold;
    if (wordCount >= 5 || hasBooleans || hasQuotes) {
      complexity = 'COMPREHENSIVE';
      threshold = 5;
    } else if (wordCount >= 3) {
      complexity = 'SPECIFIC';
      threshold = 4;
    } else {
      complexity = 'BROAD';
      threshold = 3;
    }

    console.log(`Detected Complexity: ${complexity}`);
    console.log(`Expected Threshold: ${threshold}\n`);

    // Check how many papers would be filtered
    const belowThreshold = papersWithScores.filter(p => p.relevanceScore < threshold);
    const aboveThreshold = papersWithScores.filter(p => p.relevanceScore >= threshold);

    console.log(`Papers above threshold (${threshold}): ${aboveThreshold.length}`);
    console.log(`Papers below threshold (${threshold}): ${belowThreshold.length}\n`);

    if (belowThreshold.length === 0) {
      console.log('✅ FILTERING APPEARS TO BE WORKING');
      console.log('   All returned papers meet the threshold.\n');
    } else {
      console.log('⚠️  WARNING: Papers below threshold found!');
      console.log(`   ${belowThreshold.length} papers have scores below ${threshold}`);
      console.log('   This suggests filtering may not have been applied.\n');

      console.log('Papers below threshold:');
      belowThreshold.slice(0, 5).forEach(p => {
        console.log(`  - [Score: ${p.relevanceScore.toFixed(2)}] ${p.title.substring(0, 60)}...`);
      });
      console.log();
    }

    // Check for 769-paper scenario
    if (papers.length === 769) {
      console.log('━━━ 769-PAPER SCENARIO DETECTED ━━━\n');
      console.log('This is the exact scenario you reported!\n');

      console.log('Possible explanations:');
      console.log('  1. All 769 papers scored above threshold (legitimate)');
      console.log('  2. Query was BROAD (threshold=3, more lenient)');
      console.log('  3. Papers are genuinely relevant');
      console.log('  4. Filtering was bypassed (check logs)\n');

      console.log('Check backend logs for:');
      console.log('  - "Relevance filtering" message');
      console.log('  - "rejected for low relevance" count');
      console.log('  - Query complexity detection\n');
    }

    // Summary
    console.log('━━━ SUMMARY ━━━\n');

    if (papersWithScores.length > 0 && belowThreshold.length === 0) {
      console.log('✅ BM25 scoring is working');
      console.log('✅ Relevance filtering appears to be working');
      console.log('✅ All returned papers meet threshold\n');
    } else if (papersWithScores.length > 0 && belowThreshold.length > 0) {
      console.log('✅ BM25 scoring is working');
      console.log('❌ Relevance filtering may NOT be working');
      console.log(`❌ ${belowThreshold.length} papers below threshold\n`);
    } else {
      console.log('❌ BM25 scoring may NOT be working');
      console.log('❌ No relevanceScore field found\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\nBackend not running. Start it with:');
      console.log('  cd backend && npm run dev\n');
    } else if (error.response) {
      console.log(`\nStatus: ${error.response.status}`);
      console.log(`Message: ${error.response.data?.message || 'Unknown error'}\n`);
    }
  }
}

testSearch()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
