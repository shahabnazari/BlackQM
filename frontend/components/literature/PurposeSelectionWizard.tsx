'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical,
  ClipboardList,
  MessageSquareText,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Info,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock, // Phase 10.180: For "available" status
  Loader2, // Netflix-Grade: For full-text detection progress
} from 'lucide-react';
// TYPE SAFETY: Import ContentType enum for proper type checking
import { ContentType } from '@/lib/types/content-types';
import { logger } from '@/lib/utils/logger';

/**
 * PurposeSelectionWizard Component
 *
 * Revolutionary 3-step research goal selection interface (Patent Claim #2)
 * Implements purpose-adaptive theme extraction with scientific backing.
 *
 * Week 2 Day 5.13 - Enterprise-Grade UX Implementation
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ResearchPurpose =
  | 'q_methodology'
  | 'survey_construction'
  | 'qualitative_analysis'
  | 'literature_synthesis'
  | 'hypothesis_generation';

interface PurposeConfig {
  id: ResearchPurpose;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  targetThemeCount: { min: number; max: number };
  extractionFocus: 'breadth' | 'depth' | 'saturation';
  themeGranularity: 'fine' | 'medium' | 'coarse';
  citation: string;
  scientificBacking: string;
  bestFor: string[];
  example: string;
  // PHASE 10 DAY 5.17: Purpose-specific content requirements
  contentRequirements: {
    minFullText: number;
    level: 'optional' | 'recommended' | 'required' | 'blocking';
    rationale: string;
  };
}

/**
 * Content availability status for a paper
 * Phase 10.180: Netflix-grade status tracking
 */
type ContentAvailabilityStatus = 'ready' | 'available' | 'unavailable';

interface ContentAnalysis {
  // === READY CONTENT (already fetched) ===
  fullTextCount: number;
  abstractOverflowCount: number;
  abstractCount: number;

  // === AVAILABLE CONTENT (can be fetched) ===
  /** Phase 10.180: Papers with hasFullText=true but content not yet fetched */
  fullTextAvailableCount: number;

  // === UNAVAILABLE ===
  noContentCount: number;

  // === SUMMARY STATS ===
  avgContentLength: number;
  hasFullTextContent: boolean;
  sources: any[];
  totalSelected: number;
  /** Total with content READY (already fetched) */
  totalWithContent: number;
  /** Phase 10.180: Total that CAN have content (ready + available) */
  totalWithContentAvailable: number;
  totalSkipped: number;
  /** Phase 10.180: Papers pending full-text fetch */
  totalPendingFetch: number;

  selectedPapersList: Array<{
    id: string;
    title: string;
    hasContent: boolean;
    contentType: ContentType;
    contentLength: number;
    /** Phase 10.180: Availability status for UI display */
    availabilityStatus: ContentAvailabilityStatus;
    skipReason?: string;
  }>;
}

interface PurposeSelectionWizardProps {
  onPurposeSelected: (purpose: ResearchPurpose) => void;
  onCancel?: () => void;
  initialPurpose?: ResearchPurpose;
  contentAnalysis: ContentAnalysis;
  /** Netflix-Grade: Full-text detection status for progress indicator */
  isDetectingFullText?: boolean;
  detectedCount?: number;
  totalDetecting?: number;
}

// ============================================================================
// PURPOSE CONFIGURATIONS (Scientifically Grounded)
// ============================================================================

const PURPOSE_CONFIGS: Record<ResearchPurpose, PurposeConfig> = {
  q_methodology: {
    id: 'q_methodology',
    title: 'Q-Methodology',
    description:
      'Generate a broad concourse of 30-80 diverse statements for Q-sorts',
    icon: FlaskConical,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
    targetThemeCount: { min: 30, max: 80 },
    extractionFocus: 'breadth',
    themeGranularity: 'fine',
    citation:
      'Stephenson, W. (1953). The Study of Behavior: Q-Technique and Its Methodology.',
    scientificBacking:
      'Q-methodology requires a broad concourse (30-80 statements) representing the full diversity of viewpoints on a topic. While 40-60 is typical, focused studies can use as few as 30 statements. The algorithm prioritizes breadth over depth, ensuring comprehensive coverage of the discourse space.',
    bestFor: [
      'Exploring subjective viewpoints and perspectives',
      'Understanding how people frame complex topics',
      'Identifying distinct patterns of thinking',
      'Research requiring participant sorting tasks',
    ],
    example:
      'Example: Studying public attitudes toward climate change by generating 60 diverse statements for participants to sort by agreement.',
    contentRequirements: {
      minFullText: 0,
      level: 'optional',
      rationale:
        'Q-Methodology prioritizes breadth over depth. Abstracts provide sufficient diversity for statement generation.',
    },
  },
  survey_construction: {
    id: 'survey_construction',
    title: 'Survey Construction',
    description: 'Identify 5-15 core constructs for scale development',
    icon: ClipboardList,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
    targetThemeCount: { min: 5, max: 15 },
    extractionFocus: 'depth',
    themeGranularity: 'coarse',
    citation:
      'Churchill, G. A. (1979). A Paradigm for Developing Better Measures; DeVellis, R. F. (2016). Scale Development.',
    scientificBacking:
      'Survey construction paradigm (Churchill 1979; DeVellis 2016) recommends 5-15 latent constructs, each measured by multiple items. The algorithm prioritizes depth and conceptual clarity, identifying high-level constructs suitable for item generation.',
    bestFor: [
      'Developing psychometric scales and surveys',
      'Measuring latent constructs (e.g., trust, satisfaction)',
      'Creating validated measurement instruments',
      'Research requiring statistical factor analysis',
    ],
    example:
      'Example: Developing a workplace well-being scale by identifying 8 constructs (e.g., autonomy, belonging, purpose) from organizational research.',
    contentRequirements: {
      minFullText: 5,
      level: 'recommended',
      rationale:
        'Full-text papers provide richer construct definitions, operational details, and theoretical depth needed for scale development.',
    },
  },
  qualitative_analysis: {
    id: 'qualitative_analysis',
    title: 'Qualitative Analysis',
    description: 'Extract 5-20 themes until theoretical saturation is reached',
    icon: MessageSquareText,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200 hover:border-green-400',
    targetThemeCount: { min: 5, max: 20 },
    extractionFocus: 'saturation',
    themeGranularity: 'medium',
    citation: 'Braun & Clarke (2006, 2019). Reflexive Thematic Analysis.',
    scientificBacking:
      'Reflexive thematic analysis (Braun & Clarke 2006, 2019) aims for conceptual saturation—extracting themes until no new patterns emerge. The algorithm tracks saturation across sources and recommends when sufficient themes have been identified.',
    bestFor: [
      'Exploratory qualitative research',
      'Understanding lived experiences and meanings',
      'Identifying patterns in interview or text data',
      'Research prioritizing interpretive depth',
    ],
    example:
      'Example: Analyzing patient interviews about chronic illness experiences, extracting 12 themes (e.g., loss of control, adaptation strategies).',
    contentRequirements: {
      minFullText: 3,
      level: 'recommended',
      rationale:
        'Flexible requirements. Abstracts work for descriptive themes; full-text recommended for explanatory depth and mechanisms.',
    },
  },
  literature_synthesis: {
    id: 'literature_synthesis',
    title: 'Literature Synthesis',
    description: 'Synthesize 10-25 meta-themes across multiple studies',
    icon: BookOpen,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200 hover:border-orange-400',
    targetThemeCount: { min: 10, max: 25 },
    extractionFocus: 'breadth',
    themeGranularity: 'medium',
    citation:
      'Noblit & Hare (1988). Meta-Ethnography: Synthesizing Qualitative Studies.',
    scientificBacking:
      'Meta-ethnography (Noblit & Hare 1988) synthesizes findings across multiple qualitative studies. The algorithm identifies cross-study themes, preserving nuance while building higher-order interpretations.',
    bestFor: [
      'Systematic literature reviews',
      'Meta-synthesis of qualitative research',
      'Identifying patterns across multiple studies',
      'Building integrative frameworks from existing research',
    ],
    example:
      'Example: Synthesizing 50 studies on teacher burnout to identify 15 cross-study themes (e.g., workload, lack of support).',
    contentRequirements: {
      minFullText: 10,
      level: 'blocking',
      rationale:
        'Meta-ethnography requires full findings sections, not just abstracts. Without full-text, synthesis is superficial and methodologically flawed.',
    },
  },
  hypothesis_generation: {
    id: 'hypothesis_generation',
    title: 'Hypothesis Generation',
    description:
      'Identify 8-15 theory-building themes for hypothesis development',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-400',
    targetThemeCount: { min: 8, max: 15 },
    extractionFocus: 'depth',
    themeGranularity: 'medium',
    citation: 'Glaser & Strauss (1967). The Discovery of Grounded Theory.',
    scientificBacking:
      'Grounded theory (Glaser & Strauss 1967) generates hypotheses inductively from data. The algorithm identifies conceptual themes that can be operationalized into testable hypotheses, balancing specificity with theoretical abstraction.',
    bestFor: [
      'Exploratory research leading to hypothesis testing',
      'Theory-building from qualitative data',
      'Identifying relationships and causal mechanisms',
      'Research bridging qualitative and quantitative paradigms',
    ],
    example:
      'Example: Analyzing consumer reviews to generate 10 themes about purchase decisions, leading to testable hypotheses about brand loyalty.',
    contentRequirements: {
      minFullText: 8,
      level: 'blocking',
      rationale:
        'Grounded theory requires causal mechanisms and theoretical depth from methods/results sections. Abstracts lack the detail needed for hypothesis generation.',
    },
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PurposeSelectionWizard({
  onPurposeSelected,
  onCancel,
  initialPurpose,
  contentAnalysis,
  isDetectingFullText = false,
  detectedCount = 0,
  totalDetecting = 0,
}: PurposeSelectionWizardProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // PHASE 10 DAY 5.16: Start at Step 0 (Content Analysis)
  const [selectedPurpose, setSelectedPurpose] =
    useState<ResearchPurpose | null>(initialPurpose || null);

  /**
   * Phase 10.180: Netflix-grade content sufficiency validation
   *
   * Counts TOTAL full-text potential:
   * - fullTextCount: Already fetched
   * - fullTextAvailableCount: Will be fetched before extraction
   * - abstractOverflowCount: Rich abstracts (250+ words)
   */
  const validateContentSufficiency = (purpose: ResearchPurpose) => {
    const config = PURPOSE_CONFIGS[purpose];
    // Phase 10.180: Include fullTextAvailableCount - these WILL be fetched
    const totalFullTextPotential =
      contentAnalysis.fullTextCount +
      contentAnalysis.fullTextAvailableCount + // NEW: Papers with hasFullText=true
      contentAnalysis.abstractOverflowCount;
    const requirements = config.contentRequirements;

    const isSufficient = totalFullTextPotential >= requirements.minFullText;

    return {
      isSufficient,
      level: requirements.level,
      minRequired: requirements.minFullText,
      currentCount: totalFullTextPotential,
      // Phase 10.180: Show breakdown for transparency
      breakdown: {
        ready: contentAnalysis.fullTextCount,
        pendingFetch: contentAnalysis.fullTextAvailableCount,
        extendedAbstracts: contentAnalysis.abstractOverflowCount,
      },
      rationale: requirements.rationale,
      isBlocking: requirements.level === 'blocking' && !isSufficient,
    };
  };

  // Get validation status for selected purpose
  const selectedConfig = selectedPurpose
    ? PURPOSE_CONFIGS[selectedPurpose]
    : null;
  const validationStatus = selectedPurpose
    ? validateContentSufficiency(selectedPurpose)
    : null;

  // Step 0: Content Analysis (NEW!)
  const handleContinueToPurposeSelection = () => {
    setStep(1);
  };

  // Step 1: Purpose Selection
  const handlePurposeClick = (purpose: ResearchPurpose) => {
    setSelectedPurpose(purpose);
    setStep(2);
  };

  // Step 2: Review Scientific Backing
  const handleContinueToPreview = () => {
    setStep(3);
  };

  // Step 3: Confirm Selection
  const handleConfirm = () => {
    logger.info('handleConfirm() called', 'PurposeSelectionWizard', { selectedPurpose, sourcesCount: contentAnalysis.sources?.length });

    if (!selectedPurpose) {
      logger.error('No purpose selected', 'PurposeSelectionWizard');
      return;
    }

    // PHASE 10 DAY 5.17: Safety check - validate content before confirming
    const validation = validateContentSufficiency(selectedPurpose);
    logger.debug('Validation result', 'PurposeSelectionWizard', { validation });

    if (validation.isBlocking) {
      // Should never reach here due to Step 2/3 button disabling,
      // but add safety check as defense in depth
      logger.error('Cannot confirm extraction with insufficient content', 'PurposeSelectionWizard', { validation });
      return;
    }

    logger.info('Calling onPurposeSelected', 'PurposeSelectionWizard', { purpose: selectedPurpose });
    onPurposeSelected(selectedPurpose);
  };

  const handleBack = () => {
    if (step === 1) {
      setStep(0);
      setSelectedPurpose(null);
    } else if (step === 2) {
      setStep(1);
      setSelectedPurpose(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', duration: 0.3, damping: 25 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="wizard-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {step === 0 && 'Content Analysis'}
                {step === 1 && 'Select Your Research Goal'}
                {step === 2 && 'Scientific Backing'}
                {step === 3 && 'Review & Confirm'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {step === 0 &&
                  'Review your selected sources and expected extraction quality'}
                {step === 1 &&
                  'Choose the purpose that best matches your research needs'}
                {step === 2 &&
                  'Understanding the methodology behind your choice'}
                {step === 3 && 'Final parameter review before extraction'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3].map(s => (
                  <div
                    key={s}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      s === step
                        ? 'bg-blue-600'
                        : s < step
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* STEP 0: Content Analysis (PHASE 10 DAY 5.16 - ENTERPRISE UX) */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Content Type Breakdown */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Selected Sources Analysis
                  </h3>

                  {/* Netflix-Grade: Show all categories with accurate counts */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {/* READY: Full-text fetched */}
                    <div className={`border-2 rounded-lg p-3 text-center ${
                      contentAnalysis.fullTextCount > 0 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        contentAnalysis.fullTextCount > 0 ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        {contentAnalysis.fullTextCount}
                      </div>
                      <div className={`text-xs mt-1 ${
                        contentAnalysis.fullTextCount > 0 ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        Full-text ready
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        contentAnalysis.fullTextCount > 0 ? 'text-green-500' : 'text-gray-400'
                      }`}>
                        {contentAnalysis.fullTextCount > 0 ? '✓ Already fetched' : 'None fetched'}
                      </div>
                    </div>

                    {/* AVAILABLE: Full-text detected but not yet fetched */}
                    <div className={`border-2 rounded-lg p-3 text-center ${
                      contentAnalysis.fullTextAvailableCount > 0 
                        ? 'bg-amber-50 border-amber-300' 
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        contentAnalysis.fullTextAvailableCount > 0 ? 'text-amber-700' : 'text-gray-400'
                      }`}>
                        {contentAnalysis.fullTextAvailableCount}
                      </div>
                      <div className={`text-xs mt-1 ${
                        contentAnalysis.fullTextAvailableCount > 0 ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        Full-text available
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        contentAnalysis.fullTextAvailableCount > 0 ? 'text-amber-500' : 'text-gray-400'
                      }`}>
                        {contentAnalysis.fullTextAvailableCount > 0 ? '⏳ Will be fetched' : 'None detected'}
                      </div>
                    </div>

                    {/* READY: Abstracts (combined extended + standard) */}
                    <div className={`border-2 rounded-lg p-3 text-center ${
                      (contentAnalysis.abstractOverflowCount + contentAnalysis.abstractCount) > 0 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        (contentAnalysis.abstractOverflowCount + contentAnalysis.abstractCount) > 0 
                          ? 'text-blue-700' 
                          : 'text-gray-400'
                      }`}>
                        {contentAnalysis.abstractOverflowCount + contentAnalysis.abstractCount}
                      </div>
                      <div className={`text-xs mt-1 ${
                        (contentAnalysis.abstractOverflowCount + contentAnalysis.abstractCount) > 0 
                          ? 'text-blue-600' 
                          : 'text-gray-500'
                      }`}>
                        Abstracts ready
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        (contentAnalysis.abstractOverflowCount + contentAnalysis.abstractCount) > 0 
                          ? 'text-blue-500' 
                          : 'text-gray-400'
                      }`}>
                        {(contentAnalysis.abstractOverflowCount + contentAnalysis.abstractCount) > 0 
                          ? '✓ Already fetched' 
                          : 'None available'}
                      </div>
                    </div>

                    {/* UNAVAILABLE: No content detected */}
                    <div className={`border-2 rounded-lg p-3 text-center ${
                      contentAnalysis.noContentCount > 0 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}>
                      <div className={`text-2xl font-bold ${
                        contentAnalysis.noContentCount > 0 ? 'text-red-700' : 'text-gray-400'
                      }`}>
                        {contentAnalysis.noContentCount}
                      </div>
                      <div className={`text-xs mt-1 ${
                        contentAnalysis.noContentCount > 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        No content
                      </div>
                      <div className={`text-xs mt-0.5 ${
                        contentAnalysis.noContentCount > 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {contentAnalysis.noContentCount > 0 ? '✗ Will be skipped' : 'None'}
                      </div>
                    </div>
                  </div>

                  {/* Netflix-Grade: Total verification */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="text-sm text-gray-700 text-center">
                      <strong>Total: {contentAnalysis.totalSelected} papers</strong>
                      {' • '}
                      <span className="text-green-600">
                        {contentAnalysis.fullTextCount + contentAnalysis.fullTextAvailableCount} with full-text
                      </span>
                      {' • '}
                      <span className="text-blue-600">
                        {contentAnalysis.abstractOverflowCount + contentAnalysis.abstractCount} with abstracts only
                      </span>
                      {contentAnalysis.noContentCount > 0 && (
                        <>
                          {' • '}
                          <span className="text-red-600">
                            {contentAnalysis.noContentCount} skipped
                          </span>
                        </>
                      )}
                    </div>
                    {/* Netflix-Grade: Detection status indicator */}
                    {isDetectingFullText && (
                      <div className="mt-2 text-xs text-amber-600 text-center flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Detecting full-text availability... ({detectedCount}/{totalDetecting})</span>
                      </div>
                    )}
                  </div>

                  {/* Netflix-Grade: Full-text detection explanation */}
                  {contentAnalysis.fullTextAvailableCount === 0 && contentAnalysis.fullTextCount === 0 && (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-amber-900 mb-2">
                            ℹ️ Full-Text Detection Status
                          </h4>
                          <p className="text-sm text-amber-800 leading-relaxed mb-2">
                            <strong>Full-text detection runs automatically during search</strong> using our 7-tier detection system. 
                            If you see 0 full-texts available, it typically means:
                          </p>
                          <ul className="text-xs text-amber-700 list-disc list-inside space-y-1 mb-2 ml-2">
                            <li>Detection ran but no full-text sources were found (papers may be behind paywalls)</li>
                            <li>Papers were saved before detection ran (detection happens during search, not when saving)</li>
                            <li>Detection priority was set to 'low' (skips full-text detection for performance)</li>
                          </ul>
                          <p className="text-xs text-amber-600 italic mt-2">
                            💡 <strong>Note:</strong> Papers with abstracts often have full-text available. 
                            The system will attempt to fetch full-text automatically during theme extraction if sources become available.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 10.180: Full-Text Detection Information */}
                  {contentAnalysis.noContentCount > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            ℹ️ Full-Text Detection Status
                          </h4>
                          <p className="text-sm text-blue-800 leading-relaxed mb-2">
                            <strong>{contentAnalysis.noContentCount} papers</strong> were checked for full-text availability 
                            using our <strong>7-tier detection system</strong>:
                          </p>
                          <ul className="text-xs text-blue-700 list-disc list-inside space-y-1 mb-2 ml-2">
                            <li>Database check (already fetched)</li>
                            <li>Direct PDF URL detection</li>
                            <li>PMC pattern matching</li>
                            <li>Unpaywall API (open-access database)</li>
                            <li>Publisher HTML scraping</li>
                            <li>Secondary link scanning</li>
                            <li>AI content verification</li>
                          </ul>
                          <p className="text-sm text-blue-700">
                            <strong>No full-text sources were found</strong> for these papers. This typically means:
                          </p>
                          <ul className="text-xs text-blue-600 list-disc list-inside space-y-1 mt-1 ml-2">
                            <li>Paper is behind a paywall (subscription required)</li>
                            <li>Publisher doesn't provide open-access PDFs</li>
                            <li>Full-text only available in institutional repositories</li>
                            <li>Paper metadata incomplete (missing DOI/URL)</li>
                          </ul>
                          <p className="text-xs text-blue-600 mt-2 italic">
                            <strong>Note:</strong> Full-text will be automatically fetched during extraction 
                            if sources become available or if you have institutional access.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 10.180: Pending fetch notice */}
                  {contentAnalysis.totalPendingFetch > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 text-lg">⏳</span>
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            {contentAnalysis.totalPendingFetch} papers have full-text available
                          </p>
                          <p className="text-xs text-amber-600">
                            Content will be automatically fetched before theme extraction
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quality Assessment */}
                  <div
                    className={`rounded-lg p-4 ${contentAnalysis.hasFullTextContent ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Info
                        className={`w-5 h-5 mt-0.5 ${contentAnalysis.hasFullTextContent ? 'text-green-600' : 'text-blue-600'}`}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Expected Theme Quality:{' '}
                          {contentAnalysis.hasFullTextContent
                            ? 'HIGH'
                            : 'MODERATE'}
                        </h4>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {contentAnalysis.hasFullTextContent ? (
                            <>
                              <strong>Full-text papers</strong> provide{' '}
                              <strong>40-50x more content</strong> than
                              abstracts (10,000+ words vs 150-500 words). This
                              enables deeper theme extraction with richer
                              contextual evidence and more nuanced codes. The
                              system will use{' '}
                              <strong>strict validation thresholds</strong> to
                              ensure high-quality themes.
                            </>
                          ) : (
                            <>
                              Abstract-only content (~
                              {Math.round(
                                contentAnalysis.avgContentLength
                              )}{' '}
                              characters average) provides less context than
                              full-text papers. The system has automatically
                              activated{' '}
                              <strong>adaptive validation thresholds</strong> to
                              account for shorter content length. For best
                              results, consider adding full-text papers if
                              available.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 10.180: Show ALL selected sources with availability status */}
                {contentAnalysis.selectedPapersList && contentAnalysis.selectedPapersList.length > 0 && (
                  <div className="bg-white border-2 border-blue-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        Selected Sources ({contentAnalysis.totalSelected})
                      </h3>
                      <div className="flex items-center gap-3 text-sm">
                        {contentAnalysis.totalPendingFetch > 0 && (
                          <span className="text-amber-600 font-medium">
                            ⏳ {contentAnalysis.totalPendingFetch} to fetch
                          </span>
                        )}
                        {contentAnalysis.totalSkipped > 0 && (
                          <span className="text-red-600 font-medium">
                            ⚠️ {contentAnalysis.totalSkipped} skipped
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {contentAnalysis.selectedPapersList.map((paper, idx) => {
                        // Phase 10.180: Style based on availability status
                        const statusStyles = {
                          ready: 'bg-green-50 border-green-200',
                          available: 'bg-amber-50 border-amber-200',
                          unavailable: 'bg-red-50 border-red-200',
                        };
                        const iconColors = {
                          ready: 'text-green-600',
                          available: 'text-amber-600',
                          unavailable: 'text-red-600',
                        };
                        const status = paper.availabilityStatus || (paper.hasContent ? 'ready' : 'unavailable');

                        return (
                          <div
                            key={paper.id || idx}
                            className={`p-3 rounded-lg border-2 ${statusStyles[status]}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {status === 'ready' && <CheckCircle2 className={`w-5 h-5 ${iconColors.ready}`} />}
                                {status === 'available' && <Clock className={`w-5 h-5 ${iconColors.available}`} />}
                                {status === 'unavailable' && <AlertCircle className={`w-5 h-5 ${iconColors.unavailable}`} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate" title={paper.title}>
                                  {paper.title}
                                </p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {/* Status badge */}
                                  {status === 'ready' && (
                                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-green-100 text-green-700">
                                      ✅ Ready
                                    </span>
                                  )}
                                  {status === 'available' && (
                                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-700">
                                      ⏳ Will fetch
                                    </span>
                                  )}
                                  {status === 'unavailable' && (
                                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-red-100 text-red-700">
                                      ❌ Skipped
                                    </span>
                                  )}

                                  {/* Content type for ready papers */}
                                  {status === 'ready' && paper.hasContent && (
                                    <span className="text-xs text-gray-600">
                                      {paper.contentType === ContentType.FULL_TEXT && '📄 Full-text'}
                                      {paper.contentType === ContentType.ABSTRACT_OVERFLOW && '📋 Extended abstract'}
                                      {paper.contentType === ContentType.ABSTRACT && '📃 Abstract'}
                                      {paper.contentType === ContentType.VIDEO_TRANSCRIPT && '🎥 Video transcript'}
                                      {' • '}
                                      {paper.contentLength.toLocaleString()} chars
                                    </span>
                                  )}

                                  {/* Skip reason for unavailable papers */}
                                  {status === 'unavailable' && paper.skipReason && (
                                    <div className="text-xs text-red-600">
                                      <span className="italic">{paper.skipReason}</span>
                                      <p className="text-red-500 mt-1">
                                        ℹ️ Checked via 7-tier detection: Database → Direct URL → PMC → Unpaywall → Publisher HTML → Secondary Links → AI Verification
                                      </p>
                                    </div>
                                  )}

                                  {/* Info for available papers */}
                                  {status === 'available' && (
                                    <div className="text-xs text-amber-700">
                                      <p>Full-text source detected via 7-tier detection. Will be fetched automatically before extraction.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Phase 10.180: Summary Stats with availability breakdown */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-green-700 font-medium">
                          ✅ {contentAnalysis.totalWithContent} ready
                        </span>
                        {contentAnalysis.totalPendingFetch > 0 && (
                          <span className="text-amber-700 font-medium">
                            ⏳ {contentAnalysis.totalPendingFetch} to fetch
                          </span>
                        )}
                        {contentAnalysis.totalSkipped > 0 && (
                          <span className="text-red-700 font-medium">
                            ❌ {contentAnalysis.totalSkipped} skipped
                          </span>
                        )}
                      </div>
                      <span className="text-gray-600">
                        Total usable: {contentAnalysis.totalWithContentAvailable}/{contentAnalysis.totalSelected}
                      </span>
                    </div>
                  </div>
                )}

                {/* What Happens Next Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    What Happens Next
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    In the next step, you'll select your research purpose. Each
                    purpose has different content requirements:
                  </p>
                  <ul className="space-y-2.5 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-semibold">✅</span>
                      <span>
                        <strong>Q-Methodology:</strong> Abstracts sufficient
                        (breadth &gt; depth). Generates 40-80 diverse
                        statements.{' '}
                        <span className="text-gray-600">Min: 0 full-text</span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-semibold">⚠️</span>
                      <span>
                        <strong>Survey Construction:</strong> Full-text strongly
                        recommended for construct depth and item pools.{' '}
                        <span className="text-gray-600">
                          Min: 5 full-text recommended
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-semibold">ℹ️</span>
                      <span>
                        <strong>Qualitative Analysis:</strong> Flexible.
                        Abstracts OK for descriptive; full-text for explanatory
                        depth.{' '}
                        <span className="text-gray-600">
                          Min: 3 full-text optional
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-semibold">🔥</span>
                      <span>
                        <strong>Literature Synthesis:</strong> Full-text
                        REQUIRED (needs findings sections for meta-ethnography).{' '}
                        <span className="text-gray-600">
                          Min: 10 full-text required
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-semibold">🔥</span>
                      <span>
                        <strong>Hypothesis Generation:</strong> Full-text
                        REQUIRED (needs mechanisms for grounded theory).{' '}
                        <span className="text-gray-600">
                          Min: 8 full-text required
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Purpose Cards */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {Object.values(PURPOSE_CONFIGS).map(config => {
                  const Icon = config.icon;
                  return (
                    <motion.button
                      key={config.id}
                      onClick={() => handlePurposeClick(config.id)}
                      className={`w-full text-left p-6 rounded-lg border-2 transition-all ${config.borderColor} ${config.bgColor} hover:shadow-lg group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={`Select ${config.title} purpose`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${config.color}`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {config.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-mono">
                                {config.targetThemeCount.min}-
                                {config.targetThemeCount.max} themes
                              </span>
                              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mt-2">
                            {config.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                              Focus: {config.extractionFocus}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                              Granularity: {config.themeGranularity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* STEP 2: Scientific Backing */}
            {step === 2 && selectedConfig && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Selected Purpose Header */}
                <div
                  className={`p-6 rounded-lg ${selectedConfig.bgColor} border-2 ${selectedConfig.borderColor.replace('hover:', '')}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg bg-white shadow-sm ${selectedConfig.color}`}
                    >
                      {React.createElement(selectedConfig.icon, {
                        className: 'w-8 h-8',
                      })}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedConfig.title}
                      </h3>
                      <p className="text-gray-700 mt-1">
                        {selectedConfig.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PHASE 10 DAY 5.17: Content Sufficiency Warning */}
                {validationStatus && !validationStatus.isSufficient && (
                  <div
                    className={`p-5 rounded-lg border-2 ${
                      validationStatus.isBlocking
                        ? 'bg-red-50 border-red-300'
                        : validationStatus.level === 'recommended'
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-blue-50 border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                          validationStatus.isBlocking
                            ? 'text-red-600'
                            : validationStatus.level === 'recommended'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                        }`}
                      />
                      <div className="flex-1">
                        <h4
                          className={`font-bold mb-2 ${
                            validationStatus.isBlocking
                              ? 'text-red-900'
                              : validationStatus.level === 'recommended'
                                ? 'text-yellow-900'
                                : 'text-blue-900'
                          }`}
                        >
                          {validationStatus.isBlocking &&
                            '⛔ Insufficient Content - Cannot Proceed'}
                          {validationStatus.level === 'recommended' &&
                            !validationStatus.isBlocking &&
                            '⚠️ Recommended Content Not Met'}
                          {validationStatus.level === 'required' &&
                            !validationStatus.isBlocking &&
                            'ℹ️ Content Requirements'}
                        </h4>
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>{selectedConfig.title}</strong> requires at
                          least{' '}
                          <strong>
                            {validationStatus.minRequired} full-text paper
                            {validationStatus.minRequired !== 1 ? 's' : ''}
                          </strong>
                          , but you currently have{' '}
                          <strong>{validationStatus.currentCount}</strong>.
                        </p>
                        <p className="text-sm text-gray-700 mb-4">
                          {validationStatus.rationale}
                        </p>
                        {validationStatus.isBlocking && (
                          <div className="bg-white border border-red-200 rounded p-3 text-sm">
                            <p className="font-semibold text-red-900 mb-2">
                              To proceed:
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-gray-700">
                              <li>
                                Go back and select papers with full-text PDFs
                                available
                              </li>
                              <li>
                                Or choose a different research purpose (e.g.,
                                Q-Methodology works with abstracts)
                              </li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scientific Backing */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Scientific Foundation
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {selectedConfig.scientificBacking}
                      </p>
                      <p className="text-xs text-gray-600 italic">
                        Citation: {selectedConfig.citation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Best For */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Best For:
                  </h4>
                  <ul className="space-y-2">
                    {selectedConfig.bestFor.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Example */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Example Use Case
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selectedConfig.example}
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Parameter Preview */}
            {step === 3 && selectedConfig && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Selected Purpose Summary */}
                <div
                  className={`p-6 rounded-lg ${selectedConfig.bgColor} border-2 ${selectedConfig.borderColor.replace('hover:', '')}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg bg-white shadow-sm ${selectedConfig.color}`}
                    >
                      {React.createElement(selectedConfig.icon, {
                        className: 'w-8 h-8',
                      })}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedConfig.title}
                      </h3>
                      <p className="text-gray-700 mt-1">
                        {selectedConfig.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PHASE 10 DAY 5.17: Show persistent warning in Step 3 if blocking */}
                {validationStatus && validationStatus.isBlocking && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-900 font-bold mb-2">
                          ⛔ Cannot Proceed: Insufficient Content
                        </p>
                        <p className="text-sm text-red-800">
                          {validationStatus.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extraction Parameters */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Extraction Parameters
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Target Theme Count
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedConfig.targetThemeCount.min}-
                        {selectedConfig.targetThemeCount.max}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Extraction Focus
                      </p>
                      <p className="text-2xl font-bold text-gray-900 capitalize">
                        {selectedConfig.extractionFocus}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Theme Granularity
                      </p>
                      <p className="text-2xl font-bold text-gray-900 capitalize">
                        {selectedConfig.themeGranularity}
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">
                        Validation Rigor
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        Rigorous
                      </p>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    What Happens Next
                  </h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">1.</span>
                      <span>
                        The system will perform 6-stage reflexive thematic
                        analysis on your sources
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">2.</span>
                      <span>
                        You'll see transparent progress messages explaining each
                        stage in real-time
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">3.</span>
                      <span>
                        Themes will be extracted according to{' '}
                        {selectedConfig.title} best practices
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">4.</span>
                      <span>
                        You can refine themes iteratively if needed (Stages 4-6
                        are non-linear)
                      </span>
                    </li>
                  </ol>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
              >
                Cancel
              </button>
            )}
            {step === 0 && (
              <button
                onClick={handleContinueToPurposeSelection}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next: Choose Research Purpose
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleContinueToPreview}
                disabled={validationStatus?.isBlocking}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  validationStatus?.isBlocking
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed focus:ring-gray-400'
                    : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-blue-500'
                }`}
                title={
                  validationStatus?.isBlocking
                    ? 'Cannot proceed with insufficient content'
                    : ''
                }
              >
                Continue to Preview
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleConfirm}
                disabled={validationStatus?.isBlocking}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  validationStatus?.isBlocking
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed focus:ring-gray-400'
                    : 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 focus:ring-green-500'
                }`}
                title={
                  validationStatus?.isBlocking
                    ? 'Cannot proceed with insufficient content'
                    : ''
                }
              >
                <CheckCircle2 className="w-5 h-5" />
                Start Extraction
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
