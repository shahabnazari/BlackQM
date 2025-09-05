/**
 * Type definitions for Q-Analytics Engine
 * Enterprise-grade type system for Q-methodology analysis
 */

// Analysis Configuration Types
export interface AnalysisOptions {
  extractionMethod?: 'centroid' | 'pca' | 'ml';
  rotationMethod?: 'varimax' | 'quartimax' | 'promax' | 'oblimin' | 'none';
  numberOfFactors?: number | null;
  rotationOptions?: any;
  performBootstrap?: boolean;
  bootstrapIterations?: number;
  significanceLevel?: number;
  consensusThreshold?: number;
  pqmethodBenchmark?: any;
}

export interface AnalysisConfig extends Required<AnalysisOptions> {
  numberOfFactors: number | null;
}

// Study Data Types
export interface StudyData {
  surveyId: string;
  surveyName: string;
  statements: Statement[];
  qSorts: number[][];
  startTime: number;
}

export interface Statement {
  id: string | number;
  text: string;
  category?: string;
  number?: number;
  order?: number;
}

// Analysis Result Types
export interface QAnalysisResult {
  analysisId: string;
  surveyId: string;
  timestamp: Date;
  config: AnalysisConfig;
  correlationMatrix: number[][];
  extraction: ExtractionResult;
  rotation: RotationResult;
  factorArrays: FactorArray[];
  idealizedQSorts: number[][];
  distinguishingStatements: DistinguishingStatement[];
  consensusStatements: ConsensusStatement[];
  cribSheets: CribSheet[];
  bootstrap: BootstrapResult | null;
  validation: ValidationResult | null;
  report: StatisticalReport;
  performance: PerformanceMetrics;
}

export interface ExtractionResult {
  factors: number[][];
  eigenvalues: number[];
  variance: number[];
  communalities: number[];
}

export interface RotationResult {
  rotatedLoadings: number[][];
  rotationMatrix: number[][];
  iterations: number;
  converged: boolean;
  patternMatrix?: number[][];
  structureMatrix?: number[][];
  factorCorrelations?: number[][];
}

// Factor Analysis Types
export interface FactorArray {
  factorNumber: number;
  statements: FactorStatement[];
  definingSortsCount: number;
  explainedVariance: number;
}

export interface FactorStatement {
  id: string | number;
  text: string;
  zScore: number;
  rank: number;
  normalizedScore: number;
}

// Statistical Output Types
export interface DistinguishingStatement {
  statementId: string | number;
  text: string;
  factor1: number;
  factor2: number;
  zScore1: number;
  zScore2: number;
  difference: number;
  pValue: number;
  significance: string;
}

export interface ConsensusStatement {
  statementId: string | number;
  text: string;
  meanZScore: number;
  zScoreRange: number;
  variance: number;
  factorScores: FactorScore[];
  isHighConsensus: boolean;
}

export interface FactorScore {
  factor: number;
  zScore: number;
  rank: number;
}

// Interpretation Types
export interface CribSheet {
  factorNumber: number;
  factorLabel: string;
  interpretation: FactorInterpretation;
  characteristics: FactorCharacteristics;
  narrativeSummary: string;
}

export interface FactorInterpretation {
  mostAgree: InterpretationStatement[];
  mostDisagree: InterpretationStatement[];
  distinguishing: DistinguishingStatement[];
  consensus: ConsensusStatement[];
}

export interface InterpretationStatement {
  id: string | number;
  text: string;
  zScore: number;
  rank: number;
}

export interface FactorCharacteristics {
  positivity: number;
  extremity: number;
  coherence: number;
  distinctiveness: number;
}

// Bootstrap Analysis Types
export interface BootstrapResult {
  confidenceIntervals: ConfidenceInterval[];
  stability: number;
  reliability: number;
}

export interface ConfidenceInterval {
  parameter: string;
  estimate: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  eigenvaluesValid: boolean;
  factorLoadingsValid: boolean;
  zScoresValid: boolean;
  correlationValid: boolean;
  details: string[];
}

// Performance Types
export interface PerformanceMetrics {
  analysisTime: number;
  participantCount: number;
  statementCount: number;
  factorCount: number;
}

// Statistical Report Types
export interface StatisticalReport {
  metadata: ReportMetadata;
  factorAnalysis: FactorAnalysisSection;
  factorArrays: FactorArray[];
  distinguishingStatements: DistinguishingStatement[];
  consensusStatements: ConsensusStatement[];
  cribSheets: CribSheet[];
  bootstrap: BootstrapResult | null;
  qualityMetrics: QualityMetrics;
}

export interface ReportMetadata {
  surveyId: string;
  analysisDate: Date;
  numberOfParticipants: number;
  numberOfStatements: number;
  numberOfFactors: number;
  rotationMethod: string;
  extractionMethod: string;
}

export interface FactorAnalysisSection {
  eigenvalues: number[];
  explainedVariance: number[];
  cumulativeVariance: number[];
  factorLoadings: number[][];
  communalities: number[];
}

export interface QualityMetrics {
  kaiserMeyerOlkin: number;
  bartlettTest: BartlettTest;
  cronbachAlpha: number;
  reproducibility: number;
}

export interface BartlettTest {
  chiSquare: number;
  df: number;
  pValue: number;
}

// Interactive Analysis Types
export interface InteractionState {
  extractionMethod: string;
  numberOfFactors: number;
  rotationHistory: RotationHistoryItem[];
  redoStack: RotationHistoryItem[];
  cachedExtraction?: ExtractionResult;
}

export interface RotationHistoryItem {
  factor1: number;
  factor2: number;
  angle: number;
}

export interface InteractiveAnalysisResult {
  currentRotation: RotationResult;
  preview: InteractivePreview;
  canUndo: boolean;
  canRedo: boolean;
  suggestions: RotationSuggestion[];
}

export interface InteractivePreview {
  factorLoadings: number[][];
  factorArrays: FactorArray[];
  topStatements: TopStatements[];
  rotationQuality: number;
}

export interface TopStatements {
  factor: number;
  positive: FactorStatement[];
  negative: FactorStatement[];
}

export interface RotationSuggestion {
  factor1: number;
  factor2: number;
  angle: number;
  reason: string;
  impact: string;
}

// Analysis Comparison Types
export interface AnalysisComparison {
  factorCorrelation: number;
  statementDifferences: StatementDifference[];
  consensusOverlap: number;
  methodologicalDifferences: {
    extraction: boolean;
    rotation: boolean;
    factors: boolean;
  };
}

export interface StatementDifference {
  statementId: string | number;
  factor: number;
  rank1: number;
  rank2: number;
  difference: number;
}

// PQMethod Compatibility Types
export interface PQMethodData {
  version: string;
  format: string;
  data: {
    statements: PQMethodStatement[];
    sorts: QSort[];
    analysis: any;
  };
  metadata: PQMethodMetadata;
}

export interface PQMethodStatement {
  number: number;
  text: string;
  category?: string;
}

export interface QSort {
  participantId: string;
  values: number[];
}

export interface PQMethodMetadata {
  studyTitle: string;
  numberOfStatements: number;
  numberOfSorts: number;
  distribution: number[];
  rotationMethod?: string;
  numberOfFactors?: number;
}

export interface PQMethodAnalysisOutput {
  correlationMatrix: number[][];
  unrotatedFactors: number[][];
  rotatedFactors: number[][];
  factorArrays: any[];
  distinguishingStatements: any[];
  consensusStatements: any[];
  factorScores: any[];
}

// WebSocket Event Types (for real-time updates)
export interface AnalysisUpdateEvent {
  type: 'progress' | 'completed' | 'error';
  analysisId: string;
  progress?: number;
  stage?: string;
  message?: string;
  result?: QAnalysisResult;
  error?: string;
}

// Queue Job Types (for async processing)
export interface AnalysisJob {
  id: string;
  surveyId: string;
  userId: string;
  options: AnalysisOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: QAnalysisResult;
  error?: string;
}

// Cache Types
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number;
  hits: number;
}

// Export all types
export * from './index';
