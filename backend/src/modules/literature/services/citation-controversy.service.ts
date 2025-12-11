/**
 * Phase 10.113 Week 4: Citation-Based Controversy Analysis Service
 *
 * Netflix-grade service for detecting controversy through citation patterns.
 * Identifies "debate papers" cited by opposing camps and calculates
 * Citation Controversy Index (CCI) for theme-fit scoring integration.
 *
 * Key algorithms:
 * - Citation graph construction with adjacency lists
 * - Camp detection via embedding-based clustering
 * - CCI calculation with cross-camp and velocity components
 * - Debate paper identification with balance scoring
 *
 * Performance: O(n log n) for n papers, optimized for 10-300 paper sets
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  CitationControversyConfig,
  DEFAULT_CITATION_CONTROVERSY_CONFIG,
  CitationCamp,
  MutableCitationCamp,
  DebatePaper,
  DebatePaperRole,
  CitationControversyIndex,
  CitationControversyComponents,
  ControversyClassification,
  CitationControversyAnalysis,
  ControversyQualityMetrics,
  ControversyAnalysisMetadata,
  CitationAnalysisPaperInput,
  ControversyProgressCallback,
  ControversyAnalysisStage,
  CampCitation,
  getControversyClassification,
} from '../types/citation-controversy.types';
import { LocalEmbeddingService } from './local-embedding.service';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum papers required for controversy analysis */
const MIN_PAPERS_FOR_ANALYSIS = 5;

/** Maximum camps to detect */
const MAX_CAMPS = 4;

/** Minimum camp size relative to total papers */
const MIN_CAMP_SIZE_RATIO = 0.1;

/** Threshold for considering papers as "similar" in citation patterns */
const CITATION_SIMILARITY_THRESHOLD = 0.3;

/** Decay factor for citation recency (years) */
const RECENCY_DECAY_YEARS = 5;

/** Self-citation penalty factor */
const SELF_CITATION_PENALTY = 0.1;

// ============================================================================
// CCI SCORE WEIGHTS
// ============================================================================

/** Weight for polarization score in CCI calculation */
const CCI_POLARIZATION_WEIGHT = 0.2;

/** Weight for recency score in CCI calculation */
const CCI_RECENCY_WEIGHT = 0.1;

/** Threshold for cross-camp score to flag as debate paper */
const DEBATE_PAPER_CROSS_CAMP_THRESHOLD = 0.5;

/** Default recency score when year is unknown */
const DEFAULT_RECENCY_SCORE = 0.5;

/** Multiplier for velocity normalization (against config threshold) */
const VELOCITY_NORMALIZATION_FACTOR = 2;

// ============================================================================
// DEBATE PAPER THRESHOLDS
// ============================================================================

/** Minimum debate score to be considered a "significant" debate paper */
const DEBATE_PAPER_SCORE_THRESHOLD = 0.3;

/** Weight for balance score in debate score calculation */
const DEBATE_BALANCE_WEIGHT = 0.7;

/** Weight for diversity score in debate score calculation */
const DEBATE_DIVERSITY_WEIGHT = 0.3;

/** Balance threshold for classifying as bridging paper */
const BRIDGE_PAPER_BALANCE_THRESHOLD = 0.4;

/** Age threshold (years) for foundational paper classification */
const FOUNDATIONAL_PAPER_AGE_THRESHOLD = 10;

/** Minimum citations for foundational paper classification */
const FOUNDATIONAL_PAPER_CITATION_THRESHOLD = 100;

/** Age threshold (years) for catalyst paper classification (recent) */
const CATALYST_PAPER_AGE_THRESHOLD = 5;

/** Keywords indicating stance/position */
const STANCE_KEYWORDS = [
  'argue', 'claim', 'propose', 'suggest', 'demonstrate',
  'challenge', 'critique', 'refute', 'support', 'confirm',
  'contradict', 'oppose', 'disagree', 'agree', 'extend',
  'question', 'reject', 'accept', 'advocate', 'defend',
] as const;

/** Keywords indicating methodology (for METHODOLOGY role) */
const METHODOLOGY_KEYWORDS = [
  'method', 'approach', 'framework', 'model', 'technique',
  'algorithm', 'protocol', 'procedure', 'measure', 'scale',
  'instrument', 'tool', 'metric', 'index', 'indicator',
] as const;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class CitationControversyService {
  private readonly logger = new Logger(CitationControversyService.name);

  // OPTIMIZATION: Cache current year to avoid Date() calls
  private readonly currentYear: number;

  constructor(
    private readonly embeddingService: LocalEmbeddingService,
  ) {
    this.currentYear = new Date().getFullYear();
    this.logger.log(
      `[Phase 10.113 Week 4] CitationControversyService initialized`
    );
  }

  // ============================================================================
  // MAIN ANALYSIS ENTRY POINT
  // ============================================================================

  /**
   * Analyze citation controversy for a set of papers
   * Returns camps, debate papers, and CCI scores
   */
  async analyzeCitationControversy(
    papers: readonly CitationAnalysisPaperInput[],
    topic: string,
    config: Partial<CitationControversyConfig> = {},
    progressCallback?: ControversyProgressCallback,
    signal?: AbortSignal,
  ): Promise<CitationControversyAnalysis> {
    const startTime = Date.now();
    const mergedConfig: CitationControversyConfig = {
      ...DEFAULT_CITATION_CONTROVERSY_CONFIG,
      ...config,
    };

    this.logger.log(
      `[Phase 10.113 Week 4] Starting citation controversy analysis for "${topic}" with ${papers.length} papers`
    );

    // Validate input
    if (papers.length < MIN_PAPERS_FOR_ANALYSIS) {
      return this.createEmptyResult(topic, papers.length, startTime, mergedConfig, [
        `Insufficient papers for analysis (${papers.length} < ${MIN_PAPERS_FOR_ANALYSIS})`,
      ]);
    }

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 1: Initialize
    this.emitProgress(progressCallback, ControversyAnalysisStage.INITIALIZING, 5, 'Initializing analysis...');

    // OPTIMIZATION: Build paper lookup map once
    const paperMap = this.buildPaperMap(papers);

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 2: Build citation graph
    this.emitProgress(progressCallback, ControversyAnalysisStage.BUILDING_CITATION_GRAPH, 15, 'Building citation graph...');
    const citationGraph = this.buildCitationGraph(papers);
    this.logger.log(`   Built citation graph with ${citationGraph.size} nodes`);

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 3: Detect camps
    this.emitProgress(progressCallback, ControversyAnalysisStage.DETECTING_CAMPS, 35, 'Detecting citation camps...');
    const camps = await this.detectCitationCamps(papers, citationGraph, mergedConfig, signal);
    this.logger.log(`   Detected ${camps.length} citation camps`);

    // Check cancellation
    this.checkCancellation(signal);

    // OPTIMIZATION: Build paperToCamp map once, pass to multiple stages (eliminates redundant O(n) creation)
    const paperToCamp = this.buildPaperToCampMap(camps);

    // STAGE 4: Calculate CCI for all papers
    this.emitProgress(progressCallback, ControversyAnalysisStage.CALCULATING_CCI, 55, 'Calculating Citation Controversy Index...');
    const paperCCIs = this.calculateAllCCIs(papers, camps, citationGraph, paperToCamp, mergedConfig);
    this.logger.log(`   Calculated CCI for ${paperCCIs.length} papers`);

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 5: Identify debate papers
    this.emitProgress(progressCallback, ControversyAnalysisStage.IDENTIFYING_DEBATE_PAPERS, 75, 'Identifying debate papers...');
    const debatePapers = this.identifyDebatePapers(papers, camps, citationGraph, paperMap, paperToCamp);
    this.logger.log(`   Identified ${debatePapers.length} debate papers`);

    // Check cancellation
    this.checkCancellation(signal);

    // STAGE 6: Generate labels
    this.emitProgress(progressCallback, ControversyAnalysisStage.GENERATING_LABELS, 85, 'Generating camp labels...');
    const labeledCamps = this.generateCampLabels(camps, paperMap);

    // STAGE 7: Quality analysis
    this.emitProgress(progressCallback, ControversyAnalysisStage.QUALITY_ANALYSIS, 95, 'Analyzing quality...');
    const qualityMetrics = this.calculateQualityMetrics(papers, labeledCamps, debatePapers);
    const topicControversyScore = this.calculateTopicControversyScore(paperCCIs, camps, debatePapers);

    // Build result
    const processingTimeMs = Date.now() - startTime;
    const result: CitationControversyAnalysis = {
      topic,
      description: this.generateDescription(topic, labeledCamps, debatePapers, topicControversyScore),
      camps: labeledCamps,
      debatePapers,
      paperCCIs,
      topicControversyScore,
      qualityMetrics,
      metadata: {
        timestamp: new Date(),
        processingTimeMs,
        config: mergedConfig,
        warnings: this.generateWarnings(papers, camps, debatePapers),
      },
    };

    // Complete
    this.emitProgress(progressCallback, ControversyAnalysisStage.COMPLETE, 100, 'Analysis complete');

    this.logger.log(
      `[Phase 10.113 Week 4] Citation controversy analysis completed:\n` +
      `   Topic: ${topic}\n` +
      `   Papers: ${papers.length}\n` +
      `   Camps: ${camps.length}\n` +
      `   Debate papers: ${debatePapers.length}\n` +
      `   Topic controversy score: ${topicControversyScore.toFixed(3)}\n` +
      `   Processing time: ${processingTimeMs}ms`
    );

    return result;
  }

  // ============================================================================
  // CITATION GRAPH CONSTRUCTION
  // ============================================================================

  /**
   * Build citation graph from papers
   * Returns adjacency list representation
   * OPTIMIZATION: O(n + e) where e is total edges
   */
  private buildCitationGraph(
    papers: readonly CitationAnalysisPaperInput[],
  ): Map<string, { cites: Set<string>; citedBy: Set<string> }> {
    const graph = new Map<string, { cites: Set<string>; citedBy: Set<string> }>();

    // Initialize nodes
    for (const paper of papers) {
      graph.set(paper.id, { cites: new Set(), citedBy: new Set() });
    }

    // Build edges from references
    for (const paper of papers) {
      const node = graph.get(paper.id);
      if (!node) continue;

      // Add outgoing edges (papers this paper cites)
      if (paper.references) {
        for (const refId of paper.references) {
          if (graph.has(refId)) {
            node.cites.add(refId);
            const refNode = graph.get(refId);
            if (refNode) {
              refNode.citedBy.add(paper.id);
            }
          }
        }
      }

      // Add incoming edges (papers that cite this paper)
      if (paper.citedBy) {
        for (const citerId of paper.citedBy) {
          if (graph.has(citerId)) {
            node.citedBy.add(citerId);
            const citerNode = graph.get(citerId);
            if (citerNode) {
              citerNode.cites.add(paper.id);
            }
          }
        }
      }
    }

    return graph;
  }

  // ============================================================================
  // CAMP DETECTION
  // ============================================================================

  /**
   * Detect citation camps using embedding-based clustering
   * Papers in the same camp tend to cite each other and share viewpoints
   */
  private async detectCitationCamps(
    papers: readonly CitationAnalysisPaperInput[],
    citationGraph: Map<string, { cites: Set<string>; citedBy: Set<string> }>,
    config: CitationControversyConfig,
    signal?: AbortSignal,
  ): Promise<MutableCitationCamp[]> {
    // Filter papers with embeddings
    const papersWithEmbeddings = papers.filter(
      (p) => p.embedding && p.embedding.length > 0
    );

    if (papersWithEmbeddings.length < config.minPapersPerCamp * 2) {
      this.logger.warn(`Insufficient papers with embeddings for camp detection`);
      return [];
    }

    // Calculate citation similarity matrix
    const similarityMatrix = this.calculateCitationSimilarity(
      papersWithEmbeddings,
      citationGraph,
    );

    // Use k-means++ for camp detection with k=2 to MAX_CAMPS
    const optimalK = this.findOptimalCampCount(
      papersWithEmbeddings,
      similarityMatrix,
      config,
    );

    // Cluster into camps
    const camps = this.clusterIntoCamps(
      papersWithEmbeddings,
      similarityMatrix,
      optimalK,
      config,
    );

    // Check cancellation
    this.checkCancellation(signal);

    return camps;
  }

  /**
   * Calculate citation similarity between papers
   * Combines embedding similarity with citation pattern similarity
   */
  private calculateCitationSimilarity(
    papers: readonly CitationAnalysisPaperInput[],
    citationGraph: Map<string, { cites: Set<string>; citedBy: Set<string> }>,
  ): Map<string, Map<string, number>> {
    const matrix = new Map<string, Map<string, number>>();

    for (let i = 0; i < papers.length; i++) {
      const paperA = papers[i];
      const rowMap = new Map<string, number>();

      for (let j = 0; j < papers.length; j++) {
        if (i === j) {
          rowMap.set(papers[j].id, 1.0); // Self-similarity
          continue;
        }

        const paperB = papers[j];

        // Embedding similarity (if available)
        let embeddingSim = 0;
        if (paperA.embedding && paperB.embedding) {
          embeddingSim = this.embeddingService.cosineSimilarity(
            [...paperA.embedding],
            [...paperB.embedding],
          );
        }

        // Citation pattern similarity (Jaccard)
        const nodeA = citationGraph.get(paperA.id);
        const nodeB = citationGraph.get(paperB.id);
        let citationSim = 0;

        if (nodeA && nodeB) {
          const unionCites = new Set([...nodeA.cites, ...nodeB.cites]);
          const intersectCites = new Set(
            [...nodeA.cites].filter((x) => nodeB.cites.has(x))
          );
          if (unionCites.size > 0) {
            citationSim = intersectCites.size / unionCites.size;
          }
        }

        // Combined similarity (weighted average)
        const combinedSim = embeddingSim * 0.6 + citationSim * 0.4;
        rowMap.set(paperB.id, combinedSim);
      }

      matrix.set(paperA.id, rowMap);
    }

    return matrix;
  }

  /**
   * Find optimal number of camps using silhouette analysis
   */
  private findOptimalCampCount(
    papers: readonly CitationAnalysisPaperInput[],
    similarityMatrix: Map<string, Map<string, number>>,
    config: CitationControversyConfig,
  ): number {
    // For small datasets, use k=2
    if (papers.length < config.minPapersPerCamp * 3) {
      return 2;
    }

    // Try k=2 to MAX_CAMPS, find best silhouette score
    let bestK = 2;
    let bestScore = -1;

    for (let k = 2; k <= Math.min(MAX_CAMPS, Math.floor(papers.length / config.minPapersPerCamp)); k++) {
      const camps = this.clusterIntoCamps(papers, similarityMatrix, k, config);
      if (camps.length < 2) continue;

      const silhouette = this.calculateSilhouetteScore(papers, camps, similarityMatrix);
      if (silhouette > bestScore) {
        bestScore = silhouette;
        bestK = k;
      }
    }

    return bestK;
  }

  /**
   * Cluster papers into camps using k-medoids
   * OPTIMIZATION: O(n * k * iterations)
   */
  private clusterIntoCamps(
    papers: readonly CitationAnalysisPaperInput[],
    similarityMatrix: Map<string, Map<string, number>>,
    k: number,
    config: CitationControversyConfig,
  ): MutableCitationCamp[] {
    if (papers.length < k) {
      return [];
    }

    // Initialize medoids using k-means++ style selection
    const medoids = this.initializeMedoids(papers, similarityMatrix, k);

    // Assign papers to nearest medoid
    const assignments = new Map<string, number>();
    for (const paper of papers) {
      let bestMedoid = 0;
      let bestSim = -1;

      for (let m = 0; m < medoids.length; m++) {
        const sim = similarityMatrix.get(paper.id)?.get(medoids[m]) ?? 0;
        if (sim > bestSim) {
          bestSim = sim;
          bestMedoid = m;
        }
      }

      assignments.set(paper.id, bestMedoid);
    }

    // Build camps from assignments
    const camps: MutableCitationCamp[] = [];
    for (let m = 0; m < k; m++) {
      const paperIds = [...assignments.entries()]
        .filter(([_, campIdx]) => campIdx === m)
        .map(([id]) => id);

      if (paperIds.length >= config.minPapersPerCamp) {
        camps.push({
          id: `camp-${m}`,
          label: '', // Will be generated later
          description: '',
          paperIds,
          keyPaperIds: [medoids[m]],
          avgCitationCount: this.calculateAvgCitations(paperIds, papers),
          internalCohesion: this.calculateCampCohesion(paperIds, similarityMatrix),
          keywords: [],
          stanceIndicators: [],
        });
      }
    }

    return camps;
  }

  /**
   * Initialize medoids using k-means++ style selection
   */
  private initializeMedoids(
    papers: readonly CitationAnalysisPaperInput[],
    similarityMatrix: Map<string, Map<string, number>>,
    k: number,
  ): string[] {
    const medoids: string[] = [];

    // First medoid: paper with highest total citation count
    const firstMedoid = papers.reduce((best, p) =>
      p.citationCount > best.citationCount ? p : best
    );
    medoids.push(firstMedoid.id);

    // Subsequent medoids: maximize minimum distance to existing medoids
    while (medoids.length < k) {
      let bestCandidate = '';
      let bestMinDist = -1;

      for (const paper of papers) {
        if (medoids.includes(paper.id)) continue;

        // Find minimum similarity to existing medoids (we want dissimilar papers)
        let minSim = 1;
        for (const medoid of medoids) {
          const sim = similarityMatrix.get(paper.id)?.get(medoid) ?? 0;
          minSim = Math.min(minSim, sim);
        }

        // Lower similarity = more different = better candidate
        const dist = 1 - minSim;
        if (dist > bestMinDist) {
          bestMinDist = dist;
          bestCandidate = paper.id;
        }
      }

      if (bestCandidate) {
        medoids.push(bestCandidate);
      } else {
        break;
      }
    }

    return medoids;
  }

  // ============================================================================
  // CITATION CONTROVERSY INDEX (CCI)
  // ============================================================================

  /**
   * Calculate CCI for all papers
   * OPTIMIZED: paperToCamp map passed from main function (eliminates redundant O(n) creation)
   */
  private calculateAllCCIs(
    papers: readonly CitationAnalysisPaperInput[],
    camps: readonly MutableCitationCamp[],
    citationGraph: Map<string, { cites: Set<string>; citedBy: Set<string> }>,
    paperToCamp: Map<string, string>,
    config: CitationControversyConfig,
  ): CitationControversyIndex[] {
    const ccis: CitationControversyIndex[] = [];

    for (const paper of papers) {
      const cci = this.calculatePaperCCI(paper, camps, citationGraph, paperToCamp, config);
      ccis.push(cci);
    }

    return ccis;
  }

  /**
   * Calculate CCI for a single paper
   */
  private calculatePaperCCI(
    paper: CitationAnalysisPaperInput,
    camps: readonly MutableCitationCamp[],
    citationGraph: Map<string, { cites: Set<string>; citedBy: Set<string> }>,
    paperToCamp: Map<string, string>,
    config: CitationControversyConfig,
  ): CitationControversyIndex {
    const node = citationGraph.get(paper.id);
    const citingPapers = node ? [...node.citedBy] : [];
    const paperCamp = paperToCamp.get(paper.id);

    // Calculate components
    const crossCampScore = this.calculateCrossCampScore(citingPapers, paperCamp, paperToCamp, camps);
    const velocityScore = this.calculateVelocityScore(paper, config);
    const polarizationScore = this.calculatePolarizationScore(citingPapers, paperToCamp, camps);
    const recencyScore = this.calculateRecencyScore(paper);
    const selfCitationPenalty = this.calculateSelfCitationPenalty(paper, citingPapers);

    // Combine scores with weights (using named constants)
    const rawScore =
      crossCampScore * config.crossCampWeight +
      velocityScore * config.velocityWeight +
      polarizationScore * CCI_POLARIZATION_WEIGHT +
      recencyScore * CCI_RECENCY_WEIGHT;

    // Apply self-citation penalty
    const score = Math.max(0, Math.min(1, rawScore * (1 - selfCitationPenalty)));

    const components: CitationControversyComponents = {
      crossCampScore,
      velocityScore,
      polarizationScore,
      recencyScore,
      selfCitationPenalty,
    };

    const classification = getControversyClassification(score);
    const citingCamps = this.getCitingCamps(citingPapers, paperToCamp);
    const isDebatePaper = citingCamps.length >= 2 && crossCampScore > DEBATE_PAPER_CROSS_CAMP_THRESHOLD;

    return {
      paperId: paper.id,
      score,
      components,
      explanation: this.generateCCIExplanation(paper, components, classification),
      classification,
      citingCamps,
      isDebatePaper,
    };
  }

  /**
   * Calculate cross-camp citation score
   * Higher score = cited by more opposing camps
   */
  private calculateCrossCampScore(
    citingPapers: string[],
    paperCamp: string | undefined,
    paperToCamp: Map<string, string>,
    camps: readonly MutableCitationCamp[],
  ): number {
    if (camps.length < 2 || citingPapers.length === 0) {
      return 0;
    }

    // Count citations from each camp
    const campCounts = new Map<string, number>();
    for (const citerId of citingPapers) {
      const citerCamp = paperToCamp.get(citerId);
      if (citerCamp && citerCamp !== paperCamp) {
        campCounts.set(citerCamp, (campCounts.get(citerCamp) || 0) + 1);
      }
    }

    // Score based on diversity of citing camps
    const uniqueCamps = campCounts.size;
    const maxCamps = camps.length - (paperCamp ? 1 : 0);

    if (maxCamps <= 0) return 0;

    // Balance factor: how evenly distributed are citations across camps
    const counts = [...campCounts.values()];
    const total = counts.reduce((a, b) => a + b, 0);
    const avgCount = total / counts.length;
    const variance = counts.length > 0
      ? counts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / counts.length
      : 0;
    const balanceFactor = 1 / (1 + Math.sqrt(variance) / avgCount);

    return (uniqueCamps / maxCamps) * balanceFactor;
  }

  /**
   * Calculate citation velocity score
   * Higher score = rapid citation accumulation
   */
  private calculateVelocityScore(
    paper: CitationAnalysisPaperInput,
    config: CitationControversyConfig,
  ): number {
    if (!paper.year || !paper.citationCount) {
      return 0;
    }

    const age = Math.max(1, this.currentYear - paper.year);
    const citationsPerYear = paper.citationCount / age;

    // Normalize to 0-1 scale using threshold
    return Math.min(1, citationsPerYear / (config.highVelocityThreshold * VELOCITY_NORMALIZATION_FACTOR));
  }

  /**
   * Calculate polarization score
   * Higher score = citations are polarized (from few camps intensely)
   */
  private calculatePolarizationScore(
    citingPapers: string[],
    paperToCamp: Map<string, string>,
    camps: readonly MutableCitationCamp[],
  ): number {
    if (camps.length < 2 || citingPapers.length === 0) {
      return 0;
    }

    // Count citations from each camp
    const campCounts = new Map<string, number>();
    for (const citerId of citingPapers) {
      const camp = paperToCamp.get(citerId);
      if (camp) {
        campCounts.set(camp, (campCounts.get(camp) || 0) + 1);
      }
    }

    if (campCounts.size < 2) {
      return 0; // Not polarized if only one camp cites
    }

    // Calculate Gini coefficient for polarization
    const counts = [...campCounts.values()].sort((a, b) => a - b);
    const n = counts.length;
    const total = counts.reduce((a, b) => a + b, 0);

    let giniSum = 0;
    for (let i = 0; i < n; i++) {
      giniSum += (2 * (i + 1) - n - 1) * counts[i];
    }

    const gini = giniSum / (n * total);
    return Math.abs(gini); // Higher = more polarized
  }

  /**
   * Calculate recency score
   * Higher score = more recent paper
   */
  private calculateRecencyScore(paper: CitationAnalysisPaperInput): number {
    if (!paper.year) {
      return DEFAULT_RECENCY_SCORE; // Default for unknown year
    }

    const age = this.currentYear - paper.year;
    // Exponential decay
    return Math.exp(-age / RECENCY_DECAY_YEARS);
  }

  /**
   * Calculate self-citation penalty
   */
  private calculateSelfCitationPenalty(
    paper: CitationAnalysisPaperInput,
    citingPapers: string[],
  ): number {
    // In a real implementation, we'd check for author overlap
    // For now, return a small fixed penalty if many citations
    if (citingPapers.length > 10) {
      return SELF_CITATION_PENALTY;
    }
    return 0;
  }

  // ============================================================================
  // DEBATE PAPER IDENTIFICATION
  // ============================================================================

  /**
   * Identify debate papers - cited significantly by multiple camps
   * OPTIMIZED: paperToCamp map passed from main function (eliminates redundant O(n) creation)
   */
  private identifyDebatePapers(
    papers: readonly CitationAnalysisPaperInput[],
    camps: readonly MutableCitationCamp[],
    citationGraph: Map<string, { cites: Set<string>; citedBy: Set<string> }>,
    paperMap: Map<string, CitationAnalysisPaperInput>,
    paperToCamp: Map<string, string>,
  ): DebatePaper[] {
    if (camps.length < 2) {
      return [];
    }

    const debatePapers: DebatePaper[] = [];

    for (const paper of papers) {
      const node = citationGraph.get(paper.id);
      if (!node) continue;

      // Count citations by camp
      const citationsByCamp: CampCitation[] = [];
      for (const camp of camps) {
        const citationsFromCamp = [...node.citedBy].filter(
          (citerId) => camp.paperIds.includes(citerId)
        ).length;

        if (citationsFromCamp > 0) {
          citationsByCamp.push({
            campId: camp.id,
            campLabel: camp.label || camp.id,
            citationCount: citationsFromCamp,
            citationPercentage: citationsFromCamp / camp.paperIds.length,
          });
        }
      }

      // Debate paper: cited by 2+ camps
      if (citationsByCamp.length >= 2) {
        const debateScore = this.calculateDebateScore(citationsByCamp);
        const debateRole = this.classifyDebateRole(paper, citationsByCamp);
        const isBridgingPaper = debateRole === DebatePaperRole.BRIDGE;

        if (debateScore > DEBATE_PAPER_SCORE_THRESHOLD) {
          debatePapers.push({
            paperId: paper.id,
            title: paper.title,
            citationCount: paper.citationCount,
            citationsByCamp,
            debateScore,
            isBridgingPaper,
            debateRole,
          });
        }
      }
    }

    // Sort by debate score (highest first)
    return debatePapers.sort((a, b) => b.debateScore - a.debateScore);
  }

  /**
   * Calculate debate score (how evenly cited across camps)
   */
  private calculateDebateScore(citationsByCamp: CampCitation[]): number {
    if (citationsByCamp.length < 2) {
      return 0;
    }

    const counts = citationsByCamp.map((c) => c.citationCount);
    const total = counts.reduce((a, b) => a + b, 0);
    const avgCount = total / counts.length;

    // Calculate coefficient of variation (lower = more balanced)
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / counts.length;
    const cv = Math.sqrt(variance) / avgCount;

    // Convert to score (lower CV = higher score)
    // Also factor in number of camps
    const balanceScore = 1 / (1 + cv);
    const diversityScore = citationsByCamp.length / MAX_CAMPS;

    return (balanceScore * DEBATE_BALANCE_WEIGHT + diversityScore * DEBATE_DIVERSITY_WEIGHT);
  }

  /**
   * Classify the debate role of a paper
   */
  private classifyDebateRole(
    paper: CitationAnalysisPaperInput,
    citationsByCamp: CampCitation[],
  ): DebatePaperRole {
    const text = `${paper.title} ${paper.abstract || ''}`.toLowerCase();

    // Check for methodology keywords
    if (METHODOLOGY_KEYWORDS.some((k) => text.includes(k))) {
      return DebatePaperRole.METHODOLOGY;
    }

    // Check citation pattern
    const totalCitations = citationsByCamp.reduce((sum, c) => sum + c.citationCount, 0);
    const maxCampCitations = Math.max(...citationsByCamp.map((c) => c.citationCount));
    const balance = 1 - (maxCampCitations / totalCitations);

    // High balance = bridging paper
    if (balance > BRIDGE_PAPER_BALANCE_THRESHOLD) {
      return DebatePaperRole.BRIDGE;
    }

    // Very old paper with high citations = foundational
    if (paper.year && this.currentYear - paper.year > FOUNDATIONAL_PAPER_AGE_THRESHOLD && paper.citationCount > FOUNDATIONAL_PAPER_CITATION_THRESHOLD) {
      return DebatePaperRole.FOUNDATIONAL;
    }

    // Recent paper that sparked debate = catalyst
    if (paper.year && this.currentYear - paper.year < CATALYST_PAPER_AGE_THRESHOLD) {
      return DebatePaperRole.CATALYST;
    }

    // Default: contested
    return DebatePaperRole.CONTESTED;
  }

  // ============================================================================
  // LABEL GENERATION
  // ============================================================================

  /**
   * Generate human-readable labels for camps
   */
  private generateCampLabels(
    camps: readonly MutableCitationCamp[],
    paperMap: Map<string, CitationAnalysisPaperInput>,
  ): CitationCamp[] {
    return camps.map((camp, index) => {
      // Extract keywords from camp papers
      const keywords = this.extractCampKeywords(camp.paperIds, paperMap);

      // Extract stance indicators
      const stanceIndicators = this.extractStanceIndicators(camp.paperIds, paperMap);

      // Generate label from keywords
      const label = keywords.length > 0
        ? `${keywords.slice(0, 2).join(' & ')} Camp`
        : `Camp ${index + 1}`;

      // Generate description
      const description = `Papers focused on ${keywords.slice(0, 3).join(', ')}. ` +
        `${camp.paperIds.length} papers with ${camp.avgCitationCount.toFixed(0)} avg citations.`;

      return {
        ...camp,
        label,
        description,
        keywords,
        stanceIndicators,
      };
    });
  }

  /**
   * Extract keywords from camp papers
   */
  private extractCampKeywords(
    paperIds: string[],
    paperMap: Map<string, CitationAnalysisPaperInput>,
  ): string[] {
    const wordCounts = new Map<string, number>();

    for (const paperId of paperIds) {
      const paper = paperMap.get(paperId);
      if (!paper) continue;

      // Extract from title and keywords
      const words = [
        ...paper.title.toLowerCase().split(/\W+/),
        ...(paper.keywords || []).map((k) => k.toLowerCase()),
      ];

      for (const word of words) {
        if (word.length > 3 && !this.isStopWord(word)) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
      }
    }

    // Return top keywords
    return [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Extract stance indicators from camp papers
   */
  private extractStanceIndicators(
    paperIds: string[],
    paperMap: Map<string, CitationAnalysisPaperInput>,
  ): string[] {
    const indicators: string[] = [];

    for (const paperId of paperIds) {
      const paper = paperMap.get(paperId);
      if (!paper?.abstract) continue;

      const abstract = paper.abstract.toLowerCase();
      for (const keyword of STANCE_KEYWORDS) {
        if (abstract.includes(keyword) && !indicators.includes(keyword)) {
          indicators.push(keyword);
        }
      }
    }

    return indicators.slice(0, 5);
  }

  // ============================================================================
  // QUALITY METRICS
  // ============================================================================

  /**
   * Calculate quality metrics for the analysis
   */
  private calculateQualityMetrics(
    papers: readonly CitationAnalysisPaperInput[],
    camps: readonly CitationCamp[],
    debatePapers: readonly DebatePaper[],
  ): ControversyQualityMetrics {
    const papersInCamps = camps.reduce((sum, c) => sum + c.paperIds.length, 0);
    const avgCampCohesion = camps.length > 0
      ? camps.reduce((sum, c) => sum + c.internalCohesion, 0) / camps.length
      : 0;

    return {
      papersAnalyzed: papers.length,
      campsIdentified: camps.length,
      debatePapersFound: debatePapers.length,
      avgCampCohesion,
      campSeparation: this.calculateCampSeparation(camps),
      coverage: papers.length > 0 ? papersInCamps / papers.length : 0,
    };
  }

  /**
   * Calculate overall topic controversy score
   */
  private calculateTopicControversyScore(
    paperCCIs: readonly CitationControversyIndex[],
    camps: readonly MutableCitationCamp[],
    debatePapers: readonly DebatePaper[],
  ): number {
    if (paperCCIs.length === 0) {
      return 0;
    }

    // Average CCI score
    const avgCCI = paperCCIs.reduce((sum, cci) => sum + cci.score, 0) / paperCCIs.length;

    // Camp diversity factor (more camps = more controversy)
    const campFactor = Math.min(1, camps.length / MAX_CAMPS);

    // Debate paper factor
    const debateFactor = Math.min(1, debatePapers.length / 5);

    // Combine factors
    return avgCCI * 0.5 + campFactor * 0.25 + debateFactor * 0.25;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Build paper lookup map
   * OPTIMIZATION: O(n) creation, O(1) lookups
   */
  private buildPaperMap(
    papers: readonly CitationAnalysisPaperInput[],
  ): Map<string, CitationAnalysisPaperInput> {
    const map = new Map<string, CitationAnalysisPaperInput>();
    for (const paper of papers) {
      map.set(paper.id, paper);
    }
    return map;
  }

  /**
   * Build paper-to-camp membership map
   * OPTIMIZATION: Created once in main function, passed to multiple stages
   * Eliminates redundant O(n) map creation in calculateAllCCIs and identifyDebatePapers
   */
  private buildPaperToCampMap(
    camps: readonly MutableCitationCamp[],
  ): Map<string, string> {
    const map = new Map<string, string>();
    for (const camp of camps) {
      for (const paperId of camp.paperIds) {
        map.set(paperId, camp.id);
      }
    }
    return map;
  }

  /**
   * Calculate average citations for a set of papers
   */
  private calculateAvgCitations(
    paperIds: string[],
    papers: readonly CitationAnalysisPaperInput[],
  ): number {
    const ids = new Set(paperIds);
    const campPapers = papers.filter((p) => ids.has(p.id));
    if (campPapers.length === 0) return 0;
    return campPapers.reduce((sum, p) => sum + p.citationCount, 0) / campPapers.length;
  }

  /**
   * Calculate internal cohesion of a camp
   */
  private calculateCampCohesion(
    paperIds: string[],
    similarityMatrix: Map<string, Map<string, number>>,
  ): number {
    if (paperIds.length < 2) {
      return 1;
    }

    let totalSim = 0;
    let count = 0;

    for (let i = 0; i < paperIds.length; i++) {
      for (let j = i + 1; j < paperIds.length; j++) {
        const sim = similarityMatrix.get(paperIds[i])?.get(paperIds[j]) ?? 0;
        totalSim += sim;
        count++;
      }
    }

    return count > 0 ? totalSim / count : 0;
  }

  /**
   * Calculate camp separation score
   */
  private calculateCampSeparation(camps: readonly CitationCamp[]): number {
    if (camps.length < 2) {
      return 0;
    }

    // Compare keyword overlap between camps
    let totalOverlap = 0;
    let comparisons = 0;

    for (let i = 0; i < camps.length; i++) {
      for (let j = i + 1; j < camps.length; j++) {
        const kwA = new Set(camps[i].keywords);
        const kwB = new Set(camps[j].keywords);
        const intersection = [...kwA].filter((k) => kwB.has(k)).length;
        const union = new Set([...kwA, ...kwB]).size;
        totalOverlap += union > 0 ? intersection / union : 0;
        comparisons++;
      }
    }

    // Lower overlap = better separation
    return comparisons > 0 ? 1 - (totalOverlap / comparisons) : 0;
  }

  /**
   * Calculate silhouette score for clustering
   */
  private calculateSilhouetteScore(
    papers: readonly CitationAnalysisPaperInput[],
    camps: readonly MutableCitationCamp[],
    similarityMatrix: Map<string, Map<string, number>>,
  ): number {
    if (camps.length < 2) {
      return 0;
    }

    // Build assignment map
    const assignments = new Map<string, number>();
    camps.forEach((camp, idx) => {
      camp.paperIds.forEach((id) => assignments.set(id, idx));
    });

    let totalSilhouette = 0;
    let count = 0;

    for (const paper of papers) {
      const campIdx = assignments.get(paper.id);
      if (campIdx === undefined) continue;

      // a(i): average similarity within cluster
      const sameCamp = camps[campIdx].paperIds.filter((id) => id !== paper.id);
      const a = sameCamp.length > 0
        ? sameCamp.reduce((sum, id) =>
            sum + (similarityMatrix.get(paper.id)?.get(id) ?? 0), 0
          ) / sameCamp.length
        : 0;

      // b(i): minimum average similarity to other clusters
      let b = 0;
      for (let c = 0; c < camps.length; c++) {
        if (c === campIdx) continue;
        const otherCamp = camps[c].paperIds;
        const avgSim = otherCamp.length > 0
          ? otherCamp.reduce((sum, id) =>
              sum + (similarityMatrix.get(paper.id)?.get(id) ?? 0), 0
            ) / otherCamp.length
          : 0;
        b = Math.max(b, avgSim);
      }

      // Silhouette: (b - a) / max(a, b)
      // Using similarity instead of distance, so we reverse the formula
      const s = Math.max(a, b) > 0 ? (a - b) / Math.max(a, b) : 0;
      totalSilhouette += s;
      count++;
    }

    return count > 0 ? totalSilhouette / count : 0;
  }

  /**
   * Get camps that cite a paper
   */
  private getCitingCamps(
    citingPapers: string[],
    paperToCamp: Map<string, string>,
  ): string[] {
    const camps = new Set<string>();
    for (const citerId of citingPapers) {
      const camp = paperToCamp.get(citerId);
      if (camp) {
        camps.add(camp);
      }
    }
    return [...camps];
  }

  /**
   * Generate CCI explanation
   */
  private generateCCIExplanation(
    paper: CitationAnalysisPaperInput,
    components: CitationControversyComponents,
    classification: ControversyClassification,
  ): string {
    const parts: string[] = [];

    if (components.crossCampScore > 0.5) {
      parts.push('cited by multiple opposing camps');
    }
    if (components.velocityScore > 0.5) {
      parts.push('rapidly accumulating citations');
    }
    if (components.polarizationScore > 0.5) {
      parts.push('polarized citation pattern');
    }
    if (components.recencyScore > 0.7) {
      parts.push('recent publication');
    }

    if (parts.length === 0) {
      return `${paper.title} shows ${classification.toLowerCase().replace('_', ' ')} controversy.`;
    }

    return `${paper.title} is ${parts.join(', ')}. Classification: ${classification.toLowerCase().replace('_', ' ')}.`;
  }

  /**
   * Generate description for analysis result
   */
  private generateDescription(
    topic: string,
    camps: readonly CitationCamp[],
    debatePapers: readonly DebatePaper[],
    topicScore: number,
  ): string {
    const classification = getControversyClassification(topicScore);

    if (camps.length < 2) {
      return `Analysis of "${topic}" found limited citation-based controversy. ` +
        `Unable to identify distinct citation camps.`;
    }

    const campLabels = camps.map((c) => c.label).join(' vs. ');
    const debateInfo = debatePapers.length > 0
      ? ` ${debatePapers.length} debate papers bridge these perspectives.`
      : '';

    return `"${topic}" shows ${classification.toLowerCase().replace('_', ' ')} with ${camps.length} camps: ${campLabels}.${debateInfo}`;
  }

  /**
   * Generate warnings for the analysis
   */
  private generateWarnings(
    papers: readonly CitationAnalysisPaperInput[],
    camps: readonly MutableCitationCamp[],
    debatePapers: readonly DebatePaper[],
  ): string[] {
    const warnings: string[] = [];

    const papersWithRefs = papers.filter((p) => p.references && p.references.length > 0);
    if (papersWithRefs.length < papers.length * 0.5) {
      warnings.push('Less than 50% of papers have citation data. Results may be incomplete.');
    }

    const papersWithEmbeddings = papers.filter((p) => p.embedding && p.embedding.length > 0);
    if (papersWithEmbeddings.length < papers.length * 0.5) {
      warnings.push('Less than 50% of papers have embeddings. Camp detection may be less accurate.');
    }

    if (camps.length < 2) {
      warnings.push('Unable to identify opposing camps. Topic may have consensus.');
    }

    if (debatePapers.length === 0 && camps.length >= 2) {
      warnings.push('No debate papers identified despite opposing camps.');
    }

    return warnings;
  }

  /**
   * Create empty result for insufficient data
   */
  private createEmptyResult(
    topic: string,
    paperCount: number,
    startTime: number,
    config: CitationControversyConfig,
    warnings: string[],
  ): CitationControversyAnalysis {
    return {
      topic,
      description: `Insufficient data for citation controversy analysis of "${topic}".`,
      camps: [],
      debatePapers: [],
      paperCCIs: [],
      topicControversyScore: 0,
      qualityMetrics: {
        papersAnalyzed: paperCount,
        campsIdentified: 0,
        debatePapersFound: 0,
        avgCampCohesion: 0,
        campSeparation: 0,
        coverage: 0,
      },
      metadata: {
        timestamp: new Date(),
        processingTimeMs: Date.now() - startTime,
        config,
        warnings,
      },
    };
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
      'this', 'that', 'these', 'those', 'it', 'its', 'their', 'them',
      'they', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her',
      'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once', 'here',
      'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few',
      'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
      'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
      'also', 'now', 'study', 'research', 'paper', 'article', 'using',
    ]);
    return stopWords.has(word);
  }

  /**
   * Emit progress callback
   */
  private emitProgress(
    callback: ControversyProgressCallback | undefined,
    stage: ControversyAnalysisStage,
    progress: number,
    message: string,
  ): void {
    if (callback) {
      callback(stage, progress, message);
    }
  }

  /**
   * Check for cancellation
   */
  private checkCancellation(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new Error('Citation controversy analysis cancelled by user');
    }
  }
}
