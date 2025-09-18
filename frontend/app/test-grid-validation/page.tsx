'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const EnhancedGridBuilder = dynamic(
  () => import('@/components/grid/EnhancedGridBuilder').then(mod => mod.EnhancedGridBuilder),
  { ssr: false }
);

export default function TestGridValidation() {
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testCase, setTestCase] = useState(0);

  // Test configurations
  const testCases = [
    { min: 20, max: 40, name: 'Standard Range (20-40)' },
    { min: 30, max: 35, name: 'Narrow Range (30-35)' },
    { min: 50, max: 100, name: 'Large Range (50-100)' },
    { min: 10, max: 15, name: 'Small Range (10-15)' }
  ];

  const currentTest = testCases[testCase];

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleGridChange = (config: any) => {
    setGridConfig(config);
    const totalCells = config.columns?.reduce((sum: number, col: any) => sum + col.cells, 0) || 0;
    const isWithinLimits = totalCells >= currentTest?.min && totalCells <= currentTest?.max;
    
    addLog(`Grid changed: ${totalCells} cells (${isWithinLimits ? '✅ Valid' : '⚠️ Out of range'})`);
    
    // Log details
    if (totalCells < currentTest?.min) {
      addLog(`   → Need ${currentTest?.min - totalCells} more cells`);
    } else if (totalCells > currentTest?.max) {
      addLog(`   → Remove ${totalCells - currentTest?.max} cells`);
    }
  };

  useEffect(() => {
    addLog(`Test case changed: ${currentTest?.name}`);
  }, [testCase]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Grid Validation Test</h1>
        
        {/* Test Case Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select Test Case</h2>
          <div className="flex gap-4 flex-wrap">
            {testCases.map((tc, index) => (
              <button
                key={index}
                onClick={() => setTestCase(index)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  testCase === index 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {tc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Test Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Current Test: {currentTest?.name}
          </h3>
          <div className="space-y-2 text-blue-800">
            <p>• Minimum cells required: <strong>{currentTest?.min}</strong></p>
            <p>• Maximum cells allowed: <strong>{currentTest?.max}</strong></p>
            <p>• Valid range: <strong>{currentTest?.max - currentTest?.min + 1} cells</strong></p>
          </div>
        </div>

        {/* Grid Builder */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Grid Configuration</h2>
          <EnhancedGridBuilder
            key={testCase} // Force re-render on test case change
            studyId={`test-${testCase}`}
            onGridChange={handleGridChange}
            minCells={currentTest?.min}
            maxCells={currentTest?.max}
            allowColumnManagement={true}
            showAdvancedOptions={true}
          />
        </div>

        {/* Live Status */}
        {gridConfig && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Live Grid Status</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Column Distribution</h3>
                <div className="space-y-1">
                  {gridConfig.columns?.map((col: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>Column {col.value} ({col.label}):</span>
                      <span className="font-mono">{col.cells} cells</span>
                    </div>
                  )) || <p className="text-gray-500">No columns configured</p>}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Columns:</span>
                    <span className="font-mono">{gridConfig.columns?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cells:</span>
                    <span className="font-mono">
                      {gridConfig.columns?.reduce((sum: number, col: any) => sum + col.cells, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      (() => {
                        const total = gridConfig.columns?.reduce((sum: number, col: any) => sum + col.cells, 0) || 0;
                        return total >= currentTest?.min && total <= currentTest?.max
                          ? 'text-green-600'
                          : 'text-orange-600';
                      })()
                    }`}>
                      {(() => {
                        const total = gridConfig.columns?.reduce((sum: number, col: any) => sum + col.cells, 0) || 0;
                        if (total < currentTest?.min) return `Need ${currentTest?.min - total} more`;
                        if (total > currentTest?.max) return `Remove ${total - currentTest?.max}`;
                        return '✅ Valid';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Log */}
        <div className="bg-gray-900 text-gray-100 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Event Log</h2>
          <div className="space-y-1 font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} className={`${
                  log.includes('✅') ? 'text-green-400' :
                  log.includes('⚠️') ? 'text-yellow-400' :
                  log.includes('→') ? 'text-gray-400' :
                  'text-gray-300'
                }`}>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">No events yet. Interact with the grid to see logs.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}