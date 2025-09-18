/**
 * AI Types for Phase 6.86 - Enterprise-Grade Implementation
 * Zero-error TypeScript definitions for AI functionality
 */

// Core AI Types
export interface AIRequest {
  prompt: string;
  model: 'gpt-4' | 'gpt-3.5-turbo';
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  cache?: boolean;
}

export interface AIResponse {
  content: string;
  tokens: number;
  cost: number;
  responseTime: number;
  cached?: boolean;
}

export interface AIError {
  code: string;
  message: string;
  retry: boolean;
  details?: any;
}

// Questionnaire AI Types
export interface QuestionnaireAIRequest {
  topic: string;
  questionCount: number;
  questionTypes: QuestionType[];
  targetAudience?: string | undefined;
  context?: string | undefined;
}

export interface QuestionnaireAIResponse {
  questions: AIGeneratedQuestion[];
  metadata: {
    tokensUsed: number;
    processingTime: number;
    confidence: number;
  };
}

export interface AIGeneratedQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  required: boolean;
  aiGenerated: true;
  confidence: number;
  reasoning: string;
}

// Participant AI Types
export type ParticipantStage = 'consent' | 'prescreening' | 'presorting' | 'qsort' | 'postsurvey';

export interface ParticipantAIAssist {
  participantId: string;
  stage: ParticipantStage;
  context: ParticipantContext;
  needsHelp?: boolean;
}

export interface ParticipantContext {
  stage: ParticipantStage;
  responses: Record<string, any>;
  timeSpent?: number;
  strugglingAreas?: string[];
}

export interface ParticipantGuidance {
  message: string;
  hints: string[];
  examples?: string[];
  nextSteps: string[];
}

// Grid AI Types
export interface GridConfig {
  columns: number;
  distribution: number[];
  rationale: string;
  bestFor: string;
  statementCount: number;
}

export interface GridRecommendationRequest {
  statementCount: number;
  studyType: 'exploratory' | 'confirmatory' | 'mixed';
  participantCount?: number;
  context?: string;
}

export interface GridRecommendation {
  configs: GridConfig[];
  recommended: GridConfig;
  reasoning: string;
}

// Statement/Stimuli Generation Types
export interface StimulusGenerationRequest {
  topic: string;
  count: number;
  perspectives?: string[] | undefined;
  avoidBias?: boolean | undefined;
  academicLevel?: 'basic' | 'intermediate' | 'advanced' | undefined;
}

export interface GeneratedStimulus {
  id: string;
  text: string;
  perspective: string;
  polarity: 'positive' | 'negative' | 'neutral';
  generated: true;
  topic: string;
  confidence: number;
}

export interface StatementGenerationResponse {
  statements: GeneratedStimulus[];
  metadata: {
    tokensUsed: number;
    processingTime: number;
    diversityScore: number;
  };
}

// Bias Detection Types
export interface BiasAnalysisRequest {
  statements: string[];
  studyTitle?: string | undefined;
  studyDescription?: string | undefined;
  checkTypes?: BiasType[] | undefined;
}

export type BiasType = 
  | 'language' 
  | 'perspective' 
  | 'cultural' 
  | 'confirmation' 
  | 'sampling'
  | 'demographic';

export interface BiasIssue {
  type: BiasType;
  severity: 'low' | 'medium' | 'high';
  statementIndex: number;
  description: string;
  suggestion: string;
  examples?: string[];
}

export interface BiasAnalysisResult {
  overallScore: number; // 0-100, higher is less biased
  issues: BiasIssue[];
  recommendations: string[];
  suggestions: BiasFix[];
}

export interface BiasFix {
  statementIndex: number;
  original: string;
  suggested: string;
  reasoning: string;
}

// Response Analysis Types
export interface ResponseAnalysisRequest {
  responses: ParticipantResponse[];
  studyId: string;
  analysisType: 'patterns' | 'quality' | 'insights' | 'anomalies' | 'all';
}

export interface ParticipantResponse {
  participantId: string;
  timestamp: Date;
  sortData: Record<string, number>;
  surveyResponses?: Record<string, any>;
  timeSpent: number;
}

export interface Pattern {
  type: 'consensus' | 'controversial' | 'outlier' | 'cluster';
  description: string;
  confidence: number;
  participantIds: string[];
  statements?: string[];
}

export interface QualityMetrics {
  completeness: number;
  consistency: number;
  engagement: number;
  reliability: number;
  overallQuality: number;
}

export interface Anomaly {
  participantId: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface Insight {
  type: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  evidence: string[];
  actionable: boolean;
  recommendation?: string;
}

export interface ResponseAnalysis {
  patterns: Pattern[];
  quality: QualityMetrics;
  anomalies: Anomaly[];
  insights: Insight[];
  summary: string;
}

// Validation Types
export interface ValidationRule {
  field: string;
  validator: (value: unknown) => ValidationResult;
  adaptive: boolean;
  aiSuggested?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
  confidence?: number;
}

// Cost Management Types
export interface AIUsage {
  userId: string;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
  cached: boolean;
}

export interface AIBudget {
  daily: number;
  monthly: number;
  used: number;
  remaining: number;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  threshold: number;
  message: string;
  triggered: boolean;
}

// WebSocket Types for Real-time AI
export interface WSMessage {
  type: 'progress' | 'result' | 'error' | 'stream';
  payload: unknown;
  timestamp: number;
  messageId: string;
}

export interface StreamingAIResponse {
  chunk: string;
  isComplete: boolean;
  tokensSoFar: number;
  messageId: string;
}

// Hook Return Types
export interface UseAIReturn<T> {
  data: T | null;
  loading: boolean;
  error: AIError | null;
  refetch: () => Promise<void>;
  cancel: () => void;
}

// Question Types (referenced in other interfaces)
export type QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'scale'
  | 'ranking'
  | 'matrix'
  | 'date'
  | 'time'
  | 'file';

// All types are already exported above as interfaces and types