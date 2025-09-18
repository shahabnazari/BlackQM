/**
 * Questionnaire Generator Service for Phase 6.86
 * AI-powered question generation for Q-methodology studies
 */

import { aiService } from '../services/ai.service';
import {
  QuestionnaireAIRequest,
  QuestionnaireAIResponse,
  AIGeneratedQuestion,
  QuestionType
} from '../types/ai.types';

export class QuestionnaireGeneratorService {
  private static instance: QuestionnaireGeneratorService;
  
  private constructor() {}
  
  static getInstance(): QuestionnaireGeneratorService {
    if (!QuestionnaireGeneratorService.instance) {
      QuestionnaireGeneratorService.instance = new QuestionnaireGeneratorService();
    }
    return QuestionnaireGeneratorService.instance;
  }
  
  async generateQuestions(
    request: QuestionnaireAIRequest
  ): Promise<QuestionnaireAIResponse> {
    const startTime = Date.now();
    
    // Build the prompt
    const prompt = this.buildQuestionnairePrompt(request);
    
    // Generate questions using AI
    const response = await aiService.generateJSON<{
      questions: Array<{
        id: string;
        type: QuestionType;
        text: string;
        options?: string[];
        required: boolean;
        reasoning: string;
      }>;
    }>(prompt);
    
    // Process and enhance questions
    const questions: AIGeneratedQuestion[] = response.questions.map(q => ({
      ...q,
      aiGenerated: true as const,
      confidence: this.calculateConfidence(q)
    }));
    
    // Add demographic questions if not present
    const enhancedQuestions = this.ensureDemographics(questions, request);
    
    return {
      questions: enhancedQuestions,
      metadata: {
        tokensUsed: 0, // Would come from AI service
        processingTime: Date.now() - startTime,
        confidence: this.calculateOverallConfidence(enhancedQuestions)
      }
    };
  }
  
  private buildQuestionnairePrompt(request: QuestionnaireAIRequest): string {
    const {
      topic,
      questionCount,
      questionTypes,
      targetAudience = 'general public',
      context = ''
    } = request;
    
    return `Generate ${questionCount} survey questions for a Q-methodology study about "${topic}".

Target Audience: ${targetAudience}
${context ? `Study Context: ${context}` : ''}

Requirements:
1. Questions should gather relevant demographic and contextual information
2. Include these question types: ${questionTypes.join(', ')}
3. Questions should be clear, unbiased, and easy to understand
4. Avoid leading questions or loaded language
5. Include answer options for closed-ended questions
6. Mix required and optional questions appropriately

Question Type Guidelines:
- text: Short open-ended responses (name, occupation, etc.)
- textarea: Longer open-ended responses (opinions, experiences)
- select: Single choice from dropdown (education level, age range)
- multiselect: Multiple choices (interests, concerns)
- radio: Single choice from visible options (yes/no, gender)
- checkbox: Multiple selections from list
- scale: Likert scale or numeric rating (1-5, 1-10)
- ranking: Order items by preference
- matrix: Grid of related questions with same scale

Return as JSON:
{
  "questions": [
    {
      "id": "Q1",
      "type": "${questionTypes[0] || 'text'}",
      "text": "Question text here",
      "options": ["Option 1", "Option 2"], // for select/radio/checkbox
      "required": true,
      "reasoning": "Why this question is important"
    }
  ]
}

Generate exactly ${questionCount} high-quality questions relevant to the study topic.`;
  }
  
  private calculateConfidence(question: Partial<AIGeneratedQuestion>): number {
    let confidence = 0.8; // Base confidence
    
    // Adjust based on question properties
    if (question.text && question.text.length > 10) confidence += 0.05;
    if (question.options && question.options.length >= 3) confidence += 0.05;
    if (question.reasoning && question.reasoning.length > 20) confidence += 0.05;
    if (!question.text.includes('?')) confidence -= 0.1; // Penalize non-questions
    
    return Math.min(1, Math.max(0, confidence));
  }
  
  private calculateOverallConfidence(questions: AIGeneratedQuestion[]): number {
    if (questions.length === 0) return 0;
    
    const sum = questions.reduce((acc, q) => acc + q.confidence, 0);
    return sum / questions.length;
  }
  
  private ensureDemographics(
    questions: AIGeneratedQuestion[],
    _request: QuestionnaireAIRequest
  ): AIGeneratedQuestion[] {
    const hasAge = questions.some(q => 
      q.text.toLowerCase().includes('age') || 
      q.text.toLowerCase().includes('birth')
    );
    
    const hasGender = questions.some(q => 
      q.text.toLowerCase().includes('gender') || 
      q.text.toLowerCase().includes('sex')
    );
    
    const hasEducation = questions.some(q => 
      q.text.toLowerCase().includes('education') || 
      q.text.toLowerCase().includes('degree')
    );
    
    const demographicQuestions: AIGeneratedQuestion[] = [];
    
    if (!hasAge) {
      demographicQuestions.push({
        id: `D${demographicQuestions.length + 1}`,
        type: 'select',
        text: 'What is your age range?',
        options: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
        required: false,
        aiGenerated: true,
        confidence: 1,
        reasoning: 'Standard demographic question for analysis'
      });
    }
    
    if (!hasGender) {
      demographicQuestions.push({
        id: `D${demographicQuestions.length + 1}`,
        type: 'radio',
        text: 'What is your gender?',
        options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
        required: false,
        aiGenerated: true,
        confidence: 1,
        reasoning: 'Standard demographic question for analysis'
      });
    }
    
    if (!hasEducation) {
      demographicQuestions.push({
        id: `D${demographicQuestions.length + 1}`,
        type: 'select',
        text: 'What is your highest level of education completed?',
        options: [
          'High school or less',
          'Some college',
          'Bachelor\'s degree',
          'Master\'s degree',
          'Doctoral degree',
          'Professional degree'
        ],
        required: false,
        aiGenerated: true,
        confidence: 1,
        reasoning: 'Standard demographic question for analysis'
      });
    }
    
    return [...demographicQuestions, ...questions];
  }
  
  async generateSkipLogic(
    questions: AIGeneratedQuestion[]
  ): Promise<Record<string, any>> {
    if (questions.length < 2) return {};
    
    const prompt = `Analyze these survey questions and suggest skip logic:

${questions.map(q => `${q.id}: ${q.text} (${q.type})`).join('\n')}

Identify questions where certain answers should skip to different questions.
Return as JSON with format:
{
  "questionId": {
    "condition": "answer value or condition",
    "skipTo": "target question id or 'end'"
  }
}`;
    
    try {
      return await aiService.generateJSON(prompt);
    } catch (error) {
      // Log the error for debugging
      console.error('Failed to generate skip logic:', error);
      
      // Return empty object with error flag
      return {
        error: true,
        message: 'Skip logic generation failed. You can add skip logic manually.',
        fallback: {}
      };
    }
  }
  
  async suggestQuestions(
    topic: string,
    existingQuestions: string[]
  ): Promise<string[]> {
    const prompt = `Suggest 5 additional survey questions for a study about "${topic}".

Existing questions:
${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Suggest questions that:
1. Fill gaps in the existing questions
2. Add different perspectives
3. Are relevant to Q-methodology research
4. Don't duplicate existing questions

Return as JSON array of question texts only.`;
    
    try {
      const suggestions = await aiService.generateJSON<string[]>(prompt);
      return suggestions;
    } catch (error) {
      // Log the error for debugging
      console.error('Failed to suggest questions:', error);
      
      // Return empty array with default suggestions
      return [
        'What is your overall opinion on this topic?',
        'What challenges have you experienced?',
        'What improvements would you suggest?',
        'How has this affected you personally?',
        'What are your future expectations?'
      ];
    }
  }
}

// Export singleton instance
export const questionnaireGenerator = QuestionnaireGeneratorService.getInstance();

// Export convenience functions
export async function generateQuestions(
  topic: string,
  questionCount: number = 10,
  options?: Partial<QuestionnaireAIRequest>
): Promise<QuestionnaireAIResponse> {
  return questionnaireGenerator.generateQuestions({
    topic,
    questionCount,
    questionTypes: options?.questionTypes || ['text', 'select', 'radio', 'scale'],
    ...options
  });
}

export async function suggestQuestions(
  topic: string,
  existingQuestions: string[]
): Promise<string[]> {
  return questionnaireGenerator.suggestQuestions(topic, existingQuestions);
}