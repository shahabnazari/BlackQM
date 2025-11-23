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
import { PDFController } from './controllers/pdf.controller';
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
  controllers: [LiteratureController, PDFController],
  providers: [
    LiteratureService,
    LiteratureGateway,
    ThemeExtractionGateway, // Phase 9 Day 28
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
  ],
})
export class LiteratureModule implements OnModuleInit {
  constructor(
    private readonly unifiedThemeService: UnifiedThemeExtractionService,
    private readonly themeGateway: ThemeExtractionGateway,
  ) {}

  /**
   * Phase 10 Day 5.17.3: Wire up WebSocket gateway to service
   * Connects real-time progress updates to theme extraction
   */
  onModuleInit() {
    this.unifiedThemeService.setGateway(this.themeGateway);
  }
}
