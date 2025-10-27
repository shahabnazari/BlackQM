import { Controller, Post, Body, Get, Param, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ResearchQuestionService, QuestionAnalysisRequest, RefinedQuestion } from '../services/research-question.service';
import { HypothesisGeneratorService, HypothesisGenerationRequest, GeneratedHypothesis, TheoryDiagram, MethodologyRecommendation } from '../services/hypothesis-generator.service';

/**
 * Phase 9.5: Research Design Intelligence Controller
 *
 * Endpoints for research question refinement and hypothesis generation
 */
@Controller('research-design')
@UseGuards(JwtAuthGuard)
export class ResearchDesignController {
  private readonly logger = new Logger(ResearchDesignController.name);

  constructor(
    private researchQuestionService: ResearchQuestionService,
    private hypothesisGeneratorService: HypothesisGeneratorService,
  ) {}

  /**
   * POST /research-design/refine-question
   * Refine research question using SQUARE-IT framework
   */
  @Post('refine-question')
  async refineQuestion(@Body() request: QuestionAnalysisRequest): Promise<RefinedQuestion> {
    this.logger.log(`Refining question: "${request.question}"`);
    return this.researchQuestionService.refineQuestion(request);
  }

  /**
   * POST /research-design/generate-hypotheses
   * Generate hypotheses from contradictions, gaps, and trends
   */
  @Post('generate-hypotheses')
  async generateHypotheses(
    @Body() request: HypothesisGenerationRequest,
  ): Promise<GeneratedHypothesis[]> {
    this.logger.log(`Generating hypotheses for: "${request.researchQuestion}"`);
    return this.hypothesisGeneratorService.generateHypotheses(request);
  }

  /**
   * POST /research-design/build-theory-diagram
   * Build conceptual framework from themes
   */
  @Post('build-theory-diagram')
  async buildTheoryDiagram(
    @Body() request: { researchQuestion: string; themes: any[]; knowledgeGraphData?: any },
  ): Promise<TheoryDiagram> {
    this.logger.log(`Building theory diagram for: "${request.researchQuestion}"`);
    return this.hypothesisGeneratorService.buildTheoryDiagram(
      request.researchQuestion,
      request.themes,
      request.knowledgeGraphData,
    );
  }

  /**
   * POST /research-design/recommend-methodology
   * Get methodology recommendation with Q-methodology optimization
   */
  @Post('recommend-methodology')
  async recommendMethodology(
    @Body() request: { researchQuestion: string; hypotheses: GeneratedHypothesis[]; themes: any[] },
  ): Promise<MethodologyRecommendation> {
    this.logger.log(`Recommending methodology for: "${request.researchQuestion}"`);
    return this.hypothesisGeneratorService.recommendMethodology(
      request.researchQuestion,
      request.hypotheses,
      request.themes,
    );
  }
}
