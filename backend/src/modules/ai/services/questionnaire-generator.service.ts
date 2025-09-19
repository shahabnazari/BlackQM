import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { AICostService } from './ai-cost.service';

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
    private readonly openaiService: OpenAIService,
    private readonly costService: AICostService,
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

      const response = await this.openaiService.generateCompletion(
        prompt,
        { model: 'smart', temperature: 0.8, maxTokens: 2000, userId },
      );

      const questions = this.parseQuestions(response.content);

      // Validate question count
      if (questions.length < questionCount) {
        this.logger.warn(`Only generated ${questions.length} out of ${questionCount} questions`);
      }

      // Cost tracking is handled by OpenAIService

      return questions;
    } catch (error) {
      this.logger.error('Failed to generate questionnaire:', error);
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
    responses: Record<string, any>,
    userId: string,
  ): Promise<GeneratedQuestion[]> {
    try {
      const prompt = `Based on these survey responses, suggest 3 follow-up questions.

Existing questions: ${JSON.stringify(existingQuestions.map(q => ({ id: q.id, text: q.text })))}

Responses: ${JSON.stringify(responses)}

Generate insightful follow-up questions that dig deeper into interesting patterns or responses.
Return as JSON array with same structure as before.`;

      const response = await this.openaiService.generateCompletion(
        prompt,
        { model: 'smart', temperature: 0.9, maxTokens: 1000, userId },
      );

      return this.parseQuestions(response.content);
    } catch (error) {
      this.logger.error('Failed to suggest follow-up questions:', error);
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

      const response = await this.openaiService.generateCompletion(
        prompt,
        { model: 'smart', temperature: 0.3, maxTokens: 1000, userId },
      );

      const result = JSON.parse(response.content.match(/\{[\s\S]*\}/)?.[0] || '{"overallScore": 0.5, "issues": []}');
      
      return {
        overallScore: result.overallScore || 0.5,
        issues: result.issues || [],
      };
    } catch (error) {
      this.logger.error('Failed to validate question quality:', error);
      return { overallScore: 0.5, issues: [] };
    }
  }
}