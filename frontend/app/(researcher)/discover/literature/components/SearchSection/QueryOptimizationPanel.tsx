/**
 * Phase 10.113 Week 9: Query Optimization Panel
 *
 * Netflix-grade component for scientific query optimization mode selection.
 * Allows users to choose expansion mode for A/B testable query optimization.
 *
 * Features:
 * - Mode selection (none, local, enhanced, ai)
 * - Real-time optimization preview
 * - Effectiveness comparison display
 * - Quality score visualization
 *
 * @module LiteratureSearch
 * @since Phase 10.113 Week 9
 */

'use client';

import React, { useCallback, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  FileText,
  Beaker,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import * as ScientificQueryAPI from '@/lib/api/services/scientific-query-api.service';
import type {
  QueryExpansionMode,
  QueryOptimizationResponse,
} from '@/lib/api/services/scientific-query-api.service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Mode configurations with icons and descriptions
 */
const MODE_CONFIG: Record<
  QueryExpansionMode,
  {
    icon: React.ReactNode;
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    latency: string;
  }
> = {
  none: {
    icon: <FileText className="w-4 h-4" />,
    name: 'Original',
    description: 'No modifications - baseline for comparison',
    pros: ['Fastest response', 'No AI bias', 'Full control'],
    cons: ['May miss synonyms', 'No spell correction'],
    latency: '< 100ms',
  },
  local: {
    icon: <Settings2 className="w-4 h-4" />,
    name: 'Local',
    description: 'Spell-check and normalization',
    pros: ['Fast', 'Fixes typos', 'No AI cost'],
    cons: ['Limited expansion', 'No domain terms'],
    latency: '< 200ms',
  },
  enhanced: {
    icon: <Beaker className="w-4 h-4" />,
    name: 'Enhanced',
    description: 'Local + methodology and controversy terms',
    pros: ['Academic focus', 'Q-methodology aware', 'Moderate latency'],
    cons: ['May add unexpected terms', 'Medium complexity'],
    latency: '< 500ms',
  },
  // Note: 'ai' mode removed - AI suggestions are already provided automatically
  // in the search dropdown while typing. This panel focuses on non-AI optimization.
  ai: {
    icon: <Brain className="w-4 h-4" />,
    name: 'AI Powered',
    description: 'Full GPT-4 expansion with domain knowledge',
    pros: ['Best coverage', 'Smart synonyms', 'Domain expertise'],
    cons: ['Highest latency', 'API cost', 'Potential over-expansion'],
    latency: '1-5s',
  },
};

/**
 * Modes to display in the UI (excludes 'ai' since AI suggestions are automatic)
 */
const DISPLAYED_MODES: QueryExpansionMode[] = ['none', 'local', 'enhanced'];

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface QueryOptimizationPanelProps {
  /** Current search query */
  query: string;
  /** Callback when optimization is applied */
  onOptimize: (optimizedQuery: string, mode: QueryExpansionMode) => void;
  /** Whether to show the panel expanded by default */
  defaultExpanded?: boolean;
  /** Optional class name */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const QueryOptimizationPanel = memo(function QueryOptimizationPanel({
  query,
  onOptimize,
  defaultExpanded = false,
  className = '',
}: QueryOptimizationPanelProps) {
  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedMode, setSelectedMode] = useState<QueryExpansionMode>('local');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<QueryOptimizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Handle mode selection change
   */
  const handleModeChange = useCallback((mode: string) => {
    setSelectedMode(mode as QueryExpansionMode);
    setOptimizationResult(null);
    setError(null);
  }, []);

  /**
   * Handle optimize button click
   */
  const handleOptimize = useCallback(async () => {
    if (!query.trim()) {
      setError('Please enter a search query first');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    try {
      logger.debug('Optimizing query', 'QueryOptimizationPanel', { query, mode: selectedMode });

      const result = await ScientificQueryAPI.optimizeQuery(query, selectedMode);
      setOptimizationResult(result);

      if (result.shouldProceed) {
        logger.debug('Optimization complete', 'QueryOptimizationPanel', {
          original: result.originalQuery,
          optimized: result.optimizedQuery,
          qualityScore: result.quality.qualityScore,
        });
      } else {
        logger.warn('Optimization suggests not proceeding', 'QueryOptimizationPanel', {
          warning: result.warningMessage,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed';
      logger.error('Query optimization failed', 'QueryOptimizationPanel', { error: errorMessage });
      setError(errorMessage);
    } finally {
      setIsOptimizing(false);
    }
  }, [query, selectedMode]);

  /**
   * Handle apply optimized query
   */
  const handleApply = useCallback(() => {
    if (optimizationResult) {
      onOptimize(optimizationResult.optimizedQuery, optimizationResult.mode);
      setOptimizationResult(null);
    }
  }, [optimizationResult, onOptimize]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Clear result when query changes
  useEffect(() => {
    setOptimizationResult(null);
    setError(null);
  }, [query]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const modeInfo = MODE_CONFIG[selectedMode];
  const qualityIndicator = optimizationResult
    ? ScientificQueryAPI.getQualityIndicator(optimizationResult.quality.qualityScore)
    : null;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="query-optimization-panel"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-900">
            Query Pre-Processing
          </span>
          <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
            Non-AI Options
          </Badge>
          <span className="text-xs text-gray-500 ml-auto hidden sm:inline">
            💡 AI suggestions appear automatically while typing
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div id="query-optimization-panel" className="px-4 pb-4 space-y-4 border-t border-gray-200">
              {/* Mode Selection */}
              <div className="pt-4">
                <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                  Select Optimization Mode
                </Label>
                <RadioGroup
                  value={selectedMode}
                  onValueChange={handleModeChange}
                  className="grid grid-cols-3 gap-3"
                >
                  {DISPLAYED_MODES.map((mode) => {
                    const config = MODE_CONFIG[mode];
                    const isSelected = selectedMode === mode;

                    return (
                      <div key={mode} className="relative">
                        <RadioGroupItem
                          value={mode}
                          id={`mode-${mode}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`mode-${mode}`}
                          className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={isSelected ? 'text-purple-600' : 'text-gray-500'}>
                              {config.icon}
                            </span>
                            <span className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                              {config.name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">{config.description}</span>
                          <div className="mt-2 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{config.latency}</span>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Mode Details */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-purple-600">{modeInfo.icon}</span>
                  <span className="font-medium text-gray-900">{modeInfo.name} Mode</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-medium text-green-700 mb-1">Pros:</p>
                    <ul className="space-y-0.5 text-gray-600">
                      {modeInfo.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-orange-700 mb-1">Cons:</p>
                    <ul className="space-y-0.5 text-gray-600">
                      {modeInfo.cons.map((con, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Optimize Button */}
              <Button
                onClick={handleOptimize}
                disabled={isOptimizing || !query.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Preview Optimization
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Optimization Result */}
              {optimizationResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-purple-900">Optimization Result</span>
                    {qualityIndicator && (
                      <Badge
                        variant="outline"
                        className={`${
                          qualityIndicator.color === 'green'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : qualityIndicator.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                        }`}
                      >
                        {qualityIndicator.emoji} {optimizationResult.quality.qualityScore}/100
                      </Badge>
                    )}
                  </div>

                  {/* Original vs Optimized */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase">Original:</span>
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                        {optimizationResult.originalQuery}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-purple-600 uppercase">Optimized:</span>
                      <p className="text-sm text-purple-900 bg-white p-2 rounded border border-purple-300 font-medium">
                        {optimizationResult.optimizedQuery}
                      </p>
                    </div>
                  </div>

                  {/* Warning if any */}
                  {optimizationResult.warningMessage && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 mb-3">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      {optimizationResult.warningMessage}
                    </div>
                  )}

                  {/* Issues and Suggestions */}
                  {optimizationResult.quality.issues.length > 0 && (
                    <div className="text-xs text-gray-600 mb-3">
                      <span className="font-medium">Issues:</span>
                      <ul className="list-disc ml-4 mt-1">
                        {optimizationResult.quality.issues.slice(0, 2).map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Processing Time */}
                  <div className="text-xs text-gray-500 mb-3">
                    Processed in {optimizationResult.processingTimeMs}ms
                  </div>

                  {/* Apply Button */}
                  <Button
                    onClick={handleApply}
                    disabled={!optimizationResult.shouldProceed}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Apply Optimized Query
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default QueryOptimizationPanel;
