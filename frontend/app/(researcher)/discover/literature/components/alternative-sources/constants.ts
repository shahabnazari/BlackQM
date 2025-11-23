/**
 * Alternative Sources Constants
 * Phase 10.91 Day 13 - Component Refactoring
 * Phase 10.935 Day 12 - Enterprise logging compliance
 * ✅ AUDIT FIXED: Added security helpers, MAX_DISPLAYED_TAGS, formatDuration
 * ✅ LOGGING FIXED: Replaced console.error with logger
 *
 * Centralized configuration for alternative knowledge sources
 *
 * @module alternative-sources/constants
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface AlternativeSource {
  id: string;
  label: string;
  icon: string;
  desc: string;
  status: 'active' | 'coming' | 'planned';
  releaseQuarter?: string;
}

// ============================================================================
// Display Constants
// ============================================================================

/**
 * Maximum number of tags to display before showing "+N more"
 * Used by: StackOverflowCard
 */
export const MAX_DISPLAYED_TAGS = 5;

// ============================================================================
// Alternative Sources Configuration
// ============================================================================

/**
 * Complete list of alternative knowledge sources
 * Podcasts, GitHub, StackOverflow, Medium
 */
export const ALTERNATIVE_SOURCES: AlternativeSource[] = [
  {
    id: 'podcasts',
    label: 'Podcasts',
    icon: '🎙️',
    desc: 'Expert interviews & discussions',
    status: 'coming',
    releaseQuarter: 'Q1 2025',
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: '💻',
    desc: 'Code & datasets',
    status: 'planned',
    releaseQuarter: 'Q1 2025',
  },
  {
    id: 'stackoverflow',
    label: 'StackOverflow',
    icon: '📚',
    desc: 'Technical Q&A',
    status: 'planned',
    releaseQuarter: 'Q1 2025',
  },
  {
    id: 'medium',
    label: 'Medium',
    icon: '📝',
    desc: 'Practitioner insights',
    status: 'planned',
    releaseQuarter: 'Q2 2025',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get source configuration by ID
 */
export function getSourceById(id: string): AlternativeSource | undefined {
  return ALTERNATIVE_SOURCES.find(source => source.id === id);
}

/**
 * Get status badge color classes
 */
export function getStatusBadgeClasses(
  status: AlternativeSource['status']
): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'coming':
      return 'bg-amber-100 text-amber-700';
    case 'planned':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get status badge text
 */
export function getStatusText(source: AlternativeSource): string {
  if (source.status === 'active') {
    return 'Active';
  }
  if (source.releaseQuarter) {
    return source.status === 'coming'
      ? `Coming ${source.releaseQuarter}`
      : `Planned ${source.releaseQuarter}`;
  }
  return 'Planned';
}

// ============================================================================
// Security Helpers
// ============================================================================

/**
 * Validate URL is safe to open (http/https only)
 * Prevents XSS attacks via javascript:, data:, file: protocols
 *
 * @param url - URL to validate
 * @returns true if URL is safe (http/https), false otherwise
 */
export function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Safely open external URL in new tab
 * Validates URL and handles errors gracefully
 *
 * @param url - URL to open
 * @param onError - Optional error handler
 */
export function safeOpenExternalUrl(
  url: string | null | undefined,
  onError?: (error: Error) => void
): void {
  if (!isValidHttpUrl(url)) {
    const error = new Error('Invalid URL: Only http/https protocols allowed');
    if (onError) {
      onError(error);
    } else {
      logger.error('Invalid URL for alternative source', 'AlternativeSources', {
        url,
        reason: 'Only http/https protocols allowed'
      });
    }
    return;
  }

  try {
    window.open(url as string, '_blank', 'noopener,noreferrer');
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to open URL');
    if (onError) {
      onError(err);
    } else {
      logger.error('Failed to open alternative source URL', 'AlternativeSources', {
        url,
        error: err.message
      });
    }
  }
}

// ============================================================================
// Podcast Helper Functions
// ============================================================================

/**
 * Format duration in seconds to human-readable string
 * Used by: PodcastCard
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "1h 30m" or "45 min")
 */
export function formatDuration(seconds: number): string {
  if (typeof seconds !== 'number' || seconds < 0 || !Number.isFinite(seconds)) {
    return '0 min';
  }

  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours > 0) {
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${mins} min`;
}
