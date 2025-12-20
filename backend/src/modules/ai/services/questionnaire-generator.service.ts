import { Injectable, Logger } from '@nestjs/common';
// Phase 10.185 Week 2: Migrated from OpenAIService to UnifiedAIService
// Benefits: Groq FREE tier first, 80% cost reduction with Gemini fallback
import { UnifiedAIService } from './unified-ai.service';

// ============================================================================
// SYSTEM PROMPTS (Phase 10.185: Netflix-grade prompt engineering)
// ============================================================================

/**
 * System prompt for questionnaire generation
 * Used for: generateQuestionnaire
 */
const QUESTIONNAIRE_GENERATION_SYSTEM_PROMPT = `You are an expert survey designer specializing in Q-methodology research. Your task is to generate high-quality survey questions.

CRITICAL REQUIREMENTS:
1. Questions must be clear, unambiguous, and neutral
2. Avoid leading or biased language
3. Each question should serve a specific research purpose
4. Include a mix of question types as specified
5. Questions must be appropriate for the target audience
6. Output ONLY valid JSON - no markdown, no explanations

QUESTION QUALITY STANDARDS:
- Use simple, accessible language
- Avoid double-barreled questions (asking two things at once)
- Provide appropriate response options
- Include clear skip logic if requested

You are precise, consistent, and always follow the exact output format requested.`;

/**
 * System prompt for follow-up question suggestions
 * Used for: suggestFollowUpQuestions
 */
const FOLLOWUP_QUESTIONS_SYSTEM_PROMPT = `You are an expert at designing follow-up survey questions based on response patterns.

Your task is to suggest insightful follow-up questions that:
1. Dig deeper into interesting patterns in the responses
2. Clarify ambiguous or unexpected answers
3. Explore themes that emerged from initial responses
4. Maintain consistency with the existing question style

Output ONLY valid JSON arrays with the same structure as the original questions.`;

/**
 * System prompt for question quality validation
 * Used for: validateQuestionQuality
 */
const QUESTION_VALIDATION_SYSTEM_PROMPT = `You are an expert at evaluating survey question quality for research validity.

EVALUATION CRITERIA:
1. Leading or biased language - Does the question push toward a particular answer?
2. Ambiguous wording - Could the question be interpreted multiple ways?
3. Double-barreled questions - Does it ask about two things at once?
4. Inappropriate assumptions - Does it assume facts not in evidence?
5. Missing response options - Are all reasonable answers covered?
6. Logical flow - Does the question sequence make sense?

OUTPUT: Valid JSON only with overallScore (0-1) and issues array.`;

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: 'likert' | 'multipleChoice' | 'openEnded' | 'ranking' | 'demographic';
  options?: string[];
  required: boolean;
  skipLogic?: {
    condition: string;
    targetQuestionId: string;
  };
  aiGenerated: true;
  confidence: number;
  reasoning: string;
}

@Injectable()
export class QuestionnaireGeneratorService {
  private readonly logger = new Logger(QuestionnaireGeneratorService.name);

  constructor(
    // Phase 10.185 Week 2: Unified AI Service with Groq FREE → Gemini → OpenAI fallback
    // Note: Cost tracking is now handled internally by UnifiedAIService
    private readonly aiService: UnifiedAIService,
  ) {}

  async generateQuestionnaire(
    studyTopic: string,
    questionCount: number,
    questionTypes: string[],
    targetAudience: string | undefined,
    includeSkipLogic: boolean,
    userId: string,
  ): Promise<GeneratedQuestion[]> {
    try {
      const prompt = this.buildPrompt(
        studyTopic,
        questionCount,
        questionTypes,
        targetAudience,
        includeSkipLogic,
      );

      // Phase 10.185 Week 2: Use UnifiedAIService with questionnaire system prompt
      // Provider chain: Groq FREE → Gemini (80% cheaper) → OpenAI
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.8,
        maxTokens: 2000,
        systemPrompt: QUESTIONNAIRE_GENERATION_SYSTEM_PROMPT,
        cache: true,
        userId,
      });

      const questions = this.parseQuestions(response.content);

      // Validate question count
      if (questions.length < questionCount) {
        this.logger.warn(`Only generated ${questions.length} out of ${questionCount} questions`);
      }

      // Cost tracking is now handled internally by UnifiedAIService

      return questions;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate questionnaire: ${errMsg}`);
      throw new Error('Failed to generate questionnaire');
    }
  }

  private buildPrompt(
    topic: string,
    count: number,
    types: string[],
    audience: string | undefined,
    skipLogic: boolean,
  ): string {
    return `Generate ${count} survey questions for a Q-methodology study about "${topic}".

Requirements:
- Question types to include: ${types.join(', ')}
- Target audience: ${audience || 'General public'}
- Include skip logic: ${skipLogic ? 'Yes' : 'No'}
- Mix of question types for comprehensive data collection
- Questions should explore different aspects of the topic
- Include demographic questions if 'demographic' is in types

For each question, return JSON with:
{
  "id": "q1", "q2", etc.,
  "text": "The question text",
  "type": "likert" | "multipleChoice" | "openEnded" | "ranking" | "demographic",
  "options": ["option1", "option2"] (for multiple choice, likert scale, etc.),
  "required": true/false,
  "skipLogic": { "condition": "answer == 'Yes'", "targetQuestionId": "q3" } (if applicable),
  "aiGenerated": true,
  "confidence": 0.0-1.0,
  "reasoning": "Why this question is valuable for the study"
}

Return a JSON array of questions.

Question Type Guidelines:
- Likert: Use 5-point or 7-point scales
- Multiple Choice: 3-6 options typically
- Open Ended: For qualitative insights
- Ranking: For priority assessment
- Demographic: Age, gender, education, etc.

Ensure questions are:
- Clear and unambiguous
- Neutral (avoiding leading language)
- Relevant to the study topic
- Appropriate for the target audience`;
  }

  private parseQuestions(response: string): GeneratedQuestion[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return parsed
        .filter((q: any) => this.isValidQuestion(q))
        .map((q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          text: q.text,
          type: q.type,
          options: q.options,
          required: q.required !== false,
          skipLogic: q.skipLogic,
          aiGenerated: true,
          confidence: q.confidence || 0.8,
          reasoning: q.reasoning || 'AI generated question',
        }));
    } catch (error) {
      this.logger.error('Failed to parse questions:', error);
      return [];
    }
  }

  private isValidQuestion(q: any): boolean {
    const validTypes = ['likert', 'multipleChoice', 'openEnded', 'ranking', 'demographic'];
    
    return (
      typeof q.text === 'string' &&
      q.text.length > 0 &&
      validTypes.includes(q.type) &&
      (q.type === 'openEnded' || Array.isArray(q.options))
    );
  }

  async suggestFollowUpQuestions(
    existingQuestions: GeneratedQuestion[],
    responses: Record<string, unknown>,
    userId: string,
  ): Promise<GeneratedQuestion[]> {
    try {
      const prompt = `Based on these survey responses, suggest 3 follow-up questions.

Existing questions: ${JSON.stringify(existingQuestions.map(q => ({ id: q.id, text: q.text })))}

Responses: ${JSON.stringify(responses)}

Generate insightful follow-up questions that dig deeper into interesting patterns or responses.
Return as JSON array with same structure as before.`;

      // Phase 10.185 Week 2: Use UnifiedAIService with follow-up system prompt
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.9,
        maxTokens: 1000,
        systemPrompt: FOLLOWUP_QUESTIONS_SYSTEM_PROMPT,
        cache: false, // Don't cache - responses vary by context
        userId,
      });

      return this.parseQuestions(response.content);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to suggest follow-up questions: ${errMsg}`);
      return [];
    }
  }

  async validateQuestionQuality(
    questions: GeneratedQuestion[],
    userId: string,
  ): Promise<{
    overallScore: number;
    issues: Array<{ questionId: string; issue: string; suggestion: string }>;
  }> {
    try {
      const prompt = `Analyze these survey questions for quality issues:

${JSON.stringify(questions)}

Check for:
- Leading or biased language
- Ambiguous wording
- Double-barreled questions
- Inappropriate assumptions
- Missing response options
- Logical flow issues

Return JSON with:
{
  "overallScore": 0.0-1.0,
  "issues": [
    {
      "questionId": "q1",
      "issue": "Description of the problem",
      "suggestion": "How to fix it"
    }
  ]
}`;

      // Phase 10.185 Week 2: Use UnifiedAIService with validation system prompt
      const response = await this.aiService.generateCompletion(prompt, {
        model: 'smart',
        temperature: 0.3,
        maxTokens: 1000,
        systemPrompt: QUESTION_VALIDATION_SYSTEM_PROMPT,
        cache: true,
        userId,
      });

      const result = JSON.parse(response.content.match(/\{[\s\S]*\}/)?.[0] || '{"overallScore": 0.5, "issues": []}');

      return {
        overallScore: result.overallScore || 0.5,
        issues: result.issues || [],
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to validate question quality: ${errMsg}`);
      return { overallScore: 0.5, issues: [] };
    }
  }
}