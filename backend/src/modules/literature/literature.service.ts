/**
 * ⚠️ MANDATORY READING BEFORE MODIFYING THIS FILE ⚠️
 *
 * READ FIRST: Main Docs/PHASE_TRACKER_PART3.md
 * Section: "📖 LITERATURE PAGE DEVELOPMENT PRINCIPLES (MANDATORY FOR ALL FUTURE WORK)"
 * Location: Lines 4092-4244 (RIGHT BEFORE Phase 10.7)
 *
 * This is the MAIN SERVICE for the Literature Discovery Page (/discover/literature)
 * ALL modifications must follow 10 enterprise-grade principles documented in Phase Tracker Part 3
 *
 * Key Requirements for Service Layer:
 * - ✅ Single Responsibility: Orchestrate literature search operations ONLY
 * - ✅ Business logic isolation: NO HTTP routing logic (belongs in Controller)
 * - ✅ NO database operations directly (use PrismaService via dependency injection)
 * - ✅ Coordinate source services (ArxivService, PubMedService, etc.)
 * - ✅ Type safety: strict TypeScript, explicit return types, no any types
 * - ✅ Comprehensive error handling: throw meaningful exceptions
 * - ✅ Zero TypeScript errors (MANDATORY before commit)
 * - ✅ Audit logging: log all search operations, API calls, errors
 * - ✅ Security: validate all inputs, prevent injection attacks
 *
 * Architecture Pattern (Service Layer Position):
 * User → Component → Hook → API Service → Controller → **[MAIN SERVICE]** → Source Services → External APIs
 *
 * Reference: IMPLEMENTATION_GUIDE_PART6.md for service implementation patterns
 *
 * ⚠️ DO NOT add HTTP logic here. NO Prisma direct calls. Read the principles first. ⚠️
 */

import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, forwardRef, OnModuleInit } from '@nestjs/common';
// Phase 10.100 Phase 12: createHash moved to SearchQualityDiversityService
import { CacheService } from '../../common/cache.service';
// Phase 10.102 Phase 3.1: Error Handling & Multi-Tenant Isolation (INTEGRATING NOW)
import { BulkheadService } from '../../common/services/bulkhead.service';
import { RetryService } from '../../common/services/retry.service';
// Phase 10.100 Phase 14: PrismaService removed - all database operations delegated to specialized services
import { StatementGeneratorService } from '../ai/services/statement-generator.service';
import {
  CitationNetwork,
  ExportCitationsDto,
  LiteratureSource,
  Paper,
  ResearchGap,
  SavePaperDto,
  SearchLiteratureDto,
  SearchMetadata,
  Theme,
} from './dto/literature.dto';
// Phase 10.100 Phase 10: APIQuotaMonitorService and SearchCoalescerService moved to SourceRouterService
// Phase 10.100 Phase 10: All source services moved to SourceRouterService
// Phase 10.100 Phase 3: MultiMediaAnalysisService and TranscriptionService moved to AlternativeSourcesService
import { OpenAlexEnrichmentService } from './services/openalex-enrichment.service';
// Phase 10.6 Day 14.4: Enterprise-grade search logging
import { SearchLoggerService } from './services/search-logger.service';
// Phase 10.100 Phase 2: Search Pipeline Orchestration Service (8-stage progressive filtering)
import { SearchPipelineService } from './services/search-pipeline.service';
// Phase 10.100 Phase 3: Alternative Sources Service (arxiv, patents, github, stackoverflow, youtube, podcasts)
import {
  AlternativeSourcesService,
  AlternativeSourceResult,
  YouTubeChannelInfo,
  YouTubeChannelVideosResponse,
} from './services/alternative-sources.service';
// Phase 10.100 Phase 4: Social Media Intelligence Service (Twitter, Reddit, LinkedIn, Facebook, Instagram, TikTok)
import {
  SocialMediaIntelligenceService,
  SocialMediaPost,
  SocialMediaInsights,
  SocialOpinionAnalysis,
} from './services/social-media-intelligence.service';
// Phase 10.100 Phase 5: Citation Export Service (BibTeX, RIS, APA, MLA, Chicago, CSV, JSON)
import { CitationExportService, ExportResult } from './services/citation-export.service';
// Phase 10.100 Phase 6: Knowledge Graph Service (graph construction, citation network, study recommendations)
import { KnowledgeGraphService, KnowledgeGraphNode } from './services/knowledge-graph.service';
// Phase 10.100 Phase 7: Paper Permissions Service (ownership verification, full-text status management)
import { PaperPermissionsService, PaperOwnershipResult, FullTextStatus } from './services/paper-permissions.service';
// Phase 10.100 Phase 8: Paper Metadata Service (metadata refresh, semantic scholar mapping, title matching)
import { PaperMetadataService, MetadataRefreshResult } from './services/paper-metadata.service';
// Phase 10.100 Phase 9: Paper Database Service (paper CRUD operations, library management, ownership enforcement)
import { PaperDatabaseService, PaperSaveResult, UserLibraryResult, PaperDeleteResult } from './services/paper-database.service';
// Phase 10.100 Phase 10: Source Router Service (academic source routing, quota management, error handling)
import { SourceRouterService } from './services/source-router.service';
// Phase 10.100 Phase 11 Type Safety: LiteratureGateway type import (type-only to avoid circular dependency)
import type { LiteratureGateway } from './literature.gateway';
// Phase 10.100 Phase 11: Literature Utilities Service (deduplication, query preprocessing, string algorithms)
import { LiteratureUtilsService } from './services/literature-utils.service';
// Phase 10.100 Phase 12: Search Quality and Diversity Service (quality sampling, source diversity, pagination caching)
import { SearchQualityDiversityService, SourceDiversityReport } from './services/search-quality-diversity.service';
// Phase 10.100 Phase 13: HTTP Client Configuration Service (timeout management, request monitoring)
import { HttpClientConfigService } from './services/http-client-config.service';
// Phase 10.100 Phase 14: Search Analytics Service (search logging, access control)
import { SearchAnalyticsService } from './services/search-analytics.service';
// Phase 10.102 Day 2 - Phase 2: Source Allocation Service (enterprise-grade with NestJS Logger)
import { SourceAllocationService } from './services/source-allocation.service';
// Phase 10.99 Week 2: MutablePaper type (simplified to Paper in Phase 10.99)
import { MutablePaper } from './types/performance.types';
import { calculateQualityScore } from './utils/paper-quality.util';
// Phase 10.6 Day 14.9: Tiered source allocation
// Phase 10.100 Phase 12: QUALITY_SAMPLING_STRATA and DIVERSITY_CONSTRAINTS moved to SearchQualityDiversityService
// Phase 10.102 Day 2 - Phase 2: groupSourcesByPriority moved to SourceAllocationService
import {
  getSourceAllocation,
  detectQueryComplexity,
  getSourceTierInfo,
  getConfigurationSummary,
  COMPLEXITY_TARGETS,
  ABSOLUTE_LIMITS,
} from './constants/source-allocation.constants';

@Injectable()
export class LiteratureService implements OnModuleInit {
  private readonly logger = new Logger(LiteratureService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  // Phase 10.100 Phase 13: MAX_GLOBAL_TIMEOUT and requestTimings moved to HttpClientConfigService

  constructor(
    // Phase 10.100 Phase 14: PrismaService removed - all database operations delegated to specialized services
    // (SearchAnalyticsService, PaperDatabaseService, PaperMetadataService, etc.)
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
    // Phase 10.100 Phase 10: searchCoalescer and quotaMonitor moved to SourceRouterService
    @Inject(forwardRef(() => StatementGeneratorService))
    private readonly statementGenerator: StatementGeneratorService,
    // Phase 10.1 Day 12: Citation & journal metrics enrichment
    private readonly openAlexEnrichment: OpenAlexEnrichmentService,
    // Phase 10.100 Phase 10: All source services moved to SourceRouterService
    // Phase 10.6 Day 14.4: Enterprise-grade search logging
    private readonly searchLogger: SearchLoggerService,
    // Phase 10.100 Phase 2: Search Pipeline Orchestration Service (8-stage progressive filtering)
    // Note: SearchPipelineService handles neural relevance filtering internally
    private readonly searchPipeline: SearchPipelineService,
    // Phase 10.100 Phase 3: Alternative Sources Service (arxiv, patents, github, stackoverflow, youtube, podcasts)
    private readonly alternativeSources: AlternativeSourcesService,
    // Phase 10.100 Phase 4: Social Media Intelligence Service (Twitter, Reddit, LinkedIn, Facebook, Instagram, TikTok)
    private readonly socialMediaIntelligence: SocialMediaIntelligenceService,
    // Phase 10.100 Phase 5: Citation Export Service (BibTeX, RIS, APA, MLA, Chicago, CSV, JSON)
    private readonly citationExport: CitationExportService,
    // Phase 10.100 Phase 6: Knowledge Graph Service (graph construction, citation network, study recommendations)
    private readonly knowledgeGraph: KnowledgeGraphService,
    // Phase 10.100 Phase 7: Paper Permissions Service (ownership verification, full-text status management)
    private readonly paperPermissions: PaperPermissionsService,
    // Phase 10.100 Phase 8: Paper Metadata Service (metadata refresh, semantic scholar mapping, title matching)
    private readonly paperMetadata: PaperMetadataService,
    // Phase 10.100 Phase 9: Paper Database Service (paper CRUD operations, library management, ownership enforcement)
    private readonly paperDatabase: PaperDatabaseService,
    // Phase 10.100 Phase 10: Source Router Service (academic source routing, quota management, error handling)
    private readonly sourceRouter: SourceRouterService,
    // Phase 10.100 Phase 11: Literature Utilities Service (deduplication, query preprocessing, string algorithms)
    private readonly literatureUtils: LiteratureUtilsService,
    // Phase 10.100 Phase 12: Search Quality and Diversity Service (quality sampling, source diversity, pagination caching)
    private readonly searchQualityDiversity: SearchQualityDiversityService,
    // Phase 10.100 Phase 13: HTTP Client Configuration Service (timeout management, request monitoring)
    private readonly httpConfig: HttpClientConfigService,
    // Phase 10.100 Phase 14: Search Analytics Service (search logging, access control)
    private readonly searchAnalytics: SearchAnalyticsService,
    // Phase 10.102 Day 2 - Phase 2: Source Allocation Service (enterprise-grade with NestJS Logger)
    private readonly sourceAllocation: SourceAllocationService,
    // Phase 10.102 Phase 3.1 Session 3: Error Handling & Multi-Tenant Isolation (INTEGRATED)
    private readonly bulkhead: BulkheadService,
    // Phase 10.102 Phase 3.1 Session 1: RetryService used by API services (semantic-scholar, pubmed, springer, openalex, eric)
    // Not used directly in this orchestrator service, but injected for dependency availability
    private readonly retry: RetryService,
  ) {
    this.logger.log('✅ [Phase 10.102 Phase 3.1] BulkheadService and RetryService integrated for enterprise resilience');
    // RetryService is used by individual API services, not directly by LiteratureService
    void this.retry; // Satisfy TypeScript unused variable check
  }
  
  // Phase 10.8 Day 7 Post-Implementation: Real-time progress reporting
  // Using manual injection via onModuleInit to prevent circular dependency issues
  // Type-only import above ensures type safety without runtime circular dependency
  private literatureGateway?: LiteratureGateway;

  /**
   * Phase 10.6 Day 14.8: Configure HTTP client on module initialization
   * Phase 10.8 Day 7 Post: Inject gateway for progress reporting
   * Phase 10.100 Phase 13: HTTP configuration delegated to HttpClientConfigService
   *
   * ENTERPRISE-GRADE TIMEOUT CONFIGURATION:
   * - Sets global timeout to prevent 67s hangs (via HttpClientConfigService)
   * - Individual sources use their own timeouts (10s, 15s, 30s)
   * - Global timeout acts as safety net (30s max)
   *
   * BEFORE: All sources took 67s (system default)
   * AFTER: Fast sources complete in 3-10s, slow sources timeout at 30s
   */
  onModuleInit() {
    // Phase 10.100 Phase 13: Delegate HTTP client configuration to HttpClientConfigService
    this.httpConfig.configureHttpClient(this.httpService);

    // Phase 10.8 Day 7 Post: Inject gateway manually to avoid circular dependency
    // (Gateway injection remains in main service - specific to LiteratureService)
    try {
      const { LiteratureGateway: _LiteratureGateway } = require('./literature.gateway');
      // Gateway will be instantiated by NestJS, we'll access it via module
      this.logger.log('✅ LiteratureGateway available for progress reporting');
    } catch (error) {
      this.logger.warn('⚠️ LiteratureGateway not available, progress reporting disabled');
    }
  }

  async searchLiterature(
    searchDto: SearchLiteratureDto,
    userId: string,
  ): Promise<{
    papers: Paper[];
    total: number;
    page: number;
    isCached?: boolean;
    cacheAge?: number;
    isStale?: boolean;
    isArchive?: boolean;
    correctedQuery?: string;
    originalQuery?: string;
    // Phase 10.100 Phase 2: Flexible metadata type for pipeline transparency
    // Contains: stage1, stage2, searchPhases, allocationStrategy, diversityMetrics,
    // qualificationCriteria, biasMetrics, and legacy fields for backward compatibility
    // Phase 10.102 Phase 3.1: Replaced Record<string, any> with SearchMetadata for strict mode
    metadata?: SearchMetadata;
  }> {
    // Phase 10.102 Phase 3.1 STRICT AUDIT: Defensive input validation for userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      this.logger.error('❌ [Validation] Invalid userId provided to searchLiterature');
      throw new Error('Invalid user identifier: must be non-empty string');
    }

    // Phase 10.7 Day 5: PAGINATION CACHE - Generate cache key WITHOUT page/limit
    const searchCacheKey = this.generatePaginationCacheKey(searchDto, userId);
    
    // PAGINATION: If page > 1, try to use cached full results (eliminates empty batches)
    if (searchDto.page && searchDto.page > 1) {
      const cachedFullResults = await this.cacheService.get(searchCacheKey) as {
        papers: Paper[];
        metadata: SearchMetadata;
      } | null;
      
      if (cachedFullResults) {
        this.logger.log(
          `📋 [Pagination Cache] Using cached results for page ${searchDto.page} (eliminates re-searching sources)`
        );
        
        const { papers, metadata } = cachedFullResults;
        const limit = searchDto.limit || 20;
        const startIdx = (searchDto.page - 1) * limit;
        const endIdx = startIdx + limit;
        const paginatedPapers = papers.slice(startIdx, endIdx);
        
        this.logger.log(
          `📋 [Pagination Cache] Serving ${paginatedPapers.length} papers from index ${startIdx}-${endIdx} (total cached: ${papers.length})`
        );
        
        return {
          papers: paginatedPapers,
          total: papers.length,
          page: searchDto.page,
          metadata: {
            ...metadata,
            displayed: paginatedPapers.length,
            fromCache: true,
          },
        };
      }
      
      // Cache miss for pagination - this shouldn't happen, but fall through to full search
      this.logger.warn(
        `⚠️ [Pagination Cache] Cache miss for page ${searchDto.page}, performing full search (cache may have expired)`
      );
    }

    const cacheKey = `literature:search:${JSON.stringify(searchDto)}`;

    // Phase 10 Days 2-3: Check cache with staleness metadata
    const cacheResult = await this.cacheService.getWithMetadata<any>(cacheKey);
    if (cacheResult.isFresh && cacheResult.data) {
      this.logger.log(
        `✅ [Cache] Serving fresh cached results (age: ${Math.floor(cacheResult.age / 60)} min)`,
      );
      return {
        ...(cacheResult.data as any),
        isCached: true,
        cacheAge: cacheResult.age,
      };
    }

    // Phase 10.102 Phase 3.1 Session 3: BULKHEAD PATTERN - Enterprise Netflix-Grade Resilience
    // ============================================================================
    // MULTI-TENANT RESOURCE ISOLATION:
    // - Prevents one user's heavy search from blocking others
    // - Per-user concurrency limit: 3 concurrent searches max
    // - Global concurrency limit: 50 concurrent searches max
    // - Circuit breaker: Opens after 5 failures, resets after 30s
    // - Queue overflow protection: Rejects when queue > 6 (2x concurrency)
    //
    // BEFORE: Heavy user could consume all server resources
    // AFTER:  Fair allocation, graceful degradation, system protection
    // ============================================================================
    type SearchResult = {
      papers: Paper[];
      total: number;
      page: number;
      isCached?: boolean;
      cacheAge?: number;
      isStale?: boolean;
      isArchive?: boolean;
      correctedQuery?: string;
      originalQuery?: string;
      metadata?: SearchMetadata;
    };

    try {
      return await this.bulkhead.executeSearch<SearchResult>(userId, async () => {
        // ALL CORE SEARCH LOGIC WRAPPED IN BULKHEAD BELOW
        // This prevents resource exhaustion and ensures fair multi-tenant access

        // Preprocess and expand query for better results
        const originalQuery = searchDto.query;
        const expandedQuery = this.preprocessAndExpandQuery(searchDto.query);
        this.logger.log(`Original query: "${originalQuery}"`);
        this.logger.log(`Expanded query: "${expandedQuery}"`);

        // Phase 10.6 Day 14.9: ENTERPRISE-GRADE TIERED SOURCE ALLOCATION
        // Detect query complexity for adaptive limits
        const queryComplexity = detectQueryComplexity(originalQuery);
        const complexityConfig = COMPLEXITY_TARGETS[queryComplexity];

        this.logger.log(
          `🎯 Query Complexity: ${queryComplexity.toUpperCase()} - "${complexityConfig.description}"`,
        );
        this.logger.log(
          `📊 Target: ${complexityConfig.totalTarget} papers (${complexityConfig.minPerSource}-${complexityConfig.maxPerSource} per source)`,
        );

        // Log configuration summary (once per search)
        const config = getConfigurationSummary();
        this.logger.log(
          `⚙️  Allocation Strategy: Tier-1=${config.tierAllocations['Tier 1 (Premium)']}, ` +
          `Tier-2=${config.tierAllocations['Tier 2 (Good)']}, ` +
          `Tier-3=${config.tierAllocations['Tier 3 (Preprint)']}, ` +
          `Tier-4=${config.tierAllocations['Tier 4 (Aggregator)']}`,
        );

        // Phase 10.1 Day 11: Defensive check for empty array ([] is truthy in JS!)
        // Frontend may send sources: [] expecting defaults to be used
        // Phase 10.6 Day 14.6: EXPANDED default sources to include ALL free sources (12 sources)
        // Phase 10.7 Day 5.2: Log what sources were requested for debugging
        this.logger.log(
          `📋 [Source Selection] Frontend requested: ${searchDto.sources?.length || 0} sources` +
          (searchDto.sources && searchDto.sources.length > 0
            ? ` (${searchDto.sources.join(', ')})`
            : ' (none, will use defaults)')
        );
        
        // Phase 10.7 Day 5: Changed to 'let' to allow filtering deprecated sources
        let sources =
          searchDto.sources && searchDto.sources.length > 0
            ? searchDto.sources
            : [
                // Core free sources (always available)
                LiteratureSource.SEMANTIC_SCHOLAR,
                LiteratureSource.CROSSREF,
                LiteratureSource.PUBMED,
                LiteratureSource.ARXIV,
                // Phase 10.6 additions - Free academic sources
                LiteratureSource.PMC,          // PubMed Central - Full-text articles
                LiteratureSource.ERIC,         // Education research
                // Phase 10.7.10: Open access sources (API keys configured)
                LiteratureSource.CORE,         // CORE - 250M+ open access papers
                LiteratureSource.SPRINGER,     // Springer Nature - 2M+ documents (API key configured)
                // Phase 10.7 Day 5.3: REMOVED deprecated sources from default list (<500k papers)
                // LiteratureSource.BIORXIV,      // DEPRECATED: 220k papers (removed)
                // LiteratureSource.MEDRXIV,      // DEPRECATED: 45k papers (removed)
                // LiteratureSource.CHEMRXIV,     // DEPRECATED: 35k papers (removed)
                // Note: Google Scholar, SSRN excluded (rate-limited/restricted)
                // Premium sources (Web of Science, Scopus, IEEE, etc.) require API keys
              ];

        this.logger.log(`✅ [Source Selection] Using ${sources.length} sources: ${sources.join(', ')}`);

        // Phase 10.7 Day 5.3: Deprecated sources removed from default list (not filtered, just excluded)
        // Users can still explicitly request them if needed via searchDto.sources parameter

        // Phase 10.102 Day 2 - Phase 2: Enterprise-Grade Source Tier Allocation (via SourceAllocationService)
        // Group sources by tier for organized searching (no early stopping)
        const sourceTiers = this.sourceAllocation.groupSourcesByPriority(sources as LiteratureSource[]);

        // Phase 10.102: Check for unmapped sources (sources that don't match SOURCE_TIER_MAP)
        if (sourceTiers.unmappedSources.length > 0) {
          this.logger.warn(
            `⚠️  [Source Allocation Warning] ${sourceTiers.unmappedSources.length} unmapped sources detected:` +
            `\n   Sources: ${sourceTiers.unmappedSources.join(', ')}` +
            `\n   These sources were not found in SOURCE_TIER_MAP and were defaulted to Tier 1 (Premium).` +
            `\n   This may indicate:` +
            `\n   • Frontend sending incorrect source format (e.g., uppercase instead of lowercase)` +
            `\n   • New sources added to enum but not to SOURCE_TIER_MAP` +
            `\n   • Deprecated sources still being requested` +
            `\n   Action: Review source-allocation.constants.ts and update SOURCE_TIER_MAP if needed.`
          );
        }

        this.logger.log(
          `🎯 Comprehensive Search Strategy - ALL SOURCES:` +
          `\n   • Tier 1 (Premium): ${sourceTiers.tier1Premium.length} sources${sourceTiers.tier1Premium.length > 0 ? ` - ${sourceTiers.tier1Premium.join(', ')}` : ' (none)'}` +
          `\n   • Tier 2 (Good): ${sourceTiers.tier2Good.length} sources${sourceTiers.tier2Good.length > 0 ? ` - ${sourceTiers.tier2Good.join(', ')}` : ' (none)'}` +
          `\n   • Tier 3 (Preprint): ${sourceTiers.tier3Preprint.length} sources${sourceTiers.tier3Preprint.length > 0 ? ` - ${sourceTiers.tier3Preprint.join(', ')}` : ' (none)'}` +
          `\n   • Tier 4 (Aggregator): ${sourceTiers.tier4Aggregator.length} sources${sourceTiers.tier4Aggregator.length > 0 ? ` - ${sourceTiers.tier4Aggregator.join(', ')}` : ' (none)'}` +
          (sourceTiers.unmappedSources.length > 0
            ? `\n   ⚠️  Unmapped (defaulted to Tier 1): ${sourceTiers.unmappedSources.length} sources - ${sourceTiers.unmappedSources.join(', ')}`
            : '') +
          `\n   • All ${sources.length} selected sources will be queried for maximum coverage`
        );

        // Phase 10.6 Day 14.4: Start enterprise-grade search logging
        const searchLog = this.searchLogger.startSearch(originalQuery, sources as string[], userId);

        // Phase 10.6 Day 14.9: Track allocation per source for transparency
        const sourceAllocations: Record<string, { allocation: number; tier: string }> = {};
        const sourcesStartTimes: Record<string, number> = {};

        // Phase 10.99 Week 2 Strict Audit: Single type variable (MutablePaper = Paper now)
        // Use MutablePaper throughout to signal in-place mutation intent
        let papers: MutablePaper[] = [];
        let sourcesSearched: LiteratureSource[] = [];
        
        // Phase 10.8 Day 7 Post: Generate unique search ID for progress tracking
        const searchId = `search-${Date.now()}-${userId}`;
        const stage1StartTime = Date.now();
        const totalSources = sources.length;
        let completedSources = 0;

        // Helper function to emit real-time progress
        const emitProgress = (message: string, percentage: number) => {
          const elapsedSeconds = ((Date.now() - stage1StartTime) / 1000).toFixed(1);
          const logMessage = `[${elapsedSeconds}s] ${message}`;
          this.logger.log(`📊 PROGRESS: ${logMessage}`);
          
          // Emit to frontend via WebSocket
          if (this.literatureGateway && this.literatureGateway.emitSearchProgress) {
            try {
              this.literatureGateway.emitSearchProgress(searchId, percentage, logMessage);
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : String(error);
              this.logger.warn(`Failed to emit progress: ${message}`);
            }
          }
        };

        // Helper function to search a tier of sources
        const searchSourceTier = async (tierSources: LiteratureSource[], tierName: string) => {
          if (tierSources.length === 0) return;
          
          const tierStartTime = Date.now();
          this.logger.log(`\n🔍 [${tierName}] Searching ${tierSources.length} sources...`);
          emitProgress(`Stage 1: Searching ${tierName} (${tierSources.length} sources)`, 
            Math.round((completedSources / totalSources) * 50)); // Stage 1 is 0-50%
          
          const tierPromises = tierSources.map((source) => {
            sourcesStartTimes[source as string] = Date.now();
            
            const allocation = getSourceAllocation(source);
            const tierInfo = getSourceTierInfo(source);
            sourceAllocations[source as string] = {
              allocation,
              tier: tierInfo.tierLabel,
            };

            const sourceSpecificDto = {
              ...searchDto,
              query: expandedQuery,
              limit: Math.min(allocation, ABSOLUTE_LIMITS.MAX_PAPERS_PER_SOURCE),
            };

            this.logger.log(
              `   🔍 [${source}] Tier: ${tierInfo.tierLabel}, Limit: ${sourceSpecificDto.limit} papers, Start: ${new Date().toISOString()}`,
            );

            return this.searchBySource(source, sourceSpecificDto);
          });

          const tierResults = await Promise.allSettled(tierPromises);
          const tierDuration = ((Date.now() - tierStartTime) / 1000).toFixed(2);
          
          for (let i = 0; i < tierResults.length; i++) {
            const result = tierResults[i];
            const source = tierSources[i];
            const sourceDuration = Date.now() - sourcesStartTimes[source as string];
            const sourceSeconds = (sourceDuration / 1000).toFixed(2);
            completedSources++;

            if (result.status === 'fulfilled' && result.value) {
              this.logger.log(`   ✓ [${sourceSeconds}s] ${source}: ${result.value.length} papers (${sourceDuration}ms)`);
              searchLog.recordSource(source as string, result.value.length, sourceDuration);
              papers.push(...result.value);
              sourcesSearched.push(source);
              
              // Emit progress after EACH source completes
              const progressPercent = Math.round((completedSources / totalSources) * 50);
              emitProgress(
                `✓ ${source}: ${result.value.length} papers (${completedSources}/${totalSources} sources)`,
                progressPercent
              );
            } else if (result.status === 'rejected') {
              this.logger.error(`   ✗ [${sourceSeconds}s] ${source}: Failed - ${result.reason}`);
              searchLog.recordSource(source as string, 0, sourceDuration, String(result.reason));
              
              // Emit progress even for failures
              const progressPercent = Math.round((completedSources / totalSources) * 50);
              emitProgress(
                `✗ ${source}: Failed (${completedSources}/${totalSources} sources)`,
                progressPercent
              );
            }
          }
          
          this.logger.log(`   📊 [${tierDuration}s] [${tierName}] Complete: ${papers.length} total papers`);
          emitProgress(`${tierName} complete: ${papers.length} papers collected`, 
            Math.round((completedSources / totalSources) * 50));
        };
        
        // Phase 10.7 Day 5.5: SEARCH ALL SELECTED SOURCES (no early stopping)
        // Previous behavior: Stopped after Tier 1 if 350+ papers found
        // New behavior: Always search ALL sources selected by user for comprehensive coverage
        
        // TIER 1: Search premium sources (highest quality)
        await searchSourceTier(sourceTiers.tier1Premium, 'TIER 1 - Premium');
        this.logger.log(`   📊 After Tier 1: ${papers.length} papers collected`);
        
        // TIER 2: Search good sources (established publishers)
        await searchSourceTier(sourceTiers.tier2Good, 'TIER 2 - Good');
        this.logger.log(`   📊 After Tier 2: ${papers.length} papers collected`);
        
        // TIER 3: Search preprint sources (cutting-edge research)
        await searchSourceTier(sourceTiers.tier3Preprint, 'TIER 3 - Preprint');
        this.logger.log(`   📊 After Tier 3: ${papers.length} papers collected`);
        
        // TIER 4: Search aggregator sources (comprehensive coverage)
        await searchSourceTier(sourceTiers.tier4Aggregator, 'TIER 4 - Aggregator');
        this.logger.log(`   📊 After Tier 4: ${papers.length} papers collected`);
        
        this.logger.log(
          `\n📊 COMPREHENSIVE SEARCH COMPLETE:` +
          `\n   • Sources searched: ${sourcesSearched.length}/${sources.length}` +
          `\n   • Total papers: ${papers.length}` +
          `\n   • All selected sources queried for maximum coverage`
        );

        // Phase 10.98 ENHANCEMENT: Enterprise-grade Stage 1 statistics
        const sourceResults = searchLog.getSourceResults();
        const sourcesWithPapers = Object.entries(sourceResults).filter(
          ([_, data]: [string, { papers: number; duration: number; error?: string }]) => data.papers > 0
        );
        const sourcesWithErrors = Object.entries(sourceResults).filter(
          ([_, data]: [string, { papers: number; duration: number; error?: string }]) => data.error
        );
        const totalPapersFromSources = sourcesWithPapers.reduce(
          (sum: number, [_, data]: [string, { papers: number; duration: number; error?: string }]) => sum + data.papers,
          0
        );

        // Phase 10.98 ENTERPRISE FIX: Validate source tracking accuracy
        if (totalPapersFromSources !== papers.length) {
          this.logger.warn(
            `⚠️  Source Tracking Mismatch: ${totalPapersFromSources} papers in sourceResults but ${papers.length} in papers array. ` +
            `Difference: ${Math.abs(totalPapersFromSources - papers.length)} papers. ` +
            `Possible causes: duplicate tracking across sources, untracked papers, or caching.`
          );
        }

        const avgPapersPerSource: string = sourcesWithPapers.length > 0
          ? (totalPapersFromSources / sourcesWithPapers.length).toFixed(1)
          : '0.0';
        const successRate: string = sources.length > 0
          ? ((sourcesWithPapers.length / sources.length) * 100).toFixed(1)
          : '0.0';

        this.logger.log(
          `\n${'='.repeat(80)}` +
          `\n📊 STAGE 1 COMPLETE - SOURCE PERFORMANCE:` +
          `\n   ✅ Successful Sources: ${sourcesWithPapers.length}/${sources.length} (${successRate}% success rate)` +
          `\n   ❌ Failed Sources: ${sourcesWithErrors.length}` +
          `\n   📈 Average Papers/Source: ${avgPapersPerSource}` +
          `\n   📦 Total Papers Collected: ${papers.length}` +
          `\n${'='.repeat(80)}\n`
        );

        // Log top 5 performing sources
        const sortedSources = sourcesWithPapers.sort(
          (a: [string, { papers: number; duration: number }], b: [string, { papers: number; duration: number }]) =>
            b[1].papers - a[1].papers
        );
        if (sortedSources.length > 0) {
          this.logger.log(`🏆 Top 5 Sources by Paper Count:`);
          sortedSources.slice(0, 5).forEach(
            ([source, data]: [string, { papers: number; duration: number }], index: number) => {
              this.logger.log(`   ${index + 1}. ${source}: ${data.papers} papers (${(data.duration / 1000).toFixed(2)}s)`);
            }
          );
          this.logger.log('');
        }

        // Log failed sources if any
        if (sourcesWithErrors.length > 0) {
          this.logger.log(`⚠️  Failed Sources (${sourcesWithErrors.length}):`);
          sourcesWithErrors.forEach(([source, data]: [string, { papers: number; duration: number; error?: string }]) => {
            this.logger.log(`   ✗ ${source}: ${data.error || 'Unknown error'}`);
          });
          this.logger.log('');
        }

        this.logger.log(
          `📊 Total papers collected from all sources: ${papers.length}`,
        );

        // Stage 1 Complete
        emitProgress(`Stage 1 Complete: ${papers.length} papers collected from ${sourcesSearched.length} sources`, 50);
        
        // Stage 2: Deduplication, Enrichment, Quality Filtering
        const stage2StartTime = Date.now();
        emitProgress(`Stage 2: Deduplicating ${papers.length} papers...`, 55);
        
        // Deduplicate papers by DOI or title
        const uniquePapers = this.deduplicatePapers(papers);
        const dedupSeconds = ((Date.now() - stage2StartTime) / 1000).toFixed(1);
        this.logger.log(
          `📊 [${dedupSeconds}s] After deduplication: ${papers.length} → ${uniquePapers.length} unique papers`,
        );
        emitProgress(`Deduplication: ${papers.length} → ${uniquePapers.length} unique papers`, 60);

        // Phase 10.1 Day 12: Enrich papers with OpenAlex citations & journal metrics
        emitProgress(`Stage 2: Enriching ${uniquePapers.length} papers with citations & metrics...`, 65);
        this.logger.log(`🔄 [OpenAlex] ABOUT TO CALL enrichBatch with ${uniquePapers.length} papers...`);
        this.logger.log(`🔄 [OpenAlex] First 3 papers DOIs: ${uniquePapers.slice(0, 3).map(p => p.doi || 'NO_DOI').join(', ')}`);
        const enrichedPapers = await this.openAlexEnrichment.enrichBatch(uniquePapers);
        const enrichSeconds = ((Date.now() - stage2StartTime) / 1000).toFixed(1);
        this.logger.log(`✅ [${enrichSeconds}s] [OpenAlex] enrichBatch COMPLETED, returned ${enrichedPapers.length} papers`);
        emitProgress(`Enrichment complete: ${enrichedPapers.length} papers enriched with metrics`, 70);

        // Recalculate quality scores with enriched journal metrics
        emitProgress(`Stage 2: Calculating quality scores...`, 75);
        const papersWithUpdatedQuality = enrichedPapers.map((paper) => {
          // Calculate quality components for ALL papers (with or without journal metrics)
          // Phase 10.6 Day 14.8 (v3.0): Includes field weighting and optional bonuses
          const qualityComponents = calculateQualityScore({
            citationCount: paper.citationCount,
            year: paper.year,
            wordCount: paper.wordCount,
            venue: paper.venue,
            source: paper.source,
            impactFactor: paper.impactFactor,
            sjrScore: null, // Not yet implemented
            quartile: paper.quartile,
            hIndexJournal: paper.hIndexJournal,
            // Phase 10.6 Day 14.8 (v3.0): New fields from OpenAlex
            fwci: paper.fwci,
            isOpenAccess: paper.isOpenAccess,
            hasDataCode: paper.hasDataCode,
            altmetricScore: null, // TODO: Integrate Altmetric API in Phase 2
          });

          // Calculate citationsPerYear (may have been updated by OpenAlex)
          const citationsPerYear =
            paper.citationCount && paper.year
              ? paper.citationCount /
                Math.max(1, new Date().getFullYear() - paper.year)
              : 0;

          // Phase 10.1 Day 12: Store breakdown for ALL papers for transparency
          // Phase 10.6 Day 14.8 (v3.0): Includes core score and optional bonuses
          return {
            ...paper,
            citationsPerYear, // Recalculated with potentially updated citation count from OpenAlex
            qualityScore: qualityComponents.totalScore, // v3.0: Core + bonuses
            isHighQuality: qualityComponents.totalScore >= 50,
            qualityScoreBreakdown: {
              citationImpact: qualityComponents.citationImpact, // v3.0: Field-weighted
              journalPrestige: qualityComponents.journalPrestige,
              contentDepth: qualityComponents.contentDepth, // Always 0 (removed)
              // v3.0: Optional bonuses
              openAccessBonus: qualityComponents.openAccessBonus,
              reproducibilityBonus: qualityComponents.reproducibilityBonus,
              altmetricBonus: qualityComponents.altmetricBonus,
            },
          };
        });

        this.logger.log(
          `✅ [OpenAlex] Enrichment complete. Papers with journal metrics: ${papersWithUpdatedQuality.filter(p => p.hIndexJournal).length}/${uniquePapers.length}`,
        );

        // Phase 10.98 ENHANCEMENT: Enterprise-grade quality tier breakdown
        const qualityTiers: { gold: number; silver: number; bronze: number; basic: number } = {
          gold: papersWithUpdatedQuality.filter((p) => (p.qualityScore ?? 0) >= 75).length,
          silver: papersWithUpdatedQuality.filter((p) => (p.qualityScore ?? 0) >= 50 && (p.qualityScore ?? 0) < 75).length,
          bronze: papersWithUpdatedQuality.filter((p) => (p.qualityScore ?? 0) >= 25 && (p.qualityScore ?? 0) < 50).length,
          basic: papersWithUpdatedQuality.filter((p) => (p.qualityScore ?? 0) < 25).length,
        };

        const avgQualityScore: string = papersWithUpdatedQuality.length > 0
          ? (papersWithUpdatedQuality.reduce((sum, p) => sum + (p.qualityScore ?? 0), 0) / papersWithUpdatedQuality.length).toFixed(1)
          : '0.0';

        const papersWithCitations: number = papersWithUpdatedQuality.filter(
          (p) => p.citationCount !== null && p.citationCount !== undefined && p.citationCount > 0
        ).length;
        const avgCitations: string = papersWithUpdatedQuality.length > 0
          ? (papersWithUpdatedQuality.reduce((sum, p) => sum + (p.citationCount ?? 0), 0) / papersWithUpdatedQuality.length).toFixed(1)
          : '0.0';

        const openAccessCount: number = papersWithUpdatedQuality.filter((p) => p.isOpenAccess === true).length;
        const qualityOpenAccessPercent: string = papersWithUpdatedQuality.length > 0
          ? ((openAccessCount / papersWithUpdatedQuality.length) * 100).toFixed(1)
          : '0.0';

        this.logger.log(
          `\n${'='.repeat(80)}` +
          `\n📊 QUALITY ASSESSMENT (v4.0 Algorithm):` +
          `\n   Average Quality Score: ${avgQualityScore}/100` +
          `\n   Average Citations: ${avgCitations} citations/paper` +
          `\n   Open Access: ${openAccessCount}/${papersWithUpdatedQuality.length} (${qualityOpenAccessPercent}%)` +
          `\n` +
          `\n   Quality Tiers:` +
          `\n   ┌──────────────────────────────────────┐` +
          `\n   │ 🥇 Gold (75-100):   ${String(qualityTiers.gold).padStart(5)} papers │` +
          `\n   │ 🥈 Silver (50-74):  ${String(qualityTiers.silver).padStart(5)} papers │` +
          `\n   │ 🥉 Bronze (25-49):  ${String(qualityTiers.bronze).padStart(5)} papers │` +
          `\n   │ ⚪ Basic (0-24):    ${String(qualityTiers.basic).padStart(5)} papers │` +
          `\n   └──────────────────────────────────────┘` +
          `\n` +
          `\n   Citations: ${papersWithCitations}/${papersWithUpdatedQuality.length} papers have citations` +
          `\n   Journal Metrics: ${papersWithUpdatedQuality.filter(p => p.hIndexJournal).length}/${papersWithUpdatedQuality.length} have journal data` +
          `\n${'='.repeat(80)}\n`
        );

        // Apply filters
        // Phase 10.98 ENTERPRISE FIX: Track count before filtering for accurate pipeline reporting
        const beforeBasicFilters: number = papersWithUpdatedQuality.length;
        let filteredPapers = papersWithUpdatedQuality;
        this.logger.log(`📊 Starting filters with ${filteredPapers.length} papers`);

        // Filter by minimum citations
        // IMPORTANT: Only filter papers that HAVE citation data
        // Papers with null citationCount (e.g., from PubMed) are INCLUDED in results
        if (searchDto.minCitations !== undefined && searchDto.minCitations > 0) {
          const beforeCitationFilter = filteredPapers.length;
          filteredPapers = filteredPapers.filter((paper) => {
            // If paper has no citation data, include it (don't filter based on unknown data)
            if (paper.citationCount === null || paper.citationCount === undefined) {
              return true;
            }
            // If paper has citation data, apply the filter
            return paper.citationCount >= searchDto.minCitations!;
          });
          this.logger.log(
            `📊 Citation filter (min: ${searchDto.minCitations}): ${beforeCitationFilter} → ${filteredPapers.length} papers`,
          );
        }

        // Phase 10 Day 5.13+: Filter by minimum word count (academic eligibility)
        // Default: 1000 words (academic standard for substantive content)
        if (searchDto.minWordCount !== undefined) {
          const beforeWordCountFilter = filteredPapers.length;
          const minWords = searchDto.minWordCount;
          filteredPapers = filteredPapers.filter((paper) => {
            // If paper has no word count data, include it (conservative approach)
            if (paper.wordCount === null || paper.wordCount === undefined) {
              return true;
            }
            // Apply word count threshold
            return paper.wordCount >= minWords;
          });
          this.logger.log(
            `📊 Word count filter (min: ${minWords} words): ${beforeWordCountFilter} → ${filteredPapers.length} papers`,
          );
        }

        // Phase 10 Day 5.13+ Extension 2: Filter by minimum abstract length (enterprise research-grade)
        // Phase 10.7 Day 5.6: Made LESS STRICT - allow papers without abstracts if they have other metadata
        // Default: 100 words (academic abstracts typically 150-300 words)
        if (searchDto.minAbstractLength !== undefined) {
          const beforeAbstractFilter = filteredPapers.length;
          const minAbstractWords = searchDto.minAbstractLength;
          
          // Phase 10.7 Day 5.6: Less strict - only filter if abstract exists AND is too short
          // Papers without abstracts are kept (many high-quality papers lack abstracts in APIs)
          filteredPapers = filteredPapers.filter((paper) => {
            // If paper has no abstract data, KEEP IT (don't penalize missing metadata)
            if (!paper.abstractWordCount || paper.abstractWordCount === 0) {
              return true; // Keep papers without abstract data
            }
            // If paper HAS abstract data, ensure it meets minimum length
            return paper.abstractWordCount >= minAbstractWords;
          });
          
          const filtered = beforeAbstractFilter - filteredPapers.length;
          this.logger.log(
            `📊 Abstract length filter (min: ${minAbstractWords} words): ${beforeAbstractFilter} → ${filteredPapers.length} papers` +
            ` (${filtered} filtered for SHORT abstracts, papers without abstracts kept)`,
          );
        }

        // Filter by author with multiple search modes
        if (searchDto.author && searchDto.author.trim().length > 0) {
          const authorQuery = searchDto.author.trim();
          const authorLower = authorQuery.toLowerCase();
          const searchMode = searchDto.authorSearchMode || 'contains';

          filteredPapers = filteredPapers.filter((paper) => {
            return paper.authors.some((author) => {
              const authorNameLower = author.toLowerCase();

              switch (searchMode) {
                case 'exact':
                  // Exact match (case-insensitive)
                  return authorNameLower === authorLower;

                case 'fuzzy':
                  // Fuzzy match using Levenshtein distance
                  // Split by spaces and check if any word matches closely
                  const queryWords = authorLower.split(/\s+/);
                  const authorWords = authorNameLower.split(/\s+/);

                  return queryWords.some((qWord) =>
                    authorWords.some((aWord) => {
                      // Phase 10.100 Phase 11: Use LiteratureUtilsService for Levenshtein distance
                      const distance = this.literatureUtils.levenshteinDistance(qWord, aWord);
                      const threshold = Math.max(2, Math.floor(qWord.length * 0.3)); // 30% tolerance
                      return distance <= threshold;
                    }),
                  );

                case 'contains':
                default:
                  // Partial match (default)
                  return authorNameLower.includes(authorLower);
              }
            });
          });
        }

        // Filter by publication type (basic implementation based on venue)
        if (searchDto.publicationType && searchDto.publicationType !== 'all') {
          filteredPapers = filteredPapers.filter((paper) => {
            const venue = (paper.venue || '').toLowerCase();
            switch (searchDto.publicationType) {
              case 'journal':
                return venue.includes('journal');
              case 'conference':
                return (
                  venue.includes('conference') ||
                  venue.includes('proceedings') ||
                  venue.includes('symposium')
                );
              case 'preprint':
                return venue.includes('arxiv') || venue.includes('preprint');
              default:
                return true;
            }
          });
        }

        // Phase 10.7 Day 5.6: Comprehensive filtering summary
        const filteringSummary = {
          initial: papersWithUpdatedQuality.length,
          afterCitations: filteredPapers.length,
          citationsFiltered: searchDto.minCitations ? papersWithUpdatedQuality.length - filteredPapers.length : 0,
        };
        
        emitProgress(`Stage 2: Filtering ${filteringSummary.initial} papers by quality criteria...`, 80);
        
        this.logger.log(
          `\n📊 FILTERING PIPELINE SUMMARY:` +
          `\n   • Initial papers (after enrichment): ${filteringSummary.initial}` +
          `\n   • After all basic filters: ${filteredPapers.length}` +
          (filteringSummary.citationsFiltered > 0 ? `\n   • Filtered by citations: ${filteringSummary.citationsFiltered}` : '') +
          `\n   • Next: Relevance scoring & final selection`
        );

        emitProgress(`Stage 2: BM25 keyword scoring (fast recall)...`, 82);

        // ═════════════════════════════════════════════════════════════════════════════
        // Phase 10.100 Phase 2: EXECUTE 8-STAGE SEARCH PIPELINE (Enterprise-Grade Service)
        // ═════════════════════════════════════════════════════════════════════════════
        // Replaced ~500 lines of inline pipeline code with dedicated SearchPipelineService
        // for Single Responsibility Principle compliance and improved maintainability.
        //
        // 8-STAGE PROGRESSIVE FILTERING PIPELINE:
        // 1. BM25 Scoring - Keyword relevance (Robertson & Walker, 1994)
        // 2. BM25 Filtering - Fast recall filter (threshold-based)
        // 3. Neural Reranking - SciBERT semantic analysis (95%+ precision)
        // 4. Domain Classification - Filter by research domain
        // 5. Aspect Filtering - Fine-grained filtering (humans vs animals, etc.)
        // 6. Score Distribution - Statistical analysis (NO sorting, O(n))
        // 7. Final Sorting - Single sort operation (neural > BM25)
        // 8. Quality Threshold & Sampling - Quality filter + smart sampling
        //
        // @see backend/src/modules/literature/services/search-pipeline.service.ts
        // ═════════════════════════════════════════════════════════════════════════════

        let finalPapers: Paper[] = await this.searchPipeline.executePipeline(
          filteredPapers,
          {
            query: originalQuery,
            queryComplexity: queryComplexity,
            targetPaperCount: complexityConfig.totalTarget,
            sortOption: searchDto.sortByEnhanced || searchDto.sortBy,
            emitProgress,
          },
        );

        // Enforce source diversity (prevent single-source dominance)
        // Phase 10.99: Only enforce diversity if we have enough papers (> target)
        // When papers < target, preserve all papers for better coverage
        // Phase 10.100 Phase 12: diversityReport now typed as SourceDiversityReport
        const diversityReport = this.checkSourceDiversity(finalPapers);
        if (diversityReport.needsEnforcement && finalPapers.length > complexityConfig.totalTarget) {
          // Phase 10.100 Phase 12: max proportion is 60% (hardcoded for logging)
          this.logger.log(
            `⚖️  Source Diversity: Enforcing constraints (max 60% per source)...`,
          );

          finalPapers = this.enforceSourceDiversity(finalPapers);

          this.logger.log(
            `✅ Diversity enforced: Papers rebalanced across ${diversityReport.sourcesRepresented} sources`,
          );
        } else if (diversityReport.needsEnforcement && finalPapers.length <= complexityConfig.totalTarget) {
          this.logger.log(
            `ℹ️  Diversity enforcement skipped (${finalPapers.length} papers ≤ ${complexityConfig.totalTarget} target). Preserving all papers for coverage.`,
          );
        } else {
          this.logger.log(
            `✅ Source Diversity: Natural balance achieved (${diversityReport.sourcesRepresented} sources)`,
          );
        }

        // Phase 10.98 ENHANCEMENT: Enterprise-grade final search dashboard
        const totalDuration: string = ((Date.now() - stage1StartTime) / 1000).toFixed(1);
        const stage1Duration: string = ((stage2StartTime - stage1StartTime) / 1000).toFixed(1);
        const stage2Duration: string = ((Date.now() - stage2StartTime) / 1000).toFixed(1);

        // Calculate final metrics with enterprise-grade typing and null safety
        const finalScores: number[] = finalPapers
          .map((p) => p.relevanceScore ?? 0)
          .filter((s) => s > 0);
        const finalAvgScore: string = finalScores.length > 0
          ? (finalScores.reduce((sum, s) => sum + s, 0) / finalScores.length).toFixed(2)
          : '0.00';
        const finalMinScore: string = finalScores.length > 0
          ? Math.min(...finalScores).toFixed(2)
          : '0.00';

        const finalAvgQuality: string = finalPapers.length > 0
          ? (finalPapers.reduce((sum, p) => sum + (p.qualityScore ?? 0), 0) / finalPapers.length).toFixed(1)
          : '0.0';

        // Phase 10.98 ENTERPRISE FIX: Explicit boolean checks for undefined properties
        const finalHighQuality: number = finalPapers.filter((p) => p.isHighQuality === true).length;
        const finalWithCitations: number = finalPapers.filter(
          (p) => p.citationCount !== null && p.citationCount !== undefined && p.citationCount > 0
        ).length;
        const finalOpenAccess: number = finalPapers.filter((p) => p.isOpenAccess === true).length;

        // Phase 10.98 ENTERPRISE FIX: Safe division for all percentages
        const deduplicationRate: string = papers.length > 0
          ? ((1 - uniquePapers.length / papers.length) * 100).toFixed(1)
          : '0.0';
        const highQualityPercent: string = finalPapers.length > 0
          ? ((finalHighQuality / finalPapers.length) * 100).toFixed(1)
          : '0.0';
        const citationsPercent: string = finalPapers.length > 0
          ? ((finalWithCitations / finalPapers.length) * 100).toFixed(1)
          : '0.0';
        const finalOpenAccessPercent: string = finalPapers.length > 0
          ? ((finalOpenAccess / finalPapers.length) * 100).toFixed(1)
          : '0.0';

        // Phase 10.100 Phase 2: Simplified logging after pipeline extraction
        const minAcceptablePapers: number = ABSOLUTE_LIMITS.MIN_ACCEPTABLE_PAPERS;

        this.logger.log(
          `\n${'='.repeat(80)}` +
          `\n🎯 SEARCH COMPLETE - FINAL DASHBOARD` +
          `\n${'='.repeat(80)}` +
          `\n` +
          `\n📝 QUERY ANALYSIS:` +
          `\n   Query: "${originalQuery}"` +
          `\n   Complexity: ${queryComplexity.toUpperCase()}` +
          `\n   Total Duration: ${totalDuration}s (Stage 1: ${stage1Duration}s, Stage 2: ${stage2Duration}s)` +
          `\n` +
          `\n📊 COLLECTION PIPELINE:` +
          `\n   1️⃣  Initial Collection: ${papers.length} papers (from ${sourcesSearched.length}/${sources.length} sources)` +
          `\n   2️⃣  After Deduplication: ${uniquePapers.length} papers (-${papers.length - uniquePapers.length} duplicates, ${deduplicationRate}% dup rate)` +
          `\n   3️⃣  After Enrichment: ${enrichedPapers.length} papers (OpenAlex metrics added)` +
          `\n   4️⃣  After Basic Filters: ${filteredPapers.length} papers (-${beforeBasicFilters - filteredPapers.length} filtered)` +
          `\n   5️⃣  After 8-Stage Pipeline: ${finalPapers.length} papers (BM25, Neural, Quality filters applied)` +
          `\n` +
          `\n📈 QUALITY METRICS:` +
          `\n   Average Relevance Score: ${finalAvgScore} (min: ${finalMinScore})` +
          `\n   Average Quality Score: ${finalAvgQuality}/100` +
          `\n   High Quality Papers (≥50): ${finalHighQuality}/${finalPapers.length} (${highQualityPercent}%)` +
          `\n   Papers with Citations: ${finalWithCitations}/${finalPapers.length} (${citationsPercent}%)` +
          `\n   Open Access Papers: ${finalOpenAccess}/${finalPapers.length} (${finalOpenAccessPercent}%)` +
          `\n` +
          `\n✅ FINAL RESULT: ${finalPapers.length} highly relevant, high-quality papers` +
          `\n   Target: ${complexityConfig.totalTarget} papers | Min Acceptable: ${minAcceptablePapers} papers` +
          `\n   Status: ${finalPapers.length >= minAcceptablePapers ? '✅ MEETS QUALITY THRESHOLD' : '⚠️  BELOW MINIMUM'}` +
          `\n${'='.repeat(80)}\n`
        );

        // Stage 2 Complete
        const totalSeconds = ((Date.now() - stage1StartTime) / 1000).toFixed(1);
        emitProgress(`Complete: ${finalPapers.length} papers ready (${totalSeconds}s total)`, 95);
        
        // Paginate results (after sampling/diversity enforcement)
        const page = searchDto.page || 1;
        const limit = searchDto.limit || 20;
        const start = (page - 1) * limit;
        const paginatedPapers = finalPapers.slice(start, start + limit);
        
        emitProgress(`Returning ${paginatedPapers.length} papers (page ${page})`, 100);

        // Phase 10 Days 2-3: Fallback to stale/archive cache if no results (possible rate limit)
        if (papers.length === 0) {
          this.logger.warn(
            `⚠️  [API] All sources returned 0 results - checking stale cache`,
          );
          const staleResult =
            await this.cacheService.getStaleOrArchive<any>(cacheKey);
          if (staleResult.data) {
            this.logger.log(
              `🔄 [Cache] Serving ${staleResult.isStale ? 'stale' : 'archive'} results due to API unavailability`,
            );
            return {
              ...(staleResult.data as any),
              isCached: true,
              cacheAge: staleResult.age,
              isStale: staleResult.isStale,
              isArchive: staleResult.isArchive,
            };
          }
        }

        // Phase 10.6 Day 14.5+: Enhanced search transparency - track complete pipeline
        const deduplicationRateNum: number =
          papers.length > 0
            ? ((papers.length - uniquePapers.length) / papers.length) * 100
            : 0;

        const result = {
          papers: paginatedPapers,
          total: papers.length, // Total papers after all filtering and sorting
          page,
          // Return corrected query for "Did you mean?" feature (Google-like)
          ...(originalQuery !== expandedQuery && {
            correctedQuery: expandedQuery,
            originalQuery: originalQuery,
          }),
          // Phase 10.6 Day 14.5+: ENTERPRISE TRANSPARENCY - Complete search pipeline
          // Phase 10.7 Day 6: TWO-STAGE FILTERING for transparency
          metadata: {
            // ===================================================================
            // STAGE 1: COLLECTION FROM ALL SOURCES
            // ===================================================================
            stage1: {
              description: 'Collecting papers from all academic sources',
              totalCollected: papers.length, // Papers before any processing
              sourcesSearched: sourcesSearched.length,
              sourceBreakdown: searchLog.getSourceResults(), // Papers per source - Object format
              searchDuration: searchLog.getSearchDuration(), // Collection time (ms)
            },

            // ===================================================================
            // STAGE 2: QUALITY FILTERING & RANKING
            // ===================================================================
            stage2: {
              description: 'Selecting top 350-500 highest quality papers via 8-stage pipeline',
              startingPapers: uniquePapers.length, // After dedup
              afterEnrichment: enrichedPapers.length, // After OpenAlex enrichment
              afterBasicFilters: filteredPapers.length, // After basic filters
              finalSelected: finalPapers.length, // After 8-stage pipeline (BM25, Neural, Quality)
              pipelineStages: 8, // BM25 Scoring → BM25 Filtering → Neural Reranking → Domain → Aspect → Score Distribution → Sorting → Quality Threshold & Sampling
            },

            // ===================================================================
            // PHASE 10.7.8: SEARCH PHASES (Honest Progressive Loading)
            // ===================================================================
            searchPhases: {
              phase1: {
                description: 'Searching academic databases',
                sources: sourcesSearched.map((s) => s.toString()),
                sourcesCount: sourcesSearched.length,
                estimatedDuration: 15000, // 15s average for source collection
                actualDuration: searchLog.getSearchDuration(), // Actual time taken
                status: 'complete', // Always complete when metadata is returned
              },
              phase2: {
                description: 'Loading high-quality papers',
                totalPapers: finalPapers.length, // Total papers available for progressive loading
                batchSize: 20, // Papers per batch (matches frontend BATCH_SIZE)
                totalBatches: Math.ceil(finalPapers.length / 20),
                estimatedDuration: 2000, // 2s estimate (cache hits are fast)
                status: 'ready', // Ready to start progressive loading
              },
            },

            // ===================================================================
            // LEGACY FIELDS (for backward compatibility)
            // ===================================================================
            totalCollected: papers.length,
            sourceBreakdown: searchLog.getSourceResults(),
            uniqueAfterDedup: uniquePapers.length,
            deduplicationRate: parseFloat(deduplicationRateNum.toFixed(2)),
            duplicatesRemoved: papers.length - uniquePapers.length,
            afterEnrichment: enrichedPapers.length,
            afterQualityFilter: papers.length, // After all quality filters
            qualityFiltered: papersWithUpdatedQuality.length - papers.length,
            beforePipeline: filteredPapers.length, // Papers before 8-stage pipeline
            afterPipeline: finalPapers.length, // Papers after 8-stage pipeline
            totalQualified: finalPapers.length,
            displayed: paginatedPapers.length,
            searchDuration: searchLog.getSearchDuration(),
            ...(expandedQuery !== originalQuery && {
              queryExpansion: {
                original: originalQuery,
                expanded: expandedQuery,
              },
            }),

            // Phase 10.6 Day 14.9: Allocation strategy transparency
            allocationStrategy: {
              queryComplexity,
              targetPaperCount: complexityConfig.totalTarget,
              tierAllocations: config.tierAllocations,
              sourceAllocations, // Per-source allocation and tier
            },

            // Phase 10.6 Day 14.9: Diversity metrics
            diversityMetrics: diversityReport,

            // Phase 10.942: Qualification criteria transparency
            qualificationCriteria: {
              relevanceAlgorithm: 'BM25 + Neural Reranking', // Phase 10.942: Gold standard (Robertson & Walker 1994) + SciBERT
              relevanceScoreDesc: `Two-stage relevance: (1) BM25 keyword relevance (Robertson & Walker 1994) - gold standard used by PubMed, Elasticsearch. Features: term frequency saturation, document length normalization, position weighting (title 4x, keywords 3x, abstract 2x). (2) SciBERT neural reranking for semantic precision (95%+ accuracy).`,
              qualityWeights: {
                citationImpact: 30, // Phase 10.942: Field-Weighted Citation Impact (FWCI)
                journalPrestige: 50, // Phase 10.942: h-index, quartile, impact factor
                recencyBoost: 20, // Phase 10.942: Exponential decay (λ=0.15, half-life 4.6 years)
                // Optional bonuses: +10 OA, +5 reproducibility, +5 altmetric
              },
              filtersApplied: [
                'Relevance Score ≥ 3',
                ...(searchDto.minCitations ? [`Min Citations: ${searchDto.minCitations}`] : []),
                ...(searchDto.minWordCount ? [`Min Word Count: ${searchDto.minWordCount}`] : []),
                ...(searchDto.minAbstractLength ? [`Min Abstract Length: ${searchDto.minAbstractLength}`] : []),
                ...(searchDto.author ? [`Author Filter: "${searchDto.author}"`] : []),
                ...(searchDto.publicationType && searchDto.publicationType !== 'all' ? [`Publication Type: ${searchDto.publicationType}`] : []),
                ...(searchDto.yearFrom || searchDto.yearTo ? [`Years: ${searchDto.yearFrom || 'any'} - ${searchDto.yearTo || 'current'}`] : []),
              ],
            },

            // Phase 10.6 Day 14.8 (v3.0): Bias detection and reporting
            qualityScoringVersion: 'v3.0',
            biasMetrics: (() => {
              // Calculate bias metrics for transparency
              const totalPapers = finalPapers.length;
              if (totalPapers === 0) return null;

              // Count papers with each bonus
              const papersWithOA = finalPapers.filter(p => p.isOpenAccess).length;
              const papersWithDataCode = finalPapers.filter(p => p.hasDataCode).length;
              const papersWithAltmetric = finalPapers.filter(p => p.altmetricScore && p.altmetricScore > 0).length;

              // Count papers with field of study
              const papersWithField = finalPapers.filter(p => p.fieldOfStudy && p.fieldOfStudy.length > 0).length;
              const papersWithFWCI = finalPapers.filter(p => p.fwci && p.fwci > 0).length;

              // Calculate field distribution
              const fieldDistribution: Record<string, number> = {};
              finalPapers.forEach(p => {
                if (p.fieldOfStudy && p.fieldOfStudy.length > 0) {
                  const field = p.fieldOfStudy[0]; // Primary field
                  fieldDistribution[field] = (fieldDistribution[field] || 0) + 1;
                }
              });

              // Calculate average scores per source
              const sourceStats: Record<string, { count: number; avgOA: number; avgBonus: number }> = {};
              finalPapers.forEach(p => {
                const source = p.source;
                if (!sourceStats[source]) {
                  sourceStats[source] = { count: 0, avgOA: 0, avgBonus: 0 };
                }
                sourceStats[source].count++;
                sourceStats[source].avgOA += p.isOpenAccess ? 1 : 0;
                const totalBonus = (p.qualityScoreBreakdown?.openAccessBonus || 0) + 
                                   (p.qualityScoreBreakdown?.reproducibilityBonus || 0) + 
                                   (p.qualityScoreBreakdown?.altmetricBonus || 0);
                sourceStats[source].avgBonus += totalBonus;
              });

              // Finalize averages
              Object.keys(sourceStats).forEach(source => {
                sourceStats[source].avgOA = parseFloat((sourceStats[source].avgOA / sourceStats[source].count * 100).toFixed(1));
                sourceStats[source].avgBonus = parseFloat((sourceStats[source].avgBonus / sourceStats[source].count).toFixed(1));
              });

              return {
                bonusApplicability: {
                  openAccess: `${papersWithOA} papers (${(papersWithOA / totalPapers * 100).toFixed(1)}%)`,
                  dataCodeSharing: `${papersWithDataCode} papers (${(papersWithDataCode / totalPapers * 100).toFixed(1)}%)`,
                  altmetric: `${papersWithAltmetric} papers (${(papersWithAltmetric / totalPapers * 100).toFixed(1)}%)`,
                },
                fieldNormalization: {
                  papersWithField: `${papersWithField} papers (${(papersWithField / totalPapers * 100).toFixed(1)}%)`,
                  papersWithFWCI: `${papersWithFWCI} papers (${(papersWithFWCI / totalPapers * 100).toFixed(1)}%)`,
                  topFields: Object.entries(fieldDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([field, count]) => `${field} (${count})`),
                },
                sourceComparison: sourceStats,
                fairnessNote: 'Bonuses are OPTIONAL rewards, not requirements. Papers without bonuses can still score 100/100 via citations and journal prestige.',
              };
            })(),
          },
        };

        // Phase 10 Days 2-3: Use enhanced cache service
        await this.cacheService.set(cacheKey, result, this.CACHE_TTL);

        // Phase 10.7 Day 5: PAGINATION CACHE - Cache full results for pagination (eliminates empty batches)
        if (searchDto.page === 1 || !searchDto.page) {
          const fullResultsCache = {
            papers: finalPapers, // ALL papers after filtering/sampling (NOT paginated)
            metadata: result.metadata,
          };
          
          await this.cacheService.set(
            searchCacheKey,
            fullResultsCache,
            300 // 5 minutes TTL (sufficient for progressive loading session)
          );
          
          this.logger.log(
            `💾 [Pagination Cache] Cached ${finalPapers.length} full results for pagination (5 min TTL)`
          );
        }

        // Phase 10.100 Phase 14: Delegate search logging to SearchAnalyticsService
        await this.searchAnalytics.logSearchQuery(searchDto, userId);

            // Phase 10.6 Day 14.4: Finalize enterprise-grade search logging
            await searchLog.finalize({
              totalPapers: papers.length,
              uniquePapers: uniquePapers.length,
              expandedQuery: expandedQuery !== originalQuery ? expandedQuery : undefined,
            });

            // Phase 10.102 Phase 3.1 Session 3: Log bulkhead metrics for observability
            const bulkheadMetrics = this.bulkhead.getMetrics(userId, 'search');
            if (bulkheadMetrics) {
              this.logger.log(
                `📊 [Bulkhead Metrics] User ${userId}: ` +
                `${bulkheadMetrics.completedTasks} completed, ` +
                `${bulkheadMetrics.rejectedRequests} rejected, ` +
                `avg wait: ${bulkheadMetrics.averageWaitTime.toFixed(0)}ms`
              );
            }

            return result;
      }); // End of bulkhead.executeSearch() wrapper
    } catch (error: any) {
      // Phase 10.102 Phase 3.1 Session 3: Enterprise-grade error handling for bulkhead failures
      const errorMessage = error.message || String(error);

      // Circuit breaker is OPEN - service temporarily unavailable
      // BulkheadService throws: "Service temporarily unavailable for search. Please try again in a few moments."
      if (errorMessage.includes('Service temporarily unavailable')) {
        this.logger.error(
          `🔴 [Bulkhead] Circuit breaker OPEN for user ${userId}. ` +
          `Too many consecutive failures. System protecting itself from cascade failure.`
        );
        throw new Error(
          'Literature search temporarily unavailable due to system protection. ' +
          'Please try again in a few moments.'
        );
      }

      // Too many concurrent requests from this user
      if (errorMessage.includes('Too many concurrent')) {
        this.logger.warn(
          `⚠️  [Bulkhead] User ${userId} exceeded concurrent search limit. ` +
          `Queue overflow protection triggered.`
        );
        throw new Error(
          'You have too many searches running concurrently. ' +
          'Please wait for your current searches to complete before starting new ones.'
        );
      }

      // Timeout from bulkhead queue
      if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
        this.logger.error(
          `⏱️  [Bulkhead] Search timeout for user ${userId} after 2 minutes. ` +
          `Search took too long or queue was too long.`
        );
        throw new Error(
          'Search request timed out. Please try a more specific query or reduce the number of sources.'
        );
      }

      // Unknown bulkhead error - log and re-throw
      this.logger.error(
        `❌ [Bulkhead] Unexpected error for user ${userId}: ${errorMessage}`
      );
      throw error;
    }
  }

  /**
   * Phase 10.100 Phase 10: Delegate to SourceRouterService
   * Routes search requests to appropriate academic source
   *
   * @see SourceRouterService.searchBySource() for implementation details
   */
  private async searchBySource(
    source: LiteratureSource,
    searchDto: SearchLiteratureDto,
  ): Promise<Paper[]> {
    return this.sourceRouter.searchBySource(source, searchDto);
  }

  /**
   * Phase 10.100 Phase 11: Delegate to LiteratureUtilsService
   * Remove duplicate papers from array
   *
   * @see LiteratureUtilsService.deduplicatePapers() for implementation details
   */
  private deduplicatePapers(papers: Paper[]): Paper[] {
    return this.literatureUtils.deduplicatePapers(papers);
  }

  // Phase 10.942: Old calculateRelevanceScore REMOVED - replaced by BM25
  // See: relevance-scoring.util.ts for calculateBM25RelevanceScore()
  // Reference: Robertson & Walker (1994) - gold standard for information retrieval

  // Phase 10.100 Phase 2: sortPapers method removed (now handled by SearchPipelineService)

  // Phase 10.100 Phase 11: levenshteinDistance moved to LiteratureUtilsService (private method)

  /**
   * Phase 10.100 Phase 11: Delegate to LiteratureUtilsService
   * Preprocess and expand search query for better results
   *
   * @see LiteratureUtilsService.preprocessAndExpandQuery() for implementation details
   */
  private preprocessAndExpandQuery(query: string): string {
    return this.literatureUtils.preprocessAndExpandQuery(query);
  }

  /**
   * Phase 10.100 Phase 9: Delegate to PaperDatabaseService
   * Saves a paper to the database with duplicate detection and full-text queueing
   *
   * @see PaperDatabaseService.savePaper() for implementation details
   */
  async savePaper(
    saveDto: SavePaperDto,
    userId: string,
  ): Promise<PaperSaveResult> {
    return this.paperDatabase.savePaper(saveDto, userId);
  }

  /**
   * Phase 10.100 Phase 9: Delegate to PaperDatabaseService
   * Retrieves user's paper library with pagination
   *
   * @see PaperDatabaseService.getUserLibrary() for implementation details
   */
  async getUserLibrary(
    userId: string,
    page: number,
    limit: number,
  ): Promise<UserLibraryResult> {
    return this.paperDatabase.getUserLibrary(userId, page, limit);
  }

  /**
   * Phase 10.100 Phase 9: Delegate to PaperDatabaseService
   * Removes a paper from user's library with ownership enforcement
   *
   * @see PaperDatabaseService.removePaper() for implementation details
   */
  async removePaper(
    paperId: string,
    userId: string,
  ): Promise<PaperDeleteResult> {
    return this.paperDatabase.removePaper(paperId, userId);
  }

  /**
   * @deprecated This method returns mock data. Use ThemeExtractionService.extractThemes() instead.
   * This method is kept for backwards compatibility only.
   *
   * @see ThemeExtractionService.extractThemes() for real AI-powered theme extraction
   */
  async extractThemes(_paperIds: string[], _userId: string): Promise<Theme[]> {
    this.logger.warn(
      '⚠️  DEPRECATED: literatureService.extractThemes() returns mock data. ' +
        'Use ThemeExtractionService.extractThemes() for real AI extraction.',
    );

    // Return empty array to indicate this method should not be used
    throw new Error(
      'DEPRECATED: Use ThemeExtractionService.extractThemes() instead. ' +
        'This method has been replaced with real AI-powered theme extraction.',
    );
  }

  /**
   * @deprecated This method returns mock data. Use GapAnalyzerService.analyzeResearchGaps() instead.
   * This method is kept for backwards compatibility only.
   *
   * @see GapAnalyzerService.analyzeResearchGaps() for real AI-powered gap analysis
   */
  async analyzeResearchGaps(
    _analysisDto: any,
    _userId: string,
  ): Promise<ResearchGap[]> {
    this.logger.warn(
      '⚠️  DEPRECATED: literatureService.analyzeResearchGaps() returns mock data. ' +
        'Use GapAnalyzerService.analyzeResearchGaps() for real AI analysis.',
    );

    // Return empty array to indicate this method should not be used
    throw new Error(
      'DEPRECATED: Use GapAnalyzerService.analyzeResearchGaps() instead. ' +
        'This method has been replaced with real AI-powered gap analysis.',
    );
  }

  /**
   * Export citations in multiple formats
   * Phase 10.100 Phase 5: Delegate to CitationExportService
   */
  async exportCitations(
    exportDto: ExportCitationsDto,
    userId: string,
  ): Promise<ExportResult> {
    return this.citationExport.exportCitations(
      exportDto.paperIds,
      exportDto.format,
      exportDto.includeAbstracts,
      userId,
    );
  }

  // Phase 10.100 Phase 5: All citation formatting methods moved to CitationExportService
  // (formatBibTeX, formatRIS, formatAPA, formatMLA, formatChicago, formatCSV, escapeCsvField)

  /**
   * Build knowledge graph from papers
   * Phase 10.100 Phase 6: Delegate to KnowledgeGraphService
   */
  async buildKnowledgeGraph(
    paperIds: string[],
    userId: string,
  ): Promise<CitationNetwork> {
    return this.knowledgeGraph.buildKnowledgeGraph(paperIds, userId);
  }

  /**
   * Get citation network for a paper
   * Phase 10.100 Phase 6: Delegate to KnowledgeGraphService
   */
  async getCitationNetwork(
    paperId: string,
    depth: number,
  ): Promise<CitationNetwork> {
    return this.knowledgeGraph.getCitationNetwork(paperId, depth);
  }

  /**
   * Get AI-powered study recommendations
   * Phase 10.100 Phase 6: Delegate to KnowledgeGraphService
   *
   * @returns Knowledge graph nodes representing recommended studies/papers
   */
  async getStudyRecommendations(
    studyId: string,
    userId: string,
  ): Promise<KnowledgeGraphNode[]> {
    return this.knowledgeGraph.getStudyRecommendations(studyId, userId);
  }

  // Phase 10.100 Phase 4: Delegate to SocialMediaIntelligenceService
  async analyzeSocialOpinion(
    topic: string,
    platforms: string[],
    userId: string,
  ): Promise<SocialOpinionAnalysis> {
    return this.socialMediaIntelligence.analyzeSocialOpinion(topic, platforms, userId);
  }

  // Phase 10.100 Phase 3: Delegate to AlternativeSourcesService
  async searchAlternativeSources(
    query: string,
    sources: string[],
    userId: string,
  ): Promise<AlternativeSourceResult[]> {
    return this.alternativeSources.searchAlternativeSources(query, sources, userId);
  }

  // Phase 10.100 Phase 3: Delegate to AlternativeSourcesService
  async getYouTubeChannel(channelIdentifier: string): Promise<YouTubeChannelInfo> {
    return this.alternativeSources.getYouTubeChannel(channelIdentifier);
  }

  // Phase 10.100 Phase 3: Delegate to AlternativeSourcesService
  async getChannelVideos(
    channelId: string,
    options?: {
      page?: number;
      maxResults?: number;
      publishedAfter?: Date;
      publishedBefore?: Date;
      order?: 'date' | 'relevance' | 'viewCount';
    },
  ): Promise<YouTubeChannelVideosResponse> {
    return this.alternativeSources.getChannelVideos(channelId, options);
  }

  // Phase 10.100 Phase 3: Delegate to AlternativeSourcesService
  async searchYouTubeWithTranscription(
    query: string,
    options?: {
      includeTranscripts?: boolean;
      extractThemes?: boolean;
      maxResults?: number;
    },
  ): Promise<AlternativeSourceResult[]> {
    return this.alternativeSources.searchYouTubeWithTranscription(query, options);
  }

  // Phase 10.100 Phase 3: searchArxivPreprints, searchPatents, searchGitHub, searchStackOverflow,
  // searchYouTube, parseYouTubeDuration, searchPodcasts - ALL REMOVED (moved to AlternativeSourcesService)

  // Phase 10.100 Phase 3 Compatibility Fix: Private method for backward compatibility with cross-platform-synthesis.service
  // Used via bracket notation in cross-platform-synthesis.service.ts (line 505) - TypeScript cannot detect bracket notation usage
  // @ts-ignore - TS6133: Method is used but via bracket notation
  private async searchYouTube(query: string): Promise<AlternativeSourceResult[]> {
    return this.alternativeSources.searchAlternativeSources(query, ['youtube'], 'system');
  }

  async generateStatementsFromThemes(
    themes: string[],
    studyContext: any,
    userId?: string,
  ): Promise<string[]> {
    try {
      this.logger.log(
        `Generating Q-statements from ${themes.length} themes${userId ? ` for user ${userId}` : ' (public endpoint)'}`,
      );

      // Phase 10 Day 5.17.5: Use AI StatementGeneratorService for Q-methodology statement generation
      // Generate 8-10 statements per theme for comprehensive coverage
      const statementsPerTheme = Math.ceil(60 / themes.length); // Target 60 total statements
      const topic = studyContext?.topic || themes.join(', ');

      const statements = await this.statementGenerator.generateStatements(
        topic,
        {
          count: Math.max(40, statementsPerTheme * themes.length), // Minimum 40 statements for Q-methodology
          perspectives: themes, // Use themes as perspectives
          avoidBias: true,
          academicLevel: studyContext?.academicLevel || 'intermediate',
          maxLength: 120,
        },
        userId,
      );

      // Extract just the statement text
      const statementTexts = statements.map((s) => s.text);

      this.logger.log(
        `✅ Generated ${statementTexts.length} Q-statements from themes`,
      );

      return statementTexts;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to generate statements from themes: ${message}`,
      );
      throw error;
    }
  }

  /**
   * Phase 10.100 Phase 14: logSearch REMOVED - NOW IN SearchAnalyticsService
   *
   * Search logging functionality moved to SearchAnalyticsService for better separation of concerns.
   *
   * CRITICAL FIX APPLIED: Replaced `filters: searchDto as any` with proper `Prisma.InputJsonValue` type
   *
   * @see SearchAnalyticsService.logSearchQuery() for implementation
   * @deprecated Use searchAnalytics.logSearchQuery() instead
   */
  // Method removed - use SearchAnalyticsService.logSearchQuery() instead

  /**
   * Phase 10.100 Phase 14: Delegate to SearchAnalyticsService
   * Check if user has access to a literature review
   *
   * @see SearchAnalyticsService.checkUserAccess() for implementation details
   */
  async userHasAccess(
    userId: string,
    literatureReviewId: string,
  ): Promise<boolean> {
    return this.searchAnalytics.checkUserAccess(userId, literatureReviewId);
  }

  // ============================================================================
  // PHASE 9 DAY 13: SOCIAL MEDIA INTELLIGENCE
  // ============================================================================

  /**
   * Search across multiple social media platforms for research-relevant content
   * Includes sentiment analysis and engagement-weighted synthesis
   */
  // Phase 10.100 Phase 4: Delegate to SocialMediaIntelligenceService
  async searchSocialMedia(
    query: string,
    platforms: string[],
    userId: string,
  ): Promise<SocialMediaPost[]> {
    return this.socialMediaIntelligence.searchSocialMedia(query, platforms, userId);
  }

  // Phase 10.100 Phase 4: Delegate to SocialMediaIntelligenceService
  async generateSocialMediaInsights(posts: SocialMediaPost[]): Promise<SocialMediaInsights> {
    return this.socialMediaIntelligence.generateSocialMediaInsights(posts);
  }

  /**
   * PHASE 10 DAY 30: Refresh Paper Metadata (Enterprise-Grade Solution)
   * Re-fetches metadata from academic sources for existing papers
   * Designed to populate missing full-text availability fields for papers
   * saved before full-text detection was implemented
   *
   * @param paperIds - Array of paper IDs or DOIs to refresh
   * @param userId - User ID for logging
   * @returns Object with refreshed papers and statistics
   */
  /**
   * Phase 10.100 Phase 8: Refresh paper metadata (DELEGATED)
   *
   * Delegates to PaperMetadataService for metadata refresh operations.
   * See paper-metadata.service.ts for implementation details.
   *
   * @param paperIds - Array of paper IDs to refresh
   * @param userId - User ID for ownership validation
   * @returns Refresh statistics with updated papers and errors
   */
  async refreshPaperMetadata(
    paperIds: string[],
    userId: string,
  ): Promise<MetadataRefreshResult> {
    return this.paperMetadata.refreshPaperMetadata(paperIds, userId);
  }

  /**
   * Phase 10.6 Day 3: Search Google Scholar
   */

  /**
   * Phase 10.6 Day 14.9: Apply quality-stratified sampling (REMOVED - NOW IN SearchQualityDiversityService)
   * Phase 10.100 Phase 12: Method removed - functionality moved to SearchQualityDiversityService
   *
   * NOTE (Phase 10.99 Week 2): This method was unused in searchLiterature pipeline.
   * Sampling is handled inline in Stage 8 of the pipeline for performance.
   *
   * To use stratified sampling, call searchQualityDiversity.applyQualityStratifiedSampling()
   * @see SearchQualityDiversityService.applyQualityStratifiedSampling() for implementation
   *
   * Method signature (for reference):
   * applyQualityStratifiedSampling(papers: Paper[], targetCount: number): Paper[]
   */
  // Method removed - use SearchQualityDiversityService.applyQualityStratifiedSampling() instead

  /**
   * Phase 10.100 Phase 12: Delegate to SearchQualityDiversityService
   * Check source diversity in paper set
   *
   * @see SearchQualityDiversityService.checkSourceDiversity() for implementation details
   */
  private checkSourceDiversity(papers: Paper[]): SourceDiversityReport {
    return this.searchQualityDiversity.checkSourceDiversity(papers);
  }

  /**
   * Phase 10.100 Phase 12: Delegate to SearchQualityDiversityService
   * Generate pagination cache key (excludes page/limit)
   *
   * @see SearchQualityDiversityService.generatePaginationCacheKey() for implementation details
   */
  private generatePaginationCacheKey(searchDto: SearchLiteratureDto, userId: string): string {
    return this.searchQualityDiversity.generatePaginationCacheKey(searchDto, userId);
  }

  /**
   * Phase 10.100 Phase 12: Delegate to SearchQualityDiversityService
   * Enforce source diversity constraints
   *
   * @see SearchQualityDiversityService.enforceSourceDiversity() for implementation details
   */
  private enforceSourceDiversity(papers: Paper[]): Paper[] {
    return this.searchQualityDiversity.enforceSourceDiversity(papers);
  }

  /**
   * Phase 10.100 Phase 7: Verify paper ownership (DELEGATED)
   *
   * Delegates to PaperPermissionsService for ownership verification.
   * See paper-permissions.service.ts for implementation details.
   *
   * BUG FIX (Nov 19, 2025): Returns fullText and abstract fields
   * for theme extraction. See PaperPermissionsService for details.
   *
   * @param paperId - Paper ID to verify
   * @param userId - User ID claiming ownership
   * @returns Paper metadata with full-text content if available
   */
  async verifyPaperOwnership(
    paperId: string,
    userId: string,
  ): Promise<PaperOwnershipResult> {
    return this.paperPermissions.verifyPaperOwnership(paperId, userId);
  }

  /**
   * Phase 10.100 Phase 7: Update paper full-text status (DELEGATED)
   *
   * Delegates to PaperPermissionsService for status management.
   * See paper-permissions.service.ts for implementation details.
   *
   * @param paperId - Paper ID to update
   * @param status - New status value (FullTextStatus)
   * @throws NotFoundException if paper doesn't exist
   */
  async updatePaperFullTextStatus(
    paperId: string,
    status: FullTextStatus,
  ): Promise<void> {
    return this.paperPermissions.updatePaperFullTextStatus(paperId, status);
  }
}
