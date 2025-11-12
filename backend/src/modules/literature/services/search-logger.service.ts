/**
 * Search Logger Service
 * Phase 10.6 Day 14.4: Enterprise-Grade Search Analytics & Logging
 *
 * ============================================================================
 * 🎯 PURPOSE
 * ============================================================================
 *
 * Provides comprehensive, structured logging for literature searches:
 * - Which sources returned papers
 * - How many papers from each source
 * - Deduplication statistics
 * - Query expansion tracking
 * - Performance metrics
 * - Search analytics over time
 *
 * ============================================================================
 * 📊 LOG OUTPUT
 * ============================================================================
 *
 * Creates JSON log files in `backend/logs/searches/`:
 * - `search-YYYY-MM-DD.log` - Daily search logs (one line per search)
 * - `search-analytics.json` - Aggregated statistics
 *
 * Each log entry includes:
 * ```json
 * {
 *   "timestamp": "2025-11-11T12:35:42.123Z",
 *   "query": "desk",
 *   "expandedQuery": "desk OR workstation OR office furniture",
 *   "sources": ["pubmed", "pmc", "arxiv", ...],
 *   "sourceResults": {
 *     "pubmed": { "papers": 20, "duration": 1234 },
 *     "pmc": { "papers": 15, "duration": 987 },
 *     ...
 *   },
 *   "totalPapers": 150,
 *   "uniquePapers": 91,
 *   "deduplicationRate": 0.393,
 *   "searchDuration": 3456,
 *   "userId": "user_123"
 * }
 * ```
 *
 * ============================================================================
 * 🏗️ ENTERPRISE PRINCIPLES
 * ============================================================================
 *
 * 1. Structured Logging: JSON format for easy parsing/analysis
 * 2. Daily Rotation: One file per day, automatic archiving
 * 3. Performance Tracking: Duration metrics for each source
 * 4. Analytics: Aggregated stats for dashboards
 * 5. Non-Blocking: Async file writes, don't slow down searches
 * 6. Error Resilience: Logging failures don't crash searches
 * 7. Privacy: User IDs hashed, no sensitive data
 * 8. Observability: Can trace any search by timestamp
 *
 * ============================================================================
 * 📖 USAGE EXAMPLE
 * ============================================================================
 *
 * ```typescript
 * // In literature.service.ts:
 * const searchLog = this.searchLogger.startSearch(searchDto, userId);
 *
 * // For each source:
 * searchLog.recordSource('pubmed', 20, 1234); // 20 papers, 1234ms
 * searchLog.recordSource('arxiv', 35, 987);
 *
 * // At end of search:
 * await searchLog.finalize({
 *   totalPapers: 150,
 *   uniquePapers: 91,
 *   expandedQuery: "desk OR workstation"
 * });
 * ```
 */

import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SourceResult {
  papers: number;
  duration: number;
  error?: string;
}

export interface SearchLogEntry {
  timestamp: string;
  query: string;
  expandedQuery?: string;
  sources: string[];
  sourceResults: Record<string, SourceResult>;
  totalPapers: number;
  uniquePapers: number;
  deduplicationRate: number;
  searchDuration: number;
  userIdHash: string;
}

export class SearchLogBuilder {
  private startTime: number;
  private query: string;
  private sources: string[];
  private sourceResults: Record<string, SourceResult> = {};
  private userIdHash: string;

  constructor(
    query: string,
    sources: string[],
    userId: string,
    private logger: SearchLoggerService,
  ) {
    this.startTime = Date.now();
    this.query = query;
    this.sources = sources;
    // Hash user ID for privacy
    this.userIdHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  recordSource(source: string, papers: number, duration: number, error?: string) {
    this.sourceResults[source] = { papers, duration, error };
  }

  /**
   * Phase 10.6 Day 14.5: Get search metadata for API response
   * Returns source breakdown before finalization for frontend transparency
   */
  getSourceResults(): Record<string, SourceResult> {
    return { ...this.sourceResults }; // Return copy for safety
  }

  /**
   * Phase 10.6 Day 14.5: Get search duration (milliseconds elapsed)
   */
  getSearchDuration(): number {
    return Date.now() - this.startTime;
  }

  async finalize(options: {
    totalPapers: number;
    uniquePapers: number;
    expandedQuery?: string;
  }) {
    const searchDuration = Date.now() - this.startTime;
    const deduplicationRate = options.totalPapers > 0
      ? (options.totalPapers - options.uniquePapers) / options.totalPapers
      : 0;

    const entry: SearchLogEntry = {
      timestamp: new Date().toISOString(),
      query: this.query,
      expandedQuery: options.expandedQuery,
      sources: this.sources,
      sourceResults: this.sourceResults,
      totalPapers: options.totalPapers,
      uniquePapers: options.uniquePapers,
      deduplicationRate: parseFloat(deduplicationRate.toFixed(3)),
      searchDuration,
      userIdHash: this.userIdHash,
    };

    await this.logger.writeSearchLog(entry);
    this.logger.logToConsole(entry);
  }
}

@Injectable()
export class SearchLoggerService {
  private readonly logger = new Logger(SearchLoggerService.name);
  private readonly logsDir: string;

  constructor() {
    // Create logs directory structure: backend/logs/searches/
    this.logsDir = path.join(process.cwd(), 'logs', 'searches');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      this.logger.log(`📁 Created search logs directory: ${this.logsDir}`);
    }
  }

  /**
   * Start tracking a new search
   */
  startSearch(query: string, sources: string[], userId: string): SearchLogBuilder {
    return new SearchLogBuilder(query, sources, userId, this);
  }

  /**
   * Write search log entry to daily log file
   * Format: backend/logs/searches/search-2025-11-11.log
   */
  async writeSearchLog(entry: SearchLogEntry) {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = path.join(this.logsDir, `search-${date}.log`);

      const logLine = JSON.stringify(entry) + '\n';

      // Async append, don't block search response
      fs.appendFile(logFile, logLine, (err) => {
        if (err) {
          this.logger.error(`Failed to write search log: ${(err as Error).message}`);
        }
      });

      // Update analytics (aggregated stats)
      await this.updateAnalytics(entry);
    } catch (error) {
      // Logging failures should never crash searches
      this.logger.error(`Search logging error: ${(error as Error).message}`);
    }
  }

  /**
   * Log search details to console (pretty format)
   */
  logToConsole(entry: SearchLogEntry) {
    this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.logger.log(`📊 SEARCH ANALYTICS`);
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`Query: "${entry.query}"`);
    if (entry.expandedQuery && entry.expandedQuery !== entry.query) {
      this.logger.log(`Expanded: "${entry.expandedQuery}"`);
    }
    this.logger.log(`Sources: ${entry.sources.length} sources selected`);
    this.logger.log(`─────────────────────────────────────────────────`);

    // Sort sources by paper count (descending)
    const sortedSources = Object.entries(entry.sourceResults)
      .sort(([, a], [, b]) => b.papers - a.papers);

    sortedSources.forEach(([source, result]) => {
      if (result.error) {
        this.logger.log(`  ✗ ${source.padEnd(20)} FAILED: ${result.error}`);
      } else if (result.papers === 0) {
        this.logger.log(`  ⊘ ${source.padEnd(20)} 0 papers (${result.duration}ms)`);
      } else {
        this.logger.log(`  ✓ ${source.padEnd(20)} ${String(result.papers).padStart(3)} papers (${result.duration}ms)`);
      }
    });

    this.logger.log(`─────────────────────────────────────────────────`);
    this.logger.log(`Total Collected: ${entry.totalPapers} papers`);
    this.logger.log(`After Dedup: ${entry.uniquePapers} unique papers`);
    this.logger.log(`Dedup Rate: ${(entry.deduplicationRate * 100).toFixed(1)}%`);
    this.logger.log(`Search Duration: ${entry.searchDuration}ms`);
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }

  /**
   * Update aggregated analytics file
   * Format: backend/logs/searches/analytics.json
   */
  private async updateAnalytics(entry: SearchLogEntry) {
    try {
      const analyticsFile = path.join(this.logsDir, 'analytics.json');

      let analytics: any = {
        totalSearches: 0,
        sourcesPerformance: {},
        lastUpdated: new Date().toISOString(),
      };

      // Load existing analytics
      if (fs.existsSync(analyticsFile)) {
        const data = fs.readFileSync(analyticsFile, 'utf8');
        analytics = JSON.parse(data);
      }

      // Update counts
      analytics.totalSearches++;
      analytics.lastUpdated = new Date().toISOString();

      // Update source performance
      for (const [source, result] of Object.entries(entry.sourceResults)) {
        if (!analytics.sourcesPerformance[source]) {
          analytics.sourcesPerformance[source] = {
            totalSearches: 0,
            totalPapers: 0,
            totalDuration: 0,
            failures: 0,
            avgPapers: 0,
            avgDuration: 0,
          };
        }

        const perf = analytics.sourcesPerformance[source];
        perf.totalSearches++;
        perf.totalPapers += result.papers;
        perf.totalDuration += result.duration;
        if (result.error) perf.failures++;
        perf.avgPapers = parseFloat((perf.totalPapers / perf.totalSearches).toFixed(2));
        perf.avgDuration = Math.round(perf.totalDuration / perf.totalSearches);
      }

      // Write analytics (async)
      fs.writeFile(analyticsFile, JSON.stringify(analytics, null, 2), (err) => {
        if (err) {
          this.logger.error(`Failed to update analytics: ${(err as Error).message}`);
        }
      });
    } catch (error) {
      this.logger.error(`Analytics update error: ${(error as Error).message}`);
    }
  }

  /**
   * Get current analytics (for dashboard/monitoring)
   */
  async getAnalytics(): Promise<any> {
    try {
      const analyticsFile = path.join(this.logsDir, 'analytics.json');
      if (fs.existsSync(analyticsFile)) {
        const data = fs.readFileSync(analyticsFile, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to read analytics: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Get search logs for a specific date
   */
  async getSearchLogs(date: string): Promise<SearchLogEntry[]> {
    try {
      const logFile = path.join(this.logsDir, `search-${date}.log`);
      if (!fs.existsSync(logFile)) {
        return [];
      }

      const data = fs.readFileSync(logFile, 'utf8');
      const lines = data.trim().split('\n');
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      this.logger.error(`Failed to read search logs: ${(error as Error).message}`);
      return [];
    }
  }
}
