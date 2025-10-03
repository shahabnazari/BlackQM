/**
 * Literature Search Interface - DISCOVER Phase
 * Phase 9 Day 0-1: Complete Literature Review System
 * World-class implementation integrated with backend API
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Download,
  Star,
  Filter,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Database,
  TrendingUp,
  GitBranch,
  Loader2,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  literatureAPI,
  Paper,
  ResearchGap,
} from '@/lib/services/literature-api.service';
import DatabaseSourcesInfo from '@/components/literature/DatabaseSourcesInfo';
import { ThemeCard } from '@/components/literature/ThemeCard';
import {
  useUnifiedThemeAPI,
  UnifiedTheme,
  SourceContent,
} from '@/lib/api/services/unified-theme-api.service';

export default function LiteratureSearchPage() {
  // Search state
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  // const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');

  // Advanced filters
  const [filters, setFilters] = useState({
    yearFrom: 2020,
    yearTo: new Date().getFullYear(),
    sources: ['semantic_scholar', 'crossref', 'pubmed', 'arxiv'],
    sortBy: 'relevance' as 'relevance' | 'date' | 'citations',
    citationMin: 0,
    includeAIMode: true,
  });

  // Analysis state
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [unifiedThemes, setUnifiedThemes] = useState<UnifiedTheme[]>([]);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [analyzingThemes, setAnalyzingThemes] = useState(false);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);

  // Phase 9 Day 20: Unified theme extraction hook
  const { extractThemes: extractUnifiedThemes } = useUnifiedThemeAPI();

  // Library state
  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [activeTab, setActiveTab] = useState('search');

  // Alternative sources state
  const [alternativeSources, setAlternativeSources] = useState<string[]>([]);
  const [alternativeResults, setAlternativeResults] = useState<any[]>([]);
  const [loadingAlternative, setLoadingAlternative] = useState(false);

  // PHASE 9 DAY 13: Social media state
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>([]);
  const [socialResults, setSocialResults] = useState<any[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [socialInsights, setSocialInsights] = useState<any>(null);

  // PHASE 9 DAY 18: Multimedia transcription state
  const [transcriptionOptions, setTranscriptionOptions] = useState({
    includeTranscripts: false,
    extractThemes: false,
    maxResults: 10,
  });

  // Load saved papers on mount
  useEffect(() => {
    loadUserLibrary();
  }, []);

  const loadUserLibrary = async () => {
    try {
      const { papers } = await literatureAPI.getUserLibrary();
      setSavedPapers(papers);
    } catch (error) {
      console.error('Failed to load library:', error);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Starting search with query:', query);
      console.log('📊 Filters:', filters);

      const result = await literatureAPI.searchLiterature({
        query,
        sources: filters.sources,
        yearFrom: filters.yearFrom,
        yearTo: filters.yearTo,
        sortBy: filters.sortBy,
        page: currentPage,
        limit: 20,
        includeCitations: true,
      });

      console.log('✅ Search result received:', result);
      console.log('📚 Papers array:', result.papers);
      console.log('📈 Total results:', result.total);

      if (result.papers && result.papers.length > 0) {
        setPapers(result.papers);
        setTotalResults(result.total);
        setActiveTab('search'); // Make sure we're on the search tab to see results
        console.log(
          '✅ Papers state updated with',
          result.papers.length,
          'papers'
        );
        console.log('📑 Active tab set to:', 'search');
        toast.success(
          `Found ${result.total} papers across ${filters.sources.length} databases`
        );
      } else {
        console.warn('⚠️ No papers in result');
        setPapers([]);
        setTotalResults(0);
        setActiveTab('search'); // Still switch to search tab
        toast.info('No papers found. Try adjusting your search terms.');
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('❌ Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters, currentPage]);

  const handleSavePaper = async (paper: Paper) => {
    try {
      console.log('💾 Saving paper:', paper.title);
      const result = await literatureAPI.savePaper(paper);

      if (result.success) {
        // Add paper to saved list if not already there
        setSavedPapers(prevPapers => {
          const exists = prevPapers.some(p => p.id === paper.id);
          if (!exists) {
            return [...prevPapers, paper];
          }
          return prevPapers;
        });
        toast.success('Paper saved to library');

        // Refresh library to sync with backend/localStorage
        setTimeout(() => loadUserLibrary(), 500);
      }
    } catch (error) {
      console.error('Save paper error:', error);
      toast.error('Failed to save paper');
    }
  };

  const handleRemovePaper = async (paperId: string) => {
    try {
      console.log('🗑️ Removing paper:', paperId);
      const result = await literatureAPI.removePaper(paperId);

      if (result.success) {
        // Remove paper from saved list
        setSavedPapers(prevPapers => prevPapers.filter(p => p.id !== paperId));
        toast.success('Paper removed from library');

        // Refresh library to sync with backend/localStorage
        setTimeout(() => loadUserLibrary(), 500);
      }
    } catch (error) {
      console.error('Remove paper error:', error);
      toast.error('Failed to remove paper');
    }
  };

  const handleExtractThemes = async () => {
    if (selectedPapers.size === 0) {
      toast.error('Please select papers to analyze');
      return;
    }

    setAnalyzingThemes(true);
    try {
      const paperIds = Array.from(selectedPapers);

      // Get selected paper objects
      const selectedPaperObjects = papers.filter(p => selectedPapers.has(p.id));

      // Convert papers to SourceContent format for unified theme extraction
      const sources: SourceContent[] = selectedPaperObjects.map(paper => ({
        id: paper.id,
        type: 'paper' as const,
        title: paper.title,
        content: paper.abstract || '',
        keywords: paper.keywords || [],
        ...(paper.doi && { doi: paper.doi }),
        ...(paper.authors && { authors: paper.authors }),
        ...(paper.year && { year: paper.year }),
        ...(paper.url && { url: paper.url }),
      }));

      // Phase 9 Day 20: Use unified theme extraction with full provenance
      const result = await extractUnifiedThemes(sources, {
        maxThemes: 15,
        minConfidence: 0.5,
      });

      if (result && result.themes) {
        setUnifiedThemes(result.themes);
        setActiveTab('themes');
        toast.success(
          `Extracted ${result.themes.length} themes with full provenance from ${paperIds.length} papers`
        );
      } else {
        toast.error('Theme extraction failed');
      }
    } catch (error) {
      toast.error('Theme extraction failed');
    } finally {
      setAnalyzingThemes(false);
    }
  };

  const handleAnalyzeGaps = async () => {
    if (!query) {
      toast.error('Please enter a research field');
      return;
    }

    setAnalyzingGaps(true);
    try {
      const researchGaps = await literatureAPI.analyzeGaps(query, {
        timeRange: 5,
        includeFunding: true,
        includeCollaborations: true,
      });
      setGaps(researchGaps);
      setActiveTab('gaps');
      toast.success(`Identified ${researchGaps.length} research opportunities`);
    } catch (error) {
      toast.error('Gap analysis failed');
    } finally {
      setAnalyzingGaps(false);
    }
  };

  const handleExportCitations = async (format: 'bibtex' | 'ris' | 'apa') => {
    if (selectedPapers.size === 0) {
      toast.error('Please select papers to export');
      return;
    }

    try {
      const paperIds = Array.from(selectedPapers);
      const { content, filename } = await literatureAPI.exportCitations(
        paperIds,
        format
      );

      // Create download link
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(
        `Exported ${paperIds.length} citations as ${format.toUpperCase()}`
      );
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleGenerateStatements = async () => {
    if (unifiedThemes.length === 0) {
      toast.error('Please extract themes first');
      return;
    }

    try {
      const themeNames = unifiedThemes.map(t => t.label);
      const statements = await literatureAPI.generateStatementsFromThemes(
        themeNames,
        { topic: query }
      );
      toast.success(`Generated ${statements.length} Q-statements from themes`);
      // TODO: Navigate to statement builder with generated statements
    } catch (error) {
      toast.error('Statement generation failed');
    }
  };

  const handleSearchAlternativeSources = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (alternativeSources.length === 0) {
      toast.error('Please select at least one alternative source');
      return;
    }

    setLoadingAlternative(true);
    try {
      // PHASE 9 DAY 18: Use enhanced YouTube search with transcription if enabled
      if (alternativeSources.includes('youtube') && transcriptionOptions.includeTranscripts) {
        const youtubeResults = await literatureAPI.searchYouTubeWithTranscription(
          query,
          transcriptionOptions
        );

        // Get results from other sources
        const otherSources = alternativeSources.filter(s => s !== 'youtube');
        let otherResults: any[] = [];
        if (otherSources.length > 0) {
          otherResults = await literatureAPI.searchAlternativeSources(
            query,
            otherSources
          );
        }

        const allResults = [...(youtubeResults.videos || []), ...otherResults];
        setAlternativeResults(allResults);

        if (youtubeResults.transcriptionCost) {
          toast.success(
            `Found ${allResults.length} results (Transcription cost: $${youtubeResults.transcriptionCost.toFixed(2)})`
          );
        } else {
          toast.success(`Found ${allResults.length} results`);
        }
      } else {
        // Standard search without transcription
        const results = await literatureAPI.searchAlternativeSources(
          query,
          alternativeSources
        );
        setAlternativeResults(results);
        toast.success(
          `Found ${results.length} results from ${alternativeSources.length} alternative sources`
        );
      }
    } catch (error) {
      toast.error('Alternative sources search failed');
      console.error('Alternative search error:', error);
    } finally {
      setLoadingAlternative(false);
    }
  };

  /**
   * PHASE 9 DAY 13: Search social media platforms
   * Includes sentiment analysis and engagement-weighted synthesis
   */
  const handleSearchSocialMedia = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (socialPlatforms.length === 0) {
      toast.error('Please select at least one social media platform');
      return;
    }

    setLoadingSocial(true);
    try {
      console.log('🔍 Social Media Search:', query, 'Platforms:', socialPlatforms);

      const results = await literatureAPI.searchSocialMedia(
        query,
        socialPlatforms
      );

      setSocialResults(results);

      // Generate insights from results
      if (results.length > 0) {
        const insights = await literatureAPI.getSocialMediaInsights(results);
        setSocialInsights(insights);

        toast.success(
          `Found ${results.length} posts from ${socialPlatforms.length} platforms with sentiment analysis`
        );
      } else {
        toast.info('No social media results found. Try different platforms or queries.');
      }
    } catch (error) {
      toast.error('Social media search failed');
      console.error('Social media search error:', error);
    } finally {
      setLoadingSocial(false);
    }
  };

  /**
   * MASTER SEARCH: Search all selected sources (main + alternative + social)
   * Provides unified search experience across all panels
   */
  const handleSearchAllSources = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    const hasMainSources = filters.sources.length > 0;
    const hasAltSources = alternativeSources.length > 0;
    const hasSocialSources = socialPlatforms.length > 0;

    if (!hasMainSources && !hasAltSources && !hasSocialSources) {
      toast.error('Please select at least one source to search');
      return;
    }

    // Execute all searches in parallel
    const searchPromises: Promise<void>[] = [];

    if (hasMainSources) {
      searchPromises.push(handleSearch());
    }

    if (hasAltSources) {
      searchPromises.push(handleSearchAlternativeSources());
    }

    if (hasSocialSources) {
      searchPromises.push(handleSearchSocialMedia());
    }

    await Promise.allSettled(searchPromises);

    const totalSources =
      (hasMainSources ? filters.sources.length : 0) +
      (hasAltSources ? alternativeSources.length : 0) +
      (hasSocialSources ? socialPlatforms.length : 0);

    toast.success(`🔍 Comprehensive search completed across ${totalSources} sources!`);
  };

  const togglePaperSelection = (paperId: string) => {
    const newSelected = new Set(selectedPapers);
    if (newSelected.has(paperId)) {
      newSelected.delete(paperId);
    } else {
      newSelected.add(paperId);
    }
    setSelectedPapers(newSelected);
  };

  const PaperCard = ({ paper }: { paper: Paper }) => {
    const isSelected = selectedPapers.has(paper.id);
    const isSaved = savedPapers.some(p => p.id === paper.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer',
          isSelected && 'border-blue-500 bg-blue-50/50'
        )}
        onClick={() => togglePaperSelection(paper.id)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center mt-1',
                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight">
                  {paper.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {paper.authors?.slice(0, 3).join(', ')}
                  {paper.authors?.length > 3 &&
                    ` +${paper.authors.length - 3} more`}
                </p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {paper.year}
                  </span>
                  {paper.venue && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {paper.venue}
                    </span>
                  )}
                  {paper.citationCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {paper.citationCount} citations
                    </span>
                  )}
                </div>
                {paper.abstract && (
                  <p className="mt-3 text-sm text-gray-700 line-clamp-3">
                    {paper.abstract}
                  </p>
                )}
                {paper.keywords && paper.keywords.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {paper.keywords.slice(0, 5).map(keyword => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="text-xs"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
                <div
                  className="flex gap-2 mt-4"
                  onClick={e => e.stopPropagation()}
                >
                  {paper.doi && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(`https://doi.org/${paper.doi}`, '_blank')
                      }
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Paper
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={isSaved ? 'secondary' : 'outline'}
                    onClick={e => {
                      e.stopPropagation();
                      isSaved
                        ? handleRemovePaper(paper.id)
                        : handleSavePaper(paper);
                    }}
                  >
                    <Star
                      className={cn('w-3 h-3 mr-1', isSaved && 'fill-current')}
                    />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Literature Discovery</h1>
          <p className="text-gray-600 mt-1">
            Search and analyze academic literature to build your research
            foundation
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="py-2 px-4">
            <Database className="w-4 h-4 mr-2" />
            {totalResults} papers found
          </Badge>
          <Badge variant="outline" className="py-2 px-4">
            <Check className="w-4 h-4 mr-2" />
            {selectedPapers.size} selected
          </Badge>
          <Badge variant="outline" className="py-2 px-4">
            <Star className="w-4 h-4 mr-2" />
            {savedPapers.length} saved
          </Badge>
        </div>
      </div>

      {/* Search Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Multi-Database Literature Search</span>
            <div className="flex gap-2">
              <Badge variant={filters.includeAIMode ? 'default' : 'secondary'}>
                <Sparkles className="w-3 h-3 mr-1" />
                AI Mode {filters.includeAIMode ? 'ON' : 'OFF'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Enter keywords, research questions, or topics..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchAllSources()}
                className="pl-10 pr-4 h-12 text-lg"
              />
            </div>
            <Button
              onClick={handleSearchAllSources}
              disabled={loading || loadingAlternative || loadingSocial}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {(loading || loadingAlternative || loadingSocial) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search All Sources
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {showFilters ? (
                <X className="w-4 h-4 ml-1" />
              ) : (
                <ChevronRight className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: Select sources below, then click "Search All Sources" for comprehensive results across main databases, alternative sources, and social media
          </p>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 pt-4 border-t"
              >
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Year Range</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={filters.yearFrom}
                        onChange={e =>
                          setFilters({
                            ...filters,
                            yearFrom: parseInt(e.target.value),
                          })
                        }
                        className="w-24"
                      />
                      <span className="self-center">to</span>
                      <Input
                        type="number"
                        value={filters.yearTo}
                        onChange={e =>
                          setFilters({
                            ...filters,
                            yearTo: parseInt(e.target.value),
                          })
                        }
                        className="w-24"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min Citations</label>
                    <Input
                      type="number"
                      value={filters.citationMin}
                      onChange={e =>
                        setFilters({
                          ...filters,
                          citationMin: parseInt(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={e =>
                        setFilters({
                          ...filters,
                          sortBy: e.target.value as any,
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date">Date (Newest)</option>
                      <option value="citations">Citations</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Main Databases</label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge
                        variant={
                          filters.sources.includes('semantic_scholar')
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const sources = filters.sources.includes(
                            'semantic_scholar'
                          )
                            ? filters.sources.filter(
                                s => s !== 'semantic_scholar'
                              )
                            : [...filters.sources, 'semantic_scholar'];
                          setFilters({ ...filters, sources });
                        }}
                      >
                        Semantic Scholar
                      </Badge>
                      <Badge
                        variant={
                          filters.sources.includes('crossref')
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const sources = filters.sources.includes('crossref')
                            ? filters.sources.filter(s => s !== 'crossref')
                            : [...filters.sources, 'crossref'];
                          setFilters({ ...filters, sources });
                        }}
                      >
                        CrossRef
                      </Badge>
                      <Badge
                        variant={
                          filters.sources.includes('pubmed')
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const sources = filters.sources.includes('pubmed')
                            ? filters.sources.filter(s => s !== 'pubmed')
                            : [...filters.sources, 'pubmed'];
                          setFilters({ ...filters, sources });
                        }}
                      >
                        PubMed
                      </Badge>
                      <Badge
                        variant={
                          filters.sources.includes('arxiv')
                            ? 'default'
                            : 'outline'
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const sources = filters.sources.includes('arxiv')
                            ? filters.sources.filter(s => s !== 'arxiv')
                            : [...filters.sources, 'arxiv'];
                          setFilters({ ...filters, sources });
                        }}
                      >
                        arXiv
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleExtractThemes}
              disabled={selectedPapers.size === 0 || analyzingThemes}
            >
              {analyzingThemes ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Extract Themes ({selectedPapers.size})
            </Button>
            <Button
              variant="outline"
              onClick={handleAnalyzeGaps}
              disabled={!query || analyzingGaps}
            >
              {analyzingGaps ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              Find Research Gaps
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportCitations('bibtex')}
              disabled={selectedPapers.size === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export BibTeX
            </Button>
            {unifiedThemes.length > 0 && (
              <Button onClick={handleGenerateStatements} className="ml-auto">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Q-Statements from Themes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alternative Sources Search */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Alternative Research Sources
            </span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Beta Feature
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Search beyond traditional academic databases: YouTube videos, podcasts,
            GitHub repos, StackOverflow discussions, and preprint servers.
            <span className="block mt-1 text-xs font-medium text-purple-600">
              💡 Use "Search All Sources" above to search everything at once, or use the button below for these sources only
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Alternative Sources
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'youtube', label: 'YouTube', icon: '🎥' },
                { id: 'podcasts', label: 'Podcasts', icon: '🎙️' },
                { id: 'github', label: 'GitHub', icon: '💻' },
                { id: 'stackoverflow', label: 'StackOverflow', icon: '📚' },
                { id: 'biorxiv', label: 'bioRxiv', icon: '🧬' },
                { id: 'arxiv-preprints', label: 'arXiv Preprints', icon: '📄' },
              ].map(source => (
                <Badge
                  key={source.id}
                  variant={
                    alternativeSources.includes(source.id) ? 'default' : 'outline'
                  }
                  className="cursor-pointer py-2 px-4 text-sm"
                  onClick={() => {
                    const newSources = alternativeSources.includes(source.id)
                      ? alternativeSources.filter(s => s !== source.id)
                      : [...alternativeSources, source.id];
                    setAlternativeSources(newSources);
                  }}
                >
                  <span className="mr-2">{source.icon}</span>
                  {source.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* PHASE 9 DAY 18: Multimedia Transcription Options */}
          {alternativeSources.includes('youtube') && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                🎥 YouTube Video Transcription & AI Analysis
                <Badge variant="secondary" className="ml-auto">
                  OpenAI Whisper
                </Badge>
              </h4>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transcriptionOptions.includeTranscripts}
                    onChange={(e) =>
                      setTranscriptionOptions({
                        ...transcriptionOptions,
                        includeTranscripts: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      Include video transcriptions
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Transcribe audio to searchable text (~$0.006/min)
                    </p>
                  </div>
                </label>

                {transcriptionOptions.includeTranscripts && (
                  <label className="flex items-center gap-3 cursor-pointer ml-7">
                    <input
                      type="checkbox"
                      checked={transcriptionOptions.extractThemes}
                      onChange={(e) =>
                        setTranscriptionOptions({
                          ...transcriptionOptions,
                          extractThemes: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        Extract themes with GPT-4
                      </span>
                      <p className="text-xs text-muted-foreground">
                        AI-powered theme extraction (+$0.10-0.50/video)
                      </p>
                    </div>
                  </label>
                )}

                {transcriptionOptions.includeTranscripts && (
                  <div className="ml-7 mt-2 p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <span>💰</span>
                      Estimated cost for 10 videos (~10 min each):
                      <span className="font-bold">
                        ${transcriptionOptions.extractThemes ? '5.00-8.00' : '0.60'}
                      </span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      ✓ All transcriptions cached - pay only once per video
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={handleSearchAlternativeSources}
                disabled={loadingAlternative || alternativeSources.length === 0}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loadingAlternative ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="animate-pulse">Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search These Sources Only
                  </>
                )}
              </Button>
              {alternativeResults.length > 0 && (
                <Badge variant="secondary" className="self-center">
                  {alternativeResults.length} results found
                </Badge>
              )}
            </div>
            {loadingAlternative && (
              <div className="text-sm text-purple-600 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Retrieving from {alternativeSources.join(', ')}...</span>
              </div>
            )}
            {alternativeSources.length === 0 && (
              <p className="text-xs text-orange-600">
                ⚠️ Select at least one source above to enable search
              </p>
            )}
          </div>

          {alternativeResults.length > 0 && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {alternativeResults.map((result, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{result.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {result.authors?.join(', ')}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {result.source}
                      </Badge>
                      {result.abstract && (
                        <p className="text-xs text-gray-700 mt-2 line-clamp-2">
                          {result.abstract}
                        </p>
                      )}
                    </div>
                    {result.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(result.url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PHASE 9 DAY 13: Social Media Intelligence */}
      <Card className="border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Social Media Intelligence
            </span>
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
              🔥 New
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Discover public opinions and research discussions across social media platforms.
            Includes sentiment analysis and engagement-weighted synthesis.
            <span className="block mt-1 text-xs font-medium text-indigo-600">
              💡 Use "Search All Sources" above to search everything at once, or use the button below for these platforms only
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Social Media Platforms
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'twitter', label: 'Twitter/X', icon: '🐦' },
                { id: 'reddit', label: 'Reddit', icon: '🤖' },
                { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
                { id: 'facebook', label: 'Facebook', icon: '👥' },
                { id: 'instagram', label: 'Instagram', icon: '📷' },
                { id: 'tiktok', label: 'TikTok', icon: '🎵' },
              ].map(platform => (
                <Badge
                  key={platform.id}
                  variant={
                    socialPlatforms.includes(platform.id) ? 'default' : 'outline'
                  }
                  className="cursor-pointer py-2 px-4 text-sm"
                  onClick={() => {
                    const newPlatforms = socialPlatforms.includes(platform.id)
                      ? socialPlatforms.filter(p => p !== platform.id)
                      : [...socialPlatforms, platform.id];
                    setSocialPlatforms(newPlatforms);
                  }}
                >
                  <span className="mr-2">{platform.icon}</span>
                  {platform.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={handleSearchSocialMedia}
                disabled={loadingSocial || socialPlatforms.length === 0}
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {loadingSocial ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search These Platforms Only
              </Button>
              {socialResults.length > 0 && (
                <Badge variant="secondary" className="self-center">
                  {socialResults.length} posts analyzed
                </Badge>
              )}
            </div>
            {socialPlatforms.length === 0 && (
              <p className="text-xs text-orange-600">
                ⚠️ Select at least one platform above to enable search
              </p>
            )}
          </div>

          {socialResults.length > 0 && (
            <div className="mt-4 space-y-4">
              {/* Sentiment Insights */}
              {socialInsights && (
                <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Sentiment Analysis
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {socialInsights.sentimentDistribution?.positivePercentage?.toFixed(0) || 0}%
                      </div>
                      <div className="text-xs text-gray-600">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {socialInsights.sentimentDistribution?.neutralPercentage?.toFixed(0) || 0}%
                      </div>
                      <div className="text-xs text-gray-600">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {socialInsights.sentimentDistribution?.negativePercentage?.toFixed(0) || 0}%
                      </div>
                      <div className="text-xs text-gray-600">Negative</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media Posts */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {socialResults.map((post, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {post.platform}
                        </Badge>
                        {post.sentiment && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs',
                              post.sentiment.label === 'positive' && 'bg-green-100 text-green-800',
                              post.sentiment.label === 'negative' && 'bg-red-100 text-red-800',
                              post.sentiment.label === 'neutral' && 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {post.sentiment.label === 'positive' && '😊'}
                            {post.sentiment.label === 'negative' && '😞'}
                            {post.sentiment.label === 'neutral' && '😐'}
                            {post.sentiment.label}
                          </Badge>
                        )}
                        {post.weights && (
                          <Badge variant="secondary" className="text-xs">
                            Influence: {(post.weights.influence * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      {post.url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(post.url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{post.author}</span>
                        {post.authorVerified && <Badge variant="secondary" className="text-xs">✓</Badge>}
                        {post.authorFollowers && (
                          <span className="text-xs text-gray-500">
                            {post.authorFollowers.toLocaleString()} followers
                          </span>
                        )}
                      </div>

                      {post.title && (
                        <h4 className="font-semibold text-sm">{post.title}</h4>
                      )}

                      <p className="text-sm text-gray-700 line-clamp-3">
                        {post.content}
                      </p>

                      {post.engagement && (
                        <div className="flex gap-4 text-xs text-gray-600 mt-2">
                          {post.engagement.likes && (
                            <span>👍 {post.engagement.likes.toLocaleString()}</span>
                          )}
                          {post.engagement.comments && (
                            <span>💬 {post.engagement.comments.toLocaleString()}</span>
                          )}
                          {post.engagement.shares && (
                            <span>🔄 {post.engagement.shares.toLocaleString()}</span>
                          )}
                          {post.engagement.views && (
                            <span>👁️ {post.engagement.views.toLocaleString()}</span>
                          )}
                        </div>
                      )}

                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {post.hashtags.slice(0, 5).map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Sources Transparency */}
      <DatabaseSourcesInfo />

      {/* Results Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">
            Search Results
            {papers.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {papers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="library">
            My Library
            <Badge className="ml-2" variant="secondary">
              {savedPapers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="themes">
            Themes
            {unifiedThemes.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {unifiedThemes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="gaps">
            Research Gaps
            {gaps.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {gaps.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : papers.length > 0 ? (
            <div className="space-y-4">
              {papers.map(paper => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                No papers found. Try adjusting your search query or filters.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          {savedPapers.length > 0 ? (
            savedPapers.map(paper => <PaperCard key={paper.id} paper={paper} />)
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                No saved papers yet. Star papers from search results to add them
                here.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          {unifiedThemes.length > 0 ? (
            unifiedThemes.map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                showProvenanceButton={true}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                Select papers and click "Extract Themes" to identify research
                themes with full provenance tracking.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          {gaps.length > 0 ? (
            gaps.map(gap => (
              <Card key={gap.id} className="border-l-4 border-l-orange-500">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg">{gap.title}</h3>
                  <p className="text-gray-700 mt-2">{gap.description}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Opportunity Score
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full"
                            style={{ width: `${gap.opportunityScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">
                          {Math.round(gap.opportunityScore * 100)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Impact
                      </span>
                      <p className="text-sm mt-1">{gap.potentialImpact}</p>
                    </div>
                  </div>
                  {gap.suggestedMethods && gap.suggestedMethods.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-500">
                        Suggested Methods
                      </span>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {gap.suggestedMethods.map(method => (
                          <Badge key={method} variant="outline">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {gap.fundingOpportunities &&
                    gap.fundingOpportunities.length > 0 && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-gray-500">
                          Funding Opportunities
                        </span>
                        <ul className="list-disc list-inside text-sm mt-2 text-gray-700">
                          {gap.fundingOpportunities.map(funding => (
                            <li key={funding}>{funding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                Click "Find Research Gaps" to identify opportunities in your
                field.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalResults > 20 && activeTab === 'search' && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from(
              { length: Math.min(5, Math.ceil(totalResults / 20)) },
              (_, i) => i + 1
            ).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= Math.ceil(totalResults / 20)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
