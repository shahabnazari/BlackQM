/**
 * SourceBreakdown Component
 * Phase 10.91 Day 11 - Component Refactoring
 *
 * Displays detailed breakdown of papers from each academic source during search.
 * Features:
 * - Source name with tooltips
 * - Paper count and percentage per source
 * - Mini progress bars
 * - Warning for sources with 0 papers
 * - Source descriptions on hover
 *
 * @module progress/SourceBreakdown
 * @since Phase 10.91 Day 11
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Database, HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { SOURCE_DISPLAY_NAMES, SOURCE_DESCRIPTIONS, ANIMATION_DELAYS, ANIMATION_DURATIONS } from './constants';

// ============================================================================
// Types
// ============================================================================

interface SourceBreakdownProps {
  /** Source breakdown data from backend */
  sourceBreakdown: Record<string, number | { papers: number; duration: number }>;
  /** Total papers collected */
  totalCollected: number;
  /** Loading status */
  status: 'idle' | 'loading' | 'complete' | 'error';
}

// ============================================================================
// Component
// ============================================================================

export const SourceBreakdown: React.FC<SourceBreakdownProps> = ({
  sourceBreakdown,
  totalCollected,
  status,
}) => {
  // Don't show during complete status
  if (status === 'complete' || !sourceBreakdown || Object.keys(sourceBreakdown).length === 0) {
    return null;
  }

  const hasZeroPapers = Object.values(sourceBreakdown).some(countData => {
    const count = typeof countData === 'number' ? countData : countData.papers;
    return count === 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ANIMATION_DELAYS.COMPONENT_ENTRY }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-900">
          Sources Queried ({Object.keys(sourceBreakdown).length})
        </h4>
      </div>

      <div className="space-y-2">
        {Object.entries(sourceBreakdown)
          .sort(([, a], [, b]) => {
            const countA = typeof a === 'number' ? a : a.papers;
            const countB = typeof b === 'number' ? b : b.papers;
            return countB - countA;
          })
          .map(([source, countData]) => {
            const count = typeof countData === 'number' ? countData : countData.papers;
            const total = totalCollected || 1;
            const percentage = ((count / total) * 100).toFixed(1);
            const displaySource = SOURCE_DISPLAY_NAMES[source.toLowerCase()] ||
              source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const sourceDescription = SOURCE_DESCRIPTIONS[source.toLowerCase()] || '';

            return (
              <div key={source} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${count === 0 ? 'text-amber-600' : 'text-gray-700'} flex items-center gap-1`}>
                      {displaySource}
                      {count === 0 && (
                        <Tooltip
                          content={
                            <div className="max-w-xs">
                              <div className="font-semibold mb-1">{displaySource}</div>
                              <div className="text-xs">{sourceDescription || 'May not index content for this query'}</div>
                              <div className="text-xs mt-1 text-gray-300">This is normal - databases specialize in different fields.</div>
                            </div>
                          }
                          position="top"
                        >
                          <span className="inline-flex items-center cursor-help text-amber-600">
                            ⚠️
                          </span>
                        </Tooltip>
                      )}
                      {count > 0 && sourceDescription && (
                        <Tooltip
                          content={
                            <div className="max-w-xs text-xs">
                              {sourceDescription}
                            </div>
                          }
                          position="top"
                        >
                          <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                        </Tooltip>
                      )}
                    </span>
                    <span className={`text-xs font-semibold ${count === 0 ? 'text-gray-400' : 'text-blue-600'}`}>
                      {count.toLocaleString()} papers ({percentage}%)
                    </span>
                  </div>

                  {/* Mini progress bar for each source */}
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: ANIMATION_DURATIONS.SLOW * 0.75, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        count === 0
                          ? 'bg-gray-400'
                          : count > total * 0.3
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          : count > total * 0.1
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Info panel for sources with 0 papers */}
      {hasZeroPapers && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <div className="font-medium mb-1">⚠️ Some sources returned 0 papers</div>
          <div className="text-amber-600">
            This is normal - databases specialize in different fields. Hover over ⚠️ or <HelpCircle className="inline w-3 h-3" /> icons for details.
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SourceBreakdown;
