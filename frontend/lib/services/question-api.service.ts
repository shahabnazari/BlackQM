import { api } from '@/lib/api';

/**
 * Phase 8.2 Day 1: Question API Service
 * 
 * Frontend service for interacting with question endpoints
 * World-class error handling and type safety
 */

export interface Question {
  id: string;
  surveyId: string;
  type: QuestionType;
  text: string;
  description?: string;
  required: boolean;
  order: number;
  validation?: any;
  options?: any;
  logic?: any;
  createdAt: string;
  updatedAt: string;
}

export enum QuestionType {
  MULTIPLE_CHOICE_SINGLE = 'MULTIPLE_CHOICE_SINGLE',
  MULTIPLE_CHOICE_MULTI = 'MULTIPLE_CHOICE_MULTI',
  DROPDOWN = 'DROPDOWN',
  RATING_SCALE = 'RATING_SCALE',
  LIKERT_SCALE = 'LIKERT_SCALE',
  SEMANTIC_DIFFERENTIAL = 'SEMANTIC_DIFFERENTIAL',
  TEXT_ENTRY = 'TEXT_ENTRY',
  NUMERIC_ENTRY = 'NUMERIC_ENTRY',
  DATE_TIME = 'DATE_TIME',
  SLIDER = 'SLIDER',
  RANK_ORDER = 'RANK_ORDER',
  MATRIX_GRID = 'MATRIX_GRID',
  FILE_UPLOAD = 'FILE_UPLOAD',
  CONSTANT_SUM = 'CONSTANT_SUM',
  NET_PROMOTER_SCORE = 'NET_PROMOTER_SCORE'
}

export interface ScreeningResult {
  qualified: boolean;
  score?: number;
  reason?: string;
  redirectUrl?: string;
  quotaStatus?: Record<string, string>;
  recommendations?: string[];
  alternativeStudies?: string[];
}

export interface CreateQuestionDto {
  surveyId: string;
  type: QuestionType;
  text: string;
  description?: string;
  required?: boolean;
  order: number;
  validation?: any;
  options?: any;
  logic?: any;
}

export interface UpdateQuestionDto {
  type?: QuestionType;
  text?: string;
  description?: string;
  required?: boolean;
  order?: number;
  validation?: any;
  options?: any;
  logic?: any;
}

export interface ImportQuestionsDto {
  surveyId: string;
  questions: CreateQuestionDto[];
  clearExisting?: boolean;
}

export interface QuestionTemplate {
  name: string;
  description?: string;
  category: string;
  questions: Omit<CreateQuestionDto, 'surveyId'>[];
  tags?: string[];
}

class QuestionAPIService {
  private baseUrl = '/api/questions';

  /**
   * Get all questions for a survey
   */
  async getQuestions(
    surveyId: string,
    params?: {
      type?: QuestionType;
      required?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<Question[]> {
    try {
      const response = await api.get(`${this.baseUrl}/survey/${surveyId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  /**
   * Get screening questions for a survey
   */
  async getScreeningQuestions(surveyId: string): Promise<Question[]> {
    try {
      const response = await api.get(`${this.baseUrl}/survey/${surveyId}/screening`);
      return response.data;
    } catch (error) {
      console.error('Error fetching screening questions:', error);
      throw error;
    }
  }

  /**
   * Get a single question
   */
  async getQuestion(id: string): Promise<Question> {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  }

  /**
   * Create a new question
   */
  async createQuestion(data: CreateQuestionDto): Promise<Question> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  /**
   * Update a question
   */
  async updateQuestion(id: string, data: UpdateQuestionDto): Promise<Question> {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  /**
   * Delete a question
   */
  async deleteQuestion(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }

  /**
   * Update question order
   */
  async updateQuestionOrder(
    surveyId: string,
    questions: Array<{ id: string; order: number }>
  ): Promise<void> {
    try {
      await api.put(`${this.baseUrl}/survey/${surveyId}/order`, { questions });
    } catch (error) {
      console.error('Error updating question order:', error);
      throw error;
    }
  }

  /**
   * Import multiple questions
   */
  async importQuestions(data: ImportQuestionsDto): Promise<Question[]> {
    try {
      const response = await api.post(`${this.baseUrl}/import`, data);
      return response.data;
    } catch (error) {
      console.error('Error importing questions:', error);
      throw error;
    }
  }

  /**
   * Export questions
   */
  async exportQuestions(
    surveyId: string,
    format: 'json' | 'csv' | 'xlsx' | 'qsf',
    options?: {
      includeLogic?: boolean;
      includeValidation?: boolean;
      includeAnswers?: boolean;
    }
  ): Promise<any> {
    try {
      const response = await api.post(`${this.baseUrl}/export`, {
        surveyId,
        format,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting questions:', error);
      throw error;
    }
  }

  /**
   * Duplicate questions between surveys
   */
  async duplicateQuestions(fromSurveyId: string, toSurveyId: string): Promise<Question[]> {
    try {
      const response = await api.post(`${this.baseUrl}/duplicate`, {
        fromSurveyId,
        toSurveyId
      });
      return response.data;
    } catch (error) {
      console.error('Error duplicating questions:', error);
      throw error;
    }
  }

  /**
   * Get question templates
   */
  async getTemplates(category?: string): Promise<QuestionTemplate[]> {
    try {
      const response = await api.get(`${this.baseUrl}/templates`, {
        params: category ? { category } : undefined
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Get AI-generated question suggestions
   */
  async getAISuggestions(context: {
    surveyTitle: string;
    existingQuestions: string[];
    targetAudience?: string;
  }): Promise<CreateQuestionDto[]> {
    try {
      const response = await api.post(`${this.baseUrl}/ai/suggestions`, context);
      return response.data;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw error;
    }
  }

  /**
   * Validate an answer
   */
  async validateAnswer(questionId: string, value: any): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    try {
      const response = await api.post(`${this.baseUrl}/validate`, {
        questionId,
        value
      });
      return response.data;
    } catch (error) {
      console.error('Error validating answer:', error);
      throw error;
    }
  }

  /**
   * Get visible questions based on skip logic
   */
  async getVisibleQuestions(
    surveyId: string,
    previousAnswers: Record<string, any>
  ): Promise<Question[]> {
    try {
      const response = await api.post(`${this.baseUrl}/survey/${surveyId}/visible`, {
        previousAnswers
      });
      return response.data;
    } catch (error) {
      console.error('Error getting visible questions:', error);
      throw error;
    }
  }

  /**
   * Evaluate screening responses
   */
  async evaluateScreening(
    surveyId: string,
    participantId: string,
    responses: Record<string, any>
  ): Promise<ScreeningResult> {
    try {
      const response = await api.post(
        `${this.baseUrl}/survey/${surveyId}/screening/evaluate`,
        { participantId, responses }
      );
      return response.data;
    } catch (error) {
      console.error('Error evaluating screening:', error);
      throw error;
    }
  }

  /**
   * Get screening configuration
   */
  async getScreeningConfig(surveyId: string): Promise<any> {
    try {
      const response = await api.get(
        `${this.baseUrl}/survey/${surveyId}/screening/config`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching screening config:', error);
      throw error;
    }
  }

  /**
   * Update screening configuration
   */
  async updateScreeningConfig(surveyId: string, config: any): Promise<void> {
    try {
      await api.put(
        `${this.baseUrl}/survey/${surveyId}/screening/config`,
        config
      );
    } catch (error) {
      console.error('Error updating screening config:', error);
      throw error;
    }
  }

  /**
   * Get screening statistics
   */
  async getScreeningStatistics(surveyId: string): Promise<{
    total: number;
    qualified: number;
    disqualified: number;
    qualificationRate: number;
    disqualificationReasons: Record<string, number>;
    averageScreeningTime: number;
  }> {
    try {
      const response = await api.get(
        `${this.baseUrl}/survey/${surveyId}/screening/statistics`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching screening statistics:', error);
      throw error;
    }
  }

  /**
   * Submit answer to a question
   */
  async submitAnswer(data: {
    questionId: string;
    value: any;
    otherValue?: string;
    comment?: string;
    timeSpent?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/answer`, data);
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }
}

export const questionAPIService = new QuestionAPIService();