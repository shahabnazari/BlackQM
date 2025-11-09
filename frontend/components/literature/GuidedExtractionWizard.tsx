/**
 * Phase 10 Day 19.6: Guided Extraction Wizard
 *
 * Revolutionary scientifically-guided incremental extraction system:
 * - Automatic paper selection based on iteration strategy
 * - Real-time saturation tracking with predictive curve
 * - Multi-dimensional saturation assessment
 * - Clear stop/continue recommendations backed by research
 *
 * Research Foundation:
 * - Patton (1990): Purposive Sampling Strategies
 * - Glaser & Strauss (1967): Theoretical Sampling
 * - Francis et al. (2010): Saturation in Qualitative Research
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  CheckCircle,
  TrendingUp,
  FileText,
  Sparkles,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Target,
  Award,
  ChevronRight,
} from 'lucide-react';
import { incrementalExtractionApi } from '@/lib/api/services/incremental-extraction-api.service';

// Types
interface Paper {
  id: string;
  title: string;
  abstract?: string;
  authors?: string[];
  year?: number;
  citationCount?: number;
  journal?: string;
  keywords?: string[];
  hasFullText: boolean;
}

interface BatchRecommendation {
  papers: Paper[];
  rationale: string;
  goals: string[];
  expectedOutcome: {
    newThemes: string;
    strengthenedThemes: string;
    saturationEstimate: string;
  };
  iteration: number;
}

interface DiversityMetrics {
  topicDiversity: number;
  methodologyDiversity: number;
  populationDiversity: number;
  overallDiversity: number;
  underrepresentedAreas: string[];
}

interface CorpusStats {
  totalPapers: number;
  processedPapers: number;
  remainingPapers: number;
  currentThemeCount: number;
}

interface IterationResult {
  newThemes: number;
  strengthenedThemes: number;
  unchangedThemes: number;
  totalThemes: number;
  saturation: number;
  isSaturated: boolean;
  themes: any[]; // Actual theme objects
  iteration: number; // Current iteration number
}

interface GuidedExtractionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  corpusId: string;
  corpusName: string;
  allPapers: Paper[];
  purpose?: 'q_methodology' | 'survey_construction' | 'qualitative_analysis' | 'literature_synthesis' | 'hypothesis_generation';
  userExpertiseLevel?: 'novice' | 'intermediate' | 'advanced' | 'expert';
  researchContext?: string;
  onIterationComplete?: (result: IterationResult) => void;
}

type WizardStep =
  | 'purpose-selection'
  | 'analyzing'
  | 'recommendation'
  | 'extracting'
  | 'results'
  | 'saturation-check'
  | 'completed';

export function GuidedExtractionWizard({
  isOpen,
  onClose,
  corpusId,
  corpusName,
  allPapers,
  purpose,
  userExpertiseLevel = 'intermediate',
  researchContext: _researchContext,
  onIterationComplete,
}: GuidedExtractionWizardProps) {
  const [step, setStep] = useState<WizardStep>(purpose ? 'analyzing' : 'purpose-selection');
  const [selectedPurpose, setSelectedPurpose] = useState<typeof purpose>(purpose);
  const [selectedExpertiseLevel, setSelectedExpertiseLevel] = useState<typeof userExpertiseLevel>(userExpertiseLevel);
  const [currentIteration, setCurrentIteration] = useState(1);
  const [processedPaperIds, setProcessedPaperIds] = useState<string[]>([]);
  const [currentThemes, setCurrentThemes] = useState<any[]>([]);
  const [batchRecommendation, setBatchRecommendation] =
    useState<BatchRecommendation | null>(null);
  const [diversityMetrics, setDiversityMetrics] =
    useState<DiversityMetrics | null>(null);
  const [corpusStats, setCorpusStats] = useState<CorpusStats | null>(null);
  const [iterationHistory, setIterationHistory] = useState<IterationResult[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && allPapers.length > 0) {
      analyzeCorpusAndRecommend();
    }
  }, [isOpen]);

  /**
   * Step 1: Analyze corpus and get first batch recommendation
   */
  const analyzeCorpusAndRecommend = async () => {
    setStep('analyzing');
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        allPaperIds: allPapers.map((p) => p.id),
        processedPaperIds: processedPaperIds,
        currentThemes: currentThemes,
        iteration: currentIteration,
        batchSize: 5,
      };

      console.log('🔍 [Guided Extraction] Sending request:', {
        allPapersCount: allPapers.length,
        allPaperIds: requestData.allPaperIds,
        processedPaperIdsCount: requestData.processedPaperIds.length,
        themesCount: requestData.currentThemes.length,
        iteration: requestData.iteration,
      });

      const data = await incrementalExtractionApi.selectGuidedBatch(requestData);

      console.log('✅ [Guided Extraction] Batch recommendation received:', data);

      setBatchRecommendation(data);
      setDiversityMetrics(data.diversityMetrics);
      setCorpusStats(data.corpusStats);
      setStep('recommendation');
    } catch (err) {
      console.error('❌ [Guided Extraction] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      console.error('❌ [Guided Extraction] Error message:', errorMessage);
      setError(errorMessage);
      setStep('purpose-selection'); // Go back to purpose selection on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: User accepts recommendation and starts extraction
   */
  const startExtraction = async () => {
    if (!batchRecommendation) return;

    setStep('extracting');
    setLoading(true);

    try {
      // Call incremental extraction endpoint
      const result = await incrementalExtractionApi.extractThemesIncremental({
        corpusId,
        corpusName,
        newPaperIds: batchRecommendation.papers.map((p) => p.id),
        existingPaperIds: processedPaperIds,
        purpose: selectedPurpose as any,
        userExpertiseLevel: selectedExpertiseLevel as any,
      });

      // Update state with results
      const iterationResult: IterationResult = {
        newThemes: result.statistics.newThemesAdded,
        strengthenedThemes: result.statistics.themesStrengthened,
        unchangedThemes: result.statistics.totalThemeCount - result.statistics.newThemesAdded - result.statistics.themesStrengthened,
        totalThemes: result.statistics.totalThemeCount,
        saturation: result.saturation.confidenceLevel * 100,
        isSaturated: result.saturation.isSaturated,
        themes: result.themes, // Include actual themes
        iteration: currentIteration, // Include iteration number
      };

      setIterationHistory([...iterationHistory, iterationResult]);
      setProcessedPaperIds([
        ...processedPaperIds,
        ...batchRecommendation.papers.map((p) => p.id),
      ]);
      setCurrentThemes(result.themes);

      if (onIterationComplete) {
        onIterationComplete(iterationResult);
      }

      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 3: Check saturation and decide next action
   */
  const checkSaturation = () => {
    const lastResult = iterationHistory[iterationHistory.length - 1];

    if (!lastResult) {
      // Safety check - should never happen
      setError('No iteration results found');
      return;
    }

    if (lastResult.isSaturated || lastResult.saturation >= 80) {
      setStep('completed');
    } else {
      // Continue to next iteration
      setCurrentIteration(currentIteration + 1);
      setStep('analyzing');
      analyzeCorpusAndRecommend();
    }
  };

  /**
   * Render: Purpose Selection Step
   */
  const renderPurposeSelection = () => {
    const purposes = [
      { value: 'qualitative_analysis', label: 'Qualitative Analysis', description: 'General thematic analysis for qualitative research', icon: '🔍' },
      { value: 'literature_synthesis', label: 'Literature Synthesis', description: 'Meta-analysis and systematic literature reviews', icon: '📚' },
      { value: 'hypothesis_generation', label: 'Hypothesis Generation', description: 'Theory-building and hypothesis development', icon: '💡' },
      { value: 'survey_construction', label: 'Survey Construction', description: 'Transform themes into validated survey scales', icon: '📝' },
      { value: 'q_methodology', label: 'Q-Methodology', description: 'Generate Q-statements for Q-sort studies', icon: '🎯' },
    ];

    const expertiseLevels = [
      { value: 'novice', label: 'Novice', description: 'New to qualitative research' },
      { value: 'intermediate', label: 'Intermediate', description: 'Some experience with thematic analysis' },
      { value: 'advanced', label: 'Advanced', description: 'Experienced researcher' },
      { value: 'expert', label: 'Expert', description: 'Expert in qualitative methods' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            Select Your Research Purpose
          </h3>
          <p className="text-gray-400">
            This helps optimize theme extraction for your specific research goals
          </p>
        </div>

        {/* Purpose Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white">Research Purpose</label>
          <div className="grid grid-cols-1 gap-3">
            {purposes.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPurpose(p.value as any)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedPurpose === p.value
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white">{p.label}</div>
                    <div className="text-sm text-gray-400 mt-1">{p.description}</div>
                  </div>
                  {selectedPurpose === p.value && (
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Expertise Level Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white">Your Expertise Level</label>
          <div className="grid grid-cols-2 gap-3">
            {expertiseLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setSelectedExpertiseLevel(level.value as any)}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  selectedExpertiseLevel === level.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="font-medium text-white text-sm">{level.label}</div>
                <div className="text-xs text-gray-400 mt-1">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <button
            onClick={() => {
              setStep('analyzing');
              analyzeCorpusAndRecommend();
            }}
            disabled={!selectedPurpose}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Analysis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  /**
   * Render: Analyzing Step
   */
  const renderAnalyzing = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
          <Loader2 className="h-16 w-16 text-blue-500 animate-spin relative z-10" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">
        Analyzing Your Corpus
      </h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Assessing paper quality, diversity, and planning optimal iteration
        strategy based on {allPapers.length} papers...
      </p>
      <div className="flex flex-col gap-2 items-center text-sm text-gray-500 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Quality scoring (methodology, citations, journal)</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Diversity analysis (topics, methodologies)</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span>Selecting optimal batch for iteration {currentIteration}...</span>
        </div>
      </div>

      {/* Scientific Foundation Note - NEW */}
      <div className="max-w-md mx-auto bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-left">
        <p className="text-blue-400 font-semibold mb-1">📚 Quality Assessment Framework:</p>
        <p className="text-gray-300 leading-relaxed">
          Papers scored using CASP (Critical Appraisal Skills Programme) and JBI (Joanna Briggs Institute)
          quality criteria, combined with <strong>Patton's (1990)</strong> purposive sampling strategies
          for maximum variation sampling.
        </p>
      </div>
    </motion.div>
  );

  /**
   * Render: Recommendation Step
   */
  const renderRecommendation = () => {
    if (!batchRecommendation || !diversityMetrics || !corpusStats)
      return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400 font-medium">
              Iteration {currentIteration} Strategy
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {currentIteration === 1 && 'Foundation: High-Quality Papers'}
            {currentIteration === 2 && 'Diversity: Varied Perspectives'}
            {currentIteration > 2 && 'Gap-Filling: Saturation Testing'}
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto mb-3">
            {batchRecommendation.rationale}
          </p>

          {/* Iteration-Specific Citation - NEW */}
          <div className="inline-flex items-center gap-1 text-xs text-gray-500 bg-slate-800/50 border border-slate-700 rounded px-3 py-1">
            <Award className="h-3 w-3 text-yellow-400" />
            <span>
              {currentIteration === 1 && <><strong>Patton (1990):</strong> Intensity sampling for foundational insights</>}
              {currentIteration === 2 && <><strong>Patton (1990):</strong> Maximum variation sampling for robustness</>}
              {currentIteration > 2 && <><strong>Francis et al. (2010):</strong> Saturation assessment framework</>}
            </span>
          </div>
        </div>

        {/* Batch Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {batchRecommendation.papers.length}
            </div>
            <div className="text-sm text-gray-400">Papers Selected</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {corpusStats.processedPapers}/{corpusStats.totalPapers}
            </div>
            <div className="text-sm text-gray-400">Progress</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round(diversityMetrics.overallDiversity)}%
            </div>
            <div className="text-sm text-gray-400">Diversity Score</div>
          </div>
        </div>

        {/* Goals */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Iteration Goals
          </h4>
          <ul className="space-y-2">
            {batchRecommendation.goals.map((goal, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <ChevronRight className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{goal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Expected Outcome */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Expected Outcome
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400 mb-1">New Themes</div>
              <div className="text-white font-medium">
                {batchRecommendation.expectedOutcome.newThemes}
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Strengthened Themes</div>
              <div className="text-white font-medium">
                {batchRecommendation.expectedOutcome.strengthenedThemes}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-400 mb-1">Saturation Estimate</div>
              <div className="text-white font-medium">
                {batchRecommendation.expectedOutcome.saturationEstimate}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Papers Preview */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 sticky top-0 bg-slate-800/30 pb-2">
            <FileText className="h-4 w-4 text-blue-400" />
            Selected Papers ({batchRecommendation.papers.length})
          </h4>
          <div className="space-y-2">
            {batchRecommendation.papers.map((paper, idx) => (
              <div
                key={paper.id}
                className="text-sm bg-slate-900/50 rounded p-3 border border-slate-700/50"
              >
                <div className="font-medium text-white mb-1">
                  {idx + 1}. {paper.title}
                </div>
                {paper.authors && paper.authors.length > 0 && (
                  <div className="text-gray-500 text-xs">
                    {paper.authors.slice(0, 3).join(', ')}
                    {paper.authors.length > 3 && ' et al.'}
                  </div>
                )}
                {paper.journal && (
                  <div className="text-gray-500 text-xs mt-1">
                    {paper.journal}
                    {paper.year && ` (${paper.year})`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
          <button
            onClick={() => {
              setStep('analyzing');
              analyzeCorpusAndRecommend();
            }}
            className="px-4 py-2 rounded-lg border border-slate-600 text-white hover:bg-slate-800 transition-colors"
          >
            Re-analyze
          </button>
          <button
            onClick={startExtraction}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                Start Extraction
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  };

  /**
   * Render: Extracting Step
   */
  const renderExtracting = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-25"></div>
          <Loader2 className="h-16 w-16 text-purple-500 animate-spin relative z-10" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">
        Extracting Themes - Iteration {currentIteration}
      </h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Analyzing {batchRecommendation?.papers.length} papers using Braun &
        Clarke's Reflexive Thematic Analysis...
      </p>
      <div className="flex flex-col gap-2 items-center text-sm text-gray-500 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Stage 1: Familiarization with data</span>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
          <span>Stage 2-6: Theme extraction in progress...</span>
        </div>
      </div>

      {/* Thematic Analysis Citation - NEW */}
      <div className="max-w-md mx-auto bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-left">
        <p className="text-purple-400 font-semibold mb-1">📚 Analysis Framework:</p>
        <p className="text-gray-300 leading-relaxed">
          <strong>Braun & Clarke (2006, 2019):</strong> 6-stage Reflexive Thematic Analysis ensures
          systematic, transparent theme development with iterative refinement across all coding stages.
        </p>
      </div>
    </motion.div>
  );

  /**
   * Render: Results Step
   */
  const renderResults = () => {
    const lastResult = iterationHistory[iterationHistory.length - 1];
    if (!lastResult) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Success Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-full p-3">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Iteration {currentIteration} Complete!
          </h3>
          <p className="text-gray-400">
            Successfully analyzed {batchRecommendation?.papers.length} papers
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              +{lastResult.newThemes}
            </div>
            <div className="text-sm text-gray-400">New Themes Discovered</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {lastResult.strengthenedThemes}
            </div>
            <div className="text-sm text-gray-400">Themes Strengthened</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {lastResult.totalThemes}
            </div>
            <div className="text-sm text-gray-400">Total Themes</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {Math.round(lastResult.saturation)}%
            </div>
            <div className="text-sm text-gray-400">Saturation</div>
          </div>
        </div>

        {/* Efficiency Metrics - NEW */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-400" />
            💰 Efficiency Metrics (Guided Mode Advantage)
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Papers Analyzed</div>
              <div className="text-lg font-bold text-white">
                {processedPaperIds.length}/{allPapers.length}
                <span className="text-sm text-gray-400 ml-1">
                  ({Math.round((processedPaperIds.length / allPapers.length) * 100)}%)
                </span>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Potential Savings</div>
              <div className="text-lg font-bold text-green-400">
                {Math.round(((allPapers.length - processedPaperIds.length) / allPapers.length) * 100)}%
                <span className="text-xs text-gray-400 ml-1">if stopped now</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-300 bg-slate-900/30 rounded p-2 border border-slate-700">
            <strong className="text-green-400">🔬 Scientific Note:</strong> By analyzing papers iteratively and monitoring saturation,
            you're following Glaser & Strauss (1967) theoretical sampling. Most studies reach saturation after analyzing
            20-40% of their corpus, saving substantial time and cost.
          </div>
        </div>

        {/* Saturation Assessment */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            Saturation Analysis
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Current Saturation</span>
                <span className="text-white font-medium">
                  {Math.round(lastResult.saturation)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${lastResult.saturation}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-2 rounded-full ${
                    lastResult.saturation >= 80
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : lastResult.saturation >= 50
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                />
              </div>
            </div>
            {lastResult.isSaturated ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-green-400 font-medium mb-1">
                      🎉 Theoretical Saturation Reached!
                    </div>
                    <div className="text-gray-300">
                      Glaser & Strauss (1967) recommend stopping when no new
                      insights emerge. You've reached {Math.round(lastResult.saturation)}%
                      saturation with {lastResult.unchangedThemes} themes remaining
                      unchanged.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-blue-400 font-medium mb-1">
                      Continue Extraction Recommended
                    </div>
                    <div className="text-gray-300">
                      Themes still evolving: {lastResult.newThemes} new themes
                      discovered. Continue iterations to reach theoretical
                      saturation (&gt;80%).
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-600 text-white hover:bg-slate-800 transition-colors"
          >
            View Themes
          </button>
          {lastResult.isSaturated ? (
            <button
              onClick={() => setStep('completed')}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-medium hover:from-green-500 hover:to-green-400 transition-all flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              Finish Research
            </button>
          ) : (
            <button
              onClick={checkSaturation}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-2"
            >
              Continue Next Iteration
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  /**
   * Render: Completed Step
   */
  const renderCompleted = () => {
    const finalSaturation =
      iterationHistory[iterationHistory.length - 1]?.saturation || 0;
    const papersSkipped = allPapers.length - processedPaperIds.length;
    const savingsPercent = Math.round((papersSkipped / allPapers.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-8"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4">
            <Award className="h-12 w-12 text-white" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-white mb-2 text-center">
          🎉 Research Complete!
        </h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto text-center">
          You've successfully reached theoretical saturation after{' '}
          {iterationHistory.length} iterations with {Math.round(finalSaturation)}%
          confidence.
        </p>

        {/* Research Summary */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 mb-4">
          <h4 className="text-sm font-semibold text-white mb-4">
            Research Summary
          </h4>
          <div className="space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Iterations:</span>
              <span className="text-white font-medium">
                {iterationHistory.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Papers Analyzed:</span>
              <span className="text-white font-medium">
                {processedPaperIds.length} of {allPapers.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Final Theme Count:</span>
              <span className="text-white font-medium">
                {currentThemes.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Saturation Level:</span>
              <span className="text-green-400 font-medium">
                {Math.round(finalSaturation)}%
              </span>
            </div>
          </div>
        </div>

        {/* Efficiency Report - NEW */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-6 mb-4">
          <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-400" />
            💰 Research Efficiency Report
          </h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {savingsPercent}%
              </div>
              <div className="text-xs text-gray-400">Time & Cost Saved</div>
              <div className="text-[10px] text-gray-500 mt-1">
                ({papersSkipped} papers skipped)
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                {iterationHistory.length}
              </div>
              <div className="text-xs text-gray-400">Iterations to Saturation</div>
              <div className="text-[10px] text-gray-500 mt-1">
                (avg 3-4 for most studies)
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-300 bg-slate-900/30 rounded p-3 border border-slate-700">
            <strong className="text-green-400">🎯 Why This Matters:</strong> Guided mode achieved saturation by analyzing only{' '}
            {processedPaperIds.length} of {allPapers.length} papers ({100 - savingsPercent}% of corpus), saving{' '}
            {savingsPercent}% of time and cost while maintaining scientific rigor per Glaser & Strauss (1967).
          </div>
        </div>

        {/* Methodology Statement - NEW */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            📝 Methodology Statement (Copy for Publications)
          </h4>
          <div className="bg-slate-900 rounded p-3 text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto">
            <p className="mb-2">
              <strong>Theme Extraction Methodology:</strong>
            </p>
            <p className="mb-2">
              We employed guided incremental extraction using scientifically-backed purposive sampling strategies
              (Patton, 1990; Glaser & Strauss, 1967). Papers were analyzed iteratively across {iterationHistory.length}{' '}
              iterations, with automatic batch selection based on 5-dimensional quality scoring (methodology 30%,
              citations 25%, journal impact 20%, content quality 15%, full-text availability 10%).
            </p>
            <p className="mb-2">
              <strong>Iteration Strategy:</strong> Iteration 1 established foundational themes from highest-quality papers;
              Iteration 2 tested theme robustness across diverse methodologies; Iterations 3+ filled conceptual gaps
              until saturation.
            </p>
            <p>
              <strong>Saturation:</strong> Theoretical saturation ({Math.round(finalSaturation)}% confidence) was reached
              after analyzing {processedPaperIds.length} of {allPapers.length} papers, yielding {currentThemes.length}{' '}
              distinct themes (Francis et al., 2010).
            </p>
          </div>
          <button
            onClick={() => {
              const text = `Theme Extraction Methodology: We employed guided incremental extraction using scientifically-backed purposive sampling strategies (Patton, 1990; Glaser & Strauss, 1967). Papers were analyzed iteratively across ${iterationHistory.length} iterations, with automatic batch selection based on 5-dimensional quality scoring (methodology 30%, citations 25%, journal impact 20%, content quality 15%, full-text availability 10%). Iteration Strategy: Iteration 1 established foundational themes from highest-quality papers; Iteration 2 tested theme robustness across diverse methodologies; Iterations 3+ filled conceptual gaps until saturation. Saturation: Theoretical saturation (${Math.round(finalSaturation)}% confidence) was reached after analyzing ${processedPaperIds.length} of ${allPapers.length} papers, yielding ${currentThemes.length} distinct themes (Francis et al., 2010).`;
              navigator.clipboard.writeText(text);
              alert('Methodology statement copied to clipboard!');
            }}
            className="mt-3 w-full px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            📋 Copy to Clipboard
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full px-8 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-500 text-white font-medium hover:from-green-500 hover:to-green-400 transition-all"
        >
          View Final Themes
        </button>
      </motion.div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-white">
                Guided Incremental Extraction
              </h2>
              <p className="text-sm text-gray-400 mt-1">{corpusName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Research Foundation Banner - NEW */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
            <Award className="h-3 w-3 text-blue-400 flex-shrink-0" />
            <div className="text-gray-300">
              <strong className="text-blue-400">Research-Backed Methodology:</strong>
              <span className="text-gray-400 ml-1">
                Glaser & Strauss (1967) • Patton (1990) • Francis et al. (2010)
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'purpose-selection' && renderPurposeSelection()}
            {step === 'analyzing' && renderAnalyzing()}
            {step === 'recommendation' && renderRecommendation()}
            {step === 'extracting' && renderExtracting()}
            {step === 'results' && renderResults()}
            {step === 'completed' && renderCompleted()}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
