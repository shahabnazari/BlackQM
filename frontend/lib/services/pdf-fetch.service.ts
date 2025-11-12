/**
 * Phase 10 Day 5.17.3: Bulk PDF Fetching Service
 *
 * Enterprise-grade service for automatic PDF fetching during theme extraction preparation.
 * Integrates with backend PDF parsing infrastructure.
 */

export interface BulkPDFFetchRequest {
  paperIds: string[];
  purpose: string;
  timeout?: number; // Max wait time in ms (default: 60000ms = 1 min)
}

export interface BulkPDFFetchResponse {
  success: boolean;
  total: number;
  queued: number;
  alreadyFetched: number;
  noDoi: number;
  jobIds: string[];
  message: string;
}

export interface PDFFetchProgress {
  paperId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  wordCount?: number;
  error?: string;
}

class PDFFetchService {
  private readonly API_BASE =
    process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';

  /**
   * Trigger bulk PDF fetch for multiple papers
   * Only fetches papers with DOI that don't have full-text yet
   */
  async triggerBulkFetch(paperIds: string[]): Promise<{
    success: boolean;
    jobIds: string[];
    total: number;
    queued: number;
    alreadyFetched: number;
    noDoi: number;
  }> {
    try {
      const results = await Promise.allSettled(
        paperIds.map(paperId =>
          fetch(`${this.API_BASE}/pdf/fetch/${paperId}`, {
            method: 'POST',
            credentials: 'include',
          }).then(res => res.json())
        )
      );

      const jobIds: string[] = [];
      let queued = 0;
      let failed = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          jobIds.push(result.value.jobId);
          queued++;
        } else {
          failed++;
          console.warn(
            `PDF fetch failed for paper ${paperIds[index]}:`,
            result
          );
        }
      });

      return {
        success: queued > 0,
        jobIds,
        total: paperIds.length,
        queued,
        alreadyFetched: 0, // Will be determined by backend
        noDoi: failed,
      };
    } catch (error) {
      console.error('Bulk PDF fetch error:', error);
      return {
        success: false,
        jobIds: [],
        total: paperIds.length,
        queued: 0,
        alreadyFetched: 0,
        noDoi: paperIds.length,
      };
    }
  }

  /**
   * Check bulk status for multiple papers
   */
  async checkBulkStatus(paperIds: string[]): Promise<{
    ready: string[];
    fetching: string[];
    failed: string[];
    not_fetched: string[];
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/pdf/bulk-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ paperIds }),
      });

      if (response.ok) {
        return await response.json();
      }

      return {
        ready: [],
        fetching: [],
        failed: [],
        not_fetched: paperIds,
      };
    } catch (error) {
      console.error('Bulk status check error:', error);
      return {
        ready: [],
        fetching: [],
        failed: [],
        not_fetched: paperIds,
      };
    }
  }

  /**
   * Wait for PDF fetches to complete (with timeout)
   * Polls bulk status endpoint every 2 seconds
   */
  async waitForCompletion(
    paperIds: string[],
    options: {
      timeout?: number; // Max wait time in ms (default: 120000 = 2 min)
      onProgress?: (progress: {
        ready: number;
        fetching: number;
        failed: number;
        total: number;
      }) => void;
    } = {}
  ): Promise<{
    completed: string[];
    failed: string[];
    timeout: boolean;
  }> {
    const timeout = options.timeout || 120000; // 2 minutes default
    const pollInterval = 2000; // 2 seconds
    const startTime = Date.now();

    const completed: string[] = [];
    const failed: string[] = [];
    let remaining = [...paperIds];

    while (remaining.length > 0 && Date.now() - startTime < timeout) {
      const status = await this.checkBulkStatus(remaining);

      // Add completed papers
      completed.push(...status.ready);

      // Add failed papers
      failed.push(...status.failed);

      // Update remaining
      remaining = status.fetching;

      // Call progress callback
      if (options.onProgress) {
        options.onProgress({
          ready: completed.length,
          fetching: remaining.length,
          failed: failed.length,
          total: paperIds.length,
        });
      }

      // Exit if all done
      if (remaining.length === 0) {
        break;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      completed,
      failed,
      timeout: remaining.length > 0,
    };
  }

  /**
   * Get full-text content for a paper
   */
  async getFullText(paperId: string): Promise<{
    fullText: string | null;
    wordCount: number | null;
  }> {
    try {
      const response = await fetch(
        `${this.API_BASE}/pdf/full-text/${paperId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        return await response.json();
      }

      return {
        fullText: null,
        wordCount: null,
      };
    } catch (error) {
      console.error(`Get full-text error for paper ${paperId}:`, error);
      return {
        fullText: null,
        wordCount: null,
      };
    }
  }
}

export const pdfFetchService = new PDFFetchService();
