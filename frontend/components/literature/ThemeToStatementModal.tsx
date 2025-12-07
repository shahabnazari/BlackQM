/**
 * Theme To Statement Modal - Phase 10.97 Day 2
 *
 * Enterprise-grade modal for generating Q-methodology statements from extracted themes.
 * Provides full provenance tracking: Paper -> Theme -> Statement
 *
 * Features:
 * - Study selector dropdown
 * - Theme selection with preview
 * - Generation options (perspectives, controversy pairs)
 * - Statement editing and refinement
 * - Bulk save with progress tracking
 * - Full provenance display
 *
 * @component ThemeToStatementModal
 * @since Phase 10.97 Day 2
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Edit2,
  FileText,
  Info,
  Lightbulb,
  Loader2,
  Save,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

// Services
import {
  statementGenerationService,
  type GeneratedStatement,
  type GenerationProgress,
  type StatementPerspective,
  type GenerationOptions,
} from '@/lib/services/statement-generation.service';
import { studyService, type Study } from '@/lib/api/services/study.service';

// Store
import {
  useThemeExtractionStore,
  type UnifiedTheme,
} from '@/lib/stores/theme-extraction.store';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOGGER_CONTEXT = 'ThemeToStatementModal';

const PERSPECTIVE_LABELS: Record<StatementPerspective, string> = {
  supportive: 'Supportive',
  critical: 'Critical',
  neutral: 'Neutral',
  balanced: 'Balanced',
};

const PERSPECTIVE_DESCRIPTIONS: Record<StatementPerspective, string> = {
  supportive: 'Statements that support or affirm the theme',
  critical: 'Statements that challenge or critique the theme',
  neutral: 'Objective statements without positive/negative framing',
  balanced: 'Statements acknowledging multiple viewpoints',
};

/** Pre-computed perspective keys to avoid Object.keys() in render */
const PERSPECTIVE_KEYS: readonly StatementPerspective[] = Object.keys(PERSPECTIVE_LABELS) as StatementPerspective[];

// ============================================================================
// TYPES
// ============================================================================

interface ThemeToStatementModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

type ModalStep = 'select-study' | 'configure' | 'generate' | 'review' | 'save';

// ============================================================================
// COMPONENT
// ============================================================================

export function ThemeToStatementModal({
  open,
  onOpenChange,
}: ThemeToStatementModalProps) {
  // ---------------------------------------------------------------------------
  // Store State - Individual selectors for stable references (prevents infinite loops)
  // ---------------------------------------------------------------------------
  const unifiedThemes = useThemeExtractionStore((state) => state.unifiedThemes);
  const selectedThemeIds = useThemeExtractionStore((state) => state.selectedThemeIds);

  // Memoize derived values to prevent infinite re-renders
  const selectedThemes = useMemo(
    () => unifiedThemes.filter((t: UnifiedTheme) => selectedThemeIds.includes(t.id)),
    [unifiedThemes, selectedThemeIds]
  );
  const allThemes = unifiedThemes;

  // ---------------------------------------------------------------------------
  // Local State
  // ---------------------------------------------------------------------------
  const [currentStep, setCurrentStep] = useState<ModalStep>('select-study');
  const [studies, setStudies] = useState<Study[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<string>('');
  const [isLoadingStudies, setIsLoadingStudies] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [generatedStatements, setGeneratedStatements] = useState<GeneratedStatement[]>([]);
  const [editingStatementId, setEditingStatementId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Generation options
  const [statementsPerTheme, setStatementsPerTheme] = useState(2);
  const [selectedPerspectives, setSelectedPerspectives] = useState<StatementPerspective[]>([
    'supportive',
    'neutral',
  ]);
  const [includeControversyPairs, setIncludeControversyPairs] = useState(false);
  const [minConfidence, setMinConfidence] = useState(0.6);

  // Ref for cleanup timeout to prevent memory leaks
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------
  const themesToProcess = useMemo(() => {
    return selectedThemes.length > 0 ? selectedThemes : allThemes;
  }, [selectedThemes, allThemes]);

  const recommendedCount = useMemo(() => {
    return statementGenerationService.getRecommendedCount(themesToProcess.length);
  }, [themesToProcess.length]);

  const selectedStudy = useMemo(() => {
    return studies.find((s) => s.id === selectedStudyId);
  }, [studies, selectedStudyId]);

  // Memoize edited count to avoid recalculating on every render
  const editedCount = useMemo(() => {
    return generatedStatements.filter((s) => s.isEdited).length;
  }, [generatedStatements]);

  // ---------------------------------------------------------------------------
  // Load Studies
  // ---------------------------------------------------------------------------
  const loadStudies = useCallback(async () => {
    setIsLoadingStudies(true);
    setError(null);

    try {
      const response = await studyService.getStudies({ status: 'draft' });
      setStudies(response.data);
      logger.info('Studies loaded', LOGGER_CONTEXT, { count: response.data.length });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load studies';
      setError(message);
      logger.error('Failed to load studies', LOGGER_CONTEXT, { error: err });
    } finally {
      setIsLoadingStudies(false);
    }
  }, []);

  // Load studies when modal opens on select-study step
  useEffect(() => {
    if (open && currentStep === 'select-study') {
      loadStudies();
    }
  }, [open, currentStep, loadStudies]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handlePerspectiveToggle = useCallback((perspective: StatementPerspective) => {
    setSelectedPerspectives((prev) =>
      prev.includes(perspective)
        ? prev.filter((p) => p !== perspective)
        : [...prev, perspective]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (themesToProcess.length === 0) {
      toast.error('No themes available for statement generation');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentStep('generate');

    try {
      const options: Partial<GenerationOptions> = {
        statementsPerTheme,
        perspectives: selectedPerspectives,
        includeControversyPairs,
        minConfidence,
        maxTotalStatements: recommendedCount.max,
      };

      const response = await statementGenerationService.generateFromThemes(
        themesToProcess,
        selectedStudyId,
        options,
        setGenerationProgress
      );

      setGeneratedStatements([...response.statements]);
      setCurrentStep('review');

      if (response.warnings.length > 0) {
        toast.warning(`Generated with ${response.warnings.length} warnings`);
      } else {
        toast.success(`Generated ${response.totalGenerated} statements`);
      }

      logger.info('Statements generated', LOGGER_CONTEXT, {
        total: response.totalGenerated,
        themes: response.themesProcessed,
        time: response.generationTime,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      toast.error(message);
      logger.error('Statement generation failed', LOGGER_CONTEXT, { error: err });
      // Return to configure step so user can retry or adjust settings
      setCurrentStep('configure');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [
    themesToProcess,
    selectedStudyId,
    statementsPerTheme,
    selectedPerspectives,
    includeControversyPairs,
    minConfidence,
    recommendedCount.max,
  ]);

  const handleEditStatement = useCallback((statement: GeneratedStatement) => {
    setEditingStatementId(statement.id);
    setEditText(statement.editedText || statement.text);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingStatementId || !editText.trim()) return;

    setGeneratedStatements((prev) =>
      prev.map((stmt) =>
        stmt.id === editingStatementId
          ? statementGenerationService.editStatement(stmt, editText.trim())
          : stmt
      )
    );

    setEditingStatementId(null);
    setEditText('');
    toast.success('Statement updated');
  }, [editingStatementId, editText]);

  const handleRemoveStatement = useCallback((statementId: string) => {
    setGeneratedStatements((prev) => prev.filter((s) => s.id !== statementId));
    toast.success('Statement removed');
  }, []);

  const handleSaveToStudy = useCallback(async () => {
    if (!selectedStudyId || generatedStatements.length === 0) return;

    setIsSaving(true);
    setError(null);
    setCurrentStep('save');

    try {
      const savedStatements = await statementGenerationService.saveToStudy(
        selectedStudyId,
        generatedStatements
      );

      toast.success(`Saved ${savedStatements.length} statements to study`);
      logger.info('Statements saved to study', LOGGER_CONTEXT, {
        studyId: selectedStudyId,
        count: savedStatements.length,
      });

      // Close modal on success
      onOpenChange(false);
      resetModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save statements';
      setError(message);
      toast.error(message);
      logger.error('Failed to save statements', LOGGER_CONTEXT, { error: err });
      setCurrentStep('review'); // Go back to review on error
    } finally {
      setIsSaving(false);
    }
  }, [selectedStudyId, generatedStatements, onOpenChange]);

  const resetModal = useCallback(() => {
    setCurrentStep('select-study');
    setSelectedStudyId('');
    setGeneratedStatements([]);
    setGenerationProgress(null);
    setError(null);
    setEditingStatementId(null);
    setEditText('');
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Delay reset to avoid visual glitch during close animation
    // Store ref to allow cleanup on unmount
    resetTimeoutRef.current = setTimeout(resetModal, 300);
  }, [onOpenChange, resetModal]);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Memoized Render Helpers (performance optimization)
  // ---------------------------------------------------------------------------

  /** Memoized step indicator - only re-renders when currentStep changes */
  const stepIndicator = useMemo(() => {
    const steps: readonly { key: ModalStep; label: string }[] = [
      { key: 'select-study', label: 'Select Study' },
      { key: 'configure', label: 'Configure' },
      { key: 'generate', label: 'Generate' },
      { key: 'review', label: 'Review' },
      { key: 'save', label: 'Save' },
    ] as const;

    const currentIndex = steps.findIndex((s) => s.key === currentStep);

    return (
      <nav aria-label="Statement generation progress" className="flex items-center justify-center gap-2 mb-6">
        <ol className="flex items-center gap-2" role="list">
          {steps.map((step, index) => (
            <li key={step.key} className="flex items-center gap-2">
              <div
                role="listitem"
                aria-current={index === currentIndex ? 'step' : undefined}
                aria-label={`Step ${index + 1}: ${step.label}${index < currentIndex ? ' (completed)' : index === currentIndex ? ' (current)' : ''}`}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors',
                  index <= currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {index < currentIndex ? (
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight
                  className={cn(
                    'w-4 h-4',
                    index < currentIndex ? 'text-blue-600' : 'text-gray-300'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }, [currentStep]);

  // ---------------------------------------------------------------------------
  // Step: Select Study
  // ---------------------------------------------------------------------------
  const renderSelectStudy = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Sparkles className="w-12 h-12 mx-auto text-blue-600 mb-3" />
        <h3 className="text-lg font-semibold">Generate Q-Statements from Themes</h3>
        <p className="text-sm text-gray-600 mt-1">
          {themesToProcess.length} theme{themesToProcess.length !== 1 ? 's' : ''} selected for
          statement generation
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="study-select">Select Target Study</Label>
        <Select value={selectedStudyId} onValueChange={setSelectedStudyId}>
          <SelectTrigger id="study-select" className="w-full">
            <SelectValue placeholder="Choose a study..." />
          </SelectTrigger>
          <SelectContent>
            {isLoadingStudies ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading studies...
              </div>
            ) : studies.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                No draft studies available
              </div>
            ) : (
              studies.map((study) => (
                <SelectItem key={study.id} value={study.id}>
                  <div className="flex flex-col">
                    <span>{study.title}</span>
                    <span className="text-xs text-gray-500">
                      {study.settings.statements?.length || 0} existing statements
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedStudy && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">{selectedStudy.title}</p>
                  <p className="text-blue-600">
                    Current statements: {selectedStudy.settings.statements?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={() => setCurrentStep('configure')}
          disabled={!selectedStudyId}
        >
          Next: Configure Options
        </Button>
      </DialogFooter>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Step: Configure
  // ---------------------------------------------------------------------------
  const renderConfigure = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column: Options */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Statements per Theme</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[statementsPerTheme]}
                onValueChange={(v) => {
                  const val = v[0];
                  if (val !== undefined) setStatementsPerTheme(val);
                }}
                min={1}
                max={5}
                step={1}
                className="flex-1"
              />
              <span className="w-8 text-center font-medium">{statementsPerTheme}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recommended: {recommendedCount.recommended} total ({recommendedCount.min}-
              {recommendedCount.max})
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Minimum Confidence</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[minConfidence * 100]}
                onValueChange={(v) => {
                  const val = v[0];
                  if (val !== undefined) setMinConfidence(val / 100);
                }}
                min={30}
                max={90}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-center font-medium">{Math.round(minConfidence * 100)}%</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="controversy-pairs"
              checked={includeControversyPairs}
              onCheckedChange={(checked) => setIncludeControversyPairs(checked === true)}
            />
            <Label htmlFor="controversy-pairs" className="text-sm cursor-pointer">
              Include controversy pairs for balanced Q-sorts
            </Label>
          </div>
        </div>

        {/* Right Column: Perspectives */}
        <div className="space-y-3">
          <Label id="perspectives-label" className="text-sm font-medium">Statement Perspectives</Label>
          <div className="space-y-2" role="group" aria-labelledby="perspectives-label">
            {PERSPECTIVE_KEYS.map((perspective) => (
              <Tooltip key={perspective} content={PERSPECTIVE_DESCRIPTIONS[perspective]}>
                <div
                  role="checkbox"
                  aria-checked={selectedPerspectives.includes(perspective)}
                  aria-label={`${PERSPECTIVE_LABELS[perspective]}: ${PERSPECTIVE_DESCRIPTIONS[perspective]}`}
                  tabIndex={0}
                  className={cn(
                    'flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    selectedPerspectives.includes(perspective)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => handlePerspectiveToggle(perspective)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePerspectiveToggle(perspective);
                    }
                  }}
                >
                  <Checkbox
                    checked={selectedPerspectives.includes(perspective)}
                    onCheckedChange={() => handlePerspectiveToggle(perspective)}
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{PERSPECTIVE_LABELS[perspective]}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Themes to Process ({themesToProcess.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {themesToProcess.map((theme) => (
                <Badge
                  key={theme.id}
                  variant={theme.confidence >= minConfidence ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {theme.label}
                  <span className="ml-1 opacity-70">
                    ({Math.round(theme.confidence * 100)}%)
                  </span>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <DialogFooter>
        <Button variant="outline" onClick={() => setCurrentStep('select-study')} disabled={isGenerating}>
          Back
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={selectedPerspectives.length === 0 || isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Statements'}
        </Button>
      </DialogFooter>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Step: Generate (Progress)
  // ---------------------------------------------------------------------------
  const renderGenerate = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Generating Statements...</h3>
        {generationProgress && (
          <>
            <p className="text-sm text-gray-600 mt-1">
              Processing: {generationProgress.currentTheme}
            </p>
            <Progress value={generationProgress.percentage} className="w-64 mt-3" />
            <p className="text-xs text-gray-500 mt-2">
              {generationProgress.statementsGenerated} statements generated
            </p>
          </>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Step: Review
  // ---------------------------------------------------------------------------
  const renderReview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Review Generated Statements ({generatedStatements.length})
        </h3>
        <Badge variant="outline">
          {editedCount} edited
        </Badge>
      </div>

      <div className="h-[400px] overflow-y-auto pr-4" aria-live="polite" aria-atomic="false">
        <div className="space-y-3" role="list" aria-label="Generated statements">
          <AnimatePresence>
            {generatedStatements.map((statement, index) => (
              <motion.div
                key={statement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
              >
                <Card className={cn(statement.isEdited && 'border-blue-300')}>
                  <CardContent className="p-3">
                    {editingStatementId === statement.id ? (
                      <div className="space-y-2">
                        <Label htmlFor={`edit-statement-${statement.id}`} className="sr-only">
                          Edit statement text
                        </Label>
                        <Textarea
                          id={`edit-statement-${statement.id}`}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[80px]"
                          autoFocus
                          aria-describedby={`edit-hint-${statement.id}`}
                        />
                        <span id={`edit-hint-${statement.id}`} className="sr-only">
                          Edit the statement text and click Save to confirm changes
                        </span>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingStatementId(null)}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveEdit}>
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-gray-400 mt-1">{index + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            {statement.editedText || statement.text}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {PERSPECTIVE_LABELS[statement.perspective]}
                            </Badge>
                            <Tooltip
                              content={
                                <div className="text-xs max-w-xs">
                                  <p className="font-medium">Source Theme</p>
                                  <p>{statement.provenance.sourceThemeLabel}</p>
                                  {statement.provenance.sourcePaperTitle && (
                                    <>
                                      <p className="font-medium mt-1">Source Paper</p>
                                      <p>{statement.provenance.sourcePaperTitle}</p>
                                    </>
                                  )}
                                </div>
                              }
                            >
                              <Badge variant="secondary" className="text-xs cursor-help">
                                <FileText className="w-3 h-3 mr-1" />
                                {statement.provenance.sourceThemeLabel}
                              </Badge>
                            </Tooltip>
                            {statement.isEdited && (
                              <Badge className="text-xs bg-blue-100 text-blue-800">
                                Edited
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditStatement(statement)}
                            aria-label="Edit statement"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveStatement(statement.id)}
                            aria-label="Remove statement"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={() => setCurrentStep('configure')}>
          Back to Configure
        </Button>
        <Button
          onClick={handleSaveToStudy}
          disabled={generatedStatements.length === 0 || isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save {generatedStatements.length} Statements to Study
        </Button>
      </DialogFooter>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Step: Save (Progress)
  // ---------------------------------------------------------------------------
  const renderSave = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Saving to Study...</h3>
        <p className="text-sm text-gray-600 mt-1">
          Adding {generatedStatements.length} statements with full provenance
        </p>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main Render
  // ---------------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Generate Q-Statements from Themes
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Transform extracted themes into Q-methodology statements with full provenance tracking.
          </DialogDescription>
        </DialogHeader>

        {stepIndicator}

        <div className="min-h-[400px] overflow-y-auto">
          {currentStep === 'select-study' && renderSelectStudy()}
          {currentStep === 'configure' && renderConfigure()}
          {currentStep === 'generate' && renderGenerate()}
          {currentStep === 'review' && renderReview()}
          {currentStep === 'save' && renderSave()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
