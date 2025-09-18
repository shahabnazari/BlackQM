/**
 * Statement Generator Service for Phase 6.86
 * AI-powered Q-methodology statement generation with bias detection
 */

import { aiService } from '@/lib/services/ai.service';
import {
  StimulusGenerationRequest,
  GeneratedStimulus,
  StatementGenerationResponse
} from '@/lib/types/ai.types';

export class StatementGeneratorService {
  private static instance: StatementGeneratorService;
  
  private constructor() {}
  
  static getInstance(): StatementGeneratorService {
    if (!StatementGeneratorService.instance) {
      StatementGeneratorService.instance = new StatementGeneratorService();
    }
    return StatementGeneratorService.instance;
  }
  
  async generateStatements(
    request: StimulusGenerationRequest
  ): Promise<StatementGenerationResponse> {
    const startTime = Date.now();
    
    // Build the prompt
    const prompt = this.buildGenerationPrompt(request);
    
    // Generate statements using AI
    const response = await aiService.generateJSON<{
      statements: Array<{
        id: string;
        text: string;
        perspective: string;
        polarity: 'positive' | 'negative' | 'neutral';
        confidence: number;
      }>;
      metadata: {
        diversityScore: number;
      };
    }>(prompt);
    
    // Post-process and validate statements
    const processedStatements = await this.processStatements(
      response.statements,
      request
    );
    
    // Remove duplicates and ensure diversity
    const uniqueStatements = this.ensureUniqueness(processedStatements);
    const diverseStatements = this.ensureDiversity(uniqueStatements, request);
    
    return {
      statements: diverseStatements.map(stmt => ({
        ...stmt,
        generated: true as const,
        topic: request.topic
      })),
      metadata: {
        tokensUsed: 0, // This would come from the AI service in production
        processingTime: Date.now() - startTime,
        diversityScore: response.metadata?.diversityScore || this.calculateDiversityScore(diverseStatements)
      }
    };
  }
  
  private buildGenerationPrompt(request: StimulusGenerationRequest): string {
    const {
      topic,
      count = 30,
      perspectives = ['general'],
      avoidBias = true,
      academicLevel = 'intermediate'
    } = request;
    
    return `Generate ${count} diverse Q-methodology statements about "${topic}".

Requirements:
1. Statements must be concise (50-100 characters ideal, max 150)
2. Each statement should express a clear viewpoint that can be agreed or disagreed with
3. Cover these perspectives: ${perspectives.join(', ')}
4. Academic level: ${academicLevel}
5. ${avoidBias ? 'Avoid loaded language, leading statements, and obvious bias' : 'Include some provocative statements for discussion'}
6. Mix positive, negative, and neutral statements
7. Ensure statements are sortable on a strongly disagree to strongly agree scale
8. Avoid redundancy - each statement should express a unique viewpoint

Format your response as JSON:
{
  "statements": [
    {
      "id": "S01",
      "text": "Statement text here",
      "perspective": "economic",
      "polarity": "positive",
      "confidence": 0.95
    }
  ],
  "metadata": {
    "diversityScore": 0.85
  }
}

Guidelines by perspective:
${this.getPerspectiveGuidelines(perspectives)}

Examples of good Q-methodology statements:
- "Technology has improved the quality of human relationships"
- "Economic growth should be prioritized over environmental protection"
- "Government regulation stifles innovation"

Examples of poor statements (avoid these):
- "Some people think technology is good" (too vague)
- "Everyone knows climate change is real" (assumes consensus)
- "Do you like renewable energy?" (question format)

Generate exactly ${count} high-quality statements.`;
  }
  
  private getPerspectiveGuidelines(perspectives: string[]): string {
    const guidelines: Record<string, string> = {
      economic: '- Economic: Focus on costs, benefits, markets, trade-offs',
      environmental: '- Environmental: Address sustainability, ecology, conservation',
      social: '- Social: Consider equity, justice, community impact',
      technological: '- Technological: Explore innovation, progress, digital transformation',
      political: '- Political: Examine governance, policy, power dynamics',
      ethical: '- Ethical: Address moral considerations, values, principles',
      cultural: '- Cultural: Consider traditions, identity, diversity',
      health: '- Health: Focus on wellbeing, medical aspects, public health',
      educational: '- Educational: Address learning, knowledge, skill development',
      general: '- General: Cover broad, cross-cutting themes'
    };
    
    return perspectives
      .map(p => guidelines[p.toLowerCase()] || guidelines.general)
      .join('\n');
  }
  
  private async processStatements(
    statements: Array<{
      id?: string;
      text: string;
      perspective?: string;
      polarity?: 'positive' | 'negative' | 'neutral';
      confidence?: number;
    }>,
    request: StimulusGenerationRequest
  ): Promise<GeneratedStimulus[]> {
    return statements.map((stmt, index) => ({
      id: stmt.id || `S${String(index + 1).padStart(2, '0')}`,
      text: this.cleanStatementText(stmt.text),
      perspective: stmt.perspective || 'general',
      polarity: stmt.polarity || 'neutral',
      confidence: stmt.confidence || 0.8,
      generated: true as const,
      topic: request.topic
    }));
  }
  
  private cleanStatementText(text: string): string {
    // Remove quotes if they wrap the entire statement
    text = text.replace(/^["'](.*)["']$/, '$1');
    
    // Ensure proper capitalization
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Remove trailing punctuation if not needed
    text = text.replace(/[.,;]+$/, '');
    
    // Trim whitespace
    text = text.trim();
    
    // Truncate if too long
    if (text.length > 150) {
      text = text.substring(0, 147) + '...';
    }
    
    return text;
  }
  
  private ensureUniqueness(statements: GeneratedStimulus[]): GeneratedStimulus[] {
    const seen = new Set<string>();
    const unique: GeneratedStimulus[] = [];
    
    for (const stmt of statements) {
      // Create a normalized version for comparison
      const normalized = stmt.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(stmt);
      }
    }
    
    return unique;
  }
  
  private ensureDiversity(
    statements: GeneratedStimulus[],
    request: StimulusGenerationRequest
  ): GeneratedStimulus[] {
    const targetCount = request.count || 30;
    
    // Group by perspective
    const byPerspective = new Map<string, GeneratedStimulus[]>();
    for (const stmt of statements) {
      const group = byPerspective.get(stmt.perspective) || [];
      group.push(stmt);
      byPerspective.set(stmt.perspective, group);
    }
    
    // Group by polarity
    const byPolarity = new Map<string, GeneratedStimulus[]>();
    for (const stmt of statements) {
      const group = byPolarity.get(stmt.polarity) || [];
      group.push(stmt);
      byPolarity.set(stmt.polarity, group);
    }
    
    // Try to balance perspectives and polarities
    const balanced: GeneratedStimulus[] = [];
    const perspectiveKeys = Array.from(byPerspective.keys());
    const polarityKeys = ['positive', 'negative', 'neutral'];
    
    let perspectiveIndex = 0;
    let polarityIndex = 0;
    
    while (balanced.length < targetCount && balanced.length < statements.length) {
      // Rotate through perspectives
      const perspective = perspectiveKeys[perspectiveIndex % perspectiveKeys.length];
      const perspectiveGroup = byPerspective.get(perspective) || [];
      
      if (perspectiveGroup.length > 0) {
        // Try to get one with the desired polarity
        const desiredPolarity = polarityKeys[polarityIndex % polarityKeys.length];
        let selected = perspectiveGroup.find(s => s.polarity === desiredPolarity);
        
        if (!selected) {
          selected = perspectiveGroup[0];
        }
        
        if (selected && !balanced.includes(selected)) {
          balanced.push(selected);
          perspectiveGroup.splice(perspectiveGroup.indexOf(selected), 1);
        }
      }
      
      perspectiveIndex++;
      polarityIndex++;
    }
    
    // If we still need more, add remaining statements
    for (const stmt of statements) {
      if (balanced.length >= targetCount) break;
      if (!balanced.includes(stmt)) {
        balanced.push(stmt);
      }
    }
    
    return balanced.slice(0, targetCount);
  }
  
  private calculateDiversityScore(statements: GeneratedStimulus[]): number {
    if (statements.length === 0) return 0;
    
    // Calculate perspective diversity
    const perspectives = new Set(statements.map(s => s.perspective));
    const perspectiveDiversity = perspectives.size / Math.max(3, perspectives.size);
    
    // Calculate polarity balance
    const polarityCounts = new Map<string, number>();
    for (const stmt of statements) {
      polarityCounts.set(stmt.polarity, (polarityCounts.get(stmt.polarity) || 0) + 1);
    }
    
    const idealBalance = statements.length / 3;
    let polarityBalance = 0;
    for (const count of polarityCounts.values()) {
      polarityBalance += 1 - Math.abs(count - idealBalance) / statements.length;
    }
    polarityBalance /= 3;
    
    // Calculate text diversity (simple measure based on unique words)
    const allWords = new Set<string>();
    for (const stmt of statements) {
      const words = stmt.text.toLowerCase().split(/\s+/);
      words.forEach(w => allWords.add(w));
    }
    const avgWordsPerStatement = allWords.size / statements.length;
    const textDiversity = Math.min(1, avgWordsPerStatement / 10);
    
    // Combine scores
    return (perspectiveDiversity + polarityBalance + textDiversity) / 3;
  }
  
  async validateStatements(
    statements: GeneratedStimulus[]
  ): Promise<{
    valid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for minimum count
    if (statements.length < 20) {
      issues.push(`Only ${statements.length} statements generated (minimum 20 recommended)`);
      suggestions.push('Generate additional statements to reach at least 20');
    }
    
    // Check for duplicates
    const texts = statements.map(s => s.text.toLowerCase());
    const duplicates = texts.filter((t, i) => texts.indexOf(t) !== i);
    if (duplicates.length > 0) {
      issues.push(`Found ${duplicates.length} duplicate statements`);
      suggestions.push('Remove duplicate statements and generate replacements');
    }
    
    // Check for balance
    const polarityCounts = new Map<string, number>();
    for (const stmt of statements) {
      polarityCounts.set(stmt.polarity, (polarityCounts.get(stmt.polarity) || 0) + 1);
    }
    
    const counts = Array.from(polarityCounts.values());
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    
    if (maxCount > minCount * 2) {
      issues.push('Statements are not well-balanced across polarities');
      suggestions.push('Generate more statements with underrepresented polarities');
    }
    
    // Check statement length
    const tooLong = statements.filter(s => s.text.length > 150);
    if (tooLong.length > 0) {
      issues.push(`${tooLong.length} statements exceed 150 characters`);
      suggestions.push('Shorten long statements to improve readability');
    }
    
    const tooShort = statements.filter(s => s.text.length < 20);
    if (tooShort.length > 0) {
      issues.push(`${tooShort.length} statements are very short (< 20 characters)`);
      suggestions.push('Expand short statements to provide more context');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

// Export singleton instance
export const statementGenerator = StatementGeneratorService.getInstance();

// Export convenience functions
export async function generateStatements(
  topic: string,
  count: number = 30,
  options?: Partial<StimulusGenerationRequest>
): Promise<StatementGenerationResponse> {
  return statementGenerator.generateStatements({
    topic,
    count,
    ...options
  });
}

export async function validateStatements(
  statements: GeneratedStimulus[]
): Promise<{
  valid: boolean;
  issues: string[];
  suggestions: string[];
}> {
  return statementGenerator.validateStatements(statements);
}