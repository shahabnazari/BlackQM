// Dashboard Components
export { DashboardBuilder } from './DashboardBuilder';
export { DashboardWidget } from './DashboardWidget';
export { default as WidgetLibrary } from './WidgetLibrary';
export { DashboardLayout } from './DashboardLayout';

// Types
export type { 
  WidgetType,
  Widget,
  WidgetConfig
} from './DashboardWidget';

export type { WidgetDefinition } from './WidgetLibrary';

// Re-export react-grid-layout types for convenience
export type { Layout, Layouts } from 'react-grid-layout';