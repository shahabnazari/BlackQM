/**
 * PaperActions Component
 * Phase 10.91 Day 10 - PaperCard Refactoring
 *
 * Displays action buttons: View Paper, Full-Text Access, Save
 * Includes enterprise-grade full-text fetch with paywall detection
 * ✅ FIXED: Code duplication eliminated (imports from shared constants)
 * ✅ FIXED: Security - removed hardcoded API URL fallback, added DOI sanitization
 * ✅ FIXED: Type safety - proper API response types
 * ✅ FIXED: Performance - useCallback for event handlers
 * ⚠️  TODO: Replace alert() with toast system (requires UX library integration)
 *
 * @module PaperActions
 */

'use client';

import React, { useCallback } from 'react';
import { ExternalLink, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import type { Paper } from '@/lib/types/literature.types';
import {
  isPaywalledPublisher,
  isKnownOpenSource,
  sanitizeDOI,
  UNPAYWALL_POLITE_POOL_EMAIL,
} from './constants';

// ============================================================================
// Types
// ============================================================================

interface PaperActionsProps {
  /** Complete paper object */
  paper: Paper;
  /** Whether the paper is saved */
  isSaved: boolean;
  /** Handler for toggling save status */
  onToggleSave: (paper: Paper) => void;
}

/**
 * Response type from /api/pdf/fetch endpoint
 */
interface PDFFetchResponse {
  jobId: string;
  status: string;
  message?: string;
}

/**
 * Response type from Unpaywall API
 */
interface UnpaywallResponse {
  doi: string;
  is_oa: boolean;
  oa_status?: string;
  best_oa_location?: {
    url?: string;
    url_for_pdf?: string;
    url_for_landing_page?: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get API URL with proper error handling
 * @throws Error if NEXT_PUBLIC_API_URL is not configured
 */
function getApiUrl(): string {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'];

  if (!apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL environment variable is not configured. Please check your .env.local file.'
    );
  }

  return apiUrl;
}

/**
 * Handle full-text fetch with enterprise waterfall strategy
 * @param paper - Paper to fetch full-text for
 */
async function handleFullTextFetch(paper: Paper): Promise<void> {
  const sanitizedDOI = sanitizeDOI(paper.doi);

  if (!sanitizedDOI) {
    alert(
      'Cannot fetch full-text: Invalid or missing DOI. Please verify the paper has a valid DOI identifier.'
    );
    return;
  }

  logger.info('Starting full-text fetch for paper', 'PaperActions', {
    paperId: paper.id,
    doi: sanitizedDOI,
    title: paper.title,
  });

  try {
    // Step 1: Queue enterprise waterfall fetch job
    const apiUrl = getApiUrl();
    const endpoint = `${apiUrl}/pdf/fetch/${paper.id}`;

    logger.debug('Calling backend API for full-text fetch', 'PaperActions', { endpoint });

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.debug('Backend response received', 'PaperActions', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Backend full-text fetch error', 'PaperActions', {
        status: response.status,
        error: errorText,
      });

      if (response.status === 401) {
        alert('Authentication required. Please log in and try again.');
      } else if (response.status === 404) {
        alert('Paper not found. Please refresh and try again.');
      } else {
        alert(
          `Failed to queue full-text fetch (HTTP ${response.status}). Please try again.`
        );
      }
      return;
    }

    const jobData: PDFFetchResponse = await response.json();
    logger.info('Full-text fetch job queued successfully', 'PaperActions', { jobData });

    // Step 2: Try immediate Unpaywall access for instant PDF
    logger.debug('Checking Unpaywall for immediate access', 'PaperActions', { doi: sanitizedDOI });

    try {
      const unpaywallResponse = await fetch(
        `https://api.unpaywall.org/v2/${sanitizedDOI}?email=${UNPAYWALL_POLITE_POOL_EMAIL}`
      );

      if (!unpaywallResponse.ok) {
        logger.warn('Unpaywall request failed', 'PaperActions', {
          status: unpaywallResponse.status,
          doi: sanitizedDOI,
        });
        alert(
          `Full-text fetch queued (Job ID: ${jobData.jobId.slice(0, 8)}...). Background processing in progress. Please refresh in a moment.`
        );
        return;
      }

      const unpaywallData: UnpaywallResponse = await unpaywallResponse.json();
      logger.debug('Unpaywall data received', 'PaperActions', {
        isOpenAccess: unpaywallData.is_oa,
        hasBestOaLocation: !!unpaywallData.best_oa_location,
        oaStatus: unpaywallData.oa_status,
      });

      const pdfUrl =
        unpaywallData.best_oa_location?.url_for_pdf ||
        unpaywallData.best_oa_location?.url;

      if (pdfUrl) {
        logger.info('Opening PDF from Unpaywall', 'PaperActions', { pdfUrl });
        window.open(pdfUrl, '_blank', 'noopener,noreferrer');
        logger.info('Full-text fetch complete - PDF opened + background job queued', 'PaperActions', {
          paperId: paper.id,
          doi: sanitizedDOI,
        });
      } else {
        logger.warn('No immediate PDF available - background job will try PMC/HTML scraping', 'PaperActions', {
          paperId: paper.id,
          doi: sanitizedDOI,
        });
        alert(
          `Full-text fetch queued (Job ID: ${jobData.jobId.slice(0, 8)}...). No immediate PDF available. Background processing will try PMC/HTML scraping. Please check back in a moment.`
        );
      }
    } catch (unpaywallError: unknown) {
      const errorMessage =
        unpaywallError instanceof Error
          ? unpaywallError.message
          : 'Unknown error';
      logger.error('Unpaywall request error', 'PaperActions', { errorMessage, doi: sanitizedDOI });
      alert(
        `Full-text fetch queued (Job ID: ${jobData.jobId.slice(0, 8)}...). Could not check Unpaywall. Background processing in progress.`
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Unexpected error during full-text fetch', 'PaperActions', { errorMessage, paperId: paper.id });
    alert(
      `Unexpected error: ${errorMessage}. Please try again or contact support if this persists.`
    );
  }
}

// ============================================================================
// Component
// ============================================================================

export function PaperActions({
  paper,
  isSaved,
  onToggleSave,
}: PaperActionsProps) {
  // Calculate access status for button styling
  const hasFullText =
    paper.hasFullText === true || paper.fullTextStatus === 'success';
  const isPaywalled = isPaywalledPublisher(paper.url);
  const isOpenSource = isKnownOpenSource(paper.url);
  const isVerifiedOpenAccess =
    (paper.fullTextSource === 'unpaywall' ||
      paper.fullTextSource === 'pmc' ||
      isOpenSource) &&
    !isPaywalled;
  const isAvailable = (hasFullText && !isPaywalled) || isVerifiedOpenAccess;

  // Green for truly available, Amber for paywalled or restricted
  const buttonColor = isAvailable
    ? 'bg-emerald-600 hover:bg-emerald-700'
    : 'bg-amber-600 hover:bg-amber-700';

  /**
   * Handle View Paper button click
   * Opens DOI link or fallback URL in new tab
   */
  const handleViewPaper = useCallback(() => {
    const link = paper.doi ? `https://doi.org/${paper.doi}` : paper.url;
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }, [paper.doi, paper.url]);

  /**
   * Handle Full-Text Access button click
   * Stops propagation and initiates full-text fetch
   */
  const handleFullTextClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      void handleFullTextFetch(paper);
    },
    [paper]
  );

  /**
   * Handle Save button click
   * Stops propagation and toggles save status
   */
  const handleSaveClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onToggleSave(paper);
    },
    [paper, onToggleSave]
  );

  return (
    <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
      {/* View Paper Button */}
      {(paper.doi || paper.url) && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleViewPaper}
          aria-label="View paper on publisher website"
        >
          <ExternalLink className="w-3 h-3 mr-1" aria-hidden="true" />
          View Paper
        </Button>
      )}

      {/* Full-Text Access Button */}
      {paper.doi && (
        <Button
          size="sm"
          variant="default"
          className={`${buttonColor} text-white`}
          onClick={handleFullTextClick}
          title="Enterprise-grade full-text access. Tries: 1) Database cache, 2) PMC HTML, 3) Unpaywall PDF, 4) Publisher HTML scraping. Opens PDF if immediately available, otherwise queues background fetch."
          aria-label={
            isAvailable
              ? 'Access full text of this paper'
              : 'Check full-text availability'
          }
        >
          <BookOpen className="w-3 h-3 mr-1" aria-hidden="true" />
          {isAvailable ? 'Access Full Text' : 'Check Availability'}
        </Button>
      )}

      {/* Save Button */}
      <Button
        size="sm"
        variant={isSaved ? 'secondary' : 'outline'}
        onClick={handleSaveClick}
        aria-label={isSaved ? 'Remove from saved papers' : 'Save paper to library'}
        aria-pressed={isSaved}
      >
        <Star
          className={cn('w-3 h-3 mr-1', isSaved && 'fill-current')}
          aria-hidden="true"
        />
        {isSaved ? 'Saved' : 'Save'}
      </Button>
    </div>
  );
}
