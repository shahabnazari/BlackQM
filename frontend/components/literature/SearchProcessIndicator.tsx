/**
 * Search Process Transparency Indicator
 * Phase 10.6 Day 14.5+: ENTERPRISE-GRADE TRANSPARENCY
 *
 * Shows users exactly how papers were selected from all sources:
 * - Which sources were queried (e.g., PubMed, ArXiv, etc.)
 * - Papers fetched from each source (INITIAL counts from backend)
 * - Complete processing pipeline (Collection → Dedup → Quality → Final)
 * - Transparent quality methodology (40% Citation, 35% Journal, 25% Content)
 *
 * KEY FIX: Now uses REAL metadata from backend instead of calculating
 * from frontend papers array (which only shows paginated results).
 *
 * Enterprise Principles:
 * - Full transparency (all steps visible)
 * - Real-time accurate data (from backend metadata)
 * - Educational value (teaches users about research quality)
 * - Builds trust in results
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  Filter,
  Loader2,
  Search,
  Shield,
  TrendingUp,
  FileText,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import type { SearchMetadata } from '@/lib/stores/literature-search.store';

// ============================================================================
// Component Props
// ============================================================================

export interface SearchProcessIndicatorProps {
  /** Current search query */
  query?: string;
  /** Search metadata from backend (REQUIRED for accurate display) */
  metadata: SearchMetadata | null;
  /** Overall search status */
  searchStatus: 'idle' | 'searching' | 'completed' | 'error';
  /** Whether the panel is visible */
  isVisible?: boolean;
}

// ============================================================================
// Helper: Format source name (backend enum → display name)
// ============================================================================

function formatSourceName(sourceId: string): string {
  const sourceNames: Record<string, string> = {
    semantic_scholar: 'Semantic Scholar',
    pubmed: 'PubMed',
    pmc: 'PubMed Central',
    arxiv: 'ArXiv',
    biorxiv: 'bioRxiv',
    medrxiv: 'medRxiv',
    chemrxiv: 'ChemRxiv',
    crossref: 'CrossRef',
    eric: 'ERIC',
    ssrn: 'SSRN',
    google_scholar: 'Google Scholar',
    web_of_science: 'Web of Science',
    scopus: 'Scopus',
    ieee_xplore: 'IEEE Xplore',
    springer: 'SpringerLink',
    nature: 'Nature',
    wiley: 'Wiley',
    sage: 'SAGE',
    taylor_francis: 'Taylor & Francis',
  };
  return sourceNames[sourceId] || sourceId;
}

// ============================================================================
// Helper: Export transparency data as CSV for auditing
// Phase 10.6 Day 14.5: Audit-ready export functionality
// ============================================================================

function exportTransparencyCSV(metadata: SearchMetadata, query: string): void {
  // Build CSV content
  const csv: string[][] = [
    ['VQMethod Research - Search Transparency Audit Report'],
    ['Generated:', new Date().toISOString()],
    ['Query:', query || '(no query)'],
    [''],
    ['SECTION 1: SOURCE BREAKDOWN'],
    ['Source', 'Papers Collected', 'Duration (ms)', 'Status', 'Error/Note'],
  ];

  // Add source data
  Object.entries(metadata.sourceBreakdown).forEach(([sourceId, data]) => {
    const sourceName = formatSourceName(sourceId);
    const status = data.papers > 0 ? 'Success' : data.error ? 'Error' : 'No Results';
    const errorNote = data.error || (data.papers === 0 ? 'No papers matched search criteria' : '-');

    csv.push([
      sourceName,
      data.papers.toString(),
      Math.round(data.duration).toString(),
      status,
      errorNote,
    ]);
  });

  // Processing pipeline section
  csv.push([''], ['SECTION 2: PROCESSING PIPELINE']);
  csv.push(['Stage', 'Papers', 'Description']);
  csv.push([
    '1. Initial Collection',
    metadata.totalCollected.toString(),
    'Papers collected from all sources before processing',
  ]);
  csv.push([
    '2. Deduplication',
    metadata.uniqueAfterDedup.toString(),
    `Removed ${metadata.duplicatesRemoved} duplicates (${metadata.deduplicationRate}% duplicate rate)`,
  ]);
  csv.push([
    '3. Quality Filtering',
    metadata.afterQualityFilter.toString(),
    `Filtered ${metadata.qualityFiltered} papers by relevance and quality criteria`,
  ]);
  csv.push([
    '4. Final Selection',
    metadata.totalQualified.toString(),
    `High-quality papers selected (${metadata.displayed} displayed on current page)`,
  ]);

  // Summary section
  csv.push([''], ['SECTION 3: SUMMARY STATISTICS']);
  csv.push(['Metric', 'Value']);
  csv.push(['Total Sources Queried', Object.keys(metadata.sourceBreakdown).length.toString()]);
  csv.push([
    'Sources With Results',
    Object.values(metadata.sourceBreakdown).filter(s => s.papers > 0).length.toString(),
  ]);
  csv.push(['Papers Collected', metadata.totalCollected.toString()]);
  csv.push(['Unique Papers', metadata.uniqueAfterDedup.toString()]);
  csv.push(['Duplicates Removed', metadata.duplicatesRemoved.toString()]);
  csv.push(['Deduplication Rate', `${metadata.deduplicationRate}%`]);
  csv.push(['After Quality Filter', metadata.afterQualityFilter.toString()]);
  csv.push(['Final Qualified Papers', metadata.totalQualified.toString()]);
  csv.push(['Papers Displayed', metadata.displayed.toString()]);
  csv.push(['Search Duration', `${Math.round(metadata.searchDuration)}ms`]);

  if (metadata.queryExpansion) {
    csv.push([''], ['SECTION 4: QUERY EXPANSION']);
    csv.push(['Original Query', metadata.queryExpansion.original]);
    csv.push(['Expanded Query', metadata.queryExpansion.expanded]);
  }

  // Convert to CSV string (escape commas in values)
  const csvContent = csv
    .map(row =>
      row
        .map(cell => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const escaped = cell.replace(/"/g, '""');
          return cell.includes(',') || cell.includes('"') || cell.includes('\n')
            ? `"${escaped}"`
            : escaped;
        })
        .join(',')
    )
    .join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vqmethod-search-transparency-${Date.now()}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Main Component
// ============================================================================

export function SearchProcessIndicator({
  query,
  metadata,
  searchStatus = 'idle',
  isVisible = true,
}: SearchProcessIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Phase 10.6 Day 14.5: Show source breakdown by default for transparency

  // DEBUG: Log props to trace why component isn't showing
  console.log('[SearchProcessIndicator] Received props:', {
    query,
    hasMetadata: metadata !== null,
    metadataKeys: metadata ? Object.keys(metadata) : null,
    searchStatus,
    isVisible,
    willRender: isVisible && searchStatus !== 'idle' && metadata !== null,
  });

  if (!isVisible || searchStatus === 'idle' || !metadata) {
    console.log('[SearchProcessIndicator] NOT RENDERING:', {
      isVisible,
      searchStatus,
      hasMetadata: metadata !== null,
    });
    return null;
  }

  // ============================================================================
  // Data Extraction from Metadata
  // ============================================================================

  const {
    totalCollected,
    sourceBreakdown,
    uniqueAfterDedup,
    deduplicationRate,
    duplicatesRemoved,
    // afterEnrichment, // Future: Can be displayed in advanced mode
    afterQualityFilter,
    qualityFiltered,
    totalQualified,
    displayed,
    searchDuration,
    queryExpansion,
  } = metadata;

  // Count sources
  const sourcesQueried = Object.keys(sourceBreakdown).length;
  const sourcesWithResults = Object.values(sourceBreakdown).filter(
    s => s.papers > 0
  ).length;

  // Sort sources by paper count (descending)
  const sortedSources = Object.entries(sourceBreakdown)
    .sort(([, a], [, b]) => b.papers - a.papers)
    .map(([sourceId, data]) => ({
      sourceId,
      sourceName: formatSourceName(sourceId),
      ...data,
    }));

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mb-6"
    >
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                {searchStatus === 'searching' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : searchStatus === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  Search Process Transparency
                  <Badge variant="outline" className="bg-white/50">
                    Enterprise-Grade
                  </Badge>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {query && `Query: "${query}" • `}
                  Comprehensive search across {sourcesQueried} academic sources
                </p>
                {queryExpansion && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Query expanded: "{queryExpansion.original}" → "
                    {queryExpansion.expanded}"
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Phase 10.6 Day 14.5: CSV Export for Auditing */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportTransparencyCSV(metadata, query || '')}
                className="gap-2 bg-white/80 hover:bg-white"
              >
                <Download className="w-4 h-4" />
                Download Audit Report
              </Button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Processing Pipeline - Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Sources
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {sourcesWithResults}/{sourcesQueried}
              </div>
              <div className="text-xs text-gray-500">returned results</div>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Collected
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalCollected}
              </div>
              <div className="text-xs text-gray-500">from all sources</div>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Filter className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Unique
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {uniqueAfterDedup}
              </div>
              <div className="text-xs text-gray-500">
                {deduplicationRate}% duplicates removed
              </div>
            </div>

            <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Selected
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalQualified}
              </div>
              <div className="text-xs text-gray-500">by quality score</div>
            </div>
          </div>

          {/* Phase 10.6 Day 14.5: Top Contributing Sources */}
          {sortedSources.length > 0 && (
            <div className="mb-4 bg-white/40 dark:bg-gray-900/40 rounded-lg p-3 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Top Contributing Sources
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedSources.slice(0, 3).map((source, index) => (
                  <div
                    key={source.sourceId}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded px-2 py-1 border border-indigo-200 dark:border-indigo-700"
                  >
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {source.sourceName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {source.papers}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Check Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="success" className="gap-1">
              <Check className="w-3 h-3" />
              40% Citation Impact
            </Badge>
            <Badge variant="success" className="gap-1">
              <Check className="w-3 h-3" />
              35% Journal Prestige
            </Badge>
            <Badge variant="success" className="gap-1">
              <Check className="w-3 h-3" />
              25% Content Depth
            </Badge>
            <Badge variant="outline" className="gap-1 bg-white/50">
              <TrendingUp className="w-3 h-3" />
              OpenAlex Enrichment
            </Badge>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 border-t border-blue-200 dark:border-blue-800 pt-4"
              >
                {/* Processing Pipeline Visualization */}
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Processing Pipeline
                  </h4>
                  <div className="space-y-2">
                    {/* Step 1: Initial Collection */}
                    <div className="flex items-start gap-3 bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 backdrop-blur-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            1. Initial Collection
                          </span>
                          <Badge variant="success">{totalCollected} papers</Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Searched {sourcesQueried} academic databases, {sourcesWithResults}{' '}
                          returned results
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Deduplication */}
                    <div className="flex items-start gap-3 bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 backdrop-blur-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            2. Deduplication
                          </span>
                          <Badge variant="success">{uniqueAfterDedup} unique</Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Removed {duplicatesRemoved} duplicates by DOI and title matching (
                          {deduplicationRate}%)
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Quality Enrichment & Filtering */}
                    <div className="flex items-start gap-3 bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 backdrop-blur-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            3. Quality Scoring & Filtering
                          </span>
                          <Badge variant="success">{afterQualityFilter} qualified</Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Enriched with OpenAlex citations & journal metrics, filtered by relevance
                          & quality ({qualityFiltered} removed)
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Final Selection */}
                    <div className="flex items-start gap-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg p-3 border-2 border-green-300 dark:border-green-700">
                      <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            4. Final Selection
                          </span>
                          <Badge className="bg-green-600 text-white">
                            {totalQualified} papers
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-medium">
                          Highest-quality papers selected across all sources. Showing {displayed}{' '}
                          on current page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source Performance Breakdown */}
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-600" />
                    Source Performance (Initial Papers)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sortedSources.map(source => (
                      <div
                        key={source.sourceId}
                        className={`flex flex-col rounded-lg p-2.5 backdrop-blur-sm border-2 ${
                          source.papers > 0
                            ? 'border-green-300 dark:border-green-700 bg-white/60 dark:bg-gray-900/60'
                            : source.error
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                              : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {source.papers > 0 ? (
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : source.error ? (
                              <span className="text-red-600 text-xs flex-shrink-0">✗</span>
                            ) : (
                              <span className="text-amber-600 text-xs flex-shrink-0">⊘</span>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {source.sourceName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={source.papers > 0 ? 'success' : 'outline'}>
                              {source.papers}
                            </Badge>
                            {source.duration && (
                              <span className="text-xs text-gray-500">
                                {Math.round(source.duration)}ms
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Phase 10.6 Day 14.5: Show reason for 0 papers */}
                        {source.papers === 0 && (
                          <div className={`text-xs mt-1.5 pt-1.5 border-t ${
                            source.error
                              ? 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                              : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                          }`}>
                            {source.error || 'No papers matched search criteria in this source'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center">
                    <strong>Total Search Duration:</strong> {Math.round(searchDuration)}ms
                  </p>
                </div>

                {/* Quality Metrics Explanation */}
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Quality Scoring Methodology
                  </h4>
                  <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-600" />
                      <div>
                        <span className="font-medium">Citation Impact (40%):</span> Citations
                        per year, normalized by paper age. Reflects actual research impact.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Database className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-600" />
                      <div>
                        <span className="font-medium">Journal Prestige (35%):</span> Impact
                        factor, h-index, quartile ranking. Publication standards matter.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-600" />
                      <div>
                        <span className="font-medium">Content Depth (25%):</span> Word count as
                        proxy for comprehensiveness (5000+ words = excellent).
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        Papers are ranked by composite quality score. You see the highest-impact
                        research regardless of source.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand/Collapse hint */}
          {!isExpanded && searchStatus === 'completed' && (
            <div className="text-center mt-2">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto"
              >
                View detailed breakdown & pipeline
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
