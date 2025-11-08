/**
 * Phase 10 Day 5.13: Centered Theme Extraction Progress Modal
 * Wraps EnhancedThemeExtractionProgress with centered modal overlay
 * Maps simple progress to 6-stage Braun & Clarke methodology with 4-part messaging
 */

'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EnhancedThemeExtractionProgress, {
  TransparentProgressMessage,
} from './EnhancedThemeExtractionProgress';
import { ExtractionProgress } from '@/lib/hooks/useThemeExtractionProgress';

interface ThemeExtractionProgressModalProps {
  progress: ExtractionProgress;
  onClose?: () => void;
}

/**
 * Maps simple progress state to 6-stage Braun & Clarke methodology
 * Phase 10 Day 30: Use real WebSocket transparentMessage when available
 */
function mapProgressToStage(progress: ExtractionProgress): {
  currentStage: number;
  totalStages: number;
  percentage: number;
  transparentMessage: TransparentProgressMessage;
} {
  const totalStages = 6;
  let currentStage = 1;
  let percentage = progress.progress;

  // Phase 10 Day 30: If we have real WebSocket data, use it directly!
  if (progress.transparentMessage) {
    console.log('🟢 Using REAL WebSocket transparentMessage:', progress.transparentMessage);
    return {
      currentStage: progress.transparentMessage.stageNumber,
      totalStages: progress.transparentMessage.totalStages || 6,
      percentage: progress.transparentMessage.percentage,
      transparentMessage: progress.transparentMessage,
    };
  }

  // Fallback: Map simple stages to Braun & Clarke 6 stages (legacy path)
  console.log('🟡 Using SYNTHETIC transparentMessage (fallback - no WebSocket data)');
  switch (progress.stage) {
    case 'preparing':
      currentStage = 1; // Familiarization
      percentage = Math.min(15, progress.progress);
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
    totalStages,
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
 * Generates 4-part transparent message: Stage + What + Why + Stats
 * Based on Braun & Clarke (2006, 2019) methodology
 *
 * IMPORTANT: progress.currentSource is the STAGE number (1-6), NOT individual source count
 * progress.totalSources is the TOTAL stages (6), NOT the number of papers
 */
function generate4PartMessage(
  stage: number,
  totalStages: number,
  percentage: number,
  progress: ExtractionProgress
): TransparentProgressMessage {
  const stageConfigs = [
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

  const config = stageConfigs[stage - 1] || stageConfigs[0]!;

  // CRITICAL FIX: progress.currentSource is the STAGE number (1-6), NOT source count!
  // All sources are processed together in each stage, not one by one
  // We should NOT show incremental source counts as it implies sequential processing

  const liveStats: TransparentProgressMessage['liveStats'] = {
    sourcesAnalyzed: progress.totalSources, // Total sources being processed (constant)
    currentOperation: config.currentOperation,
  };

  // Estimated codes/themes based on typical ratios, NOT sequential counting
  if (stage >= 2) {
    liveStats.codesGenerated = Math.floor(progress.totalSources * 8.5);
  }

  if (stage >= 3) {
    liveStats.themesIdentified = Math.floor(progress.totalSources * 1.2);
  }

  return {
    stageName: config.stageName,
    stageNumber: stage,
    totalStages,
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

  // Handle Escape key to close modal when complete/error
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canClose && onClose) {
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
            className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 overflow-y-auto">
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
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
