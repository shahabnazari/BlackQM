// Q-methodology visualization components
export { FactorLoadingChart } from './FactorLoadingChart';
export { QSortDistribution } from './QSortDistribution';
export { DistinguishingStatements } from './DistinguishingStatements';
export { ConsensusStatements } from './ConsensusStatements';
export { EigenvalueScreePlot } from './EigenvalueScreePlot';
export { ZScoreDistribution } from './ZScoreDistribution';
export { FactorRotationVisualizer } from './FactorRotationVisualizer';
export { FactorArraysVisualization } from './FactorArraysVisualization';
export { CorrelationHeatmap } from './CorrelationHeatmap';
export { ParticipantLoadingMatrix } from './ParticipantLoadingMatrix';

// Export all types
export type {
  ParticipantLoading,
  ParticipantLoadingMatrixData,
  DistributionData,
  DistinguishingStatement,
  ConsensusStatement,
  StatementScore,
  QMethodologyData,
  FactorAnalysisResult,
  Factor,
  QSortItem,
  QSortGrid,
  StudyConfiguration,
  ParticipantResponse,
  VisualizationProps,
  ChartTooltipData,
  DeepPartial,
  ValueOf
} from './types';

