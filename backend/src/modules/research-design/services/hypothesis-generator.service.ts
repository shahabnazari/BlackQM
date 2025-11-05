import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../../common/prisma.service';

/**
 * Phase 9.5 Day 2: Hypothesis Generator & Theory Builder
 *
 * HypothesisGeneratorService - Multi-source hypothesis generation from contradictions, gaps, and trends
 *
 * Revolutionary Features:
 * - Generate hypotheses from paper contradictions
 * - Generate hypotheses from unexplored gaps
 * - Generate hypotheses from emerging trends
 * - Link each hypothesis to supporting evidence
 * - Recommend effect sizes and statistical tests
 *
 * Patent Potential: TIER 1 - Part of "AI-Powered Research Design from Multi-Source Literature Synthesis"
 */

export interface GeneratedHypothesis {
  id: string;
  type: 'null' | 'alternative' | 'directional';
  statement: string;
  source: 'contradiction' | 'gap' | 'trend';
  supportingPapers: Array<{
    id: string;
    title: string;
    doi?: string;
    evidenceType: 'supports' | 'contradicts' | 'mixed';
    excerpt?: string;
  }>;
  expectedEffectSize?: 'small' | 'medium' | 'large';
  suggestedStatisticalTest?: string;
  confidenceScore: number; // 0-1 based on evidence strength
  evidenceStrength: 'strong' | 'moderate' | 'weak';
  priority: number; // 1-10
  createdAt: Date;
}

export interface TheoryDiagram {
  constructs: Array<{
    id: string;
    name: string;
    definition: string;
    sources: string[]; // paper IDs
  }>;
  relationships: Array<{
    from: string; // construct ID
    to: string; // construct ID
    type: 'causes' | 'influences' | 'moderates' | 'mediates' | 'correlates';
    strength: 'weak' | 'moderate' | 'strong';
    evidence: string[]; // paper IDs
  }>;
}

export interface MethodologyRecommendation {
  methodology:
    | 'q-methodology'
    | 'mixed-methods'
    | 'qualitative'
    | 'quantitative';
  suitabilityScore: number; // 0-10
  reasoning: string;
  qMethodologyOptimization?: {
    recommendedStatementCount: number;
    recommendedPSetSize: number;
    estimatedFactorCount: number;
    gridShape: string;
  };
  alternativeMethodologies?: Array<{
    name: string;
    score: number;
    reasoning: string;
  }>;
}

export interface HypothesisGenerationRequest {
  researchQuestion: string;
  literatureSummary: {
    papers: any[];
    themes: any[];
    gaps: any[];
    contradictions?: any[];
    trends?: any[];
  };
  domain?: string;
}

@Injectable()
export class HypothesisGeneratorService {
  private readonly logger = new Logger(HypothesisGeneratorService.name);
  private openai!: OpenAI;
  private hypothesisCache = new Map<string, GeneratedHypothesis[]>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY not configured - AI features will be limited',
      );
    } else {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Main method: Generate hypotheses from literature contradictions, gaps, and trends
   */
  async generateHypotheses(
    request: HypothesisGenerationRequest,
  ): Promise<GeneratedHypothesis[]> {
    this.logger.log(
      `Generating hypotheses for research question: "${request.researchQuestion}"`,
    );

    const allHypotheses: GeneratedHypothesis[] = [];

    try {
      // 1. Generate from contradictions
      if (
        request.literatureSummary.contradictions &&
        request.literatureSummary.contradictions.length > 0
      ) {
        const contradictionHypotheses = await this.generateFromContradictions(
          request.researchQuestion,
          request.literatureSummary.contradictions,
          request.literatureSummary.papers,
        );
        allHypotheses.push(...contradictionHypotheses);
      }

      // 2. Generate from gaps
      if (
        request.literatureSummary.gaps &&
        request.literatureSummary.gaps.length > 0
      ) {
        const gapHypotheses = await this.generateFromGaps(
          request.researchQuestion,
          request.literatureSummary.gaps,
          request.literatureSummary.themes,
        );
        allHypotheses.push(...gapHypotheses);
      }

      // 3. Generate from trends
      if (
        request.literatureSummary.trends &&
        request.literatureSummary.trends.length > 0
      ) {
        const trendHypotheses = await this.generateFromTrends(
          request.researchQuestion,
          request.literatureSummary.trends,
          request.literatureSummary.papers,
        );
        allHypotheses.push(...trendHypotheses);
      }

      // 4. Prioritize and filter
      const prioritizedHypotheses = this.prioritizeHypotheses(allHypotheses);

      // 5. Validate evidence strength
      const validatedHypotheses = this.validateEvidenceStrength(
        prioritizedHypotheses,
      );

      return validatedHypotheses;
    } catch (error: any) {
      this.logger.error(
        `Hypothesis generation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate hypotheses from contradicting findings
   */
  private async generateFromContradictions(
    researchQuestion: string,
    contradictions: any[],
    papers: any[],
  ): Promise<GeneratedHypothesis[]> {
    if (!this.openai) {
      return [];
    }

    const prompt = `Generate research hypotheses from contradicting findings in the literature.

Research Question: "${researchQuestion}"

Contradictions Identified:
${contradictions
  .slice(0, 5)
  .map(
    (c, i) => `
${i + 1}. ${c.description || c.summary || 'Contradiction'}
   - Finding A: ${c.findingA || 'Not specified'}
   - Finding B: ${c.findingB || 'Not specified'}
   - Papers: ${c.paperIds?.join(', ') || 'Not specified'}
`,
  )
  .join('\n')}

For each contradiction, generate:
1. A null hypothesis (no relationship exists)
2. An alternative hypothesis (relationship exists)
3. A directional hypothesis if theory suggests a direction

For each hypothesis, provide:
- Statement in testable form
- Expected effect size (small/medium/large) based on similar studies
- Suggested statistical test
- Confidence score (0-1) based on evidence strength

Return JSON: {
  "hypotheses": [
    {
      "type": "null" | "alternative" | "directional",
      "statement": "...",
      "expectedEffectSize": "small" | "medium" | "large",
      "suggestedStatisticalTest": "...",
      "confidenceScore": 0.0-1.0,
      "supportingPaperIds": [...]
    },
    ...
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert research methodologist specializing in hypothesis development. Generate clear, testable hypotheses.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      const hypotheses = parsed.hypotheses || [];

      return hypotheses.map((h: any, index: number) => ({
        id: `hyp_contradiction_${Date.now()}_${index}`,
        type: h.type,
        statement: h.statement,
        source: 'contradiction' as const,
        supportingPapers: this.mapPaperIds(h.supportingPaperIds || [], papers),
        expectedEffectSize: h.expectedEffectSize,
        suggestedStatisticalTest: h.suggestedStatisticalTest,
        confidenceScore: h.confidenceScore || 0.5,
        evidenceStrength: this.calculateEvidenceStrength(
          h.supportingPaperIds?.length || 0,
        ),
        priority: Math.round(h.confidenceScore * 10),
        createdAt: new Date(),
      }));
    } catch (error: any) {
      this.logger.error(
        `Contradiction hypothesis generation failed: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Generate hypotheses from unexplored research gaps
   */
  private async generateFromGaps(
    researchQuestion: string,
    gaps: any[],
    themes: any[],
  ): Promise<GeneratedHypothesis[]> {
    if (!this.openai) {
      return [];
    }

    const prompt = `Generate exploratory research hypotheses from identified research gaps.

Research Question: "${researchQuestion}"

Research Gaps:
${gaps
  .slice(0, 5)
  .map(
    (g, i) => `
${i + 1}. ${g.description || g.name || 'Gap'}
   - Type: ${g.type || 'Not specified'}
   - Importance: ${g.importance || 'Not specified'}
`,
  )
  .join('\n')}

Themes:
${themes
  .slice(0, 5)
  .map((t, i) => `${i + 1}. ${t.name || t.title || 'Theme'}`)
  .join('\n')}

For each gap, generate exploratory hypotheses that:
1. Propose unexplored relationships between constructs
2. Are testable with Q-methodology
3. Address the identified gap
4. Connect to existing themes

Return JSON with same structure as before.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at identifying novel research directions from literature gaps.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      const hypotheses = parsed.hypotheses || [];

      return hypotheses.map((h: any, index: number) => ({
        id: `hyp_gap_${Date.now()}_${index}`,
        type: h.type || 'alternative',
        statement: h.statement,
        source: 'gap' as const,
        supportingPapers: [],
        expectedEffectSize: h.expectedEffectSize,
        suggestedStatisticalTest: h.suggestedStatisticalTest,
        confidenceScore: h.confidenceScore || 0.4,
        evidenceStrength: 'weak' as const, // gaps have weaker evidence by definition
        priority: Math.round((h.confidenceScore || 0.4) * 10),
        createdAt: new Date(),
      }));
    } catch (error: any) {
      this.logger.error(`Gap hypothesis generation failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate hypotheses from emerging trends
   */
  private async generateFromTrends(
    researchQuestion: string,
    trends: any[],
    papers: any[],
  ): Promise<GeneratedHypothesis[]> {
    if (!this.openai) {
      return [];
    }

    const prompt = `Generate predictive hypotheses from emerging trends in the literature.

Research Question: "${researchQuestion}"

Emerging Trends:
${trends
  .slice(0, 5)
  .map(
    (t, i) => `
${i + 1}. ${t.description || t.name || 'Trend'}
   - Growth rate: ${t.growthRate || 'Not specified'}
   - Recent papers: ${t.paperCount || 'Not specified'}
`,
  )
  .join('\n')}

Generate hypotheses that predict future developments based on current trends.

Return JSON with same structure as before.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at identifying future research directions from emerging trends.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return [];
      }

      const parsed = JSON.parse(content);
      const hypotheses = parsed.hypotheses || [];

      return hypotheses.map((h: any, index: number) => ({
        id: `hyp_trend_${Date.now()}_${index}`,
        type: h.type || 'directional',
        statement: h.statement,
        source: 'trend' as const,
        supportingPapers: this.mapPaperIds(h.supportingPaperIds || [], papers),
        expectedEffectSize: h.expectedEffectSize,
        suggestedStatisticalTest: h.suggestedStatisticalTest,
        confidenceScore: h.confidenceScore || 0.6,
        evidenceStrength: this.calculateEvidenceStrength(
          h.supportingPaperIds?.length || 0,
        ),
        priority: Math.round((h.confidenceScore || 0.6) * 10),
        createdAt: new Date(),
      }));
    } catch (error: any) {
      this.logger.error(`Trend hypothesis generation failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Build conceptual framework/theory diagram
   */
  async buildTheoryDiagram(
    researchQuestion: string,
    themes: any[],
    knowledgeGraphData?: any,
  ): Promise<TheoryDiagram> {
    if (!this.openai) {
      return { constructs: [], relationships: [] };
    }

    const prompt = `Build a conceptual framework diagram from the identified themes.

Research Question: "${researchQuestion}"

Themes:
${themes
  .slice(0, 10)
  .map(
    (t, i) =>
      `${i + 1}. ${t.name || t.title || 'Theme'}: ${t.description || ''}`,
  )
  .join('\n')}

Extract:
1. Key constructs (variables, concepts)
2. Relationships between constructs (causes, influences, moderates, mediates, correlates)
3. Strength of each relationship (weak, moderate, strong)

Return JSON: {
  "constructs": [
    {
      "name": "...",
      "definition": "...",
      "themeIds": [1, 3]
    },
    ...
  ],
  "relationships": [
    {
      "fromConstruct": "Construct A",
      "toConstruct": "Construct B",
      "type": "causes" | "influences" | "moderates" | "mediates" | "correlates",
      "strength": "weak" | "moderate" | "strong",
      "themeIds": [2, 4]
    },
    ...
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert at building conceptual frameworks and theoretical models.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return { constructs: [], relationships: [] };
      }

      const parsed = JSON.parse(content);

      return {
        constructs: (parsed.constructs || []).map((c: any, i: number) => ({
          id: `construct_${i}`,
          name: c.name,
          definition: c.definition,
          sources: (c.themeIds || []).map(
            (idx: number) => themes[idx - 1]?.id || `theme_${idx}`,
          ),
        })),
        relationships: (parsed.relationships || []).map((r: any, i: number) => {
          const fromConstruct = parsed.constructs.findIndex(
            (c: any) => c.name === r.fromConstruct,
          );
          const toConstruct = parsed.constructs.findIndex(
            (c: any) => c.name === r.toConstruct,
          );
          return {
            from: `construct_${fromConstruct}`,
            to: `construct_${toConstruct}`,
            type: r.type,
            strength: r.strength,
            evidence: (r.themeIds || []).map(
              (idx: number) => themes[idx - 1]?.id || `theme_${idx}`,
            ),
          };
        }),
      };
    } catch (error: any) {
      this.logger.error(`Theory diagram generation failed: ${error.message}`);
      return { constructs: [], relationships: [] };
    }
  }

  /**
   * Recommend optimal methodology
   */
  async recommendMethodology(
    researchQuestion: string,
    hypotheses: GeneratedHypothesis[],
    themes: any[],
  ): Promise<MethodologyRecommendation> {
    if (!this.openai) {
      return this.getFallbackMethodologyRecommendation();
    }

    const prompt = `Evaluate the suitability of Q-methodology for this research question.

Research Question: "${researchQuestion}"

Hypotheses Count: ${hypotheses.length}
Themes Count: ${themes.length}

Evaluate Q-methodology suitability based on:
1. Research question type (exploratory, subjective perspectives)
2. Number of themes (can be converted to statements)
3. Expected diversity of viewpoints
4. Feasibility considerations

If Q-methodology is suitable (score >= 7/10), provide optimization:
- Recommended statement count (typically 30-60)
- Recommended P-set size
- Estimated factor count

Also suggest alternative methodologies if appropriate.

Return JSON: {
  "qMethodologySuitability": 0-10,
  "reasoning": "...",
  "recommendedStatementCount": 30-60,
  "recommendedPSetSize": 20-40,
  "estimatedFactorCount": 3-6,
  "gridShape": "e.g., -4 to +4 with 9 piles",
  "alternatives": [
    {
      "methodology": "...",
      "suitabilityScore": 0-10,
      "reasoning": "..."
    }
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert research methodologist specializing in Q-methodology and mixed methods.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return this.getFallbackMethodologyRecommendation();
      }

      const parsed = JSON.parse(content);

      return {
        methodology: 'q-methodology',
        suitabilityScore: parsed.qMethodologySuitability || 7,
        reasoning:
          parsed.reasoning ||
          'Q-methodology is suitable for this research question',
        qMethodologyOptimization: {
          recommendedStatementCount: parsed.recommendedStatementCount || 40,
          recommendedPSetSize: parsed.recommendedPSetSize || 30,
          estimatedFactorCount: parsed.estimatedFactorCount || 4,
          gridShape: parsed.gridShape || '-4 to +4 (9 piles)',
        },
        alternativeMethodologies: parsed.alternatives || [],
      };
    } catch (error: any) {
      this.logger.error(`Methodology recommendation failed: ${error.message}`);
      return this.getFallbackMethodologyRecommendation();
    }
  }

  /**
   * Prioritize hypotheses by confidence and importance
   */
  private prioritizeHypotheses(
    hypotheses: GeneratedHypothesis[],
  ): GeneratedHypothesis[] {
    return hypotheses.sort((a, b) => {
      // Priority = confidence × evidence strength × source weight
      const sourceWeight = { contradiction: 1.0, trend: 0.8, gap: 0.6 };
      const evidenceWeight = { strong: 1.0, moderate: 0.7, weak: 0.4 };

      const scoreA =
        a.confidenceScore *
        evidenceWeight[a.evidenceStrength] *
        sourceWeight[a.source];
      const scoreB =
        b.confidenceScore *
        evidenceWeight[b.evidenceStrength] *
        sourceWeight[b.source];

      return scoreB - scoreA;
    });
  }

  /**
   * Validate that hypotheses have sufficient evidence
   */
  private validateEvidenceStrength(
    hypotheses: GeneratedHypothesis[],
  ): GeneratedHypothesis[] {
    return hypotheses.filter((h) => {
      // Require at least 2 supporting papers for "strong" evidence
      if (h.evidenceStrength === 'strong') {
        return h.supportingPapers.length >= 2;
      }
      // Require at least 1 supporting paper for "moderate" evidence
      if (h.evidenceStrength === 'moderate') {
        return h.supportingPapers.length >= 1;
      }
      // "weak" evidence (from gaps) doesn't require papers
      return true;
    });
  }

  /**
   * Calculate evidence strength based on number of supporting papers
   */
  private calculateEvidenceStrength(
    paperCount: number,
  ): 'strong' | 'moderate' | 'weak' {
    if (paperCount >= 3) return 'strong';
    if (paperCount >= 1) return 'moderate';
    return 'weak';
  }

  /**
   * Map paper IDs to paper objects
   */
  private mapPaperIds(
    paperIds: string[],
    papers: any[],
  ): Array<{
    id: string;
    title: string;
    doi?: string;
    evidenceType: 'supports' | 'contradicts' | 'mixed';
    excerpt?: string;
  }> {
    return paperIds
      .map((id) => {
        const paper = papers.find((p) => p.id === id || p.doi === id);
        if (!paper) return null;

        return {
          id: paper.id || paper.doi,
          title: paper.title || 'Untitled',
          doi: paper.doi,
          evidenceType: 'supports' as const,
          excerpt: paper.abstract?.substring(0, 200),
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }

  /**
   * Fallback methodology recommendation when AI is unavailable
   */
  private getFallbackMethodologyRecommendation(): MethodologyRecommendation {
    return {
      methodology: 'q-methodology',
      suitabilityScore: 7,
      reasoning: 'AI unavailable - default Q-methodology recommendation',
      qMethodologyOptimization: {
        recommendedStatementCount: 40,
        recommendedPSetSize: 30,
        estimatedFactorCount: 4,
        gridShape: '-4 to +4 (9 piles)',
      },
    };
  }
}
