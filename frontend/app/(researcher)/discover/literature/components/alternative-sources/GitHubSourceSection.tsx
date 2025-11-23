/**
 * GitHubSourceSection Component
 * Phase 10.91 Day 13 - AlternativeSourcesPanel Refactoring
 *
 * Displays GitHub source UI with current development status
 *
 * @module alternative-sources/GitHubSourceSection
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeClasses, getStatusText, getSourceById } from './constants';

// ============================================================================
// Component
// ============================================================================

export function GitHubSourceSection() {
  const source = getSourceById('github');

  if (!source) return null;

  const statusBadgeClasses = getStatusBadgeClasses(source.status);
  const statusText = getStatusText(source);

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
      {/* Header */}
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <span>💻 GitHub Repository Search</span>
        <Badge variant="secondary" className={`text-xs ${statusBadgeClasses}`}>
          {statusText}
        </Badge>
      </h4>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-3">
        Search code implementations, datasets, and technical documentation from GitHub
        repositories (in development)
      </p>

      {/* Features List */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-amber-600" aria-hidden="true">
            🔄
          </span>
          <span className="text-gray-700">
            Search 10+ million repositories with quality scoring (planned {source.releaseQuarter})
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-600" aria-hidden="true">
            🔄
          </span>
          <span className="text-gray-700">
            View stars, forks, and programming languages (planned {source.releaseQuarter})
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-600" aria-hidden="true">
            🔄
          </span>
          <span className="text-gray-700">
            Direct links to repository documentation and code (planned {source.releaseQuarter})
          </span>
        </div>
      </div>

      {/* Call to Action */}
      <p className="text-xs text-blue-600 mt-3 font-medium">
        💡 Join our waitlist to be notified when GitHub search launches
      </p>
    </div>
  );
}
