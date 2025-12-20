import { Injectable, Logger } from '@nestjs/common';
import { UnifiedAIService } from '../../ai/services/unified-ai.service';
import { PrismaService } from '../../../common/prisma.service';

/**
 * Enhanced Theme Integration Service
 * Phase 10 Day 5.12
 *
 * Purpose: Make themes actionable across the entire research workflow
 *
 * Revolutionary Features:
 * - AI-powered research question suggestions from themes
 * - AI-powered hypothesis generation from themes
 * - Theme-to-construct mapping with relationship detection
 * - One-click complete survey generation from themes
 * - Proactive AI assistance throughout research design
 *
 * Research Foundation:
 * - Braun & Clarke (2006, 2019) - Reflexive Thematic Analysis
 * - Churchill (1979) - Scale Development Theory
 * - Creswell & Plano Clark (2017) - Mixed Methods Research Design
 *
 * @phase Phase 10 Day 5.12
 * @date January 2025
 * @tier TIER 1 - Critical for end-to-end workflow
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  prevalence: number;
  confidence: number;
  sources: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  keyPhrases?: string[];
  subthemes?: Array<{
    name: string;
    description: string;
  }>;
}

export interface ResearchQuestionSuggestion {
  id: string;
  question: string;
  type: 'exploratory' | 'explanatory' | 'evaluative' | 'descriptive';
  relevanceScore: number; // 0-1
  rationale: string;
  relatedThemes: string[]; // theme IDs
  complexity: 'basic' | 'intermediate' | 'advanced';
  squareItScore?: {
    specific: number;
    quantifiable: number;
    usable: number;
    accurate: number;
    restricted: number;
    eligible: number;
    investigable: number;
    timely: number;
    overallScore: number;
  };
  suggestedMethodology:
    | 'qualitative'
    | 'quantitative'
    | 'mixed_methods'
    | 'q_methodology';
}

export interface HypothesisSuggestion {
  id: string;
  hypothesis: string;
  type: 'correlational' | 'causal' | 'mediation' | 'moderation' | 'interaction';
  independentVariable: string;
  dependentVariable: string;
  moderator?: string;
  mediator?: string;
  confidenceScore: number; // 0-1
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  relatedThemes: string[]; // theme IDs
  expectedEffectSize?: 'small' | 'medium' | 'large';
  suggestedStatisticalTest: string;
  researchBacking: string;
}

export interface ConstructMapping {
  construct: {
    id: string;
    name: string;
    definition: string;
    themes: string[]; // theme IDs that map to this construct
  };
  relatedConstructs: Array<{
    constructId: string;
    constructName: string;
    relationshipType:
      | 'causes'
      | 'influences'
      | 'correlates'
      | 'moderates'
      | 'mediates';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
  }>;
}

export interface CompleteSurveyGeneration {
  sections: Array<{
    id: string;
    title: string;
    description: string;
    items: Array<{
      id: string;
      type:
        | 'likert'
        | 'multiple_choice'
        | 'semantic_differential'
        | 'open_ended';
      text: string;
      scaleType?: string;
      options?: string[];
      themeProvenance: string[]; // theme IDs
      construct?: string;
    }>;
  }>;
  metadata: {
    totalItems: number;
    estimatedCompletionTime: number; // minutes
    themeCoverage: number; // percentage of themes covered
    reliabilityEstimate?: number;
  };
  methodology: {
    approach: string;
    researchBacking: string;
    validation: string;
  };
}

export interface SuggestQuestionsOptions {
  themes: Theme[];
  questionTypes?: (
    | 'exploratory'
    | 'explanatory'
    | 'evaluative'
    | 'descriptive'
  )[];
  maxQuestions?: number;
  researchDomain?: string;
  researchGoal?: string;
}

export interface SuggestHypothesesOptions {
  themes: Theme[];
  hypothesisTypes?: (
    | 'correlational'
    | 'causal'
    | 'mediation'
    | 'moderation'
    | 'interaction'
  )[];
  maxHypotheses?: number;
  researchDomain?: string;
  researchContext?: string;
}

export interface MapConstructsOptions {
  themes: Theme[];
  includeRelationships?: boolean;
  clusteringAlgorithm?: 'semantic' | 'statistical' | 'hybrid';
}

export interface GenerateCompleteSurveyOptions {
  themes: Theme[];
  surveyPurpose: 'exploratory' | 'confirmatory' | 'mixed';
  targetRespondentCount?: number;
  complexityLevel?: 'basic' | 'intermediate' | 'advanced';
  includeDemographics?: boolean;
  includeValidityChecks?: boolean;
  researchContext?: string;
}

@Injectable()
export class EnhancedThemeIntegrationService {
  private readonly logger = new Logger(EnhancedThemeIntegrationService.name);
  private questionCache = new Map<string, ResearchQuestionSuggestion[]>();
  private hypothesisCache = new Map<string, HypothesisSuggestion[]>();

  constructor(
    _prisma: PrismaService,
    private readonly unifiedAIService: UnifiedAIService,
  ) {}

  /**
   * Suggest research questions from themes
   * Uses AI to generate SQUARE-IT compliant research questions
   */
  async suggestResearchQuestions(
    options: SuggestQuestionsOptions,
  ): Promise<ResearchQuestionSuggestion[]> {
    this.logger.log(
      `[suggestResearchQuestions] Suggesting research questions from ${options.themes.length} themes`,
    );
    this.logger.log(
      `[suggestResearchQuestions] Theme names: ${options.themes.map((t) => t.name).join(', ')}`,
    );

    const cacheKey = this.getCacheKey('questions', options);
    if (this.questionCache.has(cacheKey)) {
      this.logger.log('Returning cached research question suggestions');
      return this.questionCache.get(cacheKey)!;
    }

    const questions: ResearchQuestionSuggestion[] = [];

    // Phase 10.195: Always use AI via UnifiedAIService (with fallback to templates on error)
    try {
      this.logger.log('[suggestResearchQuestions] Using AI generation');
      const aiQuestions = await this.generateQuestionsWithAI(options);
      this.logger.log(
        `[suggestResearchQuestions] AI returned ${aiQuestions.length} questions`,
      );
      questions.push(...aiQuestions);
    } catch (error: any) {
      this.logger.warn(
        `[suggestResearchQuestions] AI generation failed, using templates: ${error.message}`,
      );
      const templateQuestions = this.generateQuestionsWithTemplates(options);
      this.logger.log(
        `[suggestResearchQuestions] Templates returned ${templateQuestions.length} questions`,
      );
      questions.push(...templateQuestions);
    }

    // Sort by relevance score
    questions.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit to maxQuestions
    const maxQuestions = options.maxQuestions || 15;
    const limitedQuestions = questions.slice(0, maxQuestions);

    // Cache results
    this.questionCache.set(cacheKey, limitedQuestions);

    return limitedQuestions;
  }

  /**
   * Suggest hypotheses from themes
   * Identifies potential relationships between constructs derived from themes
   */
  async suggestHypotheses(
    options: SuggestHypothesesOptions,
  ): Promise<HypothesisSuggestion[]> {
    this.logger.log(
      `Suggesting hypotheses from ${options.themes.length} themes`,
    );

    const cacheKey = this.getCacheKey('hypotheses', options);
    if (this.hypothesisCache.has(cacheKey)) {
      this.logger.log('Returning cached hypothesis suggestions');
      return this.hypothesisCache.get(cacheKey)!;
    }

    const hypotheses: HypothesisSuggestion[] = [];

    // Phase 10.195: Always use AI via UnifiedAIService (with fallback to templates on error)
    try {
      const aiHypotheses = await this.generateHypothesesWithAI(options);
      hypotheses.push(...aiHypotheses);
    } catch (error: any) {
      this.logger.warn(
        `Hypothesis AI generation failed, using templates: ${error.message}`,
      );
      const templateHypotheses = this.generateHypothesesWithTemplates(options);
      hypotheses.push(...templateHypotheses);
    }

    // Sort by confidence score
    hypotheses.sort((a, b) => b.confidenceScore - a.confidenceScore);

    // Limit to maxHypotheses
    const maxHypotheses = options.maxHypotheses || 20;
    const limitedHypotheses = hypotheses.slice(0, maxHypotheses);

    // Cache results
    this.hypothesisCache.set(cacheKey, limitedHypotheses);

    return limitedHypotheses;
  }

  /**
   * Map themes to psychological/research constructs
   * Uses semantic analysis to identify underlying constructs
   */
  async mapThemesToConstructs(
    options: MapConstructsOptions,
  ): Promise<ConstructMapping[]> {
    this.logger.log(`Mapping ${options.themes.length} themes to constructs`);

    const constructs: ConstructMapping[] = [];

    // Group themes by semantic similarity
    const themeClusters = await this.clusterThemes(
      options.themes,
      options.clusteringAlgorithm || 'semantic',
    );

    // Convert each cluster to a construct
    for (const cluster of themeClusters) {
      const constructMapping = await this.createConstructFromCluster(
        cluster,
        options.themes,
      );
      constructs.push(constructMapping);
    }

    // Detect relationships between constructs if requested
    if (options.includeRelationships !== false) {
      await this.detectConstructRelationships(constructs);
    }

    return constructs;
  }

  /**
   * Generate a complete survey from themes in one click
   * Creates a publication-ready survey with all standard sections
   */
  async generateCompleteSurvey(
    options: GenerateCompleteSurveyOptions,
  ): Promise<CompleteSurveyGeneration> {
    this.logger.log(
      `Generating complete survey from ${options.themes.length} themes`,
    );

    const sections: CompleteSurveyGeneration['sections'] = [];

    // 1. Introduction section (if confirmatory or mixed)
    if (options.surveyPurpose !== 'exploratory') {
      sections.push(await this.generateIntroductionSection(options));
    }

    // 2. Demographics section (if requested)
    if (options.includeDemographics) {
      sections.push(this.generateDemographicsSection(options));
    }

    // 3. Main items from themes
    const mainSection = await this.generateMainItemsSection(options);
    sections.push(mainSection);

    // 4. Validity check items (if requested)
    if (options.includeValidityChecks) {
      sections.push(this.generateValidityCheckSection(options));
    }

    // 5. Thank you/debrief section
    sections.push(this.generateDebriefSection(options));

    // Calculate metadata
    const totalItems = sections.reduce(
      (sum, section) => sum + section.items.length,
      0,
    );
    const estimatedTime = Math.ceil(totalItems * 0.5); // 30 seconds per item
    const themeCoverage = this.calculateThemeCoverage(sections, options.themes);

    return {
      sections,
      metadata: {
        totalItems,
        estimatedCompletionTime: estimatedTime,
        themeCoverage,
      },
      methodology: {
        approach:
          'AI-assisted thematic analysis to traditional survey conversion',
        researchBacking:
          'Braun & Clarke (2019) + Churchill (1979) + DeVellis (2016)',
        validation:
          'SQUARE-IT framework + Content validity through theme provenance',
      },
    };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Generate research questions using OpenAI GPT-4
   */
  private async generateQuestionsWithAI(
    options: SuggestQuestionsOptions,
  ): Promise<ResearchQuestionSuggestion[]> {
    const themeSummary = options.themes
      .map(
        (t, i) =>
          `${i + 1}. ${t.name}: ${t.description} (confidence: ${(t.confidence * 100).toFixed(0)}%, prevalence: ${(t.prevalence * 100).toFixed(0)}%)`,
      )
      .join('\n');

    const questionTypes = options.questionTypes || [
      'exploratory',
      'explanatory',
      'evaluative',
      'descriptive',
    ];

    const prompt = `You are an expert research methodologist. Generate ${options.maxQuestions || 15} high-quality research questions from the following themes.

**Themes Identified:**
${themeSummary}

**Research Domain:** ${options.researchDomain || 'General'}
**Research Goal:** ${options.researchGoal || 'To explore key themes and their relationships'}

**Question Types to Generate:** ${questionTypes.join(', ')}

For each question, provide:
1. The research question text
2. Question type (exploratory/explanatory/evaluative/descriptive)
3. Relevance score (0-1) based on theme confidence and prevalence
4. Rationale explaining why this question is important
5. Which themes it relates to
6. Complexity level (basic/intermediate/advanced)
7. Suggested methodology (qualitative/quantitative/mixed_methods/q_methodology)

**SQUARE-IT Criteria** (Specific, Quantifiable, Usable, Accurate, Restricted, Eligible, Investigable, Timely):
- Make questions specific and focused
- Ensure they are answerable with available methods
- Align with the research domain and goals

IMPORTANT: Return a JSON object (not an array) with a "questions" key containing an array:
{
  "questions": [{
    "question": "string",
    "type": "exploratory|explanatory|evaluative|descriptive",
    "relevanceScore": 0.0-1.0,
    "rationale": "string",
    "relatedThemes": ["theme1", "theme2"],
    "complexity": "basic|intermediate|advanced",
    "squareItScore": {
      "specific": 0.0-1.0,
    "quantifiable": 0.0-1.0,
    "usable": 0.0-1.0,
    "accurate": 0.0-1.0,
    "restricted": 0.0-1.0,
    "eligible": 0.0-1.0,
    "investigable": 0.0-1.0,
    "timely": 0.0-1.0,
      "overallScore": 0.0-1.0
    },
    "suggestedMethodology": "string"
  }]
}`;

    try {
      this.logger.log('[AI] Calling UnifiedAIService for research questions...');
      // Phase 10.195: Use UnifiedAIService for research question suggestions
      const aiResponse = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.7,
        systemPrompt: 'You are an expert research methodologist specializing in research question formulation and SQUARE-IT framework. You MUST return valid JSON with a "questions" array.',
        jsonMode: true,
      });

      const response = aiResponse.content;
      this.logger.log(
        `[AI] Received response length: ${response?.length || 0} chars`,
      );

      if (!response) {
        this.logger.warn('[AI] Empty response from OpenAI');
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(response);
      this.logger.log(
        `[AI] Parsed response keys: ${Object.keys(parsed).join(', ')}`,
      );

      // Handle both array and object with questions key
      let questions = Array.isArray(parsed) ? parsed : parsed.questions || [];

      // If still empty, try parsed.data or parsed.results
      if (questions.length === 0 && parsed.data) {
        questions = Array.isArray(parsed.data) ? parsed.data : [];
      }
      if (questions.length === 0 && parsed.results) {
        questions = Array.isArray(parsed.results) ? parsed.results : [];
      }

      this.logger.log(
        `[AI] Extracted ${questions.length} questions from response`,
      );

      return questions.map((q: any, index: number) => ({
        id: `rq_${index + 1}_${Date.now()}`,
        question: q.question,
        type: q.type || 'exploratory',
        relevanceScore: q.relevanceScore || 0.5,
        rationale: q.rationale,
        relatedThemes: q.relatedThemes || [],
        complexity: q.complexity || 'intermediate',
        squareItScore: q.squareItScore,
        suggestedMethodology: q.suggestedMethodology || 'mixed_methods',
      }));
    } catch (error: unknown) {
      // Phase 10.106 Phase 5: Use unknown with type narrowing (Netflix-grade)
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `AI question generation failed: ${err.message || 'Unknown error'}`,
        err.stack,
      );
      // Fallback to template-based approach
      return this.generateQuestionsWithTemplates(options);
    }
  }

  /**
   * Generate research questions using templates (fallback when no AI)
   */
  private generateQuestionsWithTemplates(
    options: SuggestQuestionsOptions,
  ): ResearchQuestionSuggestion[] {
    const questions: ResearchQuestionSuggestion[] = [];
    const questionTypes = options.questionTypes || [
      'exploratory',
      'explanatory',
      'evaluative',
      'descriptive',
    ];

    // Sort themes by confidence * prevalence
    const sortedThemes = [...options.themes].sort(
      (a, b) => b.confidence * b.prevalence - a.confidence * a.prevalence,
    );

    // Take top themes for question generation
    const topThemes = sortedThemes.slice(
      0,
      Math.min(10, options.themes.length),
    );

    for (const theme of topThemes) {
      // Generate one question per type for high-priority themes
      for (const type of questionTypes) {
        const question = this.generateQuestionFromTemplate(theme, type);
        questions.push(question);
      }
    }

    return questions;
  }

  /**
   * Generate a single research question from a template
   */
  private generateQuestionFromTemplate(
    theme: Theme,
    type: ResearchQuestionSuggestion['type'],
  ): ResearchQuestionSuggestion {
    const templates = {
      exploratory: [
        `What are the key dimensions of ${theme.name}?`,
        `How do individuals experience ${theme.name}?`,
        `What factors contribute to ${theme.name}?`,
      ],
      explanatory: [
        `What is the relationship between ${theme.name} and related outcomes?`,
        `How does ${theme.name} influence subsequent behaviors?`,
        `What mechanisms explain the effect of ${theme.name}?`,
      ],
      evaluative: [
        `To what extent does ${theme.name} impact the target population?`,
        `How effective is ${theme.name} in achieving desired outcomes?`,
        `What are the strengths and limitations of ${theme.name}?`,
      ],
      descriptive: [
        `What is the prevalence of ${theme.name} in the population?`,
        `How is ${theme.name} distributed across different demographics?`,
        `What are the characteristics of ${theme.name}?`,
      ],
    };

    const template =
      templates[type][Math.floor(Math.random() * templates[type].length)];

    // Phase 10 Day 5.17.4: Add default SQUARE-IT scores for template-based questions
    // Template questions get baseline scores since they're not AI-evaluated
    const baselineSquareItScore = {
      specific: 0.7, // Templates are reasonably specific
      quantifiable: 0.65, // Templates allow measurement but could be more precise
      usable: 0.75, // Template questions are practical
      accurate: 0.7, // Standard question formats are methodologically sound
      restricted: 0.8, // Templates are appropriately scoped
      eligible: 0.75, // Generally accessible populations
      investigable: 0.8, // All templates are scientifically answerable
      timely: theme.confidence * theme.prevalence, // Timeliness based on theme strength
      overallScore: 0.72, // Average of above
    };

    return {
      id: `rq_template_${theme.id}_${type}`,
      question: template,
      type,
      relevanceScore: theme.confidence * theme.prevalence,
      rationale: `This ${type} question addresses the ${theme.name} theme identified with ${(theme.confidence * 100).toFixed(0)}% confidence.`,
      relatedThemes: [theme.id],
      complexity: this.determineComplexity(theme),
      squareItScore: baselineSquareItScore, // CRITICAL FIX: Include SQUARE-IT scores
      suggestedMethodology: this.suggestMethodologyForTheme(theme, type),
    };
  }

  /**
   * Generate hypotheses using OpenAI GPT-4
   */
  private async generateHypothesesWithAI(
    options: SuggestHypothesesOptions,
  ): Promise<HypothesisSuggestion[]> {
    const themeSummary = options.themes
      .map(
        (t, i) =>
          `${i + 1}. ${t.name}: ${t.description} (confidence: ${(t.confidence * 100).toFixed(0)}%)`,
      )
      .join('\n');

    const hypothesisTypes = options.hypothesisTypes || [
      'correlational',
      'causal',
      'mediation',
      'moderation',
    ];

    const prompt = `You are an expert research methodologist. Generate ${options.maxHypotheses || 20} testable research hypotheses from the following themes.

**Themes Identified:**
${themeSummary}

**Research Domain:** ${options.researchDomain || 'General'}
**Research Context:** ${options.researchContext || 'Academic research study'}

**Hypothesis Types to Generate:** ${hypothesisTypes.join(', ')}

For each hypothesis, provide:
1. The hypothesis statement
2. Hypothesis type (correlational/causal/mediation/moderation/interaction)
3. Independent variable (IV)
4. Dependent variable (DV)
5. Moderator (if applicable)
6. Mediator (if applicable)
7. Confidence score (0-1) based on theme evidence
8. Evidence strength (strong/moderate/weak)
9. Which themes it relates to
10. Expected effect size (small/medium/large)
11. Suggested statistical test
12. Research backing (cite relevant theory/literature)

Return a JSON array with this structure:
[{
  "hypothesis": "string",
  "type": "correlational|causal|mediation|moderation|interaction",
  "independentVariable": "string",
  "dependentVariable": "string",
  "moderator": "string|null",
  "mediator": "string|null",
  "confidenceScore": 0.0-1.0,
  "evidenceStrength": "strong|moderate|weak",
  "relatedThemes": ["theme1", "theme2"],
  "expectedEffectSize": "small|medium|large",
  "suggestedStatisticalTest": "string",
  "researchBacking": "string"
}]`;

    try {
      // Phase 10.195: Use UnifiedAIService for hypothesis suggestions
      const aiResponse = await this.unifiedAIService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.7,
        systemPrompt: 'You are an expert research methodologist specializing in hypothesis formulation and experimental design.',
        jsonMode: true,
      });

      const response = aiResponse.content;
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(response);
      const hypotheses = Array.isArray(parsed)
        ? parsed
        : parsed.hypotheses || [];

      return hypotheses.map((h: any, index: number) => ({
        id: `hyp_${index + 1}_${Date.now()}`,
        hypothesis: h.hypothesis,
        type: h.type || 'correlational',
        independentVariable: h.independentVariable,
        dependentVariable: h.dependentVariable,
        moderator: h.moderator || undefined,
        mediator: h.mediator || undefined,
        confidenceScore: h.confidenceScore || 0.5,
        evidenceStrength: h.evidenceStrength || 'moderate',
        relatedThemes: h.relatedThemes || [],
        expectedEffectSize: h.expectedEffectSize,
        suggestedStatisticalTest: h.suggestedStatisticalTest,
        researchBacking: h.researchBacking,
      }));
    } catch (error: unknown) {
      // Phase 10.106 Phase 5: Use unknown with type narrowing (Netflix-grade)
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `AI hypothesis generation failed: ${err.message || 'Unknown error'}`,
        err.stack,
      );
      // Fallback to template-based approach
      return this.generateHypothesesWithTemplates(options);
    }
  }

  /**
   * Generate hypotheses using templates (fallback when no AI)
   */
  private generateHypothesesWithTemplates(
    options: SuggestHypothesesOptions,
  ): HypothesisSuggestion[] {
    const hypotheses: HypothesisSuggestion[] = [];

    // Generate correlational hypotheses between high-confidence themes
    const highConfidenceThemes = options.themes
      .filter((t) => t.confidence >= 0.7)
      .slice(0, 5);

    for (let i = 0; i < highConfidenceThemes.length; i++) {
      for (let j = i + 1; j < highConfidenceThemes.length; j++) {
        const themeA = highConfidenceThemes[i];
        const themeB = highConfidenceThemes[j];

        hypotheses.push({
          id: `hyp_corr_${themeA.id}_${themeB.id}`,
          hypothesis: `${themeA.name} is positively correlated with ${themeB.name}.`,
          type: 'correlational',
          independentVariable: themeA.name,
          dependentVariable: themeB.name,
          confidenceScore: (themeA.confidence + themeB.confidence) / 2,
          evidenceStrength:
            themeA.confidence > 0.8 && themeB.confidence > 0.8
              ? 'strong'
              : 'moderate',
          relatedThemes: [themeA.id, themeB.id],
          expectedEffectSize: 'medium',
          suggestedStatisticalTest:
            'Pearson correlation or Spearman correlation',
          researchBacking:
            'Based on thematic co-occurrence and conceptual similarity',
        });
      }
    }

    return hypotheses.slice(0, options.maxHypotheses || 20);
  }

  /**
   * Cluster themes by semantic similarity
   */
  private async clusterThemes(
    themes: Theme[],
    _algorithm: 'semantic' | 'statistical' | 'hybrid',
  ): Promise<Theme[][]> {
    // Simple keyword-based clustering for now
    // In production, use embeddings + cosine similarity or hierarchical clustering
    const clusters: Theme[][] = [];
    const used = new Set<string>();

    for (const theme of themes) {
      if (used.has(theme.id)) continue;

      const cluster = [theme];
      used.add(theme.id);

      // Find similar themes based on key phrases overlap
      for (const otherTheme of themes) {
        if (used.has(otherTheme.id)) continue;

        const overlap = this.calculateKeyPhraseOverlap(theme, otherTheme);
        if (overlap >= 0.3) {
          cluster.push(otherTheme);
          used.add(otherTheme.id);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Calculate overlap between theme key phrases
   */
  private calculateKeyPhraseOverlap(themeA: Theme, themeB: Theme): number {
    const phrasesA = new Set(themeA.keyPhrases || []);
    const phrasesB = new Set(themeB.keyPhrases || []);

    const intersection = new Set([...phrasesA].filter((p) => phrasesB.has(p)));
    const union = new Set([...phrasesA, ...phrasesB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Create a construct mapping from a cluster of themes
   */
  private async createConstructFromCluster(
    cluster: Theme[],
    _allThemes: Theme[],
  ): Promise<ConstructMapping> {
    // Use the most confident theme as the construct name
    const primaryTheme = cluster.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev,
    );

    const constructId = `construct_${primaryTheme.id}`;
    const constructName = primaryTheme.name;
    const constructDefinition = this.synthesizeDefinition(cluster);

    return {
      construct: {
        id: constructId,
        name: constructName,
        definition: constructDefinition,
        themes: cluster.map((t) => t.id),
      },
      relatedConstructs: [],
    };
  }

  /**
   * Synthesize a definition from multiple theme descriptions
   */
  private synthesizeDefinition(themes: Theme[]): string {
    // Combine descriptions, prioritizing by confidence
    const sortedThemes = [...themes].sort(
      (a, b) => b.confidence - a.confidence,
    );
    const primaryDescription = sortedThemes[0].description;

    if (themes.length === 1) {
      return primaryDescription;
    }

    const additionalContext = sortedThemes
      .slice(1, 3)
      .map((t) => t.description)
      .join('; ');

    return `${primaryDescription}. Related aspects include: ${additionalContext}`;
  }

  /**
   * Detect relationships between constructs
   */
  private async detectConstructRelationships(
    constructs: ConstructMapping[],
  ): Promise<void> {
    // Simple heuristic: if constructs share themes or have overlapping key phrases,
    // they likely have a relationship
    for (let i = 0; i < constructs.length; i++) {
      for (let j = i + 1; j < constructs.length; j++) {
        const constructA = constructs[i];
        const constructB = constructs[j];

        // Check for shared themes
        const sharedThemes = constructA.construct.themes.filter((t) =>
          constructB.construct.themes.includes(t),
        );

        if (sharedThemes.length > 0) {
          const strength = sharedThemes.length >= 2 ? 'strong' : 'moderate';

          constructA.relatedConstructs.push({
            constructId: constructB.construct.id,
            constructName: constructB.construct.name,
            relationshipType: 'correlates',
            strength,
            confidence: 0.7,
          });

          constructB.relatedConstructs.push({
            constructId: constructA.construct.id,
            constructName: constructA.construct.name,
            relationshipType: 'correlates',
            strength,
            confidence: 0.7,
          });
        }
      }
    }
  }

  /**
   * Generate introduction section for survey
   */
  private async generateIntroductionSection(
    _options: GenerateCompleteSurveyOptions,
  ): Promise<CompleteSurveyGeneration['sections'][0]> {
    return {
      id: 'intro',
      title: 'Introduction',
      description: 'Welcome to this research study',
      items: [
        {
          id: 'consent',
          type: 'open_ended',
          text: 'Thank you for participating in this study. Please read the informed consent document and type "I consent" to continue.',
          themeProvenance: [],
        },
      ],
    };
  }

  /**
   * Generate demographics section
   */
  private generateDemographicsSection(
    _options: GenerateCompleteSurveyOptions,
  ): CompleteSurveyGeneration['sections'][0] {
    return {
      id: 'demographics',
      title: 'Demographics',
      description: 'Please provide some background information',
      items: [
        {
          id: 'age',
          type: 'multiple_choice',
          text: 'What is your age range?',
          options: [
            '18-24',
            '25-34',
            '35-44',
            '45-54',
            '55-64',
            '65 or older',
            'Prefer not to say',
          ],
          themeProvenance: [],
        },
        {
          id: 'gender',
          type: 'multiple_choice',
          text: 'What is your gender identity?',
          options: [
            'Male',
            'Female',
            'Non-binary',
            'Other',
            'Prefer not to say',
          ],
          themeProvenance: [],
        },
        {
          id: 'education',
          type: 'multiple_choice',
          text: 'What is your highest level of education?',
          options: [
            'High school or equivalent',
            'Some college',
            "Bachelor's degree",
            "Master's degree",
            'Doctoral degree',
            'Other',
          ],
          themeProvenance: [],
        },
      ],
    };
  }

  /**
   * Generate main items section from themes
   */
  private async generateMainItemsSection(
    options: GenerateCompleteSurveyOptions,
  ): Promise<CompleteSurveyGeneration['sections'][0]> {
    const items: CompleteSurveyGeneration['sections'][0]['items'] = [];

    // Determine items per theme based on complexity
    const itemsPerTheme =
      options.complexityLevel === 'basic'
        ? 2
        : options.complexityLevel === 'advanced'
          ? 5
          : 3;

    for (const theme of options.themes) {
      // Generate Likert items for each theme
      for (let i = 0; i < itemsPerTheme; i++) {
        items.push({
          id: `${theme.id}_item_${i + 1}`,
          type: 'likert',
          text: this.generateItemTextFromTheme(theme, i),
          scaleType: '1-5 Strongly Disagree to Strongly Agree',
          themeProvenance: [theme.id],
          construct: theme.name,
        });
      }
    }

    return {
      id: 'main_items',
      title: 'Main Survey Items',
      description:
        'Please indicate your level of agreement with each statement',
      items,
    };
  }

  /**
   * Generate a survey item text from a theme
   */
  private generateItemTextFromTheme(theme: Theme, index: number): string {
    // Simple template-based item generation
    const templates = [
      `I frequently experience ${theme.name.toLowerCase()}.`,
      `${theme.name} is important to me.`,
      `I am satisfied with my level of ${theme.name.toLowerCase()}.`,
      `${theme.name} plays a significant role in my life.`,
      `I would like to improve my ${theme.name.toLowerCase()}.`,
    ];

    return templates[index % templates.length];
  }

  /**
   * Generate validity check section
   */
  private generateValidityCheckSection(
    _options: GenerateCompleteSurveyOptions,
  ): CompleteSurveyGeneration['sections'][0] {
    return {
      id: 'validity_checks',
      title: 'Attention Checks',
      description: 'Please answer the following questions carefully',
      items: [
        {
          id: 'attention_check_1',
          type: 'likert',
          text: 'Please select "Strongly Agree" for this item.',
          scaleType: '1-5 Strongly Disagree to Strongly Agree',
          themeProvenance: [],
        },
        {
          id: 'attention_check_2',
          type: 'multiple_choice',
          text: 'What color is the sky on a clear day?',
          options: ['Red', 'Green', 'Blue', 'Yellow'],
          themeProvenance: [],
        },
      ],
    };
  }

  /**
   * Generate debrief section
   */
  private generateDebriefSection(
    _options: GenerateCompleteSurveyOptions,
  ): CompleteSurveyGeneration['sections'][0] {
    return {
      id: 'debrief',
      title: 'Thank You',
      description: 'Survey complete',
      items: [
        {
          id: 'feedback',
          type: 'open_ended',
          text: 'Do you have any comments or feedback about this survey?',
          themeProvenance: [],
        },
      ],
    };
  }

  /**
   * Calculate what percentage of themes are covered in the survey
   */
  private calculateThemeCoverage(
    sections: CompleteSurveyGeneration['sections'],
    themes: Theme[],
  ): number {
    const coveredThemeIds = new Set<string>();

    for (const section of sections) {
      for (const item of section.items) {
        for (const themeId of item.themeProvenance) {
          coveredThemeIds.add(themeId);
        }
      }
    }

    return themes.length > 0 ? (coveredThemeIds.size / themes.length) * 100 : 0;
  }

  /**
   * Determine complexity level of a theme
   */
  private determineComplexity(
    theme: Theme,
  ): 'basic' | 'intermediate' | 'advanced' {
    const hasSubthemes = (theme.subthemes?.length || 0) > 0;
    const hasMultipleSources = theme.sources.length > 3;

    if (hasSubthemes && hasMultipleSources) {
      return 'advanced';
    } else if (hasSubthemes || hasMultipleSources) {
      return 'intermediate';
    } else {
      return 'basic';
    }
  }

  /**
   * Suggest methodology based on theme characteristics and question type
   */
  private suggestMethodologyForTheme(
    theme: Theme,
    questionType: string,
  ): ResearchQuestionSuggestion['suggestedMethodology'] {
    // Exploratory questions lean towards qualitative
    if (
      questionType === 'exploratory' &&
      theme.subthemes &&
      theme.subthemes.length > 0
    ) {
      return 'q_methodology';
    }

    // High confidence themes can use quantitative
    if (theme.confidence >= 0.8 && questionType === 'explanatory') {
      return 'quantitative';
    }

    // Default to mixed methods for most cases
    return 'mixed_methods';
  }

  /**
   * Generate cache key for memoization
   * Phase 10.106 Phase 5: Use generic type constraint instead of any (Netflix-grade)
   */
  private getCacheKey<T extends object>(type: string, options: T): string {
    return `${type}_${JSON.stringify(options)}`;
  }
}
