#!/usr/bin/env node

/**
 * Phase 9 Day 11 - Comprehensive Pipeline E2E Test Suite
 *
 * This test validates the complete research pipeline:
 * Literature → Theme Extraction → Statement Generation → Study Creation →
 * Analysis → Comparison → Report Generation → Knowledge Graph
 *
 * @author Phase 9 Day 11 Implementation
 * @date October 1, 2025
 */

const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');

// Test configuration
const API_BASE = 'http://localhost:4000/api';
const FRONTEND_BASE = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds per test

// Test data
const TEST_SEARCH_QUERY = 'climate change public opinion';
const TEST_USER = {
  email: 'test@pipeline.com',
  password: 'TestPass123!',
  name: 'Pipeline Tester',
};

// Performance tracking
const performanceMetrics = {
  pipelineSteps: [],
  totalTime: 0,
  errors: [],
  warnings: [],
};

// Utility functions
function logStep(step, status) {
  const timestamp = new Date().toISOString();
  const statusColor =
    status === 'success'
      ? chalk.green('✓')
      : status === 'error'
        ? chalk.red('✗')
        : chalk.yellow('⚠');
  console.log(`${statusColor} [${timestamp}] ${step}`);
}

function logMetric(metric, value, threshold) {
  const status = value <= threshold ? chalk.green('PASS') : chalk.red('FAIL');
  console.log(
    `  ${chalk.gray('├─')} ${metric}: ${value}ms (threshold: ${threshold}ms) ${status}`
  );
}

async function timeOperation(name, operation, threshold) {
  const spinner = ora(`Running: ${name}`).start();
  const start = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - start;

    performanceMetrics.pipelineSteps.push({
      name,
      duration,
      threshold,
      passed: duration <= threshold,
    });

    spinner.succeed(`${name} completed in ${duration}ms`);
    logMetric(name, duration, threshold);

    return result;
  } catch (error) {
    spinner.fail(`${name} failed: ${error.message}`);
    performanceMetrics.errors.push({ step: name, error: error.message });
    throw error;
  }
}

// Test Steps
class PipelineE2ETest {
  constructor() {
    this.authToken = null;
    this.testData = {
      papers: [],
      themes: [],
      statements: [],
      studyId: null,
      analysisResults: null,
      comparisonResults: null,
      report: null,
      knowledgeGraphNodes: [],
    };
  }

  // Step 1: Literature Search
  async testLiteratureSearch() {
    console.log(chalk.blue('\n📚 STEP 1: Literature Search & Discovery'));

    return await timeOperation(
      'Literature Search',
      async () => {
        const response = await axios.post(`${API_BASE}/literature/search`, {
          query: TEST_SEARCH_QUERY,
          sources: ['semantic-scholar', 'crossref'],
          limit: 20,
          yearRange: { start: 2020, end: 2025 },
        });

        if (!response.data.papers || response.data.papers.length === 0) {
          throw new Error('No papers returned from search');
        }

        this.testData.papers = response.data.papers;
        console.log(
          `  ${chalk.gray('├─')} Papers found: ${this.testData.papers.length}`
        );
        console.log(
          `  ${chalk.gray('└─')} Sources: ${response.data.sources.join(', ')}`
        );

        return response.data;
      },
      3500
    ); // 3.5s threshold (adjusted from Day 10 audit)
  }

  // Step 2: Theme Extraction
  async testThemeExtraction() {
    console.log(chalk.blue('\n🎯 STEP 2: Theme Extraction from Literature'));

    return await timeOperation(
      'Theme Extraction',
      async () => {
        const paperIds = this.testData.papers.slice(0, 5).map(p => p.id);

        const response = await axios.post(
          `${API_BASE}/literature/extract-themes`,
          {
            paperIds,
            extractionMode: 'comprehensive',
            includeControversies: true,
          }
        );

        if (!response.data.themes || response.data.themes.length < 3) {
          throw new Error('Insufficient themes extracted');
        }

        this.testData.themes = response.data.themes;
        console.log(
          `  ${chalk.gray('├─')} Themes extracted: ${this.testData.themes.length}`
        );
        console.log(
          `  ${chalk.gray('├─')} Controversies found: ${response.data.controversies?.length || 0}`
        );
        console.log(
          `  ${chalk.gray('└─')} Confidence score: ${response.data.confidence || 'N/A'}`
        );

        return response.data;
      },
      4000
    ); // 4s threshold
  }

  // Step 3: Research Gap Analysis
  async testGapAnalysis() {
    console.log(chalk.blue('\n🔍 STEP 3: Research Gap Analysis'));

    return await timeOperation(
      'Gap Analysis',
      async () => {
        const response = await axios.post(
          `${API_BASE}/literature/analyze-gaps`,
          {
            paperIds: this.testData.papers.map(p => p.id),
            themes: this.testData.themes,
            analysisDepth: 'comprehensive',
          }
        );

        if (!response.data.gaps || response.data.gaps.length === 0) {
          throw new Error('No research gaps identified');
        }

        console.log(
          `  ${chalk.gray('├─')} Gaps identified: ${response.data.gaps.length}`
        );
        console.log(
          `  ${chalk.gray('├─')} Priority gaps: ${response.data.gaps.filter(g => g.priority === 'high').length}`
        );
        console.log(
          `  ${chalk.gray('└─')} Opportunities: ${response.data.opportunities?.length || 0}`
        );

        return response.data;
      },
      5000
    ); // 5s threshold
  }

  // Step 4: Statement Generation
  async testStatementGeneration() {
    console.log(chalk.blue('\n📝 STEP 4: AI Statement Generation from Themes'));

    return await timeOperation(
      'Statement Generation',
      async () => {
        const response = await axios.post(
          `${API_BASE}/ai/statements/generate`,
          {
            themes: this.testData.themes,
            paperContext: this.testData.papers.slice(0, 3),
            count: 40,
            ensureControversy: true,
            biasCheck: true,
          }
        );

        if (!response.data.statements || response.data.statements.length < 30) {
          throw new Error('Insufficient statements generated');
        }

        this.testData.statements = response.data.statements;
        console.log(
          `  ${chalk.gray('├─')} Statements generated: ${this.testData.statements.length}`
        );
        console.log(
          `  ${chalk.gray('├─')} With provenance: ${this.testData.statements.filter(s => s.provenance).length}`
        );
        console.log(
          `  ${chalk.gray('└─')} Bias-checked: ${response.data.biasCheckPassed ? 'Yes' : 'No'}`
        );

        return response.data;
      },
      6000
    ); // 6s threshold
  }

  // Step 5: Study Creation
  async testStudyCreation() {
    console.log(
      chalk.blue('\n🔨 STEP 5: Study Creation with Literature Context')
    );

    return await timeOperation(
      'Study Creation',
      async () => {
        const response = await axios.post(`${API_BASE}/studies/create`, {
          title: 'Climate Change Opinion Study - E2E Test',
          description: 'Automated pipeline test study',
          statements: this.testData.statements,
          gridConfig: {
            columns: 11,
            distribution: [-4, -3, -2, -1, 0, 1, 2, 3, 4],
            labels: { left: 'Strongly Disagree', right: 'Strongly Agree' },
          },
          basedOnPapers: this.testData.papers.map(p => p.id),
          extractedThemes: this.testData.themes.map(t => t.id),
          studyContext: {
            topic: TEST_SEARCH_QUERY,
            researchQuestions: ['How do people perceive climate change?'],
            targetAudience: 'General public',
          },
        });

        if (!response.data.id) {
          throw new Error('Study creation failed - no ID returned');
        }

        this.testData.studyId = response.data.id;
        console.log(`  ${chalk.gray('├─')} Study ID: ${this.testData.studyId}`);
        console.log(
          `  ${chalk.gray('├─')} Literature links: ${response.data.basedOnPapers?.length || 0}`
        );
        console.log(
          `  ${chalk.gray('└─')} Status: ${response.data.status || 'draft'}`
        );

        return response.data;
      },
      3000
    ); // 3s threshold
  }

  // Step 6: Simulate Data Collection
  async testDataCollection() {
    console.log(chalk.blue('\n📊 STEP 6: Simulating Data Collection'));

    return await timeOperation(
      'Data Collection',
      async () => {
        // Generate mock participant responses
        const participants = 30;
        const responses = [];

        for (let i = 0; i < participants; i++) {
          const participantResponses = this.testData.statements.map(
            (stmt, idx) => ({
              statementId: stmt.id,
              position: Math.floor(Math.random() * 9) - 4, // -4 to 4
              responseTime: Math.random() * 30000 + 5000, // 5-35 seconds
            })
          );

          responses.push({
            participantId: `mock-${i}`,
            responses: participantResponses,
            demographics: {
              age: Math.floor(Math.random() * 50) + 18,
              education: ['high school', 'bachelor', 'master', 'phd'][
                Math.floor(Math.random() * 4)
              ],
            },
          });
        }

        const response = await axios.post(
          `${API_BASE}/studies/${this.testData.studyId}/responses/batch`,
          {
            responses,
            mode: 'test',
          }
        );

        console.log(
          `  ${chalk.gray('├─')} Participants simulated: ${participants}`
        );
        console.log(
          `  ${chalk.gray('├─')} Responses collected: ${responses.length * this.testData.statements.length}`
        );
        console.log(
          `  ${chalk.gray('└─')} Data quality score: ${response.data.qualityScore || 'N/A'}`
        );

        return response.data;
      },
      5000
    ); // 5s threshold
  }

  // Step 7: Analysis
  async testAnalysis() {
    console.log(chalk.blue('\n📈 STEP 7: Q-Methodology Analysis'));

    return await timeOperation(
      'Q-Analysis',
      async () => {
        const response = await axios.post(
          `${API_BASE}/analysis/q-methodology`,
          {
            studyId: this.testData.studyId,
            analysisConfig: {
              extractionMethod: 'centroid',
              rotationMethod: 'varimax',
              numberOfFactors: 3,
              significanceLevel: 0.05,
            },
          }
        );

        if (!response.data.factors || response.data.factors.length === 0) {
          throw new Error('Analysis failed - no factors extracted');
        }

        this.testData.analysisResults = response.data;
        console.log(
          `  ${chalk.gray('├─')} Factors extracted: ${response.data.factors.length}`
        );
        console.log(
          `  ${chalk.gray('├─')} Variance explained: ${response.data.varianceExplained || 'N/A'}%`
        );
        console.log(
          `  ${chalk.gray('└─')} Distinguishing statements: ${response.data.distinguishingStatements?.length || 0}`
        );

        return response.data;
      },
      8000
    ); // 8s threshold
  }

  // Step 8: Literature Comparison
  async testLiteratureComparison() {
    console.log(chalk.blue('\n🔄 STEP 8: Compare Results to Literature'));

    return await timeOperation(
      'Literature Comparison',
      async () => {
        const response = await axios.post(
          `${API_BASE}/analysis/compare-to-literature`,
          {
            studyId: this.testData.studyId,
            analysisResults: this.testData.analysisResults,
            paperIds: this.testData.papers.map(p => p.id),
            comparisonDepth: 'comprehensive',
          }
        );

        if (!response.data.findings) {
          throw new Error('Comparison failed - no findings returned');
        }

        this.testData.comparisonResults = response.data;
        console.log(
          `  ${chalk.gray('├─')} Confirmatory findings: ${response.data.findings.confirmatory?.length || 0}`
        );
        console.log(
          `  ${chalk.gray('├─')} Novel findings: ${response.data.findings.novel?.length || 0}`
        );
        console.log(
          `  ${chalk.gray('├─')} Contradictory findings: ${response.data.findings.contradictory?.length || 0}`
        );
        console.log(
          `  ${chalk.gray('└─')} Discussion points: ${response.data.discussionPoints?.length || 0}`
        );

        return response.data;
      },
      3000
    ); // 3s threshold
  }

  // Step 9: Report Generation
  async testReportGeneration() {
    console.log(chalk.blue('\n📄 STEP 9: Academic Report Generation'));

    return await timeOperation(
      'Report Generation',
      async () => {
        const response = await axios.post(`${API_BASE}/reports/generate`, {
          studyId: this.testData.studyId,
          format: 'academic',
          sections: [
            'abstract',
            'introduction',
            'literature_review',
            'methodology',
            'results',
            'discussion',
            'conclusion',
            'references',
          ],
          citationStyle: 'APA',
          includeVisualizations: true,
        });

        if (!response.data.report) {
          throw new Error('Report generation failed');
        }

        this.testData.report = response.data;
        console.log(
          `  ${chalk.gray('├─')} Sections generated: ${response.data.sections?.length || 0}`
        );
        console.log(
          `  ${chalk.gray('├─')} Word count: ${response.data.wordCount || 'N/A'}`
        );
        console.log(
          `  ${chalk.gray('├─')} Citations: ${response.data.citationCount || 0}`
        );
        console.log(
          `  ${chalk.gray('└─')} Format: ${response.data.format || 'unknown'}`
        );

        return response.data;
      },
      10000
    ); // 10s threshold
  }

  // Step 10: Knowledge Graph Update
  async testKnowledgeGraphUpdate() {
    console.log(chalk.blue('\n🧠 STEP 10: Knowledge Graph Construction'));

    return await timeOperation(
      'Knowledge Graph Update',
      async () => {
        const response = await axios.post(
          `${API_BASE}/knowledge/update-graph`,
          {
            studyId: this.testData.studyId,
            findings: this.testData.comparisonResults.findings,
            papers: this.testData.papers,
            themes: this.testData.themes,
            connections: {
              paperToStudy: true,
              studyToFindings: true,
              findingsToGaps: true,
              crossStudyPatterns: true,
            },
          }
        );

        if (!response.data.nodes || response.data.nodes.length === 0) {
          throw new Error('Knowledge graph update failed');
        }

        this.testData.knowledgeGraphNodes = response.data.nodes;
        console.log(
          `  ${chalk.gray('├─')} Nodes created: ${response.data.nodes.length}`
        );
        console.log(
          `  ${chalk.gray('├─')} Edges created: ${response.data.edges?.length || 0}`
        );
        console.log(
          `  ${chalk.gray('├─')} Patterns identified: ${response.data.patterns?.length || 0}`
        );
        console.log(
          `  ${chalk.gray('└─')} Graph density: ${response.data.density || 'N/A'}`
        );

        return response.data;
      },
      2000
    ); // 2s threshold
  }

  // Step 11: Pipeline Validation
  async testPipelineIntegrity() {
    console.log(chalk.blue('\n✅ STEP 11: Pipeline Integrity Validation'));

    const validations = [
      {
        name: 'Data Flow Continuity',
        check: () => {
          // Verify data flows through pipeline
          return (
            this.testData.papers.length > 0 &&
            this.testData.themes.length > 0 &&
            this.testData.statements.length > 0 &&
            this.testData.studyId !== null &&
            this.testData.analysisResults !== null
          );
        },
      },
      {
        name: 'Provenance Tracking',
        check: () => {
          // Verify statements have provenance
          return (
            this.testData.statements.filter(s => s.provenance).length >
            this.testData.statements.length * 0.8
          ); // 80% should have provenance
        },
      },
      {
        name: 'Literature Connection',
        check: () => {
          // Verify study is connected to literature
          return (
            this.testData.comparisonResults?.findings &&
            Object.keys(this.testData.comparisonResults.findings).length > 0
          );
        },
      },
      {
        name: 'Knowledge Graph Integration',
        check: () => {
          // Verify knowledge graph was updated
          return this.testData.knowledgeGraphNodes.length > 0;
        },
      },
      {
        name: 'Report Completeness',
        check: () => {
          // Verify report has all sections
          return this.testData.report?.sections?.length >= 8;
        },
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const validation of validations) {
      try {
        const result = validation.check();
        if (result) {
          console.log(`  ${chalk.green('✓')} ${validation.name}`);
          passed++;
        } else {
          console.log(`  ${chalk.red('✗')} ${validation.name}`);
          failed++;
        }
      } catch (error) {
        console.log(`  ${chalk.red('✗')} ${validation.name}: ${error.message}`);
        failed++;
      }
    }

    console.log(
      chalk.gray(
        `\n  Pipeline Validation: ${passed}/${validations.length} passed`
      )
    );

    return { passed, failed, total: validations.length };
  }

  // Performance Report
  generatePerformanceReport() {
    console.log(chalk.blue('\n📊 PERFORMANCE REPORT'));
    console.log(chalk.gray('─'.repeat(60)));

    const totalTime = performanceMetrics.pipelineSteps.reduce(
      (sum, step) => sum + step.duration,
      0
    );
    const avgTime = Math.round(
      totalTime / performanceMetrics.pipelineSteps.length
    );
    const failedSteps = performanceMetrics.pipelineSteps.filter(s => !s.passed);

    console.log(`Total Pipeline Time: ${chalk.cyan(totalTime + 'ms')}`);
    console.log(`Average Step Time: ${chalk.cyan(avgTime + 'ms')}`);
    console.log(
      `Steps Executed: ${chalk.cyan(performanceMetrics.pipelineSteps.length)}`
    );
    console.log(
      `Failed Thresholds: ${failedSteps.length > 0 ? chalk.red(failedSteps.length) : chalk.green('0')}`
    );

    if (failedSteps.length > 0) {
      console.log(chalk.yellow('\nSteps Exceeding Threshold:'));
      failedSteps.forEach(step => {
        console.log(
          `  - ${step.name}: ${step.duration}ms (threshold: ${step.threshold}ms)`
        );
      });
    }

    // Performance grade
    const performanceScore =
      ((performanceMetrics.pipelineSteps.length - failedSteps.length) /
        performanceMetrics.pipelineSteps.length) *
      100;
    let grade = 'A+';
    if (performanceScore < 100) grade = 'A';
    if (performanceScore < 90) grade = 'B';
    if (performanceScore < 80) grade = 'C';
    if (performanceScore < 70) grade = 'D';
    if (performanceScore < 60) grade = 'F';

    console.log(
      `\nPerformance Grade: ${chalk.cyan(grade)} (${Math.round(performanceScore)}%)`
    );

    if (performanceMetrics.errors.length > 0) {
      console.log(chalk.red('\n⚠️ ERRORS ENCOUNTERED:'));
      performanceMetrics.errors.forEach(err => {
        console.log(`  - ${err.step}: ${err.error}`);
      });
    }
  }

  // Main execution
  async run() {
    console.log(
      chalk.magenta.bold(
        '\n🚀 PHASE 9 DAY 11 - COMPREHENSIVE PIPELINE E2E TEST'
      )
    );
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.gray(`Started: ${new Date().toISOString()}`));
    console.log(
      chalk.gray(`Environment: ${process.env.NODE_ENV || 'development'}`)
    );
    console.log(chalk.gray('─'.repeat(60)));

    try {
      // Run all pipeline steps
      await this.testLiteratureSearch();
      await this.testThemeExtraction();
      await this.testGapAnalysis();
      await this.testStatementGeneration();
      await this.testStudyCreation();
      await this.testDataCollection();
      await this.testAnalysis();
      await this.testLiteratureComparison();
      await this.testReportGeneration();
      await this.testKnowledgeGraphUpdate();

      // Validate pipeline integrity
      const validation = await this.testPipelineIntegrity();

      // Generate performance report
      this.generatePerformanceReport();

      // Final status
      console.log(chalk.gray('─'.repeat(60)));
      if (validation.failed === 0 && performanceMetrics.errors.length === 0) {
        console.log(
          chalk.green.bold(
            '\n✅ PIPELINE TEST PASSED - ALL SYSTEMS OPERATIONAL'
          )
        );
        console.log(
          chalk.green(
            'The complete research pipeline is functioning correctly.'
          )
        );
        process.exit(0);
      } else {
        console.log(
          chalk.yellow.bold('\n⚠️ PIPELINE TEST COMPLETED WITH ISSUES')
        );
        console.log(chalk.yellow(`Validation failures: ${validation.failed}`));
        console.log(
          chalk.yellow(
            `Errors encountered: ${performanceMetrics.errors.length}`
          )
        );
        process.exit(1);
      }
    } catch (error) {
      console.log(chalk.red.bold('\n❌ PIPELINE TEST FAILED'));
      console.log(chalk.red(`Fatal error: ${error.message}`));
      console.log(chalk.gray('\nStack trace:'));
      console.log(chalk.gray(error.stack));
      process.exit(1);
    }
  }
}

// Mock API responses for testing without backend
async function setupMockServer() {
  console.log(chalk.yellow('⚠️ Backend not available - using mock responses'));

  // This would normally mock the API responses
  // For now, we'll skip if backend is not available
}

// Check if backend is running
async function checkBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const isBackendAvailable = await checkBackendHealth();

  if (!isBackendAvailable) {
    console.log(chalk.yellow('\n⚠️ Backend is not running on port 4000'));
    console.log(
      chalk.yellow('Please start the backend with: npm run start:dev')
    );
    console.log(
      chalk.gray(
        '\nAlternatively, run with mock data: node test-phase9-day11-pipeline-e2e.js --mock'
      )
    );

    if (process.argv.includes('--mock')) {
      await setupMockServer();
    } else {
      process.exit(1);
    }
  }

  const test = new PipelineE2ETest();
  await test.run();
})();
