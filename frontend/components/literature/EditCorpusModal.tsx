/**
 * Phase 10.7 Day 5: Edit Corpus Modal
 *
 * Enterprise-grade corpus editing modal with:
 * - Form validation (name required, cannot be empty)
 * - Purpose selection (locked for existing corpus - design decision)
 * - Loading states and error handling
 * - Success feedback with toast notifications
 * - Accessible keyboard navigation
 * - Dark mode support
 *
 * User communication: Clear, simple editing interface
 * Research backing: Supports iterative corpus refinement (Braun & Clarke 2019)
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { CorpusInfo } from '@/lib/api/services/incremental-extraction-api.service';
import { X, Loader2, AlertTriangle, CheckCircle, Edit2 } from 'lucide-react';

interface EditCorpusModalProps {
  isOpen: boolean;
  corpus: CorpusInfo;
  onClose: () => void;
  onSave: (corpusId: string, updates: { name?: string }) => Promise<void>;
}

export function EditCorpusModal({
  isOpen,
  corpus,
  onClose,
  onSave,
}: EditCorpusModalProps) {
  const [name, setName] = useState(corpus.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Phase 10.7 Day 5: Reset form when corpus changes
  useEffect(() => {
    setName(corpus.name);
    setError(null);
    setSuccess(false);
  }, [corpus]);

  // Phase 10.7 Day 5: Reset success after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Phase 10.7 Day 5: Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Corpus name cannot be empty');
      return;
    }

    // Phase 10.7 Day 5: Check if name actually changed
    if (trimmedName === corpus.name) {
      setError('No changes detected');
      return;
    }

    try {
      setLoading(true);
      await onSave(corpus.id, { name: trimmedName });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update corpus');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  // Phase 10.7 Day 5: Keyboard accessibility (Escape to close)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    return undefined;
  }, [isOpen, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Edit Corpus
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Corpus updated successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Closing...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Corpus Name Field */}
          <div className="space-y-2 mb-4">
            <label
              htmlFor="corpus-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Corpus Name
            </label>
            <input
              id="corpus-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || success}
              placeholder="Enter corpus name..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              autoFocus
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              A descriptive name to identify this research corpus
            </p>
          </div>

          {/* Purpose Display (Read-only) */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Research Purpose
            </label>
            <div className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                {corpus.purpose.replace(/_/g, ' ')}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              💡 Purpose cannot be changed after corpus creation (design decision)
            </p>
          </div>

          {/* Metadata Display */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
              Corpus Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Papers</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                  {corpus.paperIds.length}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Themes</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                  {corpus.themeCount}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Extractions</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                  {corpus.totalExtractions}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Cost Saved</p>
                <p className="font-medium text-green-600 dark:text-green-400 mt-0.5">
                  ${corpus.costSaved.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading || success}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success || !name.trim() || name.trim() === corpus.name}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

        {/* Research Note */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            💡 Corpus editing supports iterative refinement (Braun & Clarke 2019: Reflexive Thematic Analysis)
          </p>
        </div>
      </div>
    </div>
  );
}
