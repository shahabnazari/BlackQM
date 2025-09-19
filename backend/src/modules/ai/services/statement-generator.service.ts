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
}