'use client';

import React, { useState } from 'react';
import { AppleUIGridBuilderEnhanced } from '@/components/grid/AppleUIGridBuilderEnhanced';

export default function TestGridAlignment() {
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [totalStatements, setTotalStatements] = useState(30);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Grid Alignment Test - Label Wrapping Fix
          </h1>
          <p className="text-gray-600">
            Testing that multi-line labels don't cause cell misalignment
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🔍 What to Check:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All grid cells should align horizontally at the same height</li>
            <li>• Labels at the bottom should have consistent height containers</li>
            <li>• When labels wrap to 2 lines, cells above should remain aligned</li>
            <li>• Test with different ranges to see various label lengths</li>
          </ul>
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
              onChange={(e: any) => setTotalStatements(parseInt(e.target.value) || 20)}
              min={10}
              max={100}
              className="px-3 py-1 border rounded"
            />
            <span className="text-sm text-gray-500">
              Try ranges ±6 for longer labels that may wrap
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Grid with Fixed Alignment</h2>
          <AppleUIGridBuilderEnhanced
            totalStatements={totalStatements}
            onGridChange={setGridConfig}
          />
        </div>

        {gridConfig && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Alignment Analysis</h2>
            
            <div className="mb-6">
              <h3 className="font-medium mb-3">Visual Alignment Check</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Before Fix:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>❌ Cells pushed up by multi-line labels</li>
                      <li>❌ Inconsistent cell heights across columns</li>
                      <li>❌ Misaligned grid appearance</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">After Fix:</h4>
                    <ul className="text-sm text-green-600 space-y-1">
                      <li>✅ Fixed height label containers (h-12)</li>
                      <li>✅ Cells align from top (items-start)</li>
                      <li>✅ Consistent grid alignment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-3">Current Label Analysis</h3>
              <div className="space-y-2">
                {gridConfig.columns.map((col: any) => {
                  const labelLength = col.label.length;
                  const isLong = labelLength > 15;
                  return (
                    <div key={col.value} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <span className="font-mono text-sm font-semibold text-gray-700 min-w-[40px]">
                        {col.value > 0 ? '+' : ''}{col.value}:
                      </span>
                      <span className={`text-sm ${isLong ? 'text-orange-600' : 'text-gray-600'} flex-1`}>
                        {col.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({labelLength} chars{isLong ? ' - may wrap' : ''})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">✅ Fix Applied:</h4>
              <div className="text-sm text-green-800 space-y-2">
                <p>
                  <strong>Technical Solution:</strong> The label containers now have a fixed height 
                  (h-12 = 3rem = 48px) with flexbox centering. This ensures all labels occupy the 
                  same vertical space regardless of whether they wrap to multiple lines.
                </p>
                <p>
                  <strong>Layout Change:</strong> Changed from `items-end` to `items-start` alignment 
                  to ensure cells align from the top rather than being pushed up by varying label heights.
                </p>
                <p>
                  <strong>Result:</strong> All grid cells now maintain perfect horizontal alignment 
                  across columns, creating a clean and professional appearance.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Test Different Scenarios:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Set range to ±6 to get longer labels like "Extremely Disagree"</li>
                <li>Set range to ±2 for shorter labels like "Agree"</li>
                <li>Observe that cells remain aligned regardless of label length</li>
                <li>Check that the grid maintains visual consistency</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}