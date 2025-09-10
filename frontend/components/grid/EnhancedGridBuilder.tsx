'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGridStore } from '@/lib/stores/grid-store';
import { 
  Plus, 
  Minus, 
  ChevronDown, 
  Grid3x3,
  Maximize2,
  Settings,
  RefreshCw,
  Save,
  AlertCircle,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface GridColumn {
  value: number;
  label: string;
  customLabel?: string;
  cells: number;
}

interface EnhancedGridBuilderProps {
  studyId?: string;
  onGridChange?: (config: any) => void;
  allowColumnManagement?: boolean;
  showAdvancedOptions?: boolean;
  minCells?: number;
  maxCells?: number;
}

export const EnhancedGridBuilder: React.FC<EnhancedGridBuilderProps> = ({
  studyId,
  onGridChange,
  allowColumnManagement = true,
  showAdvancedOptions = true,
  minCells = 10,
  maxCells = 100
}) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const prevConfigRef = useRef<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoBalance, setAutoBalance] = useState(false);
  const [lockSymmetry, setLockSymmetry] = useState(true);
  const [enableAnimation, setEnableAnimation] = useState(true);
  const [gridScrollOffset, setGridScrollOffset] = useState(0);
  
  const {
    config,
    isValid,
    validationErrors,
    gridScale,
    gridOverflow,
    showGridLines,
    showLabels,
    setConfig,
    updateRange,
    addColumn,
    removeColumn,
    updateColumnCells,
    updateColumnLabel,
    applyDistribution,
    setGridScale,
    toggleGridLines,
    toggleLabels,
    validateGrid,
    calculateGridOverflow,
    updateViewport
  } = useGridStore();

  // Initialize grid if not set
  useEffect(() => {
    if (!config) {
      // Generate default columns with a bell curve distribution
      const defaultColumns = generateDefaultColumns(-3, 3, 25); // Default to ~25 cells
      const defaultTotalCells = defaultColumns.reduce((sum, col) => sum + col.cells, 0);
      
      const defaultConfig = {
        rangeMin: -3,
        rangeMax: 3,
        columns: defaultColumns,
        symmetry: true,
        totalCells: defaultTotalCells,
        distribution: 'bell' as const,
        instructions: 'Please sort the items according to your level of agreement.',
        allowAddColumns: true,
        allowRemoveColumns: true,
        allowCellAdjustment: true,
        maxColumns: 13,
        responsive: true
      };
      setConfig(defaultConfig);
    } else {
      // Validate whenever config exists
      validateGrid();
    }
  }, [config, setConfig, validateGrid]);

  // Handle viewport updates
  useEffect(() => {
    const handleResize = () => {
      updateViewport(window.innerWidth);
      calculateGridOverflow();
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [updateViewport, calculateGridOverflow]);

  // Notify parent of changes - only when config actually changes
  useEffect(() => {
    if (config && onGridChange) {
      // Check if config has actually changed
      const configStr = JSON.stringify(config);
      const prevConfigStr = prevConfigRef.current ? JSON.stringify(prevConfigRef.current) : null;
      
      if (configStr !== prevConfigStr) {
        prevConfigRef.current = config;
        onGridChange(config);
      }
    }
  }, [config, onGridChange]);

  const generateDefaultColumns = (min: number, max: number, total: number): GridColumn[] => {
    const columnCount = max - min + 1;
    const columns: GridColumn[] = [];
    const center = columnCount / 2;
    
    for (let i = min; i <= max; i++) {
      const position = i - min;
      const distance = Math.abs(position - center + 0.5);
      const maxCells = Math.ceil(total / columnCount * 1.5);
      const cells = Math.max(1, Math.round(maxCells * Math.exp(-distance * distance / (columnCount * 2))));
      
      columns.push({
        value: i,
        label: getDefaultLabel(i),
        cells
      });
    }
    
    return columns;
  };

  const getDefaultLabel = (value: number): string => {
    const labels: Record<number, string> = {
      '-6': 'Strongly Disagree',
      '-5': 'Disagree',
      '-4': 'Moderately Disagree',
      '-3': 'Slightly Disagree',
      '-2': 'Somewhat Disagree',
      '-1': 'Mildly Disagree',
      '0': 'Neutral',
      '1': 'Mildly Agree',
      '2': 'Somewhat Agree',
      '3': 'Slightly Agree',
      '4': 'Moderately Agree',
      '5': 'Agree',
      '6': 'Strongly Agree'
    };
    return labels[value] || `Position ${value}`;
  };

  const handleAddColumn = (position: 'start' | 'end') => {
    if (!config) return;
    
    if (position === 'start') {
      addColumn('start');
    } else {
      addColumn('end');
    }
  };

  const handleRemoveColumn = (index: number) => {
    if (!config || config.columns.length <= 3) return;
    removeColumn(index);
  };

  const handleCellAdjustment = (columnIndex: number, delta: number) => {
    if (!config) return;
    
    const column = config.columns[columnIndex];
    const newCellCount = Math.max(0, column.cells + delta);
    
    // Calculate current total
    const currentTotal = config.columns.reduce((sum, col) => sum + col.cells, 0);
    const newTotal = currentTotal - column.cells + newCellCount;
    
    // Check if new total exceeds maximum allowed cells
    if (newTotal > maxCells) {
      return;
    }
    
    // Check if new total is below minimum allowed cells
    if (newTotal < minCells && delta < 0) {
      return;
    }
    
    // Just call updateColumnCells - it handles totalCells update internally
    updateColumnCells(columnIndex, newCellCount);
  };

  const handleAutoBalance = () => {
    if (!config) return;
    
    const columnCount = config.columns.length;
    const currentTotal = config.columns.reduce((sum, col) => sum + col.cells, 0);
    const basePerColumn = Math.floor(currentTotal / columnCount);
    const remainder = currentTotal % columnCount;
    
    const newColumns = config.columns.map((column, index) => ({
      ...column,
      cells: basePerColumn + (index < remainder ? 1 : 0)
    }));
    
    setConfig({
      ...config,
      columns: newColumns,
      distribution: 'custom' as const
    });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!gridContainerRef.current) return;
    
    const scrollAmount = 200;
    const newOffset = direction === 'left' 
      ? Math.max(0, gridScrollOffset - scrollAmount)
      : gridScrollOffset + scrollAmount;
    
    gridContainerRef.current.scrollLeft = newOffset;
    setGridScrollOffset(newOffset);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const totalCells = config.columns.reduce((sum, col) => sum + col.cells, 0);
  const isWithinLimits = totalCells >= minCells && totalCells <= maxCells;

  return (
    <div className="enhanced-grid-builder bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header with Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Grid3x3 className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">Interactive Grid Builder</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setGridScale(Math.max(0.5, gridScale - 0.1))}
              className="p-1 hover:bg-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-sm font-medium">
              {Math.round(gridScale * 100)}%
            </span>
            <button
              onClick={() => setGridScale(Math.min(2, gridScale + 0.1))}
              className="p-1 hover:bg-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200"
          >
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Range Selector */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Grid Range</label>
                  <select
                    value={config.rangeMax}
                    onChange={(e) => updateRange(-parseInt(e.target.value), parseInt(e.target.value))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(val => (
                      <option key={val} value={val}>-{val} to +{val}</option>
                    ))}
                  </select>
                </div>
                
                {/* Distribution Preset */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Distribution</label>
                  <select
                    value={config.distribution}
                    onChange={(e) => applyDistribution(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bell">Bell Curve (Balanced)</option>
                    <option value="flat">Flat (Equal)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                {/* Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lockSymmetry}
                      onChange={(e) => setLockSymmetry(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Lock Symmetry</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGridLines}
                      onChange={toggleGridLines}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Show Grid Lines</span>
                  </label>
                </div>
                
                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleAutoBalance}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Auto Balance
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid Area */}
      <div className="relative">
        {/* Scroll Controls for Overflow */}
        {gridOverflow && (
          <>
            <button
              onClick={() => handleScroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        
        <div 
          ref={gridContainerRef}
          className="overflow-x-auto p-8 bg-gradient-to-br from-gray-50 to-gray-100"
          style={{ transform: `scale(${gridScale})`, transformOrigin: 'top left' }}
        >
          <div className="flex gap-3 justify-center min-w-max">
            {/* Add Column Button (Start) */}
            {allowColumnManagement && config.columns.length < (config.maxColumns || 13) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddColumn('start')}
                className="self-end mb-12 p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                title="Add column at start"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            )}
            
            {/* Grid Columns */}
            <AnimatePresence mode="popLayout">
              {config.columns.map((column, index) => (
                <motion.div
                  key={`${column.value}-${index}`}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  {/* Column Header */}
                  <div className="text-center mb-3">
                    <div className="font-bold text-lg text-gray-800 mb-1">
                      {column.value > 0 ? '+' : ''}{column.value}
                    </div>
                    {showLabels && (
                      <input
                        type="text"
                        value={column.customLabel || column.label}
                        onChange={(e) => updateColumnLabel(index, e.target.value)}
                        className="w-24 text-xs text-center border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 bg-transparent"
                        placeholder="Label"
                      />
                    )}
                  </div>
                  
                  {/* Cells Stack */}
                  <div className="flex flex-col-reverse gap-1 mb-3">
                    {Array.from({ length: column.cells }).map((_, cellIndex) => (
                      <motion.div
                        key={cellIndex}
                        className={`w-20 h-12 border-2 rounded-lg transition-all ${
                          showGridLines 
                            ? 'border-gray-400 bg-white' 
                            : 'border-gray-300 bg-gray-50'
                        } hover:border-blue-400 hover:shadow-sm`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: cellIndex * 0.02,
                          type: 'spring',
                          stiffness: 300,
                          damping: 20
                        }}
                        whileHover={enableAnimation ? { scale: 1.05 } : {}}
                      />
                    ))}
                  </div>
                  
                  {/* Cell Controls */}
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                    <button
                      onClick={() => handleCellAdjustment(index, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={column.cells <= 0}
                      title="Remove cell"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-8 text-center">{column.cells}</span>
                    <button
                      onClick={() => handleCellAdjustment(index, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={totalCells >= maxCells}
                      title="Add cell"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Column Name at Bottom */}
                  <div className="text-center mt-2">
                    <div className="text-xs text-gray-600 font-medium px-2 py-1 bg-gray-50 rounded">
                      {column.customLabel || column.label}
                    </div>
                  </div>
                  
                  {/* Remove Column Button */}
                  {allowColumnManagement && config.columns.length > 3 && (
                    <button
                      onClick={() => handleRemoveColumn(index)}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Add Column Button (End) */}
            {allowColumnManagement && config.columns.length < (config.maxColumns || 13) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAddColumn('end')}
                className="self-end mb-12 p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                title="Add column at end"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Cell Count Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
              isWithinLimits ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {totalCells} cells configured
              </span>
            </div>
            
            {/* Limits Indicator */}
            <span className="text-sm text-gray-600">
              Grid capacity: {minCells} - {maxCells} cells
            </span>
            
            {/* Warning if outside limits */}
            {!isWithinLimits && (
              <span className="text-sm text-orange-600 font-medium">
                {totalCells < minCells 
                  ? `Add ${minCells - totalCells} more cells` 
                  : `Remove ${totalCells - maxCells} cells`}
              </span>
            )}
          </div>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="text-sm text-red-600">
              {validationErrors[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};