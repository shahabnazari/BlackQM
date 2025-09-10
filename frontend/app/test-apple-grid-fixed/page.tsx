'use client';

import React, { useState } from 'react';
import { AppleUIGridBuilder } from '@/components/grid/AppleUIGridBuilder';

export default function TestAppleGridFixed() {
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [totalStatements, setTotalStatements] = useState(30);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Apple Grid Design Fixes Test
          </h1>
          <p className="text-gray-600">
            Testing all fixes applied to the AppleUIGridBuilder component
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Apple UI Grid Builder (Fixed)</h2>
          <AppleUIGridBuilder
            totalStatements={totalStatements}
            onGridChange={setGridConfig}
          />
        </div>

        {gridConfig && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Grid Configuration Status</h2>
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
                <h3 className="font-medium mb-2">Label Theme:</h3>
                <p className="text-gray-700">{gridConfig.labelTheme}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Column Distribution:</h3>
              <div className="flex gap-2 flex-wrap">
                {gridConfig.columns.map((col: any) => (
                  <div key={col.value} className="bg-gray-100 px-3 py-2 rounded">
                    <div className="text-sm font-medium">{col.value > 0 ? '+' : ''}{col.value}</div>
                    <div className="text-xs text-gray-600">{col.cells} cells</div>
                    <div className="text-xs text-blue-600 truncate max-w-[100px]">{col.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-green-700">✅ Fixes Applied:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Flat distribution fixed:</strong> Cells now evenly distributed with remainder cells placed in middle columns (no last column imbalance)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Column labels at bottom:</strong> Labels now shown at the bottom of each column instead of cell counts
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Forced distribution removed:</strong> Completely removed from the component
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Bell curve balanced:</strong> Now properly symmetric and distributes exact total
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Plus/minus controls added:</strong> Clear controls with red minus and green plus buttons for adjusting cells
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <strong>Cell count display:</strong> Shows between plus/minus buttons for easy reference
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The grid should now have perfect symmetry in bell curve mode, 
                balanced flat distribution without last column issues, and interactive controls for 
                adjusting cells per column. The forced distribution option has been completely removed.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}