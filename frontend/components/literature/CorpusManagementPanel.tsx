/**
 * Phase 10.7 Day 5: Corpus Management Panel (REFACTORED TO ENTERPRISE PATTERN)
 *
 * Enterprise-grade corpus management interface:
 * - Pure presentation component (receives state from hook)
 * - Single source of truth (hook manages all state)
 * - Callback pattern (no direct API calls)
 * - Visual status badges (active, saturated, in-progress)
 * - Quick statistics and actions
 *
 * Changes from Day 18:
 * - Removed internal state management (corpuses, loading, error)
 * - Removed direct API calls (now uses callbacks)
 * - Added onEdit and onDelete callbacks
 * - Component now receives hook state as props
 *
 * User communication: Clear organization of iterative research projects
 * Research backing: Supports corpus building methodology (Noblit & Hare 1988)
 */

'use client';

import React, { useState } from 'react';
import type { CorpusInfo } from '@/lib/api/services/incremental-extraction-api.service';
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
  // Phase 10.7 Day 5: Hook state (single source of truth)
  corpuses: CorpusInfo[];
  loading: boolean;
  error: string | null;
  // Phase 10.7 Day 5: Hook actions (callback pattern)
  onSelectCorpus?: (corpus: CorpusInfo) => void;
  onCreateCorpus?: () => void;
  onEditCorpus?: (corpus: CorpusInfo) => void;
  onDeleteCorpus?: (corpusId: string, corpusName: string) => Promise<void>;
  onRetry?: () => void;
}

export function CorpusManagementPanel({
  corpuses,
  loading,
  error,
  onSelectCorpus,
  onCreateCorpus,
  onEditCorpus,
  onDeleteCorpus,
  onRetry,
}: CorpusManagementPanelProps) {
  // Phase 10.7 Day 5: Only track local UI state (which corpus is being deleted)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Phase 10.7 Day 5: Handle delete with callback pattern
  const handleDelete = async (corpusId: string, corpusName: string) => {
    if (
      !confirm(`Delete corpus "${corpusName}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      setDeletingId(corpusId);
      await onDeleteCorpus?.(corpusId, corpusName);
    } catch (err) {
      // Error handling done by hook/parent
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
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Try again
              </button>
            )}
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

                  {/* Phase 10.7 Day 5: Actions with callback pattern */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onEditCorpus?.(corpus);
                      }}
                      disabled={!onEditCorpus}
                      className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={onEditCorpus ? 'Edit corpus' : 'Edit not available'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(corpus.id, corpus.name);
                      }}
                      disabled={deletingId === corpus.id || !onDeleteCorpus}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={onDeleteCorpus ? 'Delete corpus' : 'Delete not available'}
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
