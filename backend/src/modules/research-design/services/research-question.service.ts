import { Injectable, Logger } from '@nestjs/common';
import { UnifiedAIService } from '../../ai/services/unified-ai.service';
import { PrismaService } from '../../../common/prisma.service';

/**
 * Phase 9.5: Research Design Intelligence
 *
 * ResearchQuestionService - AI-powered research question refinement with SQUARE-IT framework
 *
 * Revolutionary Features:
 * - SQUARE-IT Framework: Specific, Quantifiable, Usable, Accurate, Restricted, Eligible, Investigable, Timely
 * - Sub-question decomposition with gap mapping
 * - Quality scoring and validation
 * - Integration with Phase 9 literature discoveries
 *
 * Patent Potential: TIER 1 - "AI-Powered Research Design from Multi-Source Literature Synthesis"
 */

export interface SQUAREITScore {
  specific: number; // 0-10: How specific is the question?
  quantifiable: number; // 0-10: Can variables be measured?
  usable: number; // 0-10: Will results contribute to knowledge?
  accurate: number; // 0-10: Is the problem definition precise?
  restricted: number; // 0-10: Is scope appropriately focused?
  eligible: number; // 0-10: Is Q-methodology suitable?
  investigable: number; // 0-10: Is it feasible with available resources?
  timely: number; // 0-10: Is the gap still relevant?
  overall: number; // Average of all dimensions
  details: {
    specificReasoning: string;
    quantifiableReasoning: string;
    usableReasoning: string;
    accurateReasoning: string;
    restrictedReasoning: string;
    eligibleReasoning: string;
    investigableReasoning: string;
    timelyReasoning: string;
  };
}

export interface RefinedQuestion {
  id: string;
  originalQuestion: string;
  refinedQuestion: string;
  squareitScore: SQUAREITScore;
  supportingPapers: Array<{
    id: string;
    title: string;
    doi?: string;
    relevance: string;
  }>;
  gaps: Array<{
    id: string;
    description: string;
    importance: number;
  }>;
  subQuestions: SubQuestion[];
  improvementSuggestions: string[];
  confidenceScore: number; // 0-1
  createdAt: Date;
}

export interface SubQuestion {
  id: string;
  question: string;
  gapIds: string[];
  priority: number; // 1-10 (feasibility × impact × novelty)
  feasibility: number; // 0-10
  impact: number; // 0-10
  novelty: number; // 0-10
}

export interface QuestionAnalysisRequest {
  question: string;
  literatureSummary?: {
    papers: any[];
    themes: any[];
    gaps: any[];
  };
  domain?: string;
  methodology?:
    | 'q-methodology'
    | 'mixed-methods'
    | 'qualitative'
    | 'quantitative';
}

@Injectable()
export class ResearchQuestionService {
  private readonly logger = new Logger(ResearchQuestionService.name);
  private readonly maxRetries = 3;
  private readonly costPerRefinement = 0.05; // $0.05 budget per question
  private questionCache = new Map<string, RefinedQuestion>();

  constructor(
    private prisma: PrismaService,
    private unifiedAIService: UnifiedAIService,
  ) {}

  /**
   * Main method: Refine research question using SQUARE-IT framework
   * Integration point with Phase 9 literature discoveries
   */
  async refineQuestion(
    request: QuestionAnalysisRequest,
  ): Promise<RefinedQuestion> {
    // Check cache first
    const cacheKey = this.getCacheKey(request);
    if (this.questionCache.has(cacheKey)) {
      this.logger.log(`Cache hit for question refinement`);
      return this.questionCache.get(cacheKey)!;
    }

    this.logger.log(`Refining research question: "${request.question}"`);

    try {
      // Step 1: Analyze question with SQUARE-IT framework
      const squareitScore = await this.evaluateSQUAREIT(request);

      // Step 2: Generate refined question(s)
      const refinedQuestions = await this.generateRefinements(
        request,
        squareitScore,
      );

      // Step 3: Decompose into sub-questions
      const subQuestions = await this.decomposeIntoSubQuestions(
        refinedQuestions[0],
        request.literatureSummary?.gaps || [],
      );

      // Step 4: Map to literature gaps
      const gaps = this.mapToGaps(
        subQuestions,
        request.literatureSummary?.gaps || [],
      );

      // Step 5: Identify supporting papers
      const supportingPapers = this.identifySupportingPapers(
        refinedQuestions[0],
        request.literatureSummary?.papers || [],
      );

      // Step 6: Generate improvement suggestions
      const improvementSuggestions =
        this.generateImprovementSuggestions(squareitScore);

      const result: RefinedQuestion = {
        id: `rq_${Date.now()}`,
        originalQuestion: request.question,
        refinedQuestion: refinedQuestions[0],
        squareitScore,
        supportingPapers,
        gaps,
        subQuestions,
        improvementSuggestions,
        confidenceScore: squareitScore.overall / 10,
        createdAt: new Date(),
      };

      // Cache result
      this.questionCache.set(cacheKey, result);

      // Track cost
      await this.trackCost(request.question, 'question_refinement');

      return result;
    } catch (error: any) {
      this.logger.error(
        `Failed to refine question: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Evaluate question using SQUARE-IT framework
   */
  private async evaluateSQUAREIT(
    request: QuestionAnalysisRequest,
  ): Promise<SQUAREITScore> {
    const prompt = `Evaluate the following research question using the SQUARE-IT framework:

Question: "${request.question}"
Domain: ${request.domain || 'Not specified'}
Methodology: ${request.methodology || 'Not specified'}

${
  request.literatureSummary
    ? `
Literature Context:
- ${request.literatureSummary.papers?.length || 0} papers reviewed
- ${request.literatureSummary.themes?.length || 0} themes identified
- ${request.literatureSummary.gaps?.length || 0} research gaps found
`
    : ''
}

SQUARE-IT Criteria (score each 0-10 and provide reasoning):
1. Specific: Is the question narrow and focused enough?
2. Quantifiable: Can the variables be measured or categorized?
3. Usable: Will the results contribute to knowledge in the field?
4. Accurate: Is the problem definition precise and well-defined?
5. Restricted: Is the scope appropriately limited (domain/method/population)?
6. Eligible: Is ${request.methodology || 'the chosen methodology'} suitable for this question?
7. Investigable: Is it feasible with available time, resources, and sample access?
8. Timely: Is this research gap still relevant and unexplored?

Return a JSON object with this structure:
{
  "specific": <score 0-10>,
  "specificReasoning": "<explanation>",
  "quantifiable": <score 0-10>,
  "quantifiableReasoning": "<explanation>",
  "usable": <score 0-10>,
  "usableReasoning": "<explanation>",
  "accurate": <score 0-10>,
  "accurateReasoning": "<explanation>",
  "restricted": <score 0-10>,
  "restrictedReasoning": "<explanation>",
  "eligible": <score 0-10>,
  "eligibleReasoning": "<explanation>",
  "investigable": <score 0-10>,
  "investigableReasoning": "<explanation>",
  "timely": <score 0-10>,
  "timelyReasoning": "<explanation>"
}`;

    try {
      // Phase 10.195: Use UnifiedAIService for SQUARE-IT evaluation
      const response = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.3,
        systemPrompt: 'You are an expert research methodology advisor specializing in Q-methodology and research design. Provide objective, evidence-based evaluations.',
        jsonMode: true,
      });

      const content = response.content;
      if (!content) {
        throw new Error('Empty response from AI service');
      }

      const scores = JSON.parse(content);

      const overall =
        (scores.specific +
          scores.quantifiable +
          scores.usable +
          scores.accurate +
          scores.restricted +
          scores.eligible +
          scores.investigable +
          scores.timely) /
        8;

      return {
        ...scores,
        overall,
        details: {
          specificReasoning: scores.specificReasoning,
          quantifiableReasoning: scores.quantifiableReasoning,
          usableReasoning: scores.usableReasoning,
          accurateReasoning: scores.accurateReasoning,
          restrictedReasoning: scores.restrictedReasoning,
          eligibleReasoning: scores.eligibleReasoning,
          investigableReasoning: scores.investigableReasoning,
          timelyReasoning: scores.timelyReasoning,
        },
      };
    } catch (error: any) {
      this.logger.error(`SQUARE-IT evaluation failed: ${error.message}`);
      return this.getFallbackSQUAREITScore();
    }
  }

  /**
   * Generate refined question variations
   */
  private async generateRefinements(
    request: QuestionAnalysisRequest,
    squareitScore: SQUAREITScore,
  ): Promise<string[]> {
    const weakPoints = this.identifyWeakPoints(squareitScore);

    const prompt = `Refine this research question to improve its quality:

Original Question: "${request.question}"

SQUARE-IT Scores:
- Specific: ${squareitScore.specific}/10 (${squareitScore.details.specificReasoning})
- Quantifiable: ${squareitScore.quantifiable}/10
- Usable: ${squareitScore.usable}/10
- Accurate: ${squareitScore.accurate}/10
- Restricted: ${squareitScore.restricted}/10
- Eligible: ${squareitScore.eligible}/10 (for ${request.methodology || 'Q-methodology'})
- Investigable: ${squareitScore.investigable}/10
- Timely: ${squareitScore.timely}/10

Weak Points to Address: ${weakPoints.join(', ')}

${
  request.literatureSummary?.gaps && request.literatureSummary.gaps.length > 0
    ? `
Research Gaps Identified:
${request.literatureSummary.gaps
  .slice(0, 5)
  .map(
    (gap: any, i: number) =>
      `${i + 1}. ${gap.description || gap.name || 'Gap ' + gap.id}`,
  )
  .join('\n')}
`
    : ''
}

Generate 3-5 refined versions of this question that:
1. Address the weak SQUARE-IT dimensions
2. Incorporate insights from the identified research gaps
3. Are suitable for ${request.methodology || 'Q-methodology'} research
4. Maintain the core intent of the original question

Return JSON array: ["refined question 1", "refined question 2", ...]`;

    try {
      // Phase 10.195: Use UnifiedAIService for question refinement
      const response = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.7,
        systemPrompt: 'You are an expert research methodology advisor. Generate clear, specific, and researchable questions.',
        jsonMode: true,
      });

      const content = response.content;
      if (!content) {
        return [request.question];
      }

      const parsed = JSON.parse(content);
      const refinedQuestions = Array.isArray(parsed.questions)
        ? parsed.questions
        : parsed.refinedQuestions || [request.question];

      return refinedQuestions;
    } catch (error: any) {
      this.logger.error(`Question refinement failed: ${error.message}`);
      return [request.question];
    }
  }

  /**
   * Decompose main question into sub-questions
   */
  private async decomposeIntoSubQuestions(
    mainQuestion: string,
    gaps: any[],
  ): Promise<SubQuestion[]> {
    const prompt = `Decompose this research question into 3-7 focused sub-questions:

Main Question: "${mainQuestion}"

Research Gaps Context:
${gaps
  .slice(0, 5)
  .map(
    (gap: any, i: number) =>
      `${i + 1}. ${gap.description || gap.name || 'Gap ' + gap.id}`,
  )
  .join('\n')}

Generate sub-questions that:
1. Each address a specific aspect of the main question
2. Map to one or more identified research gaps
3. Are independently investigable
4. Together comprehensively cover the main question

For each sub-question, provide:
- The question text
- Gap IDs it addresses (from the list above, 1-indexed)
- Feasibility score (0-10): How easy to investigate?
- Impact score (0-10): How important is this aspect?
- Novelty score (0-10): How unexplored is this?

Return JSON: {
  "subQuestions": [
    {
      "question": "...",
      "gapIndices": [1, 3],
      "feasibility": 8,
      "impact": 9,
      "novelty": 7
    },
    ...
  ]
}`;

    try {
      // Phase 10.195: Use UnifiedAIService for sub-question decomposition
      const response = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.5,
        systemPrompt: 'You are an expert at breaking down complex research questions into manageable sub-questions.',
        jsonMode: true,
      });

      const content = response.content;
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      const subQuestions = parsed.subQuestions || [];

      return subQuestions.map((sq: any, index: number) => ({
        id: `sq_${Date.now()}_${index}`,
        question: sq.question,
        gapIds: (sq.gapIndices || []).map(
          (i: number) => gaps[i - 1]?.id || `gap_${i}`,
        ),
        feasibility: sq.feasibility || 5,
        impact: sq.impact || 5,
        novelty: sq.novelty || 5,
        priority: Math.round((sq.feasibility + sq.impact + sq.novelty) / 3),
      }));
    } catch (error: any) {
      this.logger.error(`Sub-question decomposition failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Map sub-questions to literature gaps
   */
  private mapToGaps(
    subQuestions: SubQuestion[],
    gaps: any[],
  ): Array<{
    id: string;
    description: string;
    importance: number;
  }> {
    const uniqueGapIds = new Set<string>();
    subQuestions.forEach((sq) => {
      sq.gapIds.forEach((gapId) => uniqueGapIds.add(gapId));
    });

    return gaps
      .filter((gap) => uniqueGapIds.has(gap.id))
      .map((gap) => ({
        id: gap.id,
        description: gap.description || gap.name || 'Research gap',
        importance: gap.importance || gap.citationCount || 5,
      }));
  }

  /**
   * Identify papers that support the refined question
   */
  private identifySupportingPapers(
    question: string,
    papers: any[],
  ): Array<{
    id: string;
    title: string;
    doi?: string;
    relevance: string;
  }> {
    // Simple keyword matching - can be enhanced with semantic similarity
    const questionWords = question.toLowerCase().split(/\W+/);

    return papers
      .map((paper) => {
        const titleWords = (paper.title || '').toLowerCase().split(/\W+/);
        const matchCount = questionWords.filter(
          (word) =>
            word.length > 3 &&
            titleWords.some((tw: string) => tw.includes(word)),
        ).length;

        return {
          paper,
          matchCount,
          relevance:
            matchCount > 2
              ? 'High relevance'
              : matchCount > 0
                ? 'Medium relevance'
                : 'Low relevance',
        };
      })
      .filter((p) => p.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 10)
      .map((p) => ({
        id: p.paper.id || p.paper.doi || `paper_${Date.now()}`,
        title: p.paper.title || 'Untitled',
        doi: p.paper.doi,
        relevance: p.relevance,
      }));
  }

  /**
   * Generate suggestions for improving the question
   */
  private generateImprovementSuggestions(
    squareitScore: SQUAREITScore,
  ): string[] {
    const suggestions: string[] = [];

    if (squareitScore.specific < 7) {
      suggestions.push(
        'Consider narrowing the scope by specifying the population, context, or timeframe',
      );
    }
    if (squareitScore.quantifiable < 7) {
      suggestions.push(
        'Identify specific variables or constructs that can be measured or categorized',
      );
    }
    if (squareitScore.usable < 7) {
      suggestions.push(
        'Clarify how the findings will contribute to theory or practice in your field',
      );
    }
    if (squareitScore.accurate < 7) {
      suggestions.push(
        'Refine the problem definition to be more precise and unambiguous',
      );
    }
    if (squareitScore.restricted < 7) {
      suggestions.push(
        'Further limit the scope to make the study more feasible',
      );
    }
    if (squareitScore.eligible < 7) {
      suggestions.push(
        'Ensure Q-methodology is the most appropriate approach for this question',
      );
    }
    if (squareitScore.investigable < 7) {
      suggestions.push(
        'Consider resource constraints (time, budget, sample access) when refining',
      );
    }
    if (squareitScore.timely < 7) {
      suggestions.push(
        'Verify this research gap is still current by checking recent publications',
      );
    }

    return suggestions;
  }

  /**
   * Identify weak dimensions in SQUARE-IT score
   */
  private identifyWeakPoints(score: SQUAREITScore): string[] {
    const weakPoints: string[] = [];
    const threshold = 7;

    if (score.specific < threshold) weakPoints.push('Specific');
    if (score.quantifiable < threshold) weakPoints.push('Quantifiable');
    if (score.usable < threshold) weakPoints.push('Usable');
    if (score.accurate < threshold) weakPoints.push('Accurate');
    if (score.restricted < threshold) weakPoints.push('Restricted');
    if (score.eligible < threshold) weakPoints.push('Eligible');
    if (score.investigable < threshold) weakPoints.push('Investigable');
    if (score.timely < threshold) weakPoints.push('Timely');

    return weakPoints.length > 0
      ? weakPoints
      : ['None - question is well-formed'];
  }

  /**
   * Fallback SQUARE-IT score when AI is unavailable
   */
  private getFallbackSQUAREITScore(): SQUAREITScore {
    return {
      specific: 5,
      quantifiable: 5,
      usable: 5,
      accurate: 5,
      restricted: 5,
      eligible: 5,
      investigable: 5,
      timely: 5,
      overall: 5,
      details: {
        specificReasoning: 'AI unavailable - manual review needed',
        quantifiableReasoning: 'AI unavailable - manual review needed',
        usableReasoning: 'AI unavailable - manual review needed',
        accurateReasoning: 'AI unavailable - manual review needed',
        restrictedReasoning: 'AI unavailable - manual review needed',
        eligibleReasoning: 'AI unavailable - manual review needed',
        investigableReasoning: 'AI unavailable - manual review needed',
        timelyReasoning: 'AI unavailable - manual review needed',
      },
    };
  }

  /**
   * Generate cache key for question
   */
  private getCacheKey(request: QuestionAnalysisRequest): string {
    return `question_${request.question.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Track AI usage cost
   */
  private async trackCost(question: string, operation: string): Promise<void> {
    try {
      // This integrates with existing AIUsage model from Phase 6.86b
      // For now, just log the cost
      this.logger.log(
        `AI cost tracking: ${operation} for question "${question.substring(0, 50)}..."`,
      );
    } catch (error: any) {
      this.logger.warn(`Failed to track AI cost: ${error.message}`);
    }
  }
}
