/**
 * Literature Search Interface - DISCOVER Phase
 * Phase 9 Day 0-1: Complete Literature Review System
 * World-class implementation integrated with backend API
 */

'use client';

import { AcademicInstitutionLogin } from '@/components/literature/AcademicInstitutionLogin';
import { getAcademicIcon } from '@/components/literature/AcademicSourceIcons';
import { CostCalculator } from '@/components/literature/CostCalculator';
import { CrossPlatformDashboard } from '@/components/literature/CrossPlatformDashboard';
import DatabaseSourcesInfo from '@/components/literature/DatabaseSourcesInfo';
import { ThemeExtractionProgress } from '@/components/literature/progress/ThemeExtractionProgress';
import { ThemeCard } from '@/components/literature/ThemeCard';
import { VideoSelectionPanel } from '@/components/literature/VideoSelectionPanel';
import { YouTubeChannelBrowser } from '@/components/literature/YouTubeChannelBrowser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authService } from '@/lib/api/auth';
import * as QueryExpansionAPI from '@/lib/api/services/query-expansion-api.service';
import {
  SourceContent,
  UnifiedTheme,
  useUnifiedThemeAPI,
} from '@/lib/api/services/unified-theme-api.service';
import {
  literatureAPI,
  Paper,
  ResearchGap,
} from '@/lib/services/literature-api.service';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Filter,
  GitBranch,
  Info,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Video,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState, Suspense } from 'react';
import { toast } from 'sonner';

function LiteratureSearchContent() {
  // PHASE 10 DAY 1: URL state management for bookmarkable searches
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [queryCorrectionMessage, setQueryCorrectionMessage] = useState<{
    original: string;
    corrected: string;
  } | null>(null);
  // const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');

  // AI inline suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Default filter values (sources managed separately via academicDatabases state)
  const defaultFilters: {
    yearFrom: number | undefined;
    yearTo: number | undefined;
    sortBy: 'relevance' | 'date' | 'citations';
    citationMin: number;
    minCitations: number | undefined;
    publicationType: 'all' | 'journal' | 'conference' | 'preprint';
    author: string;
    authorSearchMode: 'contains' | 'exact' | 'fuzzy';
    includeAIMode: boolean;
  } = {
    yearFrom: 2020,
    yearTo: new Date().getFullYear(),
    sortBy: 'relevance',
    citationMin: 0,
    minCitations: undefined,
    publicationType: 'all',
    author: '',
    authorSearchMode: 'contains',
    includeAIMode: true,
  };

  // Filters being configured (in the filter panel)
  const [filters, setFilters] = useState(defaultFilters);

  // Applied filters (actually used for search)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  // PHASE 10 DAY 1: Saved filter presets
  const [savedPresets, setSavedPresets] = useState<
    Array<{
      id: string;
      name: string;
      filters: typeof filters;
    }>
  >([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('filterPresets');
      if (stored) {
        setSavedPresets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    }
  }, []);

  // PHASE 10 DAY 1: Load filters from URL params on mount
  useEffect(() => {
    const q = searchParams.get('q');
    const yearFrom = searchParams.get('yearFrom');
    const yearTo = searchParams.get('yearTo');
    const minCitations = searchParams.get('minCitations');
    const publicationType = searchParams.get('type');
    const sortBy = searchParams.get('sort');

    if (q) setQuery(q);

    const urlFilters = {
      ...defaultFilters,
      ...(yearFrom && { yearFrom: parseInt(yearFrom) }),
      ...(yearTo && { yearTo: parseInt(yearTo) }),
      ...(minCitations && { minCitations: parseInt(minCitations) }),
      ...(publicationType &&
        publicationType !== 'all' && {
          publicationType: publicationType as any,
        }),
      ...(sortBy && sortBy !== 'relevance' && { sortBy: sortBy as any }),
    };

    setFilters(urlFilters);
    setAppliedFilters(urlFilters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: typeof filters, searchQuery?: string) => {
      const params = new URLSearchParams();

      if (searchQuery || query) params.set('q', searchQuery || query);
      if (newFilters.yearFrom !== defaultFilters.yearFrom)
        params.set('yearFrom', newFilters.yearFrom!.toString());
      if (newFilters.yearTo !== defaultFilters.yearTo)
        params.set('yearTo', newFilters.yearTo!.toString());
      if (newFilters.minCitations)
        params.set('minCitations', newFilters.minCitations.toString());
      if (newFilters.publicationType !== 'all')
        params.set('type', newFilters.publicationType);
      if (newFilters.sortBy !== 'relevance')
        params.set('sort', newFilters.sortBy);

      const url = params.toString()
        ? `?${params.toString()}`
        : '/discover/literature';
      router.replace(url, { scroll: false });
    },
    [query, router]
  );

  // Save preset to localStorage
  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: appliedFilters,
    };

    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    localStorage.setItem('filterPresets', JSON.stringify(updated));
    setPresetName('');
    setShowPresets(false);
    toast.success(`Preset "${preset.name}" saved!`);
  };

  // Load preset
  const handleLoadPreset = (preset: (typeof savedPresets)[0]) => {
    setFilters(preset.filters);
    setAppliedFilters(preset.filters);
    setShowPresets(false);
    toast.success(`Loaded preset "${preset.name}"`);
  };

  // Delete preset
  const handleDeletePreset = (presetId: string) => {
    const updated = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem('filterPresets', JSON.stringify(updated));
    toast.success('Preset deleted');
  };

  // Count applied filters (filters that differ from defaults)
  const getAppliedFilterCount = () => {
    let count = 0;
    if (appliedFilters.yearFrom !== defaultFilters.yearFrom) count++;
    if (appliedFilters.yearTo !== defaultFilters.yearTo) count++;
    if (appliedFilters.minCitations && appliedFilters.minCitations > 0) count++;
    if (appliedFilters.publicationType !== 'all') count++;
    if (appliedFilters.sortBy !== 'relevance') count++;
    if (appliedFilters.author && appliedFilters.author.trim().length > 0)
      count++;
    return count;
  };

  const appliedFilterCount = getAppliedFilterCount();

  // Apply filters (copy from filters to appliedFilters)
  const handleApplyFilters = () => {
    // Auto-correct any invalid filter values before applying
    const correctedFilters = { ...filters };

    // Auto-correct year range if needed
    if (correctedFilters.yearFrom && correctedFilters.yearTo) {
      if (correctedFilters.yearFrom > correctedFilters.yearTo) {
        correctedFilters.yearTo = correctedFilters.yearFrom;
      }
    }

    setAppliedFilters(correctedFilters);
    setFilters(correctedFilters);
    setShowFilters(false);

    // PHASE 10 DAY 1: Update URL for bookmarkable search
    updateURL(correctedFilters);

    // Count the filters we're about to apply
    let count = 0;
    if (filters.yearFrom !== defaultFilters.yearFrom) count++;
    if (filters.yearTo !== defaultFilters.yearTo) count++;
    if (filters.minCitations && filters.minCitations > 0) count++;
    if (filters.publicationType !== 'all') count++;
    if (filters.sortBy !== 'relevance') count++;
    if (filters.author && filters.author.trim().length > 0) count++;
    if (count > 0) {
      toast.success(`${count} filter${count === 1 ? '' : 's'} applied`);
    } else {
      toast.info('Using default filters');
    }
  };

  // Analysis state
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [unifiedThemes, setUnifiedThemes] = useState<UnifiedTheme[]>([]);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [analyzingThemes, setAnalyzingThemes] = useState(false);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);
  const [showThemeProgress, setShowThemeProgress] = useState(false);

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
  const [transcribedVideos, setTranscribedVideos] = useState<
    {
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
    }[]
  >([]);

  // PHASE 9 DAY 24: UX Reorganization - Panel and tab navigation state
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null); // Which panel section is expanded
  const [activeResultsSubTab, setActiveResultsSubTab] = useState<
    'papers' | 'videos' | 'library'
  >('papers');
  const [activeAnalysisSubTab, setActiveAnalysisSubTab] = useState<
    'themes' | 'gaps' | 'synthesis'
  >('themes');

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

  // AI-powered inline suggestions while typing
  useEffect(() => {
    // Clear previous timer
    if (suggestionTimerRef.current) {
      clearTimeout(suggestionTimerRef.current);
    }

    // Only fetch suggestions if query is at least 3 characters
    if (query && query.trim().length >= 3) {
      setLoadingSuggestions(true);

      suggestionTimerRef.current = setTimeout(async () => {
        try {
          const result = await QueryExpansionAPI.expandQuery(query, 'general');

          // Get up to 4 refined query suggestions
          const suggestions = [
            result.expanded,
            ...result.suggestions.slice(0, 3),
          ].filter(s => s && s !== query); // Remove duplicates and original query

          setAiSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        } catch (error) {
          console.error('Failed to fetch AI suggestions:', error);
          setAiSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setLoadingSuggestions(false);
        }
      }, 800); // 800ms debounce
    } else {
      setAiSuggestions([]);
      setShowSuggestions(false);
      setLoadingSuggestions(false);
    }

    // Cleanup
    return () => {
      if (suggestionTimerRef.current) {
        clearTimeout(suggestionTimerRef.current);
      }
    };
  }, [query]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      console.log('='.repeat(80));
      console.log('🔍 SEARCH START');
      console.log('Query:', query);
      console.log('Applied Filters:', appliedFilters);
      console.log('Selected Sources (academicDatabases):', academicDatabases);
      console.log('Sources count:', academicDatabases.length);

      const searchParams = {
        query,
        sources: academicDatabases,
        ...(appliedFilters.yearFrom && { yearFrom: appliedFilters.yearFrom }),
        ...(appliedFilters.yearTo && { yearTo: appliedFilters.yearTo }),
        ...(appliedFilters.minCitations !== undefined && {
          minCitations: appliedFilters.minCitations,
        }),
        ...(appliedFilters.publicationType !== 'all'
          ? { publicationType: appliedFilters.publicationType }
          : {}),
        ...(appliedFilters.author &&
          appliedFilters.author.trim().length > 0 && {
            author: appliedFilters.author.trim(),
            authorSearchMode: appliedFilters.authorSearchMode,
          }),
        sortBy: appliedFilters.sortBy,
        page: currentPage,
        limit: 20,
        includeCitations: true,
      };

      console.log('📤 Sending search params:', searchParams);

      const result = await literatureAPI.searchLiterature(searchParams);

      console.log('✅ Search result received:', result);
      console.log('📚 Papers array:', result.papers);
      console.log('📚 Papers count:', result.papers?.length);
      console.log('📈 Total results:', result.total);
      console.log('='.repeat(80));

      // Google-like: Check if query was auto-corrected
      if ((result as any).correctedQuery && (result as any).originalQuery) {
        setQueryCorrectionMessage({
          original: (result as any).originalQuery,
          corrected: (result as any).correctedQuery,
        });
      } else {
        setQueryCorrectionMessage(null);
      }

      // Check if filters are too restrictive
      if (result.total === 0 && appliedFilterCount > 0) {
        const hasStrictFilters =
          (appliedFilters.minCitations && appliedFilters.minCitations > 0) ||
          (appliedFilters.yearFrom &&
            appliedFilters.yearFrom >= new Date().getFullYear() - 2);

        if (hasStrictFilters) {
          toast.warning(
            'No papers found with current filters. Try removing the citation filter or expanding the year range.',
            { duration: 6000 }
          );
        }
      }

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
          `Found ${result.total} papers across ${academicDatabases.length} databases`
        );
      } else {
        console.warn('⚠️ No papers in result');
        setPapers([]);
        setTotalResults(0);
        setActiveTab('results'); // PHASE 9 DAY 24: Switch to results tab
        setActiveResultsSubTab('papers'); // Show papers sub-tab

        // More helpful message based on filters
        if (appliedFilterCount > 0) {
          const filterHints = [];
          if (appliedFilters.minCitations && appliedFilters.minCitations > 0) {
            filterHints.push(
              `citation filter (≥${appliedFilters.minCitations})`
            );
          }
          if (
            appliedFilters.yearFrom &&
            appliedFilters.yearFrom >= new Date().getFullYear() - 2
          ) {
            filterHints.push(
              `recent year filter (${appliedFilters.yearFrom}+)`
            );
          }

          if (filterHints.length > 0) {
            toast.info(
              `No papers found. Your ${filterHints.join(' and ')} may be too restrictive. Try removing filters or adjusting the year range.`,
              { duration: 7000 }
            );
          } else {
            toast.info(
              'No papers found with current filters. Try removing some filters.'
            );
          }
        } else {
          toast.info('No papers found. Try adjusting your search terms.');
        }
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('❌ Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, appliedFilters, academicDatabases, currentPage]);

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

    // PHASE 9 DAY 28: Real-time progress (ready for backend integration)
    // Note: Backend API needs to be updated to accept userId and emit WebSocket progress
    const user = authService.getUser();
    if (user?.id) {
      setShowThemeProgress(true); // Show progress component when backend supports it
    }

    setAnalyzingThemes(true);
    try {
      const paperIds = Array.from(selectedPapers);
      console.log('🎯 Starting theme extraction...');
      console.log('   Selected paper IDs:', paperIds);
      console.log('   Total sources:', totalSources);

      // Get selected paper objects
      const selectedPaperObjects = papers.filter(p => selectedPapers.has(p.id));
      console.log('   Found paper objects:', selectedPaperObjects.length);

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
      console.log('   Paper sources:', paperSources.length);
      console.log('   Video sources:', videoSources.length);
      console.log('   Total sources for API:', allSources.length);
      console.log('   First source sample:', allSources[0]);

      // Phase 9 Day 20: Use unified theme extraction with full provenance
      // TODO Day 28: Add userId to options when backend supports it
      console.log('📡 Calling extractUnifiedThemes API...');
      const result = await extractUnifiedThemes(allSources, {
        maxThemes: 15,
        minConfidence: 0.5,
        // userId: user?.id, // Uncomment when backend accepts userId
      });
      console.log('📡 API call completed');

      console.log('🔍 Theme extraction result:', result);

      if (result && result.themes) {
        console.log(`✅ Successfully extracted ${result.themes.length} themes`);
        setUnifiedThemes(result.themes);
        setActiveTab('analysis'); // PHASE 9 DAY 24: Switch to analysis tab
        setActiveAnalysisSubTab('themes'); // Show themes sub-tab
        toast.success(
          `Extracted ${result.themes.length} themes with full provenance from ${paperIds.length} papers`
        );
      } else {
        console.error(
          '❌ Theme extraction failed: No themes in result',
          result
        );
        toast.error('Theme extraction failed: No themes returned');
      }
    } catch (error: any) {
      console.error('❌ Theme extraction error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if (error.response) {
        console.error('API Response status:', error.response.status);
        console.error('API Response data:', error.response.data);
      }
      toast.error(
        `Theme extraction failed: ${error.message || 'Unknown error'}`
      );
    } finally {
      setAnalyzingThemes(false);
      setShowThemeProgress(false); // Hide progress component
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
      sessionStorage.setItem(
        'statementSource',
        JSON.stringify({
          type: 'themes',
          query,
          themeCount: unifiedThemes.length,
          timestamp: new Date().toISOString(),
        })
      );

      toast.success(`Generated ${statements.length} Q-statements from themes`);

      // Navigate to study creation page with generated statements
      window.location.href =
        '/create/study?from=literature&statementsReady=true';
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
        if (
          youtubeResults.transcripts &&
          youtubeResults.transcripts.length > 0
        ) {
          const newTranscriptions = youtubeResults.transcripts.map(
            (transcript: any) => ({
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
            })
          );

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
          const youtubeResults = results.filter(
            (r: any) => r.source === 'youtube'
          );
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

    const hasMainSources = academicDatabases.length > 0;
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
      (hasMainSources ? academicDatabases.length : 0) +
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
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg leading-tight flex-1">
                    {paper.title}
                  </h3>
                  {paper.source && (() => {
                    const SourceIcon = getAcademicIcon(
                      paper.source.toLowerCase().replace(/ /g, '_')
                    );
                    return (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 shrink-0 px-2 py-1"
                      >
                        <SourceIcon className="w-3 h-3" />
                        <span className="text-xs">{paper.source}</span>
                      </Badge>
                    );
                  })()}
                </div>
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
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {paper.citationCount === null || paper.citationCount === undefined
                      ? 'No citation info'
                      : `${paper.citationCount} citation${paper.citationCount === 1 ? '' : 's'}`}
                  </span>
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
            <h3 className="font-semibold text-gray-900">Universal Search</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Searches all selected sources below
            </Badge>
          </div>

          <div className="flex gap-2">
            <div ref={searchContainerRef} className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                placeholder="Search across academic databases, alternative sources, and social media..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setShowSuggestions(true); // Show suggestions when user starts typing
                  // Clear query correction message when user types
                  if (queryCorrectionMessage) {
                    setQueryCorrectionMessage(null);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setShowSuggestions(false);
                    handleSearchAllSources();
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() =>
                  aiSuggestions.length > 0 && setShowSuggestions(true)
                }
                className="pl-14 pr-4 h-14 text-lg border-2 focus:border-blue-500"
              />

              {/* AI-Powered Inline Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions &&
                  (aiSuggestions.length > 0 || loadingSuggestions) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-purple-200 rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-900">
                          AI-Refined Questions (GPT-4)
                        </span>
                        {loadingSuggestions && (
                          <Loader2 className="w-3 h-3 animate-spin text-purple-600 ml-auto" />
                        )}
                      </div>

                      {loadingSuggestions ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Generating refined queries...
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto">
                          {aiSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setQuery(suggestion);
                                setShowSuggestions(false);
                                // Clear any previous query correction message
                                setQueryCorrectionMessage(null);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0 group"
                            >
                              <div className="flex items-start gap-3">
                                <Badge
                                  variant="outline"
                                  className="mt-0.5 bg-purple-100 text-purple-700 border-purple-300 flex-shrink-0"
                                >
                                  {index === 0 ? '✨ Best' : `${index + 1}`}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 group-hover:text-purple-900 font-medium break-words">
                                    {suggestion}
                                  </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 flex-shrink-0 mt-0.5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 text-center">
                        Press{' '}
                        <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">
                          Enter
                        </kbd>{' '}
                        to search •{' '}
                        <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">
                          Esc
                        </kbd>{' '}
                        to close
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>
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
              onClick={() => setShowFilters(!showFilters)}
              className="h-14 px-6 border-2 relative"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {appliedFilterCount > 0 && (
                <Badge className="ml-2 bg-purple-600 text-white">
                  {appliedFilterCount}
                </Badge>
              )}
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
            {academicDatabases.length === 0 &&
              alternativeSources.length === 0 &&
              socialPlatforms.length === 0 && (
                <span className="text-orange-600">
                  ⚠️ No sources selected - please select sources below
                </span>
              )}
          </div>

          {/* Active Filters Chips - Only show APPLIED filters */}
          {appliedFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm font-medium text-gray-700">
                Active filters:
              </span>
              {appliedFilters.yearFrom !== defaultFilters.yearFrom && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
                  onClick={() => {
                    const newFilters = {
                      ...appliedFilters,
                      yearFrom: defaultFilters.yearFrom,
                    };
                    setAppliedFilters(newFilters);
                    setFilters(newFilters);
                  }}
                >
                  Year from: {appliedFilters.yearFrom}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {appliedFilters.yearTo !== defaultFilters.yearTo && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
                  onClick={() => {
                    const newFilters = {
                      ...appliedFilters,
                      yearTo: defaultFilters.yearTo,
                    };
                    setAppliedFilters(newFilters);
                    setFilters(newFilters);
                  }}
                >
                  Year to: {appliedFilters.yearTo}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {appliedFilters.minCitations &&
                appliedFilters.minCitations > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
                    onClick={() => {
                      const newFilters = {
                        ...appliedFilters,
                        minCitations: undefined,
                      };
                      setAppliedFilters(newFilters);
                      setFilters(newFilters);
                    }}
                  >
                    Min citations: {appliedFilters.minCitations}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
              {appliedFilters.publicationType !== 'all' && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
                  onClick={() => {
                    const newFilters = {
                      ...appliedFilters,
                      publicationType: 'all' as const,
                    };
                    setAppliedFilters(newFilters);
                    setFilters(newFilters);
                  }}
                >
                  Type:{' '}
                  {appliedFilters.publicationType === 'journal'
                    ? 'Journal'
                    : appliedFilters.publicationType === 'conference'
                      ? 'Conference'
                      : 'Preprint'}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {appliedFilters.sortBy !== 'relevance' && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
                  onClick={() => {
                    const newFilters = {
                      ...appliedFilters,
                      sortBy: 'relevance' as const,
                    };
                    setAppliedFilters(newFilters);
                    setFilters(newFilters);
                  }}
                >
                  Sort:{' '}
                  {appliedFilters.sortBy === 'citations'
                    ? 'Citations'
                    : appliedFilters.sortBy === 'date'
                      ? 'Date'
                      : 'Relevance'}
                  <X className="w-3 h-3" />
                </Badge>
              )}
              {appliedFilters.author &&
                appliedFilters.author.trim().length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700 flex items-center gap-1 cursor-pointer hover:bg-purple-200"
                    onClick={() => {
                      const newFilters = {
                        ...appliedFilters,
                        author: '',
                      };
                      setAppliedFilters(newFilters);
                      setFilters(newFilters);
                    }}
                  >
                    Author: {appliedFilters.author}
                    <X className="w-3 h-3" />
                  </Badge>
                )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAppliedFilters(defaultFilters);
                  setFilters(defaultFilters);
                }}
                className="text-xs h-6 text-gray-600 hover:text-gray-900"
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 pt-4 border-t mt-4"
              >
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="text-sm font-medium">Year Range</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="From"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={filters.yearFrom ?? ''}
                        onChange={e => {
                          let val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            // Auto-correct: ensure from is not after to
                            if (filters.yearTo && val > filters.yearTo) {
                              val = filters.yearTo;
                            }
                            // Auto-correct: limit to valid range
                            if (val < 1900) val = 1900;
                            if (val > new Date().getFullYear())
                              val = new Date().getFullYear();
                          }
                          setFilters({
                            ...filters,
                            yearFrom: isNaN(val) ? undefined : val,
                          });
                        }}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        placeholder="To"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={filters.yearTo ?? ''}
                        onChange={e => {
                          let val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            // Auto-correct: ensure to is not before from
                            if (filters.yearFrom && val < filters.yearFrom) {
                              val = filters.yearFrom;
                            }
                            // Auto-correct: limit to valid range
                            if (val < 1900) val = 1900;
                            if (val > new Date().getFullYear())
                              val = new Date().getFullYear();
                          }
                          setFilters({
                            ...filters,
                            yearTo: isNaN(val) ? undefined : val,
                          });
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Author</label>
                    <Input
                      type="text"
                      placeholder="e.g., Smith"
                      value={filters.author}
                      onChange={e =>
                        setFilters({
                          ...filters,
                          author: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                    <select
                      value={filters.authorSearchMode}
                      onChange={e =>
                        setFilters({
                          ...filters,
                          authorSearchMode: e.target.value as
                            | 'contains'
                            | 'exact'
                            | 'fuzzy',
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="contains">Contains (partial match)</option>
                      <option value="fuzzy">Fuzzy (typo-tolerant)</option>
                      <option value="exact">Exact match</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Min Citations</label>
                    <Input
                      type="number"
                      placeholder="e.g., 10"
                      value={filters.minCitations ?? ''}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFilters({
                          ...filters,
                          minCitations: isNaN(val) ? undefined : val,
                        });
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Publication Type
                    </label>
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

                <div className="space-y-3">
                  {/* Saved Presets Section */}
                  {savedPresets.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        📁 Saved Presets
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {savedPresets.map(preset => (
                          <div
                            key={preset.id}
                            className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 text-sm"
                          >
                            <button
                              onClick={() => handleLoadPreset(preset)}
                              className="hover:text-purple-700 font-medium"
                            >
                              {preset.name}
                            </button>
                            <button
                              onClick={() => handleDeletePreset(preset.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save Preset Form */}
                  {showPresets && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex gap-2 items-end"
                    >
                      <div className="flex-1">
                        <label className="text-sm font-medium">
                          Preset Name
                        </label>
                        <Input
                          placeholder="e.g., Recent AI Papers"
                          value={presetName}
                          onChange={e => setPresetName(e.target.value)}
                          onKeyDown={e =>
                            e.key === 'Enter' && handleSavePreset()
                          }
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleSavePreset} variant="outline">
                        Save
                      </Button>
                      <Button
                        onClick={() => setShowPresets(false)}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  )}

                  <div className="flex justify-between gap-2 mt-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setFilters(defaultFilters)}
                      >
                        Reset Filters
                      </Button>
                      {appliedFilterCount > 0 && !showPresets && (
                        <Button
                          variant="outline"
                          onClick={() => setShowPresets(true)}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Save as Preset
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={handleApplyFilters}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Apply Filters
                    </Button>
                  </div>
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
            Search peer-reviewed academic literature from leading scholarly
            databases
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
                  label: 'bioRxiv',
                  icon: '🧬',
                  desc: 'Biology preprints - FREE',
                  category: 'Free',
                },
                {
                  id: 'semantic_scholar',
                  label: 'Semantic Scholar',
                  icon: '🎓',
                  desc: 'CS/interdisciplinary - FREE',
                  category: 'Free',
                },

                // Multidisciplinary Premium
                {
                  id: 'web_of_science',
                  label: 'Web of Science',
                  icon: '🌐',
                  desc: 'Multidisciplinary citation index',
                  category: 'Premium',
                },
                {
                  id: 'scopus',
                  label: 'Scopus',
                  icon: '🔬',
                  desc: 'Multidisciplinary abstract/citation',
                  category: 'Premium',
                },
                {
                  id: 'crossref',
                  label: 'CrossRef',
                  icon: '🔗',
                  desc: 'DOI database registry',
                  category: 'Free',
                },

                // Subject-Specific
                {
                  id: 'ieee',
                  label: 'IEEE Xplore',
                  icon: '⚡',
                  desc: 'Engineering/tech/CS',
                  category: 'Premium',
                },
                {
                  id: 'jstor',
                  label: 'JSTOR',
                  icon: '📚',
                  desc: 'Humanities/social sciences',
                  category: 'Premium',
                },
                {
                  id: 'springer',
                  label: 'SpringerLink',
                  icon: '📕',
                  desc: 'STM & social sciences',
                  category: 'Premium',
                },
                {
                  id: 'nature',
                  label: 'Nature',
                  icon: '🔬',
                  desc: 'Science journals',
                  category: 'Premium',
                },
                {
                  id: 'wiley',
                  label: 'Wiley Online',
                  icon: '📘',
                  desc: 'Multidisciplinary',
                  category: 'Premium',
                },
                {
                  id: 'elsevier',
                  label: 'ScienceDirect',
                  icon: '🔵',
                  desc: 'Elsevier journals',
                  category: 'Premium',
                },
                {
                  id: 'psycinfo',
                  label: 'PsycINFO',
                  icon: '🧠',
                  desc: 'Psychology/behavioral sciences',
                  category: 'Premium',
                },
                {
                  id: 'eric',
                  label: 'ERIC',
                  icon: '🎓',
                  desc: 'Education research - FREE',
                  category: 'Free',
                },
              ].map(source => {
                const IconComponent = getAcademicIcon(source.id);
                return (
                  <Badge
                    key={source.id}
                    variant={
                      academicDatabases.includes(source.id)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer py-2 px-4 text-sm hover:scale-105 transition-transform flex items-center gap-2"
                    onClick={() => {
                      const newDatabases = academicDatabases.includes(
                        source.id
                      )
                        ? academicDatabases.filter(s => s !== source.id)
                        : [...academicDatabases, source.id];
                      setAcademicDatabases(newDatabases);
                    }}
                    title={source.desc}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    <span>{source.label}</span>
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {academicDatabases.length} database
              {academicDatabases.length !== 1 ? 's' : ''} selected
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
              disabled={
                (selectedPapers.size === 0 && transcribedVideos.length === 0) ||
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
              {(selectedPapers.size > 0 || transcribedVideos.length > 0) && (
                <div className="flex gap-1">
                  {selectedPapers.size > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedPapers.size} papers
                    </Badge>
                  )}
                  {transcribedVideos.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-purple-100 dark:bg-purple-900"
                    >
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

          {/* PHASE 9 DAY 28: Real-time Progress (ready for backend integration) */}
          {showThemeProgress && authService.getUser()?.id && (
            <div className="mt-4">
              <ThemeExtractionProgress
                userId={authService.getUser()!.id}
                onComplete={themesCount => {
                  setShowThemeProgress(false);
                  toast.success(
                    `Successfully extracted ${themesCount} themes!`
                  );
                }}
                onError={error => {
                  setShowThemeProgress(false);
                  toast.error(`Theme extraction failed: ${error}`);
                }}
              />
            </div>
          )}
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
            Discover expert knowledge beyond traditional academic databases:
            podcasts, technical documentation, and community expertise
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
                {
                  id: 'podcasts',
                  label: 'Podcasts',
                  icon: '🎙️',
                  desc: 'Expert interviews & discussions',
                },
                {
                  id: 'github',
                  label: 'GitHub',
                  icon: '💻',
                  desc: 'Code & datasets',
                },
                {
                  id: 'stackoverflow',
                  label: 'StackOverflow',
                  icon: '📚',
                  desc: 'Technical Q&A',
                },
                {
                  id: 'medium',
                  label: 'Medium',
                  icon: '📝',
                  desc: 'Practitioner insights',
                },
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
                Search for research podcasts, expert interviews, and academic
                discussions
              </p>
              <Input placeholder="Search podcasts..." className="mb-2" />
              <p className="text-xs text-gray-500">
                Coming soon: Integration with Apple Podcasts, Spotify, and
                Google Podcasts
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
                Coming soon: GitHub API integration for code search and dataset
                discovery
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
                Coming soon: StackOverflow API integration for technical
                problem-solving
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
            Research social media platforms for trends, public opinion, and
            content analysis. Each platform unlocks specific research tools.
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
                {
                  id: 'instagram',
                  label: 'Instagram',
                  icon: '📸',
                  color: 'pink',
                },
                { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'cyan' },
                {
                  id: 'twitter',
                  label: 'Twitter/X',
                  icon: '🐦',
                  color: 'blue',
                },
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
                <Badge
                  variant="secondary"
                  className="ml-auto bg-red-100 text-red-700"
                >
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
                  onClick={() =>
                    setExpandedPanel(
                      expandedPanel === 'youtube-browser'
                        ? null
                        : 'youtube-browser'
                    )
                  }
                  className="w-full justify-between hover:bg-red-100"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4 text-red-600" />
                    Browse YouTube Channels
                  </span>
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 transition-transform',
                      expandedPanel === 'youtube-browser' && 'rotate-90'
                    )}
                  />
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
                        onVideosSelected={videos => {
                          setYoutubeVideos(prev => {
                            const existingIds = new Set(
                              prev.map((v: any) => v.videoId || v.id)
                            );
                            const newVideos = videos.filter(
                              v => !existingIds.has(v.videoId)
                            );
                            if (newVideos.length === 0) {
                              toast.info(
                                'All selected videos are already in the queue'
                              );
                              return prev;
                            }
                            toast.success(
                              `Added ${newVideos.length} videos to selection queue`
                            );
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
                  onClick={() =>
                    setExpandedPanel(
                      expandedPanel === 'video-selection'
                        ? null
                        : 'video-selection'
                    )
                  }
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
                  <ChevronRight
                    className={cn(
                      'w-4 h-4 transition-transform',
                      expandedPanel === 'video-selection' && 'rotate-90'
                    )}
                  />
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
                            channelName:
                              video.channelName || video.channel || '',
                            channelId: video.channelId || '',
                            thumbnailUrl:
                              video.thumbnailUrl ||
                              video.thumbnail ||
                              'https://via.placeholder.com/320x180',
                            duration: video.duration || 0,
                            viewCount: video.viewCount || video.views || 0,
                            publishedAt: video.publishedAt
                              ? new Date(video.publishedAt)
                              : new Date(),
                            relevanceScore: video.relevanceScore,
                            isTranscribed: video.isTranscribed || false,
                            transcriptionStatus:
                              video.transcriptionStatus || 'not_started',
                            cachedTranscript: video.cachedTranscript || false,
                          }))}
                          researchContext={query}
                          onTranscribe={async videoIds => {
                            try {
                              toast.info(
                                `Starting transcription for ${videoIds.length} videos...`
                              );
                              const result =
                                await literatureAPI.searchYouTubeWithTranscription(
                                  query,
                                  {
                                    ...transcriptionOptions,
                                    includeTranscripts: true,
                                    maxResults: videoIds.length,
                                  }
                                );
                              if (
                                result.transcripts &&
                                result.transcripts.length > 0
                              ) {
                                const newTranscriptions =
                                  result.transcripts.map((transcript: any) => ({
                                    id: transcript.id || transcript.videoId,
                                    title: transcript.title || 'Untitled Video',
                                    sourceId: transcript.videoId,
                                    url: `https://www.youtube.com/watch?v=${transcript.videoId}`,
                                    channel: transcript.channel,
                                    duration: transcript.duration || 0,
                                    cost: transcript.cost || 0,
                                    transcript:
                                      transcript.transcript ||
                                      transcript.text ||
                                      '',
                                    themes: transcript.themes || [],
                                    extractedAt:
                                      transcript.extractedAt ||
                                      new Date().toISOString(),
                                    cached: transcript.cached || false,
                                  }));
                                setTranscribedVideos(prev => [
                                  ...prev,
                                  ...newTranscriptions,
                                ]);
                                toast.success(
                                  `Successfully transcribed ${result.transcripts.length} videos`
                                );
                                setActiveTab('results');
                                setActiveResultsSubTab('videos');
                              } else {
                                toast.error(
                                  'Transcription failed - no results returned'
                                );
                              }
                            } catch (error) {
                              console.error('Transcription error:', error);
                              toast.error(
                                'Failed to transcribe videos. Please try again.'
                              );
                            }
                          }}
                          isLoading={loadingAlternative}
                        />
                      ) : (
                        <div className="text-center py-6 text-gray-500 border border-dashed rounded-lg bg-white">
                          <Video className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs">No videos in queue</p>
                          <p className="text-xs mt-1">
                            Browse channels to add videos
                          </p>
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
              <p className="text-sm">
                Choose YouTube, Instagram, TikTok, or Twitter to see research
                options
              </p>
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
                Extract cross-cutting research themes from academic papers,
                YouTube videos, Instagram posts, and alternative sources. AI
                analyzes all selected content to identify patterns, key
                concepts, and emerging trends with full provenance tracking.
              </p>

              {/* Visual Workflow */}
              <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  1. Select Papers
                </Badge>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700"
                >
                  2. Transcribe Videos
                </Badge>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700"
                >
                  3. Add Alt Sources
                </Badge>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 font-semibold"
                >
                  4. Extract Themes
                </Badge>
              </div>

              {/* How It Works */}
              <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">
                      How it works:
                    </span>{' '}
                    AI combines content from all sources → Analyzes text using
                    NLP → Identifies recurring concepts → Groups related ideas
                    into themes → Tracks which sources contributed to each theme
                    → Generates confidence scores and evidence citations.
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="text-sm">
                  <span className="font-semibold text-blue-600">
                    {selectedPapers.size}
                  </span>
                  <span className="text-gray-500 ml-1">papers selected</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-purple-600">
                    {transcribedVideos.length}
                  </span>
                  <span className="text-gray-500 ml-1">videos transcribed</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleExtractThemes}
                  disabled={
                    (selectedPapers.size === 0 &&
                      transcribedVideos.length === 0) ||
                    analyzingThemes
                  }
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
                      Extract Themes from{' '}
                      {selectedPapers.size + transcribedVideos.length} Sources
                    </>
                  )}
                </Button>

                {unifiedThemes.length > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700"
                  >
                    ✓ {unifiedThemes.length} themes extracted
                  </Badge>
                )}
              </div>

              {selectedPapers.size === 0 && transcribedVideos.length === 0 && (
                <Alert className="mt-4 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Select papers from search results above or transcribe
                    YouTube videos to begin theme extraction
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
            {papers.length + transcribedVideos.length + savedPapers.length >
              0 && (
              <Badge className="mt-1" variant="secondary">
                {papers.length + transcribedVideos.length + savedPapers.length}{' '}
                total
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex-col h-full">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analysis & Insights
            </span>
            {unifiedThemes.length + gaps.length > 0 && (
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
              {/* Google-like "Showing results for..." message */}
              {queryCorrectionMessage && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm">
                    Showing results for{' '}
                    <span className="font-semibold">
                      {queryCorrectionMessage.corrected}
                    </span>
                    <br />
                    <span className="text-gray-600">
                      Search instead for:{' '}
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          const originalQueryText = queryCorrectionMessage.original;
                          setQuery(originalQueryText);
                          setQueryCorrectionMessage(null);
                          // Immediately search with the original query
                          setTimeout(() => handleSearch(), 100);
                        }}
                      >
                        {queryCorrectionMessage.original}
                      </button>
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : papers.length > 0 ? (
                <div className="space-y-4">
                  {/* Final Query Display - Shows the actual query used for search */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Search className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-900 mb-1">
                          Search Query Used
                        </p>
                        <p className="text-lg font-semibold text-gray-900 break-words">
                          {queryCorrectionMessage?.corrected || query}
                        </p>
                        {queryCorrectionMessage && (
                          <p className="text-xs text-gray-600 mt-2">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                              Auto-corrected from: "{queryCorrectionMessage.original}"
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="bg-white">
                          {totalResults} {totalResults === 1 ? 'result' : 'results'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Papers List */}
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
                            <CardTitle className="text-lg font-semibold">
                              {video.title}
                            </CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {video.channel && <span>{video.channel}</span>}
                              <span>
                                {Math.floor(video.duration / 60)}:
                                {(video.duration % 60)
                                  .toString()
                                  .padStart(2, '0')}{' '}
                                min
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(video.url, '_blank')}
                          >
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
                savedPapers.map(paper => (
                  <PaperCard key={paper.id} paper={paper} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    No saved papers yet. Star papers from search results to add
                    them here.
                  </p>
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
                        $
                        {transcribedVideos
                          .reduce((sum, v) => sum + v.cost, 0)
                          .toFixed(2)}
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
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            >
                              🟣 Cached ($0.00)
                            </Badge>
                          )}
                          {!video.cached && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            >
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
                            {Math.floor(video.duration / 60)}:
                            {(video.duration % 60).toString().padStart(2, '0')}{' '}
                            min
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
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-purple-50 dark:bg-purple-950/20"
                            >
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
                          setSelectedPapers(
                            new Set([...Array.from(selectedPapers), video.id])
                          );
                          toast.success(
                            'Video added to theme extraction queue'
                          );
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
                Enable &quot;Include video transcriptions&quot; when searching
                YouTube to transcribe videos
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
              variant={
                activeAnalysisSubTab === 'synthesis' ? 'default' : 'ghost'
              }
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
                              if (source.sourceType === 'paper')
                                sourceCounts.papers++;
                              else if (source.sourceType === 'youtube')
                                sourceCounts.youtube++;
                              else if (source.sourceType === 'podcast')
                                sourceCounts.podcasts++;
                              else if (
                                source.sourceType === 'tiktok' ||
                                source.sourceType === 'instagram'
                              )
                                sourceCounts.social++;
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
                                  <Badge className="bg-purple-500">
                                    Videos
                                  </Badge>
                                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                    {sourceCounts.youtube}
                                  </span>
                                </div>
                              )}
                              {sourceCounts.podcasts > 0 && (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-orange-500">
                                    Podcasts
                                  </Badge>
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
                        ✨ Themes extracted from {unifiedThemes.length} sources
                        with full provenance tracking
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
                  <p className="text-lg font-medium mb-2">
                    No themes extracted yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Select papers and/or transcribe videos, then click
                    &quot;Extract Themes from All Sources&quot; to identify
                    research themes with full provenance tracking
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
                                style={{
                                  width: `${gap.opportunityScore * 100}%`,
                                }}
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
                      {gap.suggestedMethods &&
                        gap.suggestedMethods.length > 0 && (
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
      {totalResults > 20 &&
        activeTab === 'results' &&
        activeResultsSubTab === 'papers' && (
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

export default function LiteratureSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mr-4" />
                <p className="text-gray-600">Loading literature search...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <LiteratureSearchContent />
    </Suspense>
  );
}
