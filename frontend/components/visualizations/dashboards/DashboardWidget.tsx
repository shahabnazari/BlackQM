import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CogIcon, 
  TrashIcon, 
  ArrowsPointingOutIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { ChartExporter } from '../../../lib/visualization/export';

// Widget types and interfaces
export type WidgetType = 
  | 'eigenvalue-scree'
  | 'correlation-heatmap'
  | 'factor-loading'
  | 'q-sort-distribution'
  | 'distinguishing-statements'
  | 'metric-card'
  | 'data-table'
  | 'text-widget';

export interface WidgetConfig {
  title?: string;
  showTitle?: boolean;
  showBorder?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  filters?: Record<string, any>;
  chartOptions?: Record<string, any>;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  data?: any;
  config?: WidgetConfig;
  crossFilterDependencies?: string[];
  filterState?: Record<string, any>;
}

interface DashboardWidgetProps {
  widget: Widget;
  children: React.ReactNode;
  onUpdate?: (widget: Widget) => void;
  onRemove?: (widgetId: string) => void;
  onCrossFilter?: (filterId: string, filterData: any) => void;
  onExport?: (widget: Widget, format: 'png' | 'pdf' | 'svg' | 'csv' | 'excel') => void;
  isSelected?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

// Apple spring physics configuration
const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 1
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  children,
  onUpdate,
  onRemove,
  onCrossFilter,
  onExport,
  isSelected = false,
  isReadOnly = false,
  className = ""
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Configuration state
  const [localConfig, setLocalConfig] = useState<WidgetConfig>(
    widget.config || {
      showTitle: true,
      showBorder: true,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    }
  );

  // Handle widget configuration updates
  const handleConfigUpdate = useCallback((newConfig: Partial<WidgetConfig>) => {
    const updatedConfig = { ...localConfig, ...newConfig };
    setLocalConfig(updatedConfig);
    
    if (onUpdate) {
      onUpdate({
        ...widget,
        config: updatedConfig
      });
    }
  }, [localConfig, widget, onUpdate]);

  // Handle export functionality
  const handleExport = useCallback(async (format: 'png' | 'pdf' | 'svg' | 'csv' | 'excel') => {
    if (onExport) {
      onExport(widget, format);
      return;
    }

    // Default export handling
    if (widgetRef.current) {
      try {
        switch (format) {
          case 'png':
            await ChartExporter.exportToPNG(widgetRef.current, {
              filename: `${widget.title.replace(/\s+/g, '_').toLowerCase()}_widget`
            });
            break;
          case 'pdf':
            await ChartExporter.exportToPDF([widgetRef.current], {
              filename: `${widget.title.replace(/\s+/g, '_').toLowerCase()}_widget`
            });
            break;
          case 'svg':
            const svgElement = widgetRef.current.querySelector('svg');
            if (svgElement) {
              ChartExporter.exportToSVG(svgElement, {
                filename: `${widget.title.replace(/\s+/g, '_').toLowerCase()}_widget`
              });
            }
            break;
        }
        setShowExportMenu(false);
      } catch (error) {
        console.error('Export failed:', error);
      }
    }
  }, [widget, onExport]);

  // Handle cross-filtering
  const handleCrossFilter = useCallback((filterData: any) => {
    if (onCrossFilter) {
      onCrossFilter(widget.id, filterData);
    }
  }, [widget.id, onCrossFilter]);

  // Glass morphism style
  const glassStyle = {
    background: localConfig.backgroundColor || 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    border: `1px solid ${localConfig.borderColor || 'rgba(255, 255, 255, 0.18)'}`,
  };

  return (
    <>
      <motion.div
        ref={widgetRef}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          borderColor: isSelected ? '#3b82f6' : (localConfig.borderColor || '#e5e7eb'),
          boxShadow: isSelected 
            ? '0 0 0 2px rgb(59 130 246 / 0.5)' 
            : isHovered 
              ? '0 10px 25px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)'
              : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)'
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ y: -2 }}
        transition={springConfig}
        className={`
          relative overflow-hidden rounded-xl cursor-pointer
          ${className}
        `}
        style={glassStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowExportMenu(false);
        }}
        drag={!isReadOnly && !isExpanded}
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
      >
        {/* Widget Header */}
        <AnimatePresence>
          {(localConfig.showTitle || isHovered || isSelected) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 border-b border-gray-200/50 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <ChartBarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h4 className="font-medium text-sm text-gray-900 truncate">
                  {localConfig.title || widget.title}
                </h4>
                {widget.crossFilterDependencies && widget.crossFilterDependencies.length > 0 && (
                  <FunnelIcon className="w-3 h-3 text-orange-500" title="Cross-filtering enabled" />
                )}
              </div>

              {/* Action Buttons */}
              <AnimatePresence>
                {(isHovered || isSelected || showExportMenu) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-1"
                  >
                    {/* Export Menu */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowExportMenu(!showExportMenu);
                        }}
                        className="p-1.5 hover:bg-gray-100/80 rounded-md transition-colors"
                        title="Export widget"
                      >
                        <DocumentArrowDownIcon className="w-4 h-4 text-gray-500" />
                      </motion.button>

                      <AnimatePresence>
                        {showExportMenu && (
                          <motion.div
                            ref={exportMenuRef}
                            initial={{ opacity: 0, scale: 0.8, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                          >
                            {[
                              { format: 'png' as const, label: 'PNG Image' },
                              { format: 'pdf' as const, label: 'PDF' },
                              { format: 'svg' as const, label: 'SVG Vector' },
                              { format: 'csv' as const, label: 'CSV Data' },
                            ].map(({ format, label }) => (
                              <button
                                key={format}
                                onClick={() => handleExport(format)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                {label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Expand Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                      }}
                      className="p-1.5 hover:bg-gray-100/80 rounded-md transition-colors"
                      title="Expand widget"
                    >
                      <ArrowsPointingOutIcon className="w-4 h-4 text-gray-500" />
                    </motion.button>

                    {/* Config Button */}
                    {!isReadOnly && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfig(!showConfig);
                        }}
                        className="p-1.5 hover:bg-gray-100/80 rounded-md transition-colors"
                        title="Configure widget"
                      >
                        <CogIcon className="w-4 h-4 text-gray-500" />
                      </motion.button>
                    )}

                    {/* Remove Button */}
                    {!isReadOnly && onRemove && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(widget.id);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove widget"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Content */}
        <motion.div
          className="p-4 overflow-auto"
          style={{
            height: localConfig.showTitle ? 'calc(100% - 60px)' : '100%',
          }}
          animate={{
            filter: widget.filterState ? 'brightness(0.9)' : 'brightness(1)',
          }}
        >
          {children}
        </motion.div>

        {/* Cross-filter indicator */}
        <AnimatePresence>
          {widget.filterState && Object.keys(widget.filterState).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 right-2 w-2 h-2 bg-orange-400 rounded-full"
              title="Cross-filter applied"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-4">Configure Widget</h3>
              
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={localConfig.title || widget.title}
                    onChange={(e) => handleConfigUpdate({ title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Show Title Toggle */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showTitle"
                    checked={localConfig.showTitle}
                    onChange={(e) => handleConfigUpdate({ showTitle: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="showTitle" className="text-sm font-medium text-gray-700">
                    Show title
                  </label>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={localConfig.backgroundColor || '#ffffff'}
                    onChange={(e) => handleConfigUpdate({ backgroundColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Border Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Color
                  </label>
                  <input
                    type="color"
                    value={localConfig.borderColor || '#e5e7eb'}
                    onChange={(e) => handleConfigUpdate({ borderColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl w-full h-full max-w-6xl max-h-[90vh] overflow-hidden shadow-xl"
              style={glassStyle}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{localConfig.title || widget.title}</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                >
                  ×
                </button>
              </div>
              <div className="p-6 h-[calc(100%-80px)] overflow-auto">
                {children}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardWidget;