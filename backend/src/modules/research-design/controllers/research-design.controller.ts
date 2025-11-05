import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ResearchQuestionService,
  QuestionAnalysisRequest,
  RefinedQuestion,
} from '../services/research-question.service';
import {
  HypothesisGeneratorService,
  HypothesisGenerationRequest,
  GeneratedHypothesis,
  TheoryDiagram,
  MethodologyRecommendation,
} from '../services/hypothesis-generator.service';
import {
  QuestionOperationalizationService,
  OperationalizationRequest,
  OperationalizationResult,
} from '../services/question-operationalization.service';
import {
  HypothesisToItemService,
  HypothesisToItemRequest,
  HypothesisToItemResult,
} from '../services/hypothesis-to-item.service';

/**
 * Phase 9.5 + Phase 10 Day 5.10 + Day 5.11: Research Design Intelligence Controller
 *
 * Endpoints for research question refinement, operationalization, and hypothesis testing
 */
@Controller('research-design')
@UseGuards(JwtAuthGuard)
export class ResearchDesignController {
  private readonly logger = new Logger(ResearchDesignController.name);

  constructor(
    private researchQuestionService: ResearchQuestionService,
    private hypothesisGeneratorService: HypothesisGeneratorService,
    private questionOperationalizationService: QuestionOperationalizationService,
    private hypothesisToItemService: HypothesisToItemService,
  ) {}

  /**
   * POST /research-design/refine-question
   * Refine research question using SQUARE-IT framework
   */
  @Post('refine-question')
  async refineQuestion(
    @Body() request: QuestionAnalysisRequest,
  ): Promise<RefinedQuestion> {
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
    @Body()
    request: {
      researchQuestion: string;
      themes: any[];
      knowledgeGraphData?: any;
    },
  ): Promise<TheoryDiagram> {
    this.logger.log(
      `Building theory diagram for: "${request.researchQuestion}"`,
    );
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
    @Body()
    request: {
      researchQuestion: string;
      hypotheses: GeneratedHypothesis[];
      themes: any[];
    },
  ): Promise<MethodologyRecommendation> {
    this.logger.log(
      `Recommending methodology for: "${request.researchQuestion}"`,
    );
    return this.hypothesisGeneratorService.recommendMethodology(
      request.researchQuestion,
      request.hypotheses,
      request.themes,
    );
  }

  /**
   * POST /research-design/question-to-items
   * Phase 10 Day 5.10: Operationalize research question into measurable survey items
   *
   * Converts theoretical research questions into:
   * - Identified constructs (IV, DV, moderators, mediators)
   * - Operationalized variables with measurement approaches
   * - Multi-item scales for reliability
   * - Statistical analysis recommendations
   * - Complete questionnaire items ready for import
   */
  @Post('question-to-items')
  async operationalizeQuestion(
    @Body() request: OperationalizationRequest,
  ): Promise<OperationalizationResult> {
    this.logger.log(
      `Operationalizing research question: "${request.researchQuestion}"`,
    );
    return this.questionOperationalizationService.operationalizeQuestion(
      request,
    );
  }

  /**
   * POST /research-design/hypothesis-to-items
   * Phase 10 Day 5.11: Convert hypothesis into testable survey measurement items
   *
   * Converts research hypotheses into:
   * - Parsed variables (IV, DV, moderators, mediators, covariates)
   * - Multi-item scales for each variable (reliability α ≥ 0.70)
   * - Complete hypothesis test battery
   * - Statistical analysis recommendations (regression, mediation, moderation)
   * - Validity assessment procedures
   * - Visual path diagram and statistical model
   *
   * Research Backing: Churchill (1979), Spector (1992), Baron & Kenny (1986)
   */
  @Post('hypothesis-to-items')
  async convertHypothesisToItems(
    @Body() request: HypothesisToItemRequest,
  ): Promise<HypothesisToItemResult> {
    this.logger.log(
      `Converting hypothesis to survey items: "${request.hypothesis}"`,
    );
    return this.hypothesisToItemService.convertHypothesisToItems(request);
  }
}
