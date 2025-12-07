/**
 * Phase 10.98 Day 5-6: Qualitative Analysis Pipeline Service
 *
 * Purpose-specific algorithm for QUALITATIVE_ANALYSIS research purpose
 * Implements saturation-driven hierarchical clustering with Bayesian detection
 *
 * Scientific Backing:
 * - Glaser, B. G., & Strauss, A. L. (1967). The Discovery of Grounded Theory.
 * - Braun, V., & Clarke, V. (2019). Reflecting on reflexive thematic analysis.
 * - Francis, J. J., et al. (2010). What is an adequate sample size? BMJ.
 *
 * Key Features:
 * - Hierarchical clustering for 5-20 themes
 * - Bayesian saturation detection using Beta distribution
 * - Theme emergence curve visualization
 * - Power law fitting for saturation prediction
 * - Sensitivity analysis for robustness testing
 * - Actionable recommendations for data collection
 *
 * Algorithm:
 * 1. Perform hierarchical clustering to identify themes
 * 2. Calculate theme emergence curve across sources
 * 3. Apply Bayesian saturation detection (Beta distribution)
 * 4. Fit power law to emergence data (y = a × x^(-b))
 * 5. Conduct sensitivity analysis (100 source permutations)
 * 6. Generate confidence score and recommendation
 *
 * Patent Claim #27: Automated Theoretical Saturation Detection
 * - First tool using Bayesian posterior probabilities for saturation
 * - Combines 3 independent signals (Bayesian, power law, robustness)
 * - Provides scientifically grounded stopping criteria
 *
 * @enterprise Features:
 * - Zero `any` types (strict TypeScript)
 * - Enterprise-grade error handling with AlgorithmError
 * - Comprehensive logging with scientific interpretation
 * - Performance monitoring
 * - Scientific validation
 *
 * @author VQMethod Platform
 * @version 1.0
 * @date 2025-11-26
 */

import { Injectable, Logger } from '@nestjs/common';
import type { InitialCode, CandidateTheme, SourceContent } from '../types/unified-theme-extraction.types';
import type {
  Cluster,
  QualitativeAnalysisResult,
  SaturationAnalysis,
  ThemeEmergencePoint,
  PowerLawFit,
  BayesianSaturationResult,
  RobustnessAnalysis,
} from '../types/phase-10.98.types';
import { AlgorithmError, AlgorithmErrorCode, isError } from '../types/phase-10.98.types';
import { MathematicalUtilitiesService } from './mathematical-utilities.service';

/** Logging prefix for consistent log formatting */
const LOG_PREFIX = '[QualitativeAnalysis]';

/** Minimum themes for qualitative analysis (Braun & Clarke 2019) */
const MIN_THEMES = 5;

/** Maximum themes for qualitative analysis (typical upper bound) */
const MAX_THEMES = 20;

/** Threshold for new themes per source (≤1 = saturation signal) */
const NEW_THEME_THRESHOLD = 1;

/** Bayesian posterior probability threshold for saturation (≥0.8 = saturated) */
const SATURATION_POSTERIOR_THRESHOLD = 0.8;

/** Probability threshold for credible interval (p < 0.2 = low chance of new themes) */
const LOW_PROBABILITY_THRESHOLD = 0.2;

/** Power law exponent threshold (b > 0.5 = strong saturation) */
const POWER_LAW_THRESHOLD = 0.5;

/** R-squared threshold for power law fit (≥0.7 = good fit) */
const R_SQUARED_THRESHOLD = 0.7;

/** Robustness score threshold (≥0.75 = robust saturation) */
const ROBUSTNESS_THRESHOLD = 0.75;

/** Number of permutations for sensitivity analysis */
const NUM_PERMUTATIONS = 100;

@Injectable()
export class QualitativeAnalysisPipelineService {
  private readonly logger = new Logger(QualitativeAnalysisPipelineService.name);

  constructor(
    private readonly mathUtils: MathematicalUtilitiesService,
  ) {}

  /**
   * Execute Qualitative Analysis Pipeline
   *
   * Produces 5-20 themes with Bayesian saturation detection
   * Uses hierarchical clustering + saturation analysis across sources
   *
   * @param codes - Initial codes extracted from sources
   * @param codeEmbeddings - Semantic embeddings for each code (for similarity)
   * @param sources - Source content for provenance and emergence tracking
   * @param targetThemes - Target number of themes (5-20)
   * @param labelingFunction - AI labeling function for themes
   * @returns Qualitative analysis result with saturation data
   * @throws AlgorithmError if pipeline fails
   *
   * @example
   * const result = await pipeline.executeQualitativeAnalysisPipeline(
   *   codes, embeddings, sources, 15, labelFunc
   * );
   * console.log(`Themes: ${result.themes.length}, Saturated: ${result.saturationAnalysis.isSaturated}`);
   */
  async executeQualitativeAnalysisPipeline(
    codes: InitialCode[],
    codeEmbeddings: Map<string, number[]>,
    sources: SourceContent[],
    targetThemes: number = 15,
    labelingFunction: (clusters: Cluster[], sources: SourceContent[]) => Promise<CandidateTheme[]>,
  ): Promise<QualitativeAnalysisResult> {
    const startTime = Date.now();

    this.logger.log(`${LOG_PREFIX} Starting Qualitative Analysis pipeline`);
    this.logger.log(`${LOG_PREFIX}   • Codes: ${codes.length}`);
    this.logger.log(`${LOG_PREFIX}   • Sources: ${sources.length}`);
    this.logger.log(`${LOG_PREFIX}   • Target themes: ${targetThemes}`);

    // Validate inputs
    if (codes.length === 0) {
      throw new AlgorithmError(
        'Cannot cluster empty code array',
        'qualitative-analysis',
        'validation',
        AlgorithmErrorCode.INVALID_INPUT,
      );
    }

    if (sources.length === 0) {
      throw new AlgorithmError(
        'Cannot perform saturation analysis with zero sources',
        'qualitative-analysis',
        'validation',
        AlgorithmErrorCode.INVALID_INPUT,
      );
    }

    if (targetThemes < MIN_THEMES || targetThemes > MAX_THEMES) {
      this.logger.warn(
        `${LOG_PREFIX} Target themes ${targetThemes} outside recommended range [${MIN_THEMES}, ${MAX_THEMES}]. Clamping.`,
      );
      targetThemes = Math.max(MIN_THEMES, Math.min(MAX_THEMES, targetThemes));
    }

    // Validate embeddings exist
    const missingEmbeddings = codes.filter(c => !codeEmbeddings.has(c.id));
    if (missingEmbeddings.length > 0) {
      throw new AlgorithmError(
        `Missing embeddings for ${missingEmbeddings.length}/${codes.length} codes`,
        'qualitative-analysis',
        'validation',
        AlgorithmErrorCode.INVALID_INPUT,
      );
    }

    try {
      // STAGE 1: Hierarchical clustering
      this.logger.log(`${LOG_PREFIX} Stage 1: Hierarchical clustering...`);
      const clusters = await this.hierarchicalClustering(
        codes,
        codeEmbeddings,
        targetThemes,
      );

      this.logger.log(`${LOG_PREFIX} Stage 1 complete: ${clusters.length} clusters formed`);

      // STAGE 2: Calculate theme emergence curve
      this.logger.log(`${LOG_PREFIX} Stage 2: Calculating theme emergence curve...`);
      const emergenceCurve = this.calculateThemeEmergenceCurve(clusters, sources);

      this.logger.log(`${LOG_PREFIX} Stage 2 complete: ${emergenceCurve.length} sources analyzed`);
      this.logEmergenceCurve(emergenceCurve);

      // STAGE 3: Bayesian saturation detection
      this.logger.log(`${LOG_PREFIX} Stage 3: Bayesian saturation detection...`);
      const bayesianResult = this.bayesianSaturationDetection(emergenceCurve);

      this.logger.log(`${LOG_PREFIX} Stage 3 complete:`);
      this.logger.log(`${LOG_PREFIX}   • Saturated: ${bayesianResult.isSaturated}`);
      this.logger.log(`${LOG_PREFIX}   • Posterior probability: ${bayesianResult.posteriorProbability.toFixed(3)}`);
      this.logger.log(`${LOG_PREFIX}   • Saturation point: ${bayesianResult.saturationPoint ?? 'N/A'}`);

      // STAGE 4: Power law fitting
      this.logger.log(`${LOG_PREFIX} Stage 4: Fitting power law to emergence curve...`);
      const powerLawFit = this.fitPowerLawToEmergence(emergenceCurve);

      this.logger.log(`${LOG_PREFIX} Stage 4 complete:`);
      this.logger.log(`${LOG_PREFIX}   • Decay exponent (b): ${powerLawFit.b.toFixed(3)}`);
      this.logger.log(`${LOG_PREFIX}   • R-squared: ${powerLawFit.rSquared.toFixed(3)}`);
      this.logger.log(`${LOG_PREFIX}   • Saturating: ${powerLawFit.saturating}`);

      // STAGE 5: Sensitivity analysis (robustness testing)
      this.logger.log(`${LOG_PREFIX} Stage 5: Sensitivity analysis (${NUM_PERMUTATIONS} permutations)...`);
      const robustness = await this.saturationSensitivityAnalysis(
        codes,
        codeEmbeddings,
        sources,
        targetThemes,
      );

      this.logger.log(`${LOG_PREFIX} Stage 5 complete:`);
      this.logger.log(`${LOG_PREFIX}   • Robustness score: ${robustness.robustnessScore.toFixed(3)}`);
      this.logger.log(`${LOG_PREFIX}   • Robust: ${robustness.isRobust}`);

      // STAGE 6: Generate comprehensive saturation analysis
      this.logger.log(`${LOG_PREFIX} Stage 6: Generating saturation analysis...`);
      const saturationAnalysis = this.generateSaturationAnalysis(
        bayesianResult,
        emergenceCurve,
        powerLawFit,
        robustness,
      );

      this.logger.log(`${LOG_PREFIX} Stage 6 complete:`);
      this.logger.log(`${LOG_PREFIX}   • Confidence score: ${saturationAnalysis.confidenceScore.toFixed(3)}`);
      this.logger.log(`${LOG_PREFIX}   • Recommendation: ${saturationAnalysis.recommendation}`);

      // STAGE 7: Label themes with AI
      this.logger.log(`${LOG_PREFIX} Stage 7: Labeling themes with AI...`);
      const themes = await labelingFunction(clusters, sources);

      this.logger.log(`${LOG_PREFIX} Stage 7 complete: ${themes.length} themes labeled`);

      const executionTime = Date.now() - startTime;

      this.logger.log(`${LOG_PREFIX} Qualitative Analysis pipeline complete:`);
      this.logger.log(`${LOG_PREFIX}   • Themes: ${themes.length}`);
      this.logger.log(`${LOG_PREFIX}   • Saturated: ${saturationAnalysis.isSaturated}`);
      this.logger.log(`${LOG_PREFIX}   • Avg themes per source: ${(themes.length / sources.length).toFixed(2)}`);
      this.logger.log(`${LOG_PREFIX}   • Execution time: ${executionTime}ms`);

      const result: QualitativeAnalysisResult = {
        themes,
        saturationAnalysis,
        sourcesAnalyzed: sources.length,
        avgThemesPerSource: themes.length / sources.length,
        executionTime,
      };

      return result;
    } catch (error: unknown) {
      const message = isError(error) ? error.message : String(error);
      this.logger.error(`${LOG_PREFIX} Pipeline failed: ${message}`, isError(error) ? error.stack : undefined);

      throw new AlgorithmError(
        `Qualitative analysis pipeline failed: ${message}`,
        'qualitative-analysis',
        'pipeline-execution',
        AlgorithmErrorCode.PIPELINE_FAILED,
        isError(error) ? error : undefined,
      );
    }
  }

  /**
   * Hierarchical clustering (bottom-up agglomerative)
   *
   * Algorithm:
   * 1. Start with each code as individual cluster
   * 2. Repeatedly merge two closest clusters
   * 3. Stop when target theme count reached
   *
   * @param codes - Codes to cluster
   * @param codeEmbeddings - Embeddings for similarity calculation
   * @param targetK - Target number of clusters
   * @returns Array of clusters
   */
  private async hierarchicalClustering(
    codes: InitialCode[],
    codeEmbeddings: Map<string, number[]>,
    targetK: number,
  ): Promise<Cluster[]> {
    // Initialize: each code is a cluster
    const clusters: Cluster[] = codes.map(code => ({
      codes: [code],
      centroid: codeEmbeddings.get(code.id) || [],
    }));

    // Merge until we reach target k
    while (clusters.length > targetK) {
      // Find two closest clusters
      let minDistance = Infinity;
      let mergeI = -1;
      let mergeJ = -1;

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const distance = this.mathUtils.euclideanDistance(
            clusters[i].centroid,
            clusters[j].centroid,
          );

          if (distance < minDistance) {
            minDistance = distance;
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      if (mergeI === -1 || mergeJ === -1) {
        break; // No more merges possible
      }

      // Merge clusters i and j
      const mergedCodes = [...clusters[mergeI].codes, ...clusters[mergeJ].codes];
      const mergedCentroid = this.calculateCentroid(mergedCodes, codeEmbeddings);

      const newCluster: Cluster = {
        codes: mergedCodes,
        centroid: mergedCentroid,
      };

      // Remove old clusters and add new one
      clusters.splice(Math.max(mergeI, mergeJ), 1);
      clusters.splice(Math.min(mergeI, mergeJ), 1);
      clusters.push(newCluster);
    }

    return clusters;
  }

  /**
   * Calculate centroid (mean embedding) for a set of codes
   *
   * @param codes - Codes in cluster
   * @param codeEmbeddings - Embeddings map
   * @returns Centroid vector
   */
  private calculateCentroid(
    codes: InitialCode[],
    codeEmbeddings: Map<string, number[]>,
  ): number[] {
    if (codes.length === 0) return [];

    const embeddings = codes
      .map(c => codeEmbeddings.get(c.id))
      .filter((e): e is number[] => e !== undefined);

    if (embeddings.length === 0) return [];

    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    for (const emb of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += emb[i];
      }
    }

    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= embeddings.length;
    }

    return centroid;
  }

  /**
   * Calculate theme emergence curve across sources
   *
   * Shows how many new themes appeared when adding each source
   * Critical for detecting theoretical saturation
   *
   * Algorithm:
   * 1. For each source in order
   * 2. Count how many themes have codes from this source
   * 3. Track which themes are "new" (first appearance)
   * 4. Build emergence curve
   *
   * @param clusters - Theme clusters
   * @param sources - Sources in analysis order
   * @returns Theme emergence points
   */
  private calculateThemeEmergenceCurve(
    clusters: Cluster[],
    sources: SourceContent[],
  ): readonly ThemeEmergencePoint[] {
    const emergenceCurve: ThemeEmergencePoint[] = [];
    const discoveredThemes = new Set<number>();

    for (let sourceIdx = 0; sourceIdx < sources.length; sourceIdx++) {
      const source = sources[sourceIdx];
      let newThemesForSource = 0;

      // Check which themes have codes from this source
      for (let themeIdx = 0; themeIdx < clusters.length; themeIdx++) {
        const cluster = clusters[themeIdx];
        const hasCodeFromSource = cluster.codes.some(
          code => code.sourceId === source.id,
        );

        if (hasCodeFromSource && !discoveredThemes.has(themeIdx)) {
          discoveredThemes.add(themeIdx);
          newThemesForSource++;
        }
      }

      const cumulativeThemes = discoveredThemes.size;
      const percentageNew = cumulativeThemes > 0
        ? (newThemesForSource / cumulativeThemes) * 100
        : 0;

      emergenceCurve.push({
        sourceIndex: sourceIdx,
        sourceTitle: source.title,
        newThemes: newThemesForSource,
        cumulativeThemes,
        percentageNew,
      });
    }

    return Object.freeze(emergenceCurve);
  }

  /**
   * Bayesian saturation detection using Beta distribution
   *
   * Model: Each source either produces new themes (success) or doesn't (failure)
   * Prior: Beta(1, 1) = Uniform prior
   * Likelihood: Binomial (new themes found)
   * Posterior: Beta(α + successes, β + failures)
   *
   * Saturation detected when P(p < 0.2 | data) > 0.8
   * where p = probability of finding new themes
   *
   * Scientific Backing:
   * - Gelman et al. (2013): Bayesian Data Analysis
   * - Kruschke (2014): Doing Bayesian Data Analysis
   *
   * @param emergenceCurve - Theme emergence data
   * @returns Bayesian saturation result
   */
  private bayesianSaturationDetection(
    emergenceCurve: readonly ThemeEmergencePoint[],
  ): BayesianSaturationResult {
    // Prior: Beta(1, 1) = uniform
    let alpha = 1;
    let beta = 1;

    let saturationPoint: number | null = null;

    for (let i = 0; i < emergenceCurve.length; i++) {
      const newThemes = emergenceCurve[i].newThemes;

      if (newThemes > NEW_THEME_THRESHOLD) {
        alpha += 1; // Success: new themes found
      } else {
        beta += 1; // Failure: saturation signal
      }

      // Posterior probability: P(p < 0.2)
      const probSaturated = this.betaCDF(LOW_PROBABILITY_THRESHOLD, alpha, beta);

      if (probSaturated > SATURATION_POSTERIOR_THRESHOLD && saturationPoint === null) {
        saturationPoint = i + 1; // 1-indexed
      }
    }

    // Final posterior
    const posteriorProbability = this.betaCDF(LOW_PROBABILITY_THRESHOLD, alpha, beta);
    const credibleInterval = this.betaCredibleInterval(alpha, beta, 0.95);
    const posteriorMean = alpha / (alpha + beta);

    return {
      isSaturated: posteriorProbability > SATURATION_POSTERIOR_THRESHOLD,
      saturationPoint,
      posteriorProbability,
      credibleInterval: Object.freeze(credibleInterval) as readonly [number, number],
      alpha,
      beta,
      posteriorMean,
    };
  }

  /**
   * Cumulative distribution function (CDF) for Beta distribution
   *
   * Approximation using incomplete beta function
   * Accurate to ~6 decimal places
   *
   * @param x - Value to evaluate CDF at (0-1)
   * @param alpha - Alpha parameter
   * @param beta - Beta parameter
   * @returns P(X ≤ x) where X ~ Beta(α, β)
   */
  private betaCDF(x: number, alpha: number, beta: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Use incomplete beta function: I_x(α, β)
    return this.incompleteBeta(x, alpha, beta);
  }

  /**
   * Incomplete beta function: I_x(a, b) = B_x(a, b) / B(a, b)
   *
   * Numerical approximation using continued fractions
   *
   * @param x - Upper limit of integration (0-1)
   * @param a - First shape parameter
   * @param b - Second shape parameter
   * @returns Regularized incomplete beta value
   */
  private incompleteBeta(x: number, a: number, b: number): number {
    // Use symmetry relation if x > (a+1)/(a+b+2)
    if (x > (a + 1) / (a + b + 2)) {
      return 1 - this.incompleteBeta(1 - x, b, a);
    }

    // Continued fraction approximation
    const lnBeta = this.logBeta(a, b);
    const front = Math.exp(
      Math.log(x) * a +
      Math.log(1 - x) * b -
      lnBeta,
    ) / a;

    return front * this.betaContinuedFraction(x, a, b);
  }

  /**
   * Log of beta function: ln(B(a, b))
   *
   * @param a - First parameter
   * @param b - Second parameter
   * @returns ln(B(a, b))
   */
  private logBeta(a: number, b: number): number {
    return this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b);
  }

  /**
   * Log-gamma function: ln(Γ(x))
   *
   * Uses Lanczos approximation (accurate to ~15 decimal places)
   *
   * @param x - Input value
   * @returns ln(Γ(x))
   */
  private logGamma(x: number): number {
    // Lanczos coefficients (g = 7)
    const coef = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7,
    ];

    if (x < 0.5) {
      return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * x)) - this.logGamma(1 - x);
    }

    x -= 1;
    let a = coef[0];
    for (let i = 1; i < coef.length; i++) {
      a += coef[i] / (x + i);
    }

    const t = x + 7.5;
    return Math.log(Math.sqrt(2 * Math.PI)) + Math.log(a) + (x + 0.5) * Math.log(t) - t;
  }

  /**
   * Continued fraction for incomplete beta function
   *
   * Lentz's algorithm for evaluating continued fractions
   *
   * @param x - Value
   * @param a - First parameter
   * @param b - Second parameter
   * @returns Continued fraction value
   */
  private betaContinuedFraction(x: number, a: number, b: number): number {
    const maxIterations = 200;
    const epsilon = 3e-12;

    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;

    if (Math.abs(d) < epsilon) d = epsilon;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIterations; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d;

      if (Math.abs(d) < epsilon) d = epsilon;
      c = 1 + aa / c;
      if (Math.abs(c) < epsilon) c = epsilon;

      d = 1 / d;
      h *= d * c;

      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d;

      if (Math.abs(d) < epsilon) d = epsilon;
      c = 1 + aa / c;
      if (Math.abs(c) < epsilon) c = epsilon;

      d = 1 / d;
      const del = d * c;
      h *= del;

      if (Math.abs(del - 1) < epsilon) break;
    }

    return h;
  }

  /**
   * Calculate credible interval for Beta distribution
   *
   * Uses inverse CDF (quantile function) to find bounds
   *
   * @param alpha - Alpha parameter
   * @param beta - Beta parameter
   * @param credibility - Credibility level (e.g., 0.95 for 95% CI)
   * @returns [lower, upper] credible interval
   */
  private betaCredibleInterval(
    alpha: number,
    beta: number,
    credibility: number,
  ): [number, number] {
    const tail = (1 - credibility) / 2;
    const lower = this.betaQuantile(tail, alpha, beta);
    const upper = this.betaQuantile(1 - tail, alpha, beta);
    return [lower, upper];
  }

  /**
   * Quantile function (inverse CDF) for Beta distribution
   *
   * Uses Newton-Raphson method to find x such that CDF(x) = p
   *
   * @param p - Probability (0-1)
   * @param alpha - Alpha parameter
   * @param beta - Beta parameter
   * @returns Quantile value
   */
  private betaQuantile(p: number, alpha: number, beta: number): number {
    if (p === 0) return 0;
    if (p === 1) return 1;

    // Initial guess using mean
    let x = alpha / (alpha + beta);

    // Newton-Raphson iterations
    for (let i = 0; i < 20; i++) {
      const cdf = this.betaCDF(x, alpha, beta);
      const pdf = this.betaPDF(x, alpha, beta);

      if (pdf === 0) break;

      const delta = (cdf - p) / pdf;
      x -= delta;

      // Clamp to valid range
      x = Math.max(0.0001, Math.min(0.9999, x));

      if (Math.abs(delta) < 1e-8) break;
    }

    return x;
  }

  /**
   * Probability density function (PDF) for Beta distribution
   *
   * @param x - Value (0-1)
   * @param alpha - Alpha parameter
   * @param beta - Beta parameter
   * @returns Density at x
   */
  private betaPDF(x: number, alpha: number, beta: number): number {
    if (x <= 0 || x >= 1) return 0;

    const logPdf = (alpha - 1) * Math.log(x) +
      (beta - 1) * Math.log(1 - x) -
      this.logBeta(alpha, beta);

    return Math.exp(logPdf);
  }

  /**
   * Fit power law to theme emergence: y = a × x^(-b)
   *
   * Uses log-linear regression: log(y) = log(a) - b × log(x)
   *
   * Interpretation:
   * - b > 0.5: Rapid saturation (strong decline in new themes)
   * - b < 0.5: Slow saturation (linear or gradual decline)
   * - rSquared > 0.7: Good model fit
   *
   * @param emergenceCurve - Theme emergence data
   * @returns Power law fit parameters
   */
  private fitPowerLawToEmergence(
    emergenceCurve: readonly ThemeEmergencePoint[],
  ): PowerLawFit {
    if (emergenceCurve.length < 3) {
      return { a: 0, b: 0, rSquared: 0, saturating: false };
    }

    // Extract x (source index) and y (new themes)
    const x = emergenceCurve.map((_, i) => i + 1);
    const y = emergenceCurve.map(p => p.newThemes);

    // Transform to log space
    const logX = x.map(v => Math.log(v));
    const logY = y.map(v => Math.log(Math.max(v, 0.1))); // Avoid log(0)

    // Linear regression: log(y) = intercept + slope × log(x)
    const regression = this.linearRegression(logX, logY);

    const a = Math.exp(regression.intercept);
    const b = -regression.slope; // Negative slope → positive b
    const rSquared = regression.rSquared;

    const saturating = b > POWER_LAW_THRESHOLD && rSquared > R_SQUARED_THRESHOLD;

    return { a, b, rSquared, saturating };
  }

  /**
   * Linear regression: y = intercept + slope × x
   *
   * Uses least squares method
   *
   * @param x - Independent variable
   * @param y - Dependent variable
   * @returns Regression parameters
   */
  private linearRegression(
    x: readonly number[],
    y: readonly number[],
  ): { slope: number; intercept: number; rSquared: number } {
    const n = x.length;

    const sumX = x.reduce((s, v) => s + v, 0);
    const sumY = y.reduce((s, v) => s + v, 0);
    const sumXY = x.reduce((s, v, i) => s + v * y[i], 0);
    const sumX2 = x.reduce((s, v) => s + v * v, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    const ssTotal = y.reduce((s, v) => s + (v - meanY) ** 2, 0);
    const ssResidual = y.reduce((s, v, i) => {
      const predicted = intercept + slope * x[i];
      return s + (v - predicted) ** 2;
    }, 0);

    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

    return { slope, intercept, rSquared };
  }

  /**
   * Saturation sensitivity analysis (order-independence check)
   *
   * Tests saturation detection across multiple random source orderings
   * Robust saturation should be detected regardless of source order
   *
   * Algorithm:
   * 1. Shuffle sources randomly (100 permutations)
   * 2. Re-run saturation detection for each permutation
   * 3. Calculate proportion showing saturation (robustness score)
   *
   * @param codes - Codes to cluster
   * @param codeEmbeddings - Embeddings map
   * @param sources - Sources to permute
   * @param targetThemes - Target theme count
   * @returns Robustness analysis
   */
  private async saturationSensitivityAnalysis(
    codes: InitialCode[],
    codeEmbeddings: Map<string, number[]>,
    sources: SourceContent[],
    targetThemes: number,
  ): Promise<RobustnessAnalysis> {
    const results: boolean[] = [];

    for (let i = 0; i < NUM_PERMUTATIONS; i++) {
      // Randomly shuffle sources
      const shuffledSources = this.shuffleArray([...sources]);

      // Re-run clustering and saturation detection
      const clusters = await this.hierarchicalClustering(
        codes,
        codeEmbeddings,
        targetThemes,
      );

      const emergenceCurve = this.calculateThemeEmergenceCurve(
        clusters,
        shuffledSources,
      );

      const bayesianResult = this.bayesianSaturationDetection(emergenceCurve);

      results.push(bayesianResult.isSaturated);
    }

    const robustnessScore = results.filter(r => r).length / results.length;
    const isRobust = robustnessScore > ROBUSTNESS_THRESHOLD;

    return {
      robustnessScore,
      numPermutations: NUM_PERMUTATIONS,
      isRobust,
      permutationResults: Object.freeze(results),
    };
  }

  /**
   * Fisher-Yates shuffle algorithm
   *
   * @param array - Array to shuffle (mutates in place)
   * @returns Shuffled array
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate comprehensive saturation analysis
   *
   * Combines Bayesian, power law, and robustness signals
   * Calculates confidence score (geometric mean)
   * Generates actionable recommendation
   *
   * @param bayesian - Bayesian saturation result
   * @param emergenceCurve - Theme emergence data
   * @param powerLawFit - Power law fit
   * @param robustness - Robustness analysis
   * @returns Comprehensive saturation analysis
   */
  private generateSaturationAnalysis(
    bayesian: BayesianSaturationResult,
    emergenceCurve: readonly ThemeEmergencePoint[],
    powerLawFit: PowerLawFit,
    robustness: RobustnessAnalysis,
  ): SaturationAnalysis {
    // Confidence score: geometric mean of 3 signals
    const confidenceScore = Math.pow(
      bayesian.posteriorProbability * powerLawFit.rSquared * robustness.robustnessScore,
      1 / 3,
    );

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      bayesian,
      powerLawFit,
      robustness,
      confidenceScore,
      emergenceCurve,
    );

    const isSaturated = bayesian.isSaturated && powerLawFit.saturating && robustness.isRobust;

    return {
      isSaturated,
      saturationPoint: bayesian.saturationPoint,
      bayesian,
      emergenceCurve,
      powerLawFit,
      robustness,
      confidenceScore,
      recommendation,
    };
  }

  /**
   * Generate human-readable recommendation
   *
   * @param bayesian - Bayesian result
   * @param powerLaw - Power law fit
   * @param robustness - Robustness analysis
   * @param confidence - Confidence score
   * @param emergenceCurve - Theme emergence data for calculating collection targets
   * @returns Recommendation text
   */
  private generateRecommendation(
    bayesian: BayesianSaturationResult,
    powerLaw: PowerLawFit,
    robustness: RobustnessAnalysis,
    confidence: number,
    emergenceCurve: readonly ThemeEmergencePoint[],
  ): string {
    if (bayesian.isSaturated && powerLaw.saturating && robustness.isRobust) {
      return `HIGH CONFIDENCE SATURATION (${(confidence * 100).toFixed(0)}%): ` +
        `All 3 signals converge. Theoretical saturation reached. ` +
        `Collecting additional sources unlikely to yield new themes. ` +
        `Recommendation: Proceed to analysis.`;
    }

    if (bayesian.isSaturated && powerLaw.saturating) {
      return `MODERATE SATURATION (${(confidence * 100).toFixed(0)}%): ` +
        `Bayesian and power law signals agree. ` +
        `Robustness score: ${(robustness.robustnessScore * 100).toFixed(0)}%. ` +
        `Recommendation: Consider collecting 2-3 more sources to confirm saturation.`;
    }

    if (bayesian.isSaturated) {
      return `WEAK SATURATION SIGNAL (${(confidence * 100).toFixed(0)}%): ` +
        `Only Bayesian signal detected. Power law and robustness weak. ` +
        `Recommendation: Collect 5-10 more sources to reach robust saturation.`;
    }

    return `NO SATURATION (${(confidence * 100).toFixed(0)}%): ` +
      `New themes still emerging. ` +
      `Posterior probability: ${(bayesian.posteriorProbability * 100).toFixed(0)}%. ` +
      `Recommendation: Continue data collection. ` +
      `Target: ${Math.ceil((emergenceCurve.length * 1.5))} total sources.`;
  }

  /**
   * Log emergence curve for debugging
   *
   * @param emergenceCurve - Emergence data
   */
  private logEmergenceCurve(emergenceCurve: readonly ThemeEmergencePoint[]): void {
    this.logger.debug(`${LOG_PREFIX} Theme emergence curve:`);

    for (const point of emergenceCurve.slice(0, 10)) {
      this.logger.debug(
        `${LOG_PREFIX}   Source ${point.sourceIndex + 1}: ` +
        `+${point.newThemes} new, ${point.cumulativeThemes} total ` +
        `(${point.percentageNew.toFixed(1)}% new)`,
      );
    }

    if (emergenceCurve.length > 10) {
      this.logger.debug(`${LOG_PREFIX}   ... (${emergenceCurve.length - 10} more sources)`);
    }
  }
}
