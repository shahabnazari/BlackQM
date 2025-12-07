/**
 * Phase 10.98 Day 3-4: Survey Construction Pipeline Service
 *
 * Purpose-specific algorithm for SURVEY_CONSTRUCTION research purpose
 * Implements depth-focused hierarchical clustering with psychometric validation
 *
 * Scientific Backing:
 * - Churchill, G. A. (1979). A paradigm for developing better measures of marketing constructs.
 * - DeVellis, R. F. (2016). Scale Development: Theory and Applications (4th ed).
 * - Nunnally, J. C., & Bernstein, I. H. (1994). Psychometric Theory.
 *
 * Key Features:
 * - Hierarchical clustering with internal consistency monitoring
 * - Cronbach's alpha calculation (α ≥ 0.70 = acceptable reliability)
 * - Construct validity estimation
 * - Quality gates: Reject constructs with α < 0.60
 * - Merge stopping: Halt when α drops below 0.70
 * - Produces 5-15 robust constructs with high internal consistency
 *
 * Algorithm:
 * 1. Start with all codes as individual clusters
 * 2. Find best merge candidates (highest alpha after merge)
 * 3. Only merge if resulting alpha ≥ 0.70 (DeVellis 2016 threshold)
 * 4. Stop when target construct count reached OR alpha drops
 * 5. Calculate psychometric metrics for each construct
 * 6. Reject low-quality constructs (α < 0.60)
 * 7. Label constructs with AI
 *
 * @enterprise Features:
 * - Zero `any` types (strict TypeScript)
 * - Enterprise-grade error handling with AlgorithmError
 * - Comprehensive logging with context
 * - Performance monitoring
 * - Scientific validation
 *
 * @author VQMethod Platform
 * @version 2.0
 * @date 2025-11-24
 */

import { Injectable, Logger } from '@nestjs/common';
import type { InitialCode, CandidateTheme, SourceContent } from '../types/unified-theme-extraction.types';
import type {
  Cluster,
  SurveyConstructionResult,
  ConstructWithMetrics,
  PsychometricMetrics,
  AlgorithmErrorCode,
} from '../types/phase-10.98.types';
import { AlgorithmError, isError } from '../types/phase-10.98.types';
import { MathematicalUtilitiesService } from './mathematical-utilities.service';

/** Logging prefix for consistent log formatting */
const LOG_PREFIX = '[SurveyConstruction]';

/** Minimum acceptable Cronbach's alpha (DeVellis 2016) */
const ALPHA_QUALITY_GATE = 0.60;

/** Preferred Cronbach's alpha for merging (DeVellis 2016) */
const ALPHA_MERGE_THRESHOLD = 0.70;

/** Excellent internal consistency (Nunnally 1994) */
const ALPHA_EXCELLENT = 0.90;

/** Good internal consistency (DeVellis 2016) */
const ALPHA_GOOD = 0.80;

/** Acceptable internal consistency (DeVellis 2016) */
const ALPHA_ACCEPTABLE = 0.70;

/** Questionable internal consistency (George & Mallery 2003) */
const ALPHA_QUESTIONABLE = 0.60;

/** Poor internal consistency (George & Mallery 2003) */
const ALPHA_POOR = 0.50;

/** Minimum construct count (Churchill 1979) */
const MIN_CONSTRUCTS = 5;

/** Maximum construct count (typical survey limit) */
const MAX_CONSTRUCTS = 15;

@Injectable()
export class SurveyConstructionPipelineService {
  private readonly logger = new Logger(SurveyConstructionPipelineService.name);

  constructor(
    private readonly mathUtils: MathematicalUtilitiesService,
  ) {}

  /**
   * Execute Survey Construction Pipeline
   *
   * Produces 5-15 robust survey constructs with high internal consistency (α ≥ 0.70)
   * Uses hierarchical clustering with psychometric validation at each merge step
   *
   * @param codes - Initial codes extracted from sources
   * @param codeEmbeddings - Semantic embeddings for each code (for similarity)
   * @param sources - Source content for provenance
   * @param targetConstructs - Target number of constructs (5-15)
   * @param labelingFunction - AI labeling function for themes
   * @returns Survey construction result with validated constructs
   * @throws AlgorithmError if pipeline fails
   *
   * @example
   * const result = await pipeline.executeSurveyConstructionPipeline(
   *   codes, embeddings, sources, 10, labelFunc
   * );
   * console.log(`Constructs: ${result.constructs.length}, Avg α: ${result.avgCronbachAlpha}`);
   */
  async executeSurveyConstructionPipeline(
    codes: InitialCode[],
    codeEmbeddings: Map<string, number[]>,
    sources: SourceContent[],
    targetConstructs: number = 10,
    labelingFunction: (clusters: Cluster[], sources: SourceContent[]) => Promise<CandidateTheme[]>,
  ): Promise<SurveyConstructionResult> {
    const startTime = Date.now();

    this.logger.log(`${LOG_PREFIX} Starting Survey Construction pipeline`);
    this.logger.log(`${LOG_PREFIX}   • Codes: ${codes.length}`);
    this.logger.log(`${LOG_PREFIX}   • Sources: ${sources.length}`);
    this.logger.log(`${LOG_PREFIX}   • Target constructs: ${targetConstructs}`);

    // Validate inputs
    if (codes.length === 0) {
      throw new AlgorithmError(
        'Cannot cluster empty code array',
        'survey-construction',
        'validation',
        'INVALID_INPUT' as AlgorithmErrorCode,
      );
    }

    if (targetConstructs < MIN_CONSTRUCTS || targetConstructs > MAX_CONSTRUCTS) {
      this.logger.warn(
        `${LOG_PREFIX} Target constructs ${targetConstructs} outside recommended range [${MIN_CONSTRUCTS}, ${MAX_CONSTRUCTS}]. Clamping.`,
      );
      targetConstructs = Math.max(MIN_CONSTRUCTS, Math.min(MAX_CONSTRUCTS, targetConstructs));
    }

    // Validate embeddings exist
    const missingEmbeddings = codes.filter(c => !codeEmbeddings.has(c.id));
    if (missingEmbeddings.length > 0) {
      throw new AlgorithmError(
        `Missing embeddings for ${missingEmbeddings.length}/${codes.length} codes`,
        'survey-construction',
        'validation',
        'INVALID_INPUT' as AlgorithmErrorCode,
      );
    }

    try {
      // STAGE 1: Hierarchical clustering with internal consistency monitoring
      this.logger.log(`${LOG_PREFIX} Stage 1: Hierarchical clustering with alpha monitoring...`);
      const { clusters, mergesPerformed, earlyStop } = await this.hierarchicalClusteringWithAlpha(
        codes,
        codeEmbeddings,
        targetConstructs,
      );

      this.logger.log(`${LOG_PREFIX} Stage 1 complete:`);
      this.logger.log(`${LOG_PREFIX}   • Clusters formed: ${clusters.length}`);
      this.logger.log(`${LOG_PREFIX}   • Merges performed: ${mergesPerformed}`);
      this.logger.log(`${LOG_PREFIX}   • Early stop: ${earlyStop}`);

      // STAGE 2: Calculate psychometric metrics for each cluster
      this.logger.log(`${LOG_PREFIX} Stage 2: Calculating psychometric metrics...`);
      const clustersWithMetrics = await Promise.all(
        clusters.map(async cluster => this.calculatePsychometricMetrics(cluster, codeEmbeddings)),
      );

      // STAGE 3: Quality gate - reject low-quality constructs
      this.logger.log(`${LOG_PREFIX} Stage 3: Applying quality gates (α ≥ ${ALPHA_QUALITY_GATE})...`);
      const validConstructs = clustersWithMetrics.filter(c => c.cronbachAlpha >= ALPHA_QUALITY_GATE);
      const rejectedCount = clustersWithMetrics.length - validConstructs.length;

      if (rejectedCount > 0) {
        this.logger.warn(`${LOG_PREFIX} Rejected ${rejectedCount} constructs with α < ${ALPHA_QUALITY_GATE}`);
      }

      if (validConstructs.length === 0) {
        throw new AlgorithmError(
          'No constructs passed quality gate (all α < 0.60)',
          'survey-construction',
          'quality-gate',
          'QUALITY_GATE_FAILED' as AlgorithmErrorCode,
        );
      }

      // STAGE 4: Label constructs with AI
      this.logger.log(`${LOG_PREFIX} Stage 4: Labeling constructs with AI...`);
      const clustersForLabeling: Cluster[] = validConstructs.map(c => ({
        codes: c.codes,
        centroid: c.centroid,
      }));

      const labeledThemes = await labelingFunction(clustersForLabeling, sources);

      // STAGE 5: Combine metrics with labels
      this.logger.log(`${LOG_PREFIX} Stage 5: Creating final constructs with metrics...`);
      const finalConstructs: ConstructWithMetrics[] = validConstructs.map((cluster, index) => {
        const theme = labeledThemes[index];
        return {
          ...cluster,
          label: theme?.label || `Construct ${index + 1}`,
          description: theme?.description || '',
          passedQualityGate: cluster.cronbachAlpha >= ALPHA_QUALITY_GATE,
          suggestedScale: this.suggestLikertScale(cluster.itemCount),
        };
      });

      // Calculate summary statistics
      const alphas = finalConstructs.map(c => c.metrics.cronbachAlpha);
      const avgAlpha = alphas.reduce((sum, a) => sum + a, 0) / alphas.length;
      const minAlpha = Math.min(...alphas);
      const maxAlpha = Math.max(...alphas);

      const executionTime = Date.now() - startTime;

      this.logger.log(`${LOG_PREFIX} Survey Construction pipeline complete:`);
      this.logger.log(`${LOG_PREFIX}   • Valid constructs: ${finalConstructs.length}`);
      this.logger.log(`${LOG_PREFIX}   • Constructs rejected: ${rejectedCount}`);
      this.logger.log(`${LOG_PREFIX}   • Avg Cronbach's α: ${avgAlpha.toFixed(3)}`);
      this.logger.log(`${LOG_PREFIX}   • Min Cronbach's α: ${minAlpha.toFixed(3)}`);
      this.logger.log(`${LOG_PREFIX}   • Max Cronbach's α: ${maxAlpha.toFixed(3)}`);
      this.logger.log(`${LOG_PREFIX}   • Execution time: ${executionTime}ms`);

      const result: SurveyConstructionResult = {
        constructs: finalConstructs,
        constructsRejected: rejectedCount,
        avgCronbachAlpha: avgAlpha,
        minCronbachAlpha: minAlpha,
        maxCronbachAlpha: maxAlpha,
        mergesPerformed,
        earlyStopDueToAlpha: earlyStop,
        executionTime,
      };

      return result;
    } catch (error: unknown) {
      const message = isError(error) ? error.message : String(error);
      this.logger.error(`${LOG_PREFIX} Pipeline failed: ${message}`, isError(error) ? error.stack : undefined);

      throw new AlgorithmError(
        `Survey construction pipeline failed: ${message}`,
        'survey-construction',
        'pipeline-execution',
        'PIPELINE_FAILED' as AlgorithmErrorCode,
        isError(error) ? error : undefined,
      );
    }
  }

  /**
   * Hierarchical clustering with internal consistency monitoring
   *
   * Performs agglomerative clustering but ONLY merges if resulting Cronbach's alpha ≥ 0.70
   * Stops early if no valid merges remain (protects internal consistency)
   *
   * @param codes - Initial codes
   * @param embeddings - Code embeddings
   * @param targetClusters - Target number of clusters
   * @returns Clusters, merge count, early stop flag
   * @private
   */
  private async hierarchicalClusteringWithAlpha(
    codes: InitialCode[],
    embeddings: Map<string, number[]>,
    targetClusters: number,
  ): Promise<{ clusters: Cluster[]; mergesPerformed: number; earlyStop: boolean }> {
    // Initialize: each code as its own cluster
    let clusters: Cluster[] = codes.map(code => ({
      codes: [code],
      centroid: embeddings.get(code.id)!.slice(), // Clone embedding
    }));

    let mergesPerformed = 0;
    let earlyStop = false;

    this.logger.log(`${LOG_PREFIX} Starting with ${clusters.length} clusters, target: ${targetClusters}`);

    // Merge until target reached
    while (clusters.length > targetClusters) {
      // Find best merge candidates (pair with highest alpha after merge)
      const mergeResult = this.findBestMergeCandidates(clusters, embeddings);

      if (!mergeResult) {
        // No valid merges found (all would drop alpha below threshold)
        this.logger.warn(
          `${LOG_PREFIX} No valid merges remaining at ${clusters.length} clusters. Stopping early.`,
        );
        earlyStop = true;
        break;
      }

      const { index1, index2, alphaAfterMerge } = mergeResult;

      this.logger.debug(
        `${LOG_PREFIX} Merging clusters ${index1} + ${index2} (α after merge: ${alphaAfterMerge.toFixed(3)})`,
      );

      // Perform merge
      clusters = this.mergeClusters(clusters, index1, index2, embeddings);
      mergesPerformed++;

      if (mergesPerformed % 10 === 0) {
        this.logger.log(`${LOG_PREFIX} Progress: ${clusters.length} clusters remaining (${mergesPerformed} merges)`);
      }
    }

    return { clusters, mergesPerformed, earlyStop };
  }

  /**
   * Find best pair of clusters to merge
   *
   * Evaluates all possible cluster pairs and selects the pair that:
   * 1. Results in highest Cronbach's alpha after merge
   * 2. Has alpha ≥ 0.70 after merge (quality threshold)
   *
   * @param clusters - Current clusters
   * @param embeddings - Code embeddings
   * @returns Best merge candidates or null if no valid merges
   * @private
   */
  private findBestMergeCandidates(
    clusters: Cluster[],
    embeddings: Map<string, number[]>,
  ): { index1: number; index2: number; alphaAfterMerge: number } | null {
    let bestMerge: { index1: number; index2: number; alphaAfterMerge: number } | null = null;
    let highestAlpha = ALPHA_MERGE_THRESHOLD; // Must beat this threshold

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        // Simulate merge
        const mergedCodes = [...clusters[i].codes, ...clusters[j].codes];

        // Calculate what alpha would be after merge
        const alphaAfterMerge = this.calculateCronbachAlphaForCodes(mergedCodes, embeddings);

        // Keep if this is the best valid merge so far
        if (alphaAfterMerge >= ALPHA_MERGE_THRESHOLD && alphaAfterMerge > highestAlpha) {
          bestMerge = { index1: i, index2: j, alphaAfterMerge };
          highestAlpha = alphaAfterMerge;
        }
      }
    }

    return bestMerge;
  }

  /**
   * Merge two clusters
   *
   * Combines codes from two clusters and recalculates centroid
   *
   * @param clusters - Current clusters
   * @param index1 - First cluster index
   * @param index2 - Second cluster index
   * @param embeddings - Code embeddings
   * @returns New cluster array with merged cluster
   * @private
   */
  private mergeClusters(
    clusters: Cluster[],
    index1: number,
    index2: number,
    embeddings: Map<string, number[]>,
  ): Cluster[] {
    const cluster1 = clusters[index1];
    const cluster2 = clusters[index2];

    // Merge codes
    const mergedCodes = [...cluster1.codes, ...cluster2.codes];

    // Recalculate centroid
    const codeEmbeddings = mergedCodes.map(code => embeddings.get(code.id)!);
    const mergedCentroid = this.mathUtils.calculateCentroid(codeEmbeddings);

    const mergedCluster: Cluster = {
      codes: mergedCodes,
      centroid: mergedCentroid,
    };

    // Build new cluster array (remove index2 first to preserve index1's position)
    const newClusters = clusters.filter((_, idx) => idx !== index1 && idx !== index2);
    newClusters.push(mergedCluster);

    return newClusters;
  }

  /**
   * Calculate Cronbach's alpha for a cluster
   *
   * CRITICAL FIX: Implements correct Cronbach's alpha formula
   * Previously used Spearman-Brown formula which gave incorrect reliability estimates
   *
   * Formula (Cronbach 1951):
   * α = (k / (k - 1)) * (1 - Σσ²ᵢ / σ²ₜ)
   *
   * Where:
   * - k = number of items (codes)
   * - σ²ᵢ = variance of item i across dimensions
   * - σ²ₜ = variance of total score (sum across items) across dimensions
   *
   * For embeddings:
   * - Each code's embedding is treated as a multi-dimensional "item"
   * - Variance is calculated across embedding dimensions
   * - Total score = sum of all code embeddings per dimension
   *
   * Scientific References:
   * - Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests
   * - Nunnally, J. C. (1994). Psychometric Theory (3rd ed.)
   *
   * @param codes - Codes in cluster
   * @param embeddings - Code embeddings
   * @returns Cronbach's alpha (0-1)
   * @private
   */
  private calculateCronbachAlphaForCodes(codes: InitialCode[], embeddings: Map<string, number[]>): number {
    const k = codes.length;

    // Edge case: single item has undefined alpha
    if (k < 2) {
      return 0.0;
    }

    // Get embeddings for all codes
    const codeEmbeddings = codes.map(code => embeddings.get(code.id)!);

    // Validate all embeddings have same dimension
    const dimensions = codeEmbeddings[0]?.length || 0;
    if (dimensions === 0) {
      this.logger.warn('[Survey Construction] Empty embeddings, returning alpha = 0.0');
      return 0.0;
    }

    for (let i = 1; i < codeEmbeddings.length; i++) {
      if (codeEmbeddings[i].length !== dimensions) {
        this.logger.error(
          `[Survey Construction] Inconsistent embedding dimensions: ${codeEmbeddings[i].length} !== ${dimensions}`
        );
        return 0.0;
      }
    }

    // CRITICAL FIX: Calculate item variances (variance of each code's embedding dimensions)
    const itemVariances: number[] = [];
    for (const embedding of codeEmbeddings) {
      const mean = embedding.reduce((sum, val) => sum + val, 0) / dimensions;
      const variance = embedding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dimensions;
      itemVariances.push(variance);
    }

    // CRITICAL FIX: Calculate total score variance
    // Total score = sum of all embeddings per dimension
    const totalScores: number[] = [];
    for (let d = 0; d < dimensions; d++) {
      const dimSum = codeEmbeddings.reduce((sum, emb) => sum + emb[d], 0);
      totalScores.push(dimSum);
    }

    const meanTotal = totalScores.reduce((sum, val) => sum + val, 0) / dimensions;
    const totalVariance = totalScores.reduce((sum, val) => sum + Math.pow(val - meanTotal, 2), 0) / dimensions;

    // Avoid division by zero
    if (totalVariance === 0) {
      this.logger.warn('[Survey Construction] Total variance is zero, returning alpha = 0.0');
      return 0.0;
    }

    // CRITICAL FIX: Cronbach's alpha formula (CORRECT)
    // α = (k / (k - 1)) * (1 - Σσ²ᵢ / σ²ₜ)
    const sumItemVariances = itemVariances.reduce((sum, v) => sum + v, 0);
    const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);

    // Clamp to valid range [0, 1]
    const clampedAlpha = Math.max(0, Math.min(1, alpha));

    this.logger.debug(
      `[Survey Construction] Calculated Cronbach's α = ${clampedAlpha.toFixed(3)} for ${k} items (sum item var: ${sumItemVariances.toFixed(3)}, total var: ${totalVariance.toFixed(3)})`
    );

    return clampedAlpha;
  }

  /**
   * Calculate comprehensive psychometric metrics for a cluster
   *
   * @param cluster - Cluster to evaluate
   * @param embeddings - Code embeddings
   * @returns Cluster with psychometric metrics attached
   * @private
   */
  private async calculatePsychometricMetrics(
    cluster: Cluster,
    embeddings: Map<string, number[]>,
  ): Promise<Cluster & { cronbachAlpha: number; itemCount: number; metrics: PsychometricMetrics }> {
    const k = cluster.codes.length;
    const codeEmbeddings = cluster.codes.map(code => embeddings.get(code.id)!);

    // Calculate Cronbach's alpha
    const cronbachAlpha = this.calculateCronbachAlphaForCodes(cluster.codes, embeddings);

    // Calculate item-total correlations
    const centroid = this.mathUtils.calculateCentroid(codeEmbeddings);
    const itemTotalCorrelations = codeEmbeddings.map(emb => this.mathUtils.cosineSimilarity(emb, centroid));

    // Calculate average inter-item correlation
    const similarities: number[] = [];
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        similarities.push(this.mathUtils.cosineSimilarity(codeEmbeddings[i], codeEmbeddings[j]));
      }
    }
    const avgInterItemCorr = similarities.length > 0
      ? similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length
      : 0;

    // Estimate construct validity (simplified: based on item-total correlations)
    const validItemCount = itemTotalCorrelations.filter(r => r > 0.30).length;
    const constructValidity = validItemCount / k;

    // Classify reliability level (George & Mallery 2003)
    let reliabilityLevel: PsychometricMetrics['reliabilityLevel'];
    if (cronbachAlpha >= ALPHA_EXCELLENT) reliabilityLevel = 'excellent';
    else if (cronbachAlpha >= ALPHA_GOOD) reliabilityLevel = 'good';
    else if (cronbachAlpha >= ALPHA_ACCEPTABLE) reliabilityLevel = 'acceptable';
    else if (cronbachAlpha >= ALPHA_QUESTIONABLE) reliabilityLevel = 'questionable';
    else if (cronbachAlpha >= ALPHA_POOR) reliabilityLevel = 'poor';
    else reliabilityLevel = 'unacceptable';

    const metrics: PsychometricMetrics = {
      cronbachAlpha,
      itemTotalCorrelations,
      avgInterItemCorrelation: avgInterItemCorr,
      constructValidity,
      itemCount: k,
      reliabilityLevel,
    };

    return {
      ...cluster,
      cronbachAlpha,
      itemCount: k,
      metrics,
    };
  }

  /**
   * Suggest appropriate Likert scale type based on item count
   *
   * @param itemCount - Number of items in construct
   * @returns Suggested scale type
   * @private
   */
  private suggestLikertScale(itemCount: number): ConstructWithMetrics['suggestedScale'] {
    if (itemCount <= 3) {
      return 'visual-analog'; // Few items → continuous scale
    } else if (itemCount <= 6) {
      return 'likert-7'; // Moderate items → 7-point Likert
    } else {
      return 'likert-5'; // Many items → 5-point Likert (less respondent fatigue)
    }
  }
}
