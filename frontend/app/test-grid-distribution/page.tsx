'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { AlertCircle, CheckCircle, XCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface DistributionTest {
  stimuliCount: number;
  range: { min: number; max: number };
  distribution: number[];
  isValid: boolean;
  issues: string[];
  score: number;
}

interface GridAnalysis {
  centerValue: number;
  edgeValues: number[];
  isSymmetric: boolean;
  isBellShaped: boolean;
  peakPosition: number;
  variance: number;
}

export default function GridDistributionTestPage() {
  const [testResults, setTestResults] = useState<DistributionTest[]>([]);
  const [currentTest, setCurrentTest] = useState<DistributionTest | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedRange, setSelectedRange] = useState(3);
  const [selectedStimuli, setSelectedStimuli] = useState(36);
  const [algorithm, setAlgorithm] = useState<'current' | 'improved'>('current');

  // Current algorithm from the grid builder
  const generateCurrentBellCurve = (min: number, max: number, targetTotal: number): number[] => {
    const columnCount = max - min + 1;
    const center = (columnCount - 1) / 2;
    const sigma = columnCount / 3.5;
    
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
      const avgValue = (bellValues[i] + bellValues[columnCount - 1 - i]) / 2;
      bellValues[i] = avgValue;
      bellValues[columnCount - 1 - i] = avgValue;
    }
    
    // Normalize and distribute cells
    const sumBellValues = bellValues.reduce((a, b) => a + b, 0);
    const cellDistribution = new Array(columnCount).fill(0);
    let distributedCells = 0;
    
    for (let i = 0; i < columnCount; i++) {
      const proportion = bellValues[i] / sumBellValues;
      const cells = Math.max(1, Math.round(targetTotal * proportion));
      cellDistribution[i] = cells;
      distributedCells += cells;
    }
    
    // Adjust for exact total
    const adjustment = targetTotal - distributedCells;
    if (adjustment !== 0) {
      const middleIndex = Math.floor(columnCount / 2);
      cellDistribution[middleIndex] = Math.max(0, cellDistribution[middleIndex] + adjustment);
    }
    
    return cellDistribution;
  };

  // Improved algorithm with better bell curve properties
  const generateImprovedBellCurve = (min: number, max: number, targetTotal: number): number[] => {
    const columnCount = max - min + 1;
    const center = (columnCount - 1) / 2;
    
    // Dynamic sigma based on column count for better distribution
    const sigma = columnCount <= 7 ? columnCount / 4 : columnCount / 3.2;
    
    // Generate raw bell curve values
    const bellValues: number[] = [];
    for (let i = 0; i < columnCount; i++) {
      const distance = i - center;
      const normalizedDistance = distance / sigma;
      // Use a slightly modified gaussian for better edge handling
      const bellValue = Math.exp(-0.5 * normalizedDistance * normalizedDistance);
      bellValues.push(bellValue);
    }
    
    // Apply smoothing to prevent sharp drops
    for (let i = 1; i < columnCount - 1; i++) {
      const smoothed = (bellValues[i - 1] * 0.15 + bellValues[i] * 0.7 + bellValues[i + 1] * 0.15);
      bellValues[i] = smoothed;
    }
    
    // Ensure perfect symmetry
    for (let i = 0; i < Math.floor(columnCount / 2); i++) {
      const avgValue = (bellValues[i] + bellValues[columnCount - 1 - i]) / 2;
      bellValues[i] = avgValue;
      bellValues[columnCount - 1 - i] = avgValue;
    }
    
    // Ensure minimum cells at edges (at least 1)
    const minEdgeCells = 1;
    bellValues[0] = Math.max(bellValues[0], minEdgeCells / targetTotal);
    bellValues[columnCount - 1] = Math.max(bellValues[columnCount - 1], minEdgeCells / targetTotal);
    
    // Normalize to get proportions
    const sumBellValues = bellValues.reduce((a, b) => a + b, 0);
    const proportions = bellValues.map(v => v / sumBellValues);
    
    // Distribute cells with better rounding
    let cellDistribution = new Array(columnCount).fill(0);
    let remainingCells = targetTotal;
    
    // First pass: assign minimum cells
    for (let i = 0; i < columnCount; i++) {
      cellDistribution[i] = Math.max(1, Math.floor(targetTotal * proportions[i]));
      remainingCells -= cellDistribution[i];
    }
    
    // Second pass: distribute remaining cells proportionally
    if (remainingCells > 0) {
      const errors = proportions.map((p, i) => ({
        index: i,
        error: (targetTotal * p) - cellDistribution[i]
      }));
      errors.sort((a, b) => b.error - a.error);
      
      for (let i = 0; i < remainingCells; i++) {
        const targetIndex = errors[i % errors.length].index;
        cellDistribution[targetIndex]++;
      }
    } else if (remainingCells < 0) {
      // Remove excess cells from the middle
      const middleIndex = Math.floor(columnCount / 2);
      cellDistribution[middleIndex] += remainingCells;
    }
    
    // Final validation: ensure bell shape
    const centerIndex = Math.floor(columnCount / 2);
    const centerCells = cellDistribution[centerIndex];
    const edgeCells = (cellDistribution[0] + cellDistribution[columnCount - 1]) / 2;
    
    // If center is not higher than edges, redistribute
    if (centerCells <= edgeCells && columnCount > 3) {
      const deficit = Math.ceil((edgeCells - centerCells) * 1.5) + 2;
      cellDistribution[centerIndex] += deficit;
      
      // Remove cells from edges to compensate
      const removePerEdge = Math.ceil(deficit / 2);
      cellDistribution[0] = Math.max(1, cellDistribution[0] - removePerEdge);
      cellDistribution[columnCount - 1] = Math.max(1, cellDistribution[columnCount - 1] - removePerEdge);
      
      // Adjust total if needed
      const newTotal = cellDistribution.reduce((a, b) => a + b, 0);
      if (newTotal !== targetTotal) {
        const diff = targetTotal - newTotal;
        if (diff > 0) {
          cellDistribution[centerIndex] += diff;
        } else {
          const middleThird = Math.floor(columnCount / 3);
          let adjustmentNeeded = -diff;
          for (let i = middleThird; i < columnCount - middleThird && adjustmentNeeded > 0; i++) {
            if (cellDistribution[i] > 1) {
              cellDistribution[i]--;
              adjustmentNeeded--;
            }
          }
        }
      }
    }
    
    return cellDistribution;
  };

  const analyzeDistribution = (distribution: number[]): GridAnalysis => {
    const centerIndex = Math.floor(distribution.length / 2);
    const centerValue = distribution[centerIndex];
    const edgeValues = [distribution[0], distribution[distribution.length - 1]];
    
    // Check symmetry
    let isSymmetric = true;
    for (let i = 0; i < Math.floor(distribution.length / 2); i++) {
      if (distribution[i] !== distribution[distribution.length - 1 - i]) {
        isSymmetric = false;
        break;
      }
    }
    
    // Check bell shape (center should be highest, monotonic decrease to edges)
    let isBellShaped = true;
    
    // Check left side (should be increasing toward center)
    for (let i = 0; i < centerIndex - 1; i++) {
      if (distribution[i] > distribution[i + 1]) {
        isBellShaped = false;
        break;
      }
    }
    
    // Check right side (should be decreasing from center)
    for (let i = centerIndex + 1; i < distribution.length; i++) {
      if (distribution[i - 1] < distribution[i]) {
        isBellShaped = false;
        break;
      }
    }
    
    // Check that center is peak
    if (centerValue <= Math.max(...edgeValues)) {
      isBellShaped = false;
    }
    
    // Find actual peak position
    const maxValue = Math.max(...distribution);
    const peakPosition = distribution.indexOf(maxValue);
    
    // Calculate variance
    const mean = distribution.reduce((a, b) => a + b, 0) / distribution.length;
    const variance = distribution.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / distribution.length;
    
    return {
      centerValue,
      edgeValues,
      isSymmetric,
      isBellShaped,
      peakPosition,
      variance
    };
  };

  const runSingleTest = (stimuliCount: number, range: number, useImproved: boolean = false): DistributionTest => {
    const min = -range;
    const max = range;
    const distribution = useImproved 
      ? generateImprovedBellCurve(min, max, stimuliCount)
      : generateCurrentBellCurve(min, max, stimuliCount);
    
    const analysis = analyzeDistribution(distribution);
    const issues: string[] = [];
    
    if (!analysis.isSymmetric) {
      issues.push('Distribution is not symmetric');
    }
    
    if (!analysis.isBellShaped) {
      issues.push('Distribution does not follow bell curve shape');
    }
    
    if (analysis.peakPosition !== Math.floor(distribution.length / 2)) {
      issues.push(`Peak is at position ${analysis.peakPosition}, should be at center (${Math.floor(distribution.length / 2)})`);
    }
    
    if (analysis.centerValue <= Math.max(...analysis.edgeValues)) {
      issues.push(`Center value (${analysis.centerValue}) is not greater than edges (${analysis.edgeValues.join(', ')})`);
    }
    
    // Calculate score (0-100)
    let score = 100;
    if (!analysis.isSymmetric) score -= 25;
    if (!analysis.isBellShaped) score -= 35;
    if (analysis.peakPosition !== Math.floor(distribution.length / 2)) score -= 20;
    if (analysis.centerValue <= Math.max(...analysis.edgeValues)) score -= 20;
    
    return {
      stimuliCount,
      range: { min, max },
      distribution,
      isValid: issues.length === 0,
      issues,
      score: Math.max(0, score)
    };
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    const results: DistributionTest[] = [];
    
    // Test ranges from ±2 to ±6
    const ranges = [2, 3, 4, 5, 6];
    // Test stimuli counts from 20 to 60 in steps of 5
    const stimuliCounts = Array.from({ length: 9 }, (_, i) => 20 + i * 5);
    
    for (const range of ranges) {
      for (const stimuli of stimuliCounts) {
        const result = runSingleTest(stimuli, range, algorithm === 'improved');
        results.push(result);
        setTestResults([...results]);
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for UI updates
      }
    }
    
    setIsRunningTests(false);
  };

  const getDistributionVisual = (distribution: number[]) => {
    const max = Math.max(...distribution);
    return distribution.map((value, index) => {
      const height = (value / max) * 100;
      return { value, height, index };
    });
  };

  const formatRange = (min: number, max: number) => {
    return `${min} to +${max}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Grid Distribution Analyzer</h1>
          <p className="text-lg text-gray-600">Testing bell curve distributions for Q-sort grids</p>
        </div>

        {/* Control Panel */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'current' | 'improved')}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="current">Current Algorithm</option>
                <option value="improved">Improved Algorithm</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Range (±)
              </label>
              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {[2, 3, 4, 5, 6].map(r => (
                  <option key={r} value={r}>±{r}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stimuli Count
              </label>
              <input
                type="number"
                value={selectedStimuli}
                onChange={(e) => setSelectedStimuli(Number(e.target.value))}
                min={10}
                max={100}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <Button
                onClick={() => {
                  const result = runSingleTest(selectedStimuli, selectedRange, algorithm === 'improved');
                  setCurrentTest(result);
                }}
                variant="secondary"
              >
                Test Single
              </Button>
              <Button
                onClick={runAllTests}
                variant="primary"
                disabled={isRunningTests}
              >
                {isRunningTests ? 'Running...' : 'Run All Tests'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Current Test Result */}
        {currentTest && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Test Result: {currentTest.stimuliCount} stimuli, {formatRange(currentTest.range.min, currentTest.range.max)}
            </h2>
            
            {/* Visual Distribution */}
            <div className="mb-6">
              <div className="flex items-end justify-center gap-2" style={{ height: '200px' }}>
                {getDistributionVisual(currentTest.distribution).map(({ value, height, index }) => (
                  <div
                    key={index}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / currentTest.distribution.length}%` }}
                  >
                    <div
                      className={`w-full transition-all duration-300 ${
                        currentTest.isValid ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs mt-1">{value}</span>
                    <span className="text-xs text-gray-500">
                      {currentTest.range.min + index}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Analysis */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Status</h3>
                <div className="flex items-center gap-2">
                  {currentTest.isValid ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600">Valid Bell Curve</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-600">Invalid Distribution</span>
                    </>
                  )}
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                    Score: {currentTest.score}%
                  </span>
                </div>
              </div>
              
              {currentTest.issues.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Issues Found</h3>
                  <ul className="text-sm text-red-600 space-y-1">
                    {currentTest.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Test Results Summary */}
        {testResults.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results Summary</h2>
            
            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {testResults.length}
                </div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.isValid).length}
                </div>
                <div className="text-sm text-gray-600">Valid</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => !r.isValid).length}
                </div>
                <div className="text-sm text-gray-600">Invalid</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length)}%
                </div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
            </div>
            
            {/* Detailed Results Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left">Range</th>
                    <th className="px-2 py-2 text-left">Stimuli</th>
                    <th className="px-2 py-2 text-left">Distribution</th>
                    <th className="px-2 py-2 text-left">Status</th>
                    <th className="px-2 py-2 text-left">Score</th>
                    <th className="px-2 py-2 text-left">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-2">
                        {formatRange(result.range.min, result.range.max)}
                      </td>
                      <td className="px-2 py-2">{result.stimuliCount}</td>
                      <td className="px-2 py-2 font-mono text-xs">
                        [{result.distribution.join(', ')}]
                      </td>
                      <td className="px-2 py-2">
                        {result.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.score >= 80 ? 'bg-green-100 text-green-700' :
                          result.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {result.score}%
                        </span>
                      </td>
                      <td className="px-2 py-2 text-xs">
                        {result.issues.length > 0 ? result.issues[0] : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}