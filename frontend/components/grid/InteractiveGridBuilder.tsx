'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ChevronDown } from 'lucide-react';

interface GridColumn {
  value: number;
  label: string;
  customLabel?: string;
  cells: number;
}

interface GridConfiguration {
  rangeMin: number;
  rangeMax: number;
  columns: GridColumn[];
  symmetry: boolean;
  totalCells: number;
  distribution: 'bell' | 'flat';
  instructions?: string;
}

interface InteractiveGridBuilderProps {
  studyId?: string;
  initialGrid?: GridConfiguration;
  onGridChange?: (grid: GridConfiguration) => void;
  totalStatements?: number;
}

const defaultLabels: Record<number, string> = {
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

export const InteractiveGridBuilder: React.FC<InteractiveGridBuilderProps> = ({
  studyId,
  initialGrid,
  onGridChange,
  totalStatements = 25
}) => {
  const [gridRange, setGridRange] = useState({ min: -3, max: 3 });
  const [columns, setColumns] = useState<GridColumn[]>([]);
  const [instructions, setInstructions] = useState('');
  const [symmetry, setSymmetry] = useState(true);
  const [distribution, setDistribution] = useState<'bell' | 'flat'>('bell');
  const [isDirty, setIsDirty] = useState(false);

  // Initialize grid
  useEffect(() => {
    if (initialGrid) {
      setGridRange({ min: initialGrid.rangeMin, max: initialGrid.rangeMax });
      setColumns(initialGrid.columns);
      setInstructions(initialGrid.instructions || '');
      setSymmetry(initialGrid.symmetry);
      setDistribution(initialGrid.distribution);
    } else {
      initializeDefaultGrid();
    }
  }, [initialGrid]);

  const initializeDefaultGrid = () => {
    const defaultColumns = generateColumns(-3, 3, 'bell', totalStatements);
    setColumns(defaultColumns);
  };

  const generateColumns = (min: number, max: number, dist: 'bell' | 'flat', total: number): GridColumn[] => {
    const columnCount = max - min + 1;
    const newColumns: GridColumn[] = [];
    
    if (dist === 'bell') {
      // Calculate bell curve distribution with exact total and guaranteed symmetry
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
      const cellCounts: number[] = new Array(columnCount).fill(0);
      let distributedCells = 0;
      
      // Distribute cells symmetrically from edges to center
      const halfColumns = Math.floor(columnCount / 2);
      const hasMiddle = columnCount % 2 === 1;
      
      for (let i = 0; i < halfColumns; i++) {
        const proportion = bellValues[i] / sumBellValues;
        const cells = Math.max(1, Math.round(total * proportion));
        
        // Set symmetric cells
        cellCounts[i] = cells;
        cellCounts[columnCount - 1 - i] = cells;
        distributedCells += cells * 2;
      }
      
      // Handle middle column if odd number of columns
      if (hasMiddle) {
        const middleIndex = halfColumns;
        cellCounts[middleIndex] = total - distributedCells;
      } else {
        // Adjust middle two columns if needed for even distribution
        const adjustment = total - distributedCells;
        if (adjustment !== 0) {
          const perColumn = Math.floor(adjustment / 2);
          const remainder = adjustment % 2;
          cellCounts[halfColumns - 1] += perColumn + remainder;
          cellCounts[halfColumns] += perColumn;
        }
      }
      
      // Create columns
      for (let i = min; i <= max; i++) {
        const index = i - min;
        newColumns.push({
          value: i,
          label: defaultLabels[i] || `Position ${i}`,
          cells: cellCounts[index]
        });
      }
    } else {
      // Flat distribution
      const baseCount = Math.floor(total / columnCount);
      const remainder = total % columnCount;
      
      // Distribute remainder cells to middle columns
      const middleStart = Math.floor((columnCount - remainder) / 2);
      
      for (let i = min; i <= max; i++) {
        const index = i - min;
        const cells = (index >= middleStart && index < middleStart + remainder) 
          ? baseCount + 1 
          : baseCount;
        
        newColumns.push({
          value: i,
          label: defaultLabels[i] || `Position ${i}`,
          cells: cells
        });
      }
    }
    
    return newColumns;
  };

  const handleRangeChange = (newMax: number) => {
    const newColumns = generateColumns(-newMax, newMax, distribution, totalStatements);
    setColumns(newColumns);
    setGridRange({ min: -newMax, max: newMax });
    setIsDirty(true);
    notifyChange(newColumns);
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
    
    // Maintain symmetry if enabled
    if (symmetry) {
      const mirrorIndex = newColumns.length - 1 - columnIndex;
      if (mirrorIndex !== columnIndex && mirrorIndex >= 0) {
        newColumns[mirrorIndex].cells = newCellCount;
      }
    }
    
    setColumns(newColumns);
    setIsDirty(true);
    notifyChange(newColumns);
  };

  const updateColumnLabel = (columnIndex: number, newLabel: string) => {
    const newColumns = [...columns];
    newColumns[columnIndex].customLabel = newLabel;
    setColumns(newColumns);
    setIsDirty(true);
    notifyChange(newColumns);
  };

  const applyDistribution = (dist: 'bell' | 'flat') => {
    const newColumns = generateColumns(gridRange.min, gridRange.max, dist, totalStatements);
    setColumns(newColumns);
    setDistribution(dist);
    setIsDirty(true);
    notifyChange(newColumns);
  };

  const notifyChange = (cols: GridColumn[] = columns) => {
    if (onGridChange) {
      const config: GridConfiguration = {
        rangeMin: gridRange.min,
        rangeMax: gridRange.max,
        columns: cols,
        symmetry,
        totalCells: cols.reduce((sum, col) => sum + col.cells, 0),
        distribution,
        instructions
      };
      onGridChange(config);
    }
  };

  const saveGrid = async () => {
    if (!studyId) return;
    
    try {
      const response = await fetch(`/api/studies/${studyId}/grid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rangeMin: gridRange.min,
          rangeMax: gridRange.max,
          columns,
          symmetry,
          totalCells: columns.reduce((sum, col) => sum + col.cells, 0),
          distribution,
          instructions
        })
      });
      
      if (response.ok) {
        setIsDirty(false);
      }
    } catch (error: any) {
      console.error('Failed to save grid:', error);
    }
  };

  const totalCells = columns.reduce((sum, col) => sum + col.cells, 0);
  const isValid = totalCells === totalStatements;

  return (
    <div className="interactive-grid-builder p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Grid Instructions */}
      <div className="grid-instructions-section mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grid Instructions for Participants
        </label>
        <textarea
          value={instructions}
          onChange={(e: any) => {
            setInstructions(e.target.value.slice(0, 500));
            setIsDirty(true);
          }}
          placeholder="Please sort the statements according to your level of agreement..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={500}
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">
          {instructions.length}/500 characters
        </p>
      </div>
      
      {/* Range Selector */}
      <div className="range-selector mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          Grid Range:
        </label>
        <div className="relative">
          <select
            value={gridRange.max}
            onChange={(e: any) => handleRangeChange(parseInt(e.target.value))}
            className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {[1, 2, 3, 4, 5, 6].map((val: any) => (
              <option key={val} value={val}>
                -{val} to +{val}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>
      
      {/* Interactive Grid Visualization */}
      <div className="grid-visualization relative p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
        <div className="grid-columns-container flex gap-2 justify-center items-end">
          <AnimatePresence mode="popLayout">
            {columns.map((column, index) => (
              <motion.div
                key={column.value}
                className="grid-column flex flex-col items-center min-w-[80px]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                layout
              >
                {/* Column Header with Value */}
                <div className="column-header text-center mb-2">
                  <div className="column-value font-bold text-lg text-gray-800">
                    {column.value > 0 ? '+' : ''}{column.value}
                  </div>
                  <input
                    type="text"
                    value={column.customLabel || column.label}
                    onChange={(e: any) => updateColumnLabel(index, e.target.value)}
                    className="column-label-input w-full text-xs text-center border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 rounded bg-transparent"
                    placeholder="Label"
                  />
                </div>
                
                {/* Cell Controls - Positioned at top for better visibility */}
                <div className="cell-controls flex items-center gap-1 mb-2 bg-white px-2 py-1 rounded-lg shadow-sm">
                  <button
                    onClick={() => adjustCells(index, -1)}
                    className="adjust-btn w-7 h-7 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={column.cells <= 0}
                    title="Remove cell"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="cell-count text-sm font-semibold text-gray-700 w-8 text-center">
                    {column.cells}
                  </span>
                  <button
                    onClick={() => adjustCells(index, 1)}
                    className="adjust-btn w-7 h-7 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={totalCells >= totalStatements}
                    title="Add cell"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Cell Visualization */}
                <div className="cells-visualization flex flex-col-reverse gap-1 mb-2">
                  {Array.from({ length: column.cells }).map((_, cellIndex) => (
                    <motion.div
                      key={cellIndex}
                      className="cell-box w-16 h-10 bg-white border-2 border-dashed border-gray-300 rounded hover:border-blue-400 transition-colors"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: cellIndex * 0.02 }}
                    />
                  ))}
                </div>
                
                {/* Column Label at Bottom */}
                <div className="column-footer mt-2 text-center bg-gray-50 px-2 py-1 rounded">
                  <div className="text-xs text-gray-700 font-medium max-w-[80px] break-words">
                    {column.customLabel || column.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Distribution Presets */}
      <div className="distribution-presets mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Distribution Patterns
        </label>
        <div className="preset-buttons flex gap-2">
          <button
            onClick={() => applyDistribution('bell')}
            className={`preset-btn px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              distribution === 'bell' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Bell Curve
          </button>
          <button
            onClick={() => applyDistribution('flat')}
            className={`preset-btn px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              distribution === 'flat' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Flat Distribution
          </button>
        </div>
      </div>
      
      {/* Symmetry Toggle */}
      <div className="symmetry-control mt-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={symmetry}
            onChange={(e: any) => {
              setSymmetry(e.target.checked);
              setIsDirty(true);
            }}
            className="mr-2 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Maintain grid symmetry (mirror changes)</span>
        </label>
      </div>
      
      {/* Statement Count Info */}
      <div className={`statement-info mt-6 p-4 rounded-lg ${
        isValid ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
      }`}>
        <p className={`text-sm ${isValid ? 'text-green-700' : 'text-orange-700'}`}>
          Total cells: {totalCells} / Total statements: {totalStatements}
        </p>
        {!isValid && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ Cell count must match statement count
          </p>
        )}
      </div>
      
      {/* Save Button */}
      {studyId && isDirty && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveGrid}
            disabled={!isValid}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Save Grid Configuration
          </button>
        </div>
      )}
    </div>
  );
};