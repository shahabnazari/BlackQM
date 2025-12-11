/**
 * Phase 10.113 Week 3: Meta-Theme Discovery Service
 *
 * Hierarchical theme extraction from meta-themes to sub-themes:
 * - Level 1: Meta-Theme Discovery (5-8 high-level clusters)
 * - Level 2: Sub-Theme Extraction (3-5 per meta-theme)
 *
 * Netflix-Grade Standards:
 * - Zero `any` types
 * - O(n log n) clustering complexity
 * - Strict TypeScript with readonly interfaces
 * - Comprehensive error handling
 * - Progress callbacks for UI feedback
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Input: Papers[]                                            │
 * │      ↓                                                      │
 * │  Stage 1: Generate embeddings (LocalEmbeddingService)       │
 * │      ↓                                                      │
 * │  Stage 2: K-means++ clustering → 5-8 meta-themes            │
 * │      ↓                                                      │
 * │  Stage 3: Sub-clustering per meta-theme → 3-5 sub-themes    │
 * │      ↓                                                      │
 * │  Stage 4: Label generation (TF-based or AI)                 │
 * │      ↓                                                      │
 * │  Output: HierarchicalExtractionResult                       │
 * └─────────────────────────────────────────────────────────────┘
 *
 * @author Phase 10.113 - Hierarchical Theme Extraction
 * @date December 2025
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { LocalEmbeddingService } from './local-embedding.service';
import { KMeansClusteringService } from './kmeans-clustering.service';
import { MathematicalUtilitiesService } from './mathematical-utilities.service';
import { ThemeFitScoringService } from './theme-fit-scoring.service';
import type { Paper } from '../dto/literature.dto';
import type { InitialCode } from '../types/unified-theme-extraction.types';
import type { Cluster } from '../types/phase-10.98.types';
import {
  type MetaTheme,
  type SubTheme,
  type HierarchicalExtractionResult,
  type HierarchicalExtractionConfig,
  type HierarchicalQualityMetrics,
  type HierarchicalProgressCallback,
  type HierarchicalPaperInput,
  type PaperWithEmbedding,
  type MutableMetaTheme,
  type MutableSubTheme,
  HierarchicalExtractionStage,
  DEFAULT_HIERARCHICAL_CONFIG,
} from '../types/hierarchical-theme.types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Minimum papers required for hierarchical extraction
 */
const MIN_PAPERS_FOR_EXTRACTION = 10;

/**
 * Optimal k calculation: k = sqrt(n/2), capped at max
 */
const K_SELECTION_DIVISOR = 2;

/**
 * Number of representative papers to select per cluster
 */
const REPRESENTATIVE_PAPERS_COUNT = 3;

/**
 * Controversy indicator patterns for theme-level analysis
 */
const CONTROVERSY_PATTERNS: readonly RegExp[] = [
  /\bdebate\b/i,
  /\bcontrovers/i,
  /\bdisagree/i,
  /\bopposing\b/i,
  /\bchallenge/i,
  /\bcritici/i,
  /\balternative view/i,
  /\bcontrast/i,
] as const;

/**
 * Stop words for keyword extraction
 */
const STOP_WORDS = new Set<string>([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'this', 'that', 'these',
  'those', 'which', 'what', 'who', 'whom', 'we', 'our', 'their', 'its',
  'study', 'research', 'paper', 'article', 'review', 'analysis', 'results',
  'method', 'methods', 'approach', 'using', 'based', 'findings', 'show',
  'shows', 'showed', 'found', 'suggest', 'suggests', 'suggested',
]);

/**
 * Minimum word length for keywords
 */
const MIN_KEYWORD_LENGTH = 3;

/**
 * Maximum keywords per theme
 */
const MAX_KEYWORDS_PER_THEME = 10;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

@Injectable()
export class MetaThemeDiscoveryService {
  private readonly logger = new Logger(MetaThemeDiscoveryService.name);
  private static readonly LOG_PREFIX = '[MetaThemeDiscovery]';

  constructor(
    private readonly embeddingService: LocalEmbeddingService,
    private readonly kmeansService: KMeansClusteringService,
    private readonly mathUtils: MathematicalUtilitiesService,
    private readonly themeFitScoring: ThemeFitScoringService,
  ) {
    this.logger.log('✅ [Phase 10.113 Week 3] MetaThemeDiscoveryService initialized');
    this.logger.log('   Hierarchical extraction: Level 1 (meta-themes) + Level 2 (sub-themes)');
  }

  /**
   * Extract hierarchical themes from papers
   *
   * @param papers - Papers to analyze
   * @param config - Optional extraction configuration
   * @param progressCallback - Optional progress callback
   * @param signal - Optional AbortSignal for cancellation
   * @returns Hierarchical extraction result with meta-themes and sub-themes
   */
  async extractHierarchicalThemes(
    papers: readonly HierarchicalPaperInput[],
    config: Partial<HierarchicalExtractionConfig> = {},
    progressCallback?: HierarchicalProgressCallback,
    signal?: AbortSignal,
  ): Promise<HierarchicalExtractionResult> {
    const startTime = Date.now();
    const mergedConfig: HierarchicalExtractionConfig = {
      ...DEFAULT_HIERARCHICAL_CONFIG,
      ...config,
    };

    this.logger.log(
      `${MetaThemeDiscoveryService.LOG_PREFIX} Starting hierarchical extraction for ${papers.length} papers`,
    );
    this.logger.log(
      `   Config: metaThemes=${mergedConfig.minMetaThemes}-${mergedConfig.maxMetaThemes}, ` +
      `subThemes=${mergedConfig.minSubThemesPerMeta}-${mergedConfig.maxSubThemesPerMeta}`,
    );

    // Emit progress: Initializing
    this.emitProgress(progressCallback, HierarchicalExtractionStage.INITIALIZING, 0, 'Initializing hierarchical extraction...');

    // Validate input
    if (papers.length < MIN_PAPERS_FOR_EXTRACTION) {
      throw new Error(
        `Insufficient papers for hierarchical extraction. ` +
        `Required: ${MIN_PAPERS_FOR_EXTRACTION}, provided: ${papers.length}`,
      );
    }

    // Check for cancellation
    this.checkCancellation(signal);

    // STAGE 1: Generate embeddings
    this.emitProgress(progressCallback, HierarchicalExtractionStage.GENERATING_EMBEDDINGS, 10, 'Generating paper embeddings...');
    const papersWithEmbeddings = await this.generatePaperEmbeddings(papers, signal);
    this.logger.log(`   Generated embeddings for ${papersWithEmbeddings.length} papers`);

    // OPTIMIZATION: Create paperMap once, reuse across all stages (eliminates 5 redundant Map creations)
    const paperMap = this.buildPaperMap(papersWithEmbeddings);

    // OPTIMIZATION: Create embeddingMap once for k-means operations (eliminates 3 redundant Map creations)
    const embeddingMap = this.buildEmbeddingMap(papersWithEmbeddings);

    // Check for cancellation
    this.checkCancellation(signal);

    // STAGE 2: Level 1 - Meta-theme clustering
    this.emitProgress(progressCallback, HierarchicalExtractionStage.META_THEME_CLUSTERING, 30, 'Clustering papers into meta-themes...');
    const metaThemeClusters = await this.clusterIntoMetaThemes(
      papersWithEmbeddings,
      embeddingMap,
      mergedConfig,
      signal,
    );
    this.logger.log(`   Created ${metaThemeClusters.length} meta-theme clusters`);

    // Check for cancellation
    this.checkCancellation(signal);

    // STAGE 3: Generate meta-theme labels
    this.emitProgress(progressCallback, HierarchicalExtractionStage.META_THEME_LABELING, 45, 'Generating meta-theme labels...');
    const metaThemes = await this.labelMetaThemes(metaThemeClusters, papersWithEmbeddings, paperMap);
    this.logger.log(`   Labeled ${metaThemes.length} meta-themes`);

    // Check for cancellation
    this.checkCancellation(signal);

    // STAGE 4: Level 2 - Sub-theme extraction
    this.emitProgress(progressCallback, HierarchicalExtractionStage.SUB_THEME_EXTRACTION, 55, 'Extracting sub-themes...');
    const metaThemesWithSubThemes = await this.extractSubThemes(
      metaThemes,
      papersWithEmbeddings,
      paperMap,
      mergedConfig,
      signal,
    );
    this.logger.log(`   Extracted sub-themes for all meta-themes`);

    // Check for cancellation
    this.checkCancellation(signal);

    // STAGE 5: Label sub-themes
    this.emitProgress(progressCallback, HierarchicalExtractionStage.SUB_THEME_LABELING, 75, 'Labeling sub-themes...');
    const labeledMetaThemes = await this.labelSubThemes(metaThemesWithSubThemes, paperMap);

    // Check for cancellation
    this.checkCancellation(signal);

    // STAGE 6: Quality analysis
    this.emitProgress(progressCallback, HierarchicalExtractionStage.QUALITY_ANALYSIS, 90, 'Analyzing extraction quality...');
    const qualityMetrics = this.calculateQualityMetrics(
      labeledMetaThemes,
      papersWithEmbeddings,
      paperMap,
      embeddingMap,
      papers.length,
    );

    // Calculate orphaned papers (papers not in any cluster)
    const clusteredPaperIds = new Set<string>();
    for (const metaTheme of labeledMetaThemes) {
      for (const paperId of metaTheme.paperIds) {
        clusteredPaperIds.add(paperId);
      }
    }
    const orphanedPaperIds = papers
      .map(p => p.id)
      .filter(id => !clusteredPaperIds.has(id));

    const processingTimeMs = Date.now() - startTime;

    // STAGE 7: Complete
    this.emitProgress(progressCallback, HierarchicalExtractionStage.COMPLETE, 100, 'Hierarchical extraction complete');

    const result: HierarchicalExtractionResult = {
      metaThemes: labeledMetaThemes,
      totalPapers: papers.length,
      clusteredPapers: clusteredPaperIds.size,
      orphanedPaperIds,
      qualityMetrics,
      processingTimeMs,
      config: mergedConfig,
      timestamp: new Date(),
    };

    this.logger.log(
      `${MetaThemeDiscoveryService.LOG_PREFIX} ✅ Hierarchical extraction complete:\n` +
      `   Meta-themes: ${result.metaThemes.length}\n` +
      `   Total sub-themes: ${result.metaThemes.reduce((sum, m) => sum + m.subThemes.length, 0)}\n` +
      `   Clustered papers: ${result.clusteredPapers}/${result.totalPapers}\n` +
      `   Orphaned papers: ${result.orphanedPaperIds.length}\n` +
      `   Processing time: ${processingTimeMs}ms`,
    );

    return result;
  }

  // ============================================================================
  // OPTIMIZATION: CACHED MAP BUILDERS
  // ============================================================================

  /**
   * Build paper lookup map (O(n) creation, O(1) lookups)
   * Created once in main function, passed to all stages
   */
  private buildPaperMap(
    papers: readonly PaperWithEmbedding[],
  ): Map<string, PaperWithEmbedding> {
    const map = new Map<string, PaperWithEmbedding>();
    for (const paper of papers) {
      map.set(paper.id, paper);
    }
    return map;
  }

  /**
   * Build embedding lookup map for k-means operations
   * Created once in main function, passed to clustering stages
   */
  private buildEmbeddingMap(
    papers: readonly PaperWithEmbedding[],
  ): Map<string, number[]> {
    const map = new Map<string, number[]>();
    for (const paper of papers) {
      map.set(paper.id, [...paper.embedding]);
    }
    return map;
  }

  /**
   * OPTIMIZATION: Single-pass paper lookup by IDs
   * Replaces .map(id => map.get(id)).filter(p => p !== undefined) pattern
   * Reduces from O(2n) to O(n) for each lookup operation
   */
  private lookupPapersByIds(
    ids: readonly string[],
    paperMap: Map<string, PaperWithEmbedding>,
  ): PaperWithEmbedding[] {
    const papers: PaperWithEmbedding[] = [];
    for (const id of ids) {
      const paper = paperMap.get(id);
      if (paper) {
        papers.push(paper);
      }
    }
    return papers;
  }

  // ============================================================================
  // STAGE 1: EMBEDDING GENERATION
  // ============================================================================

  /**
   * Generate embeddings for all papers
   */
  private async generatePaperEmbeddings(
    papers: readonly HierarchicalPaperInput[],
    signal?: AbortSignal,
  ): Promise<PaperWithEmbedding[]> {
    const texts = papers.map(paper => this.getPaperText(paper));

    const embeddings = await this.embeddingService.generateEmbeddingsBatch(
      texts,
      (processed, total) => {
        this.logger.debug(`   Embeddings: ${processed}/${total}`);
      },
      signal,
    );

    const result: PaperWithEmbedding[] = [];
    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i];
      const embedding = embeddings[i];

      // Skip papers with zero embeddings (invalid/empty text)
      const hasValidEmbedding = embedding.some(v => v !== 0);
      if (!hasValidEmbedding) {
        this.logger.warn(`   Skipping paper with invalid embedding: ${paper.id}`);
        continue;
      }

      result.push({
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract || '',
        embedding: embedding,
        themeFitScore: paper.themeFitScore,
      });
    }

    return result;
  }

  /**
   * Get combined text for embedding
   */
  private getPaperText(paper: HierarchicalPaperInput): string {
    const parts: string[] = [paper.title];
    if (paper.abstract) {
      parts.push(paper.abstract);
    }
    if (paper.keywords && paper.keywords.length > 0) {
      parts.push(paper.keywords.join(' '));
    }
    return parts.join(' ');
  }

  // ============================================================================
  // STAGE 2: META-THEME CLUSTERING (Level 1)
  // ============================================================================

  /**
   * Cluster papers into meta-themes using k-means++
   * OPTIMIZED: embeddingMap passed from main function (eliminates redundant creation)
   */
  private async clusterIntoMetaThemes(
    papers: readonly PaperWithEmbedding[],
    embeddingMap: Map<string, number[]>,
    config: HierarchicalExtractionConfig,
    signal?: AbortSignal,
  ): Promise<Cluster[]> {
    // Convert to InitialCode format for k-means service
    const codes: InitialCode[] = papers.map(paper => ({
      id: paper.id,
      label: paper.title,
      description: paper.abstract,
      sourceId: paper.id,
      excerpts: [paper.abstract],
    }));

    // Calculate optimal k (meta-theme count)
    const optimalK = this.calculateOptimalK(
      papers.length,
      config.minMetaThemes,
      config.maxMetaThemes,
    );

    this.logger.log(`   Clustering ${papers.length} papers into ${optimalK} meta-themes`);

    // Run k-means++ clustering
    const clusters = await this.kmeansService.kMeansPlusPlusClustering(
      codes,
      embeddingMap,
      optimalK,
      { maxIterations: 100, convergenceTolerance: 0.001 },
      (message, progress) => {
        this.logger.debug(`   ${message} (${progress.toFixed(0)}%)`);
      },
      signal,
    );

    // Filter out clusters with too few papers
    return clusters.filter(cluster => cluster.codes.length >= config.minPapersPerCluster);
  }

  /**
   * Calculate optimal number of meta-themes
   * Formula: k = sqrt(n/2), clamped to [min, max]
   */
  private calculateOptimalK(paperCount: number, minK: number, maxK: number): number {
    const calculated = Math.ceil(Math.sqrt(paperCount / K_SELECTION_DIVISOR));
    return Math.max(minK, Math.min(maxK, calculated));
  }

  // ============================================================================
  // STAGE 3: META-THEME LABELING
  // ============================================================================

  /**
   * Generate labels for meta-theme clusters
   * OPTIMIZED: paperMap passed from main function (eliminates redundant creation)
   */
  private async labelMetaThemes(
    clusters: readonly Cluster[],
    papers: readonly PaperWithEmbedding[],
    paperMap: Map<string, PaperWithEmbedding>,
  ): Promise<MutableMetaTheme[]> {
    const metaThemes: MutableMetaTheme[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const paperIds = cluster.codes.map(c => c.id);
      // OPTIMIZED: Single-pass lookup replaces .map().filter() pattern
      const clusterPapers = this.lookupPapersByIds(paperIds, paperMap);

      // Extract keywords from cluster papers
      const keywords = this.extractKeywords(clusterPapers);

      // Generate label and description from keywords
      const label = this.generateLabel(keywords, i);
      const description = this.generateDescription(keywords, clusterPapers);

      // Calculate coherence score (using paperMap passed from main function)
      const coherenceScore = this.calculateCoherence(cluster, paperMap);

      // Calculate controversy level
      const controversyLevel = this.calculateControversyLevel(clusterPapers);

      // Calculate average theme-fit score
      const avgThemeFitScore = this.calculateAvgThemeFitScore(clusterPapers);

      // Find representative papers (closest to centroid)
      const representativePaperIds = this.findRepresentativePapers(
        clusterPapers,
        cluster.centroid,
        REPRESENTATIVE_PAPERS_COUNT,
      );

      // Calculate weight (proportion of papers)
      const weight = paperIds.length / papers.length;

      const metaTheme: MutableMetaTheme = {
        id: crypto.randomUUID(),
        label,
        description,
        paperIds,
        representativePaperIds,
        centroidEmbedding: [...cluster.centroid],
        coherenceScore,
        weight,
        keywords,
        avgThemeFitScore,
        subThemes: [], // Populated in Level 2
        controversyLevel,
        createdAt: new Date(),
      };

      metaThemes.push(metaTheme);
    }

    // Sort by weight (largest clusters first)
    metaThemes.sort((a, b) => b.weight - a.weight);

    return metaThemes;
  }

  // ============================================================================
  // STAGE 4: SUB-THEME EXTRACTION (Level 2)
  // ============================================================================

  /**
   * Extract sub-themes for each meta-theme
   * OPTIMIZED: paperMap passed from main function (eliminates redundant creation)
   */
  private async extractSubThemes(
    metaThemes: readonly MutableMetaTheme[],
    allPapers: readonly PaperWithEmbedding[],
    paperMap: Map<string, PaperWithEmbedding>,
    config: HierarchicalExtractionConfig,
    signal?: AbortSignal,
  ): Promise<MutableMetaTheme[]> {
    const result: MutableMetaTheme[] = [];

    for (const metaTheme of metaThemes) {
      // Check cancellation
      this.checkCancellation(signal);

      // Get papers in this meta-theme
      // OPTIMIZED: Single-pass lookup replaces .map().filter() pattern
      const metaThemePapers = this.lookupPapersByIds(metaTheme.paperIds, paperMap);

      // Calculate optimal sub-theme count
      const subThemeCount = this.calculateSubThemeCount(
        metaThemePapers.length,
        config.minSubThemesPerMeta,
        config.maxSubThemesPerMeta,
      );

      // Skip sub-clustering if not enough papers
      if (metaThemePapers.length < subThemeCount * config.minPapersPerCluster) {
        this.logger.debug(
          `   Meta-theme "${metaTheme.label}" has too few papers for sub-themes (${metaThemePapers.length})`,
        );
        result.push({ ...metaTheme, subThemes: [] });
        continue;
      }

      // Sub-cluster the meta-theme papers
      const subClusters = await this.subClusterMetaTheme(
        metaThemePapers,
        subThemeCount,
        config,
        signal,
      );

      // Create sub-themes from clusters
      const subThemes: MutableSubTheme[] = [];
      for (let j = 0; j < subClusters.length; j++) {
        const subCluster = subClusters[j];
        const subPaperIds = subCluster.codes.map(c => c.id);
        // OPTIMIZED: Single-pass lookup replaces .map().filter() pattern
        const subPapers = this.lookupPapersByIds(subPaperIds, paperMap);

        // Skip empty sub-clusters
        if (subPapers.length < config.minPapersPerCluster) {
          continue;
        }

        // Find key papers
        const keyPaperIds = this.findRepresentativePapers(
          subPapers,
          subCluster.centroid,
          Math.min(2, subPapers.length),
        );

        // Extract keywords
        const keywords = this.extractKeywords(subPapers);

        // Calculate coherence (using paperMap passed from main function)
        const coherenceScore = this.calculateCoherence(subCluster, paperMap);

        // Calculate controversy level
        const controversyLevel = this.calculateControversyLevel(subPapers);

        // Calculate weight within meta-theme
        const weight = subPaperIds.length / metaThemePapers.length;

        const subTheme: MutableSubTheme = {
          id: crypto.randomUUID(),
          parentMetaThemeId: metaTheme.id,
          label: '', // Populated in labeling stage
          description: '',
          paperIds: subPaperIds,
          keyPaperIds,
          keywords,
          weight,
          controversyLevel,
          centroidEmbedding: [...subCluster.centroid],
          coherenceScore,
        };

        subThemes.push(subTheme);
      }

      // Sort sub-themes by weight
      subThemes.sort((a, b) => b.weight - a.weight);

      result.push({ ...metaTheme, subThemes });
    }

    return result;
  }

  /**
   * Sub-cluster papers within a meta-theme
   */
  private async subClusterMetaTheme(
    papers: readonly PaperWithEmbedding[],
    k: number,
    config: HierarchicalExtractionConfig,
    signal?: AbortSignal,
  ): Promise<Cluster[]> {
    // Convert to InitialCode format
    const codes: InitialCode[] = papers.map(paper => ({
      id: paper.id,
      label: paper.title,
      description: paper.abstract,
      sourceId: paper.id,
      excerpts: [paper.abstract],
    }));

    // Create embedding map
    const embeddingMap = new Map<string, number[]>();
    for (const paper of papers) {
      embeddingMap.set(paper.id, [...paper.embedding]);
    }

    // Run k-means++ clustering
    const clusters = await this.kmeansService.kMeansPlusPlusClustering(
      codes,
      embeddingMap,
      k,
      { maxIterations: 50, convergenceTolerance: 0.01 },
      undefined, // No progress callback for sub-clustering
      signal,
    );

    return clusters.filter(c => c.codes.length >= config.minPapersPerCluster);
  }

  /**
   * Calculate optimal sub-theme count
   */
  private calculateSubThemeCount(paperCount: number, minK: number, maxK: number): number {
    // For sub-themes: k = sqrt(n), clamped
    const calculated = Math.ceil(Math.sqrt(paperCount));
    return Math.max(minK, Math.min(maxK, calculated));
  }

  // ============================================================================
  // STAGE 5: SUB-THEME LABELING
  // ============================================================================

  /**
   * Generate labels for sub-themes
   * OPTIMIZED: paperMap passed from main function (eliminates redundant creation)
   */
  private async labelSubThemes(
    metaThemes: readonly MutableMetaTheme[],
    paperMap: Map<string, PaperWithEmbedding>,
  ): Promise<MetaTheme[]> {
    const result: MetaTheme[] = [];

    for (const metaTheme of metaThemes) {
      const labeledSubThemes: SubTheme[] = [];

      for (let j = 0; j < metaTheme.subThemes.length; j++) {
        const subTheme = metaTheme.subThemes[j];
        const subPapers = subTheme.paperIds
          .map(id => paperMap.get(id))
          .filter((p): p is PaperWithEmbedding => p !== undefined);

        // Generate label from keywords, distinguishing from parent
        const label = this.generateSubThemeLabel(subTheme.keywords, metaTheme.label, j);
        const description = this.generateDescription(subTheme.keywords, subPapers);

        const labeledSubTheme: SubTheme = {
          ...subTheme,
          label,
          description,
        };

        labeledSubThemes.push(labeledSubTheme);
      }

      const labeledMetaTheme: MetaTheme = {
        ...metaTheme,
        subThemes: labeledSubThemes,
      };

      result.push(labeledMetaTheme);
    }

    return result;
  }

  // ============================================================================
  // QUALITY METRICS
  // ============================================================================

  /**
   * Calculate quality metrics for the extraction
   * OPTIMIZED: paperMap and embeddingMap passed from main function (eliminates redundant creation)
   */
  private calculateQualityMetrics(
    metaThemes: readonly MetaTheme[],
    papers: readonly PaperWithEmbedding[],
    paperMap: Map<string, PaperWithEmbedding>,
    embeddingMap: Map<string, number[]>,
    totalPapers: number,
  ): HierarchicalQualityMetrics {
    // Average meta-theme coherence
    const avgMetaThemeCoherence = metaThemes.length > 0
      ? metaThemes.reduce((sum, m) => sum + m.coherenceScore, 0) / metaThemes.length
      : 0;

    // Average sub-theme coherence
    const allSubThemes = metaThemes.flatMap(m => m.subThemes);
    const avgSubThemeCoherence = allSubThemes.length > 0
      ? allSubThemes.reduce((sum, s) => sum + s.coherenceScore, 0) / allSubThemes.length
      : 0;

    // Calculate Davies-Bouldin and Silhouette for meta-themes (reuse paperMap)
    const metaThemeClusters = this.convertToClusterFormat(metaThemes, paperMap);

    const metaThemeDaviesBouldin = metaThemeClusters.length > 1
      ? this.mathUtils.calculateDaviesBouldinIndex(metaThemeClusters, embeddingMap)
      : 0;

    const metaThemeSilhouette = metaThemeClusters.length > 1
      ? this.mathUtils.calculateSilhouetteScore(metaThemeClusters, embeddingMap)
      : 0;

    // Cluster coverage
    const clusteredPaperIds = new Set<string>();
    for (const metaTheme of metaThemes) {
      for (const paperId of metaTheme.paperIds) {
        clusteredPaperIds.add(paperId);
      }
    }
    const clusterCoverage = totalPapers > 0 ? clusteredPaperIds.size / totalPapers : 0;

    // Average papers per meta-theme
    const avgPapersPerMetaTheme = metaThemes.length > 0
      ? metaThemes.reduce((sum, m) => sum + m.paperIds.length, 0) / metaThemes.length
      : 0;

    // Average sub-themes per meta-theme
    const avgSubThemesPerMetaTheme = metaThemes.length > 0
      ? metaThemes.reduce((sum, m) => sum + m.subThemes.length, 0) / metaThemes.length
      : 0;

    // Theme diversity (inverse of average pairwise similarity)
    const themeDiversity = this.calculateThemeDiversity(metaThemes);

    return {
      avgMetaThemeCoherence,
      avgSubThemeCoherence,
      metaThemeDaviesBouldin,
      metaThemeSilhouette,
      clusterCoverage,
      avgPapersPerMetaTheme,
      avgSubThemesPerMetaTheme,
      themeDiversity,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Extract keywords from papers using TF analysis
   */
  private extractKeywords(papers: readonly PaperWithEmbedding[]): string[] {
    const wordFreq = new Map<string, number>();

    for (const paper of papers) {
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      const words = text.split(/\W+/).filter(
        w => w.length >= MIN_KEYWORD_LENGTH && !STOP_WORDS.has(w),
      );

      for (const word of words) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    // Sort by frequency and take top keywords
    const sorted = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_KEYWORDS_PER_THEME)
      .map(([word]) => word);

    return sorted;
  }

  /**
   * Generate label from keywords
   */
  private generateLabel(keywords: readonly string[], index: number): string {
    if (keywords.length === 0) {
      return `Theme ${index + 1}`;
    }

    // Capitalize and join top 2-3 keywords
    const topKeywords = keywords.slice(0, 3);
    const capitalized = topKeywords.map(
      k => k.charAt(0).toUpperCase() + k.slice(1),
    );

    return capitalized.join(' & ');
  }

  /**
   * Generate sub-theme label, distinguished from parent
   */
  private generateSubThemeLabel(
    keywords: readonly string[],
    parentLabel: string,
    index: number,
  ): string {
    if (keywords.length === 0) {
      return `${parentLabel} - Aspect ${index + 1}`;
    }

    // Use keywords not in parent label
    const parentWords = new Set(parentLabel.toLowerCase().split(/\W+/));
    const distinctKeywords = keywords.filter(k => !parentWords.has(k.toLowerCase()));

    if (distinctKeywords.length === 0) {
      return `${parentLabel} - Aspect ${index + 1}`;
    }

    const topKeywords = distinctKeywords.slice(0, 2);
    const capitalized = topKeywords.map(
      k => k.charAt(0).toUpperCase() + k.slice(1),
    );

    return capitalized.join(' & ');
  }

  /**
   * Generate description from keywords and papers
   */
  private generateDescription(
    keywords: readonly string[],
    papers: readonly PaperWithEmbedding[],
  ): string {
    if (keywords.length === 0) {
      return 'A cluster of related research papers.';
    }

    const keywordStr = keywords.slice(0, 5).join(', ');
    const paperCount = papers.length;

    return `Research focusing on ${keywordStr}. Contains ${paperCount} papers exploring related concepts.`;
  }

  /**
   * Calculate cluster coherence (average similarity to centroid)
   * Returns value clamped to [0, 1] range
   * OPTIMIZED: accepts paperMap directly (eliminates redundant creation)
   */
  private calculateCoherence(
    cluster: Cluster,
    paperMap: Map<string, PaperWithEmbedding>,
  ): number {
    let totalSimilarity = 0;
    let count = 0;

    for (const code of cluster.codes) {
      const paper = paperMap.get(code.id);
      if (paper) {
        const similarity = this.embeddingService.cosineSimilarity(
          [...paper.embedding],
          cluster.centroid,
        );
        // Clamp to [0, 1] since cosine can be negative
        totalSimilarity += Math.max(0, Math.min(1, similarity));
        count++;
      }
    }

    return count > 0 ? totalSimilarity / count : 0;
  }

  /**
   * Calculate controversy level from paper abstracts
   */
  private calculateControversyLevel(papers: readonly PaperWithEmbedding[]): number {
    let controversyCount = 0;

    for (const paper of papers) {
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      for (const pattern of CONTROVERSY_PATTERNS) {
        if (pattern.test(text)) {
          controversyCount++;
          break;
        }
      }
    }

    return papers.length > 0 ? controversyCount / papers.length : 0;
  }

  /**
   * Calculate average theme-fit score for papers
   */
  private calculateAvgThemeFitScore(papers: readonly PaperWithEmbedding[]): number {
    const papersWithScore = papers.filter(p => p.themeFitScore !== undefined);
    if (papersWithScore.length === 0) return 0.5;

    const sum = papersWithScore.reduce((acc, p) => acc + (p.themeFitScore || 0), 0);
    return sum / papersWithScore.length;
  }

  /**
   * Find papers closest to centroid
   */
  private findRepresentativePapers(
    papers: readonly PaperWithEmbedding[],
    centroid: readonly number[],
    count: number,
  ): string[] {
    const distances = papers.map(paper => ({
      id: paper.id,
      distance: this.mathUtils.euclideanDistance([...paper.embedding], [...centroid]),
    }));

    distances.sort((a, b) => a.distance - b.distance);

    return distances.slice(0, count).map(d => d.id);
  }

  /**
   * Calculate theme diversity (inverse of average pairwise similarity)
   * Returns value clamped to [0, 1] range
   */
  private calculateThemeDiversity(metaThemes: readonly MetaTheme[]): number {
    if (metaThemes.length < 2) return 1;

    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < metaThemes.length; i++) {
      for (let j = i + 1; j < metaThemes.length; j++) {
        const similarity = this.embeddingService.cosineSimilarity(
          [...metaThemes[i].centroidEmbedding],
          [...metaThemes[j].centroidEmbedding],
        );
        // Clamp similarity to [0, 1] since cosine can be negative
        totalSimilarity += Math.max(0, Math.min(1, similarity));
        pairCount++;
      }
    }

    const avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
    return Math.max(0, Math.min(1, 1 - avgSimilarity)); // Higher diversity = lower similarity
  }

  /**
   * Convert MetaThemes to Cluster format for metrics calculation
   * OPTIMIZED: paperMap passed from main function (eliminates redundant creation)
   */
  private convertToClusterFormat(
    metaThemes: readonly MetaTheme[],
    paperMap: Map<string, PaperWithEmbedding>,
  ): Cluster[] {
    return metaThemes.map(metaTheme => {
      const codes: InitialCode[] = metaTheme.paperIds
        .map(id => {
          const paper = paperMap.get(id);
          if (!paper) return null;
          return {
            id: paper.id,
            label: paper.title,
            description: paper.abstract,
            sourceId: paper.id,
            excerpts: [paper.abstract],
          };
        })
        .filter((c): c is InitialCode => c !== null);

      return {
        codes,
        centroid: [...metaTheme.centroidEmbedding],
      };
    });
  }

  /**
   * Emit progress update
   */
  private emitProgress(
    callback: HierarchicalProgressCallback | undefined,
    stage: HierarchicalExtractionStage,
    progress: number,
    message: string,
  ): void {
    if (callback) {
      callback(stage, progress, message);
    }
    this.logger.debug(`   [${stage}] ${progress}% - ${message}`);
  }

  /**
   * Check for cancellation and throw if cancelled
   */
  private checkCancellation(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new Error('Hierarchical extraction cancelled by user');
    }
  }
}
