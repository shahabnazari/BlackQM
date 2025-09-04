import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  CircleStackIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  StarIcon,
  LightBulbIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Widget types and configurations
export type WidgetType = 
  | 'eigenvalue-scree'
  | 'correlation-heatmap'
  | 'factor-loading'
  | 'q-sort-distribution'
  | 'distinguishing-statements'
  | 'factor-comparison'
  | 'participant-clustering'
  | 'consensus-statements'
  | 'metric-card'
  | 'data-table'
  | 'text-widget';

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'analysis' | 'visualization' | 'table' | 'utility';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dataRequirements: string[];
  recommended?: WidgetType[];
  tags: string[];
  preview?: string;
  minWidth?: number;
  minHeight?: number;
}

interface DataContext {
  hasEigenvalues: boolean;
  hasFactorLoadings: boolean;
  hasCorrelations: boolean;
  hasQSorts: boolean;
  hasStatements: boolean;
  participantCount: number;
  factorCount: number;
}

interface WidgetLibraryProps {
  onAddWidget: (type: WidgetType) => void;
  onClose?: () => void;
  dataContext?: DataContext;
  currentWidgets?: WidgetType[];
  className?: string;
}

// Comprehensive widget catalog with AI recommendations
const widgetCatalog: WidgetDefinition[] = [
  // Core Q-Methodology Analysis
  {
    type: 'eigenvalue-scree',
    title: 'Eigenvalue Scree Plot',
    description: 'Determine optimal number of factors to extract based on eigenvalue magnitude',
    icon: ArrowTrendingUpIcon,
    category: 'analysis',
    difficulty: 'beginner',
    dataRequirements: ['eigenvalues'],
    recommended: ['factor-loading', 'correlation-heatmap'],
    tags: ['factor-extraction', 'eigenvalues', 'scree-plot'],
    preview: 'Line chart showing eigenvalue drop-off',
    minWidth: 300,
    minHeight: 250
  },
  {
    type: 'correlation-heatmap',
    title: 'Participant Correlation Matrix',
    description: 'Visualize correlations between participant Q-sorts to identify groupings',
    icon: Squares2X2Icon,
    category: 'visualization',
    difficulty: 'intermediate',
    dataRequirements: ['correlations', 'participants'],
    recommended: ['factor-loading', 'participant-clustering'],
    tags: ['correlation', 'heatmap', 'participant-similarity'],
    preview: 'Color-coded correlation matrix',
    minWidth: 400,
    minHeight: 400
  },
  {
    type: 'factor-loading',
    title: 'Factor Loadings Chart',
    description: 'Show how strongly each participant loads on extracted factors',
    icon: DocumentChartBarIcon,
    category: 'analysis',
    difficulty: 'intermediate',
    dataRequirements: ['factorLoadings', 'participants'],
    recommended: ['distinguishing-statements', 'q-sort-distribution'],
    tags: ['factor-loadings', 'participant-clustering', 'scatter-plot'],
    preview: 'Scatter plot of factor loadings',
    minWidth: 400,
    minHeight: 350
  },
  {
    type: 'q-sort-distribution',
    title: 'Q-Sort Distribution',
    description: 'Display the distribution of statement rankings across the Q-sort grid',
    icon: ChartBarIcon,
    category: 'visualization',
    difficulty: 'beginner',
    dataRequirements: ['qsorts'],
    recommended: ['distinguishing-statements', 'consensus-statements'],
    tags: ['distribution', 'q-sort', 'histogram'],
    preview: 'Histogram of statement placements',
    minWidth: 350,
    minHeight: 250
  },
  {
    type: 'distinguishing-statements',
    title: 'Distinguishing Statements',
    description: 'Highlight statements that significantly differentiate between factors',
    icon: BoltIcon,
    category: 'analysis',
    difficulty: 'advanced',
    dataRequirements: ['statements', 'factorArrays', 'factors'],
    recommended: ['factor-comparison', 'consensus-statements'],
    tags: ['distinguishing', 'statements', 'factor-differences'],
    preview: 'Table of significant statements',
    minWidth: 500,
    minHeight: 400
  },
  
  // Advanced Analysis
  {
    type: 'factor-comparison',
    title: 'Factor Comparison Chart',
    description: 'Side-by-side comparison of factor arrays and their defining statements',
    icon: PresentationChartLineIcon,
    category: 'analysis',
    difficulty: 'advanced',
    dataRequirements: ['factorArrays', 'statements'],
    recommended: ['distinguishing-statements'],
    tags: ['factor-comparison', 'side-by-side', 'interpretation'],
    preview: 'Parallel coordinates chart',
    minWidth: 600,
    minHeight: 400
  },
  {
    type: 'participant-clustering',
    title: 'Participant Clustering',
    description: 'Cluster participants based on their Q-sort patterns using machine learning',
    icon: CircleStackIcon,
    category: 'analysis',
    difficulty: 'advanced',
    dataRequirements: ['participants', 'qsorts', 'correlations'],
    recommended: ['correlation-heatmap', 'factor-loading'],
    tags: ['clustering', 'machine-learning', 'participant-groups'],
    preview: 'Dendrogram or cluster visualization',
    minWidth: 450,
    minHeight: 400
  },
  {
    type: 'consensus-statements',
    title: 'Consensus Statements',
    description: 'Identify statements with high agreement across all participants',
    icon: StarIcon,
    category: 'analysis',
    difficulty: 'intermediate',
    dataRequirements: ['statements', 'qsorts'],
    recommended: ['distinguishing-statements'],
    tags: ['consensus', 'agreement', 'shared-views'],
    preview: 'Ranked list with agreement scores',
    minWidth: 400,
    minHeight: 350
  },
  
  // Utility Widgets
  {
    type: 'metric-card',
    title: 'Key Metrics',
    description: 'Display important statistical measures and summary information',
    icon: DocumentTextIcon,
    category: 'utility',
    difficulty: 'beginner',
    dataRequirements: [],
    tags: ['metrics', 'summary', 'statistics'],
    preview: 'Card with key numbers',
    minWidth: 200,
    minHeight: 150
  },
  {
    type: 'data-table',
    title: 'Data Table',
    description: 'Interactive table for detailed data exploration and export',
    icon: TableCellsIcon,
    category: 'table',
    difficulty: 'beginner',
    dataRequirements: ['any'],
    tags: ['table', 'data-exploration', 'export'],
    preview: 'Sortable data table',
    minWidth: 400,
    minHeight: 300
  },
  {
    type: 'text-widget',
    title: 'Text & Annotations',
    description: 'Add custom text, insights, or annotations to your dashboard',
    icon: DocumentTextIcon,
    category: 'utility',
    difficulty: 'beginner',
    dataRequirements: [],
    tags: ['text', 'annotations', 'insights'],
    preview: 'Rich text editor',
    minWidth: 250,
    minHeight: 200
  }
];

// AI-powered recommendations based on current context
const generateRecommendations = (
  dataContext: DataContext,
  currentWidgets: WidgetType[]
): { widget: WidgetDefinition; reason: string; confidence: number }[] => {
  const recommendations: { widget: WidgetDefinition; reason: string; confidence: number }[] = [];
  
  // Basic analysis flow recommendations
  if (!currentWidgets.includes('eigenvalue-scree') && dataContext.hasEigenvalues) {
    recommendations.push({
      widget: widgetCatalog.find(w => w.type === 'eigenvalue-scree')!,
      reason: 'Essential first step: Determine optimal number of factors',
      confidence: 0.95
    });
  }
  
  if (currentWidgets.includes('eigenvalue-scree') && !currentWidgets.includes('factor-loading') && dataContext.hasFactorLoadings) {
    recommendations.push({
      widget: widgetCatalog.find(w => w.type === 'factor-loading')!,
      reason: 'Next step: Examine how participants load on factors',
      confidence: 0.9
    });
  }
  
  if (currentWidgets.includes('factor-loading') && !currentWidgets.includes('distinguishing-statements')) {
    recommendations.push({
      widget: widgetCatalog.find(w => w.type === 'distinguishing-statements')!,
      reason: 'Identify statements that differentiate your factors',
      confidence: 0.85
    });
  }
  
  // Correlation analysis
  if (dataContext.participantCount > 10 && !currentWidgets.includes('correlation-heatmap')) {
    recommendations.push({
      widget: widgetCatalog.find(w => w.type === 'correlation-heatmap')!,
      reason: 'Large sample: Visualize participant relationships',
      confidence: 0.8
    });
  }
  
  // Advanced analysis suggestions
  if (currentWidgets.length >= 3 && !currentWidgets.includes('factor-comparison')) {
    recommendations.push({
      widget: widgetCatalog.find(w => w.type === 'factor-comparison')!,
      reason: 'Ready for interpretation: Compare factor perspectives',
      confidence: 0.75
    });
  }
  
  return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
};

const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  onAddWidget,
  onClose,
  dataContext = {
    hasEigenvalues: true,
    hasFactorLoadings: true,
    hasCorrelations: true,
    hasQSorts: true,
    hasStatements: true,
    participantCount: 30,
    factorCount: 3
  },
  currentWidgets = [],
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Generate AI recommendations
  const recommendations = useMemo(() => 
    generateRecommendations(dataContext, currentWidgets),
    [dataContext, currentWidgets]
  );

  // Filter widgets based on search and filters
  const filteredWidgets = useMemo(() => {
    return widgetCatalog.filter(widget => {
      const matchesSearch = widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           widget.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           widget.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || widget.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  // Group widgets by category
  const groupedWidgets = useMemo(() => {
    const groups: Record<string, WidgetDefinition[]> = {};
    filteredWidgets.forEach(widget => {
      if (!groups[widget.category]) {
        groups[widget.category] = [];
      }
      groups[widget.category].push(widget);
    });
    return groups;
  }, [filteredWidgets]);

  const handleAddWidget = useCallback((widgetType: WidgetType) => {
    onAddWidget(widgetType);
  }, [onAddWidget]);

  const categoryIcons: Record<string, React.ComponentType<any>> = {
    analysis: DocumentChartBarIcon,
    visualization: ChartBarIcon,
    table: TableCellsIcon,
    utility: AdjustmentsHorizontalIcon
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      className={`h-full flex flex-col bg-white/90 backdrop-blur-lg ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BoltIcon className="w-6 h-6 mr-2 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Show Me</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
            >
              ×
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="analysis">Analysis</option>
            <option value="visualization">Visualization</option>
            <option value="table">Tables</option>
            <option value="utility">Utilities</option>
          </select>
          
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* AI Recommendations */}
        <AnimatePresence>
          {showRecommendations && recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <LightBulbIcon className="w-4 h-4 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-sm text-blue-900">AI Recommendations</h3>
                </div>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Dismiss
                </button>
              </div>
              
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <motion.button
                    key={rec.widget.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAddWidget(rec.widget.type)}
                    className="w-full text-left p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-100"
                  >
                    <div className="flex items-start">
                      <rec.widget.icon className="w-4 h-4 mt-0.5 mr-3 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900">{rec.widget.title}</h4>
                        <p className="text-xs text-blue-700 mt-1">{rec.reason}</p>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center mr-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.round(rec.confidence * 5)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {Math.round(rec.confidence * 100)}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Catalog */}
        {Object.entries(groupedWidgets).map(([category, widgets]) => (
          <div key={category}>
            <div className="flex items-center mb-3">
              {React.createElement(categoryIcons[category] || ChartBarIcon, {
                className: "w-4 h-4 mr-2 text-gray-600"
              })}
              <h3 className="font-semibold text-sm text-gray-900 capitalize">
                {category} ({widgets.length})
              </h3>
            </div>
            
            <div className="grid gap-3">
              {widgets.map((widget) => (
                <motion.button
                  key={widget.type}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddWidget(widget.type)}
                  className="w-full p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-left border border-gray-100 group"
                  disabled={currentWidgets.includes(widget.type)}
                >
                  <div className="flex items-start">
                    <widget.icon className="w-5 h-5 mt-0.5 mr-3 text-gray-600 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm text-gray-900 group-hover:text-blue-900">
                          {widget.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[widget.difficulty]}`}>
                          {widget.difficulty}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {widget.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {widget.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {widget.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{widget.tags.length - 2} more
                            </span>
                          )}
                        </div>
                        
                        {currentWidgets.includes(widget.type) && (
                          <span className="text-xs text-green-600 font-medium">
                            Added ✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        
        {filteredWidgets.length === 0 && (
          <div className="text-center py-8">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No widgets found matching your criteria</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WidgetLibrary;