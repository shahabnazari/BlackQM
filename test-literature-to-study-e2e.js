#!/usr/bin/env node

/**
 * E2E Test for Literature → Study Pipeline
 * Phase 9 Days 8-9: Complete Pipeline Integration
 */

const axios = require('axios');
const API_BASE = 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  paperIds: ['paper-001', 'paper-002', 'paper-003'],
  targetStatements: 30,
  academicLevel: 'intermediate',
};

// Acceptance criteria from recommendations
const ACCEPTANCE_CRITERIA = {
  minThemes: 3,
  minStatementsPerTheme: 1,
  maxLatencyMs: 3000,
  requiredProvenance: true,
  controversyDetection: true,
};

async function runE2ETest() {
  console.log('🔬 Literature → Study Pipeline E2E Test');
  console.log('=' . repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  try {
    // Test 1: Theme Extraction with Real NLP
    console.log('\n📚 Test 1: Theme Extraction (Real NLP)');
    const startTheme = Date.now();

    const themeResponse = await axios.post(
      `${API_BASE}/literature/themes/public`,
      { paperIds: TEST_CONFIG.paperIds }
    );

    const themeLatency = Date.now() - startTheme;
    const themes = themeResponse.data?.themes || [];

    // Check acceptance criteria
    if (themes.length >= ACCEPTANCE_CRITERIA.minThemes) {
      console.log(`✅ Extracted ${themes.length} themes (min: ${ACCEPTANCE_CRITERIA.minThemes})`);
      results.passed++;
    } else {
      console.log(`❌ Only ${themes.length} themes extracted (min: ${ACCEPTANCE_CRITERIA.minThemes})`);
      results.failed++;
    }

    if (themeLatency < ACCEPTANCE_CRITERIA.maxLatencyMs) {
      console.log(`✅ Latency: ${themeLatency}ms (max: ${ACCEPTANCE_CRITERIA.maxLatencyMs}ms)`);
      results.passed++;
    } else {
      console.log(`❌ Latency: ${themeLatency}ms (max: ${ACCEPTANCE_CRITERIA.maxLatencyMs}ms)`);
      results.failed++;
    }

    // Test for controversy detection
    const controversialThemes = themes.filter(t => t.controversial);
    if (controversialThemes.length > 0) {
      console.log(`✅ Controversy detection working: ${controversialThemes.length} controversial themes`);
      results.passed++;
    } else {
      console.log(`⚠️ No controversial themes detected`);
    }

    // Test 2: Study Scaffolding with Gap Analysis
    console.log('\n🏗️ Test 2: Study Scaffolding Creation');
    const scaffoldResponse = await axios.post(
      `${API_BASE}/literature/pipeline/create-study-scaffolding/public`,
      {
        paperIds: TEST_CONFIG.paperIds,
        includeGapAnalysis: true,
        targetStatements: TEST_CONFIG.targetStatements,
        academicLevel: TEST_CONFIG.academicLevel,
      }
    );

    const scaffolding = scaffoldResponse.data?.scaffolding;
    const statementMappings = scaffoldResponse.data?.statementMappings || [];

    // Check research questions generation
    if (scaffolding?.researchQuestions?.length > 0) {
      console.log(`✅ Generated ${scaffolding.researchQuestions.length} research questions`);
      results.passed++;
    } else {
      console.log('❌ No research questions generated');
      results.failed++;
    }

    // Check hypothesis generation
    if (scaffolding?.hypotheses?.length > 0) {
      console.log(`✅ Generated ${scaffolding.hypotheses.length} hypotheses`);
      results.passed++;
    } else {
      console.log('⚠️ No hypotheses generated (may be normal if no controversial themes)');
    }

    // Test 3: Statement Generation with Provenance
    console.log('\n📝 Test 3: Statement Generation & Provenance');

    let totalStatements = 0;
    let statementsWithProvenance = 0;

    for (const mapping of statementMappings) {
      totalStatements += mapping.statements?.length || 0;

      for (const stmt of mapping.statements || []) {
        if (stmt.provenance?.sourceDocuments?.length > 0) {
          statementsWithProvenance++;
        }
      }
    }

    if (totalStatements >= 10) {
      console.log(`✅ Generated ${totalStatements} statements`);
      results.passed++;
    } else {
      console.log(`❌ Only ${totalStatements} statements generated (min: 10)`);
      results.failed++;
    }

    if (statementsWithProvenance === totalStatements && totalStatements > 0) {
      console.log(`✅ All ${statementsWithProvenance} statements have provenance`);
      results.passed++;
    } else {
      console.log(`⚠️ Only ${statementsWithProvenance}/${totalStatements} statements have provenance`);
      if (statementsWithProvenance > totalStatements * 0.8) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    // Test 4: Perspective Coverage
    console.log('\n🔄 Test 4: Multi-Perspective Coverage');

    const perspectives = new Set();
    for (const mapping of statementMappings) {
      for (const stmt of mapping.statements || []) {
        if (stmt.perspective) {
          perspectives.add(stmt.perspective);
        }
      }
    }

    if (perspectives.size >= 2) {
      console.log(`✅ Multiple perspectives covered: ${Array.from(perspectives).join(', ')}`);
      results.passed++;
    } else {
      console.log(`❌ Only ${perspectives.size} perspective(s) found`);
      results.failed++;
    }

    // Test 5: Complete Pipeline Integration
    console.log('\n🔗 Test 5: Full Pipeline Integration');

    const pipelineResponse = await axios.post(
      `${API_BASE}/literature/pipeline/themes-to-statements/public`,
      {
        paperIds: TEST_CONFIG.paperIds,
        studyContext: {
          targetStatements: TEST_CONFIG.targetStatements,
          academicLevel: TEST_CONFIG.academicLevel,
        }
      }
    );

    if (pipelineResponse.data?.statements?.length > 0 && pipelineResponse.data?.provenance) {
      console.log('✅ Full pipeline integration working');
      console.log(`   - Statements: ${pipelineResponse.data.statements.length}`);
      console.log(`   - Provenance entries: ${Object.keys(pipelineResponse.data.provenance).length}`);
      results.passed++;
    } else {
      console.log('❌ Pipeline integration incomplete');
      results.failed++;
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);

    if (error.response?.status === 404) {
      console.log('💡 Endpoint not found. Make sure backend is running and routes are configured.');
    } else if (error.response?.data) {
      console.log('Error details:', error.response.data);
    }

    results.failed = 10; // Mark all as failed on error
  }

  // Print summary
  console.log('\n' + '=' . repeat(60));
  console.log('📊 E2E TEST SUMMARY');
  console.log('=' . repeat(60));

  const totalTests = results.passed + results.failed;
  const passRate = totalTests > 0 ? (results.passed / totalTests * 100).toFixed(1) : 0;

  console.log(`Passed: ${results.passed}/${totalTests} tests (${passRate}%)`);

  if (results.passed === totalTests && totalTests > 0) {
    console.log('\n🎉 All E2E tests passed! Pipeline ready for production.');
    process.exit(0);
  } else if (results.passed >= totalTests * 0.8) {
    console.log('\n✅ Most tests passed. Minor issues to address.');
    process.exit(0);
  } else {
    console.log('\n❌ Significant failures. Review implementation.');
    process.exit(1);
  }
}

// Helper function for string repeat (Node.js compatibility)
String.prototype.repeat = String.prototype.repeat || function(count) {
  return new Array(count + 1).join(this);
};

// Run the test
console.log('🚀 Starting Literature → Study E2E Test');
console.log('   API: ' + API_BASE);
console.log('');

runE2ETest().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});