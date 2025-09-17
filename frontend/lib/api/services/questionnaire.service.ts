import { apiClient, ApiResponse } from '../client';

export interface CreateQuestionRequest {
  surveyId: string;
  type: string;
  text: string;
  description?: string;
  helpText?: string;
  required?: boolean;
  options?: any;
  config?: any;
  validation?: any;
  logic?: any;
  piping?: any;
  randomization?: any;
  layout?: string;
  theme?: string;
  animations?: boolean;
}

export interface UpdateQuestionRequest {
  type?: string;
  text?: string;
  description?: string;
  helpText?: string;
  required?: boolean;
  options?: any;
  config?: any;
  validation?: any;
  logic?: any;
  piping?: any;
  randomization?: any;
  layout?: string;
  theme?: string;
  animations?: boolean;
}

export interface GenerateQuestionsRequest {
  surveyContext: {
    title: string;
    category?: string;
    existingQuestions?: any;
  }
  mode: 'smart' | 'comprehensive' | 'targeted';
  customPrompt?: string;
  count?: number;
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  type: string;
  rationale: string;
  confidence: number;
  category: string;
  options?: Array<{ text: string; value: string }>
  validation?: any;
  skipLogic?: any;
  config?: any;
}

class QuestionnaireService {
  async createQuestion(data: CreateQuestionRequest): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>('/questionnaire/questions', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  async updateQuestion(questionId: string, data: UpdateQuestionRequest): Promise<any> {
    try {
      const response = await apiClient.put<ApiResponse<any>>(`/questionnaire/questions/${questionId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  async deleteQuestion(questionId: string): Promise<any> {
    try {
      const response = await apiClient.delete<ApiResponse<any>>(`/questionnaire/questions/${questionId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }

  async reorderQuestions(surveyId: string, questionIds: string[]): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/questionnaire/surveys/${surveyId}/reorder`, {
        questionIds
      })
      return response.data;
    } catch (error: any) {
      console.error('Error reordering questions:', error);
      throw error;
    }
  }

  async getQuestions(surveyId: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/questionnaire/surveys/${surveyId}/questions`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  async duplicateQuestion(questionId: string): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/questionnaire/questions/${questionId}/duplicate`);
      return response.data;
    } catch (error: any) {
      console.error('Error duplicating question:', error);
      throw error;
    }
  }

  async generateQuestions(request: GenerateQuestionsRequest): Promise<GeneratedQuestion[]> {
    try {
      console.log('Generating AI questions with request:', request);
      const response = await apiClient.post<ApiResponse<{ questions: GeneratedQuestion[] }>>('/questionnaire/ai/generate-questions', request);
      console.log('AI Response received:', response);

      // Handle both wrapped and unwrapped responses
      const questions = response.data?.questions || [];

      if (questions.length > 0) {
        console.log(`Successfully generated ${questions.length} AI questions`);
        return questions;
      } else {
        console.warn('No questions generated from AI, falling back to mock data');
        return this.generateEnhancedMockQuestions(request);
      }
    } catch (error: any) {
      console.error('Error generating questions:', error);
      console.log('Falling back to mock data due to error');

      // Fallback to enhanced mock data for development
      return this.generateEnhancedMockQuestions(request);
    }
  }

  private generateEnhancedMockQuestions(request: GenerateQuestionsRequest): GeneratedQuestion[] {
    const { mode, customPrompt, count = 8 } = request;
    const questions: GeneratedQuestion[] = [];

    if (mode === 'comprehensive') {
      // Generate a comprehensive set of questions with all types
      questions.push(
        {
          id: 'ai-1',
          text: 'How satisfied are you with the overall experience?',
          type: 'likert_scale',
          rationale: 'Essential baseline satisfaction metric for comprehensive analysis',
          confidence: 95,
          category: 'Satisfaction',
          options: [
            { text: 'Strongly Disagree', value: '1' },
            { text: 'Disagree', value: '2' },
            { text: 'Neutral', value: '3' },
            { text: 'Agree', value: '4' },
            { text: 'Strongly Agree', value: '5' }
          ],
          validation: {
            required: true
          }
        },
        {
          id: 'ai-2',
          text: 'Which of the following features do you use most frequently?',
          type: 'multiple_choice',
          rationale: 'Identifies usage patterns and feature priorities',
          confidence: 92,
          category: 'Usage',
          options: [
            { text: 'Dashboard & Analytics', value: 'dashboard' },
            { text: 'Data Collection', value: 'data_collection' },
            { text: 'Reporting Tools', value: 'reporting' },
            { text: 'Collaboration Features', value: 'collaboration' },
            { text: 'API Integration', value: 'api' },
            { text: 'Mobile App', value: 'mobile' }
          ]
        },
        {
          id: 'ai-3',
          text: 'On a scale of 0-10, how likely are you to recommend our service to a colleague?',
          type: 'nps',
          rationale: 'Net Promoter Score for measuring customer loyalty',
          confidence: 98,
          category: 'Loyalty',
          config: {
            min: 0,
            max: 10,
            labels: {
              0: 'Not at all likely',
              10: 'Extremely likely'
            }
          }
        },
        {
          id: 'ai-4',
          text: 'Please rank the following aspects in order of importance to you:',
          type: 'ranking',
          rationale: 'Understanding user priorities helps guide product development',
          confidence: 87,
          category: 'Priorities',
          options: [
            { text: 'Performance & Speed', value: 'performance' },
            { text: 'User Interface Design', value: 'ui' },
            { text: 'Feature Set', value: 'features' },
            { text: 'Customer Support', value: 'support' },
            { text: 'Pricing & Value', value: 'pricing' },
            { text: 'Security & Privacy', value: 'security' }
          ]
        },
        {
          id: 'ai-5',
          text: 'How would you rate the ease of use of our platform?',
          type: 'slider_scale',
          rationale: 'Usability assessment with granular feedback',
          confidence: 90,
          category: 'Usability',
          config: {
            min: 1,
            max: 10,
            step: 1,
            showLabels: true,
            labels: {
              1: 'Very Difficult',
              5: 'Neutral',
              10: 'Very Easy'
            }
          }
        },
        {
          id: 'ai-6',
          text: 'What is your primary use case for our platform?',
          type: 'single_choice',
          rationale: 'Understanding primary use cases helps segment users',
          confidence: 88,
          category: 'Usage',
          options: [
            { text: 'Academic Research', value: 'academic' },
            { text: 'Market Research', value: 'market' },
            { text: 'User Experience Research', value: 'ux' },
            { text: 'Social Science Research', value: 'social' },
            { text: 'Internal Surveys', value: 'internal' },
            { text: 'Other', value: 'other' }
          ],
          skipLogic: {
            conditions: [
              {
                questionId: 'ai-6',
                operator: 'equals',
                value: 'other',
                action: 'show',
                targetQuestion: 'ai-6-other'
              }
            ]
          }
        },
        {
          id: 'ai-7',
          text: 'Please describe any specific improvements or features you would like to see:',
          type: 'text_long',
          rationale: 'Open-ended feedback captures insights structured questions might miss',
          confidence: 85,
          category: 'Feedback',
          validation: {
            minLength: 20,
            maxLength: 500
          }
        },
        {
          id: 'ai-8',
          text: 'How would you rate the following aspects of our service?',
          type: 'matrix',
          rationale: 'Matrix question for efficient multi-dimensional feedback',
          confidence: 91,
          category: 'Evaluation',
          config: {
            rows: [
              { text: 'Response Time', value: 'response_time' },
              { text: 'Feature Quality', value: 'feature_quality' },
              { text: 'Documentation', value: 'documentation' },
              { text: 'Support Quality', value: 'support' }
            ],
            columns: [
              { text: 'Poor', value: '1' },
              { text: 'Fair', value: '2' },
              { text: 'Good', value: '3' },
              { text: 'Very Good', value: '4' },
              { text: 'Excellent', value: '5' }
            ]
          }
        }
      );
    } else if (mode === 'targeted' && customPrompt) {
      // Generate targeted questions based on custom prompt
      questions.push({
        id: 'targeted-1',
        text: customPrompt.includes('satisfaction')
          ? 'How satisfied are you with the specific aspect mentioned?'
          : 'Please rate your experience with the targeted area:',
        type: 'rating',
        rationale: `Targeted question based on: ${customPrompt}`,
        confidence: 85,
        category: 'Targeted',
        config: {
          maxRating: 5,
          ratingType: 'star'
        }
      })
    } else {
      // Smart mode - balanced mix
      questions.push(
        {
          id: 'smart-1',
          text: 'Overall, how would you rate your experience?',
          type: 'rating',
          rationale: 'Quick satisfaction assessment',
          confidence: 93,
          category: 'Experience',
          config: {
            maxRating: 5,
            ratingType: 'star'
          }
        },
        {
          id: 'smart-2',
          text: 'What did you like most about your experience?',
          type: 'single_choice',
          rationale: 'Identifies positive aspects',
          confidence: 90,
          category: 'Feedback',
          options: [
            { text: 'Ease of Use', value: 'ease' },
            { text: 'Features', value: 'features' },
            { text: 'Performance', value: 'performance' },
            { text: 'Design', value: 'design' },
            { text: 'Support', value: 'support' }
          ]
        },
        {
          id: 'smart-3',
          text: 'Any additional comments or suggestions?',
          type: 'text_short',
          rationale: 'Captures additional insights',
          confidence: 85,
          category: 'Feedback',
          validation: {
            maxLength: 200
          }
        }
      );
    }

    return questions.slice(0, count);
  }

  async validateQuestions(...args: any[]): Promise<any> {
    try {
      const response = await apiClient.post('/questionnaire/validate', { questions: args[0] });
      return (response as any).data;
    } catch (error: any) {
      console.error('Error validating questions:', error);
      throw error;
    }
  }

  async saveQuestionnaire(...args: any[]): Promise<any> {
    try {
      const response = await apiClient.post(`/questionnaire/surveys/${args[0]}/save`, {
        questions: args[1]
      });
      return (response as any).data;
    } catch (error: any) {
      console.error('Error saving questionnaire:', error);
      throw error;
    }
  }
}

export const questionnaireService = new QuestionnaireService();
