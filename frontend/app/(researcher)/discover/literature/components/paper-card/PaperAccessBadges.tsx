/**
 * PaperAccessBadges Component
 * Phase 10.91 Day 10 - PaperCard Refactoring
 *
 * Displays access status badges: Open Access, Full-Text, Subscription Required
 * Includes smart paywall detection for 22 major publishers
 * ✅ FIXED: Code duplication eliminated (imports from shared constants)
 * ✅ FIXED: Added input validation for security
 *
 * @module PaperAccessBadges
 */

'use client';

import React from 'react';
import { Unlock, Lock, FileCheck, Loader2 } from 'lucide-react';
import { isPaywalledPublisher, isKnownOpenSource } from './constants';

// ============================================================================
// Types
// ============================================================================

interface PaperAccessBadgesProps {
  /** Paper URL */
  url?: string | null | undefined;
  /** DOI identifier */
  doi?: string | null | undefined;
  /** Whether full-text is available */
  hasFullText?: boolean | undefined;
  /** Full-text fetch status */
  fullTextStatus?:
    | 'success'
    | 'fetching'
    | 'not_fetched'
    | 'failed'
    | 'available'
    | undefined;
  /** Source of full-text (unpaywall, pmc, etc.) */
  fullTextSource?: string | null | undefined;
}

// ============================================================================
// Component
// ============================================================================

export function PaperAccessBadges({
  url,
  doi,
  hasFullText = false,
  fullTextStatus = undefined,
  fullTextSource = undefined,
}: PaperAccessBadgesProps) {
  // Determine access status with input validation
  const actualHasFullText = hasFullText === true || fullTextStatus === 'success';
  const isFetching = fullTextStatus === 'fetching';
  const isPaywalled = isPaywalledPublisher(url);
  const isOpenSource = isKnownOpenSource(url);

  // Verified open access: Unpaywall/PMC OR known open source (but NOT paywalled)
  const isVerifiedOpenAccess =
    (fullTextSource === 'unpaywall' || fullTextSource === 'pmc' || isOpenSource) &&
    !isPaywalled;

  // Show subscription required if: paywalled OR (has DOI but no full text)
  const hasRestrictedAccess =
    isPaywalled || (doi && !actualHasFullText && !isFetching);

  return (
    <>
      {/* Open Access Badge - Verified free access */}
      {isVerifiedOpenAccess && (
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-sm"
          title="This article is freely available to read without subscription (verified via Unpaywall or PubMed Central)"
          aria-label="Open Access article"
        >
          <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-semibold">Open Access</span>
        </span>
      )}

      {/* Full-Text Available Badge - Only for non-paywalled sources */}
      {actualHasFullText && !isVerifiedOpenAccess && !isPaywalled && (
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-green-700 bg-green-50 border border-green-200 shadow-sm"
          title="Full-text content available in our database for analysis and theme extraction"
          aria-label="Full-text available"
        >
          <FileCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-semibold">Full-Text Available</span>
        </span>
      )}

      {/* Fetching Access Badge */}
      {isFetching && (
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-blue-700 bg-blue-50 border border-blue-200 shadow-sm animate-pulse"
          title="Checking open access availability and fetching full-text..."
          aria-label="Checking access status"
          aria-live="polite"
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          <span className="font-semibold">Checking Access...</span>
        </span>
      )}

      {/* Restricted Access Badge - Likely requires subscription */}
      {hasRestrictedAccess && (
        <span
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full text-amber-700 bg-amber-50 border border-amber-200 shadow-sm"
          title="This article may require institutional access or subscription. Sign in with ORCID for institutional access, or click 'Full Text' to check availability."
          aria-label="Subscription may be required"
        >
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="font-semibold">Subscription Required</span>
        </span>
      )}
    </>
  );
}
