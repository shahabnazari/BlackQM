/**
 * Result Card Component
 * Individual paper display card with actions
 * Phase 10.1 Day 3 - Component Extraction
 *
 * @module ResultCard
 */

'use client';

import React, { useCallback } from 'react';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

export interface ResultCardProps {
  paper: Paper;
  isSelected?: boolean;
  onSelect?: (paperId: string) => void;
  onView?: (paperId: string) => void;
  onSave?: (paperId: string) => void;
  onExport?: (paperId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

// ============================================================================
// Result Card Component
// ============================================================================

export const ResultCard = React.memo(function ResultCard({
  paper,
  isSelected = false,
  onSelect,
  onView,
  onSave,
  onExport,
  showActions = true,
  compact = false,
}: ResultCardProps) {
  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(paper.id);
    }
  }, [paper.id, onSelect]);

  const handleView = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onView) {
        onView(paper.id);
      }
    },
    [paper.id, onView]
  );

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onSave) {
        onSave(paper.id);
      }
    },
    [paper.id, onSave]
  );

  const handleExport = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onExport) {
        onExport(paper.id);
      }
    },
    [paper.id, onExport]
  );

  const authors = paper.authors?.slice(0, 3).join(', ') || 'Unknown authors';
  const moreAuthors = paper.authors && paper.authors.length > 3
    ? ` +${paper.authors.length - 3} more`
    : '';

  return (
    <div
      onClick={handleSelect}
      className={`p-4 border rounded-lg transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        {onSelect && (
          <div className="flex-shrink-0 mt-1">
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300'
              }`}
            >
              {isSelected && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
            {paper.title}
          </h3>

          {/* Metadata */}
          <div className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-1' : 'mt-2'} text-sm text-gray-600`}>
            {/* Authors */}
            <span className="truncate">
              {authors}
              {moreAuthors && (
                <span className="text-gray-400">{moreAuthors}</span>
              )}
            </span>

            <span className="text-gray-400">•</span>

            {/* Year */}
            {paper.year && <span>{paper.year}</span>}

            {paper.year && paper.venue && <span className="text-gray-400">•</span>}

            {/* Venue */}
            {paper.venue && (
              <span className="italic truncate">{paper.venue}</span>
            )}
          </div>

          {/* Abstract */}
          {!compact && paper.abstract && (
            <p className="mt-2 text-sm text-gray-700 line-clamp-2">
              {paper.abstract}
            </p>
          )}

          {/* Badges and Metrics */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Citation Count */}
            {paper.citationCount !== undefined && paper.citationCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                {paper.citationCount} citations
              </span>
            )}

            {/* PDF Available */}
            {paper.hasPdf && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                PDF Available
              </span>
            )}

            {/* Quality Score */}
            {paper.qualityScore !== undefined && paper.qualityScore >= 50 && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                Quality: {paper.qualityScore}%
              </span>
            )}

            {/* Source */}
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded uppercase">
              {paper.source}
            </span>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-2 mt-3">
              {onView && (
                <button
                  onClick={handleView}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </button>
              )}

              {onSave && (
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Save
                </button>
              )}

              {onExport && (
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Export
                </button>
              )}

              {/* DOI Link */}
              {paper.doi && (
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  DOI →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ResultCard;
