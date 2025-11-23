/**
 * PodcastsSourceSection Component
 * Phase 10.91 Day 13 - AlternativeSourcesPanel Refactoring
 *
 * Displays Podcasts source UI with current development status
 *
 * @module alternative-sources/PodcastsSourceSection
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeClasses, getStatusText, getSourceById } from './constants';

// ============================================================================
// Component
// ============================================================================

export function PodcastsSourceSection() {
  const source = getSourceById('podcasts');

  if (!source) return null;

  const statusBadgeClasses = getStatusBadgeClasses(source.status);
  const statusText = getStatusText(source);

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
      {/* Header */}
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <span>🎙️ Podcast Transcription & Analysis</span>
        <Badge variant="secondary" className={`text-xs ${statusBadgeClasses}`}>
          {statusText}
        </Badge>
      </h4>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-3">
        Automated podcast search, transcription, and AI-powered content extraction
        (in development)
      </p>

      {/* Features List */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-amber-600" aria-hidden="true">
            🔄
          </span>
          <span className="text-gray-700">
            Podcast URL transcription (planned {source.releaseQuarter})
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-600" aria-hidden="true">
            🔄
          </span>
          <span className="text-gray-700">
            AI-powered content extraction & theme analysis (planned {source.releaseQuarter})
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-amber-600" aria-hidden="true">
            🔄
          </span>
          <span className="text-gray-700">
            Integration with major podcast platforms (planned {source.releaseQuarter})
          </span>
        </div>
      </div>

      {/* Call to Action */}
      <p className="text-xs text-blue-600 mt-3 font-medium">
        💡 Join our waitlist to be notified when podcast search launches
      </p>
    </div>
  );
}
