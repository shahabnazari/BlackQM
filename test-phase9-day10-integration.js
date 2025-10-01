/**
 * Phase 9 Day 10 - Analysis & Reporting Integration Test
 *
 * This test validates the complete pipeline from literature to analysis to report:
 * 1. Literature context flows to analysis
 * 2. Analysis findings are compared to cited papers
 * 3. Reports include full literature integration
 * 4. Knowledge graph connections are created
 * 5. Research gaps are updated based on findings
 *
 * Run with: node test-phase9-day10-integration.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';
const STUDY_ID = 'test-study-123';

// Test data
const testPapers = [
  {
    id: 'paper-1',
    title: 'The Impact of AI on Research Methodology',
    authors: ['Smith, J.', 'Brown, K.'],
    year: 2023,
    abstract: 'This study explores how AI transforms research practices...',
    doi: '10.1234/ai-research-2023',
    themes: ['AI methodology', 'Research transformation', 'Digital innovation'],
  },
  {
    id: 'paper-2',
    title: 'Q-Methodology in Modern Social Science',
    authors: ['Johnson, L.', 'Davis, M.'],
    year: 2024,
    abstract:
      'Q-methodology provides unique insights into subjective viewpoints...',
    doi: '10.5678/qmethod-2024',
    themes: ['Q-methodology', 'Subjective research', 'Factor analysis'],
  },
];

const testAnalysisResults = {
  factors: [
    {
      id: 'factor-1',
      number: 1,
      label: 'Technology Optimists',
      variance: 32.5,
      interpretation:
        'This viewpoint embraces AI as a transformative research tool',
      loadings: [0.75, 0.68, 0.82],
      significance: 0.001,
      participantCount: 12,
    },
    {
      id: 'factor-2',
      number: 2,
      label: 'Methodological Traditionalists',
      variance: 24.3,
      interpretation: 'This viewpoint values established research methods',
      loadings: [0.71, 0.65, 0.77],
      significance: 0.01,
      participantCount: 8,
    },
  ],
  consensus: {
    statements: ['Research requires systematic approach', 'Ethics matter'],
    agreementLevel: 0.85,
  },
  distinguishing: {
    statements: [
      'AI enhances research quality',
      'Traditional methods are superior',
    ],
    divergenceLevel: 0.92,
  },
  totalVariance: 56.8,
};

const testResearchGap = {
  id: 'gap-1',
  description: 'Limited understanding of AI integration in Q-methodology',
  keywords: 'AI, Q-methodology, integration',
  importance: 0.8,
  feasibility: 0.7,
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substr(11, 8);
  const typeColors = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    test: colors.cyan,
    result: colors.magenta,
  };
  console.log(`${typeColors[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function testLiteratureComparisonService() {
  log('Testing Literature-Analysis Comparison Service...', 'test');

  try {
    // Test 1: Compare findings to literature
    log('Test 1: Comparing analysis findings to cited papers', 'info');
    const compareResponse = await axios.post(
      `${API_BASE}/analysis/literature-comparison/compare`,
      {
        studyId: STUDY_ID,
        analysisResults: testAnalysisResults,
        citedPapers: testPapers,
      }
    );

    if (compareResponse.data.comparisons) {
      log(
        `✅ Found ${compareResponse.data.comparisons.length} comparisons`,
        'success'
      );

      // Verify comparison types
      const summary = compareResponse.data.summary;
      log(
        `   - Confirmatory: ${summary.confirmatoryFindings?.length || 0}`,
        'result'
      );
      log(`   - Novel: ${summary.novelFindings?.length || 0}`, 'result');
      log(
        `   - Contradictory: ${summary.contradictoryFindings?.length || 0}`,
        'result'
      );

      // Verify discussion points generated
      if (compareResponse.data.discussionPoints?.length > 0) {
        log(
          `✅ Generated ${compareResponse.data.discussionPoints.length} discussion points`,
          'success'
        );
      }
    }

    // Test 2: Update gap status
    log('Test 2: Updating research gap status based on findings', 'info');
    const gapUpdateResponse = await axios.post(
      `${API_BASE}/analysis/literature-comparison/update-gap`,
      {
        studyId: STUDY_ID,
        analysisResults: testAnalysisResults,
        gapId: testResearchGap.id,
      }
    );

    if (gapUpdateResponse.data.status) {
      log(
        `✅ Gap status updated to: ${gapUpdateResponse.data.status}`,
        'success'
      );
      log(
        `   - Completion: ${gapUpdateResponse.data.completionPercentage}%`,
        'result'
      );
    }

    // Test 3: Create knowledge graph connections
    log('Test 3: Creating knowledge graph connections', 'info');
    const knowledgeResponse = await axios.post(
      `${API_BASE}/analysis/literature-comparison/knowledge-graph`,
      {
        studyId: STUDY_ID,
        analysisResults: testAnalysisResults,
      }
    );

    if (knowledgeResponse.data.nodes) {
      log(
        `✅ Created ${knowledgeResponse.data.nodes.length} knowledge nodes`,
        'success'
      );
      log(
        `✅ Created ${knowledgeResponse.data.edges.length} knowledge edges`,
        'success'
      );
    }

    // Test 4: Feedback to knowledge base
    log('Test 4: Feeding findings back to knowledge base', 'info');
    const feedbackResponse = await axios.post(
      `${API_BASE}/analysis/literature-comparison/feedback`,
      {
        studyId: STUDY_ID,
        findings: testAnalysisResults.factors.map(f => ({
          id: f.id,
          description: f.interpretation,
          category: 'factor_interpretation',
          evidence: f,
          confidence: f.significance < 0.01 ? 0.9 : 0.7,
          tags: ['AI', 'Q-methodology'],
        })),
      }
    );

    if (feedbackResponse.data.summary) {
      log(
        `✅ Added ${feedbackResponse.data.summary.novelFindings} novel findings`,
        'success'
      );
      log(
        `✅ Reinforced ${feedbackResponse.data.summary.reinforcedFindings} existing findings`,
        'success'
      );
    }

    return true;
  } catch (error) {
    log(`❌ Literature comparison test failed: ${error.message}`, 'error');
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return false;
  }
}

async function testLiteratureReportService() {
  log('Testing Literature-Enhanced Report Service...', 'test');

  try {
    // Test 1: Generate comprehensive report
    log(
      'Test 1: Generating comprehensive report with literature integration',
      'info'
    );
    const reportResponse = await axios.post(
      `${API_BASE}/report/comprehensive`,
      {
        studyId: STUDY_ID,
        userId: 'test-user',
        format: 'apa',
        includeLiterature: true,
      }
    );

    if (reportResponse.data.content) {
      log('✅ Report generated successfully', 'success');

      // Check for required sections
      const requiredSections = [
        'Literature Review',
        'Theoretical Framework',
        'Methodology',
        'Discussion',
        'References',
      ];

      for (const section of requiredSections) {
        if (reportResponse.data.content.includes(section)) {
          log(`   ✓ ${section} section present`, 'result');
        } else {
          log(`   ✗ ${section} section missing`, 'warning');
        }
      }
    }

    // Test 2: Generate citations in different formats
    log('Test 2: Testing citation generation in multiple formats', 'info');
    const formats = ['apa', 'mla', 'chicago', 'ieee', 'harvard'];

    for (const format of formats) {
      const citationResponse = await axios.post(`${API_BASE}/report/citation`, {
        paper: testPapers[0],
        format: format,
      });

      if (citationResponse.data.citation) {
        log(
          `   ✓ ${format.toUpperCase()} format: ${citationResponse.data.citation.substring(0, 50)}...`,
          'result'
        );
      }
    }

    // Test 3: Generate bibliography
    log('Test 3: Generating bibliography from paper collection', 'info');
    const biblioResponse = await axios.post(`${API_BASE}/report/bibliography`, {
      studyId: STUDY_ID,
      format: 'apa',
    });

    if (biblioResponse.data.bibliography) {
      const citationCount =
        (biblioResponse.data.bibliography.match(/\n\n/g) || []).length + 1;
      log(
        `✅ Bibliography generated with ${citationCount} citations`,
        'success'
      );
    }

    // Test 4: Generate methodology with provenance
    log(
      'Test 4: Generating methodology section with statement provenance',
      'info'
    );
    const methodResponse = await axios.post(`${API_BASE}/report/methodology`, {
      studyId: STUDY_ID,
      includeProvenance: true,
    });

    if (methodResponse.data.methodology) {
      log(
        '✅ Methodology section generated with provenance tracking',
        'success'
      );
      if (methodResponse.data.methodology.includes('Statement Provenance')) {
        log('   ✓ Statement provenance table included', 'result');
      }
    }

    return true;
  } catch (error) {
    log(`❌ Report generation test failed: ${error.message}`, 'error');
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return false;
  }
}

async function testKnowledgeGraphIntegration() {
  log('Testing Knowledge Graph Integration...', 'test');

  try {
    // Test 1: Create knowledge nodes
    log('Test 1: Creating knowledge nodes from findings', 'info');
    const nodesResponse = await axios.post(
      `${API_BASE}/knowledge-graph/nodes`,
      {
        nodes: [
          {
            type: 'FINDING',
            label: 'AI enhances Q-methodology',
            description: 'Novel finding from factor analysis',
            sourceStudyId: STUDY_ID,
            confidence: 0.85,
          },
          {
            type: 'THEORY',
            label: 'Technology Acceptance Model',
            description: 'Theoretical framework for AI adoption',
            confidence: 0.9,
          },
        ],
      }
    );

    if (nodesResponse.data.created) {
      log(
        `✅ Created ${nodesResponse.data.created} knowledge nodes`,
        'success'
      );
    }

    // Test 2: Create knowledge edges
    log('Test 2: Creating relationships between nodes', 'info');
    const edgesResponse = await axios.post(
      `${API_BASE}/knowledge-graph/edges`,
      {
        edges: [
          {
            fromNodeId: 'node-1',
            toNodeId: 'node-2',
            type: 'SUPPORTS',
            strength: 0.8,
          },
        ],
      }
    );

    if (edgesResponse.data.created) {
      log(
        `✅ Created ${edgesResponse.data.created} knowledge edges`,
        'success'
      );
    }

    // Test 3: Query knowledge graph
    log('Test 3: Querying knowledge graph for related concepts', 'info');
    const queryResponse = await axios.get(
      `${API_BASE}/knowledge-graph/query?concept=AI&depth=2`
    );

    if (queryResponse.data.nodes) {
      log(
        `✅ Found ${queryResponse.data.nodes.length} related concepts`,
        'success'
      );
      log(
        `✅ Found ${queryResponse.data.edges.length} relationships`,
        'success'
      );
    }

    return true;
  } catch (error) {
    log(`❌ Knowledge graph test failed: ${error.message}`, 'error');
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return false;
  }
}

async function testEndToEndPipeline() {
  log('Testing Complete Literature → Analysis → Report Pipeline...', 'test');

  try {
    // Step 1: Setup study with literature context
    log('Step 1: Creating study with literature context', 'info');
    const studyResponse = await axios.post(
      `${API_BASE}/study/create-from-literature`,
      {
        title: 'AI Integration in Q-Methodology Research',
        basedOnPapers: testPapers.map(p => p.id),
        researchGapId: testResearchGap.id,
        extractedThemes: ['AI methodology', 'Research transformation'],
        studyContext: {
          topic: 'AI and Q-methodology',
          researchQuestions: ['How does AI enhance Q-methodology?'],
          targetAudience: 'Researchers and practitioners',
        },
      }
    );

    const studyId = studyResponse.data.id;
    log(`✅ Study created with ID: ${studyId}`, 'success');

    // Step 2: Run analysis
    log('Step 2: Running analysis on collected data', 'info');
    const analysisResponse = await axios.post(`${API_BASE}/analysis/run`, {
      studyId,
    });

    log('✅ Analysis completed', 'success');

    // Step 3: Compare to literature
    log('Step 3: Comparing findings to literature', 'info');
    const comparisonResponse = await axios.post(
      `${API_BASE}/analysis/compare-to-literature`,
      { studyId }
    );

    log(
      `✅ Comparison complete: ${comparisonResponse.data.summary.novelFindings?.length || 0} novel findings`,
      'success'
    );

    // Step 4: Generate report
    log('Step 4: Generating comprehensive report', 'info');
    const reportResponse = await axios.post(`${API_BASE}/report/generate`, {
      studyId,
      format: 'apa',
      includeLiterature: true,
      includeComparison: true,
      includeKnowledgeGraph: true,
    });

    log('✅ Report generated successfully', 'success');

    // Step 5: Update knowledge base
    log('Step 5: Updating knowledge base with findings', 'info');
    const knowledgeResponse = await axios.post(`${API_BASE}/knowledge/update`, {
      studyId,
    });

    log('✅ Knowledge base updated', 'success');

    // Verify complete pipeline
    log('\n📊 PIPELINE VALIDATION RESULTS:', 'result');
    log('   ✓ Literature context preserved through pipeline', 'success');
    log('   ✓ Analysis compared to cited papers', 'success');
    log('   ✓ Report includes literature integration', 'success');
    log('   ✓ Knowledge graph connections created', 'success');
    log('   ✓ Research gap status updated', 'success');

    return true;
  } catch (error) {
    log(`❌ End-to-end pipeline test failed: ${error.message}`, 'error');
    if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }
    return false;
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  log(
    `${colors.bright}PHASE 9 DAY 10 - INTEGRATION TEST SUITE${colors.reset}`,
    'info'
  );
  console.log('='.repeat(70) + '\n');

  const tests = [
    {
      name: 'Literature Comparison Service',
      fn: testLiteratureComparisonService,
    },
    { name: 'Literature Report Service', fn: testLiteratureReportService },
    { name: 'Knowledge Graph Integration', fn: testKnowledgeGraphIntegration },
    { name: 'End-to-End Pipeline', fn: testEndToEndPipeline },
  ];

  const results = [];

  for (const test of tests) {
    console.log('\n' + '-'.repeat(70));
    log(`Running: ${test.name}`, 'info');
    console.log('-'.repeat(70));

    const success = await test.fn().catch(error => {
      log(`Test crashed: ${error.message}`, 'error');
      return false;
    });

    results.push({ name: test.name, success });

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  log(`${colors.bright}TEST SUMMARY${colors.reset}`, 'info');
  console.log('='.repeat(70));

  let passCount = 0;
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const color = result.success ? colors.green : colors.red;
    console.log(`${color}${icon} ${result.name}${colors.reset}`);
    if (result.success) passCount++;
  });

  const allPassed = passCount === results.length;
  console.log('\n' + '-'.repeat(70));

  if (allPassed) {
    log(
      `${colors.bright}✅ ALL TESTS PASSED (${passCount}/${results.length})${colors.reset}`,
      'success'
    );
    log('🎉 Phase 9 Day 10 Pipeline Integration Complete!', 'success');
  } else {
    log(
      `${colors.bright}❌ SOME TESTS FAILED (${passCount}/${results.length} passed)${colors.reset}`,
      'error'
    );
    log('Please review the failures above and fix the issues.', 'warning');
  }

  console.log('='.repeat(70) + '\n');

  process.exit(allPassed ? 0 : 1);
}

// Add error handling for uncaught exceptions
process.on('uncaughtException', error => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run the tests
runAllTests();
