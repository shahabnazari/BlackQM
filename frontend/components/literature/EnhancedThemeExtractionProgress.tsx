'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Code2,
  Search,
  GitBranch,
  FileText,
  CheckCircle,
  Info,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

/**
 * EnhancedThemeExtractionProgress Component
 *
 * Revolutionary transparent progress visualization (Patent Claims #9, #10, #11)
 * Implements 4-part messaging: Stage + What + Why + Stats
 * with progressive disclosure (Novice/Researcher/Expert modes)
 *
 * Week 2 Day 5.13 - Enterprise-Grade UX Implementation
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type UserExpertiseLevel = 'novice' | 'researcher' | 'expert';

export interface TransparentProgressMessage {
  stageName: string;
  stageNumber: number;
  totalStages: number;
  percentage: number;
  whatWeAreDoing: string;
  whyItMatters: string;
  liveStats: {
    sourcesAnalyzed: number;
    codesGenerated?: number;
    themesIdentified?: number;
    currentOperation: string;
    // Phase 10 Day 30: Real-time familiarization metrics
    fullTextRead?: number;
    abstractsRead?: number;
    totalWordsRead?: number;
    currentArticle?: number;
    totalArticles?: number;
    articleTitle?: string;
    articleType?: 'full-text' | 'abstract';
    articleWords?: number;
    // Phase 10 Day 31.2: Enterprise-grade scientific metrics
    embeddingStats?: {
      dimensions: number;
      model: string;
      totalEmbeddingsGenerated: number;
      averageEmbeddingMagnitude?: number;
      processingMethod: 'single' | 'chunked-averaged';
      chunksProcessed?: number;
      scientificExplanation?: string;
    };
    familiarizationReport?: {
      downloadUrl?: string;
      embeddingVectors?: boolean;
      completedAt?: string;
    };
  };
}

export interface IterationData {
  iterationNumber: number;
  cachedCount: number;
  newCount: number;
  costSaved: number;
  savingsPercent: number;
  themeEvolution?: {
    new: number;
    strengthened: number;
    unchanged: number;
    weakened: number;
  };
}

export interface EnhancedThemeExtractionProgressProps {
  currentStage: number;
  totalStages: number;
  percentage: number;
  transparentMessage?: TransparentProgressMessage;
  onRefinementRequest?: (stage: number) => void;
  allowIterativeRefinement?: boolean;
  // Phase 10 Day 19.5: Iteration support
  mode?: 'quick' | 'iterative';
  iterationData?: IterationData;
}

// ============================================================================
// STAGE CONFIGURATIONS
// ============================================================================

interface StageConfig {
  number: number;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  canRefine: boolean;
}

const STAGES: StageConfig[] = [
  {
    number: 1,
    name: 'Familiarization',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Reading and immersing in the full dataset',
    canRefine: false,
  },
  {
    number: 2,
    name: 'Coding',
    icon: Code2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Generating systematic codes across all sources',
    canRefine: false,
  },
  {
    number: 3,
    name: 'Theme Generation',
    icon: Search,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Clustering codes into candidate themes',
    canRefine: false,
  },
  {
    number: 4,
    name: 'Theme Review',
    icon: GitBranch,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Reviewing themes against codes and full dataset',
    canRefine: true,
  },
  {
    number: 5,
    name: 'Theme Definition',
    icon: FileText,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    description: 'Defining and naming each theme clearly',
    canRefine: true,
  },
  {
    number: 6,
    name: 'Report Production',
    icon: CheckCircle,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    description: 'Generating final analysis report',
    canRefine: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function EnhancedThemeExtractionProgress({
  currentStage,
  totalStages,
  percentage,
  transparentMessage,
  onRefinementRequest,
  allowIterativeRefinement = false,
  mode = 'quick',
  iterationData,
}: EnhancedThemeExtractionProgressProps) {
  const [expertiseLevel, setExpertiseLevel] =
    useState<UserExpertiseLevel>('researcher');
  const [expandedStages, setExpandedStages] = useState<Set<number>>(
    new Set([currentStage])
  );

  // Phase 10 Day 30: Store completed stage metrics for persistent display
  const [completedStageMetrics, setCompletedStageMetrics] = useState<Record<number, TransparentProgressMessage>>({});

  // Phase 10 Day 30: Capture and persist metrics as stages progress
  useEffect(() => {
    if (transparentMessage && transparentMessage.liveStats) {
      // Always save the latest metrics for each stage
      // This ensures we have the final state when a stage completes
      setCompletedStageMetrics(prev => ({
        ...prev,
        [transparentMessage.stageNumber]: transparentMessage
      }));
    }
  }, [transparentMessage]);

  const toggleStageExpansion = (stageNumber: number) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageNumber)) {
        newSet.delete(stageNumber);
      } else {
        newSet.add(stageNumber);
      }
      return newSet;
    });
  };

  const currentStageConfig = STAGES.find(s => s.number === currentStage);

  return (
    <div className="w-full space-y-6">
      {/* Header with Progressive Disclosure Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Theme Extraction in Progress
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Stage {currentStage} of {totalStages} • {Math.round(percentage)}%
            Complete
          </p>
        </div>

        {/* Progressive Disclosure Toggle (Patent Claim #10) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Detail Level:</span>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(['novice', 'researcher', 'expert'] as UserExpertiseLevel[]).map(
              level => (
                <button
                  key={level}
                  onClick={() => setExpertiseLevel(level)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    expertiseLevel === level
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="absolute top-0 left-0 right-0 flex justify-between px-1 -mt-1">
          {STAGES.map(stage => (
            <div
              key={stage.number}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                stage.number < currentStage
                  ? 'bg-green-500 border-green-500'
                  : stage.number === currentStage
                    ? 'bg-blue-500 border-blue-500 animate-pulse'
                    : 'bg-white border-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current Stage 4-Part Message */}
      {transparentMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border-2 p-5 ${currentStageConfig?.bgColor} ${currentStageConfig?.color.replace('text-', 'border-')}`}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`p-3 rounded-lg bg-white shadow-sm ${currentStageConfig?.color}`}
            >
              {currentStageConfig &&
                React.createElement(currentStageConfig.icon, {
                  className: 'w-6 h-6',
                })}
            </div>

            {/* 4-Part Message */}
            <div className="flex-1 space-y-3">
              {/* Part 1: Stage Name */}
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  {transparentMessage.stageName}
                </h4>
                <p className="text-sm text-gray-600">
                  Stage {transparentMessage.stageNumber} of{' '}
                  {transparentMessage.totalStages}
                </p>
              </div>

              {/* Part 2: What We're Doing (Progressive Disclosure) */}
              <div className="bg-white/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      What we're doing:
                    </p>
                    <p className="text-sm text-gray-700">
                      {transparentMessage.whatWeAreDoing}
                    </p>
                  </div>
                </div>
              </div>

              {/* Part 3: Why It Matters */}
              <div className="bg-white/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Why it matters:
                    </p>
                    <p className="text-sm text-gray-700">
                      {transparentMessage.whyItMatters}
                    </p>
                  </div>
                </div>
              </div>

              {/* Part 4: Live Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-600 mb-1">Sources Analyzed</p>
                  <p className="text-xl font-bold text-gray-900">
                    {transparentMessage.liveStats.sourcesAnalyzed}
                  </p>
                </div>
                {transparentMessage.liveStats.codesGenerated !== undefined && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">
                      Codes Generated
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {transparentMessage.liveStats.codesGenerated}
                    </p>
                  </div>
                )}
                {transparentMessage.liveStats.themesIdentified !==
                  undefined && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Themes Found</p>
                    <p className="text-xl font-bold text-gray-900">
                      {transparentMessage.liveStats.themesIdentified}
                    </p>
                  </div>
                )}
              </div>

              {/* Phase 10 Day 30: Real-time Familiarization Metrics (Stage 1 - Main Display) */}
              {/* ONLY show during active Stage 1 processing (top section) */}
              {currentStage === 1 && transparentMessage?.liveStats && (transparentMessage.liveStats.totalWordsRead || 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h5 className="text-sm font-bold text-gray-900">
                      Real-Time Reading Progress
                    </h5>
                  </div>

                  {/* Progress Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">
                        📖 Total Words Read
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {transparentMessage.liveStats.totalWordsRead?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Cumulative count
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">
                        📄 Full Articles
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {transparentMessage.liveStats.fullTextRead || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Deep content
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">
                        📝 Abstracts
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {transparentMessage.liveStats.abstractsRead || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Summary content
                      </p>
                    </div>
                  </div>

                  {/* Current Article Being Processed */}
                  {transparentMessage.liveStats.articleTitle && (
                    <div className="bg-white/50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 mb-1">
                        Currently Reading ({transparentMessage.liveStats.currentArticle}/{transparentMessage.liveStats.totalArticles}):
                      </p>
                      <p className="text-sm text-gray-800 font-medium mb-2">
                        {transparentMessage.liveStats.articleTitle}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-1 rounded font-medium ${
                          transparentMessage.liveStats.articleType === 'full-text'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {transparentMessage.liveStats.articleType === 'full-text' ? '📄 Full Article' : '📝 Abstract'}
                        </span>
                        <span className="text-gray-600">
                          {transparentMessage.liveStats.articleWords?.toLocaleString() || 0} words
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Phase 10 Day 31.2: Scientific Embedding Statistics */}
                  {transparentMessage.liveStats.embeddingStats && (
                    <div className="mt-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <h6 className="text-xs font-bold text-indigo-900">
                          🔬 Scientific Processing Details
                        </h6>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/60 rounded p-2">
                          <p className="text-gray-600 mb-0.5">Model</p>
                          <p className="font-semibold text-gray-900">{transparentMessage.liveStats.embeddingStats.model}</p>
                        </div>
                        <div className="bg-white/60 rounded p-2">
                          <p className="text-gray-600 mb-0.5">Dimensions</p>
                          <p className="font-semibold text-gray-900">{transparentMessage.liveStats.embeddingStats.dimensions.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/60 rounded p-2">
                          <p className="text-gray-600 mb-0.5">Embeddings Generated</p>
                          <p className="font-semibold text-gray-900">{transparentMessage.liveStats.embeddingStats.totalEmbeddingsGenerated}</p>
                        </div>
                        <div className="bg-white/60 rounded p-2">
                          <p className="text-gray-600 mb-0.5">Processing Method</p>
                          <p className="font-semibold text-gray-900">
                            {transparentMessage.liveStats.embeddingStats.processingMethod === 'chunked-averaged'
                              ? `Chunked (${transparentMessage.liveStats.embeddingStats.chunksProcessed} chunks)`
                              : 'Single-pass'}
                          </p>
                        </div>
                      </div>
                      {transparentMessage.liveStats.embeddingStats.averageEmbeddingMagnitude && (
                        <div className="mt-2 bg-white/60 rounded p-2">
                          <p className="text-xs text-gray-600 mb-0.5">Average Embedding Magnitude (L2 Norm)</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {transparentMessage.liveStats.embeddingStats.averageEmbeddingMagnitude.toFixed(4)}
                          </p>
                        </div>
                      )}
                      {transparentMessage.liveStats.embeddingStats.scientificExplanation && (
                        <div className="mt-2 text-xs text-indigo-800 bg-indigo-100/50 rounded p-2">
                          📚 {transparentMessage.liveStats.embeddingStats.scientificExplanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reading Speed Indicator */}
                  <div className="mt-3 text-xs text-blue-700 bg-blue-50 rounded p-2">
                    💡 <strong>Why this is fast:</strong> We're generating semantic embeddings (mathematical representations), not doing deep analysis yet. Stage 2-6 will analyze the actual content using GPT-4.
                  </div>
                </motion.div>
              )}

              {/* Phase 10 Day 19.5: Iteration Metadata Display */}
              {mode === 'iterative' && iterationData && currentStage === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h5 className="text-sm font-bold text-gray-900">
                      Iteration {iterationData.iterationNumber} • Cost Optimization Active
                    </h5>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">💾 Cached Papers</p>
                      <p className="text-lg font-bold text-purple-600">
                        {iterationData.cachedCount}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Already analyzed
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">🆕 New Papers</p>
                      <p className="text-lg font-bold text-blue-600">
                        {iterationData.newCount}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Being processed
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">💰 Cost Saved</p>
                      <p className="text-lg font-bold text-green-600">
                        ${iterationData.costSaved.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {iterationData.savingsPercent}% savings
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Phase 10 Day 19.5: Theme Evolution Display (Stage 3) */}
              {mode === 'iterative' &&
                iterationData?.themeEvolution &&
                currentStage === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-2 border-green-200"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <GitBranch className="w-5 h-5 text-green-600" />
                      <h5 className="text-sm font-bold text-gray-900">
                        Theme Evolution (vs Iteration{' '}
                        {iterationData.iterationNumber - 1})
                      </h5>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">✨ New</p>
                        <p className="text-lg font-bold text-blue-600">
                          {iterationData.themeEvolution.new}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">
                          📈 Strengthened
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {iterationData.themeEvolution.strengthened}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">
                          ➡️ Unchanged
                        </p>
                        <p className="text-lg font-bold text-gray-600">
                          {iterationData.themeEvolution.unchanged}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-600 mb-1">
                          📉 Weakened
                        </p>
                        <p className="text-lg font-bold text-orange-600">
                          {iterationData.themeEvolution.weakened}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

              {/* Phase 10 Day 19.5: Saturation Guidance (Stage 6) */}
              {mode === 'iterative' && iterationData && currentStage === 6 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200"
                >
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold text-gray-900 mb-2">
                        📊 Theoretical Saturation Assessment
                      </h5>
                      <p className="text-sm text-gray-700 mb-3">
                        This is iteration {iterationData.iterationNumber}. Review
                        theme evolution to assess saturation:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1.5 ml-4">
                        <li>
                          • <strong>High saturation:</strong> Mostly unchanged
                          themes, few new themes
                        </li>
                        <li>
                          • <strong>Emerging patterns:</strong> Many strengthened
                          or new themes → continue iterations
                        </li>
                        <li>
                          • <strong>Glaser & Strauss (1967):</strong> Stop when new
                          data yields no new insights
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Iterative Refinement Button (Patent Claim #11) */}
              {allowIterativeRefinement &&
                currentStageConfig?.canRefine &&
                onRefinementRequest && (
                  <motion.button
                    onClick={() => onRefinementRequest(currentStage)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 hover:border-orange-400 transition-all shadow-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Request Refinement (Non-linear TA)
                    </span>
                  </motion.button>
                )}
            </div>
          </div>
        </motion.div>
      )}

      {/* All Stages Accordion */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          All Stages (Braun & Clarke 2019)
        </h4>
        {STAGES.map(stage => {
          const isExpanded = expandedStages.has(stage.number);
          const isCompleted = stage.number < currentStage;
          const isCurrent = stage.number === currentStage;
          const isPending = stage.number > currentStage;

          const Icon = stage.icon;

          return (
            <div
              key={stage.number}
              className={`rounded-lg border-2 transition-all ${
                isCurrent
                  ? `${stage.bgColor} ${stage.color.replace('text-', 'border-')}`
                  : isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Stage Header */}
              <button
                onClick={() => toggleStageExpansion(stage.number)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isCurrent
                        ? 'bg-white shadow-sm'
                        : isCompleted
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          isCurrent ? stage.color : 'text-gray-400'
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      className={`font-semibold ${
                        isCurrent || isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      Stage {stage.number}: {stage.name}
                    </p>
                    <p
                      className={`text-sm ${
                        isCurrent || isCompleted
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {stage.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                      Complete
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium animate-pulse">
                      In Progress
                    </span>
                  )}
                  {isPending && (
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 font-medium">
                      Pending
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Stage Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 space-y-3">
                      {/* Stage-Specific Guidance Based on Expertise Level */}
                      <div className="bg-white/50 rounded-lg p-3 text-sm text-gray-700">
                        {expertiseLevel === 'novice' && (
                          <p>
                            {stage.number === 1 &&
                              "We're carefully reading all your sources to understand the content."}
                            {stage.number === 2 &&
                              "We're highlighting important parts of the text with codes."}
                            {stage.number === 3 &&
                              "We're grouping similar codes together to form themes."}
                            {stage.number === 4 &&
                              "We're double-checking that themes make sense with the data."}
                            {stage.number === 5 &&
                              "We're giving each theme a clear name and definition."}
                            {stage.number === 6 &&
                              "We're writing up the final analysis with all details."}
                          </p>
                        )}
                        {expertiseLevel === 'researcher' && (
                          <p>
                            {stage.number === 1 &&
                              'Immersive reading of full dataset with note-taking on patterns and meanings (Braun & Clarke 2006).'}
                            {stage.number === 2 &&
                              'Systematic coding across entire corpus using open coding approach (Charmaz 2006).'}
                            {stage.number === 3 &&
                              'Collating codes into candidate themes via semantic clustering (Braun & Clarke 2019).'}
                            {stage.number === 4 &&
                              'Reviewing themes at code level (coherence) and dataset level (distinctiveness).'}
                            {stage.number === 5 &&
                              'Defining essence of each theme and refining names to capture meaning accurately.'}
                            {stage.number === 6 &&
                              'Producing scholarly report with vivid extracts demonstrating each theme.'}
                          </p>
                        )}
                        {expertiseLevel === 'expert' && (
                          <p>
                            {stage.number === 1 &&
                              'Corpus-level semantic embedding: OpenAI text-embedding-3-large (3072 dims). Initial pattern notation.'}
                            {stage.number === 2 &&
                              'Exhaustive systematic coding with GPT-4 Turbo. Inductive + deductive coding strategies. Saturation tracking.'}
                            {stage.number === 3 &&
                              'Hierarchical clustering (cosine similarity ≥0.7) + manual theme boundary refinement. Candidate theme generation.'}
                            {stage.number === 4 &&
                              'Internal homogeneity validation (within-theme coherence) + external heterogeneity (between-theme distinctiveness). Iterative refinement supported.'}
                            {stage.number === 5 &&
                              'Thematic essence capture with operational definitions. Semantic vs. latent theme distinction. Name finalization.'}
                            {stage.number === 6 &&
                              'Report generation: theme descriptions + prevalence + supporting quotes + methodology documentation. AI disclosure included (Nature/Science 2024).'}
                          </p>
                        )}
                      </div>

                      {/* Phase 10 Day 30: Familiarization Metrics Summary (Stage 1 - Accordion) */}
                      {/* ONLY show after Stage 1 completes (persistent display in accordion) */}
                      {stage.number === 1 &&
                        isCompleted &&
                        completedStageMetrics[1]?.liveStats && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                              <h5 className="text-sm font-bold text-gray-900">
                                Familiarization Summary
                              </h5>
                            </div>

                            {/* Progress Grid - Completed Metrics */}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-600 mb-1">
                                  📖 Total Words Read
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {completedStageMetrics[1].liveStats.totalWordsRead?.toLocaleString() || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Final count
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-600 mb-1">
                                  📄 Full Articles
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                  {completedStageMetrics[1].liveStats.fullTextRead || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Complete texts
                                </p>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <p className="text-xs text-gray-600 mb-1">
                                  📝 Abstracts
                                </p>
                                <p className="text-2xl font-bold text-purple-600">
                                  {completedStageMetrics[1].liveStats.abstractsRead || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Summaries
                                </p>
                              </div>
                            </div>

                            {/* Phase 10 Day 31.2: Scientific Embedding Statistics (Accordion) */}
                            {completedStageMetrics[1].liveStats.embeddingStats && (
                              <div className="mt-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="w-5 h-5 text-indigo-600" />
                                  <h6 className="text-sm font-bold text-indigo-900">
                                    🔬 Scientific Embedding Statistics
                                  </h6>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">AI Model</p>
                                    <p className="text-sm font-bold text-indigo-700">
                                      {completedStageMetrics[1].liveStats.embeddingStats.model}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">Vector Dimensions</p>
                                    <p className="text-sm font-bold text-indigo-700">
                                      {completedStageMetrics[1].liveStats.embeddingStats.dimensions.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">Embeddings Generated</p>
                                    <p className="text-sm font-bold text-indigo-700">
                                      {completedStageMetrics[1].liveStats.embeddingStats.totalEmbeddingsGenerated}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <p className="text-xs text-gray-600 mb-1">Processing Method</p>
                                    <p className="text-sm font-bold text-indigo-700">
                                      {completedStageMetrics[1].liveStats.embeddingStats.processingMethod === 'chunked-averaged'
                                        ? 'Chunked & Averaged'
                                        : 'Single-pass'}
                                    </p>
                                  </div>
                                </div>
                                {completedStageMetrics[1].liveStats.embeddingStats.averageEmbeddingMagnitude && (
                                  <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
                                    <p className="text-xs text-gray-600 mb-1">Average Embedding Magnitude (L2 Norm)</p>
                                    <p className="text-lg font-bold text-indigo-700">
                                      {completedStageMetrics[1].liveStats.embeddingStats.averageEmbeddingMagnitude.toFixed(4)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Mathematical measure of semantic representation strength
                                    </p>
                                  </div>
                                )}
                                {completedStageMetrics[1].liveStats.embeddingStats.scientificExplanation && (
                                  <div className="text-xs text-indigo-800 bg-indigo-100/60 rounded p-3">
                                    <p className="font-semibold mb-1">📚 Scientific Process:</p>
                                    <p>{completedStageMetrics[1].liveStats.embeddingStats.scientificExplanation}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Total Articles Processed Summary */}
                            {completedStageMetrics[1].liveStats.totalArticles && (
                              <div className="bg-white/50 rounded-lg p-3 border border-blue-200 mt-3">
                                <p className="text-xs font-semibold text-blue-700 mb-1">
                                  ✅ Completed: All {completedStageMetrics[1].liveStats.totalArticles} sources analyzed
                                </p>
                                <div className="flex items-center gap-3 text-xs mt-2">
                                  <span className="text-gray-700">
                                    🎯 <strong>Next:</strong> Stage 2 will now systematically code all this content using GPT-4
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Methodology Note */}
                            <div className="mt-3 text-xs text-blue-700 bg-blue-50 rounded p-2">
                              📚 <strong>Braun & Clarke (2006):</strong> Familiarization is complete. We've read and embedded all {completedStageMetrics[1].liveStats.totalArticles} sources. These semantic embeddings enable the AI to understand context and relationships across your entire corpus.
                            </div>
                          </motion.div>
                        )}

                      {/* Refinement Option for Stages 4-6 */}
                      {allowIterativeRefinement &&
                        stage.canRefine &&
                        isCurrent &&
                        onRefinementRequest && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-start gap-2 mb-2">
                              <Info className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-orange-900">
                                <strong>Non-linear Thematic Analysis:</strong>{' '}
                                You can request refinement to revisit earlier
                                stages. This aligns with Braun & Clarke's (2019)
                                updated guidance that TA is recursive, not
                                strictly linear.
                              </p>
                            </div>
                            <button
                              onClick={() => onRefinementRequest(stage.number)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 hover:border-orange-400 transition-all text-sm font-medium"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Refine Stage {stage.number}
                            </button>
                          </div>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Methodology Citation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p>
          <strong>Methodology:</strong> Reflexive Thematic Analysis (Braun &
          Clarke, 2006, 2019). AI-assisted semantic clustering with full human
          oversight required for publication.
        </p>
      </div>
    </div>
  );
}
