/**
 * PaperCard Analytics Utilities
 * Phase 10.123 Phase 5: Analytics Integration
 *
 * Provides type-safe analytics tracking for PaperCard interactions.
 * Integrates with global analytics if available, otherwise logs to console.
 *
 * @module paper-card/analytics
 */

// ============================================================================
// Types
// ============================================================================

/** Analytics event names for PaperCard interactions */
export type PaperCardEventName =
  | 'paper_card_tooltip_opened'
  | 'paper_card_tooltip_closed'
  | 'paper_card_metadata_expanded'
  | 'paper_card_metadata_collapsed'
  | 'paper_card_selected'
  | 'paper_card_saved'
  | 'paper_card_unsaved'
  | 'paper_card_error';

/** Base properties for all PaperCard events */
interface BasePaperCardEvent {
  /** Paper ID */
  paperId: string;
  /** Timestamp when event occurred */
  timestamp: number;
}

/** Generic event properties - allows any additional properties */
type PaperCardEventProps = BasePaperCardEvent & Record<string, unknown>;

// ============================================================================
// Global Analytics Interface
// ============================================================================

/** Global analytics interface (e.g., Segment, Amplitude, Mixpanel) */
interface GlobalAnalytics {
  track: (event: string, properties?: Record<string, unknown>) => void;
}

/** Check if global analytics is available */
function getGlobalAnalytics(): GlobalAnalytics | null {
  if (typeof window !== 'undefined') {
    // Check for common analytics libraries
    const win = window as unknown as { analytics?: GlobalAnalytics };
    if (win.analytics && typeof win.analytics.track === 'function') {
      return win.analytics;
    }
  }
  return null;
}

// ============================================================================
// Track Function
// ============================================================================

/**
 * Track a PaperCard analytics event
 * Uses global analytics if available, otherwise logs to console in development
 *
 * @param eventName - Name of the event to track
 * @param properties - Event properties
 */
export function trackPaperCardEvent(
  eventName: PaperCardEventName,
  properties: Omit<PaperCardEventProps, 'timestamp'>
): void {
  const eventProps = {
    ...properties,
    timestamp: Date.now(),
  };

  const analytics = getGlobalAnalytics();

  if (analytics) {
    analytics.track(eventName, eventProps);
  } else if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug(`[PaperCard Analytics] ${eventName}`, eventProps);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Track tooltip opened event
 */
export function trackTooltipOpened(
  paperId: string,
  score: number | null | undefined,
  tier: string | null,
  rank: number | null | undefined
): void {
  trackPaperCardEvent('paper_card_tooltip_opened', {
    paperId,
    score,
    tier,
    rank,
  });
}

/**
 * Track tooltip closed event
 */
export function trackTooltipClosed(paperId: string): void {
  trackPaperCardEvent('paper_card_tooltip_closed', {
    paperId,
    score: undefined,
    tier: null,
    rank: undefined,
  });
}

/**
 * Track metadata expanded event
 */
export function trackMetadataExpanded(
  paperId: string,
  meshCount: number,
  grantCount: number,
  affiliationCount: number,
  publicationTypeCount: number
): void {
  trackPaperCardEvent('paper_card_metadata_expanded', {
    paperId,
    meshCount,
    grantCount,
    affiliationCount,
    publicationTypeCount,
  });
}

/**
 * Track metadata collapsed event
 */
export function trackMetadataCollapsed(paperId: string): void {
  trackPaperCardEvent('paper_card_metadata_collapsed', {
    paperId,
    meshCount: 0,
    grantCount: 0,
    affiliationCount: 0,
    publicationTypeCount: 0,
  });
}

/**
 * Track paper selection event
 */
export function trackPaperSelected(
  paperId: string,
  title: string,
  isSelected: boolean
): void {
  trackPaperCardEvent('paper_card_selected', {
    paperId,
    title,
    isSelected,
  });
}

/**
 * Track paper save/unsave event
 */
export function trackPaperSaved(
  paperId: string,
  title: string,
  isSaved: boolean
): void {
  trackPaperCardEvent(isSaved ? 'paper_card_saved' : 'paper_card_unsaved', {
    paperId,
    title,
    isSaved,
  });
}

/**
 * Track paper card error event
 */
export function trackPaperCardError(
  paperId: string,
  errorMessage: string,
  paperTitle: string | undefined
): void {
  trackPaperCardEvent('paper_card_error', {
    paperId,
    errorMessage,
    paperTitle,
  });
}
