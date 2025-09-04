// Base components
export { BaseChart } from './charts/BaseChart';

// Q-Methodology visualizations
export { EigenvalueScreePlot } from './q-methodology/EigenvalueScreePlot';
export { CorrelationHeatmap } from './q-methodology/CorrelationHeatmap';
export { FactorLoadingChart } from './q-methodology/FactorLoadingChart';
export { QSortDistribution } from './q-methodology/QSortDistribution';
export { DistinguishingStatements } from './q-methodology/DistinguishingStatements';

// Dashboard components
export { 
  DashboardBuilder,
  DashboardWidget,
  WidgetLibrary,
  DashboardLayout
} from './dashboards';

// Dashboard types
export type {
  WidgetType,
  Widget,
  WidgetConfig,
  WidgetDefinition,
  Layout,
  Layouts
} from './dashboards';