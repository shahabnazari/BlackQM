import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { PrismaService } from '../../../common/prisma.service';

/**
 * Unified Theme Extraction Service
 *
 * Enterprise-grade service for extracting and managing research themes across all source types
 * Provides single source of truth with full provenance tracking and statistical influence analysis
 *
 * Phase 9 Day 20 Task 1 Implementation
 *
 * Core Capabilities:
 * 1. Extract themes from ANY source type (papers, videos, podcasts, social media)
 * 2. Merge themes from multiple sources with deduplication
 * 3. Calculate statistical influence of each source on each theme
 * 4. Provide full transparency reports for researchers
 * 5. Track complete citation chain for reproducibility
 *
 * @enterprise Features:
 * - Request caching to prevent duplicate API calls
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - Cost tracking for AI operations
 * - Performance monitoring
 */

export interface UnifiedTheme {
  id: string;
  label: string;
  description?: string;
  keywords: string[];
  weight: number;
  controversial: boolean;
  confidence: number;
  sources: ThemeSource[];
  provenance: ThemeProvenance;
  extractedAt: Date;
  extractionModel: string;
}

export interface ThemeSource {
  id?: string;
  sourceType: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  sourceId: string;
  sourceUrl?: string;
  sourceTitle: string;
  sourceAuthor?: string;
  influence: number; // 0-1
  keywordMatches: number;
  excerpts: string[];
  timestamps?: Array<{ start: number; end: number; text: string }>;
  doi?: string;
  authors?: string[];
  year?: number;
}

export interface ThemeProvenance {
  paperInfluence: number;
  videoInfluence: number;
  podcastInfluence: number;
  socialInfluence: number;
  paperCount: number;
  videoCount: number;
  podcastCount: number;
  socialCount: number;
  averageConfidence: number;
  citationChain: string[];
}

/**
 * Phase 10 Day 31.3: Minimal theme interface for deduplication
 * Used for themes from heterogeneous sources before full unification
 */
interface DeduplicatableTheme {
  label: string;
  keywords: string[];
  weight: number;
  sourceIndices?: number[];
}

export interface SourceContent {
  id: string;
  type: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  title: string;
  content: string; // Full-text (if available) or abstract for papers, transcript for multimedia
  contentSource?: 'full-text' | 'abstract' | 'none'; // Phase 10 Day 5.15: Track content source
  author?: string;
  keywords: string[];
  url?: string;
  doi?: string;
  authors?: string[];
  year?: number;
  fullTextWordCount?: number; // Phase 10 Day 5.15: Full-text word count for transparency
  timestampedSegments?: Array<{ timestamp: number; text: string }>;
  // Phase 10 Day 5.16: Content type metadata for adaptive validation
  metadata?: {
    contentType?: 'none' | 'abstract' | 'full_text' | 'abstract_overflow';
    contentSource?: string;
    contentLength?: number;
    hasFullText?: boolean;
    fullTextStatus?: 'not_fetched' | 'fetching' | 'success' | 'failed';
    [key: string]: any; // Allow other metadata fields (videoId, duration, etc.)
  };
}

export interface ExtractionOptions {
  researchContext?: string;
  mergeWithExisting?: boolean;
  studyId?: string;
  collectionId?: string;
  maxThemes?: number;
  minConfidence?: number;
}

/**
 * Research purposes for purpose-adaptive theme extraction
 * Phase 10 Day 5.13 - Patent Claim #2: Purpose-Adaptive Algorithms
 */
export enum ResearchPurpose {
  Q_METHODOLOGY = 'q_methodology',
  SURVEY_CONSTRUCTION = 'survey_construction',
  QUALITATIVE_ANALYSIS = 'qualitative_analysis',
  LITERATURE_SYNTHESIS = 'literature_synthesis',
  HYPOTHESIS_GENERATION = 'hypothesis_generation',
}

/**
 * Purpose-specific configuration interface
 */
export interface PurposeConfig {
  purpose: ResearchPurpose;
  targetThemeCount: { min: number; max: number };
  extractionFocus: 'breadth' | 'depth' | 'saturation';
  themeGranularity: 'fine' | 'medium' | 'coarse';
  validationRigor: 'standard' | 'rigorous' | 'publication_ready';
  citation: string;
  description: string;
}

const ENTERPRISE_CONFIG = {
  MAX_SOURCES_PER_REQUEST: 50,
  MAX_THEMES_PER_EXTRACTION: 15,
  MIN_THEME_CONFIDENCE: 0.5,
  CACHE_TTL_SECONDS: 3600, // 1 hour
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  SIMILARITY_THRESHOLD: 0.7, // For theme deduplication
};

/**
 * Purpose-specific configurations for theme extraction
 * Phase 10 Day 5.13 - Patent Claim #2: Purpose-Adaptive Algorithms
 *
 * Each research purpose requires different extraction strategies:
 * - Q-Methodology: Breadth-focused (many diverse themes)
 * - Survey: Depth-focused (few robust constructs)
 * - Qualitative: Saturation-driven (until no new themes emerge)
 * - Synthesis: Meta-analytic (comprehensive coverage)
 * - Hypothesis: Theory-building (conceptual relationships)
 */
const PURPOSE_CONFIGS: Record<ResearchPurpose, PurposeConfig> = {
  [ResearchPurpose.Q_METHODOLOGY]: {
    purpose: ResearchPurpose.Q_METHODOLOGY,
    targetThemeCount: { min: 30, max: 80 },
    extractionFocus: 'breadth',
    themeGranularity: 'fine',
    validationRigor: 'rigorous',
    citation:
      'Stephenson, W. (1953). The Study of Behavior: Q-Technique and Its Methodology.',
    description:
      'Q-methodology requires a broad concourse of 30-80 diverse statements representing the full range of viewpoints on the topic. Extraction prioritizes breadth over depth to capture maximum diversity. While 40-60 is typical, focused studies can use as few as 30 statements.',
  },
  [ResearchPurpose.SURVEY_CONSTRUCTION]: {
    purpose: ResearchPurpose.SURVEY_CONSTRUCTION,
    targetThemeCount: { min: 5, max: 15 },
    extractionFocus: 'depth',
    themeGranularity: 'coarse',
    validationRigor: 'publication_ready',
    citation:
      'Churchill, G. A. (1979). A Paradigm for Developing Better Measures of Marketing Constructs. DeVellis, R. F. (2016). Scale Development: Theory and Applications.',
    description:
      'Survey construction requires 5-15 robust constructs that can be operationalized into measurement scales. Extraction prioritizes depth and construct validity over breadth.',
  },
  [ResearchPurpose.QUALITATIVE_ANALYSIS]: {
    purpose: ResearchPurpose.QUALITATIVE_ANALYSIS,
    targetThemeCount: { min: 5, max: 20 },
    extractionFocus: 'saturation',
    themeGranularity: 'medium',
    validationRigor: 'rigorous',
    citation:
      'Braun, V., & Clarke, V. (2006, 2019). Using thematic analysis in psychology / Reflecting on reflexive thematic analysis.',
    description:
      'Qualitative thematic analysis continues until data saturation is reached (no new themes emerging). Typically yields 5-20 themes depending on dataset complexity and research questions.',
  },
  [ResearchPurpose.LITERATURE_SYNTHESIS]: {
    purpose: ResearchPurpose.LITERATURE_SYNTHESIS,
    targetThemeCount: { min: 10, max: 25 },
    extractionFocus: 'breadth',
    themeGranularity: 'medium',
    validationRigor: 'publication_ready',
    citation:
      'Noblit, G. W., & Hare, R. D. (1988). Meta-Ethnography: Synthesizing Qualitative Studies.',
    description:
      'Literature synthesis requires comprehensive coverage of key themes across multiple studies. Meta-ethnographic approach identifies 10-25 themes representing the state of knowledge in the field.',
  },
  [ResearchPurpose.HYPOTHESIS_GENERATION]: {
    purpose: ResearchPurpose.HYPOTHESIS_GENERATION,
    targetThemeCount: { min: 8, max: 15 },
    extractionFocus: 'depth',
    themeGranularity: 'medium',
    validationRigor: 'rigorous',
    citation:
      'Glaser, B. G., & Strauss, A. L. (1967). The Discovery of Grounded Theory: Strategies for Qualitative Research.',
    description:
      'Hypothesis generation uses grounded theory principles to identify 8-15 conceptual themes that can be developed into testable relationships. Focus on theoretical sampling and constant comparison.',
  },
};

@Injectable()
export class UnifiedThemeExtractionService implements OnModuleInit {
  private readonly logger = new Logger(UnifiedThemeExtractionService.name);
  private readonly openai: OpenAI;
  private readonly cache = new Map<string, { data: any; timestamp: number }>();
  private themeGateway: any;

  // Phase 10 Day 31.2: Embedding configuration constants (eliminates magic numbers)
  private static readonly EMBEDDING_MODEL = 'text-embedding-3-large';
  private static readonly EMBEDDING_DIMENSIONS = 3072;
  private static readonly EMBEDDING_MAX_TOKENS = 8191; // OpenAI limit for text-embedding-3-large

  // Phase 10 Day 31.3: Theme extraction configuration constants (eliminates magic numbers)
  private static readonly CODING_MODEL = 'gpt-4-turbo-preview';
  private static readonly CODING_TEMPERATURE = 0.2; // Lower for consistent coding
  private static readonly THEME_LABELING_TEMPERATURE = 0.3;
  private static readonly MAX_BATCH_TOKENS = 100000; // Safe limit below GPT-4-turbo's 128k
  private static readonly MAX_CHARS_PER_SOURCE = 40000; // ~10k tokens (conservative)
  private static readonly CHARS_TO_TOKENS_RATIO = 4; // Approximate char-to-token conversion
  private static readonly MAX_SOURCES_PER_BATCH = 5;
  private static readonly CODE_EMBEDDING_CONCURRENCY = 10; // Parallel embedding generation
  private static readonly DEFAULT_MAX_THEMES = 15;
  private static readonly MAX_EXCERPTS_FOR_LABELING = 5;
  private static readonly MAX_EXCERPTS_PER_SOURCE = 3;
  private static readonly THEME_MERGE_SIMILARITY_THRESHOLD = 0.8; // Merge if > 0.8 similar
  private static readonly SEMANTIC_RELEVANCE_THRESHOLD = 0.3; // Minimum semantic similarity
  private static readonly VALIDATION_SCORE_COMPONENTS = 3; // coherence + distinctiveness + evidence
  private static readonly DEFAULT_VALIDATION_SCORE = 0.5;
  private static readonly DEFAULT_THEME_CONFIDENCE = 0.5;
  private static readonly MIN_CODES_FOR_COHERENCE = 2;
  private static readonly DEFAULT_COHERENCE_SCORE = 0.5;
  private static readonly DEFAULT_DISTINCTIVENESS_SCORE = 1.0;
  private static readonly MAX_THEMES_TO_LOG = 5; // Diagnostic logging limit

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Phase 10 Day 5.17.3: Initialize after module creation
   */
  onModuleInit() {
    this.logger.log('✅ UnifiedThemeExtractionService initialized');
  }

  /**
   * Set the WebSocket gateway for progress updates
   * Phase 10 Day 5.17.3: Called by LiteratureModule
   */
  setGateway(gateway: any) {
    this.themeGateway = gateway;
    this.logger.log('✅ ThemeExtractionGateway connected');
  }

  private emitProgress(
    userId: string,
    stage: string,
    percentage: number,
    message: string,
    details?: any,
  ) {
    if (this.themeGateway) {
      // Log userId for debugging WebSocket room mismatch issues
      this.logger.debug(
        `📡 Emitting progress to userId: ${userId} (${stage}: ${percentage}%)`,
      );
      this.themeGateway.emitProgress({
        userId,
        stage,
        percentage,
        message,
        details,
      });
    }
  }

  /**
   * Create 4-part transparent progress message
   * Phase 10 Day 5.13 - Patent Claim #9: 4-Part Transparent Progress Messaging
   *
   * Implements Nielsen's Usability Heuristic #1 (Visibility of System Status)
   * Reduces user anxiety by showing exactly what the machine is doing
   *
   * @param stageNumber - Current stage (1-6)
   * @param stageName - Name of stage (e.g., "Initial Coding")
   * @param percentage - Completion percentage (0-100)
   * @param userLevel - User expertise level for progressive disclosure
   * @param stats - Live statistics
   * @returns 4-part transparent progress message
   * @private
   */
  private create4PartProgressMessage(
    stageNumber: number,
    stageName: string,
    percentage: number,
    userLevel: 'novice' | 'researcher' | 'expert',
    stats: {
      sourcesAnalyzed: number;
      codesGenerated?: number;
      themesIdentified?: number;
      currentOperation: string;
    },
  ): TransparentProgressMessage {
    // Stage-specific messaging based on Braun & Clarke (2006, 2019)
    const stageMessages: Record<
      number,
      { what: Record<string, string>; why: string }
    > = {
      1: {
        what: {
          novice: `Reading all ${stats.sourcesAnalyzed} papers together and converting them into a format the AI can understand`,
          researcher: `Generating semantic embeddings from full source content using ${UnifiedThemeExtractionService.EMBEDDING_MODEL} (${UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS} dimensions)`,
          expert: `Corpus-level embedding generation: OpenAI ${UnifiedThemeExtractionService.EMBEDDING_MODEL}, batch size ${stats.sourcesAnalyzed}, full content (no truncation), cosine similarity space`,
        },
        why: `SCIENTIFIC PROCESS: Familiarization converts each article into a ${UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS}-dimensional semantic vector (embedding) that captures meaning mathematically. These embeddings enable: (1) Hierarchical clustering to find related concepts, (2) Cosine similarity calculations to measure semantic relationships (not keyword matching), (3) Provenance tracking showing which articles influence which themes. This implements Braun & Clarke (2019) Stage 1: reading ALL sources together prevents early bias, ensuring themes emerge from the complete dataset. The embeddings are the foundation for all downstream scientific analysis.`,
      },
      2: {
        what: {
          novice: `Looking for interesting ideas and concepts that appear across all ${stats.sourcesAnalyzed} papers. Found ${stats.codesGenerated || 0} initial concepts so far.`,
          researcher: `Performing cross-corpus initial coding to identify semantic patterns. Generated ${stats.codesGenerated || 0} codes from ${stats.sourcesAnalyzed} sources.`,
          expert: `AI-assisted initial coding: GPT-4 Turbo pattern detection across unified corpus, semantic clustering (threshold: 0.7), ${stats.codesGenerated || 0} codes extracted, cross-validation against embeddings`,
        },
        why: 'Initial coding identifies specific concepts and patterns ACROSS the entire dataset (Braun & Clarke, 2019). This prevents the error of extracting themes from individual papers separately—which misses cross-paper patterns and produces fragmented results.',
      },
      3: {
        what: {
          novice: `Grouping related concepts together into bigger ideas (themes). Building ${stats.themesIdentified || 0} potential themes from ${stats.codesGenerated || 0} concepts.`,
          researcher: `Clustering ${stats.codesGenerated || 0} codes into candidate themes using semantic similarity. Generated ${stats.themesIdentified || 0} candidate themes.`,
          expert: `Theme generation via hierarchical clustering: cosine similarity matrix, centroid calculation, ${stats.themesIdentified || 0} themes, silhouette score validation, semantic coherence >0.6`,
        },
        why: 'Theme generation searches for patterns across codes (Braun & Clarke, 2019). Themes are coherent patterns of meaning that appear throughout the dataset. This is where AI helps identify connections humans might miss in large datasets.',
      },
      4: {
        what: {
          novice: `Checking if the ${stats.themesIdentified || 0} themes make sense and truly appear across all papers. Removing themes that are too weak or rare.`,
          researcher: `Validating ${stats.themesIdentified || 0} candidate themes against full dataset. Cross-checking theme coherence and source coverage.`,
          expert: `Academic validation: coherence scoring, coverage analysis, cross-source triangulation, confidence thresholds (0.8+ for high), removing low-evidence themes (<0.6)`,
        },
        why: 'Theme review ensures themes are coherent and supported by data (Braun & Clarke, 2019). Themes must work at the individual extract level AND across the dataset. This prevents false positives from statistical noise.',
      },
      5: {
        what: {
          novice: `Refining the final ${stats.themesIdentified || 0} themes: giving them clear names and descriptions, merging similar ones, removing duplicates.`,
          researcher: `Refining ${stats.themesIdentified || 0} themes: merging overlaps (similarity >0.85), removing weak themes, generating clear definitions and labels.`,
          expert: `Theme refinement: overlap detection (cosine >0.85), deduplication, GPT-4 labeling, definition generation, quality control, final ${stats.themesIdentified || 0} themes`,
        },
        why: 'Refinement produces clear, distinct themes with precise definitions (Braun & Clarke, 2019). Themes should be coherent, distinctive, and meaningful. This stage ensures publication-ready theme descriptions.',
      },
      6: {
        what: {
          novice: `Calculating which papers influenced which themes and how strongly. This creates a full record of where each theme came from.`,
          researcher: `Calculating semantic influence: determining how much each source contributed to each theme based on embedding similarity.`,
          expert: `Provenance calculation: semantic influence matrix, source contribution weights, confidence scoring, citation chain construction, reproducibility metadata`,
        },
        why: 'Provenance tracking ensures reproducibility and transparency (academic publishing standards). This creates a complete audit trail from sources → themes, essential for scholarly rigor and allowing readers to trace theme origins.',
      },
    };

    const message = stageMessages[stageNumber];

    return {
      stageName,
      stageNumber,
      totalStages: 6,
      percentage,
      whatWeAreDoing: message.what[userLevel],
      whyItMatters: message.why,
      liveStats: stats,
    };
  }

  /**
   * Extract themes from ANY source type with full provenance tracking
   *
   * @param sourceType - Type of sources to extract from
   * @param sourceIds - IDs of sources (Paper.id, VideoTranscript.id, etc.)
   * @param options - Extraction configuration
   * @param providedSources - Optional: Full source data to avoid database queries
   * @returns Unified themes with complete provenance
   */
  async extractThemesFromSource(
    sourceType: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram',
    sourceIds: string[],
    options: ExtractionOptions = {},
    providedSources?: SourceContent[],
  ): Promise<UnifiedTheme[]> {
    const startTime = Date.now();
    this.logger.log(
      `Extracting themes from ${sourceType}: ${sourceIds.length} sources`,
    );

    // Validate input
    if (sourceIds.length === 0) {
      throw new Error('No source IDs provided');
    }
    if (sourceIds.length > ENTERPRISE_CONFIG.MAX_SOURCES_PER_REQUEST) {
      throw new Error(
        `Too many sources (max ${ENTERPRISE_CONFIG.MAX_SOURCES_PER_REQUEST})`,
      );
    }

    // Check cache
    const cacheKey = this.generateCacheKey(sourceType, sourceIds, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log('Returning cached themes');
      return cached;
    }

    try {
      // Phase 10 Day 30: CRITICAL FIX - Always check database for full-text, even with provided sources
      // This ensures familiarization reads ACTUAL full articles, not just abstracts from search
      let sources: SourceContent[];

      if (providedSources && providedSources.length > 0 && sourceType === 'paper') {
        this.logger.log('📚 Checking database for full-text versions of provided papers...');

        // Try to get full-text versions from database
        const dbSources = await this.fetchSourceContent(sourceType, sourceIds);

        // Create a map of database sources by ID for quick lookup
        const dbSourceMap = new Map(dbSources.map(s => [s.id, s]));

        // For each provided source, use database version if it has full-text, otherwise use provided
        sources = providedSources.map(providedSource => {
          const dbSource = dbSourceMap.get(providedSource.id);

          if (dbSource && (dbSource as any).fullText) {
            this.logger.log(`✅ Using full-text from database for paper: ${providedSource.title.substring(0, 50)}...`);
            return dbSource; // Has full-text in database
          } else {
            this.logger.log(`⚠️  No full-text in database for: ${providedSource.title.substring(0, 50)}... (using abstract)`);
            return providedSource; // Fallback to provided (abstract)
          }
        });

        const fullTextCount = sources.filter(s => (s as any).contentSource === 'full-text').length;
        const abstractCount = sources.length - fullTextCount;
        this.logger.log(`📊 Content sources: ${fullTextCount} full-text, ${abstractCount} abstracts`);

      } else if (providedSources && providedSources.length > 0) {
        this.logger.log('Using provided source data (non-paper sources)');
        sources = providedSources;
      } else {
        this.logger.log('Fetching source content from database');
        sources = await this.fetchSourceContent(sourceType, sourceIds);
      }

      if (sources.length === 0) {
        this.logger.warn('No valid sources found');
        return [];
      }

      // Extract themes using GPT-4
      const extractedThemes = await this.extractThemesWithAI(
        sources,
        options.researchContext,
        options.maxThemes,
      );

      // Calculate source influence for each theme
      const themesWithInfluence = await this.calculateInfluence(
        extractedThemes,
        sources,
      );

      // Store in database
      const storedThemes = await this.storeUnifiedThemes(
        themesWithInfluence,
        options.studyId,
        options.collectionId,
      );

      // Cache result
      this.setCache(cacheKey, storedThemes);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Extracted ${storedThemes.length} themes in ${duration}ms`,
      );

      return storedThemes;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Theme extraction failed: ${err.message}`, err.stack);
      throw error;
    }
  }

  /**
   * Merge themes from multiple source types
   * Deduplicates similar themes and calculates combined provenance
   *
   * @param sources - Array of source groups with their themes
   * @returns Merged unified themes
   */
  async mergeThemesFromSources(
    sources: Array<{
      type: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
      themes: DeduplicatableTheme[]; // Phase 10 Day 31.3: Properly typed
      sourceIds: string[];
    }>,
  ): Promise<UnifiedTheme[]> {
    this.logger.log(`Merging themes from ${sources.length} source groups`);

    // Phase 10 Day 31.3: Properly typed theme map with sources tracking
    type ThemeWithSources = DeduplicatableTheme & {
      sources?: Array<{ type: string; ids: string[] }>;
    };
    const themeMap = new Map<string, ThemeWithSources>();

    // Group similar themes across sources
    for (const sourceGroup of sources) {
      for (const theme of sourceGroup.themes) {
        const similarKey = this.findSimilarTheme(
          theme.label,
          Array.from(themeMap.keys()),
        );

        if (similarKey) {
          // Phase 10 Day 31.3: Merge with existing theme
          const existing = themeMap.get(similarKey)!;
          existing.sources = [...(existing.sources || []), { type: sourceGroup.type, ids: sourceGroup.sourceIds }];
          existing.keywords = [
            ...new Set([...existing.keywords, ...(theme.keywords || [])]),
          ];
          existing.weight = Math.max(existing.weight, theme.weight || 0);
        } else {
          // Phase 10 Day 31.3: Add as new theme with sources initialized
          themeMap.set(theme.label, {
            ...theme,
            sources: [{ type: sourceGroup.type, ids: sourceGroup.sourceIds }],
          });
        }
      }
    }

    // Calculate provenance for merged themes
    const mergedThemes = Array.from(themeMap.values());
    const themesWithProvenance =
      await this.calculateProvenanceForThemes(mergedThemes);

    this.logger.log(`Merged into ${themesWithProvenance.length} unique themes`);
    return themesWithProvenance;
  }

  /**
   * Get comprehensive provenance report for a theme
   * Shows researchers exactly where each theme came from
   *
   * @param themeId - ID of unified theme
   * @returns Detailed transparency report
   */
  async getThemeProvenanceReport(themeId: string) {
    const theme = await this.prisma.unifiedTheme.findUnique({
      where: { id: themeId },
      include: {
        sources: true,
        provenance: true,
      },
    });

    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    // Build citation chain
    const citationChain = this.buildCitationChain(theme.sources);

    // Calculate influential sources
    const influentialSources = theme.sources
      .sort((a: any, b: any) => b.influence - a.influence)
      .slice(0, 10)
      .map((s: any) => ({
        source: s.sourceTitle,
        type: s.sourceType,
        influence: s.influence,
        url: s.sourceUrl,
      }));

    return {
      theme: {
        id: theme.id,
        label: theme.label,
        description: theme.description,
        keywords: theme.keywords as string[],
        confidence: theme.confidence,
      },
      sources: theme.sources,
      statistics: {
        sourceBreakdown: {
          paper: theme.provenance?.paperInfluence || 0,
          youtube: theme.provenance?.videoInfluence || 0,
          podcast: theme.provenance?.podcastInfluence || 0,
          social: theme.provenance?.socialInfluence || 0,
        },
        sourceCounts: {
          papers: theme.provenance?.paperCount || 0,
          videos: theme.provenance?.videoCount || 0,
          podcasts: theme.provenance?.podcastCount || 0,
          social: theme.provenance?.socialCount || 0,
        },
        influentialSources,
        citationChain,
        extractionMethod: theme.extractionModel,
        confidence: theme.confidence,
      },
    };
  }

  /**
   * Extract themes from multiple sources (all types)
   * Orchestrates extraction and merging across different source types
   *
   * @param sources - Array of source contents to extract from
   * @param options - Extraction configuration
   * @returns Unified themes with complete provenance
   */
  async extractFromMultipleSources(
    sources: SourceContent[],
    options?: ExtractionOptions,
  ): Promise<{ themes: UnifiedTheme[]; provenance: any }> {
    this.logger.log(
      `Extracting from ${sources.length} sources across multiple types`,
    );

    if (sources.length === 0) {
      return { themes: [], provenance: {} };
    }

    // Group sources by type
    const sourcesByType = sources.reduce(
      (acc, source) => {
        if (!acc[source.type]) {
          acc[source.type] = [];
        }
        acc[source.type].push(source);
        return acc;
      },
      {} as Record<string, SourceContent[]>,
    );

    // Extract themes from each source type
    const extractionPromises = Object.entries(sourcesByType).map(
      async ([type, typeSources]) => {
        const sourceIds = typeSources.map((s) => s.id);
        // Pass the full source data to avoid database queries
        const themes = await this.extractThemesFromSource(
          type as any,
          sourceIds,
          options,
          typeSources, // Pass the full source data
        );
        return {
          type: type as any,
          themes,
          sourceIds,
        };
      },
    );

    const extractedGroups = await Promise.all(extractionPromises);

    // Merge themes from all sources
    const mergedThemes = await this.mergeThemesFromSources(extractedGroups);

    // Calculate overall provenance
    const provenance = mergedThemes.reduce(
      (acc, theme) => {
        acc[theme.id] = theme.provenance;
        return acc;
      },
      {} as Record<string, ThemeProvenance>,
    );

    return {
      themes: mergedThemes,
      provenance,
    };
  }

  /**
   * Get theme provenance (wrapper for getThemeProvenanceReport)
   *
   * @param themeId - ID of unified theme
   * @returns Provenance data
   */
  async getThemeProvenance(themeId: string) {
    return this.getThemeProvenanceReport(themeId);
  }

  /**
   * Filter themes by source types and influence
   *
   * @param studyId - Study ID to filter by
   * @param sourceType - Source type filter (optional)
   * @param minInfluence - Minimum influence threshold (optional)
   * @returns Filtered themes
   */
  async getThemesBySources(
    studyId: string,
    sourceType?: string,
    minInfluence?: number,
  ): Promise<UnifiedTheme[]> {
    this.logger.log(
      `Filtering themes for study ${studyId}, type=${sourceType}, minInfluence=${minInfluence}`,
    );

    const themes = await this.prisma.unifiedTheme.findMany({
      where: {
        studyId,
      },
      include: {
        sources: true,
        provenance: true,
      },
    });

    // Filter by source type if specified
    let filtered = themes;
    if (sourceType) {
      filtered = themes.filter((theme: any) =>
        theme.sources.some((s: any) => s.sourceType === sourceType),
      );
    }

    // Filter by minimum influence if specified
    if (minInfluence !== undefined) {
      filtered = filtered.filter((theme: any) => {
        const sources = theme.sources.filter(
          (s: any) => !sourceType || s.sourceType === sourceType,
        );
        const maxInfluence = Math.max(...sources.map((s: any) => s.influence));
        return maxInfluence >= minInfluence;
      });
    }

    return filtered.map((t: any) => this.mapToUnifiedTheme(t));
  }

  /**
   * Get all themes for a collection
   *
   * @param collectionId - Collection ID
   * @returns Collection themes with provenance
   */
  async getCollectionThemes(collectionId: string): Promise<UnifiedTheme[]> {
    this.logger.log(`Fetching themes for collection ${collectionId}`);

    const themes = await this.prisma.unifiedTheme.findMany({
      where: {
        collectionId,
      },
      include: {
        sources: true,
        provenance: true,
      },
    });

    return themes.map((t: any) => this.mapToUnifiedTheme(t));
  }

  /**
   * Compare themes across multiple studies
   *
   * @param studyIds - Array of study IDs to compare
   * @returns Comparison analysis
   */
  async compareStudyThemes(studyIds: string[]): Promise<{
    commonThemes: Array<{ label: string; occurrences: number; studies: string[] }>; // Phase 10 Day 31.3: Properly typed
    uniqueThemes: Array<UnifiedTheme & { studyId: string }>; // Phase 10 Day 31.3: Properly typed
    themesByStudy: Record<string, UnifiedTheme[]>;
  }> {
    this.logger.log(`Comparing themes across ${studyIds.length} studies`);

    // Fetch themes for each study
    const themesByStudy: Record<string, UnifiedTheme[]> = {};
    for (const studyId of studyIds) {
      const themes = await this.prisma.unifiedTheme.findMany({
        where: { studyId },
        include: {
          sources: true,
          provenance: true,
        },
      });
      themesByStudy[studyId] = themes.map((t: any) =>
        this.mapToUnifiedTheme(t),
      );
    }

    // Find common themes (similar labels across studies)
    const allThemeLabels = studyIds.flatMap((id) =>
      themesByStudy[id].map((t) => t.label),
    );
    const labelCounts = allThemeLabels.reduce(
      (acc, label) => {
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const commonThemeLabels = Object.entries(labelCounts)
      .filter(([_, count]) => count > 1)
      .map(([label]) => label);

    const commonThemes = commonThemeLabels.map((label) => {
      const themesWithLabel = studyIds.flatMap((id) =>
        themesByStudy[id].filter((t) => t.label === label),
      );
      return {
        label,
        occurrences: themesWithLabel.length,
        studies: themesWithLabel.map((t) => t.id),
      };
    });

    // Find unique themes (appear in only one study)
    const uniqueThemes = studyIds.flatMap((studyId) =>
      themesByStudy[studyId]
        .filter((theme) => !commonThemeLabels.includes(theme.label))
        .map((theme) => ({
          ...theme,
          studyId,
        })),
    );

    return {
      commonThemes,
      uniqueThemes,
      themesByStudy,
    };
  }

  /**
   * Map database theme to UnifiedTheme interface
   * @private
   */
  private mapToUnifiedTheme(dbTheme: any): UnifiedTheme {
    return {
      id: dbTheme.id,
      label: dbTheme.label,
      description: dbTheme.description,
      keywords: dbTheme.keywords as string[],
      weight: dbTheme.weight,
      controversial: dbTheme.controversial,
      confidence: dbTheme.confidence,
      sources: dbTheme.sources || [],
      provenance: dbTheme.provenance || {
        paperInfluence: 0,
        videoInfluence: 0,
        podcastInfluence: 0,
        socialInfluence: 0,
        paperCount: 0,
        videoCount: 0,
        podcastCount: 0,
        socialCount: 0,
        averageConfidence: dbTheme.confidence,
        citationChain: [],
      },
      extractedAt: dbTheme.extractedAt,
      extractionModel: dbTheme.extractionModel,
    };
  }

  /**
   * Fetch source content based on type
   * @private
   */
  private async fetchSourceContent(
    sourceType: string,
    sourceIds: string[],
  ): Promise<SourceContent[]> {
    this.logger.log(`Fetching ${sourceIds.length} ${sourceType} sources`);

    switch (sourceType) {
      case 'paper':
        return this.fetchPapers(sourceIds);
      case 'youtube':
      case 'podcast':
      case 'tiktok':
      case 'instagram':
        return this.fetchMultimedia(sourceIds, sourceType);
      default:
        throw new Error(`Unsupported source type: ${sourceType}`);
    }
  }

  /**
   * Fetch paper content
   * @private
   */
  private async fetchPapers(paperIds: string[]): Promise<SourceContent[]> {
    const papers = await this.prisma.paper.findMany({
      where: { id: { in: paperIds } },
    });

    return papers.map((paper) => {
      // Phase 10 Day 5.15: Prioritize full-text over abstract
      const content = paper.fullText || paper.abstract || '';
      const contentSource = paper.fullText
        ? 'full-text'
        : paper.abstract
          ? 'abstract'
          : 'none';

      return {
        id: paper.id,
        type: 'paper' as const,
        title: paper.title,
        content,
        contentSource, // Track which content was used
        author: Array.isArray(paper.authors)
          ? (paper.authors as string[]).join(', ')
          : 'Unknown',
        keywords: Array.isArray(paper.keywords)
          ? (paper.keywords as string[])
          : [],
        url: paper.url || undefined,
        doi: paper.doi || undefined,
        authors: Array.isArray(paper.authors)
          ? (paper.authors as string[])
          : undefined,
        year: paper.year || undefined,
        fullTextWordCount: paper.fullTextWordCount || undefined,
      };
    });
  }

  /**
   * Fetch multimedia content
   * @private
   */
  private async fetchMultimedia(
    sourceIds: string[],
    sourceType: string,
  ): Promise<SourceContent[]> {
    const transcripts = await this.prisma.videoTranscript.findMany({
      where: {
        sourceId: { in: sourceIds },
      },
    });

    return transcripts.map((transcript) => ({
      id: transcript.id,
      type: sourceType as any,
      title: transcript.title,
      content: transcript.transcript,
      author: transcript.author || undefined,
      keywords: [],
      url: transcript.sourceUrl,
      timestampedSegments: Array.isArray(transcript.timestampedText)
        ? (transcript.timestampedText as any[])
        : undefined,
    }));
  }

  /**
   * Phase 10 Day 5.5: Extract themes from single source with per-paper caching
   * Enterprise optimization: Cache individual paper themes to avoid reprocessing
   *
   * @param source - Single source content
   * @param researchContext - Optional research context
   * @param userId - User ID for progress tracking
   * @returns Extracted themes for this single source
   */
  async extractThemesFromSingleSource(
    source: SourceContent,
    researchContext?: string,
    userId?: string,
  ): Promise<any[]> {
    // Generate content-based cache key (papers with same content get same themes)
    const contentHash = crypto
      .createHash('md5')
      .update(source.content + (researchContext || ''))
      .digest('hex');

    const cacheKey = `single:${source.type}:${contentHash}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log(`✅ Cache HIT for: ${source.title.substring(0, 50)}...`);
      return cached;
    }

    this.logger.log(
      `🔄 Cache MISS - Extracting themes for: ${source.title.substring(0, 50)}...`,
    );

    // Extract themes for single source
    const themes = await this.extractThemesWithAI([source], researchContext, 5); // Max 5 themes per paper

    // Cache the result
    this.setCache(cacheKey, themes);

    return themes;
  }

  /**
   * Phase 10 Day 5.6 (FIXED): Extract themes from multiple sources with proper concurrency control
   * Enterprise pattern: p-limit library for battle-tested concurrency control
   *
   * FIXES from Day 5.5:
   * - ✅ Proper p-limit implementation using npm package (Issue #1)
   * - ✅ Concurrency control at PAPER level, not batch level (Issue #2)
   * - ✅ Graceful error handling with Promise.allSettled (Issue #3)
   * - ✅ Division-by-zero protection in stats (Issue #4)
   * - ✅ Input validation (Issue #6)
   * - ✅ Accurate progress tracking (Issue #7)
   *
   * @param sources - Array of source content
   * @param options - Extraction options
   * @param userId - User ID for progress tracking
   * @returns Merged themes from all sources with stats and error details
   */
  async extractThemesInBatches(
    sources: SourceContent[],
    options: ExtractionOptions = {},
    userId?: string,
  ): Promise<{ themes: UnifiedTheme[]; stats: any }> {
    const startTime = Date.now();
    const MAX_CONCURRENT_CALLS = 2; // Max 2 concurrent GPT-4 API calls (rate limit safety)

    // ✅ FIX #6: Input validation
    if (!sources || sources.length === 0) {
      throw new Error('No sources provided for theme extraction');
    }

    if (sources.length > ENTERPRISE_CONFIG.MAX_SOURCES_PER_REQUEST) {
      throw new Error(
        `Too many sources: ${sources.length} (max ${ENTERPRISE_CONFIG.MAX_SOURCES_PER_REQUEST})`,
      );
    }

    this.logger.log(
      `🚀 Starting batch extraction for ${sources.length} sources`,
    );
    this.logger.log(`   Max concurrent GPT-4 calls: ${MAX_CONCURRENT_CALLS}`);

    // ✅ FIX #1 & #2: Use p-limit library at PAPER level
    const limit = pLimit(MAX_CONCURRENT_CALLS);

    const stats = {
      totalSources: sources.length,
      successfulSources: 0,
      failedSources: 0,
      cacheHits: 0,
      cacheMisses: 0,
      processingTimes: [] as number[],
      errors: [] as Array<{ sourceTitle: string; error: string }>,
    };

    // ✅ FIX #3: Use Promise.allSettled for graceful error handling
    const results = await Promise.allSettled(
      sources.map((source, index) =>
        limit(async () => {
          const sourceStart = Date.now();

          try {
            this.logger.log(
              `📄 Processing source ${index + 1}/${sources.length}: ${source.title.substring(0, 50)}...`,
            );

            const themes = await this.extractThemesFromSingleSource(
              source,
              options.researchContext,
              userId,
            );

            const sourceTime = Date.now() - sourceStart;
            stats.processingTimes.push(sourceTime);
            stats.successfulSources++;

            // ✅ FIX #7: Emit progress AFTER source completes
            const progress = Math.round(
              (stats.successfulSources / sources.length) * 100,
            );
            this.emitProgress(
              userId || 'system',
              'batch_extraction',
              progress,
              `Completed ${stats.successfulSources} of ${sources.length} sources`,
              {
                completed: stats.successfulSources,
                total: sources.length,
                failed: stats.failedSources,
              },
            );

            this.logger.log(
              `   ✅ Source ${index + 1} complete in ${sourceTime}ms (${themes.length} themes)`,
            );

            return { success: true, themes, source };
          } catch (error: any) {
            const sourceTime = Date.now() - sourceStart;
            stats.processingTimes.push(sourceTime);
            stats.failedSources++;

            const errorMsg =
              error instanceof Error ? error.message : 'Unknown error';
            stats.errors.push({
              sourceTitle: source.title,
              error: errorMsg,
            });

            this.logger.warn(
              `   ⚠️ Source ${index + 1} failed after ${sourceTime}ms: ${errorMsg}`,
            );

            return { success: false, themes: [], source, error: errorMsg };
          }
        }),
      ),
    );

    // Phase 10 Day 31.3: Properly typed - collect all themes from successful extractions
    const allThemes: DeduplicatableTheme[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        allThemes.push(...(result.value.themes as DeduplicatableTheme[]));
      }
    }

    this.logger.log(
      `📊 Extraction results: ${stats.successfulSources} success, ${stats.failedSources} failed`,
    );

    if (stats.failedSources > 0) {
      this.logger.warn(
        `   Failed sources: ${stats.errors.map((e) => e.sourceTitle).join(', ')}`,
      );
    }

    // Deduplicate and merge similar themes across all sources
    this.logger.log(`🔄 Deduplicating ${allThemes.length} themes...`);
    const deduplicatedThemes = this.deduplicateThemes(allThemes);

    // Calculate unified influence across all SUCCESSFUL sources
    const successfulSources = sources.filter((_, index) => {
      const result = results[index];
      return result.status === 'fulfilled' && (result.value as any).success;
    });

    const themesWithInfluence = await this.calculateInfluence(
      deduplicatedThemes,
      successfulSources,
    );

    // Store in database
    const storedThemes = await this.storeUnifiedThemes(
      themesWithInfluence,
      options.studyId,
      options.collectionId,
    );

    const totalDuration = Date.now() - startTime;

    // ✅ FIX #4: Division-by-zero protection
    const avgSourceTime =
      stats.processingTimes.length > 0
        ? stats.processingTimes.reduce((a, b) => a + b, 0) /
          stats.processingTimes.length
        : 0;

    this.logger.log(`🎉 Batch extraction complete!`);
    this.logger.log(
      `   Total time: ${totalDuration}ms (${(totalDuration / 1000 / 60).toFixed(1)} minutes)`,
    );
    this.logger.log(`   Avg source time: ${avgSourceTime.toFixed(0)}ms`);
    this.logger.log(`   Themes extracted: ${storedThemes.length}`);
    this.logger.log(
      `   Success rate: ${((stats.successfulSources / sources.length) * 100).toFixed(1)}%`,
    );

    return {
      themes: storedThemes,
      stats: {
        ...stats,
        totalDuration,
        avgSourceTime,
        themesExtracted: storedThemes.length,
        successRate: (stats.successfulSources / sources.length) * 100,
      },
    };
  }

  /**
   * Phase 10 Day 5.5: Deduplicate similar themes using semantic similarity
   * Enterprise pattern: Cosine similarity with keyword overlap
   * Phase 10 Day 31.3: Properly typed with DeduplicatableTheme interface
   *
   * @private
   */
  private deduplicateThemes(themes: DeduplicatableTheme[]): DeduplicatableTheme[] {
    if (themes.length === 0) return [];

    const uniqueThemes: DeduplicatableTheme[] = [];
    const seen = new Set<string>();

    for (const theme of themes) {
      const normalizedLabel = theme.label.toLowerCase().trim();

      // Check if we've seen this exact label
      if (seen.has(normalizedLabel)) {
        // Find and merge with existing theme
        const existing = uniqueThemes.find(
          (t) => t.label.toLowerCase() === normalizedLabel,
        );
        if (existing) {
          // Merge keywords
          existing.keywords = [
            ...new Set([...existing.keywords, ...theme.keywords]),
          ];
          // Take higher weight
          existing.weight = Math.max(existing.weight, theme.weight);
          // Merge source indices if present
          if (theme.sourceIndices && existing.sourceIndices) {
            existing.sourceIndices = [
              ...new Set([...existing.sourceIndices, ...theme.sourceIndices]),
            ];
          }
        }
      } else {
        // Check for similar themes (keyword overlap > 50%)
        let merged = false;
        for (const existing of uniqueThemes) {
          const overlap = this.calculateKeywordOverlap(
            theme.keywords,
            existing.keywords,
          );
          if (overlap > 0.5) {
            // Merge into existing
            existing.keywords = [
              ...new Set([...existing.keywords, ...theme.keywords]),
            ];
            existing.weight = Math.max(existing.weight, theme.weight);
            if (theme.sourceIndices && existing.sourceIndices) {
              existing.sourceIndices = [
                ...new Set([...existing.sourceIndices, ...theme.sourceIndices]),
              ];
            }
            merged = true;
            break;
          }
        }

        if (!merged) {
          uniqueThemes.push({ ...theme });
          seen.add(normalizedLabel);
        }
      }
    }

    this.logger.log(
      `   Deduplicated ${themes.length} → ${uniqueThemes.length} themes`,
    );
    return uniqueThemes;
  }

  /**
   * Calculate keyword overlap between two theme keyword sets
   * @private
   */
  private calculateKeywordOverlap(
    keywords1: string[],
    keywords2: string[],
  ): number {
    const set1 = new Set(keywords1.map((k) => k.toLowerCase()));
    const set2 = new Set(keywords2.map((k) => k.toLowerCase()));
    const intersection = new Set([...set1].filter((k) => set2.has(k)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Extract themes using AI with retry logic
   * @private
   */
  private async extractThemesWithAI(
    sources: SourceContent[],
    researchContext?: string,
    maxThemes?: number,
  ): Promise<any[]> {
    const themesLimit =
      maxThemes || ENTERPRISE_CONFIG.MAX_THEMES_PER_EXTRACTION;

    // PHASE 10 DAY 5.17.3: Log OpenAI API call details
    this.logger.log(`\n🤖 Calling OpenAI API for theme extraction...`);
    this.logger.log(`   • Model: gpt-4-turbo-preview`);
    this.logger.log(`   • Sources: ${sources.length}`);
    this.logger.log(`   • Max themes: ${themesLimit}`);
    this.logger.log(
      `   • Context: ${researchContext || 'General research literature review'}`,
    );
    this.logger.log(`   • Temperature: 0.3`);
    this.logger.log(`   • Response format: JSON object`);

    const prompt = `Extract research themes from these sources.

Research Context: ${researchContext || 'General research literature review'}

Sources:
${sources.map((s, i) => `${i + 1}. [${s.type.toUpperCase()}] ${s.title}\n${s.content.substring(0, 500)}...`).join('\n\n')}

Extract up to ${themesLimit} main research themes that appear across these sources.

For each theme, provide:
1. Theme label (2-5 words, clear and specific)
2. Description (1-2 sentences explaining the theme)
3. Keywords (3-7 relevant keywords)
4. Weight (0.0-1.0, based on prevalence across sources)
5. Source indices (which sources mention this theme)

Return JSON format:
{
  "themes": [
    {
      "label": "Climate Change Adaptation Strategies",
      "description": "Examines methods and approaches for adapting to climate change impacts.",
      "keywords": ["adaptation", "resilience", "mitigation", "climate policy"],
      "weight": 0.85,
      "sourceIndices": [1, 2, 4],
      "controversial": false
    }
  ]
}`;

    const promptLength = prompt.length;
    const estimatedTokens = Math.ceil(promptLength / 4);
    this.logger.log(
      `   • Prompt length: ${promptLength.toLocaleString()} chars (~${estimatedTokens.toLocaleString()} tokens)`,
    );

    let lastError: Error | null = null;
    const totalStartTime = Date.now();

    for (
      let attempt = 1;
      attempt <= ENTERPRISE_CONFIG.MAX_RETRY_ATTEMPTS;
      attempt++
    ) {
      let attemptStartTime = Date.now();
      try {
        this.logger.log(
          `\n   🔄 Attempt ${attempt}/${ENTERPRISE_CONFIG.MAX_RETRY_ATTEMPTS}...`,
        );
        attemptStartTime = Date.now();

        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const attemptDuration = (
          (Date.now() - attemptStartTime) /
          1000
        ).toFixed(2);

        // PHASE 10 DAY 5.17.3: Log OpenAI response details
        this.logger.log(
          `   ✅ OpenAI API call successful in ${attemptDuration}s`,
        );
        this.logger.log(`      • Model used: ${response.model}`);
        this.logger.log(
          `      • Tokens - Prompt: ${response.usage?.prompt_tokens || 'N/A'}`,
        );
        this.logger.log(
          `      • Tokens - Completion: ${response.usage?.completion_tokens || 'N/A'}`,
        );
        this.logger.log(
          `      • Tokens - Total: ${response.usage?.total_tokens || 'N/A'}`,
        );
        this.logger.log(
          `      • Finish reason: ${response.choices[0].finish_reason}`,
        );

        const result = JSON.parse(response.choices[0].message.content || '{}');
        const themesExtracted = result.themes?.length || 0;
        this.logger.log(`      • Themes extracted: ${themesExtracted}`);

        if (themesExtracted > 0) {
          this.logger.log(`      • First theme: "${result.themes[0].label}"`);
        }

        return result.themes || [];
      } catch (error) {
        lastError = error as Error;
        const attemptDuration = (
          (Date.now() - attemptStartTime) /
          1000
        ).toFixed(2);

        this.logger.warn(
          `   ❌ Attempt ${attempt} failed after ${attemptDuration}s: ${(error as Error).message}`,
        );

        if (attempt < ENTERPRISE_CONFIG.MAX_RETRY_ATTEMPTS) {
          const delay =
            ENTERPRISE_CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          this.logger.log(
            `   ⏳ Retrying in ${delay}ms with exponential backoff...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
    this.logger.error(
      `   ❌ All ${ENTERPRISE_CONFIG.MAX_RETRY_ATTEMPTS} attempts failed after ${totalDuration}s`,
    );

    throw lastError || new Error('Theme extraction failed after all retries');
  }

  /**
   * Calculate statistical influence of each source on each theme
   * @private
   */
  private async calculateInfluence(
    themes: any[],
    sources: SourceContent[],
  ): Promise<any[]> {
    return themes.map((theme) => {
      const themeSources: ThemeSource[] = [];

      // Calculate influence for each source
      for (const source of sources) {
        const influence = this.calculateSourceInfluence(
          theme.keywords,
          source.content,
        );

        if (influence > 0) {
          themeSources.push({
            sourceType: source.type,
            sourceId: source.id,
            sourceUrl: source.url,
            sourceTitle: source.title,
            sourceAuthor: source.author,
            influence,
            keywordMatches: this.countKeywordMatches(
              theme.keywords,
              source.content,
            ),
            excerpts: this.extractRelevantExcerpts(
              theme.keywords,
              source.content,
            ),
            timestamps: source.timestampedSegments
              ? this.findRelevantTimestamps(
                  theme.keywords,
                  source.timestampedSegments,
                )
              : undefined,
            doi: source.doi,
            authors: source.authors,
            year: source.year,
          });
        }
      }

      // Normalize influence scores to sum to 1.0
      const totalInfluence = themeSources.reduce(
        (sum, s) => sum + s.influence,
        0,
      );
      if (totalInfluence > 0) {
        themeSources.forEach((s) => {
          s.influence = s.influence / totalInfluence;
        });
      }

      return {
        ...theme,
        sources: themeSources,
      };
    });
  }

  /**
   * Calculate how much a source influences a theme
   * Based on keyword matches and content overlap
   * @private
   */
  private calculateSourceInfluence(
    keywords: string[],
    content: string,
  ): number {
    const lowerContent = content.toLowerCase();
    const lowerKeywords = keywords.map((k) => k.toLowerCase());

    let score = 0;
    for (const keyword of lowerKeywords) {
      if (lowerContent.includes(keyword)) {
        // Count occurrences
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        score += matches ? matches.length : 0;
      }
    }

    // Normalize to 0-1 range (assuming max 20 keyword occurrences is very high)
    return Math.min(score / 20, 1.0);
  }

  /**
   * Count keyword matches in content
   * @private
   */
  private countKeywordMatches(keywords: string[], content: string): number {
    const lowerContent = content.toLowerCase();
    return keywords.filter((k) => lowerContent.includes(k.toLowerCase()))
      .length;
  }

  /**
   * Extract relevant text excerpts containing keywords
   * @private
   */
  private extractRelevantExcerpts(
    keywords: string[],
    content: string,
    maxExcerpts: number = 3,
  ): string[] {
    const excerpts: string[] = [];
    const sentences = content.split(/[.!?]+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasKeyword = keywords.some((k) =>
        lowerSentence.includes(k.toLowerCase()),
      );

      if (hasKeyword) {
        excerpts.push(sentence.trim());
        if (excerpts.length >= maxExcerpts) break;
      }
    }

    return excerpts;
  }

  /**
   * Find relevant timestamps in multimedia content
   * @private
   */
  private findRelevantTimestamps(
    keywords: string[],
    segments: Array<{ timestamp: number; text: string }>,
  ): Array<{ start: number; end: number; text: string }> {
    const timestamps: Array<{ start: number; end: number; text: string }> = [];

    for (let i = 0; i < segments.length; i++) {
      const text = segments[i].text.toLowerCase();
      const hasKeyword = keywords.some((k) => text.includes(k.toLowerCase()));

      if (hasKeyword) {
        const start = segments[i].timestamp;
        const end = segments[i + 1]?.timestamp || start + 10;
        timestamps.push({
          start,
          end,
          text: segments[i].text,
        });
      }
    }

    return timestamps;
  }

  /**
   * Store unified themes in database
   * @private
   */
  private async storeUnifiedThemes(
    themes: any[],
    studyId?: string,
    collectionId?: string,
  ): Promise<UnifiedTheme[]> {
    const stored: UnifiedTheme[] = [];

    for (const theme of themes) {
      const created = await this.prisma.unifiedTheme.create({
        data: {
          label: theme.label,
          description: theme.description,
          keywords: theme.keywords,
          weight: theme.weight,
          controversial: theme.controversial || false,
          confidence: 0.8,
          extractionModel: 'gpt-4-turbo-preview',
          studyId,
          collectionId,
          sources: {
            create: theme.sources.map((source: ThemeSource) => ({
              sourceType: source.sourceType,
              sourceId: source.sourceId,
              sourceUrl: source.sourceUrl,
              sourceTitle: source.sourceTitle,
              sourceAuthor: source.sourceAuthor,
              influence: source.influence,
              keywordMatches: source.keywordMatches,
              excerpts: source.excerpts,
              timestamps: source.timestamps,
              doi: source.doi,
              authors: source.authors,
              year: source.year,
            })),
          },
        },
        include: {
          sources: true,
        },
      });

      // Calculate and store provenance
      await this.calculateAndStoreProvenance(created.id, theme.sources);

      const themeWithProvenance = await this.prisma.unifiedTheme.findUnique({
        where: { id: created.id },
        include: {
          sources: true,
          provenance: true,
        },
      });

      stored.push(themeWithProvenance as any);
    }

    return stored;
  }

  /**
   * Calculate and store provenance statistics
   * @private
   */
  private async calculateAndStoreProvenance(
    themeId: string,
    sources: ThemeSource[],
  ): Promise<void> {
    // Calculate influence by type
    const byType = sources.reduce(
      (acc, src) => {
        if (src.sourceType === 'paper') acc.paper += src.influence;
        else if (src.sourceType === 'youtube') acc.youtube += src.influence;
        else if (src.sourceType === 'podcast') acc.podcast += src.influence;
        else acc.social += src.influence;
        return acc;
      },
      { paper: 0, youtube: 0, podcast: 0, social: 0 },
    );

    // Count by type
    const counts = sources.reduce(
      (acc, src) => {
        if (src.sourceType === 'paper') acc.paper++;
        else if (src.sourceType === 'youtube') acc.youtube++;
        else if (src.sourceType === 'podcast') acc.podcast++;
        else acc.social++;
        return acc;
      },
      { paper: 0, youtube: 0, podcast: 0, social: 0 },
    );

    // Build citation chain
    const citationChain = this.buildCitationChain(sources);

    await this.prisma.themeProvenance.create({
      data: {
        themeId,
        paperInfluence: byType.paper,
        videoInfluence: byType.youtube,
        podcastInfluence: byType.podcast,
        socialInfluence: byType.social,
        paperCount: counts.paper,
        videoCount: counts.youtube,
        podcastCount: counts.podcast,
        socialCount: counts.social,
        averageConfidence: 0.8,
        citationChain,
      },
    });
  }

  /**
   * Build citation chain for reproducibility
   * @private
   */
  private buildCitationChain(sources: any[]): string[] {
    return sources
      .slice(0, 10)
      .map((s) => {
        if (s.doi) return `DOI: ${s.doi}`;
        if (s.sourceUrl) return s.sourceUrl;
        return s.sourceTitle;
      })
      .filter(Boolean);
  }

  /**
   * Calculate provenance for themes
   * @private
   */
  private async calculateProvenanceForThemes(
    themes: any[],
  ): Promise<UnifiedTheme[]> {
    for (const theme of themes) {
      const sourcesByType = theme.sources.reduce(
        (acc: any, src: ThemeSource) => {
          const type =
            src.sourceType === 'youtube' || src.sourceType === 'podcast'
              ? 'video'
              : src.sourceType === 'paper'
                ? 'paper'
                : 'social';
          acc[type] = (acc[type] || 0) + src.influence;
          return acc;
        },
        {},
      );

      const totalInfluence =
        Object.values<number>(sourcesByType).reduce(
          (sum: number, val: number) => sum + val,
          0,
        ) || 1;

      theme.provenance = {
        paperInfluence: (Number(sourcesByType.paper) || 0) / totalInfluence,
        videoInfluence: (Number(sourcesByType.video) || 0) / totalInfluence,
        podcastInfluence: (Number(sourcesByType.podcast) || 0) / totalInfluence,
        socialInfluence: (Number(sourcesByType.social) || 0) / totalInfluence,
        paperCount: theme.sources.filter(
          (s: ThemeSource) => s.sourceType === 'paper',
        ).length,
        videoCount: theme.sources.filter(
          (s: ThemeSource) => s.sourceType === 'youtube',
        ).length,
        podcastCount: theme.sources.filter(
          (s: ThemeSource) => s.sourceType === 'podcast',
        ).length,
        socialCount: theme.sources.filter(
          (s: ThemeSource) =>
            s.sourceType === 'tiktok' || s.sourceType === 'instagram',
        ).length,
        averageConfidence: 0.8,
        citationChain: this.buildCitationChain(theme.sources),
      };
    }

    return themes;
  }

  /**
   * Find similar theme by label (for deduplication)
   * @private
   */
  private findSimilarTheme(
    label: string,
    existingLabels: string[],
  ): string | null {
    const labelLower = label.toLowerCase();

    for (const existing of existingLabels) {
      const existingLower = existing.toLowerCase();
      const similarity = this.calculateSimilarity(labelLower, existingLower);

      if (similarity > ENTERPRISE_CONFIG.SIMILARITY_THRESHOLD) {
        return existing;
      }
    }

    return null;
  }

  /**
   * Calculate string similarity using Jaccard index
   * @private
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Handle empty strings - they should have 0 similarity
    if (str1 === '' || str2 === '') {
      return 0;
    }

    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Generate cache key for request
   * @private
   */
  private generateCacheKey(
    sourceType: string,
    sourceIds: string[],
    options: ExtractionOptions,
  ): string {
    const data = {
      sourceType,
      sourceIds: sourceIds.sort(),
      context: options.researchContext || '',
      maxThemes: options.maxThemes || 0,
    };
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Get from cache
   * @private
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > ENTERPRISE_CONFIG.CACHE_TTL_SECONDS * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   * @private
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // ========================================================================
  // PHASE 10 DAY 5.8 WEEK 1: ACADEMIC-GRADE THEME EXTRACTION
  // Based on Braun & Clarke (2006) Reflexive Thematic Analysis
  // ========================================================================

  /**
   * Academic-grade theme extraction with semantic embeddings
   *
   * Implements rigorous 6-stage qualitative methodology:
   * 1. Familiarization - Generate embeddings from FULL content
   * 2. Initial Coding - Identify semantic clusters
   * 3. Theme Generation - Group codes into candidate themes
   * 4. Theme Review - Validate against full dataset
   * 5. Refinement - Remove weak themes, merge overlaps
   * 6. Provenance - Calculate semantic influence (not keywords)
   *
   * @param sources - Full source content (NO TRUNCATION)
   * @param options - Extraction configuration with methodology choice
   * @param progressCallback - WebSocket callback for 6-stage progress
   * @returns Themes with academic validation and methodology report
   */
  async extractThemesAcademic(
    sources: SourceContent[],
    options: AcademicExtractionOptions,
    progressCallback?: AcademicProgressCallback,
  ): Promise<AcademicExtractionResult> {
    const startTime = Date.now();
    const userId = options.userId || 'system';
    const requestId = options.requestId || 'unknown';

    this.logger.log(`\n${'─'.repeat(60)}`);
    this.logger.log(`🔬 [${requestId}] ACADEMIC EXTRACTION: 6-Stage Process`);
    this.logger.log(`${'─'.repeat(60)}`);
    this.logger.log(`   📊 Sources: ${sources.length}`);
    this.logger.log(
      `   🔬 Methodology: ${options.methodology || 'reflexive_thematic'}`,
    );
    this.logger.log(
      `   ✅ Validation Level: ${options.validationLevel || 'rigorous'}`,
    );
    this.logger.log(`   👤 User ID: ${userId}`);

    // Enhanced methodology report with AI disclosure (Phase 10 Day 5.13)
    // Patent Claim #8 + #12: AI Disclosure & Confidence Calibration
    const methodology: EnhancedMethodologyReport = {
      method: 'Reflexive Thematic Analysis',
      citation: 'Braun & Clarke (2006, 2019)',
      stages: 6,
      validation: 'Cross-source triangulation with semantic embeddings',
      aiRole:
        'AI-assisted semantic clustering; themes validated against full dataset',
      limitations:
        'AI-assisted interpretation; recommend researcher review for publication',
      // NEW: AI Disclosure Section (Nature/Science 2024 compliance)
      aiDisclosure: {
        modelUsed:
          `GPT-4 Turbo (gpt-4-turbo-preview) + ${UnifiedThemeExtractionService.EMBEDDING_MODEL} (${UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS} dimensions)`,
        aiRoleDetailed:
          'AI performs: (1) Semantic embedding generation from full source content, (2) Initial code extraction via pattern detection, (3) Code clustering into candidate themes, (4) Theme labeling and description generation. Human oversight required for final theme selection and interpretation.',
        humanOversightRequired:
          'Researchers must: (1) Review and validate all identified themes against research questions, (2) Interpret thematic meanings within theoretical framework, (3) Make final decisions on theme inclusion/exclusion, (4) Assess applicability to specific context. AI provides suggestions; humans make final scholarly judgments.',
        confidenceCalibration: {
          high: '0.8-1.0: Theme appears in 80%+ of sources with strong semantic coherence (cosine similarity >0.7). Robust evidence across dataset.',
          medium:
            '0.6-0.8: Theme appears in 50-80% of sources with moderate coherence. Present but not dominant across dataset.',
          low: '<0.6: Theme appears in <50% of sources or has weak coherence. Review recommended; may represent emerging/minor theme or require refinement.',
        },
      },
      // Iterative refinement tracking (will be updated if refinement occurs)
      iterativeRefinement: options.allowIterativeRefinement
        ? {
            cyclesPerformed: 0,
            stagesRevisited: [],
            rationale:
              'Initial extraction; no refinement cycles performed yet.',
          }
        : undefined,
    };

    // Get user expertise level for progressive disclosure (Patent Claim #10)
    const userLevel = options.userExpertiseLevel || 'researcher';

    try {
      // ===== STAGE 1: FAMILIARIZATION (20%) =====
      this.logger.log(
        `\n📖 [${requestId}] STAGE 1/6: Familiarization (0% → 20%)`,
      );
      this.logger.log(
        `   🔬 Phase 10 Day 5.17.3: Per-article transparent progress with word count tracking`,
      );
      const stage1Start = Date.now();

      const stage1Message = this.create4PartProgressMessage(
        1,
        'Familiarization',
        0,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          currentOperation: 'Starting article-by-article reading',
        },
      );
      progressCallback?.(
        1,
        6,
        'Reading and embedding all sources (full content analysis)...',
        stage1Message,
      );
      this.emitProgress(
        userId,
        'familiarization',
        0,
        stage1Message.whatWeAreDoing,
        stage1Message,
      );

      // Phase 10 Day 5.17.3: Pass userId, progressCallback, userLevel for per-article progress
      const embeddings = await this.generateSemanticEmbeddings(
        sources,
        userId,
        progressCallback,
        userLevel,
      );
      const stage1Duration = ((Date.now() - stage1Start) / 1000).toFixed(2);
      this.logger.log(`   ✅ Stage 1 complete in ${stage1Duration}s`);

      // ===== STAGE 2: INITIAL CODING (30%) =====
      this.logger.log(
        `\n🔍 [${requestId}] STAGE 2/6: Initial Coding (20% → 30%)`,
      );
      const stage2Start = Date.now();

      // Phase 10 Day 31: Emit progress BEFORE heavy processing to eliminate 81-second silent gap
      const stage2MessageStart = this.create4PartProgressMessage(
        2,
        'Initial Coding',
        25,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: 0,
          currentOperation: 'Starting initial code extraction',
        },
      );
      progressCallback?.(
        2,
        6,
        'Analyzing content patterns using advanced AI (extracting initial codes from full source data)',
        stage2MessageStart,
      );
      this.emitProgress(
        userId,
        'coding',
        25,
        stage2MessageStart.whatWeAreDoing,
        stage2MessageStart,
      );

      const initialCodes = await this.extractInitialCodes(sources, embeddings);
      const stage2Duration = ((Date.now() - stage2Start) / 1000).toFixed(2);

      const stage2Message = this.create4PartProgressMessage(
        2,
        'Initial Coding',
        30,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          currentOperation: 'Completed initial code extraction',
        },
      );
      progressCallback?.(
        2,
        6,
        'Identifying semantic patterns across sources...',
        stage2Message,
      );
      this.emitProgress(
        userId,
        'coding',
        30,
        stage2Message.whatWeAreDoing,
        stage2Message,
      );
      this.logger.log(
        `   ✅ Extracted ${initialCodes.length} initial codes in ${stage2Duration}s`,
      );

      // ===== STAGE 3: THEME GENERATION (50%) =====
      this.logger.log(
        `\n🎨 [${requestId}] STAGE 3/6: Theme Generation (30% → 50%)`,
      );
      const stage3Start = Date.now();

      // Phase 10 Day 31: Emit progress BEFORE heavy processing
      const stage3MessageStart = this.create4PartProgressMessage(
        3,
        'Theme Generation',
        40,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          themesIdentified: 0,
          currentOperation: 'Starting theme generation from semantic clusters',
        },
      );
      progressCallback?.(
        3,
        6,
        'Generating candidate themes from semantic clusters...',
        stage3MessageStart,
      );
      this.emitProgress(
        userId,
        'generation',
        40,
        stage3MessageStart.whatWeAreDoing,
        stage3MessageStart,
      );

      const candidateThemes = await this.generateCandidateThemes(
        initialCodes,
        sources,
        embeddings,
        options,
      );
      const stage3Duration = ((Date.now() - stage3Start) / 1000).toFixed(2);

      const stage3Message = this.create4PartProgressMessage(
        3,
        'Theme Generation',
        50,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          themesIdentified: candidateThemes.length,
          currentOperation: 'Completed theme generation',
        },
      );
      progressCallback?.(
        3,
        6,
        `Generated ${candidateThemes.length} candidate themes from semantic patterns`,
        stage3Message,
      );
      this.emitProgress(
        userId,
        'generation',
        50,
        stage3Message.whatWeAreDoing,
        stage3Message,
      );
      this.logger.log(
        `   ✅ Generated ${candidateThemes.length} candidate themes in ${stage3Duration}s`,
      );

      // ===== STAGE 4: THEME REVIEW (70%) =====
      this.logger.log(
        `\n✅ [${requestId}] STAGE 4/6: Theme Review (50% → 70%)`,
      );
      const stage4Start = Date.now();

      // Phase 10 Day 31: Emit progress BEFORE heavy processing
      const stage4MessageStart = this.create4PartProgressMessage(
        4,
        'Theme Review',
        60,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          themesIdentified: candidateThemes.length,
          currentOperation: 'Starting academic validation of candidate themes',
        },
      );
      progressCallback?.(
        4,
        6,
        'Validating themes against full dataset...',
        stage4MessageStart,
      );
      this.emitProgress(
        userId,
        'review',
        60,
        stage4MessageStart.whatWeAreDoing,
        stage4MessageStart,
      );

      // PHASE 10 DAY 5.17.4: Now returns both themes and diagnostics
      const validationResult = await this.validateThemesAcademic(
        candidateThemes,
        sources,
        embeddings,
        options,
      );
      const validatedThemes = validationResult.validatedThemes;
      const rejectionDiagnostics = validationResult.rejectionDiagnostics;
      const stage4Duration = ((Date.now() - stage4Start) / 1000).toFixed(2);
      const removedCount = candidateThemes.length - validatedThemes.length;

      const stage4Message = this.create4PartProgressMessage(
        4,
        'Theme Review',
        70,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          themesIdentified: validatedThemes.length,
          currentOperation: 'Completed academic validation',
        },
      );
      progressCallback?.(
        4,
        6,
        `Validated ${validatedThemes.length} themes (removed ${removedCount} weak candidates)`,
        stage4Message,
      );
      this.emitProgress(
        userId,
        'review',
        70,
        stage4Message.whatWeAreDoing,
        stage4Message,
      );
      this.logger.log(
        `   ✅ Validated ${validatedThemes.length} themes (removed ${removedCount} weak themes) in ${stage4Duration}s`,
      );

      // ===== STAGE 5: REFINEMENT (85%) =====
      this.logger.log(`\n🔧 [${requestId}] STAGE 5/6: Refinement (70% → 85%)`);
      const stage5Start = Date.now();

      // Phase 10 Day 31: Emit progress BEFORE heavy processing
      const stage5MessageStart = this.create4PartProgressMessage(
        5,
        'Refinement',
        75,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          themesIdentified: validatedThemes.length,
          currentOperation: 'Starting theme refinement and deduplication',
        },
      );
      progressCallback?.(
        5,
        6,
        'Refining and defining themes...',
        stage5MessageStart,
      );
      this.emitProgress(
        userId,
        'refinement',
        75,
        stage5MessageStart.whatWeAreDoing,
        stage5MessageStart,
      );

      const refinedThemes = await this.refineThemesAcademic(
        validatedThemes,
        embeddings,
      );
      const stage5Duration = ((Date.now() - stage5Start) / 1000).toFixed(2);
      const mergedCount = validatedThemes.length - refinedThemes.length;

      const stage5Message = this.create4PartProgressMessage(
        5,
        'Refinement',
        85,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          themesIdentified: refinedThemes.length,
          currentOperation: 'Completed theme refinement',
        },
      );
      progressCallback?.(
        5,
        6,
        `Refined to ${refinedThemes.length} themes (merged ${mergedCount} overlaps)`,
        stage5Message,
      );
      this.emitProgress(
        userId,
        'refinement',
        85,
        stage5Message.whatWeAreDoing,
        stage5Message,
      );
      this.logger.log(
        `   ✅ Refined to ${refinedThemes.length} final themes (merged ${mergedCount} overlaps) in ${stage5Duration}s`,
      );

      // ===== STAGE 6: PROVENANCE (100%) =====
      this.logger.log(`\n📊 [${requestId}] STAGE 6/6: Provenance (85% → 100%)`);
      const stage6Start = Date.now();

      // Phase 10 Day 31: Emit progress BEFORE heavy processing
      const stage6MessageStart = this.create4PartProgressMessage(
        6,
        'Provenance',
        90,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          themesIdentified: refinedThemes.length,
          currentOperation: 'Starting semantic provenance calculation',
        },
      );
      progressCallback?.(
        6,
        6,
        'Calculating semantic influence and building provenance...',
        stage6MessageStart,
      );
      this.emitProgress(
        userId,
        'provenance',
        90,
        stage6MessageStart.whatWeAreDoing,
        stage6MessageStart,
      );

      const themesWithProvenance = await this.calculateSemanticProvenance(
        refinedThemes,
        sources,
        embeddings,
      );
      const stage6Duration = ((Date.now() - stage6Start) / 1000).toFixed(2);

      const stage6Message = this.create4PartProgressMessage(
        6,
        'Provenance',
        100,
        userLevel,
        {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          themesIdentified: themesWithProvenance.length,
          currentOperation: 'Completed provenance calculation',
        },
      );
      progressCallback?.(
        6,
        6,
        `Completed ${themesWithProvenance.length} themes with full provenance`,
        stage6Message,
      );
      this.emitProgress(
        userId,
        'provenance',
        100,
        stage6Message.whatWeAreDoing,
        stage6Message,
      );
      this.logger.log(
        `   ✅ Calculated provenance for ${themesWithProvenance.length} themes in ${stage6Duration}s`,
      );

      // Calculate validation metrics
      this.logger.log(`\n📈 [${requestId}] Calculating Validation Metrics...`);
      const validationStartTime = Date.now();

      const validation = {
        coherenceScore: this.calculateCoherenceScore(
          themesWithProvenance,
          embeddings,
        ),
        coverage: this.calculateCoverage(themesWithProvenance, sources),
        saturation: this.checkSaturation(themesWithProvenance),
        confidence: this.calculateAverageConfidence(themesWithProvenance),
      };

      const validationDuration = (
        (Date.now() - validationStartTime) /
        1000
      ).toFixed(2);
      this.logger.log(
        `   ✅ Validation metrics calculated in ${validationDuration}s`,
      );
      this.logger.log(
        `      • Coherence: ${validation.coherenceScore.toFixed(3)}`,
      );
      this.logger.log(`      • Coverage: ${validation.coverage.toFixed(3)}`);
      this.logger.log(
        `      • Saturation: ${validation.saturation ? 'Yes' : 'No'}`,
      );
      this.logger.log(
        `      • Confidence: ${validation.confidence.toFixed(3)}`,
      );

      const duration = Date.now() - startTime;
      this.logger.log(`\n${'─'.repeat(60)}`);
      this.logger.log(`✅ [${requestId}] ACADEMIC EXTRACTION COMPLETE`);
      this.logger.log(`   ⏱️ Total duration: ${(duration / 1000).toFixed(2)}s`);
      this.logger.log(`   📊 Final themes: ${themesWithProvenance.length}`);
      this.logger.log(
        `   📈 Average confidence: ${(validation.confidence * 100).toFixed(1)}%`,
      );
      this.logger.log(`${'─'.repeat(60)}`);

      // PHASE 10 DAY 5.17.4: Include rejection diagnostics in response (visible in frontend console)
      const response: any = {
        themes: themesWithProvenance,
        methodology,
        validation,
        processingStages: [
          'Familiarization (Semantic Embeddings)',
          'Initial Coding (Pattern Detection)',
          'Theme Generation (Clustering)',
          'Theme Review (Cross-Validation)',
          'Refinement (Quality Control)',
          'Provenance Tracking (Influence Calculation)',
        ],
        metadata: {
          sourcesAnalyzed: sources.length,
          codesGenerated: initialCodes.length,
          candidateThemes: candidateThemes.length,
          finalThemes: themesWithProvenance.length,
          processingTimeMs: duration,
          embeddingModel: 'text-embedding-3-large',
          analysisModel: 'gpt-4-turbo-preview',
        },
      };

      // Add rejection diagnostics if available (helps users understand why themes were rejected)
      if (rejectionDiagnostics) {
        response.rejectionDiagnostics = rejectionDiagnostics;
        this.logger.warn(
          `\n⚠️ [${requestId}] REJECTION DIAGNOSTICS INCLUDED IN RESPONSE`,
        );
        this.logger.warn(
          `   • Total Generated: ${rejectionDiagnostics.totalGenerated}`,
        );
        this.logger.warn(
          `   • Total Rejected: ${rejectionDiagnostics.totalRejected}`,
        );
        this.logger.warn(
          `   • Total Validated: ${rejectionDiagnostics.totalValidated}`,
        );
      }

      return response;
    } catch (error) {
      const err = error as Error;
      const requestId = options.requestId || 'unknown';

      this.logger.error(`\n${'='.repeat(80)}`);
      this.logger.error(`❌ [${requestId}] ACADEMIC EXTRACTION ERROR`);
      this.logger.error(`${'='.repeat(80)}`);
      this.logger.error(`⏰ Timestamp: ${new Date().toISOString()}`);
      this.logger.error(`🔍 Error Type: ${err.name || 'Unknown'}`);
      this.logger.error(`💬 Error Message: ${err.message}`);
      this.logger.error(`\n📊 Context:`);
      this.logger.error(`   • Sources: ${sources.length}`);
      this.logger.error(
        `   • Methodology: ${options.methodology || 'reflexive_thematic'}`,
      );
      this.logger.error(
        `   • Validation level: ${options.validationLevel || 'rigorous'}`,
      );
      this.logger.error(`   • User ID: ${userId}`);

      if (err.stack) {
        this.logger.error(`\n📚 Stack Trace:`);
        this.logger.error(err.stack);
      }

      this.logger.error(`${'='.repeat(80)}\n`);

      throw error;
    }
  }

  /**
   * Purpose-Driven Holistic Theme Extraction (V2)
   * Phase 10 Day 5.13 - Patent Claim #2: Purpose-Adaptive Algorithms
   *
   * Revolutionary approach: Different research purposes require different extraction strategies
   * - Q-Methodology: Breadth-focused (40-80 statements)
   * - Survey Construction: Depth-focused (5-15 constructs)
   * - Qualitative Analysis: Saturation-driven (5-20 themes)
   * - Literature Synthesis: Meta-analytic (10-25 themes)
   * - Hypothesis Generation: Theory-building (8-15 themes)
   *
   * @param sources - Full source content (analyzed together as unified corpus)
   * @param purpose - Research purpose (determines extraction strategy)
   * @param options - Additional extraction configuration
   * @param progressCallback - WebSocket callback for 4-part transparent progress
   * @returns Themes with enhanced methodology report and saturation data
   */
  async extractThemesV2(
    sources: SourceContent[],
    purpose: ResearchPurpose,
    options: AcademicExtractionOptions = {},
    progressCallback?: AcademicProgressCallback,
  ): Promise<AcademicExtractionResult> {
    // PHASE 10 DAY 5.17.3: Generate request ID for end-to-end tracing
    const requestId =
      options.requestId ||
      `backend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    this.logger.log(`\n${'='.repeat(80)}`);
    this.logger.log(`🚀 [${requestId}] BACKEND: V2 Theme Extraction Started`);
    this.logger.log(`${'='.repeat(80)}`);
    this.logger.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    this.logger.log(`🎯 Purpose: ${purpose}`);
    this.logger.log(`📊 Source count: ${sources.length}`);

    // Get purpose-specific configuration
    const purposeConfig = PURPOSE_CONFIGS[purpose];

    this.logger.log(`\n📋 Purpose Configuration:`);
    this.logger.log(
      `   • Name: ${purposeConfig.purpose.replace(/_/g, ' ').toUpperCase()}`,
    );
    this.logger.log(`   • Description: ${purposeConfig.description}`);
    this.logger.log(
      `   • Target theme count: ${purposeConfig.targetThemeCount.min}-${purposeConfig.targetThemeCount.max}`,
    );
    this.logger.log(`   • Extraction focus: ${purposeConfig.extractionFocus}`);
    this.logger.log(`   • Validation rigor: ${purposeConfig.validationRigor}`);
    this.logger.log(`   • Citation: ${purposeConfig.citation}`);

    // PHASE 10 DAY 5.17.3: Detailed content analysis logging
    this.logger.log(`\n📊 Content Analysis:`);
    const contentBreakdown = {
      fullText: sources.filter((s) => s.metadata?.contentType === 'full_text')
        .length,
      abstractOverflow: sources.filter(
        (s) => s.metadata?.contentType === 'abstract_overflow',
      ).length,
      abstract: sources.filter((s) => s.metadata?.contentType === 'abstract')
        .length,
      none: sources.filter(
        (s) => s.metadata?.contentType === 'none' || !s.metadata?.contentType,
      ).length,
    };
    const totalChars = sources.reduce(
      (sum, s) => sum + (s.content?.length || 0),
      0,
    );
    const avgChars =
      sources.length > 0 ? Math.round(totalChars / sources.length) : 0;

    this.logger.log(`   • Full-text sources: ${contentBreakdown.fullText}`);
    this.logger.log(
      `   • Abstract overflow: ${contentBreakdown.abstractOverflow}`,
    );
    this.logger.log(`   • Abstract-only: ${contentBreakdown.abstract}`);
    this.logger.log(`   • No content: ${contentBreakdown.none}`);
    this.logger.log(`   • Total characters: ${totalChars.toLocaleString()}`);
    this.logger.log(
      `   • Average per source: ${avgChars.toLocaleString()} chars`,
    );
    this.logger.log(
      `   • Estimated words: ${Math.round(totalChars / 5).toLocaleString()}`,
    );

    // Log sample of first source
    if (sources.length > 0) {
      this.logger.log(`\n📄 Sample of first source:`);
      this.logger.log(
        `   • Title: "${sources[0].title.substring(0, 80)}${sources[0].title.length > 80 ? '...' : ''}"`,
      );
      this.logger.log(`   • Type: ${sources[0].type}`);
      this.logger.log(
        `   • Content type: ${sources[0].metadata?.contentType || 'unknown'}`,
      );
      this.logger.log(
        `   • Content length: ${(sources[0].content?.length || 0).toLocaleString()} chars`,
      );
      this.logger.log(
        `   • Has full-text: ${sources[0].metadata?.hasFullText || false}`,
      );
    }

    // Apply purpose-specific parameters to options
    const enhancedOptions: AcademicExtractionOptions = {
      ...options,
      requestId, // Pass requestId to child methods
      purpose,
      maxThemes: purposeConfig.targetThemeCount.max,
      minConfidence: purposeConfig.extractionFocus === 'depth' ? 0.7 : 0.6, // Depth requires higher confidence
      validationLevel: purposeConfig.validationRigor,
    };

    this.logger.log(`\n⚙️ Enhanced Options:`);
    this.logger.log(`   • Max themes: ${enhancedOptions.maxThemes}`);
    this.logger.log(`   • Min confidence: ${enhancedOptions.minConfidence}`);
    this.logger.log(
      `   • Validation level: ${enhancedOptions.validationLevel}`,
    );
    this.logger.log(
      `   • User expertise level: ${enhancedOptions.userExpertiseLevel || 'researcher'}`,
    );
    this.logger.log(
      `   • Allow iterative refinement: ${enhancedOptions.allowIterativeRefinement || false}`,
    );

    // Call core extraction with purpose-specific config
    this.logger.log(`\n🚀 [${requestId}] Calling extractThemesAcademic...`);
    const extractionStartTime = Date.now();

    const result = await this.extractThemesAcademic(
      sources,
      enhancedOptions,
      progressCallback,
    );

    const extractionDuration = (
      (Date.now() - extractionStartTime) /
      1000
    ).toFixed(2);
    this.logger.log(
      `✅ [${requestId}] extractThemesAcademic completed in ${extractionDuration}s`,
    );
    this.logger.log(`   • Themes extracted: ${result.themes.length}`);
    this.logger.log(`   • Validation metrics:`, {
      coherence: result.validation?.coherenceScore?.toFixed(3),
      coverage: result.validation?.coverage?.toFixed(3),
      confidence: result.validation?.confidence?.toFixed(3),
    });

    // Enhance methodology report with purpose-specific citation
    result.methodology.citation = `${result.methodology.citation}; ${purposeConfig.citation}`;

    // Add purpose context to methodology
    const purposeDescription = `Purpose: ${purposeConfig.purpose.replace(/_/g, ' ').toUpperCase()}. ${purposeConfig.description}`;
    result.methodology.aiRole = `${result.methodology.aiRole} ${purposeDescription}`;

    // Calculate saturation data (Patent Claim #13)
    this.logger.log(`\n📈 [${requestId}] Calculating saturation data...`);
    const saturationData = this.calculateSaturationData(result.themes, sources);
    result.saturationData = saturationData;
    this.logger.log(
      `   • Saturation reached: ${saturationData.saturationReached}`,
    );
    this.logger.log(
      `   • Saturation point: ${saturationData.saturationPoint || 'N/A'}`,
    );
    this.logger.log(`   • Recommendation: ${saturationData.recommendation}`);

    // Validate theme count against purpose expectations
    const themeCount = result.themes.length;
    this.logger.log(`\n🔍 [${requestId}] Theme Count Validation:`);
    this.logger.log(`   • Extracted: ${themeCount} themes`);
    this.logger.log(
      `   • Expected range: ${purposeConfig.targetThemeCount.min}-${purposeConfig.targetThemeCount.max}`,
    );

    if (themeCount < purposeConfig.targetThemeCount.min) {
      this.logger.warn(
        `⚠️ [${requestId}] Theme count (${themeCount}) is below recommended minimum (${purposeConfig.targetThemeCount.min}) for ${purpose}. Consider adding more sources or reducing minConfidence.`,
      );
    } else if (themeCount > purposeConfig.targetThemeCount.max) {
      this.logger.warn(
        `⚠️ [${requestId}] Theme count (${themeCount}) exceeds recommended maximum (${purposeConfig.targetThemeCount.max}) for ${purpose}. Consider increasing minConfidence or merging similar themes.`,
      );
    } else {
      this.logger.log(
        `   ✅ Theme count is within optimal range for ${purpose}`,
      );
    }

    // Log theme summary
    if (themeCount > 0) {
      this.logger.log(`\n📊 [${requestId}] Theme Summary:`);
      result.themes.slice(0, 3).forEach((theme, idx) => {
        this.logger.log(`   ${idx + 1}. "${theme.label}"`);
        this.logger.log(
          `      • Confidence: ${(theme.confidence * 100).toFixed(1)}%`,
        );
        this.logger.log(`      • Sources: ${theme.sources.length}`);
        this.logger.log(
          `      • Keywords: ${theme.keywords.slice(0, 5).join(', ')}${theme.keywords.length > 5 ? '...' : ''}`,
        );
      });
      if (themeCount > 3) {
        this.logger.log(`   ... and ${themeCount - 3} more themes`);
      }
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`\n${'='.repeat(80)}`);
    this.logger.log(`✅ [${requestId}] V2 EXTRACTION COMPLETE`);
    this.logger.log(`   ⏱️ Total time: ${totalDuration}s`);
    this.logger.log(`   📊 Themes: ${themeCount}`);
    this.logger.log(`   🎯 Purpose: ${purpose}`);
    this.logger.log(
      `   ✅ Quality: ${result.validation?.confidence ? (result.validation.confidence * 100).toFixed(1) + '%' : 'N/A'}`,
    );
    this.logger.log(`${'='.repeat(80)}\n`);

    return result;
  }

  /**
   * Calculate saturation data for visualization
   * Patent Claim #13: Theme Saturation Visualization
   *
   * Tracks how many new themes are discovered as each source is analyzed
   * Helps researchers understand when saturation is reached
   *
   * @param themes - Final extracted themes
   * @param sources - Source content
   * @returns Saturation progression data
   * @private
   */
  private calculateSaturationData(
    themes: UnifiedTheme[],
    sources: SourceContent[],
  ): SaturationData {
    const sourceProgression: Array<{
      sourceNumber: number;
      newThemesDiscovered: number;
      cumulativeThemes: number;
    }> = [];

    // PHASE 10 DAY 33 FIX: Use REAL influence weights instead of simulated discovery
    // OLD BUG: Iterated sources in array order, causing first source to "discover" 90% of themes
    // NEW FIX: Assign each theme to PRIMARY source (highest influence), then sort by contribution

    // Step 0: Build source ID set for O(1) lookup (performance optimization)
    const sourceIdSet = new Set(sources.map((s) => s.id));
    const sourceIndexMap = new Map(sources.map((s, idx) => [s.id, idx])); // For stable sort

    // Step 1: Assign each theme to its PRIMARY source (source with highest influence)
    const themeToPrimarySource = new Map<string, string>();
    let themesWithoutSources = 0;
    let themesWithOrphanedSources = 0;

    for (const theme of themes) {
      // EDGE CASE: Theme has no sources
      if (!theme.sources || theme.sources.length === 0) {
        themesWithoutSources++;
        this.logger.warn(
          `⚠️ Theme "${theme.label}" has no sources - excluding from saturation analysis`,
        );
        continue;
      }

      // Find source with highest influence on this theme
      const primarySource = theme.sources.reduce((max, current) =>
        current.influence > max.influence ? current : max,
      );

      // EDGE CASE: Primary source not in sources array (data inconsistency)
      if (!sourceIdSet.has(primarySource.sourceId)) {
        themesWithOrphanedSources++;
        this.logger.warn(
          `⚠️ Theme "${theme.label}" primary source "${primarySource.sourceId}" not in sources array - excluding from saturation`,
        );
        continue;
      }

      themeToPrimarySource.set(theme.id, primarySource.sourceId);
    }

    // Report data quality issues
    if (themesWithoutSources > 0 || themesWithOrphanedSources > 0) {
      this.logger.warn(
        `📊 Saturation Data Quality: ${themesWithoutSources} themes without sources, ${themesWithOrphanedSources} with orphaned sources`,
      );
    }

    // Step 2: Calculate total contribution for each source (optimized O(n) instead of O(n*m))
    const sourceContribution = new Map<string, number>();
    // Initialize all sources with 0 contribution
    for (const source of sources) {
      sourceContribution.set(source.id, 0);
    }
    // Count primary contributions
    for (const [_themeId, sourceId] of themeToPrimarySource.entries()) {
      const current = sourceContribution.get(sourceId) || 0;
      sourceContribution.set(sourceId, current + 1);
    }

    // Step 3: Sort sources by contribution (highest first) with STABLE secondary sort
    // TECHNICAL DEBT FIX: Add secondary sort by original index for deterministic ordering
    const sortedSources = [...sources].sort((a, b) => {
      const contribA = sourceContribution.get(a.id) || 0;
      const contribB = sourceContribution.get(b.id) || 0;
      if (contribA !== contribB) {
        return contribB - contribA; // Primary: Descending by contribution
      }
      // Secondary: Stable sort by original index (deterministic)
      const indexA = sourceIndexMap.get(a.id) || 0;
      const indexB = sourceIndexMap.get(b.id) || 0;
      return indexA - indexB;
    });

    this.logger.log(
      `📊 Saturation Analysis: Sorted ${sortedSources.length} sources by contribution`,
    );
    if (sortedSources.length > 0) {
      this.logger.log(
        `   • Top contributor: "${sortedSources[0].title.substring(0, 60)}..." (${sourceContribution.get(sortedSources[0].id)} themes)`,
      );
      if (sortedSources.length > 1) {
        this.logger.log(
          `   • 2nd contributor: "${sortedSources[1].title.substring(0, 60)}..." (${sourceContribution.get(sortedSources[1].id)} themes)`,
        );
      }
      if (sortedSources.length > 2) {
        this.logger.log(
          `   • 3rd contributor: "${sortedSources[2].title.substring(0, 60)}..." (${sourceContribution.get(sortedSources[2].id)} themes)`,
        );
      }
    }

    // Step 4: Build saturation curve using sorted sources
    let cumulativeThemes = 0;
    const discoveredThemeIds = new Set<string>();

    for (let i = 0; i < sortedSources.length; i++) {
      const source = sortedSources[i];

      // Find themes where this source is the PRIMARY contributor
      const primaryThemesFromSource = themes.filter(
        (theme) => themeToPrimarySource.get(theme.id) === source.id,
      );

      // Count NEW themes (not yet discovered)
      const newThemes = primaryThemesFromSource.filter(
        (theme) => !discoveredThemeIds.has(theme.id),
      );

      cumulativeThemes += newThemes.length;
      newThemes.forEach((theme) => discoveredThemeIds.add(theme.id));

      sourceProgression.push({
        sourceNumber: i + 1,
        newThemesDiscovered: newThemes.length,
        cumulativeThemes,
      });

      // Log first 5 sources for debugging
      if (i < 5) {
        this.logger.debug(
          `   Source ${i + 1}: +${newThemes.length} new themes (total: ${cumulativeThemes})`,
        );
      }
    }

    // VALIDATION: Ensure all themes are accounted for (no themes lost)
    const totalThemesInMap = themeToPrimarySource.size;
    const totalThemesDiscovered = discoveredThemeIds.size;
    if (totalThemesDiscovered !== totalThemesInMap) {
      this.logger.error(
        `❌ CRITICAL: Saturation data integrity failure! Expected ${totalThemesInMap} themes, discovered ${totalThemesDiscovered}`,
      );
      this.logger.error(
        `   This indicates a logic bug in saturation calculation.`,
      );
    } else {
      this.logger.log(
        `   ✅ Validation passed: All ${totalThemesDiscovered} themes accounted for in saturation curve`,
      );
    }

    // Detect saturation: when last 3 sources contribute <10% new themes
    let saturationReached = false;
    let saturationPoint: number | undefined;

    if (sourceProgression.length >= 3) {
      const last3 = sourceProgression.slice(-3);
      const totalNewInLast3 = last3.reduce(
        (sum, p) => sum + p.newThemesDiscovered,
        0,
      );
      const totalThemes = cumulativeThemes;

      if (totalNewInLast3 / totalThemes < 0.1) {
        saturationReached = true;
        saturationPoint = sourceProgression.length - 3;
      }
    }

    return {
      sourceProgression,
      saturationReached,
      saturationPoint,
      recommendation: saturationReached
        ? `Saturation reached after ${saturationPoint} sources. Last 3 sources added minimal new themes. Current theme count (${themes.length}) is appropriate for your dataset.`
        : `Saturation not yet reached. Consider analyzing additional sources if possible to ensure comprehensive theme coverage. Current: ${themes.length} themes from ${sources.length} sources.`,
    };
  }

  /**
   * Generate semantic embeddings for FULL source content
   * NO TRUNCATION - analyzes complete text
   *
   * Uses OpenAI text-embedding-3-large (${UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS} dimensions)
   * Rate limit: 5000 req/min (handled with p-limit)
   *
   * @private
   */
  private async generateSemanticEmbeddings(
    sources: SourceContent[],
    userId?: string,
    progressCallback?: AcademicProgressCallback,
    userLevel: 'novice' | 'researcher' | 'expert' = 'researcher',
  ): Promise<Map<string, number[]>> {
    // Phase 10 Day 31.2: Input validation (defensive programming)
    if (!sources || sources.length === 0) {
      this.logger.warn('generateSemanticEmbeddings called with empty sources array');
      return new Map<string, number[]>();
    }

    const embeddings = new Map<string, number[]>();

    // Track detailed stats for transparent progress (atomic updates for thread safety)
    const stats = {
      fullTextCount: 0,
      abstractCount: 0,
      totalWords: 0,
      processedCount: 0,
    };

    // Phase 10 Day 30: Process sources SEQUENTIALLY for visible familiarization
    // User feedback: "I wonder if that machine is reading the articles at all?"
    // Sequential processing ensures users see each article being read in real-time
    const limit = pLimit(1); // Process 1 at a time (fully sequential for transparency)

    // Phase 10 Day 31.2: Track embedding statistics for scientific reporting
    // Phase 10 Day 31.2: Use Welford's algorithm for single-pass mean + variance computation
    let totalChunksProcessed = 0;
    let chunkedArticleCount = 0;
    let embeddingCount = 0;
    let magnitudeMean = 0; // Running mean for Welford's algorithm
    let magnitudeM2 = 0; // Running variance sum for Welford's algorithm
    const failedSources: Array<{ id: string; title: string; error: string }> = []; // Track failures

    const embeddingTasks = sources.map((source, index) =>
      limit(async () => {
        const sourceStart = Date.now();

        try {
          // Phase 10 Day 31.2: Validate source data (defensive programming)
          if (!source.id) {
            this.logger.error(`Source at index ${index} has no ID, skipping`);
            failedSources.push({ id: 'unknown', title: source.title || 'Unknown', error: 'Missing source ID' });
            return false;
          }
          if (!source.content || source.content.trim().length === 0) {
            this.logger.warn(`Source ${source.id} has no content, skipping`);
            failedSources.push({ id: source.id, title: source.title || 'Unknown', error: 'Empty content' });
            return false;
          }

          // Calculate word count and content type
          const wordCount = source.content.split(/\s+/).length;
          // Phase 10 Day 31: Use metadata.contentType from frontend (fixes categorization mismatch)
          // Phase 10 Day 31.1: IMPROVED CLASSIFICATION - Better distinguish abstracts from full articles
          // Academic full-text articles: typically 4,000-15,000 words
          // Long abstracts: typically 300-1,500 words
          // Abstract overflow (API returns long abstract): 1,500-3,000 words (still NOT full article)
          const isFullText =
            source.metadata?.contentType === 'full_text' || // Trust frontend: has real fullText from PDF
            (source.metadata?.contentType === 'abstract_overflow' && wordCount > 3000) || // Only if truly article-length
            wordCount > 3500; // Fallback: typical full article length (was 1000, too low)

          // Phase 10 Day 31.1: Log classification reasoning for transparency
          const classificationReason = source.metadata?.contentType === 'full_text'
            ? 'PDF-extracted'
            : source.metadata?.contentType === 'abstract_overflow' && wordCount > 3000
            ? 'abstract-overflow-long'
            : wordCount > 3500
            ? 'heuristic-long'
            : 'abstract';

          // Phase 10 Day 31: CRITICAL FIX - Handle OpenAI's 8191 token limit
          // Estimate tokens: ~4 chars per token (conservative for English)
          const fullText = `${source.title}\n\n${source.content}`;
          const estimatedTokens = Math.ceil(fullText.length / 4);
          // Phase 10 Day 31.2: Use class constant instead of magic number
          const MAX_TOKENS = UnifiedThemeExtractionService.EMBEDDING_MAX_TOKENS - 191; // Safe buffer

          let embedding: number[];
          let currentArticleChunks = 0; // Phase 10 Day 31.2: Track chunks for this article

          if (estimatedTokens <= MAX_TOKENS) {
            // Content fits in one embedding - use full text
            this.logger.log(
              `   📄 [${index + 1}/${sources.length}] Reading: "${source.title.substring(0, 60)}..." (${wordCount.toLocaleString()} words, ${estimatedTokens} tokens, ${isFullText ? 'full-text' : 'abstract'}, reason: ${classificationReason})`,
            );

            const response = await this.openai.embeddings.create({
              model: UnifiedThemeExtractionService.EMBEDDING_MODEL,
              input: fullText,
              encoding_format: 'float',
            });
            embedding = response.data[0].embedding;

            // Phase 10 Day 31.2: Calculate embedding magnitude (L2 norm) for scientific reporting
            const magnitude = this.calculateEmbeddingMagnitude(embedding);

            // Phase 10 Day 31.2: Welford's algorithm for online mean and variance
            embeddingCount++;
            const delta = magnitude - magnitudeMean;
            magnitudeMean += delta / embeddingCount;
            const delta2 = magnitude - magnitudeMean;
            magnitudeM2 += delta * delta2;
          } else {
            // Content exceeds token limit - chunk and average embeddings
            const chunkSize = MAX_TOKENS * 4; // ~32,000 characters per chunk
            const chunks: string[] = [];

            // Always include title in first chunk
            let remainingContent = source.content;
            let chunkCount = 0;

            while (remainingContent.length > 0) {
              const chunk = remainingContent.substring(0, chunkSize);
              chunks.push(chunkCount === 0 ? `${source.title}\n\n${chunk}` : chunk);
              remainingContent = remainingContent.substring(chunkSize);
              chunkCount++;
            }

            this.logger.log(
              `   📄 [${index + 1}/${sources.length}] Reading (CHUNKED): "${source.title.substring(0, 60)}..." (${wordCount.toLocaleString()} words, ${estimatedTokens} tokens → ${chunks.length} chunks, ${isFullText ? 'full-text' : 'abstract'}, reason: ${classificationReason})`,
            );

            // Generate embeddings for all chunks in parallel
            const chunkEmbeddings = await Promise.all(
              chunks.map(async (chunk) => {
                const response = await this.openai.embeddings.create({
                  model: UnifiedThemeExtractionService.EMBEDDING_MODEL,
                  input: chunk,
                  encoding_format: 'float',
                });
                return response.data[0].embedding;
              })
            );

            // Average all chunk embeddings
            embedding = chunkEmbeddings[0].map((_, i) => {
              const sum = chunkEmbeddings.reduce((acc, emb) => acc + emb[i], 0);
              return sum / chunkEmbeddings.length;
            });

            // Phase 10 Day 31.2: Track chunking statistics
            currentArticleChunks = chunks.length;
            totalChunksProcessed += chunks.length;
            chunkedArticleCount++;

            // Phase 10 Day 31.2: Calculate magnitude of averaged embedding
            const magnitude = this.calculateEmbeddingMagnitude(embedding);

            // Phase 10 Day 31.2: Welford's algorithm for online mean and variance
            embeddingCount++;
            const delta = magnitude - magnitudeMean;
            magnitudeMean += delta / embeddingCount;
            const delta2 = magnitude - magnitudeMean;
            magnitudeM2 += delta * delta2;

            this.logger.log(
              `   ✅ Averaged ${chunks.length} chunk embeddings for complete article analysis (magnitude: ${magnitude.toFixed(4)})`,
            );
          }

          // Store the embedding (now properly handles long articles)
          embeddings.set(source.id, embedding);

          // Atomically update stats
          stats.processedCount++;
          if (isFullText) {
            stats.fullTextCount++;
          } else {
            stats.abstractCount++;
          }
          stats.totalWords += wordCount;

          // Calculate progress within Stage 1 (0% → 20%)
          const progressWithinStage = Math.round(
            (stats.processedCount / sources.length) * 20,
          );

          // Phase 10 Day 5.17.3: Detailed per-article progress (Patent Claim #9: 4-Part Transparency)
          const detailedStats = {
            currentArticle: index + 1,
            totalArticles: sources.length,
            articleTitle: source.title.substring(0, 80),
            articleType: isFullText ? 'full-text' : 'abstract',
            articleWords: wordCount,
            fullTextRead: stats.fullTextCount,
            abstractsRead: stats.abstractCount,
            totalWordsRead: stats.totalWords,
          };

          // Progressive disclosure: different detail levels
          let progressMessage = '';
          if (userLevel === 'novice') {
            progressMessage = `Reading article ${index + 1} of ${sources.length}: "${source.title.substring(0, 60)}..." (${wordCount.toLocaleString()} words)`;
          } else if (userLevel === 'researcher') {
            progressMessage = `Reading ${isFullText ? 'full-text' : 'abstract'} ${index + 1}/${sources.length}: "${source.title.substring(0, 50)}..." • Running total: ${stats.fullTextCount} full articles, ${stats.abstractCount} abstracts (${stats.totalWords.toLocaleString()} words)`;
          } else {
            // expert
            progressMessage = `Embedding ${index + 1}/${sources.length}: ${source.type} [${isFullText ? 'full' : 'abstract'}] • ${wordCount.toLocaleString()} words • Cumulative: ${stats.totalWords.toLocaleString()} words from ${stats.fullTextCount} full + ${stats.abstractCount} abstracts`;
          }

          // Phase 10 Day 5.17.3: Create TransparentProgressMessage for both WebSocket and callback
          // Phase 10 Day 30: Include detailed real-time familiarization metrics
          // Phase 10 Day 31.2: Add embedding statistics for scientific transparency
          // Phase 10 Day 31.2: Use Welford's running mean (O(1) access)
          const currentAvgMagnitude = magnitudeMean;

          const transparentMessage = {
            stageName: 'Familiarization',
            stageNumber: 1,
            totalStages: 6,
            percentage: progressWithinStage,
            whatWeAreDoing: progressMessage,
            whyItMatters:
              `SCIENTIFIC PROCESS: Familiarization converts each article into a ${UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS}-dimensional semantic vector (embedding) that captures meaning mathematically. These embeddings enable: (1) Hierarchical clustering to find related concepts, (2) Cosine similarity calculations to measure semantic relationships (not keyword matching), (3) Provenance tracking showing which articles influence which themes. This implements Braun & Clarke (2019) Stage 1: reading ALL sources together prevents early bias, ensuring themes emerge from the complete dataset. The embeddings are the foundation for all downstream scientific analysis.`,
            liveStats: {
              sourcesAnalyzed: stats.processedCount,
              currentOperation: `Reading ${isFullText ? 'full-text' : 'abstract'} ${index + 1}/${sources.length}`,
              // Phase 10 Day 30: Real-time reading metrics for frontend display
              fullTextRead: stats.fullTextCount,
              abstractsRead: stats.abstractCount,
              totalWordsRead: stats.totalWords,
              currentArticle: index + 1,
              totalArticles: sources.length,
              articleTitle: source.title.substring(0, 80),
              articleType: (isFullText ? 'full-text' : 'abstract') as 'full-text' | 'abstract',
              articleWords: wordCount,
              // Phase 10 Day 31.2: Enterprise-grade scientific metrics
              embeddingStats: {
                dimensions: UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS,
                model: UnifiedThemeExtractionService.EMBEDDING_MODEL,
                totalEmbeddingsGenerated: embeddingCount,
                averageEmbeddingMagnitude: currentAvgMagnitude > 0 ? currentAvgMagnitude : undefined,
                processingMethod: (currentArticleChunks > 0 ? 'chunked-averaged' : 'single') as 'single' | 'chunked-averaged',
                chunksProcessed: currentArticleChunks > 0 ? currentArticleChunks : undefined,
                scientificExplanation: `Each article is converted into a ${UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS}-dimensional vector where semantic meaning is preserved mathematically. Similar articles have embeddings with high cosine similarity (>0.7), enabling clustering and theme discovery without keyword matching.`,
              },
            },
          };

          // Phase 10 Day 30: Emit progress on EVERY article for real-time familiarization visibility
          // User feedback: Stage 1 completes too fast - users can't see the reading happening
          // Emit on every single article so word count increments visibly in real-time

          // Emit progress via WebSocket
          if (userId) {
            this.emitProgress(
              userId,
              'familiarization',
              progressWithinStage,
              progressMessage,
              transparentMessage, // Send TransparentProgressMessage for frontend compatibility
            );
          }

          // Emit via callback (for frontend EnhancedThemeExtractionProgress)
          if (progressCallback) {
            progressCallback(1, 6, progressMessage, transparentMessage);
          }

          // Phase 10 Day 5.17.3: Ensure at least 1 second per article (user requirement)
          const elapsedTime = Date.now() - sourceStart;
          const minDelay = 1000; // 1 second minimum
          if (elapsedTime < minDelay) {
            await new Promise((resolve) =>
              setTimeout(resolve, minDelay - elapsedTime),
            );
          }

          return true;
        } catch (error) {
          // Phase 10 Day 31.2: Enhanced error handling with failure tracking
          const errorMessage = (error as Error).message;
          this.logger.error(
            `   ⚠️ Failed to embed source ${source.id}: ${errorMessage}`,
          );

          // Track failed source for reporting
          failedSources.push({
            id: source.id,
            title: source.title || 'Unknown',
            error: errorMessage,
          });

          // Don't fail entire extraction if one source fails
          return false;
        }
      }),
    );

    await Promise.all(embeddingTasks);

    // Phase 10 Day 31.2: Final embedding statistics from Welford's algorithm (O(1) access)
    const avgMagnitude = magnitudeMean;
    const variance = embeddingCount > 1 ? magnitudeM2 / embeddingCount : 0;
    const stdMagnitude = Math.sqrt(variance);

    // Phase 10 Day 31.2: Report failed sources if any
    if (failedSources.length > 0) {
      this.logger.warn(
        `\n   ⚠️ Failed to process ${failedSources.length}/${sources.length} sources:`,
      );
      failedSources.slice(0, 5).forEach((failure) => {
        this.logger.warn(`      • ${failure.title} (${failure.id}): ${failure.error}`);
      });
      if (failedSources.length > 5) {
        this.logger.warn(`      ... and ${failedSources.length - 5} more`);
      }
    }

    this.logger.log(
      `\n   ✅ Successfully generated ${embeddings.size}/${sources.length} embeddings`,
    );
    this.logger.log(
      `   📊 Familiarization complete: ${stats.fullTextCount} full articles + ${stats.abstractCount} abstracts = ${stats.totalWords.toLocaleString()} total words read`,
    );

    // Phase 10 Day 31.2: ENTERPRISE-GRADE SCIENTIFIC LOGGING
    this.logger.log(`\n   🔬 SCIENTIFIC EMBEDDING STATISTICS:`);
    this.logger.log(`      • Model: ${UnifiedThemeExtractionService.EMBEDDING_MODEL}`);
    this.logger.log(`      • Dimensions: ${UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS.toLocaleString()} per embedding`);
    this.logger.log(`      • Total embeddings generated: ${embeddingCount}`);
    this.logger.log(`      • Average L2 norm (magnitude): ${avgMagnitude.toFixed(4)} ± ${stdMagnitude.toFixed(4)}`);
    if (chunkedArticleCount > 0) {
      this.logger.log(`      • Articles requiring chunking: ${chunkedArticleCount} (${totalChunksProcessed} total chunks)`);
      this.logger.log(`      • Chunked articles processed via weighted averaging of chunk embeddings`);
    }
    this.logger.log(`      • Embedding space: ${UnifiedThemeExtractionService.EMBEDDING_DIMENSIONS}-dimensional cosine similarity space`);
    this.logger.log(`      • Scientific use: Hierarchical clustering, semantic similarity, provenance tracking`);
    this.logger.log(`      • Methodology: Braun & Clarke (2019) Reflexive Thematic Analysis - Stage 1`);

    return embeddings;
  }

  /**
   * Extract initial codes using AI-assisted semantic analysis
   * Analyzes FULL content to identify concepts and patterns
   *
   * @private
   */
  private async extractInitialCodes(
    sources: SourceContent[],
    embeddings: Map<string, number[]>,
  ): Promise<InitialCode[]> {
    // Phase 10 Day 31.3: Input validation (defensive programming)
    if (!sources || sources.length === 0) {
      this.logger.warn('extractInitialCodes called with empty sources array');
      return [];
    }

    const codes: InitialCode[] = [];

    // Phase 10 Day 31.3: Use class constants instead of magic numbers
    let currentBatch: SourceContent[] = [];
    let currentBatchChars = 0;

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const sourceChars = source.content.length;

      // Check if adding this source would exceed batch limit
      if (currentBatch.length > 0 &&
          (currentBatchChars + sourceChars > UnifiedThemeExtractionService.MAX_BATCH_TOKENS * UnifiedThemeExtractionService.CHARS_TO_TOKENS_RATIO ||
           currentBatch.length >= UnifiedThemeExtractionService.MAX_SOURCES_PER_BATCH)) {
        // Process current batch before adding this source
        await this.processBatchForCodes(currentBatch, codes, i - currentBatch.length);
        currentBatch = [];
        currentBatchChars = 0;
      }

      // Truncate individual source if too long
      let truncatedContent = source.content;
      if (sourceChars > UnifiedThemeExtractionService.MAX_CHARS_PER_SOURCE) {
        truncatedContent = source.content.substring(0, UnifiedThemeExtractionService.MAX_CHARS_PER_SOURCE);
        this.logger.warn(
          `   ⚠️ Source "${source.title.substring(0, 50)}..." truncated from ${sourceChars} to ${UnifiedThemeExtractionService.MAX_CHARS_PER_SOURCE} chars for code extraction`,
        );
      }

      currentBatch.push({ ...source, content: truncatedContent });
      currentBatchChars += truncatedContent.length;
    }

    // Process final batch
    if (currentBatch.length > 0) {
      await this.processBatchForCodes(currentBatch, codes, sources.length - currentBatch.length);
    }

    return codes;
  }

  /**
   * Helper method to process a batch of sources for code extraction
   * @private
   */
  private async processBatchForCodes(
    batch: SourceContent[],
    codes: InitialCode[],
    startIndex: number,
  ): Promise<void> {
      const prompt = `Analyze these research sources and extract initial codes (concepts, patterns, ideas).

Sources (FULL CONTENT):
${batch
  .map(
    (s, idx) => `
SOURCE ${startIndex + idx + 1}: ${s.title}
Type: ${s.type}
Full Content:
${s.content}
---
`,
  )
  .join('\n')}

For each source, identify 5-10 key codes (concepts that appear in the content).
Each code should be:
- Specific and data-driven
- Grounded in the actual text
- Distinct from other codes

Return JSON format:
{
  "codes": [
    {
      "label": "Code name (2-4 words)",
      "description": "What this code represents",
      "sourceId": "source ID",
      "excerpts": ["relevant quote 1", "relevant quote 2"]
    }
  ]
}`;

      try {
        // Phase 10 Day 31.3: Use class constants instead of magic numbers
        const response = await this.openai.chat.completions.create({
          model: UnifiedThemeExtractionService.CODING_MODEL,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: UnifiedThemeExtractionService.CODING_TEMPERATURE,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');

        if (result.codes && Array.isArray(result.codes)) {
          codes.push(
            ...result.codes.map((code: any) => ({
              ...code,
              id: `code_${crypto.randomBytes(8).toString('hex')}`,
            })),
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to extract codes from batch starting at ${startIndex}: ${(error as Error).message}`,
        );
      }
  }

  /**
   * Generate candidate themes by clustering related codes
   * Uses semantic similarity (cosine distance) between code embeddings
   *
   * @private
   */
  private async generateCandidateThemes(
    codes: InitialCode[],
    sources: SourceContent[],
    embeddings: Map<string, number[]>,
    options: AcademicExtractionOptions,
  ): Promise<CandidateTheme[]> {
    // Phase 10 Day 31.3: Input validation (defensive programming)
    if (!codes || codes.length === 0) {
      this.logger.warn('generateCandidateThemes called with empty codes array');
      return [];
    }

    // Create embeddings for each code
    const codeEmbeddings = new Map<string, number[]>();
    // Phase 10 Day 31.3: Use class constant instead of magic number
    const limit = pLimit(UnifiedThemeExtractionService.CODE_EMBEDDING_CONCURRENCY);

    const embeddingTasks = codes.map((code) =>
      limit(async () => {
        try {
          const codeText = `${code.label}\n${code.description}\n${code.excerpts.join('\n')}`;

          const response = await this.openai.embeddings.create({
            model: UnifiedThemeExtractionService.EMBEDDING_MODEL,
            input: codeText,
            encoding_format: 'float',
          });

          codeEmbeddings.set(code.id, response.data[0].embedding);
        } catch (error) {
          this.logger.error(
            `Failed to embed code ${code.id}: ${(error as Error).message}`,
          );
        }
      }),
    );

    await Promise.all(embeddingTasks);

    // Phase 10 Day 31.3: Use class constant for default maxThemes
    // Cluster codes into themes using hierarchical clustering
    const themes = await this.hierarchicalClustering(
      codes,
      codeEmbeddings,
      options.maxThemes || UnifiedThemeExtractionService.DEFAULT_MAX_THEMES,
    );

    // Use AI to label and describe each theme cluster
    const labeledThemes = await this.labelThemeClusters(themes, sources);

    return labeledThemes;
  }

  /**
   * Hierarchical clustering of codes based on semantic similarity
   * Groups related codes into theme clusters
   *
   * @private
   */
  private async hierarchicalClustering(
    codes: InitialCode[],
    codeEmbeddings: Map<string, number[]>,
    maxThemes: number,
  ): Promise<Array<{ codes: InitialCode[]; centroid: number[] }>> {
    // Start with each code as its own cluster
    const clusters = codes.map((code) => ({
      codes: [code],
      centroid: codeEmbeddings.get(code.id) || [],
    }));

    // Merge clusters until we reach maxThemes
    while (clusters.length > maxThemes) {
      let minDistance = Infinity;
      let mergeIndices = [0, 1];

      // Find two most similar clusters
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const distance = this.cosineSimilarity(
            clusters[i].centroid,
            clusters[j].centroid,
          );

          if (distance < minDistance) {
            minDistance = distance;
            mergeIndices = [i, j];
          }
        }
      }

      // Merge the two closest clusters
      const [i, j] = mergeIndices;
      const mergedCodes = [...clusters[i].codes, ...clusters[j].codes];
      const mergedCentroid = this.calculateCentroid([
        clusters[i].centroid,
        clusters[j].centroid,
      ]);

      // Remove old clusters and add merged
      clusters.splice(Math.max(i, j), 1);
      clusters.splice(Math.min(i, j), 1);
      clusters.push({ codes: mergedCodes, centroid: mergedCentroid });
    }

    return clusters;
  }

  /**
   * Label theme clusters using AI to generate descriptive names
   *
   * @private
   */
  private async labelThemeClusters(
    clusters: Array<{ codes: InitialCode[]; centroid: number[] }>,
    sources: SourceContent[],
  ): Promise<CandidateTheme[]> {
    const themes: CandidateTheme[] = [];

    for (const [index, cluster] of clusters.entries()) {
      const codeLabels = cluster.codes.map((c) => c.label).join(', ');
      const codeDescriptions = cluster.codes
        .map((c) => c.description)
        .join('\n');

      const prompt = `Based on these related research codes, generate a cohesive theme.

Codes in this cluster:
${cluster.codes.map((c) => `- ${c.label}: ${c.description}`).join('\n')}

Representative excerpts:
${cluster.codes
  .flatMap((c) => c.excerpts)
  .slice(0, UnifiedThemeExtractionService.MAX_EXCERPTS_FOR_LABELING)
  .join('\n---\n')}

Generate a theme that encompasses these codes.

Return JSON:
{
  "label": "Theme name (2-5 words, specific and descriptive)",
  "description": "2-3 sentences explaining what this theme represents across the literature",
  "keywords": ["keyword1", "keyword2", ...] (5-7 keywords),
  "definition": "Clear academic definition of this theme"
}`;

      try {
        // Phase 10 Day 31.3: Use class constants instead of magic numbers
        const response = await this.openai.chat.completions.create({
          model: UnifiedThemeExtractionService.CODING_MODEL,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: UnifiedThemeExtractionService.THEME_LABELING_TEMPERATURE,
        });

        const themeData = JSON.parse(
          response.choices[0].message.content || '{}',
        );

        themes.push({
          id: `theme_${crypto.randomBytes(8).toString('hex')}`,
          label: themeData.label,
          description: themeData.description,
          keywords: themeData.keywords || [],
          definition: themeData.definition,
          codes: cluster.codes,
          centroid: cluster.centroid,
          sourceIds: [...new Set(cluster.codes.map((c) => c.sourceId))],
        });
      } catch (error) {
        this.logger.error(
          `Failed to label theme cluster ${index}: ${(error as Error).message}`,
        );

        // Fallback: use code labels
        themes.push({
          id: `theme_${crypto.randomBytes(8).toString('hex')}`,
          label: `Theme ${index + 1}: ${cluster.codes[0].label}`,
          description: codeDescriptions,
          keywords: cluster.codes.flatMap((c) =>
            c.label.toLowerCase().split(' '),
          ),
          definition: 'Generated from code clustering',
          codes: cluster.codes,
          centroid: cluster.centroid,
          sourceIds: [...new Set(cluster.codes.map((c) => c.sourceId))],
        });
      }
    }

    return themes;
  }

  /**
   * Calculate adaptive validation thresholds based on content characteristics
   * Phase 10 Day 5.15: Addresses issue where abstract-only papers (150-500 words)
   * were being validated with thresholds designed for full-text papers (10,000+ words)
   *
   * UPDATE Day 5.15.2: Now checks metadata for content type detection
   * Handles cases where full articles are in "abstract" field (>2000 chars)
   *
   * @private
   */
  private calculateAdaptiveThresholds(
    sources: SourceContent[],
    validationLevel: string = 'rigorous',
    purpose?: ResearchPurpose, // PHASE 10 DAY 5.17.1: Purpose-aware validation
  ) {
    // ENHANCED: Analyze content characteristics with metadata awareness
    const avgContentLength =
      sources.reduce((sum, s) => sum + s.content.length, 0) / sources.length;

    // Check metadata if available (Phase 10 Day 5.15.2)
    const contentTypes = sources.map(
      (s) => s.metadata?.contentType || 'unknown',
    );
    const hasFullText = contentTypes.some(
      (t) => t === 'full_text' || t === 'abstract_overflow',
    );
    const allAbstracts = contentTypes.every((t) => t === 'abstract');

    // Determine if content is actually full-text despite being in abstract field
    const avgLengthSuggestsFullText = avgContentLength > 2000; // >2000 chars likely full articles
    const isActuallyFullText = hasFullText || avgLengthSuggestsFullText;

    const isAbstractOnly = !isActuallyFullText && avgContentLength < 1000; // Less than 1000 chars = abstracts
    const isVeryShort = !isActuallyFullText && avgContentLength < 500; // Less than 500 chars = very brief abstracts

    // Base thresholds (for full-text papers)
    let minSources = validationLevel === 'publication_ready' ? 3 : 2;
    let minCoherence = validationLevel === 'publication_ready' ? 0.7 : 0.6;
    let minEvidence = 0.5;

    // ADAPTIVE ADJUSTMENT for short content
    if (isAbstractOnly) {
      this.logger.log('');
      this.logger.log(
        '📉 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log('📉 ADAPTIVE THRESHOLDS: Detected abstract-only content');
      this.logger.log(
        '📉 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log(
        `   Average content length: ${Math.round(avgContentLength)} chars`,
      );
      this.logger.log(
        `   Content type: ${isVeryShort ? 'Very brief abstracts' : 'Standard abstracts'}`,
      );
      this.logger.log(
        `   Content breakdown: ${contentTypes.filter((t) => t === 'abstract').length} abstracts, ${contentTypes.filter((t) => t === 'full_text').length} full-text, ${contentTypes.filter((t) => t === 'abstract_overflow').length} overflow`,
      );
      this.logger.log('');

      // Store original thresholds for comparison
      const originalMinSources = minSources;
      const originalMinCoherence = minCoherence;
      const originalMinEvidence = minEvidence;

      // Relax thresholds for abstracts (20-30% more lenient)
      minSources = Math.max(2, minSources - 1); // Min 2 sources even for abstracts
      minCoherence = isVeryShort ? minCoherence * 0.7 : minCoherence * 0.8; // 0.6 → 0.42-0.48
      minEvidence = isVeryShort ? 0.25 : 0.35; // Lower evidence requirement for short content

      this.logger.log('   Threshold Adjustments:');
      this.logger.log(
        `   • minSources: ${originalMinSources} → ${minSources} (${minSources === originalMinSources ? 'unchanged' : 'relaxed'})`,
      );
      this.logger.log(
        `   • minCoherence: ${originalMinCoherence.toFixed(2)} → ${minCoherence.toFixed(2)} (${Math.round((1 - minCoherence / originalMinCoherence) * 100)}% more lenient)`,
      );
      this.logger.log(
        `   • minEvidence: ${originalMinEvidence.toFixed(2)} → ${minEvidence.toFixed(2)} (${Math.round((1 - minEvidence / originalMinEvidence) * 100)}% more lenient)`,
      );
      this.logger.log('');
      this.logger.log(
        '   Rationale: Short abstracts limit semantic depth and code density.',
      );
      this.logger.log(
        '   Adjusted thresholds maintain rigor while accounting for content constraints.',
      );
      this.logger.log(
        '📉 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log('');
    } else if (isActuallyFullText) {
      this.logger.log('');
      this.logger.log(
        '📈 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log(
        '📈 FULL-TEXT CONTENT DETECTED: Using standard strict thresholds',
      );
      this.logger.log(
        '📈 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log(
        `   Average content length: ${Math.round(avgContentLength)} chars`,
      );
      this.logger.log(
        `   Content breakdown: ${contentTypes.filter((t) => t === 'abstract').length} abstracts, ${contentTypes.filter((t) => t === 'full_text').length} full-text, ${contentTypes.filter((t) => t === 'abstract_overflow').length} overflow (full article in abstract field)`,
      );
      this.logger.log(
        `   ✅ Full-text content provides rich semantic context for high-quality theme extraction`,
      );
      this.logger.log(
        '📈 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log('');
    }

    // PHASE 10 DAY 5.17.1: Purpose-specific threshold adjustments
    if (purpose === ResearchPurpose.Q_METHODOLOGY) {
      this.logger.log('');
      this.logger.log(
        '🎯 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log(
        '🎯 Q-METHODOLOGY: Further relaxing thresholds for breadth-focused extraction',
      );
      this.logger.log(
        '🎯 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log(
        `   Purpose: Generate 40-80 diverse statements (breadth > depth)`,
      );
      this.logger.log(
        `   Focus: Capture full discourse space, not deep coherence`,
      );
      this.logger.log('');

      const originalMinSources = minSources;
      const originalMinCoherence = minCoherence;
      const originalMinEvidence = minEvidence;

      // Q-Methodology needs VERY lenient thresholds
      minSources = 1; // Single source OK for Q-Methodology (captures unique perspectives)
      minCoherence = minCoherence * 0.5; // 50% more lenient (diversity > coherence)
      minEvidence = Math.min(minEvidence * 0.6, 0.2); // Very low evidence requirement (breadth focus)

      this.logger.log('   Q-Methodology Adjustments:');
      this.logger.log(
        `   • minSources: ${originalMinSources} → ${minSources} (single-source themes OK for diverse statements)`,
      );
      this.logger.log(
        `   • minCoherence: ${originalMinCoherence.toFixed(2)} → ${minCoherence.toFixed(2)} (diversity prioritized over coherence)`,
      );
      this.logger.log(
        `   • minEvidence: ${originalMinEvidence.toFixed(2)} → ${minEvidence.toFixed(2)} (lower requirement for statement generation)`,
      );
      this.logger.log('');
      this.logger.log(
        '   Rationale: Q-Methodology requires broad concourse of diverse viewpoints.',
      );
      this.logger.log(
        '   Goal is 40-80 statements covering full discourse space, NOT deep coherent themes.',
      );
      this.logger.log(
        '   Abstracts provide sufficient breadth for statement generation.',
      );
      this.logger.log(
        '🎯 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log('');
    } else if (purpose === ResearchPurpose.QUALITATIVE_ANALYSIS) {
      // PHASE 10 DAY 5.17.5: BUG FIX - Qualitative Analysis needs moderate thresholds
      this.logger.log('');
      this.logger.log(
        '🔬 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log(
        '🔬 QUALITATIVE ANALYSIS: Moderately relaxed thresholds for saturation-driven extraction',
      );
      this.logger.log(
        '🔬 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log(
        `   Purpose: Extract 5-20 themes until saturation (no new themes emerge)`,
      );
      this.logger.log(`   Focus: Balance between breadth and depth`);
      this.logger.log('');

      const originalMinSources = minSources;
      const originalMinCoherence = minCoherence;
      const originalMinEvidence = minEvidence;

      // Qualitative Analysis: Moderate thresholds (between Q-Methodology and strict)
      minSources = Math.max(1, minSources - 1); // Reduce by 1 (2→1 or 3→2)
      minCoherence = minCoherence * 0.75; // 25% more lenient
      minEvidence = minEvidence * 0.7; // 30% more lenient

      this.logger.log('   Qualitative Analysis Adjustments:');
      this.logger.log(
        `   • minSources: ${originalMinSources} → ${minSources} (moderate requirement)`,
      );
      this.logger.log(
        `   • minCoherence: ${originalMinCoherence.toFixed(2)} → ${minCoherence.toFixed(2)} (balanced approach)`,
      );
      this.logger.log(
        `   • minEvidence: ${originalMinEvidence.toFixed(2)} → ${minEvidence.toFixed(2)} (moderate evidence requirement)`,
      );
      this.logger.log('');
      this.logger.log(
        '   Rationale: Qualitative thematic analysis (Braun & Clarke 2006, 2019).',
      );
      this.logger.log(
        '   Goal is iterative extraction until data saturation, balancing rigor with discovery.',
      );
      this.logger.log(
        '🔬 ═══════════════════════════════════════════════════════════════',
      );
      this.logger.log('');
    } else if (
      purpose === ResearchPurpose.LITERATURE_SYNTHESIS ||
      purpose === ResearchPurpose.HYPOTHESIS_GENERATION
    ) {
      // PHASE 10 DAY 5.17.5: BUG FIX - Synthesis/Hypothesis need slightly relaxed thresholds
      this.logger.log('');
      this.logger.log(
        `📚 ═══════════════════════════════════════════════════════════════`,
      );
      this.logger.log(
        `📚 ${purpose === ResearchPurpose.LITERATURE_SYNTHESIS ? 'LITERATURE SYNTHESIS' : 'HYPOTHESIS GENERATION'}: Slightly relaxed thresholds`,
      );
      this.logger.log(
        `📚 ═══════════════════════════════════════════════════════════════`,
      );
      this.logger.log(
        `   Purpose: Extract ${purpose === ResearchPurpose.LITERATURE_SYNTHESIS ? '10-25 meta-analytic themes' : '8-15 theory-building themes'}`,
      );
      this.logger.log(
        `   Focus: Comprehensive coverage with theoretical depth`,
      );
      this.logger.log('');

      const originalMinSources = minSources;
      const originalMinCoherence = minCoherence;
      const originalMinEvidence = minEvidence;

      // Slight relaxation for synthesis/hypothesis work
      minCoherence = minCoherence * 0.85; // 15% more lenient
      minEvidence = minEvidence * 0.8; // 20% more lenient

      this.logger.log('   Threshold Adjustments:');
      this.logger.log(
        `   • minSources: ${originalMinSources} (unchanged - need cross-source validation)`,
      );
      this.logger.log(
        `   • minCoherence: ${originalMinCoherence.toFixed(2)} → ${minCoherence.toFixed(2)} (slightly more lenient)`,
      );
      this.logger.log(
        `   • minEvidence: ${originalMinEvidence.toFixed(2)} → ${minEvidence.toFixed(2)} (moderate relaxation)`,
      );
      this.logger.log('');
      this.logger.log(
        `   Rationale: ${purpose === ResearchPurpose.LITERATURE_SYNTHESIS ? 'Meta-ethnography requires comprehensive theme coverage' : 'Grounded theory requires emerging conceptual patterns'}.`,
      );
      this.logger.log(
        `📚 ═══════════════════════════════════════════════════════════════`,
      );
      this.logger.log('');
    }

    return {
      minSources,
      minCoherence,
      minEvidence,
      minDistinctiveness: 0.3,
      isAbstractOnly,
    };
  }

  /**
   * Validate themes against academic rigor criteria
   *
   * Criteria:
   * - Minimum 2-3 sources supporting theme (inter-source validation)
   * - Semantic coherence > 0.6 or adaptive (codes in theme are related)
   * - Distinctiveness > 0.3 (theme is different from others)
   * - Sufficient evidence (quality excerpts)
   *
   * Phase 10 Day 5.15: Now uses adaptive thresholds based on content characteristics
   *
   * @private
   */
  private async validateThemesAcademic(
    themes: CandidateTheme[],
    sources: SourceContent[],
    embeddings: Map<string, number[]>,
    options: AcademicExtractionOptions,
  ): Promise<ValidationResult> {
    // Phase 10 Day 31.3: Input validation (defensive programming)
    if (!themes || themes.length === 0) {
      this.logger.warn('validateThemesAcademic called with empty themes array');
      return { validatedThemes: [], rejectionDiagnostics: null };
    }

    // Calculate adaptive thresholds based on content characteristics (PHASE 10 DAY 5.17.1: Now purpose-aware)
    const thresholds = this.calculateAdaptiveThresholds(
      sources,
      options.validationLevel,
      options.purpose,
    );
    const {
      minSources,
      minCoherence,
      minEvidence,
      minDistinctiveness,
      isAbstractOnly,
    } = thresholds;

    const validatedThemes: CandidateTheme[] = [];

    // Phase 10 Day 31.3: Track validation metrics to avoid recalculation (DRY principle)
    const themeMetrics = new Map<string, { coherence: number; distinctiveness: number; evidenceQuality: number }>();

    for (const theme of themes) {
      // Check 1: Minimum source count
      if (theme.sourceIds.length < minSources) {
        this.logger.debug(
          `Theme "${theme.label}" rejected: only ${theme.sourceIds.length} sources (need ${minSources})`,
        );
        continue;
      }

      // Check 2: Semantic coherence (are codes in theme actually related?)
      const coherence = this.calculateThemeCoherence(theme);
      if (coherence < minCoherence) {
        this.logger.debug(
          `Theme "${theme.label}" rejected: low coherence ${coherence.toFixed(2)} (need ${minCoherence})`,
        );
        continue;
      }

      // Check 3: Distinctiveness (is theme sufficiently different from others?)
      const distinctiveness = this.calculateDistinctiveness(
        theme,
        validatedThemes,
      );
      if (distinctiveness < minDistinctiveness && validatedThemes.length > 0) {
        this.logger.debug(
          `Theme "${theme.label}" rejected: low distinctiveness ${distinctiveness.toFixed(2)} (need ${minDistinctiveness})`,
        );
        continue;
      }

      // Check 4: Evidence quality (do we have good excerpts?)
      const evidenceQuality =
        theme.codes.filter((c) => c.excerpts.length > 0).length /
        theme.codes.length;
      if (evidenceQuality < minEvidence) {
        this.logger.debug(
          `Theme "${theme.label}" rejected: insufficient evidence ${evidenceQuality.toFixed(2)} (need ${minEvidence.toFixed(2)})`,
        );
        continue;
      }

      // Phase 10 Day 31.3: Store metrics for reuse (DRY principle)
      themeMetrics.set(theme.id, { coherence, distinctiveness, evidenceQuality });

      // Phase 10 Day 31.3: Use class constant instead of magic number
      // Theme passed all validation checks
      validatedThemes.push({
        ...theme,
        validationScore: (coherence + distinctiveness + evidenceQuality) / UnifiedThemeExtractionService.VALIDATION_SCORE_COMPONENTS,
      });
    }

    this.logger.log(
      `Validated ${validatedThemes.length}/${themes.length} themes`,
    );

    // PHASE 10 DAY 5.17.4: Capture rejection details for API response
    let rejectionDiagnostics: any = null;

    // ============================================================================
    // 🔍 ENTERPRISE-GRADE DEBUG LOGGING: Phase 10 Day 5.15
    // When ALL themes are rejected, log detailed validation failure reasons
    // ============================================================================
    if (validatedThemes.length === 0 && themes.length > 0) {
      this.logger.warn('');
      this.logger.warn(
        '⚠️ ═══════════════════════════════════════════════════════════════════',
      );
      this.logger.warn(
        `⚠️  ALL ${themes.length} GENERATED THEMES WERE REJECTED BY VALIDATION`,
      );
      this.logger.warn(
        '⚠️ ═══════════════════════════════════════════════════════════════════',
      );
      this.logger.warn('');
      this.logger.warn(
        '📊 Validation Thresholds' +
          (isAbstractOnly ? ' (ADAPTIVE - Abstract Content Detected):' : ':'),
      );
      this.logger.warn(`   • Minimum Sources: ${minSources} papers per theme`);
      this.logger.warn(
        `   • Minimum Coherence: ${minCoherence.toFixed(2)} (semantic relatedness of codes)`,
      );
      this.logger.warn(
        `   • Minimum Distinctiveness: ${minDistinctiveness} (uniqueness from other themes)`,
      );
      this.logger.warn(
        `   • Minimum Evidence Quality: ${minEvidence.toFixed(2)} (${Math.round(minEvidence * 100)}% of codes need excerpts)`,
      );
      if (isAbstractOnly) {
        this.logger.warn(
          `   ℹ️  Note: Thresholds have been automatically adjusted for abstract-only content`,
        );
      }
      this.logger.warn('');
      // Phase 10 Day 31.3: Use class constant instead of magic number
      this.logger.warn(`🔍 Detailed Rejection Analysis (first ${UnifiedThemeExtractionService.MAX_THEMES_TO_LOG} themes):`);
      this.logger.warn('');

      const themesToLog = themes.slice(0, UnifiedThemeExtractionService.MAX_THEMES_TO_LOG);
      const rejectedThemeDetails: any[] = [];

      for (let i = 0; i < themesToLog.length; i++) {
        const theme = themesToLog[i];

        // Phase 10 Day 31.3: Reuse stored metrics if available, otherwise calculate (DRY principle)
        let coherence: number;
        let distinctiveness: number;
        let evidenceQuality: number;

        const storedMetrics = themeMetrics.get(theme.id);
        if (storedMetrics) {
          coherence = storedMetrics.coherence;
          distinctiveness = storedMetrics.distinctiveness;
          evidenceQuality = storedMetrics.evidenceQuality;
        } else {
          // Theme was rejected before metrics were stored
          coherence = this.calculateThemeCoherence(theme);
          distinctiveness =
            i > 0
              ? this.calculateDistinctiveness(theme, themes.slice(0, i))
              : UnifiedThemeExtractionService.DEFAULT_DISTINCTIVENESS_SCORE;
          evidenceQuality =
            theme.codes.filter((c) => c.excerpts.length > 0).length /
            theme.codes.length;
        }

        // Determine which check(s) failed
        const failures: string[] = [];
        const checks = {
          sources: {
            actual: theme.sourceIds.length,
            required: minSources,
            passed: false,
          },
          coherence: {
            actual: coherence,
            required: minCoherence,
            passed: false,
          },
          distinctiveness: {
            actual: distinctiveness,
            required: minDistinctiveness,
            passed: false,
          },
          evidence: {
            actual: evidenceQuality,
            required: minEvidence,
            passed: false,
          },
        };

        if (theme.sourceIds.length < minSources) {
          failures.push(`Sources: ${theme.sourceIds.length}/${minSources} ❌`);
        } else {
          failures.push(`Sources: ${theme.sourceIds.length}/${minSources} ✓`);
          checks.sources.passed = true;
        }

        if (coherence < minCoherence) {
          failures.push(
            `Coherence: ${coherence.toFixed(3)}/${minCoherence.toFixed(2)} ❌`,
          );
        } else {
          failures.push(
            `Coherence: ${coherence.toFixed(3)}/${minCoherence.toFixed(2)} ✓`,
          );
          checks.coherence.passed = true;
        }

        if (distinctiveness < minDistinctiveness && i > 0) {
          failures.push(
            `Distinct: ${distinctiveness.toFixed(3)}/${minDistinctiveness} ❌`,
          );
        } else {
          failures.push(
            `Distinct: ${distinctiveness.toFixed(3)}/${minDistinctiveness} ✓`,
          );
          checks.distinctiveness.passed = true;
        }

        if (evidenceQuality < minEvidence) {
          failures.push(
            `Evidence: ${evidenceQuality.toFixed(3)}/${minEvidence.toFixed(2)} ❌`,
          );
        } else {
          failures.push(
            `Evidence: ${evidenceQuality.toFixed(3)}/${minEvidence.toFixed(2)} ✓`,
          );
          checks.evidence.passed = true;
        }

        this.logger.warn(
          `Theme ${i + 1}: "${theme.label.substring(0, 60)}${theme.label.length > 60 ? '...' : ''}"`,
        );
        this.logger.warn(`   └─ ${failures.join(' | ')}`);
        this.logger.warn(
          `   └─ Codes: ${theme.codes.length}, Keywords: ${theme.keywords.slice(0, 3).join(', ')}`,
        );

        // PHASE 10 DAY 5.17.4: Capture for API response
        rejectedThemeDetails.push({
          themeName: theme.label,
          codes: theme.codes.length,
          keywords: theme.keywords.slice(0, 3),
          checks,
          failureReasons: failures.filter((f) => f.includes('❌')),
        });
      }

      // PHASE 10 DAY 5.17.4: Build diagnostic object for API response
      rejectionDiagnostics = {
        totalGenerated: themes.length,
        totalRejected: themes.length,
        totalValidated: 0,
        thresholds: {
          minSources,
          minCoherence: parseFloat(minCoherence.toFixed(2)),
          minDistinctiveness,
          minEvidence: parseFloat(minEvidence.toFixed(2)),
          isAbstractOnly,
        },
        rejectedThemes: rejectedThemeDetails,
        moreRejectedCount: themes.length - rejectedThemeDetails.length,
        recommendations: isAbstractOnly
          ? [
              'Adaptive thresholds are ALREADY ACTIVE for abstract-only content',
              'Topics may be too diverse: Ensure papers cover similar research areas',
              'Add more sources: More papers (20-30) increase cross-source theme likelihood',
              'Consider full-text: If available, use full papers for richer theme extraction',
            ]
          : [
              'Content quality: Ensure sources have substantive research content',
              'Topic coherence: Papers may cover very different topics with no overlap',
              'Add more sources: More papers increase likelihood of cross-source themes',
              'Adjust validation level: Try "exploratory" instead of "rigorous"',
            ],
      };

      if (themes.length > 5) {
        this.logger.warn(
          `   ... and ${themes.length - 5} more rejected themes`,
        );
      }

      this.logger.warn('');
      this.logger.warn('💡 Possible Solutions:');
      if (isAbstractOnly) {
        this.logger.warn(
          '   ✓ Adaptive thresholds are ALREADY ACTIVE for abstract-only content',
        );
        this.logger.warn(
          '   1. Topics may be too diverse: Ensure papers cover similar research areas',
        );
        this.logger.warn(
          '   2. Add more sources: More papers (15-20) increase cross-source theme likelihood',
        );
        this.logger.warn(
          '   3. Consider full-text: If available, use full papers for richer theme extraction',
        );
        this.logger.warn(
          '   4. Check abstract quality: Ensure abstracts describe methodology and findings',
        );
      } else {
        this.logger.warn(
          '   1. Content quality: Ensure sources have substantive research content',
        );
        this.logger.warn(
          '   2. Topic coherence: Papers may cover very different topics with no overlap',
        );
        this.logger.warn(
          '   3. Add more sources: More papers increase likelihood of cross-source themes',
        );
        this.logger.warn(
          '   4. Adjust validation level: Try "exploratory" instead of "rigorous"',
        );
      }
      this.logger.warn('');
      this.logger.warn(
        '⚠️ ═══════════════════════════════════════════════════════════════════',
      );
      this.logger.warn('');
    }

    // PHASE 10 DAY 5.17.4: Return both themes and diagnostics
    return { validatedThemes, rejectionDiagnostics };
  }

  /**
   * Refine themes by merging similar ones and removing weak themes
   *
   * @private
   */
  private async refineThemesAcademic(
    themes: CandidateTheme[],
    embeddings: Map<string, number[]>,
  ): Promise<CandidateTheme[]> {
    // Phase 10 Day 31.3: Input validation (defensive programming)
    if (!themes || themes.length === 0) {
      this.logger.warn('refineThemesAcademic called with empty themes array');
      return [];
    }

    let refinedThemes = [...themes];

    // Sort by validation score (strongest themes first)
    refinedThemes.sort(
      (a, b) => (b.validationScore || 0) - (a.validationScore || 0),
    );

    // Phase 10 Day 31.3: Use class constant for merge threshold
    // Merge overlapping themes (similarity > threshold)
    const finalThemes: CandidateTheme[] = [];

    for (const theme of refinedThemes) {
      let merged = false;

      for (const existingTheme of finalThemes) {
        const similarity = this.cosineSimilarity(
          theme.centroid,
          existingTheme.centroid,
        );

        if (similarity > UnifiedThemeExtractionService.THEME_MERGE_SIMILARITY_THRESHOLD) {
          // Merge into existing theme
          existingTheme.codes.push(...theme.codes);
          existingTheme.keywords = [
            ...new Set([...existingTheme.keywords, ...theme.keywords]),
          ];
          existingTheme.sourceIds = [
            ...new Set([...existingTheme.sourceIds, ...theme.sourceIds]),
          ];
          merged = true;
          this.logger.debug(
            `Merged "${theme.label}" into "${existingTheme.label}" (similarity: ${similarity.toFixed(2)})`,
          );
          break;
        }
      }

      if (!merged) {
        finalThemes.push(theme);
      }
    }

    this.logger.log(
      `Refined ${themes.length} themes down to ${finalThemes.length} distinct themes`,
    );

    return finalThemes;
  }

  /**
   * Calculate semantic provenance using embeddings (NOT keyword matching)
   *
   * For each theme, calculate:
   * - Semantic similarity between theme centroid and each source
   * - Extract contextually relevant excerpts
   * - Weight influence by citation count, recency, source quality
   *
   * @private
   */
  private async calculateSemanticProvenance(
    themes: CandidateTheme[],
    sources: SourceContent[],
    embeddings: Map<string, number[]>,
  ): Promise<UnifiedTheme[]> {
    // Phase 10 Day 31.3: Input validation (defensive programming)
    if (!themes || themes.length === 0) {
      this.logger.warn('calculateSemanticProvenance called with empty themes array');
      return [];
    }

    const themesWithProvenance: UnifiedTheme[] = [];

    for (const theme of themes) {
      const themeSources: ThemeSource[] = [];

      for (const source of sources) {
        const sourceEmbedding = embeddings.get(source.id);
        if (!sourceEmbedding) continue;

        // Calculate semantic similarity (cosine similarity)
        const semanticSimilarity = this.cosineSimilarity(
          theme.centroid,
          sourceEmbedding,
        );

        // Phase 10 Day 31.3: Use class constant for semantic relevance threshold
        // Only include sources with meaningful semantic connection
        if (semanticSimilarity > UnifiedThemeExtractionService.SEMANTIC_RELEVANCE_THRESHOLD) {
          // Extract relevant excerpts using semantic search
          const relevantExcerpts = theme.codes
            .filter((code) => code.sourceId === source.id)
            .flatMap((code) => code.excerpts);

          themeSources.push({
            sourceType: source.type,
            sourceId: source.id,
            sourceTitle: source.title,
            sourceAuthor: source.author,
            sourceUrl: source.url,
            doi: source.doi,
            authors: source.authors,
            year: source.year,
            influence: semanticSimilarity,
            keywordMatches: 0, // Deprecated - using semantic similarity instead
            excerpts: relevantExcerpts.slice(0, UnifiedThemeExtractionService.MAX_EXCERPTS_PER_SOURCE),
          });
        }
      }

      // Sort sources by semantic influence
      themeSources.sort((a, b) => b.influence - a.influence);

      // Calculate provenance statistics
      const provenance: ThemeProvenance = {
        paperInfluence: this.calculateProvenanceByType(themeSources, 'paper'),
        videoInfluence: this.calculateProvenanceByType(themeSources, 'youtube'),
        podcastInfluence: this.calculateProvenanceByType(
          themeSources,
          'podcast',
        ),
        socialInfluence:
          this.calculateProvenanceByType(themeSources, 'tiktok') +
          this.calculateProvenanceByType(themeSources, 'instagram'),
        paperCount: themeSources.filter((s) => s.sourceType === 'paper').length,
        videoCount: themeSources.filter((s) => s.sourceType === 'youtube')
          .length,
        podcastCount: themeSources.filter((s) => s.sourceType === 'podcast')
          .length,
        socialCount: themeSources.filter(
          (s) => s.sourceType === 'tiktok' || s.sourceType === 'instagram',
        ).length,
        averageConfidence: theme.validationScore || UnifiedThemeExtractionService.DEFAULT_VALIDATION_SCORE,
        citationChain: themeSources.map(
          (s) =>
            `${s.sourceTitle} (influence: ${(s.influence * 100).toFixed(1)}%)`,
        ),
      };

      // Phase 10 Day 31.3: Use class constant for default confidence (eliminates duplication)
      themesWithProvenance.push({
        id: theme.id,
        label: theme.label,
        description: theme.description,
        keywords: theme.keywords,
        weight: themeSources.length / sources.length, // Prevalence across dataset
        controversial: false, // Could be enhanced with controversy detection
        confidence: theme.validationScore || UnifiedThemeExtractionService.DEFAULT_THEME_CONFIDENCE,
        sources: themeSources,
        provenance,
        extractedAt: new Date(),
        extractionModel: 'academic-semantic-v1',
      });
    }

    return themesWithProvenance;
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
   *
   * @private
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) {
      return 0;
    }

    if (vec1.length !== vec2.length) {
      this.logger.warn('Vector dimension mismatch in cosine similarity');
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Calculate centroid of multiple embedding vectors
   *
   * @private
   */
  private calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];

    const dimensions = vectors[0].length;
    const centroid = new Array(dimensions).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += vector[i];
      }
    }

    // Average
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= vectors.length;
    }

    return centroid;
  }

  /**
   * Calculate L2 norm (Euclidean magnitude) of an embedding vector
   * Phase 10 Day 31.2: Extracted to helper method to eliminate code duplication
   *
   * @private
   * @param embedding - Vector to calculate magnitude for
   * @returns L2 norm (magnitude) of the vector
   */
  private calculateEmbeddingMagnitude(embedding: number[]): number {
    if (!embedding || embedding.length === 0) {
      this.logger.warn('Cannot calculate magnitude of empty embedding vector');
      return 0;
    }

    // Calculate L2 norm: sqrt(sum of squared components)
    const sumOfSquares = embedding.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(sumOfSquares);
  }

  /**
   * Calculate semantic coherence of a theme
   * Measures how related the codes within a theme are to each other
   *
   * @private
   */
  private calculateThemeCoherence(theme: CandidateTheme): number {
    // Phase 10 Day 31.3: Use class constants instead of magic numbers
    if (theme.codes.length < UnifiedThemeExtractionService.MIN_CODES_FOR_COHERENCE) {
      return UnifiedThemeExtractionService.DEFAULT_DISTINCTIVENESS_SCORE;
    }

    // For now, use a heuristic based on keyword overlap
    // In production, would use code embeddings
    let totalOverlap = 0;
    let comparisons = 0;

    for (let i = 0; i < theme.codes.length; i++) {
      for (let j = i + 1; j < theme.codes.length; j++) {
        const overlap = this.calculateKeywordOverlap(
          theme.codes[i].label.split(' '),
          theme.codes[j].label.split(' '),
        );
        totalOverlap += overlap;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalOverlap / comparisons : UnifiedThemeExtractionService.DEFAULT_COHERENCE_SCORE;
  }

  /**
   * Calculate distinctiveness of a theme compared to existing themes
   * Measures how different this theme is from others
   *
   * @private
   */
  private calculateDistinctiveness(
    theme: CandidateTheme,
    existingThemes: CandidateTheme[],
  ): number {
    // Phase 10 Day 31.3: Use class constant instead of magic number
    if (existingThemes.length === 0) {
      return UnifiedThemeExtractionService.DEFAULT_DISTINCTIVENESS_SCORE;
    }

    const similarities = existingThemes.map((existing) =>
      this.cosineSimilarity(theme.centroid, existing.centroid),
    );

    // Return inverse of max similarity (most distinct = least similar to any existing theme)
    const maxSimilarity = Math.max(...similarities);
    return 1 - maxSimilarity;
  }

  /**
   * Calculate average influence by source type
   *
   * @private
   */
  private calculateProvenanceByType(
    sources: ThemeSource[],
    type: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram',
  ): number {
    const filtered = sources.filter((s) => s.sourceType === type);
    if (filtered.length === 0) return 0;

    const totalInfluence = filtered.reduce((sum, s) => sum + s.influence, 0);
    return totalInfluence / filtered.length;
  }

  /**
   * Calculate coherence score across all themes
   *
   * @private
   */
  private calculateCoherenceScore(
    themes: UnifiedTheme[],
    embeddings: Map<string, number[]>,
  ): number {
    if (themes.length === 0) return 0;

    const coherenceScores = themes.map((theme) => theme.confidence);
    return (
      coherenceScores.reduce((sum, score) => sum + score, 0) / themes.length
    );
  }

  /**
   * Calculate coverage (percentage of dataset represented by themes)
   *
   * @private
   */
  private calculateCoverage(
    themes: UnifiedTheme[],
    sources: SourceContent[],
  ): number {
    const coveredSourceIds = new Set<string>();

    for (const theme of themes) {
      for (const source of theme.sources) {
        coveredSourceIds.add(source.sourceId);
      }
    }

    return coveredSourceIds.size / sources.length;
  }

  /**
   * Check if theme saturation has been reached
   * (no new themes emerging - good stopping point)
   *
   * @private
   */
  private checkSaturation(themes: UnifiedTheme[]): boolean {
    // Simple heuristic: if we have reasonable number of themes with good coverage
    return themes.length >= 5 && themes.length <= 20;
  }

  /**
   * Calculate average confidence across all themes
   *
   * @private
   */
  private calculateAverageConfidence(themes: UnifiedTheme[]): number {
    if (themes.length === 0) return 0;

    const totalConfidence = themes.reduce(
      (sum, theme) => sum + theme.confidence,
      0,
    );
    return totalConfidence / themes.length;
  }
}

// ========================================================================
// TYPE DEFINITIONS FOR ACADEMIC EXTRACTION (PHASE 10 DAY 5.13)
// ========================================================================

/**
 * 4-part transparent progress message structure
 * Implements Nielsen's Usability Heuristic #1
 *
 * Patent Claim #9: 4-Part Transparent Progress Messaging
 */
export interface TransparentProgressMessage {
  stageName: string; // Part 1: Stage name
  stageNumber: number;
  totalStages: number;
  percentage: number;
  whatWeAreDoing: string; // Part 2: Plain English (no jargon)
  whyItMatters: string; // Part 3: Scientific rationale (Braun & Clarke 2019)
  liveStats: {
    // Part 4: Live statistics
    sourcesAnalyzed: number;
    codesGenerated?: number;
    themesIdentified?: number;
    currentOperation: string;
    // Phase 10 Day 30: Real-time familiarization metrics
    fullTextRead?: number;
    abstractsRead?: number;
    totalWordsRead?: number;
    currentArticle?: number;
    totalArticles?: number;
    articleTitle?: string;
    articleType?: 'full-text' | 'abstract';
    articleWords?: number;
    // Phase 10 Day 31.2: Enterprise-grade scientific metrics for Stage 1
    embeddingStats?: {
      dimensions: number; // 3072 for text-embedding-3-large
      model: string; // text-embedding-3-large
      totalEmbeddingsGenerated: number;
      averageEmbeddingMagnitude?: number; // L2 norm of embeddings
      processingMethod: 'single' | 'chunked-averaged';
      chunksProcessed?: number; // For long articles
      scientificExplanation?: string; // What this means in scientific terms
    };
    // Phase 10 Day 31.2: Downloadable familiarization report
    familiarizationReport?: {
      downloadUrl?: string;
      embeddingVectors?: boolean; // Whether full vectors are available
      completedAt?: string;
    };
  };
}

export interface AcademicExtractionOptions extends ExtractionOptions {
  methodology?: 'reflexive_thematic' | 'grounded_theory' | 'content_analysis';
  validationLevel?: 'standard' | 'rigorous' | 'publication_ready';
  userId?: string;
  purpose?: ResearchPurpose; // NEW: Purpose-adaptive extraction
  allowIterativeRefinement?: boolean; // NEW: Non-linear TA support (Patent Claim #11)
  userExpertiseLevel?: 'novice' | 'researcher' | 'expert'; // NEW: Progressive disclosure (Patent Claim #10)
  requestId?: string; // PHASE 10 DAY 5.17.3: Request tracking for end-to-end logging
}

export type AcademicProgressCallback = (
  stage: number,
  totalStages: number,
  message: string,
  transparentMessage?: TransparentProgressMessage, // NEW: 4-part message
) => void;

export interface AcademicExtractionResult {
  themes: UnifiedTheme[];
  methodology: EnhancedMethodologyReport; // ENHANCED: With AI disclosure
  validation: ValidationMetrics;
  processingStages: string[];
  metadata: ExtractionMetadata;
  saturationData?: SaturationData; // NEW: For saturation visualization (Patent Claim #13)
  iterativeRefinements?: number; // NEW: Track refinement cycles
  rejectionDiagnostics?: {
    // PHASE 10 DAY 5.17.4: Rejection diagnostics for users without backend access
    totalGenerated: number;
    totalRejected: number;
    totalValidated: number;
    thresholds: {
      minSources: number;
      minCoherence: number;
      minDistinctiveness?: number;
      minEvidence: number;
      isAbstractOnly: boolean;
    };
    rejectedThemes: Array<{
      themeName: string;
      codes: number;
      keywords: string[];
      checks: {
        sources: { actual: number; required: number; passed: boolean };
        coherence: { actual: number; required: number; passed: boolean };
        distinctiveness?: { actual: number; required: number; passed: boolean };
        evidence: { actual: number; required: number; passed: boolean };
      };
      failureReasons: string[];
    }>;
    moreRejectedCount: number;
    recommendations: string[];
  };
}

/**
 * PHASE 10 DAY 5.17.4: Validation result with optional rejection diagnostics
 * Helps users without backend access understand why themes were rejected
 */
export interface ValidationResult {
  validatedThemes: CandidateTheme[];
  rejectionDiagnostics: {
    totalGenerated: number;
    totalRejected: number;
    totalValidated: number;
    thresholds: {
      minSources: number;
      minCoherence: number;
      minDistinctiveness?: number;
      minEvidence: number;
      isAbstractOnly: boolean;
    };
    rejectedThemes: Array<{
      themeName: string;
      codes: number;
      keywords: string[];
      checks: {
        sources: { actual: number; required: number; passed: boolean };
        coherence: { actual: number; required: number; passed: boolean };
        distinctiveness?: { actual: number; required: number; passed: boolean };
        evidence: { actual: number; required: number; passed: boolean };
      };
      failureReasons: string[];
    }>;
    moreRejectedCount: number;
    recommendations: string[];
  } | null;
}

/**
 * Enhanced methodology report with AI disclosure section
 * Complies with Nature/Science 2024 AI disclosure guidelines
 *
 * Patent Claim #8 + #12: Methodology Report + AI Confidence Calibration
 */
export interface EnhancedMethodologyReport {
  method: string;
  citation: string;
  stages: number;
  validation: string;
  aiRole: string;
  limitations: string;
  // NEW: AI Disclosure Section (Nature/Science 2024 compliance)
  aiDisclosure: {
    modelUsed: string; // e.g., "GPT-4 Turbo + text-embedding-3-large"
    aiRoleDetailed: string; // Specific tasks AI performed
    humanOversightRequired: string; // What humans must review
    confidenceCalibration: {
      high: string; // e.g., "0.8-1.0: Theme in 80%+ sources"
      medium: string;
      low: string;
    };
  };
  // NEW: Iterative Refinement Documentation (Patent Claim #11)
  iterativeRefinement?: {
    cyclesPerformed: number;
    stagesRevisited: string[];
    rationale: string;
  };
}

export interface MethodologyReport {
  method: string;
  citation: string;
  stages: number;
  validation: string;
  aiRole: string;
  limitations: string;
}

/**
 * Saturation data for visualization
 * Patent Claim #13: Theme Saturation Visualization
 */
export interface SaturationData {
  sourceProgression: Array<{
    sourceNumber: number;
    newThemesDiscovered: number;
    cumulativeThemes: number;
  }>;
  saturationReached: boolean;
  saturationPoint?: number; // Source number where saturation occurred
  recommendation: string; // e.g., "Saturation reached - optimal theme count"
}

export interface ValidationMetrics {
  coherenceScore: number; // 0-1, within-theme semantic similarity
  coverage: number; // 0-1, % of sources covered by themes
  saturation: boolean; // Has theme saturation been reached?
  confidence: number; // 0-1, average confidence across themes
}

export interface ExtractionMetadata {
  sourcesAnalyzed: number;
  codesGenerated: number;
  candidateThemes: number;
  finalThemes: number;
  processingTimeMs: number;
  embeddingModel: string;
  analysisModel: string;
}

export interface InitialCode {
  id: string;
  label: string;
  description: string;
  sourceId: string;
  excerpts: string[];
}

export interface CandidateTheme {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  definition: string;
  codes: InitialCode[];
  centroid: number[];
  sourceIds: string[];
  validationScore?: number;
}
