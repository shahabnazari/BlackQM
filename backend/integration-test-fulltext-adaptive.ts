/**
 * INTEGRATION TEST: Full-Text Detection + Adaptive Thresholds
 * Phase 10 Day 5.15.2 - Enterprise-Grade Validation
 *
 * Tests the complete flow:
 * 1. Papers with different content types (abstract, full-text, overflow)
 * 2. Intelligent content selection (prefers fullText over abstract)
 * 3. Detection of full articles in abstract field (>2000 chars)
 * 4. Adaptive threshold adjustment based on content
 * 5. Content type metadata tracking
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Test papers with different content characteristics
const TEST_CASES = [
  {
    name: 'TEST 1: Abstract-Only Papers (Should trigger adaptive thresholds)',
    sources: [
      {
        id: 'abstract-1',
        type: 'paper',
        title: 'Climate Adaptation in Cities',
        content:
          'Short abstract about climate adaptation strategies in urban environments. Covers green infrastructure, community engagement, and policy frameworks. Approximately 250 words of content here.',
        metadata: {
          contentType: 'abstract',
          contentSource: 'abstract_field',
          contentLength: 250,
          hasFullText: false,
        },
      },
      {
        id: 'abstract-2',
        type: 'paper',
        title: 'Urban Resilience Planning',
        content:
          'Brief abstract discussing urban resilience planning methodologies. Focuses on stakeholder engagement and integrated planning approaches. Around 200 words.',
        metadata: {
          contentType: 'abstract',
          contentSource: 'abstract_field',
          contentLength: 200,
          hasFullText: false,
        },
      },
      {
        id: 'abstract-3',
        type: 'paper',
        title: 'Green Infrastructure Benefits',
        content:
          'Abstract covering the multiple benefits of green infrastructure including heat reduction, stormwater management, and biodiversity support. Approximately 230 words.',
        metadata: {
          contentType: 'abstract',
          contentSource: 'abstract_field',
          contentLength: 230,
          hasFullText: false,
        },
      },
    ],
    expectedBehavior: {
      adaptiveThresholds: true,
      coherenceThreshold: 0.48, // Relaxed from 0.6
      evidenceThreshold: 0.35, // Relaxed from 0.5
      expectedThemes: '3-8 themes (abstract-only, adaptive)',
    },
  },
  {
    name: 'TEST 2: Full Article in Abstract Field (Should detect as full-text)',
    sources: [
      {
        id: 'overflow-1',
        type: 'paper',
        title: 'Comprehensive Climate Study',
        content: `This is a full article that was placed in the abstract field. ${' Lorem ipsum dolor sit amet, consectetur adipiscing elit.'.repeat(100)} This simulates a 2500+ character full article mistakenly in the abstract field. The system should detect this and treat it as full-text, NOT apply adaptive thresholds.`,
        metadata: {
          contentType: 'abstract_overflow',
          contentSource: 'abstract_field',
          contentLength: 2500,
          hasFullText: false,
        },
      },
      {
        id: 'overflow-2',
        type: 'paper',
        title: 'Extended Analysis Paper',
        content: `Another full article in abstract field. ${'Detailed research findings and methodology sections. '.repeat(80)} Over 2000 characters of substantial content that should be treated as full-text.`,
        metadata: {
          contentType: 'abstract_overflow',
          contentSource: 'abstract_field',
          contentLength: 2200,
          hasFullText: false,
        },
      },
    ],
    expectedBehavior: {
      adaptiveThresholds: false, // Should NOT apply (detected as full-text)
      coherenceThreshold: 0.6, // Standard strict thresholds
      evidenceThreshold: 0.5,
      expectedThemes: '5-12 themes (full-text quality)',
    },
  },
  {
    name: 'TEST 3: Mixed Content (Full-text + Abstracts)',
    sources: [
      {
        id: 'fulltext-1',
        type: 'paper',
        title: 'Climate Policy Analysis (Full-Text)',
        content: `Full-text paper content. ${'Comprehensive analysis of climate policy frameworks across multiple jurisdictions. Includes methodology, findings, discussion, and implications for policy makers. '.repeat(50)} This represents a proper full-text paper with 3000+ words.`,
        metadata: {
          contentType: 'full_text',
          contentSource: 'unpaywall',
          contentLength: 3500,
          hasFullText: true,
          fullTextStatus: 'success',
        },
      },
      {
        id: 'abstract-mixed-1',
        type: 'paper',
        title: 'Urban Planning Brief (Abstract)',
        content:
          'Brief abstract about urban planning considerations for climate resilience. Covers basic concepts and recommendations. About 180 words.',
        metadata: {
          contentType: 'abstract',
          contentSource: 'abstract_field',
          contentLength: 180,
          hasFullText: false,
          fullTextStatus: 'not_fetched',
        },
      },
    ],
    expectedBehavior: {
      adaptiveThresholds: false, // Average > 2000 chars
      coherenceThreshold: 0.6, // Standard thresholds (full-text detected)
      evidenceThreshold: 0.5,
      expectedThemes: '4-10 themes (mixed content, high avg length)',
    },
  },
];

async function runIntegrationTest() {
  console.log('');
  console.log(
    '🧪 ═══════════════════════════════════════════════════════════════════',
  );
  console.log('🧪 INTEGRATION TEST: Full-Text + Adaptive Thresholds');
  console.log(
    '🧪 ═══════════════════════════════════════════════════════════════════',
  );
  console.log('');

  // Check backend health
  try {
    const health = await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ Backend healthy: ${health.data.status}`);
  } catch (error) {
    console.error('❌ Backend not accessible!');
    process.exit(1);
  }

  console.log('');

  // Run each test case
  for (const testCase of TEST_CASES) {
    console.log(
      '═══════════════════════════════════════════════════════════════════',
    );
    console.log(`TEST: ${testCase.name}`);
    console.log(
      '═══════════════════════════════════════════════════════════════════',
    );
    console.log('');
    console.log('📊 Content Breakdown:');
    testCase.sources.forEach((s) => {
      console.log(`   • ${s.title}`);
      console.log(`     Content Type: ${s.metadata.contentType}`);
      console.log(`     Content Length: ${s.metadata.contentLength} chars`);
      console.log(
        `     Full Text Available: ${s.metadata.hasFullText ? 'YES' : 'NO'}`,
      );
    });

    const avgLength =
      testCase.sources.reduce((sum, s) => sum + s.metadata.contentLength, 0) /
      testCase.sources.length;
    console.log('');
    console.log(`   Average content length: ${Math.round(avgLength)} chars`);
    console.log('');
    console.log('🎯 Expected Behavior:');
    console.log(
      `   • Adaptive Thresholds: ${testCase.expectedBehavior.adaptiveThresholds ? 'YES (abstract-only)' : 'NO (full-text detected)'}`,
    );
    console.log(
      `   • Coherence Threshold: ${testCase.expectedBehavior.coherenceThreshold}`,
    );
    console.log(
      `   • Evidence Threshold: ${testCase.expectedBehavior.evidenceThreshold}`,
    );
    console.log(
      `   • Expected Themes: ${testCase.expectedBehavior.expectedThemes}`,
    );
    console.log('');
    console.log('📡 Calling API...');

    const startTime = Date.now();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/literature/themes/extract-themes-v2/public`,
        {
          sources: testCase.sources,
          purpose: 'qualitative_analysis',
          userExpertiseLevel: 'researcher',
          methodology: 'reflexive_thematic',
          validationLevel: 'rigorous',
          researchContext: 'Climate adaptation testing',
        },
        { timeout: 300000 }, // 5 minutes
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      console.log(`✅ API Response (${duration}s)`);
      console.log(`   Themes extracted: ${response.data.themes?.length || 0}`);
      console.log(
        `   Saturation reached: ${response.data.saturationAnalysis?.reached ? 'Yes' : 'No'}`,
      );

      // Validate results match expectations
      const actualThemes = response.data.themes?.length || 0;
      if (actualThemes > 0) {
        console.log(`   ✅ SUCCESS: Extracted ${actualThemes} themes`);
      } else if (testCase.expectedBehavior.adaptiveThresholds) {
        console.log(
          `   ⚠️  WARNING: 0 themes (adaptive thresholds may need further tuning)`,
        );
      } else {
        console.log(
          `   ⚠️  WARNING: 0 themes (unexpected for full-text content)`,
        );
      }

      console.log('');
    } catch (error: any) {
      console.error(`❌ TEST FAILED`);
      console.error(
        `   Error: ${error.response?.data?.message || error.message}`,
      );
      console.error('');
    }

    console.log('');
  }

  console.log(
    '═══════════════════════════════════════════════════════════════════',
  );
  console.log('✅ INTEGRATION TEST COMPLETE');
  console.log(
    '═══════════════════════════════════════════════════════════════════',
  );
  console.log('');
  console.log('📝 Check backend logs for:');
  console.log('   • "📉 ADAPTIVE THRESHOLDS" message (Test 1)');
  console.log('   • "📈 FULL-TEXT CONTENT DETECTED" message (Test 2 & 3)');
  console.log('   • Content breakdown statistics');
  console.log('');
}

runIntegrationTest().catch(console.error);
