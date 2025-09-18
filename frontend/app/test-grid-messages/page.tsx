'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import grid builder to avoid SSR issues
const EnhancedGridBuilder = dynamic(
  () => import('@/components/grid/EnhancedGridBuilder').then(mod => mod.EnhancedGridBuilder),
  { ssr: false }
);

export default function TestGridMessages() {
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const handleGridChange = useCallback((config: any) => {
    setGridConfig(config);
    
    // Log the config to test results
    const totalCells = config.columns?.reduce((sum: number, col: any) => sum + col.cells, 0) || 0;
    const message = `Grid updated: ${config.columns?.length || 0} columns, ${totalCells} total cells`;
    setTestResults(prev => [...prev, message]);
  }, []);

  const runAutomatedTests = () => {
    setTestResults(['Starting automated tests...']);
    
    // Test different scenarios
    const testScenarios = [
      { name: 'Below minimum cells', expected: 'Warning message for too few cells' },
      { name: 'Within valid range', expected: 'Success indicator' },
      { name: 'Above maximum cells', expected: 'Warning message for too many cells' },
      { name: 'Invalid distribution', expected: 'Validation error message' }
    ];

    setTestResults(prev => [
      ...prev,
      ...testScenarios.map((scenario: any) => `Testing: ${scenario.name} - Expecting: ${scenario.expected}`)
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Grid Messages Test Page</h1>
        
        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <button
            onClick={runAutomatedTests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Run Automated Tests
          </button>
          
          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">Test Log:</h3>
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {new Date().toLocaleTimeString()}: {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grid Builder with Different Configurations */}
        <div className="space-y-8">
          {/* Test 1: Normal Range (20-40 cells) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Test 1: Normal Range (20-40 cells)</h2>
            <EnhancedGridBuilder
              studyId="test-normal"
              onGridChange={handleGridChange}
              minCells={20}
              maxCells={40}
              allowColumnManagement={true}
              showAdvancedOptions={true}
            />
          </div>

          {/* Test 2: Tight Range (30-35 cells) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Test 2: Tight Range (30-35 cells)</h2>
            <EnhancedGridBuilder
              studyId="test-tight"
              onGridChange={handleGridChange}
              minCells={30}
              maxCells={35}
              allowColumnManagement={true}
              showAdvancedOptions={true}
            />
          </div>

          {/* Test 3: Large Range (10-100 cells) */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Test 3: Large Range (10-100 cells)</h2>
            <EnhancedGridBuilder
              studyId="test-large"
              onGridChange={handleGridChange}
              minCells={10}
              maxCells={100}
              allowColumnManagement={true}
              showAdvancedOptions={true}
            />
          </div>
        </div>

        {/* Current Grid Configuration Display */}
        {gridConfig && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Current Grid Configuration</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(gridConfig, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}