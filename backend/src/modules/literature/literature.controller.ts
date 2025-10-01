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
} from '@nestjs/common';
import { LiteratureService } from './literature.service';
import { ReferenceService, CitationStyle } from './services/reference.service';
import { ThemeExtractionService } from './services/theme-extraction.service';
import { GapAnalyzerService } from './services/gap-analyzer.service';
import { ThemeToStatementService } from './services/theme-to-statement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  SearchLiteratureDto,
  SavePaperDto,
  ExportCitationsDto,
  ExtractThemesDto,
  AnalyzeGapsDto,
} from './dto/literature.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('literature')
@Controller('literature')
export class LiteratureController {
  constructor(
    private readonly literatureService: LiteratureService,
    private readonly referenceService: ReferenceService,
    private readonly themeExtractionService: ThemeExtractionService,
    private readonly gapAnalyzerService: GapAnalyzerService,
    private readonly themeToStatementService: ThemeToStatementService,
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
  async searchLiteraturePublic(
    @Body() searchDto: SearchLiteratureDto,
  ) {
    // Use a default user ID for public searches
    return await this.literatureService.searchLiterature(searchDto, 'public-user');
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
  async removePaperPublic(
    @Param('paperId') paperId: string,
  ) {
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
    return await this.literatureService.getUserLibrary('public-user', page, limit);
  }

  // Public theme extraction endpoint for development
  @Post('themes/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public extract themes for testing (dev only)' })
  @ApiResponse({ status: 200, description: 'Themes extracted' })
  async extractThemesPublic(
    @Body() themesDto: ExtractThemesDto,
  ) {
    // Use a default user ID for public theme extraction
    return await this.literatureService.extractThemes(
      themesDto.paperIds,
      'public-user',
    );
  }

  @Get('gaps')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze research gaps in a field' })
  @ApiResponse({ status: 200, description: 'Gap analysis complete' })
  async analyzeGapsField(
    @Query() analysisDto: AnalyzeGapsDto,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.analyzeResearchGaps(
      analysisDto,
      user.id,
    );
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
    return await this.literatureService.extractThemes(
      themesDto.paperIds,
      user.id,
    );
  }

  @Post('pipeline/themes-to-statements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Full pipeline: Extract themes and generate statements with provenance',
    description: 'Processes literature through complete pipeline with citation tracking'
  })
  @ApiResponse({ status: 200, description: 'Statements generated with provenance' })
  async extractThemesAndGenerateStatements(
    @Body() dto: {
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
    const themes = await this.themeExtractionService.extractThemes(dto.paperIds);

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
    description: 'Test the full pipeline without authentication'
  })
  @ApiResponse({ status: 200, description: 'Statements generated with provenance' })
  async extractThemesAndGenerateStatementsPublic(
    @Body() dto: {
      paperIds: string[];
      studyContext?: {
        targetStatements?: number;
        academicLevel?: 'basic' | 'intermediate' | 'advanced';
        studyId?: string;
      };
    },
  ) {
    // Extract themes with AI
    const themes = await this.themeExtractionService.extractThemes(dto.paperIds);

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
    description: 'Generates research questions, hypotheses, objectives, and method suggestions'
  })
  @ApiResponse({ status: 200, description: 'Study scaffolding created' })
  async createStudyScaffolding(
    @Body() dto: {
      paperIds: string[];
      includeGapAnalysis?: boolean;
      targetStatements?: number;
      academicLevel?: 'basic' | 'intermediate' | 'advanced';
    },
    @CurrentUser() user: any,
  ) {
    // Extract themes
    const themes = await this.themeExtractionService.extractThemes(dto.paperIds, user.id);

    // Analyze gaps if requested
    let researchGaps: any[] = [];
    if (dto.includeGapAnalysis) {
      const gaps = await this.gapAnalyzerService.analyzeResearchGaps(
        dto.paperIds
      );
      researchGaps = gaps || [];
    }

    // Create study scaffolding
    const scaffolding = await this.themeToStatementService.createStudyScaffolding(
      researchGaps,
      themes
    );

    // Map themes to statements
    const statementMappings = await this.themeToStatementService.mapThemesToStatements(
      themes,
      {
        targetStatements: dto.targetStatements || 40,
        academicLevel: dto.academicLevel || 'intermediate',
        includeControversyPairs: true,
      }
    );

    return {
      themes,
      researchGaps,
      scaffolding,
      statementMappings,
      summary: {
        totalThemes: themes.length,
        controversialThemes: themes.filter(t => t.controversial).length,
        totalStatements: statementMappings.reduce((acc, m) => acc + m.statements.length, 0),
        researchQuestions: scaffolding.researchQuestions?.length || 0,
        hypotheses: scaffolding.hypotheses?.length || 0,
      },
    };
  }

  @Post('pipeline/create-study-scaffolding/public')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public endpoint for study scaffolding (dev only)',
    description: 'Test study scaffolding without authentication'
  })
  @ApiResponse({ status: 200, description: 'Study scaffolding created' })
  async createStudyScaffoldingPublic(
    @Body() dto: {
      paperIds: string[];
      includeGapAnalysis?: boolean;
      targetStatements?: number;
      academicLevel?: 'basic' | 'intermediate' | 'advanced';
    },
  ) {
    // Extract themes
    const themes = await this.themeExtractionService.extractThemes(dto.paperIds);

    // Analyze gaps if requested
    let researchGaps: any[] = [];
    if (dto.includeGapAnalysis) {
      const gaps = await this.gapAnalyzerService.analyzeResearchGaps(
        dto.paperIds
      );
      researchGaps = gaps || [];
    }

    // Create study scaffolding
    const scaffolding = await this.themeToStatementService.createStudyScaffolding(
      researchGaps,
      themes
    );

    // Map themes to statements
    const statementMappings = await this.themeToStatementService.mapThemesToStatements(
      themes,
      {
        targetStatements: dto.targetStatements || 40,
        academicLevel: dto.academicLevel || 'intermediate',
        includeControversyPairs: true,
      }
    );

    return {
      themes,
      researchGaps,
      scaffolding,
      statementMappings,
      summary: {
        totalThemes: themes.length,
        controversialThemes: themes.filter(t => t.controversial).length,
        totalStatements: statementMappings.reduce((acc, m) => acc + m.statements.length, 0),
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
    @Query('sources') sources: string[],
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.searchAlternativeSources(
      query,
      sources,
      user.id,
    );
  }

  @Post('knowledge-graph')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Build knowledge graph from papers' })
  @ApiResponse({ status: 200, description: 'Knowledge graph built' })
  async buildKnowledgeGraph(
    @Body() paperIds: string[],
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.buildKnowledgeGraph(paperIds, user.id);
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
}
