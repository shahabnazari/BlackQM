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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LiteratureController {
  constructor(
    private readonly literatureService: LiteratureService,
    private readonly referenceService: ReferenceService,
    private readonly themeExtractionService: ThemeExtractionService,
    private readonly gapAnalyzerService: GapAnalyzerService,
  ) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search literature across multiple databases' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  async searchLiterature(
    @Body() searchDto: SearchLiteratureDto,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.searchLiterature(
      searchDto,
      user.id,
    );
  }

  @Get('gaps')
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
  @ApiOperation({ summary: 'Save paper to user library' })
  @ApiResponse({ status: 201, description: 'Paper saved successfully' })
  async savePaper(
    @Body() saveDto: SavePaperDto,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.savePaper(
      saveDto,
      user.id,
    );
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export citations in various formats' })
  @ApiResponse({ status: 200, description: 'Citations exported' })
  async exportCitations(
    @Body() exportDto: ExportCitationsDto,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.exportCitations(
      exportDto,
      user.id,
    );
  }

  @Get('library')
  @ApiOperation({ summary: 'Get user\'s saved papers' })
  @ApiResponse({ status: 200, description: 'User library returned' })
  async getUserLibrary(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.getUserLibrary(
      user.id,
      page,
      limit,
    );
  }

  @Delete('library/:paperId')
  @ApiOperation({ summary: 'Remove paper from library' })
  @ApiResponse({ status: 200, description: 'Paper removed' })
  async removePaper(
    @Param('paperId') paperId: string,
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.removePaper(paperId, user.id);
  }

  @Post('themes')
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

  @Get('social')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Build knowledge graph from papers' })
  @ApiResponse({ status: 200, description: 'Knowledge graph built' })
  async buildKnowledgeGraph(
    @Body() paperIds: string[],
    @CurrentUser() user: any,
  ) {
    return await this.literatureService.buildKnowledgeGraph(
      paperIds,
      user.id,
    );
  }

  @Get('recommendations/:studyId')
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
    return await this.literatureService.getCitationNetwork(
      paperId,
      depth,
    );
  }

  @Post('statements/generate')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract themes from literature using AI' })
  @ApiResponse({ status: 200, description: 'Themes extracted with controversy detection' })
  async extractThemesWithAI(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    return await this.themeExtractionService.extractThemes(body.paperIds);
  }

  @Post('controversies/detect')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate statement hints from themes' })
  @ApiResponse({ status: 200, description: 'Statement hints generated' })
  async generateStatementHints(
    @Body() body: { themes: any[] },
    @CurrentUser() user: any,
  ) {
    return await this.themeExtractionService.generateStatementHints(body.themes);
  }

  // Gap Analysis Endpoints
  @Post('gaps/analyze')
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract and analyze keywords from papers' })
  @ApiResponse({ status: 200, description: 'Keywords analyzed' })
  async analyzeKeywords(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    const papers = await this.gapAnalyzerService['fetchPapersWithMetadata'](body.paperIds);
    return await this.gapAnalyzerService.extractAndAnalyzeKeywords(papers);
  }

  @Post('gaps/trends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detect trends in research topics' })
  @ApiResponse({ status: 200, description: 'Trends detected' })
  async detectTrends(
    @Body() body: { paperIds: string[] },
    @CurrentUser() user: any,
  ) {
    const papers = await this.gapAnalyzerService['fetchPapersWithMetadata'](body.paperIds);
    const keywords = await this.gapAnalyzerService.extractAndAnalyzeKeywords(papers);
    return await this.gapAnalyzerService.detectTrends(papers, keywords);
  }

  @Post('gaps/topics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform topic modeling on papers' })
  @ApiResponse({ status: 200, description: 'Topics modeled' })
  async modelTopics(
    @Body() body: { paperIds: string[]; numTopics?: number },
    @CurrentUser() user: any,
  ) {
    const papers = await this.gapAnalyzerService['fetchPapersWithMetadata'](body.paperIds);
    return await this.gapAnalyzerService.performTopicModeling(papers, body.numTopics);
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
  async formatCitation(
    @Body() body: { paper: any; style: CitationStyle },
  ) {
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
    return await this.referenceService.syncWithZotero(
      body.apiKey,
      user.id,
    );
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