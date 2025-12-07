# Complete Component Hierarchy Map - Literature Discovery Page

Generated: 2025-11-22

## Architecture Overview

The Literature Discovery Page follows a **Self-Contained Container Architecture** (Phase 10.935) where all containers are fully self-contained with zero required props and manage their own state via Zustand stores.

---

## 1. PAGE STRUCTURE

### Main Page File
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/page.tsx`

**Type:** Page Component (Next.js)

**Responsibilities:**
- Orchestrates containers without prop drilling
- Displays statistics badges
- Manages hydration state for persisted stores
- Provides page-level layout

**Key Features:**
- Hydration-safe counted display
- Stats badges (papers, selected, saved, themes, gaps)
- Architecture description alert
- Self-contained container orchestration

---

## 2. CONTAINERS (Self-Contained Components)

Containers are fully self-contained with **ZERO required props**. All state comes from Zustand stores.

### 2.1 LiteratureSearchContainer
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/containers/LiteratureSearchContainer.tsx`

**Type:** Self-Contained Container

**Purpose:** Centralized search functionality orchestration

**Responsibilities:**
- Search state management
- Progressive search coordination
- Filter management
- Search execution and result handling
- Source selection coordination

**Sub-Components:**
- SearchBar (SearchSection)
- FilterPanel (SearchSection)
- ActiveFiltersChips (SearchSection)
- ProgressiveLoadingIndicator
- AcademicResourcesPanel
- AlternativeSourcesPanel
- SocialMediaPanel

**Stores Used:**
- useLiteratureSearchStore
- useAlternativeSourcesStore
- useSocialMediaStore
- useProgressiveSearch (hook)
- useLiteratureSearch (hook)

**Props:** ZERO required | Optional config props only

---

### 2.2 SearchResultsContainerEnhanced
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/containers/SearchResultsContainerEnhanced.tsx`

**Type:** Self-Contained Container

**Purpose:** Paper display and management with advanced controls

**Responsibilities:**
- Display papers in list view (1 per row)
- Default: all papers selected
- Advanced filtering (year, citations, authors, etc.)
- Sorting (quality, year, citations)
- Pagination (50 papers per page)
- Bulk selection controls (Select All/Deselect All)

**Sub-Components:**
- PaperCard (individual paper display)
- PaperFiltersPanel (advanced filters)
- PaperSortControls (sorting options)

**Stores Used:**
- useLiteratureSearchStore
- usePaperManagementStore

**Props:** ZERO required | Optional className prop

---

### 2.3 ThemeExtractionContainer
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/containers/ThemeExtractionContainer.tsx`

**Type:** Self-Contained Container (Refactored - 880 lines → 390 lines)

**Purpose:** Theme extraction display and research output generation

**Responsibilities:**
- Theme list display coordination
- Purpose-specific actions coordination
- Theme selection management
- Empty state and loading state handling
- Modal logic (purpose selection, mode selection, progress)

**Sub-Components:**
- PurposeSpecificActions
- ThemeList (theme-extraction)
- ThemeEmptyState (theme-extraction)
- Lazy-loaded Modals:
  - PurposeSelectionWizard
  - ModeSelectionModal
  - ThemeExtractionProgressModal

**Stores Used:**
- useThemeExtractionStore
- useLiteratureSearchStore
- useAlternativeSourcesStore

**Props:** ZERO required | Optional config props only

---

### 2.4 PaperManagementContainer
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/containers/PaperManagementContainer.tsx`

**Type:** Self-Contained Container

**Purpose:** User's saved paper library management

**Responsibilities:**
- Display saved papers from user's library
- Handle paper selection and save/unsave actions
- Show extraction status for each paper
- Provide empty state

**Sub-Components:**
- PaperCard (individual saved paper)

**Stores Used:**
- usePaperManagementStore

**Props:** ZERO required | Optional: emptyStateMessage

---

### 2.5 GapAnalysisContainer
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/containers/GapAnalysisContainer.tsx`

**Type:** Self-Contained Container

**Purpose:** Research gap analysis UI and logic

**Responsibilities:**
- Display identified research gaps
- Trigger gap analysis with AI
- Show loading states during analysis
- Provide empty state with call-to-action
- Handle error states gracefully

**Sub-Components:**
- GapVisualizationPanel (from @/components/literature)

**Stores Used:**
- useGapAnalysisStore
- usePaperManagementStore
- useLiteratureSearchStore

**Props:** ZERO required | Optional: error, emptyStateMessage, analyzeButtonText, minPapersRequired

---

### 2.6 SearchResultsContainer (Legacy/Fallback)
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/containers/SearchResultsContainer.tsx`

**Type:** Self-Contained Container (Legacy)

**Note:** SearchResultsContainerEnhanced is the primary implementation.

---

## 3. MAIN PANEL COMPONENTS

### 3.1 AcademicResourcesPanel
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx`

**Type:** Self-Contained Panel Component

**Purpose:** Academic database access and institutional authentication

**Features:**
- 9 free academic database sources
- Institutional authentication (Shibboleth, OpenAthens, ORCID)
- Cost calculator for premium database access
- Content depth analysis (full-text vs abstracts)
- Theme extraction and corpus management
- Citation export (BibTeX, RIS, APA)
- Incremental theme extraction

**Sub-Components:**
- DatabaseSelector (academic-resources)
- ContentDepthAnalysis (academic-resources)
- ActionButtonsGroup (academic-resources)
- AcademicInstitutionLogin
- CostCalculator

**Stores Used:**
- useLiteratureSearchStore
- usePaperManagementStore
- useThemeExtractionStore
- useVideoManagementStore
- useInstitutionAuthStore

**Props:** ZERO required | Optional: className, style

---

### 3.2 AlternativeSourcesPanel
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/AlternativeSourcesPanel.tsx`

**Type:** Self-Contained Panel Component (Props: 5 → 0)

**Purpose:** Alternative sources selection and search

**Features:**
- 4 alternative source types (Podcasts, GitHub, StackOverflow, Medium)
- Source-specific search interfaces
- Results display with source-specific cards

**Sub-Components:**
- PodcastsSourceSection
- GitHubSourceSection
- StackOverflowSourceSection
- SourceResultCard

**Result Cards (alternative-sources/result-cards):**
- GenericCard
- PodcastCard
- GitHubCard
- StackOverflowCard
- YouTubeCard

**Stores Used:**
- useAlternativeSourcesStore
- useLiteratureSearchStore

**Props:** ZERO required | Optional: className, style

---

### 3.3 SocialMediaPanel
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/SocialMediaPanel.tsx`

**Type:** Self-Contained Panel Component (Props: 17 → 0)

**Purpose:** Social media platform integration and research

**Features:**
- TikTok, Instagram, YouTube integration
- Cross-platform dashboard
- Video/content search and transcription
- Source-specific UI

**Sub-Components:**
- TikTokSearchSection
- InstagramSearchSection
- YouTubeResearchSection
- CrossPlatformDashboard

**Stores Used:**
- useSocialMediaStore
- useLiteratureSearchStore

**Hooks Used:**
- useSocialMediaSearch

**Props:** ZERO required | Optional: className, style

---

### 3.4 ThemeExtractionActionCard
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/ThemeExtractionActionCard.tsx`

**Type:** Self-Contained Card Component

**Purpose:** Call-to-action card for initiating theme extraction

**Features:**
- Display extraction statistics
- Show minimum source warnings
- Trigger purpose selection wizard modal
- Show extraction progress state

**Stores Used:**
- useLiteratureSearchStore
- useThemeExtractionStore
- useVideoManagementStore

**Props:** ZERO required

---

## 4. SEARCH SECTION COMPONENTS

**Directory:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/SearchSection/`

### 4.1 SearchBar
**File:** `SearchBar.tsx`

**Type:** Presentational Component

**Purpose:** Universal search input with mode selection

**Features:**
- Search input with AI suggestions
- Query correction
- Filter toggle
- Source count badges
- Methodology explanation modal

**Props:**
- onSearch: () => Promise<void>
- isLoading: boolean
- appliedFilterCount: number
- showFilters: boolean
- onToggleFilters: () => void
- academicDatabasesCount: number
- alternativeSourcesCount: number
- socialPlatformsCount: number

**Sub-Components:**
- MethodologyModal (from @/components/literature)

---

### 4.2 FilterPanel
**File:** `FilterPanel.tsx`

**Type:** Presentational Component

**Purpose:** Advanced filter controls and presets

**Features:**
- Year range filtering
- Quality score filtering
- Author count filtering
- Filter presets (save/load/delete)
- Filter reset

**Props:**
- isVisible: boolean

**Stores Used:**
- useLiteratureSearchStore

---

### 4.3 ActiveFiltersChips
**File:** `ActiveFiltersChips.tsx`

**Type:** Presentational Component

**Purpose:** Display applied filters as dismissible chips

**Props:**
- (Retrieved from store internally)

---

### 4.4 SearchResultsDisplay
**File:** `SearchResultsDisplay.tsx`

**Type:** Presentational Component

**Purpose:** Search results visualization

---

---

## 5. PAPER CARD COMPONENTS

**Directory:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/paper-card/`

### Main Component
**5.1 PaperCard**
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/PaperCard.tsx`

**Type:** Presentational Component (Refactored - 961 lines → <400 lines)

**Purpose:** Display individual paper with rich metadata and actions

**Props:**
- paper: Paper
- isSelected: boolean
- isSaved: boolean
- isExtracting: boolean
- isExtracted: boolean
- onToggleSelection: (paperId: string) => void
- onToggleSave: (paper: Paper) => void
- getSourceIcon: (source: string) => React.ComponentType

---

### Sub-Components (paper-card/)

**5.2 PaperHeader**
**File:** `PaperHeader.tsx`

**Type:** Presentational Sub-Component

**Purpose:** Paper title, authors, and selection checkbox

---

**5.3 PaperMetadata**
**File:** `PaperMetadata.tsx`

**Type:** Presentational Sub-Component

**Purpose:** Publication info (year, journal, DOI, etc.)

---

**5.4 PaperAccessBadges**
**File:** `PaperAccessBadges.tsx`

**Type:** Presentational Sub-Component

**Purpose:** Display access status badges (Open Access, PDF Available, etc.)

---

**5.5 PaperQualityBadges**
**File:** `PaperQualityBadges.tsx`

**Type:** Presentational Sub-Component

**Purpose:** Display quality indicators and scores

---

**5.6 PaperStatusBadges**
**File:** `PaperStatusBadges.tsx`

**Type:** Presentational Sub-Component

**Purpose:** Display paper status (saved, extracting, extracted)

---

**5.7 PaperActions**
**File:** `PaperActions.tsx`

**Type:** Presentational Sub-Component

**Purpose:** Save, view, download, extract action buttons

---

## 6. THEME EXTRACTION SUB-COMPONENTS

**Directory:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/theme-extraction/`

### 6.1 ThemeList
**File:** `ThemeList.tsx`

**Type:** Presentational Component

**Purpose:** Render list of extracted themes

---

### 6.2 ThemeEmptyState
**File:** `ThemeEmptyState.tsx`

**Type:** Presentational Component

**Purpose:** Display empty state when no themes extracted

---

### 6.3 SourceSummaryCard
**File:** `SourceSummaryCard.tsx`

**Type:** Presentational Component

**Purpose:** Summary card for theme source

---

## 7. ADDITIONAL PANEL COMPONENTS

### 7.1 PaperFiltersPanel
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/PaperFiltersPanel.tsx`

**Type:** Presentational Component

**Purpose:** Advanced filtering for search results

**Features:**
- Year range filtering
- Citation count filtering
- Author count filtering
- Open access filtering
- Quality score filtering
- Publication type filtering

---

### 7.2 PaperSortControls
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/PaperSortControls.tsx`

**Type:** Presentational Component

**Purpose:** Sorting controls for paper results

**Features:**
- Sort by quality score
- Sort by year
- Sort by citations
- Sort direction toggle

---

### 7.3 PurposeSpecificActions
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/PurposeSpecificActions.tsx`

**Type:** Presentational Component

**Purpose:** Render purpose-specific research output generation actions

**Features:**
- Q-Statements generation
- Survey construction
- Research question generation
- Hypothesis suggestions
- Construct mapping

**Sub-Components (from @/components/literature):**
- AIResearchQuestionSuggestions
- AIHypothesisSuggestions
- ThemeConstructMap
- GeneratedSurveyPreview

---

### 7.4 MobileOptimizationWrapper
**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/MobileOptimizationWrapper.tsx`

**Type:** Utility Wrapper Component

**Purpose:** Handle mobile-responsive layout adjustments

---

## 8. SOCIAL MEDIA SUB-COMPONENTS

**Directory:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/social-media/`

### 8.1 TikTokSearchSection
**File:** `TikTokSearchSection.tsx`

**Type:** Presentational Component

**Purpose:** TikTok-specific search interface

---

### 8.2 InstagramSearchSection
**File:** `InstagramSearchSection.tsx`

**Type:** Presentational Component

**Purpose:** Instagram-specific search interface

---

### 8.3 YouTubeResearchSection
**File:** `YouTubeResearchSection.tsx`

**Type:** Presentational Component

**Purpose:** YouTube-specific research interface

---

## 9. ALTERNATIVE SOURCES SUB-COMPONENTS

**Directory:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/app/(researcher)/discover/literature/components/alternative-sources/`

### 9.1 PodcastsSourceSection
**File:** `PodcastsSourceSection.tsx`

**Type:** Presentational Component

**Purpose:** Podcast source search interface

---

### 9.2 GitHubSourceSection
**File:** `GitHubSourceSection.tsx`

**Type:** Presentational Component

**Purpose:** GitHub source search interface

---

### 9.3 StackOverflowSourceSection
**File:** `StackOverflowSourceSection.tsx`

**Type:** Presentational Component

**Purpose:** StackOverflow source search interface

---

### Result Cards (alternative-sources/result-cards/)

#### 9.4 GenericCard
**File:** `GenericCard.tsx`

**Type:** Result Display Card

**Purpose:** Generic result card for any alternative source

---

#### 9.5 PodcastCard
**File:** `PodcastCard.tsx`

**Type:** Result Display Card

**Purpose:** Specialized podcast result display

---

#### 9.6 GitHubCard
**File:** `GitHubCard.tsx`

**Type:** Result Display Card

**Purpose:** Specialized GitHub repository display

---

#### 9.7 StackOverflowCard
**File:** `StackOverflowCard.tsx`

**Type:** Result Display Card

**Purpose:** Specialized StackOverflow question/answer display

---

#### 9.8 YouTubeCard
**File:** `YouTubeCard.tsx`

**Type:** Result Display Card

**Purpose:** Specialized YouTube video display

---

#### 9.9 SourceResultCard
**File:** `SourceResultCard.tsx`

**Type:** Generic Result Display Card

**Purpose:** Generic source result wrapper

---

## 10. SHARED LITERATURE COMPONENTS

**Directory:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/components/literature/`

These are shared components used across the application.

### 10.1 Progress Components (progress/)

**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/components/literature/progress/`

- **ProgressBar.tsx** - Real-time search progress indicator
- **SearchTransparencySummary.tsx** - Search summary display
- **SourceBreakdown.tsx** - Source distribution visualization
- **ThemeExtractionProgress.tsx** - Theme extraction progress tracker

### 10.2 Theme-related Components

- **ThemeCard.tsx** - Individual theme display card
- **EnterpriseThemeCard.tsx** - Enhanced theme card with more info
- **ThemeActionPanel.tsx** - Actions for theme management
- **ThemeProvenancePanel.tsx** - Theme source tracking
- **ThemeMethodologyExplainer.tsx** - Methodology explanation modal
- **ThemeExtractionProgress.tsx** - Progress tracking

### 10.3 Research Output Components

- **AIResearchQuestionSuggestions.tsx** - AI-generated research questions
- **AIHypothesisSuggestions.tsx** - AI-generated hypotheses
- **GeneratedSurveyPreview.tsx** - Survey preview/builder
- **ThemeConstructMap.tsx** - Construct mapping visualization
- **KnowledgeMapVisualization.tsx** - Knowledge graph visualization
- **GapVisualizationPanel.tsx** - Research gap visualization

### 10.4 Modal Components

- **PurposeSelectionWizard.tsx** - Select research purpose/methodology
- **ModeSelectionModal.tsx** - Select analysis mode
- **ThemeExtractionProgressModal.tsx** - Theme extraction progress
- **MethodologyModal.tsx** - Methodology explanation
- **EditCorpusModal.tsx** - Edit paper corpus
- **CompleteSurveyFromThemesModal.tsx** - Complete survey generation
- **IncrementalExtractionModal.tsx** - Incremental theme extraction
- **CitationModal.tsx** - Citation management
- **InstagramUploadModal.tsx** - Instagram content upload

### 10.5 Data/Institution Components

- **AcademicInstitutionLogin.tsx** - Institutional authentication
- **AcademicSourceIcons.tsx** - Source icon mapping utility
- **DatabaseSelector.tsx** - Database selection utility
- **CostCalculator.tsx** - Cost estimation calculator
- **CostSavingsCard.tsx** - Cost savings display

### 10.6 Social Media Components

- **CrossPlatformDashboard.tsx** - Multi-platform overview
- **InstagramVideoCard.tsx** - Instagram video display
- **InstagramResultsGrid.tsx** - Instagram results grid
- **TikTokVideoCard.tsx** - TikTok video display
- **TikTokTrendsGrid.tsx** - TikTok trends display
- **YouTubeChannelBrowser.tsx** - YouTube channel browser
- **SocialMediaResultsDisplay.tsx** - General social media results
- **VideoSelectionPanel.tsx** - Video selection interface

### 10.7 Analysis & Visualization

- **CorpusManagementPanel.tsx** - Corpus/library management
- **SaturationDashboard.tsx** - Data saturation analysis
- **GuidedExtractionWizard.tsx** - Step-by-step extraction guide

### 10.8 Utility Components

- **ProgressiveLoadingIndicator.tsx** - Progressive loading UI
- **SearchFilters.tsx** - Reusable search filters
- **SearchBar.tsx** - Generic search bar
- **Pagination.tsx** - Pagination controls
- **ExportButton.tsx** - Export functionality
- **LoadingSkeletons.tsx** - Loading state skeletons
- **CachedResultsBanner.tsx** - Cached results indicator
- **AISearchAssistant.tsx** - AI search suggestions
- **EnhancedThemeExtractionProgress.tsx** - Advanced progress tracking

### 10.9 Academic Resources Sub-Components (academic-resources/)

**Path:** `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/components/literature/academic-resources/`

- **DatabaseSelector.tsx** - Database selection
- **ContentDepthAnalysis.tsx** - Content depth analysis
- **ActionButtonsGroup.tsx** - Standard action buttons

---

## HIERARCHY VISUALIZATION

```
LiteratureSearchPage (page.tsx)
│
├─ LiteratureSearchContainer (CONTAINER - Self-Contained)
│  ├─ SearchBar (from SearchSection)
│  │  └─ MethodologyModal
│  ├─ FilterPanel (from SearchSection)
│  ├─ ActiveFiltersChips (from SearchSection)
│  ├─ ProgressiveLoadingIndicator
│  ├─ AcademicResourcesPanel (PANEL - Self-Contained)
│  │  ├─ DatabaseSelector (academic-resources)
│  │  ├─ ContentDepthAnalysis (academic-resources)
│  │  ├─ ActionButtonsGroup (academic-resources)
│  │  ├─ AcademicInstitutionLogin
│  │  └─ CostCalculator
│  ├─ AlternativeSourcesPanel (PANEL - Self-Contained)
│  │  ├─ PodcastsSourceSection
│  │  ├─ GitHubSourceSection
│  │  ├─ StackOverflowSourceSection
│  │  └─ SourceResultCard
│  │     ├─ GenericCard
│  │     ├─ PodcastCard
│  │     ├─ GitHubCard
│  │     ├─ StackOverflowCard
│  │     └─ YouTubeCard
│  └─ SocialMediaPanel (PANEL - Self-Contained)
│     ├─ TikTokSearchSection
│     ├─ InstagramSearchSection
│     ├─ YouTubeResearchSection
│     └─ CrossPlatformDashboard
│
├─ SearchResultsContainerEnhanced (CONTAINER - Self-Contained)
│  ├─ PaperFiltersPanel
│  ├─ PaperSortControls
│  └─ PaperCard (repeated per paper)
│     ├─ PaperHeader
│     ├─ PaperMetadata
│     ├─ PaperAccessBadges
│     ├─ PaperQualityBadges
│     ├─ PaperStatusBadges
│     └─ PaperActions
│
├─ AcademicResourcesPanel (PANEL - Self-Contained, standalone)
│  ├─ DatabaseSelector (academic-resources)
│  ├─ ContentDepthAnalysis (academic-resources)
│  ├─ ActionButtonsGroup (academic-resources)
│  ├─ AcademicInstitutionLogin
│  └─ CostCalculator
│
├─ ThemeExtractionActionCard (CARD - Self-Contained)
│
├─ PaperManagementContainer (CONTAINER - Self-Contained)
│  └─ PaperCard (repeated per saved paper)
│     ├─ PaperHeader
│     ├─ PaperMetadata
│     ├─ PaperAccessBadges
│     ├─ PaperQualityBadges
│     ├─ PaperStatusBadges
│     └─ PaperActions
│
├─ ThemeExtractionContainer (CONTAINER - Self-Contained)
│  ├─ PurposeSpecificActions
│  │  ├─ AIResearchQuestionSuggestions
│  │  ├─ AIHypothesisSuggestions
│  │  ├─ ThemeConstructMap
│  │  └─ GeneratedSurveyPreview
│  ├─ ThemeList (theme-extraction)
│  ├─ ThemeEmptyState (theme-extraction)
│  └─ Lazy-loaded Modals:
│     ├─ PurposeSelectionWizard
│     ├─ ModeSelectionModal
│     └─ ThemeExtractionProgressModal
│
└─ GapAnalysisContainer (CONTAINER - Self-Contained)
   └─ GapVisualizationPanel
```

---

## STORE MAPPING

### Store: useLiteratureSearchStore
**Used by:**
- LiteratureSearchContainer (search state, filters, papers)
- SearchResultsContainerEnhanced (papers display, filtering)
- ThemeExtractionContainer (papers count)
- AcademicResourcesPanel (papers count)
- AlternativeSourcesPanel
- SocialMediaPanel
- ThemeExtractionActionCard (papers, selected papers)
- SearchBar (filter count)
- FilterPanel (filters)

### Store: usePaperManagementStore
**Used by:**
- SearchResultsContainerEnhanced (selection, save state)
- PaperManagementContainer (saved papers, selection)
- GapAnalysisContainer (selected papers count)
- AcademicResourcesPanel (saved papers)

### Store: useThemeExtractionStore
**Used by:**
- ThemeExtractionContainer (themes, purpose, extraction status)
- AcademicResourcesPanel (themes status)
- ThemeExtractionActionCard (themes, extraction status)
- PurposeSpecificActions (themes, purpose)

### Store: useAlternativeSourcesStore
**Used by:**
- LiteratureSearchContainer (alternative sources state)
- AlternativeSourcesPanel (source selection, loading)
- ThemeExtractionContainer (alternative sources count)

### Store: useSocialMediaStore
**Used by:**
- LiteratureSearchContainer (social media state)
- SocialMediaPanel (platform selection, loading)

### Store: useVideoManagementStore
**Used by:**
- AcademicResourcesPanel (videos state)
- ThemeExtractionActionCard (transcribed videos)

### Store: useGapAnalysisStore
**Used by:**
- GapAnalysisContainer (gaps, analysis status)

### Store: useInstitutionAuthStore
**Used by:**
- AcademicResourcesPanel (institutional auth state)

---

## COMPONENT CLASSIFICATION

### Type: Container (Self-Contained)
- LiteratureSearchContainer
- SearchResultsContainerEnhanced
- ThemeExtractionContainer
- PaperManagementContainer
- GapAnalysisContainer
- AcademicResourcesPanel (hybrid - also used as standalone panel)
- AlternativeSourcesPanel
- SocialMediaPanel

### Type: Presentational (Receives Props)
- SearchBar
- FilterPanel
- ActiveFiltersChips
- PaperCard
- PaperFiltersPanel
- PaperSortControls
- PurposeSpecificActions
- All paper-card sub-components
- All theme-extraction sub-components
- All social-media sub-components
- All alternative-sources sub-components

### Type: Card Component
- ThemeExtractionActionCard
- SourceSummaryCard
- EnterpriseThemeCard
- ThemeCard

### Type: Modal Component
- PurposeSelectionWizard
- ModeSelectionModal
- ThemeExtractionProgressModal
- MethodologyModal
- EditCorpusModal
- And others in shared library

### Type: Utility/Helper
- MobileOptimizationWrapper
- ErrorBoundary
- ProgressiveLoadingIndicator
- AcademicSourceIcons (utility function)

---

## KEY METRICS

- **Total Containers:** 5 main + 3 panels = 8 self-contained
- **Total Presentational Components:** 30+
- **Total Result/Card Components:** 10+
- **Total Modal Components:** 8+
- **Total Shared Library Components:** 40+
- **Props Reduction (Phase 10.935):**
  - AcademicResourcesPanel: 15 → 0 props (-100%)
  - AlternativeSourcesPanel: 5 → 0 props (-100%)
  - SocialMediaPanel: 17 → 0 props (-100%)
  - LiteratureSearchContainer: 6 → 0 props (-100%)
  - PaperManagementContainer: 9 → 0 props (-100%)
  - ThemeExtractionContainer: 26 → 0 props (-100%)

---

## ENTERPRISE STANDARDS COMPLIANCE

All containers and components follow:
- ✅ TypeScript strict mode (NO 'any' types)
- ✅ React.memo() for performance where applicable
- ✅ useCallback() for all handlers
- ✅ useMemo() for expensive computations
- ✅ Proper dependency arrays in hooks
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Semantic HTML and ARIA labels
- ✅ Enterprise logging (no console.log)
- ✅ Comprehensive error handling
- ✅ Defensive programming practices
- ✅ Component size < 400 lines (except large containers)
- ✅ Memory leak prevention
- ✅ Self-contained pattern (zero required props)

