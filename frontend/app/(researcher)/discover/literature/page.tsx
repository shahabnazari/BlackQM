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
  Video,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  literatureAPI,
  Paper,
  ResearchGap,
} from '@/lib/services/literature-api.service';
import DatabaseSourcesInfo from '@/components/literature/DatabaseSourcesInfo';
import { ThemeCard } from '@/components/literature/ThemeCard';
import { CrossPlatformDashboard } from '@/components/literature/CrossPlatformDashboard';
import { VideoSelectionPanel } from '@/components/literature/VideoSelectionPanel';
import { YouTubeChannelBrowser } from '@/components/literature/YouTubeChannelBrowser';
import { AISearchAssistant } from '@/components/literature/AISearchAssistant';
import { AcademicInstitutionLogin } from '@/components/literature/AcademicInstitutionLogin';
import { CostCalculator } from '@/components/literature/CostCalculator';
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
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  // const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');

  // Advanced filters
  const [filters, setFilters] = useState({
    yearFrom: 2020 as number | undefined,
    yearTo: new Date().getFullYear() as number | undefined,
    sources: ['semantic_scholar', 'crossref', 'pubmed', 'arxiv'],
    sortBy: 'relevance' as 'relevance' | 'date' | 'citations',
    citationMin: 0,
    minCitations: undefined as number | undefined,
    publicationType: 'all' as 'all' | 'journal' | 'conference' | 'preprint',
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
  const [activeTab, setActiveTab] = useState('results'); // PHASE 9 DAY 24: Changed from 'search' to 'results'

  // Alternative sources state
  const [alternativeSources, setAlternativeSources] = useState<string[]>([]);
  const [alternativeResults, setAlternativeResults] = useState<any[]>([]);
  const [loadingAlternative, setLoadingAlternative] = useState(false);

  // YouTube video selection state
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);

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

  // PHASE 9 DAY 20.5: Transcribed videos state
  const [transcribedVideos, setTranscribedVideos] = useState<{
    id: string;
    title: string;
    sourceId: string; // YouTube video ID
    url: string;
    channel?: string;
    duration: number; // in seconds
    cost: number; // transcription cost
    transcript: string;
    themes?: any[];
    extractedAt: string;
    cached: boolean; // whether this was cached (no cost)
  }[]>([]);

  // PHASE 9 DAY 24: UX Reorganization - Panel and tab navigation state
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null); // Which panel section is expanded
  const [activeResultsSubTab, setActiveResultsSubTab] = useState<'papers' | 'videos' | 'library'>('papers');
  const [activeAnalysisSubTab, setActiveAnalysisSubTab] = useState<'themes' | 'gaps' | 'synthesis'>('themes');

  // PHASE 9 DAY 25: Academic categorization - New state for institution auth and database selection
  const [academicDatabases, setAcademicDatabases] = useState<string[]>([
    'pubmed',
    'semantic_scholar',
    'crossref',
    'arxiv',
  ]);
  const [institutionAuth, setInstitutionAuth] = useState<{
    isAuthenticated: boolean;
    institution: any | null;
    authMethod: 'shibboleth' | 'openathens' | 'orcid' | null;
    userName?: string;
    freeAccess: boolean;
    accessibleDatabases: string[];
  }>({
    isAuthenticated: false,
    institution: null,
    authMethod: null,
    freeAccess: false,
    accessibleDatabases: [],
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
        ...(filters.yearFrom && { yearFrom: filters.yearFrom }),
        ...(filters.yearTo && { yearTo: filters.yearTo }),
        ...(filters.minCitations && { minCitations: filters.minCitations }),
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
        setActiveTab('results'); // PHASE 9 DAY 24: Switch to results tab
        setActiveResultsSubTab('papers'); // Show papers sub-tab
        console.log(
          '✅ Papers state updated with',
          result.papers.length,
          'papers'
        );
        console.log('📑 Active tab set to:', 'results');
        toast.success(
          `Found ${result.total} papers across ${filters.sources.length} databases`
        );
      } else {
        console.warn('⚠️ No papers in result');
        setPapers([]);
        setTotalResults(0);
        setActiveTab('results'); // PHASE 9 DAY 24: Switch to results tab
        setActiveResultsSubTab('papers'); // Show papers sub-tab
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
    // PHASE 9 DAY 20.5: Unified extraction from papers AND videos
    const totalSources = selectedPapers.size + transcribedVideos.length;

    if (totalSources === 0) {
      toast.error('Please select papers or transcribe videos to analyze');
      return;
    }

    setAnalyzingThemes(true);
    try {
      const paperIds = Array.from(selectedPapers);

      // Get selected paper objects
      const selectedPaperObjects = papers.filter(p => selectedPapers.has(p.id));

      // Convert papers to SourceContent format for unified theme extraction
      const paperSources: SourceContent[] = selectedPaperObjects.map(paper => ({
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

      // PHASE 9 DAY 20.5: Add transcribed videos to sources
      const videoSources: SourceContent[] = transcribedVideos.map(video => ({
        id: video.id,
        type: 'youtube' as const,
        title: video.title,
        content: video.transcript,
        keywords: video.themes?.map((t: any) => t.label || t) || [],
        url: video.url,
        metadata: {
          videoId: video.sourceId,
          duration: video.duration,
          channel: video.channel,
        },
      }));

      // Combine all sources
      const allSources = [...paperSources, ...videoSources];

      // Phase 9 Day 20: Use unified theme extraction with full provenance
      const result = await extractUnifiedThemes(allSources, {
        maxThemes: 15,
        minConfidence: 0.5,
      });

      if (result && result.themes) {
        setUnifiedThemes(result.themes);
        setActiveTab('analysis'); // PHASE 9 DAY 24: Switch to analysis tab
        setActiveAnalysisSubTab('themes'); // Show themes sub-tab
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
      setActiveTab('analysis'); // PHASE 9 DAY 24: Switch to analysis tab
      setActiveAnalysisSubTab('gaps'); // Show gaps sub-tab
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

      // Store statements in session storage for study creation page
      sessionStorage.setItem('generatedStatements', JSON.stringify(statements));
      sessionStorage.setItem('statementSource', JSON.stringify({
        type: 'themes',
        query,
        themeCount: unifiedThemes.length,
        timestamp: new Date().toISOString(),
      }));

      toast.success(`Generated ${statements.length} Q-statements from themes`);

      // Navigate to study creation page with generated statements
      window.location.href = '/create/study?from=literature&statementsReady=true';
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
      if (
        alternativeSources.includes('youtube') &&
        transcriptionOptions.includeTranscripts
      ) {
        const youtubeResults =
          await literatureAPI.searchYouTubeWithTranscription(
            query,
            transcriptionOptions
          );

        // PHASE 9 DAY 20.5: Store transcribed videos separately
        if (youtubeResults.transcripts && youtubeResults.transcripts.length > 0) {
          const newTranscriptions = youtubeResults.transcripts.map((transcript: any) => ({
            id: transcript.id || transcript.videoId,
            title: transcript.title || 'Untitled Video',
            sourceId: transcript.videoId,
            url: `https://www.youtube.com/watch?v=${transcript.videoId}`,
            channel: transcript.channel,
            duration: transcript.duration || 0,
            cost: transcript.cost || 0,
            transcript: transcript.transcript || transcript.text || '',
            themes: transcript.themes || [],
            extractedAt: transcript.extractedAt || new Date().toISOString(),
            cached: transcript.cached || false,
          }));

          setTranscribedVideos(prev => [...prev, ...newTranscriptions]);

          // Auto-switch to transcriptions tab
          setActiveTab('transcriptions');
        }

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

        // Extract YouTube videos for VideoSelectionPanel
        if (youtubeResults.videos && youtubeResults.videos.length > 0) {
          setYoutubeVideos(youtubeResults.videos);
        }

        if (youtubeResults.transcriptionCost) {
          toast.success(
            `Found ${allResults.length} results. ${youtubeResults.transcripts?.length || 0} videos transcribed ($${youtubeResults.transcriptionCost.toFixed(2)})`
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

        // Extract YouTube videos if present
        if (alternativeSources.includes('youtube')) {
          const youtubeResults = results.filter((r: any) => r.source === 'youtube');
          if (youtubeResults.length > 0) {
            setYoutubeVideos(youtubeResults);
          }
        }

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
      console.log(
        '🔍 Social Media Search:',
        query,
        'Platforms:',
        socialPlatforms
      );

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
        toast.info(
          'No social media results found. Try different platforms or queries.'
        );
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

    toast.success(
      `🔍 Comprehensive search completed across ${totalSources} sources!`
    );
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

      {/* PHASE 9 DAY 25.1: Global Search Bar - Searches ALL Sources */}
      <Card className="border-2 border-gradient-to-r from-blue-500 to-purple-500 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Universal Search
            </h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Searches all selected sources below
            </Badge>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                placeholder="Search across academic databases, alternative sources, and social media..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchAllSources()}
                className="pl-14 pr-4 h-14 text-lg border-2 focus:border-blue-500"
              />
            </div>
            <Button
              onClick={handleSearchAllSources}
              disabled={loading || loadingAlternative || loadingSocial}
              className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              size="lg"
            >
              {loading || loadingAlternative || loadingSocial ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search All Sources
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className={cn(
                'h-14 px-6 border-2',
                showAIAssistant && 'bg-purple-100 border-purple-500'
              )}
            >
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              AI Assistant
              {showAIAssistant && <Check className="w-4 h-4 ml-2 text-purple-600" />}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-14 px-6 border-2"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {showFilters ? (
                <X className="w-4 h-4 ml-2" />
              ) : (
                <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>

          {/* Active Sources Indicator */}
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
            <span className="font-medium">Active sources:</span>
            {academicDatabases.length > 0 && (
              <Badge variant="outline" className="bg-blue-50">
                {academicDatabases.length} Academic
              </Badge>
            )}
            {alternativeSources.length > 0 && (
              <Badge variant="outline" className="bg-indigo-50">
                {alternativeSources.length} Alternative
              </Badge>
            )}
            {socialPlatforms.length > 0 && (
              <Badge variant="outline" className="bg-purple-50">
                {socialPlatforms.length} Social Media
              </Badge>
            )}
            {academicDatabases.length === 0 && alternativeSources.length === 0 && socialPlatforms.length === 0 && (
              <span className="text-orange-600">⚠️ No sources selected - please select sources below</span>
            )}
          </div>

          {/* AI Assistant Panel */}
          <AnimatePresence>
            {showAIAssistant && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t"
              >
                <AISearchAssistant
                  initialQuery={query}
                  onQueryChange={setQuery}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 pt-4 border-t mt-4"
              >
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Year Range</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="From"
                        value={filters.yearFrom}
                        onChange={e =>
                          setFilters({
                            ...filters,
                            yearFrom: parseInt(e.target.value) || undefined,
                          })
                        }
                        className="w-full"
                      />
                      <Input
                        type="number"
                        placeholder="To"
                        value={filters.yearTo}
                        onChange={e =>
                          setFilters({
                            ...filters,
                            yearTo: parseInt(e.target.value) || undefined,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min Citations</label>
                    <Input
                      type="number"
                      placeholder="e.g., 10"
                      value={filters.minCitations}
                      onChange={e =>
                        setFilters({
                          ...filters,
                          minCitations: parseInt(e.target.value) || undefined,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Publication Type</label>
                    <select
                      value={filters.publicationType}
                      onChange={e =>
                        setFilters({
                          ...filters,
                          publicationType: e.target.value as any,
                        })
                      }
                      className="mt-1 w-full h-10 px-3 border rounded-md"
                    >
                      <option value="all">All Types</option>
                      <option value="journal">Journal Articles</option>
                      <option value="conference">Conference Papers</option>
                      <option value="preprint">Preprints</option>
                    </select>
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
                      className="mt-1 w-full h-10 px-3 border rounded-md"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="citations">Citations</option>
                      <option value="date">Date (Newest)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFilters({
                        yearFrom: 2020,
                        yearTo: new Date().getFullYear(),
                        sources: ['semantic_scholar', 'crossref', 'pubmed', 'arxiv'],
                        sortBy: 'relevance',
                        citationMin: 0,
                        minCitations: undefined,
                        publicationType: 'all',
                        includeAIMode: true,
                      })
                    }
                  >
                    Reset Filters
                  </Button>
                  <Button onClick={handleSearchAllSources}>
                    Apply Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* PHASE 9 DAY 25: Panel 1 - Academic Resources & Institutional Access */}
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
          {/* PHASE 9 DAY 25: Academic Database Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Academic Databases
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                // Free & Open Access
                { id: 'pubmed', label: 'PubMed', icon: '🏥', desc: 'Medical/life sciences - FREE', category: 'Free' },
                { id: 'pmc', label: 'PubMed Central', icon: '📖', desc: 'Free full-text articles', category: 'Free' },
                { id: 'arxiv', label: 'ArXiv', icon: '📐', desc: 'Physics/Math/CS preprints - FREE', category: 'Free' },
                { id: 'biorxiv', label: 'bioRxiv', icon: '🧬', desc: 'Biology preprints - FREE', category: 'Free' },
                { id: 'semantic_scholar', label: 'Semantic Scholar', icon: '🎓', desc: 'CS/interdisciplinary - FREE', category: 'Free' },

                // Multidisciplinary Premium
                { id: 'web_of_science', label: 'Web of Science', icon: '🌐', desc: 'Multidisciplinary citation index', category: 'Premium' },
                { id: 'scopus', label: 'Scopus', icon: '🔬', desc: 'Multidisciplinary abstract/citation', category: 'Premium' },
                { id: 'crossref', label: 'CrossRef', icon: '🔗', desc: 'DOI database registry', category: 'Free' },

                // Subject-Specific
                { id: 'ieee', label: 'IEEE Xplore', icon: '⚡', desc: 'Engineering/tech/CS', category: 'Premium' },
                { id: 'jstor', label: 'JSTOR', icon: '📚', desc: 'Humanities/social sciences', category: 'Premium' },
                { id: 'springer', label: 'SpringerLink', icon: '📕', desc: 'STM & social sciences', category: 'Premium' },
                { id: 'nature', label: 'Nature', icon: '🔬', desc: 'Science journals', category: 'Premium' },
                { id: 'wiley', label: 'Wiley Online', icon: '📘', desc: 'Multidisciplinary', category: 'Premium' },
                { id: 'elsevier', label: 'ScienceDirect', icon: '🔵', desc: 'Elsevier journals', category: 'Premium' },
                { id: 'psycinfo', label: 'PsycINFO', icon: '🧠', desc: 'Psychology/behavioral sciences', category: 'Premium' },
                { id: 'eric', label: 'ERIC', icon: '🎓', desc: 'Education research - FREE', category: 'Free' },
              ].map(source => (
                <Badge
                  key={source.id}
                  variant={academicDatabases.includes(source.id) ? 'default' : 'outline'}
                  className="cursor-pointer py-2 px-4 text-sm hover:scale-105 transition-transform"
                  onClick={() => {
                    const newDatabases = academicDatabases.includes(source.id)
                      ? academicDatabases.filter(s => s !== source.id)
                      : [...academicDatabases, source.id];
                    setAcademicDatabases(newDatabases);
                  }}
                  title={source.desc}
                >
                  <span className="mr-2">{source.icon}</span>
                  {source.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {academicDatabases.length} database{academicDatabases.length !== 1 ? 's' : ''} selected
              {academicDatabases.length === 0 && ' (select at least one)'}
            </p>
          </div>

          {/* PHASE 9 DAY 25: Institution Login */}
          <AcademicInstitutionLogin
            currentAuth={institutionAuth}
            onAuthChange={setInstitutionAuth}
          />

          {/* PHASE 9 DAY 25: Cost Calculator */}
          <CostCalculator
            selectedPapers={selectedPapers}
            papers={papers}
            institutionAccessActive={institutionAuth.freeAccess}
            onLoginClick={() => {
              // Scroll to institution login section
              toast.info('Scroll up to login with your institution');
            }}
          />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleExtractThemes}
              disabled={(selectedPapers.size === 0 && transcribedVideos.length === 0) || analyzingThemes}
              className="flex items-center gap-2"
            >
              {analyzingThemes ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              <span>Extract Themes from All Sources</span>
              {(selectedPapers.size > 0 || transcribedVideos.length > 0) && (
                <div className="flex gap-1">
                  {selectedPapers.size > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedPapers.size} papers
                    </Badge>
                  )}
                  {transcribedVideos.length > 0 && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900">
                      {transcribedVideos.length} videos
                    </Badge>
                  )}
                </div>
              )}
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

      {/* PHASE 9 DAY 25: Panel 2 - Alternative Knowledge Sources */}
      <Card className="border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-600" />
              Alternative Knowledge Sources
            </span>
            <Badge
              variant="secondary"
              className="bg-indigo-100 text-indigo-700"
            >
              Expert Insights
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Discover expert knowledge beyond traditional academic databases: podcasts, technical documentation, and community expertise
            <span className="block mt-1 text-xs font-medium text-indigo-600">
              💡 All sources are free and open-access
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
                { id: 'podcasts', label: 'Podcasts', icon: '🎙️', desc: 'Expert interviews & discussions' },
                { id: 'github', label: 'GitHub', icon: '💻', desc: 'Code & datasets' },
                { id: 'stackoverflow', label: 'StackOverflow', icon: '📚', desc: 'Technical Q&A' },
                { id: 'medium', label: 'Medium', icon: '📝', desc: 'Practitioner insights' },
              ].map(source => (
                <Badge
                  key={source.id}
                  variant={
                    alternativeSources.includes(source.id)
                      ? 'default'
                      : 'outline'
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

          {/* PHASE 9 DAY 25: Conditional sections for Alternative Sources */}
          {alternativeSources.includes('podcasts') && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                🎙️ Podcast Search
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Search for research podcasts, expert interviews, and academic discussions
              </p>
              <Input placeholder="Search podcasts..." className="mb-2" />
              <p className="text-xs text-gray-500">
                Coming soon: Integration with Apple Podcasts, Spotify, and Google Podcasts
              </p>
            </div>
          )}

          {alternativeSources.includes('github') && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                💻 GitHub Repository Browser
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Find code implementations, datasets, and technical documentation
              </p>
              <Input placeholder="Search repositories..." className="mb-2" />
              <p className="text-xs text-gray-500">
                Coming soon: GitHub API integration for code search and dataset discovery
              </p>
            </div>
          )}

          {alternativeSources.includes('stackoverflow') && (
            <div className="border rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                📚 StackOverflow Search
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Search technical Q&A and community knowledge
              </p>
              <Input placeholder="Search questions..." className="mb-2" />
              <p className="text-xs text-gray-500">
                Coming soon: StackOverflow API integration for technical problem-solving
              </p>
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

      {/* PHASE 9 DAY 25: Panel 3 - Social Media Intelligence (with YouTube moved here) */}
      <Card className="border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Social Media Intelligence
            </span>
            <Badge
              variant="secondary"
              className="bg-indigo-100 text-indigo-700"
            >
              🔥 New
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Research social media platforms for trends, public opinion, and content analysis. Each platform unlocks specific research tools.
            <span className="block mt-1 text-xs font-medium text-pink-600">
              💡 Select a platform below to see available research options
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
                { id: 'youtube', label: 'YouTube', icon: '🎥', color: 'red' },
                { id: 'instagram', label: 'Instagram', icon: '📸', color: 'pink' },
                { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'cyan' },
                { id: 'twitter', label: 'Twitter/X', icon: '🐦', color: 'blue' },
              ].map(platform => (
                <Badge
                  key={platform.id}
                  variant={
                    socialPlatforms.includes(platform.id)
                      ? 'default'
                      : 'outline'
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

          {/* PHASE 9 DAY 25: Conditional YouTube Section */}
          {socialPlatforms.includes('youtube') && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-red-50 to-purple-50 dark:from-red-900/20 dark:to-purple-900/20 rounded-lg border-2 border-red-200">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Video className="w-4 h-4 text-red-600" />
                🎥 YouTube Video Research & Transcription
                <Badge variant="secondary" className="ml-auto bg-red-100 text-red-700">
                  AI-Powered
                </Badge>
              </h4>

              {/* Transcription options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transcriptionOptions.includeTranscripts}
                    onChange={e =>
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
                  <div className="ml-7 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200">
                    <p className="text-xs font-medium text-red-800 dark:text-red-200">
                      💰 Estimated cost: $0.60 for 10 videos (~10 min each)
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      ✓ All transcriptions cached - pay only once per video
                    </p>
                  </div>
                )}
              </div>

              {/* YouTube Channel Browser (collapsible) */}
              <div className="pt-2 border-t border-red-200">
                <Button
                  variant="ghost"
                  onClick={() => setExpandedPanel(expandedPanel === 'youtube-browser' ? null : 'youtube-browser')}
                  className="w-full justify-between hover:bg-red-100"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4 text-red-600" />
                    Browse YouTube Channels
                  </span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    expandedPanel === 'youtube-browser' && "rotate-90"
                  )} />
                </Button>
                <AnimatePresence>
                  {expandedPanel === 'youtube-browser' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      <YouTubeChannelBrowser
                        onVideosSelected={(videos) => {
                          setYoutubeVideos(prev => {
                            const existingIds = new Set(prev.map((v: any) => v.videoId || v.id));
                            const newVideos = videos.filter(v => !existingIds.has(v.videoId));
                            if (newVideos.length === 0) {
                              toast.info('All selected videos are already in the queue');
                              return prev;
                            }
                            toast.success(`Added ${newVideos.length} videos to selection queue`);
                            setExpandedPanel('video-selection');
                            return [...prev, ...newVideos];
                          });
                        }}
                        researchContext={query}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Video Selection Panel (collapsible) */}
              <div className="pt-2 border-t border-red-200">
                <Button
                  variant="ghost"
                  onClick={() => setExpandedPanel(expandedPanel === 'video-selection' ? null : 'video-selection')}
                  className="w-full justify-between hover:bg-red-100"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-red-600" />
                    Video Selection Queue
                    {youtubeVideos.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {youtubeVideos.length}
                      </Badge>
                    )}
                  </span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    expandedPanel === 'video-selection' && "rotate-90"
                  )} />
                </Button>
                <AnimatePresence>
                  {expandedPanel === 'video-selection' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      {youtubeVideos.length > 0 ? (
                        <VideoSelectionPanel
                          videos={youtubeVideos.map((video: any) => ({
                            videoId: video.videoId || video.id,
                            title: video.title,
                            description: video.description || '',
                            channelName: video.channelName || video.channel || '',
                            channelId: video.channelId || '',
                            thumbnailUrl: video.thumbnailUrl || video.thumbnail || 'https://via.placeholder.com/320x180',
                            duration: video.duration || 0,
                            viewCount: video.viewCount || video.views || 0,
                            publishedAt: video.publishedAt ? new Date(video.publishedAt) : new Date(),
                            relevanceScore: video.relevanceScore,
                            isTranscribed: video.isTranscribed || false,
                            transcriptionStatus: video.transcriptionStatus || 'not_started',
                            cachedTranscript: video.cachedTranscript || false,
                          }))}
                          researchContext={query}
                          onTranscribe={async (videoIds) => {
                            try {
                              toast.info(`Starting transcription for ${videoIds.length} videos...`);
                              const result = await literatureAPI.searchYouTubeWithTranscription(query, {
                                ...transcriptionOptions,
                                includeTranscripts: true,
                                maxResults: videoIds.length,
                              });
                              if (result.transcripts && result.transcripts.length > 0) {
                                const newTranscriptions = result.transcripts.map((transcript: any) => ({
                                  id: transcript.id || transcript.videoId,
                                  title: transcript.title || 'Untitled Video',
                                  sourceId: transcript.videoId,
                                  url: `https://www.youtube.com/watch?v=${transcript.videoId}`,
                                  channel: transcript.channel,
                                  duration: transcript.duration || 0,
                                  cost: transcript.cost || 0,
                                  transcript: transcript.transcript || transcript.text || '',
                                  themes: transcript.themes || [],
                                  extractedAt: transcript.extractedAt || new Date().toISOString(),
                                  cached: transcript.cached || false,
                                }));
                                setTranscribedVideos(prev => [...prev, ...newTranscriptions]);
                                toast.success(`Successfully transcribed ${result.transcripts.length} videos`);
                                setActiveTab('results');
                                setActiveResultsSubTab('videos');
                              } else {
                                toast.error('Transcription failed - no results returned');
                              }
                            } catch (error) {
                              console.error('Transcription error:', error);
                              toast.error('Failed to transcribe videos. Please try again.');
                            }
                          }}
                          isLoading={loadingAlternative}
                        />
                      ) : (
                        <div className="text-center py-6 text-gray-500 border border-dashed rounded-lg bg-white">
                          <Video className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs">No videos in queue</p>
                          <p className="text-xs mt-1">Browse channels to add videos</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* PHASE 9 DAY 25: Conditional Instagram Section */}
          {socialPlatforms.includes('instagram') && (
            <div className="p-4 bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-lg border-2 border-pink-200">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                📸 Instagram Research
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Manual upload, hashtag trends, and profile analysis
              </p>
              <p className="text-xs text-gray-500">
                Coming soon: Instagram research tools
              </p>
            </div>
          )}

          {/* PHASE 9 DAY 25: Conditional TikTok Section */}
          {socialPlatforms.includes('tiktok') && (
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border-2 border-cyan-200">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                🎵 TikTok Research
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Hashtag search, trend analysis, and content discovery
              </p>
              <p className="text-xs text-gray-500">
                Coming soon: TikTok research tools
              </p>
            </div>
          )}

          {/* Show empty state when no platform selected */}
          {socialPlatforms.length === 0 && (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium mb-2">Select a platform above</p>
              <p className="text-sm">Choose YouTube, Instagram, TikTok, or Twitter to see research options</p>
            </div>
          )}

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
                        {socialInsights.sentimentDistribution?.positivePercentage?.toFixed(
                          0
                        ) || 0}
                        %
                      </div>
                      <div className="text-xs text-gray-600">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {socialInsights.sentimentDistribution?.neutralPercentage?.toFixed(
                          0
                        ) || 0}
                        %
                      </div>
                      <div className="text-xs text-gray-600">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {socialInsights.sentimentDistribution?.negativePercentage?.toFixed(
                          0
                        ) || 0}
                        %
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
                              post.sentiment.label === 'positive' &&
                                'bg-green-100 text-green-800',
                              post.sentiment.label === 'negative' &&
                                'bg-red-100 text-red-800',
                              post.sentiment.label === 'neutral' &&
                                'bg-gray-100 text-gray-800'
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
                            Influence:{' '}
                            {(post.weights.influence * 100).toFixed(0)}%
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
                        {post.authorVerified && (
                          <Badge variant="secondary" className="text-xs">
                            ✓
                          </Badge>
                        )}
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
                            <span>
                              👍 {post.engagement.likes.toLocaleString()}
                            </span>
                          )}
                          {post.engagement.comments && (
                            <span>
                              💬 {post.engagement.comments.toLocaleString()}
                            </span>
                          )}
                          {post.engagement.shares && (
                            <span>
                              🔄 {post.engagement.shares.toLocaleString()}
                            </span>
                          )}
                          {post.engagement.views && (
                            <span>
                              👁️ {post.engagement.views.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {post.hashtags
                            .slice(0, 5)
                            .map((tag: string, i: number) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
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

      {/* PHASE 9 DAY 26: Unified Theme Extraction Visual Guide */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  🔬 Unified Theme Extraction from All Sources
                </h3>
                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                  AI-Powered
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Extract cross-cutting research themes from academic papers, YouTube videos, Instagram posts, and alternative sources.
                AI analyzes all selected content to identify patterns, key concepts, and emerging trends with full provenance tracking.
              </p>

              {/* Visual Workflow */}
              <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  1. Select Papers
                </Badge>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  2. Transcribe Videos
                </Badge>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                  3. Add Alt Sources
                </Badge>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <Badge variant="outline" className="bg-green-50 text-green-700 font-semibold">
                  4. Extract Themes
                </Badge>
              </div>

              {/* How It Works */}
              <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">How it works:</span> AI combines content from all sources →
                    Analyzes text using NLP → Identifies recurring concepts → Groups related ideas into themes →
                    Tracks which sources contributed to each theme → Generates confidence scores and evidence citations.
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="text-sm">
                  <span className="font-semibold text-blue-600">{selectedPapers.size}</span>
                  <span className="text-gray-500 ml-1">papers selected</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-purple-600">{transcribedVideos.length}</span>
                  <span className="text-gray-500 ml-1">videos transcribed</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleExtractThemes}
                  disabled={(selectedPapers.size === 0 && transcribedVideos.length === 0) || analyzingThemes}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                >
                  {analyzingThemes ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Extracting Themes...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Extract Themes from {selectedPapers.size + transcribedVideos.length} Sources
                    </>
                  )}
                </Button>

                {unifiedThemes.length > 0 && (
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    ✓ {unifiedThemes.length} themes extracted
                  </Badge>
                )}
              </div>

              {(selectedPapers.size === 0 && transcribedVideos.length === 0) && (
                <Alert className="mt-4 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Select papers from search results above or transcribe YouTube videos to begin theme extraction
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PHASE 9 DAY 24: Consolidated Results Tabs (9 → 3 tabs) */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 h-14">
          <TabsTrigger value="results" className="flex-col h-full">
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Results & Library
            </span>
            {(papers.length + transcribedVideos.length + savedPapers.length) > 0 && (
              <Badge className="mt-1" variant="secondary">
                {papers.length + transcribedVideos.length + savedPapers.length} total
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex-col h-full">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analysis & Insights
            </span>
            {(unifiedThemes.length + gaps.length) > 0 && (
              <Badge className="mt-1" variant="secondary">
                {unifiedThemes.length + gaps.length} insights
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transcriptions" className="flex-col h-full">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Transcriptions
            </span>
            {transcribedVideos.length > 0 && (
              <Badge className="mt-1" variant="secondary">
                {transcribedVideos.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* PHASE 9 DAY 24: Tab 1 - Results & Library (with sub-navigation) */}
        <TabsContent value="results" className="space-y-4">
          {/* Sub-navigation for Results */}
          <div className="flex gap-2 border-b pb-2">
            <Button
              variant={activeResultsSubTab === 'papers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveResultsSubTab('papers')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Papers
              {papers.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {papers.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeResultsSubTab === 'videos' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveResultsSubTab('videos')}
            >
              <Video className="w-4 h-4 mr-2" />
              Videos
              {transcribedVideos.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {transcribedVideos.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeResultsSubTab === 'library' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveResultsSubTab('library')}
            >
              <Star className="w-4 h-4 mr-2" />
              Library
              <Badge className="ml-2" variant="secondary">
                {savedPapers.length}
              </Badge>
            </Button>
          </div>

          {/* Papers sub-tab */}
          {activeResultsSubTab === 'papers' && (
            <>
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
                  <p>No papers found. Try adjusting your search query or filters.</p>
                </div>
              )}
            </>
          )}

          {/* Videos sub-tab */}
          {activeResultsSubTab === 'videos' && (
            <>
              {transcribedVideos.length > 0 ? (
                <div className="space-y-4">
                  {transcribedVideos.map(video => (
                    <Card key={video.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold">{video.title}</CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {video.channel && <span>{video.channel}</span>}
                              <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')} min</span>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => window.open(video.url, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No transcribed videos yet</p>
                </div>
              )}
            </>
          )}

          {/* Library sub-tab */}
          {activeResultsSubTab === 'library' && (
            <>
              {savedPapers.length > 0 ? (
                savedPapers.map(paper => <PaperCard key={paper.id} paper={paper} />)
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No saved papers yet. Star papers from search results to add them here.</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="transcriptions" className="space-y-4">
          {transcribedVideos.length > 0 ? (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Transcriptions
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {transcribedVideos.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Cost
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${transcribedVideos.reduce((sum, v) => sum + v.cost, 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cached (Free)
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {transcribedVideos.filter(v => v.cached).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transcribed Videos List */}
              {transcribedVideos.map(video => (
                <Card key={video.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          {video.title}
                          {video.cached && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              🟣 Cached ($0.00)
                            </Badge>
                          )}
                          {!video.cached && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              🟢 ${video.cost.toFixed(2)}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {video.channel && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {video.channel}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(video.extractedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(video.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Watch
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Transcript Display */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Transcript
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md max-h-48 overflow-y-auto text-sm text-gray-600 dark:text-gray-400">
                        {video.transcript}
                      </div>
                    </div>

                    {/* Extracted Themes */}
                    {video.themes && video.themes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Extracted Themes ({video.themes.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {video.themes.map((theme: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-purple-50 dark:bg-purple-950/20">
                              {theme.label || theme}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Add this video to unified themes extraction
                          setSelectedPapers(new Set([...Array.from(selectedPapers), video.id]));
                          toast.success('Video added to theme extraction queue');
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Add to Unified Themes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No transcriptions yet</p>
              <p className="text-sm text-gray-400">
                Enable &quot;Include video transcriptions&quot; when searching YouTube to transcribe videos
              </p>
            </div>
          )}
        </TabsContent>

        {/* PHASE 9 DAY 24: Tab 2 - Analysis & Insights (with sub-navigation) */}
        <TabsContent value="analysis" className="space-y-4">
          {/* Sub-navigation for Analysis */}
          <div className="flex gap-2 border-b pb-2">
            <Button
              variant={activeAnalysisSubTab === 'themes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveAnalysisSubTab('themes')}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Themes
              {unifiedThemes.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {unifiedThemes.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeAnalysisSubTab === 'gaps' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveAnalysisSubTab('gaps')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Research Gaps
              {gaps.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {gaps.length}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeAnalysisSubTab === 'synthesis' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveAnalysisSubTab('synthesis')}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Cross-Platform Synthesis
            </Button>
          </div>

          {/* Themes sub-tab */}
          {activeAnalysisSubTab === 'themes' && (
            <div className="space-y-4">
          {unifiedThemes.length > 0 ? (
            <div className="space-y-4">
              {/* PHASE 9 DAY 20.5: Source Summary Card */}
              <Card className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Theme Sources Summary
                  </h3>
                  <div className="flex items-center gap-6">
                    {/* Count themes by source type */}
                    {(() => {
                      const sourceCounts = {
                        papers: 0,
                        youtube: 0,
                        podcasts: 0,
                        social: 0,
                      };

                      unifiedThemes.forEach(theme => {
                        theme.sources?.forEach(source => {
                          if (source.sourceType === 'paper') sourceCounts.papers++;
                          else if (source.sourceType === 'youtube') sourceCounts.youtube++;
                          else if (source.sourceType === 'podcast') sourceCounts.podcasts++;
                          else if (source.sourceType === 'tiktok' || source.sourceType === 'instagram') sourceCounts.social++;
                        });
                      });

                      return (
                        <>
                          {sourceCounts.papers > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-500">Papers</Badge>
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {sourceCounts.papers}
                              </span>
                            </div>
                          )}
                          {sourceCounts.youtube > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-500">Videos</Badge>
                              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {sourceCounts.youtube}
                              </span>
                            </div>
                          )}
                          {sourceCounts.podcasts > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-orange-500">Podcasts</Badge>
                              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {sourceCounts.podcasts}
                              </span>
                            </div>
                          )}
                          {sourceCounts.social > 0 && (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-pink-500">Social</Badge>
                              <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                                {sourceCounts.social}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    ✨ Themes extracted from {unifiedThemes.length} sources with full provenance tracking
                  </p>
                </CardContent>
              </Card>

              {/* Theme Cards */}
              {unifiedThemes.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  showProvenanceButton={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No themes extracted yet</p>
              <p className="text-sm text-gray-400">
                Select papers and/or transcribe videos, then click &quot;Extract Themes from All Sources&quot; to identify research themes with full provenance tracking
              </p>
            </div>
          )}
            </div>
          )}

          {/* Gaps sub-tab */}
          {activeAnalysisSubTab === 'gaps' && (
            <div className="space-y-4">
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
            </div>
          )}

          {/* Synthesis sub-tab */}
          {activeAnalysisSubTab === 'synthesis' && (
            <div className="space-y-4">
          {query ? (
            <CrossPlatformDashboard
              query={query}
              maxResults={10}
              timeWindow={90}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                Enter a search query above, then switch to this tab to view
                cross-platform research synthesis across papers, YouTube,
                podcasts, TikTok, and Instagram.
              </p>
            </div>
          )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalResults > 20 && activeTab === 'results' && activeResultsSubTab === 'papers' && (
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
