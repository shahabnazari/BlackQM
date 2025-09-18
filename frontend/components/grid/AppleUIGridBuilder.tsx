'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, Info, Minus, Plus } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
}

interface AppleUIGridBuilderProps {
  studyId?: string;
  onGridChange?: (config: GridConfiguration) => void;
  totalStatements?: number;
  minStatements?: number;
  maxStatements?: number;
}

// Pre-defined label themes for Q-sort
const labelThemes = {
  'custom': {
    name: 'Custom Labels',
    labels: {}
  },
  'agreement': {
    name: 'Agreement Scale',
    labels: {
      '-6': 'Strongly Disagree',
      '-5': 'Disagree',
      '-4': 'Moderately Disagree',
      '-3': 'Somewhat Disagree',
      '-2': 'Slightly Disagree',
      '-1': 'Tend to Disagree',
      '0': 'Neutral',
      '1': 'Tend to Agree',
      '2': 'Slightly Agree',
      '3': 'Somewhat Agree',
      '4': 'Moderately Agree',
      '5': 'Agree',
      '6': 'Strongly Agree'
    }
  },
  'characteristic': {
    name: 'Characteristic Scale',
    labels: {
      '-6': 'Extremely Uncharacteristic',
      '-5': 'Very Uncharacteristic',
      '-4': 'Quite Uncharacteristic',
      '-3': 'Somewhat Uncharacteristic',
      '-2': 'Slightly Uncharacteristic',
      '-1': 'A Little Uncharacteristic',
      '0': 'Neutral',
      '1': 'A Little Characteristic',
      '2': 'Slightly Characteristic',
      '3': 'Somewhat Characteristic',
      '4': 'Quite Characteristic',
      '5': 'Very Characteristic',
      '6': 'Extremely Characteristic'
    }
  },
  'importance': {
    name: 'Importance Scale',
    labels: {
      '-6': 'Extremely Unimportant',
      '-5': 'Very Unimportant',
      '-4': 'Quite Unimportant',
      '-3': 'Somewhat Unimportant',
      '-2': 'Slightly Unimportant',
      '-1': 'Of Little Importance',
      '0': 'Neutral',
      '1': 'Of Some Importance',
      '2': 'Slightly Important',
      '3': 'Somewhat Important',
      '4': 'Quite Important',
      '5': 'Very Important',
      '6': 'Extremely Important'
    }
  },
  'frequency': {
    name: 'Frequency Scale',
    labels: {
      '-6': 'Never',
      '-5': 'Very Rarely',
      '-4': 'Rarely',
      '-3': 'Infrequently',
      '-2': 'Occasionally',
      '-1': 'Sometimes',
      '0': 'Neutral',
      '1': 'Fairly Often',
      '2': 'Often',
      '3': 'Frequently',
      '4': 'Very Frequently',
      '5': 'Almost Always',
      '6': 'Always'
    }
  },
  'satisfaction': {
    name: 'Satisfaction Scale',
    labels: {
      '-6': 'Extremely Dissatisfied',
      '-5': 'Very Dissatisfied',
      '-4': 'Quite Dissatisfied',
      '-3': 'Somewhat Dissatisfied',
      '-2': 'Slightly Dissatisfied',
      '-1': 'A Little Dissatisfied',
      '0': 'Neutral',
      '1': 'A Little Satisfied',
      '2': 'Slightly Satisfied',
      '3': 'Somewhat Satisfied',
      '4': 'Quite Satisfied',
      '5': 'Very Satisfied',
      '6': 'Extremely Satisfied'
    }
  },
  'likelihood': {
    name: 'Likelihood Scale',
    labels: {
      '-6': 'Extremely Unlikely',
      '-5': 'Very Unlikely',
      '-4': 'Quite Unlikely',
      '-3': 'Somewhat Unlikely',
      '-2': 'Slightly Unlikely',
      '-1': 'Probably Not',
      '0': 'Uncertain',
      '1': 'Possibly',
      '2': 'Slightly Likely',
      '3': 'Somewhat Likely',
      '4': 'Quite Likely',
      '5': 'Very Likely',
      '6': 'Extremely Likely'
    }
  },
  'quality': {
    name: 'Quality Scale',
    labels: {
      '-6': 'Extremely Poor',
      '-5': 'Very Poor',
      '-4': 'Poor',
      '-3': 'Below Average',
      '-2': 'Slightly Below Average',
      '-1': 'Fair',
      '0': 'Average',
      '1': 'Good',
      '2': 'Slightly Above Average',
      '3': 'Above Average',
      '4': 'Very Good',
      '5': 'Excellent',
      '6': 'Outstanding'
    }
  },
  'priority': {
    name: 'Priority Scale',
    labels: {
      '-6': 'Lowest Priority',
      '-5': 'Very Low Priority',
      '-4': 'Low Priority',
      '-3': 'Below Average Priority',
      '-2': 'Slightly Low Priority',
      '-1': 'Minor Priority',
      '0': 'Neutral',
      '1': 'Some Priority',
      '2': 'Moderate Priority',
      '3': 'Above Average Priority',
      '4': 'High Priority',
      '5': 'Very High Priority',
      '6': 'Highest Priority'
    }
  },
  'preference': {
    name: 'Preference Scale',
    labels: {
      '-6': 'Strongly Dislike',
      '-5': 'Dislike',
      '-4': 'Moderately Dislike',
      '-3': 'Somewhat Dislike',
      '-2': 'Slightly Dislike',
      '-1': 'Tend to Dislike',
      '0': 'No Preference',
      '1': 'Tend to Like',
      '2': 'Slightly Like',
      '3': 'Somewhat Like',
      '4': 'Moderately Like',
      '5': 'Like',
      '6': 'Strongly Like'
    }
  },
  'influence': {
    name: 'Influence Scale',
    labels: {
      '-6': 'Strong Negative Influence',
      '-5': 'Negative Influence',
      '-4': 'Moderate Negative Influence',
      '-3': 'Some Negative Influence',
      '-2': 'Slight Negative Influence',
      '-1': 'Minimal Negative Influence',
      '0': 'No Influence',
      '1': 'Minimal Positive Influence',
      '2': 'Slight Positive Influence',
      '3': 'Some Positive Influence',
      '4': 'Moderate Positive Influence',
      '5': 'Positive Influence',
      '6': 'Strong Positive Influence'
    }
  }
};

export const AppleUIGridBuilder: React.FC<AppleUIGridBuilderProps> = ({
  studyId: _studyId,
  onGridChange,
  totalStatements = 30,
  minStatements: _minStatements = 20,
  maxStatements: _maxStatements = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridRange, setGridRange] = useState({ min: -3, max: 3 });
  const [columns, setColumns] = useState<GridColumn[]>([]);
  const [customLabels, setCustomLabels] = useState<Record<number, string>>({});
  const [instructions, setInstructions] = useState('Please sort the items according to your level of agreement.');
  const [distribution, setDistribution] = useState<'bell' | 'flat'>('bell');
  const [selectedTheme, setSelectedTheme] = useState('agreement');
  const [showCustomLabels, setShowCustomLabels] = useState(false);
  const [columnWidth, setColumnWidth] = useState(80);

  // Calculate column width to fit all columns on screen
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 64; // Padding
      const columnCount = gridRange.max - gridRange.min + 1;
      const gap = 12; // Gap between columns
      const totalGaps = (columnCount - 1) * gap;
      const availableWidth = containerWidth - totalGaps;
      const calculatedWidth = Math.min(100, Math.max(60, availableWidth / columnCount));
      setColumnWidth(calculatedWidth);
    }
  }, [gridRange]);

  // Generate columns with auto-balancing
  const generateColumns = (min: number, max: number, dist: 'bell' | 'flat'): GridColumn[] => {
    const columnCount = max - min + 1;
    const newColumns: GridColumn[] = [];
    
    let cellDistribution: number[] = [];
    
    if (dist === 'bell') {
      // Bell curve distribution with exact total and guaranteed symmetry
      const center = (columnCount - 1) / 2;
      const sigma = columnCount / 3;
      
      // Calculate raw bell values
      const bellValues: number[] = [];
      for (let i = 0; i < columnCount; i++) {
        const distance = Math.abs(i - center);
        const normalizedDistance = distance / sigma;
        const bellValue = Math.exp(-0.5 * normalizedDistance * normalizedDistance);
        bellValues.push(bellValue);
      }
      
      // Normalize and distribute cells with symmetry
      const sumBellValues = bellValues.reduce((a, b) => a + b, 0);
      cellDistribution = new Array(columnCount).fill(0);
      let distributedCells = 0;
      
      // Distribute cells symmetrically from edges to center
      const halfColumns = Math.floor(columnCount / 2);
      const hasMiddle = columnCount % 2 === 1;
      
      for (let i = 0; i < halfColumns; i++) {
        const proportion = bellValues[i] / sumBellValues;
        const cells = Math.max(1, Math.round(totalStatements * proportion));
        
        // Set symmetric cells
        cellDistribution[i] = cells;
        cellDistribution[columnCount - 1 - i] = cells;
        distributedCells += cells * 2;
      }
      
      // Handle middle column if odd number of columns
      if (hasMiddle) {
        const middleIndex = halfColumns;
        cellDistribution[middleIndex] = totalStatements - distributedCells;
      } else {
        // Adjust middle two columns if needed for even distribution
        const adjustment = totalStatements - distributedCells;
        if (adjustment !== 0) {
          const perColumn = Math.floor(adjustment / 2);
          const remainder = adjustment % 2;
          cellDistribution[halfColumns - 1] += perColumn + remainder;
          cellDistribution[halfColumns] += perColumn;
        }
      }
    } else {
      // Flat distribution - distribute evenly with remainder handling
      const baseCount = Math.floor(totalStatements / columnCount);
      const remainder = totalStatements % columnCount;
      
      // Distribute remainder cells to middle columns for balance
      const middleStart = Math.floor((columnCount - remainder) / 2);
      
      for (let i = 0; i < columnCount; i++) {
        const cells = (i >= middleStart && i < middleStart + remainder) 
          ? baseCount + 1 
          : baseCount;
        cellDistribution.push(cells);
      }
    }
    
    // Create columns with proper cell distribution
    for (let i = min; i <= max; i++) {
      const index = i - min;
      const cells = cellDistribution[index];
      
      const theme = labelThemes[selectedTheme === 'custom' ? 'agreement' : selectedTheme as keyof typeof labelThemes];
      const label = showCustomLabels && customLabels[i] 
        ? customLabels[i]
        : (theme.labels as any)[i] || `Position ${i}`;
      
      newColumns.push({
        value: i,
        label: label.substring(0, 25), // Character limit
        cells
      });
    }
    
    return newColumns;
  };

  // Initialize and update grid
  useEffect(() => {
    const newColumns = generateColumns(gridRange.min, gridRange.max, distribution);
    setColumns(newColumns);
  }, [gridRange, distribution, totalStatements, selectedTheme, showCustomLabels, customLabels]);

  // Notify parent of changes
  useEffect(() => {
    if (onGridChange && columns.length > 0) {
      const config: GridConfiguration = {
        rangeMin: gridRange.min,
        rangeMax: gridRange.max,
        columns,
        totalCells: columns.reduce((sum, col) => sum + col.cells, 0),
        distribution: 'custom',
        instructions,
        labelTheme: selectedTheme
      };
      onGridChange(config);
    }
  }, [columns, gridRange, instructions, selectedTheme, onGridChange]);

  const handleRangeChange = (newMax: number) => {
    setGridRange({ min: -newMax, max: newMax });
  };

  const handleThemeChange = (theme: string) => {
    setSelectedTheme(theme);
    setShowCustomLabels(theme === 'custom');
  };

  const handleCustomLabelChange = (value: number, label: string) => {
    setCustomLabels(prev => ({
      ...prev,
      [value]: label.substring(0, 25) // Character limit
    }));
  };

  const adjustCells = (columnIndex: number, delta: number) => {
    const newColumns = [...columns];
    const column = newColumns[columnIndex];
    const newCellCount = Math.max(0, column.cells + delta);
    
    // Calculate current total
    const currentTotal = newColumns.reduce((sum, col) => sum + col.cells, 0);
    const newTotal = currentTotal - column.cells + newCellCount;
    
    // Check if new total exceeds statement count
    if (newTotal > totalStatements) {
      return;
    }
    
    column.cells = newCellCount;
    setColumns(newColumns);
  };

  const totalCells = columns.reduce((sum, col) => sum + col.cells, 0);
  const isValid = totalCells === totalStatements;

  // Calculate dynamic cell size based on column count
  const cellHeight = useMemo(() => {
    const maxCells = Math.max(...columns.map((c: any) => c.cells));
    if (maxCells > 8) return 32;
    if (maxCells > 6) return 40;
    return 48;
  }, [columns]);

  return (
    <div className="apple-ui-grid-builder bg-white rounded-2xl shadow-sm border border-gray-200/60">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200/60">
        <h3 className="text-lg font-semibold text-gray-900">Grid Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">Design your Q-sort grid layout</p>
      </div>

      {/* Always Visible Settings */}
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Range Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grid Range
            </label>
            <div className="relative">
              <select
                value={gridRange.max}
                onChange={(e: any) => handleRangeChange(parseInt(e.target.value))}
                className="appearance-none w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

          {/* Label Theme Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column Labels
            </label>
            <div className="relative">
              <select
                value={selectedTheme}
                onChange={(e: any) => handleThemeChange(e.target.value)}
                className="appearance-none w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="custom">Custom Labels</option>
                {Object.entries(labelThemes).filter(([key]) => key !== 'custom').map(([key, theme]) => (
                  <option key={key} value={key}>{theme.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Distribution Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distribution Pattern
            </label>
            <div className="relative">
              <select
                value={distribution}
                onChange={(e: any) => setDistribution(e.target.value as any)}
                className="appearance-none w-full px-4 py-2.5 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="bell">Bell Curve (Recommended)</option>
                <option value="flat">Flat Distribution</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Instructions Input */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions for Participants
          </label>
          <textarea
            value={instructions}
            onChange={(e: any) => setInstructions(e.target.value.substring(0, 500))}
            placeholder="Please sort the statements according to your level of agreement..."
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            rows={2}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {instructions.length}/500 characters
          </p>
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
                  {/* Column Header */}
                  <div className="text-center mb-2 w-full">
                    <div className="font-semibold text-base text-gray-900 mb-1">
                      {column.value > 0 ? '+' : ''}{column.value}
                    </div>
                    {showCustomLabels && (
                      <input
                        type="text"
                        value={customLabels[column.value] || ''}
                        onChange={(e: any) => handleCustomLabelChange(column.value, e.target.value)}
                        className="w-full text-xs text-center px-1 py-1 border-b-2 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:outline-none bg-transparent transition-colors"
                        placeholder="Enter label"
                        maxLength={25}
                      />
                    )}
                  </div>

                  {/* Cell Controls - Plus/Minus Buttons */}
                  <div className="flex items-center justify-center gap-1 mb-2 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => adjustCells(index, -1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={column.cells <= 0}
                      title="Remove cell"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700 w-8 text-center">
                      {column.cells}
                    </span>
                    <button
                      onClick={() => adjustCells(index, 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={totalCells >= totalStatements}
                      title="Add cell"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Cells Visualization */}
                  <div className="flex flex-col-reverse gap-1.5 mb-3">
                    {Array.from({ length: column.cells }).map((_, cellIndex) => (
                      <motion.div
                        key={cellIndex}
                        className="bg-white border-2 border-dashed border-gray-300 rounded-lg shadow-sm hover:border-blue-400 transition-colors"
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

                  {/* Column Label at Bottom - Fixed Height */}
                  <div className="px-2 py-1.5 bg-gray-50 rounded-lg shadow-sm border border-gray-200 h-12 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 break-words text-center line-clamp-2">
                      {column.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-6 py-4 border-t border-gray-200/60 bg-gray-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isValid ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full" />
                <span className="text-sm font-medium">Grid configured correctly</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Total cells: {totalCells} (Expected: {totalStatements})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>Auto-balanced distribution</span>
          </div>
        </div>
      </div>
    </div>
  );
};