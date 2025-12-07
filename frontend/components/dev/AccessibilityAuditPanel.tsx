/**
 * Accessibility Audit Panel
 * Phase 10.8 Day 5-6: Development tool for testing accessibility
 * 
 * Enterprise-grade accessibility testing dashboard for development
 * environment. Provides real-time WCAG compliance checking.
 * 
 * @since Phase 10.8 Day 5-6
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  runAccessibilityAudit,
  formatAuditReport,
  exportAuditReportJSON,
  type AccessibilityReport,
  type AccessibilityTestResult
} from '@/lib/utils/accessibility-testing';

/**
 * Development-only accessibility audit panel
 * Shows real-time WCAG compliance status
 */
export function AccessibilityAuditPanel() {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // Run audit (memoized to prevent recreating on every render)
  const runAudit = useCallback(() => {
    setIsRunning(true);
    
    // Run audit in next tick to allow UI to update
    const timeoutId = setTimeout(() => {
      try {
        const result = runAccessibilityAudit();
        setReport(result);
      } catch (error) {
        console.error('Audit failed:', error);
      } finally {
        setIsRunning(false);
      }
    }, 100);

    // Return cleanup function
    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-run on mount and when autoRun changes
  useEffect((): void | (() => void) => {
    if (autoRun) {
      const cleanup = runAudit();
      const interval = setInterval(runAudit, 30000); // Every 30 seconds
      return () => {
        clearInterval(interval);
        cleanup?.(); // Cleanup any pending timeout
      };
    }
    // Phase 10.106: No cleanup needed when autoRun is false
  }, [autoRun, runAudit]);

  // Export report (memoized)
  const exportReport = useCallback(() => {
    if (!report) return;
    
    const json = exportAuditReportJSON(report);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-audit-${report.timestamp.toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  // Copy report to clipboard (memoized)
  const copyReport = useCallback(() => {
    if (!report) return;
    
    const text = formatAuditReport(report);
    navigator.clipboard.writeText(text).catch((error) => {
      console.error('Failed to copy report:', error);
    });
  }, [report]);

  // Get compliance badge color
  const getComplianceBadgeColor = (compliance: string) => {
    switch (compliance) {
      case 'PASS': return 'bg-green-500';
      case 'WARNING': return 'bg-yellow-500';
      case 'FAIL': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get test result icon
  const getTestIcon = (result: AccessibilityTestResult) => {
    if (result.passed) return '✅';
    if (result.issues && result.issues.length > 0) return '❌';
    return '⚠️';
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-2xl">
      {/* Minimized view */}
      {!showDetails && (
        <button
          onClick={() => setShowDetails(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
          aria-label="Show accessibility audit panel"
        >
          🔍 A11y Audit
          {report && (
            <span className={`ml-2 inline-block w-3 h-3 rounded-full ${getComplianceBadgeColor(report.overallCompliance)}`} />
          )}
        </button>
      )}

      {/* Expanded view */}
      {showDetails && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <div>
                <h3 className="font-bold text-lg">Accessibility Audit</h3>
                <p className="text-xs text-blue-100">WCAG 2.1 Compliance Testing</p>
              </div>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Minimize panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 flex-wrap">
            <button
              onClick={runAudit}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Run Audit
                </>
              )}
            </button>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-run (30s)</span>
            </label>

            {report && (
              <>
                <button
                  onClick={exportReport}
                  className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Export report as JSON"
                >
                  📥 Export JSON
                </button>
                <button
                  onClick={copyReport}
                  className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Copy report to clipboard"
                >
                  📋 Copy
                </button>
              </>
            )}
          </div>

          {/* Report */}
          <div className="overflow-y-auto flex-1 p-4">
            {!report && !isRunning && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">No audit results yet</p>
                <p className="text-sm">Click "Run Audit" to test accessibility compliance</p>
              </div>
            )}

            {isRunning && (
              <div className="text-center py-12">
                <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">Running accessibility audit...</p>
              </div>
            )}

            {report && (
              <div className="space-y-4">
                {/* Overall Status */}
                <div className={`p-4 rounded-lg ${
                  report.overallCompliance === 'PASS' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                  report.overallCompliance === 'WARNING' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                  'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">
                      {report.overallCompliance === 'PASS' && '✅ WCAG AA Compliant'}
                      {report.overallCompliance === 'WARNING' && '⚠️ Needs Review'}
                      {report.overallCompliance === 'FAIL' && '❌ Non-Compliant'}
                    </h4>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(report.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Level A:</span>{' '}
                      <span className="font-semibold">{report.levelACompliance ? '✅' : '❌'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Level AA:</span>{' '}
                      <span className="font-semibold">{report.levelAACompliance ? '✅' : '❌'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Level AAA:</span>{' '}
                      <span className="font-semibold">{report.levelAAACompliance ? '✅' : '⚠️'}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <div className="text-3xl font-bold text-green-700 dark:text-green-400">{report.passedTests}</div>
                    <div className="text-xs text-green-600 dark:text-green-500">Passed</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                    <div className="text-3xl font-bold text-red-700 dark:text-red-400">{report.failedTests}</div>
                    <div className="text-xs text-red-600 dark:text-red-500">Failed</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                    <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{report.warningTests}</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-500">Warnings</div>
                  </div>
                </div>

                {/* Test Results */}
                <div className="space-y-2">
                  <h5 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Test Results</h5>
                  {report.results.map((result, index) => (
                    <details
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <summary className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{getTestIcon(result)}</span>
                          <div>
                            <div className="font-medium text-sm">{result.category}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {result.criterion} • Level {result.wcagLevel}
                            </div>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{result.description}</p>
                        
                        {result.issues && result.issues.length > 0 && (
                          <div className="mb-3">
                            <h6 className="font-semibold text-red-700 dark:text-red-400 mb-2">❌ Issues:</h6>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-xs">
                              {result.issues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {result.recommendations && result.recommendations.length > 0 && (
                          <div>
                            <h6 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">💡 Recommendations:</h6>
                            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-xs">
                              {result.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Export for use in development layout
 */
export default AccessibilityAuditPanel;

