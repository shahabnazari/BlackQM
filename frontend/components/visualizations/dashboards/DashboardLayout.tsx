import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RectangleGroupIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  ViewColumnsIcon,
  TableCellsIcon,
  ArrowPathIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Layout templates
export type LayoutTemplate = 
  | 'blank'
  | 'single-focus'
  | 'two-column'
  | 'three-column'
  | 'dashboard-classic'
  | 'analysis-workflow'
  | 'presentation';

interface LayoutPreset {
  id: LayoutTemplate;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  layout: Layout[];
  breakpoints?: { lg: Layout[]; md: Layout[]; sm: Layout[]; xs: Layout[] };
}

// Predefined layout templates
const layoutPresets: LayoutPreset[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start with an empty dashboard',
    icon: RectangleGroupIcon,
    layout: []
  },
  {
    id: 'single-focus',
    name: 'Single Focus',
    description: 'One large central visualization',
    icon: Squares2X2Icon,
    layout: [
      { i: 'main', x: 2, y: 0, w: 8, h: 8, minW: 6, minH: 6 }
    ]
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Split view with equal columns',
    icon: ViewColumnsIcon,
    layout: [
      { i: 'left', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 4 },
      { i: 'right', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 4 }
    ]
  },
  {
    id: 'three-column',
    name: 'Three Column',
    description: 'Triple column layout for detailed analysis',
    icon: TableCellsIcon,
    layout: [
      { i: 'left', x: 0, y: 0, w: 4, h: 8, minW: 3, minH: 4 },
      { i: 'center', x: 4, y: 0, w: 4, h: 8, minW: 3, minH: 4 },
      { i: 'right', x: 8, y: 0, w: 4, h: 8, minW: 3, minH: 4 }
    ]
  },
  {
    id: 'dashboard-classic',
    name: 'Classic Dashboard',
    description: 'Metrics at top, visualizations below',
    icon: RectangleStackIcon,
    layout: [
      { i: 'metric1', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'metric2', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'metric3', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'metric4', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'chart1', x: 0, y: 3, w: 6, h: 5, minW: 4, minH: 4 },
      { i: 'chart2', x: 6, y: 3, w: 6, h: 5, minW: 4, minH: 4 }
    ]
  },
  {
    id: 'analysis-workflow',
    name: 'Analysis Workflow',
    description: 'Structured flow for Q-methodology analysis',
    icon: ArrowPathIcon,
    layout: [
      { i: 'eigenvalue', x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'loadings', x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'heatmap', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'distinguishing', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'distribution', x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 }
    ]
  }
];

// Device breakpoints
const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480 };
const cols = { lg: 12, md: 10, sm: 6, xs: 4 };

interface DashboardLayoutProps {
  layout: Layout[];
  onLayoutChange: (layout: Layout[], layouts?: any) => void;
  onApplyTemplate?: (template: LayoutTemplate) => void;
  children: React.ReactNode;
  isReadOnly?: boolean;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  layout,
  onLayoutChange,
  onApplyTemplate,
  children,
  isReadOnly = false,
  className = ""
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLayoutControls, setShowLayoutControls] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [gridSpacing, setGridSpacing] = useState(10);
  const [autoResize, setAutoResize] = useState(true);
  const [savedLayouts, setSavedLayouts] = useState<{ name: string; layout: Layout[]; timestamp: Date }[]>([]);
  const [layoutHistory, setLayoutHistory] = useState<Layout[][]>([layout]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const gridRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Apple spring physics
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8
  };

  // Add layout to history
  const addToHistory = useCallback((newLayout: Layout[]) => {
    const newHistory = layoutHistory.slice(0, historyIndex + 1);
    newHistory.push([...newLayout]);
    setLayoutHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [layoutHistory, historyIndex]);

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevLayout = layoutHistory[historyIndex - 1];
      onLayoutChange([...prevLayout]);
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, layoutHistory, onLayoutChange]);

  const redo = useCallback(() => {
    if (historyIndex < layoutHistory.length - 1) {
      const nextLayout = layoutHistory[historyIndex + 1];
      onLayoutChange([...nextLayout]);
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, layoutHistory, onLayoutChange]);

  // Handle layout changes
  const handleLayoutChange = useCallback((newLayout: Layout[], allLayouts?: any) => {
    onLayoutChange(newLayout, allLayouts);
    addToHistory(newLayout);
  }, [onLayoutChange, addToHistory]);

  // Apply template
  const applyTemplate = useCallback((template: LayoutTemplate) => {
    const preset = layoutPresets.find(p => p.id === template);
    if (preset && onApplyTemplate) {
      onApplyTemplate(template);
    }
    setShowTemplates(false);
  }, [onApplyTemplate]);

  // Save current layout
  const saveLayout = useCallback(() => {
    const name = prompt('Enter a name for this layout:');
    if (name) {
      const newSavedLayout = {
        name,
        layout: [...layout],
        timestamp: new Date()
      };
      setSavedLayouts([...savedLayouts, newSavedLayout]);
    }
  }, [layout, savedLayouts]);

  // Load saved layout
  const loadLayout = useCallback((savedLayout: Layout[]) => {
    onLayoutChange([...savedLayout]);
    addToHistory(savedLayout);
  }, [onLayoutChange, addToHistory]);

  // Auto-arrange widgets
  const autoArrange = useCallback(() => {
    const sortedItems = [...layout].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    const itemsPerRow = Math.floor(12 / 4); // Assuming 4-unit width items
    
    const arrangedLayout = sortedItems.map((item, index) => {
      const row = Math.floor(index / itemsPerRow);
      const col = index % itemsPerRow;
      
      return {
        ...item,
        x: col * 4,
        y: row * 4,
        w: Math.min(item.w, 4),
        h: Math.min(item.h, 4)
      };
    });

    onLayoutChange(arrangedLayout);
    addToHistory(arrangedLayout);
  }, [layout, onLayoutChange, addToHistory]);

  // Responsive breakpoint change
  const handleBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  // Zoom controls
  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
    setZoomLevel(newZoom);
  }, [zoomLevel]);

  // Device preview modes
  const previewModes = [
    { name: 'Desktop', icon: ComputerDesktopIcon, breakpoint: 'lg' },
    { name: 'Tablet', icon: DeviceTabletIcon, breakpoint: 'md' },
    { name: 'Mobile', icon: DevicePhoneMobileIcon, breakpoint: 'sm' }
  ];

  return (
    <div ref={containerRef} className={`relative h-full ${className}`}>
      {/* Layout Controls */}
      {!isReadOnly && (
        <>
          {/* Main Control Bar */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              {/* Template Selector */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center px-3 py-2 bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200 shadow-lg hover:bg-white/90 transition-colors"
                >
                  <RectangleGroupIcon className="w-4 h-4 mr-2" />
                  Templates
                </motion.button>

                <AnimatePresence>
                  {showTemplates && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50"
                    >
                      <h3 className="font-semibold text-sm mb-3">Layout Templates</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {layoutPresets.map((preset) => (
                          <motion.button
                            key={preset.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applyTemplate(preset.id)}
                            className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center mb-2">
                              <preset.icon className="w-4 h-4 mr-2 text-blue-600" />
                              <span className="font-medium text-xs">{preset.name}</span>
                            </div>
                            <p className="text-xs text-gray-600">{preset.description}</p>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auto Arrange */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={autoArrange}
                className="flex items-center px-3 py-2 bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200 shadow-lg hover:bg-white/90 transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Auto Arrange
              </motion.button>

              {/* Undo/Redo */}
              <div className="flex items-center space-x-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={undo}
                  disabled={historyIndex === 0}
                  className="p-2 bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200 shadow-lg hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  ↶
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={redo}
                  disabled={historyIndex === layoutHistory.length - 1}
                  className="p-2 bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200 shadow-lg hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  ↷
                </motion.button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Device Preview */}
              <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200 shadow-lg p-1">
                {previewModes.map((mode) => (
                  <motion.button
                    key={mode.breakpoint}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentBreakpoint(mode.breakpoint)}
                    className={`p-1.5 rounded-md transition-colors ${
                      currentBreakpoint === mode.breakpoint
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title={mode.name}
                  >
                    <mode.icon className="w-4 h-4" />
                  </motion.button>
                ))}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200 shadow-lg p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleZoom(-0.1)}
                  disabled={zoomLevel <= 0.5}
                  className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
                >
                  <MagnifyingGlassMinusIcon className="w-4 h-4" />
                </motion.button>
                <span className="px-2 text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleZoom(0.1)}
                  disabled={zoomLevel >= 2}
                  className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"
                >
                  <MagnifyingGlassPlusIcon className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Layout Controls Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLayoutControls(!showLayoutControls)}
                className="flex items-center px-3 py-2 bg-white/80 backdrop-blur-lg rounded-lg border border-gray-200 shadow-lg hover:bg-white/90 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                Settings
              </motion.button>
            </div>
          </motion.div>

          {/* Advanced Layout Controls */}
          <AnimatePresence>
            {showLayoutControls && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute top-20 right-4 w-80 bg-white/95 backdrop-blur-lg rounded-xl border border-gray-200 shadow-xl p-4 z-40"
              >
                <h3 className="font-semibold text-sm mb-4">Layout Settings</h3>
                
                <div className="space-y-4">
                  {/* Grid Spacing */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Grid Spacing: {gridSpacing}px
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={gridSpacing}
                      onChange={(e: any) => setGridSpacing(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Auto Resize */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoResize"
                      checked={autoResize}
                      onChange={(e: any) => setAutoResize(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="autoResize" className="text-xs font-medium text-gray-700">
                      Auto resize widgets
                    </label>
                  </div>

                  {/* Save/Load Layouts */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-700">Saved Layouts</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={saveLayout}
                        className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <BookmarkIcon className="w-3 h-3 mr-1" />
                        Save Current
                      </motion.button>
                    </div>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {savedLayouts.map((savedLayout, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{savedLayout.name}</p>
                            <p className="text-gray-500 text-xs">
                              {savedLayout.timestamp.toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => loadLayout(savedLayout.layout)}
                            className="text-blue-600 hover:text-blue-800 ml-2"
                          >
                            Load
                          </button>
                        </div>
                      ))}
                      
                      {savedLayouts.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-2">
                          No saved layouts
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Grid Container */}
      <motion.div
        className="h-full pt-16 pb-4 px-4"
        animate={{ 
          scale: zoomLevel,
          transformOrigin: "top center"
        }}
        transition={springConfig}
      >
        <ResponsiveGridLayout
          ref={gridRef}
          className="layout"
          layouts={{ [currentBreakpoint]: layout }}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={handleBreakpointChange}
          breakpoints={breakpoints}
          cols={cols}
          rowHeight={60}
          margin={[gridSpacing, gridSpacing]}
          isDraggable={!isReadOnly}
          isResizable={!isReadOnly && autoResize}
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms={true}
          style={{
            minHeight: '100%',
          }}
        >
          {children}
        </ResponsiveGridLayout>
      </motion.div>
    </div>
  );
};

export default DashboardLayout;