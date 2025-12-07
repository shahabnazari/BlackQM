/**
 * Phase 10.106: Netflix-Grade Test Runner (Phase 1)
 *
 * STRICT MODE ENABLED
 * Type Safety: 100%
 * Error Handling: Netflix-Grade
 * Observability: Complete
 *
 * Tests:
 * - Test 1.1: Semantic Scholar (baseline)
 * - Test 1.2: PubMed (CRITICAL - adaptive weights)
 * - Test 1.3: CrossRef (DOI-based enrichment)
 * - Test 1.4: OpenAlex (direct source, no enrichment)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import axios, { AxiosError, AxiosResponse } from 'axios';

// ============================================
// STRICT TYPE DEFINITIONS (Netflix-Grade)
// ============================================

interface SearchRequest {
  readonly query: string;
  readonly sources: readonly string[];
}

interface QualityScoreComponents {
  readonly citationImpact: number;
  readonly journalPrestige: number;
  readonly recencyBoost: number;
  readonly openAccessBonus: number;
  readonly reproducibilityBonus: number;
  readonly altmetricBonus: number;
}

interface Paper {
  readonly id: string;
  readonly title: string;
  readonly doi?: string;
  readonly pmid?: string;
  readonly source: string;
  readonly qualityScore: number;
  readonly qualityScoreComponents?: QualityScoreComponents;
  readonly citationCount?: number;
  readonly impactFactor?: number;
  readonly hIndexJournal?: number;
  readonly year?: number;
  readonly isOpenAccess?: boolean;
  readonly hasDataCode?: boolean;
  readonly altmetricScore?: number;
}

interface TimingMetadata {
  readonly total: number;
  readonly collection?: number;
  readonly enrichment?: number;
  readonly scoring?: number;
  readonly deduplication?: number;
}

interface ErrorMetadata {
  readonly http429?: number;
  readonly http503?: number;
  readonly timeout?: number;
  readonly other?: number;
}

interface CircuitBreakerMetadata {
  readonly opened: boolean;
  readonly failures?: number;
}

interface DeduplicationMetadata {
  readonly duplicatesRemoved: number;
  readonly strategies: readonly string[];
}

interface ResponseMetadata {
  readonly timing?: TimingMetadata;
  readonly errors?: ErrorMetadata;
  readonly circuitBreaker?: CircuitBreakerMetadata;
  readonly enrichmentRate?: number;
  readonly totalCollected?: number;
  readonly deduplication?: DeduplicationMetadata;
  readonly performance?: {
    readonly memoryGrowthMB?: number;
  };
}

interface SearchResponse {
  readonly papers: readonly Paper[];
  readonly metadata?: ResponseMetadata;
  readonly success: boolean;
  readonly message?: string;
}

interface TestResult {
  readonly testId: string;
  readonly testName: string;
  readonly status: 'PASS' | 'FAIL' | 'ERROR';
  readonly duration: number;
  readonly paperCount: number;
  readonly avgQualityScore: number;
  readonly enrichmentRate: number;
  readonly http429Errors: number;
  readonly details: {
    readonly expected: TestExpectations;
    readonly actual: TestMetrics;
    readonly violations: readonly string[];
  };
  readonly response: SearchResponse;
}

interface TestExpectations {
  readonly paperCountMin: number;
  readonly paperCountMax: number;
  readonly qualityScoreMin: number;
  readonly qualityScoreMax: number;
  readonly enrichmentRateMin: number;
  readonly timingMax: number;
  readonly http429Errors: number;
}

interface TestMetrics {
  readonly paperCount: number;
  readonly avgQualityScore: number;
  readonly minQualityScore: number;
  readonly maxQualityScore: number;
  readonly enrichmentRate: number;
  readonly timing: number;
  readonly http429Errors: number;
}

interface TestConfig {
  readonly testId: string;
  readonly testName: string;
  readonly request: SearchRequest;
  readonly expectations: TestExpectations;
  readonly criticalityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

// ============================================
// NETFLIX-GRADE TEST CONFIGURATIONS
// ============================================

const PHASE_1_TESTS: readonly TestConfig[] = [
  // Test 1.1: Semantic Scholar (Baseline)
  {
    testId: '1.1',
    testName: 'Semantic Scholar - Baseline Verification',
    request: {
      query: 'machine learning transformers',
      sources: ['semantic_scholar'],
    },
    expectations: {
      paperCountMin: 70,
      paperCountMax: 90,
      qualityScoreMin: 40,
      qualityScoreMax: 100,
      enrichmentRateMin: 80,
      timingMax: 30,
      http429Errors: 0,
    },
    criticalityLevel: 'MEDIUM',
  },

  // Test 1.2: PubMed (CRITICAL - Adaptive Weights)
  {
    testId: '1.2',
    testName: 'PubMed - Adaptive Quality Weights (CRITICAL)',
    request: {
      query: 'diabetes treatment clinical trials',
      sources: ['pubmed'],
    },
    expectations: {
      paperCountMin: 40,
      paperCountMax: 70,
      qualityScoreMin: 35,
      qualityScoreMax: 80,
      enrichmentRateMin: 60,
      timingMax: 35,
      http429Errors: 0,
    },
    criticalityLevel: 'CRITICAL',
  },

  // Test 1.3: CrossRef (DOI-Based Enrichment)
  {
    testId: '1.3',
    testName: 'CrossRef - DOI-Based Enrichment (Optimal Path)',
    request: {
      query: 'climate change impacts biodiversity',
      sources: ['crossref'],
    },
    expectations: {
      paperCountMin: 60,
      paperCountMax: 85,
      qualityScoreMin: 45,
      qualityScoreMax: 95,
      enrichmentRateMin: 85,
      timingMax: 30,
      http429Errors: 0,
    },
    criticalityLevel: 'HIGH',
  },

  // Test 1.4: OpenAlex (Direct Source - No Enrichment)
  {
    testId: '1.4',
    testName: 'OpenAlex - Direct Source (Fastest Baseline)',
    request: {
      query: 'quantum computing algorithms',
      sources: ['openalex'],
    },
    expectations: {
      paperCountMin: 70,
      paperCountMax: 90,
      qualityScoreMin: 50,
      qualityScoreMax: 100,
      enrichmentRateMin: 95,
      timingMax: 25,
      http429Errors: 0,
    },
    criticalityLevel: 'MEDIUM',
  },
] as const;

// ============================================
// NETFLIX-GRADE TEST RUNNER CLASS
// ============================================

class Phase1TestRunner {
  // Phase 10.106 Netflix-Grade: Environment-based configuration (no hardcoded paths)
  private readonly baseUrl: string = process.env.API_BASE_URL || 'http://localhost:4000';
  private readonly outputDir: string = process.env.TEST_OUTPUT_DIR ||
    path.resolve(__dirname, '../../../../test-results/phase-10.106');
  private readonly results: TestResult[] = [];
  private readonly authToken: string;
  // Phase 10.106: Increased timeout for external API resilience
  private readonly requestTimeout: number = parseInt(process.env.TEST_TIMEOUT_MS || '120000', 10);

  constructor(authToken?: string) {
    this.authToken = authToken || process.env.JWT_TOKEN || '';
    if (!this.authToken) {
      console.warn('⚠️  WARNING: No authentication token provided. Tests may fail.');
      console.warn('   Set JWT_TOKEN environment variable or pass token to constructor.');
    }
    console.log(`📁 Output directory: ${this.outputDir}`);
    console.log(`🌐 API base URL: ${this.baseUrl}`);
    console.log(`⏱️  Request timeout: ${this.requestTimeout}ms`);
    this.ensureOutputDir();
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`✅ Output directory ready: ${this.outputDir}`);
    } catch (error: unknown) {
      const errorMessage: string = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to create output directory: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Execute a single test with Netflix-grade error handling
   */
  private async executeTest(config: TestConfig): Promise<TestResult> {
    const startTime: number = Date.now();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TEST ${config.testId}: ${config.testName}`);
    console.log(`📌 Criticality: ${config.criticalityLevel}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Make API request
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authentication if token available
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Phase 10.106: Use configurable timeout, minimum of 2x expected or requestTimeout
      const effectiveTimeout: number = Math.max(
        config.expectations.timingMax * 2 * 1000,
        this.requestTimeout
      );

      const response: AxiosResponse<SearchResponse> = await axios.post(
        `${this.baseUrl}/api/literature/search`,
        config.request,
        {
          headers,
          timeout: effectiveTimeout,
        }
      );

      const duration: number = (Date.now() - startTime) / 1000;
      const searchResponse: SearchResponse = response.data;

      // Extract metrics
      const metrics: TestMetrics = this.extractMetrics(searchResponse, duration);

      // Validate against expectations
      const violations: string[] = this.validateExpectations(config.expectations, metrics);

      // Determine test status
      const status: 'PASS' | 'FAIL' | 'ERROR' = violations.length === 0 ? 'PASS' : 'FAIL';

      // Create test result
      const result: TestResult = {
        testId: config.testId,
        testName: config.testName,
        status,
        duration,
        paperCount: metrics.paperCount,
        avgQualityScore: metrics.avgQualityScore,
        enrichmentRate: metrics.enrichmentRate,
        http429Errors: metrics.http429Errors,
        details: {
          expected: config.expectations,
          actual: metrics,
          violations,
        },
        response: searchResponse,
      };

      // Log result
      this.logTestResult(result, config);

      // Save result to file
      await this.saveTestResult(config, result);

      return result;

    } catch (error: unknown) {
      const duration: number = (Date.now() - startTime) / 1000;
      const errorMessage: string = this.extractErrorMessage(error);

      console.error(`\n❌ TEST ${config.testId} ERROR: ${errorMessage}\n`);

      // Create error result
      const errorResult: TestResult = {
        testId: config.testId,
        testName: config.testName,
        status: 'ERROR',
        duration,
        paperCount: 0,
        avgQualityScore: 0,
        enrichmentRate: 0,
        http429Errors: 0,
        details: {
          expected: config.expectations,
          actual: {
            paperCount: 0,
            avgQualityScore: 0,
            minQualityScore: 0,
            maxQualityScore: 0,
            enrichmentRate: 0,
            timing: duration,
            http429Errors: 0,
          },
          violations: [errorMessage],
        },
        response: {
          papers: [],
          success: false,
          message: errorMessage,
        },
      };

      await this.saveTestResult(config, errorResult);

      return errorResult;
    }
  }

  /**
   * Extract error message with Netflix-grade handling
   */
  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError: AxiosError = error;
      if (axiosError.response) {
        return `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`;
      } else if (axiosError.request) {
        return 'No response from server';
      } else {
        return axiosError.message;
      }
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return String(error);
    }
  }

  /**
   * Extract metrics from response
   */
  private extractMetrics(response: SearchResponse, duration: number): TestMetrics {
    const papers: readonly Paper[] = response.papers || [];
    const paperCount: number = papers.length;

    // Calculate quality scores
    const scores: number[] = papers.map((p: Paper) => p.qualityScore || 0);
    const avgQualityScore: number = paperCount > 0
      ? scores.reduce((sum: number, score: number) => sum + score, 0) / paperCount
      : 0;
    const minQualityScore: number = paperCount > 0 ? Math.min(...scores) : 0;
    const maxQualityScore: number = paperCount > 0 ? Math.max(...scores) : 0;

    // Calculate enrichment rate
    const enrichedPapers: number = papers.filter((p: Paper) =>
      (p.citationCount ?? 0) > 0 || (p.impactFactor ?? 0) > 0 || (p.hIndexJournal ?? 0) > 0
    ).length;
    const enrichmentRate: number = paperCount > 0
      ? (enrichedPapers / paperCount) * 100
      : 0;

    // Extract HTTP 429 errors
    const http429Errors: number = response.metadata?.errors?.http429 ?? 0;

    return {
      paperCount,
      avgQualityScore,
      minQualityScore,
      maxQualityScore,
      enrichmentRate,
      timing: duration,
      http429Errors,
    };
  }

  /**
   * Validate metrics against expectations
   */
  private validateExpectations(
    expected: TestExpectations,
    actual: TestMetrics
  ): string[] {
    const violations: string[] = [];

    // Paper count range
    if (actual.paperCount < expected.paperCountMin) {
      violations.push(
        `Paper count too low: ${actual.paperCount} < ${expected.paperCountMin}`
      );
    }
    if (actual.paperCount > expected.paperCountMax) {
      violations.push(
        `Paper count too high: ${actual.paperCount} > ${expected.paperCountMax}`
      );
    }

    // Quality score range
    if (actual.avgQualityScore < expected.qualityScoreMin) {
      violations.push(
        `Avg quality score too low: ${actual.avgQualityScore.toFixed(1)} < ${expected.qualityScoreMin}`
      );
    }
    if (actual.avgQualityScore > expected.qualityScoreMax) {
      violations.push(
        `Avg quality score too high: ${actual.avgQualityScore.toFixed(1)} > ${expected.qualityScoreMax}`
      );
    }

    // Enrichment rate
    if (actual.enrichmentRate < expected.enrichmentRateMin) {
      violations.push(
        `Enrichment rate too low: ${actual.enrichmentRate.toFixed(1)}% < ${expected.enrichmentRateMin}%`
      );
    }

    // Timing
    if (actual.timing > expected.timingMax) {
      violations.push(
        `Timing too slow: ${actual.timing.toFixed(1)}s > ${expected.timingMax}s`
      );
    }

    // HTTP 429 errors (CRITICAL - Netflix-Grade Requirement)
    if (actual.http429Errors > expected.http429Errors) {
      violations.push(
        `🔴 CRITICAL: HTTP 429 errors detected: ${actual.http429Errors} (MUST BE 0)`
      );
    }

    return violations;
  }

  /**
   * Log test result with rich formatting
   */
  private logTestResult(result: TestResult, config: TestConfig): void {
    const icon: string = result.status === 'PASS' ? '✅' : '❌';
    console.log(`\n${icon} TEST ${result.testId} ${result.status}`);
    console.log(`   Duration: ${result.duration.toFixed(1)}s`);
    console.log(`   Papers: ${result.paperCount} (expected: ${config.expectations.paperCountMin}-${config.expectations.paperCountMax})`);
    console.log(`   Avg Quality: ${result.avgQualityScore.toFixed(1)} (expected: ${config.expectations.qualityScoreMin}-${config.expectations.qualityScoreMax})`);
    console.log(`   Enrichment: ${result.enrichmentRate.toFixed(1)}% (expected: >${config.expectations.enrichmentRateMin}%)`);
    console.log(`   HTTP 429: ${result.http429Errors} (expected: ${config.expectations.http429Errors})`);

    if (result.details.violations.length > 0) {
      console.log(`\n   ⚠️  VIOLATIONS:`);
      result.details.violations.forEach((violation: string) => {
        console.log(`      - ${violation}`);
      });
    }

    console.log();
  }

  /**
   * Save test result to JSON file
   */
  private async saveTestResult(config: TestConfig, result: TestResult): Promise<void> {
    const filename: string = `test-${config.testId.replace('.', '-')}-${config.request.sources[0]}.json`;
    const filepath: string = path.join(this.outputDir, filename);

    try {
      await fs.writeFile(
        filepath,
        JSON.stringify(result, null, 2),
        'utf-8'
      );
      console.log(`💾 Saved: ${filename}`);
    } catch (error: unknown) {
      const errorMessage: string = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to save result: ${errorMessage}`);
    }
  }

  /**
   * Run all Phase 1 tests
   */
  public async runAllTests(): Promise<void> {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🚀 PHASE 10.106 - PHASE 1 TEST EXECUTION`);
    console.log(`   Netflix-Grade Quality Standards`);
    console.log(`   Strict TypeScript Mode: ON`);
    console.log(`   Full Integration: ENABLED`);
    console.log(`${'═'.repeat(80)}\n`);

    const startTime: number = Date.now();

    // Execute all tests sequentially
    for (const config of PHASE_1_TESTS) {
      const result: TestResult = await this.executeTest(config);
      this.results.push(result);

      // Wait between tests to avoid overwhelming the system
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
    }

    const totalDuration: number = (Date.now() - startTime) / 1000;

    // Generate summary report
    await this.generateSummaryReport(totalDuration);
  }

  /**
   * Generate summary report
   */
  private async generateSummaryReport(totalDuration: number): Promise<void> {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📊 PHASE 1 TEST SUMMARY REPORT`);
    console.log(`${'═'.repeat(80)}\n`);

    const passedTests: TestResult[] = this.results.filter((r: TestResult) => r.status === 'PASS');
    const failedTests: TestResult[] = this.results.filter((r: TestResult) => r.status === 'FAIL');
    const errorTests: TestResult[] = this.results.filter((r: TestResult) => r.status === 'ERROR');

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`✅ Passed: ${passedTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`🔴 Errors: ${errorTests.length}`);
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(1)}s\n`);

    // Critical checks
    const hasHttp429Errors: boolean = this.results.some((r: TestResult) => r.http429Errors > 0);
    const pubmedTest: TestResult | undefined = this.results.find((r: TestResult) => r.testId === '1.2');

    console.log(`🎯 NETFLIX-GRADE CRITERIA:\n`);
    console.log(`   ${hasHttp429Errors ? '❌' : '✅'} Zero HTTP 429 Errors: ${hasHttp429Errors ? 'FAIL' : 'PASS'}`);
    console.log(`   ${pubmedTest && pubmedTest.status === 'PASS' ? '✅' : '❌'} PubMed Returns Papers: ${pubmedTest ? pubmedTest.status : 'NOT RUN'}`);
    console.log(`   ${passedTests.length === this.results.length ? '✅' : '❌'} All Tests Passed: ${passedTests.length}/${this.results.length}`);

    console.log(`\n${'═'.repeat(80)}\n`);

    // Save summary report
    const summaryPath: string = path.join(this.outputDir, 'phase-1-summary.json');
    const summary = {
      phase: 'Phase 1',
      timestamp: new Date().toISOString(),
      totalDuration,
      totalTests: this.results.length,
      passed: passedTests.length,
      failed: failedTests.length,
      errors: errorTests.length,
      netflixGradeCriteria: {
        zeroHttp429Errors: !hasHttp429Errors,
        pubmedReturningPapers: pubmedTest?.status === 'PASS',
        allTestsPassed: passedTests.length === this.results.length,
      },
      results: this.results,
    };

    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
    console.log(`💾 Summary saved: phase-1-summary.json\n`);

    // Exit with appropriate code
    if (failedTests.length > 0 || errorTests.length > 0) {
      process.exit(1);
    }
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main(): Promise<void> {
  try {
    // Get JWT token from environment or login
    let jwtToken: string = process.env.JWT_TOKEN || '';

    if (!jwtToken) {
      console.log('🔐 No JWT_TOKEN found. Attempting to login...\n');
      // You can add auto-login here if needed
    }

    const runner = new Phase1TestRunner(jwtToken);
    await runner.runAllTests();
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error(`\n🔴 FATAL ERROR: ${errorMessage}\n`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { Phase1TestRunner, PHASE_1_TESTS };
