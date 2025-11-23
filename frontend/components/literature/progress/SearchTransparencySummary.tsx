/**
 * SearchTransparencySummary Component
 * Phase 10.91 Day 11 - Component Refactoring
 *
 * Displays detailed summary after search completion showing how papers were found.
 * Features:
 * - Stats grid (sources, collected, unique, selected)
 * - Source breakdown with percentages
 * - Duplicate detection statistics
 * - Animated entry
 *
 * @module progress/SearchTransparencySummary
 * @since Phase 10.91 Day 11
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info, Database, Filter, Shield, HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { SOURCE_DISPLAY_NAMES, SOURCE_DESCRIPTIONS, ANIMATION_DELAYS, ANIMATION_DURATIONS } from './constants';

// ============================================================================
// Types
// ============================================================================

interface SearchMetadata {
  sourcesQueried: number;
  sourcesWithResults: number;
  totalCollected: number;
  uniqueAfterDedup: number;
  finalSelected: number;
  sourceBreakdown?: Record<string, number | { papers: number; duration: number }>;
}

interface SearchTransparencySummaryProps {
  /** Search metadata from backend */
  searchMetadata: SearchMetadata;
  /** Loading status */
  status: 'idle' | 'loading' | 'complete' | 'error';
}

// ============================================================================
// Component
// ============================================================================

export const SearchTransparencySummary: React.FC<SearchTransparencySummaryProps> = ({
  searchMetadata,
  status,
}) => {
  // Only show when search is complete
  if (status !== 'complete' || !searchMetadata) {
    return null;
  }

  const duplicatePercentage = searchMetadata.totalCollected > 0
    ? Math.round(((searchMetadata.totalCollected - searchMetadata.uniqueAfterDedup) / searchMetadata.totalCollected) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ANIMATION_DELAYS.TRANSPARENCY_SUMMARY, duration: ANIMATION_DURATIONS.STANDARD }}
      className="mt-5 pt-5 border-t border-gray-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-5 w-5 text-blue-600" />
        <h4 className="font-semibold text-gray-900">
          How We Found These Papers
        </h4>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Sources */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
              Sources
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {searchMetadata.sourcesWithResults}/{searchMetadata.sourcesQueried}
          </div>
          <div className="text-xs text-gray-600">databases with papers</div>
        </div>

        {/* Collected */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
              Collected
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {searchMetadata.totalCollected.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">from all sources</div>
        </div>

        {/* Unique */}
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <Filter className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">
              Unique
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {searchMetadata.uniqueAfterDedup.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">
            {duplicatePercentage}% duplicates removed
          </div>
        </div>

        {/* Selected */}
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">
              Selected
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {searchMetadata.finalSelected.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600">by quality score</div>
        </div>
      </div>

      {/* Source Breakdown */}
      {searchMetadata.sourceBreakdown && Object.keys(searchMetadata.sourceBreakdown).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-3">
            Papers per source:
          </p>
          <div className="space-y-2">
            {Object.entries(searchMetadata.sourceBreakdown)
              .sort(([, a], [, b]) => {
                const countA = typeof a === 'number' ? a : a.papers;
                const countB = typeof b === 'number' ? b : b.papers;
                return countB - countA;
              })
              .map(([source, countData], index) => {
                const count = typeof countData === 'number' ? countData : countData.papers;
                const percentage = searchMetadata.totalCollected > 0
                  ? (count / searchMetadata.totalCollected) * 100
                  : 0;
                const displaySource = SOURCE_DISPLAY_NAMES[source.toLowerCase()] ||
                  source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const sourceDescription = SOURCE_DESCRIPTIONS[source.toLowerCase()] || '';
                const isZeroPapers = count === 0;

                return (
                  <motion.div
                    key={source}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ANIMATION_DELAYS.BASE + index * ANIMATION_DELAYS.STAGGER }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${isZeroPapers ? 'text-amber-600' : 'text-gray-700'} flex items-center gap-1`}>
                          {displaySource}
                          {isZeroPapers && (
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
                          {!isZeroPapers && sourceDescription && (
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
                        <span className={`text-xs font-bold ${isZeroPapers ? 'text-gray-400' : 'text-gray-900'}`}>
                          {count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        {isZeroPapers ? (
                          <div className="h-full w-full bg-gray-300 rounded-full" />
                        ) : (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{
                              duration: ANIMATION_DURATIONS.SLOW,
                              delay: ANIMATION_DELAYS.BASE + index * ANIMATION_DELAYS.STAGGER
                            }}
                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                          />
                        )}
                      </div>
                    </div>
                    <span className={`text-xs w-12 text-right ${isZeroPapers ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isZeroPapers ? '0%' : `${percentage.toFixed(0)}%`}
                    </span>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SearchTransparencySummary;
