# Literature Discovery Page - Component Quick Reference

## Quick Navigation

### Main Page
- **File:** `/frontend/app/(researcher)/discover/literature/page.tsx`
- **Type:** Next.js Page Component
- **Orchestrates:** 7 self-contained containers
- **Key Features:** Hydration-safe stats display, container orchestration

---

## Self-Contained Containers (ZERO Props Required)

### Search & Results (3 containers)
| Component | File | Purpose |
|-----------|------|---------|
| **LiteratureSearchContainer** | `containers/LiteratureSearchContainer.tsx` | Universal search coordination, source selection |
| **SearchResultsContainerEnhanced** | `containers/SearchResultsContainerEnhanced.tsx` | Paper list display, filtering, sorting, pagination |
| **ThemeExtractionContainer** | `containers/ThemeExtractionContainer.tsx` | Theme display, purpose-specific actions, modals |

### Library & Analysis (2 containers)
| Component | File | Purpose |
|-----------|------|---------|
| **PaperManagementContainer** | `containers/PaperManagementContainer.tsx` | User's saved paper library |
| **GapAnalysisContainer** | `containers/GapAnalysisContainer.tsx` | Research gap analysis |

### Panels (3 self-contained panels)
| Component | File | Purpose |
|-----------|------|---------|
| **AcademicResourcesPanel** | `components/AcademicResourcesPanel.tsx` | Academic databases, institutional auth, cost calculator |
| **AlternativeSourcesPanel** | `components/AlternativeSourcesPanel.tsx` | Podcasts, GitHub, StackOverflow |
| **SocialMediaPanel** | `components/SocialMediaPanel.tsx` | TikTok, Instagram, YouTube |

### Cards
| Component | File | Purpose |
|-----------|------|---------|
| **ThemeExtractionActionCard** | `components/ThemeExtractionActionCard.tsx` | Call-to-action for theme extraction |

---

## Component Inventory

### Search Section (4 components)
**Directory:** `components/SearchSection/`

- `SearchBar.tsx` - Search input with AI suggestions
- `FilterPanel.tsx` - Advanced filters + presets
- `ActiveFiltersChips.tsx` - Applied filter display
- `SearchResultsDisplay.tsx` - Results visualization

### Paper Card (7 components)
**Directory:** `components/paper-card/`

- `PaperCard.tsx` - Main card (composed of sub-components)
  - `PaperHeader.tsx` - Title, authors, checkbox
  - `PaperMetadata.tsx` - Publication info
  - `PaperAccessBadges.tsx` - Access status
  - `PaperQualityBadges.tsx` - Quality indicators
  - `PaperStatusBadges.tsx` - Save/extract status
  - `PaperActions.tsx` - Action buttons

### Theme Extraction (3 components)
**Directory:** `components/theme-extraction/`

- `ThemeList.tsx` - Theme list display
- `ThemeEmptyState.tsx` - No themes state
- `SourceSummaryCard.tsx` - Theme source summary

### Alternative Sources (9 components)
**Directory:** `components/alternative-sources/`

**Sections (3):**
- `PodcastsSourceSection.tsx`
- `GitHubSourceSection.tsx`
- `StackOverflowSourceSection.tsx`

**Result Cards (5):**
- `GenericCard.tsx`
- `PodcastCard.tsx`
- `GitHubCard.tsx`
- `StackOverflowCard.tsx`
- `YouTubeCard.tsx`

**Utilities:**
- `SourceResultCard.tsx` - Result wrapper

### Social Media (3 components)
**Directory:** `components/social-media/`

- `TikTokSearchSection.tsx`
- `InstagramSearchSection.tsx`
- `YouTubeResearchSection.tsx`

### Other Main Components (3)
- `PaperFiltersPanel.tsx` - Advanced paper filtering
- `PaperSortControls.tsx` - Sorting controls
- `PurposeSpecificActions.tsx` - Purpose-specific outputs (Q-Statements, surveys, etc.)
- `MobileOptimizationWrapper.tsx` - Mobile responsiveness

---

## Shared Library Components
**Directory:** `/frontend/components/literature/`

### By Category

**Progress (4)**
- `ProgressBar.tsx` - Real-time progress
- `SearchTransparencySummary.tsx` - Search summary
- `SourceBreakdown.tsx` - Source distribution
- `ThemeExtractionProgress.tsx` - Extraction progress

**Modals (9)**
- `PurposeSelectionWizard.tsx`
- `ModeSelectionModal.tsx`
- `ThemeExtractionProgressModal.tsx`
- `MethodologyModal.tsx`
- `EditCorpusModal.tsx`
- `CompleteSurveyFromThemesModal.tsx`
- `IncrementalExtractionModal.tsx`
- `CitationModal.tsx`
- `InstagramUploadModal.tsx`

**Research Output (6)**
- `AIResearchQuestionSuggestions.tsx`
- `AIHypothesisSuggestions.tsx`
- `GeneratedSurveyPreview.tsx`
- `ThemeConstructMap.tsx`
- `KnowledgeMapVisualization.tsx`
- `GapVisualizationPanel.tsx`

**Themes (6)**
- `ThemeCard.tsx`
- `EnterpriseThemeCard.tsx`
- `ThemeActionPanel.tsx`
- `ThemeProvenancePanel.tsx`
- `ThemeMethodologyExplainer.tsx`

**Social Media (8)**
- `CrossPlatformDashboard.tsx`
- `InstagramVideoCard.tsx`
- `InstagramResultsGrid.tsx`
- `TikTokVideoCard.tsx`
- `TikTokTrendsGrid.tsx`
- `YouTubeChannelBrowser.tsx`
- `SocialMediaResultsDisplay.tsx`
- `VideoSelectionPanel.tsx`

**Academic & Data (5)**
- `AcademicInstitutionLogin.tsx`
- `AcademicSourceIcons.tsx` (utility)
- `CostCalculator.tsx`
- `CostSavingsCard.tsx`
- `CorpusManagementPanel.tsx`

**Utilities (10)**
- `ProgressiveLoadingIndicator.tsx`
- `SearchFilters.tsx`
- `SearchBar.tsx` (generic)
- `Pagination.tsx`
- `ExportButton.tsx`
- `LoadingSkeletons.tsx`
- `CachedResultsBanner.tsx`
- `AISearchAssistant.tsx`
- `EnhancedThemeExtractionProgress.tsx`
- `SaturationDashboard.tsx`

**Academic Resources Sub (3)**
`/components/literature/academic-resources/`
- `DatabaseSelector.tsx`
- `ContentDepthAnalysis.tsx`
- `ActionButtonsGroup.tsx`

---

## Store Mapping

| Store | Used By | Data Type |
|-------|---------|-----------|
| `useLiteratureSearchStore` | Search, Results, Theme, Action Card | Papers, filters, search state |
| `usePaperManagementStore` | Results, Management, Gap Analysis | Selected/saved papers, extraction state |
| `useThemeExtractionStore` | Theme Container, Action Card | Themes, extraction status, purpose |
| `useAlternativeSourcesStore` | Alt Panel, Search Container | Alternative sources selection |
| `useSocialMediaStore` | Social Panel, Search Container | Platform selection, videos |
| `useVideoManagementStore` | Academic Panel, Action Card | Transcribed videos, video state |
| `useGapAnalysisStore` | Gap Container | Gaps, analysis status |
| `useInstitutionAuthStore` | Academic Panel | Institution auth state |

---

## Architecture Pattern Summary

### Self-Contained Container Pattern (Phase 10.935)
```
Container
├─ Zero required props ✅
├─ Gets all data from Zustand stores
├─ Implements all business logic
├─ Composes presentational components
└─ Fully reusable anywhere in app
```

### Typical Container Structure
```tsx
export const MyContainer = React.memo(function MyContainer() {
  // Get store data
  const store = useMyStore();
  
  // Event handlers
  const handleAction = useCallback(() => { }, []);
  
  // Computed values
  const computed = useMemo(() => { }, []);
  
  // Render
  return (
    <PresentationalComponent 
      data={store.data}
      onAction={handleAction}
    />
  );
});
```

---

## Props Reduction Metrics (Phase 10.935)

| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| AcademicResourcesPanel | 15 props | 0 props | -100% |
| AlternativeSourcesPanel | 5 props | 0 props | -100% |
| SocialMediaPanel | 17 props | 0 props | -100% |
| LiteratureSearchContainer | 6 props | 0 props | -100% |
| PaperManagementContainer | 9 props | 0 props | -100% |
| ThemeExtractionContainer | 26 props | 0 props | -100% |

**Total Props Eliminated:** 78 props

---

## Data Flow

```
Page.tsx (orchestrates containers)
│
├─ Displays stats (hydration-safe)
└─ Renders containers:
   ├─ LiteratureSearchContainer
   │  └─ Gets: useLiteratureSearchStore, useAlternativeSourcesStore, useSocialMediaStore
   │
   ├─ SearchResultsContainerEnhanced
   │  └─ Gets: useLiteratureSearchStore, usePaperManagementStore
   │
   ├─ AcademicResourcesPanel + standalone in search
   │  └─ Gets: 5 stores
   │
   ├─ ThemeExtractionActionCard
   │  └─ Gets: useThemeExtractionStore, useLiteratureSearchStore, useVideoManagementStore
   │
   ├─ PaperManagementContainer
   │  └─ Gets: usePaperManagementStore
   │
   ├─ ThemeExtractionContainer
   │  └─ Gets: useThemeExtractionStore, useLiteratureSearchStore, useAlternativeSourcesStore
   │
   └─ GapAnalysisContainer
      └─ Gets: useGapAnalysisStore, usePaperManagementStore, useLiteratureSearchStore
```

---

## Common Tasks

### Adding a New Component
1. Create component in appropriate directory
2. Use `React.memo()` for presentational components
3. Use `useCallback()` for all event handlers
4. Use `useMemo()` for expensive computations
5. Add TypeScript types (no `any`)
6. Add accessibility attributes

### Connecting a Container to a Store
1. Import the store: `import { useMyStore } from '@/lib/stores/my.store'`
2. Get data in container: `const { data } = useMyStore()`
3. Create handlers with `useCallback()`
4. Pass to presentational components as props
5. Let presentational components be dumb (props only)

### Working with Modals
- Lazy load with `dynamic()` from next/dynamic
- Place modal state in container or store
- Use loading spinner while dynamic loading
- Add accessibility: `role="status"`, `aria-live="polite"`, `aria-hidden="true"`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `page.tsx` | Main page, container orchestration |
| `containers/` | Self-contained components |
| `components/` | All page-specific components |
| `components/literature/` | Shared library components |
| `lib/stores/` | Zustand store definitions |
| `lib/hooks/` | Custom React hooks |
| `lib/api/services/` | API integration services |
| `lib/types/` | TypeScript type definitions |

---

## Performance Notes

- All containers wrapped with `React.memo()`
- All event handlers use `useCallback()`
- Expensive computations use `useMemo()`
- Modals lazy-loaded with `dynamic()`
- Pagination: 50 papers per page default
- SearchResultsContainerEnhanced memoizes filtered results

---

## Accessibility Standards

- WCAG 2.1 AA compliance
- Semantic HTML (proper heading hierarchy)
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management for modals
- Loading states with `aria-live="polite"`
- Hidden content with `sr-only` class

---

## Enterprise Standards Checklist

✅ TypeScript strict mode (no `any`)
✅ React.memo() on all presentational components
✅ useCallback() on all event handlers
✅ useMemo() on expensive computations
✅ Proper dependency arrays
✅ Self-contained pattern (zero required props)
✅ Error boundaries compatible
✅ Enterprise logging (no console.log)
✅ Defensive programming
✅ Component size < 400 lines
✅ Memory leak prevention
✅ WCAG 2.1 AA accessibility

---

## Troubleshooting

### Container Not Getting Latest Store Data
- Ensure hook is using `()` selector or full state
- Check Zustand store subscription is working
- Verify store is imported correctly

### Prop Drilling Detected
- Move logic to self-contained container
- Get data from store instead
- Extract as separate component if needed

### Component Too Large
- Extract sub-components
- Move business logic to hooks/services
- Aim for < 400 lines per file

### Performance Issues
- Add React.memo() wrapper
- Check dependency arrays
- Use useCallback() for handlers
- Use useMemo() for expensive computations
- Use Lighthouse to profile

---

Generated: 2025-11-22
