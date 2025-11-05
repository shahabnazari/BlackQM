/**
 * TEST SCRIPT: Theme Extraction Diagnosis
 *
 * This script tests the complete theme extraction flow to diagnose why
 * 11 papers resulted in 0 themes.
 *
 * Usage:
 *   cd backend
 *   npx ts-node test-theme-extraction.ts
 */

import axios from 'axios';

// Test configuration
const API_BASE_URL = 'http://localhost:4000/api';
const TEST_USER_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

/**
 * Test papers with varying content quality
 */
const TEST_PAPERS = [
  {
    id: 'test-paper-1',
    title: 'Climate Change Adaptation in Urban Areas',
    abstract: 'This study examines climate change adaptation strategies in urban environments. We found that cities implementing green infrastructure show 40% better resilience to extreme weather events. Key adaptation measures include urban forests, permeable pavements, and rainwater harvesting systems. Community engagement proved critical for successful implementation. Our analysis of 50 cities reveals that integrated planning approaches yield the most sustainable outcomes.',
    doi: '10.1000/test1',
    authors: ['Smith, J.', 'Johnson, A.'],
    year: 2023,
    keywords: ['climate adaptation', 'urban planning', 'resilience'],
  },
  {
    id: 'test-paper-2',
    title: 'Green Infrastructure and Climate Resilience',
    abstract: 'Green infrastructure plays a vital role in building climate resilience in metropolitan areas. Our research demonstrates that nature-based solutions reduce urban heat island effects by up to 5 degrees Celsius. We studied park systems, street trees, and green roofs across 30 major cities. Cost-benefit analysis shows a 3:1 return on investment over 20 years. Policy recommendations include zoning requirements for green space and incentives for private property owners.',
    doi: '10.1000/test2',
    authors: ['Brown, M.', 'Davis, K.'],
    year: 2023,
    keywords: ['green infrastructure', 'urban heat', 'nature-based solutions'],
  },
  {
    id: 'test-paper-3',
    title: 'Community Engagement in Climate Action',
    abstract: 'Effective climate action requires meaningful community participation. This qualitative study analyzed 25 community-led climate initiatives across diverse neighborhoods. Results show that bottom-up approaches achieve 60% higher adoption rates than top-down policies. Key success factors include local leadership, accessible education, and equitable resource distribution. We propose a framework for inclusive climate planning that centers community voices.',
    doi: '10.1000/test3',
    authors: ['Garcia, R.', 'Lee, S.'],
    year: 2023,
    keywords: ['community engagement', 'climate action', 'participatory planning'],
  },
  {
    id: 'test-paper-4',
    title: 'Equity in Urban Climate Adaptation',
    abstract: 'Climate adaptation efforts often exacerbate existing inequalities. Our analysis of adaptation projects in 40 cities reveals that low-income neighborhoods receive 50% less funding than affluent areas despite facing greater climate risks. We document cases of green gentrification where adaptation investments displace vulnerable populations. Policy interventions must explicitly address equity through targeted funding, anti-displacement measures, and community benefit agreements.',
    doi: '10.1000/test4',
    authors: ['Wilson, T.', 'Martinez, C.'],
    year: 2023,
    keywords: ['climate equity', 'environmental justice', 'urban planning'],
  },
  {
    id: 'test-paper-5',
    title: 'Climate Finance and Municipal Capacity',
    abstract: 'Municipal climate adaptation faces significant financial and capacity constraints. Survey of 100 city governments shows that 70% lack dedicated climate budgets and 80% report insufficient technical expertise. We identify innovative financing mechanisms including green bonds, public-private partnerships, and federal grant programs. Capacity building through regional collaborations and knowledge sharing networks proves essential for smaller municipalities.',
    doi: '10.1000/test5',
    authors: ['Anderson, P.', 'Thompson, L.'],
    year: 2023,
    keywords: ['climate finance', 'municipal capacity', 'adaptation funding'],
  },
  {
    id: 'test-paper-6',
    title: 'Monitoring and Evaluation of Climate Adaptation',
    abstract: 'Robust monitoring and evaluation (M&E) frameworks are critical for adaptive management of climate interventions. This paper develops a comprehensive M&E framework tested across 15 adaptation projects. We propose 25 indicators covering ecological, social, and economic dimensions. Regular monitoring enables course correction and learning. Our findings emphasize the importance of baseline data collection and long-term commitment to evaluation.',
    doi: '10.1000/test6',
    authors: ['Chang, Y.', 'Patel, N.'],
    year: 2023,
    keywords: ['monitoring evaluation', 'adaptive management', 'climate metrics'],
  },
  {
    id: 'test-paper-7',
    title: 'Climate Communication and Public Awareness',
    abstract: 'Effective climate communication is essential for mobilizing adaptation action. Our experimental study tests different message frames across 2,000 participants. Results show that emphasizing local co-benefits increases support for adaptation by 45% compared to global risk framing. Visual storytelling and personal narratives prove more effective than scientific data alone. We provide evidence-based guidelines for climate communicators.',
    doi: '10.1000/test7',
    authors: ['Nguyen, H.', 'Kumar, R.'],
    year: 2023,
    keywords: ['climate communication', 'public engagement', 'behavior change'],
  },
  {
    id: 'test-paper-8',
    title: 'Technology and Climate Adaptation Innovation',
    abstract: 'Emerging technologies offer new opportunities for climate adaptation. We review applications of AI, IoT sensors, and remote sensing in urban climate management. Case studies demonstrate 30% improvement in early warning systems and 25% better resource allocation through predictive analytics. However, digital divides may exclude vulnerable communities from technological benefits. Equitable technology access must be prioritized.',
    doi: '10.1000/test8',
    authors: ['O\'Brien, K.', 'Zhao, W.'],
    year: 2023,
    keywords: ['climate technology', 'smart cities', 'digital adaptation'],
  },
  {
    id: 'test-paper-9',
    title: 'Regional Climate Adaptation Governance',
    abstract: 'Climate impacts transcend municipal boundaries requiring regional coordination. Analysis of 10 metropolitan regions reveals that multi-jurisdictional governance structures improve adaptation outcomes by addressing spillover effects and economies of scale. Challenges include competing priorities, resource inequities, and political fragmentation. Successful regional approaches employ formal agreements, joint planning processes, and shared technical resources.',
    doi: '10.1000/test9',
    authors: ['Foster, E.', 'Kim, J.'],
    year: 2023,
    keywords: ['regional governance', 'multi-level planning', 'climate coordination'],
  },
  {
    id: 'test-paper-10',
    title: 'Cultural Dimensions of Climate Adaptation',
    abstract: 'Climate adaptation must be culturally appropriate to be effective and equitable. Ethnographic research in 8 diverse communities shows that indigenous and local knowledge systems offer valuable adaptation strategies often overlooked by technical approaches. Cultural values shape perceptions of climate risk and acceptable adaptation measures. We argue for culturally grounded adaptation planning that respects diverse worldviews and knowledge traditions.',
    doi: '10.1000/test10',
    authors: ['Rodriguez, M.', 'Singh, A.'],
    year: 2023,
    keywords: ['cultural adaptation', 'indigenous knowledge', 'local knowledge'],
  },
  {
    id: 'test-paper-11',
    title: 'Long-term Climate Adaptation Planning',
    abstract: 'Climate adaptation requires planning horizons extending to 2050 and beyond. We analyze 20 long-range adaptation plans identifying best practices in scenario planning, pathway approaches, and decision making under uncertainty. Flexible, adaptive strategies that can be adjusted as conditions change outperform rigid long-term commitments. Integration of adaptation planning with comprehensive and capital improvement plans ensures sustained implementation.',
    doi: '10.1000/test11',
    authors: ['White, D.', 'Chen, X.'],
    year: 2023,
    keywords: ['long-term planning', 'scenario planning', 'adaptive pathways'],
  },
];

/**
 * Test cases with different purposes
 */
const TEST_CASES = [
  {
    name: 'Q-Methodology (Breadth, 40-80 themes)',
    purpose: 'q_methodology',
    expectedMin: 40,
    expectedMax: 80,
  },
  {
    name: 'Survey Construction (Depth, 5-15 constructs)',
    purpose: 'survey_construction',
    expectedMin: 5,
    expectedMax: 15,
  },
  {
    name: 'Qualitative Analysis (Saturation, 5-20 themes)',
    purpose: 'qualitative_analysis',
    expectedMin: 5,
    expectedMax: 20,
  },
];

/**
 * Run theme extraction test
 */
async function testThemeExtraction(testCase: typeof TEST_CASES[0]) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST CASE: ${testCase.name}`);
  console.log('='.repeat(80));

  // Convert test papers to SourceContent format
  const sources = TEST_PAPERS.map(paper => ({
    id: paper.id,
    type: 'paper' as const,
    title: paper.title,
    content: paper.abstract,
    keywords: paper.keywords,
    doi: paper.doi,
    authors: paper.authors,
    year: paper.year,
  }));

  console.log(`\n📊 Test Configuration:`);
  console.log(`   Purpose: ${testCase.purpose}`);
  console.log(`   Sources: ${sources.length} papers`);
  console.log(`   Expected themes: ${testCase.expectedMin}-${testCase.expectedMax}`);
  console.log(`   Average abstract length: ${Math.round(sources.reduce((sum, s) => sum + s.content.length, 0) / sources.length)} chars`);

  try {
    console.log(`\n📡 Calling API: POST ${API_BASE_URL}/literature/themes/extract-themes-v2/public`);

    const startTime = Date.now();
    const response = await axios.post(
      `${API_BASE_URL}/literature/themes/extract-themes-v2/public`,
      {
        sources,
        purpose: testCase.purpose,
        userExpertiseLevel: 'researcher',
        allowIterativeRefinement: true,
        methodology: 'reflexive_thematic',
        validationLevel: 'rigorous',
        researchContext: 'Urban climate adaptation strategies',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Uncomment and add your token if authentication is required:
          // 'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        },
        timeout: 300000, // 5 minutes
      }
    );
    const duration = Date.now() - startTime;

    console.log(`\n✅ API Response Received (${(duration / 1000).toFixed(1)}s)`);
    console.log(`   Success: ${response.data.success}`);
    console.log(`   Themes extracted: ${response.data.themes?.length || 0}`);

    if (response.data.themes && response.data.themes.length > 0) {
      console.log(`\n📝 Extracted Themes:`);
      response.data.themes.slice(0, 10).forEach((theme: any, idx: number) => {
        console.log(`   ${idx + 1}. ${theme.label}`);
        console.log(`      Confidence: ${(theme.confidence * 100).toFixed(1)}%`);
        console.log(`      Keywords: ${theme.keywords.slice(0, 5).join(', ')}`);
        console.log(`      Sources: ${theme.sources?.length || 0}`);
      });
      if (response.data.themes.length > 10) {
        console.log(`   ... and ${response.data.themes.length - 10} more themes`);
      }
    } else {
      console.log(`\n⚠️  WARNING: 0 themes extracted!`);
      console.log(`   This suggests one of the following:`);
      console.log(`   1. Content too short or lacking substance`);
      console.log(`   2. Topics too diverse with no overlap`);
      console.log(`   3. Validation thresholds too strict`);
      console.log(`   4. API or service error`);
    }

    if (response.data.saturationData) {
      console.log(`\n📈 Saturation Analysis:`);
      console.log(`   Saturation reached: ${response.data.saturationData.saturationReached ? 'Yes' : 'No'}`);
      console.log(`   Recommended sources: ${response.data.saturationData.recommendedSourceCount || 'N/A'}`);
    }

    if (response.data.methodology) {
      console.log(`\n🔬 Methodology:`);
      console.log(`   Citation: ${response.data.methodology.citation}`);
      console.log(`   AI Role: ${response.data.methodology.aiRole?.substring(0, 100)}...`);
    }

    return response.data;

  } catch (error: any) {
    console.error(`\n❌ TEST FAILED`);

    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data?.message || error.response.data?.error}`);
      console.error(`   Details:`, error.response.data);
    } else if (error.request) {
      console.error(`   No response received from server`);
      console.error(`   Is the backend running on ${API_BASE_URL}?`);
    } else {
      console.error(`   Error: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('\n🧪 THEME EXTRACTION DIAGNOSTIC TEST SUITE');
  console.log('==========================================\n');
  console.log(`Backend API: ${API_BASE_URL}`);
  console.log(`Test Papers: ${TEST_PAPERS.length} papers with climate adaptation theme`);
  console.log(`Test Cases: ${TEST_CASES.length} different research purposes\n`);

  // Check if backend is running
  try {
    console.log('🔍 Checking if backend is accessible...');
    await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend is running\n');
  } catch (error) {
    console.error('❌ Backend is not accessible!');
    console.error(`   Make sure the backend is running on ${API_BASE_URL}`);
    console.error(`   Start it with: cd backend && npm run start:dev`);
    process.exit(1);
  }

  const results: any[] = [];

  // Run all test cases
  for (const testCase of TEST_CASES) {
    try {
      const result = await testThemeExtraction(testCase);
      results.push({
        testCase: testCase.name,
        success: true,
        themeCount: result.themes?.length || 0,
        result,
      });
    } catch (error) {
      results.push({
        testCase: testCase.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Wait between tests
    if (testCase !== TEST_CASES[TEST_CASES.length - 1]) {
      console.log('\n⏳ Waiting 5 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  results.forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.testCase}`);
    if (result.success) {
      console.log(`   ✅ Success - ${result.themeCount} themes extracted`);
      const testCase = TEST_CASES[idx];
      if (result.themeCount < testCase.expectedMin) {
        console.log(`   ⚠️  Below expected minimum (${testCase.expectedMin})`);
      } else if (result.themeCount > testCase.expectedMax) {
        console.log(`   ⚠️  Above expected maximum (${testCase.expectedMax})`);
      } else {
        console.log(`   ✓ Within expected range (${testCase.expectedMin}-${testCase.expectedMax})`);
      }
    } else {
      console.log(`   ❌ Failed - ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Tests completed: ${results.filter(r => r.success).length}/${results.length} passed`);
  console.log('='.repeat(80) + '\n');
}

// Run tests
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
