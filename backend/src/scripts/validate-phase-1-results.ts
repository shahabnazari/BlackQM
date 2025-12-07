/**
 * Phase 10.106: Results Validator (Netflix-Grade)
 *
 * Analyzes test results against Netflix-grade quality standards
 * Strict TypeScript | Comprehensive Validation | Detailed Reports
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ValidationResult {
  readonly criterion: string;
  readonly status: 'PASS' | 'FAIL' | 'WARNING';
  readonly expected: string;
  readonly actual: string;
  readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  readonly details?: string;
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

interface TestResultEntry {
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
}

interface TestSummary {
  readonly phase: string;
  readonly timestamp: string;
  readonly totalDuration: number;
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly errors: number;
  readonly netflixGradeCriteria: {
    readonly zeroHttp429Errors: boolean;
    readonly pubmedReturningPapers: boolean;
    readonly allTestsPassed: boolean;
  };
  readonly results: readonly TestResultEntry[];
}

interface ValidationReport {
  readonly overallStatus: 'CERTIFIED' | 'CONDITIONAL' | 'NOT_READY';
  readonly netflixGradeScore: number;
  readonly criticalIssues: number;
  readonly highIssues: number;
  readonly mediumIssues: number;
  readonly lowIssues: number;
  readonly validations: readonly ValidationResult[];
  readonly recommendations: readonly string[];
}

// ============================================
// VALIDATOR CLASS
// ============================================

class Phase1ResultsValidator {
  // Phase 10.106 Netflix-Grade: Environment-based configuration (no hardcoded paths)
  private readonly resultsDir: string = process.env.TEST_OUTPUT_DIR ||
    path.resolve(__dirname, '../../../../test-results/phase-10.106');
  private validations: ValidationResult[] = [];
  private recommendations: string[] = [];

  /**
   * Validate all Phase 1 results
   */
  public async validate(): Promise<ValidationReport> {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🔍 PHASE 1 RESULTS VALIDATION (Netflix-Grade Standards)`);
    console.log(`${'═'.repeat(80)}\n`);

    // Load summary
    const summary: TestSummary = await this.loadSummary();

    // Run validations
    await this.validateNetflixGradeCriteria(summary);
    await this.validatePerformance(summary);
    await this.validateQuality(summary);
    await this.validateReliability(summary);
    await this.validateIndividualTests(summary);

    // Calculate overall status
    const report: ValidationReport = this.generateReport();

    // Display report
    this.displayReport(report);

    // Save report
    await this.saveReport(report);

    return report;
  }

  /**
   * Load summary file
   */
  private async loadSummary(): Promise<TestSummary> {
    const summaryPath: string = path.join(this.resultsDir, 'phase-1-summary.json');

    try {
      const content: string = await fs.readFile(summaryPath, 'utf-8');
      return JSON.parse(content) as TestSummary;
    } catch (error: unknown) {
      const errorMessage: string = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load summary: ${errorMessage}`);
    }
  }

  /**
   * Validate Netflix-Grade Criteria (CRITICAL)
   */
  private async validateNetflixGradeCriteria(summary: TestSummary): Promise<void> {
    console.log(`📋 Validating Netflix-Grade Criteria...\n`);

    // Criterion 1: Zero HTTP 429 Errors
    this.addValidation({
      criterion: 'Zero HTTP 429 Errors',
      status: summary.netflixGradeCriteria.zeroHttp429Errors ? 'PASS' : 'FAIL',
      expected: '0 HTTP 429 errors',
      actual: summary.netflixGradeCriteria.zeroHttp429Errors ? '0 errors' : 'Errors detected',
      severity: 'CRITICAL',
      details: 'Rate limiter must prevent all HTTP 429 errors. This is the #1 Netflix-grade requirement.',
    });

    // Criterion 2: PubMed Returns Papers
    this.addValidation({
      criterion: 'PubMed Returns Papers',
      status: summary.netflixGradeCriteria.pubmedReturningPapers ? 'PASS' : 'FAIL',
      expected: 'PubMed test passes',
      actual: summary.netflixGradeCriteria.pubmedReturningPapers ? 'PASS' : 'FAIL',
      severity: 'CRITICAL',
      details: 'Adaptive quality weights must allow PubMed papers through quality threshold.',
    });

    // Criterion 3: All Tests Passed
    this.addValidation({
      criterion: 'All Tests Passed',
      status: summary.netflixGradeCriteria.allTestsPassed ? 'PASS' : 'FAIL',
      expected: '4/4 tests pass',
      actual: `${summary.passed}/${summary.totalTests} tests pass`,
      severity: 'HIGH',
      details: 'All Phase 1 tests must pass for production readiness.',
    });

    console.log(`   ✅ Netflix-Grade criteria validated\n`);
  }

  /**
   * Validate Performance Requirements
   */
  private async validatePerformance(summary: TestSummary): Promise<void> {
    console.log(`⚡ Validating Performance Requirements...\n`);

    // Overall timing
    const avgDurationPerTest: number = summary.totalDuration / summary.totalTests;
    this.addValidation({
      criterion: 'Average Test Duration',
      status: avgDurationPerTest <= 30 ? 'PASS' : avgDurationPerTest <= 40 ? 'WARNING' : 'FAIL',
      expected: '≤30s per test',
      actual: `${avgDurationPerTest.toFixed(1)}s per test`,
      severity: 'MEDIUM',
      details: 'Individual source tests should complete within 30 seconds.',
    });

    // Check individual test timings
    for (const result of summary.results) {
      if (result.duration > 40) {
        this.addRecommendation(
          `Test ${result.testId} took ${result.duration.toFixed(1)}s (>40s). Investigate performance bottleneck.`
        );
      }
    }

    console.log(`   ✅ Performance requirements validated\n`);
  }

  /**
   * Validate Quality Requirements
   */
  private async validateQuality(summary: TestSummary): Promise<void> {
    console.log(`🎯 Validating Quality Requirements...\n`);

    for (const result of summary.results) {
      // Quality score distribution
      const avgScore: number = result.avgQualityScore;
      const minExpected: number = result.details.expected.qualityScoreMin;
      const maxExpected: number = result.details.expected.qualityScoreMax;

      const scoreInRange: boolean = avgScore >= minExpected && avgScore <= maxExpected;

      this.addValidation({
        criterion: `Test ${result.testId} Quality Scores`,
        status: scoreInRange ? 'PASS' : 'FAIL',
        expected: `${minExpected}-${maxExpected}`,
        actual: avgScore.toFixed(1),
        severity: 'MEDIUM',
        details: `${result.testName}: Average quality score`,
      });

      // Enrichment rate
      const enrichment: number = result.enrichmentRate;
      const minEnrichment: number = result.details.expected.enrichmentRateMin;

      this.addValidation({
        criterion: `Test ${result.testId} Enrichment Rate`,
        status: enrichment >= minEnrichment ? 'PASS' : enrichment >= minEnrichment - 10 ? 'WARNING' : 'FAIL',
        expected: `≥${minEnrichment}%`,
        actual: `${enrichment.toFixed(1)}%`,
        severity: 'MEDIUM',
        details: `${result.testName}: Metadata enrichment`,
      });

      // Paper count
      const paperCount: number = result.paperCount;
      const minCount: number = result.details.expected.paperCountMin;
      const maxCount: number = result.details.expected.paperCountMax;

      const countInRange: boolean = paperCount >= minCount && paperCount <= maxCount;

      this.addValidation({
        criterion: `Test ${result.testId} Paper Count`,
        status: countInRange ? 'PASS' : paperCount >= minCount - 10 ? 'WARNING' : 'FAIL',
        expected: `${minCount}-${maxCount}`,
        actual: `${paperCount}`,
        severity: result.testId === '1.2' ? 'CRITICAL' : 'HIGH',
        details: `${result.testName}: Papers after pipeline`,
      });
    }

    console.log(`   ✅ Quality requirements validated\n`);
  }

  /**
   * Validate Reliability Requirements
   */
  private async validateReliability(summary: TestSummary): Promise<void> {
    console.log(`🛡️  Validating Reliability Requirements...\n`);

    // No errors
    this.addValidation({
      criterion: 'Zero Test Errors',
      status: summary.errors === 0 ? 'PASS' : 'FAIL',
      expected: '0 errors',
      actual: `${summary.errors} errors`,
      severity: 'HIGH',
      details: 'All tests must execute without errors.',
    });

    // Success rate
    const successRate: number = (summary.passed / summary.totalTests) * 100;
    this.addValidation({
      criterion: 'Test Success Rate',
      status: successRate === 100 ? 'PASS' : successRate >= 75 ? 'WARNING' : 'FAIL',
      expected: '100%',
      actual: `${successRate.toFixed(0)}%`,
      severity: 'HIGH',
      details: 'All tests should pass for production readiness.',
    });

    console.log(`   ✅ Reliability requirements validated\n`);
  }

  /**
   * Validate individual test results
   */
  private async validateIndividualTests(summary: TestSummary): Promise<void> {
    console.log(`🔬 Validating Individual Tests...\n`);

    for (const result of summary.results) {
      if (result.status !== 'PASS') {
        console.log(`   ⚠️  Test ${result.testId} (${result.testName}): ${result.status}`);

        if (result.details.violations && result.details.violations.length > 0) {
          console.log(`      Violations:`);
          result.details.violations.forEach((violation: string) => {
            console.log(`         - ${violation}`);
            this.addRecommendation(`Fix Test ${result.testId}: ${violation}`);
          });
        }
      } else {
        console.log(`   ✅ Test ${result.testId} (${result.testName}): PASS`);
      }
    }

    console.log();
  }

  /**
   * Add validation result
   */
  private addValidation(validation: ValidationResult): void {
    this.validations.push(validation);
  }

  /**
   * Add recommendation
   */
  private addRecommendation(recommendation: string): void {
    this.recommendations.push(recommendation);
  }

  /**
   * Generate validation report
   */
  private generateReport(): ValidationReport {
    const criticalIssues: number = this.validations.filter(
      (v: ValidationResult) => v.status === 'FAIL' && v.severity === 'CRITICAL'
    ).length;

    const highIssues: number = this.validations.filter(
      (v: ValidationResult) => v.status === 'FAIL' && v.severity === 'HIGH'
    ).length;

    const mediumIssues: number = this.validations.filter(
      (v: ValidationResult) => v.status === 'FAIL' && v.severity === 'MEDIUM'
    ).length;

    const lowIssues: number = this.validations.filter(
      (v: ValidationResult) => v.status === 'FAIL' && v.severity === 'LOW'
    ).length;

    // Calculate Netflix-grade score
    const totalValidations: number = this.validations.length;
    const passedValidations: number = this.validations.filter(
      (v: ValidationResult) => v.status === 'PASS'
    ).length;

    const netflixGradeScore: number = (passedValidations / totalValidations) * 100;

    // Determine overall status
    let overallStatus: 'CERTIFIED' | 'CONDITIONAL' | 'NOT_READY';
    if (criticalIssues === 0 && highIssues === 0 && netflixGradeScore >= 95) {
      overallStatus = 'CERTIFIED';
    } else if (criticalIssues === 0 && netflixGradeScore >= 85) {
      overallStatus = 'CONDITIONAL';
    } else {
      overallStatus = 'NOT_READY';
    }

    return {
      overallStatus,
      netflixGradeScore,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      validations: this.validations,
      recommendations: this.recommendations,
    };
  }

  /**
   * Display validation report
   */
  private displayReport(report: ValidationReport): void {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📊 VALIDATION REPORT`);
    console.log(`${'═'.repeat(80)}\n`);

    // Overall status
    const statusIcon: string = report.overallStatus === 'CERTIFIED' ? '✅' :
                               report.overallStatus === 'CONDITIONAL' ? '⚠️' : '❌';
    console.log(`${statusIcon} Overall Status: ${report.overallStatus}`);
    console.log(`   Netflix-Grade Score: ${report.netflixGradeScore.toFixed(1)}%\n`);

    // Issue summary
    console.log(`📈 Issue Summary:`);
    console.log(`   🔴 Critical: ${report.criticalIssues}`);
    console.log(`   🟠 High: ${report.highIssues}`);
    console.log(`   🟡 Medium: ${report.mediumIssues}`);
    console.log(`   🟢 Low: ${report.lowIssues}\n`);

    // Critical failures
    const criticalFailures: ValidationResult[] = report.validations.filter(
      (v: ValidationResult) => v.status === 'FAIL' && v.severity === 'CRITICAL'
    );

    if (criticalFailures.length > 0) {
      console.log(`🔴 CRITICAL FAILURES:\n`);
      criticalFailures.forEach((v: ValidationResult) => {
        console.log(`   ❌ ${v.criterion}`);
        console.log(`      Expected: ${v.expected}`);
        console.log(`      Actual: ${v.actual}`);
        if (v.details) {
          console.log(`      Details: ${v.details}`);
        }
        console.log();
      });
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(`💡 RECOMMENDATIONS:\n`);
      report.recommendations.forEach((rec: string, index: number) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log();
    }

    // Production readiness
    console.log(`${'═'.repeat(80)}\n`);

    if (report.overallStatus === 'CERTIFIED') {
      console.log(`✅ PHASE 1 CERTIFIED - PRODUCTION READY`);
      console.log(`\n   Next Steps:`);
      console.log(`   1. Proceed to Phase 2 (Remaining Individual Sources)`);
      console.log(`   2. Continue Netflix-grade validation throughout\n`);
    } else if (report.overallStatus === 'CONDITIONAL') {
      console.log(`⚠️  PHASE 1 CONDITIONAL PASS`);
      console.log(`\n   Action Required:`);
      console.log(`   1. Address high-priority issues before Phase 2`);
      console.log(`   2. Monitor closely in Phase 2\n`);
    } else {
      console.log(`❌ PHASE 1 NOT READY FOR PRODUCTION`);
      console.log(`\n   Action Required:`);
      console.log(`   1. Fix all critical issues before proceeding`);
      console.log(`   2. Re-run Phase 1 tests after fixes`);
      console.log(`   3. Do not proceed to Phase 2 until certified\n`);
    }

    console.log(`${'═'.repeat(80)}\n`);
  }

  /**
   * Save validation report
   */
  private async saveReport(report: ValidationReport): Promise<void> {
    const reportPath: string = path.join(this.resultsDir, 'phase-1-validation-report.json');

    await fs.writeFile(
      reportPath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );

    console.log(`💾 Validation report saved: phase-1-validation-report.json\n`);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main(): Promise<void> {
  try {
    const validator = new Phase1ResultsValidator();
    const report: ValidationReport = await validator.validate();

    // Exit with appropriate code
    if (report.overallStatus === 'NOT_READY') {
      process.exit(1);
    }
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error(`\n🔴 VALIDATION ERROR: ${errorMessage}\n`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { Phase1ResultsValidator };
