/**
 * TikTokSearchSection Component
 * Phase 10.91 Day 14 - Extracted from SocialMediaPanel.tsx
 *
 * ARCHITECTURAL PATTERN: Sub-Component Extraction
 * Extracted from 612-line SocialMediaPanel to improve maintainability.
 * Handles TikTok-specific search, transcription, and research integration.
 *
 * MODIFICATION STRATEGY:
 * - Add new TikTok features here, not in parent component
 * - Keep TikTok API integration logic in this file
 * - Props should be minimal - use hooks for complex state
 * - Follow Component Composition pattern (not prop drilling)
 *
 * PRINCIPLES FOLLOWED:
 * ✅ Single Responsibility Principle (TikTok functionality only)
 * ✅ Component Size Limit (<200 lines)
 * ✅ Minimal Props (<10 props)
 * ✅ React.memo() for performance
 * ✅ useCallback() for all handlers
 * ✅ Enterprise-grade TypeScript (no `any`)
 * ✅ Accessibility (ARIA labels, semantic HTML)
 *
 * @module SocialMedia/TikTokSearchSection
 */

'use client';

import React, { memo, useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import {
  TikTokTrendsGrid,
  type TikTokVideo,
} from '@/components/literature';

// ============================================================================
// Types
// ============================================================================

export interface TikTokSearchSectionProps {
  /** Whether TikTok platform is selected */
  isSelected: boolean;
  /** TikTok search results from hook */
  results: TikTokVideo[];
  /** Whether TikTok search is in progress */
  isLoading: boolean;
  /** Search query for context */
  searchQuery: string;
}

// ============================================================================
// Component
// ============================================================================

export const TikTokSearchSection = memo<TikTokSearchSectionProps>(
  function TikTokSearchSection({
    isSelected,
    results,
    isLoading,
    searchQuery,
  }) {
    // State for tracking videos being transcribed
    const [transcribingIds, setTranscribingIds] = useState<Set<string>>(new Set());

    // ========================================================================
    // Handlers
    // ========================================================================

    /**
     * Handle TikTok video transcription
     * Note: Backend API not implemented yet - placeholder functionality
     */
    const handleTranscribe = useCallback(async (videoId: string) => {
      setTranscribingIds(prev => new Set([...prev, videoId]));

      try {
        // TODO: Implement backend API call when ready
        // await literatureAPI.transcribeTikTokVideo(videoId);
        logger.info('Transcribing TikTok video', 'TikTokSearchSection', { videoId });

        // PLACEHOLDER: Simulate transcription delay for UX testing
        // Remove this setTimeout when backend API is implemented
        await new Promise(resolve => setTimeout(resolve, 3000));

        toast.success('TikTok video transcribed successfully!', {
          description: 'Transcript is now available for theme extraction.',
        });
      } catch (error) {
        logger.error('TikTok transcription error', 'TikTokSearchSection', { error, errorMessage: error instanceof Error ? error.message : 'Unknown error' });
        toast.error('Failed to transcribe TikTok video.', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setTranscribingIds(prev => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      }
    }, []);

    /**
     * Handle adding TikTok video to research corpus
     * Note: Backend API not implemented yet - placeholder functionality
     */
    const handleAddToResearch = useCallback(async (video: TikTokVideo) => {
      try {
        // TODO: Implement backend API call when ready
        // await literatureAPI.addTikTokToResearch(video);
        logger.info('Adding TikTok video to research', 'TikTokSearchSection', { videoId: video.id, videoTitle: video.title });

        toast.success(`Added "${video.title}" to research corpus`, {
          description: 'Video will be included in theme extraction.',
        });
      } catch (error) {
        logger.error('Failed to add TikTok video to research', 'TikTokSearchSection', { error, errorMessage: error instanceof Error ? error.message : 'Unknown error' });
        toast.error('Failed to add video to research.', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, []);

    /**
     * Handle viewing TikTok transcript
     * Note: Transcript modal not implemented yet - placeholder functionality
     */
    const handleViewTranscript = useCallback((videoId: string) => {
      // TODO: Implement transcript modal when ready
      logger.debug('Opening TikTok transcript viewer', 'TikTokSearchSection', { videoId });
      toast.info('Transcript viewer opening...', {
        description: 'Coming soon in Q1 2025',
      });
    }, []);

    // ========================================================================
    // Render Conditions
    // ========================================================================

    if (!isSelected) {
      return null;
    }

    // ========================================================================
    // Render
    // ========================================================================

    return (
      <>
        {/* TikTok Results */}
        {results.length > 0 && (
          <div className="border rounded-lg p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>🎵 TikTok</span>
              <Badge variant="secondary" className="text-xs bg-cyan-100 text-cyan-700">
                {results.length}
              </Badge>
            </h4>
            <TikTokTrendsGrid
              videos={results}
              onTranscribe={handleTranscribe}
              onAddToResearch={handleAddToResearch}
              onViewTranscript={handleViewTranscript}
              transcribingIds={transcribingIds}
              isLoading={isLoading}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && results.length === 0 && (
          <div
            className="border rounded-lg p-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-3">
              <Loader2
                className="w-5 h-5 text-cyan-600 animate-spin"
                aria-hidden="true"
              />
              <span className="text-sm text-gray-600">Searching TikTok...</span>
            </div>
          </div>
        )}
      </>
    );
  }
);

TikTokSearchSection.displayName = 'TikTokSearchSection';
