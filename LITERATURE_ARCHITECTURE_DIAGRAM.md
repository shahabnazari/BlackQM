# Literature Discovery Page - Architecture Diagrams

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LiteratureSearchPage (page.tsx)                  │
│                                                                      │
│  • Orchestrates 7 self-contained containers                         │
│  • Displays hydration-safe statistics                               │
│  • No prop drilling (containers self-sufficient)                    │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─────────────┬──────────────────┬────────────────────┬──────────┬──────────┐
         │             │                  │                    │          │          │
    CONTAINERS     PANELS             CARDS               UI LAYER    MODALS    FALLBACK
    (5 main)    (3 primary)          (1 CTA)           (supports)   (lazy)     
         │             │                  │                    │          │          │
    ┌────┴─────────┬──────────┬─────┬──────────────────┬──────────────────┘
    │              │          │     │                  │
    │              │          │     │              SearchBar
    │              │          │     │              FilterPanel
    │              │          │     │          ActiveFiltersChips
    │              │          │     │
    │              │          │     └─ SearchResultsContainer
    │              │          │        (Legacy/Fallback)
    │              │          │
    │              │          └─ ThemeExtractionActionCard
    │              │
    │              ├─ AcademicResourcesPanel
    │              │
    │              ├─ AlternativeSourcesPanel
    │              │
    │              └─ SocialMediaPanel
    │
    ├─ LiteratureSearchContainer
    │  ├─ SearchBar
    │  ├─ FilterPanel
    │  ├─ ActiveFiltersChips
    │  ├─ ProgressiveLoadingIndicator
    │  ├─ AcademicResourcesPanel (nested)
    │  ├─ AlternativeSourcesPanel (nested)
    │  └─ SocialMediaPanel (nested)
    │
    ├─ SearchResultsContainerEnhanced
    │  ├─ PaperFiltersPanel
    │  ├─ PaperSortControls
    │  └─ PaperCard (× n papers)
    │     └─ Paper Sub-Components
    │
    ├─ PaperManagementContainer
    │  └─ PaperCard (× n saved)
    │     └─ Paper Sub-Components
    │
    ├─ ThemeExtractionContainer
    │  ├─ PurposeSpecificActions
    │  ├─ ThemeList
    │  ├─ ThemeEmptyState
    │  └─ Lazy-Loaded Modals
    │     ├─ PurposeSelectionWizard
    │     ├─ ModeSelectionModal
    │     └─ ThemeExtractionProgressModal
    │
    └─ GapAnalysisContainer
       └─ GapVisualizationPanel
```

---

## Search Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                   LiteratureSearchContainer                          │
│                        (ORCHESTRATOR)                                │
└──────────────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────┬─────────────────────┬──────────────┐
         │                         │                     │              │
    SearchUI              SourceSelection            Progress         Handlers
         │                         │                     │              │
    ┌────┴────────┐         ┌──────┴──────┐        ┌─────┴──────┐     │
    │             │         │             │        │            │     │
 SearchBar    FilterPanel Academic    Alternative Social   Progressive  │
             Chips         Resources   Sources    Media    Loading    │
                           │           │         │        Indicator   │
                      DatabaseSelector Cards    Sections             │
                      Institutional    GitHub    TikTok     Stores   │
                      Auth             StackOF   Instagram  Connected│
                      CostCalc         Podcasts  YouTube    │        │
                      │                │        │          │        │
                      └─ Zustand ─────┴────────┴──────────┘────────┘
                          Stores
                            │
                 ┌──────────┬┴─────────┬────────────┐
                 │          │          │            │
          Literature    Alternative  Social     Progressive
          SearchStore   SourcesStore MediaStore SearchStore
                 │          │          │            │
           ┌─────┴──────────┴──────────┴────────────┘
           │
        Search
       Execution
           │
    ┌──────┴──────┐
    │             │
  Results    Consolidate
  from:      from multiple
    │        sources
  • PubMed
  • Scopus
  • CrossRef
  • CORE
  • ArXiv
  • IEEE
  • Sage
  • Springer
  • Web of Science
  • Wiley
  • Nature
  • ScienceDirect
  • SSRN
  • ERIC
  • Podcasts
  • GitHub
  • StackOverflow
  • TikTok
  • Instagram
  • YouTube
           │
           ▼
    SearchResultsContainer
    (Display Results)
           │
    ┌──────┴─────────────┐
    │                    │
  Filter            Select
  Papers           Papers
    │                    │
    └────────┬───────────┘
             │
             ▼
     PaperManagement
     (Save to Library)
             │
             ▼
  Theme Extraction
  (Start Analysis)
```

---

## Component Hierarchy - Visual Tree

```
Page
│
├─ Section: Header & Stats
│  └─ Badges: papers, selected, saved, themes, gaps
│
├─ Section: Architecture Notice (Alert)
│
├─ LiteratureSearchContainer ⭐
│  │
│  ├─ SearchBar
│  │  ├─ Input field
│  │  ├─ AI suggestions
│  │  ├─ Source badges
│  │  └─ MethodologyModal (lazy)
│  │
│  ├─ FilterPanel
│  │  ├─ Year range
│  │  ├─ Quality score
│  │  ├─ Author count
│  │  ├─ Presets
│  │  └─ Reset button
│  │
│  ├─ ActiveFiltersChips
│  │  └─ Dismissible chips per filter
│  │
│  ├─ ProgressiveLoadingIndicator
│  │  └─ Real-time progress bars
│  │
│  ├─ AcademicResourcesPanel ⭐
│  │  ├─ DatabaseSelector
│  │  │  └─ 9 free academic databases
│  │  ├─ AcademicInstitutionLogin
│  │  │  └─ Shibboleth, OpenAthens, ORCID
│  │  ├─ ContentDepthAnalysis
│  │  │  └─ Full-text vs abstracts
│  │  ├─ CostCalculator
│  │  │  └─ Premium database pricing
│  │  └─ ActionButtonsGroup
│  │     └─ Extract, export, manage
│  │
│  ├─ AlternativeSourcesPanel ⭐
│  │  ├─ PodcastsSourceSection
│  │  ├─ GitHubSourceSection
│  │  ├─ StackOverflowSourceSection
│  │  └─ ResultCards
│  │     ├─ PodcastCard
│  │     ├─ GitHubCard
│  │     ├─ StackOverflowCard
│  │     ├─ YouTubeCard
│  │     └─ GenericCard
│  │
│  └─ SocialMediaPanel ⭐
│     ├─ TikTokSearchSection
│     ├─ InstagramSearchSection
│     ├─ YouTubeResearchSection
│     └─ CrossPlatformDashboard
│
├─ SearchResultsContainerEnhanced ⭐
│  ├─ PaperFiltersPanel
│  │  ├─ Year range filter
│  │  ├─ Citations per year
│  │  ├─ Author count
│  │  ├─ Open access filter
│  │  ├─ Quality score
│  │  └─ Publication type
│  │
│  ├─ PaperSortControls
│  │  ├─ Sort field selector
│  │  ├─ Direction toggle
│  │  └─ Quick sort buttons
│  │
│  ├─ Bulk Actions
│  │  ├─ Select All button
│  │  ├─ Deselect All button
│  │  └─ Selection count badge
│  │
│  ├─ Pagination
│  │  ├─ First page
│  │  ├─ Previous page
│  │  ├─ Page number selector
│  │  ├─ Next page
│  │  └─ Last page
│  │
│  └─ PaperCard (× 50 per page) ⭐
│     ├─ PaperHeader
│     │  ├─ Title (clickable)
│     │  ├─ Authors (limit 3)
│     │  └─ Selection checkbox
│     │
│     ├─ PaperMetadata
│     │  ├─ Year
│     │  ├─ Journal
│     │  ├─ DOI
│     │  └─ Source icon
│     │
│     ├─ PaperAccessBadges
│     │  ├─ Open Access badge
│     │  ├─ PDF Available badge
│     │  └─ Access level
│     │
│     ├─ PaperQualityBadges
│     │  ├─ Quality score
│     │  ├─ Citation count
│     │  └─ Relevance score
│     │
│     ├─ PaperStatusBadges
│     │  ├─ Saved/Unsaved
│     │  ├─ Extracting status
│     │  └─ Extracted status
│     │
│     └─ PaperActions
│        ├─ Save button
│        ├─ View button
│        ├─ Download PDF
│        └─ Extract themes
│
├─ AcademicResourcesPanel (standalone) ⭐
│  └─ Same as nested in search
│
├─ ThemeExtractionActionCard ⭐
│  ├─ Stats display
│  │  ├─ Selected papers count
│  │  ├─ Themes extracted
│  │  └─ Videos transcribed
│  │
│  ├─ Warnings
│  │  ├─ Min sources (3/5)
│  │  └─ Recommendations
│  │
│  └─ Extract Themes button
│     └─ Triggers PurposeSelectionWizard
│
├─ PaperManagementContainer ⭐
│  └─ PaperCard (× n saved) 
│     └─ Same structure as results
│
├─ ThemeExtractionContainer ⭐
│  ├─ Stats display
│  │  └─ Total themes: X, selected: Y
│  │
│  ├─ ThemeList (when has themes)
│  │  ├─ ThemeCard (× n)
│  │  │  ├─ Theme text
│  │  │  ├─ Source count
│  │  │  ├─ Selection checkbox
│  │  │  └─ Actions (view, edit, remove)
│  │  │
│  │  └─ Selection controls
│  │     ├─ Select All
│  │     └─ Deselect All
│  │
│  ├─ ThemeEmptyState (when no themes)
│  │  └─ Call-to-action message
│  │
│  ├─ PurposeSpecificActions (when has themes)
│  │  ├─ Q-Methodology section
│  │  │  └─ AIResearchQuestionSuggestions
│  │  │  └─ AIHypothesisSuggestions
│  │  │  └─ ThemeConstructMap
│  │  │
│  │  ├─ Survey section
│  │  │  └─ GeneratedSurveyPreview
│  │  │
│  │  └─ Other research outputs
│  │
│  └─ Lazy-loaded Modals
│     ├─ PurposeSelectionWizard
│     │  └─ Select: Q-Method, Survey, Qualitative, etc.
│     │
│     ├─ ModeSelectionModal
│     │  └─ Select analysis mode
│     │
│     └─ ThemeExtractionProgressModal
│        └─ Real-time progress + logs
│
└─ GapAnalysisContainer ⭐
   ├─ Stats
   │  └─ Gap count, analysis status
   │
   ├─ GapVisualizationPanel
   │  ├─ Gap list/chart
   │  └─ Gap details
   │
   ├─ Analyze button
   │  └─ Triggers AI gap analysis
   │
   └─ Empty state
      └─ No gaps identified message

Legend:
⭐ = Self-Contained Container (ZERO required props)
  = Gets all data from Zustand stores
  = Fully reusable anywhere
```

---

## Data Flow - State Management

```
┌─────────────────────────────────────────────────────────┐
│                    Zustand Stores                       │
│              (Centralized State Management)             │
└─────────────────────────────────────────────────────────┘
         │
    ┌────┼────┬────────────┬──────────────┬────────────┐
    │    │    │            │              │            │
    ▼    ▼    ▼            ▼              ▼            ▼
 LiterSearch AltSources  SocialMedia  PaperManage  ThemeExtract GapAnalysis  VideoManage InstitAuth
    Store     Store        Store         Store       Store        Store       Store      Store
    │         │            │            │           │            │           │          │
    │  ┌──────┘            │            │           │            │           │          │
    │  │                   │            │           │            │           │          │
    └─→│  ┌────────────────┴─────┐      │           │            │           │          │
       │  │                      │      │           │            │           │          │
       │  │  ┌──────────────────────────┴────┐      │            │           │          │
       │  │  │                               │      │            │           │          │
    ┌──┴──┴──┴───────────────────────────────┘      │            │           │          │
    │                                                │            │           │          │
    │  LiteratureSearchContainer                     │            │           │          │
    │  │                                             │            │           │          │
    ├──→ SearchBar (uses filters)                    │            │           │          │
    ├──→ FilterPanel (updates filters)               │            │           │          │
    ├──→ AcademicResourcesPanel (uses databases) ────┼────────────┘           │          │
    ├──→ AlternativeSourcesPanel (uses sources) ─────┼────────────────────────┤          │
    ├──→ SocialMediaPanel (uses platforms) ──────────┼────────────────────────┼──────────┤
    │                                                │                       │          │
    │                                                │                       │          │
    ▼                                                ▼                       ▼          │
SearchResultsContainerEnhanced  ThemeExtractionContainer        GapAnalysisContainer   │
    │                                │                              │                 │
    ├─→ Use: useLiteratureSearchStore │                              ├─→ Use: useLiteratureSearchStore
    │   - Papers list                │                              ├─→ Use: usePaperManagementStore
    │   - Selection state            │                              └─→ Use: useGapAnalysisStore
    │                                │
    ├─→ Use: usePaperManagementStore │
    │   - Saved papers               │
    │   - Selection state            │
    │                                │
    ├─ PaperCard × n                 ├─→ Use: useThemeExtractionStore
    │  │                             │   - Themes
    │  ├─ selection state            │   - Purpose
    │  ├─ save state                 │   - Extraction status
    │  └─ extraction status          │
    │                                ├─ ThemeList
    │                                │  └─ ThemeCard × n
    │                                │     ├─ Theme data
    │                                │     └─ Selection state
    │                                │
    │                                ├─ PurposeSpecificActions
    │                                │  ├─ AIResearchQuestionSuggestions
    │                                │  ├─ AIHypothesisSuggestions
    │                                │  ├─ ThemeConstructMap
    │                                │  └─ GeneratedSurveyPreview
    │                                │
    │                                └─ Modals (lazy-loaded)
    │                                   ├─ PurposeSelectionWizard
    │                                   ├─ ModeSelectionModal
    │                                   └─ ThemeExtractionProgressModal
    │
    PaperManagementContainer
    │
    ├─→ Use: usePaperManagementStore
    │   - Saved papers
    │   - Selection state
    │
    └─ PaperCard × n
       └─ Same as results display

ThemeExtractionActionCard
    │
    ├─→ Use: useLiteratureSearchStore
    │   - Papers count
    │   - Selected count
    │
    ├─→ Use: useThemeExtractionStore
    │   - Themes count
    │   - Extraction status
    │
    └─→ Use: useVideoManagementStore
        - Transcribed videos count
```

---

## Component Classification Matrix

```
                    │  PRESENTATIONAL  │  CONTAINER  │  MODAL  │  UTILITY
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Search Components   │  SearchBar*      │      -      │    -    │ FilterPanel
                    │  FilterPanel*    │      -      │    -    │ ActiveFilters
                    │  SearchResults*  │      -      │    -    │ -
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Paper Components    │  PaperCard       │      -      │    -    │ PaperFilters
                    │  PaperHeader     │      -      │    -    │ PaperSort
                    │  PaperMetadata   │      -      │    -    │ -
                    │  PaperBadges (3) │      -      │    -    │ -
                    │  PaperActions    │      -      │    -    │ -
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Theme Components    │  ThemeList       │      -      │    -    │ SourceSummary
                    │  ThemeEmptyState │      -      │    -    │ -
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Panel Components    │  -               │  Academic   │    -    │ -
                    │  -               │  Alternative│    -    │ -
                    │  -               │  SocialMedia│    -    │ -
                    │  -               │  -          │    -    │ -
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Container Comps     │  -               │  Literature │    -    │ -
                    │  -               │  Results    │    -    │ -
                    │  -               │  Theme      │    -    │ -
                    │  -               │  Paper Mgmt │    -    │ -
                    │  -               │  Gap        │    -    │ -
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Action Components   │  Purpose         │      -      │    -    │ Extraction
                    │  Specific        │      -      │    -    │ Card
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Alternative Src     │  Sections (3)    │      -      │    -    │ Result
                    │  Cards (5)       │      -      │    -    │ Card
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Social Media        │  Sections (3)    │      -      │    -    │ Dashboard
────────────────────┼──────────────────┼─────────────┼─────────┼──────────
Modals              │  -               │      -      │  9+ modals │ -
────────────────────┼──────────────────┼─────────────┼─────────┼──────────

* = Has store integration (hybrid)
Total Presentational: 30+
Total Containers: 5
Total Modals: 9+
Total Utilities: 15+
```

---

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────┐
│             Performance Optimization                │
└─────────────────────────────────────────────────────┘
    │
    ├─ Memoization
    │  ├─ React.memo() on all presentational components
    │  ├─ useMemo() for expensive computations
    │  │  └─ Filtered results, computed badges, etc.
    │  └─ useCallback() for all event handlers
    │
    ├─ Code Splitting
    │  ├─ Lazy-load modals with dynamic()
    │  │  ├─ PurposeSelectionWizard
    │  │  ├─ ModeSelectionModal
    │  │  └─ ThemeExtractionProgressModal
    │  └─ Reduce initial JS bundle size
    │
    ├─ Pagination
    │  ├─ Display 50 papers per page
    │  └─ Virtual scrolling ready
    │
    ├─ Store Optimization
    │  ├─ Zustand selectors (fine-grained subscriptions)
    │  ├─ Only re-render on relevant store changes
    │  └─ Avoid whole-store subscriptions
    │
    ├─ Image Optimization
    │  ├─ Source icons lazy-loaded
    │  └─ Author avatars optional
    │
    └─ Network Optimization
       ├─ Debounced search (suggestions)
       ├─ Request deduplication
       └─ Response caching (SearchResultsBanner)
```

---

## Error Handling Strategy

```
┌─────────────────────────────────────┐
│        Error Boundaries             │
└─────────────────────────────────────┘
        │
        ├─ Page-level ErrorBoundary
        │  └─ Catches all container errors
        │
        └─ Container-level error handling
           ├─ Try-catch in async operations
           ├─ Validation on data from stores
           ├─ Graceful fallbacks (empty states)
           └─ User-friendly error messages
                │
                ├─ Search errors → "No results"
                ├─ Theme errors → "Extraction failed"
                ├─ Save errors → Toast notification
                └─ Network errors → Retry suggestion
```

---

## Accessibility Architecture

```
┌──────────────────────────────────────┐
│        WCAG 2.1 AA Compliance       │
└──────────────────────────────────────┘
    │
    ├─ Semantic HTML
    │  ├─ <main>, <article>, <section>
    │  ├─ Proper heading hierarchy (h1 → h6)
    │  └─ Form labels and fieldsets
    │
    ├─ ARIA Labels
    │  ├─ role="status" for loading indicators
    │  ├─ role="button" for button-like divs
    │  ├─ aria-label on icon-only buttons
    │  ├─ aria-live="polite" on status updates
    │  ├─ aria-describedby for tooltips
    │  └─ aria-hidden="true" on decorative elements
    │
    ├─ Keyboard Navigation
    │  ├─ Tab order follows visual flow
    │  ├─ Enter/Space on focusable elements
    │  ├─ Escape closes modals
    │  └─ Skip links for main content
    │
    ├─ Color Contrast
    │  ├─ Text: 4.5:1 minimum
    │  ├─ UI components: 3:1 minimum
    │  └─ Focus indicators: 3:1 minimum
    │
    ├─ Focus Management
    │  ├─ Visible focus indicators
    │  ├─ Focus trap in modals
    │  ├─ Return focus after modal closes
    │  └─ Focus on heading after navigation
    │
    └─ Screen Reader Support
       ├─ Descriptive link text
       ├─ Form field labels
       ├─ Alt text for images (where needed)
       ├─ Hidden content with sr-only class
       └─ Skip links and landmarks
```

---

Generated: 2025-11-22
