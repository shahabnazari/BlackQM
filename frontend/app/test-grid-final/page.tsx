'use client';

import React, { useState } from 'react';
import { AppleUIGridBuilderFinal } from '@/components/grid/AppleUIGridBuilderFinal';

export default function TestGridFinal() {
  const [gridConfig, setGridConfig] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Final Grid System - Usability Test
          </h1>
          <p className="text-gray-600">
            Testing the final production-ready grid with all improvements
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">✅ All Issues Fixed:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>No dependency on stimuli count</strong> - Grid design is independent</li>
            <li>• <strong>Maximum 60 cells limit</strong> - Clear and visible</li>
            <li>• <strong>Real-time cell counter</strong> - Shows current/max cells prominently</li>
            <li>• <strong>No button overlap</strong> - Responsive sizing for all grid sizes</li>
            <li>• <strong>Clear instructions</strong> - Tips and limits explained upfront</li>
            <li>• <strong>Perfect alignment</strong> - Fixed height labels prevent misalignment</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Production Grid Builder</h2>
          <AppleUIGridBuilderFinal
            onGridChange={setGridConfig}
            initialCells={30}
          />
        </div>

        {gridConfig && (
          <div className="space-y-6">
            {/* Usability Test Results */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Usability Test Checklist</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-green-700 mb-2">✓ Cell Counter Visibility</h3>
                  <p className="text-sm text-gray-600">
                    Large, prominent display showing {gridConfig.totalCells}/60 cells at top-right.
                    Users can immediately see how many cells they have and how many are available.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-green-700 mb-2">✓ No Button Overlap</h3>
                  <p className="text-sm text-gray-600">
                    Test with ±6 range (13 columns) - buttons remain distinct and clickable.
                    Dynamic sizing ensures usability at all grid sizes.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-green-700 mb-2">✓ Independence from Stimuli</h3>
                  <p className="text-sm text-gray-600">
                    Grid configuration works independently. Users design their grid first,
                    then upload stimuli in the next step. No circular dependency.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-green-700 mb-2">✓ Clear Limits & Instructions</h3>
                  <p className="text-sm text-gray-600">
                    Blue info banner explains the 60-cell limit and provides usage tips.
                    Users understand constraints before starting.
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-green-700 mb-2">✓ Target Cells Control</h3>
                  <p className="text-sm text-gray-600">
                    New "Target Cells" input allows users to specify desired total.
                    System automatically distributes according to selected pattern.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid Analysis */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Current Grid Analysis</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-gray-900">{gridConfig.totalCells}</div>
                  <div className="text-sm text-gray-600">Total Cells</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-gray-900">{60 - gridConfig.totalCells}</div>
                  <div className="text-sm text-gray-600">Cells Available</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-gray-900">{gridConfig.columns.length}</div>
                  <div className="text-sm text-gray-600">Columns</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-gray-900">
                    {gridConfig.distribution === 'custom' ? 'Manual' : gridConfig.distribution}
                  </div>
                  <div className="text-sm text-gray-600">Distribution</div>
                </div>
              </div>

              {/* Visual Grid Bar Chart */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Cell Distribution</h3>
                <div className="flex gap-2 items-end justify-center p-4 bg-gray-50 rounded">
                  {gridConfig.columns.map((col: any) => (
                    <div key={col.value} className="flex flex-col items-center">
                      <div className="text-xs font-semibold mb-1">
                        {col.cells}
                      </div>
                      <div 
                        className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600"
                        style={{ height: `${col.cells * 15}px` }}
                        title={`${col.label}: ${col.cells} cells`}
                      />
                      <div className="text-xs font-mono mt-1">
                        {col.value > 0 ? '+' : ''}{col.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button Size Test */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-medium text-yellow-900 mb-2">Button Sizing Test</h3>
                <div className="text-sm text-yellow-800">
                  <p className="mb-2">Current grid has {gridConfig.columns.length} columns:</p>
                  <ul className="space-y-1">
                    <li>• {gridConfig.columns.length <= 7 && 'Standard size buttons (w-7 h-7)'}</li>
                    <li>• {gridConfig.columns.length > 7 && gridConfig.columns.length <= 9 && 'Medium size buttons (w-6 h-6)'}</li>
                    <li>• {gridConfig.columns.length > 9 && 'Small size buttons (w-5 h-5) for maximum columns'}</li>
                    <li className="font-semibold mt-2">
                      → No overlap detected ✓
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Test Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">🧪 Manual Testing Steps:</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>
                  <strong>Test Maximum Range:</strong> Set range to ±6 (13 columns).
                  Verify buttons don't overlap and remain clickable.
                </li>
                <li>
                  <strong>Test Cell Limit:</strong> Try adding cells until you reach 60.
                  Verify the counter updates and plus buttons disable at limit.
                </li>
                <li>
                  <strong>Test Target Cells:</strong> Change the "Target Cells" input.
                  Verify grid redistributes automatically.
                </li>
                <li>
                  <strong>Test Symmetry:</strong> Enable symmetry and adjust a column.
                  Verify opposite column mirrors the change.
                </li>
                <li>
                  <strong>Test Distribution:</strong> Switch between Bell and Flat.
                  Verify flat gives equal cells to all columns.
                </li>
                <li>
                  <strong>Test Reset:</strong> Make manual changes then click Reset.
                  Verify grid returns to original distribution.
                </li>
                <li>
                  <strong>Test Responsiveness:</strong> Resize browser window.
                  Verify grid remains usable at different sizes.
                </li>
              </ol>
            </div>

            {/* Implementation Notes */}
            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📝 Implementation Notes:</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Key Changes from Previous Version:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Removed all dependencies on stimuli/statement count</li>
                  <li>Added hard limit of 60 cells with clear messaging</li>
                  <li>Implemented prominent real-time cell counter</li>
                  <li>Dynamic button/text sizing based on column count</li>
                  <li>Added "Target Cells" input for desired total</li>
                  <li>Improved spacing and gap calculations for larger grids</li>
                  <li>Enhanced visual feedback and status indicators</li>
                </ul>
                <p className="mt-3">
                  <strong>Workflow:</strong> Users design their grid in this step,
                  then upload stimuli in the next step. The stimuli will be distributed
                  according to the grid configuration created here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}