import { Injectable, Logger } from '@nestjs/common';
// Phase 10.185 Week 2: Migrated from OpenAIService to UnifiedAIService
// Benefits: Groq FREE tier first, 80% cost reduction with Gemini fallback
import { UnifiedAIService } from './unified-ai.service';

// ============================================================================
// SYSTEM PROMPTS (Phase 10.185: Netflix-grade prompt engineering)
// ============================================================================

/**
 * System prompt for Q-methodology statement generation
 * Used for: generateStatements, enhanceStatements, generateStatementsFromMultiPlatform
 */
const STATEMENT_GENERATION_SYSTEM_PROMPT = `You are an expert Q-methodology researcher specializing in creating statements for Q-sort studies. Your task is to generate clear, concise, and sortable statements.

CRITICAL REQUIREMENTS:
1. Statements must be sortable on an agree-disagree scale
2. Use neutral, academic language (avoid loaded or biased terms)
3. Each statement must express a single, clear viewpoint
4. Statements should be 10-100 characters for optimal sorting
5. Cover diverse perspectives including supporters, critics, and neutral observers
6. Output ONLY the requested format - no additional commentary

You are precise, consistent, and always follow the exact output format requested.`;

/**
 * System prompt for statement validation and quality assessment
 * Used for: validateStatements, checkCulturalSensitivity
 */
const STATEMENT_VALIDATION_SYSTEM_PROMPT = `You are an expert Q-methodology researcher skilled at evaluating statement quality for research validity.

EVALUATION CRITERIA:
1. Clarity - Is the statement easy to understand?
2. Neutrality - Is the language free from bias or leading terms?
3. Sortability - Can participants easily place this on an agree-disagree scale?
4. Uniqueness - Does this express a distinct viewpoint?
5. Cultural sensitivity - Is it appropriate for diverse audiences?

OUTPUT: Valid JSON only. No explanations outside the JSON structure.`;

/**
 * System prompt for statement rewriting and alternatives
 * Used for: suggestNeutralAlternative, generateStatementVariations
 */
const STATEMENT_REWRITING_SYSTEM_PROMPT = `You are an expert at refining academic statements while preserving their core meaning.

REQUIREMENTS:
1. Maintain the original concept and viewpoint
2. Remove any loaded or emotional language
3. Ensure the result is sortable on an agree-disagree scale
4. Keep similar length to the original
5. Use clear, academic language

Output ONLY the rewritten statement(s), no additional text.`;

/**
 * System prompt for perspective and guideline generation
 * Used for: generatePerspectiveGuidelines
 */
const PERSPECTIVE_GUIDELINES_SYSTEM_PROMPT = `You are a Q-methodology expert identifying stakeholder perspectives for research studies.

Your task is to identify key perspectives and stakeholder groups that should be represented in a Q-study. For each perspective, consider:
1. Their typical stance on the topic
2. Their motivations and concerns
3. How their viewpoint differs from others

Output a clear, organized list of perspectives.`;

export interface Statement {
  id: string;
  text: string;
  perspective?: string;
  polarity?: 'positive' | 'negative' | 'neutral';
}

export interface StatementGenerationOptions {
  count?: number;
  perspectives?: string[];
  avoidBias?: boolean;
  academicLevel?: 'basic' | 'intermediate' | 'advanced';
  maxLength?: number;
}

export interface StatementValidation {
  overallQuality: number;
  issues: {
    statementId: string;
    issue: string;
    suggestion: string;
  }[];
  improvements: string[];
}

/**
 * Cultural sensitivity analysis result
 * Phase 10.185 Week 2: Added proper typing (no more Promise<any>)
 */
export interface CulturalSensitivityResult {
  flaggedStatements: Array<{
    index: number;
    statement: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
  regionsAnalyzed: string[];
}

/**
 * Multimedia source for statement provenance
 * Phase 9 Day 19 Task 4 - Multimedia Provenance Tracking
 */
export interface MultimediaSource {
  platform: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  id: string;
  title: string;
  author: string;
  url: string;
  timestamp?: number; // Seconds into video/podcast
  timestampUrl?: string; // URL with timestamp
  quote?: string;
  confidence: number; // 0-1, based on source type
}

export interface StatementWithProvenance extends Statement {
  sources: MultimediaSource[];
  sourceBreakdown: {
    papers: number;
    youtube: number;
    podcasts: number;
    tiktok: number;
    instagram: number;
  };
  overallConfidence: number; // Weighted average of source confidences
  hasTimestamps: boolean;
}

@Injectable()
export class StatementGeneratorService {
  private readonly logger = new Logger(StatementGeneratorService.name);

  constructor(
    // Phase 10.185 Week 2: Unified AI Service with Groq FREE → Gemini → OpenAI fallback
    private readonly aiService: UnifiedAIService,
  ) {}

  async generateStatements(
    topic: string,
    options: StatementGenerationOptions = {},
    userId?: string,
  ): Promise<Statement[]> {
    const {
      count = 30,
      perspectives = [],
      avoidBias = true,
      academicLevel = 'intermediate',
      maxLength = 100,
    } = options;

    const prompt = this.buildGenerationPrompt(
      topic,
      count,
      perspectives,
      avoidBias,
      academicLevel,
      maxLength,
    );

    try {
      // Phase 10.185 Week 2: Use UnifiedAIService with system prompt
      // Provider chain: Groq FREE → Gemini (80% cheaper) → OpenAI
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.8,
        maxTokens: 2000,
        systemPrompt: STATEMENT_GENERATION_SYSTEM_PROMPT,
        cache: true, // Enable response caching for repeated similar prompts
        userId,
      });

      return this.parseStatements(response.content);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate statements: ${errMsg}`);
      throw new Error('Failed to generate statements');
    }
  }

  private buildGenerationPrompt(
    topic: string,
    count: number,
    perspectives: string[],
    avoidBias: boolean,
    level: string,
    maxLength: number,
  ): string {
    const perspectivesList =
      perspectives.length > 0
        ? perspectives.join(', ')
        : 'various viewpoints including supporters, critics, and neutral observers';

    return `Generate ${count} diverse statements for a Q-methodology study about "${topic}".

REQUIREMENTS:
1. Each statement must be clear, concise, and under ${maxLength} characters
2. Cover different perspectives: ${perspectivesList}
3. Academic level: ${level}
4. ${avoidBias ? 'Use neutral, unbiased language' : 'Include some provocative statements to stimulate discussion'}
5. Mix positive, negative, and neutral statements
6. Statements must be sortable on an agree-disagree scale
7. Avoid redundancy - each statement should express a unique viewpoint
8. Use active voice where possible
9. Avoid jargon unless necessary for the academic level

FORMAT:
Return exactly ${count} statements in the following format:
S01: [Statement text] | [Perspective] | [Polarity]

EXAMPLE OUTPUT:
S01: Electric vehicles are essential for reducing carbon emissions | Environmental | positive
S02: The infrastructure for EVs is insufficient for widespread adoption | Practical | negative
S03: Government subsidies unfairly favor electric vehicle manufacturers | Economic | negative
S04: Electric vehicles perform as well as traditional cars | Technical | neutral

IMPORTANT: Generate exactly ${count} statements, no more, no less.`;
  }

  private parseStatements(response: string): Statement[] {
    const lines = response.split('\n').filter((line) => line.trim());
    const statements: Statement[] = [];

    for (const line of lines) {
      const match = line.match(/^(S\d+):\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
      if (match && match.length >= 5) {
        statements.push({
          id: match[1] as string,
          text: (match[2] as string).trim(),
          perspective: (match[3] as string).trim(),
          polarity: (match[4] as string).trim().toLowerCase() as
            | 'positive'
            | 'negative'
            | 'neutral',
        });
      }
    }

    // If parsing fails, try alternative format
    if (statements.length === 0) {
      const alternativeMatch = response.match(/["\']([^"']+)["\']|^([^|]+)$/gm);
      if (alternativeMatch) {
        alternativeMatch.forEach((match, index) => {
          const text = match.replace(/['"]/g, '').trim();
          if (text && text.length > 10) {
            statements.push({
              id: `S${String(index + 1).padStart(2, '0')}`,
              text: text.substring(0, 100),
              perspective: 'General',
              polarity: 'neutral',
            });
          }
        });
      }
    }

    return statements;
  }

  async validateStatements(
    statements: Statement[],
    topic: string,
    userId?: string,
  ): Promise<StatementValidation> {
    const validationPrompt = `Review these Q-methodology statements about "${topic}" for quality and appropriateness.

STATEMENTS:
${statements.map((s) => `${s.id}: "${s.text}"`).join('\n')}

EVALUATE:
1. Clarity and conciseness (are statements easy to understand?)
2. Bias or loaded language (identify any leading or emotionally charged language)
3. Sortability (can participants easily place these on an agree-disagree scale?)
4. Coverage (do statements cover diverse perspectives on the topic?)
5. Redundancy (are any statements too similar?)
6. Balance (is there a good mix of positive, negative, and neutral statements?)

RETURN FORMAT:
Provide a JSON response with:
{
  "overallQuality": [0-100 score],
  "issues": [
    {
      "statementId": "S01",
      "issue": "Description of the problem",
      "suggestion": "How to improve it"
    }
  ],
  "improvements": ["General suggestion 1", "General suggestion 2"]
}`;

    // Phase 10.185 Week 2: Use UnifiedAIService with validation system prompt
    const response = await this.aiService.generateCompletion(validationPrompt, {
      model: 'smart',
      temperature: 0.3,
      maxTokens: 1500,
      systemPrompt: STATEMENT_VALIDATION_SYSTEM_PROMPT,
      cache: true,
      userId,
    });

    try {
      return JSON.parse(response.content);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to parse validation response: ${errMsg}`);
      return {
        overallQuality: 70,
        issues: [],
        improvements: ['Unable to parse AI validation response'],
      };
    }
  }

  async suggestNeutralAlternative(
    statement: string,
    userId?: string,
  ): Promise<string> {
    const prompt = `Rewrite this Q-methodology statement to be more neutral and unbiased while preserving the core concept:

Original: "${statement}"

Requirements:
- Remove loaded or emotional language
- Maintain the ability to sort on an agree-disagree scale
- Keep similar length (within 10 characters)
- Preserve the underlying concept or viewpoint
- Use clear, academic language

Provide only the rewritten statement, nothing else.`;

    try {
      // Phase 10.185 Week 2: Use UnifiedAIService with rewriting system prompt
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.5,
        maxTokens: 100,
        systemPrompt: STATEMENT_REWRITING_SYSTEM_PROMPT,
        cache: true,
        userId,
      });

      return response.content.trim().replace(/^["']|["']$/g, '');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to suggest neutral alternative: ${errMsg}`);
      // Return original statement as fallback
      return statement;
    }
  }

  async generatePerspectiveGuidelines(
    topic: string,
    userId?: string,
  ): Promise<string[]> {
    const prompt = `For a Q-methodology study about "${topic}", identify 5-7 key perspectives or stakeholder groups that should be represented in the statements.

For each perspective, provide:
- Name of the perspective/group
- Brief description of their viewpoint
- Example stance they might take

Format as a simple list of perspectives.`;

    try {
      // Phase 10.185 Week 2: Use UnifiedAIService with perspective system prompt
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.6,
        maxTokens: 500,
        systemPrompt: PERSPECTIVE_GUIDELINES_SYSTEM_PROMPT,
        cache: true,
        userId,
      });

      return response.content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\d+\.\s*/, '').trim());
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate perspective guidelines: ${errMsg}`);
      return [];
    }
  }

  async enhanceStatements(
    statements: string[],
    enhancementType: 'clarity' | 'balance' | 'diversity',
    userId?: string,
  ): Promise<Statement[]> {
    const enhancementPrompts = {
      clarity: 'Improve clarity and remove ambiguity',
      balance: 'Ensure balanced positive/negative/neutral distribution',
      diversity: 'Increase diversity of perspectives',
    };

    const prompt = `Enhance these Q-methodology statements with focus on: ${enhancementPrompts[enhancementType]}

Current statements:
${statements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Requirements:
- Maintain the original count of statements
- ${enhancementPrompts[enhancementType]}
- Keep statements under 100 characters
- Preserve the core meaning of each statement

Format: S[number]: [enhanced statement] | [perspective] | [polarity]`;

    try {
      // Phase 10.185 Week 2: Use UnifiedAIService with generation system prompt
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.6,
        maxTokens: 2000,
        systemPrompt: STATEMENT_GENERATION_SYSTEM_PROMPT,
        cache: true,
        userId,
      });

      return this.parseStatements(response.content);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to enhance statements: ${errMsg}`);
      // Return original statements as fallback
      return statements.map((text, i) => ({
        id: `S${String(i + 1).padStart(2, '0')}`,
        text,
        perspective: 'General',
        polarity: 'neutral' as const,
      }));
    }
  }

  async checkCulturalSensitivity(
    statements: string[],
    targetRegions: string[] = ['Global'],
    userId?: string,
  ): Promise<CulturalSensitivityResult> {
    const prompt = `Review these Q-methodology statements for cultural sensitivity issues considering ${targetRegions.join(', ')} audiences:

${statements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Identify:
1. Culturally specific references that may not translate
2. Assumptions about social norms that vary by culture
3. Language that could be offensive or inappropriate in certain cultures
4. Suggestions for more inclusive alternatives

Return as JSON with:
{
  "flaggedStatements": [{"index": 1, "statement": "...", "issue": "...", "severity": "low|medium|high"}],
  "recommendations": ["..."],
  "regionsAnalyzed": ["..."]
}`;

    try {
      // Phase 10.185 Week 2: Use UnifiedAIService with validation system prompt
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.3,
        maxTokens: 1500,
        systemPrompt: STATEMENT_VALIDATION_SYSTEM_PROMPT,
        cache: true,
        userId,
      });

      const parsed = JSON.parse(response.content);
      return {
        flaggedStatements: parsed.flaggedStatements || [],
        recommendations: parsed.recommendations || [],
        regionsAnalyzed: targetRegions,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to check cultural sensitivity: ${errMsg}`);
      return { flaggedStatements: [], recommendations: [], regionsAnalyzed: targetRegions };
    }
  }

  async generateStatementVariations(
    originalStatement: string,
    count: number = 3,
    userId?: string,
  ): Promise<string[]> {
    const prompt = `Generate ${count} variations of this Q-methodology statement that express slightly different nuances of the same concept:

Original: "${originalStatement}"

Requirements:
- Each variation should be distinctly different but related
- Maintain similar length (±10 characters)
- Suitable for Q-methodology sorting
- Vary the emphasis or angle while keeping the core topic

Return only the variations, one per line.`;

    try {
      // Phase 10.185 Week 2: Use UnifiedAIService with rewriting system prompt
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'fast',
        temperature: 0.7,
        maxTokens: 300,
        systemPrompt: STATEMENT_REWRITING_SYSTEM_PROMPT,
        cache: true,
        userId,
      });

      return response.content
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, count);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate statement variations: ${errMsg}`);
      return [];
    }
  }

  /**
   * Generate statements from multi-platform sources with full provenance tracking
   * Phase 9 Day 19 Task 4 - Multimedia Provenance Implementation
   *
   * @param themes Extracted themes from various platforms
   * @param studyContext Context for statement generation
   * @param userId User ID for tracking
   * @returns Statements with complete multimedia provenance
   */
  async generateStatementsFromMultiPlatform(
    themes: Array<{
      theme: string;
      sources: Array<{
        platform: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
        id: string;
        title: string;
        author: string;
        url: string;
        timestamp?: number;
        quote?: string;
      }>;
    }>,
    studyContext: string,
    userId?: string,
  ): Promise<StatementWithProvenance[]> {
    this.logger.log(
      `Generating statements from ${themes.length} multi-platform themes`,
    );

    const statements: StatementWithProvenance[] = [];

    for (const themeData of themes) {
      try {
        // Build prompt with source citations
        const sourcesDescription = this.buildSourcesDescription(
          themeData.sources,
        );

        const prompt = `Generate a Q-methodology statement about "${themeData.theme}" for a study on "${studyContext}".

CONTEXT:
This theme appears across multiple sources:
${sourcesDescription}

REQUIREMENTS:
1. Create a clear, concise statement (max 100 characters)
2. Synthesize insights from all sources
3. Use neutral, academic language
4. Make it sortable on an agree-disagree scale
5. Reflect the multi-source evidence

Return only the statement text, nothing else.`;

        // Phase 10.185 Week 2: Use UnifiedAIService with generation system prompt
        const response = await this.aiService.generateCompletion(prompt, {
          model: 'smart',
          temperature: 0.7,
          maxTokens: 100,
          systemPrompt: STATEMENT_GENERATION_SYSTEM_PROMPT,
          cache: true,
          userId,
        });

        const statementText = response.content.trim().replace(/^["']|["']$/g, '');

        // Calculate provenance
        const sources: MultimediaSource[] = themeData.sources.map((source) => ({
          platform: source.platform,
          id: source.id,
          title: source.title,
          author: source.author,
          url: source.url,
          timestamp: source.timestamp,
          timestampUrl: this.buildTimestampUrl(source),
          quote: source.quote,
          confidence: this.getSourceConfidence(source.platform),
        }));

        const sourceBreakdown = this.calculateSourceBreakdown(sources);
        const overallConfidence = this.calculateOverallConfidence(sources);
        const hasTimestamps = sources.some((s) => s.timestamp !== undefined);

        statements.push({
          id: `S${String(statements.length + 1).padStart(2, '0')}`,
          text: statementText,
          perspective: themeData.theme,
          polarity: 'neutral',
          sources,
          sourceBreakdown,
          overallConfidence,
          hasTimestamps,
        });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to generate statement for theme "${themeData.theme}": ${errMsg}`);
        // Continue with next theme, don't fail entire batch
      }
    }

    this.logger.log(
      `Generated ${statements.length} statements with full provenance`,
    );
    return statements;
  }

  /**
   * Get confidence score by source type
   * Papers: 1.0, Academic YouTube: 0.7, Podcasts: 0.6, Social Media: 0.3
   */
  private getSourceConfidence(platform: string): number {
    const confidenceMap: Record<string, number> = {
      paper: 1.0,
      youtube: 0.7,
      podcast: 0.6,
      tiktok: 0.3,
      instagram: 0.3,
    };

    return confidenceMap[platform] || 0.5;
  }

  /**
   * Calculate overall confidence (weighted average)
   */
  private calculateOverallConfidence(sources: MultimediaSource[]): number {
    if (sources.length === 0) return 0;

    const totalConfidence = sources.reduce((sum, s) => sum + s.confidence, 0);
    return Math.round((totalConfidence / sources.length) * 100) / 100;
  }

  /**
   * Calculate source breakdown by platform
   */
  private calculateSourceBreakdown(sources: MultimediaSource[]) {
    const breakdown = {
      papers: 0,
      youtube: 0,
      podcasts: 0,
      tiktok: 0,
      instagram: 0,
    };

    for (const source of sources) {
      if (source.platform === 'paper') breakdown.papers++;
      else if (source.platform === 'youtube') breakdown.youtube++;
      else if (source.platform === 'podcast') breakdown.podcasts++;
      else if (source.platform === 'tiktok') breakdown.tiktok++;
      else if (source.platform === 'instagram') breakdown.instagram++;
    }

    return breakdown;
  }

  /**
   * Build timestamp URL for multimedia sources
   */
  private buildTimestampUrl(source: {
    platform: string;
    url: string;
    timestamp?: number;
    id?: string;
  }): string | undefined {
    if (!source.timestamp) return undefined;

    if (source.platform === 'youtube') {
      return `${source.url}&t=${source.timestamp}`;
    } else if (source.platform === 'podcast') {
      return `${source.url}#t=${source.timestamp}`;
    }

    return undefined;
  }

  /**
   * Build human-readable sources description
   */
  private buildSourcesDescription(
    sources: Array<{
      platform: string;
      title: string;
      author: string;
      timestamp?: number;
    }>,
  ): string {
    return sources
      .map((source, index) => {
        const timestampInfo = source.timestamp
          ? ` (at ${this.formatTimestamp(source.timestamp)})`
          : '';
        return `${index + 1}. [${source.platform.toUpperCase()}] "${source.title}" by ${source.author}${timestampInfo}`;
      })
      .join('\n');
  }

  /**
   * Format timestamp in MM:SS format
   */
  private formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
}
