import { Module, OnModuleInit } from '@nestjs/common';
import { LiteratureController } from './literature.controller';
import { LiteratureService } from './literature.service';
import { ReferenceService } from './services/reference.service';
import { ThemeExtractionService } from './services/theme-extraction.service';
import { GapAnalyzerService } from './services/gap-analyzer.service';
import { ThemeToStatementService } from './services/theme-to-statement.service';
import { KnowledgeGraphService } from './services/knowledge-graph.service';
import { PredictiveGapService } from './services/predictive-gap.service';
import { TranscriptionService } from './services/transcription.service';
import { MultiMediaAnalysisService } from './services/multimedia-analysis.service';
import { TikTokResearchService } from './services/tiktok-research.service';
import { InstagramManualService } from './services/instagram-manual.service';
import { CrossPlatformSynthesisService } from './services/cross-platform-synthesis.service';
import { UnifiedThemeExtractionService } from './services/unified-theme-extraction.service';
import { SearchCoalescerService } from './services/search-coalescer.service';
import { APIQuotaMonitorService } from './services/api-quota-monitor.service';
import { ThemeToSurveyItemService } from './services/theme-to-survey-item.service';
import { EnhancedThemeIntegrationService } from './services/enhanced-theme-integration.service';
import { PDFParsingService } from './services/pdf-parsing.service';
import { PDFQueueService } from './services/pdf-queue.service';
import { LiteratureCacheService } from './services/literature-cache.service';
import { PaperQualityScoringService } from './services/paper-quality-scoring.service';
import { GuidedBatchSelectorService } from './services/guided-batch-selector.service';
import { HtmlFullTextService } from './services/html-full-text.service';
import { OpenAlexEnrichmentService } from './services/openalex-enrichment.service';
// Phase 10.6 Day 3: Additional academic source integrations (bioRxiv/ChemRxiv removed <500k papers)
import { GoogleScholarService } from './services/google-scholar.service';
import { SSRNService } from './services/ssrn.service';
// Phase 10.6 Day 3.5: Extracted old sources to dedicated services (refactoring)
import { SemanticScholarService } from './services/semantic-scholar.service';
import { CrossRefService } from './services/crossref.service';
import { PubMedService } from './services/pubmed.service';
import { ArxivService } from './services/arxiv.service';
// Phase 10.6 Day 4: PubMed Central (PMC) - Full-text articles
import { PMCService } from './services/pmc.service';
// Phase 10.6 Day 5: ERIC - Education research database
import { ERICService } from './services/eric.service';
// Phase 10.7.10: CORE - Open access aggregator
import { CoreService } from './services/core.service';
// Phase 10.106 Phase 1: OpenAlex - Comprehensive open database (250M+ works)
import { OpenAlexService } from './services/openalex.service';
// Phase 10.6 Day 6: Web of Science - Premium academic database
import { WebOfScienceService } from './services/web-of-science.service';
// Phase 10.6 Day 7: Scopus - Premium Elsevier database
import { ScopusService } from './services/scopus.service';
// Phase 10.6 Day 8: IEEE Xplore - Engineering and computer science database
import { IEEEService } from './services/ieee.service';
// Phase 10.6 Day 9: SpringerLink - Multidisciplinary STM publisher
import { SpringerService } from './services/springer.service';
// Phase 10.6 Day 10: Nature - High-impact multidisciplinary journal
import { NatureService } from './services/nature.service';
// Phase 10.6 Day 11: Wiley Online Library - 6M+ articles, engineering/medicine
import { WileyService } from './services/wiley.service';
// Phase 10.6 Day 12: SAGE Publications - 1000+ journals, social sciences
import { SageService } from './services/sage.service';
// Phase 10.6 Day 13: Taylor & Francis - 2700+ journals, humanities
import { TaylorFrancisService } from './services/taylor-francis.service';
// Phase 10.6 Day 14.4: Enterprise-grade search logging
import { SearchLoggerService } from './services/search-logger.service';
// Phase 10.94 Day 1-2: Identifier Enrichment Service
import { IdentifierEnrichmentService } from './services/identifier-enrichment.service';
// Phase 10.94 Day 4-5: GROBID PDF Extraction Service
import { GrobidExtractionService } from './services/grobid-extraction.service';
// Phase 10.97: Enterprise-Grade Parallel Extraction Orchestrator
import { ParallelExtractionOrchestratorService } from './services/parallel-extraction-orchestrator.service';
// Phase 10.98: FREE Local Embeddings (replaces expensive OpenAI embeddings)
import { LocalEmbeddingService } from './services/local-embedding.service';
// Phase 10.101 Task 3 - Phase 2: Embedding Orchestrator (extracted from UnifiedThemeExtractionService)
import { EmbeddingOrchestratorService } from './services/embedding-orchestrator.service';
// Phase 10.101 Task 3 - Phase 3: Progress Tracking Service (extracted from UnifiedThemeExtractionService)
import { ThemeExtractionProgressService } from './services/theme-extraction-progress.service';
// Phase 10.101 Task 3 - Phase 4: Source Content Fetcher (extracted from UnifiedThemeExtractionService)
import { SourceContentFetcherService } from './services/source-content-fetcher.service';
// Phase 10.101 Task 3 - Phase 5: Theme Deduplication (extracted from UnifiedThemeExtractionService)
import { ThemeDeduplicationService } from './services/theme-deduplication.service';
// Phase 10.101 Task 3 - Phase 6: Batch Extraction Orchestrator (extracted from UnifiedThemeExtractionService)
import { BatchExtractionOrchestratorService } from './services/batch-extraction-orchestrator.service';
// Phase 10.101 Task 3 - Phase 7: Theme Provenance Service (extracted from UnifiedThemeExtractionService)
import { ThemeProvenanceService } from './services/theme-provenance.service';
// Phase 10.101 Task 3 - Phase 8: API Rate Limiter Service (extracted from UnifiedThemeExtractionService)
import { ApiRateLimiterService } from './services/api-rate-limiter.service';
// Phase 10.101 Task 3 - Phase 8.6: Metrics Service (Prometheus-compatible)
import { MetricsService } from '../../common/services/metrics.service';
// Phase 10.98 Day 1-6: Purpose-Specific Theme Extraction Algorithms
import { MathematicalUtilitiesService } from './services/mathematical-utilities.service';
import { KMeansClusteringService } from './services/kmeans-clustering.service';
import { QMethodologyPipelineService } from './services/q-methodology-pipeline.service';
import { SurveyConstructionPipelineService } from './services/survey-construction-pipeline.service';
import { QualitativeAnalysisPipelineService } from './services/qualitative-analysis-pipeline.service';
import { ExcerptEmbeddingCacheService } from './services/excerpt-embedding-cache.service';
// Phase 10.98 FIX: Local code extraction and theme labeling (NO AI, $0.00 cost)
import { LocalCodeExtractionService } from './services/local-code-extraction.service';
import { LocalThemeLabelingService } from './services/local-theme-labeling.service';
// Phase 8.90 Priority 3: FAISS High-Performance Deduplication (100x faster)
import { FAISSDeduplicationService } from './services/faiss-deduplication.service';
// Phase 10.99: Neural Relevance Filtering (SciBERT-powered semantic precision)
import { NeuralRelevanceService } from './services/neural-relevance.service';
// Phase 10.99 Week 2: Performance Monitoring Infrastructure (Enterprise-Grade)
// import { PerformanceMonitorService } from './services/performance-monitor.service'; // Not injectable - removed
// Phase 10.100 Phase 2: Search Pipeline Orchestration Service (8-stage progressive filtering)
import { SearchPipelineService } from './services/search-pipeline.service';
// Phase 10.100 Phase 3: Alternative Sources Service (arxiv, patents, github, stackoverflow, youtube, podcasts)
import { AlternativeSourcesService } from './services/alternative-sources.service';
// Phase 10.100 Phase 4: Social Media Intelligence Service (Twitter, Reddit, LinkedIn, Facebook, Instagram, TikTok)
import { SocialMediaIntelligenceService } from './services/social-media-intelligence.service';
// Phase 10.100 Phase 5: Citation Export Service (BibTeX, RIS, APA, MLA, Chicago, CSV, JSON)
import { CitationExportService } from './services/citation-export.service';
// Phase 10.100 Phase 7: Paper Permissions Service (ownership verification, full-text status management)
import { PaperPermissionsService } from './services/paper-permissions.service';
// Phase 10.100 Phase 8: Paper Metadata Service (metadata refresh, semantic scholar mapping, title matching)
import { PaperMetadataService } from './services/paper-metadata.service';
// Phase 10.100 Phase 9: Paper Database Service (paper CRUD operations, library management, ownership enforcement)
import { PaperDatabaseService } from './services/paper-database.service';
// Phase 10.101 Task 3 - Phase 9: Theme Database Service (theme database mapping, storage, retrieval)
import { ThemeDatabaseService } from './services/theme-database.service';
// Phase 10.100 Phase 10: Source Router Service (academic source routing, quota management, error handling)
import { SourceRouterService } from './services/source-router.service';
// Phase 10.100 Phase 11: Literature Utilities Service (deduplication, query preprocessing, string algorithms)
import { LiteratureUtilsService } from './services/literature-utils.service';
// Phase 10.100 Phase 12: Search Quality and Diversity Service (quality sampling, source diversity, pagination caching)
import { SearchQualityDiversityService } from './services/search-quality-diversity.service';
// Phase 10.100 Phase 13: HTTP Client Configuration Service (timeout management, request monitoring)
import { HttpClientConfigService } from './services/http-client-config.service';
// Phase 10.100 Phase 14: Search Analytics Service (search logging, access control)
import { SearchAnalyticsService } from './services/search-analytics.service';
// Phase 10.102 Day 2 - Phase 2: Source Allocation Service (enterprise-grade with NestJS Logger)
import { SourceAllocationService } from './services/source-allocation.service';
// Phase 10.102 Phase 3.1: Retry Service (exponential backoff, circuit breaker)
import { RetryService } from '../../common/services/retry.service';
// Phase 10.102 Phase 3.1: Bulkhead Service (multi-tenant resource isolation)
import { BulkheadService } from '../../common/services/bulkhead.service';
// Phase 10.108: Universal Citation Enrichment Service (Netflix-grade batch enrichment for ALL papers)
import { UniversalCitationEnrichmentService } from './services/universal-citation-enrichment.service';
// Phase 10.112 Week 2: Netflix-Grade Search Optimization
import { SourceCapabilityService } from './services/source-capability.service';
import { EarlyStopService } from './services/early-stop.service';
import { RequestContextService } from './services/request-context.service';
import { RequestCancellationInterceptor } from './interceptors/request-cancellation.interceptor';
// Phase 10.112 Week 3: Netflix-Grade Full Integration
import { CursorBasedCacheService } from './services/cursor-based-cache.service';
import { NeuralBudgetService } from './services/neural-budget.service';
// Phase 10.112 Week 4: Netflix-Grade Advanced Patterns
import { AdaptiveTimeoutService } from './services/adaptive-timeout.service';
import { RequestHedgingService } from './services/request-hedging.service';
import { GracefulDegradationService } from './services/graceful-degradation.service';
// Phase 10.113 Week 2: Theme-Fit Relevance Scoring
import { ThemeFitScoringService } from './services/theme-fit-scoring.service';
// Phase 10.113 Week 3: Hierarchical Theme Extraction (Meta-themes + Sub-themes)
import { MetaThemeDiscoveryService } from './services/meta-theme-discovery.service';
// Phase 10.113 Week 4: Citation-Based Controversy Analysis
import { CitationControversyService } from './services/citation-controversy.service';
// Phase 10.113 Week 5: Claim Extraction for Q-Methodology
import { ClaimExtractionService } from './services/claim-extraction.service';
// Phase 10.113 Week 6: Unified Thematization Orchestrator & Pricing
import { UnifiedThematizationService } from './services/unified-thematization.service';
import { ThematizationPricingService } from './services/thematization-pricing.service';
// Phase 10.113 Week 7: Database-Backed Billing Service
import { ThematizationBillingService } from './services/thematization-billing.service';
// Phase 10.113 Week 7: Thematization Controller
import { ThematizationController } from './controllers/thematization.controller';
// Phase 10.113 Week 7: Thematization WebSocket Gateway & Progress Service
import { ThematizationGateway } from './gateways/thematization.gateway';
import { ThematizationProgressService } from './services/thematization-progress.service';
// Phase 10.113 Week 7: AI Query Optimization for Thematization
import { ThematizationQueryService } from './services/thematization-query.service';
// Phase 10.113 Week 8: Monitoring, Analytics & Caching
import { ThematizationMetricsService } from './services/thematization-metrics.service';
import { ThematizationAdminService } from './services/thematization-admin.service';
import { ThematizationCacheService } from './services/thematization-cache.service';
// Phase 10.113 Week 9: Scientific Query Optimization
import { ScientificQueryOptimizerService } from './services/scientific-query-optimizer.service';
// Phase 10.113 Week 10: Progressive Search Streaming
import { SearchStreamService } from './services/search-stream.service';
import { LazyEnrichmentService } from './services/lazy-enrichment.service';
// Phase 10.113 Week 11: Progressive Semantic Scoring
import { ProgressiveSemanticService } from './services/progressive-semantic.service';
import { EmbeddingCacheService } from './services/embedding-cache.service';
import { EmbeddingPoolService } from './services/embedding-pool.service';
// Phase 10.113 Week 12: Production Monitoring & Error Recovery
import { SemanticMetricsService } from './services/semantic-metrics.service';
import { SemanticCircuitBreakerService } from './services/semantic-circuit-breaker.service';
import { SemanticHealthController } from './controllers/semantic-health.controller';
import { PDFController } from './controllers/pdf.controller';
// Phase 10.155: Iterative Fetch System (Netflix-Grade Paper Collection)
import { AdaptiveQualityThresholdService } from './services/adaptive-quality-threshold.service';
import { IterativeFetchService } from './services/iterative-fetch.service';
import { AuthModule } from '../auth/auth.module';
import { LiteratureGateway } from './literature.gateway';
import { ThemeExtractionGateway } from './gateways/theme-extraction.gateway';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../../common/prisma.module';
import { CacheService } from '../../common/cache.service';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    AuthModule,
    HttpModule,
    PrismaModule,
    AIModule,
    EventEmitterModule.forRoot(),
    CacheModule.register({
      ttl: 3600, // 1 hour cache
      max: 1000, // Maximum items in cache
    }),
  ],
  controllers: [LiteratureController, PDFController, ThematizationController, SemanticHealthController],
  providers: [
    LiteratureService,
    LiteratureGateway,
    ThemeExtractionGateway, // Phase 9 Day 28
    ThematizationGateway, // Phase 10.113 Week 7: Thematization WebSocket
    ThematizationProgressService, // Phase 10.113 Week 7: Progress tracking
    ReferenceService,
    ThemeExtractionService,
    GapAnalyzerService,
    ThemeToStatementService,
    KnowledgeGraphService, // Phase 9 Day 14
    PredictiveGapService, // Phase 9 Day 15
    TranscriptionService, // Phase 9 Day 18
    MultiMediaAnalysisService, // Phase 9 Day 18
    TikTokResearchService, // Phase 9 Day 19
    InstagramManualService, // Phase 9 Day 19
    CrossPlatformSynthesisService, // Phase 9 Day 19
    UnifiedThemeExtractionService, // Phase 9 Day 20
    SearchCoalescerService, // Phase 10 Days 2-3 - Request deduplication
    CacheService, // Phase 10 Days 2-3 - Enhanced multi-tier cache
    APIQuotaMonitorService, // Phase 10 Days 2-3 - API quota monitoring
    ThemeToSurveyItemService, // Phase 10 Day 5.9 - Theme-to-Survey Item Generation
    EnhancedThemeIntegrationService, // Phase 10 Day 5.12 - Enhanced Theme Integration
    PDFParsingService, // Phase 10 Day 5.15 - PDF Full-Text Parsing
    PDFQueueService, // Phase 10 Day 5.15 - PDF Background Queue
    LiteratureCacheService, // Phase 10 Day 18 - Iterative Theme Extraction Cache
    PaperQualityScoringService, // Phase 10 Day 19.6 - Paper Quality Scoring
    GuidedBatchSelectorService, // Phase 10 Day 19.6 - Guided Batch Selection
    HtmlFullTextService, // Phase 10 Day 30 - HTML & PMC Full-Text Fetching
    OpenAlexEnrichmentService, // Phase 10.1 Day 12 - Citation & Journal Metrics Enrichment
    // Phase 10.6 Day 3: Additional academic sources (bioRxiv/ChemRxiv removed <500k papers)
    GoogleScholarService,
    SSRNService,
    // Phase 10.6 Day 3.5: Extracted old sources to dedicated services (refactoring)
    SemanticScholarService,
    CrossRefService,
    PubMedService,
    ArxivService,
    // Phase 10.6 Day 4: PubMed Central (PMC) - Full-text articles
    PMCService,
    // Phase 10.6 Day 5: ERIC - Education research database
    ERICService,
    // Phase 10.7.10: CORE - Open access aggregator
    CoreService,
    // Phase 10.106 Phase 1: OpenAlex - Comprehensive open database
    OpenAlexService,
    // Phase 10.6 Day 6: Web of Science - Premium academic database
    WebOfScienceService,
    // Phase 10.6 Day 7: Scopus - Premium Elsevier database
    ScopusService,
    // Phase 10.6 Day 8: IEEE Xplore - Engineering and computer science database
    IEEEService,
    // Phase 10.6 Day 9: SpringerLink - Multidisciplinary STM publisher
    SpringerService,
    // Phase 10.6 Day 10: Nature - High-impact multidisciplinary journal
    NatureService,
    // Phase 10.6 Day 11: Wiley Online Library - 6M+ articles, engineering/medicine
    WileyService,
    // Phase 10.6 Day 12: SAGE Publications - 1000+ journals, social sciences
    SageService,
    // Phase 10.6 Day 13: Taylor & Francis - 2700+ journals, humanities
    TaylorFrancisService,
    // Phase 10.6 Day 14.4: Enterprise-grade search logging
    SearchLoggerService,
    // Phase 10.94 Day 1-2: Identifier Enrichment Service
    IdentifierEnrichmentService,
    // Phase 10.94 Day 4-5: GROBID PDF Extraction Service
    GrobidExtractionService,
    // Phase 10.97: Enterprise-Grade Parallel Extraction Orchestrator
    ParallelExtractionOrchestratorService,
    // Phase 10.98: FREE Local Embeddings (replaces expensive OpenAI embeddings)
    LocalEmbeddingService,
    // Phase 10.101 Task 3 - Phase 2: Embedding Orchestrator (extracted from UnifiedThemeExtractionService)
    EmbeddingOrchestratorService,
    // Phase 10.101 Task 3 - Phase 3: Progress Tracking Service (extracted from UnifiedThemeExtractionService)
    ThemeExtractionProgressService,
    // Phase 10.101 Task 3 - Phase 4: Source Content Fetcher (extracted from UnifiedThemeExtractionService)
    SourceContentFetcherService,
    // Phase 10.101 Task 3 - Phase 5: Theme Deduplication (extracted from UnifiedThemeExtractionService)
    ThemeDeduplicationService,
    // Phase 10.101 Task 3 - Phase 6: Batch Extraction Orchestrator (extracted from UnifiedThemeExtractionService)
    BatchExtractionOrchestratorService,
    // Phase 10.101 Task 3 - Phase 7: Theme Provenance Service (extracted from UnifiedThemeExtractionService)
    ThemeProvenanceService,
    // Phase 10.101 Task 3 - Phase 8: API Rate Limiter Service (extracted from UnifiedThemeExtractionService)
    ApiRateLimiterService,
    // Phase 10.101 Task 3 - Phase 8.6: Metrics Service (Prometheus-compatible)
    MetricsService,
    // Phase 10.98 Day 1-6: Purpose-Specific Theme Extraction Algorithms
    MathematicalUtilitiesService,
    KMeansClusteringService,
    QMethodologyPipelineService,
    SurveyConstructionPipelineService,
    QualitativeAnalysisPipelineService,
    ExcerptEmbeddingCacheService,
    // Phase 10.98 FIX: Local code extraction and theme labeling (NO AI, $0.00 cost)
    LocalCodeExtractionService,
    LocalThemeLabelingService,
    // Phase 8.90 Priority 3: FAISS High-Performance Deduplication (100x faster)
    FAISSDeduplicationService,
    // Phase 10.99: Neural Relevance Filtering (SciBERT-powered semantic precision)
    NeuralRelevanceService,
    // Phase 10.99 Week 2: Performance Monitoring Infrastructure (Enterprise-Grade)
    // Note: PerformanceMonitorService removed from providers - it's instantiated directly with runtime params
    // Phase 10.100 Phase 2: Search Pipeline Orchestration Service (8-stage progressive filtering)
    SearchPipelineService,
    // Phase 10.100 Phase 3: Alternative Sources Service (arxiv, patents, github, stackoverflow, youtube, podcasts)
    AlternativeSourcesService,
    // Phase 10.100 Phase 4: Social Media Intelligence Service (Twitter, Reddit, LinkedIn, Facebook, Instagram, TikTok)
    SocialMediaIntelligenceService,
    // Phase 10.100 Phase 5: Citation Export Service (BibTeX, RIS, APA, MLA, Chicago, CSV, JSON)
    CitationExportService,
    // Phase 10.100 Phase 7: Paper Permissions Service (ownership verification, full-text status management)
    PaperPermissionsService,
    // Phase 10.100 Phase 8: Paper Metadata Service (metadata refresh, semantic scholar mapping, title matching)
    PaperMetadataService,
    // Phase 10.100 Phase 9: Paper Database Service (paper CRUD operations, library management, ownership enforcement)
    PaperDatabaseService,
    // Phase 10.101 Task 3 - Phase 9: Theme Database Service (theme database mapping, storage, retrieval)
    ThemeDatabaseService,
    // Phase 10.100 Phase 10: Source Router Service (academic source routing, quota management, error handling)
    SourceRouterService,
    // Phase 10.100 Phase 11: Literature Utilities Service (deduplication, query preprocessing, string algorithms)
    LiteratureUtilsService,
    // Phase 10.100 Phase 12: Search Quality and Diversity Service (quality sampling, source diversity, pagination caching)
    SearchQualityDiversityService,
    // Phase 10.100 Phase 13: HTTP Client Configuration Service (timeout management, request monitoring)
    HttpClientConfigService,
    // Phase 10.100 Phase 14: Search Analytics Service (search logging, access control)
    SearchAnalyticsService,
    // Phase 10.102 Day 2 - Phase 2: Source Allocation Service (enterprise-grade with NestJS Logger)
    SourceAllocationService,
    // Phase 10.102 Phase 3.1: Retry Service (exponential backoff, circuit breaker)
    RetryService,
    // Phase 10.102 Phase 3.1: Bulkhead Service (multi-tenant resource isolation)
    BulkheadService,
    // Phase 10.108: Universal Citation Enrichment Service (Netflix-grade batch enrichment for ALL papers)
    UniversalCitationEnrichmentService,
    // Phase 10.112 Week 2: Netflix-Grade Search Optimization
    SourceCapabilityService,
    EarlyStopService,
    RequestContextService,
    RequestCancellationInterceptor,
    // Phase 10.112 Week 3: Netflix-Grade Full Integration
    CursorBasedCacheService,
    NeuralBudgetService,
    // Phase 10.112 Week 4: Netflix-Grade Advanced Patterns
    AdaptiveTimeoutService,
    RequestHedgingService,
    GracefulDegradationService,
    // Phase 10.113 Week 2: Theme-Fit Relevance Scoring
    ThemeFitScoringService,
    // Phase 10.113 Week 3: Hierarchical Theme Extraction (Meta-themes + Sub-themes)
    MetaThemeDiscoveryService,
    // Phase 10.113 Week 4: Citation-Based Controversy Analysis
    CitationControversyService,
    // Phase 10.113 Week 5: Claim Extraction for Q-Methodology
    ClaimExtractionService,
    // Phase 10.113 Week 6: Unified Thematization Orchestrator & Pricing
    UnifiedThematizationService,
    ThematizationPricingService,
    // Phase 10.113 Week 7: Database-Backed Billing Service
    ThematizationBillingService,
    // Phase 10.113 Week 7: AI Query Optimization for Thematization
    ThematizationQueryService,
    // Phase 10.113 Week 8: Monitoring, Analytics & Caching
    ThematizationMetricsService,
    ThematizationAdminService,
    ThematizationCacheService,
    // Phase 10.113 Week 9: Scientific Query Optimization
    ScientificQueryOptimizerService,
    // Phase 10.113 Week 10: Progressive Search Streaming
    SearchStreamService,
    LazyEnrichmentService,
    // Phase 10.113 Week 11: Progressive Semantic Scoring
    ProgressiveSemanticService,
    EmbeddingCacheService,
    EmbeddingPoolService,
    // Phase 10.113 Week 12: Production Monitoring & Error Recovery
    SemanticMetricsService,
    SemanticCircuitBreakerService,
    // Phase 10.155: Iterative Fetch System (Netflix-Grade Paper Collection)
    AdaptiveQualityThresholdService,
    IterativeFetchService,
  ],
  exports: [
    LiteratureService,
    ReferenceService,
    ThemeExtractionService,
    GapAnalyzerService,
    ThemeToStatementService,
    KnowledgeGraphService, // Phase 9 Day 14
    PredictiveGapService, // Phase 9 Day 15
    TranscriptionService, // Phase 9 Day 18
    MultiMediaAnalysisService, // Phase 9 Day 18
    TikTokResearchService, // Phase 9 Day 19
    InstagramManualService, // Phase 9 Day 19
    CrossPlatformSynthesisService, // Phase 9 Day 19
    UnifiedThemeExtractionService, // Phase 9 Day 20
    ThemeToSurveyItemService, // Phase 10 Day 5.9 - Theme-to-Survey Item Generation
    EnhancedThemeIntegrationService, // Phase 10 Day 5.12 - Enhanced Theme Integration
    PDFParsingService, // Phase 10 Day 5.15 - PDF Full-Text Parsing
    PDFQueueService, // Phase 10 Day 5.15 - PDF Background Queue
    LiteratureCacheService, // Phase 10 Day 18 - Iterative Theme Extraction Cache
    HtmlFullTextService, // Phase 10 Day 30 - HTML & PMC Full-Text Fetching
    // Phase 10.6 Day 3: Additional academic sources (bioRxiv/ChemRxiv removed <500k papers)
    GoogleScholarService,
    SSRNService,
    // Phase 10.6 Day 3.5: Extracted old sources to dedicated services (refactoring)
    SemanticScholarService,
    CrossRefService,
    PubMedService,
    ArxivService,
    // Phase 10.6 Day 4: PubMed Central (PMC) - Full-text articles
    PMCService,
    // Phase 10.6 Day 5: ERIC - Education research database
    ERICService,
    // Phase 10.7.10: CORE - Open access aggregator
    CoreService,
    // Phase 10.106 Phase 1: OpenAlex - Comprehensive open database
    OpenAlexService,
    // Phase 10.6 Day 6: Web of Science - Premium academic database
    WebOfScienceService,
    // Phase 10.6 Day 7: Scopus - Premium Elsevier database
    ScopusService,
    // Phase 10.6 Day 8: IEEE Xplore - Engineering and computer science database
    IEEEService,
    // Phase 10.6 Day 9: SpringerLink - Multidisciplinary STM publisher
    SpringerService,
    // Phase 10.6 Day 10: Nature - High-impact multidisciplinary journal
    NatureService,
    // Phase 10.6 Day 11: Wiley Online Library - 6M+ articles, engineering/medicine
    WileyService,
    // Phase 10.6 Day 12: SAGE Publications - 1000+ journals, social sciences
    SageService,
    // Phase 10.6 Day 13: Taylor & Francis - 2700+ journals, humanities
    TaylorFrancisService,
    // Phase 10.94 Day 1-2: Identifier Enrichment Service
    IdentifierEnrichmentService,
    // Phase 10.94 Day 4-5: GROBID PDF Extraction Service
    GrobidExtractionService,
    // Phase 10.97: Enterprise-Grade Parallel Extraction Orchestrator
    ParallelExtractionOrchestratorService,
    // Phase 10.98: FREE Local Embeddings (replaces expensive OpenAI embeddings)
    LocalEmbeddingService,
    // Phase 10.101 Task 3 - Phase 8.5 FIX: Export for health monitoring (shared circuit breaker state)
    ApiRateLimiterService,
    // Phase 10.101 Task 3 - Phase 9: Theme Database Service (DX-1 FIX: exported for other modules)
    ThemeDatabaseService,
    // Phase 10.112 Week 2: Export for health monitoring
    SourceCapabilityService,
    EarlyStopService,
    // Phase 10.112 Week 3: Export for health monitoring and cross-module access
    CursorBasedCacheService,
    NeuralBudgetService,
    // Phase 10.112 Week 4: Export for health monitoring and cross-module access
    AdaptiveTimeoutService,
    RequestHedgingService,
    GracefulDegradationService,
    // Phase 10.113 Week 2: Theme-Fit Relevance Scoring
    ThemeFitScoringService,
    // Phase 10.113 Week 3: Hierarchical Theme Extraction (Meta-themes + Sub-themes)
    MetaThemeDiscoveryService,
    // Phase 10.113 Week 4: Citation-Based Controversy Analysis
    CitationControversyService,
    // Phase 10.113 Week 5: Claim Extraction for Q-Methodology
    ClaimExtractionService,
    // Phase 10.113 Week 6: Unified Thematization Orchestrator & Pricing
    UnifiedThematizationService,
    ThematizationPricingService,
    // Phase 10.113 Week 7: Database-Backed Billing Service
    ThematizationBillingService,
    // Phase 10.113 Week 7: AI Query Optimization
    ThematizationQueryService,
    // Phase 10.113 Week 8: Monitoring, Analytics & Caching
    ThematizationMetricsService,
    ThematizationAdminService,
    ThematizationCacheService,
    // Phase 10.113 Week 9: Scientific Query Optimization
    ScientificQueryOptimizerService,
    // Phase 10.113 Week 10: Progressive Search Streaming
    SearchStreamService,
    LazyEnrichmentService,
    // Phase 10.113 Week 11: Progressive Semantic Scoring
    ProgressiveSemanticService,
    EmbeddingCacheService,
    EmbeddingPoolService,
    // Phase 10.113 Week 12: Production Monitoring & Error Recovery
    SemanticMetricsService,
    SemanticCircuitBreakerService,
    // Phase 10.155: Iterative Fetch System (Netflix-Grade Paper Collection)
    AdaptiveQualityThresholdService,
    IterativeFetchService,
  ],
})
export class LiteratureModule implements OnModuleInit {
  constructor(
    private readonly unifiedThemeService: UnifiedThemeExtractionService,
    private readonly themeGateway: ThemeExtractionGateway,
    private readonly rateLimiter: ApiRateLimiterService, // Phase 8.6: Inject for metrics wiring
    private readonly metricsService: MetricsService, // Phase 8.6: Metrics tracking
    // Phase 10.113 Week 7: Thematization WebSocket wiring
    private readonly thematizationGateway: ThematizationGateway,
    private readonly thematizationProgressService: ThematizationProgressService,
  ) {}

  /**
   * Phase 10 Day 5.17.3: Wire up WebSocket gateway to service
   * Connects real-time progress updates to theme extraction
   *
   * ENHANCED Phase 8.6: Wire up metrics tracking
   * ENHANCED Phase 10.113 Week 7: Wire up thematization WebSocket
   */
  onModuleInit() {
    // Phase 10 Day 5.17.3: WebSocket gateway wiring
    this.unifiedThemeService.setGateway(this.themeGateway);

    // Phase 8.6: Metrics service wiring (enables circuit breaker metrics)
    this.rateLimiter.setMetricsService(this.metricsService);

    // Phase 10.113 Week 7: Thematization WebSocket gateway wiring
    this.thematizationProgressService.setGateway(this.thematizationGateway);
  }
}
