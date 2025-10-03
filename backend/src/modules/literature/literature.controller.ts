import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { LiteratureService } from './literature.service';
import { ReferenceService, CitationStyle } from './services/reference.service';
import { ThemeExtractionService } from './services/theme-extraction.service';
import { GapAnalyzerService } from './services/gap-analyzer.service';
import { ThemeToStatementService } from './services/theme-to-statement.service';
import { KnowledgeGraphService } from './services/knowledge-graph.service'; // Phase 9 Day 14
import { PredictiveGapService } from './services/predictive-gap.service'; // Phase 9 Day 15
import { TranscriptionService } from './services/transcription.service'; // Phase 9 Day 18
import { MultiMediaAnalysisService } from './services/multimedia-analysis.service'; // Phase 9 Day 18
import { UnifiedThemeExtractionService } from './services/unified-theme-extraction.service'; // Phase 9 Day 20
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  SearchLiteratureDto,
  SavePaperDto,
  ExportCitationsDto,
  ExtractThemesDto,
  AnalyzeGapsDto,
  ExtractUnifiedThemesDto,
  CompareStudyThemesDto,
} from './dto/literature.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('literature')
@Controller('literature')
export class LiteratureController {
  private readonly logger = new Logger(LiteratureController.name);

  constructor(
    private readonly literatureService: LiteratureService,
    private readonly referenceService: ReferenceService,
    private readonly themeExtractionService: ThemeExtractionService,
    private readonly gapAnalyzerService: GapAnalyzerService,
    private readonly themeToStatementService: ThemeToStatementService,
    private readonly knowledgeGraphService: KnowledgeGraphService, // Phase 9 Day 14
    private readonly predictiveGapService: PredictiveGapService, // Phase 9 Day 15
    private readonly transcriptionService: TranscriptionService, // Phase 9 Day 18
    private readonly multimediaAnalysisService: MultiMediaAnalysisService, // Phase 9 Day 18
    private readonly unifiedThemeExtractionService: UnifiedThemeExtractionService, // Phase 9 Day 20
  ) {}

  @Post('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search literature across multiple databases' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async searchLiterature(
    @Body() searchDto: SearchLiteratureDto,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.searchLiterature(searchDto, user.id);
  }

  // Temporary public endpoint for testing
  @Post('search/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public search for testing (dev only)' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async searchLiteraturePublic(@Body() searchDto: SearchLiteratureDto) {
    // Use a default user ID for public searches
    return await this.literatureService.searchLiterature(
      searchDto,
      'public-user',
    );
  }

  // Public save paper endpoint for development
  @Post('save/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public save paper for testing (dev only)' })
  @ApiResponse({ status: 200, description: 'Paper saved successfully' })
  async savePaperPublic(@Body() saveDto: SavePaperDto) {
    // Use a default user ID for public saves
    return await this.literatureService.savePaper(saveDto, 'public-user');
  }

  // Public remove paper endpoint for development
  @Delete('library/public/:paperId')
  @ApiOperation({ summary: 'Public remove paper for testing (dev only)' })
  @ApiResponse({ status: 200, description: 'Paper removed' })
  async removePaperPublic(@Param('paperId') paperId: string) {
    // Use a default user ID for public removes
    return await this.literatureService.removePaper(paperId, 'public-user');
  }

  // Public get library endpoint for development
  @Get('library/public')
  @ApiOperation({ summary: 'Public get library for testing (dev only)' })
  @ApiResponse({ status: 200, description: 'User library returned' })
  async getUserLibraryPublic(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.literatureService.getUserLibrary(
      'public-user',
      page,
      limit,
    );
  }

  // Public theme extraction endpoint for development
  @Post('themes/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public extract themes for testing (dev only)' })
  @ApiResponse({ status: 200, description: 'Themes extracted' })
  async extractThemesPublic(@Body() themesDto: ExtractThemesDto) {
    // Use theme extraction service for real AI extraction
    return await this.themeExtractionService.extractThemes(
      themesDto.paperIds,
    );
  }

  /**
   * @deprecated Use POST /api/literature/gaps/analyze instead with paperIds
   * This field-based gap analysis returns mock data and will be removed
   */
  @Get('gaps')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'DEPRECATED: Use POST /gaps/analyze with paperIds instead',
    deprecated: true,
  })
  @ApiResponse({ status: 200, description: 'Gap analysis complete' })
  async analyzeGapsField(
    @Query() analysisDto: AnalyzeGapsDto,
    @CurrentUser() user: any,
  ) {
    // Return helpful error message directing to correct endpoint
    return {
      error: 'DEPRECATED_ENDPOINT',
      message: 'This endpoint returns mock data. Please use POST /api/literature/gaps/analyze with paperIds array instead.',
      correctEndpoint: 'POST /api/literature/gaps/analyze',
      examplePayload: {
        paperIds: ['paper1', 'paper2', 'paper3']
      }
    };
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save paper to user library' })
  @ApiResponse({ status: 201, description: 'Paper saved successfully' })
  async savePaper(@Body() saveDto: SavePaperDto, @CurrentUser() user: any) {
    return await this.literatureService.savePaper(saveDto, user.id);
  }

  @Post('export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export citations in various formats' })
  @ApiResponse({ status: 200, description: 'Citations exported' })
  async exportCitations(
    @Body() exportDto: ExportCitationsDto,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.exportCitations(exportDto, user.id);
  }

  @Get('library')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's saved papers" })
  @ApiResponse({ status: 200, description: 'User library returned' })
  async getUserLibrary(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.getUserLibrary(user.id, page, limit);
  }

  @Delete('library/:paperId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove paper from library' })
  @ApiResponse({ status: 200, description: 'Paper removed' })
  async removePaper(
    @Param('paperId') paperId: string,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.removePaper(paperId, user.id);
  }

  @Post('themes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract themes from papers' })
  @ApiResponse({ status: 200, description: 'Themes extracted' })
  async extractThemes(
    @Body() themesDto: ExtractThemesDto,
    @CurrentUser() user: any,
  ) {
    // Use theme extraction service for real AI extraction
    return await this.themeExtractionService.extractThemes(
      themesDto.paperIds,
    );
  }

  @Post('pipeline/themes-to-statements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Full pipeline: Extract themes and generate statements with provenance',
    description:
      'Processes literature through complete pipeline with citation tracking',
  })
  @ApiResponse({
    status: 200,
    description: 'Statements generated with provenance',
  })
  async extractThemesAndGenerateStatements(
    @Body()
    dto: {
      paperIds: string[];
      studyContext?: {
        targetStatements?: number;
        academicLevel?: 'basic' | 'intermediate' | 'advanced';
        studyId?: string;
      };
    },
    @CurrentUser() user: any,
  ) {
    // Extract themes with AI
    const themes = await this.themeExtractionService.extractThemes(
      dto.paperIds,
    );

    // Generate statements with full provenance
    const result = await this.themeExtractionService.themeToStatements(
      themes,
      dto.studyContext,
    );

    // Convert Map to object for JSON serialization
    const provenanceObj: Record<string, any> = {};
    result.provenance.forEach((value, key) => {
      provenanceObj[key] = value;
    });

    return {
      themes,
      statements: result.statements,
      provenance: provenanceObj,
      metadata: result.metadata,
      pipeline: {
        stage: 'literature-to-statements',
        timestamp: new Date(),
        userId: user.id,
      },
    };
  }

  @Post('pipeline/themes-to-statements/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public pipeline for testing (dev only)',
    description: 'Test the full pipeline without authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Statements generated with provenance',
  })
  async extractThemesAndGenerateStatementsPublic(
    @Body()
    dto: {
      paperIds: string[];
      studyContext?: {
        targetStatements?: number;
        academicLevel?: 'basic' | 'intermediate' | 'advanced';
        studyId?: string;
      };
    },
  ) {
    // Extract themes with AI
    const themes = await this.themeExtractionService.extractThemes(
      dto.paperIds,
    );

    // Generate statements with full provenance
    const result = await this.themeExtractionService.themeToStatements(
      themes,
      dto.studyContext,
    );

    // Convert Map to object for JSON serialization
    const provenanceObj: Record<string, any> = {};
    result.provenance.forEach((value, key) => {
      provenanceObj[key] = value;
    });

    return {
      themes,
      statements: result.statements,
      provenance: provenanceObj,
      metadata: result.metadata,
      pipeline: {
        stage: 'literature-to-statements',
        timestamp: new Date(),
        userId: 'public-user',
      },
    };
  }

  @Post('pipeline/create-study-scaffolding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create study scaffolding from gaps and themes',
    description:
      'Generates research questions, hypotheses, objectives, and method suggestions',
  })
  @ApiResponse({ status: 200, description: 'Study scaffolding created' })
  async createStudyScaffolding(
    @Body()
    dto: {
      paperIds: string[];
      includeGapAnalysis?: boolean;
      targetStatements?: number;
      academicLevel?: 'basic' | 'intermediate' | 'advanced';
    },
    @CurrentUser() user: any,
  ) {
    // Extract themes
    const themes = await this.themeExtractionService.extractThemes(
      dto.paperIds,
      user.id,
    );

    // Analyze gaps if requested
    let researchGaps: any[] = [];
    if (dto.includeGapAnalysis) {
      const gaps = await this.gapAnalyzerService.analyzeResearchGaps(
        dto.paperIds,
      );
      researchGaps = gaps || [];
    }

    // Create study scaffolding
    const scaffolding =
      await this.themeToStatementService.createStudyScaffolding(
        researchGaps,
        themes,
      );

    // Map themes to statements
    const statementMappings =
      await this.themeToStatementService.mapThemesToStatements(themes, {
        targetStatements: dto.targetStatements || 40,
        academicLevel: dto.academicLevel || 'intermediate',
        includeControversyPairs: true,
      });

    return {
      themes,
      researchGaps,
      scaffolding,
      statementMappings,
      summary: {
        totalThemes: themes.length,
        controversialThemes: themes.filter((t) => t.controversial).length,
        totalStatements: statementMappings.reduce(
          (acc, m) => acc + m.statements.length,
          0,
        ),
        researchQuestions: scaffolding.researchQuestions?.length || 0,
        hypotheses: scaffolding.hypotheses?.length || 0,
      },
    };
  }

  @Post('pipeline/create-study-scaffolding/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public endpoint for study scaffolding (dev only)',
    description: 'Test study scaffolding without authentication',
  })
  @ApiResponse({ status: 200, description: 'Study scaffolding created' })
  async createStudyScaffoldingPublic(
    @Body()
    dto: {
      paperIds: string[];
      includeGapAnalysis?: boolean;
      targetStatements?: number;
      academicLevel?: 'basic' | 'intermediate' | 'advanced';
    },
  ) {
    // Extract themes
    const themes = await this.themeExtractionService.extractThemes(
      dto.paperIds,
    );

    // Analyze gaps if requested
    let researchGaps: any[] = [];
    if (dto.includeGapAnalysis) {
      const gaps = await this.gapAnalyzerService.analyzeResearchGaps(
        dto.paperIds,
      );
      researchGaps = gaps || [];
    }

    // Create study scaffolding
    const scaffolding =
      await this.themeToStatementService.createStudyScaffolding(
        researchGaps,
        themes,
      );

    // Map themes to statements
    const statementMappings =
      await this.themeToStatementService.mapThemesToStatements(themes, {
        targetStatements: dto.targetStatements || 40,
        academicLevel: dto.academicLevel || 'intermediate',
        includeControversyPairs: true,
      });

    return {
      themes,
      researchGaps,
      scaffolding,
      statementMappings,
      summary: {
        totalThemes: themes.length,
        controversialThemes: themes.filter((t) => t.controversial).length,
        totalStatements: statementMappings.reduce(
          (acc, m) => acc + m.statements.length,
          0,
        ),
        researchQuestions: scaffolding.researchQuestions?.length || 0,
        hypotheses: scaffolding.hypotheses?.length || 0,
      },
    };
  }

  @Get('social')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get social media research data' })
  @ApiResponse({ status: 200, description: 'Social data returned' })
  async getSocialData(
    @Query('topic') topic: string,
    @Query('platforms') platforms: string[],
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.analyzeSocialOpinion(
      topic,
      platforms,
      user.id,
    );
  }

  @Get('alternative')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get alternative source data' })
  @ApiResponse({ status: 200, description: 'Alternative sources returned' })
  async getAlternativeSources(
    @Query('query') query: string,
    @Query('sources') sources: string | string[],
    @CurrentUser() user: any,
  ) {
    try {
      // Normalize sources to array
      const sourcesArray = Array.isArray(sources) ? sources : [sources];

      this.logger.log(
        `🔍 [Alternative Sources] Request received - Query: "${query}", Sources: ${JSON.stringify(sourcesArray)}, User: ${user.id}`,
      );

      const results = await this.literatureService.searchAlternativeSources(
        query,
        sourcesArray,
        user.id,
      );

      this.logger.log(
        `✅ [Alternative Sources] Returning ${results.length} results`,
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `❌ [Alternative Sources] Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * PUBLIC endpoint for alternative sources (development/testing only)
   * Allows testing YouTube and other alternative sources without authentication
   */
  @Get('alternative/public')
  @ApiOperation({ summary: 'PUBLIC: Get alternative sources (dev only)' })
  @ApiResponse({ status: 200, description: 'Alternative sources returned' })
  async getAlternativeSourcesPublic(
    @Query('query') query: string,
    @Query('sources') sources: string | string[],
  ) {
    try {
      // Normalize sources to array
      const sourcesArray = Array.isArray(sources) ? sources : [sources];

      this.logger.log(
        `🔍 [Alternative Sources PUBLIC] Request received - Query: "${query}", Sources: ${JSON.stringify(sourcesArray)}`,
      );

      const results = await this.literatureService.searchAlternativeSources(
        query,
        sourcesArray,
        'public-user',
      );

      this.logger.log(
        `✅ [Alternative Sources PUBLIC] Returning ${results.length} results`,
      );

      return results;
    } catch (error: any) {
      this.logger.error(
        `❌ [Alternative Sources PUBLIC] Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * PHASE 9 DAY 13: Social Media Intelligence
   * Search social media platforms for research-relevant content
   * Includes sentiment analysis and engagement-weighted synthesis
   */
  @Get('social/search')
  @ApiOperation({
    summary: 'Search social media platforms for research content',
    description: 'Search Twitter, Reddit, LinkedIn, Facebook, Instagram, TikTok for research-relevant discussions with sentiment analysis',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Search query' })
  @ApiQuery({
    name: 'platforms',
    required: true,
    isArray: true,
    description: 'Social media platforms to search (twitter, reddit, linkedin, facebook, instagram, tiktok)',
  })
  @ApiResponse({
    status: 200,
    description: 'Social media results with sentiment analysis and engagement weights',
  })
  async searchSocialMedia(
    @Query('query') query: string,
    @Query('platforms') platforms: string[],
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.searchSocialMedia(
      query,
      platforms,
      user.id,
    );
  }

  @Get('social/search/public')
  @ApiOperation({
    summary: 'PUBLIC: Search social media platforms (for development)',
    description: 'Public endpoint for testing social media search during development',
  })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'platforms', required: true, isArray: true })
  @ApiResponse({
    status: 200,
    description: 'Social media results with sentiment analysis',
  })
  async searchSocialMediaPublic(
    @Query('query') query: string,
    @Query('platforms') platforms: string[],
  ) {
    // Security: Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Public endpoints are disabled in production. Please use the authenticated endpoint with JWT token.',
      );
    }

    // For development/demo purposes - no authentication required
    return await this.literatureService.searchSocialMedia(
      query,
      platforms,
      'public-demo-user',
    );
  }

  @Get('social/insights')
  @ApiOperation({
    summary: 'Get aggregated insights from social media data',
    description: 'Sentiment distribution, trending themes, and key influencers',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregated social media insights',
  })
  async getSocialMediaInsights(@Body() posts: any[]) {
    return await this.literatureService.generateSocialMediaInsights(posts);
  }

  @Get('recommendations/:studyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get literature recommendations for study' })
  @ApiResponse({ status: 200, description: 'Recommendations returned' })
  async getRecommendations(
    @Param('studyId') studyId: string,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.getStudyRecommendations(
      studyId,
      user.id,
    );
  }

  @Get('citations/:paperId')
  @ApiOperation({ summary: 'Get paper citations network' })
  @ApiResponse({ status: 200, description: 'Citation network returned' })
  async getCitationNetwork(
    @Param('paperId') paperId: string,
    @Query('depth') depth = 2,
  ) {
    return await this.literatureService.getCitationNetwork(paperId, depth);
  }

  @Post('statements/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate Q-statements from literature themes' })
  @ApiResponse({ status: 200, description: 'Statements generated' })
  async generateStatements(
    @Body() themesDto: { themes: string[]; studyContext: any },
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.generateStatementsFromThemes(
      themesDto.themes,
      themesDto.studyContext,
      user.id,
    );
  }

  @Post('themes/extract')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract themes from literature using AI' })
  @ApiResponse({
    status: 200,
    description: 'Themes extracted with controversy detection',
  })
  async extractThemesWithAI(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    return await this.themeExtractionService.extractThemes(body.paperIds);
  }

  @Post('controversies/detect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detect controversies in literature' })
  @ApiResponse({ status: 200, description: 'Controversies detected' })
  async detectControversies(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    return await this.themeExtractionService.detectControversies(body.paperIds);
  }

  @Post('themes/to-statements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert themes to Q-sort statements' })
  @ApiResponse({ status: 200, description: 'Statements generated from themes' })
  async themeToStatements(
    @Body() body: { themes: any[]; studyContext: any },
    @CurrentUser() user: any,
  ) {
    return await this.themeExtractionService.themeToStatements(
      body.themes,
      body.studyContext,
    );
  }

  @Post('statements/hints')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate statement hints from themes' })
  @ApiResponse({ status: 200, description: 'Statement hints generated' })
  async generateStatementHints(
    @Body() body: { themes: any[] },
    @CurrentUser() user: any,
  ) {
    return await this.themeExtractionService.generateStatementHints(
      body.themes,
    );
  }

  // Gap Analysis Endpoints
  @Post('gaps/analyze')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze research gaps from papers' })
  @ApiResponse({ status: 200, description: 'Research gaps analyzed' })
  async analyzeGapsFromPapers(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    return await this.gapAnalyzerService.analyzeResearchGaps(body.paperIds);
  }

  @Post('gaps/opportunities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate research opportunities from gaps' })
  @ApiResponse({ status: 200, description: 'Research opportunities generated' })
  async generateOpportunities(
    @Body() body: { gaps: any[] },
    @CurrentUser() user: any,
  ) {
    return await this.gapAnalyzerService.generateOpportunities(body.gaps);
  }

  @Post('gaps/keywords')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract and analyze keywords from papers' })
  @ApiResponse({ status: 200, description: 'Keywords analyzed' })
  async analyzeKeywords(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    const papers = await this.gapAnalyzerService['fetchPapersWithMetadata'](
      body.paperIds,
    );
    return await this.gapAnalyzerService.extractAndAnalyzeKeywords(papers);
  }

  @Post('gaps/trends')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detect trends in research topics' })
  @ApiResponse({ status: 200, description: 'Trends detected' })
  async detectTrends(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    const papers = await this.gapAnalyzerService['fetchPapersWithMetadata'](
      body.paperIds,
    );
    const keywords =
      await this.gapAnalyzerService.extractAndAnalyzeKeywords(papers);
    return await this.gapAnalyzerService.detectTrends(papers, keywords);
  }

  @Post('gaps/topics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform topic modeling on papers' })
  @ApiResponse({ status: 200, description: 'Topics modeled' })
  async modelTopics(
    @Body() body: { paperIds: string[]; numTopics?: number },
    @CurrentUser() user: any,
  ) {
    const papers = await this.gapAnalyzerService['fetchPapersWithMetadata'](
      body.paperIds,
    );
    return await this.gapAnalyzerService.performTopicModeling(
      papers,
      body.numTopics,
    );
  }

  // Reference Management Endpoints
  @Post('references/parse/bibtex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse BibTeX format references' })
  @ApiResponse({ status: 200, description: 'BibTeX parsed successfully' })
  async parseBibTeX(@Body() body: { bibtex: string }) {
    return this.referenceService.parseBibTeX(body.bibtex);
  }

  @Post('references/generate/bibtex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate BibTeX from paper data' })
  @ApiResponse({ status: 200, description: 'BibTeX generated successfully' })
  async generateBibTeX(@Body() paper: any) {
    return { bibtex: this.referenceService.generateBibTeX(paper) };
  }

  @Post('references/parse/ris')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse RIS format references' })
  @ApiResponse({ status: 200, description: 'RIS parsed successfully' })
  async parseRIS(@Body() body: { ris: string }) {
    return this.referenceService.parseRIS(body.ris);
  }

  @Post('references/generate/ris')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate RIS from paper data' })
  @ApiResponse({ status: 200, description: 'RIS generated successfully' })
  async generateRIS(@Body() paper: any) {
    return { ris: this.referenceService.generateRIS(paper) };
  }

  @Post('references/format')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Format citation in specified style' })
  @ApiResponse({ status: 200, description: 'Citation formatted successfully' })
  async formatCitation(@Body() body: { paper: any; style: CitationStyle }) {
    return {
      citation: this.referenceService.formatCitation(body.paper, body.style),
      style: body.style,
    };
  }

  @Post('references/zotero/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync with Zotero library' })
  @ApiResponse({ status: 200, description: 'Zotero sync completed' })
  async syncZotero(
    @Body() body: { apiKey: string; zoteroUserId: string },
    @CurrentUser() user: any,
  ) {
    return await this.referenceService.syncWithZotero(body.apiKey, user.id);
  }

  @Post('references/pdf/:paperId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Attach PDF to paper' })
  @ApiResponse({ status: 200, description: 'PDF attached successfully' })
  async attachPDF(
    @Param('paperId') paperId: string,
    @Body() body: { pdfPath: string },
  ) {
    await this.referenceService.attachPDF(paperId, body.pdfPath);
    return { success: true, paperId };
  }

  // ===========================================================================
  // PHASE 9 DAY 14-15: KNOWLEDGE GRAPH & PREDICTIVE GAP DETECTION
  // ===========================================================================

  /**
   * Phase 9 Day 14: Build knowledge graph from papers
   * Revolutionary feature: Entity extraction + citation network + bridge concepts
   */
  @Post('knowledge-graph/build')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🌉 Build knowledge graph from papers (Phase 9 Day 14)' })
  @ApiResponse({ status: 200, description: 'Knowledge graph constructed successfully' })
  async buildKnowledgeGraph(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Building knowledge graph for ${body.paperIds.length} papers (User: ${user.id})`);

    const startTime = Date.now();

    // Extract entities from papers
    const entities = await this.knowledgeGraphService.extractEntitiesFromPapers(body.paperIds);

    // Build citation network
    const citations = await this.knowledgeGraphService.buildCitationNetwork(body.paperIds);

    // Revolutionary algorithms
    const bridgeConcepts = await this.knowledgeGraphService.detectBridgeConcepts();
    const controversies = await this.knowledgeGraphService.detectControversies();
    const emergingTopics = await this.knowledgeGraphService.detectEmergingTopics();

    const duration = Date.now() - startTime;

    return {
      success: true,
      metrics: {
        entitiesExtracted: entities.length,
        citationsCreated: citations.length,
        bridgeConceptsFound: bridgeConcepts.length,
        controversiesDetected: controversies.length,
        emergingTopicsFound: emergingTopics.length,
        processingTimeMs: duration,
      },
      insights: {
        bridgeConcepts: bridgeConcepts.slice(0, 5), // Top 5
        controversies: controversies.slice(0, 3),
        emergingTopics: emergingTopics.slice(0, 10),
      },
    };
  }

  /**
   * Get knowledge graph for visualization
   */
  @Get('knowledge-graph/view')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '📊 Get knowledge graph for visualization' })
  @ApiResponse({ status: 200, description: 'Knowledge graph retrieved' })
  async getKnowledgeGraph(
    @Query('types') types?: string,
    @Query('minConfidence') minConfidence?: number,
    @Query('includePredicted') includePredicted?: string,
  ) {
    const filters = {
      types: types ? types.split(',') : undefined,
      minConfidence: minConfidence ? Number(minConfidence) : undefined,
      includePredicted: includePredicted === 'true',
    };

    const graph = await this.knowledgeGraphService.getKnowledgeGraph(filters);

    return {
      success: true,
      graph,
      stats: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        bridgeConcepts: graph.nodes.filter(n => n.isBridgeConcept).length,
        emergingTopics: graph.nodes.filter(n => n.emergingTopic).length,
      },
    };
  }

  /**
   * Track influence flow from a concept
   */
  @Get('knowledge-graph/influence/:nodeId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '💫 Track influence flow from concept' })
  @ApiResponse({ status: 200, description: 'Influence flow tracked' })
  async trackInfluenceFlow(@Param('nodeId') nodeId: string) {
    const flows = await this.knowledgeGraphService.trackInfluenceFlow(nodeId);

    return {
      success: true,
      sourceNodeId: nodeId,
      influenceFlows: flows,
      totalInfluenced: flows.length,
    };
  }

  /**
   * Predict missing links in knowledge graph
   */
  @Post('knowledge-graph/predict-links')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔮 Predict missing links in knowledge graph' })
  @ApiResponse({ status: 200, description: 'Missing links predicted' })
  async predictMissingLinks() {
    const missingLinks = await this.knowledgeGraphService.predictMissingLinks();

    return {
      success: true,
      predictedLinks: missingLinks,
      totalPredictions: missingLinks.length,
    };
  }

  /**
   * Export knowledge graph in various formats
   */
  @Get('knowledge-graph/export')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '📥 Export knowledge graph' })
  @ApiResponse({ status: 200, description: 'Knowledge graph exported' })
  async exportKnowledgeGraph(@Query('format') format: 'json' | 'graphml' | 'cypher' = 'json') {
    const exportData = await this.knowledgeGraphService.exportGraph(format);

    return {
      success: true,
      format,
      data: exportData,
    };
  }

  /**
   * Phase 9 Day 15: Score research opportunities with ML predictions
   */
  @Post('predictive-gaps/score-opportunities')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '💎 Score research opportunities with ML (Phase 9 Day 15)' })
  @ApiResponse({ status: 200, description: 'Research opportunities scored' })
  async scoreResearchOpportunities(
    @Body() body: { gapIds: string[] },
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Scoring ${body.gapIds.length} research opportunities (User: ${user.id})`);

    const opportunities = await this.predictiveGapService.scoreResearchOpportunities(body.gapIds);

    return {
      success: true,
      opportunities,
      topOpportunities: opportunities.slice(0, 10), // Top 10 by score
      averageScore: opportunities.reduce((sum, o) => sum + o.opportunityScore, 0) / opportunities.length,
    };
  }

  /**
   * Predict funding probability for research gaps
   */
  @Post('predictive-gaps/funding-probability')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '💰 Predict funding probability' })
  @ApiResponse({ status: 200, description: 'Funding probability predicted' })
  async predictFundingProbability(@Body() body: { gapIds: string[] }) {
    const fundingOpportunities = await this.predictiveGapService.getFundingOpportunities(body.gapIds);

    return {
      success: true,
      fundingOpportunities,
      highProbability: fundingOpportunities.filter(f => f.fundingProbability > 0.7),
    };
  }

  /**
   * Get optimized research timelines
   */
  @Post('predictive-gaps/optimize-timeline')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '⏱️ Optimize research timeline' })
  @ApiResponse({ status: 200, description: 'Timeline optimized' })
  async optimizeTimeline(@Body() body: { gapIds: string[] }) {
    const timelines = await this.predictiveGapService.getTimelineOptimizations(body.gapIds);

    return {
      success: true,
      timelines,
      averageDuration: timelines.reduce((sum, t) => sum + t.totalDuration, 0) / timelines.length,
    };
  }

  /**
   * Predict research impact
   */
  @Post('predictive-gaps/predict-impact')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '📊 Predict research impact' })
  @ApiResponse({ status: 200, description: 'Impact predicted' })
  async predictImpact(@Body() body: { gapIds: string[] }) {
    const predictions = await this.predictiveGapService.getImpactPredictions(body.gapIds);

    return {
      success: true,
      predictions,
      transformativeOpportunities: predictions.filter(p => p.impactCategory === 'TRANSFORMATIVE'),
    };
  }

  /**
   * Forecast research trends
   */
  @Post('predictive-gaps/forecast-trends')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '📈 Forecast research trends' })
  @ApiResponse({ status: 200, description: 'Trends forecasted' })
  async forecastTrends(@Body() body: { topics: string[] }) {
    const forecasts = await this.predictiveGapService.forecastTrends(body.topics);

    return {
      success: true,
      forecasts,
      emergingTopics: forecasts.filter(f => f.currentTrend === 'EMERGING'),
      decliningTopics: forecasts.filter(f => f.currentTrend === 'DECLINING'),
    };
  }

  // ============================================
  // PHASE 9 DAY 18: MULTI-MODAL TRANSCRIPTION
  // ============================================

  /**
   * Search YouTube with optional transcription and theme extraction
   */
  @Post('multimedia/youtube-search')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🎥 Search YouTube videos with optional transcription' })
  @ApiResponse({ status: 200, description: 'YouTube videos retrieved with optional transcripts and themes' })
  async searchYouTubeWithTranscription(
    @Body() body: {
      query: string;
      includeTranscripts?: boolean;
      extractThemes?: boolean;
      maxResults?: number;
    }
  ) {
    const videos = await this.literatureService.searchYouTubeWithTranscription(
      body.query,
      {
        includeTranscripts: body.includeTranscripts,
        extractThemes: body.extractThemes,
        maxResults: body.maxResults || 10,
      }
    );

    return {
      success: true,
      count: videos.length,
      videos,
      transcriptionCost: videos.reduce((sum, v) => sum + (v.transcript?.cost || 0), 0),
    };
  }

  /**
   * Get or create transcription for a video
   */
  @Post('multimedia/transcribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '📝 Transcribe video/podcast' })
  @ApiResponse({ status: 200, description: 'Transcription created/retrieved' })
  async transcribeMedia(
    @Body() body: {
      sourceId: string;
      sourceType: 'youtube' | 'podcast';
      sourceUrl?: string;
    }
  ) {
    const transcript = await this.transcriptionService.getOrCreateTranscription(
      body.sourceId,
      body.sourceType,
      body.sourceUrl
    );

    return {
      success: true,
      transcript,
    };
  }

  /**
   * Extract themes from transcript
   */
  @Post('multimedia/extract-themes')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🎯 Extract themes from transcript' })
  @ApiResponse({ status: 200, description: 'Themes extracted' })
  async extractThemesFromMultimedia(
    @Body() body: {
      transcriptId: string;
      researchContext?: string;
    }
  ) {
    const themes = await this.multimediaAnalysisService.extractThemesFromTranscript(
      body.transcriptId,
      body.researchContext
    );

    return {
      success: true,
      count: themes.length,
      themes,
    };
  }

  /**
   * Extract citations from transcript
   */
  @Post('multimedia/extract-citations')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '📚 Extract citations from transcript' })
  @ApiResponse({ status: 200, description: 'Citations extracted' })
  async extractCitations(
    @Body() body: { transcriptId: string }
  ) {
    const citations = await this.multimediaAnalysisService.extractCitationsFromTranscript(
      body.transcriptId
    );

    return {
      success: true,
      count: citations.length,
      citations,
    };
  }

  /**
   * Estimate transcription cost
   */
  @Post('multimedia/estimate-cost')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '💰 Estimate transcription cost' })
  @ApiResponse({ status: 200, description: 'Cost estimated' })
  async estimateCost(
    @Body() body: {
      sourceId: string;
      sourceType: 'youtube' | 'podcast';
    }
  ) {
    const estimate = await this.transcriptionService.estimateTranscriptionCost(
      body.sourceId,
      body.sourceType
    );

    return {
      success: true,
      ...estimate,
    };
  }

  /**
   * Add multimedia to knowledge graph
   */
  @Post('multimedia/add-to-graph')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🕸️ Add multimedia to knowledge graph' })
  @ApiResponse({ status: 200, description: 'Multimedia added to knowledge graph' })
  async addMultimediaToGraph(
    @Body() body: {
      transcriptId: string;
    }
  ) {
    // First get themes for the transcript
    const themes = await this.multimediaAnalysisService.getThemesForTranscript(
      body.transcriptId
    );

    // Add to knowledge graph
    const node = await this.knowledgeGraphService.addMultimediaNode(
      body.transcriptId,
      themes
    );

    return {
      success: true,
      node,
      themesConnected: themes.length,
    };
  }

  // ============================================
  // PHASE 9 DAY 20: UNIFIED THEME EXTRACTION
  // ============================================

  /**
   * Extract themes from multiple source types with full provenance tracking
   * Revolutionary feature: Unified theme extraction across papers, YouTube, podcasts, TikTok, Instagram
   */
  @Post('themes/unified-extract')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🎯 Extract unified themes from multiple source types (Phase 9 Day 20)',
    description: 'Extract themes from papers, videos, podcasts, and social media with full provenance tracking and citation chains',
  })
  @ApiResponse({
    status: 200,
    description: 'Unified themes extracted with provenance data',
  })
  async extractUnifiedThemes(
    @Body() dto: ExtractUnifiedThemesDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(
      `Extracting unified themes from ${dto.sources.length} sources (User: ${user.id})`,
    );

    const startTime = Date.now();

    // Map DTOs to service interface
    const sources = dto.sources.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title || '',
      content: s.content || '',
      keywords: s.keywords || [],
      author: s.metadata?.author,
      url: s.metadata?.url,
      doi: s.metadata?.doi,
      authors: s.metadata?.authors,
      year: s.metadata?.year,
      timestampedSegments: s.metadata?.timestampedSegments,
    }));

    // Extract themes from multiple sources
    const result = await this.unifiedThemeExtractionService.extractFromMultipleSources(
      sources,
      dto.options,
    );

    const duration = Date.now() - startTime;

    return {
      success: true,
      themes: result.themes,
      provenance: result.provenance,
      metadata: {
        totalSources: dto.sources.length,
        sourceBreakdown: dto.sources.reduce((acc, s) => {
          acc[s.type] = (acc[s.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        processingTimeMs: duration,
        themesExtracted: result.themes.length,
      },
    };
  }

  /**
   * Get full provenance data for a specific theme
   */
  @Get('themes/:themeId/provenance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '🔍 Get theme provenance with citation chain',
    description: 'Retrieve full provenance data showing which sources contributed to a theme',
  })
  @ApiResponse({
    status: 200,
    description: 'Theme provenance data with citation chain',
  })
  async getThemeProvenance(
    @Param('themeId') themeId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Fetching provenance for theme ${themeId} (User: ${user.id})`);

    const provenance = await this.unifiedThemeExtractionService.getThemeProvenance(
      themeId,
    );

    if (!provenance) {
      return {
        success: false,
        error: 'Theme not found or has no provenance data',
      };
    }

    return {
      success: true,
      provenance,
    };
  }

  /**
   * Filter themes by source types and influence
   */
  @Get('themes/filter')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '🔎 Filter themes by source type and influence',
    description: 'Get themes filtered by source type with minimum influence threshold',
  })
  @ApiResponse({
    status: 200,
    description: 'Filtered themes',
  })
  async filterThemesBySources(
    @Query('studyId') studyId: string,
    @Query('sourceType') sourceType?: string,
    @Query('minInfluence') minInfluence?: string,
    @CurrentUser() user?: any,
  ) {
    this.logger.log(
      `Filtering themes for study ${studyId}, sourceType=${sourceType}, minInfluence=${minInfluence}`,
    );

    const themes = await this.unifiedThemeExtractionService.getThemesBySources(
      studyId,
      sourceType,
      minInfluence ? parseFloat(minInfluence) : undefined,
    );

    return {
      success: true,
      count: themes.length,
      themes,
      filters: {
        studyId,
        sourceType,
        minInfluence: minInfluence ? parseFloat(minInfluence) : undefined,
      },
    };
  }

  /**
   * Get all themes for a collection with provenance
   */
  @Get('themes/collection/:collectionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '📚 Get themes for a collection',
    description: 'Retrieve all unified themes for a specific collection with provenance',
  })
  @ApiResponse({
    status: 200,
    description: 'Collection themes with provenance',
  })
  async getCollectionThemes(
    @Param('collectionId') collectionId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(
      `Fetching themes for collection ${collectionId} (User: ${user.id})`,
    );

    const themes = await this.unifiedThemeExtractionService.getCollectionThemes(
      collectionId,
    );

    return {
      success: true,
      collectionId,
      count: themes.length,
      themes,
      sourceBreakdown: themes.reduce(
        (
          acc: { papers: number; videos: number; podcasts: number; social: number },
          theme: any,
        ) => {
          if (theme.provenance) {
            acc.papers += theme.provenance.paperInfluence || 0;
            acc.videos += theme.provenance.videoInfluence || 0;
            acc.podcasts += theme.provenance.podcastInfluence || 0;
            acc.social += theme.provenance.socialInfluence || 0;
          }
          return acc;
        },
        { papers: 0, videos: 0, podcasts: 0, social: 0 },
      ),
    };
  }

  /**
   * Compare themes across multiple studies
   */
  @Post('themes/compare')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '📊 Compare themes across studies',
    description: 'Compare unified themes across multiple studies to find commonalities and differences',
  })
  @ApiResponse({
    status: 200,
    description: 'Theme comparison analysis',
  })
  async compareStudyThemes(
    @Body() dto: CompareStudyThemesDto,
    @CurrentUser() user: any,
  ) {
    this.logger.log(
      `Comparing themes across ${dto.studyIds.length} studies (User: ${user.id})`,
    );

    const comparison = await this.unifiedThemeExtractionService.compareStudyThemes(
      dto.studyIds,
    );

    return {
      success: true,
      studyIds: dto.studyIds,
      comparison,
      summary: {
        commonThemes: comparison.commonThemes?.length || 0,
        uniqueThemes: comparison.uniqueThemes?.length || 0,
        totalStudies: dto.studyIds.length,
      },
    };
  }
}
