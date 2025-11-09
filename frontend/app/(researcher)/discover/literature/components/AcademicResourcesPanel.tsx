/**
 * AcademicResourcesPanel Component
 * Extracted from literature page (Phase 10.1 - Enterprise Refactoring)
 * Handles academic database selection, institutional access, and scholarly resources
 *
 * Features:
 * - 16 academic database sources (free & premium)
 * - Institutional authentication integration
 * - Cost calculator for paper access
 * - Content depth analysis
 * - Action buttons for theme extraction and export
 *
 * @module AcademicResourcesPanel
 */

'use client';

import React, { memo } from 'react';
import { Database, Sparkles, Loader2, Download, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  getSourceIcon: (source: string) => React.ComponentType<{ className?: string }>;
}

// ============================================================================
// Academic Database Sources Configuration
// ============================================================================

const ACADEMIC_DATABASES: AcademicDatabase[] = [
  // Free & Open Access
  { id: 'pubmed', label: 'PubMed', icon: '🏥', desc: 'Medical/life sciences - FREE', category: 'Free' },
  { id: 'pmc', label: 'PubMed Central', icon: '📖', desc: 'Free full-text articles', category: 'Free' },
  { id: 'arxiv', label: 'ArXiv', icon: '📐', desc: 'Physics/Math/CS preprints - FREE', category: 'Free' },
  { id: 'biorxiv', label: 'bioRxiv', icon: '🧬', desc: 'Biology preprints - FREE', category: 'Free' },
  { id: 'semantic_scholar', label: 'Semantic Scholar', icon: '🎓', desc: 'CS/interdisciplinary - FREE', category: 'Free' },
  { id: 'crossref', label: 'CrossRef', icon: '🔗', desc: 'DOI database registry', category: 'Free' },
  { id: 'eric', label: 'ERIC', icon: '🎓', desc: 'Education research - FREE', category: 'Free' },

  // Multidisciplinary Premium
  { id: 'web_of_science', label: 'Web of Science', icon: '🌐', desc: 'Multidisciplinary citation index', category: 'Premium' },
  { id: 'scopus', label: 'Scopus', icon: '🔬', desc: 'Multidisciplinary abstract/citation', category: 'Premium' },

  // Subject-Specific Premium
  { id: 'ieee', label: 'IEEE Xplore', icon: '⚡', desc: 'Engineering/tech/CS', category: 'Premium' },
  { id: 'jstor', label: 'JSTOR', icon: '📚', desc: 'Humanities/social sciences', category: 'Premium' },
  { id: 'springer', label: 'SpringerLink', icon: '📕', desc: 'STM & social sciences', category: 'Premium' },
  { id: 'nature', label: 'Nature', icon: '🔬', desc: 'Science journals', category: 'Premium' },
  { id: 'wiley', label: 'Wiley Online', icon: '📘', desc: 'Multidisciplinary', category: 'Premium' },
  { id: 'elsevier', label: 'ScienceDirect', icon: '🔵', desc: 'Elsevier journals', category: 'Premium' },
  { id: 'psycinfo', label: 'PsycINFO', icon: '🧠', desc: 'Psychology/behavioral sciences', category: 'Premium' },
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
    const newDatabases = academicDatabases.includes(databaseId)
      ? academicDatabases.filter(s => s !== databaseId)
      : [...academicDatabases, databaseId];
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
  const abstractOnlyCount = selectedPaperObjects.length - fullTextCount - fetchingCount;

  const avgFullTextWords = fullTextCount > 0
    ? Math.round(
        selectedPaperObjects
          .filter(p => (p as any).fullTextStatus === 'success')
          .reduce((sum, p) => sum + ((p as any).fullTextWordCount || 0), 0) / fullTextCount
      )
    : 0;

  const avgAbstractWords = abstractOnlyCount > 0
    ? Math.round(
        selectedPaperObjects
          .filter(p => (p as any).fullTextStatus !== 'success')
          .reduce((sum, p) => sum + (p.abstractWordCount || 0), 0) / abstractOnlyCount
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
          Search peer-reviewed academic literature from leading scholarly databases
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Academic Database Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select Academic Databases
          </label>
          <div className="flex gap-2 flex-wrap">
            {ACADEMIC_DATABASES.map(source => {
              const IconComponent = getSourceIcon(source.id);
              return (
                <Badge
                  key={source.id}
                  variant={academicDatabases.includes(source.id) ? 'default' : 'outline'}
                  className="cursor-pointer py-2 px-4 text-sm hover:scale-105 transition-transform flex items-center gap-2"
                  onClick={() => handleDatabaseToggle(source.id)}
                  title={source.desc}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span>{source.label}</span>
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {academicDatabases.length} database{academicDatabases.length !== 1 ? 's' : ''} selected
            {academicDatabases.length === 0 && ' (select at least one)'}
          </p>
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
        {selectedPapers.size > 0 && (fullTextCount > 0 || fetchingCount > 0) && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Content Depth Analysis
            </h4>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {fullTextCount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <div className="font-semibold text-green-900">{fullTextCount} Full-Text Papers</div>
                  <div className="text-green-700">Avg: {avgFullTextWords.toLocaleString()} words</div>
                  <div className="text-green-600 text-[10px] mt-1">Deep coding (Braun & Clarke Stage 2)</div>
                </div>
              )}
              {abstractOnlyCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="font-semibold text-blue-900">{abstractOnlyCount} Abstract-Only Papers</div>
                  <div className="text-blue-700">Avg: {avgAbstractWords.toLocaleString()} words</div>
                  <div className="text-blue-600 text-[10px] mt-1">Sufficient for theme ID</div>
                </div>
              )}
              {fetchingCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 animate-pulse">
                  <div className="font-semibold text-amber-900">{fetchingCount} Fetching...</div>
                  <div className="text-amber-700">Processing PDFs</div>
                  <div className="text-amber-600 text-[10px] mt-1">Wait for better depth</div>
                </div>
              )}
            </div>
            <p className="text-xs text-blue-700 mt-3 leading-relaxed">
              <strong>Methodology:</strong> Full-text provides richer coding (40-50x more content) for high-quality papers (≥70 score).
              Abstracts sufficient for preliminary theme identification (Thomas & Harden 2008).
              {fetchingCount > 0 && ' You may extract now or wait ~2 min for full-text to complete.'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onExtractThemes}
            disabled={(papers.length === 0 && transcribedVideosCount === 0) || analyzingThemes}
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
                  <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900">
                    {transcribedVideosCount} videos
                  </Badge>
                )}
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onIncrementalExtraction}
            disabled={(selectedPapers.size === 0 && transcribedVideosCount === 0) || analyzingThemes}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-300"
            title="Add papers incrementally to existing corpus and save costs via caching"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Extract Incrementally</span>
            {corpusCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900">
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
