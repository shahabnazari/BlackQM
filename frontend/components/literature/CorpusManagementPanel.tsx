/**
 * Phase 10 Day 18: Corpus Management Panel
 *
 * Enterprise-grade corpus management interface:
 * - List all research corpuses with metadata
 * - Create, edit, delete corpuses
 * - Visual status badges (active, saturated, in-progress)
 * - Quick statistics and actions
 *
 * User communication: Clear organization of iterative research projects
 * Research backing: Supports corpus building methodology (Noblit & Hare 1988)
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  incrementalExtractionApi,
  type CorpusInfo,
} from '@/lib/api/services/incremental-extraction-api.service';
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface CorpusManagementPanelProps {
  onSelectCorpus?: (corpus: CorpusInfo) => void;
  onCreateCorpus?: () => void;
}

export function CorpusManagementPanel({
  onSelectCorpus,
  onCreateCorpus,
}: CorpusManagementPanelProps) {
  const [corpuses, setCorpuses] = useState<CorpusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCorpuses();
  }, []);

  const loadCorpuses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await incrementalExtractionApi.getCorpusList();
      setCorpuses(
        data.sort(
          (a, b) =>
            new Date(b.lastExtractedAt).getTime() -
            new Date(a.lastExtractedAt).getTime()
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load corpuses');
      console.error('Error loading corpuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (corpusId: string, corpusName: string) => {
    if (
      !confirm(`Delete corpus "${corpusName}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      setDeletingId(corpusId);
      await incrementalExtractionApi.deleteCorpus(corpusId);
      setCorpuses(prev => prev.filter(c => c.id !== corpusId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete corpus');
      console.error('Error deleting corpus:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusInfo = (corpus: CorpusInfo) => {
    if (corpus.isSaturated) {
      return {
        label: 'Saturated',
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-700',
      };
    }
    if (corpus.totalExtractions > 1) {
      return {
        label: 'Active',
        icon: TrendingUp,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        borderColor: 'border-blue-200 dark:border-blue-700',
      };
    }
    return {
      label: 'New',
      icon: AlertCircle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      borderColor: 'border-amber-200 dark:border-amber-700',
    };
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      exploratory: 'Exploratory',
      explanatory: 'Explanatory',
      evaluative: 'Evaluative',
      descriptive: 'Descriptive',
    };
    return labels[purpose] || purpose;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-700 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadCorpuses}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Research Corpuses
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your iterative theme extraction projects
            </p>
          </div>
          <button
            onClick={onCreateCorpus}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Corpus
          </button>
        </div>

        {/* Summary Stats */}
        {corpuses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Corpuses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {corpuses.length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Active Research
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {
                  corpuses.filter(c => !c.isSaturated && c.totalExtractions > 1)
                    .length
                }
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Saved
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                ${corpuses.reduce((sum, c) => sum + c.costSaved, 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Corpus List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {corpuses.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              No research corpuses yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Create a corpus to start iterative theme extraction
            </p>
            <button
              onClick={onCreateCorpus}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Your First Corpus
            </button>
          </div>
        ) : (
          corpuses.map(corpus => {
            const status = getStatusInfo(corpus);
            const StatusIcon = status.icon;

            return (
              <div
                key={corpus.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                onClick={() => onSelectCorpus?.(corpus)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title & Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {corpus.name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color} border ${status.borderColor}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>

                    {/* Purpose */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Purpose:{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {getPurposeLabel(corpus.purpose)}
                      </span>
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-gray-500 dark:text-gray-500">
                          Papers
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                          {corpus.paperIds.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-500">
                          Themes
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                          {corpus.themeCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-500">
                          Extractions
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                          {corpus.totalExtractions}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-500">
                          Cost Saved
                        </p>
                        <p className="font-medium text-green-600 dark:text-green-400 mt-0.5">
                          ${corpus.costSaved.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 dark:text-gray-500">
                      <Calendar className="w-3 h-3" />
                      Last extracted: {formatDate(corpus.lastExtractedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        // TODO: Implement edit modal
                        alert('Edit functionality coming soon');
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit corpus"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(corpus.id, corpus.name);
                      }}
                      disabled={deletingId === corpus.id}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete corpus"
                    >
                      {deletingId === corpus.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Research Note */}
      {corpuses.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500 italic">
            💡 Iterative corpus building supports theoretical saturation (Glaser
            & Strauss 1967) and meta-ethnography (Noblit & Hare 1988)
          </p>
        </div>
      )}
    </div>
  );
}
