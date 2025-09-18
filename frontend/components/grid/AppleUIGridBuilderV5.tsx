'use client';

import RichTextEditor from '@/components/editors/RichTextEditorV2';
import { GridConfigurationService } from '@/lib/services/grid-configuration.service';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    AlertCircle,
    Brain,
    CheckCircle,
    ChevronDown,
    Grid3X3,
    Minus,
    Plus,
    RotateCcw,
    Sparkles
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AIGridDesignAssistant } from './AIGridDesignAssistant';

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
  distributionScore?: number;
}

interface AppleUIGridBuilderV5Props {
  studyId?: string;
  onGridChange?: (config: GridConfiguration) => void;
  initialCells?: number;
}

// Maximum cells allowed in the grid
const MAX_CELLS = 60;
// Use the optimal standard configuration from research
const DEFAULT_CONFIG = GridConfigurationService.getConfigById('optimal-36');
const DEFAULT_INITIAL_CELLS = DEFAULT_CONFIG?.totalItems || 36;

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
      '-4': 'Quite Poor',
      '-3': 'Somewhat Poor',
      '-2': 'Slightly Poor',
      '-1': 'Below Average',
      '0': 'Average',
      '1': 'Above Average',
      '2': 'Slightly Good',
      '3': 'Somewhat Good',
      '4': 'Quite Good',
      '5': 'Very Good',
      '6': 'Excellent'
    }
  },
  'priority': {
    name: 'Priority Scale',
    labels: {
      '-6': 'Lowest Priority',
      '-5': 'Very Low Priority',
      '-4': 'Quite Low Priority',
      '-3': 'Somewhat Low Priority',
      '-2': 'Slightly Low Priority',
      '-1': 'Below Medium Priority',
      '0': 'Medium Priority',
      '1': 'Above Medium Priority',
      '2': 'Slightly High Priority',
      '3': 'Somewhat High Priority',
      '4': 'Quite High Priority',
      '5': 'Very High Priority',
      '6': 'Highest Priority'
    }
  },
  'custom': {
    name: 'Custom Labels',
    labels: {}
  }
};

export const AppleUIGridBuilderV5: React.FC<AppleUIGridBuilderV5Props> = ({
  studyId: _studyId,
  onGridChange,
  initialCells = DEFAULT_INITIAL_CELLS
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Use optimal standard configuration (-4 to +4) as default
  const [gridRange, setGridRange] = useState({ 
    min: DEFAULT_CONFIG?.range.min || -4, 
    max: DEFAULT_CONFIG?.range.max || 4 
  });
  const [columns, setColumns] = useState<GridColumn[]>([]);
  const [instructions, setInstructions] = useState('<p>Please sort the items according to your level of agreement.</p>');
  const [distribution, setDistribution] = useState<'bell' | 'flat' | 'custom'>('bell');
  const [columnWidth, setColumnWidth] = useState(80);
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const [targetCells, setTargetCells] = useState(initialCells);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof labelThemes>('agreement');
  const [customLabels, setCustomLabels] = useState<Record<number, string>>({});
  const [distributionScore, setDistributionScore] = useState(100);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showDistributionWarning, setShowDistributionWarning] = useState(false);

  // Calculate column width dynamically
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth - 48;
      const columnCount = gridRange.max - gridRange.min + 1;
      const gap = columnCount > 9 ? 8 : columnCount > 7 ? 10 : 12;
      const totalGaps = (columnCount - 1) * gap;
      const availableWidth = containerWidth - totalGaps;
      
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

  // IMPROVED BELL CURVE ALGORITHM
  const generateImprovedBellCurve = useCallback((min: number, max: number, targetTotal: number): GridColumn[] => {
    const columnCount = max - min + 1;
    const center = (columnCount - 1) / 2;
    
    // Dynamic sigma for better distribution
    const sigma = columnCount <= 7 ? columnCount / 4 : columnCount / 3.2;
    
    // Generate raw bell curve values
    const bellValues: number[] = [];
    for (let i = 0; i < columnCount; i++) {
      const distance = i - center;
      const normalizedDistance = distance / sigma;
      const bellValue = Math.exp(-0.5 * normalizedDistance * normalizedDistance);
      bellValues.push(bellValue);
    }
    
    // Apply smoothing to prevent sharp drops
    const smoothedValues = [...bellValues];
    for (let i = 1; i < columnCount - 1; i++) {
      smoothedValues[i] = bellValues[i - 1] * 0.15 + bellValues[i] * 0.7 + bellValues[i + 1] * 0.15;
    }
    
    // Ensure perfect symmetry
    for (let i = 0; i < Math.floor(columnCount / 2); i++) {
      const avgValue = (smoothedValues[i] + smoothedValues[columnCount - 1 - i]) / 2;
      smoothedValues[i] = avgValue;
      smoothedValues[columnCount - 1 - i] = avgValue;
    }
    
    // Normalize and distribute cells
    const sumValues = smoothedValues.reduce((a, b) => a + b, 0);
    const proportions = smoothedValues.map((v: any) => v / sumValues);
    
    // Distribute cells with better rounding
    let cellDistribution = new Array(columnCount).fill(0);
    let remainingCells = targetTotal;
    
    // First pass: assign minimum cells based on proportions
    for (let i = 0; i < columnCount; i++) {
      cellDistribution[i] = Math.max(1, Math.floor(targetTotal * proportions[i]));
      remainingCells -= cellDistribution[i];
    }
    
    // Second pass: distribute remaining cells based on rounding errors
    if (remainingCells > 0) {
      const errors = proportions.map((p, i) => ({
        index: i,
        error: (targetTotal * p) - cellDistribution[i]
      }));
      errors.sort((a, b) => b.error - a.error);
      
      for (let i = 0; i < remainingCells && i < errors.length; i++) {
        cellDistribution[errors[i].index]++;
      }
    } else if (remainingCells < 0) {
      // Remove excess cells starting from edges
      const adjustmentIndices = [0, columnCount - 1];
      let adjustmentIndex = 0;
      
      while (remainingCells < 0 && adjustmentIndex < columnCount * 2) {
        const idx = adjustmentIndices[adjustmentIndex % adjustmentIndices.length];
        if (cellDistribution[idx] > 1) {
          cellDistribution[idx]--;
          remainingCells++;
        }
        adjustmentIndex++;
      }
    }
    
    // Validate bell shape
    const centerIndex = Math.floor(columnCount / 2);
    const centerCells = cellDistribution[centerIndex];
    const edgeAvg = (cellDistribution[0] + cellDistribution[columnCount - 1]) / 2;
    
    // Ensure center is higher than edges
    if (centerCells <= edgeAvg && columnCount > 3) {
      const adjustment = Math.ceil((edgeAvg - centerCells) * 1.5) + 2;
      cellDistribution[centerIndex] += adjustment;
      
      // Remove from edges to maintain total
      const removePerSide = Math.floor(adjustment / 2);
      cellDistribution[0] = Math.max(1, cellDistribution[0] - removePerSide);
      cellDistribution[columnCount - 1] = Math.max(1, cellDistribution[columnCount - 1] - removePerSide);
      
      // Rebalance total
      const currentTotal = cellDistribution.reduce((a, b) => a + b, 0);
      if (currentTotal !== targetTotal) {
        cellDistribution[centerIndex] += targetTotal - currentTotal;
      }
    }
    
    // Create columns with labels
    const theme = labelThemes[selectedTheme];
    const newColumns: GridColumn[] = [];
    
    for (let i = min; i <= max; i++) {
      const index = i - min;
      let label = '';
      
      if (selectedTheme === 'custom' && customLabels[i]) {
        label = customLabels[i];
      } else if ((theme.labels as any)[i]) {
        label = (theme.labels as any)[i];
      } else {
        label = i === 0 ? 'Neutral' : `Position ${i}`;
      }
      
      newColumns.push({
        value: i,
        label: label,
        cells: cellDistribution[index]
      });
    }
    
    return newColumns;
  }, [selectedTheme, customLabels]);

  // Generate flat distribution
  const generateFlatDistribution = useCallback((min: number, max: number, targetTotal: number): GridColumn[] => {
    const columnCount = max - min + 1;
    const cellsPerColumn = Math.floor(targetTotal / columnCount);
    const remainder = targetTotal % columnCount;
    
    const cellDistribution = new Array(columnCount).fill(cellsPerColumn);
    
    // Distribute remainder to middle columns
    if (remainder > 0) {
      const middleStart = Math.floor((columnCount - remainder) / 2);
      for (let i = 0; i < remainder; i++) {
        cellDistribution[middleStart + i]++;
      }
    }
    
    // Create columns with labels
    const theme = labelThemes[selectedTheme];
    const newColumns: GridColumn[] = [];
    
    for (let i = min; i <= max; i++) {
      const index = i - min;
      let label = '';
      
      if (selectedTheme === 'custom' && customLabels[i]) {
        label = customLabels[i];
      } else if ((theme.labels as any)[i]) {
        label = (theme.labels as any)[i];
      } else {
        label = i === 0 ? 'Neutral' : `Position ${i}`;
      }
      
      newColumns.push({
        value: i,
        label: label,
        cells: cellDistribution[index]
      });
    }
    
    return newColumns;
  }, [selectedTheme, customLabels]);

  // Analyze distribution quality
  const analyzeDistribution = useCallback((cols: GridColumn[]): number => {
    if (cols.length === 0) return 100;
    
    let score = 100;
    const centerIndex = Math.floor(cols.length / 2);
    const centerCells = cols[centerIndex].cells;
    const edgeAvg = (cols[0].cells + cols[cols.length - 1].cells) / 2;
    
    // Check if center is higher than edges (for bell curve)
    if (distribution === 'bell' && centerCells <= edgeAvg) {
      score -= 30;
    }
    
    // Check symmetry
    for (let i = 0; i < Math.floor(cols.length / 2); i++) {
      if (cols[i].cells !== cols[cols.length - 1 - i].cells) {
        score -= 5;
      }
    }
    
    // Check monotonicity for bell curve
    if (distribution === 'bell') {
      // Left side should increase
      for (let i = 0; i < centerIndex - 1; i++) {
        if (cols[i].cells > cols[i + 1].cells) {
          score -= 10;
        }
      }
      // Right side should decrease
      for (let i = centerIndex + 1; i < cols.length; i++) {
        if (cols[i - 1].cells < cols[i].cells) {
          score -= 10;
        }
      }
    }
    
    return Math.max(0, score);
  }, [distribution]);

  // Initialize and update grid
  useEffect(() => {
    if (!manuallyEdited) {
      const newColumns = distribution === 'bell' 
        ? generateImprovedBellCurve(gridRange.min, gridRange.max, targetCells)
        : generateFlatDistribution(gridRange.min, gridRange.max, targetCells);
      
      setColumns(newColumns);
      const score = analyzeDistribution(newColumns);
      setDistributionScore(score);
      setShowDistributionWarning(score < 70);
    }
  }, [gridRange, distribution, targetCells, generateImprovedBellCurve, generateFlatDistribution, analyzeDistribution, manuallyEdited]);

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
        symmetry: true,
        distributionScore
      };
      onGridChange(config);
    }
  }, [columns, gridRange, instructions, distribution, manuallyEdited, selectedTheme, distributionScore, onGridChange]);

  const handleRangeChange = (newMax: number) => {
    setGridRange({ min: -newMax, max: newMax });
    setManuallyEdited(false);
  };

  const handleDistributionChange = (newDist: 'bell' | 'flat') => {
    setDistribution(newDist);
    setManuallyEdited(false);
  };

  const adjustCells = (columnIndex: number, delta: number) => {
    const newColumns = [...columns];
    const currentTotal = newColumns.reduce((sum, col) => sum + col.cells, 0);
    
    if (delta > 0 && currentTotal >= MAX_CELLS) {
      return;
    }
    
    if (newColumns[columnIndex].cells + delta < 0) {
      return;
    }
    
    newColumns[columnIndex].cells += delta;
    
    // Always maintain symmetry
    const mirrorIndex = newColumns.length - 1 - columnIndex;
    if (mirrorIndex !== columnIndex && mirrorIndex >= 0 && mirrorIndex < newColumns.length) {
      const newTotal = newColumns.reduce((sum, col) => sum + col.cells, 0) + delta;
      if (newColumns[mirrorIndex].cells + delta >= 0 && newTotal <= MAX_CELLS) {
        newColumns[mirrorIndex].cells += delta;
      } else {
        newColumns[columnIndex].cells -= delta;
        return;
      }
    }
    
    setColumns(newColumns);
    setManuallyEdited(true);
    
    // Recalculate distribution score
    const score = analyzeDistribution(newColumns);
    setDistributionScore(score);
    setShowDistributionWarning(score < 70);
  };

  const resetDistribution = () => {
    setManuallyEdited(false);
    setCustomLabels({});
  };

  const handleAIRecommendation = (recommendation: any) => {
    setGridRange({ min: recommendation.range.min, max: recommendation.range.max });
    setTargetCells(recommendation.totalCells);
    
    // If we have a pre-defined distribution from the service, use it directly
    if (recommendation.distribution && Array.isArray(recommendation.distribution)) {
      const newColumns: GridColumn[] = recommendation.distribution.map((cells: number, index: number) => {
        const value = recommendation.range.min + index;
        const theme = labelThemes[selectedTheme];
        return {
          value,
          label: (theme.labels as any)[value.toString()] || `${value > 0 ? '+' : ''}${value}`,
          cells
        };
      });
      setColumns(newColumns);
      setManuallyEdited(true); // Mark as manually edited to preserve the distribution
      setDistribution('bell');
    } else {
      setDistribution('bell');
      setManuallyEdited(false);
    }
    
    setShowAIAssistant(false);
  };

  const totalCells = columns.reduce((sum, col) => sum + col.cells, 0);
  const cellsRemaining = MAX_CELLS - totalCells;

  const cellHeight = useMemo(() => {
    const maxCells = Math.max(...columns.map((c: any) => c.cells), 1);
    const columnCount = columns.length;
    
    if (columnCount >= 11) return 24;
    if (columnCount >= 9) return 28;
    if (maxCells > 8) return 32;
    if (maxCells > 6) return 36;
    return 40;
  }, [columns]);

  const buttonSize = useMemo(() => {
    const columnCount = columns.length;
    if (columnCount >= 11) return 'w-5 h-5';
    if (columnCount >= 9) return 'w-6 h-6';
    return 'w-7 h-7';
  }, [columns]);

  return (
    <>
      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1">
              <AIGridDesignAssistant
                onRecommendation={handleAIRecommendation}
                onClose={() => setShowAIAssistant(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="apple-ui-grid-builder bg-white rounded-2xl shadow-sm border border-gray-200/60">
        {/* Header with AI Assistant Button */}
        <div className="px-6 py-5 border-b border-gray-200/60">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Grid Configuration</h3>
              <p className="text-sm text-gray-500 mt-1">Design your Q-sort grid layout</p>
            </div>
            <div className="flex items-start gap-4">
              {/* AI Assistant Button */}
              <button
                onClick={() => setShowAIAssistant(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-sm"
              >
                <Brain className="w-4 h-4" />
                <span className="text-sm font-medium">AI Assistant</span>
                <Sparkles className="w-3 h-3" />
              </button>
              
              {/* Cell Counter */}
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
        </div>

        {/* Distribution Quality Indicator */}
        {columns.length > 0 && (
          <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Distribution Quality</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        distributionScore >= 80 ? 'bg-green-500' :
                        distributionScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${distributionScore}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    distributionScore >= 80 ? 'text-green-600' :
                    distributionScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {distributionScore}%
                  </span>
                </div>
                {distributionScore >= 80 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Optimal</span>
                  </div>
                )}
              </div>
            </div>
            
            {showDistributionWarning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium">Distribution may not be optimal</p>
                  <p>Consider using the AI Assistant or resetting to default distribution.</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

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
                  className="appearance-none w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="appearance-none w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bell">Bell Curve</option>
                  <option value="flat">Flat</option>
                  {manuallyEdited && (
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

            {/* Symmetry Status */}
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
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Grid Visualization */}
        <div ref={containerRef} className="p-6 overflow-x-auto">
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
                    {/* Column Value */}
                    <div className="text-center mb-2">
                      <div className={`font-bold ${columns.length > 9 ? 'text-sm' : 'text-lg'} text-gray-900`}>
                        {column.value > 0 ? '+' : ''}{column.value}
                      </div>
                    </div>

                    {/* Cell Controls - Vertical Layout */}
                    <div className={`flex flex-col items-center ${columns.length > 9 ? 'gap-0.5' : 'gap-1'} mb-2 bg-white px-2 py-1.5 rounded-lg shadow-sm border border-gray-200`}>
                      <button
                        onClick={() => adjustCells(index, 1)}
                        className={`${buttonSize} flex items-center justify-center rounded-md bg-green-50 hover:bg-green-100 text-green-600 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1`}
                        disabled={totalCells >= MAX_CELLS}
                        aria-label={`Add cell to column ${column.value}`}
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
                        />
                      ))}
                    </div>

                    {/* Column Label */}
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
                {manuallyEdited && (
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
    </>
  );
};