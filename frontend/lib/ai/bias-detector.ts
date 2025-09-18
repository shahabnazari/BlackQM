/**
 * Bias Detector Service for Phase 6.86
 * AI-powered bias detection and mitigation for Q-methodology studies
 */

import { aiService } from '../services/ai.service';
import {
  BiasAnalysisRequest,
  BiasAnalysisResult,
  BiasIssue,
  BiasType,
  BiasFix
} from '../types/ai.types';

export class BiasDetectorService {
  private static instance: BiasDetectorService;
  
  private constructor() {}
  
  static getInstance(): BiasDetectorService {
    if (!BiasDetectorService.instance) {
      BiasDetectorService.instance = new BiasDetectorService();
    }
    return BiasDetectorService.instance;
  }
  
  async detectBias(request: BiasAnalysisRequest): Promise<BiasAnalysisResult> {
    const prompt = this.buildBiasDetectionPrompt(request);
    
    const response = await aiService.generateJSON<{
      overallScore: number;
      issues: Array<{
        type: BiasType;
        severity: 'low' | 'medium' | 'high';
        statementIndex: number;
        description: string;
        suggestion: string;
      }>;
      recommendations: string[];
    }>(prompt);
    
    // Generate fixes for identified issues
    const fixes = await this.generateFixes(request.statements, response.issues);
    
    return {
      overallScore: response.overallScore,
      issues: response.issues,
      recommendations: response.recommendations,
      suggestions: fixes
    };
  }
  
  private buildBiasDetectionPrompt(request: BiasAnalysisRequest): string {
    const {
      statements,
      studyTitle = '',
      studyDescription = '',
      checkTypes = ['language', 'perspective', 'cultural', 'confirmation', 'sampling', 'demographic']
    } = request;
    
    return `Analyze these Q-methodology statements for potential biases.

${studyTitle ? `Study Title: ${studyTitle}` : ''}
${studyDescription ? `Study Description: ${studyDescription}` : ''}

Statements to analyze:
${statements.map((s, i) => `${i}: "${s}"`).join('\n')}

Check for these bias types:
${checkTypes.map(type => `- ${type}: ${this.getBiasDescription(type)}`).join('\n')}

Scoring:
- 100: No bias detected
- 80-99: Minimal bias, minor improvements suggested
- 60-79: Moderate bias, significant improvements needed
- 40-59: High bias, major revisions required
- 0-39: Severe bias, complete rewrite recommended

Return as JSON:
{
  "overallScore": <0-100>,
  "issues": [
    {
      "type": "<bias type>",
      "severity": "low|medium|high",
      "statementIndex": <index>,
      "description": "<what's wrong>",
      "suggestion": "<how to fix>"
    }
  ],
  "recommendations": [
    "<general improvement suggestion>"
  ]
}

Be specific about issues and provide actionable suggestions.`;
  }
  
  private getBiasDescription(type: BiasType): string {
    const descriptions: Record<BiasType, string> = {
      language: 'Loaded terms, leading language, emotional manipulation',
      perspective: 'Missing viewpoints, one-sided framing, narrow focus',
      cultural: 'Cultural assumptions, ethnocentric language, exclusionary terms',
      confirmation: 'Favoring expected outcomes, leading toward specific answers',
      sampling: 'Biased selection of topics, unrepresentative statement set',
      demographic: 'Age, gender, race, class, or other demographic assumptions'
    };
    
    return descriptions[type] || 'General bias';
  }
  
  private async generateFixes(
    statements: string[],
    issues: BiasIssue[]
  ): Promise<BiasFix[]> {
    const fixes: BiasFix[] = [];
    
    // Group issues by statement
    const issuesByStatement = new Map<number, BiasIssue[]>();
    for (const issue of issues) {
      const existing = issuesByStatement.get(issue.statementIndex) || [];
      existing.push(issue);
      issuesByStatement.set(issue.statementIndex, existing);
    }
    
    // Generate fixes for each problematic statement
    for (const [index, statementIssues] of issuesByStatement.entries()) {
      if (index >= 0 && index < statements.length) {
        const original = statements[index];
        const fix = await this.generateStatementFix(original || '', statementIssues);
        
        fixes.push({
          statementIndex: index,
          original: original || '',
          suggested: fix.suggested,
          reasoning: fix.reasoning
        });
      }
    }
    
    return fixes;
  }
  
  private async generateStatementFix(
    statement: string,
    issues: BiasIssue[]
  ): Promise<{ suggested: string; reasoning: string }> {
    const issueDescriptions = issues
      .map(i => `${i.type}: ${i.description}`)
      .join('; ');
    
    const prompt = `Rewrite this Q-methodology statement to remove bias:

Original: "${statement}"

Issues identified: ${issueDescriptions}

Requirements:
1. Maintain the core concept
2. Remove all identified biases
3. Use neutral, inclusive language
4. Keep it concise (50-100 characters ideal)
5. Ensure it's still sortable on agree-disagree scale

Return as JSON:
{
  "suggested": "<improved statement>",
  "reasoning": "<brief explanation of changes>"
}`;
    
    try {
      return await aiService.generateJSON(prompt);
    } catch (error) {
      // Log error for debugging
      console.error('Failed to generate statement fix:', error);
      
      // Fallback with more informative response
      return {
        suggested: statement,
        reasoning: 'Automatic fix generation failed. Please review manually for bias.',
        error: true
      };
    }
  }
  
  async checkCulturalSensitivity(statements: string[]): Promise<{
    score: number;
    issues: Array<{
      statementIndex: number;
      issue: string;
      suggestion: string;
    }>;
  }> {
    const prompt = `Review these Q-methodology statements for cultural sensitivity:

${statements.map((s, i) => `${i}: "${s}"`).join('\n')}

Check for:
1. Culturally specific references that may not translate
2. Assumptions about social norms
3. Language that may be offensive in certain cultures
4. Western-centric perspectives
5. Religious or spiritual assumptions

Return as JSON:
{
  "score": <0-100, higher is more culturally sensitive>,
  "issues": [
    {
      "statementIndex": <index>,
      "issue": "<what's culturally problematic>",
      "suggestion": "<more inclusive alternative>"
    }
  ]
}`;
    
    return aiService.generateJSON(prompt);
  }
  
  async assessDiversity(statements: string[]): Promise<{
    score: number;
    analysis: {
      perspectivesCovered: string[];
      perspectivesMissing: string[];
      balance: string;
    };
  }> {
    const prompt = `Assess the diversity of perspectives in these Q-methodology statements:

${statements.map((s, i) => `${i}: "${s}"`).join('\n')}

Analyze:
1. Range of viewpoints represented
2. Balance of positive/negative/neutral statements
3. Coverage of different stakeholder perspectives
4. Missing perspectives that should be included

Return as JSON:
{
  "score": <0-100, higher is more diverse>,
  "analysis": {
    "perspectivesCovered": ["list of perspectives present"],
    "perspectivesMissing": ["list of missing perspectives"],
    "balance": "<assessment of overall balance>"
  }
}`;
    
    return aiService.generateJSON(prompt);
  }
  
  calculateQuickBiasScore(statements: string[]): number {
    // Quick heuristic-based bias check without AI
    let score = 100;
    const biasIndicators = [
      /everyone knows/i,
      /obviously/i,
      /clearly/i,
      /nobody/i,
      /always/i,
      /never/i,
      /must/i,
      /should/i,
      /wrong/i,
      /right/i,
      /stupid/i,
      /smart/i,
      /idiotic/i,
      /brilliant/i
    ];
    
    for (const statement of statements) {
      for (const indicator of biasIndicators) {
        if (indicator.test(statement)) {
          score -= 2;
        }
      }
      
      // Check for all caps (shouting)
      if (statement === statement.toUpperCase() && statement.length > 3) {
        score -= 5;
      }
      
      // Check for excessive punctuation
      if (/[!?]{2,}/.test(statement)) {
        score -= 3;
      }
    }
    
    return Math.max(0, score);
  }
}

// Export singleton instance
export const biasDetector = BiasDetectorService.getInstance();

// Export convenience functions
export async function detectBias(
  statements: string[],
  studyContext?: { title?: string; description?: string }
): Promise<BiasAnalysisResult> {
  return biasDetector.detectBias({
    statements,
    studyTitle: studyContext?.title || undefined,
    studyDescription: studyContext?.description || undefined
  });
}

export function quickBiasCheck(statements: string[]): number {
  return biasDetector.calculateQuickBiasScore(statements);
}

export async function checkCulturalSensitivity(
  statements: string[]
): Promise<any> {
  return biasDetector.checkCulturalSensitivity(statements);
}