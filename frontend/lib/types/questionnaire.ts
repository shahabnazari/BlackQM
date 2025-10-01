// Questionnaire Types and Interfaces
// Phase 6.91: Complete Type System for Questionnaires

export enum QuestionType {
  TEXT_SHORT = 'text_short',
  TEXT_LONG = 'text_long',
  NUMERIC = 'numeric',
  NUMBER = 'numeric', // Alias for NUMERIC
  NUMERIC_ENTRY = 'numeric', // Alias for NUMERIC
  EMAIL = 'email',
  URL = 'url',
  PHONE = 'phone',
  MULTIPLE_CHOICE = 'multiple_choice',
  MULTIPLE_CHOICE_SINGLE = 'multiple_choice_single',
  MULTIPLE_CHOICE_MULTI = 'multiple_choice_multi',
  CHECKBOX = 'checkbox',
  DROPDOWN = 'dropdown',
  LIKERT_SCALE = 'likert_scale',
  RATING_SCALE = 'rating_scale',
  SLIDER = 'slider',
  SLIDER_SCALE = 'slider', // Alias for SLIDER
  DATE = 'date',
  TIME = 'time',
  DATE_TIME = 'date_time',
  FILE_UPLOAD = 'file_upload',
  IMAGE_UPLOAD = 'image_upload',
  SIGNATURE = 'signature',
  SIGNATURE_CAPTURE = 'signature', // Alias for SIGNATURE
  RANKING = 'ranking',
  MATRIX = 'matrix',
  MATRIX_GRID = 'matrix', // Alias for MATRIX
  CONSTANT_SUM = 'constant_sum',
  MAX_DIFF = 'max_diff',
  CONJOINT = 'conjoint',
  CARD_SORT = 'card_sort',
  HEAT_MAP = 'heat_map',
  IMAGE_CHOICE = 'image_choice',
  VIDEO_RESPONSE = 'video_response',
  NET_PROMOTER_SCORE = 'net_promoter_score',
  SEMANTIC_DIFFERENTIAL = 'semantic_differential',
  YES_NO = 'yes_no',
}

export interface ValidationRule {
  type:
    | 'required'
    | 'minLength'
    | 'maxLength'
    | 'min'
    | 'max'
    | 'regex'
    | 'email'
    | 'url'
    | 'phone'
    | 'custom';
  value?: any;
  message?: string;
  errorMessage?: string;
  customValidator?: (value: any) => boolean;
}

export function getValidationErrorMessage(rule: ValidationRule): string {
  return rule.errorMessage || rule.message || 'Validation failed';
}

export interface SkipLogicCondition {
  questionId: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'greater'
    | 'less'
    | 'between'
    | 'in'
    | 'notIn';
  value: any;
  connector?: 'AND' | 'OR';
}

export interface SkipLogic {
  conditions: SkipLogicCondition[];
  action: 'show' | 'hide' | 'skip_to' | 'end_survey';
  targetQuestionId?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  value: any;
  order: number;
  imageUrl?: string;
  description?: string;
  disabled?: boolean;
}

export interface QuestionConfig {
  placeholder?: string;
  helpText?: string;
  maxLength?: number;
  minLength?: number;
  rows?: number;
  columns?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleStep?: number;
  allowOther?: boolean;
  randomizeOptions?: boolean;
  required?: boolean;
  multiple?: boolean;
  fileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  dateFormat?: string;
  timeFormat?: string;
  theme?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
  animations?: boolean;
}

export interface Question {
  id: string;
  surveyId: string;
  type: QuestionType;
  text: string;
  description?: string;
  required: boolean;
  order: number;
  layout: 'vertical' | 'horizontal' | 'grid';
  theme: 'default' | 'minimal' | 'colorful' | 'dark';
  animations: boolean;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Type-specific properties
  options?: QuestionOption[];
  validation?: ValidationRule[];
  skipLogic?: SkipLogic[];
  config?: QuestionConfig;
  helpText?: string;

  // Additional metadata
  tags?: string[];
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: number; // in seconds
  analytics?: {
    views: number;
    completions: number;
    averageTime: number;
    dropOffRate: number;
  };
}

export interface QuestionSection {
  id: string;
  surveyId: string;
  title: string;
  description?: string;
  order: number;
  questions: Question[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  settings: QuestionnaireSettings;
  sections: QuestionSection[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
}

export interface QuestionnaireSettings {
  allowBackNavigation: boolean;
  allowQuestionSkip: boolean;
  showProgress: boolean;
  randomizeQuestions: boolean;
  randomizeSections: boolean;
  timeLimit?: number; // in minutes
  maxAttempts?: number;
  requireAuthentication: boolean;
  allowAnonymous: boolean;
  collectMetadata: boolean;
  theme: 'default' | 'minimal' | 'colorful' | 'dark';
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
  notifications?: {
    emailOnCompletion: boolean;
    emailOnAbandonment: boolean;
    webhookUrl?: string;
  };
  analytics?: {
    trackUserBehavior: boolean;
    trackPageViews: boolean;
    trackTimeSpent: boolean;
  };
}

export interface QuestionnaireResponse {
  id: string;
  questionnaireId: string;
  participantId?: string;
  sessionId: string;
  responses: Record<string, any>;
  metadata?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number; // in seconds
  deviceInfo?: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
  };
  locationInfo?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface QuestionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface QuestionnaireAnalytics {
  totalResponses: number;
  completionRate: number;
  averageTimeToComplete: number;
  questionAnalytics: Record<
    string,
    {
      views: number;
      completions: number;
      averageTime: number;
      dropOffRate: number;
      commonAnswers: Array<{ value: any; count: number }>;
    }
  >;
  demographicBreakdown?: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    locations: Record<string, number>;
  };
  responsePatterns?: {
    peakHours: Array<{ hour: number; responses: number }>;
    peakDays: Array<{ day: string; responses: number }>;
    deviceBreakdown: Record<string, number>;
  };
}

// Template and Library Types
export interface QuestionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  type: QuestionType;
  config: Partial<Question>;
  popularity: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionLibrary {
  id: string;
  name: string;
  description: string;
  questions: QuestionTemplate[];
  categories: string[];
  isPublic: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Import/Export Types
export interface QuestionnaireExport {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  data: Questionnaire;
  includeResponses: boolean;
  responses?: QuestionnaireResponse[];
  analytics?: QuestionnaireAnalytics;
}

export interface QuestionnaireImport {
  format: 'json' | 'csv' | 'xlsx';
  data: string | File;
  options: {
    mergeWithExisting: boolean;
    updateExisting: boolean;
    validateStructure: boolean;
  };
}

// Component Props for question rendering
export interface QuestionComponentProps {
  question: Question;
  value?: any;
  onChange?: (value: any) => void;
  onValidate?: (isValid: boolean, errors?: string[]) => void;
  disabled?: boolean;
  showErrors?: boolean;
  errors?: string[];
  className?: string;
}

// Error Types
export class QuestionnaireError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'QuestionnaireError';
  }
}

export class ValidationError extends QuestionnaireError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', field, value);
    this.name = 'ValidationError';
  }
}

export class ImportError extends QuestionnaireError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 'IMPORT_ERROR', field, value);
    this.name = 'ImportError';
  }
}

// Utility Types
export type QuestionTypeConfig = {
  [K in QuestionType]: {
    name: string;
    description: string;
    icon: string;
    category: 'input' | 'choice' | 'scale' | 'media' | 'specialized';
    supportsValidation: boolean;
    supportsSkipLogic: boolean;
    supportsConditionalDisplay: boolean;
    defaultConfig: Partial<QuestionConfig>;
  };
};

export type QuestionnaireStatus = 'draft' | 'published' | 'archived';
export type QuestionLayout = 'vertical' | 'horizontal' | 'grid';
export type QuestionTheme = 'default' | 'minimal' | 'colorful' | 'dark';

// API Response Types
export interface QuestionnaireListResponse {
  questionnaires: Questionnaire[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface QuestionResponse {
  question: Question;
  responses: QuestionnaireResponse[];
  analytics: QuestionValidationResult;
}

export interface QuestionnaireStatsResponse {
  totalQuestionnaires: number;
  totalResponses: number;
  averageCompletionRate: number;
  mostPopularQuestions: Array<{
    question: Question;
    responseCount: number;
  }>;
  recentActivity: Array<{
    action: string;
    questionnaireId: string;
    timestamp: Date;
  }>;
}

// Search and Filter Types
export interface QuestionnaireSearchParams {
  query?: string;
  status?: QuestionnaireStatus[];
  tags?: string[];
  categories?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'created' | 'updated' | 'title' | 'responses';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface QuestionSearchParams {
  query?: string;
  type?: QuestionType[];
  tags?: string[];
  category?: string;
  difficulty?: string[];
  sortBy?: 'popularity' | 'rating' | 'created' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
