import React, { useState, useCallback, useRef } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon, CogIcon, ChartBarIcon, TableCellsIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Import visualization components
import { EigenvalueScreePlot } from '../q-methodology/EigenvalueScreePlot';
import { CorrelationHeatmap } from '../q-methodology/CorrelationHeatmap';
import { FactorLoadingChart } from '../q-methodology/FactorLoadingChart';
import { QSortDistribution } from '../q-methodology/QSortDistribution';
import { DistinguishingStatements } from '../q-methodology/DistinguishingStatements';

// Widget types
type WidgetType = 
  | 'eigenvalue-scree'
  | 'correlation-heatmap'
  | 'factor-loading'
  | 'q-sort-distribution'
  | 'distinguishing-statements'
  | 'metric-card'
  | 'data-table'
  | 'text-widget';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  data?: any;
  config?: Record<string, any>;
}

interface DashboardBuilderProps {
  initialWidgets?: Widget[];
  initialLayout?: Layout[];
  onSave?: (widgets: Widget[], layout: Layout[]) => void;
  readOnly?: boolean;
}

// Widget catalog with AI recommendations
const widgetCatalog: {
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  recommended?: string[];
}[] = [
  {
    type: 'eigenvalue-scree',
    title: 'Eigenvalue Scree Plot',
    description: 'Determine optimal factor extraction',
    icon: ChartBarIcon,
    recommended: ['factor-loading', 'correlation-heatmap'],
  },
  {
    type: 'correlation-heatmap',
    title: 'Correlation Matrix',
    description: 'Visualize participant correlations',
    icon: TableCellsIcon,
    recommended: ['factor-loading', 'distinguishing-statements'],
  },
  {
    type: 'factor-loading',
    title: 'Factor Loadings',
    description: 'Show participant loadings on factors',
    icon: DocumentChartBarIcon,
    recommended: ['distinguishing-statements', 'q-sort-distribution'],
  },
  {
    type: 'q-sort-distribution',
    title: 'Q-Sort Distribution',
    description: 'Display distribution of statements',
    icon: ChartBarIcon,
    recommended: ['distinguishing-statements'],
  },
  {
    type: 'distinguishing-statements',
    title: 'Distinguishing Statements',
    description: 'Highlight factor-differentiating statements',
    icon: DocumentChartBarIcon,
    recommended: ['factor-loading'],
  },
];

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  initialWidgets = [],
  initialLayout = [],
  onSave,
  readOnly = false,
}) => {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [layout, setLayout] = useState<Layout[]>(initialLayout);
  const [showWidgetPanel, setShowWidgetPanel] = useState(!readOnly);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gridRef = useRef<GridLayout>(null);

  // Generate demo data (replace with real data in production)
  const generateDemoData = (type: WidgetType) => {
    switch (type) {
      case 'eigenvalue-scree':
        return Array.from({ length: 8 }, (_, i) => ({
          factor: i + 1,
          eigenvalue: Math.max(0.5, 5 - i * 0.7) + Math.random() * 0.3,
          varianceExplained: (20 - i * 2) * (1 + Math.random() * 0.1),
          cumulativeVariance: Math.min(95, (i + 1) * 12),
        }));
      
      case 'correlation-heatmap':
        const participants = Array.from({ length: 10 }, (_, i) => `P${i + 1}`);
        const correlations: any[] = [];
        participants.forEach((p1, i) => {
          participants.forEach((p2, j) => {
            if (i <= j) {
              correlations.push({
                participant1: p1,
                participant2: p2,
                correlation: i === j ? 1 : (Math.random() * 2 - 1) * 0.8,
              });
            }
          });
        });
        return { participants, data: correlations };
      
      case 'q-sort-distribution':
        return Array.from({ length: 9 }, (_, i) => ({
          value: i - 4,
          count: Math.floor(Math.random() * 8) + 1,
          expectedCount: Math.exp(-0.5 * Math.pow((i - 4) / 2, 2)) * 8,
        }));
      
      default:
        return null;
    }
  };

  // Add new widget
  const addWidget = useCallback((type: WidgetType) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: widgetCatalog.find(w => w.type === type)?.title || 'Widget',
      data: generateDemoData(type),
    };

    const newLayoutItem: Layout = {
      i: newWidget.id,
      x: (widgets.length * 2) % 12,
      y: Infinity,
      w: type.includes('heatmap') ? 6 : 4,
      h: type.includes('table') ? 8 : 6,
    };

    setWidgets([...widgets, newWidget]);
    setLayout([...layout, newLayoutItem]);
  }, [widgets, layout]);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(widgets.filter((w: any) => w.id !== widgetId));
    setLayout(layout.filter((l: any) => l.i !== widgetId));
  }, [widgets, layout]);

  // Render widget content
  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'eigenvalue-scree':
        return <EigenvalueScreePlot data={widget.data} width={400} height={300} />;
      
      case 'correlation-heatmap':
        return (
          <CorrelationHeatmap 
            data={widget.data?.data || []} 
            participants={widget.data?.participants || []}
            width={400}
            height={400}
          />
        );
      
      case 'factor-loading':
        return (
          <FactorLoadingChart
            data={[]}
            factors={['Factor 1', 'Factor 2', 'Factor 3']}
            width={400}
            height={300}
          />
        );
      
      case 'q-sort-distribution':
        return <QSortDistribution data={widget.data} width={400} height={300} />;
      
      case 'distinguishing-statements':
        return (
          <DistinguishingStatements
            data={[]}
            factors={['Factor 1', 'Factor 2', 'Factor 3']}
            width={400}
            height={400}
          />
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <p className="text-gray-500">Widget: {widget.title}</p>
          </div>
        );
    }
  };

  // Apple-style glass panel
  const glassPanelStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-gray-50">
      {/* Widget Panel - Tableau "Show Me" Style */}
      <AnimatePresence>
        {showWidgetPanel && !readOnly && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-0 top-20 bottom-0 w-72 z-40 p-4"
            style={glassPanelStyle}
          >
            <div className="h-full overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Add Visualizations
              </h3>
              
              {/* AI Recommendations */}
              {selectedWidget && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Recommended next:
                  </p>
                  <div className="space-y-1">
                    {widgetCatalog
                      .find(w => widgets.find(widget => widget.id === selectedWidget)?.type === w.type)
                      ?.recommended?.map((rec: any) => (
                        <button
                          key={rec}
                          onClick={() => addWidget(rec as WidgetType)}
                          className="text-xs text-blue-700 hover:text-blue-900"
                        >
                          + {widgetCatalog.find(w => w.type === rec)?.title}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Widget Catalog */}
              <div className="space-y-2">
                {widgetCatalog.map((widget: any) => (
                  <motion.button
                    key={widget.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addWidget(widget.type)}
                    className="w-full p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-start">
                      <widget.icon className="w-5 h-5 mt-0.5 mr-3 text-blue-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{widget.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Panel Button */}
      {!readOnly && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowWidgetPanel(!showWidgetPanel)}
          className="fixed left-4 top-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
        >
          <PlusIcon className="w-5 h-5" />
        </motion.button>
      )}

      {/* Dashboard Grid */}
      <div className={`p-4 ${showWidgetPanel && !readOnly ? 'ml-72' : ''} transition-all duration-300`}>
        <GridLayout
          ref={gridRef}
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={60}
          width={1200}
          isDraggable={!readOnly}
          isResizable={!readOnly}
          onLayoutChange={(newLayout) => setLayout(newLayout)}
          onDragStart={() => setIsDragging(true)}
          onDragStop={() => setIsDragging(false)}
        >
          {widgets.map((widget: any) => (
            <div
              key={widget.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                selectedWidget === widget.id ? 'ring-2 ring-blue-500' : ''
              } ${isDragging ? 'cursor-move' : 'cursor-pointer'}`}
              onClick={() => !isDragging && setSelectedWidget(widget.id)}
              style={{
                ...glassPanelStyle,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Widget Header */}
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <h4 className="font-medium text-sm">{widget.title}</h4>
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <CogIcon className="w-4 h-4 text-gray-500" />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={(e: any) => {
                        e.stopPropagation();
                        removeWidget(widget.id);
                      }}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Widget Content */}
              <div className="p-4 h-[calc(100%-60px)] overflow-auto">
                {renderWidget(widget)}
              </div>
            </div>
          ))}
        </GridLayout>
      </div>

      {/* Save Button */}
      {!readOnly && onSave && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSave(widgets, layout)}
          className="fixed bottom-4 right-4 px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg font-medium"
        >
          Save Dashboard
        </motion.button>
      )}
    </div>
  );
};