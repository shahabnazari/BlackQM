'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const EnhancedGridBuilder = dynamic(
  () => import('@/components/grid/EnhancedGridBuilder').then(mod => mod.EnhancedGridBuilder),
  { ssr: false }
);

const StimuliUploadSystem = dynamic(
  () => import('@/components/stimuli/StimuliUploadSystem').then(mod => mod.StimuliUploadSystem),
  { ssr: false }
);

interface TestResult {
  test: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export default function ComprehensiveGridTest() {
  const [gridConfig, setGridConfig] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  // const [currentTest, setCurrentTest] = useState(''); // Reserved for individual test tracking
  const [showUpload, setShowUpload] = useState(false);

  const handleGridChange = useCallback((config: any) => {
    setGridConfig(config);
    console.log('Grid changed:', config);
  }, []);

  const runTests = async () => {
    setTestResults([]);
    const results: TestResult[] = [];

    // Test 1: Check if grid displays correct total cells
    if (gridConfig) {
      const totalCells = gridConfig.columns?.reduce((sum: number, col: any) => sum + col.cells, 0) || 0;
      results.push({
        test: 'Grid displays correct total cells',
        expected: `Total cells should match sum of column cells`,
        actual: `Grid shows ${gridConfig.totalCells}, calculated: ${totalCells}`,
        passed: gridConfig.totalCells === totalCells
      });
    }

    // Test 2: Check validation message visibility
    const gridElement = document.querySelector('.enhanced-grid-builder');
    if (gridElement) {
      const hasValidationMessage = gridElement.textContent?.includes('Add') || 
                                   gridElement.textContent?.includes('Remove') || 
                                   gridElement.textContent?.includes('cells configured');
      results.push({
        test: 'Validation messages are visible',
        expected: 'Should show cell count and validation messages',
        actual: hasValidationMessage ? 'Messages visible' : 'No messages found',
        passed: hasValidationMessage
      });
    }

    // Test 3: Check grid capacity display
    const capacityText = document.querySelector('.enhanced-grid-builder')?.textContent;
    const hasCapacity = capacityText?.includes('Grid capacity:');
    results.push({
      test: 'Grid capacity limits displayed',
      expected: 'Should show "Grid capacity: X - Y cells"',
      actual: hasCapacity ? 'Capacity shown' : 'No capacity display',
      passed: hasCapacity || false
    });

    // Test 4: Check color coding for validation
    const statusElement = document.querySelector('[class*="bg-green-100"], [class*="bg-orange-100"]');
    results.push({
      test: 'Status color coding working',
      expected: 'Green for valid, orange for invalid',
      actual: statusElement ? 'Color coding present' : 'No color coding found',
      passed: !!statusElement
    });

    // Test 5: Check if stimuli upload shows requirements
    if (showUpload && gridConfig) {
      const uploadElement = document.querySelector('.stimuli-upload-system');
      const hasRequirement = uploadElement?.textContent?.includes(`requires exactly ${gridConfig.totalCells}`);
      results.push({
        test: 'Upload shows stimuli requirements',
        expected: `Should show "requires exactly ${gridConfig.totalCells} stimuli"`,
        actual: hasRequirement ? 'Requirement shown' : 'No requirement message',
        passed: hasRequirement || false
      });
    }

    setTestResults(results);
  };

  useEffect(() => {
    // Run tests whenever grid changes
    if (gridConfig) {
      runTests();
    }
  }, [gridConfig, showUpload]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Comprehensive Grid Testing</h1>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex gap-4 items-center">
            <button
              onClick={runTests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run All Tests
            </button>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {showUpload ? 'Hide' : 'Show'} Upload System
            </button>
            <button
              onClick={() => {
                console.clear();
                console.log('Console cleared. Current grid:', gridConfig);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Console
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    result.passed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <span className={result.passed ? 'text-green-700' : 'text-red-700'}>
                          {result.passed ? '✓' : '✗'}
                        </span>
                        {result.test}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Expected: {result.expected}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        Actual: {result.actual}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-lg font-semibold">
                Score: {testResults.filter((r: any) => r.passed).length}/{testResults.length} tests passed
              </div>
            </div>
          </div>
        )}

        {/* Grid Builder Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Grid Configuration (20-60 cells required)</h2>
          <EnhancedGridBuilder
            studyId="test-comprehensive"
            onGridChange={handleGridChange}
            minCells={20}
            maxCells={60}
            allowColumnManagement={true}
            showAdvancedOptions={true}
          />
        </div>

        {/* Upload System Section */}
        {showUpload && gridConfig && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Stimuli Upload System</h2>
            <StimuliUploadSystem
              studyId="test-comprehensive"
              grid={gridConfig}
              onStimuliComplete={(stimuli) => {
                console.log('Stimuli completed:', stimuli);
              }}
            />
          </div>
        )}

        {/* Grid State Display */}
        {gridConfig && (
          <div className="bg-gray-900 text-gray-100 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Current Grid State</h2>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(gridConfig, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Adjust the grid columns to see validation messages update</li>
            <li>Try to go below 20 cells - should see "Add X more cells" message</li>
            <li>Try to go above 60 cells - should see "Remove X cells" message</li>
            <li>Stay within 20-60 cells - should see green success indicator</li>
            <li>Click "Show Upload System" to test stimuli requirements display</li>
            <li>Open browser console (F12) to see detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}