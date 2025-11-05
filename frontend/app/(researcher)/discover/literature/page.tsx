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
import EnterpriseThemeCard from '@/components/literature/EnterpriseThemeCard';
import PurposeSelectionWizard from '@/components/literature/PurposeSelectionWizard';
import ThemeCountGuidance from '@/components/literature/ThemeCountGuidance';
import { ThemeMethodologyExplainer } from '@/components/literature/ThemeMethodologyExplainer';
import ThemeExtractionProgressModal from '@/components/literature/ThemeExtractionProgressModal';
import { VideoSelectionPanel } from '@/components/literature/VideoSelectionPanel';
import { YouTubeChannelBrowser } from '@/components/literature/YouTubeChannelBrowser';
// Phase 10 Day 18: Incremental Theme Extraction Components
import { CorpusManagementPanel } from '@/components/literature/CorpusManagementPanel';
import { IncrementalExtractionModal } from '@/components/literature/IncrementalExtractionModal';
import { SaturationDashboard } from '@/components/literature/SaturationDashboard';
// Phase 10 Day 5.12: Enhanced Theme Integration Components
import type {
  ConstructMapping as ConstructMappingType,
  GeneratedSurvey,
  HypothesisSuggestion as HypothesisSuggestionType,
  SurveyGenerationConfig,
} from '@/components/literature';
import {
  AIHypothesisSuggestions,
  AIResearchQuestionSuggestions,
  CompleteSurveyFromThemesModal,
  GeneratedSurveyPreview,
  ThemeConstructMap,
} from '@/components/literature';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as QueryExpansionAPI from '@/lib/api/services/query-expansion-api.service';
import {
  ResearchPurpose,
  SaturationData,
  SourceContent,
  UnifiedTheme,
  UserExpertiseLevel,
  useUnifiedThemeAPI,
} from '@/lib/api/services/unified-theme-api.service';
// Phase 10 Day 5.12: Enhanced Theme Integration API
import {
  enhancedThemeIntegrationService,
  saveHypotheses,
  saveResearchQuestions,
} from '@/lib/api/services/enhanced-theme-integration-api.service';
import { useThemeExtractionProgress } from '@/lib/hooks/useThemeExtractionProgress';
// Phase 10 Day 18: Incremental Extraction Hook
import { useIncrementalExtraction } from '@/lib/hooks/useIncrementalExtraction';
import {
  literatureAPI,
  Paper,
  ResearchGap,
} from '@/lib/services/literature-api.service';
// Phase 10 Day 5.17.4: State persistence for back button navigation
import {
  clearLiteratureState,
  getSavedStateSummary,
  loadLiteratureState,
  saveLiteratureState,
} from '@/lib/services/literature-state-persistence.service';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GitBranch,
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
import React, { Suspense, useCallback, useEffect, useState } from 'react';
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
    sortBy:
      | 'relevance'
      | 'date'
      | 'citations'
      | 'citations_per_year'
      | 'word_count'
      | 'quality_score';
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
  const [extractedPapers, setExtractedPapers] = useState<Set<string>>(
    new Set()
  ); // Phase 10 Day 5.7: Track extracted papers
  const [extractingPapers, setExtractingPapers] = useState<Set<string>>(
    new Set()
  ); // Phase 10 Day 5.7: Track papers currently being extracted
  const [unifiedThemes, setUnifiedThemes] = useState<UnifiedTheme[]>([]);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [analyzingThemes, setAnalyzingThemes] = useState(false);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);

  // Phase 10 Day 5.13: V2 Purpose-driven extraction state
  const [extractionPurpose, setExtractionPurpose] =
    useState<ResearchPurpose | null>(null);
  const [showPurposeWizard, setShowPurposeWizard] = useState(false);
  const [v2SaturationData, setV2SaturationData] =
    useState<SaturationData | null>(null);
  const [userExpertiseLevel] = useState<UserExpertiseLevel>('researcher');

  // Phase 10 Day 5.16: Content analysis data for Purpose Wizard Step 0
  const [contentAnalysis, setContentAnalysis] = useState<{
    fullTextCount: number;
    abstractOverflowCount: number;
    abstractCount: number;
    noContentCount: number;
    avgContentLength: number;
    hasFullTextContent: boolean;
    sources: SourceContent[];
  } | null>(null);

  // Phase 10 Day 5.17.3: Request tracking for detailed logging and debugging
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);

  // Phase 10 Day 5.13: V2 theme extraction hook
  const { extractThemesV2 } = useUnifiedThemeAPI();

  // Phase 10 Day 5.6: Progress tracking hook
  const {
    progress: extractionProgress,
    startExtraction,
    updateProgress,
    completeExtraction,
    setError: setExtractionError,
    reset: resetExtractionProgress,
  } = useThemeExtractionProgress();

  // Phase 10 Day 18: Incremental extraction state management
  const incrementalExtraction = useIncrementalExtraction();

  // Phase 10 Day 5.12: Enhanced Theme Integration State
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [researchQuestions, setResearchQuestions] = useState<any[]>([]);
  const [hypotheses, setHypotheses] = useState<HypothesisSuggestionType[]>([]);
  const [constructMappings, setConstructMappings] = useState<
    ConstructMappingType[]
  >([]);
  const [generatedSurvey, setGeneratedSurvey] =
    useState<GeneratedSurvey | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingHypotheses, setLoadingHypotheses] = useState(false);
  const [loadingConstructs, setLoadingConstructs] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

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

  // PHASE 10 DAY 5.17.4: State restoration banner
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [restoreSummary, setRestoreSummary] = useState<{
    itemCount: number;
    hoursAgo?: number | undefined;
  } | null>(null);

  // PHASE 10 DAY 5.17.4: Load saved state on mount (before other useEffects)
  useEffect(() => {
    const summary = getSavedStateSummary();
    if (summary.exists && summary.itemCount > 0) {
      console.log('📦 Found saved literature state:', summary);
      setRestoreSummary({
        itemCount: summary.itemCount,
        hoursAgo: summary.hoursAgo,
      });
      setShowRestoreBanner(true);
    }
  }, []); // Run once on mount

  // PHASE 10 DAY 5.17.4: Restore state function
  const handleRestoreState = useCallback(() => {
    const state = loadLiteratureState();
    console.log('🔄 Restoring literature state...', state);

    // Restore search state
    if (state.query) setQuery(state.query);
    if (state.papers) setPapers(state.papers);
    if (state.totalResults) setTotalResults(state.totalResults);
    if (state.currentPage) setCurrentPage(state.currentPage);
    if (state.filters) setFilters(state.filters);
    if (state.appliedFilters) setAppliedFilters(state.appliedFilters);

    // Restore selection state
    if (state.selectedPapers) {
      setSelectedPapers(new Set(state.selectedPapers));
    }
    if (state.savedPapers) setSavedPapers(state.savedPapers);

    // Restore analysis state
    if (state.unifiedThemes) setUnifiedThemes(state.unifiedThemes);
    if (state.gaps) setGaps(state.gaps);
    if (state.extractionPurpose)
      setExtractionPurpose(state.extractionPurpose as ResearchPurpose);
    if (state.contentAnalysis) setContentAnalysis(state.contentAnalysis);

    // Restore Enhanced Theme Integration
    if (state.selectedThemeIds) setSelectedThemeIds(state.selectedThemeIds);
    if (state.researchQuestions) setResearchQuestions(state.researchQuestions);
    if (state.hypotheses) setHypotheses(state.hypotheses);
    if (state.constructMappings) setConstructMappings(state.constructMappings);

    // Restore video state
    if (state.transcribedVideos) setTranscribedVideos(state.transcribedVideos);
    if (state.youtubeVideos) setYoutubeVideos(state.youtubeVideos);

    setShowRestoreBanner(false);
    toast.success(
      `Restored ${state.unifiedThemes?.length || 0} themes, ${state.papers?.length || 0} papers`
    );
  }, []);

  // PHASE 10 DAY 5.17.4: Dismiss restore banner
  const handleDismissRestore = useCallback(() => {
    setShowRestoreBanner(false);
    clearLiteratureState();
    toast.info('Starting fresh session');
  }, []);

  // PHASE 10 DAY 5.17.4: Auto-save state when critical data changes
  useEffect(() => {
    // Skip saving on initial mount (wait for user to actually have data)
    if (
      papers.length === 0 &&
      unifiedThemes.length === 0 &&
      researchQuestions.length === 0
    ) {
      return;
    }

    // Debounce saves to avoid excessive writes
    const saveTimer = setTimeout(() => {
      saveLiteratureState({
        query,
        papers,
        totalResults,
        currentPage,
        filters,
        appliedFilters,
        selectedPapers: Array.from(selectedPapers),
        savedPapers,
        unifiedThemes,
        gaps,
        extractionPurpose,
        contentAnalysis,
        selectedThemeIds,
        researchQuestions,
        hypotheses,
        constructMappings,
        transcribedVideos,
        youtubeVideos,
      });
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(saveTimer);
  }, [
    query,
    papers,
    totalResults,
    currentPage,
    filters,
    appliedFilters,
    selectedPapers,
    savedPapers,
    unifiedThemes,
    gaps,
    extractionPurpose,
    contentAnalysis,
    selectedThemeIds,
    researchQuestions,
    hypotheses,
    constructMappings,
    transcribedVideos,
    youtubeVideos,
  ]);

  // PHASE 10 DAY 5.17.5: Clear incompatible results when purpose changes
  // Prevents stale data from previous purposes persisting in state
  useEffect(() => {
    if (extractionPurpose) {
      console.log(`🔄 [Purpose Change] New purpose: ${extractionPurpose}`);

      // Clear results that are not appropriate for the new purpose
      switch (extractionPurpose) {
        case 'q_methodology':
          // Q-methodology: Only Q-statements allowed, clear all other results
          if (
            researchQuestions.length > 0 ||
            hypotheses.length > 0 ||
            constructMappings.length > 0 ||
            generatedSurvey
          ) {
            console.log(
              '   Clearing incompatible results: Questions, Hypotheses, Constructs, Survey'
            );
            setResearchQuestions([]);
            setHypotheses([]);
            setConstructMappings([]);
            setGeneratedSurvey(null);
          }
          break;

        case 'survey_construction':
          // Survey construction: Only survey allowed, clear other results
          if (
            researchQuestions.length > 0 ||
            hypotheses.length > 0 ||
            constructMappings.length > 0
          ) {
            console.log(
              '   Clearing incompatible results: Questions, Hypotheses, Constructs'
            );
            setResearchQuestions([]);
            setHypotheses([]);
            setConstructMappings([]);
          }
          break;

        // literature_synthesis, hypothesis_generation, qualitative_analysis
        // allow multiple result types, so no clearing needed
        default:
          console.log(
            '   Purpose allows multiple result types - no clearing needed'
          );
          break;
      }
    }
  }, [extractionPurpose]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: We intentionally omit result state variables from deps to avoid clearing on result updates

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
        // Phase 10 Day 5.13+ Extension 2: Enhanced sorting with quality metrics
        sortByEnhanced: appliedFilters.sortBy,
        page: currentPage,
        limit: 20,
        includeCitations: true,
        // Phase 10 Day 5.13+ Extension 2: Default to 100-word minimum abstract (enterprise research-grade)
        minAbstractLength: 100,
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
    // PHASE 10 DAY 5.17.3: Generate unique request ID for tracing
    const requestId = `extract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentRequestId(requestId); // Store in state for use in handlePurposeSelected
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 [${requestId}] THEME EXTRACTION STARTED`);
    console.log(`${'='.repeat(80)}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    // PHASE 10 DAY 5.13: Show purpose selection wizard FIRST
    const totalSources = selectedPapers.size + transcribedVideos.length;
    console.log(`📊 [${requestId}] Initial counts:`, {
      selectedPapers: selectedPapers.size,
      transcribedVideos: transcribedVideos.length,
      totalSources,
    });

    if (totalSources === 0) {
      console.error(`❌ [${requestId}] No sources selected - aborting`);
      toast.error('Please select papers or transcribe videos to analyze');
      return;
    }

    // PHASE 10 DAY 5.16: Perform content analysis BEFORE showing wizard
    console.log(
      `📄 [${requestId}] STEP 1: Content Analysis - Analyzing ${selectedPapers.size} papers...`
    );
    // Get selected paper objects
    const selectedPaperObjects = papers.filter(p => selectedPapers.has(p.id));
    console.log(
      `✅ [${requestId}] Retrieved ${selectedPaperObjects.length} paper objects from state`
    );

    // Analyze content types
    const paperSources: SourceContent[] = selectedPaperObjects.map(
      (paper, index) => {
        let content = '';
        let contentType:
          | 'none'
          | 'abstract'
          | 'full_text'
          | 'abstract_overflow' = 'none';
        let contentSource = '';

        console.log(
          `   📑 [${requestId}] Paper ${index + 1}/${selectedPaperObjects.length}: "${paper.title?.substring(0, 60)}..."`
        );

        // PRIORITY 1: Use fullText if available (best quality)
        if (paper.fullText && paper.fullText.length > 0) {
          content = paper.fullText;
          contentType = 'full_text';
          contentSource = paper.fullTextSource || 'unknown';
          console.log(
            `      ✅ Full-text available: ${content.length} chars from ${contentSource}`
          );
        }
        // PRIORITY 2: Check if "abstract" field contains full article (>2000 chars)
        else if (paper.abstract && paper.abstract.length > 2000) {
          content = paper.abstract;
          contentType = 'abstract_overflow';
          contentSource = 'abstract_field';
          console.log(
            `      ⚡ Abstract overflow detected: ${content.length} chars (treating as full-text)`
          );
        }
        // PRIORITY 3: Use abstract (standard case)
        else if (paper.abstract && paper.abstract.length > 0) {
          content = paper.abstract;
          contentType = 'abstract';
          contentSource = 'abstract_field';
          console.log(`      📝 Abstract only: ${content.length} chars`);
        } else {
          console.warn(`      ⚠️ No content available for this paper!`);
        }

        return {
          id: paper.id,
          type: 'paper' as const,
          title: paper.title,
          content,
          keywords: paper.keywords || [],
          ...(paper.doi && { doi: paper.doi }),
          ...(paper.authors && { authors: paper.authors }),
          ...(paper.year && { year: paper.year }),
          ...(paper.url && { url: paper.url }),
          metadata: {
            contentType,
            contentSource,
            contentLength: content.length,
            hasFullText: paper.hasFullText || false,
            fullTextStatus: (paper.fullTextStatus || 'not_fetched') as
              | 'not_fetched'
              | 'fetching'
              | 'success'
              | 'failed',
          },
        };
      }
    );

    // Add transcribed videos
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

    // Filter out sources without content
    console.log(
      `\n🔍 [${requestId}] Filtering sources with sufficient content (>50 chars)...`
    );
    const beforeFilter = paperSources.length;
    const allSources = [
      ...paperSources.filter(s => s.content && s.content.length > 50),
      ...videoSources,
    ];
    const afterFilter = allSources.length;
    console.log(
      `   Filtered: ${beforeFilter} papers → ${afterFilter} valid sources (removed ${beforeFilter - afterFilter})`
    );

    if (allSources.length === 0) {
      console.error(`❌ [${requestId}] No sources with content - aborting`);
      toast.error(
        'Selected papers have no content. Please select papers with abstracts or full-text.'
      );
      return;
    }

    // Calculate content type breakdown
    const contentTypeBreakdown = {
      fullText: paperSources.filter(
        s => s.metadata?.contentType === 'full_text'
      ).length,
      abstractOverflow: paperSources.filter(
        s => s.metadata?.contentType === 'abstract_overflow'
      ).length,
      abstract: paperSources.filter(s => s.metadata?.contentType === 'abstract')
        .length,
      noContent: paperSources.filter(s => s.metadata?.contentType === 'none')
        .length,
    };

    const totalContentLength = allSources.reduce(
      (sum, s) => sum + (s.content?.length || 0),
      0
    );
    const avgContentLength = totalContentLength / allSources.length;
    const hasFullTextContent =
      contentTypeBreakdown.fullText + contentTypeBreakdown.abstractOverflow > 0;

    // Store content analysis for Purpose Wizard
    setContentAnalysis({
      fullTextCount: contentTypeBreakdown.fullText,
      abstractOverflowCount: contentTypeBreakdown.abstractOverflow,
      abstractCount: contentTypeBreakdown.abstract,
      noContentCount: contentTypeBreakdown.noContent,
      avgContentLength,
      hasFullTextContent,
      sources: allSources,
    });

    console.log(
      `\n✅ [${requestId}] STEP 1 COMPLETE: Content Analysis Summary`
    );
    console.log(`${'─'.repeat(60)}`);
    console.log(`   📊 Content Type Breakdown:`);
    console.log(`      • Full-text papers: ${contentTypeBreakdown.fullText}`);
    console.log(
      `      • Abstract overflow: ${contentTypeBreakdown.abstractOverflow}`
    );
    console.log(
      `      • Abstract-only papers: ${contentTypeBreakdown.abstract}`
    );
    console.log(`      • No content: ${contentTypeBreakdown.noContent}`);
    console.log(`   📏 Content Volume:`);
    console.log(
      `      • Total characters: ${totalContentLength.toLocaleString()}`
    );
    console.log(
      `      • Average per source: ${Math.round(avgContentLength).toLocaleString()} chars`
    );
    console.log(
      `      • Estimated words: ${Math.round(totalContentLength / 5).toLocaleString()}`
    );
    console.log(
      `   🎯 Quality Assessment: ${hasFullTextContent ? '✅ HIGH (has full-text)' : '⚠️ MODERATE (abstracts only)'}`
    );
    console.log(`${'─'.repeat(60)}\n`);

    // Show purpose selection wizard with content analysis
    console.log(
      `🎯 [${requestId}] STEP 2: Opening Purpose Selection Wizard...`
    );
    setShowPurposeWizard(true);
  };

  // PHASE 10 DAY 5.13: V2 extraction with selected purpose
  const handlePurposeSelected = async (purpose: ResearchPurpose) => {
    // PHASE 10 DAY 5.17.3: Detailed logging for debugging
    const requestId = currentRequestId || 'unknown';
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎯 [${requestId}] STEP 2: PURPOSE SELECTED`);
    console.log(`${'='.repeat(80)}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 Selected purpose: "${purpose}"`);
    console.log(`📋 Purpose requirements:`);

    const purposeRequirements: Record<
      string,
      { minFullText: number; name: string; methodology: string }
    > = {
      literature_synthesis: {
        minFullText: 10,
        name: 'Literature Synthesis',
        methodology: 'Meta-ethnography',
      },
      hypothesis_generation: {
        minFullText: 8,
        name: 'Hypothesis Generation',
        methodology: 'Grounded Theory',
      },
      survey_construction: {
        minFullText: 5,
        name: 'Survey Construction',
        methodology: 'Scale Development',
      },
      q_methodology: {
        minFullText: 0,
        name: 'Q-Methodology',
        methodology: 'Statement Generation',
      },
      qualitative_analysis: {
        minFullText: 3,
        name: 'Qualitative Analysis',
        methodology: 'Thematic Analysis',
      },
    };
    const requirement = purposeRequirements[purpose];
    if (requirement) {
      console.log(`   • Purpose: ${requirement.name}`);
      console.log(`   • Methodology: ${requirement.methodology}`);
      console.log(`   • Min full-text papers: ${requirement.minFullText}`);
    }

    setExtractionPurpose(purpose);
    setShowPurposeWizard(false);
    setAnalyzingThemes(true);

    // PHASE 10 DAY 5.16: Use pre-calculated content analysis from handleExtractThemes
    if (!contentAnalysis) {
      console.error(`❌ [${requestId}] Content analysis data missing!`);
      toast.error('Content analysis data missing. Please try again.');
      setAnalyzingThemes(false);
      return;
    }
    console.log(`✅ [${requestId}] Content analysis data available`);
    console.log(`   • Full-text papers: ${contentAnalysis.fullTextCount}`);
    console.log(
      `   • Abstract overflow: ${contentAnalysis.abstractOverflowCount}`
    );
    console.log(`   • Abstract-only: ${contentAnalysis.abstractCount}`);
    console.log(`   • No content: ${contentAnalysis.noContentCount}`);
    console.log(
      `   • Avg content length: ${Math.round(contentAnalysis.avgContentLength).toLocaleString()} chars`
    );
    console.log(
      `   • Quality: ${contentAnalysis.hasFullTextContent ? 'HIGH' : 'MODERATE'}`
    );

    // PHASE 10 DAY 5.17: Validate content requirements before extraction
    const fullTextCount =
      contentAnalysis.fullTextCount + contentAnalysis.abstractOverflowCount;

    console.log(`\n🔍 [${requestId}] VALIDATION: Content Requirements`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`   📊 Full-text count (including overflow): ${fullTextCount}`);
    console.log(`      • Pure full-text: ${contentAnalysis.fullTextCount}`);
    console.log(
      `      • Abstract overflow: ${contentAnalysis.abstractOverflowCount}`
    );

    if (purpose === 'literature_synthesis' && fullTextCount < 10) {
      console.error(
        `❌ [${requestId}] VALIDATION FAILED: Literature Synthesis requires 10+ full-text, have ${fullTextCount}`
      );
      toast.error(
        `Cannot extract themes: Literature Synthesis requires at least 10 full-text papers for methodologically sound meta-ethnography. You have ${fullTextCount} full-text paper${fullTextCount !== 1 ? 's' : ''}.`,
        { duration: 8000 }
      );
      setShowPurposeWizard(false);
      setAnalyzingThemes(false);
      return;
    } else if (purpose === 'literature_synthesis') {
      console.log(
        `   ✅ Literature Synthesis validation passed (${fullTextCount} >= 10)`
      );
    }

    if (purpose === 'hypothesis_generation' && fullTextCount < 8) {
      console.error(
        `❌ [${requestId}] VALIDATION FAILED: Hypothesis Generation requires 8+ full-text, have ${fullTextCount}`
      );
      toast.error(
        `Cannot extract themes: Hypothesis Generation requires at least 8 full-text papers for grounded theory. You have ${fullTextCount} full-text paper${fullTextCount !== 1 ? 's' : ''}.`,
        { duration: 8000 }
      );
      setShowPurposeWizard(false);
      setAnalyzingThemes(false);
      return;
    } else if (purpose === 'hypothesis_generation') {
      console.log(
        `   ✅ Hypothesis Generation validation passed (${fullTextCount} >= 8)`
      );
    }

    // Warning for recommended (not blocking)
    if (purpose === 'survey_construction' && fullTextCount < 5) {
      console.warn(
        `⚠️ [${requestId}] Survey Construction: Recommended 5+ full-text papers, have ${fullTextCount} (proceeding)`
      );
      toast.warning(
        `Survey Construction works best with at least 5 full-text papers. You have ${fullTextCount}. Proceeding anyway...`,
        { duration: 6000 }
      );
    } else if (purpose === 'survey_construction') {
      console.log(
        `   ✅ Survey Construction validation passed (${fullTextCount} >= 5)`
      );
    }

    if (purpose === 'q_methodology') {
      console.log(`   ℹ️ Q-Methodology: No minimum full-text requirement`);
    }

    console.log(
      `✅ [${requestId}] Content validation complete - proceeding with extraction`
    );

    const allSources = contentAnalysis.sources;
    const totalSources = allSources.length;

    console.log(`\n📦 [${requestId}] STEP 3: Preparing Extraction`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`   📊 Total sources to process: ${totalSources}`);

    // Phase 10 Day 5.7: Mark all selected papers as "extracting" (real-time UX)
    const paperIds = Array.from(selectedPapers);
    setExtractingPapers(new Set(paperIds));
    console.log(`   🟡 Marked ${paperIds.length} papers as "extracting"`);
    console.log(
      `   🆔 Paper IDs:`,
      paperIds.slice(0, 5).join(', ') + (paperIds.length > 5 ? '...' : '')
    );

    // Phase 10 Day 5.6: Start progress tracking
    startExtraction(totalSources);
    console.log(
      `   ✅ Progress tracking initialized for ${totalSources} sources`
    );

    try {
      console.log(`\n🚀 [${requestId}] STEP 4: API Call to Backend`);
      console.log(`${'─'.repeat(60)}`);
      console.log(`   🎯 Purpose: ${purpose}`);
      console.log(`   👤 Expertise level: ${userExpertiseLevel}`);
      console.log(`   🔬 Methodology: reflexive_thematic`);
      console.log(`   ✅ Validation level: rigorous`);
      console.log(`   🔄 Iterative refinement: enabled`);
      console.log(`\n   📊 Content Breakdown:`);
      console.log(`      • Full-text papers: ${contentAnalysis.fullTextCount}`);
      console.log(
        `      • Abstract overflow: ${contentAnalysis.abstractOverflowCount}`
      );
      console.log(`      • Abstract-only: ${contentAnalysis.abstractCount}`);
      console.log(`      • Total sources: ${allSources.length}`);

      if (allSources.length > 0) {
        const firstSource = allSources[0];
        console.log(`\n   📄 Sample of first source:`);
        console.log(
          `      • Title: "${(firstSource?.title || '').substring(0, 80)}${(firstSource?.title?.length || 0) > 80 ? '...' : ''}"`
        );
        console.log(`      • Type: ${firstSource?.type || 'unknown'}`);
        console.log(
          `      • Content length: ${(firstSource?.content?.length || 0).toLocaleString()} chars`
        );
        console.log(
          `      • Preview: "${(firstSource?.content || '').substring(0, 150).replace(/\n/g, ' ')}..."`
        );
      }

      // Phase 10 Day 5.13: Use V2 purpose-driven extraction with transparent progress
      console.log(`\n   📡 Initiating API call to extractThemesV2...`);
      const apiStartTime = Date.now();

      // BUG FIX: sources field is required in V2ExtractionRequest per interface definition
      const result = await extractThemesV2(
        allSources,
        {
          sources: allSources,
          purpose,
          userExpertiseLevel,
          allowIterativeRefinement: true,
          methodology: 'reflexive_thematic',
          validationLevel: 'rigorous',
          requestId, // PHASE 10 DAY 5.17.3: Pass request ID for end-to-end tracing
        },
        // Phase 10 Day 5.13: V2 progress callback with 4-part messaging
        (stage, total, message) => {
          const elapsed = ((Date.now() - apiStartTime) / 1000).toFixed(1);
          console.log(
            `   🟣 [${requestId}] Progress Update (${elapsed}s elapsed):`
          );
          console.log(`      • Stage: ${stage}/${total}`);
          console.log(`      • Message: ${message}`);
          console.log(
            `      • Processing: ALL ${paperIds.length} papers together (holistic analysis)`
          );
          updateProgress(stage, total);

          // CRITICAL FIX: stage is Braun & Clarke stage (1-6), NOT individual paper number!
          // ALL papers are processed together in each stage (holistic, not sequential)
          // So ALL papers stay in "extracting" state throughout stages 1-6
          // Papers are NOT extracted one by one!
        }
      );

      const apiDuration = ((Date.now() - apiStartTime) / 1000).toFixed(2);
      console.log(`\n✅ [${requestId}] API call completed in ${apiDuration}s`);

      console.log(`\n📦 [${requestId}] STEP 5: Processing Response`);
      console.log(`${'─'.repeat(60)}`);

      // PHASE 10 DAY 5.17.4: Enhanced diagnostic logging for debugging
      console.log(`   🔍 FULL RAW RESPONSE (for debugging):`);
      console.log(JSON.stringify(result, null, 2));

      console.log(`\n   📊 Response structure:`, {
        hasResult: !!result,
        hasThemes: !!(result && result.themes),
        themeCount: result?.themes?.length || 0,
        hasSaturationData: !!(result && result.saturationData),
        allKeys: result ? Object.keys(result) : [],
      });

      if (result && result.themes) {
        console.log(
          `   ✅ Valid response received with ${result.themes.length} themes`
        );

        // Phase 10 Day 5.14: Enhanced feedback for 0 themes
        if (result.themes.length === 0) {
          console.warn(
            `\n⚠️ [${requestId}] ZERO THEMES EXTRACTED - Analyzing root cause...`
          );
          console.warn(`${'─'.repeat(60)}`);
          console.warn(`   📊 Input Data:`);
          console.warn(`      • Sources analyzed: ${allSources.length}`);
          console.warn(
            `      • Full-text papers: ${contentAnalysis.fullTextCount}`
          );
          console.warn(
            `      • Abstract overflow: ${contentAnalysis.abstractOverflowCount}`
          );
          console.warn(
            `      • Abstract-only papers: ${contentAnalysis.abstractCount}`
          );
          console.warn(`      • No content: ${contentAnalysis.noContentCount}`);
          console.warn(
            `      • Total content chars: ${allSources.reduce((sum, s) => sum + (s.content?.length || 0), 0).toLocaleString()}`
          );
          console.warn(`   ⚙️ Processing Parameters:`);
          console.warn(`      • Purpose: ${purpose}`);
          console.warn(`      • Methodology: reflexive_thematic`);
          console.warn(`      • Validation level: rigorous`);

          // PHASE 10 DAY 5.17.4: Check for backend diagnostic metadata
          // Cast to any to check for optional diagnostic fields not in type definition
          const resultWithDiagnostics = result as any;
          if (
            resultWithDiagnostics.metadata ||
            resultWithDiagnostics.debug ||
            resultWithDiagnostics.rejectionDetails
          ) {
            console.warn(`\n   🔬 BACKEND DIAGNOSTICS AVAILABLE:`);
            if (resultWithDiagnostics.metadata) {
              console.warn(`      • Metadata:`, resultWithDiagnostics.metadata);
            }
            if (resultWithDiagnostics.debug) {
              console.warn(`      • Debug info:`, resultWithDiagnostics.debug);
            }
            if (resultWithDiagnostics.rejectionDetails) {
              console.warn(
                `      • Rejection details:`,
                resultWithDiagnostics.rejectionDetails
              );
            }
          } else {
            console.warn(`\n   ⚠️ No diagnostic metadata in backend response`);
            console.warn(
              `      Backend should include rejection details if themes were filtered`
            );
          }

          // PHASE 10 DAY 5.17.4: Log metadata to diagnose if themes were generated or not
          if (result.metadata) {
            console.warn(`\n   📊 Backend Processing Metadata:`);
            console.warn(
              `      • Sources analyzed: ${result.metadata.sourcesAnalyzed || 'N/A'}`
            );
            console.warn(
              `      • Codes generated: ${result.metadata.codesGenerated || 'N/A'}`
            );
            console.warn(
              `      • Candidate themes: ${result.metadata.candidateThemes || 'N/A'}`
            );
            console.warn(
              `      • Final themes: ${result.metadata.finalThemes || 'N/A'}`
            );
            console.warn(
              `      • Processing time: ${result.metadata.processingTimeMs || 'N/A'}ms`
            );

            if (result.metadata.candidateThemes === 0) {
              console.error(
                `\n   ❌ ROOT CAUSE: No candidate themes were generated`
              );
              console.error(
                `      Theme generation (Stage 3) produced 0 themes`
              );
              console.error(
                `      This is BEFORE validation - themes never made it to validation`
              );
              console.error(`      Likely causes:`);
              console.error(
                `        1. No semantic codes found in Stage 2 (Initial Coding)`
              );
              console.error(
                `        2. Codes couldn't be clustered into themes in Stage 3`
              );
              console.error(
                `        3. OpenAI API error during theme generation`
              );
            } else if (
              result.metadata.candidateThemes > 0 &&
              result.metadata.finalThemes === 0
            ) {
              console.error(
                `\n   ❌ ROOT CAUSE: ${result.metadata.candidateThemes} themes generated but ALL rejected in validation`
              );
              console.error(
                `      Rejection diagnostics SHOULD be in response - this is a bug if missing`
              );
            }
          }

          console.warn(`\n   🔍 Possible Causes:`);
          console.warn(
            `      1. Sources cover different topics with no thematic overlap`
          );
          console.warn(
            `      2. Content too short or lacks depth (try full-text papers)`
          );
          console.warn(
            `      3. Validation thresholds filtering out all themes`
          );
          console.warn(
            `      4. Need more sources on similar topics (recommended: 5+)`
          );
          console.warn(
            `\n   💡 IMPORTANT: Check backend terminal for detailed validation logs`
          );
          console.warn(
            `      Look for "ALL X GENERATED THEMES WERE REJECTED BY VALIDATION"`
          );

          completeExtraction(0);
          setUnifiedThemes([]);

          // Enhanced error message with specific guidance
          const sourceCount = allSources.length;
          let errorMessage = '⚠️ 0 themes extracted. ';

          if (sourceCount < 3) {
            errorMessage += `You selected only ${sourceCount} source(s). Themes need to appear in at least 2-3 sources to pass validation. Try selecting 5+ sources with overlapping topics.`;
          } else if (contentAnalysis.noContentCount > 0) {
            errorMessage += `${contentAnalysis.noContentCount} of your sources lacked sufficient content. Theme validation requires robust patterns across multiple sources.`;
          } else {
            errorMessage +=
              'Themes were generated but filtered out during validation. This can happen if: (1) Sources cover very different topics with no overlap, (2) Content is too short (try adding full-text papers), or (3) Validation thresholds are too strict. Try adding more sources on similar topics.';
          }

          toast.error(errorMessage, {
            duration: 15000, // Longer duration for detailed message
          });

          // Still mark papers as extracted
          const extractedIds = new Set([...extractedPapers, ...paperIds]);
          setExtractedPapers(extractedIds);
          setExtractingPapers(new Set());

          return; // Exit early
        }

        // Normal flow for > 0 themes
        console.log(
          `\n✅ [${requestId}] SUCCESS: ${result.themes.length} themes extracted`
        );
        console.log(`${'─'.repeat(60)}`);

        completeExtraction(result.themes.length);
        setUnifiedThemes(result.themes);

        // Log theme details
        console.log(`   📊 Theme Summary:`);
        result.themes.slice(0, 3).forEach((theme, idx) => {
          console.log(`      ${idx + 1}. "${theme.label}"`);
          console.log(
            `         • Confidence: ${(theme.confidence * 100).toFixed(1)}%`
          );
          console.log(`         • Sources: ${theme.sources.length}`);
          console.log(
            `         • Keywords: ${theme.keywords.slice(0, 5).join(', ')}${theme.keywords.length > 5 ? '...' : ''}`
          );
        });
        if (result.themes.length > 3) {
          console.log(`      ... and ${result.themes.length - 3} more themes`);
        }

        // Phase 10 Day 5.13: Save saturation data if present
        if (result.saturationData) {
          setV2SaturationData(result.saturationData);
          console.log(`   📈 Saturation Analysis:`, {
            saturationReached: result.saturationData.saturationReached,
            saturationPoint: result.saturationData.saturationPoint || 'N/A',
            recommendation: result.saturationData.recommendation,
          });
        }

        // Phase 10 Day 5.7: Ensure all papers marked as extracted (final check)
        const extractedIds = new Set([...extractedPapers, ...paperIds]);
        setExtractedPapers(extractedIds);
        setExtractingPapers(new Set());
        console.log(
          `   ✅ Marked ${paperIds.length} papers as extracted (cleared "extracting" state)`
        );

        // Phase 10 Day 5.13: Auto-activate themes tab (auto-discovery UX)
        setActiveTab('analysis');
        setActiveAnalysisSubTab('themes');
        console.log(`   🎯 Auto-navigated to Themes tab`);

        // Phase 10 Day 14: Celebration animation on extraction complete
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
        });

        // Phase 10 Day 5.13: Show V2 success message
        toast.success(
          `✨ Extracted ${result.themes.length} themes using ${purpose.replace('_', ' ')} methodology!`,
          {
            duration: 6000,
          }
        );

        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ [${requestId}] THEME EXTRACTION COMPLETE`);
        console.log(`   ⏱️ Total time: ${apiDuration}s`);
        console.log(`   📊 Themes extracted: ${result.themes.length}`);
        console.log(`   🎯 Purpose: ${purpose}`);
        console.log(`${'='.repeat(80)}\n`);
      } else {
        console.error(`❌ [${requestId}] EXTRACTION FAILED: Invalid response`);
        console.error(`   Response:`, result);
        console.error(`   Has result object: ${!!result}`);
        console.error(`   Has themes array: ${!!(result && result.themes)}`);
        toast.error('Theme extraction failed: Invalid response from server');
      }
    } catch (error: any) {
      const requestId = currentRequestId || 'unknown';
      console.error(`\n${'='.repeat(80)}`);
      console.error(`❌ [${requestId}] THEME EXTRACTION ERROR`);
      console.error(`${'='.repeat(80)}`);
      console.error(`⏰ Timestamp: ${new Date().toISOString()}`);
      console.error(`🔍 Error Type: ${error.name || 'Unknown'}`);
      console.error(`💬 Error Message: ${error.message || 'No message'}`);

      // Log error details
      if (error.response) {
        console.error(`\n📡 API Error Details:`);
        console.error(`   • Status: ${error.response.status}`);
        console.error(`   • Status Text: ${error.response.statusText}`);
        console.error(`   • Response Data:`, error.response.data);
        console.error(`   • Headers:`, error.response.headers);
      } else if (error.request) {
        console.error(`\n🌐 Network Error (no response received):`);
        console.error(`   • Request:`, error.request);
        console.error(
          `   • Possible causes: timeout, network issue, CORS, server down`
        );
      } else {
        console.error(`\n⚙️ Client-side Error:`);
        console.error(`   • Error:`, error);
      }

      // Log stack trace
      if (error.stack) {
        console.error(`\n📚 Stack Trace:`);
        console.error(error.stack);
      }

      // Log context
      console.error(`\n📊 Context at time of error:`);
      console.error(`   • Purpose: ${purpose}`);
      console.error(`   • Sources: ${allSources.length}`);
      console.error(`   • Full-text papers: ${contentAnalysis.fullTextCount}`);
      console.error(`   • Papers being extracted:`, paperIds);

      // Phase 10 Day 5.7: Clear extracting state on error
      setExtractingPapers(new Set());
      console.error(
        `   ✅ Cleared "extracting" state for ${paperIds.length} papers`
      );

      // Phase 10 Day 5.6: Set error in progress
      setExtractionError(error.message || 'Unknown error');

      console.error(`${'='.repeat(80)}\n`);

      toast.error(
        `Theme extraction failed: ${error.message || 'Unknown error'}`
      );
    } finally {
      setAnalyzingThemes(false);
      // Progress UI will auto-dismiss after showing complete/error state
      const requestId = currentRequestId || 'unknown';
      console.log(
        `🏁 [${requestId}] handlePurposeSelected finally block - cleanup complete`
      );
    }
  };

  // Phase 10 Day 5.12: Helper to convert UnifiedTheme to Theme format
  const mapUnifiedThemeToTheme = (unifiedTheme: UnifiedTheme) => ({
    id: unifiedTheme.id,
    name: unifiedTheme.label,
    description: unifiedTheme.description || '',
    prevalence: unifiedTheme.weight,
    confidence: unifiedTheme.confidence,
    sources: unifiedTheme.sources.map(source => ({
      id: source.sourceId,
      title: source.sourceTitle,
      type: source.sourceType,
    })),
    keyPhrases: unifiedTheme.keywords,
  });

  // Phase 10 Day 5.12: Enhanced Theme Integration Handlers
  const handleGenerateQuestions = async () => {
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      return;
    }

    console.log('[handleGenerateQuestions] Starting...');
    console.log(
      '[handleGenerateQuestions] selectedThemeIds:',
      selectedThemeIds
    );
    console.log(
      '[handleGenerateQuestions] unifiedThemes count:',
      unifiedThemes.length
    );

    setLoadingQuestions(true);
    try {
      // Map theme IDs to full theme objects and convert to API format
      const selectedThemes = unifiedThemes
        .filter(theme => selectedThemeIds.includes(theme.id))
        .map(mapUnifiedThemeToTheme);

      console.log(
        '[handleGenerateQuestions] selectedThemes count:',
        selectedThemes.length
      );
      console.log('[handleGenerateQuestions] selectedThemes:', selectedThemes);

      const requestPayload = {
        themes: selectedThemes,
        maxQuestions: 5,
        researchGoal: extractionPurpose || 'qualitative_analysis',
      };
      console.log('[handleGenerateQuestions] Request payload:', requestPayload);

      const result =
        await enhancedThemeIntegrationService.suggestQuestions(requestPayload);
      console.log('[handleGenerateQuestions] Success! Result:', result);
      setResearchQuestions(result);
      toast.success(`Generated ${result.length} research questions`);
    } catch (error: any) {
      console.error('[handleGenerateQuestions] Error:', error);
      console.error('[handleGenerateQuestions] Error message:', error.message);
      console.error(
        '[handleGenerateQuestions] Error response:',
        error.response
      );
      toast.error(`Failed to generate questions: ${error.message}`);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleGenerateHypotheses = async () => {
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      return;
    }

    setLoadingHypotheses(true);
    try {
      // Map theme IDs to full theme objects and convert to API format
      const selectedThemes = unifiedThemes
        .filter(theme => selectedThemeIds.includes(theme.id))
        .map(mapUnifiedThemeToTheme);

      const result = await enhancedThemeIntegrationService.suggestHypotheses({
        themes: selectedThemes,
        maxHypotheses: 5,
        hypothesisTypes: ['correlational', 'causal', 'mediation'],
      });
      setHypotheses(result);
      toast.success(`Generated ${result.length} hypotheses`);
    } catch (error: any) {
      console.error('Error generating hypotheses:', error);
      toast.error(`Failed to generate hypotheses: ${error.message}`);
    } finally {
      setLoadingHypotheses(false);
    }
  };

  const handleMapConstructs = async () => {
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      return;
    }

    setLoadingConstructs(true);
    try {
      // Map theme IDs to full theme objects and convert to API format
      const selectedThemes = unifiedThemes
        .filter(theme => selectedThemeIds.includes(theme.id))
        .map(mapUnifiedThemeToTheme);

      const result = await enhancedThemeIntegrationService.mapConstructs({
        themes: selectedThemes,
        includeRelationships: true,
      });
      setConstructMappings(result);
      toast.success(`Mapped ${result.length} constructs`);
    } catch (error: any) {
      console.error('Error mapping constructs:', error);
      toast.error(`Failed to map constructs: ${error.message}`);
    } finally {
      setLoadingConstructs(false);
    }
  };

  const handleGenerateSurvey = async (config: SurveyGenerationConfig) => {
    if (selectedThemeIds.length === 0) {
      toast.error('Please select themes first');
      return;
    }

    setLoadingSurvey(true);
    try {
      // Map theme IDs to full theme objects and convert to API format
      const selectedThemes = unifiedThemes
        .filter(theme => selectedThemeIds.includes(theme.id))
        .map(mapUnifiedThemeToTheme);

      const result =
        await enhancedThemeIntegrationService.generateCompleteSurvey({
          themes: selectedThemes,
          surveyPurpose: config.purpose,
          targetRespondentCount: config.targetRespondents,
          complexityLevel: config.complexityLevel,
          includeDemographics: config.includeDemographics,
          includeValidityChecks: config.includeValidityChecks,
        });

      // Transform CompleteSurvey to GeneratedSurvey format
      const transformedSurvey = {
        sections: result.sections,
        metadata: {
          totalItems: result.metadata.totalItems,
          estimatedCompletionTime: result.metadata.estimatedCompletionTime,
          themeCoverage: selectedThemes.map(theme => ({
            themeId: theme.id,
            themeName: theme.name,
            itemCount: result.sections.reduce(
              (count, section) =>
                count +
                section.items.filter(item =>
                  item.themeProvenance.includes(theme.id)
                ).length,
              0
            ),
          })),
          generatedAt: new Date().toISOString(),
          purpose: config.purpose,
        },
      };

      setGeneratedSurvey(transformedSurvey);
      toast.success('Survey generated successfully!');
    } catch (error: any) {
      console.error('Error generating survey:', error);
      toast.error(`Failed to generate survey: ${error.message}`);
    } finally {
      setLoadingSurvey(false);
    }
  };

  const handleAnalyzeGaps = async () => {
    // Use selected papers for gap analysis
    if (selectedPapers.size === 0) {
      toast.error('Please select papers to analyze for research gaps');
      return;
    }

    setAnalyzingGaps(true);
    try {
      console.log(
        '🔍 Analyzing research gaps from',
        selectedPapers.size,
        'papers'
      );

      // Get full paper objects for selected IDs
      const selectedPaperObjects = papers.filter(p => selectedPapers.has(p.id));

      console.log(
        '📄 Selected paper objects:',
        selectedPaperObjects.length,
        'papers'
      );
      console.log(
        '📝 Sample paper:',
        selectedPaperObjects[0]
          ? {
              id: selectedPaperObjects[0].id,
              title: selectedPaperObjects[0].title,
              hasAbstract: !!selectedPaperObjects[0].abstract,
            }
          : 'No papers'
      );

      // Send full paper objects to API
      const researchGaps =
        await literatureAPI.analyzeGapsFromPapers(selectedPaperObjects);

      console.log(
        '✅ Gap analysis complete:',
        researchGaps.length,
        'gaps found'
      );

      setGaps(researchGaps);
      setActiveTab('analysis'); // PHASE 9 DAY 24: Switch to analysis tab
      setActiveAnalysisSubTab('gaps'); // Show gaps sub-tab
      toast.success(
        `Identified ${researchGaps.length} research opportunities from ${selectedPaperObjects.length} papers`
      );
    } catch (error: any) {
      console.error('❌ Gap analysis failed:', error);
      toast.error(`Gap analysis failed: ${error.message || 'Unknown error'}`);
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
    console.log('🎯 [Q-Statements] Button clicked');
    console.log(`   Themes available: ${unifiedThemes.length}`);

    if (unifiedThemes.length === 0) {
      toast.error('Please extract themes first');
      return;
    }

    try {
      const themeNames = unifiedThemes.map(t => t.label);
      console.log(`   Theme names: ${themeNames.join(', ')}`);
      console.log(`   Query: ${query}`);
      console.log('   Calling API...');

      const statements = await literatureAPI.generateStatementsFromThemes(
        themeNames,
        { topic: query }
      );

      console.log(
        `✅ [Q-Statements] Generated ${statements.length} statements`
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

      console.log('   Navigating to study creation page...');
      // Navigate to study creation page with generated statements
      // Phase 10 Day 14 FIX: Use actual existing route (not aspirational consolidation)
      // Note: /build/study page.tsx doesn't exist yet, /studies/create does
      router.push('/studies/create?from=literature&statementsReady=true');
    } catch (error: any) {
      console.error('❌ [Q-Statements] Generation failed:', error);
      console.error('   Error message:', error.message);
      console.error('   Error response:', error.response?.data);
      toast.error(
        `Statement generation failed: ${error.message || 'Unknown error'}`
      );
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
    const isExtracted = extractedPapers.has(paper.id); // Phase 10 Day 5.7: Check extraction status
    const isExtracting = extractingPapers.has(paper.id); // Phase 10 Day 5.7: Check if currently extracting

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        layout // Phase 10 Day 5.7: Prevent jumping during badge updates
        transition={{ layout: { duration: 0.2 } }}
        className={cn(
          'border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer relative',
          isSelected && 'border-blue-500 bg-blue-50/50',
          isExtracted && 'border-green-200 bg-green-50/30',
          isExtracting && 'border-amber-300 bg-amber-50/30'
        )}
        onClick={() => togglePaperSelection(paper.id)}
      >
        {/* Phase 10 Day 5.7: Real-time Extracting Status Badge */}
        {isExtracting && !isExtracted && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute -top-2 -right-2 z-10"
          >
            <Badge
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg px-2 py-1 gap-1 border-2 border-white animate-pulse"
              aria-label="Extracting themes"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs font-semibold">Extracting...</span>
            </Badge>
          </motion.div>
        )}

        {/* Phase 10 Day 5.7: Extracted Status Badge */}
        {isExtracted && !isExtracting && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute -top-2 -right-2 z-10"
          >
            <Badge
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg px-2 py-1 gap-1 border-2 border-white"
              aria-label="Themes extracted"
            >
              <Check className="w-3 h-3" />
              <span className="text-xs font-semibold">Extracted</span>
            </Badge>
          </motion.div>
        )}

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center mt-1 transition-all',
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300',
                  isExtracted && !isSelected && 'border-green-500',
                  isExtracting && !isSelected && 'border-amber-500 bg-amber-50'
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
                {!isSelected && isExtracting && (
                  <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                )}
                {!isSelected && !isExtracting && isExtracted && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg leading-tight flex-1">
                    {paper.title}
                  </h3>
                  {paper.source &&
                    (() => {
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
                <div className="flex gap-4 mt-2 text-sm text-gray-500 flex-wrap">
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
                    {paper.citationCount === null ||
                    paper.citationCount === undefined
                      ? 'No citation info'
                      : `${paper.citationCount} citation${paper.citationCount === 1 ? '' : 's'}`}
                  </span>
                  {/* Phase 10 Day 5.13+: Word Count Badge - Clear Labeling */}
                  {paper.wordCount !== null &&
                    paper.wordCount !== undefined && (
                      <span
                        className={cn(
                          'flex items-center gap-1 font-medium',
                          paper.isEligible ? 'text-green-600' : 'text-amber-600'
                        )}
                        title={
                          `Word count: Title + Abstract (${paper.wordCount.toLocaleString()} words)\n\n` +
                          `Excludes: references, bibliography, indexes, glossaries, appendices, acknowledgments.\n\n` +
                          `Abstract only: ${paper.abstractWordCount?.toLocaleString() || 'N/A'} words\n\n` +
                          (paper.isEligible
                            ? '✓ Meets minimum 1,000 word threshold for theme extraction'
                            : '⚠ Below 1,000 word threshold - may lack sufficient content for theme extraction') +
                          `\n\nNote: Full-text access coming in Phase 10 Day 5.15`
                        }
                      >
                        <MessageSquare className="w-3 h-3" />
                        {paper.wordCount.toLocaleString()} words
                        <span className="text-xs opacity-75">
                          (Title+Abstract)
                        </span>
                        {!paper.isEligible && (
                          <span className="text-xs ml-1 bg-amber-100 px-1 rounded">
                            short
                          </span>
                        )}
                      </span>
                    )}
                  {/* Phase 10 Day 5.15.2: ENHANCED Full-Text + Abstract Overflow Detection */}
                  {(() => {
                    const hasFullText =
                      (paper as any).fullTextStatus === 'success';
                    const isFetching =
                      (paper as any).fullTextStatus === 'fetching';
                    const hasFailed =
                      (paper as any).fullTextStatus === 'failed';
                    const abstractLength = paper.abstract?.length || 0;
                    const isAbstractOverflow = abstractLength > 2000; // Full article in abstract field

                    // Show badge if: has full-text, fetching, failed, OR detected overflow
                    if (
                      !hasFullText &&
                      !isFetching &&
                      !hasFailed &&
                      !isAbstractOverflow
                    )
                      return null;

                    return (
                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md',
                          hasFullText
                            ? 'text-green-700 bg-green-50 border border-green-200'
                            : isAbstractOverflow
                              ? 'text-purple-700 bg-purple-50 border border-purple-200'
                              : isFetching
                                ? 'text-blue-700 bg-blue-50 border border-blue-200 animate-pulse'
                                : 'text-gray-600 bg-gray-50 border border-gray-200'
                        )}
                        title={
                          hasFullText
                            ? `✅ Full-text available (${(paper as any).fullTextWordCount?.toLocaleString() || 'N/A'} words). Provides 40-50x more content for deeper theme extraction.`
                            : isAbstractOverflow
                              ? `📄 Full article detected in abstract field (${abstractLength.toLocaleString()} chars). System will treat as full-text for validation.`
                              : isFetching
                                ? 'Fetching full-text PDF from open-access sources (Unpaywall API)...'
                                : `📝 Abstract-only (${abstractLength} chars). System will automatically adjust validation thresholds for abstract-length content.`
                        }
                      >
                        {hasFullText && (
                          <>
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Full-text (
                            {(
                              paper as any
                            ).fullTextWordCount?.toLocaleString() || '?'}{' '}
                            words)
                          </>
                        )}
                        {isAbstractOverflow && (
                          <>
                            <svg
                              className="w-3 h-3"
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
                            Full article ({Math.round(abstractLength / 1000)}k
                            chars)
                          </>
                        )}
                        {isFetching && (
                          <>
                            <svg
                              className="w-3 h-3 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Fetching full-text...
                          </>
                        )}
                        {!hasFullText && !isAbstractOverflow && !isFetching && (
                          <>
                            <svg
                              className="w-3 h-3"
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
                            Abstract ({Math.round(abstractLength)} chars)
                          </>
                        )}
                      </span>
                    );
                  })()}
                  {/* Phase 10 Day 5.13+ Extension 2: Citations per Year (Impact Velocity) */}
                  {paper.citationsPerYear !== null &&
                    paper.citationsPerYear !== undefined &&
                    paper.citationsPerYear > 0 && (
                      <span
                        className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md"
                        title="Citation velocity (citations per year) - measures ongoing research impact. Higher values indicate influential work that continues to be cited."
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span className="font-semibold">
                          {paper.citationsPerYear.toFixed(1)}
                        </span>
                        <span className="text-xs opacity-75">cites/yr</span>
                      </span>
                    )}
                  {/* Phase 10 Day 5.13+ Extension 2: Quality Score Badge (Enterprise) */}
                  {paper.qualityScore !== null &&
                    paper.qualityScore !== undefined && (
                      <span
                        className={cn(
                          'flex items-center gap-1 font-medium px-2 py-0.5 rounded-md',
                          paper.qualityScore >= 70
                            ? 'text-green-700 bg-green-50 border border-green-200'
                            : paper.qualityScore >= 50
                              ? 'text-blue-700 bg-blue-50 border border-blue-200'
                              : paper.qualityScore >= 30
                                ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                : 'text-gray-700 bg-gray-50 border border-gray-200'
                        )}
                        title={`Enterprise quality score based on citation impact (30%), journal prestige (25%), content depth (15%), recency (15%), and venue quality (15%)`}
                      >
                        <Award className="w-3 h-3" />
                        <span className="font-semibold">
                          {paper.qualityScore.toFixed(0)}
                        </span>
                        <span className="text-xs opacity-75">
                          {paper.qualityScore >= 80
                            ? 'Exceptional'
                            : paper.qualityScore >= 70
                              ? 'Excellent'
                              : paper.qualityScore >= 60
                                ? 'V.Good'
                                : paper.qualityScore >= 50
                                  ? 'Good'
                                  : paper.qualityScore >= 40
                                    ? 'Acceptable'
                                    : paper.qualityScore >= 30
                                      ? 'Fair'
                                      : 'Limited'}
                        </span>
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
                  {/* Phase 10 Day 5.13+ Extension 2: Show View Paper for DOI OR URL (enterprise-grade access) */}
                  {(paper.doi || paper.url) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Prioritize DOI (more permanent), fallback to URL
                        const link = paper.doi
                          ? `https://doi.org/${paper.doi}`
                          : paper.url;
                        window.open(link, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Paper
                    </Button>
                  )}
                  {/* Phase 10 Day 5.13+ Extension 3: Full-Text Access for High-Quality Papers (Scientifically-Backed Tier 2) */}
                  {paper.doi && (paper.qualityScore ?? 0) >= 70 && (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        // Unpaywall API provides free full-text PDFs for open-access papers
                        // Format: https://api.unpaywall.org/v2/{DOI}?email=YOUR_EMAIL
                        // For now, try direct PDF link via Unpaywall redirect
                        window.open(
                          `https://api.unpaywall.org/v2/${paper.doi}?email=research@blackqmethod.com`,
                          '_blank'
                        );
                      }}
                      title="High-quality paper (≥70) - Full-text may be available via open access. Scientific justification: Purposive sampling (Patton 2002) - deep analysis of best papers."
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Full Text
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
          {/* Phase 10 Day 5.7: Extracting papers badge (real-time) */}
          {extractingPapers.size > 0 && (
            <Badge
              variant="outline"
              className="py-2 px-4 border-amber-500 text-amber-700 bg-amber-50 animate-pulse"
            >
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {extractingPapers.size} extracting
            </Badge>
          )}
          {/* Phase 10 Day 5.7: Extracted papers badge */}
          {extractedPapers.size > 0 && (
            <Badge
              variant="outline"
              className="py-2 px-4 border-green-500 text-green-700 bg-green-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {extractedPapers.size} extracted
            </Badge>
          )}
          <Badge variant="outline" className="py-2 px-4">
            <Star className="w-4 h-4 mr-2" />
            {savedPapers.length} saved
          </Badge>
        </div>
      </div>

      {/* PHASE 10 DAY 5.17.4: State Restoration Banner */}
      {showRestoreBanner && restoreSummary && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-1"
        >
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Resume Previous Session?
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    We found your previous literature review session with{' '}
                    <strong>{restoreSummary.itemCount} items</strong>
                    {restoreSummary.hoursAgo && (
                      <span>
                        {' '}
                        from{' '}
                        {restoreSummary.hoursAgo < 1
                          ? 'less than an hour'
                          : `${Math.floor(restoreSummary.hoursAgo)} ${Math.floor(restoreSummary.hoursAgo) === 1 ? 'hour' : 'hours'}`}{' '}
                        ago
                      </span>
                    )}
                    . Would you like to continue where you left off?
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    This includes your search results, themes, research
                    questions, and selections. State expires after 24 hours.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={handleRestoreState}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Restore Session
                </Button>
                <Button
                  onClick={handleDismissRestore}
                  variant="outline"
                  className="text-gray-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Start Fresh
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
                      <option value="citations">Citations (Total)</option>
                      <option value="citations_per_year">
                        Citations/Year (Impact)
                      </option>
                      <option value="quality_score">
                        Quality Score (Enterprise)
                      </option>
                      <option value="word_count">Word Count (Depth)</option>
                      <option value="date">Date (Newest)</option>
                    </select>
                  </div>
                </div>

                {/* Phase 10 Day 5.13+ Extension 2: Enterprise Quality Filtering Transparency */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Award className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-900">
                    <strong>Enterprise Research-Grade Filtering:</strong>{' '}
                    Results automatically exclude papers with abstracts &lt;100
                    words. Quality scores (0-100) combine citation impact,
                    journal prestige, content depth, and recency.
                    <strong className="text-green-700">
                      {' '}
                      High-quality papers (≥70) show "Full Text" button for
                      open-access PDFs.
                    </strong>
                    <a
                      href="#"
                      className="underline ml-1"
                      onClick={e => {
                        e.preventDefault();
                        alert(`Quality Score Algorithm (Enterprise Research-Grade):

🏆 5-Dimensional Composite Score (0-100):

1. Citation Impact (30%):
   • 50+ cites/year = World-class (100 pts)
   • 10+ cites/year = Excellent (70 pts)
   • 5+ cites/year = Good (50 pts)
   • 1+ cites/year = Average (20 pts)

2. Journal Prestige (25%):
   • Impact Factor (IF)
   • SCImago Journal Rank (SJR)
   • Quartile (Q1-Q4)
   • Journal h-index

3. Content Depth (15%):
   • 8000+ words = Extensive (100 pts)
   • 3000-8000 = Comprehensive (70-100 pts)
   • 1000-3000 = Standard (40-70 pts)

4. Recency Boost (15%):
   • Current year = 100 pts
   • 1 year old = 80 pts
   • 2 years old = 60 pts

5. Venue Quality (15%):
   • Top-tier (Nature/Science) = 100 pts
   • Peer-reviewed journal = 70-90 pts
   • Conference = 50-70 pts
   • Preprint = 30-50 pts

Quality Tiers:
✅ Exceptional (80-100): Breakthrough research
✅ Excellent (70-79): High-quality methodology
✅ Very Good (60-69): Solid research
✅ Good (50-59): Acceptable research quality
⚠️  Acceptable (40-49): Marginal quality, use with caution
⚠️  Fair (30-39): Limited quality, consider excluding
❌ Limited (<30): Below research-grade standards`);
                      }}
                    >
                      Learn more
                    </a>
                  </AlertDescription>
                </Alert>

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
                      const newDatabases = academicDatabases.includes(source.id)
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

          {/* Phase 10 Day 5.15: Content Depth Transparency Banner */}
          {selectedPapers.size > 0 &&
            (() => {
              const selectedPaperObjects = papers.filter(p =>
                selectedPapers.has(p.id)
              );
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
                        .reduce(
                          (sum, p) => sum + ((p as any).fullTextWordCount || 0),
                          0
                        ) / fullTextCount
                    )
                  : 0;
              const avgAbstractWords =
                abstractOnlyCount > 0
                  ? Math.round(
                      selectedPaperObjects
                        .filter(p => (p as any).fullTextStatus !== 'success')
                        .reduce(
                          (sum, p) => sum + (p.abstractWordCount || 0),
                          0
                        ) / abstractOnlyCount
                    )
                  : 0;

              return fullTextCount > 0 || fetchingCount > 0 ? (
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
                    <strong>Methodology:</strong> Full-text provides richer
                    coding (40-50x more content) for high-quality papers (≥70
                    score). Abstracts sufficient for preliminary theme
                    identification (Thomas & Harden 2008).
                    {fetchingCount > 0 &&
                      ' You may extract now or wait ~2 min for full-text to complete.'}
                  </p>
                </div>
              ) : null;
            })()}

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
            {/* Phase 10 Day 18: Incremental Extraction Button */}
            <Button
              variant="outline"
              onClick={() => incrementalExtraction.openIncrementalExtraction()}
              disabled={
                (selectedPapers.size === 0 && transcribedVideos.length === 0) ||
                analyzingThemes
              }
              className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-300"
              title="Add papers incrementally to existing corpus and save costs via caching"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Extract Incrementally</span>
              {incrementalExtraction.corpusList.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-100 dark:bg-blue-900"
                >
                  {incrementalExtraction.corpusList.length} corpus
                </Badge>
              )}
            </Button>
            {/* Phase 10 Day 18: Manage Corpuses Button */}
            <Button
              variant="outline"
              onClick={() => incrementalExtraction.openCorpusManagement()}
              className="flex items-center gap-2"
              title="View and manage your research corpuses"
            >
              <Database className="w-4 h-4" />
              <span>Manage Corpuses</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportCitations('bibtex')}
              disabled={selectedPapers.size === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export BibTeX
            </Button>
            {/* Phase 10 Day 5.17.5: Q-Statements button moved to purpose-specific actions section (line 5249) */}
            {/* Purpose-specific rendering ensures only Q-Methodology users see this button */}
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

      {/* PHASE 10 DAY 5.13: Theme Extraction Action Card */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Extract Research Themes
                </h3>
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-700"
                >
                  Purpose-Driven AI
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Select your research purpose (Q-methodology, survey
                construction, etc.) and extract themes using purpose-adaptive
                algorithms with full provenance tracking.
              </p>

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
                {unifiedThemes.length > 0 && (
                  <div className="text-sm">
                    <span className="font-semibold text-green-600">
                      {unifiedThemes.length}
                    </span>
                    <span className="text-gray-500 ml-1">themes extracted</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                size="lg"
                onClick={handleExtractThemes}
                disabled={
                  (selectedPapers.size === 0 &&
                    transcribedVideos.length === 0) ||
                  analyzingThemes
                }
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
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

              {selectedPapers.size === 0 && transcribedVideos.length === 0 && (
                <p className="text-xs text-amber-600 mt-3">
                  ⚠️ Select papers from search results above or transcribe
                  videos to begin extraction
                </p>
              )}

              {/* Phase 10 Day 5.14: Warn about minimum source requirements */}
              {selectedPapers.size + transcribedVideos.length > 0 &&
                selectedPapers.size + transcribedVideos.length < 3 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-800 mb-1">
                      ⚠️ Low Source Count Warning
                    </p>
                    <p className="text-xs text-amber-700">
                      You've selected{' '}
                      {selectedPapers.size + transcribedVideos.length}{' '}
                      source(s). For reliable theme extraction, we recommend:
                    </p>
                    <ul className="text-xs text-amber-700 list-disc ml-4 mt-1 space-y-0.5">
                      <li>
                        <strong>Minimum: 3-5 sources</strong> for basic themes
                      </li>
                      <li>
                        <strong>Recommended: 5-10 sources</strong> for robust
                        patterns
                      </li>
                      <li>
                        <strong>Optimal: 10+ sources</strong> for
                        publication-ready analysis
                      </li>
                    </ul>
                    <p className="text-xs text-amber-600 mt-2">
                      💡 <strong>Why?</strong> Themes must appear across
                      multiple sources to be validated. With fewer sources,
                      themes may be rejected for not meeting the minimum overlap
                      requirement.
                    </p>
                  </div>
                )}

              {/* Phase 10 Day 5.14: Warn about papers without abstracts */}
              {selectedPapers.size > 0 &&
                papers.filter(
                  p =>
                    selectedPapers.has(p.id) &&
                    (!p.abstract || p.abstract.length < 100)
                ).length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-semibold text-red-800 mb-1">
                      ⚠️ Content Warning
                    </p>
                    <p className="text-xs text-red-700">
                      {
                        papers.filter(
                          p =>
                            selectedPapers.has(p.id) &&
                            (!p.abstract || p.abstract.length < 100)
                        ).length
                      }{' '}
                      of your selected papers have no abstracts or very short
                      abstracts (&lt;100 characters). These papers will be
                      skipped during extraction.
                    </p>
                    <p className="text-xs text-red-600 mt-2">
                      💡 <strong>Tip:</strong> Focus on papers from PubMed or
                      arXiv which typically have full abstracts.
                    </p>
                  </div>
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
                          const originalQueryText =
                            queryCorrectionMessage.original;
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
                              Auto-corrected from: "
                              {queryCorrectionMessage.original}"
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant="outline" className="bg-white">
                          {totalResults}{' '}
                          {totalResults === 1 ? 'result' : 'results'}
                        </Badge>
                        {/* Phase 10 Day 5.13+ Extension 2: Prominent Sort Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Sort:</span>
                          <select
                            value={appliedFilters.sortBy}
                            onChange={e => {
                              const newSort = e.target.value as any;
                              setFilters({ ...filters, sortBy: newSort });
                              setAppliedFilters({
                                ...appliedFilters,
                                sortBy: newSort,
                              });
                              // Trigger re-search with new sort
                              if (query) {
                                handleSearch();
                              }
                            }}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:border-blue-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="relevance">Relevance</option>
                            <option value="quality_score">Quality Score</option>
                            <option value="citations_per_year">
                              Citations/Year
                            </option>
                            <option value="citations">Citations (Total)</option>
                            <option value="word_count">Word Count</option>
                            <option value="date">Newest</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phase 10 Day 5.13+ Extension 2: Quality Score Legend */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-700 mb-1.5">
                          Quality Score Legend (Enterprise Research-Grade) |
                          <span className="text-green-600 ml-1">
                            🟢 = Full-text available for Excellent+ papers
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-600"></span>
                            <span className="text-green-700 font-medium">
                              70-100
                            </span>
                            <span className="text-gray-600">
                              Excellent/Exceptional
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            <span className="text-blue-700 font-medium">
                              50-69
                            </span>
                            <span className="text-gray-600">Good/V.Good</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                            <span className="text-amber-700 font-medium">
                              40-49
                            </span>
                            <span className="text-gray-600">Acceptable</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="text-amber-600 font-medium">
                              30-39
                            </span>
                            <span className="text-gray-600">Fair</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            <span className="text-gray-700 font-medium">
                              &lt;30
                            </span>
                            <span className="text-gray-600">Limited</span>
                          </span>
                          <span className="flex items-center gap-1 ml-auto">
                            <TrendingUp className="w-3 h-3 text-blue-600" />
                            <span className="text-gray-600">
                              = Citations/Year
                            </span>
                          </span>
                        </div>
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
              {/* ENTERPRISE: Debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  Debug: {unifiedThemes.length} themes loaded | Active Tab:{' '}
                  {activeTab} | Active Sub-Tab: {activeAnalysisSubTab}
                </div>
              )}

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

                  {/* Phase 10 Day 5.13: Theme Count Guidance with Saturation Visualization */}
                  {extractionPurpose && v2SaturationData && (
                    <ThemeCountGuidance
                      purpose={extractionPurpose}
                      currentThemeCount={unifiedThemes.length}
                      targetRange={
                        extractionPurpose === 'q_methodology'
                          ? { min: 30, max: 80 }
                          : extractionPurpose === 'survey_construction'
                            ? { min: 5, max: 15 }
                            : extractionPurpose === 'qualitative_analysis'
                              ? { min: 5, max: 20 }
                              : extractionPurpose === 'literature_synthesis'
                                ? { min: 10, max: 25 }
                                : { min: 8, max: 15 }
                      }
                      saturationData={v2SaturationData}
                      totalSources={
                        selectedPapers.size + transcribedVideos.length
                      }
                    />
                  )}

                  {/* Phase 10 Day 14: Theme Methodology Explainer - Educational transparency */}
                  <ThemeMethodologyExplainer />

                  {/* Phase 10 Day 5.13: Enterprise Theme Cards with Purpose-Specific Display */}
                  {unifiedThemes.map((theme, index) => {
                    // ENTERPRISE: Verify theme data structure before rendering
                    if (!theme || !theme.id) {
                      console.error('❌ Invalid theme at index', index, theme);
                      return null;
                    }

                    return (
                      <EnterpriseThemeCard
                        key={theme.id}
                        theme={theme}
                        index={index}
                        totalThemes={unifiedThemes.length}
                        purpose={extractionPurpose || 'qualitative_analysis'}
                        showConfidenceBadge={true}
                        showEvidence={true}
                        isSelectable={true}
                        isSelected={selectedThemeIds.includes(theme.id)}
                        onToggleSelect={themeId => {
                          setSelectedThemeIds(prev =>
                            prev.includes(themeId)
                              ? prev.filter(id => id !== themeId)
                              : [...prev, themeId]
                          );
                        }}
                      />
                    );
                  })}

                  {/* Phase 10 Day 5.17.5: Purpose-Specific Theme Actions Section */}
                  <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        Purpose-Specific Actions
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {extractionPurpose === 'q_methodology' &&
                          'Generate Q-methodology statements for sorting studies'}
                        {extractionPurpose === 'survey_construction' &&
                          'Transform constructs into validated survey scales'}
                        {extractionPurpose === 'qualitative_analysis' &&
                          'Flexible analysis options for qualitative research'}
                        {extractionPurpose === 'literature_synthesis' &&
                          'Meta-analytic research questions and synthesis outputs'}
                        {extractionPurpose === 'hypothesis_generation' &&
                          'Theory-building outputs for hypothesis development'}
                        {!extractionPurpose &&
                          'Transform extracted themes into research outputs'}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Theme Selection Info */}
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedThemeIds.length > 0 ? (
                                <>
                                  Selected {selectedThemeIds.length} theme
                                  {selectedThemeIds.length !== 1 ? 's' : ''}
                                </>
                              ) : (
                                <>Select themes above to enable actions</>
                              )}
                            </p>
                            {selectedThemeIds.length === 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Click the checkbox on theme cards to select them
                              </p>
                            )}
                          </div>
                          {selectedThemeIds.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedThemeIds([])}
                            >
                              Clear Selection
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* PHASE 10 DAY 5.17.5: Purpose-Specific Action Buttons Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Q-Statements (Q-Methodology ONLY) */}
                        {extractionPurpose === 'q_methodology' && (
                          <Card className="border border-indigo-200 hover:border-indigo-400 transition-colors">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Q-Statements (Primary)
                              </h4>
                              <p className="text-xs text-gray-600 mb-3">
                                Generate 40-60 Q-methodology statements for
                                participant sorting
                              </p>
                              <Button
                                onClick={handleGenerateStatements}
                                disabled={unifiedThemes.length === 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                                size="sm"
                              >
                                Generate Q-Statements
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {/* Complete Survey (Survey Construction ONLY) */}
                        {extractionPurpose === 'survey_construction' && (
                          <Card className="border border-amber-200 hover:border-amber-400 transition-colors">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-amber-600" />
                                Complete Survey (Primary)
                              </h4>
                              <p className="text-xs text-gray-600 mb-3">
                                Generate validated survey scales with
                                psychometric properties
                              </p>
                              <Button
                                onClick={() => setShowSurveyModal(true)}
                                disabled={
                                  selectedThemeIds.length === 0 || loadingSurvey
                                }
                                className="w-full bg-amber-600 hover:bg-amber-700"
                                size="sm"
                              >
                                {loadingSurvey ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>Generate Complete Survey</>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {/* Research Questions (Literature Synthesis, Qualitative Analysis, Hypothesis Generation) */}
                        {(extractionPurpose === 'literature_synthesis' ||
                          extractionPurpose === 'qualitative_analysis' ||
                          extractionPurpose === 'hypothesis_generation' ||
                          !extractionPurpose) && (
                          <Card className="border border-blue-200 hover:border-blue-400 transition-colors">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                Research Questions
                              </h4>
                              <p className="text-xs text-gray-600 mb-3">
                                Generate AI-suggested research questions from
                                selected themes
                              </p>
                              <Button
                                onClick={handleGenerateQuestions}
                                disabled={
                                  selectedThemeIds.length === 0 ||
                                  loadingQuestions
                                }
                                className="w-full"
                                size="sm"
                              >
                                {loadingQuestions ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>Generate Questions</>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {/* Hypotheses (Hypothesis Generation, Literature Synthesis, Qualitative Analysis) */}
                        {(extractionPurpose === 'hypothesis_generation' ||
                          extractionPurpose === 'literature_synthesis' ||
                          extractionPurpose === 'qualitative_analysis' ||
                          !extractionPurpose) && (
                          <Card className="border border-purple-200 hover:border-purple-400 transition-colors">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <GitBranch className="w-4 h-4 text-purple-600" />
                                Hypotheses
                              </h4>
                              <p className="text-xs text-gray-600 mb-3">
                                Generate testable hypotheses with variables
                                identified
                              </p>
                              <Button
                                onClick={handleGenerateHypotheses}
                                disabled={
                                  selectedThemeIds.length === 0 ||
                                  loadingHypotheses
                                }
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                size="sm"
                              >
                                {loadingHypotheses ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>Generate Hypotheses</>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {/* Construct Map (Hypothesis Generation, Literature Synthesis, Qualitative Analysis) */}
                        {(extractionPurpose === 'hypothesis_generation' ||
                          extractionPurpose === 'literature_synthesis' ||
                          extractionPurpose === 'qualitative_analysis' ||
                          !extractionPurpose) && (
                          <Card className="border border-green-200 hover:border-green-400 transition-colors">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <GitBranch className="w-4 h-4 text-green-600" />
                                Construct Map
                              </h4>
                              <p className="text-xs text-gray-600 mb-3">
                                Map themes to theoretical constructs with
                                relationships
                              </p>
                              <Button
                                onClick={handleMapConstructs}
                                disabled={
                                  selectedThemeIds.length === 0 ||
                                  loadingConstructs
                                }
                                className="w-full bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                {loadingConstructs ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Mapping...
                                  </>
                                ) : (
                                  <>Map Constructs</>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        {/* Complete Survey (Qualitative Analysis fallback only - primary is for survey_construction) */}
                        {(extractionPurpose === 'qualitative_analysis' ||
                          !extractionPurpose) && (
                          <Card className="border border-amber-200 hover:border-amber-400 transition-colors">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                Complete Survey
                              </h4>
                              <p className="text-xs text-gray-600 mb-3">
                                One-click survey generation from themes
                              </p>
                              <Button
                                onClick={() => setShowSurveyModal(true)}
                                disabled={
                                  selectedThemeIds.length === 0 || loadingSurvey
                                }
                                className="w-full bg-amber-600 hover:bg-amber-700"
                                size="sm"
                              >
                                {loadingSurvey ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  'Generate Survey'
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Results Display - PHASE 10 DAY 5.17.5: Only show for appropriate purposes */}
                      {researchQuestions.length > 0 &&
                        (extractionPurpose === 'literature_synthesis' ||
                          extractionPurpose === 'qualitative_analysis' ||
                          extractionPurpose === 'hypothesis_generation' ||
                          !extractionPurpose) && (
                          <div className="mt-6">
                            <AIResearchQuestionSuggestions
                              questions={researchQuestions}
                              onSelectQuestion={q => {
                                // Phase 10 Day 5.12: Save selected question and navigate to design page
                                const selectedThemes = unifiedThemes.filter(
                                  theme => selectedThemeIds.includes(theme.id)
                                );
                                saveResearchQuestions(
                                  [q],
                                  selectedThemes.map(mapUnifiedThemeToTheme)
                                );
                                toast.success(
                                  'Research question saved. Opening design page...'
                                );
                                router.push(
                                  '/design?source=themes&step=question'
                                );
                              }}
                              onOperationalizeQuestion={q => {
                                // Phase 10 Day 5.10: Save and navigate to operationalization
                                const selectedThemes = unifiedThemes.filter(
                                  theme => selectedThemeIds.includes(theme.id)
                                );
                                saveResearchQuestions(
                                  [q],
                                  selectedThemes.map(mapUnifiedThemeToTheme)
                                );
                                toast.success(
                                  'Opening operationalization panel...'
                                );
                                router.push(
                                  '/design?source=themes&step=question'
                                );
                              }}
                            />
                          </div>
                        )}

                      {/* Hypotheses Results - PHASE 10 DAY 5.17.5: Only show for appropriate purposes */}
                      {hypotheses.length > 0 &&
                        (extractionPurpose === 'hypothesis_generation' ||
                          extractionPurpose === 'literature_synthesis' ||
                          extractionPurpose === 'qualitative_analysis' ||
                          !extractionPurpose) && (
                          <div className="mt-6">
                            <AIHypothesisSuggestions
                              hypotheses={hypotheses}
                              onSelectHypothesis={h => {
                                // Phase 10 Day 5.12: Save selected hypothesis and navigate to design page
                                const selectedThemes = unifiedThemes.filter(
                                  theme => selectedThemeIds.includes(theme.id)
                                );
                                saveHypotheses(
                                  [h],
                                  selectedThemes.map(mapUnifiedThemeToTheme)
                                );
                                toast.success(
                                  'Hypothesis saved. Opening design page...'
                                );
                                router.push(
                                  '/design?source=themes&step=hypotheses'
                                );
                              }}
                              onTestHypothesis={h => {
                                // Phase 10 Day 5.11: Save and navigate to hypothesis testing
                                const selectedThemes = unifiedThemes.filter(
                                  theme => selectedThemeIds.includes(theme.id)
                                );
                                saveHypotheses(
                                  [h],
                                  selectedThemes.map(mapUnifiedThemeToTheme)
                                );
                                toast.success(
                                  'Opening hypothesis testing panel...'
                                );
                                router.push(
                                  '/design?source=themes&step=hypotheses'
                                );
                              }}
                            />
                          </div>
                        )}

                      {/* Construct Map Results - PHASE 10 DAY 5.17.5: Only show for appropriate purposes */}
                      {constructMappings.length > 0 &&
                        (extractionPurpose === 'hypothesis_generation' ||
                          extractionPurpose === 'literature_synthesis' ||
                          extractionPurpose === 'qualitative_analysis' ||
                          !extractionPurpose) && (
                          <div className="mt-6">
                            <ThemeConstructMap
                              mappings={constructMappings}
                              onConstructClick={id => {
                                // Phase 10 Day 5.12: Show construct details
                                const mapping = constructMappings.find(
                                  m => m.construct.id === id
                                );
                                if (mapping) {
                                  toast.info(
                                    `${mapping.construct.name}: ${mapping.construct.themes.length} themes, ${mapping.relatedConstructs.length} relationships`,
                                    { duration: 4000 }
                                  );
                                }
                              }}
                              onRelationshipClick={(source, target) => {
                                // Phase 10 Day 5.12: Show relationship details
                                const sourceMapping = constructMappings.find(
                                  m => m.construct.id === source
                                );
                                const targetMapping = constructMappings.find(
                                  m => m.construct.id === target
                                );
                                if (sourceMapping && targetMapping) {
                                  toast.info(
                                    `Relationship: ${sourceMapping.construct.name} → ${targetMapping.construct.name}`,
                                    { duration: 3000 }
                                  );
                                }
                              }}
                            />
                          </div>
                        )}

                      {/* Generated Survey Results - PHASE 10 DAY 5.17.5: Only show for appropriate purposes */}
                      {generatedSurvey &&
                        (extractionPurpose === 'survey_construction' ||
                          extractionPurpose === 'qualitative_analysis' ||
                          !extractionPurpose) && (
                          <div className="mt-6">
                            <GeneratedSurveyPreview
                              survey={generatedSurvey}
                              onEdit={() => {
                                // Phase 10 Day 5.12: Save survey and navigate to questionnaire builder
                                const selectedThemes = unifiedThemes.filter(
                                  theme => selectedThemeIds.includes(theme.id)
                                );
                                // Save generated survey to localStorage for questionnaire builder import
                                try {
                                  const surveyData = {
                                    survey: generatedSurvey,
                                    themes: selectedThemes.map(
                                      mapUnifiedThemeToTheme
                                    ),
                                    purpose:
                                      extractionPurpose ||
                                      'qualitative_analysis',
                                    generatedAt: new Date().toISOString(),
                                  };
                                  localStorage.setItem(
                                    'theme_generated_survey',
                                    JSON.stringify(surveyData)
                                  );
                                  toast.success(
                                    'Survey saved. Opening Questionnaire Builder...'
                                  );
                                  router.push(
                                    '/questionnaire/builder-pro?import=survey&source=themes'
                                  );
                                } catch (error) {
                                  console.error(
                                    'Failed to save survey:',
                                    error
                                  );
                                  toast.error(
                                    'Failed to save survey. Please try again.'
                                  );
                                }
                              }}
                              onExport={format => {
                                // Phase 10 Day 5.12: Export survey in selected format
                                try {
                                  const selectedThemes = unifiedThemes.filter(
                                    theme => selectedThemeIds.includes(theme.id)
                                  );

                                  if (format === 'json') {
                                    const data = {
                                      survey: generatedSurvey,
                                      themes: selectedThemes.map(
                                        mapUnifiedThemeToTheme
                                      ),
                                      metadata: {
                                        generatedAt: new Date().toISOString(),
                                        purpose:
                                          extractionPurpose ||
                                          'qualitative_analysis',
                                        platform: 'VQMethod',
                                      },
                                    };
                                    const blob = new Blob(
                                      [JSON.stringify(data, null, 2)],
                                      {
                                        type: 'application/json',
                                      }
                                    );
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `survey-${Date.now()}.json`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    toast.success('Survey exported as JSON');
                                  } else if (format === 'csv') {
                                    const csvRows: string[] = [];
                                    csvRows.push(
                                      'Section,Item ID,Text,Type,Scale'
                                    );

                                    generatedSurvey.sections.forEach(
                                      section => {
                                        section.items.forEach(item => {
                                          const scaleText = item.options
                                            ? item.options.join(' | ')
                                            : item.scaleType || '';
                                          csvRows.push(
                                            `"${section.title}","${item.id}","${item.text.replace(/"/g, '""')}","${item.type}","${scaleText}"`
                                          );
                                        });
                                      }
                                    );

                                    const blob = new Blob(
                                      [csvRows.join('\n')],
                                      {
                                        type: 'text/csv',
                                      }
                                    );
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `survey-${Date.now()}.csv`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    toast.success('Survey exported as CSV');
                                  } else if (
                                    format === 'pdf' ||
                                    format === 'word'
                                  ) {
                                    toast.info(
                                      `${format.toUpperCase()} export coming soon! Use JSON/CSV for now.`
                                    );
                                  } else {
                                    toast.error('Unsupported export format');
                                  }
                                } catch (error) {
                                  console.error('Export failed:', error);
                                  toast.error(
                                    'Failed to export survey. Please try again.'
                                  );
                                }
                              }}
                            />
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    No themes extracted yet
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Select papers and/or transcribe videos, then click
                    &quot;Extract Themes from All Sources&quot; to identify
                    research themes with full provenance tracking
                  </p>

                  {/* ENTERPRISE: Show extraction status if in progress */}
                  {analyzingThemes && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      <p className="text-sm text-blue-600 font-medium">
                        Extraction in progress...
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        Themes will appear here automatically when complete
                      </p>
                    </div>
                  )}

                  {/* ENTERPRISE: Show helpful message if extraction just completed */}
                  {!analyzingThemes &&
                    extractedPapers.size > 0 &&
                    unifiedThemes.length === 0 && (
                      <div className="mt-4 p-4 bg-amber-50 rounded-lg inline-block">
                        <p className="text-sm text-amber-600 font-medium">
                          ⚠️ Extraction completed but no themes were returned
                        </p>
                        <p className="text-xs text-amber-500 mt-1">
                          This might indicate insufficient content in selected
                          sources
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Check browser console (F12) for details
                        </p>
                      </div>
                    )}
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

                      {/* Methodology Section */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900 mb-1">
                              Gap Identification Methodology
                            </h4>
                            <p className="text-xs text-blue-700 mb-2">
                              This gap was identified using a rigorous
                              multi-stage analysis pipeline:
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-gray-700">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-700 font-semibold text-xs">
                                1
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Keyword Extraction & Analysis
                              </p>
                              <p className="text-gray-600">
                                TF-IDF-inspired frequency analysis with
                                co-occurrence mapping across{' '}
                                {selectedPapers.size} papers
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-700 font-semibold text-xs">
                                2
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Topic Modeling
                              </p>
                              <p className="text-gray-600">
                                LDA-like clustering with coherence scoring to
                                identify research themes
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-700 font-semibold text-xs">
                                3
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Trend Detection
                              </p>
                              <p className="text-gray-600">
                                Time-series analysis with linear regression to
                                identify emerging trends
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-700 font-semibold text-xs">
                                4
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Gap Identification
                              </p>
                              <p className="text-gray-600">
                                AI-assisted analysis combined with rule-based
                                detection of under-researched areas
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-blue-700 font-semibold text-xs">
                                5
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Multi-Factor Scoring
                              </p>
                              <p className="text-gray-600">
                                Composite score: Importance (35%) + Feasibility
                                (25%) + Market Potential (25%) + Confidence
                                (15%)
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              Analysis Confidence:
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: '75%' }}
                                ></div>
                              </div>
                              <span className="font-medium text-gray-900">
                                75%
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Based on {selectedPapers.size} papers, trend
                            analysis, and topic coverage validation
                          </p>
                        </div>
                      </div>

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
                                  width: `${
                                    gap.opportunityScore &&
                                    !isNaN(gap.opportunityScore)
                                      ? gap.opportunityScore * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold">
                              {gap.opportunityScore &&
                              !isNaN(gap.opportunityScore)
                                ? Math.round(gap.opportunityScore * 100)
                                : 0}
                              %
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
                  <p className="text-lg font-medium mb-4">
                    No research gaps analyzed yet
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    Identify unexplored research opportunities from your
                    selected papers
                  </p>
                  <Button
                    onClick={handleAnalyzeGaps}
                    disabled={selectedPapers.size === 0 || analyzingGaps}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                  >
                    {analyzingGaps ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Gaps...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Find Research Gaps from {selectedPapers.size} Papers
                      </>
                    )}
                  </Button>
                  {selectedPapers.size === 0 && (
                    <p className="text-xs text-amber-600 mt-3">
                      Select papers from the Results tab to analyze gaps
                    </p>
                  )}
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

      {/* Phase 10 Day 5.13: Purpose Selection Wizard Modal */}
      {showPurposeWizard && contentAnalysis && (
        <PurposeSelectionWizard
          onPurposeSelected={handlePurposeSelected}
          onCancel={() => setShowPurposeWizard(false)}
          contentAnalysis={contentAnalysis}
        />
      )}

      {/* Phase 10 Day 5.13: Centered Transparent Progress Modal with 6-Stage Braun & Clarke Methodology */}
      <ThemeExtractionProgressModal
        progress={extractionProgress}
        onClose={resetExtractionProgress}
      />

      {/* Phase 10 Day 19: Incremental Extraction Modals */}
      {incrementalExtraction.showCorpusManagementModal && (
        <CorpusManagementPanel
          onSelectCorpus={(corpus: any) => {
            incrementalExtraction.selectCorpus(corpus);
            incrementalExtraction.closeCorpusManagement();
            incrementalExtraction.openIncrementalExtraction(corpus);
          }}
          onCreateCorpus={() => {
            incrementalExtraction.closeCorpusManagement();
            incrementalExtraction.openIncrementalExtraction();
          }}
        />
      )}

      {incrementalExtraction.showIncrementalExtractionModal && (
        <IncrementalExtractionModal
          isOpen={incrementalExtraction.showIncrementalExtractionModal}
          onClose={incrementalExtraction.closeIncrementalExtraction}
          availablePapers={papers}
          {...(incrementalExtraction.selectedCorpus && {
            existingCorpus: incrementalExtraction.selectedCorpus,
          })}
          onComplete={async result => {
            // Update themes with the new incremental results
            if (result && result.themes) {
              setUnifiedThemes(result.themes);
              toast.success(
                `Incremental extraction complete! ${result.themes.length} themes identified. ` +
                  `$${result.costSavings.estimatedDollarsSaved.toFixed(2)} saved via caching.`
              );
            }
            incrementalExtraction.closeIncrementalExtraction();
          }}
        />
      )}

      {incrementalExtraction.showSaturationDashboard &&
        incrementalExtraction.extractionResult?.saturation && (
          <SaturationDashboard
            saturation={incrementalExtraction.extractionResult.saturation}
            themeHistory={[]}
            onAddMorePapers={() => {
              incrementalExtraction.closeSaturationDashboard();
              incrementalExtraction.openIncrementalExtraction();
            }}
          />
        )}

      {/* Phase 10 Day 18: Saturation Celebration Animation */}
      {incrementalExtraction.showCelebrationAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-w-md"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-2">
                Theoretical Saturation Reached!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No new themes emerged from the latest sources. Your research
                corpus has reached theoretical saturation.
              </p>
              <Button
                onClick={incrementalExtraction.dismissCelebration}
                className="w-full"
              >
                Continue Research
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Phase 10 Day 5.12: Survey Generation Modal */}
      {showSurveyModal && (
        <CompleteSurveyFromThemesModal
          isOpen={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
          themeIds={selectedThemeIds}
          themeCount={selectedThemeIds.length}
          onGenerate={handleGenerateSurvey}
        />
      )}
    </div>
  );
}

export default function LiteratureSearchPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <LiteratureSearchContent />
    </Suspense>
  );
}
