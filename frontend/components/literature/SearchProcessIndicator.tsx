/**
 * Search Process Transparency Indicator
 * Phase 10.6 Day 14.5+: ENTERPRISE-GRADE TRANSPARENCY
 *
 * Shows users exactly how papers were selected from all sources:
 * - Which sources were queried (e.g., PubMed, ArXiv, etc.)
 * - Papers fetched from each source (INITIAL counts from backend)
 * - Complete processing pipeline (Collection → Dedup → Quality → Final)
 * - Transparent quality methodology (60% Citation, 40% Journal) - v2.0
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
  Info,
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

// Helper: Get source description for tooltips
function getSourceDescription(sourceId: string): string {
  const descriptions: Record<string, string> = {
    pubmed: 'PubMed: Medical & biomedical research database (NIH-maintained, peer-reviewed)',
    pmc: 'PubMed Central: Free full-text medical articles (peer-reviewed)',
    semantic_scholar: 'Semantic Scholar: AI-powered academic search (all fields, peer-reviewed)',
    arxiv: 'ArXiv: Physics & math preprints (not yet peer-reviewed)',
    biorxiv: 'bioRxiv: Biology preprints (not yet peer-reviewed)',
    medrxiv: 'medRxiv: Medical preprints (not yet peer-reviewed)',
    chemrxiv: 'ChemRxiv: Chemistry preprints (not yet peer-reviewed)',
    crossref: 'CrossRef: Multi-publisher registry (mixed quality, all fields)',
    eric: 'ERIC: Education research database (peer-reviewed)',
    scopus: 'Scopus: Multi-disciplinary database (peer-reviewed, high quality)',
    web_of_science: 'Web of Science: Multi-disciplinary database (peer-reviewed, high quality)',
    google_scholar: 'Google Scholar: Searches all sources (mixed quality)',
    ieee_xplore: 'IEEE Xplore: Engineering & computer science (peer-reviewed)',
    springer: 'SpringerLink: Science & technology publisher (peer-reviewed)',
    nature: 'Nature: Top-tier science journal (peer-reviewed, IF 40+)',
    wiley: 'Wiley: Multi-disciplinary publisher (peer-reviewed)',
    sage: 'SAGE Publications: Social sciences publisher (peer-reviewed)',
    taylor_francis: 'Taylor & Francis: Humanities publisher (peer-reviewed)',
    ssrn: 'SSRN: Social sciences preprints (not yet peer-reviewed)',
  };
  return descriptions[sourceId] || 'Academic research database';
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
  
  // Phase 10.6 Day 14.9: Add quality criteria details
  if (metadata.qualificationCriteria) {
    csv.push([''], ['SECTION 2.1: QUALITY CRITERIA DETAILS']);
    csv.push(['Criterion', 'Value', 'Description']);
    csv.push([
      'Relevance Score Minimum',
      metadata.qualificationCriteria.relevanceScoreMin.toString(),
      metadata.qualificationCriteria.relevanceScoreDesc,
    ]);
    csv.push([
      'Quality Scoring: Citation Impact',
      `${metadata.qualificationCriteria.qualityWeights.citationImpact}%`,
      'Citations normalized by paper age (citations per year)',
    ]);
    csv.push([
      'Quality Scoring: Journal Prestige',
      `${metadata.qualificationCriteria.qualityWeights.journalPrestige}%`,
      'Journal h-index, Impact Factor, Quartile (OpenAlex)',
    ]);
    csv.push([''], ['FILTERS APPLIED']);
    csv.push(['Filter Type', 'Details']);
    metadata.qualificationCriteria.filtersApplied.forEach(filter => {
      csv.push([filter, 'Applied']);
    });
    
    // Phase 10.6 Day 14.9: Add concrete examples
    csv.push([''], ['EXAMPLE PAPERS - QUALITY SCORING']);
    csv.push(['Example Type', 'Description', 'Score Components']);
    csv.push([
      'High Quality Paper',
      'Nature paper: 100 citations, 5 years old, IF=43',
      'Citation: 20 cites/year × 60% = 60 pts, Journal: IF 43 × 40% = 40 pts, Total: 100/100',
    ]);
    csv.push([
      'Good Quality Paper',
      'Q1 journal: 15 citations, 3 years old, IF=4.2',
      'Citation: 5 cites/year × 60% = 42 pts, Journal: IF 4.2 × 40% = 28 pts, Total: 70/100',
    ]);
    csv.push([
      'Acceptable Paper',
      'Q2 journal: 5 citations, 5 years old, IF=2.1',
      'Citation: 1 cite/year × 60% = 21 pts, Journal: IF 2.1 × 40% = 17 pts, Total: 38/100',
    ]);
    csv.push([
      'Filtered Out',
      'Low relevance: Keywords dont match query',
      'Relevance Score: 2/100 (below minimum of 3)',
    ]);
  }
  // Phase 10.6 Day 14.9: Add Step 4 (sampling/diversity) if applied
  if ((metadata as any).samplingApplied || (metadata as any).diversityMetrics?.needsEnforcement) {
    csv.push([
      '4. Smart Sampling & Diversity',
      (metadata as any).afterSampling?.toString() || metadata.totalQualified.toString(),
      '',
    ]);
    if ((metadata as any).samplingApplied) {
      csv.push([
        '',
        'Smart Sampling',
        `${(metadata as any).beforeSampling} → ${(metadata as any).afterSampling} papers (quality-stratified)`,
      ]);
      csv.push([
        '',
        'Quality Distribution',
        '40% top (80-100), 35% good (60-80), 20% acceptable (40-60), 5% lower (0-40)',
      ]);
    }
    if ((metadata as any).diversityMetrics?.needsEnforcement) {
      csv.push([
        '',
        'Diversity Enforced',
        `Max 30% per source, ${(metadata as any).diversityMetrics.sourcesRepresented} sources balanced`,
      ]);
    }
  }
  
  csv.push([
    (metadata as any).samplingApplied || (metadata as any).diversityMetrics?.needsEnforcement ? '5' : '4' + '. Final Selection',
    metadata.totalQualified.toString(),
    `High-quality papers selected (${metadata.displayed} displayed on current page)`,
  ]);

  // Phase 10.6 Day 14.9: Add allocation strategy section
  if ((metadata as any).allocationStrategy) {
    csv.push([''], ['SECTION 3: ALLOCATION STRATEGY']);
    csv.push(['Query Complexity', (metadata as any).allocationStrategy.queryComplexity.toUpperCase()]);
    csv.push(['Target Papers', (metadata as any).allocationStrategy.targetPaperCount.toString()]);
    csv.push([''], ['TIER ALLOCATIONS (Papers per Source)']);
    csv.push(['Tier', 'Paper Limit', 'Description']);
    csv.push([
      'Tier 1 - Premium',
      (metadata as any).allocationStrategy.tierAllocations['Tier 1 (Premium)'].toString(),
      'Peer-reviewed, high-impact (PubMed, PMC, Scopus, WoS, Nature, Springer)',
    ]);
    csv.push([
      'Tier 2 - Good',
      (metadata as any).allocationStrategy.tierAllocations['Tier 2 (Good)'].toString(),
      'Established, quality (IEEE, SAGE, Taylor & Francis, Wiley, Semantic Scholar)',
    ]);
    csv.push([
      'Tier 3 - Preprint',
      (metadata as any).allocationStrategy.tierAllocations['Tier 3 (Preprint)'].toString(),
      'Emerging, not peer-reviewed (ArXiv, bioRxiv, medRxiv, ChemRxiv, SSRN)',
    ]);
    csv.push([
      'Tier 4 - Aggregator',
      (metadata as any).allocationStrategy.tierAllocations['Tier 4 (Aggregator)'].toString(),
      'Multi-source, mixed quality (CrossRef, ERIC, Google Scholar)',
    ]);
  }

  // Summary section
  csv.push([''], ['SECTION 4: SUMMARY STATISTICS']);
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
  
  // Phase 10.6 Day 14.9: Add sampling/diversity metrics
  if ((metadata as any).samplingApplied) {
    csv.push(['Smart Sampling Applied', 'Yes']);
    csv.push(['Before Sampling', (metadata as any).beforeSampling?.toString() || 'N/A']);
    csv.push(['After Sampling', (metadata as any).afterSampling?.toString() || 'N/A']);
  } else {
    csv.push(['Smart Sampling Applied', 'No']);
  }
  
  if ((metadata as any).diversityMetrics) {
    csv.push(['Diversity Enforcement', (metadata as any).diversityMetrics.needsEnforcement ? 'Yes' : 'No']);
    csv.push(['Sources Represented', (metadata as any).diversityMetrics.sourcesRepresented?.toString() || 'N/A']);
    if ((metadata as any).diversityMetrics.maxProportionFromOneSource) {
      csv.push([
        'Max Proportion from One Source',
        `${((metadata as any).diversityMetrics.maxProportionFromOneSource * 100).toFixed(1)}%`,
      ]);
    }
  }
  csv.push(['Search Duration', `${Math.round(metadata.searchDuration)}ms`]);

  if (metadata.queryExpansion) {
    csv.push([''], ['SECTION 4: QUERY EXPANSION']);
    csv.push(['Original Query', metadata.queryExpansion.original]);
    csv.push(['Expanded Query', metadata.queryExpansion.expanded]);
  }

  // Phase 10.6 Day 14.8 (v3.0): Bias detection metrics
  if ((metadata as any).biasMetrics) {
    csv.push([''], ['SECTION 5: QUALITY SCORING v3.0 - BIAS DETECTION']);
    csv.push(['Metric Category', 'Details']);
    csv.push(['Quality Scoring Version', (metadata as any).qualityScoringVersion || 'v3.0']);
    
    csv.push([''], ['Bonus Applicability (Optional Rewards)']);
    csv.push(['Bonus Type', 'Papers Receiving Bonus']);
    csv.push(['Open Access (+10 points)', (metadata as any).biasMetrics.bonusApplicability.openAccess]);
    csv.push(['Data/Code Sharing (+5 points)', (metadata as any).biasMetrics.bonusApplicability.dataCodeSharing]);
    csv.push(['Social Impact (+5 points)', (metadata as any).biasMetrics.bonusApplicability.altmetric]);
    
    csv.push([''], ['Field Normalization (Reduces Field Bias)']);
    csv.push(['Metric', 'Value']);
    csv.push(['Papers with Field Data', (metadata as any).biasMetrics.fieldNormalization.papersWithField]);
    csv.push(['Papers with Field-Weighted Citations (FWCI)', (metadata as any).biasMetrics.fieldNormalization.papersWithFWCI]);
    csv.push(['Top Research Fields', (metadata as any).biasMetrics.fieldNormalization.topFields.join('; ')]);
    
    csv.push([''], ['Source Comparison (Fairness Check)']);
    csv.push(['Source', 'Papers', 'Avg Open Access %', 'Avg Bonus Points']);
    Object.entries((metadata as any).biasMetrics.sourceComparison).forEach(([source, stats]: [string, any]) => {
      csv.push([formatSourceName(source), stats.count.toString(), stats.avgOA.toString(), stats.avgBonus.toString()]);
    });
    
    csv.push([''], ['Fairness Note']);
    csv.push([(metadata as any).biasMetrics.fairnessNote]);
    
    csv.push([''], ['v3.0 Design Principles']);
    csv.push(['Principle', 'Implementation']);
    csv.push(['Universal Core Scoring', 'ALL papers get 0-100 score based on citations (field-weighted) + journal prestige']);
    csv.push(['Optional Bonuses', 'OA, reproducibility, Altmetric are REWARDS not REQUIREMENTS']);
    csv.push(['No Penalties', 'Papers without bonuses (classic, paywalled, theoretical) NOT penalized']);
    csv.push(['Field Normalization', 'Math papers with 5 cites/year = Biology papers with 20 cites/year (if field-adjusted)']);
    csv.push(['Era Neutrality', 'Classic papers (1990s) not penalized for lack of OA/social media']);
    csv.push(['Transparency', 'Users see exactly which bonuses applied to which papers and why']);
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
                  <Badge variant="outline" className="bg-white/50 group relative cursor-help">
                    Enterprise-Grade
                    <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Professional-grade transparency showing exactly how papers were selected, filtered, and ranked.
                    </div>
                  </Badge>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {query && `Query: "${query}" • `}
                  Searched {sourcesQueried} research databases {sourcesWithResults > 0 && `(${sourcesWithResults} found relevant papers)`}
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

          {/* Phase 10.6 Day 14.9: Allocation Strategy (NEW - Tiered System) */}
          {(metadata as any).allocationStrategy && (
            <div className="mb-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 group relative cursor-help">
                  Allocation Strategy
                  <Info className="w-3 h-3 inline ml-1 opacity-60" />
                  <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <strong>Why different limits?</strong> High-quality databases (like PubMed) get more requests because they have better peer-reviewed papers. Preprint databases get fewer requests because papers aren't peer-reviewed yet.
                  </div>
                </span>
              </div>
              <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                {/* Query Complexity Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-white dark:bg-gray-800 group relative cursor-help">
                    {(metadata as any).allocationStrategy.queryComplexity.toUpperCase()} Query
                    <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <strong>BROAD:</strong> 1-2 words (e.g., "climate")<br/>
                      <strong>SPECIFIC:</strong> 3-5 words with technical terms<br/>
                      <strong>COMPREHENSIVE:</strong> 5+ words, complex search
                    </div>
                  </Badge>
                  <span className="text-xs">
                    Target: {(metadata as any).allocationStrategy.targetPaperCount} papers <span className="text-gray-500">(optimal for your query)</span>
                  </span>
                </div>
                
                {/* Tier Allocations */}
                <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                  How many papers we request from each database:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 group relative cursor-help">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    <span className="font-medium">Premium:</span> {(metadata as any).allocationStrategy.tierAllocations['Tier 1 (Premium)']}
                    <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <strong>Premium databases:</strong> PubMed, Scopus, Web of Science. All papers are peer-reviewed by experts before publication.
                    </div>
                  </div>
                  <div className="flex items-center gap-1 group relative cursor-help">
                    <Check className="w-3 h-3 text-blue-600" />
                    <span className="font-medium">Good:</span> {(metadata as any).allocationStrategy.tierAllocations['Tier 2 (Good)']}
                    <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <strong>Good databases:</strong> IEEE, SAGE, Wiley. Established publishers with quality peer review.
                    </div>
                  </div>
                  <div className="flex items-center gap-1 group relative cursor-help">
                    <TrendingUp className="w-3 h-3 text-amber-600" />
                    <span className="font-medium">Preprint:</span> {(metadata as any).allocationStrategy.tierAllocations['Tier 3 (Preprint)']}
                    <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <strong>Preprint databases:</strong> ArXiv, bioRxiv, medRxiv. Papers shared before peer review (cutting-edge but not yet verified).
                    </div>
                  </div>
                  <div className="flex items-center gap-1 group relative cursor-help">
                    <Database className="w-3 h-3 text-purple-600" />
                    <span className="font-medium">Aggregator:</span> {(metadata as any).allocationStrategy.tierAllocations['Tier 4 (Aggregator)']}
                    <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <strong>Aggregators:</strong> CrossRef, ERIC. These collect papers from many publishers (mixed quality).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Quality Check Badges - Phase 10.6 Day 14.8: v3.0 Bias-Resistant Scoring */}
          <div className="mb-2">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              How We Score Quality <span className="text-gray-500 font-normal">(hover for details)</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {/* Core Scoring (applies to ALL papers) */}
              <Badge variant="success" className="gap-1 group relative cursor-help">
                <Check className="w-3 h-3" />
                60% Citations
                <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <strong>Citation Impact (60%):</strong> How often other researchers cite this paper. Adjusted by field (math papers get fewer citations than biology, so we normalize). More citations = higher quality.
                </div>
              </Badge>
              <Badge variant="success" className="gap-1 group relative cursor-help">
                <Check className="w-3 h-3" />
                40% Journal Quality
                <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <strong>Journal Prestige (40%):</strong> Quality of the journal/publisher. Measures: impact factor (how influential the journal is), h-index (journal's citation record), and quartile ranking (Q1 = top 25% of journals).
                </div>
              </Badge>
              {/* Optional Bonuses */}
              <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-300 group relative cursor-help">
                <TrendingUp className="w-3 h-3" />
                +10 Free Access
                <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <strong>Open Access Bonus (+10 points):</strong> Paper is freely available to read (no paywall). Paywalled papers are NOT penalized—this is just a bonus for accessibility.
                </div>
              </Badge>
              <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-300 group relative cursor-help">
                <Zap className="w-3 h-3" />
                +5 Data Shared
                <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <strong>Data/Code Sharing Bonus (+5 points):</strong> Authors shared their data or code (reproducible research). Papers without shared data are NOT penalized—this is a bonus for transparency.
                </div>
              </Badge>
              <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-300 group relative cursor-help">
                <Shield className="w-3 h-3" />
                +5 Social Buzz
                <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <strong>Social Impact Bonus (+5 points):</strong> Paper got attention on social media, news, or policy documents (Altmetric score). Papers without social buzz are NOT penalized—this is a bonus.
                </div>
              </Badge>
              {/* Safeguards */}
              <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-300 group relative cursor-help">
                <Info className="w-3 h-3" />
                No Length Bias
                <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <strong>No Length Bias:</strong> We don't judge papers by word count. A short article can be more insightful than a long one.
                </div>
              </Badge>
              <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-300 group relative cursor-help">
                <Check className="w-3 h-3" />
                Fair & Balanced
                <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <strong>Bias-Resistant v3.0:</strong> Our scoring is fair across all fields, eras, and sources. Papers without bonuses can still score 100/100 based on citations and journal quality alone.
                </div>
              </Badge>
            </div>
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
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 group relative cursor-help">
                            2. Remove Duplicates
                            <Info className="w-3 h-3 inline ml-1 opacity-60" />
                            <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <strong>Deduplication:</strong> Same paper can appear in multiple databases. We identify duplicates using DOI (unique paper ID) and title matching, then keep only one copy.
                            </div>
                          </span>
                          <Badge variant="success">{uniqueAfterDedup} unique</Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Removed {duplicatesRemoved} duplicates ({deduplicationRate}%)
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Quality Enrichment & Filtering - Phase 10.6 Day 14.9: Enhanced with examples */}
                    <div className="flex items-start gap-3 bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 backdrop-blur-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 group relative cursor-help">
                            3. Quality Scoring & Filtering
                            <Info className="w-3 h-3 inline ml-1 opacity-60" />
                            <div className="absolute left-0 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <strong>Quality Scoring:</strong> We add citation counts and journal quality data (from OpenAlex database). Then we filter out: (1) papers that don't match your keywords, (2) low-quality papers with no citations or from unknown sources.
                            </div>
                          </span>
                          <Badge variant="success">{afterQualityFilter} qualified</Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Added citation & journal data, removed {qualityFiltered} irrelevant or low-quality papers
                        </p>
                        {/* Phase 10.6 Day 14.9: Add concrete examples */}
                        {metadata.qualificationCriteria && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 group relative cursor-help inline-block">
                              Minimum Relevance: {metadata.qualificationCriteria.relevanceScoreMin}/100
                              <Info className="w-3 h-3 inline ml-1 opacity-60" />
                              <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <strong>Relevance Score:</strong> How well the paper matches your search keywords. Based on keyword matches in title, abstract, and tags. Papers scoring below 3/100 are filtered (keywords barely appear).
                              </div>
                            </p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                              <div className="flex items-start gap-1">
                                <span className="text-green-600">✓</span>
                                <span>Passed: Paper with 5 cites/year, top journal (Q1) = 70/100 quality score</span>
                              </div>
                              <div className="flex items-start gap-1">
                                <span className="text-amber-600">○</span>
                                <span>Borderline: New paper, 1 cite/year, good journal (Q2) = 45/100</span>
                              </div>
                              <div className="flex items-start gap-1">
                                <span className="text-red-600">✗</span>
                                <span>Filtered: Relevance &lt; 3 (keywords don't match your search)</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step 4: Smart Sampling & Diversity - Phase 10.6 Day 14.9 */}
                    {((metadata as any).samplingApplied || (metadata as any).diversityMetrics?.needsEnforcement) && (
                      <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
                        <Zap className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 group relative cursor-help">
                              4. Final Selection (Smart Filtering)
                              <Info className="w-3 h-3 inline ml-1 opacity-60" />
                              <div className="absolute left-0 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <strong>Smart Sampling:</strong> If too many papers qualify, we sample intelligently to keep a mix of quality levels (not just top papers).<br/><br/>
                                <strong>Diversity:</strong> We ensure no single database dominates results (max 30% from one source).
                              </div>
                            </span>
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              {(metadata as any).afterSampling || totalQualified} papers
                            </Badge>
                          </div>
                          {(metadata as any).samplingApplied && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              📊 Intelligent sampling: {(metadata as any).beforeSampling} → {(metadata as any).afterSampling} papers
                              <br/><span className="text-gray-500 text-xs">(Kept: 40% top, 35% good, 20% acceptable, 5% lower quality for comprehensive coverage)</span>
                            </p>
                          )}
                          {(metadata as any).diversityMetrics?.needsEnforcement && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              ⚖️  Balanced across sources: No single database provides more than 30% of results
                              <br/><span className="text-gray-500 text-xs">({(metadata as any).diversityMetrics.sourcesRepresented} databases represented)</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 5: Final Selection */}
                    <div className="flex items-start gap-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg p-3 border-2 border-green-300 dark:border-green-700">
                      <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {(metadata as any).samplingApplied || (metadata as any).diversityMetrics?.needsEnforcement ? '5' : '4'}. Final Selection
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
                        className={`flex flex-col rounded-lg p-2.5 backdrop-blur-sm border-2 group relative cursor-help ${
                          source.papers > 0
                            ? 'border-green-300 dark:border-green-700 bg-white/60 dark:bg-gray-900/60'
                            : source.error
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                              : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30'
                        }`}
                      >
                        {/* Tooltip */}
                        <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {getSourceDescription(source.sourceId)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {source.papers > 0 ? (
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : source.error ? (
                              <span className="text-red-600 text-xs flex-shrink-0">✗</span>
                            ) : (
                              <span className="text-amber-600 text-xs flex-shrink-0">⊘</span>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
                              {source.sourceName}
                              <Info className="w-3 h-3 opacity-60 flex-shrink-0" />
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

                {/* Quality Metrics Explanation - v3.0 Bias-Resistant Scoring */}
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Quality Scoring Methodology (v3.0 - Bias-Resistant)
                  </h4>
                  <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    {/* Core Scoring */}
                    <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                      Core Scoring (applies to ALL papers):
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-600" />
                      <div>
                        <span className="font-medium">Citation Impact (60%):</span> Citations per year,
                        <strong className="text-emerald-700 dark:text-emerald-300"> field-weighted</strong> to
                        fairly compare papers across disciplines (math vs. biology).
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Database className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-600" />
                      <div>
                        <span className="font-medium">Journal Prestige (40%):</span> Impact factor,
                        h-index, quartile ranking. Publication standards and peer review quality.
                      </div>
                    </div>
                    
                    {/* Optional Bonuses */}
                    <div className="font-medium text-emerald-700 dark:text-emerald-300 mb-1 mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
                      Optional Bonuses (when applicable):
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-600" />
                      <div>
                        <span className="font-medium">Open Access (+10 points):</span> Paper is freely available.
                        Classic paywalled papers NOT penalized.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-600" />
                      <div>
                        <span className="font-medium">Data/Code Sharing (+5 points):</span> Reproducible research.
                        Theoretical papers NOT penalized.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-600" />
                      <div>
                        <span className="font-medium">Social Impact (+5 points):</span> High Altmetric score.
                        Fundamental research NOT penalized.
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        ✅ Papers without bonuses can still score 100/100. Bonuses are REWARDS, not requirements.
                        Fair across all sources, fields, and eras.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bias Metrics - v3.0 Transparency */}
                {(metadata as any).biasMetrics && (
                  <div className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Bias Detection & Fairness Metrics
                    </h4>
                    <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                      {/* Bonus Applicability */}
                      <div>
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">Bonus Applicability:</span>
                        <div className="ml-4 mt-1 space-y-0.5">
                          <div>• Open Access: {(metadata as any).biasMetrics.bonusApplicability.openAccess}</div>
                          <div>• Data/Code Sharing: {(metadata as any).biasMetrics.bonusApplicability.dataCodeSharing}</div>
                          <div>• Social Impact: {(metadata as any).biasMetrics.bonusApplicability.altmetric}</div>
                        </div>
                      </div>
                      
                      {/* Field Normalization */}
                      <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800">
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">Field Normalization:</span>
                        <div className="ml-4 mt-1 space-y-0.5">
                          <div>• Papers with field data: {(metadata as any).biasMetrics.fieldNormalization.papersWithField}</div>
                          <div>• Papers with FWCI: {(metadata as any).biasMetrics.fieldNormalization.papersWithFWCI}</div>
                          <div>• Top fields: {(metadata as any).biasMetrics.fieldNormalization.topFields.join(', ')}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                        <p className="font-medium text-emerald-700 dark:text-emerald-300">
                          {(metadata as any).biasMetrics.fairnessNote}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
