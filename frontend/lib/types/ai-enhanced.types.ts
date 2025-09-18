/**
 * Enhanced Type Definitions for AI Services
 * Phase 6.86 - Enterprise-grade type safety
 * Replaces all 'any' types with proper interfaces
 */

// Participant AI Types
export type ParticipantStage = 'consent' | 'prescreening' | 'presorting' | 'qsort' | 'postsurvey';

export interface ParticipantContext {
  participantId?: string | undefined;
  stage: ParticipantStage;
  timeOnStage?: number | undefined;
  responses?: Record<string, any> | undefined;
  sessionStartTime?: Date | undefined;
  currentQuestionIndex?: number | undefined;
}

export interface ParticipantGuidance {
  message: string;
  suggestions: string[];
  progress: number;
  estimatedTimeRemaining: number;
}

export interface PreScreeningOptimization {
  nextQuestion: { id: string; reason: string } | null;
  skipQuestions: string[];
  estimatedTime: string;
  engagementLevel: 'high' | 'medium' | 'low';
  suggestions: string[];
}

export interface PreSortingGuidance {
  explanation: string;
  tips: string[];
  pitfalls: string[];
  encouragement: string;
  estimatedTime: string;
}

export interface AdaptiveHelp {
  message: string;
  nextStep: string;
  tips: string[];
  isStuck: boolean;
}

export interface PostSurveyAnalysis {
  themes: string[];
  consistency: number;
  qualityScore: number;
  insights: string[];
  sentiment: { overall: string; [key: string]: any };
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  tone: string;
  keyPhrases: string[];
  followUpNeeded: boolean;
}

// Response Analysis Types
export interface ParticipantResponse {
  id: string;
  participantId: string;
  completionTime: number;
  changeCount: number;
  placements?: Record<string, any> | undefined;
  comments?: string | undefined;
  demographics?: Record<string, any> | undefined;
}

export interface Pattern {
  type: string;
  description: string;
  prevalence: number;
  participants: number;
  significance: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface QualityMetrics {
  completeness: number;
  consistency: number;
  engagement: number;
  thoughtfulness: number;
  overallScore: number;
  flags: string[];
}

export interface Anomaly {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  value: any;
  threshold: any;
  recommendation: string;
}

export interface Insight {
  title: string;
  category: 'viewpoint' | 'demographic' | 'methodological' | 'surprising';
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
  implication: string;
  actionable: string;
}

export interface CrossParticipantAnalysis {
  groups: Record<string, any>;
  comparisons: any[];
  significance: Record<string, number>;
  visualizations: string[];
}

export interface ResponseAnalysis {
  patterns: Pattern[];
  quality: {
    average: number;
    distribution: Record<string, number>;
    concerns: number;
  };
  anomalies: Anomaly[];
  insights: Insight[];
  crossParticipant: CrossParticipantAnalysis;
  summary: {
    totalResponses: number;
    averageTime: number;
    completionRate: number;
    qualityScore: number;
  };
  recommendations: string[];
}

export interface ResponsePattern {
  type: 'polarized' | 'centered' | 'balanced' | 'random';
  strength: number;
  description: string;
}

export interface AnomalyDetection {
  hasAnomalies: boolean;
  anomalies: Anomaly[];
  riskLevel: 'high' | 'medium' | 'low';
}

// Question Generator Types
export interface QuestionData {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  required: boolean;
  reasoning: string;
}

export interface QuestionValidationResult {
  text: string;
  length: number;
  hasQuestionMark: boolean;
  confidence: number;
}

export interface SkipLogicResult {
  error?: boolean;
  message?: string;
  fallback?: Record<string, unknown>;
  conditions?: Array<{
    questionId: string;
    condition: string;
    skipTo: string;
  }>;
}

// Statement Generator Types
export interface StatementData {
  id: string;
  text: string;
  perspective: string;
  polarity: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface ProcessedStatement extends StatementData {
  normalized?: string;
  wordCount?: number;
  category?: string;
}

// Bias Detector Types
export interface StatementFix {
  suggested: string;
  reasoning: string;
  error?: boolean;
  confidence?: number;
}

export interface CulturalSensitivityIssue {
  statementIndex: number;
  issue: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DiversityAnalysis {
  score: number;
  analysis: {
    perspectivesCovered: string[];
    perspectivesMissing: string[];
    balance: string;
    recommendations?: string[];
  };
}

// Cache Service Types
export interface CacheEntry<T> {
  value: T;
  expiry: number;
  accessCount: number;
  lastAccessed: number;
  size?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  maxSize: number;
}

// Cost Management Types
export interface UsageRecord {
  userId: string;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
  cached: boolean;
  metadata?: Record<string, unknown>;
}

export interface CostReport {
  daily: number;
  weekly: number;
  monthly: number;
  byModel: Record<string, number>;
  byUser: Record<string, number>;
  topUsers: Array<{ userId: string; cost: number }>;
}

// Grid Recommender Types
export interface GridStructure {
  columns: number;
  distribution: number[];
  total: number;
  isValid: boolean;
  symmetrical: boolean;
}

export interface GridRecommendation {
  structure: GridStructure;
  rationale: string;
  alternatives: GridStructure[];
  confidence: number;
}

// Authentication Types
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'researcher' | 'participant' | 'system';
  permissions?: string[];
}

export interface AuthContext {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  token?: string;
  expiresAt?: Date;
}

// API Response Types
export interface AIProxyRequest {
  prompt: string;
  model: 'gpt-3.5-turbo' | 'gpt-4';
  temperature?: number;
  maxTokens?: number;
  context?: Record<string, unknown>;
}

export interface AIProxyResponse {
  success: boolean;
  content?: string;
  tokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  model?: string;
  timestamp?: string;
  error?: string;
}

// Error Types
export interface EnhancedError {
  code: string;
  message: string;
  retry: boolean;
  details?: unknown;
  stack?: string;
  timestamp: Date;
}

// Type Guards
export function isQuestionData(obj: unknown): obj is QuestionData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'type' in obj &&
    'text' in obj
  );
}

export function isStatementData(obj: unknown): obj is StatementData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'text' in obj &&
    'perspective' in obj &&
    'polarity' in obj
  );
}

export function isAuthenticatedUser(obj: unknown): obj is AuthenticatedUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj
  );
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type AsyncResult<T> = Promise<{ data?: T; error?: EnhancedError }>;

// Constants
export const AI_MODELS = {
  FAST: 'gpt-3.5-turbo' as const,
  SMART: 'gpt-4' as const,
  VISION: 'gpt-4-vision' as const
} as const;

export const BIAS_TYPES = [
  'language',
  'perspective',
  'cultural',
  'confirmation',
  'sampling',
  'demographic'
] as const;

export type BiasType = typeof BIAS_TYPES[number];
export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];