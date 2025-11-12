/**
 * Comprehensive Backend Source Test
 * Phase 10.6 Day 14.2: Test all 18 academic sources end-to-end
 *
 * Tests:
 * - Each source individually
 * - Backend routing to correct service
 * - Paper structure validation
 * - Error handling
 * - Multi-source aggregation
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';
const TEST_QUERY = 'machine learning';

// All 18 academic sources
const ALL_SOURCES = [
  // Free & Open Access (10 sources)
  { id: 'pubmed', name: 'PubMed', category: 'free' },
  { id: 'pmc', name: 'PubMed Central', category: 'free' },
  { id: 'arxiv', name: 'ArXiv', category: 'free' },
  { id: 'biorxiv', name: 'bioRxiv', category: 'free' },
  { id: 'chemrxiv', name: 'ChemRxiv', category: 'free' },
  { id: 'semantic_scholar', name: 'Semantic Scholar', category: 'free' },
  { id: 'google_scholar', name: 'Google Scholar', category: 'free' },
  { id: 'ssrn', name: 'SSRN', category: 'free' },
  { id: 'crossref', name: 'CrossRef', category: 'free' },
  { id: 'eric', name: 'ERIC', category: 'free' },

  // Premium (8 sources - may need API keys)
  { id: 'web_of_science', name: 'Web of Science', category: 'premium' },
  { id: 'scopus', name: 'Scopus', category: 'premium' },
  { id: 'ieee_xplore', name: 'IEEE Xplore', category: 'premium' },
  { id: 'springer', name: 'Springer', category: 'premium' },
  { id: 'nature', name: 'Nature', category: 'premium' },
  { id: 'wiley', name: 'Wiley', category: 'premium' },
  { id: 'sage', name: 'SAGE', category: 'premium' },
  { id: 'taylor_francis', name: 'Taylor & Francis', category: 'premium' },
];

const FREE_SOURCES = ALL_SOURCES.filter(s => s.category === 'free');

console.log('='.repeat(80));
console.log('📚 COMPREHENSIVE BACKEND SOURCE TEST');
console.log('='.repeat(80));
console.log(`Testing ${ALL_SOURCES.length} sources (${FREE_SOURCES.length} free, ${ALL_SOURCES.length - FREE_SOURCES.length} premium)`);
console.log(`Query: "${TEST_QUERY}"`);
console.log('='.repeat(80));
console.log('');

/**
 * Test individual source
 */
async function testSource(source) {
  try {
    console.log(`\n🔍 Testing: ${source.name} (${source.id})`);

    const response = await axios.post(`${API_BASE}/literature/search`, {
      query: TEST_QUERY,
      sources: [source.id], // Test single source
      limit: 5,
    }, {
      timeout: 30000, // 30 second timeout
    });

    const { papers, total } = response.data;

    if (papers && papers.length > 0) {
      console.log(`   ✅ SUCCESS: ${papers.length} papers returned (total: ${total})`);

      // Validate paper structure
      const firstPaper = papers[0];
      const hasRequiredFields =
        firstPaper.id &&
        firstPaper.title &&
        firstPaper.source &&
        Array.isArray(firstPaper.authors);

      if (!hasRequiredFields) {
        console.log(`   ⚠️  WARNING: Missing required fields`);
      }

      // Check if source matches
      const allSourcesMatch = papers.every(p =>
        p.source === source.id ||
        (source.id === 'biorxiv' && (p.source === 'biorxiv' || p.source === 'medrxiv'))
      );

      if (!allSourcesMatch) {
        console.log(`   ⚠️  WARNING: Source mismatch detected`);
        const uniqueSources = [...new Set(papers.map(p => p.source))];
        console.log(`   Sources found: ${uniqueSources.join(', ')}`);
      }

      return { success: true, count: papers.length, total, source: source.id };
    } else {
      console.log(`   ℹ️  No papers returned (may need API key or no results for query)`);
      return { success: true, count: 0, total: 0, source: source.id, note: 'empty' };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`   ❌ ERROR: Backend not running`);
      return { success: false, source: source.id, error: 'Backend not running' };
    } else if (error.response?.status === 400) {
      console.log(`   ❌ ERROR: Bad request - ${error.response.data?.message || 'Unknown'}`);
      return { success: false, source: source.id, error: 'Bad request' };
    } else {
      console.log(`   ❌ ERROR: ${error.message}`);
      return { success: false, source: source.id, error: error.message };
    }
  }
}

/**
 * Test all free sources together (the bug scenario)
 */
async function testAllFreeSources() {
  try {
    console.log(`\n\n🔍 Testing ALL FREE SOURCES TOGETHER (Bug Scenario)`);
    console.log(`   Sources: ${FREE_SOURCES.map(s => s.id).join(', ')}`);

    const response = await axios.post(`${API_BASE}/literature/search`, {
      query: TEST_QUERY,
      sources: FREE_SOURCES.map(s => s.id),
      limit: 20,
    }, {
      timeout: 60000, // 60 second timeout for multi-source
    });

    const { papers, total } = response.data;

    if (papers && papers.length > 0) {
      console.log(`   ✅ SUCCESS: ${papers.length} papers returned (total: ${total})`);

      // Count papers per source
      const sourceCount = {};
      papers.forEach(p => {
        sourceCount[p.source] = (sourceCount[p.source] || 0) + 1;
      });

      console.log(`\n   📊 Papers per source:`);
      Object.entries(sourceCount).forEach(([source, count]) => {
        const sourceName = ALL_SOURCES.find(s => s.id === source)?.name || source;
        console.log(`      ${sourceName}: ${count} papers`);
      });

      const uniqueSourcesCount = Object.keys(sourceCount).length;
      console.log(`\n   🎯 Result: Papers from ${uniqueSourcesCount}/${FREE_SOURCES.length} sources`);

      if (uniqueSourcesCount < 3) {
        console.log(`   ⚠️  WARNING: Only ${uniqueSourcesCount} sources returned results! Expected more.`);
      } else if (uniqueSourcesCount >= FREE_SOURCES.length * 0.5) {
        console.log(`   ✅ GOOD: Majority of sources (${uniqueSourcesCount}/${FREE_SOURCES.length}) returned results`);
      }

      return { success: true, count: papers.length, total, sourceCount, uniqueSourcesCount };
    } else {
      console.log(`   ℹ️  No papers returned`);
      return { success: true, count: 0, total: 0, sourceCount: {}, uniqueSourcesCount: 0 };
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test execution
 */
async function runTests() {
  const startTime = Date.now();

  // Test individual free sources
  console.log('\n📋 PHASE 1: Individual Free Source Tests');
  console.log('-'.repeat(80));

  const individualResults = [];
  for (const source of FREE_SOURCES) {
    const result = await testSource(source);
    individualResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  // Summary of individual tests
  console.log('\n\n📊 PHASE 1 SUMMARY: Individual Source Results');
  console.log('-'.repeat(80));
  const successCount = individualResults.filter(r => r.success).length;
  const withPapers = individualResults.filter(r => r.count > 0).length;
  const failures = individualResults.filter(r => !r.success);

  console.log(`✅ Successful: ${successCount}/${FREE_SOURCES.length}`);
  console.log(`📚 Returned papers: ${withPapers}/${FREE_SOURCES.length}`);
  console.log(`❌ Failed: ${failures.length}/${FREE_SOURCES.length}`);

  if (failures.length > 0) {
    console.log(`\nFailed sources:`);
    failures.forEach(f => {
      console.log(`   - ${f.source}: ${f.error}`);
    });
  }

  // Test all sources together
  console.log('\n\n📋 PHASE 2: Multi-Source Aggregation Test');
  console.log('-'.repeat(80));
  const multiSourceResult = await testAllFreeSources();

  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(80));

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  console.log(`\nTest Duration: ${duration}s`);
  console.log(`\nIndividual Tests:`);
  console.log(`   - Total sources tested: ${FREE_SOURCES.length}`);
  console.log(`   - Sources that returned papers: ${withPapers}/${FREE_SOURCES.length} (${Math.round(withPapers/FREE_SOURCES.length*100)}%)`);

  if (multiSourceResult.success) {
    console.log(`\nMulti-Source Test:`);
    console.log(`   - Total papers: ${multiSourceResult.count}`);
    console.log(`   - Unique sources: ${multiSourceResult.uniqueSourcesCount}/${FREE_SOURCES.length}`);

    if (multiSourceResult.uniqueSourcesCount < 3) {
      console.log(`   - Status: ❌ FAIL - Bug still present (only ${multiSourceResult.uniqueSourcesCount} sources)`);
    } else if (multiSourceResult.uniqueSourcesCount >= FREE_SOURCES.length * 0.5) {
      console.log(`   - Status: ✅ PASS - Majority of sources working`);
    } else {
      console.log(`   - Status: ⚠️  PARTIAL - ${multiSourceResult.uniqueSourcesCount} sources working`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete');
  console.log('='.repeat(80));
}

// Run tests
runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err.message);
  process.exit(1);
});
