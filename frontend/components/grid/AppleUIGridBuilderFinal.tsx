'use client';

import RichTextEditor from '@/components/editors/RichTextEditorV2';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronDown, Grid3X3, Info, Minus, Plus, RotateCcw } from 'lucide-react';
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

interface AppleUIGridBuilderFinalProps {
  studyId?: string;
  onGridChange?: (config: GridConfiguration) => void;
  initialCells?: number;
}

// Maximum cells allowed in the grid
const MAX_CELLS = 60;
const DEFAULT_INITIAL_CELLS = 30;

// Pre-defined label themes for Q-sort
const labelThemes = {
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
  'custom': {
    name: 'Custom Labels',
    labels: {}
  }
};

export const AppleUIGridBuilderFinal: React.FC<AppleUIGridBuilderFinalProps> = ({
  studyId: _studyId,
  onGridChange,
  initialCells = DEFAULT_INITIAL_CELLS
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridRange, setGridRange] = useState({ min: -3, max: 3 });
  const [columns, setColumns] = useState<GridColumn[]>([]);
  const [instructions, setInstructions] = useState('<p>Please sort the items according to your level of agreement.</p>');
  const [distribution, setDistribution] = useState<'bell' | 'flat' | 'custom'>('bell');
  const [_symmetry, _setSymmetry] = useState(true); // Always enforce symmetry
  const [columnWidth, setColumnWidth] = useState(80);
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [targetCells, setTargetCells] = useState(initialCells);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof labelThemes>('agreement');
  const [customLabels, setCustomLabels] = useState<Record<number, string>>({});
  const [showModeChangeNotification, setShowModeChangeNotification] = useState(false);
  const [_previousDistribution, setPreviousDistribution] = useState<'bell' | 'flat' | 'custom'>('bell');

  // Calculate column width dynamically - smaller for larger grids
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 48; // Less padding
      const columnCount = gridRange.max - gridRange.min + 1;
      const gap = columnCount > 9 ? 8 : columnCount > 7 ? 10 : 12; // Smaller gaps for larger grids
      const totalGaps = (columnCount - 1) * gap;
      const availableWidth = containerWidth - totalGaps;
      
      // More aggressive scaling for larger grids
      let calculatedWidth;
      if (columnCount >= 11) {
        calculatedWidth = Math.min(65, availableWidth / columnCount);
      } else if (columnCount >= 9) {
        calculatedWidth = Math.min(75, availableWidth / columnCount);
      } else {
        calculatedWidth = Math.min(100, Math.max(60, availableWidth / columnCount));
      }
      
      setColumnWidth(calculatedWidth);
    }
  }, [gridRange]);

  // Generate columns with proper distribution
  const generateColumns = useCallback((min: number, max: number, dist: 'bell' | 'flat', targetTotal: number): GridColumn[] => {
    const columnCount = max - min + 1;
    const newColumns: GridColumn[] = [];
    let cellDistribution: number[] = [];
    
    // Ensure we don't exceed max cells
    const actualTarget = Math.min(targetTotal, MAX_CELLS);
    
    if (dist === 'flat') {
      // TRUE FLAT DISTRIBUTION - All columns get equal cells
      const cellsPerColumn = Math.floor(actualTarget / columnCount);
      const remainder = actualTarget % columnCount;
      
      // Start with base cells for all columns
      cellDistribution = new Array(columnCount).fill(cellsPerColumn);
      
      // Distribute remainder cells to middle columns
      if (remainder > 0) {
        const middleStart = Math.floor((columnCount - remainder) / 2);
        for (let i = 0; i < remainder; i++) {
          const idx = middleStart + i;
          if (cellDistribution[idx] !== undefined) {
            cellDistribution[idx]++;
          }
        }
      }
    } else {
      // BELL CURVE DISTRIBUTION
      const center = (columnCount - 1) / 2;
      const sigma = columnCount / 3.5;
      
      // Calculate raw bell values
      const bellValues: number[] = [];
      for (let i = 0; i < columnCount; i++) {
        const distance = Math.abs(i - center);
        const normalizedDistance = distance / sigma;
        const bellValue = Math.exp(-0.5 * normalizedDistance * normalizedDistance);
        bellValues.push(bellValue);
      }
      
      // Ensure symmetry
      const halfColumns = Math.floor(columnCount / 2);
      for (let i = 0; i < halfColumns; i++) {
        const leftVal = bellValues[i] || 0;
        const rightVal = bellValues[columnCount - 1 - i] || 0;
        const avgValue = (leftVal + rightVal) / 2;
        bellValues[i] = avgValue;
        bellValues[columnCount - 1 - i] = avgValue;
      }
      
      // Normalize and distribute cells
      const sumBellValues = bellValues.reduce((a, b) => a + b, 0);
      cellDistribution = new Array(columnCount).fill(0);
      let distributedCells = 0;
      
      // Distribute cells proportionally
      for (let i = 0; i < columnCount; i++) {
        const bellValue = bellValues[i] || 0;
        const proportion = bellValue / sumBellValues;
        const cells = Math.max(1, Math.round(actualTarget * proportion));
        cellDistribution[i] = cells;
        distributedCells += cells;
      }
      
      // Adjust for exact total
      const adjustment = actualTarget - distributedCells;
      if (adjustment !== 0) {
        const middleIndex = Math.floor(columnCount / 2);
        const currentValue = cellDistribution[middleIndex] || 0;
        cellDistribution[middleIndex] = Math.max(0, currentValue + adjustment);
      }
    }
    
    // Create columns with theme labels
    const theme = labelThemes[selectedTheme];
    for (let i = min; i <= max; i++) {
      const index = i - min;
      // Use custom label if available, otherwise use theme label, otherwise default
      let label = '';
      if (selectedTheme === 'custom' && customLabels[i]) {
        label = customLabels[i] || '';
      } else if ((theme.labels as any)[i]) {
        label = (theme.labels as any)[i];
      } else {
        // Default label if not in theme
        label = i === 0 ? 'Neutral' : `Position ${i}`;
      }
      
      newColumns.push({
        value: i,
        label: label,
        cells: cellDistribution[index] || 0
      });
    }
    
    return newColumns;
  }, [selectedTheme, customLabels]);

  // Validate if current distribution follows a bell curve pattern
  const validateBellCurve = useCallback((cols: GridColumn[]): boolean => {
    if (cols.length === 0) return true;
    
    const columnCount = cols.length;
    const centerIndex = Math.floor(columnCount / 2);
    
    // Check if center columns have more cells than edges (basic bell curve property)
    // Allow some tolerance for manual adjustments
    const tolerance = 0.2; // 20% tolerance
    
    // For bell curve, center should be higher than edges
    const firstCol = cols[0];
    const lastCol = cols[columnCount - 1];
    const centerCol = cols[centerIndex];
    
    if (!firstCol || !lastCol || !centerCol) return false;
    
    const edgeAvg = (firstCol.cells + lastCol.cells) / 2;
    const centerCells = centerCol.cells;
    
    // Check if distribution is roughly bell-shaped
    if (centerCells <= edgeAvg) {
      return false;
    }
    
    // Check for general downward trend from center to edges
    let isValidBell = true;
    
    // Check left side
    for (let i = 0; i < centerIndex - 1; i++) {
      const current = cols[i];
      const next = cols[i + 1];
      if (!current || !next) continue;
      if (current.cells > next.cells * (1 + tolerance)) {
        // Edge column is significantly higher than inner column
        isValidBell = false;
        break;
      }
    }
    
    // Check right side
    for (let i = columnCount - 1; i > centerIndex + 1; i--) {
      const current = cols[i];
      const prev = cols[i - 1];
      if (!current || !prev) continue;
      if (current.cells > prev.cells * (1 + tolerance)) {
        // Edge column is significantly higher than inner column
        isValidBell = false;
        break;
      }
    }
    
    // Check symmetry for bell curve
    if (isValidBell && _symmetry) {
      for (let i = 0; i < Math.floor(columnCount / 2); i++) {
        const leftCol = cols[i];
        const rightCol = cols[columnCount - 1 - i];
        if (!leftCol || !rightCol) continue;
        
        const leftCells = leftCol.cells;
        const rightCells = rightCol.cells;
        const diff = Math.abs(leftCells - rightCells);
        const avg = (leftCells + rightCells) / 2;
        if (avg > 0 && diff / avg > tolerance) {
          isValidBell = false;
          break;
        }
      }
    }
    
    return isValidBell;
  }, [_symmetry]);

  // Initialize and update grid
  useEffect(() => {
    if (!manuallyEdited) {
      const newColumns = generateColumns(
        gridRange.min, 
        gridRange.max, 
        distribution === 'custom' ? 'bell' : distribution, 
        targetCells
      );
      setColumns(newColumns);
    }
  }, [gridRange, distribution, targetCells, generateColumns, manuallyEdited, selectedTheme]);

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
        labelTheme: selectedTheme,
        symmetry: _symmetry
      };
      onGridChange(config);
    }
  }, [columns, gridRange, instructions, distribution, manuallyEdited, _symmetry, onGridChange]);

  const handleRangeChange = (newMax: number) => {
    setGridRange({ min: -newMax, max: newMax });
    setManuallyEdited(false);
  };

  const handleDistributionChange = (newDist: 'bell' | 'flat') => {
    setDistribution(newDist);
    setManuallyEdited(false);
    const newColumns = generateColumns(gridRange.min, gridRange.max, newDist, targetCells);
    setColumns(newColumns);
  };

  const adjustCells = (columnIndex: number, delta: number) => {
    const newColumns = [...columns];
    const column = newColumns[columnIndex];
    if (!column) return;
    
    const currentTotal = newColumns.reduce((sum, col) => sum + col.cells, 0);
    
    // Can't exceed MAX_CELLS
    if (delta > 0 && currentTotal >= MAX_CELLS) {
      return;
    }
    
    // Can't go below 0
    if (column.cells + delta < 0) {
      return;
    }
    
    // Apply change
    column.cells += delta;
    
    // ALWAYS maintain symmetry - this is now mandatory
    const mirrorIndex = newColumns.length - 1 - columnIndex;
    if (mirrorIndex !== columnIndex && mirrorIndex >= 0 && mirrorIndex < newColumns.length) {
      const mirrorColumn = newColumns[mirrorIndex];
      if (!mirrorColumn) return;
      
      // Check if mirror can also be adjusted
      const newTotal = newColumns.reduce((sum, col) => sum + col.cells, 0) + delta;
      if (mirrorColumn.cells + delta >= 0 && newTotal <= MAX_CELLS) {
        mirrorColumn.cells += delta;
      } else {
        // Revert the original change if mirror can't be adjusted
        column.cells -= delta;
        return;
      }
    }
    
    setColumns(newColumns);
    setManuallyEdited(true);
    
    // Check if the distribution still follows bell curve pattern
    if (distribution === 'bell' && !validateBellCurve(newColumns)) {
      setPreviousDistribution('bell');
      setDistribution('custom');
      setShowModeChangeNotification(true);
      setTimeout(() => setShowModeChangeNotification(false), 3000);
    }
  };

  const resetDistribution = () => {
    setManuallyEdited(false);
    setCustomLabels({});
    const newColumns = generateColumns(
      gridRange.min, 
      gridRange.max, 
      distribution === 'custom' ? 'bell' : distribution, 
      targetCells
    );
    setColumns(newColumns);
  };

  const totalCells = columns.reduce((sum, col) => sum + col.cells, 0);
  const cellsRemaining = MAX_CELLS - totalCells;

  // Calculate dynamic cell size
  const cellHeight = useMemo(() => {
    const maxCells = Math.max(...columns.map((c: any) => c.cells), 1);
    const columnCount = columns.length;
    
    // Smaller cells for larger grids
    if (columnCount >= 11) return 24;
    if (columnCount >= 9) return 28;
    if (maxCells > 8) return 32;
    if (maxCells > 6) return 36;
    return 40;
  }, [columns]);

  // Dynamic button size based on column count
  const buttonSize = useMemo(() => {
    const columnCount = columns.length;
    if (columnCount >= 11) return 'w-5 h-5';
    if (columnCount >= 9) return 'w-6 h-6';
    return 'w-7 h-7';
  }, [columns]);

  return (
    <div className="apple-ui-grid-builder bg-white rounded-2xl shadow-sm border border-gray-200/60">
      {/* Header with Cell Counter */}
      <div className="px-6 py-5 border-b border-gray-200/60">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Grid Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">Design your Q-sort grid layout</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <Grid3X3 className="w-4 h-4 text-gray-400" />
              <span className="text-2xl font-bold text-gray-900">{totalCells}</span>
              <span className="text-sm text-gray-500">/ {MAX_CELLS} cells</span>
            </div>
            <div className="text-xs text-gray-500">
              {cellsRemaining > 0 
                ? `${cellsRemaining} cells available` 
                : 'Maximum reached'}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Grid Design Tips:</p>
            <ul className="mt-1 space-y-0.5 text-xs">
              <li>• You can create up to {MAX_CELLS} cells total in your grid</li>
              <li>• The number of statements/stimuli will be added in the next step</li>
              <li>• Use the +/- buttons to adjust cells per column</li>
              <li>• Enable symmetry for balanced distributions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-200/60">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Range Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grid Range
            </label>
            <div className="relative">
              <select
                value={gridRange.max}
                onChange={(e: any) => handleRangeChange(parseInt(e.target.value))}
                className="appearance-none w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2, 3, 4, 5, 6].map((val: any) => (
                  <option key={val} value={val}>
                    −{val} to +{val}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Label Theme Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label Theme
            </label>
            <div className="relative">
              <select
                value={selectedTheme}
                onChange={(e: any) => {
                  setSelectedTheme(e.target.value as keyof typeof labelThemes);
                  setManuallyEdited(false);
                }}
                className="appearance-none w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Label theme selector"
              >
                {Object.entries(labelThemes).map(([key, theme]) => (
                  <option key={key} value={key}>
                    {theme.name}
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
                value={manuallyEdited ? 'custom' : distribution}
                onChange={(e: any) => {
                  const value = e.target.value;
                  if (value === 'custom') return;
                  handleDistributionChange(value as 'bell' | 'flat');
                }}
                className="appearance-none w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Distribution pattern selector"
              >
                <option value="bell">Bell Curve</option>
                <option value="flat">Flat</option>
                {(manuallyEdited || distribution === 'custom') && (
                  <option value="custom">Custom</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Target Cells */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Cells
            </label>
            <input
              type="number"
              value={targetCells}
              onChange={(e: any) => {
                const val = Math.min(MAX_CELLS, Math.max(1, parseInt(e.target.value) || 1));
                setTargetCells(val);
                setManuallyEdited(false);
              }}
              min={1}
              max={MAX_CELLS}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Symmetry Status - Always On */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symmetry
            </label>
            <div className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Always On
            </div>
          </div>

          {/* Reset Button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              &nbsp;
            </label>
            <button
              onClick={resetDistribution}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              title="Reset to original distribution"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Mode Change Notification */}
      <AnimatePresence>
        {showModeChangeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Distribution Changed to Custom</p>
              <p className="text-xs mt-0.5">Your manual adjustments no longer follow a bell curve pattern.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Visualization */}
      <div ref={containerRef} className="p-6 overflow-x-auto" role="region" aria-label="Grid configuration">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4">
          <div 
            className={`flex ${columns.length > 9 ? 'gap-2' : 'gap-3'} justify-center items-start transition-all duration-300 min-w-fit`}
            style={{ transform: `scale(${columnWidth < 60 ? 0.95 : 1})` }}
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
                  {/* Top Section */}
                  <div className="flex flex-col items-center flex-1">
                    {/* Column Value */}
                    <div className="text-center mb-2">
                      <div className={`font-bold ${columns.length > 9 ? 'text-sm' : 'text-lg'} text-gray-900`}>
                        {column.value > 0 ? '+' : ''}{column.value}
                      </div>
                    </div>

                    {/* Cell Controls - Vertical Layout for Better Spacing */}
                    <div className={`flex flex-col items-center ${columns.length > 9 ? 'gap-0.5' : 'gap-1'} mb-2 bg-white px-2 py-1.5 rounded-lg shadow-sm border border-gray-200`}>
                      <button
                        onClick={() => adjustCells(index, 1)}
                        className={`${buttonSize} flex items-center justify-center rounded-md bg-green-50 hover:bg-green-100 text-green-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1`}
                        disabled={totalCells >= MAX_CELLS}
                        aria-label={`Add cell to column ${column.value}`}
                        title="Add cell"
                      >
                        <Plus className={columns.length > 9 ? 'w-3 h-3' : 'w-4 h-4'} strokeWidth={2.5} />
                      </button>
                      <span className={`${columns.length > 9 ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} font-semibold text-gray-700 text-center bg-gray-50 rounded`}>
                        {column.cells}
                      </span>
                      <button
                        onClick={() => adjustCells(index, -1)}
                        className={`${buttonSize} flex items-center justify-center rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1`}
                        disabled={column.cells <= 0}
                        aria-label={`Remove cell from column ${column.value}`}
                        title="Remove cell"
                      >
                        <Minus className={columns.length > 9 ? 'w-3 h-3' : 'w-4 h-4'} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Cells Visualization */}
                    <div className="flex flex-col-reverse gap-1 mb-2">
                      {Array.from({ length: column.cells }).map((_, cellIndex) => (
                        <motion.div
                          key={cellIndex}
                          className="bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-all hover:shadow-sm"
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
                          role="presentation"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Column Label - Fixed Height */}
                  <div className={`px-1.5 py-1 bg-gray-50 rounded-lg border border-gray-200 w-full h-11 flex items-center justify-center`}>
                    {selectedTheme === 'custom' ? (
                      <input
                        type="text"
                        value={customLabels[column.value] || ''}
                        onChange={(e: any) => {
                          setCustomLabels(prev => ({
                            ...prev,
                            [column.value]: e.target.value
                          }));
                          setManuallyEdited(false);
                        }}
                        placeholder="Label"
                        className={`${columns.length > 9 ? 'text-[10px]' : 'text-xs'} font-medium text-gray-600 text-center w-full bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1`}
                        maxLength={20}
                      />
                    ) : (
                      <div className={`${columns.length > 9 ? 'text-[10px]' : 'text-xs'} font-medium text-gray-600 text-center break-words line-clamp-2`}>
                        {column.label}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              {totalCells <= MAX_CELLS ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-600">Grid is valid</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">
                    Exceeds maximum cells
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">
                {totalCells} cell{totalCells !== 1 ? 's' : ''} total
              </span>
              {(manuallyEdited || distribution === 'custom') && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-blue-600 font-medium flex items-center gap-1"
                >
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  Custom Distribution
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions with Rich Text Editor */}
      <div className="px-6 py-4 border-t border-gray-200/60">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions for Participants
        </label>
        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
          <RichTextEditor
            content={instructions}
            onChange={(content) => setInstructions(content)}
            placeholder="Enter instructions that participants will see when sorting items..."
            showToolbar={true}
            className="min-h-[100px] max-h-[200px] overflow-y-auto"
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Tip: Use formatting to make instructions clear and easy to follow
        </div>
      </div>
    </div>
  );
};