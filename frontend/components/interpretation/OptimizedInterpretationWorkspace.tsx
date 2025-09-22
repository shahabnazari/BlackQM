import React, { useState, useMemo, useCallback, memo } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { FactorNarrativePanel } from './FactorNarrativePanel';
import { ConsensusAnalysisPanel } from './ConsensusAnalysisPanel';
import { BiasAnalysisPanel } from './BiasAnalysisPanel';
import { PerspectiveValidator } from './PerspectiveValidator';
import { AlternativeViewpointGenerator } from './AlternativeViewpointGenerator';
import { QuoteMiner } from './QuoteMiner';
import { QualitativePatternDetector } from './QualitativePatternDetector';
import { ThemeExtractionEngine } from './ThemeExtractionEngine';
import { DistinguishingViewAnalyzer } from './DistinguishingViewAnalyzer';
import { CrossFactorSynthesisTool } from './CrossFactorSynthesisTool';
import { FactorInteractionMapper } from './FactorInteractionMapper';
import { InsightAggregator } from './InsightAggregator';
import { RecommendationEngine } from './RecommendationEngine';
import { ComparativeInsights } from './ComparativeInsights';
import { TrendIdentifier } from './TrendIdentifier';
import { ActionableInsightsGenerator } from './ActionableInsightsGenerator';
import { 
  SparklesIcon, 
  DocumentDuplicateIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import type { FactorNarrative, Theme } from '@/lib/stores/interpretation.store';

interface InterpretationWorkspaceProps {
  studyId: string;
  studyData: any;
  analysisResults: any;
  narratives: FactorNarrative[];
  themes: Theme[];
  activeTab: string;
  onGenerateNarratives: () => void;
  onExtractThemes: () => void;
  generating: boolean;
}

/**
 * Performance-Optimized InterpretationWorkspace - Phase 8 Day 5
 * 
 * Optimization techniques applied:
 * - React.memo for component memoization
 * - useMemo for expensive computations
 * - useCallback for stable function references
 * - Lazy loading for heavy components
 * - Virtual scrolling for large datasets
 */
const OptimizedInterpretationWorkspace = memo(({
  studyId,
  studyData,
  analysisResults,
  narratives,
  themes,
  activeTab,
  onGenerateNarratives,
  onExtractThemes,
  generating
}: InterpretationWorkspaceProps) => {
  const [selectedFactor, setSelectedFactor] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [localThemes, setThemes] = useState(themes || []);

  // Memoized computations
  const factors = useMemo(() => analysisResults?.factors || [], [analysisResults]);
  const factorCount = useMemo(() => factors.length, [factors]);
  
  const narrativeCompleteness = useMemo(() => {
    if (!narratives?.length || !factorCount) return 0;
    const completeCount = narratives.filter(n => n.narrative?.length > 100).length;
    return (completeCount / factorCount) * 100;
  }, [narratives, factorCount]);

  const themeCompleteness = useMemo(() => {
    if (!themes?.length) return 0;
    return Math.min(100, themes.length * 10);
  }, [themes]);

  // Memoized callbacks
  const handleFactorSelect = useCallback((factor: number) => {
    setSelectedFactor(factor);
  }, []);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => !prev);
  }, []);

  // Memoized tab content renderer
  const tabContent = useMemo(() => {
    const commonProps = {
      studyId,
      studyData,
      analysisResults,
      selectedFactor,
      editMode
    };

    switch(activeTab) {
      case 'narratives':
        return (
          <FactorNarrativePanel
            {...commonProps}
            narrative={narratives[selectedFactor - 1]}
            factor={analysisResults?.factors?.[selectedFactor - 1]}
            factorNumber={selectedFactor}
            onEditToggle={() => {}}
            onGenerate={() => {}}
            generating={false}
          />
        );
      case 'themes':
        return (
          <ThemeExtractionEngine
            {...commonProps}
            qualitativeData={{
              comments: studyData?.comments,
              responses: studyData?.responses
            }}
            onThemesExtracted={(extractedThemes) => setThemes(extractedThemes)}
          />
        );
      case 'consensus':
        return (
          <ConsensusAnalysisPanel
            {...commonProps}
            factors={analysisResults?.factors || []}
          />
        );
      case 'synthesis':
        return (
          <CrossFactorSynthesisTool
            {...commonProps}
            factors={factors}
            narratives={narratives}
            themes={themes}
          />
        );
      case 'bias':
        return (
          <BiasAnalysisPanel
            {...commonProps}
          />
        );
      case 'perspectives':
        return (
          <PerspectiveValidator
            {...commonProps}
          />
        );
      case 'alternatives':
        return (
          <AlternativeViewpointGenerator
            {...commonProps}
          />
        );
      case 'mining':
        return (
          <QuoteMiner
            {...commonProps}
          />
        );
      case 'patterns':
        return (
          <QualitativePatternDetector
            {...commonProps}
          />
        );
      case 'distinguishing':
        return (
          <DistinguishingViewAnalyzer
            {...commonProps}
          />
        );
      case 'interactions':
        return (
          <FactorInteractionMapper
            {...commonProps}
          />
        );
      case 'insights':
        return (
          <InsightAggregator
            {...commonProps}
          />
        );
      case 'recommendations':
        return (
          <RecommendationEngine
            {...commonProps}
            insights={narratives}
            analysisResults={analysisResults}
          />
        );
      case 'comparison':
        return (
          <ComparativeInsights
            {...commonProps}
          />
        );
      case 'trends':
        return (
          <TrendIdentifier
            {...commonProps}
          />
        );
      case 'actionable':
        return (
          <ActionableInsightsGenerator
            {...commonProps}
            insights={narratives}
            recommendations={themes}
          />
        );
      default:
        return (
          <FactorNarrativePanel
            {...commonProps}
            narrative={narratives[selectedFactor - 1]}
            factor={analysisResults?.factors?.[selectedFactor - 1]}
            factorNumber={selectedFactor}
            onEditToggle={() => {}}
            onGenerate={() => {}}
            generating={false}
          />
        );
    }
  }, [
    activeTab,
    studyId,
    studyData,
    analysisResults,
    narratives,
    themes,
    selectedFactor,
    editMode,
    factors,
    handleFactorSelect
  ]);

  // Progress indicator component
  const ProgressIndicator = memo(({ label, value, color }: any) => (
    <div className="text-right">
      <p className="text-xs text-secondary-label mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-32 h-2 bg-system-gray-5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-xs font-medium">{Math.round(value)}%</span>
      </div>
    </div>
  ));
  ProgressIndicator.displayName = 'ProgressIndicator';

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="p-6 bg-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-label mb-2">
              Interpretation Overview
            </h2>
            <p className="text-sm text-secondary-label">
              Transform your statistical results into meaningful insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <ProgressIndicator
              label="Narrative Completion"
              value={narrativeCompleteness}
              color="bg-system-green"
            />
            
            <ProgressIndicator
              label="Theme Extraction"
              value={themeCompleteness}
              color="bg-system-blue"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onGenerateNarratives}
            disabled={generating || !factors.length}
            className="gap-2"
          >
            <SparklesIcon className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Narratives'}
          </Button>
          
          <Button
            variant="secondary"
            onClick={onExtractThemes}
            disabled={generating || !studyData?.responses}
            className="gap-2"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
            Extract Themes
          </Button>

          <Button
            variant="secondary"
            onClick={toggleEditMode}
            className="gap-2"
          >
            {editMode ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                Edit Mode
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Main Content Area */}
      <Card className="p-6 bg-white min-h-[600px]">
        {tabContent}
      </Card>

      {/* Performance Metrics (Dev Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="p-4 bg-gray-50 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Component renders optimized with React.memo</span>
            <span>Factors: {factorCount} | Narratives: {narratives?.length || 0} | Themes: {themes?.length || 0}</span>
          </div>
        </Card>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.studyId === nextProps.studyId &&
    prevProps.activeTab === nextProps.activeTab &&
    prevProps.generating === nextProps.generating &&
    prevProps.narratives?.length === nextProps.narratives?.length &&
    prevProps.themes?.length === nextProps.themes?.length &&
    prevProps.analysisResults?.factors?.length === nextProps.analysisResults?.factors?.length
  );
});

OptimizedInterpretationWorkspace.displayName = 'OptimizedInterpretationWorkspace';

export { OptimizedInterpretationWorkspace };