/**
 * Theme Extraction Service - Phase 10.93 Day 1
 *
 * Extracted from useThemeExtractionWorkflow.ts (lines 270-996)
 * Enterprise-grade service for theme extraction preparation workflow
 *
 * @module theme-extraction/ThemeExtractionService
 * @since Phase 10.93
 *
 * **Features:**
 * - Paper selection validation with context
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
 */

import { toast } from 'sonner';
import { literatureAPI } from '@/lib/services/literature-api.service';
import type { Paper as LiteraturePaper } from '@/lib/types/literature.types';
import type { SourceContent } from '@/lib/api/services/unified-theme-api.service';
import {
  ContentType,
  classifyContentType,
} from '@/lib/types/content-types';
import type {
  ValidationResult,
  StalePaperDetectionResult,
  MetadataRefreshResult,
  ProgressCallback,
} from './types';

/**
 * Minimum content length for analysis (characters)
 */
const MIN_CONTENT_LENGTH = 50;

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
 * Content analysis result
 */
export interface ContentAnalysis {
  fullTextCount: number;
  abstractOverflowCount: number;
  abstractCount: number;
  noContentCount: number;
  avgContentLength: number;
  hasFullTextContent: boolean;
  sources: SourceContent[];
  selectedPapersList: Array<{
    id: string;
    title: string;
    hasContent: boolean;
    contentType: ContentType;
    contentLength: number;
    skipReason?: string;
  }>;
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
   * @param user - Current user (must be authenticated)
   * @param selectedPapers - Set of selected paper IDs
   * @param transcribedVideos - Array of transcribed videos
   * @param isExtractionInProgress - Whether extraction is already running
   * @returns Validation result with context
   *
   * @throws {ValidationError} If validation fails
   *
   * @example
   * ```ts
   * const service = new ThemeExtractionService();
   * const result = service.validateExtraction(user, selectedPapers, videos, false);
   * if (!result.valid) {
   *   throw new ValidationError(result.error!);
   * }
   * ```
   */
  public validateExtraction(
    user: User | null,
    selectedPapers: Set<string>,
    transcribedVideos: TranscribedVideo[],
    isExtractionInProgress: boolean
  ): ValidationResult {
    // Check authentication
    if (!user || !user.id) {
      const error = 'Authentication required for theme extraction';
      console.error(`❌ ${error}`);
      toast.error(
        'Please log in to extract themes. Theme extraction requires full-text access, which needs paper saving to your library.',
        {
          duration: 10000,
          style: {
            background: '#FEE2E2',
            border: '2px solid #EF4444',
            color: '#991B1B',
          },
        }
      );
      return {
        valid: false,
        totalSources: 0,
        selectedPapers: 0,
        transcribedVideos: 0,
        error,
      };
    }

    console.log(`✅ User authenticated: ${user.email || user.id}`);

    // Check for duplicate extraction sessions
    if (isExtractionInProgress) {
      const error = 'Extraction already in progress';
      console.warn(`⚠️ ${error} - ignoring duplicate click`);
      return {
        valid: false,
        totalSources: selectedPapers.size + transcribedVideos.length,
        selectedPapers: selectedPapers.size,
        transcribedVideos: transcribedVideos.length,
        error,
      };
    }

    // Check if any papers are selected
    const totalSources = selectedPapers.size + transcribedVideos.length;
    if (totalSources === 0) {
      const error = 'No sources selected';
      console.error(`❌ ${error} - aborting`);
      toast.error('Please select at least one paper or video for theme extraction');
      return {
        valid: false,
        totalSources: 0,
        selectedPapers: 0,
        transcribedVideos: 0,
        error,
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

    console.log(`   📊 Stale paper analysis:`);
    console.log(`      • Total selected papers: ${papersToCheck.length}`);
    console.log(`      • Papers with stale metadata: ${stalePapers.length}`);
    console.log(
      `      • Papers with up-to-date metadata: ${papersToCheck.length - stalePapers.length}`
    );

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
   * @throws {MetadataRefreshError} If refresh fails critically
   *
   * @example
   * ```ts
   * const service = new ThemeExtractionService();
   * const result = await service.refreshStaleMetadata(stalePapers, (msg) => {
   *   console.log(msg);
   * });
   * console.log(`Refreshed ${result.refreshed} papers`);
   * ```
   */
  public async refreshStaleMetadata(
    stalePapers: LiteraturePaper[],
    onProgress?: ProgressCallback
  ): Promise<MetadataRefreshResult> {
    if (stalePapers.length === 0) {
      console.log(
        `   ✅ All selected papers have up-to-date metadata - skipping refresh`
      );
      return {
        refreshed: 0,
        failed: 0,
        papers: [],
      };
    }

    console.log(
      `\n   🔄 Refreshing metadata for ${stalePapers.length} papers...`
    );
    onProgress?.(`Updating metadata for ${stalePapers.length} papers...`);

    try {
      const paperIdsToRefresh = stalePapers.map((p) => p.id);
      const refreshResult =
        await literatureAPI.refreshPaperMetadata(paperIdsToRefresh);

      console.log(`   ✅ Metadata refresh complete:`);
      console.log(
        `      • Successfully refreshed: ${refreshResult.refreshed}`
      );
      console.log(`      • Failed: ${refreshResult.failed}`);
      console.log(
        `      • Papers with full-text: ${refreshResult.papers.filter((p) => p.hasFullText).length}`
      );

      return refreshResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Metadata refresh failed';
      console.error(`   ❌ Metadata refresh failed:`, errorMessage);

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
    console.log(
      `\n📋 [${requestId}] Building selected papers list with content status...`
    );

    const selectedPapersList: ContentAnalysis['selectedPapersList'] = [];
    const selectedPapers = papers.filter((p) => selectedPaperIds.has(p.id));

    // Prepare paper sources AND track all selected papers with status
    const paperSources: SourceContent[] = selectedPapers.map((p) => {
      let content = '';
      let contentType: ContentType = ContentType.NONE;
      let skipReason: string | undefined;

      if (p.hasFullText && p.fullText) {
        content = p.fullText.trim();
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
      const statusIcon = hasContent ? '✅' : '❌';
      const statusText = hasContent ? 'WILL BE USED' : 'WILL BE SKIPPED';
      console.log(
        `   ${statusIcon} "${p.title.substring(0, 60)}..." - ${statusText}` +
          (skipReason
            ? ` (${skipReason})`
            : ` (${contentType}, ${content.length} chars)`)
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
          fullTextStatus: p.hasFullText
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
      const statusIcon = hasContent ? '✅' : '❌';
      const statusText = hasContent ? 'WILL BE USED' : 'WILL BE SKIPPED';
      console.log(
        `   ${statusIcon} "${video.title.substring(0, 60)}..." (VIDEO) - ${statusText}` +
          (skipReason
            ? ` (${skipReason})`
            : ` (VIDEO_TRANSCRIPT, ${content.length} chars)`)
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

    console.log(`\n📊 Content type breakdown:`);
    console.log(`   • Full-text: ${fullTextCount}`);
    console.log(`   • Abstract (overflow): ${abstractOverflowCount}`);
    console.log(`   • Abstract (standard): ${abstractCount}`);
    console.log(`   • No content: ${noContentCount}`);
    console.log(
      `   • Average content length: ${Math.round(avgContentLength)} chars`
    );

    return {
      fullTextCount,
      abstractOverflowCount,
      abstractCount,
      noContentCount,
      avgContentLength,
      hasFullTextContent: fullTextCount > 0,
      sources: validSources,
      selectedPapersList,
    };
  }
}
