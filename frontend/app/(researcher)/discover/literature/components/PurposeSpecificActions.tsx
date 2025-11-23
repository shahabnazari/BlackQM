/**
 * Purpose-Specific Actions Component
 * Phase 10.91 Day 7: Extracted from ThemeExtractionContainer
 *
 * **Purpose:**
 * Renders purpose-specific research output generation actions based on extraction purpose.
 * Provides conditional UI for Q-methodology, Survey Construction, Qualitative Analysis, etc.
 *
 * **Responsibilities:**
 * - Display purpose-specific action buttons (Q-Statements, Surveys, Questions, Hypotheses, Constructs)
 * - Show selection state and enable/disable actions based on theme selection
 * - Render research output results (Questions, Hypotheses, Construct Maps, Surveys)
 * - Handle loading states for async operations
 *
 * **Architecture Pattern:**
 * Presentational Component
 * - Receives all state and handlers as props
 * - No business logic or state management
 * - Pure rendering based on props
 *
 * @module PurposeSpecificActions
 * @since Phase 10.91 Day 7
 * @author VQMethod Team
 */

'use client';

import React from 'react';
import { Sparkles, Loader2, TrendingUp, FileText, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AIResearchQuestionSuggestions,
  AIHypothesisSuggestions,
  ThemeConstructMap,
  GeneratedSurveyPreview,
} from '@/components/literature';
import type { ResearchPurpose } from '@/lib/api/services/unified-theme-api.service';
import type {
  HypothesisSuggestion,
  ConstructMapping,
  GeneratedSurvey,
} from '@/components/literature';
import type { ResearchQuestionSuggestion } from '@/lib/api/services/enhanced-theme-integration-api.service';

// ============================================================================
// Component Props
// ============================================================================

export interface PurposeSpecificActionsProps {
  /** Research purpose guiding available actions */
  extractionPurpose?: ResearchPurpose | null | undefined;

  /** Whether any themes exist */
  hasThemes: boolean;

  /** Whether any themes are selected */
  hasSelection: boolean;

  /** Count of selected themes */
  selectedCount: number;

  /** Clear theme selection */
  onClearSelection: () => void;

  // =========== Q-Methodology ===========
  /** Show Q-Statements action */
  showQStatements: boolean;

  /** Generate Q-Statements handler */
  onGenerateStatements: () => void;

  // =========== Survey Construction ===========
  /** Show survey action as primary */
  showSurveyPrimary: boolean;

  /** Show survey action as secondary */
  showSurveySecondary: boolean;

  /** Loading state for survey generation */
  loadingSurvey: boolean;

  /** Generated survey data */
  generatedSurvey: GeneratedSurvey | null;

  /** Show survey modal handler */
  onShowSurveyModal: () => void;

  /** Edit survey handler */
  onEditSurvey: () => void;

  /** Export survey handler */
  onExportSurvey: (format: 'json' | 'csv' | 'pdf' | 'word') => void;

  // =========== Research Outputs ===========
  /** Show general research outputs (Questions, Hypotheses, Constructs) */
  showResearchOutputs: boolean;

  /** Loading state for question generation */
  loadingQuestions: boolean;

  /** Generated research questions */
  researchQuestions: ResearchQuestionSuggestion[];

  /** Generate research questions handler */
  onGenerateQuestions: () => void;

  /** Select question handler */
  onSelectQuestion: (question: ResearchQuestionSuggestion) => void;

  /** Operationalize question handler */
  onOperationalizeQuestion: (question: ResearchQuestionSuggestion) => void;

  /** Loading state for hypothesis generation */
  loadingHypotheses: boolean;

  /** Generated hypotheses */
  hypotheses: HypothesisSuggestion[];

  /** Generate hypotheses handler */
  onGenerateHypotheses: () => void;

  /** Select hypothesis handler */
  onSelectHypothesis: (hypothesis: HypothesisSuggestion) => void;

  /** Test hypothesis handler */
  onTestHypothesis: (hypothesis: HypothesisSuggestion) => void;

  /** Loading state for construct mapping */
  loadingConstructs: boolean;

  /** Generated construct mappings */
  constructMappings: ConstructMapping[];

  /** Map constructs handler */
  onMapConstructs: () => void;

  /** Construct click handler */
  onConstructClick: (construct: string) => void;

  /** Relationship click handler */
  onRelationshipClick: (from: string, to: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * PurposeSpecificActions Component
 *
 * **Enterprise Optimizations:**
 * - ✅ React.memo() - Prevents re-renders when props unchanged (24 props!)
 * - ✅ TypeScript strict mode - No `any` types
 * - ✅ Explicit return type - JSX.Element for type safety
 *
 * @since Phase 10.91 Day 7 - Strict Audit Mode
 */
export const PurposeSpecificActions = React.memo<PurposeSpecificActionsProps>(
  function PurposeSpecificActions({
    extractionPurpose,
    hasThemes,
    hasSelection,
    selectedCount,
    onClearSelection,
    showQStatements,
    onGenerateStatements,
    showSurveyPrimary,
    showSurveySecondary,
    loadingSurvey,
    generatedSurvey,
    onShowSurveyModal,
    onEditSurvey,
    onExportSurvey,
    showResearchOutputs,
    loadingQuestions,
    researchQuestions,
    onGenerateQuestions,
    onSelectQuestion,
    onOperationalizeQuestion,
    loadingHypotheses,
    hypotheses,
    onGenerateHypotheses,
    onSelectHypothesis,
    onTestHypothesis,
    loadingConstructs,
    constructMappings,
    onMapConstructs,
    onConstructClick,
    onRelationshipClick,
  }: PurposeSpecificActionsProps): JSX.Element {
  return (
    <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Purpose-Specific Actions
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {extractionPurpose === 'q_methodology' &&
            'Generate Q-methodology statements for sorting studies'}
          {extractionPurpose === 'survey_construction' &&
            'Transform constructs into validated survey scales'}
          {extractionPurpose === 'qualitative_analysis' &&
            'Flexible analysis options for qualitative research'}
          {extractionPurpose === 'literature_synthesis' &&
            'Meta-analytic research questions and synthesis outputs'}
          {extractionPurpose === 'hypothesis_generation' &&
            'Theory-building outputs for hypothesis development'}
          {!extractionPurpose && 'Transform extracted themes into research outputs'}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Info */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {hasSelection ? (
                  <>
                    Selected {selectedCount} theme
                    {selectedCount !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>Select themes above to enable actions</>
                )}
              </p>
              {!hasSelection && (
                <p className="text-xs text-gray-500 mt-1">
                  Click the checkbox on theme cards to select them
                </p>
              )}
            </div>
            {hasSelection && (
              <Button variant="outline" size="sm" onClick={onClearSelection}>
                Clear Selection
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showQStatements && (
            <Card className="border border-indigo-200 hover:border-indigo-400 transition-colors">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Q-Statements (Primary)
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Generate 40-60 Q-methodology statements for participant sorting
                </p>
                <Button
                  onClick={onGenerateStatements}
                  disabled={!hasThemes}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="sm"
                >
                  Generate Q-Statements
                </Button>
              </CardContent>
            </Card>
          )}

          {(showSurveyPrimary || showSurveySecondary) && (
            <Card className="border border-amber-200 hover:border-amber-400 transition-colors">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  {showSurveyPrimary ? 'Complete Survey (Primary)' : 'Complete Survey'}
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  {showSurveyPrimary
                    ? 'Generate validated survey scales with psychometric properties'
                    : 'One-click survey generation from themes'}
                </p>
                <Button
                  onClick={onShowSurveyModal}
                  disabled={!hasSelection || loadingSurvey}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="sm"
                >
                  {loadingSurvey ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>Generate Survey</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {showResearchOutputs && (
            <>
              <Card className="border border-blue-200 hover:border-blue-400 transition-colors">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Research Questions
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Generate AI-suggested research questions from selected themes
                  </p>
                  <Button
                    onClick={onGenerateQuestions}
                    disabled={!hasSelection || loadingQuestions}
                    className="w-full"
                    size="sm"
                  >
                    {loadingQuestions ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>Generate Questions</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-purple-200 hover:border-purple-400 transition-colors">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    Hypotheses
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Generate testable hypotheses with variables identified
                  </p>
                  <Button
                    onClick={onGenerateHypotheses}
                    disabled={!hasSelection || loadingHypotheses}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    {loadingHypotheses ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>Generate Hypotheses</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-green-200 hover:border-green-400 transition-colors">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-green-600" />
                    Construct Map
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    Map themes to theoretical constructs with relationships
                  </p>
                  <Button
                    onClick={onMapConstructs}
                    disabled={!hasSelection || loadingConstructs}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    {loadingConstructs ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mapping...
                      </>
                    ) : (
                      <>Map Constructs</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Results Display */}
        {showResearchOutputs && researchQuestions.length > 0 && (
          <div className="mt-6">
            <AIResearchQuestionSuggestions
              questions={researchQuestions}
              onSelectQuestion={onSelectQuestion}
              onOperationalizeQuestion={onOperationalizeQuestion}
            />
          </div>
        )}

        {showResearchOutputs && hypotheses.length > 0 && (
          <div className="mt-6">
            <AIHypothesisSuggestions
              hypotheses={hypotheses}
              onSelectHypothesis={onSelectHypothesis}
              onTestHypothesis={onTestHypothesis}
            />
          </div>
        )}

        {showResearchOutputs && constructMappings.length > 0 && (
          <div className="mt-6">
            <ThemeConstructMap
              mappings={constructMappings}
              onConstructClick={onConstructClick}
              onRelationshipClick={onRelationshipClick}
            />
          </div>
        )}

        {(showSurveyPrimary || showSurveySecondary) && generatedSurvey && (
          <div className="mt-6">
            <GeneratedSurveyPreview
              survey={generatedSurvey}
              onEdit={onEditSurvey}
              onExport={onExportSurvey}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
  }
);

// ============================================================================
// Component Display Name (for debugging)
// ============================================================================

PurposeSpecificActions.displayName = 'PurposeSpecificActions';
