/**
 * Progressive Loading Indicator Component
 * Phase 10.1 Day 7 - Progressive Loading (200 Papers)
 *
 * Beautiful animated UI showing real-time progress for loading 200 high-quality papers
 * in 3 batches: 20 → 100 → 200 papers
 *
 * Features:
 * - Animated progress bar with gradient
 * - Real-time paper count
 * - Batch status (1/3, 2/3, 3/3)
 * - Average quality score with stars
 * - Smooth transitions and animations
 * - Paper card fade-in effects
 *
 * @module ProgressiveLoadingIndicator
 * @since Phase 10.1 Day 7
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Info,
  Database,
  Filter,
  Shield,
} from 'lucide-react';

// ============================================================================
// Constants
// ============================================================================

/**
 * Source name mapping for display
 * Maps backend enum values to user-friendly names
 */
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  pubmed: 'PubMed',
  pmc: 'PMC (PubMed Central)',
  arxiv: 'ArXiv',
  semantic_scholar: 'Semantic Scholar',
  crossref: 'CrossRef',
  eric: 'ERIC',
  ssrn: 'SSRN',
  biorxiv: 'bioRxiv',
  medrxiv: 'medRxiv',
  chemrxiv: 'ChemRxiv',
  google_scholar: 'Google Scholar',
  web_of_science: 'Web of Science',
  scopus: 'Scopus',
  ieee_xplore: 'IEEE Xplore',
  springer: 'SpringerLink',
  nature: 'Nature',
  wiley: 'Wiley Online Library',
  sage: 'SAGE Publications',
  taylor_francis: 'Taylor & Francis',
};

/**
 * Source descriptions for tooltips (developer mode)
 * Explains why a source might return 0 papers
 */
const SOURCE_DESCRIPTIONS: Record<string, string> = {
  pubmed: 'Medical/life sciences (36M+ papers)',
  pmc: 'Free full-text biomedical articles (8M+ papers)',
  arxiv: 'Physics/Math/CS preprints (2M+ papers)',
  semantic_scholar: 'AI-powered academic search (200M+ papers)',
  crossref: 'DOI registry across all disciplines (150M+ records)',
  eric: 'Education research database (1.5M+ papers)',
  ssrn: 'Social science research network (1M+ papers)',
  biorxiv: 'Biology preprints (220k papers)',
  medrxiv: 'Medical preprints (45k papers)',
  chemrxiv: 'Chemistry preprints (35k papers)',
  google_scholar: 'Multi-source aggregator (400M+ papers)',
};

// ============================================================================
// Types
// ============================================================================

export interface ProgressiveLoadingState {
  /** Whether progressive loading is active */
  isActive: boolean;
  /** Current batch number (1, 2, or 3) */
  currentBatch: number;
  /** Total number of batches */
  totalBatches: number;
  /** Number of papers loaded so far */
  loadedPapers: number;
  /** Target number of papers (200) */
  targetPapers: number;
  /** Average quality score (0-100) */
  averageQualityScore: number;
  /** Loading status */
  status: 'idle' | 'loading' | 'complete' | 'error';
  /** Error message if status is 'error' */
  errorMessage?: string;
  /** Current stage: 1 = collecting, 2 = filtering */
  currentStage?: 1 | 2;
  /** Smooth time-based percentage for animation (0-100) */
  visualPercentage?: number;
  /** Stage 1 metadata (from backend) */
  stage1?: {
    totalCollected: number;
    sourcesSearched: number;
    sourceBreakdown: Record<string, number | { papers: number; duration: number }>;
  };
  /** Stage 2 metadata (from backend) */
  stage2?: {
    startingPapers: number;
    afterEnrichment: number;
    afterRelevanceFilter: number;
    finalSelected: number;
  };
}

interface ProgressiveLoadingIndicatorProps {
  state: ProgressiveLoadingState;
  onCancel?: () => void;
}

// ============================================================================
// 🎯 ENTERPRISE-GRADE Progress Bar with TWO-STAGE Heat Map & Dynamic Counter
// ============================================================================

const ProgressBar: React.FC<{
  current: number;
  total: number;
  status: ProgressiveLoadingState['status'];
  currentStage?: 1 | 2;
  visualPercentage?: number;
  stage1TotalCollected?: number;
  stage2FinalSelected?: number;
  stage1?: {
    totalCollected: number;
    sourcesSearched: number;
    sourceBreakdown: Record<string, number | { papers: number; duration: number }>;
  };
}> = ({ current, total, status, currentStage = 1, visualPercentage, stage1TotalCollected, stage2FinalSelected, stage1 }) => {
  // Phase 10.7 Day 6.2: Edge case handling - Clamp values to safe ranges
  const safeCurrent = Math.max(0, Math.min(current, total));
  
  // 🎯 ENTERPRISE FIX: Use time-based visualPercentage for smooth animation
  // If visualPercentage is provided (from time-based animation), use it
  // Otherwise fall back to calculating from current/total
  let percentage: number;
  if (visualPercentage !== undefined) {
    // Use smooth time-based percentage
    percentage = Math.max(0, Math.min(100, visualPercentage));
  } else {
    // Fallback: Calculate from current/total (for edge cases)
    const safeTotal = Math.max(1, total);
    const rawPercentage = (safeCurrent / safeTotal) * 100;
    const unclamped = currentStage === 1
      ? rawPercentage / 2              // Stage 1: 0-50%
      : 50 + (rawPercentage / 2);      // Stage 2: 50-100%
    percentage = Math.max(0, Math.min(100, unclamped));
  }
  
  const isComplete = status === 'complete';
  
  // 🎯 ENTERPRISE: Format large numbers (K, M notation)
  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 100000) return `${Math.round(count / 1000)}K`;
    if (count >= 10000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  // 🎯 CRITICAL FIX: Counter shows REAL backend data, NO animation until data available
  const displayCount = React.useMemo(() => {
    // 🚨 CRITICAL FIX: If no backend data, return null (not 0) to show loading state
    if (!stage1TotalCollected && !stage2FinalSelected) {
      return null; // null means "waiting for data" - will show loading state
    }

    if (isComplete && stage2FinalSelected) {
      // Complete: Show REAL final selected count from backend
      return stage2FinalSelected;
    }

    // ✅ Only interpolate if we have REAL backend data
    if (currentStage === 1 && stage1TotalCollected) {
      // Stage 1 (0-50%): Count UP from 0 to REAL stage1TotalCollected
      const stage1Percent = Math.min(1, (percentage / 50)); // 0-50% → 0-1
      const count = Math.round(stage1TotalCollected * stage1Percent);
      return Math.max(0, Math.min(count, stage1TotalCollected));
    } else if (currentStage === 2 && stage1TotalCollected && stage2FinalSelected) {
      // Stage 2 (50-100%): Count DOWN from REAL stage1TotalCollected to REAL stage2FinalSelected
      const stage2Percent = Math.min(1, ((percentage - 50) / 50)); // 50-100% → 0-1
      const count = Math.round(stage1TotalCollected - (stage1TotalCollected - stage2FinalSelected) * stage2Percent);
      return Math.max(stage2FinalSelected, Math.min(count, stage1TotalCollected));
    }

    // Fallback: show actual current if no metadata available yet
    return safeCurrent;
  }, [isComplete, currentStage, percentage, stage1TotalCollected, stage2FinalSelected, safeCurrent]);

  // 🎯 HEAT MAP: Light Green → Red (middle) → Green (end)
  // Stage 1 (0-50%): Light Green → Yellow → Orange → RED (heating up)
  // Stage 2 (50-100%): Red → Orange → Yellow → Green (cooling down)
  const getHeatMapGradient = () => {
    if (isComplete) {
      return 'from-green-400 via-emerald-500 to-green-600'; // Complete ✅
    }
    
    // Use percentage for smooth transitions
    if (percentage < 50) {
      // Stage 1: Light Green → Red (heating up) 🔥
      if (percentage < 12.5) {
        return 'from-green-300 via-emerald-400 to-teal-400'; // Light Green start
      } else if (percentage < 25) {
        return 'from-teal-400 via-lime-500 to-yellow-400'; // Green → Yellow
      } else if (percentage < 37.5) {
        return 'from-yellow-400 via-amber-500 to-orange-500'; // Yellow → Orange
      } else {
        return 'from-orange-500 via-red-500 to-red-600'; // Orange → RED 🔥
      }
    } else {
      // Stage 2: Red → Green (cooling down) ❄️
      if (percentage < 62.5) {
        return 'from-red-500 via-red-600 to-orange-500'; // RED → Orange
      } else if (percentage < 75) {
        return 'from-orange-400 via-amber-500 to-yellow-500'; // Orange → Yellow
      } else if (percentage < 87.5) {
        return 'from-yellow-400 via-lime-500 to-green-400'; // Yellow → Light Green
      } else {
        return 'from-green-400 via-emerald-500 to-green-500'; // Final Green ✅
      }
    }
  };

  // Phase 10.7 Day 6.2: BUG FIX #1 - Division by zero protection
  if (total === 0 || total < 0) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-500 text-center py-4">
          Initializing search...
        </div>
      </div>
    );
  }
  
  // BUG FIX #21: Zero results handling
  if (isComplete && (stage2FinalSelected === 0 || (stage1TotalCollected === 0 && stage2FinalSelected === undefined))) {
    return (
      <div className="space-y-3">
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-sm font-medium text-gray-700">No papers found</div>
          <div className="text-xs text-gray-500 mt-1">Try adjusting your search query</div>
          <div className="text-xs text-gray-400 mt-2">
            • Use broader terms<br/>
            • Check spelling<br/>
            • Try different keywords
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 🎯 HEAT MAP Progress Bar with Counter Badge */}
      <div 
        className="relative h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-visible shadow-inner"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Search progress: ${Math.round(percentage)}% complete, Stage ${currentStage} of 2`}
      >
        {/* Main progress fill with heat map gradient */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getHeatMapGradient()} shadow-lg`}
        >
          {/* 🎯 DYNAMIC COUNTER BADGE - Sticks to end of bar! */}
          {/* Only show counter if we have backend data */}
          {displayCount !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                color: isComplete ? '#10b981' : currentStage === 1 ? '#ef4444' : '#10b981',
              }}
              transition={{ 
                duration: 0.3,
                color: { duration: 0.8, ease: 'easeInOut' },
              }}
              className="absolute -top-8 px-3 py-1 bg-white rounded-full shadow-lg border-2 border-current transition-transform duration-300"
              style={{
                // Smart positioning: adjust for low percentages
                right: percentage < 5 ? '0px' : '-8px',
                transform: percentage < 2 ? 'translateX(-50%)' : 'translateX(0)',
              }}
            >
              <motion.span
                key={displayCount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-xs font-bold whitespace-nowrap"
              >
                {formatCount(displayCount)}
                {isComplete && ' 👍'}
              </motion.span>
            </motion.div>
          )}

          {/* Shimmer effect during loading */}
          {status === 'loading' && (
            <motion.div
              initial={{ opacity: 1, x: '-200%' }}
              animate={{
                x: ['-200%', '200%'],
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                x: { duration: 2, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 0.5 },
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              style={{ width: '50%' }}
            />
          )}

          {/* Glow effect */}
          {status === 'loading' && (
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-white/20 rounded-full blur-sm"
            />
          )}
        </motion.div>
      </div>

      {/* Status text and percentage */}
      <div className="flex items-center justify-between">
        <motion.span
          key={`${currentStage}-${Math.round(percentage)}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm font-semibold text-gray-700"
        >
          {/* 🎯 ENTERPRISE: CLEAR MESSAGES WITH REAL BACKEND NUMBERS ONLY */}
          {percentage === 0 ? (
            'Starting search...'
          ) : percentage < 1 ? (
            stage1?.sourcesSearched 
              ? `Fetching eligible papers from ${stage1.sourcesSearched} sources...`
              : 'Connecting to academic databases...'
          ) : percentage < 49 ? (
            stage1?.sourcesSearched
              ? `Stage 1: Fetching eligible papers from ${stage1.sourcesSearched} sources`
              : 'Stage 1: Fetching eligible papers'
          ) : percentage === 50 || (percentage > 49 && percentage < 51) ? (
            stage1TotalCollected
              ? `✅ Fetched ${stage1TotalCollected.toLocaleString()} papers - Starting quality filtering...`
              : 'Starting quality filtering...'
          ) : percentage < 100 ? (
            'Stage 2: Filtering to highest quality papers'
          ) : (
            stage2FinalSelected
              ? `✅ Finalized ${stage2FinalSelected.toLocaleString()} high-quality papers`
              : 'Search complete!'
          )}
        </motion.span>
        <motion.span
          key={percentage.toFixed(1)}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`text-sm font-bold ${
            isComplete ? 'text-green-600' : 'text-blue-600'
          }`}
        >
          {percentage === 0 
            ? '0%'
            : percentage < 1 
            ? `${percentage.toFixed(1)}%`
            : `${Math.ceil(percentage)}%`
          }
        </motion.span>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ProgressiveLoadingIndicator: React.FC<
  ProgressiveLoadingIndicatorProps
> = ({ state, onCancel }) => {
  const { isActive, status } = state;

  // 🔍 DIAGNOSTIC: Log state changes
  React.useEffect(() => {
    console.log('🎨 [ProgressiveLoadingIndicator] State updated:', {
      isActive,
      status,
      currentStage: state.currentStage,
      visualPercentage: state.visualPercentage,
      loadedPapers: state.loadedPapers,
      targetPapers: state.targetPapers,
      hasStage1: !!state.stage1,
      hasStage2: !!state.stage2,
      stage1TotalCollected: state.stage1?.totalCollected,
      stage2FinalSelected: state.stage2?.finalSelected,
    });
  }, [state, isActive, status]);

  // 🎯 Map stage1/stage2 data to searchMetadata format for transparency panel
  const searchMetadata = React.useMemo(() => {
    if (!state.stage1 || !state.stage2) return undefined;
    
    return {
      sourcesQueried: state.stage1.sourcesSearched || 7,
      sourcesWithResults: state.stage1.sourceBreakdown
        ? Object.values(state.stage1.sourceBreakdown).filter(countData => {
            const count = typeof countData === 'number' ? countData : countData.papers;
            return count > 0;
          }).length
        : 0,
      totalCollected: state.stage1.totalCollected || 0,
      uniqueAfterDedup: state.stage2.afterEnrichment || state.stage1.totalCollected || 0,
      finalSelected: state.stage2.finalSelected || 0,
      sourceBreakdown: state.stage1.sourceBreakdown,
    };
  }, [state.stage1, state.stage2]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-6"
      >
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    rotate: status === 'loading' ? 360 : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: status === 'loading' ? Infinity : 0,
                    ease: 'linear',
                  }}
                >
                  <FileText className="h-6 w-6 text-blue-600" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {status === 'complete' 
                      ? `Found ${state.stage2?.finalSelected?.toLocaleString() || state.loadedPapers} High-Quality Papers`
                      : 'Searching Academic Databases'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {status === 'complete'
                      ? `From ${state.stage1?.sourcesSearched || 7} academic sources`
                      : status === 'error'
                      ? state.errorMessage || 'An error occurred'
                      : 'Two-stage filtering: Collection → Quality ranking'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            {/* Progress Bar */}
            <ProgressBar
              current={state.loadedPapers}
              total={state.targetPapers}
              status={status}
              currentStage={state.currentStage || 1}
              {...(state.visualPercentage !== undefined && { visualPercentage: state.visualPercentage })}
              {...(state.stage1?.totalCollected !== undefined && { stage1TotalCollected: state.stage1.totalCollected })}
              {...(state.stage2?.finalSelected !== undefined && { stage2FinalSelected: state.stage2.finalSelected })}
              {...(state.stage1 && { stage1: state.stage1 })}
            />

            {/* 🎯 DETAILED SOURCE BREAKDOWN - Shows which sources are being used */}
            {state.stage1?.sourceBreakdown && Object.keys(state.stage1.sourceBreakdown).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">
                    Sources Queried ({Object.keys(state.stage1.sourceBreakdown).length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {Object.entries(state.stage1.sourceBreakdown)
                    .sort(([, a], [, b]) => {
                      const countA = typeof a === 'number' ? a : a.papers;
                      const countB = typeof b === 'number' ? b : b.papers;
                      return countB - countA;
                    })
                    .map(([source, countData]) => {
                      const count = typeof countData === 'number' ? countData : countData.papers;
                      const total = state.stage1?.totalCollected || 1;
                      const percentage = ((count / total) * 100).toFixed(1);
                      const displaySource = SOURCE_DISPLAY_NAMES[source.toLowerCase()] || source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      const sourceDescription = SOURCE_DESCRIPTIONS[source.toLowerCase()] || '';

                      return (
                        <div key={source} className="flex items-center gap-2" title={sourceDescription}>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-medium ${count === 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                                {displaySource}
                                {count === 0 && (
                                  <span className="ml-1.5 text-xs text-amber-600" title={`No results - ${sourceDescription || 'May not index content for this query'}`}>
                                    ⚠️
                                  </span>
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
                                transition={{ duration: 0.6, ease: 'easeOut' }}
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
                {Object.values(state.stage1.sourceBreakdown).some(countData => {
                  const count = typeof countData === 'number' ? countData : countData.papers;
                  return count === 0;
                }) && (
                  <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <div className="font-medium mb-1">⚠️ Some sources returned 0 papers</div>
                    <div className="text-amber-600">
                      This is normal - databases specialize in different fields. Hover over the ⚠️ icon to see each source's specialty.
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Cancel Button */}
            {status === 'loading' && onCancel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel Search
                </button>
              </motion.div>
            )}

             {/* Old "Search Complete!" message removed - replaced with source breakdown above */}

             {/* 🎯 SEARCH TRANSPARENCY SUMMARY - Appears after completion */}
             {status === 'complete' && searchMetadata && (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3, duration: 0.5 }}
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
                       {searchMetadata.totalCollected > 0 
                         ? Math.round(((searchMetadata.totalCollected - searchMetadata.uniqueAfterDedup) / searchMetadata.totalCollected) * 100)
                         : 0}% duplicates removed
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
                 {searchMetadata && searchMetadata.sourceBreakdown && Object.keys(searchMetadata.sourceBreakdown).length > 0 && (
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
                           const displaySource = SOURCE_DISPLAY_NAMES[source.toLowerCase()] || source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                           const sourceDescription = SOURCE_DESCRIPTIONS[source.toLowerCase()] || '';
                           const isZeroPapers = count === 0;

                           return (
                             <motion.div
                               key={source}
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.4 + index * 0.05 }}
                               className="flex items-center gap-3"
                               title={isZeroPapers ? `No results - ${sourceDescription || 'May not index content for this query'}` : sourceDescription}
                             >
                               <div className="flex-1">
                                 <div className="flex items-center justify-between mb-1">
                                   <span className={`text-xs font-medium ${isZeroPapers ? 'text-amber-600' : 'text-gray-700'}`}>
                                     {displaySource}
                                     {isZeroPapers && (
                                       <span className="ml-1.5 text-xs text-amber-600" title={`${sourceDescription || 'Database'} - No matching papers for this query`}>
                                         ⚠️
                                       </span>
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
                                       transition={{ duration: 0.8, delay: 0.4 + index * 0.05 }}
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
             )}
           </div>
         </div>
       </motion.div>
     </AnimatePresence>
   );
 };

// ============================================================================
// Export
// ============================================================================

export default ProgressiveLoadingIndicator;
