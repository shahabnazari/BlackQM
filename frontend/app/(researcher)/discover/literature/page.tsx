/**
 * Literature Search Interface - DISCOVER Phase
 * Phase 9 Day 0-1: Complete Literature Review System
 * World-class implementation integrated with backend API
 */

'use client';

import { getAcademicIcon } from '@/components/literature/AcademicSourceIcons';
import { CrossPlatformDashboard } from '@/components/literature/CrossPlatformDashboard';
import DatabaseSourcesInfo from '@/components/literature/DatabaseSourcesInfo';
import EnterpriseThemeCard from '@/components/literature/EnterpriseThemeCard';
import PurposeSelectionWizard from '@/components/literature/PurposeSelectionWizard';
import ThemeCountGuidance from '@/components/literature/ThemeCountGuidance';
import ThemeExtractionProgressModal from '@/components/literature/ThemeExtractionProgressModal';
import { ThemeMethodologyExplainer } from '@/components/literature/ThemeMethodologyExplainer';
import { VideoSelectionPanel } from '@/components/literature/VideoSelectionPanel';
import { YouTubeChannelBrowser } from '@/components/literature/YouTubeChannelBrowser';
// Phase 10 Day 18: Incremental Theme Extraction Components
import { CorpusManagementPanel } from '@/components/literature/CorpusManagementPanel';
import { IncrementalExtractionModal } from '@/components/literature/IncrementalExtractionModal';
import { SaturationDashboard } from '@/components/literature/SaturationDashboard';
// Phase 10 Day 31: Mode Selection & Guided Extraction
import { GuidedExtractionWizard } from '@/components/literature/GuidedExtractionWizard';
import { ModeSelectionModal } from '@/components/literature/ModeSelectionModal';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Phase 10 Day 31: QueryExpansionAPI now handled by SearchBar component
import {
  ResearchPurpose,
  SaturationData,
  // SourceContent, // Available if needed
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
// Phase 10 Day 31.4: Full-Text Waiting Hook
// import { useWaitForFullText } from '@/lib/hooks/useWaitForFullText'; // Available if needed
// Phase 10.1 Day 4: Paper Management & State Persistence Hooks
import { usePaperManagement } from '@/lib/hooks/usePaperManagement';
import { useStatePersistence } from '@/lib/hooks/useStatePersistence';
// Phase 10.1 Day 5: Search & Data Fetching Hooks
import { useLiteratureSearch } from '@/lib/hooks/useLiteratureSearch';
// import { useFullTextFetching } from '@/lib/hooks/useFullTextFetching'; // Available for future use
import { useAlternativeSources } from '@/lib/hooks/useAlternativeSources';
// Phase 10.1 Day 6: Theme Extraction Handlers Hook
import { useThemeExtractionHandlers } from '@/lib/hooks/useThemeExtractionHandlers';
// Phase 10.1 Day 6 Audit Fix: Theme Extraction Workflow Hook
import { useThemeExtractionWorkflow } from '@/lib/hooks/useThemeExtractionWorkflow';
// Phase 10.1 Day 7: Progressive Search Hook (200 papers)
import { useProgressiveSearch } from '@/lib/hooks/useProgressiveSearch';
import {
  literatureAPI,
  // type Paper, // Available if needed
  ResearchGap,
} from '@/lib/services/literature-api.service';
// Phase 10 Day 5.17.4: State persistence for back button navigation
// Phase 10.1 Day 4: State persistence now handled by useStatePersistence hook
// import { clearLiteratureState, getSavedStateSummary, loadLiteratureState, saveLiteratureState } from '@/lib/services/literature-state-persistence.service';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Database,
  ExternalLink,
  FileText,
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
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
// Phase 10 Day 33: WebSocket for real-time theme extraction progress
import io from 'socket.io-client';
type Socket = ReturnType<typeof io>;
import { useAuth } from '@/components/providers/AuthProvider';
// import { retryApiCall } from '@/lib/utils/retry'; // Available if needed
// Phase 10 Day 31: Extracted SearchSection Components
import {
  ActiveFiltersChips,
  FilterPanel,
  SearchBar,
} from './components/SearchSection';
// Phase 10.1 Day 3: Extracted PaperCard Component
import { PaperCard } from './components/PaperCard';
// Phase 10.1 Day 3: Extracted Panel Components
import { AcademicResourcesPanel } from './components/AcademicResourcesPanel';
import { AlternativeSourcesPanel } from './components/AlternativeSourcesPanel';
// Phase 10.1 Day 7: Social Media Panel Component (DEFERRED - requires Day 6 useYouTubeIntegration hook)
// import { SocialMediaPanel } from './components/SocialMediaPanel';
// Phase 10.1 Day 7: Progressive Loading Components
import { ProgressiveLoadingIndicator } from '@/components/literature/ProgressiveLoadingIndicator';
// Phase 10.6 Day 14.5+: Search Process Transparency Component (Enterprise-Grade)
import { SearchProcessIndicator } from '@/components/literature/SearchProcessIndicator';
// Phase 10 Day 31: useSearch hook available for future migration
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';

function LiteratureSearchContent() {
  // Phase 10 Day 31.4: Constants (eliminate magic numbers)
  // const FULL_TEXT_WAIT_SECONDS = 60; // Maximum wait for full-text extraction
  // const LIBRARY_MAX_PAPERS = 1000; // Maximum papers to fetch from library
  // const ABSTRACT_OVERFLOW_THRESHOLD = 2000; // Characters threshold for abstract overflow
  // const MIN_CONTENT_LENGTH = 50; // Minimum content length for analysis

  // PHASE 10 DAY 1: URL state management for bookmarkable searches
  const router = useRouter();
  const searchParams = useSearchParams();

  // Phase 10 Day 31: Use Zustand store for search state
  const {
    query,
    setQuery,
    papers,
    setPapers,
    totalResults,
    setTotalResults,
    loading,
    // setLoading, // Handled by useLiteratureSearch hook
    currentPage,
    setCurrentPage,
    showFilters,
    appliedFilters,
    filters,
    toggleShowFilters,
    getAppliedFilterCount,
    setFilters,
    applyFilters,
  } = useLiteratureSearchStore();

  // Phase 10.1 Day 5: Literature Search Hook (replaces manual search state and handlers)
  const {
    academicDatabases,
    setAcademicDatabases,
    queryCorrectionMessage,
    clearQueryCorrection,
    handleSearch,
  } = useLiteratureSearch({
    autoSelectPapers: true,
    autoSwitchToResults: true,
    onSearchSuccess: () => {
      setActiveTab('results');
      setActiveResultsSubTab('papers');
      // Auto-select all papers for extraction
      const allPaperIds = new Set(papers.map(p => p.id));
      setSelectedPapers(allPaperIds);
    },
  });
  // const [selectedView, setSelectedView] = useState<'list' | 'grid'>('list');

  // Phase 10 Day 31: AI suggestions, filters, and presets now managed by Zustand store

  // Phase 10 Day 31: Load filters from URL params on mount (uses Zustand)
  useEffect(() => {
    const q = searchParams.get('q');
    const yearFrom = searchParams.get('yearFrom');
    const yearTo = searchParams.get('yearTo');
    const minCitations = searchParams.get('minCitations');
    const publicationType = searchParams.get('type');
    const sortBy = searchParams.get('sort');

    // Set query from URL
    if (q) setQuery(q);

    // Build filter object from URL params
    const urlFilterUpdates: Record<string, any> = {};
    if (yearFrom) urlFilterUpdates['yearFrom'] = parseInt(yearFrom);
    if (yearTo) urlFilterUpdates['yearTo'] = parseInt(yearTo);
    if (minCitations) urlFilterUpdates['minCitations'] = parseInt(minCitations);
    if (publicationType && publicationType !== 'all')
      urlFilterUpdates['publicationType'] = publicationType;
    if (sortBy && sortBy !== 'relevance') urlFilterUpdates['sortBy'] = sortBy;

    // Apply URL filters if any
    if (Object.keys(urlFilterUpdates).length > 0) {
      setFilters(urlFilterUpdates);
      applyFilters();
    }
  }, [setQuery, setFilters, applyFilters, searchParams]);

  // Phase 10 Day 31: Filter handlers now managed by Zustand (applyFilters, resetFilters, presets)

  // Phase 10.1 Day 4: Paper Management Hook (replaces manual state declarations)
  const {
    selectedPapers,
    savedPapers,
    extractingPapers,
    extractedPapers,
    setSelectedPapers,
    setSavedPapers,
    setExtractingPapers,
    setExtractedPapers, // Phase 10.1 Day 12: Uncommented for extraction completion tracking
    togglePaperSelection,
    handleTogglePaperSave,
    loadUserLibrary: loadUserLibraryFromHook,
    // handleSavePaper, handleRemovePaper, isSelected, isSaved, isExtracting, isExtracted - available if needed
  } = usePaperManagement();

  // Phase 10.1 Day 7: Progressive Search Hook (200 papers)
  const { executeProgressiveSearch, cancelProgressiveSearch, isSearching } =
    useProgressiveSearch();
  const { progressiveLoading } = useLiteratureSearchStore();
  // Phase 10.1 Day 7: Always use progressive mode (200 papers with quality sorting) - toggle removed

  // Phase 10.6 Day 14: Source Filtering - Filter papers by selected academic databases
  const filteredPapers = useMemo(() => {
    // If no sources selected, show all papers
    if (academicDatabases.length === 0) return papers;

    // Map UI source IDs to backend LiteratureSource enum values
    const sourceMapping: Record<string, string[]> = {
      pubmed: ['pubmed'],
      pmc: ['pmc'],
      arxiv: ['arxiv'],
      biorxiv: ['biorxiv', 'medrxiv'], // Both use same backend service
      chemrxiv: ['chemrxiv'],
      semantic_scholar: ['semantic_scholar'],
      google_scholar: ['google_scholar'],
      ssrn: ['ssrn'],
      crossref: ['crossref'],
      eric: ['eric'],
      web_of_science: ['web_of_science'],
      scopus: ['scopus'],
      ieee_xplore: ['ieee_xplore'],
      springer: ['springer'],
      nature: ['nature'],
      wiley: ['wiley'],
      sage: ['sage'],
      taylor_francis: ['taylor_francis'],
    };

    // Build set of allowed sources
    const allowedSources = new Set<string>();
    academicDatabases.forEach(dbId => {
      const sources = sourceMapping[dbId] || [dbId];
      sources.forEach(s => allowedSources.add(s));
    });

    // Filter papers by source
    return papers.filter(paper => {
      if (!paper.source) return false; // No source = don't show
      const paperSource = paper.source.toLowerCase();
      return allowedSources.has(paperSource);
    });
  }, [papers, academicDatabases]);

  // Phase 10.6 Day 14: Auto-deselect papers that are filtered out
  useEffect(() => {
    if (filteredPapers.length < papers.length) {
      // Some papers are filtered out - remove them from selection
      const filteredPaperIds = new Set(filteredPapers.map(p => p.id));
      const updatedSelection = new Set(
        Array.from(selectedPapers).filter(id => filteredPaperIds.has(id))
      );
      if (updatedSelection.size !== selectedPapers.size) {
        setSelectedPapers(updatedSelection);
      }
    }
  }, [filteredPapers, papers, selectedPapers, setSelectedPapers]);

  // Phase 10.6 Day 14.5+: ENTERPRISE TRANSPARENCY - Get metadata from backend
  // SearchMetadata contains complete pipeline: Collection → Dedup → Quality → Final
  const { searchMetadata } = useLiteratureSearchStore();

  // DEBUG: Log metadata from store
  console.log('[LiteraturePage] Search metadata from store:', {
    hasMetadata: searchMetadata !== null,
    metadata: searchMetadata,
    papersCount: papers.length,
  });

  // Analysis state
  const [unifiedThemes, setUnifiedThemes] = useState<UnifiedTheme[]>([]);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [analyzingThemes, setAnalyzingThemes] = useState(false);
  const [analyzingGaps, setAnalyzingGaps] = useState(false);

  // Phase 10 Day 5.13: V2 Purpose-driven extraction state
  const [extractionPurpose, setExtractionPurpose] =
    useState<ResearchPurpose | null>(null);
  const [showPurposeWizard, setShowPurposeWizard] = useState(false);
  const [v2SaturationData, _setV2SaturationData] =
    useState<SaturationData | null>(null);
  const [userExpertiseLevel] = useState<UserExpertiseLevel>('researcher');

  // Phase 10 Day 31: Mode selection (quick vs guided extraction)
  // Phase 10.1 Day 6 Audit Fix: showModeSelectionModal, isExtractionInProgress, preparingMessage, contentAnalysis, currentRequestId
  // now provided by useThemeExtractionWorkflow hook (removed 5 duplicate state declarations)
  const [showGuidedWizard, setShowGuidedWizard] = useState(false);

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

  // Phase 10 Day 31.4: Full-text waiting before extraction
  // const { waitForFullText } = useWaitForFullText(); // Available if needed

  // Phase 10 Day 33: WebSocket connection for real-time progress
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const userIdRef = useRef<string | null>(null); // Phase 10 Day 33: Store user ID for cleanup

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

  // Library state (savedPapers now managed by usePaperManagement hook)
  const [activeTab, setActiveTab] = useState('results'); // PHASE 9 DAY 24: Changed from 'search' to 'results'

  // Phase 10.1 Day 5: Alternative Sources Hook (replaces manual alternative sources state)
  const {
    alternativeSources,
    setAlternativeSources,
    alternativeResults,
    loadingAlternative,
    youtubeVideos,
    setYoutubeVideos,
    transcribedVideos,
    setTranscribedVideos,
    transcriptionOptions,
    setTranscriptionOptions,
    socialPlatforms,
    setSocialPlatforms,
    socialResults,
    socialInsights,
    loadingSocial,
    handleSearchAlternativeSources,
    handleSearchSocialMedia,
    // handleSearchAllSources removed - always using progressive search (200 papers)
  } = useAlternativeSources({
    query,
    mainSearchHandler: handleSearch,
    hasMainSources: academicDatabases.length > 0,
    mainSourcesCount: academicDatabases.length,
    onSwitchTab: setActiveTab,
  });

  // Phase 10.1 Day 7: Always execute progressive search (200 papers with quality sorting)
  const handleSearchWithMode = useCallback(async () => {
    // Execute progressive search (200 high-quality papers)
    await executeProgressiveSearch();
  }, [executeProgressiveSearch]);

  // Phase 10.1 Day 6 Audit Fix: Theme Extraction Workflow Hook (Paper Preparation & Content Analysis)
  // Must be AFTER useAlternativeSources since it depends on transcribedVideos
  const {
    // isExtractionInProgress, // Available if needed
    preparingMessage,
    contentAnalysis,
    currentRequestId,
    showModeSelectionModal,
    handleExtractThemes,
    setShowModeSelectionModal,
    setIsExtractionInProgress,
    setPreparingMessage,
    setContentAnalysis,
  } = useThemeExtractionWorkflow({
    selectedPapers,
    papers,
    setPapers,
    transcribedVideos,
  });

  // Phase 10.1 Day 6: Theme Extraction Handlers Hook (Mode & Purpose Selection)
  const { handleModeSelected, handlePurposeSelected } =
    useThemeExtractionHandlers({
      currentRequestId,
      contentAnalysis,
      papers,
      selectedPapers,
      userExpertiseLevel,
      setShowModeSelectionModal,
      setShowPurposeWizard,
      setShowGuidedWizard,
      setExtractionPurpose,
      setAnalyzingThemes,
      setExtractingPapers,
      setExtractedPapers, // Phase 10.1 Day 12: Added for extraction completion tracking
      setIsExtractionInProgress,
      setExtractionError,
      setContentAnalysis,
      setPapers,
      startExtraction,
      extractThemesV2,
    });

  // PHASE 9 DAY 24: UX Reorganization - Panel and tab navigation state
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null); // Which panel section is expanded
  const [activeResultsSubTab, setActiveResultsSubTab] = useState<
    'papers' | 'videos' | 'library'
  >('papers');
  const [activeAnalysisSubTab, setActiveAnalysisSubTab] = useState<
    'themes' | 'gaps' | 'synthesis'
  >('themes');

  // PHASE 9 DAY 25: Academic categorization - Institution auth state
  // Phase 10.1 Day 5: academicDatabases now managed by useLiteratureSearch hook
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

  // Phase 10.1 Day 4: State Persistence Hook (replaces manual state persistence logic)
  const {
    showRestoreBanner,
    restoreSummary,
    handleRestoreState: restoreStateFromHook,
    handleDismissRestore,
  } = useStatePersistence({
    currentState: {
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
    },
    onRestore: state => {
      console.log(
        '🔄 [Literature Page] Restoring state from useStatePersistence hook'
      );

      // Restore search state
      if (state.query) setQuery(state.query);
      if (state.papers) setPapers(state.papers);
      if (state.totalResults) setTotalResults(state.totalResults);
      if (state.currentPage) setCurrentPage(state.currentPage);

      // Restore filters (Zustand)
      if (state.filters) {
        setFilters(state.filters);
        applyFilters();
      }

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
      if (state.researchQuestions)
        setResearchQuestions(state.researchQuestions);
      if (state.hypotheses) setHypotheses(state.hypotheses);
      if (state.constructMappings)
        setConstructMappings(state.constructMappings);

      // Restore video state
      if (state.transcribedVideos)
        setTranscribedVideos(state.transcribedVideos);
      if (state.youtubeVideos) setYoutubeVideos(state.youtubeVideos);
    },
    debounceDelay: 2000, // Save 2 seconds after last change
    enableAutoSave: true,
  });

  // Wrapper for handleRestoreState to match existing function signature
  const handleRestoreState = useCallback(() => {
    restoreStateFromHook();
  }, [restoreStateFromHook]);

  // PHASE 10 DAY 33: WebSocket connection for real-time theme extraction progress
  // Implements Patent Claim #9 (4-Part Transparent Progress Messaging)
  // Phase 10 Day 33 Fix: Use actual user ID from auth context
  useEffect(() => {
    // Phase 10 Day 33 Fix: Only connect if user is authenticated
    if (!user?.id) {
      console.log('⚠️ WebSocket: User not authenticated, skipping connection');
      return;
    }

    // Store user ID for cleanup
    userIdRef.current = user.id;

    // Get API URL from environment
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000';

    // Connect to theme-extraction WebSocket namespace
    const socket = io(`${apiUrl}/theme-extraction`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected to theme-extraction gateway');

      // Phase 10 Day 33 Fix: Use actual user ID from auth context
      socket.emit('join', user.id);
      console.log(`📡 Joined room for user: ${user.id}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected from theme-extraction gateway');
    });

    socket.on('connect_error', (error: any) => {
      // Phase 10.1 Day 7: Suppress expected namespace errors (backend gateway not registered)
      if (error.message === 'Invalid namespace') {
        console.log('👤 WebSocket: Theme extraction namespace not available, using fallback mode');
      } else {
        console.error('❌ WebSocket connection error:', error.message);
      }
    });

    // Theme extraction progress updates
    socket.on('extraction-progress', (data: any) => {
      console.log('🟢 WebSocket progress received:', data);

      // Extract transparent message from details
      if (data.details?.transparentMessage) {
        const transparentMsg = data.details.transparentMessage;

        console.log('🟢 Using REAL WebSocket transparentMessage:', {
          stage: transparentMsg.stageName,
          stageNumber: transparentMsg.stageNumber,
          percentage: transparentMsg.percentage,
          liveStats: transparentMsg.liveStats,
        });

        // Update progress with transparent message
        updateProgress(
          transparentMsg.stageNumber,
          transparentMsg.totalStages || 6,
          transparentMsg
        );
      } else {
        // Fallback to basic progress update
        console.warn(
          '⚠️ WebSocket data missing transparentMessage, using basic update'
        );
        updateProgress(1, 6);
      }
    });

    // Theme extraction completion
    socket.on('extraction-complete', (data: any) => {
      console.log('✅ WebSocket extraction complete:', data);
      const themesCount = data.details?.themesExtracted || 0;
      completeExtraction(themesCount);

      // Phase 10.1 Day 12: Move papers from extracting to extracted state
      // This enables the "Extracted" badge to show on individual papers
      setExtractedPapers(prev => {
        const newExtracted = new Set(prev);
        extractingPapers.forEach(paperId => newExtracted.add(paperId));
        console.log(
          `✅ Marked ${extractingPapers.size} papers as extracted (total: ${newExtracted.size})`
        );
        return newExtracted;
      });

      // Clear extracting state
      setExtractingPapers(new Set());

      // Celebration animation
      if (themesCount > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    });

    // Theme extraction errors
    socket.on('extraction-error', (data: any) => {
      console.error('❌ WebSocket extraction error:', data);
      setExtractionError(data.message || 'Theme extraction failed');
      toast.error(data.message || 'Theme extraction failed');
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current && userIdRef.current) {
        console.log('🔌 Disconnecting WebSocket on unmount');
        // Phase 10 Day 33 Fix: Use stored user ID for proper room cleanup
        socketRef.current.emit('leave', userIdRef.current);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, updateProgress, completeExtraction, setExtractionError]); // Phase 10 Day 33 Fix: Reconnect when user changes (login/logout)

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

  // Phase 10.1 Day 4: Load saved papers on mount (now using hook's loadUserLibrary)
  useEffect(() => {
    loadUserLibraryFromHook();
  }, [loadUserLibraryFromHook]);

  // Phase 10 Day 31: AI suggestions now handled by SearchBar component

  // Phase 10.1 Day 5: handleSearch now provided by useLiteratureSearch hook (141 lines removed)
  // Phase 10.1 Day 4: handleSavePaper, handleRemovePaper now provided by usePaperManagement hook
  // Phase 10.1 Day 6 Audit Fix: handleExtractThemes now provided by useThemeExtractionWorkflow hook (760 lines removed)
  // Phase 10.1 Day 6: handleModeSelected & handlePurposeSelected now provided by useThemeExtractionHandlers hook
  // Removed 893 lines: handleModeSelected (20 lines) + handlePurposeSelected (873 lines)

  // Phase 10 Day 5.12: Helper to convert UnifiedTheme to Theme format
  // Phase 10.1 Day 8: Memoized to avoid recreating on every render
  const mapUnifiedThemeToTheme = useCallback((unifiedTheme: UnifiedTheme) => ({
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
  }), []);

  // Phase 10 Day 5.12: Enhanced Theme Integration Handlers
  // Phase 10.1 Day 8: Wrapped with useCallback for performance
  const handleGenerateQuestions = useCallback(async () => {
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
  }, [selectedThemeIds, unifiedThemes, mapUnifiedThemeToTheme, extractionPurpose, setLoadingQuestions, setResearchQuestions]);

  // Phase 10.1 Day 8: Wrapped with useCallback for performance
  const handleGenerateHypotheses = useCallback(async () => {
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
  }, [selectedThemeIds, unifiedThemes, mapUnifiedThemeToTheme, setLoadingHypotheses, setHypotheses]);

  // Phase 10.1 Day 8: Wrapped with useCallback for performance
  const handleMapConstructs = useCallback(async () => {
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
  }, [selectedThemeIds, unifiedThemes, mapUnifiedThemeToTheme, setLoadingConstructs, setConstructMappings]);

  // Phase 10.1 Day 8: Wrapped with useCallback for performance
  const handleGenerateSurvey = useCallback(async (config: SurveyGenerationConfig) => {
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
  }, [selectedThemeIds, unifiedThemes, mapUnifiedThemeToTheme, setLoadingSurvey, setGeneratedSurvey]);

  // Phase 10.1 Day 8: Wrapped with useCallback for performance
  const handleAnalyzeGaps = useCallback(async () => {
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
  }, [selectedPapers, papers, setAnalyzingGaps, setGaps, setActiveTab, setActiveAnalysisSubTab]);

  // Phase 10.1 Day 8: Wrapped with useCallback for performance
  const handleExportCitations = useCallback(async (format: 'bibtex' | 'ris' | 'apa') => {
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
  }, [selectedPapers]);

  // Phase 10.1 Day 8: Wrapped with useCallback for performance
  const handleGenerateStatements = useCallback(async () => {
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
  }, [unifiedThemes, query, router]);

  // Phase 10.1 Day 5: Alternative sources handlers now provided by useAlternativeSources hook (203 lines removed)
  // - handleSearchAlternativeSources (104 lines)
  // - handleSearchSocialMedia (46 lines)
  // - handleSearchAllSources (40 lines)
  // Phase 10.1 Day 4: togglePaperSelection, handleTogglePaperSave now provided by usePaperManagement hook

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

          {/* Phase 10 Day 31: Extracted SearchBar Component */}
          <SearchBar
            onSearch={handleSearchWithMode}
            isLoading={loading || loadingAlternative || loadingSocial || isSearching}
            appliedFilterCount={getAppliedFilterCount()}
            showFilters={showFilters}
            onToggleFilters={toggleShowFilters}
            academicDatabasesCount={academicDatabases.length}
            alternativeSourcesCount={alternativeSources.length}
            socialPlatformsCount={socialPlatforms.length}
          />

          {/* Phase 10 Day 31: Extracted ActiveFiltersChips Component */}
          <ActiveFiltersChips />

          {/* Phase 10 Day 31: Extracted FilterPanel Component */}
          <FilterPanel isVisible={showFilters} />

          {/* Phase 10.6 Day 14.5+: ENTERPRISE TRANSPARENCY INDICATOR */}
          {/* Shows complete pipeline: Collection → Dedup → Quality → Final */}
          {/* Now uses REAL backend metadata instead of frontend calculations */}
          {/* FIXED: Show during AND after progressive loading (not blocked) */}
          {(() => {
            const isVisible = searchMetadata !== null && papers.length > 0;
            console.log('🔍 [SearchProcessIndicator] Visibility Check:', {
              searchMetadata: searchMetadata ? 'HAS DATA' : 'NULL',
              papersLength: papers.length,
              isVisible,
              metadataKeys: searchMetadata ? Object.keys(searchMetadata) : [],
            });
            return (
              <SearchProcessIndicator
                query={query}
                metadata={searchMetadata}
                searchStatus={
                  loading ? 'searching' :
                  progressiveLoading.status === 'loading' ? 'searching' :
                  papers.length > 0 ? 'completed' : 'idle'
                }
                isVisible={isVisible}
              />
            );
          })()}

          {/* Phase 10.1 Day 7: Progressive Loading Indicator */}
          <ProgressiveLoadingIndicator
            state={progressiveLoading}
            onCancel={cancelProgressiveSearch}
          />
        </CardContent>
      </Card>

      {/* PHASE 10.1 DAY 3: Extracted Academic Resources Panel */}
      <AcademicResourcesPanel
        academicDatabases={academicDatabases}
        onDatabasesChange={setAcademicDatabases}
        institutionAuth={institutionAuth}
        onInstitutionAuthChange={setInstitutionAuth}
        papers={filteredPapers}
        selectedPapers={selectedPapers}
        transcribedVideosCount={transcribedVideos.length}
        analyzingThemes={analyzingThemes}
        onExtractThemes={handleExtractThemes}
        onIncrementalExtraction={() =>
          incrementalExtraction.openIncrementalExtraction()
        }
        onCorpusManagement={() => incrementalExtraction.openCorpusManagement()}
        onExportCitations={handleExportCitations}
        corpusCount={incrementalExtraction.corpusList.length}
        extractingPapers={extractingPapers}
        getSourceIcon={getAcademicIcon}
      />

      {/* PHASE 10.1 DAY 3: Extracted Alternative Sources Panel */}
      <AlternativeSourcesPanel
        alternativeSources={alternativeSources}
        onSourcesChange={setAlternativeSources}
        alternativeResults={alternativeResults}
        loadingAlternative={loadingAlternative}
        onSearch={handleSearchAlternativeSources}
      />
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
                  (papers.length === 0 && transcribedVideos.length === 0) ||
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

              {papers.length === 0 && transcribedVideos.length === 0 && (
                <p className="text-xs text-amber-600 mt-3">
                  ⚠️ Search for papers above or transcribe videos to begin
                  extraction
                </p>
              )}

              {/* Phase 10 Day 5.14: Warn about minimum source requirements */}
              {papers.length + transcribedVideos.length > 0 &&
                papers.length + transcribedVideos.length < 3 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-800 mb-1">
                      ⚠️ Low Source Count Warning
                    </p>
                    <p className="text-xs text-amber-700">
                      You have {papers.length + transcribedVideos.length}{' '}
                      source(s) available. For reliable theme extraction, we
                      recommend:
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
                          clearQueryCorrection();
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

              {/* Phase 10.1 Day 7: Progressive Loading Indicator */}
              {progressiveLoading.isActive && progressiveLoading.status === 'loading' && (
                <ProgressiveLoadingIndicator
                  state={progressiveLoading}
                  onCancel={cancelProgressiveSearch}
                />
              )}

              {/* Show loading spinner ONLY if not in progressive mode OR if progressive hasn't started yet */}
              {loading && !progressiveLoading.isActive ? (
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
                              // Phase 10 Day 31: Use Zustand actions
                              setFilters({ sortBy: newSort });
                              applyFilters();
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

                  {/* Phase 10.6 Day 14: Source Filter Status Indicator */}
                  {academicDatabases.length > 0 &&
                    filteredPapers.length < papers.length && (
                      <Alert className="mb-4 bg-blue-50 border-blue-300">
                        <Database className="w-4 h-4 text-blue-600" />
                        <AlertDescription className="text-blue-900">
                          <span className="font-semibold">
                            Filtering active:
                          </span>{' '}
                          Showing {filteredPapers.length} of {papers.length}{' '}
                          papers from {academicDatabases.length} selected source
                          {academicDatabases.length > 1 ? 's' : ''}.{' '}
                          <button
                            onClick={() => setAcademicDatabases([])}
                            className="underline hover:text-blue-700 font-medium"
                          >
                            Clear filters to show all
                          </button>
                        </AlertDescription>
                      </Alert>
                    )}

                  {/* Papers List */}
                  {filteredPapers.map(paper => (
                    <PaperCard
                      key={paper.id}
                      paper={paper}
                      isSelected={selectedPapers.has(paper.id)}
                      isSaved={savedPapers.some(p => p.id === paper.id)}
                      isExtracting={extractingPapers.has(paper.id)}
                      isExtracted={extractedPapers.has(paper.id)}
                      onToggleSelection={togglePaperSelection}
                      onToggleSave={handleTogglePaperSave}
                      getSourceIcon={getAcademicIcon}
                    />
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
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    isSelected={selectedPapers.has(paper.id)}
                    isSaved={true}
                    isExtracting={extractingPapers.has(paper.id)}
                    isExtracted={extractedPapers.has(paper.id)}
                    onToggleSelection={togglePaperSelection}
                    onToggleSave={handleTogglePaperSave}
                    getSourceIcon={getAcademicIcon}
                  />
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
                    Search for papers and/or transcribe videos, then click
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

      {/* Phase 10 Day 31: Mode Selection Modal (Quick vs Guided) */}
      {showModeSelectionModal && (
        <ModeSelectionModal
          isOpen={showModeSelectionModal}
          onClose={() => {
            setShowModeSelectionModal(false);
            setPreparingMessage('');
            setIsExtractionInProgress(false);
          }}
          onModeSelected={handleModeSelected}
          selectedPaperCount={selectedPapers.size}
          loading={!!preparingMessage}
          preparingMessage={preparingMessage}
        />
      )}

      {/* Phase 10 Day 31: Guided Extraction Wizard */}
      {showGuidedWizard && contentAnalysis && (
        <GuidedExtractionWizard
          isOpen={showGuidedWizard}
          onClose={() => setShowGuidedWizard(false)}
          corpusId={`corpus_${Date.now()}`}
          corpusName="Auto-Generated Corpus"
          allPapers={papers.map(p => ({
            ...p,
            hasFullText: p.hasFullText ?? false,
          }))}
          {...(extractionPurpose && { purpose: extractionPurpose })}
          userExpertiseLevel="intermediate"
          onIterationComplete={result => {
            // Update themes with guided extraction results
            if (result && result.themes) {
              setUnifiedThemes(result.themes);
              toast.success(
                `Iteration ${result.iteration} complete: ${result.totalThemes} themes (${result.newThemes} new, ${result.strengthenedThemes} strengthened)`
              );
            }
          }}
        />
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
