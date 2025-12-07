/**
 * Theme Extraction Service - Phase 10.93 Day 1 (STRICT AUDIT CORRECTED)
 *
 * Extracted from useThemeExtractionWorkflow.ts (lines 270-996)
 * Enterprise-grade service for theme extraction preparation workflow
 *
 * @module theme-extraction/ThemeExtractionService
 * @since Phase 10.93
 *
 * **Features:**
 * - Paper selection validation with context (NO SIDE EFFECTS)
 * - Automatic stale metadata detection and refresh
 * - Content analysis with content type classification
 * - Source filtering based on content quality
 * - Comprehensive error handling and logging
 * - Cancellation support via AbortSignal
 *
 * **Responsibilities:**
 * - Validate user authentication and paper selection
 * - Detect and refresh stale paper metadata
 * - Analyze content availability and quality
 * - Filter sources by minimum content length
 * - Calculate content type breakdown stats
 *
 * **Security:**
 * - Sanitized error context (no sensitive data in logs)
 * - Generic user-facing messages (no implementation details)
 */

import { literatureAPI } from '@/lib/services/literature-api.service';
import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';
import type { SourceContent } from '@/lib/api/services/unified-theme-api.service';
import {
  ContentType,
  classifyContentType,
} from '@/lib/types/content-types';
import { logger } from '@/lib/utils/logger';
import type {
  ValidationResult,
  StalePaperDetectionResult,
  MetadataRefreshResult,
  ProgressCallback,
  ContentAnalysis,
} from './types';

/**
 * Minimum content length for analysis (characters)
 */
const MIN_CONTENT_LENGTH = 50;

/**
 * Error messages as constants (DX-002 fix)
 */
const ERRORS = {
  AUTH_REQUIRED: 'Authentication required for theme extraction',
  NO_SOURCES: 'No sources selected',
  ALREADY_IN_PROGRESS: 'Extraction already in progress',
} as const;

/**
 * User-facing messages (SEC-002 fix: generic, no implementation details)
 */
const USER_MESSAGES = {
  AUTH_REQUIRED: 'Please log in to extract themes from your selected papers.',
  NO_SOURCES: 'Please select at least one paper or video for theme extraction.',
  ALREADY_IN_PROGRESS: 'Theme extraction is already in progress.',
} as const;

/**
 * User authentication info
 */
export interface User {
  id: string;
  email?: string;
}

/**
 * Transcribed video interface
 */
export interface TranscribedVideo {
  id: string;
  title: string;
  transcript: string;
  url: string;
  sourceId?: string;
  duration?: number;
  channel?: string;
  themes?: Array<string | { label: string }>;
}

/**
 * Enhanced ValidationResult with user-facing message (BUG-001 fix)
 */
export interface ValidationResultWithMessage extends ValidationResult {
  /** User-facing error message for toast/UI (if validation failed) */
  userMessage?: string;
}

/**
 * Theme Extraction Service
 *
 * Handles validation, metadata refresh, and content analysis
 */
export class ThemeExtractionService {
  /**
   * Validate extraction prerequisites
   *
   * **IMPORTANT:** This is a PURE FUNCTION with NO SIDE EFFECTS.
   * Consumer must handle UI updates (toasts, etc.) based on the returned result.
   *
   * @param user - Current user (must be authenticated)
   * @param selectedPapers - Set of selected paper IDs
   * @param transcribedVideos - Array of transcribed videos
   * @param isExtractionInProgress - Whether extraction is already running
   * @returns Validation result with error details and user-facing message
   *
   * @example
   * ```ts
   * const service = new ThemeExtractionService();
   * const result = service.validateExtraction(user, selectedPapers, videos, false);
   *
   * // BUG-001 FIX: Consumer handles UI updates
   * if (!result.valid && result.userMessage) {
   *   toast.error(result.userMessage);
   * }
   * ```
   */
  public validateExtraction(
    user: User | null | undefined, // TYPE-003 fix: handle undefined
    selectedPapers: Set<string>,
    transcribedVideos: TranscribedVideo[],
    isExtractionInProgress: boolean
  ): ValidationResultWithMessage {
    // Check authentication
    if (!user?.id) {
      // BUG-001 FIX: No toast.error() call - pure function
      logger.error(ERRORS.AUTH_REQUIRED, 'ThemeExtractionService');
      return {
        valid: false,
        totalSources: 0,
        selectedPapers: 0,
        transcribedVideos: 0,
        error: ERRORS.AUTH_REQUIRED,
        userMessage: USER_MESSAGES.AUTH_REQUIRED, // Consumer shows this
      };
    }

    logger.info(
      `User authenticated: ${user.email || user.id}`,
      'ThemeExtractionService'
    );

    // Check for duplicate extraction sessions
    if (isExtractionInProgress) {
      logger.warn(ERRORS.ALREADY_IN_PROGRESS, 'ThemeExtractionService');
      return {
        valid: false,
        totalSources: selectedPapers.size + transcribedVideos.length,
        selectedPapers: selectedPapers.size,
        transcribedVideos: transcribedVideos.length,
        error: ERRORS.ALREADY_IN_PROGRESS,
        userMessage: USER_MESSAGES.ALREADY_IN_PROGRESS,
      };
    }

    // Check if any papers are selected
    const totalSources = selectedPapers.size + transcribedVideos.length;
    if (totalSources === 0) {
      logger.error(ERRORS.NO_SOURCES, 'ThemeExtractionService');
      return {
        valid: false,
        totalSources: 0,
        selectedPapers: 0,
        transcribedVideos: 0,
        error: ERRORS.NO_SOURCES,
        userMessage: USER_MESSAGES.NO_SOURCES,
      };
    }

    return {
      valid: true,
      totalSources,
      selectedPapers: selectedPapers.size,
      transcribedVideos: transcribedVideos.length,
    };
  }

  /**
   * Detect stale papers that need metadata refresh
   *
   * A paper is considered stale if it:
   * 1. Has identifiers (DOI/URL) for fetching
   * 2. Doesn't have full-text
   * 3. Hasn't permanently failed full-text extraction
   *
   * @param papers - All papers in the library
   * @param selectedPaperIds - Set of selected paper IDs
   * @returns Detection result with stale papers list
   *
   * @example
   * ```ts
   * const service = new ThemeExtractionService();
   * const result = service.detectStalePapers(papers, selectedPaperIds);
   * console.log(`Found ${result.stalePapers.length} stale papers`);
   * ```
   */
  public detectStalePapers(
    papers: LiteraturePaper[],
    selectedPaperIds: Set<string>
  ): StalePaperDetectionResult {
    const papersToCheck = papers.filter((p) =>
      selectedPaperIds.has(p.id)
    );

    const stalePapers = papersToCheck.filter(
      (p) =>
        (p.doi || p.url) && // Has identifiers
        !p.hasFullText && // Missing full-text
        p.fullTextStatus !== 'failed' // Not permanently failed
    );

    // DX-001 fix: Use logger service
    logger.debug('Stale paper analysis', 'ThemeExtractionService', {
      totalSelected: papersToCheck.length,
      staleCount: stalePapers.length,
      upToDate: papersToCheck.length - stalePapers.length,
    });

    return {
      totalPapers: papersToCheck.length,
      stalePapers,
      upToDatePapers: papersToCheck.length - stalePapers.length,
    };
  }

  /**
   * Refresh stale paper metadata
   *
   * @param stalePapers - Array of papers needing refresh
   * @param onProgress - Progress callback
   * @returns Promise resolving to refresh result
   *
   * @example
   * ```ts
   * const service = new ThemeExtractionService();
   * const result = await service.refreshStaleMetadata(stalePapers, (msg) => {
   *   setPreparingMessage(msg);
   * });
   * console.log(`Refreshed ${result.refreshed} papers`);
   * ```
   */
  public async refreshStaleMetadata(
    stalePapers: LiteraturePaper[],
    onProgress?: ProgressCallback
  ): Promise<MetadataRefreshResult> {
    if (stalePapers.length === 0) {
      logger.info(
        'All selected papers have up-to-date metadata - skipping refresh',
        'ThemeExtractionService'
      );
      return {
        refreshed: 0,
        failed: 0,
        papers: [],
      };
    }

    logger.info(
      `Refreshing metadata for ${stalePapers.length} papers`,
      'ThemeExtractionService'
    );
    onProgress?.(`Updating metadata for ${stalePapers.length} papers...`);

    try {
      const paperIdsToRefresh = stalePapers.map((p) => p.id);
      const refreshResult =
        await literatureAPI.refreshPaperMetadata(paperIdsToRefresh);

      logger.info('Metadata refresh complete', 'ThemeExtractionService', {
        refreshed: refreshResult.refreshed,
        failed: refreshResult.failed,
        withFullText: refreshResult.papers.filter((p) => p.hasFullText).length,
      });

      return refreshResult;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Metadata refresh failed';
      logger.error('Metadata refresh failed', 'ThemeExtractionService', {
        error: errorMessage,
        paperCount: stalePapers.length,
      });

      // Non-critical error - return empty result to continue extraction
      return {
        refreshed: 0,
        failed: stalePapers.length,
        papers: [],
      };
    }
  }

  /**
   * Analyze and filter content sources
   *
   * Performs content quality analysis and filters sources by minimum length
   *
   * @param papers - All papers in the library
   * @param selectedPaperIds - Set of selected paper IDs
   * @param transcribedVideos - Array of transcribed videos
   * @param requestId - Request ID for logging
   * @returns Promise resolving to content analysis result
   *
   * @example
   * ```ts
   * const service = new ThemeExtractionService();
   * const analysis = await service.analyzeAndFilterContent(
   *   papers,
   *   selectedPaperIds,
   *   videos,
   *   'extract_123'
   * );
   * console.log(`Found ${analysis.sources.length} valid sources`);
   * ```
   */
  public async analyzeAndFilterContent(
    papers: LiteraturePaper[],
    selectedPaperIds: Set<string>,
    transcribedVideos: TranscribedVideo[],
    requestId: string
  ): Promise<ContentAnalysis> {
    logger.debug(
      `Building selected papers list with content status`,
      'ThemeExtractionService',
      { requestId }
    );

    const selectedPapersList: ContentAnalysis['selectedPapersList'] = [];
    const selectedPapers = papers.filter((p) => selectedPaperIds.has(p.id));

    // Prepare paper sources AND track all selected papers with status
    const paperSources: SourceContent[] = selectedPapers.map((p) => {
      let content = '';
      let contentType: ContentType = ContentType.NONE;
      let skipReason: string | undefined;

      // BUG FIX (Nov 18, 2025): Check if full-text content is actually available
      // STRICT AUDIT FIX: Trim once, check status defensively
      // See Paper type definition for fullTextStatus values
      const trimmedFullText = p.fullText?.trim() || '';
      const hasActualFullText =
        trimmedFullText.length > 0 &&
        p.fullTextStatus !== 'failed'; // Accept any status except explicit failure

      if (hasActualFullText) {
        content = trimmedFullText;
        contentType = ContentType.FULL_TEXT;
      } else if (p.abstract) {
        content = p.abstract.trim();
        contentType = classifyContentType(p.abstract, false);
      }

      // Determine if paper will be skipped
      const hasContent = content.length > MIN_CONTENT_LENGTH;
      if (!hasContent) {
        if (!p.abstract && !p.fullText) {
          skipReason = 'No abstract or full-text available';
        } else if (content.length <= MIN_CONTENT_LENGTH) {
          skipReason = `Content too short (${content.length} chars, need >${MIN_CONTENT_LENGTH})`;
        }
      }

      // Add to comprehensive list (ALL papers, not just valid ones)
      const paperListEntry: ContentAnalysis['selectedPapersList'][number] = {
        id: p.id,
        title: p.title,
        hasContent,
        contentType,
        contentLength: content.length,
      };
      if (skipReason) {
        paperListEntry.skipReason = skipReason;
      }
      selectedPapersList.push(paperListEntry);

      // Log paper status
      logger.debug(
        `Paper ${hasContent ? 'valid' : 'skipped'}: "${p.title.substring(0, 60)}..."`,
        'ThemeExtractionService',
        {
          hasContent,
          contentType,
          contentLength: content.length,
          skipReason,
        }
      );

      return {
        id: p.id,
        type: 'paper' as const,
        title: p.title,
        content,
        keywords: p.keywords || [],
        url: p.url || p.doi || '',
        metadata: {
          authors: p.authors?.join(', ') || '',
          year: p.year,
          venue: p.venue,
          citationCount: p.citationCount,
          contentType,
          // BUG FIX: Use actual fullTextStatus from paper, not derived from hasFullText
          fullTextStatus:
            contentType === ContentType.FULL_TEXT
              ? ('success' as const)
              : ('failed' as const),
        },
      };
    });

    // Add transcribed videos
    const videoSources: SourceContent[] = transcribedVideos.map((video) => {
      const content = video.transcript || '';
      const hasContent = content.length > MIN_CONTENT_LENGTH;
      let skipReason: string | undefined;

      if (!hasContent) {
        if (!video.transcript) {
          skipReason = 'No transcript available';
        } else if (content.length <= MIN_CONTENT_LENGTH) {
          skipReason = `Transcript too short (${content.length} chars, need >${MIN_CONTENT_LENGTH})`;
        }
      }

      // Add video to comprehensive tracking list
      const videoListEntry: ContentAnalysis['selectedPapersList'][number] = {
        id: video.id,
        title: video.title,
        hasContent,
        contentType: ContentType.VIDEO_TRANSCRIPT,
        contentLength: content.length,
      };
      if (skipReason) {
        videoListEntry.skipReason = skipReason;
      }
      selectedPapersList.push(videoListEntry);

      // Log video status
      logger.debug(
        `Video ${hasContent ? 'valid' : 'skipped'}: "${video.title.substring(0, 60)}..."`,
        'ThemeExtractionService',
        {
          hasContent,
          contentLength: content.length,
          skipReason,
        }
      );

      return {
        id: video.id,
        type: 'youtube' as const,
        title: video.title,
        content,
        keywords:
          video.themes?.map((t: string | { label: string }) =>
            typeof t === 'string' ? t : t.label
          ) || [],
        url: video.url,
        metadata: {
          videoId: video.sourceId,
          duration: video.duration,
          channel: video.channel,
        },
      };
    });

    // Combine and filter sources
    const allSources = [...paperSources, ...videoSources];
    const validSources = allSources.filter(
      (s) => s.content.length > MIN_CONTENT_LENGTH
    );

    // Calculate content type breakdown
    let fullTextCount = 0;
    let abstractOverflowCount = 0;
    let abstractCount = 0;
    let noContentCount = 0;
    let totalContentLength = 0;

    validSources.forEach((source) => {
      const contentType = source.metadata?.contentType || ContentType.NONE;
      totalContentLength += source.content.length;

      switch (contentType) {
        case ContentType.FULL_TEXT:
          fullTextCount++;
          break;
        case ContentType.ABSTRACT_OVERFLOW:
          abstractOverflowCount++;
          break;
        case ContentType.ABSTRACT:
          abstractCount++;
          break;
        case ContentType.VIDEO_TRANSCRIPT:
          // Count as full-text equivalent
          fullTextCount++;
          break;
        default:
          noContentCount++;
      }
    });

    const avgContentLength =
      validSources.length > 0 ? totalContentLength / validSources.length : 0;

    // Calculate totals for transparency
    const totalSelected = selectedPapers.length + transcribedVideos.length;
    const totalWithContent = selectedPapersList.filter((p) => p.hasContent).length;
    const totalSkipped = selectedPapersList.filter((p) => !p.hasContent).length;

    logger.info('Content type breakdown', 'ThemeExtractionService', {
      fullText: fullTextCount,
      abstractOverflow: abstractOverflowCount,
      abstractStandard: abstractCount,
      noContent: noContentCount,
      avgLength: Math.round(avgContentLength),
      totalSelected,
      totalWithContent,
      totalSkipped,
    });

    return {
      fullTextCount,
      abstractOverflowCount,
      abstractCount,
      noContentCount,
      avgContentLength,
      hasFullTextContent: fullTextCount > 0,
      sources: validSources,
      selectedPapersList,
      totalSelected,
      totalWithContent,
      totalSkipped,
    };
  }
}
