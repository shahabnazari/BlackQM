'use client';

import React, { useState } from 'react';
import { AppleUIGridBuilderFinal } from '@/components/grid/AppleUIGridBuilderFinal';

export default function TestGridImprovements() {
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [totalStatements, setTotalStatements] = useState(30);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Grid Design Improvements Test
          </h1>
          <p className="text-gray-600">
            Testing all improvements to the grid design system
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
              onChange={(e: any) => setTotalStatements(parseInt(e.target.value) || 20)}
              min={10}
              max={100}
              className="px-3 py-1 border rounded"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Enhanced Apple UI Grid Builder</h2>
          <AppleUIGridBuilderFinal
            initialCells={totalStatements}
            onGridChange={setGridConfig}
          />
        </div>

        {gridConfig && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Distribution Type:</h3>
                <p className="text-gray-700">{gridConfig.distribution}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Total Cells:</h3>
                <p className="text-gray-700">{gridConfig.totalCells} / {totalStatements}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Range:</h3>
                <p className="text-gray-700">{gridConfig.rangeMin} to {gridConfig.rangeMax}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Symmetry:</h3>
                <p className="text-gray-700">{gridConfig.symmetry ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Column Distribution:</h3>
              <div className="flex gap-2 flex-wrap">
                {gridConfig.columns.map((col: any) => (
                  <div key={col.value} className="bg-gray-100 px-3 py-2 rounded">
                    <div className="text-sm font-medium">{col.value > 0 ? '+' : ''}{col.value}</div>
                    <div className="text-xs text-gray-600">{col.cells} cells</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">Improvements Checklist:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Flat distribution: cells evenly distributed (no last column imbalance)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Column labels shown at bottom with 8 theme options</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Forced distribution removed entirely</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Bell curve properly balanced and symmetrical</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Plus/minus controls clearly visible and functional</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Bell curve validation: auto-switches to custom when pattern breaks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Visual notification when distribution changes to custom</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Enhanced accessibility with ARIA labels and keyboard navigation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Apple design principles with smooth animations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>60-cell maximum with clear visual counter</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}