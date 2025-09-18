'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, Minus, Plus, RotateCcw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface GridColumn {
  value: number;
  label: string;
  cells: number;
}

interface GridConfiguration {
  rangeMin: number;
  rangeMax: number;
  columns: GridColumn[];
  totalCells: number;
  distribution: 'bell' | 'flat' | 'custom';
  instructions?: string;
  labelTheme: string;
  symmetry: boolean;
}

interface AppleUIGridBuilderEnhancedProps {
  studyId?: string;
  onGridChange?: (config: GridConfiguration) => void;
  totalStatements?: number;
  minStatements?: number;
  maxStatements?: number;
}

// Dynamic label generation based on scale range
const generateDynamicLabels = (value: number, range: number): string => {
  // const absValue = Math.abs(value);
  const maxRange = Math.abs(range);
  
  // For smaller ranges (-2 to +2 or -3 to +3)
  if (maxRange <= 3) {
    const smallRangeLabels: Record<string, string> = {
      '-3': 'Most Disagree',
      '-2': 'Disagree',
      '-1': 'Slightly Disagree',
      '0': 'Neutral',
      '1': 'Slightly Agree',
      '2': 'Agree',
      '3': 'Most Agree'
    };
    return smallRangeLabels[value.toString()] || `Position ${value}`;
  }
  
  // For medium ranges (-4 to +4 or -5 to +5)
  if (maxRange <= 5) {
    const mediumRangeLabels: Record<string, string> = {
      '-5': 'Strongly Disagree',
      '-4': 'Disagree',
      '-3': 'Somewhat Disagree',
      '-2': 'Slightly Disagree',
      '-1': 'Tend to Disagree',
      '0': 'Neutral',
      '1': 'Tend to Agree',
      '2': 'Slightly Agree',
      '3': 'Somewhat Agree',
      '4': 'Agree',
      '5': 'Strongly Agree'
    };
    return mediumRangeLabels[value.toString()] || `Position ${value}`;
  }
  
  // For large ranges (-6 to +6)
  const largeRangeLabels: Record<string, string> = {
    '-6': 'Extremely Disagree',
    '-5': 'Strongly Disagree',
    '-4': 'Disagree',
    '-3': 'Somewhat Disagree',
    '-2': 'Slightly Disagree',
    '-1': 'Tend to Disagree',
    '0': 'Neutral',
    '1': 'Tend to Agree',
    '2': 'Slightly Agree',
    '3': 'Somewhat Agree',
    '4': 'Agree',
    '5': 'Strongly Agree',
    '6': 'Extremely Agree'
  };
  return largeRangeLabels[value.toString()] || `Position ${value}`;
};

export const AppleUIGridBuilderEnhanced: React.FC<AppleUIGridBuilderEnhancedProps> = ({
  studyId: _studyId,
  onGridChange,
  totalStatements = 30,
  minStatements: _minStatements = 10,
  maxStatements: _maxStatements = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridRange, setGridRange] = useState({ min: -3, max: 3 });
  const [columns, setColumns] = useState<GridColumn[]>([]);
  const [instructions, setInstructions] = useState('Please sort the items according to your level of agreement.');
  const [distribution, setDistribution] = useState<'bell' | 'flat'>('bell');
  const [symmetry, setSymmetry] = useState(true);
  const [columnWidth, setColumnWidth] = useState(80);
  const [manuallyEdited, setManuallyEdited] = useState(false);

  // Calculate column width to fit all columns on screen
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 64;
      const columnCount = gridRange.max - gridRange.min + 1;
      const gap = 12;
      const totalGaps = (columnCount - 1) * gap;
      const availableWidth = containerWidth - totalGaps;
      const calculatedWidth = Math.min(100, Math.max(60, availableWidth / columnCount));
      setColumnWidth(calculatedWidth);
    }
  }, [gridRange]);

  // Generate columns with proper distribution
  const generateColumns = useCallback((min: number, max: number, dist: 'bell' | 'flat'): GridColumn[] => {
    const columnCount = max - min + 1;
    const newColumns: GridColumn[] = [];
    let cellDistribution: number[] = [];
    
    if (dist === 'flat') {
      // TRUE FLAT DISTRIBUTION - All columns get equal cells
      const cellsPerColumn = Math.floor(totalStatements / columnCount);
      const remainder = totalStatements % columnCount;
      
      // Start with base cells for all columns
      cellDistribution = new Array(columnCount).fill(cellsPerColumn);
      
      // Distribute remainder cells to middle columns for balance
      if (remainder > 0) {
        const middleStart = Math.floor((columnCount - remainder) / 2);
        for (let i = 0; i < remainder; i++) {
          cellDistribution[middleStart + i]++;
        }
      }
    } else {
      // BELL CURVE DISTRIBUTION with guaranteed symmetry
      const center = (columnCount - 1) / 2;
      const sigma = columnCount / 3.5; // Adjusted for better curve shape
      
      // Calculate raw bell values
      const bellValues: number[] = [];
      for (let i = 0; i < columnCount; i++) {
        const distance = Math.abs(i - center);
        const normalizedDistance = distance / sigma;
        const bellValue = Math.exp(-0.5 * normalizedDistance * normalizedDistance);
        bellValues.push(bellValue);
      }
      
      // Ensure perfect symmetry
      const halfColumns = Math.floor(columnCount / 2);
      for (let i = 0; i < halfColumns; i++) {
        const avgValue = (bellValues[i] + bellValues[columnCount - 1 - i]) / 2;
        bellValues[i] = avgValue;
        bellValues[columnCount - 1 - i] = avgValue;
      }
      
      // Normalize and distribute cells
      const sumBellValues = bellValues.reduce((a, b) => a + b, 0);
      cellDistribution = new Array(columnCount).fill(0);
      let distributedCells = 0;
      
      // Distribute cells proportionally
      for (let i = 0; i < columnCount; i++) {
        const proportion = bellValues[i] / sumBellValues;
        const cells = Math.max(1, Math.round(totalStatements * proportion));
        cellDistribution[i] = cells;
        distributedCells += cells;
      }
      
      // Adjust for exact total
      const adjustment = totalStatements - distributedCells;
      if (adjustment !== 0) {
        const middleIndex = Math.floor(columnCount / 2);
        cellDistribution[middleIndex] += adjustment;
      }
    }
    
    // Create columns with dynamic labels
    for (let i = min; i <= max; i++) {
      const index = i - min;
      const label = generateDynamicLabels(i, max);
      
      newColumns.push({
        value: i,
        label: label,
        cells: cellDistribution[index]
      });
    }
    
    return newColumns;
  }, [totalStatements]);

  // Initialize and update grid
  useEffect(() => {
    if (!manuallyEdited) {
      const newColumns = generateColumns(gridRange.min, gridRange.max, distribution);
      setColumns(newColumns);
    }
  }, [gridRange, distribution, totalStatements, generateColumns, manuallyEdited]);

  // Notify parent of changes
  useEffect(() => {
    if (onGridChange && columns.length > 0) {
      const config: GridConfiguration = {
        rangeMin: gridRange.min,
        rangeMax: gridRange.max,
        columns,
        totalCells: columns.reduce((sum, col) => sum + col.cells, 0),
        distribution: manuallyEdited ? 'custom' : distribution,
        instructions,
        labelTheme: 'dynamic',
        symmetry
      };
      onGridChange(config);
    }
  }, [columns, gridRange, instructions, distribution, manuallyEdited, symmetry, onGridChange]);

  const handleRangeChange = (newMax: number) => {
    setGridRange({ min: -newMax, max: newMax });
    setManuallyEdited(false);
  };

  const handleDistributionChange = (newDist: 'bell' | 'flat') => {
    setDistribution(newDist);
    setManuallyEdited(false);
    const newColumns = generateColumns(gridRange.min, gridRange.max, newDist);
    setColumns(newColumns);
  };

  const adjustCells = (columnIndex: number, delta: number) => {
    const newColumns = [...columns];
    const currentTotal = newColumns.reduce((sum, col) => sum + col.cells, 0);
    
    // Can't exceed total statements
    if (delta > 0 && currentTotal >= totalStatements) {
      return;
    }
    
    // Can't go below 0
    if (newColumns[columnIndex].cells + delta < 0) {
      return;
    }
    
    // Apply change
    newColumns[columnIndex].cells += delta;
    
    // Maintain symmetry if enabled
    if (symmetry) {
      const mirrorIndex = newColumns.length - 1 - columnIndex;
      if (mirrorIndex !== columnIndex && mirrorIndex >= 0 && mirrorIndex < newColumns.length) {
        // Check if mirror can also be adjusted
        if (newColumns[mirrorIndex].cells + delta >= 0) {
          newColumns[mirrorIndex].cells += delta;
        } else {
          // Revert the original change if mirror can't be adjusted
          newColumns[columnIndex].cells -= delta;
          return;
        }
      }
    }
    
    // If we're maintaining distribution form, redistribute
    if (!manuallyEdited && distribution === 'flat') {
      // For flat distribution, try to keep all columns equal
      const totalCells = newColumns.reduce((sum, col) => sum + col.cells, 0);
      const targetPerColumn = Math.floor(totalCells / newColumns.length);
      const remainder = totalCells % newColumns.length;
      
      for (let i = 0; i < newColumns.length; i++) {
        newColumns[i].cells = targetPerColumn;
        if (i < remainder) {
          newColumns[i].cells++;
        }
      }
    }
    
    setColumns(newColumns);
    setManuallyEdited(true);
  };

  const resetDistribution = () => {
    setManuallyEdited(false);
    const newColumns = generateColumns(gridRange.min, gridRange.max, distribution);
    setColumns(newColumns);
  };

  const totalCells = columns.reduce((sum, col) => sum + col.cells, 0);
  const isValid = totalCells === totalStatements;

  // Calculate dynamic cell size
  const cellHeight = useMemo(() => {
    const maxCells = Math.max(...columns.map((c: any) => c.cells));
    if (maxCells > 8) return 28;
    if (maxCells > 6) return 36;
    return 44;
  }, [columns]);

  return (
    <div className="apple-ui-grid-builder bg-white rounded-2xl shadow-sm border border-gray-200/60">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200/60">
        <h3 className="text-lg font-semibold text-gray-900">Enhanced Grid Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">Design your Q-sort grid with perfect symmetry</p>
      </div>

      {/* Settings */}
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200/60">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Range Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grid Range
            </label>
            <div className="relative">
              <select
                value={gridRange.max}
                onChange={(e: any) => handleRangeChange(parseInt(e.target.value))}
                className="appearance-none w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2, 3, 4, 5, 6].map((val: any) => (
                  <option key={val} value={val}>
                    −{val} to +{val} ({val * 2 + 1} columns)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Distribution Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distribution
            </label>
            <div className="relative">
              <select
                value={distribution}
                onChange={(e: any) => handleDistributionChange(e.target.value as 'bell' | 'flat')}
                className="appearance-none w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bell">Bell Curve</option>
                <option value="flat">Flat (Equal)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Symmetry Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symmetry
            </label>
            <button
              onClick={() => setSymmetry(!symmetry)}
              className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                symmetry 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {symmetry ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Reset Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              &nbsp;
            </label>
            <button
              onClick={resetDistribution}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              title="Reset to original distribution"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Grid
            </button>
          </div>
        </div>
      </div>

      {/* Grid Visualization */}
      <div ref={containerRef} className="p-6 overflow-hidden">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-6">
          <div 
            className="flex gap-3 justify-center items-start transition-all duration-300"
            style={{ transform: `scale(${columnWidth < 70 ? 0.9 : 1})` }}
          >
            <AnimatePresence mode="popLayout">
              {columns.map((column, index) => (
                <motion.div
                  key={column.value}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  layout
                  style={{ width: `${columnWidth}px` }}
                >
                  {/* Top Section - Fixed Layout */}
                  <div className="flex flex-col items-center flex-1">
                    {/* Column Value */}
                    <div className="text-center mb-2">
                      <div className="font-bold text-lg text-gray-900">
                        {column.value > 0 ? '+' : ''}{column.value}
                      </div>
                    </div>

                    {/* Cell Controls */}
                    <div className="flex items-center justify-center gap-1 mb-2 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200">
                      <button
                        onClick={() => adjustCells(index, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={column.cells <= 0}
                        title="Remove cell"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold text-gray-700 w-8 text-center">
                        {column.cells}
                      </span>
                      <button
                        onClick={() => adjustCells(index, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={totalCells >= totalStatements}
                        title="Add cell"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Cells Visualization */}
                    <div className="flex flex-col-reverse gap-1 mb-2">
                      {Array.from({ length: column.cells }).map((_, cellIndex) => (
                        <motion.div
                          key={cellIndex}
                          className="bg-white border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors"
                          style={{
                            width: `${columnWidth - 8}px`,
                            height: `${cellHeight}px`
                          }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            delay: cellIndex * 0.02,
                            type: 'spring',
                            stiffness: 300,
                            damping: 25
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Column Label - Fixed Height Container */}
                  <div className="px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200 w-full h-12 flex items-center justify-center">
                    <div className="text-xs font-medium text-gray-600 text-center break-words line-clamp-2">
                      {column.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Status Bar */}
          <div className="mt-6 flex items-center justify-between">
            <div className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-orange-600'}`}>
              {isValid ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Grid is balanced</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {totalCells < totalStatements 
                      ? `Need ${totalStatements - totalCells} more cells` 
                      : `Remove ${totalCells - totalStatements} cells`}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Total: {totalCells}/{totalStatements}</span>
              {manuallyEdited && (
                <span className="text-blue-600 font-medium">Manually Edited</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 py-4 border-t border-gray-200/60">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions for Participants
        </label>
        <textarea
          value={instructions}
          onChange={(e: any) => setInstructions(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1">
          {instructions.length}/500 characters
        </div>
      </div>
    </div>
  );
};