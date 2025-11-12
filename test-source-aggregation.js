#!/usr/bin/env node
/**
 * Test Source Aggregation Strategy
 * Shows exactly how papers are selected from multiple sources
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';
const TEST_QUERY = 'machine learning';

// All 9 free sources
const ALL_FREE_SOURCES = [
  'pubmed',
  'pmc',
  'arxiv',
  'biorxiv',
  'chemrxiv',
  'semantic_scholar',
  'ssrn',
  'crossref',
  'eric',
];

async function testAggregation() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 TESTING PAPER AGGREGATION STRATEGY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Query: "${TEST_QUERY}"`);
  console.log(`Sources: ${ALL_FREE_SOURCES.length} free sources`);
  console.log('Target: 200 papers (10 pages × 20 papers)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Fetch first 10 pages (200 papers)
    const allPapers = [];
    const sourceDistribution = new Map();

    console.log('📥 Fetching papers (10 pages)...\n');

    for (let page = 1; page <= 10; page++) {
      const response = await axios.post(`${API_BASE}/literature/search/public`, {
        query: TEST_QUERY,
        sources: ALL_FREE_SOURCES,
        page: page,
        limit: 20,
      });

      const { papers } = response.data;
      allPapers.push(...papers);

      // Count papers by source
      papers.forEach(paper => {
        const source = paper.source || 'unknown';
        sourceDistribution.set(source, (sourceDistribution.get(source) || 0) + 1);
      });

      console.log(`  Page ${page}/10: ${papers.length} papers (total: ${allPapers.length})`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 SOURCE DISTRIBUTION ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Sort by paper count (descending)
    const sortedSources = Array.from(sourceDistribution.entries())
      .sort((a, b) => b[1] - a[1]);

    console.log('Source Distribution (Top 200 Papers):');
    console.log('─────────────────────────────────────────────────────────────');

    let totalShown = 0;
    sortedSources.forEach(([source, count]) => {
      const percentage = ((count / allPapers.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(count / 4)); // Visual bar
      console.log(`${source.padEnd(20)} ${String(count).padStart(3)} papers (${percentage.padStart(5)}%) ${bar}`);
      totalShown += count;
    });

    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Total:                ${totalShown} papers\n`);

    // Analysis
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DIVERSITY ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const sourcesWithPapers = sortedSources.length;
    const sourcesQueried = ALL_FREE_SOURCES.length;
    const diversityPercentage = ((sourcesWithPapers / sourcesQueried) * 100).toFixed(1);

    console.log(`Sources Queried:       ${sourcesQueried}`);
    console.log(`Sources with Results:  ${sourcesWithPapers}`);
    console.log(`Source Diversity:      ${diversityPercentage}%\n`);

    // Check for dominance
    const topSource = sortedSources[0];
    const topSourcePercentage = ((topSource[1] / allPapers.length) * 100).toFixed(1);

    if (topSourcePercentage > 50) {
      console.log(`⚠️  WARNING: Source "${topSource[0]}" dominates with ${topSourcePercentage}% of results!`);
      console.log('   This reduces diversity and may bias research.\n');
    } else if (topSourcePercentage > 30) {
      console.log(`⚠️  NOTICE: Source "${topSource[0]}" provides ${topSourcePercentage}% of results.`);
      console.log('   Consider source balancing for better diversity.\n');
    } else {
      console.log(`✅ Good diversity: Top source "${topSource[0]}" provides ${topSourcePercentage}% of results.\n`);
    }

    // Check for source gaps
    console.log('Source Coverage:');
    console.log('─────────────────────────────────────────────────────────────');

    ALL_FREE_SOURCES.forEach(source => {
      const count = sourceDistribution.get(source) || 0;
      const status = count > 0 ? '✓' : '✗';
      const reason = count === 0 ? '(No results or out of domain)' : '';
      console.log(`  ${status} ${source.padEnd(20)} ${count} papers ${reason}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (sourcesWithPapers < sourcesQueried / 2) {
      console.log('⚠️  Low source diversity detected.');
      console.log('   Recommendation: Implement source balancing strategy.');
      console.log('   Options:');
      console.log('   1. Proportional allocation (recommended)');
      console.log('   2. Minimum guarantee per source (20 papers)');
      console.log('   3. Tiered allocation based on source quality\n');
    }

    if (topSourcePercentage > 40) {
      console.log('⚠️  Single source dominance detected.');
      console.log(`   "${topSource[0]}" provides ${topSourcePercentage}% of all papers.`);
      console.log('   Recommendation: Apply proportional balancing to improve diversity.\n');
    }

    // Quality analysis
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📈 QUALITY METRICS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const withCitations = allPapers.filter(p => p.citationCount > 0).length;
    const avgCitations = allPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0) / allPapers.length;
    const withDOI = allPapers.filter(p => p.doi).length;
    const withAbstract = allPapers.filter(p => p.abstract && p.abstract.length > 100).length;

    console.log(`Papers with Citations:  ${withCitations}/${allPapers.length} (${((withCitations/allPapers.length)*100).toFixed(1)}%)`);
    console.log(`Average Citation Count: ${avgCitations.toFixed(1)}`);
    console.log(`Papers with DOI:        ${withDOI}/${allPapers.length} (${((withDOI/allPapers.length)*100).toFixed(1)}%)`);
    console.log(`Papers with Abstract:   ${withAbstract}/${allPapers.length} (${((withAbstract/allPapers.length)*100).toFixed(1)}%)`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run test
testAggregation();
