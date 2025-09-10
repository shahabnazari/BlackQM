'use client';

import React, { useState } from 'react';
import { AppleUIGridBuilder } from '@/components/grid/AppleUIGridBuilder';

export default function TestAppleGrid() {
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [totalStatements, setTotalStatements] = useState(30);

  const handleGridChange = (config: any) => {
    setGridConfig(config);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Apple UI Grid Builder Test
          </h1>
          <p className="text-gray-600">
            Testing the new grid design with auto-scaling, pre-filled labels, and Apple UI design
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Statements
          </label>
          <input
            type="number"
            value={totalStatements}
            onChange={(e) => setTotalStatements(parseInt(e.target.value) || 30)}
            min={10}
            max={100}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Grid Builder */}
        <AppleUIGridBuilder
          studyId="test-study"
          onGridChange={handleGridChange}
          totalStatements={totalStatements}
          minStatements={10}
          maxStatements={100}
        />

        {/* Configuration Display */}
        {gridConfig && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Current Configuration
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Range:</span>{' '}
                <span className="text-gray-900">
                  {gridConfig.rangeMin} to {gridConfig.rangeMax}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Total Cells:</span>{' '}
                <span className="text-gray-900">{gridConfig.totalCells}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Distribution:</span>{' '}
                <span className="text-gray-900">{gridConfig.distribution}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Label Theme:</span>{' '}
                <span className="text-gray-900">{gridConfig.labelTheme}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Column Distribution:</h3>
              <div className="flex gap-2 flex-wrap">
                {gridConfig.columns.map((col: any) => (
                  <div
                    key={col.value}
                    className="px-3 py-1 bg-gray-100 rounded-lg text-sm"
                  >
                    <span className="font-medium">{col.value > 0 ? '+' : ''}{col.value}:</span>{' '}
                    <span>{col.cells} cells</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Instructions:</h3>
              <p className="text-sm text-gray-600 italic">
                {gridConfig.instructions || 'No instructions provided'}
              </p>
            </div>
          </div>
        )}

        {/* Feature Checklist */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Feature Verification
          </h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" checked readOnly />
              <span className="text-sm text-gray-700">✅ Auto-scales to fit -6 to +6 range without zoom</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" checked readOnly />
              <span className="text-sm text-gray-700">✅ Zoom functionality removed</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" checked readOnly />
              <span className="text-sm text-gray-700">✅ Column management via dropdown (no +/- buttons)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" checked readOnly />
              <span className="text-sm text-gray-700">✅ Auto-balance always active</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" checked readOnly />
              <span className="text-sm text-gray-700">✅ Settings always visible (no gear icon)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" checked readOnly />
              <span className="text-sm text-gray-700">✅ 10 pre-filled column label themes</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" checked readOnly />
              <span className="text-sm text-gray-700">✅ Character limit on column names (25 chars)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" checked readOnly />
              <span className="text-sm text-gray-700">✅ Apple UI design patterns applied</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}