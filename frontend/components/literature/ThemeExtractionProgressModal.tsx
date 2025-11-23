/**
 * Phase 10 Day 5.13: Centered Theme Extraction Progress Modal
 * PHASE 10.94.3: Updated to 7-stage methodology (Stage 0: Preparing + Stages 1-6)
 *
 * Wraps EnhancedThemeExtractionProgress with centered modal overlay
 * Maps simple progress to 7-stage Braun & Clarke methodology with 4-part messaging
 */

'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EnhancedThemeExtractionProgress, {
  TransparentProgressMessage,
} from './EnhancedThemeExtractionProgress';
import { ExtractionProgress } from '@/lib/hooks/useThemeExtractionProgress';
import { logger } from '@/lib/utils/logger';

interface ThemeExtractionProgressModalProps {
  progress: ExtractionProgress;
  onClose?: () => void;
}

/**
 * Maps simple progress state to 7-stage Braun & Clarke methodology
 * PHASE 10.94.3: Now includes Stage 0 (Preparing Data) + 6 extraction stages
 * Phase 10 Day 30: Use real WebSocket transparentMessage when available
 */
function mapProgressToStage(progress: ExtractionProgress): {
  currentStage: number;
  totalStages: number;
  percentage: number;
  transparentMessage: TransparentProgressMessage;
} {
  // PHASE 10.94.3: 7 stages total (0 = Preparing, 1-6 = Braun & Clarke extraction stages)
  const totalStages = 7;
  let currentStage = 0; // Default to Stage 0 (Preparing)
  let percentage = progress.progress;

  // Phase 10 Day 30: If we have real WebSocket data, use it directly!
  if (progress.transparentMessage) {
    // 🚨 STRICT AUDIT FIX: Enhanced diagnostic logging for Stage 1 stats issue
    // This logs EVERY time the modal maps progress, helping trace data flow
    if (process.env.NODE_ENV === 'development') {
      const stats = progress.transparentMessage.liveStats;
      logger.info('🔀 mapProgressToStage using REAL WebSocket data', 'ThemeExtractionProgressModal', {
        stageNumber: progress.transparentMessage.stageNumber,
        stageName: progress.transparentMessage.stageName,
        percentage: progress.transparentMessage.percentage,
        // Log Stage 1 specific stats
        fullTextRead: stats?.fullTextRead,
        abstractsRead: stats?.abstractsRead,
        totalWordsRead: stats?.totalWordsRead,
        currentArticle: stats?.currentArticle,
        totalArticles: stats?.totalArticles,
      });
    }
    return {
      currentStage: progress.transparentMessage.stageNumber,
      // PHASE 10.94.3: 7 stages total (0 = Preparing, 1-6 = extraction)
      totalStages: progress.transparentMessage.totalStages || 7,
      percentage: progress.transparentMessage.percentage,
      transparentMessage: progress.transparentMessage,
    };
  } else {
    // 🚨 WARNING: No transparentMessage - using synthetic fallback
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ mapProgressToStage: No transparentMessage, using SYNTHETIC fallback', 'ThemeExtractionProgressModal', {
        progressStage: progress.stage,
        progressPercent: progress.progress,
        hasTransparentMessage: false,
      });
    }
  }

  // PHASE 10.94.3: Map simple stages to proper stage numbers
  // Stage 0: Preparing (saving papers + fetching full-text) - 0-40%
  // Stage 1: Familiarization (embeddings) - start of extraction
  // Stage 2-6: Extraction stages
  switch (progress.stage) {
    case 'preparing':
      // PHASE 10.94.3 FIX: 'preparing' is Stage 0, NOT Stage 1 (Familiarization)
      // This prevents showing misleading familiarization stats during paper saving
      currentStage = 0; // Preparing Data (NEW Stage 0)
      // Progress flow:
      //   0-15%: Saving papers to database (preparing)
      //   15-40%: Fetching full-text content (preparing)
      //   40-100%: Theme extraction (extracting)
      percentage = Math.min(40, progress.progress);
      break;
    case 'extracting':
      // Stages 2-5 based on progress percentage
      if (progress.progress < 25) {
        currentStage = 2; // Coding
      } else if (progress.progress < 50) {
        currentStage = 3; // Theme Generation
      } else if (progress.progress < 75) {
        currentStage = 4; // Theme Review
      } else {
        currentStage = 5; // Theme Definition
      }
      break;
    case 'deduplicating':
      currentStage = 5; // Theme Definition (final refinement)
      percentage = 90;
      break;
    case 'complete':
      currentStage = 6; // Report Production
      percentage = 100;
      break;
    case 'error':
      currentStage = 1;
      percentage = 0;
      break;
  }

  // Generate 4-part transparent messaging (synthetic fallback)
  const transparentMessage = generate4PartMessage(
    currentStage,
    percentage,
    progress
  );

  return {
    currentStage,
    totalStages,
    percentage,
    transparentMessage,
  };
}

/**
 * Enterprise-grade 4-part message generator for all stages including preparation
 * PHASE 10.94.3: Added explicit Stage 0 (Preparing) to prevent misleading familiarization stats
 *
 * @param stage - Current stage number (0 = preparing, 1-6 = extraction stages)
 * @param percentage - Current progress percentage
 * @param progress - Full progress state
 * @returns TransparentProgressMessage with stage-appropriate content
 */
function generate4PartMessage(
  stage: number,
  percentage: number,
  progress: ExtractionProgress
): TransparentProgressMessage {
  // PHASE 10.94.3: Stage 0 (Preparing) is DISTINCT from Stage 1 (Familiarization)
  // Stage 0: Saving papers to DB + fetching full-text (0-40%)
  // Stage 1: Actual familiarization with embeddings (40%+ of extraction phase)
  const stageConfigs: Array<{
    stageName: string;
    whatWeAreDoing: string;
    whyItMatters: string;
    currentOperation: string;
  }> = [
    {
      // Stage 0: Preparing (PHASE 10.94.3: NEW - Previously incorrectly shown as Familiarization)
      stageName: 'Preparing Data',
      whatWeAreDoing:
        `Saving ${progress.totalSources} papers to the database and fetching full-text content where available. This preparation phase ensures all content is properly stored before analysis begins. Currently processing batch ${progress.currentSource + 1} of ${progress.totalSources}.`,
      whyItMatters:
        'Data preparation is essential for reproducible research. Saving papers to the database creates a permanent record of your corpus, enables full-text fetching from multiple sources (Unpaywall, PMC, publisher APIs), and ensures the extraction process has access to maximum content depth.',
      currentOperation: progress.message || 'Preparing data for analysis...',
    },
    {
      // Stage 1: Familiarization (PHASE 10 DAY 5.17: Transparent processing explanation)
      stageName: 'Familiarization with Data',
      whatWeAreDoing:
        'Converting source content into semantic embeddings—mathematical representations that capture meaning (3,072-dimension vectors using text-embedding-3-large). Full-text articles were already fetched in the preparation phase. This analysis stage is FAST (~1-2 seconds) because it\'s mathematical transformation, not "deep reading." The system processes full-text papers (10,000+ words), full articles from abstract fields, and standard abstracts. Later stages (2-6) perform deeper analysis using GPT-4, which takes longer (2-6 seconds per batch).',
      whyItMatters:
        'Following Braun & Clarke (2006), familiarization builds an overview of the dataset. Embeddings enable the AI to understand semantic relationships (e.g., "autonomy" ≈ "self-determination") even across different wording. Full-text papers provide 40-50x more content than abstracts, enabling richer pattern detection. This stage is about breadth; depth comes in later stages when GPT-4 analyzes actual content for concepts and themes.',
      currentOperation:
        'Generating semantic embeddings from prepared content (mathematical transformation, not deep reading)',
    },
    {
      // Stage 2: Coding
      stageName: 'Systematic Code Generation',
      whatWeAreDoing:
        'Analyzing ALL sources together to identify semantic codes using embeddings. The AI compares patterns across your entire dataset simultaneously, not processing papers sequentially. Each meaningful concept across all sources gets systematically labeled.',
      whyItMatters:
        'Codes are the building blocks of themes. Processing all sources together ensures we detect patterns that span multiple papers. Semantic analysis (not keyword matching) means "participant autonomy" and "self-determination" are recognized as related concepts even with different words.',
      currentOperation: 'Extracting semantic codes from titles + abstracts',
    },
    {
      // Stage 3: Theme Generation
      stageName: 'Candidate Theme Construction',
      whatWeAreDoing:
        'Clustering related codes from ALL sources into candidate themes using hierarchical semantic analysis. The AI identifies patterns that span your entire dataset. Themes must appear in 3+ sources (cross-validation requirement).',
      whyItMatters:
        'This holistic clustering reveals how concepts across different papers relate to broader themes. The 3-source minimum ensures themes are robust patterns across your dataset, not isolated ideas from single papers. This prevents cherry-picking.',
      currentOperation: 'Clustering codes into candidate themes',
    },
    {
      // Stage 4: Theme Review
      stageName: 'Theme Quality Review',
      whatWeAreDoing:
        'Reviewing each candidate theme against (1) supporting codes and (2) the full dataset. Weak themes are merged or discarded; overlaps are resolved.',
      whyItMatters:
        'Quality control stage. Braun & Clarke emphasize themes must be internally coherent AND distinctly different from each other. This prevents redundant or vague themes.',
      currentOperation: 'Validating themes against available content',
    },
    {
      // Stage 5: Theme Definition
      stageName: 'Theme Naming & Definition',
      whatWeAreDoing:
        "Defining each theme's essence and choosing clear, descriptive names. Each theme gets a precise scope - what it includes AND what it doesn't.",
      whyItMatters:
        'Clear definitions prevent misinterpretation. A theme called "Barriers" is vague; "Institutional Barriers to Implementation" is actionable. Names should convey the analytical narrative.',
      currentOperation: 'Defining and naming final themes',
    },
    {
      // Stage 6: Report Production
      stageName: 'Final Report Assembly',
      whatWeAreDoing:
        'Generating the final thematic analysis with full provenance: each theme linked to specific sources, excerpts, and evidence.',
      whyItMatters:
        'Transparency and reproducibility. You can trace any theme back to source material, satisfying audit requirements for publication. Full evidence chain provided.',
      currentOperation: 'Assembling final analysis report',
    },
  ];

  // PHASE 10.94.3: Stage 0 (index 0) is Preparing, Stage 1 (index 1) is Familiarization
  // For stage >= 1, we use stageConfigs[stage] since index 0 = Stage 0
  const configIndex = Math.max(0, Math.min(stage, stageConfigs.length - 1));
  // Non-null assertion is safe here: configIndex is clamped to valid range [0, length-1]
  const config = stageConfigs[configIndex]!;

  // PHASE 10.94.3: Create stage-appropriate liveStats
  // Stage 0 (Preparing): Show paper save/fetch progress, NO familiarization stats
  // Stage 1+ (Extraction): Show appropriate stats for each stage
  const liveStats: TransparentProgressMessage['liveStats'] = {
    sourcesAnalyzed: stage === 0 ? progress.currentSource : progress.totalSources,
    currentOperation: config.currentOperation,
  };

  // PHASE 10.94.3: Stage 0 (Preparing) should NOT show familiarization metrics
  // These only exist during actual extraction (Stage 1+)
  if (stage === 0) {
    // Preparing stage: Show paper save progress instead of familiarization stats
    liveStats.currentArticle = progress.currentSource + 1;
    liveStats.totalArticles = progress.totalSources;
    // Explicitly do NOT set fullTextRead, abstractsRead, totalWordsRead
    // as these don't exist during preparation phase
  }

  // Estimated codes/themes based on typical ratios, NOT sequential counting
  // Only for extraction stages (2+)
  if (stage >= 2) {
    liveStats.codesGenerated = Math.floor(progress.totalSources * 8.5);
  }

  if (stage >= 3) {
    liveStats.themesIdentified = Math.floor(progress.totalSources * 1.2);
  }

  return {
    stageName: config.stageName,
    stageNumber: stage,
    // PHASE 10.94.3: Always 7 stages (0 = Preparing, 1-6 = Braun & Clarke)
    totalStages: 7,
    percentage,
    whatWeAreDoing: config.whatWeAreDoing,
    whyItMatters: config.whyItMatters,
    liveStats,
  };
}

export default function ThemeExtractionProgressModal({
  progress,
  onClose,
}: ThemeExtractionProgressModalProps) {
  const isVisible =
    progress.isExtracting ||
    progress.stage === 'complete' ||
    progress.stage === 'error';

  const { currentStage, totalStages, percentage, transparentMessage } =
    mapProgressToStage(progress);

  const canClose = progress.stage === 'complete' || progress.stage === 'error';

  // BUG FIX #6: Handle Escape key to close modal when complete/error (safe onClose check)
  useEffect(() => {
    if (!isVisible || !canClose || !onClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, canClose, onClose]);

  const handleBackdropClick = () => {
    if (canClose && onClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto p-8">
              {progress.stage === 'error' ? (
                /* Error State */
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Extraction Failed
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {progress.error || 'An unknown error occurred'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Press ESC or click outside to close
                  </p>
                </div>
              ) : progress.stage === 'complete' ? (
                /* Success State */
                <div className="text-center py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Extraction Complete!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {progress.message}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Backed by Braun & Clarke (2006) Reflexive Thematic Analysis
                  </p>
                  <p className="text-xs text-gray-500 mt-6">
                    Press ESC or click outside to close
                  </p>
                </div>
              ) : (
                /* Active Extraction State */
                <EnhancedThemeExtractionProgress
                  currentStage={currentStage}
                  totalStages={totalStages}
                  percentage={percentage}
                  transparentMessage={transparentMessage}
                  allowIterativeRefinement={false} // Can enable later
                  // Phase 10.94 FIX: Pass accumulated metrics from Container (bypasses React batching)
                  // Only pass if defined (exactOptionalPropertyTypes compliance)
                  {...(progress.accumulatedStageMetrics && {
                    accumulatedStageMetrics: progress.accumulatedStageMetrics
                  })}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
