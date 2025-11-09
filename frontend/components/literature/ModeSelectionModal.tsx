/**
 * Phase 10 Day 19.5-19.6: Unified Extraction Mode Selection Modal
 *
 * ALL-IN-ONE Extraction Hub - Revolutionary UX Design
 * Consolidates Quick, Corpus, Guided, and Incremental extraction modes
 *
 * Design Principle: One entry point, clear choices, smart recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ExtractionMode = 'quick' | 'guided';

interface CorpusInfo {
  id: string;
  name: string;
  iterationCount: number;
  paperCount: number;
  themeCount: number;
  lastExtractedAt: string;
}

interface ModeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModeSelected: (mode: ExtractionMode, corpusId?: string) => void;
  selectedPaperCount: number;
  existingCorpuses?: CorpusInfo[];
  loading?: boolean;
  preparingMessage?: string; // Phase 10 Day 34: Show preparation status
}

// ============================================================================
// MODE CONFIGURATIONS
// ============================================================================

interface ModeConfig {
  id: ExtractionMode;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  benefits: string[];
  bestFor: string[];
  estimatedTime: string;
}

const MODE_CONFIGS: Record<ExtractionMode, ModeConfig> = {
  quick: {
    id: 'quick',
    title: 'Quick Extract',
    subtitle: 'Fast one-time analysis',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-600',
    benefits: [
      'Fast results (2-3 minutes)',
      'Simple one-time extraction',
      'Full manual control',
    ],
    bestFor: [
      '🎯 When: Quick topic exploration',
      '📊 Papers: 3-20 papers',
      '⚡ Speed: Fastest (2-3 min)',
    ],
    estimatedTime: '2-3 min',
  },
  guided: {
    id: 'guided',
    title: 'Guided Extraction',
    subtitle: 'AI-powered iterative analysis',
    icon: Sparkles,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
    borderColor: 'border-pink-200 hover:border-pink-400',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-pink-500',
    benefits: [
      'AI scores paper quality (5 dimensions)',
      'Auto-selects optimal batches',
      'Stops at saturation automatically',
    ],
    bestFor: [
      '🎯 When: Rigorous methodology needed',
      '📊 Papers: 20+ papers',
      '🤖 Control: Fully automated',
    ],
    estimatedTime: '5-10 min (automated)',
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ModeSelectionModal({
  isOpen,
  onClose,
  onModeSelected,
  selectedPaperCount,
  existingCorpuses: _existingCorpuses = [], // Kept for backward compatibility
  loading = false,
  preparingMessage,
}: ModeSelectionModalProps) {
  const [selectedMode, setSelectedMode] = useState<ExtractionMode | null>(null);

  // Smart defaults based on context
  useEffect(() => {
    if (isOpen) {
      // If >20 papers, suggest guided mode (AI-powered)
      if (selectedPaperCount >= 20) {
        setSelectedMode('guided');
      }
      // Otherwise, suggest quick mode
      else {
        setSelectedMode('quick');
      }
    }
  }, [isOpen, selectedPaperCount]);

  const handleContinue = () => {
    if (!selectedMode) return;
    onModeSelected(selectedMode);
  };

  if (!isOpen) return null;

  const quickConfig = MODE_CONFIGS.quick;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative z-10 w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">
              {loading ? 'Preparing Papers...' : 'Choose Your Extraction Approach'}
            </h2>
            {loading && preparingMessage ? (
              <div className="text-blue-100 flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {preparingMessage}
              </div>
            ) : (
              <div className="text-blue-100">
                {selectedPaperCount} paper{selectedPaperCount !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {/* Methodology Badge */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
              <Award className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Research-Backed Methodology</span>
              <span className="text-gray-400">•</span>
              <span>Glaser & Strauss (1967) • Patton (1990) • Francis et al. (2010)</span>
            </div>
          </div>

          {/* Mode Selection Grid */}
          <div className="p-8 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
              Choose Extraction Mode:
            </h3>
            <div className="grid md:grid-cols-2 gap-8 mb-6 max-w-4xl mx-auto">
              {/* Quick Extract Card */}
              <motion.button
                onClick={() => setSelectedMode('quick')}
                className={`relative text-left p-6 rounded-xl border-2 transition-all ${
                  selectedMode === 'quick'
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                whileHover={{ scale: selectedMode !== 'quick' ? 1.01 : 1.02 }}
                whileTap={{ scale: 0.99 }}
              >
                {selectedMode === 'quick' && (
                  <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${quickConfig.bgColor}`}>
                    <quickConfig.icon className={`h-6 w-6 ${quickConfig.color}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {quickConfig.title}
                    </h3>
                    <p className="text-sm text-gray-600">{quickConfig.subtitle}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {quickConfig.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{quickConfig.estimatedTime}</span>
                </div>
              </motion.button>

              {/* Guided Extraction Card - FLAGSHIP */}
              <motion.button
                onClick={() => setSelectedMode('guided')}
                className={`relative text-left p-6 rounded-xl border-3 transition-all ${
                  selectedMode === 'guided'
                    ? 'border-pink-500 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 shadow-2xl scale-[1.04]'
                    : 'border-pink-300 bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:border-pink-400 hover:shadow-xl'
                }`}
                whileHover={{ scale: selectedMode !== 'guided' ? 1.02 : 1.04 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Flagship Badge */}
                <div className="absolute -top-3 -left-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  FLAGSHIP
                </div>

                {selectedMode === 'guided' && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-2">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4 mt-2">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                    <Sparkles className="h-6 w-6 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Guided Extraction
                    </h3>
                    <p className="text-xs text-pink-700 font-medium mb-1">🤖 AI-Powered • 5-Dimensional Quality Scoring</p>
                    <p className="text-xs text-gray-600">Patent-pending automatic paper selection & saturation detection</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-white/60 p-3 rounded-lg border border-pink-200">
                    <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-pink-600" />
                      HOW IT WORKS (Scientifically):
                    </h4>
                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div>1️⃣ <strong>Foundation</strong> (Iteration 1): Highest-quality papers → Robust baseline</div>
                      <div>2️⃣ <strong>Diversity</strong> (Iteration 2): Different methodologies → Test theme robustness</div>
                      <div>3️⃣ <strong>Gap-Filling</strong> (Iteration 3+): Weak themes → Approach saturation</div>
                      <div>4️⃣ <strong>Auto-Stop</strong>: When saturation reached → Never over-analyze</div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1">
                      💰 EFFICIENCY (Average Savings):
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-green-700">
                        <div className="font-bold">60% Time Saved</div>
                        <div className="text-[10px] text-green-600">Stops at 20 of 50 papers</div>
                      </div>
                      <div className="text-green-700">
                        <div className="font-bold">60% Cost Saved</div>
                        <div className="text-[10px] text-green-600">$2 instead of $5 typical</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
                      📚 SCIENTIFIC BACKING:
                    </h4>
                    <div className="space-y-0.5 text-[10px] text-blue-700">
                      <div>• <strong>Glaser & Strauss (1967)</strong> - Theoretical sampling</div>
                      <div>• <strong>Patton (1990)</strong> - Purposive sampling strategies</div>
                      <div>• <strong>Francis et al. (2010)</strong> - Saturation framework</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t">
                  <Clock className="h-4 w-4" />
                  <span>5-10 min (fully automated)</span>
                </div>
              </motion.button>
            </div>

            {/* Smart Recommendation */}
            {selectedPaperCount > 20 && selectedMode !== 'guided' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-200 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-pink-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-pink-900 mb-1">
                      ✨ AI Recommendation
                    </p>
                    <p className="text-sm text-pink-800">
                      You've selected {selectedPaperCount} papers. For large datasets,
                      we recommend using <strong>Guided Extraction</strong> for automatic
                      quality scoring, scientific batch selection, and saturation tracking.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedMode || loading}
                className={`px-8 py-3 rounded-lg font-medium text-white transition-all flex items-center gap-2 ${
                  selectedMode === 'quick'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                    : selectedMode === 'guided'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
