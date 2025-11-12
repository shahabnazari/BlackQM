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
  CheckCircle2,
  Loader2,
  TrendingUp,
  FileText,
  Sparkles,
} from 'lucide-react';

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
}

interface ProgressiveLoadingIndicatorProps {
  state: ProgressiveLoadingState;
  onCancel?: () => void;
}

// ============================================================================
// Quality Score Stars Component
// ============================================================================

const QualityStars: React.FC<{ score: number }> = ({ score }) => {
  const stars = Math.min(5, Math.max(0, Math.round(score / 20))); // 0-100 → 0-5 stars

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <motion.div
          key={star}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: star * 0.1,
            type: 'spring',
            stiffness: 200,
            damping: 15,
          }}
        >
          <Sparkles
            className={`h-4 w-4 ${
              star <= stars
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            }`}
          />
        </motion.div>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">
        {score.toFixed(0)}/100
      </span>
    </div>
  );
};

// ============================================================================
// Batch Status Badge Component
// ============================================================================

const BatchStatusBadge: React.FC<{
  currentBatch: number;
  totalBatches: number;
  status: ProgressiveLoadingState['status'];
}> = ({ currentBatch, totalBatches, status }) => {
  const isComplete = status === 'complete';
  const isError = status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        isComplete
          ? 'bg-green-100 text-green-700'
          : isError
          ? 'bg-red-100 text-red-700'
          : 'bg-blue-100 text-blue-700'
      }`}
    >
      {status === 'loading' && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {isComplete && <CheckCircle2 className="h-4 w-4" />}
      <span>
        {isComplete
          ? 'Complete'
          : isError
          ? 'Error'
          : `Batch ${currentBatch}/${totalBatches}`}
      </span>
    </motion.div>
  );
};

// ============================================================================
// Progress Bar Component
// ============================================================================

const ProgressBar: React.FC<{
  current: number;
  total: number;
  status: ProgressiveLoadingState['status'];
}> = ({ current, total, status }) => {
  const percentage = Math.min(100, (current / total) * 100);
  const isComplete = status === 'complete';

  return (
    <div className="space-y-2">
      {/* Progress bar container */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        {/* Animated progress bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
          className={`absolute inset-y-0 left-0 rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-green-400 to-green-500'
              : 'bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500'
          }`}
        >
          {/* Shimmer effect during loading */}
          {status === 'loading' && (
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          )}
        </motion.div>

        {/* Pulse effect on active segment */}
        {status === 'loading' && (
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ width: `${percentage}%` }}
            className="absolute inset-y-0 left-0 bg-blue-400 rounded-full"
          />
        )}
      </div>

      {/* Percentage text */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">
          {current.toLocaleString()} / {total.toLocaleString()} papers
        </span>
        <motion.span
          key={percentage}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="font-bold text-blue-600"
        >
          {percentage.toFixed(0)}%
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
                    Loading High-Quality Papers
                  </h3>
                  <p className="text-sm text-gray-600">
                    {status === 'complete'
                      ? 'Search complete! Sorted by quality score'
                      : status === 'error'
                      ? state.errorMessage || 'An error occurred'
                      : 'Searching academic databases and ranking by quality...'}
                  </p>
                </div>
              </div>
              <BatchStatusBadge
                currentBatch={state.currentBatch}
                totalBatches={state.totalBatches}
                status={status}
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-5">
            {/* Progress Bar */}
            <ProgressBar
              current={state.loadedPapers}
              total={state.targetPapers}
              status={status}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Papers Loaded */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-blue-50 rounded-lg p-4 border border-blue-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                    Papers Loaded
                  </span>
                </div>
                <motion.p
                  key={state.loadedPapers}
                  initial={{ scale: 1.2, color: '#2563eb' }}
                  animate={{ scale: 1, color: '#1e293b' }}
                  className="text-2xl font-bold text-gray-900"
                >
                  {state.loadedPapers}
                </motion.p>
              </motion.div>

              {/* Quality Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-green-50 rounded-lg p-4 border border-green-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Avg Quality
                  </span>
                </div>
                <div className="mt-2">
                  <QualityStars score={state.averageQualityScore} />
                </div>
              </motion.div>

              {/* Batch Progress */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-purple-50 rounded-lg p-4 border border-purple-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Loader2
                    className={`h-4 w-4 text-purple-600 ${
                      status === 'loading' ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                    Batch
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {state.currentBatch}/{state.totalBatches}
                </p>
              </motion.div>
            </div>

            {/* Loading Messages by Batch */}
            {status === 'loading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <p className="text-sm text-gray-700">
                  {state.currentBatch === 1 && (
                    <>
                      <span className="font-medium">Batch 1:</span> Loading top
                      20 highest-quality papers from PubMed, Semantic Scholar,
                      and arXiv...
                    </>
                  )}
                  {state.currentBatch === 2 && (
                    <>
                      <span className="font-medium">Batch 2:</span> Loading next
                      80 high-quality papers (quality score {'>'} 70)...
                    </>
                  )}
                  {state.currentBatch === 3 && (
                    <>
                      <span className="font-medium">Batch 3:</span> Loading
                      final 100 papers with quality filtering and ranking...
                    </>
                  )}
                </p>
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

            {/* Success Message */}
            {status === 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    Search Complete!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Loaded {state.loadedPapers} papers with an average quality
                    score of {state.averageQualityScore.toFixed(0)}/100. Papers
                    are sorted by quality, citations, and relevance.
                  </p>
                </div>
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
