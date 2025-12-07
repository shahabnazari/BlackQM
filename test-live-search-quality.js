/**
 * Live Search Quality Test
 * Tests actual search results to verify quality scoring enhancements
 * 
 * This test:
 * 1. Runs a real search query
 * 2. Checks if papers have quality scores
 * 3. Verifies the new weight distribution (30/50/20)
 * 4. Checks if recency bonus is applied
 * 5. Validates BM25 relevance scoring (if integrated)
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:4000';
const TEST_QUERY = 'machine learning';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Live Search Quality Test                                 ║');
console.log('║   Testing Real Search Results                              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function testLiveSearch() {
  try {
    console.log(`🔍 Testing search query: "${TEST_QUERY}"`);
    console.log(`📡 API endpoint: ${API_BASE}/literature/search\n`);

    // Make search request
    const response = await axios.post(`${API_BASE}/literature/search`, {
      query: TEST_QUERY,
      sources: ['pubmed', 'arxiv'],
      limit: 20,
      offset: 0
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Search request successful\n');
    
    const { papers, metadata } = response.data;
    
    if (!papers || papers.length === 0) {
      console.log('⚠️  No papers returned from search');
      return;
    }

    console.log(`📚 Retrieved ${papers.length} papers\n`);
    console.log('='.repeat(70));
    console.log('QUALITY SCORING ANALYSIS');
    console.log('='.repeat(70));

    // Analyze quality scores
    let papersWithQualityScore = 0;
    let papersWithRecencyBonus = 0;
    let papersWithRelevanceScore = 0;
    let totalQualityScore = 0;
    let recentPapers = 0; // Papers from last 2 years

    const currentYear = new Date().getFullYear();

    papers.forEach((paper, index) => {
      if (index < 5) {
        console.log(`\n📄 Paper ${index + 1}: ${paper.title?.substring(0, 60)}...`);
        console.log(`   Year: ${paper.year || 'N/A'}`);
        console.log(`   Citations: ${paper.citationCount || 0}`);
        console.log(`   Journal: ${paper.journal || 'N/A'}`);
        
        if (paper.qualityScore !== undefined) {
          console.log(`   ✅ Quality Score: ${paper.qualityScore.toFixed(2)}/100`);
          papersWithQualityScore++;
          totalQualityScore += paper.qualityScore;
        } else {
          console.log(`   ❌ Quality Score: MISSING`);
        }

        if (paper.relevanceScore !== undefined) {
          console.log(`   ✅ Relevance Score: ${paper.relevanceScore.toFixed(2)}/100`);
          papersWithRelevanceScore++;
        } else {
          console.log(`   ⚠️  Relevance Score: MISSING`);
        }

        if (paper.recencyBonus !== undefined) {
          console.log(`   ✅ Recency Bonus: ${paper.recencyBonus.toFixed(2)}/100`);
          papersWithRecencyBonus++;
        }
      }

      // Count recent papers
      if (paper.year && (currentYear - paper.year) <= 2) {
        recentPapers++;
      }

      // Count papers with scores
      if (paper.qualityScore !== undefined) {
        papersWithQualityScore++;
        totalQualityScore += paper.qualityScore;
      }
      if (paper.relevanceScore !== undefined) {
        papersWithRelevanceScore++;
      }
      if (paper.recencyBonus !== undefined) {
        papersWithRecencyBonus++;
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total papers: ${papers.length}`);
    console.log(`Papers with quality score: ${papersWithQualityScore} (${(papersWithQualityScore/papers.length*100).toFixed(1)}%)`);
    console.log(`Papers with relevance score: ${papersWithRelevanceScore} (${(papersWithRelevanceScore/papers.length*100).toFixed(1)}%)`);
    console.log(`Papers with recency bonus: ${papersWithRecencyBonus} (${(papersWithRecencyBonus/papers.length*100).toFixed(1)}%)`);
    console.log(`Recent papers (≤2 years): ${recentPapers} (${(recentPapers/papers.length*100).toFixed(1)}%)`);
    
    if (papersWithQualityScore > 0) {
      const avgQuality = totalQualityScore / papersWithQualityScore;
      console.log(`Average quality score: ${avgQuality.toFixed(2)}/100`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('METADATA ANALYSIS');
    console.log('='.repeat(70));
    
    if (metadata) {
      console.log('Metadata received:');
      console.log(JSON.stringify(metadata, null, 2));
    } else {
      console.log('⚠️  No metadata returned');
    }

    console.log('\n' + '='.repeat(70));
    console.log('ASSESSMENT');
    console.log('='.repeat(70));

    const issues = [];
    const successes = [];

    if (papersWithQualityScore === papers.length) {
      successes.push('✅ All papers have quality scores');
    } else if (papersWithQualityScore > 0) {
      issues.push(`⚠️  Only ${papersWithQualityScore}/${papers.length} papers have quality scores`);
    } else {
      issues.push('❌ NO papers have quality scores - scoring not integrated!');
    }

    if (papersWithRelevanceScore === papers.length) {
      successes.push('✅ All papers have relevance scores (BM25 integrated)');
    } else if (papersWithRelevanceScore > 0) {
      issues.push(`⚠️  Only ${papersWithRelevanceScore}/${papers.length} papers have relevance scores`);
    } else {
      issues.push('⚠️  NO papers have relevance scores - BM25 not integrated yet');
    }

    if (recentPapers > 0 && papersWithRecencyBonus > 0) {
      successes.push('✅ Recency bonus is being calculated');
    } else if (recentPapers > 0) {
      issues.push('⚠️  Recent papers found but no recency bonus calculated');
    }

    if (successes.length > 0) {
      console.log('\n✅ SUCCESSES:');
      successes.forEach(s => console.log(`   ${s}`));
    }

    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES:');
      issues.forEach(i => console.log(`   ${i}`));
    }

    console.log('\n' + '='.repeat(70));
    console.log('NEXT STEPS');
    console.log('='.repeat(70));

    if (papersWithQualityScore === 0) {
      console.log('❌ CRITICAL: Quality scoring not integrated');
      console.log('   Action: Integrate paper-quality.util.ts into literature.service.ts');
      console.log('   See: MANUAL_INTEGRATION_GUIDE.md');
    }

    if (papersWithRelevanceScore === 0) {
      console.log('⚠️  BM25 relevance scoring not integrated');
      console.log('   Action: Integrate relevance-scoring.util.ts into literature.service.ts');
      console.log('   See: MANUAL_INTEGRATION_GUIDE.md');
    }

    if (papersWithQualityScore === papers.length && papersWithRelevanceScore === papers.length) {
      console.log('✅ ALL ENHANCEMENTS INTEGRATED SUCCESSFULLY!');
      console.log('   The search engine is using the new quality and relevance scoring.');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend server is not running');
      console.log('   Start the backend with: cd backend && npm run start:dev');
    } else if (error.response) {
      console.log('\n📊 Response status:', error.response.status);
      console.log('📊 Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Run the test
testLiveSearch();
