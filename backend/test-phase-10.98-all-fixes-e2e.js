#!/usr/bin/env node
/**
 * Phase 10.98 ENHANCEMENT: End-to-End Integration Test
 *
 * Tests all 3 fixes together:
 * - Issue #2: Noise filtering (no number/abbreviation themes)
 * - Issue #3: Search relevance thresholds (stricter filtering)
 * - Issue #4: UI math calculations (correct source count)
 *
 * Usage: node backend/test-phase-10.98-all-fixes-e2e.js
 */

const axios = require('axios');
const chalk = require('chalk');

// ==========================================================================
// Configuration
// ==========================================================================

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  // Issue #2: Papers that might contain noise (numbers, abbreviations)
  testPapers: [
    {
      title: 'Q Methodology in Educational Research',
      abstract: 'This study uses Q methodology with 22 participants (N=22). The PSC-17-Y scale was used. Page 8211 contains results.',
      authors: ['Smith, J.'],
      year: 2023,
      doi: '10.1000/test.2023.001',
    },
    {
      title: 'Factor Analysis in Q Studies',
      abstract: 'Sample size of 10005 participants. Factor loadings ranged from 0.40 to 0.82. Study ID: ABC-123-DEF.',
      authors: ['Johnson, M.'],
      year: 2022,
      doi: '10.1000/test.2022.002',
    },
  ],

  // Issue #3: Search query for relevance testing
  searchQuery: 'Q methodology factor interpretation',

  // Expected behavior
  expectations: {
    // Issue #2: No noise themes expected
    maxNoiseThemes: 0,
    noisePatterns: [
      /^\d+$/,              // Pure numbers (8211, 10005)
      /^[a-z]+-\d+-[a-z]+$/i, // Complex abbreviations (psc-17-y)
      /&[a-z]+;/,           // HTML entities
    ],

    // Issue #3: Minimum relevance scores
    minRelevanceScore: {
      BROAD: 3,
      SPECIFIC: 4,
      COMPREHENSIVE: 5,
    },

    // Issue #4: Expected source count
    expectedSourceCount: 2, // 2 test papers
  },
};

// ==========================================================================
// Test Utilities
// ==========================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
  }[type] || chalk.blue('ℹ');

  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    log(message, 'error');
    throw new Error(message);
  }
  log(message, 'success');
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================================================
// Test: Issue #2 - Noise Filtering
// ==========================================================================

async function testIssue2NoiseFiltering() {
  log('Starting Issue #2 Test: Noise Filtering', 'info');

  try {
    // Extract themes from test papers
    const response = await axios.post(
      `${API_URL}/literature/extract-themes`,
      {
        papers: TEST_CONFIG.testPapers,
        purpose: 'q-methodology',
        targetThemes: 10,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // 60 second timeout
      }
    );

    const themes = response.data.themes || [];
    log(`Extracted ${themes.length} themes`, 'info');

    // Check for noise themes
    let noiseThemesFound = 0;
    const noiseThemes = [];

    for (const theme of themes) {
      const label = theme.label || '';

      for (const pattern of TEST_CONFIG.expectations.noisePatterns) {
        if (pattern.test(label)) {
          noiseThemesFound++;
          noiseThemes.push({ label, pattern: pattern.toString() });
          log(`Found noise theme: "${label}" (matches ${pattern})`, 'warning');
        }
      }
    }

    // Assert no noise themes
    assert(
      noiseThemesFound === 0,
      `Issue #2 PASSED: No noise themes found (expected 0, got ${noiseThemesFound})`
    );

    // Verify whitelisted terms preserved
    const hasWhitelistedTerms = themes.some(t =>
      /covid-19|p-value|t-test|meta-analysis/i.test(t.label)
    );

    if (hasWhitelistedTerms) {
      log('Issue #2: Whitelisted research terms preserved correctly', 'success');
    }

    return {
      passed: true,
      noiseThemesFound,
      totalThemes: themes.length,
      noiseThemes,
    };
  } catch (error) {
    log(`Issue #2 FAILED: ${error.message}`, 'error');
    throw error;
  }
}

// ==========================================================================
// Test: Issue #3 - Search Relevance Thresholds
// ==========================================================================

async function testIssue3SearchRelevance() {
  log('Starting Issue #3 Test: Search Relevance Thresholds', 'info');

  try {
    // Perform search
    const response = await axios.post(
      `${API_URL}/literature/search`,
      {
        query: TEST_CONFIG.searchQuery,
        filters: {
          yearFrom: 2020,
          sortBy: 'relevance',
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const papers = response.data.papers || [];
    log(`Search returned ${papers.length} papers`, 'info');

    if (papers.length === 0) {
      log('Issue #3: No papers returned (query may be too specific)', 'warning');
      return { passed: true, belowThreshold: 0, totalPapers: 0 };
    }

    // Check relevance scores
    let belowThreshold = 0;
    const minScore = TEST_CONFIG.expectations.minRelevanceScore.BROAD; // Assume BROAD query

    for (const paper of papers) {
      const score = paper.relevanceScore || 0;

      if (score < minScore) {
        belowThreshold++;
        log(
          `Paper below threshold: "${paper.title.substring(0, 50)}..." (score: ${score}, min: ${minScore})`,
          'warning'
        );
      }
    }

    // Assert all papers meet threshold
    assert(
      belowThreshold === 0,
      `Issue #3 PASSED: All papers meet threshold (min score: ${minScore})`
    );

    // Log score distribution
    const scores = papers.map(p => p.relevanceScore || 0).sort((a, b) => b - a);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const maxScore = scores[0] || 0;
    const minScoreActual = scores[scores.length - 1] || 0;

    log(
      `Score distribution: min=${minScoreActual.toFixed(1)}, avg=${avgScore.toFixed(1)}, max=${maxScore.toFixed(1)}`,
      'info'
    );

    return {
      passed: true,
      belowThreshold,
      totalPapers: papers.length,
      scoreStats: { min: minScoreActual, avg: avgScore, max: maxScore },
    };
  } catch (error) {
    log(`Issue #3 FAILED: ${error.message}`, 'error');
    throw error;
  }
}

// ==========================================================================
// Test: Issue #4 - UI Math Calculations
// ==========================================================================

async function testIssue4UIMathCalculations() {
  log('Starting Issue #4 Test: UI Math Calculations', 'info');

  try {
    // Extract themes from test papers
    const response = await axios.post(
      `${API_URL}/literature/extract-themes`,
      {
        papers: TEST_CONFIG.testPapers,
        purpose: 'q-methodology',
        targetThemes: 10,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      }
    );

    const themes = response.data.themes || [];

    // Calculate unique source count (simulating frontend logic)
    const uniqueSourceIds = new Set();

    for (const theme of themes) {
      if (theme.sources && Array.isArray(theme.sources)) {
        for (const source of theme.sources) {
          if (source.sourceId) {  // Fixed: was source.paperId
            uniqueSourceIds.add(source.sourceId);
          }
        }
      }
    }

    const actualSourceCount = uniqueSourceIds.size;
    const expectedSourceCount = TEST_CONFIG.expectations.expectedSourceCount;

    log(`Unique sources: ${actualSourceCount} (expected: ${expectedSourceCount})`, 'info');

    // Assert correct count
    assert(
      actualSourceCount === expectedSourceCount,
      `Issue #4 PASSED: Correct source count (expected ${expectedSourceCount}, got ${actualSourceCount})`
    );

    // Calculate themes per source ratio
    const themesPerSource = themes.length / actualSourceCount;
    log(`Themes per source: ${themesPerSource.toFixed(2)}`, 'info');

    assert(
      themesPerSource > 0,
      `Issue #4 PASSED: Non-zero themes per source ratio (${themesPerSource.toFixed(2)})`
    );

    return {
      passed: true,
      actualSourceCount,
      expectedSourceCount,
      totalThemes: themes.length,
      themesPerSource,
    };
  } catch (error) {
    log(`Issue #4 FAILED: ${error.message}`, 'error');
    throw error;
  }
}

// ==========================================================================
// Main Test Runner
// ==========================================================================

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log(chalk.bold.cyan('Phase 10.98: End-to-End Integration Test'));
  console.log(chalk.gray('Testing Issues #2, #3, #4 together'));
  console.log('='.repeat(80) + '\n');

  const results = {
    issue2: null,
    issue3: null,
    issue4: null,
    startTime: Date.now(),
  };

  try {
    // Test Issue #2: Noise Filtering
    console.log('\n' + chalk.bold('━━━ Issue #2: Noise Filtering ━━━\n'));
    results.issue2 = await testIssue2NoiseFiltering();
    await delay(1000);

    // Test Issue #3: Search Relevance
    console.log('\n' + chalk.bold('━━━ Issue #3: Search Relevance ━━━\n'));
    results.issue3 = await testIssue3SearchRelevance();
    await delay(1000);

    // Test Issue #4: UI Math Calculations
    console.log('\n' + chalk.bold('━━━ Issue #4: UI Math Calculations ━━━\n'));
    results.issue4 = await testIssue4UIMathCalculations();

    // Summary
    const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log(chalk.bold.green('✓ ALL TESTS PASSED'));
    console.log('='.repeat(80) + '\n');

    console.log(chalk.bold('Test Summary:'));
    console.log(`  ${chalk.green('✓')} Issue #2: ${results.issue2.noiseThemesFound} noise themes (expected 0)`);
    console.log(`  ${chalk.green('✓')} Issue #3: ${results.issue3.belowThreshold} papers below threshold (expected 0)`);
    console.log(`  ${chalk.green('✓')} Issue #4: ${results.issue4.actualSourceCount} sources (expected ${results.issue4.expectedSourceCount})`);
    console.log(`\n  Total duration: ${duration}s\n`);

    process.exit(0);
  } catch (error) {
    const duration = ((Date.now() - results.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log(chalk.bold.red('✗ TESTS FAILED'));
    console.log('='.repeat(80) + '\n');

    console.log(chalk.red('Error:'), error.message);
    console.log(`\n  Total duration: ${duration}s\n`);

    process.exit(1);
  }
}

// ==========================================================================
// Execute Tests
// ==========================================================================

if (require.main === module) {
  runAllTests().catch(error => {
    console.error(chalk.red('\nUnhandled error:'), error);
    process.exit(1);
  });
}

module.exports = {
  testIssue2NoiseFiltering,
  testIssue3SearchRelevance,
  testIssue4UIMathCalculations,
};
