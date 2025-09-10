'use client';

import React, { useState } from 'react';
import { AppleUIGridBuilderEnhanced } from '@/components/grid/AppleUIGridBuilderEnhanced';

export default function TestGridEnhanced() {
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [totalStatements, setTotalStatements] = useState(30);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced Grid System - Comprehensive Test
          </h1>
          <p className="text-gray-600">
            Testing all comprehensive enhancements to the grid design
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium">
              Total Statements:
            </label>
            <input
              type="number"
              value={totalStatements}
              onChange={(e) => setTotalStatements(parseInt(e.target.value) || 20)}
              min={10}
              max={100}
              className="px-3 py-1 border rounded"
            />
            <span className="text-sm text-gray-500">
              (Try different values to test distribution)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enhanced Grid Builder</h2>
          <AppleUIGridBuilderEnhanced
            totalStatements={totalStatements}
            onGridChange={setGridConfig}
          />
        </div>

        {gridConfig && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Current Configuration Analysis</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium text-sm text-gray-700">Distribution</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {gridConfig.distribution === 'custom' ? 'Custom (Manual)' : gridConfig.distribution}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium text-sm text-gray-700">Total Cells</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {gridConfig.totalCells} / {totalStatements}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium text-sm text-gray-700">Range</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {gridConfig.rangeMin} to {gridConfig.rangeMax}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h3 className="font-medium text-sm text-gray-700">Symmetry</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {gridConfig.symmetry ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-3">Column Distribution Visualization</h3>
              <div className="flex gap-2 items-end justify-center p-4 bg-gray-50 rounded">
                {gridConfig.columns.map((col: any) => (
                  <div key={col.value} className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 rounded-t w-12 transition-all"
                      style={{ height: `${col.cells * 20}px` }}
                    />
                    <div className="text-xs font-semibold mt-1">
                      {col.value > 0 ? '+' : ''}{col.value}
                    </div>
                    <div className="text-xs text-gray-600">
                      {col.cells}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-3">Dynamic Labels (Auto-Adjusted)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {gridConfig.columns.map((col: any) => (
                  <div key={col.value} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-semibold text-gray-700 min-w-[30px]">
                      {col.value > 0 ? '+' : ''}{col.value}:
                    </span>
                    <span className="text-gray-600 truncate">
                      {col.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-green-700">✅ Comprehensive Enhancements:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>True Flat Distribution:</strong>
                    <p className="text-sm text-gray-600 mt-1">
                      All columns now have equal height when flat distribution is selected.
                      The system properly distributes cells evenly across all columns.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Dynamic Column Labels:</strong>
                    <p className="text-sm text-gray-600 mt-1">
                      Labels automatically adjust based on the scale range.
                      Smaller ranges (±2-3) use simpler labels, larger ranges (±4-6) use more detailed labels.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Symmetry Maintenance:</strong>
                    <p className="text-sm text-gray-600 mt-1">
                      When symmetry is enabled, manual adjustments to one column automatically
                      mirror to the opposite column, maintaining perfect balance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>All Columns Interactive:</strong>
                    <p className="text-sm text-gray-600 mt-1">
                      Plus/minus buttons work on all columns with proper validation.
                      Cannot exceed total statements or go below 0.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Distribution Persistence:</strong>
                    <p className="text-sm text-gray-600 mt-1">
                      Manual edits are tracked and the system indicates when the grid
                      has been manually edited vs using pure distribution.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Reset Functionality:</strong>
                    <p className="text-sm text-gray-600 mt-1">
                      "Reset Grid" button allows returning to the original distribution
                      after manual edits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Test Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Try switching between Bell Curve and Flat distribution - notice flat is truly equal</li>
                <li>Change the grid range and observe how labels automatically adjust</li>
                <li>Enable symmetry and adjust cells - see how opposite columns mirror changes</li>
                <li>Test plus/minus buttons on all columns including edge columns</li>
                <li>Make manual edits and observe the "Manually Edited" indicator</li>
                <li>Use Reset Grid to return to original distribution</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}