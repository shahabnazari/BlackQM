#!/usr/bin/env node

/**
 * Test Script for Literature → Theme → Statement Pipeline Integration
 * Phase 9 Day 8-9: Pipeline Integration Testing
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Test data with sample paper IDs
const TEST_PAPERS = [
  'paper-001',
  'paper-002',
  'paper-003'
];

async function testPipelineIntegration() {
  console.log('🔧 Testing Literature → Theme → Statement Pipeline Integration');
  console.log('='.repeat(60));

  try {
    // Test 1: Extract themes from papers
    console.log('\n📚 Test 1: Extract Themes from Papers');
    const themesResponse = await axios.post(`${API_BASE}/literature/themes/public`, {
      paperIds: TEST_PAPERS
    });

    if (themesResponse.data && themesResponse.data.themes) {
      console.log(`✅ Extracted ${themesResponse.data.themes.length} themes`);
      themesResponse.data.themes.forEach((theme, i) => {
        console.log(`   Theme ${i+1}: ${theme.label} (${theme.keywords.length} keywords)`);
      });
    } else {
      console.log('⚠️ No themes extracted');
    }

    // Test 2: Full pipeline - themes to statements with provenance
    console.log('\n🔗 Test 2: Full Pipeline with Provenance Tracking');
    const pipelineResponse = await axios.post(`${API_BASE}/literature/pipeline/themes-to-statements/public`, {
      paperIds: TEST_PAPERS,
      studyContext: {
        targetStatements: 30,
        academicLevel: 'intermediate'
      }
    });

    if (pipelineResponse.data) {
      const { themes, statements, provenance, metadata, pipeline } = pipelineResponse.data;

      console.log(`✅ Pipeline completed successfully`);
      console.log(`   - Themes extracted: ${themes.length}`);
      console.log(`   - Statements generated: ${statements.length}`);
      console.log(`   - Controversial themes: ${metadata.controversialThemes}`);
      console.log(`   - Perspectives included: ${metadata.perspectivesIncluded.join(', ')}`);

      // Check provenance tracking
      console.log('\n📊 Provenance Tracking:');
      const firstStatement = statements[0];
      const firstProvenance = provenance[firstStatement];
      if (firstProvenance) {
        console.log(`   Statement: "${firstStatement.substring(0, 50)}..."`);
        console.log(`   - Source Theme: ${firstProvenance.sourceTheme}`);
        console.log(`   - Perspective: ${firstProvenance.perspective}`);
        console.log(`   - Confidence: ${firstProvenance.confidence}`);
        console.log(`   - Generation Method: ${firstProvenance.generationMethod}`);

        if (firstProvenance.provenance) {
          console.log(`   - Source Documents: ${firstProvenance.provenance.sourceDocuments.length} papers`);
          console.log(`   - Citation Chain: ${firstProvenance.provenance.citationChain.slice(0, 2).join(', ')}...`);
        }
      }

      // Validate controversial theme detection
      const controversialThemes = themes.filter(t => t.controversial);
      if (controversialThemes.length > 0) {
        console.log('\n🔥 Controversial Themes Detected:');
        controversialThemes.forEach(theme => {
          console.log(`   - ${theme.label}`);
          if (theme.opposingViews) {
            console.log(`     View A: ${theme.opposingViews[0]}`);
            console.log(`     View B: ${theme.opposingViews[1]}`);
          }
        });
      }

    } else {
      console.log('❌ Pipeline failed to return data');
    }

    // Test 3: Validate AI integration
    console.log('\n🤖 Test 3: AI Integration Validation');

    // Check if themes have AI-generated labels and descriptions
    if (themesResponse.data && themesResponse.data.themes) {
      const hasAIContent = themesResponse.data.themes.some(theme =>
        theme.description && theme.description.length > 20
      );

      if (hasAIContent) {
        console.log('✅ AI-generated theme descriptions present');
      } else {
        console.log('⚠️ AI theme generation may not be working');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 PIPELINE INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));

    const tests = [
      { name: 'Theme Extraction', passed: themesResponse.data && themesResponse.data.themes },
      { name: 'Statement Generation', passed: pipelineResponse.data && pipelineResponse.data.statements },
      { name: 'Provenance Tracking', passed: pipelineResponse.data && pipelineResponse.data.provenance },
      { name: 'Metadata Generation', passed: pipelineResponse.data && pipelineResponse.data.metadata },
    ];

    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;

    tests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    });

    console.log(`\nOverall: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('\n🎉 All pipeline integration tests passed!');
    } else {
      console.log(`\n⚠️ ${total - passed} test(s) failed. Review the implementation.`);
    }

  } catch (error) {
    console.error('\n❌ Pipeline test failed:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the backend server is running on port 3001');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Check backend logs for detailed error information');
    }
  }
}

// Run the test
console.log('🚀 Starting Pipeline Integration Test');
console.log('   Target: ' + API_BASE);
console.log('');

testPipelineIntegration().then(() => {
  console.log('\n✨ Test completed');
}).catch(error => {
  console.error('\n💥 Test failed:', error.message);
  process.exit(1);
});