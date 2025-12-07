/**
 * Theme Extraction Container - STRICT AUDIT MODE CORRECTED
 * Phase 10.91 Day 7: Container Extraction - Theme Extraction
 *
 * **AUDIT FIXES APPLIED:**
 * - ✅ Fixed `any` types (Issue #3)
 * - ✅ Added defensive programming for property access (Issues #1, #2)
 * - ✅ Memoized getTargetRange function (Issue #11)
 * - ✅ Memoized all handler functions (Issue #12)
 * - ✅ Memoized helper components (Issue #13)
 * - ✅ Added proper TypeScript types for source objects
 *
 * **Purpose:**
 * Centralized container for theme extraction display and actions.
 * Orchestrates theme visualization, purpose-specific actions, and downstream research workflows.
 *
 * **Responsibilities:**
 * - Theme list display and rendering
 * - Purpose-specific actions coordination (Q-methodology, Survey, Qualitative, etc.)
 * - Theme selection management
 * - Research output generation (questions, hypotheses, constructs, surveys)
 * - Empty state and loading state handling
 * - Source summary visualization
 *
 * **Architecture Pattern:**
 * Container Component (Smart Component)
 * - Handles business logic and state
 * - Uses hooks for API interactions
 * - Composes presentational components
 * - Minimal UI logic
 *
 * **Sub-Components:**
 * - EnterpriseThemeCard: Individual theme display with confidence badges
 * - ThemeCountGuidance: Saturation visualization and guidance
 * - ThemeMethodologyExplainer: Educational transparency component
 * - PurposeSpecificActions: Purpose-specific research output actions
 *
 * **State Management:**
 * - useThemeExtractionStore: Theme state, extraction status, purpose
 * - Local state: selectedThemeIds, loading states, generated outputs
 *
 * **Enterprise Standards:**
 * - ✅ TypeScript strict mode (NO any types)
 * - ✅ Input validation
 * - ✅ Enterprise logging (no console.log)
 * - ✅ Configuration constants
 * - ✅ Comprehensive error handling
 * - ✅ Defensive programming
 * - ✅ Performance optimization (memoization)
 *
 * @module ThemeExtractionContainer
 * @since Phase 10.91 Day 7
 * @author VQMethod Team
 */

'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnterpriseThemeCard from '@/components/literature/EnterpriseThemeCard';
import ThemeCountGuidance from '@/components/literature/ThemeCountGuidance';
import { ThemeMethodologyExplainer } from '@/components/literature/ThemeMethodologyExplainer';
// Phase 10.91 Day 7: PurposeSpecificActions component extracted and integrated
import { PurposeSpecificActions } from '../components/PurposeSpecificActions';
import type {
  HypothesisSuggestion as HypothesisSuggestionType,
  ConstructMapping as ConstructMappingType,
  GeneratedSurvey,
} from '@/components/literature';
import type {
  UnifiedTheme,
  ResearchPurpose,
  SaturationData,
} from '@/lib/api/services/unified-theme-api.service';
import type {
  ResearchQuestionSuggestion as ResearchQuestion,
  Theme,
} from '@/lib/api/services/enhanced-theme-integration-api.service';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Source type from UnifiedTheme
 * AUDIT FIX #3: Properly typed source object (was `any`)
 */
interface ThemeSource {
  sourceType: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram' | string;
  sourceId?: string;
  [key: string]: unknown;
}

/**
 * Target range for theme count based on purpose
 */
interface ThemeTargetRange {
  min: number;
  max: number;
}

// ============================================================================
// Component Props
// ============================================================================

export interface ThemeExtractionContainerProps {
  /** Extracted themes with full provenance */
  unifiedThemes: UnifiedTheme[];

  /** Research purpose guiding extraction */
  extractionPurpose?: ResearchPurpose | null;

  /** Saturation analysis data */
  v2SaturationData?: SaturationData | null;

  /** Total number of sources (papers + videos) */
  totalSources: number;

  /** Selected theme IDs */
  selectedThemeIds: string[];

  /** Update selected theme IDs */
  onToggleThemeSelection: (themeId: string) => void;

  /** Clear all selections */
  onClearSelection: () => void;

  /** Theme extraction in progress */
  analyzingThemes: boolean;

  /** Papers that have been extracted */
  extractedPapers: Set<string>;

  // Purpose-specific handlers
  /** Generate Q-statements */
  onGenerateStatements: () => void;

  /** Generate research questions */
  onGenerateQuestions: () => void;

  /** Generate hypotheses */
  onGenerateHypotheses: () => void;

  /** Map constructs */
  onMapConstructs: () => void;

  /** Show survey modal */
  onShowSurveyModal: () => void;

  // Generated outputs
  /** Generated research questions */
  researchQuestions: ResearchQuestion[];

  /** Generated hypotheses */
  hypotheses: HypothesisSuggestionType[];

  /** Construct mappings */
  constructMappings: ConstructMappingType[];

  /** Generated survey */
  generatedSurvey: GeneratedSurvey | null;

  // Loading states
  /** Loading questions */
  loadingQuestions: boolean;

  /** Loading hypotheses */
  loadingHypotheses: boolean;

  /** Loading constructs */
  loadingConstructs: boolean;

  /** Loading survey */
  loadingSurvey: boolean;

  // Utility functions
  /** Map unified theme to theme */
  mapUnifiedThemeToTheme: (theme: UnifiedTheme) => Theme;

  /** Save research questions */
  saveResearchQuestions: (questions: ResearchQuestion[], themes: Theme[]) => void;

  /** Save hypotheses */
  saveHypotheses: (hypotheses: HypothesisSuggestionType[], themes: Theme[]) => void;
}

// ============================================================================
// Helper Component: Source Summary Card
// AUDIT FIX #13: Memoized with React.memo
// ============================================================================

interface SourceSummaryCardProps {
  unifiedThemes: UnifiedTheme[];
}

const SourceSummaryCard = React.memo(function SourceSummaryCard({
  unifiedThemes
}: SourceSummaryCardProps) {
  const sourceCounts = {
    papers: 0,
    youtube: 0,
    podcasts: 0,
    social: 0,
  };

  // AUDIT FIX #3: Properly typed source (was `any`)
  unifiedThemes.forEach(theme => {
    theme.sources?.forEach((source: ThemeSource) => {
      if (source.sourceType === 'paper') sourceCounts.papers++;
      else if (source.sourceType === 'youtube') sourceCounts.youtube++;
      else if (source.sourceType === 'podcast') sourceCounts.podcasts++;
      else if (source.sourceType === 'tiktok' || source.sourceType === 'instagram')
        sourceCounts.social++;
    });
  });

  return (
    <Card className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border-green-200 dark:border-green-800">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Theme Sources Summary
        </h3>
        <div className="flex items-center gap-6">
          {sourceCounts.papers > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">Papers</Badge>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {sourceCounts.papers}
              </span>
            </div>
          )}
          {sourceCounts.youtube > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500">Videos</Badge>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {sourceCounts.youtube}
              </span>
            </div>
          )}
          {sourceCounts.podcasts > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-500">Podcasts</Badge>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {sourceCounts.podcasts}
              </span>
            </div>
          )}
          {sourceCounts.social > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-pink-500">Social</Badge>
              <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {sourceCounts.social}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          ✨ Themes extracted from {unifiedThemes.length} sources with full provenance
          tracking
        </p>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Helper Component: Empty State
// AUDIT FIX #13: Memoized with React.memo
// ============================================================================

interface EmptyStateProps {
  analyzingThemes: boolean;
  extractedPapers: Set<string>;
  unifiedThemes: UnifiedTheme[];
}

const EmptyState = React.memo(function EmptyState({
  analyzingThemes,
  extractedPapers,
  unifiedThemes
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-gray-500">
      <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p className="text-lg font-medium mb-2">No themes extracted yet</p>
      <p className="text-sm text-gray-400 mb-4">
        Search for papers and/or transcribe videos, then click &quot;Extract Themes from All
        Sources&quot; to identify research themes with full provenance tracking
      </p>

      {analyzingThemes && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm text-blue-600 font-medium">Extraction in progress...</p>
          <p className="text-xs text-blue-500 mt-1">
            Themes will appear here automatically when complete
          </p>
        </div>
      )}

      {!analyzingThemes && extractedPapers.size > 0 && unifiedThemes.length === 0 && (
        <div className="mt-4 p-4 bg-amber-50 rounded-lg inline-block">
          <p className="text-sm text-amber-600 font-medium">
            ⚠️ Extraction completed but no themes were returned
          </p>
          <p className="text-xs text-amber-500 mt-1">
            This might indicate insufficient content in selected sources
          </p>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export function ThemeExtractionContainer(props: ThemeExtractionContainerProps): JSX.Element {
  const {
    unifiedThemes,
    extractionPurpose,
    v2SaturationData,
    totalSources,
    selectedThemeIds,
    onToggleThemeSelection,
    onClearSelection,
    analyzingThemes,
    extractedPapers,
    onGenerateStatements,
    onGenerateQuestions,
    onGenerateHypotheses,
    onMapConstructs,
    onShowSurveyModal,
    researchQuestions,
    hypotheses,
    constructMappings,
    generatedSurvey,
    loadingQuestions,
    loadingHypotheses,
    loadingConstructs,
    loadingSurvey,
    mapUnifiedThemeToTheme,
    saveResearchQuestions,
    saveHypotheses,
  } = props;

  // ===========================
  // HOOKS
  // ===========================

  const router = useRouter();

  // ===========================
  // COMPUTED VALUES
  // AUDIT FIX #11: Memoized with React.useMemo
  // ===========================

  const hasThemes = unifiedThemes.length > 0;
  const hasSelection = selectedThemeIds.length > 0;

  // Get target range for theme count based on purpose
  const getTargetRange = React.useMemo((): ThemeTargetRange => {
    switch (extractionPurpose) {
      case 'q_methodology':
        return { min: 30, max: 80 };
      case 'survey_construction':
        return { min: 5, max: 15 };
      case 'qualitative_analysis':
        return { min: 5, max: 20 };
      case 'literature_synthesis':
        return { min: 10, max: 25 };
      default:
        return { min: 8, max: 15 };
    }
  }, [extractionPurpose]);

  // Check if purpose shows specific action
  const showQStatements = extractionPurpose === 'q_methodology';
  const showSurveyPrimary = extractionPurpose === 'survey_construction';
  const showResearchOutputs =
    extractionPurpose === 'literature_synthesis' ||
    extractionPurpose === 'qualitative_analysis' ||
    extractionPurpose === 'hypothesis_generation' ||
    !extractionPurpose;
  const showSurveySecondary =
    extractionPurpose === 'qualitative_analysis' || !extractionPurpose;

  // ===========================
  // HANDLERS
  // AUDIT FIX #12: Memoized with React.useCallback
  // ===========================

  const handleSelectQuestion = React.useCallback((q: ResearchQuestion) => {
    const selectedThemes = unifiedThemes.filter(theme => selectedThemeIds.includes(theme.id));
    saveResearchQuestions([q], selectedThemes.map(mapUnifiedThemeToTheme));
    toast.success('Research question saved. Opening design page...');
    router.push('/design?source=themes&step=question');
  }, [unifiedThemes, selectedThemeIds, saveResearchQuestions, mapUnifiedThemeToTheme, router]);

  const handleOperationalizeQuestion = React.useCallback((q: ResearchQuestion) => {
    const selectedThemes = unifiedThemes.filter(theme => selectedThemeIds.includes(theme.id));
    saveResearchQuestions([q], selectedThemes.map(mapUnifiedThemeToTheme));
    toast.success('Opening operationalization panel...');
    router.push('/design?source=themes&step=question');
  }, [unifiedThemes, selectedThemeIds, saveResearchQuestions, mapUnifiedThemeToTheme, router]);

  const handleSelectHypothesis = React.useCallback((h: HypothesisSuggestionType) => {
    const selectedThemes = unifiedThemes.filter(theme => selectedThemeIds.includes(theme.id));
    saveHypotheses([h], selectedThemes.map(mapUnifiedThemeToTheme));
    toast.success('Hypothesis saved. Opening design page...');
    router.push('/design?source=themes&step=hypotheses');
  }, [unifiedThemes, selectedThemeIds, saveHypotheses, mapUnifiedThemeToTheme, router]);

  const handleTestHypothesis = React.useCallback((h: HypothesisSuggestionType) => {
    const selectedThemes = unifiedThemes.filter(theme => selectedThemeIds.includes(theme.id));
    saveHypotheses([h], selectedThemes.map(mapUnifiedThemeToTheme));
    toast.success('Opening hypothesis testing panel...');
    router.push('/design?source=themes&step=hypotheses');
  }, [unifiedThemes, selectedThemeIds, saveHypotheses, mapUnifiedThemeToTheme, router]);

  // AUDIT FIX #1: Added defensive programming for property access
  const handleConstructClick = React.useCallback((id: string) => {
    const mapping = constructMappings.find(m => m.construct.id === id);
    if (!mapping) {
      logger.warn('ThemeExtractionContainer', 'Construct mapping not found', { id });
      return;
    }

    const themesCount = mapping.construct.themes?.length ?? 0;
    const relationshipsCount = mapping.relatedConstructs?.length ?? 0;

    toast.info(
      `${mapping.construct.name}: ${themesCount} themes, ${relationshipsCount} relationships`,
      { duration: 4000 }
    );
  }, [constructMappings]);

  // AUDIT FIX #2: Added defensive programming for property access
  const handleRelationshipClick = React.useCallback((source: string, target: string) => {
    const sourceMapping = constructMappings.find(m => m.construct.id === source);
    const targetMapping = constructMappings.find(m => m.construct.id === target);

    if (!sourceMapping || !targetMapping) {
      logger.warn('ThemeExtractionContainer', 'Construct mapping not found', { source, target });
      return;
    }

    toast.info(
      `Relationship: ${sourceMapping.construct.name} → ${targetMapping.construct.name}`,
      { duration: 3000 }
    );
  }, [constructMappings]);

  const handleEditSurvey = React.useCallback(() => {
    const selectedThemes = unifiedThemes.filter(theme => selectedThemeIds.includes(theme.id));
    try {
      const surveyData = {
        survey: generatedSurvey,
        themes: selectedThemes.map(mapUnifiedThemeToTheme),
        purpose: extractionPurpose || 'qualitative_analysis',
        generatedAt: new Date().toISOString(),
      };
      localStorage.setItem('theme_generated_survey', JSON.stringify(surveyData));
      toast.success('Survey saved. Opening Questionnaire Builder...');
      router.push('/questionnaire/builder-pro?import=survey&source=themes');
    } catch (error) {
      logger.error('ThemeExtractionContainer', 'Failed to save survey', error);
      toast.error('Failed to save survey. Please try again.');
    }
  }, [unifiedThemes, selectedThemeIds, generatedSurvey, extractionPurpose, mapUnifiedThemeToTheme, router]);

  const handleExportSurvey = React.useCallback((format: string) => {
    try {
      const selectedThemes = unifiedThemes.filter(theme => selectedThemeIds.includes(theme.id));

      if (format === 'json') {
        const data = {
          survey: generatedSurvey,
          themes: selectedThemes.map(mapUnifiedThemeToTheme),
          metadata: {
            generatedAt: new Date().toISOString(),
            purpose: extractionPurpose || 'qualitative_analysis',
            platform: 'VQMethod',
          },
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Survey exported as JSON');
      } else if (format === 'csv' && generatedSurvey) {
        const csvRows: string[] = [];
        csvRows.push('Section,Item ID,Text,Type,Scale');

        generatedSurvey.sections.forEach(section => {
          section.items.forEach(item => {
            const scaleText = item.options ? item.options.join(' | ') : item.scaleType || '';
            csvRows.push(
              `"${section.title}","${item.id}","${item.text.replace(/"/g, '""')}","${item.type}","${scaleText}"`
            );
          });
        });

        const blob = new Blob([csvRows.join('\n')], {
          type: 'text/csv',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Survey exported as CSV');
      } else if (format === 'pdf' || format === 'word') {
        toast.info(`${format.toUpperCase()} export coming soon! Use JSON/CSV for now.`);
      } else {
        toast.error('Unsupported export format');
      }
    } catch (error) {
      logger.error('ThemeExtractionContainer', 'Export failed', error);
      toast.error('Failed to export survey. Please try again.');
    }
  }, [unifiedThemes, selectedThemeIds, generatedSurvey, extractionPurpose, mapUnifiedThemeToTheme]);

  // ===========================
  // RENDER
  // ===========================

  if (!hasThemes) {
    return (
      <EmptyState
        analyzingThemes={analyzingThemes}
        extractedPapers={extractedPapers}
        unifiedThemes={unifiedThemes}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Source Summary Card */}
      <SourceSummaryCard unifiedThemes={unifiedThemes} />

      {/* Theme Count Guidance */}
      {extractionPurpose && v2SaturationData && (
        <ThemeCountGuidance
          purpose={extractionPurpose}
          currentThemeCount={unifiedThemes.length}
          targetRange={getTargetRange}
          saturationData={v2SaturationData}
          totalSources={totalSources}
        />
      )}

      {/* Methodology Explainer */}
      <ThemeMethodologyExplainer />

      {/* Theme Cards */}
      {unifiedThemes.map((theme, index) => {
        if (!theme || !theme.id) {
          logger.error('ThemeExtractionContainer', 'Invalid theme at index', { index, theme });
          return null;
        }

        return (
          <EnterpriseThemeCard
            key={theme.id}
            theme={theme}
            index={index}
            totalThemes={unifiedThemes.length}
            purpose={extractionPurpose || 'qualitative_analysis'}
            showConfidenceBadge={true}
            showEvidence={true}
            isSelectable={true}
            isSelected={selectedThemeIds.includes(theme.id)}
            onToggleSelect={onToggleThemeSelection}
          />
        );
      })}

      {/* Purpose-Specific Actions - Extracted to separate component (Phase 10.91 Day 7) */}
      <PurposeSpecificActions
        extractionPurpose={extractionPurpose}
        hasThemes={hasThemes}
        hasSelection={hasSelection}
        selectedCount={selectedThemeIds.length}
        onClearSelection={onClearSelection}
        showQStatements={showQStatements}
        onGenerateStatements={onGenerateStatements}
        showSurveyPrimary={showSurveyPrimary}
        showSurveySecondary={showSurveySecondary}
        loadingSurvey={loadingSurvey}
        generatedSurvey={generatedSurvey}
        onShowSurveyModal={onShowSurveyModal}
        onEditSurvey={handleEditSurvey}
        onExportSurvey={handleExportSurvey}
        showResearchOutputs={showResearchOutputs}
        loadingQuestions={loadingQuestions}
        researchQuestions={researchQuestions}
        onGenerateQuestions={onGenerateQuestions}
        onSelectQuestion={handleSelectQuestion}
        onOperationalizeQuestion={handleOperationalizeQuestion}
        loadingHypotheses={loadingHypotheses}
        hypotheses={hypotheses}
        onGenerateHypotheses={onGenerateHypotheses}
        onSelectHypothesis={handleSelectHypothesis}
        onTestHypothesis={handleTestHypothesis}
        loadingConstructs={loadingConstructs}
        constructMappings={constructMappings}
        onMapConstructs={onMapConstructs}
        onConstructClick={handleConstructClick}
        onRelationshipClick={handleRelationshipClick}
      />
    </div>
  );
}

// ============================================================================
// Component Display Name (for debugging)
// ============================================================================

ThemeExtractionContainer.displayName = 'ThemeExtractionContainer';
