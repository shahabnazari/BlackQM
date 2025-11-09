/**
 * Phase 10 Day 19.5: Research Corpus Panel - Iteration Tracking Sidebar
 *
 * World-Class Corpus Management UI
 * Tracks iteration history, cost savings, and theoretical saturation
 *
 * Design Principle: Always visible, progressively informative
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  BookOpen,
  Sparkles,
  Calendar,
  CheckCircle2,
  Info,
  Target,
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IterationHistory {
  iterationNumber: number;
  date: string;
  papersAdded: number;
  totalPapers: number;
  themesFound: number;
  costSpent: number;
  newThemes: number;
  strengthenedThemes: number;
  status: 'completed' | 'in_progress';
}

export interface SaturationMetrics {
  currentSaturation: number; // 0-100
  newThemeRate: number; // % of new themes in last iteration
  confidenceLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface ResearchCorpusPanelProps {
  corpusName: string;
  corpusId: string;
  currentIteration: number;
  totalPapers: number;
  totalThemes: number;
  totalCostSpent: number;
  totalCostSaved: number;
  savingsPercent: number;
  iterationHistory: IterationHistory[];
  saturationMetrics?: SaturationMetrics;
  onViewIteration?: (iteration: number) => void;
  defaultCollapsed?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ResearchCorpusPanel({
  corpusName,
  corpusId: _corpusId,
  currentIteration,
  totalPapers,
  totalThemes,
  totalCostSpent,
  totalCostSaved,
  savingsPercent,
  iterationHistory,
  saturationMetrics,
  onViewIteration,
  defaultCollapsed = false,
}: ResearchCorpusPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Calculate saturation color
  const getSaturationColor = (saturation: number) => {
    if (saturation >= 80) return 'text-green-600';
    if (saturation >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getSaturationBgColor = (saturation: number) => {
    if (saturation >= 80) return 'bg-green-100';
    if (saturation >= 50) return 'bg-yellow-100';
    return 'bg-orange-100';
  };

  return (
    <div className="fixed right-0 top-20 bottom-0 z-40">
      <motion.div
        initial={false}
        animate={{
          width: isCollapsed ? '60px' : '380px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-full bg-white border-l-2 border-purple-200 shadow-2xl overflow-hidden"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-6 -left-3 z-50 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-2 shadow-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="flex flex-col items-center py-8 space-y-6">
            <FlaskConical className="w-6 h-6 text-purple-600" />
            <div className="writing-mode-vertical text-sm font-semibold text-purple-600 transform rotate-180">
              Corpus Panel
            </div>
          </div>
        )}

        {/* Expanded State */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full overflow-y-auto p-6 space-y-6"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FlaskConical className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {corpusName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Iteration {currentIteration}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overview Stats */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  Corpus Overview
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-gray-600">Total Papers</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalPapers}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-gray-600">Themes</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {totalThemes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Tracking */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  Cost Optimization
                </h4>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h5 className="text-sm font-bold text-gray-900">
                      Total Saved
                    </h5>
                  </div>
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    ${totalCostSaved.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {savingsPercent}% savings via caching
                  </p>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-gray-600">Total spent</p>
                    <p className="text-lg font-semibold text-gray-700">
                      ${totalCostSpent.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Saturation Metrics */}
              {saturationMetrics && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Theoretical Saturation
                  </h4>
                  <div
                    className={`rounded-lg p-4 border-2 ${getSaturationBgColor(saturationMetrics.currentSaturation)} ${getSaturationColor(saturationMetrics.currentSaturation).replace('text-', 'border-')}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5" />
                      <h5 className="text-sm font-bold text-gray-900">
                        Saturation Level
                      </h5>
                    </div>
                    <div className="mb-3">
                      <p
                        className={`text-3xl font-bold ${getSaturationColor(saturationMetrics.currentSaturation)}`}
                      >
                        {saturationMetrics.currentSaturation}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Confidence: {saturationMetrics.confidenceLevel}
                      </p>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${getSaturationColor(saturationMetrics.currentSaturation).replace('text-', 'bg-')}`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${saturationMetrics.currentSaturation}%`,
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/50">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-700">
                          {saturationMetrics.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Iteration History */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  Iteration History
                </h4>
                <div className="space-y-2">
                  {iterationHistory
                    .slice()
                    .reverse()
                    .map((iteration) => (
                      <motion.button
                        key={iteration.iterationNumber}
                        onClick={() =>
                          onViewIteration?.(iteration.iterationNumber)
                        }
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          iteration.status === 'in_progress'
                            ? 'bg-blue-50 border-blue-300 animate-pulse'
                            : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {iteration.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            <p className="text-sm font-bold text-gray-900">
                              Iteration {iteration.iterationNumber}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {new Date(iteration.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-600">Papers</p>
                            <p className="font-semibold text-gray-900">
                              +{iteration.papersAdded} (
                              {iteration.totalPapers} total)
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Themes</p>
                            <p className="font-semibold text-gray-900">
                              {iteration.themesFound}{' '}
                              {iteration.newThemes > 0 && (
                                <span className="text-green-600">
                                  (+{iteration.newThemes} new)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {iteration.strengthenedThemes > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-gray-600">
                              {iteration.strengthenedThemes} themes strengthened
                            </span>
                          </div>
                        )}
                      </motion.button>
                    ))}
                </div>
              </div>

              {/* Citation */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                <p>
                  <strong>Methodology:</strong> Theoretical saturation tracking
                  (Glaser & Strauss, 1967). Continue iterations until no new
                  themes emerge.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
