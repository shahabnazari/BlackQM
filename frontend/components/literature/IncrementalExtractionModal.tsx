/**
 * Phase 10 Day 18: Incremental Extraction Modal
 *
 * Enterprise-grade modal for triggering incremental theme extraction:
 * - Select existing corpus or create new
 * - Multi-select papers from library
 * - Show paper count and cost estimates
 * - Configure extraction settings (purpose, expertise level)
 *
 * User communication: Clear workflow for adding papers incrementally
 * Research backing: Supports iterative refinement (Braun & Clarke 2019)
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  incrementalExtractionApi,
  type CorpusInfo,
  type IncrementalExtractionResponse,
  ResearchPurpose,
  UserExpertiseLevel,
} from '@/lib/api/services/incremental-extraction-api.service';
import {
  X,
  Plus,
  FileText,
  TrendingDown,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  abstract?: string;
  authors?: string[];
}

interface IncrementalExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: IncrementalExtractionResponse) => void;
  availablePapers: Paper[];
  existingCorpus?: CorpusInfo;
}

export function IncrementalExtractionModal({
  isOpen,
  onClose,
  onComplete,
  availablePapers,
  existingCorpus,
}: IncrementalExtractionModalProps) {
  const [step, setStep] = useState<
    'select-corpus' | 'select-papers' | 'configure' | 'extracting'
  >('select-corpus');
  const [selectedCorpus, setSelectedCorpus] = useState<CorpusInfo | null>(
    existingCorpus || null
  );
  const [corpuses, setCorpuses] = useState<CorpusInfo[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(
    new Set()
  );
  const [purpose, setPurpose] = useState<ResearchPurpose>(
    ResearchPurpose.QUALITATIVE_ANALYSIS
  );
  const [expertiseLevel, setExpertiseLevel] = useState<UserExpertiseLevel>(
    UserExpertiseLevel.INTERMEDIATE
  );
  const [corpusName, setCorpusName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !existingCorpus) {
      loadCorpuses();
    }
  }, [isOpen, existingCorpus]);

  useEffect(() => {
    if (existingCorpus) {
      setSelectedCorpus(existingCorpus);
      setStep('select-papers');
      setPurpose(existingCorpus.purpose as ResearchPurpose);
    }
  }, [existingCorpus]);

  const loadCorpuses = async () => {
    try {
      const data = await incrementalExtractionApi.getCorpusList();
      setCorpuses(data);
    } catch (err) {
      console.error('Error loading corpuses:', err);
    }
  };

  const togglePaper = (paperId: string) => {
    const newSet = new Set(selectedPaperIds);
    if (newSet.has(paperId)) {
      newSet.delete(paperId);
    } else {
      newSet.add(paperId);
    }
    setSelectedPaperIds(newSet);
  };

  const selectAllPapers = () => {
    const existingIds = new Set(selectedCorpus?.paperIds || []);
    const newPaperIds = availablePapers
      .filter(p => !existingIds.has(p.id))
      .map(p => p.id);
    setSelectedPaperIds(new Set(newPaperIds));
  };

  const deselectAllPapers = () => {
    setSelectedPaperIds(new Set());
  };

  const handleExtract = async () => {
    if (selectedPaperIds.size === 0) {
      setError('Please select at least one paper to add');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStep('extracting');

      const existingPaperIds = selectedCorpus?.paperIds || [];
      const newPaperIds = Array.from(selectedPaperIds);

      const requestPayload: any = {
        existingPaperIds,
        newPaperIds,
        purpose,
        userExpertiseLevel: expertiseLevel,
      };

      if (selectedCorpus?.id) {
        requestPayload.corpusId = selectedCorpus.id;
      } else if (corpusName) {
        requestPayload.corpusName = corpusName;
      }

      const result =
        await incrementalExtractionApi.extractThemesIncremental(requestPayload);

      onComplete(result);
      resetModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract themes');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('select-corpus');
    setSelectedCorpus(null);
    setSelectedPaperIds(new Set());
    setCorpusName('');
    setPurpose(ResearchPurpose.QUALITATIVE_ANALYSIS);
    setExpertiseLevel(UserExpertiseLevel.INTERMEDIATE);
    setError(null);
  };

  const handleClose = () => {
    if (!loading) {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  const existingPaperIds = new Set(selectedCorpus?.paperIds || []);
  const availableNewPapers = availablePapers.filter(
    p => !existingPaperIds.has(p.id)
  );
  const estimatedSavings = existingPaperIds.size * 0.015; // Rough estimate

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Incremental Theme Extraction
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add papers to{' '}
              {selectedCorpus ? `"${selectedCorpus.name}"` : 'a corpus'} and
              merge themes
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Corpus */}
          {step === 'select-corpus' && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                Select a corpus or create new
              </h3>

              {corpuses.length > 0 && (
                <div className="space-y-2 mb-6">
                  {corpuses.map(corpus => (
                    <button
                      key={corpus.id}
                      onClick={() => {
                        setSelectedCorpus(corpus);
                        setPurpose(corpus.purpose as ResearchPurpose);
                        setStep('select-papers');
                      }}
                      className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {corpus.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {corpus.paperIds.length} papers • {corpus.themeCount}{' '}
                        themes • {corpus.totalExtractions} extractions
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Or create new corpus
                </label>
                <input
                  type="text"
                  value={corpusName}
                  onChange={e => setCorpusName(e.target.value)}
                  placeholder="Enter corpus name..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    if (!corpusName.trim()) {
                      setError('Please enter a corpus name');
                      return;
                    }
                    setStep('select-papers');
                  }}
                  disabled={!corpusName.trim()}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create & Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Papers */}
          {step === 'select-papers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Select papers to add ({selectedPaperIds.size} selected)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllPapers}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllPapers}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {availableNewPapers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All papers in your library are already in this corpus
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableNewPapers.map(paper => (
                    <label
                      key={paper.id}
                      className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPaperIds.has(paper.id)}
                        onChange={() => togglePaper(paper.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {paper.title}
                        </p>
                        {paper.authors && paper.authors.length > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {paper.authors.slice(0, 3).join(', ')}
                            {paper.authors.length > 3 &&
                              ` +${paper.authors.length - 3} more`}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Configure */}
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Adding {selectedPaperIds.size} new papers to{' '}
                      {existingPaperIds.size} existing papers
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Total corpus size:{' '}
                      {existingPaperIds.size + selectedPaperIds.size} papers
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Savings */}
              {existingPaperIds.size > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Estimated savings: ${estimatedSavings.toFixed(2)}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        {existingPaperIds.size} papers will be retrieved from
                        cache
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Purpose Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Research Purpose
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value as ResearchPurpose)}
                  disabled={!!selectedCorpus}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value={ResearchPurpose.QUALITATIVE_ANALYSIS}>
                    Qualitative Analysis
                  </option>
                  <option value={ResearchPurpose.LITERATURE_SYNTHESIS}>
                    Literature Synthesis
                  </option>
                  <option value={ResearchPurpose.HYPOTHESIS_GENERATION}>
                    Hypothesis Generation
                  </option>
                  <option value={ResearchPurpose.SURVEY_CONSTRUCTION}>
                    Survey Construction
                  </option>
                  <option value={ResearchPurpose.Q_METHODOLOGY}>
                    Q-Methodology
                  </option>
                </select>
                {selectedCorpus && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Purpose cannot be changed for existing corpus
                  </p>
                )}
              </div>

              {/* Expertise Level */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Your Expertise Level
                </label>
                <select
                  value={expertiseLevel}
                  onChange={e =>
                    setExpertiseLevel(e.target.value as UserExpertiseLevel)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={UserExpertiseLevel.NOVICE}>Novice</option>
                  <option value={UserExpertiseLevel.INTERMEDIATE}>
                    Intermediate
                  </option>
                  <option value={UserExpertiseLevel.ADVANCED}>Advanced</option>
                  <option value={UserExpertiseLevel.EXPERT}>Expert</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Extracting */}
          {step === 'extracting' && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Extracting Themes Incrementally...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Merging {selectedPaperIds.size} new papers with{' '}
                {existingPaperIds.size} existing papers
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                Retrieving cached content to save costs...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'extracting' && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => {
                if (step === 'select-papers') {
                  setStep('select-corpus');
                  setSelectedCorpus(null);
                } else if (step === 'configure') {
                  setStep('select-papers');
                  setError(null);
                } else {
                  handleClose();
                }
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {step === 'select-corpus' ? 'Cancel' : 'Back'}
            </button>

            {step === 'select-papers' && (
              <button
                onClick={() => setStep('configure')}
                disabled={selectedPaperIds.size === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
              >
                Continue
              </button>
            )}

            {step === 'configure' && (
              <button
                onClick={handleExtract}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Extract Themes
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
