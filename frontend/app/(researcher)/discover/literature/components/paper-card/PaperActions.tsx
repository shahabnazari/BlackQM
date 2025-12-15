/**
 * PaperActions Component
 * Phase 10.91 Day 10 - PaperCard Refactoring
 * Phase 10.145 - Netflix-grade UX: Replaced alert() with toast notifications
 *
 * Displays action buttons: View Paper, Full-Text Access, Save
 * Includes enterprise-grade full-text fetch with paywall detection
 * ✅ FIXED: Code duplication eliminated (imports from shared constants)
 * ✅ FIXED: Security - removed hardcoded API URL fallback, added DOI sanitization
 * ✅ FIXED: Type safety - proper API response types
 * ✅ FIXED: Performance - useCallback for event handlers
 * ✅ Phase 10.145: Replaced all alert() with toast notifications
 *
 * @module PaperActions
 */

'use client';

import React, { useCallback } from 'react';
import { ExternalLink, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast, ToastContainer } from '@/components/ui/ToastNotification';
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

/**
 * Toast callback interface for full-text fetch notifications
 * Phase 10.145: Enables toast notifications in async helper function
 */
interface ToastCallbacks {
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  showSuccess: (message: string) => void;
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
 * Phase 10.145: Now uses toast callbacks instead of alert()
 * @param paper - Paper to fetch full-text for
 * @param toast - Toast callback functions
 */
async function handleFullTextFetch(paper: Paper, toast: ToastCallbacks): Promise<void> {
  const sanitizedDOI = sanitizeDOI(paper.doi);

  if (!sanitizedDOI) {
    toast.showError('Invalid or missing DOI. Please verify the paper has a valid DOI identifier.');
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
        toast.showError('Authentication required. Please log in and try again.');
      } else if (response.status === 404) {
        toast.showError('Paper not found. Please refresh and try again.');
      } else {
        toast.showError(`Failed to queue full-text fetch (HTTP ${response.status}). Please try again.`);
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
        toast.showInfo(`Full-text queued. Background processing in progress.`);
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
        toast.showSuccess('PDF opened in new tab');
        logger.info('Full-text fetch complete - PDF opened + background job queued', 'PaperActions', {
          paperId: paper.id,
          doi: sanitizedDOI,
        });
      } else {
        logger.warn('No immediate PDF available - background job will try PMC/HTML scraping', 'PaperActions', {
          paperId: paper.id,
          doi: sanitizedDOI,
        });
        toast.showInfo('No immediate PDF. Background fetch queued - check back shortly.');
      }
    } catch (unpaywallError: unknown) {
      const errorMessage =
        unpaywallError instanceof Error
          ? unpaywallError.message
          : 'Unknown error';
      logger.error('Unpaywall request error', 'PaperActions', { errorMessage, doi: sanitizedDOI });
      toast.showInfo('Full-text queued. Background processing in progress.');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Unexpected error during full-text fetch', 'PaperActions', { errorMessage, paperId: paper.id });
    toast.showError(`Unexpected error: ${errorMessage}`);
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
  // Phase 10.145: Toast notifications instead of alert()
  const { toasts, removeToast, showError, showWarning, showInfo, showSuccess } = useToast();

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
   * Stops propagation and initiates full-text fetch with toast notifications
   */
  const handleFullTextClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      // Phase 10.145: Pass toast callbacks to async function
      void handleFullTextFetch(paper, { showError, showWarning, showInfo, showSuccess });
    },
    [paper, showError, showWarning, showInfo, showSuccess]
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
    <>
      {/* Phase 10.145: Toast Container for notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} position="bottom-right" />

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
            title="Enterprise-grade full-text access via Unpaywall, PMC, or publisher"
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
    </>
  );
}
