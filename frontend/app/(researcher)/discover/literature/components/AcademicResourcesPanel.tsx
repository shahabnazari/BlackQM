/**
 * AcademicResourcesPanel Component
 * Extracted from literature page (Phase 10.1 - Enterprise Refactoring)
 * Handles academic database selection, institutional access, and scholarly resources
 *
 * Features:
 * - 14 academic database sources (fully implemented with backend services)
 * - Institutional authentication integration
 * - Cost calculator for paper access
 * - Content depth analysis
 * - Action buttons for theme extraction and export
 *
 * @module AcademicResourcesPanel
 */

'use client';

import React, { memo } from 'react';
import {
  Database,
  Sparkles,
  Loader2,
  Download,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/apple-ui/Badge/Badge'; // Phase 10.6 Day 14: Apple UI Badge
import { Button } from '@/components/ui/button';
import { AcademicInstitutionLogin } from '@/components/literature/AcademicInstitutionLogin';
import { CostCalculator } from '@/components/literature/CostCalculator';
import { toast } from 'sonner';
import type { Paper } from '@/lib/types/literature.types';

// ============================================================================
// Types
// ============================================================================

export interface AcademicDatabase {
  id: string;
  label: string;
  icon: string;
  desc: string;
  category: 'Free' | 'Premium';
}

export interface InstitutionAuth {
  isAuthenticated: boolean;
  institution: any | null;
  authMethod: 'shibboleth' | 'openathens' | 'orcid' | null;
  userName?: string;
  freeAccess: boolean;
  accessibleDatabases: string[];
}

export interface AcademicResourcesPanelProps {
  /** Currently selected academic databases */
  academicDatabases: string[];
  /** Handler for database selection changes */
  onDatabasesChange: (databases: string[]) => void;
  /** Current institutional authentication state */
  institutionAuth: InstitutionAuth;
  /** Handler for institution auth changes */
  onInstitutionAuthChange: (auth: InstitutionAuth) => void;
  /** All papers in search results */
  papers: Paper[];
  /** Set of selected paper IDs */
  selectedPapers: Set<string>;
  /** Number of transcribed videos */
  transcribedVideosCount: number;
  /** Whether theme analysis is in progress */
  analyzingThemes: boolean;
  /** Handler for theme extraction */
  onExtractThemes: () => void;
  /** Handler for incremental extraction */
  onIncrementalExtraction: () => void;
  /** Handler for corpus management */
  onCorpusManagement: () => void;
  /** Handler for citation export */
  onExportCitations: (format: 'bibtex' | 'ris' | 'apa') => void;
  /** Number of existing corpuses */
  corpusCount: number;
  /** Set of papers currently being extracted */
  extractingPapers: Set<string>;
  /** Function to get academic source icon component */
  getSourceIcon: (
    source: string
  ) => React.ComponentType<{ className?: string }>;
}

// ============================================================================
// Academic Database Sources Configuration
// ============================================================================

const ACADEMIC_DATABASES: AcademicDatabase[] = [
  // Free & Open Access
  {
    id: 'pubmed',
    label: 'PubMed',
    icon: '🏥',
    desc: 'Medical/life sciences - FREE',
    category: 'Free',
  },
  {
    id: 'pmc',
    label: 'PubMed Central',
    icon: '📖',
    desc: 'Free full-text articles',
    category: 'Free',
  },
  {
    id: 'arxiv',
    label: 'ArXiv',
    icon: '📐',
    desc: 'Physics/Math/CS preprints - FREE',
    category: 'Free',
  },
  {
    id: 'biorxiv',
    label: 'bioRxiv/medRxiv',
    icon: '🧬',
    desc: 'Biology & medical preprints - FREE (shared platform)',
    category: 'Free',
  },
  {
    id: 'chemrxiv',
    label: 'ChemRxiv',
    icon: '⚗️',
    desc: 'Chemistry preprints - FREE',
    category: 'Free',
  },
  {
    id: 'semantic_scholar',
    label: 'Semantic Scholar',
    icon: '🎓',
    desc: 'CS/interdisciplinary - FREE',
    category: 'Free',
  },
  {
    id: 'google_scholar',
    label: 'Google Scholar',
    icon: '🔍',
    desc: 'Multidisciplinary - Requires paid SerpAPI key',
    category: 'Premium',
  },
  {
    id: 'ssrn',
    label: 'SSRN',
    icon: '📊',
    desc: 'Social science papers (demo)',
    category: 'Free',
  },
  {
    id: 'crossref',
    label: 'CrossRef',
    icon: '🔗',
    desc: 'DOI database registry',
    category: 'Free',
  },
  {
    id: 'eric',
    label: 'ERIC',
    icon: '🎓',
    desc: 'Education research - FREE',
    category: 'Free',
  },
  {
    id: 'web_of_science',
    label: 'Web of Science',
    icon: '🌐',
    desc: 'Premium - 159M+ records (API key required)',
    category: 'Premium',
  },
  {
    id: 'scopus',
    label: 'Scopus',
    icon: '🔬',
    desc: 'Premium - 85M+ records, SJR scores (API key required)',
    category: 'Premium',
  },
  {
    id: 'ieee_xplore',
    label: 'IEEE Xplore',
    icon: '⚡',
    desc: 'Premium - 5.5M+ engineering & CS papers (API key required)',
    category: 'Premium',
  },
  {
    id: 'springer',
    label: 'SpringerLink',
    icon: '📚',
    desc: 'Premium - 15M+ STM documents (API key required)',
    category: 'Premium',
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '⭐',
    desc: 'Premium - High-impact journal (IF ~69, API key required)',
    category: 'Premium',
  },
  {
    id: 'wiley',
    label: 'Wiley Online Library',
    icon: '🔬',
    desc: 'Premium - 6M+ articles, engineering & medicine (API key required)',
    category: 'Premium',
  },
  {
    id: 'sage',
    label: 'SAGE Publications',
    icon: '📖',
    desc: 'Premium - 1000+ journals, social sciences focus (API key required)',
    category: 'Premium',
  },
  {
    id: 'taylor_francis',
    label: 'Taylor & Francis',
    icon: '📚',
    desc: 'Premium - 2,700+ journals, humanities & social sciences (API key required)',
    category: 'Premium',
  },
];

// ============================================================================
// Component
// ============================================================================

export const AcademicResourcesPanel = memo(function AcademicResourcesPanel({
  academicDatabases,
  onDatabasesChange,
  institutionAuth,
  onInstitutionAuthChange,
  papers,
  selectedPapers,
  transcribedVideosCount,
  analyzingThemes,
  onExtractThemes,
  onIncrementalExtraction,
  onCorpusManagement,
  onExportCitations,
  corpusCount,
  extractingPapers: _extractingPapers, // Keep for future use, prefix with _ to avoid unused warning
  getSourceIcon,
}: AcademicResourcesPanelProps) {
  const handleDatabaseToggle = (databaseId: string) => {
    console.log('🔘 [DEBUG] AcademicResourcesPanel - Toggle clicked:', databaseId);
    console.log('🔘 [DEBUG] Current academicDatabases:', academicDatabases);
    console.log('🔘 [DEBUG] Is currently selected:', academicDatabases.includes(databaseId));

    const newDatabases = academicDatabases.includes(databaseId)
      ? academicDatabases.filter(s => s !== databaseId)
      : [...academicDatabases, databaseId];

    console.log('🔘 [DEBUG] New selection:', newDatabases);
    console.log('🔘 [DEBUG] Calling onDatabasesChange with:', newDatabases);

    onDatabasesChange(newDatabases);
  };

  // Calculate content depth metrics for selected papers
  const selectedPaperObjects = papers.filter(p => selectedPapers.has(p.id));
  const fullTextCount = selectedPaperObjects.filter(
    p => (p as any).fullTextStatus === 'success'
  ).length;
  const fetchingCount = selectedPaperObjects.filter(
    p => (p as any).fullTextStatus === 'fetching'
  ).length;
  const abstractOnlyCount =
    selectedPaperObjects.length - fullTextCount - fetchingCount;

  const avgFullTextWords =
    fullTextCount > 0
      ? Math.round(
          selectedPaperObjects
            .filter(p => (p as any).fullTextStatus === 'success')
            .reduce((sum, p) => sum + ((p as any).fullTextWordCount || 0), 0) /
            fullTextCount
        )
      : 0;

  const avgAbstractWords =
    abstractOnlyCount > 0
      ? Math.round(
          selectedPaperObjects
            .filter(p => (p as any).fullTextStatus !== 'success')
            .reduce((sum, p) => sum + (p.abstractWordCount || 0), 0) /
            abstractOnlyCount
        )
      : 0;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Academic Resources & Institutional Access
          </span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Scholarly Databases
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Search peer-reviewed academic literature from leading scholarly
          databases
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Academic Database Selection - Phase 10.6 Day 14: Apple UI Redesign */}
        <div className="space-y-4">
          {/* Selection Summary */}
          <div className="flex items-center justify-between">
            <label className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Select Academic Databases
            </label>
            <Badge
              variant={academicDatabases.length > 0 ? 'success' : 'outline'}
              size="md"
              className="font-medium"
            >
              {academicDatabases.length} selected
            </Badge>
          </div>

          {/* Open Access Sources */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="success" size="sm" className="uppercase text-xs font-bold">
                Open Access - Free (9 sources)
              </Badge>
              <span className="text-xs text-gray-500">
                No subscription or API key required
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {ACADEMIC_DATABASES.filter(db => db.category === 'Free').map(
                source => {
                  const isSelected = academicDatabases.includes(source.id);
                  const IconComponent = getSourceIcon(source.id);
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handleDatabaseToggle(source.id)}
                      className={`
                        group relative overflow-hidden
                        rounded-lg border-2 p-3
                        transition-all duration-300 ease-out
                        hover:scale-[1.02] active:scale-[0.98]
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
                        ${
                          isSelected
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-400 dark:border-green-600 shadow-lg shadow-green-100 dark:shadow-green-900/30'
                            : 'bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md backdrop-blur-sm'
                        }
                      `}
                      title={source.desc}
                      aria-pressed={isSelected}
                      aria-label={`${source.label} - ${source.desc}`}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Icon */}
                      <div
                        className={`
                        mb-1.5 transition-transform duration-300
                        ${isSelected ? 'scale-110' : 'group-hover:scale-110'}
                      `}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${
                            isSelected
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400'
                          }`}
                        />
                      </div>

                      {/* Label */}
                      <div className="text-left space-y-0.5">
                        <div
                          className={`font-semibold text-xs transition-colors ${
                            isSelected
                              ? 'text-green-900 dark:text-green-100'
                              : 'text-gray-800 dark:text-gray-200 group-hover:text-green-800 dark:group-hover:text-green-200'
                          }`}
                        >
                          {source.label}
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-tight min-h-[1.25rem]">
                          {source.desc}
                        </div>
                      </div>

                      {/* Glassmorphism effect on hover */}
                      <div
                        className={`
                        absolute inset-0 -z-10 opacity-0 group-hover:opacity-100
                        bg-gradient-to-br from-green-100/50 to-emerald-100/50
                        dark:from-green-900/20 dark:to-emerald-900/20
                        transition-opacity duration-300 rounded-xl backdrop-blur-sm
                      `}
                      />
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Premium Sources */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="warning" size="sm" className="uppercase text-xs font-bold">
                Premium Databases (9 sources)
              </Badge>
              <span className="text-xs text-gray-500">
                Requires API key or institutional access
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {ACADEMIC_DATABASES.filter(
                db => db.category === 'Premium'
              ).map(source => {
                const isSelected = academicDatabases.includes(source.id);
                const IconComponent = getSourceIcon(source.id);
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => handleDatabaseToggle(source.id)}
                    className={`
                      group relative overflow-hidden
                      rounded-lg border-2 p-3
                      transition-all duration-300 ease-out
                      hover:scale-[1.02] active:scale-[0.98]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                      ${
                        isSelected
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-100 dark:shadow-amber-900/30'
                          : 'bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md backdrop-blur-sm'
                      }
                    `}
                    title={source.desc}
                    aria-pressed={isSelected}
                    aria-label={`${source.label} - ${source.desc}`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Premium Badge */}
                    {!isSelected && (
                      <div className="absolute top-1.5 right-1.5">
                        <Badge
                          variant="warning"
                          size="sm"
                          className="text-[9px] px-1 py-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          API
                        </Badge>
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`
                      mb-1.5 transition-transform duration-300
                      ${isSelected ? 'scale-110' : 'group-hover:scale-110'}
                    `}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${
                          isSelected
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-600 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                        }`}
                      />
                    </div>

                    {/* Label */}
                    <div className="text-left space-y-0.5">
                      <div
                        className={`font-semibold text-xs transition-colors ${
                          isSelected
                            ? 'text-amber-900 dark:text-amber-100'
                            : 'text-gray-800 dark:text-gray-200 group-hover:text-amber-800 dark:group-hover:text-amber-200'
                        }`}
                      >
                        {source.label}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 leading-tight min-h-[1.25rem]">
                        {source.desc}
                      </div>
                    </div>

                    {/* Glassmorphism effect on hover */}
                    <div
                      className={`
                      absolute inset-0 -z-10 opacity-0 group-hover:opacity-100
                      bg-gradient-to-br from-amber-100/50 to-orange-100/50
                      dark:from-amber-900/20 dark:to-orange-900/20
                      transition-opacity duration-300 rounded-xl backdrop-blur-sm
                    `}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Helper Text */}
          {academicDatabases.length === 0 && (
            <div className="text-center py-4 px-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                Select at least one database to begin your search
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Tip: Start with open access sources for free full-text articles
              </p>
            </div>
          )}
        </div>

        {/* Institution Login */}
        <AcademicInstitutionLogin
          currentAuth={institutionAuth}
          onAuthChange={onInstitutionAuthChange}
        />

        {/* Cost Calculator */}
        <CostCalculator
          selectedPapers={selectedPapers}
          papers={papers}
          institutionAccessActive={institutionAuth.freeAccess}
          onLoginClick={() => {
            toast.info('Scroll up to login with your institution');
          }}
        />

        {/* Content Depth Transparency Banner */}
        {selectedPapers.size > 0 &&
          (fullTextCount > 0 || fetchingCount > 0) && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Content Depth Analysis
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {fullTextCount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <div className="font-semibold text-green-900">
                      {fullTextCount} Full-Text Papers
                    </div>
                    <div className="text-green-700">
                      Avg: {avgFullTextWords.toLocaleString()} words
                    </div>
                    <div className="text-green-600 text-[10px] mt-1">
                      Deep coding (Braun & Clarke Stage 2)
                    </div>
                  </div>
                )}
                {abstractOnlyCount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <div className="font-semibold text-blue-900">
                      {abstractOnlyCount} Abstract-Only Papers
                    </div>
                    <div className="text-blue-700">
                      Avg: {avgAbstractWords.toLocaleString()} words
                    </div>
                    <div className="text-blue-600 text-[10px] mt-1">
                      Sufficient for theme ID
                    </div>
                  </div>
                )}
                {fetchingCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 animate-pulse">
                    <div className="font-semibold text-amber-900">
                      {fetchingCount} Fetching...
                    </div>
                    <div className="text-amber-700">Processing PDFs</div>
                    <div className="text-amber-600 text-[10px] mt-1">
                      Wait for better depth
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-blue-700 mt-3 leading-relaxed">
                <strong>Methodology:</strong> Full-text provides richer coding
                (40-50x more content) for high-quality papers (≥70 score).
                Abstracts sufficient for preliminary theme identification
                (Thomas & Harden 2008).
                {fetchingCount > 0 &&
                  ' You may extract now or wait ~2 min for full-text to complete.'}
              </p>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onExtractThemes}
            disabled={
              (papers.length === 0 && transcribedVideosCount === 0) ||
              analyzingThemes
            }
            className="flex items-center gap-2"
          >
            {analyzingThemes ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            <span>Extract Themes from All Sources</span>
            {(selectedPapers.size > 0 || transcribedVideosCount > 0) && (
              <div className="flex gap-1">
                {selectedPapers.size > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPapers.size} papers
                  </Badge>
                )}
                {transcribedVideosCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-purple-100 dark:bg-purple-900"
                  >
                    {transcribedVideosCount} videos
                  </Badge>
                )}
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onIncrementalExtraction}
            disabled={
              (selectedPapers.size === 0 && transcribedVideosCount === 0) ||
              analyzingThemes
            }
            className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-300"
            title="Add papers incrementally to existing corpus and save costs via caching"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Extract Incrementally</span>
            {corpusCount > 0 && (
              <Badge
                variant="secondary"
                className="text-xs bg-blue-100 dark:bg-blue-900"
              >
                {corpusCount} corpus
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onCorpusManagement}
            className="flex items-center gap-2"
            title="View and manage your research corpuses"
          >
            <Database className="w-4 h-4" />
            <span>Manage Corpuses</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => onExportCitations('bibtex')}
            disabled={selectedPapers.size === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export BibTeX
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
