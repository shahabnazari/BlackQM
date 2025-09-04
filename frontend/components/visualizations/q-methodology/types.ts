/**
 * Type definitions for Q-methodology visualization components
 */

// For FactorLoadingChart component
export interface ParticipantLoading {
  participant: string;
  x: number; // Factor 1 loading
  y: number; // Factor 2 loading
  z?: number; // Factor 3 loading (for 3D effect)
  loadingStrength: number; // Combined loading magnitude
  definingFactor?: string;
  allLoadings: { factor: string; value: number }[];
}

// For ParticipantLoadingMatrix component
export interface ParticipantLoadingMatrixData {
  participant: string;
  loadings: { [factor: string]: number };
  communality: number;
  definingFactor?: string;
  flagged: boolean;
  reliability: number;
  demographics?: { [key: string]: any };
}

export interface DistributionData {
  value: number;
  frequency: number;
  category: string;
  count: number;
  expectedCount: number;
}

export interface DistinguishingStatement {
  id: string;
  statement: string;
  text: string;
  factors: { [factor: string]: number };
  scores: { factor: string; zScore: number; rank: number }[];
  significance: number;
  pValue: number;
  isDistinguishing: boolean;
  isConsensus: boolean;
}

export interface ConsensusStatement {
  id: string;
  statement: string;
  text: string;
  consensusScore: number;
  meanZScore: number;
  variance: number;
  standardDeviation: number;
  factorScores: { factor: string; score: number }[];
  isConsensus: boolean;
}

export interface StatementScore {
  statementId: string;
  factor: string;
  qSortValue: number;
  zScore: number;
  rank: number;
}

// Additional types for Q-methodology analysis
export interface QMethodologyData {
  participants: ParticipantLoading[];
  statements: DistinguishingStatement[];
  consensus: ConsensusStatement[];
  factorAnalysis: FactorAnalysisResult;
}

export interface FactorAnalysisResult {
  factors: Factor[];
  eigenvalues: number[];
  varianceExplained: number[];
  rotationMatrix?: number[][];
}

export interface Factor {
  id: string;
  name: string;
  eigenvalue: number;
  varianceExplained: number;
  loadings: { [participantId: string]: number };
  definingParticipants: string[];
}

export interface QSortItem {
  id: string;
  statement: string;
  position?: number;
  category?: 'agree' | 'disagree' | 'neutral';
}

export interface QSortGrid {
  columns: number[];
  distribution: number[];
  items: QSortItem[];
}

export interface StudyConfiguration {
  id: string;
  title: string;
  description: string;
  statements: string[];
  gridConfiguration: {
    minValue: number;
    maxValue: number;
    distribution: number[];
  };
  participantInstructions: string;
  consentForm?: string;
}

export interface ParticipantResponse {
  participantId: string;
  studyId: string;
  qSort: { [statementId: string]: number };
  demographics?: { [key: string]: any };
  comments?: { [statementId: string]: string };
  completedAt: Date;
}

// Visualization-specific props
export interface VisualizationProps {
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  animate?: boolean;
  interactive?: boolean;
  showLegend?: boolean;
  colorScheme?: string[];
}

export interface ChartTooltipData {
  label: string;
  value: number | string;
  metadata?: { [key: string]: any };
}

// Export type utilities
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];