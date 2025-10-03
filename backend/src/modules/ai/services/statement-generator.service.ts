import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';

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

  constructor(private openai: OpenAIService) {}

  async generateStatements(
    topic: string,
    options: StatementGenerationOptions = {},
    userId?: string
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
      maxLength
    );

    const response = await this.openai.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.8,
      maxTokens: 2000,
      userId,
    });

    return this.parseStatements(response.content);
  }

  private buildGenerationPrompt(
    topic: string,
    count: number,
    perspectives: string[],
    avoidBias: boolean,
    level: string,
    maxLength: number
  ): string {
    const perspectivesList = perspectives.length > 0 
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
    const lines = response.split('\n').filter(line => line.trim());
    const statements: Statement[] = [];

    for (const line of lines) {
      const match = line.match(/^(S\d+):\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)$/);
      if (match) {
        statements.push({
          id: match[1],
          text: match[2].trim(),
          perspective: match[3].trim(),
          polarity: match[4].trim().toLowerCase() as 'positive' | 'negative' | 'neutral',
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
    userId?: string
  ): Promise<StatementValidation> {
    const validationPrompt = `Review these Q-methodology statements about "${topic}" for quality and appropriateness.

STATEMENTS:
${statements.map(s => `${s.id}: "${s.text}"`).join('\n')}

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

    const response = await this.openai.generateCompletion(validationPrompt, {
      model: 'smart',
      temperature: 0.3,
      maxTokens: 1500,
      userId,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      this.logger.error('Failed to parse validation response:', error);
      return {
        overallQuality: 70,
        issues: [],
        improvements: ['Unable to parse AI validation response'],
      };
    }
  }

  async suggestNeutralAlternative(
    statement: string,
    userId?: string
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

    const response = await this.openai.generateCompletion(prompt, {
      model: 'fast',
      temperature: 0.5,
      maxTokens: 100,
      userId,
    });

    return response.content.trim().replace(/^["']|["']$/g, '');
  }

  async generatePerspectiveGuidelines(
    topic: string,
    userId?: string
  ): Promise<string[]> {
    const prompt = `For a Q-methodology study about "${topic}", identify 5-7 key perspectives or stakeholder groups that should be represented in the statements.

For each perspective, provide:
- Name of the perspective/group
- Brief description of their viewpoint
- Example stance they might take

Format as a simple list of perspectives.`;

    const response = await this.openai.generateCompletion(prompt, {
      model: 'fast',
      temperature: 0.6,
      maxTokens: 500,
      userId,
    });

    return response.content
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
  }

  async enhanceStatements(
    statements: string[],
    enhancementType: 'clarity' | 'balance' | 'diversity',
    userId?: string
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

    const response = await this.openai.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.6,
      maxTokens: 2000,
      userId,
    });

    return this.parseStatements(response.content);
  }

  async checkCulturalSensitivity(
    statements: string[],
    targetRegions: string[] = ['Global'],
    userId?: string
  ): Promise<any> {
    const prompt = `Review these Q-methodology statements for cultural sensitivity issues considering ${targetRegions.join(', ')} audiences:

${statements.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Identify:
1. Culturally specific references that may not translate
2. Assumptions about social norms that vary by culture
3. Language that could be offensive or inappropriate in certain cultures
4. Suggestions for more inclusive alternatives

Return as JSON with flagged statements and recommendations.`;

    const response = await this.openai.generateCompletion(prompt, {
      model: 'smart',
      temperature: 0.3,
      maxTokens: 1500,
      userId,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return { flaggedStatements: [], recommendations: [] };
    }
  }

  async generateStatementVariations(
    originalStatement: string,
    count: number = 3,
    userId?: string
  ): Promise<string[]> {
    const prompt = `Generate ${count} variations of this Q-methodology statement that express slightly different nuances of the same concept:

Original: "${originalStatement}"

Requirements:
- Each variation should be distinctly different but related
- Maintain similar length (±10 characters)
- Suitable for Q-methodology sorting
- Vary the emphasis or angle while keeping the core topic

Return only the variations, one per line.`;

    const response = await this.openai.generateCompletion(prompt, {
      model: 'fast',
      temperature: 0.7,
      maxTokens: 300,
      userId,
    });

    return response.content
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, count);
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
    userId?: string
  ): Promise<StatementWithProvenance[]> {
    this.logger.log(`Generating statements from ${themes.length} multi-platform themes`);

    const statements: StatementWithProvenance[] = [];

    for (const themeData of themes) {
      // Build prompt with source citations
      const sourcesDescription = this.buildSourcesDescription(themeData.sources);

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

      const response = await this.openai.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.7,
        maxTokens: 100,
        userId,
      });

      const statementText = response.content.trim().replace(/^["']|["']$/g, '');

      // Calculate provenance
      const sources: MultimediaSource[] = themeData.sources.map(source => ({
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
      const hasTimestamps = sources.some(s => s.timestamp !== undefined);

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
    }

    this.logger.log(`Generated ${statements.length} statements with full provenance`);
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
  private buildSourcesDescription(sources: Array<{
    platform: string;
    title: string;
    author: string;
    timestamp?: number;
  }>): string {
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