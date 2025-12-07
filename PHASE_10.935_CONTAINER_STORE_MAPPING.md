# PHASE 10.935 CONTAINER-TO-STORE MAPPING REFERENCE
**Date:** November 18, 2025
**Purpose:** Complete mapping of container props to Zustand store sources
**Usage:** Reference for Days 1-2 container refactoring
**Quality Standard:** Enterprise-Grade Self-Contained Containers

---

## 🎯 SELF-CONTAINED CONTAINER PATTERN

### Target Architecture
```typescript
// ✅ SELF-CONTAINED CONTAINER (ZERO PROPS)
export function ContainerName() {
  // 1. Get ALL data from stores
  const storeData = useStore(state => state.data);

  // 2. Get ALL actions from stores or hooks
  const { handleAction } = useHook();

  // 3. Compute values locally
  const computedValue = storeData.items.length;

  // 4. NO PROPS NEEDED!
  return <UI />;
}

// Usage in page.tsx
<ContainerName />  // No props!
```

---

## 1️⃣ LITERATURE SEARCH CONTAINER

### File Location
`frontend/app/(researcher)/discover/literature/containers/LiteratureSearchContainer.tsx`

### Current Interface (BEFORE)
```typescript
export interface LiteratureSearchContainerProps {
  loadingAlternative: boolean;
  loadingSocial: boolean;
  onSearch: () => Promise<void>;
  academicDatabasesCount: number;
  alternativeSourcesCount: number;
  socialPlatformsCount: number;
}
```

### Complete Mapping Table

| Prop Name | Current Type | Store Source | Access Pattern | Notes |
|-----------|--------------|--------------|----------------|-------|
| `loadingAlternative` | `boolean` | `useAlternativeSourcesStore()` | `.loading` | Direct state read |
| `loadingSocial` | `boolean` | `useSocialMediaStore()` | `.loading` | Direct state read |
| `onSearch` | `() => Promise<void>` | `useLiteratureSearch()` | `.handleSearch` | Hook method |
| `academicDatabasesCount` | `number` | `useLiteratureSearchStore()` | `.academicDatabases.length` | Computed locally |
| `alternativeSourcesCount` | `number` | `useAlternativeSourcesStore()` | `.sources.length` | Computed locally |
| `socialPlatformsCount` | `number` | `useSocialMediaStore()` | `.platforms.length` | Computed locally |

### Target Implementation (AFTER)
```typescript
// NO PROPS INTERFACE NEEDED!

export function LiteratureSearchContainer() {
  // ===== STORE STATE =====
  const {
    showFilters,
    toggleShowFilters,
    getAppliedFilterCount,
    progressiveLoading,
    academicDatabases,  // For count
  } = useLiteratureSearchStore();

  // Alternative sources state
  const {
    loading: loadingAlternative,
    sources,  // For count
  } = useAlternativeSourcesStore();

  // Social media state
  const {
    loading: loadingSocial,
    platforms,  // For count
  } = useSocialMediaStore();

  // ===== HOOKS =====
  const { cancelProgressiveSearch, isSearching } = useProgressiveSearch();
  const { handleSearch } = useLiteratureSearch();

  // ===== COMPUTED VALUES =====
  const academicDatabasesCount = academicDatabases.length;
  const alternativeSourcesCount = sources.length;
  const socialPlatformsCount = platforms.length;
  const appliedFilterCount = getAppliedFilterCount();
  const isLoading = loadingAlternative || loadingSocial || isSearching;

  // ===== HANDLERS =====
  const handleCancelProgressiveSearch = useCallback((): void => {
    logger.info('LiteratureSearchContainer', 'Cancelling progressive search');
    cancelProgressiveSearch();
  }, [cancelProgressiveSearch]);

  // ===== RENDER =====
  return (
    <Card className="border-2 border-blue-200">
      <CardContent className="p-6">
        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
          appliedFilterCount={appliedFilterCount}
          showFilters={showFilters}
          onToggleFilters={toggleShowFilters}
          academicDatabasesCount={academicDatabasesCount}
          alternativeSourcesCount={alternativeSourcesCount}
          socialPlatformsCount={socialPlatformsCount}
        />

        <ActiveFiltersChips />
        <FilterPanel isVisible={showFilters} />

        <ProgressiveLoadingIndicator
          state={progressiveLoading}
          onCancel={handleCancelProgressiveSearch}
        />
      </CardContent>
    </Card>
  );
}

LiteratureSearchContainer.displayName = 'LiteratureSearchContainer';
```

### Stores Required
1. `useLiteratureSearchStore` - Main search state
2. `useAlternativeSourcesStore` - Alternative sources data (inferred - verify exists)
3. `useSocialMediaStore` - Social media state
4. `useProgressiveSearch` - Progressive search hook
5. `useLiteratureSearch` - Search action hook

---

## 2️⃣ PAPER MANAGEMENT CONTAINER

### File Location
`frontend/app/(researcher)/discover/literature/containers/PaperManagementContainer.tsx`

### Current Interface (BEFORE)
```typescript
export interface PaperManagementContainerProps {
  savedPapers: Paper[];
  selectedPapers: Set<string>;
  extractingPapers: Set<string>;
  extractedPapers: Set<string>;
  onTogglePaperSelection: (paperId: string) => void;
  onTogglePaperSave: (paper: Paper) => void | Promise<void>;
  emptyStateMessage?: string;  // KEEP (optional config)
  isLoading?: boolean;
  error?: string | null;
}
```

### Complete Mapping Table

| Prop Name | Current Type | Store Source | Access Pattern | Action |
|-----------|--------------|--------------|----------------|--------|
| `savedPapers` | `Paper[]` | `usePaperManagementStore()` | `.savedPapers` | REMOVE |
| `selectedPapers` | `Set<string>` | `usePaperManagementStore()` | `.selectedPapers` | REMOVE |
| `extractingPapers` | `Set<string>` | `usePaperManagementStore()` | `.extractingPapers` | REMOVE |
| `extractedPapers` | `Set<string>` | `usePaperManagementStore()` | `.extractedPapers` | REMOVE |
| `onTogglePaperSelection` | `Function` | `usePaperManagementStore()` | `.togglePaperSelection` | REMOVE |
| `onTogglePaperSave` | `Function` | `usePaperManagementStore()` | `.handleSavePaper` | REMOVE |
| `emptyStateMessage` | `string?` | N/A | Component default | **KEEP** ✅ |
| `isLoading` | `boolean?` | `usePaperManagementStore()` | `.isLoading` | REMOVE |
| `error` | `string?` | `usePaperManagementStore()` | `.error` | REMOVE |

### Target Implementation (AFTER)
```typescript
// OPTIONAL CONFIGS ONLY (2 props maximum)
export interface PaperManagementContainerProps {
  emptyStateMessage?: string;  // Optional UX customization
  showBulkActions?: boolean;   // Optional feature toggle
}

export function PaperManagementContainer({
  emptyStateMessage = 'No papers saved yet. Search and save papers to build your library.',
  showBulkActions = true,
}: PaperManagementContainerProps = {}) {
  // ===== STORE STATE =====
  const {
    savedPapers,
    selectedPapers,
    extractingPapers,
    extractedPapers,
    isLoading,
    error,
    togglePaperSelection,
    handleSavePaper,
    bulkSelectAll,
    bulkDeselectAll,
  } = usePaperManagementStore();

  // ===== COMPUTED VALUES =====
  const hasPapers = savedPapers.length > 0;
  const selectedCount = selectedPapers.size;
  const allSelected = savedPapers.length > 0 && selectedCount === savedPapers.length;

  // ===== HANDLERS =====
  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      bulkDeselectAll();
    } else {
      bulkSelectAll(savedPapers.map(p => p.id));
    }
  }, [allSelected, bulkSelectAll, bulkDeselectAll, savedPapers]);

  // ===== RENDER =====
  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!hasPapers) {
    return <EmptyState message={emptyStateMessage} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Library ({savedPapers.length} papers)</CardTitle>

          {showBulkActions && (
            <BulkActions
              selectedCount={selectedCount}
              onToggleAll={handleToggleAll}
              allSelected={allSelected}
            />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {savedPapers.map(paper => (
            <PaperCard
              key={paper.id}
              paper={paper}
              isSelected={selectedPapers.has(paper.id)}
              isExtracting={extractingPapers.has(paper.id)}
              isExtracted={extractedPapers.has(paper.id)}
              onToggleSelection={() => togglePaperSelection(paper.id)}
              onToggleSave={() => handleSavePaper(paper)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Stores Required
1. `usePaperManagementStore` - ALL paper management state and actions

---

## 3️⃣ THEME EXTRACTION CONTAINER

### File Location
`frontend/app/(researcher)/discover/literature/containers/ThemeExtractionContainer.tsx`

### Current Interface (BEFORE) - COMPLEX!
```typescript
export interface ThemeExtractionContainerProps {
  // Data props (9)
  unifiedThemes: UnifiedTheme[];
  extractionPurpose?: ResearchPurpose | null;
  v2SaturationData?: SaturationData | null;
  totalSources: number;
  selectedThemeIds: string[];
  analyzingThemes: boolean;
  extractedPapers: Set<string>;
  researchQuestions: ResearchQuestion[];
  hypotheses: HypothesisSuggestionType[];

  // Action props (9)
  onToggleThemeSelection: (themeId: string) => void;
  onClearSelection: () => void;
  onGenerateStatements: () => void;
  onGenerateQuestions: () => void;
  onGenerateHypotheses: () => void;
  onMapConstructs: () => void;
  onShowSurveyModal: () => void;
  onExportThemes: () => void;
  onViewThemeDetails: (themeId: string) => void;

  // Total: 18+ props
}
```

### Complete Mapping Table

| Prop Name | Current Type | Store Source | Access Pattern | Notes |
|-----------|--------------|--------------|----------------|-------|
| `unifiedThemes` | `UnifiedTheme[]` | `useThemeExtractionStore()` | `.unifiedThemes` | Core data |
| `extractionPurpose` | `ResearchPurpose?` | `useThemeExtractionStore()` | `.extractionPurpose` | Workflow state |
| `v2SaturationData` | `SaturationData?` | `useThemeExtractionStore()` | `.v2SaturationData` | Analysis data |
| `totalSources` | `number` | Computed | `papers.length + videos.length` | Cross-store compute |
| `selectedThemeIds` | `string[]` | `useThemeExtractionStore()` | `.selectedThemeIds` | Selection state |
| `analyzingThemes` | `boolean` | `useThemeExtractionStore()` | `.analyzingThemes` | Loading state |
| `extractedPapers` | `Set<string>` | `usePaperManagementStore()` | `.extractedPapers` | Cross-store read |
| `researchQuestions` | `ResearchQuestion[]` | `useThemeExtractionStore()` | `.researchQuestions` | Generated output |
| `hypotheses` | `Hypothesis[]` | `useThemeExtractionStore()` | `.hypotheses` | Generated output |
| `onToggleThemeSelection` | `Function` | `useThemeExtractionStore()` | `.toggleThemeSelection` | Store action |
| `onClearSelection` | `Function` | `useThemeExtractionStore()` | `.clearSelection` | Store action |
| `onGenerateStatements` | `Function` | `useThemeExtraction()` | `.handleGenerateStatements` | Hook method |
| `onGenerateQuestions` | `Function` | `useThemeExtraction()` | `.handleGenerateQuestions` | Hook method |
| `onGenerateHypotheses` | `Function` | `useThemeExtraction()` | `.handleGenerateHypotheses` | Hook method |
| `onMapConstructs` | `Function` | `useThemeExtraction()` | `.handleMapConstructs` | Hook method |
| `onShowSurveyModal` | `Function` | Modal state | `setShowSurveyModal(true)` | Local state |
| `onExportThemes` | `Function` | `useThemeExtraction()` | `.handleExportThemes` | Hook method |

### Target Implementation (AFTER)
```typescript
// NO PROPS NEEDED (fully self-contained)

export function ThemeExtractionContainer() {
  // ===== STORE STATE =====
  const {
    unifiedThemes,
    extractionPurpose,
    v2SaturationData,
    selectedThemeIds,
    analyzingThemes,
    researchQuestions,
    hypotheses,
    toggleThemeSelection,
    clearSelection,
  } = useThemeExtractionStore();

  // Cross-store reads
  const extractedPapers = usePaperManagementStore(state => state.extractedPapers);
  const savedPapers = usePaperManagementStore(state => state.savedPapers);
  const savedVideos = useVideoManagementStore(state => state.savedVideos);

  // ===== HOOKS =====
  const {
    handleGenerateStatements,
    handleGenerateQuestions,
    handleGenerateHypotheses,
    handleMapConstructs,
    handleExportThemes,
  } = useThemeExtractionHandlers();

  // ===== LOCAL STATE =====
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // ===== COMPUTED VALUES =====
  const totalSources = savedPapers.length + (savedVideos?.length || 0);
  const hasThemes = unifiedThemes.length > 0;
  const hasSelectedThemes = selectedThemeIds.length > 0;

  // ===== HANDLERS =====
  const handleSelectAll = useCallback(() => {
    unifiedThemes.forEach(theme => {
      if (!selectedThemeIds.includes(theme.id)) {
        toggleThemeSelection(theme.id);
      }
    });
  }, [unifiedThemes, selectedThemeIds, toggleThemeSelection]);

  // ===== RENDER =====
  if (analyzingThemes) {
    return <ThemeExtractionProgress />;
  }

  if (!hasThemes) {
    return (
      <EmptyState
        title="No themes extracted yet"
        description="Extract themes from your saved papers to identify key concepts"
        action={
          <Button onClick={() => setShowSurveyModal(true)}>
            Extract Themes
          </Button>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Themes ({unifiedThemes.length})</CardTitle>
        <CardDescription>
          From {totalSources} sources
          {extractionPurpose && ` • Purpose: ${extractionPurpose}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Theme Actions */}
        <ThemeActions
          selectedCount={hasSelectedThemes}
          onSelectAll={handleSelectAll}
          onClearSelection={clearSelection}
          onExportThemes={handleExportThemes}
        />

        {/* Theme List */}
        <ThemeList
          themes={unifiedThemes}
          selectedThemeIds={selectedThemeIds}
          onToggleTheme={toggleThemeSelection}
        />

        {/* Purpose-Specific Actions */}
        {extractionPurpose && (
          <PurposeSpecificActions
            purpose={extractionPurpose}
            selectedThemeIds={selectedThemeIds}
            researchQuestions={researchQuestions}
            hypotheses={hypotheses}
            onGenerateStatements={handleGenerateStatements}
            onGenerateQuestions={handleGenerateQuestions}
            onGenerateHypotheses={handleGenerateHypotheses}
            onMapConstructs={handleMapConstructs}
            onShowSurveyModal={() => setShowSurveyModal(true)}
          />
        )}

        {/* Saturation Display */}
        {v2SaturationData && (
          <SaturationDisplay data={v2SaturationData} />
        )}
      </CardContent>

      {/* Survey Modal */}
      {showSurveyModal && (
        <GeneratedSurveyPreview
          isOpen={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
        />
      )}
    </Card>
  );
}
```

### Stores Required
1. `useThemeExtractionStore` - Theme data, selection, workflow state
2. `usePaperManagementStore` - Extracted papers, saved papers
3. `useVideoManagementStore` - Saved videos (for totalSources)
4. `useThemeExtractionHandlers` - Purpose-specific action handlers (hook)

### Component Breakup Plan (691 lines → < 400 lines)
```
ThemeExtractionContainer.tsx (200 lines)  ← Main orchestrator
├── ThemeList.tsx (150 lines)              ← NEW: Theme rendering
├── ThemeActions.tsx (120 lines)           ← NEW: Action buttons
└── ThemeSelection.tsx (100 lines)         ← NEW: Selection UI

Total: 570 lines (down from 691, -17%)
```

---

## 4️⃣ GAP ANALYSIS CONTAINER

### File Location
`frontend/app/(researcher)/discover/literature/containers/GapAnalysisContainer.tsx`

### Current Interface (BEFORE)
```typescript
export interface GapAnalysisContainerProps {
  gaps: ResearchGap[];
  analyzingGaps: boolean;
  selectedPapersCount: number;
  onAnalyzeGaps: () => void | Promise<void>;
  error?: string | null;
  emptyStateMessage?: string;  // KEEP (optional config)
  analyzeButtonText?: string;  // KEEP (optional config)
  minPapersRequired?: number;  // KEEP (optional config)
}
```

### Complete Mapping Table

| Prop Name | Current Type | Store Source | Access Pattern | Action |
|-----------|--------------|--------------|----------------|--------|
| `gaps` | `ResearchGap[]` | `useGapAnalysisStore()` | `.gaps` | REMOVE |
| `analyzingGaps` | `boolean` | `useGapAnalysisStore()` | `.analyzingGaps` | REMOVE |
| `selectedPapersCount` | `number` | `usePaperManagementStore()` | `.selectedPapers.size` | REMOVE |
| `onAnalyzeGaps` | `Function` | `useGapAnalysis()` | `.handleAnalyzeGaps` | REMOVE |
| `error` | `string?` | `useGapAnalysisStore()` | `.error` | REMOVE |
| `emptyStateMessage` | `string?` | N/A | Component default | **KEEP** ✅ |
| `analyzeButtonText` | `string?` | N/A | Component default | **KEEP** ✅ |
| `minPapersRequired` | `number?` | N/A | Component default | **KEEP** ✅ |

### Target Implementation (AFTER)
```typescript
// OPTIONAL CONFIGS ONLY (3 props maximum)
export interface GapAnalysisContainerProps {
  emptyStateMessage?: string;
  analyzeButtonText?: string;
  minPapersRequired?: number;
}

export function GapAnalysisContainer({
  emptyStateMessage = 'No research gaps identified yet. Select papers and run gap analysis.',
  analyzeButtonText = 'Analyze Research Gaps',
  minPapersRequired = 5,
}: GapAnalysisContainerProps = {}) {
  // ===== STORE STATE =====
  const {
    gaps,
    analyzingGaps,
    error,
  } = useGapAnalysisStore();

  // Cross-store reads
  const selectedPapers = usePaperManagementStore(state => state.selectedPapers);

  // ===== HOOKS =====
  const { handleAnalyzeGaps } = useGapAnalysis();

  // ===== COMPUTED VALUES =====
  const selectedPapersCount = selectedPapers.size;
  const hasEnoughPapers = selectedPapersCount >= minPapersRequired;
  const hasGaps = gaps.length > 0;

  // ===== HANDLERS =====
  const handleStartAnalysis = useCallback(async () => {
    if (!hasEnoughPapers) {
      toast.error(`Please select at least ${minPapersRequired} papers`);
      return;
    }

    await handleAnalyzeGaps();
  }, [hasEnoughPapers, minPapersRequired, handleAnalyzeGaps]);

  // ===== RENDER =====
  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (analyzingGaps) {
    return <LoadingState message="Analyzing research gaps..." />;
  }

  if (!hasGaps) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={<BarChart3 className="w-12 h-12" />}
            title="Gap Analysis"
            description={emptyStateMessage}
            action={
              <Button
                onClick={handleStartAnalysis}
                disabled={!hasEnoughPapers}
              >
                {analyzeButtonText}
              </Button>
            }
          />

          {!hasEnoughPapers && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Selected: {selectedPapersCount}/{minPapersRequired} papers
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Gaps ({gaps.length})</CardTitle>
        <CardDescription>
          Identified from {selectedPapersCount} selected papers
        </CardDescription>
      </CardHeader>

      <CardContent>
        <GapVisualizationPanel
          gaps={gaps}
          onGapSelect={(gapId) => {
            // Handle gap selection
            logger.info('Gap selected', { gapId });
          }}
        />
      </CardContent>
    </Card>
  );
}
```

### Stores Required
1. `useGapAnalysisStore` - Gap data, analysis state, errors
2. `usePaperManagementStore` - Selected papers count
3. `useGapAnalysis` - Analysis action hook

---

## 📊 SUMMARY: PROPS ELIMINATION

### Before Refactoring
| Container | Required Props | Optional Props | Total |
|-----------|---------------|----------------|-------|
| LiteratureSearchContainer | 6 | 0 | 6 |
| PaperManagementContainer | 6 | 3 | 9 |
| ThemeExtractionContainer | 16+ | 0 | 16+ |
| GapAnalysisContainer | 4 | 4 | 8 |
| **TOTAL** | **32+** | **7** | **39+** |

### After Refactoring
| Container | Required Props | Optional Props | Total | Reduction |
|-----------|---------------|----------------|-------|-----------|
| LiteratureSearchContainer | 0 | 0 | 0 | **-6** ✅ |
| PaperManagementContainer | 0 | 2 | 2 | **-7** ✅ |
| ThemeExtractionContainer | 0 | 0 | 0 | **-16+** ✅ |
| GapAnalysisContainer | 0 | 3 | 3 | **-5** ✅ |
| **TOTAL** | **0** | **5** | **5** | **-34+** ✅ |

**Props Eliminated:** 34+ (87% reduction)
**Optional Configs Kept:** 5 (UX customization only)

---

## ✅ REFACTORING CHECKLIST (Per Container)

Use this checklist for each container during Days 1-2:

### Step 1: Map Props to Stores
- [ ] List all current props
- [ ] Identify store source for each prop
- [ ] Identify computed values
- [ ] Identify cross-store dependencies

### Step 2: Refactor Container
- [ ] Import required stores at top
- [ ] Import required hooks
- [ ] Replace props with store reads
- [ ] Add local computations
- [ ] Add memoized handlers with useCallback
- [ ] Remove props interface (or keep only optional configs)

### Step 3: Update Tests
- [ ] Remove prop mocking
- [ ] Add store mocking (vi.mocked(useStore))
- [ ] Test with zero props (or optional configs only)
- [ ] Verify all functionality works

### Step 4: Update page.tsx
- [ ] Remove prop passing
- [ ] Use container with no props
- [ ] Verify page compiles (TypeScript: 0 errors)

### Step 5: Verification
- [ ] Run tests: `npm test ContainerName`
- [ ] Build check: `npm run build`
- [ ] Manual test in browser
- [ ] Check DevTools for errors

---

## 🎓 BEST PRACTICES

### DO's ✅
1. **Import stores directly** - `const data = useStore(state => state.data)`
2. **Compute locally** - `const count = items.length` (don't pass as prop)
3. **Use hooks for actions** - `const { handleAction } = useHook()`
4. **Memoize handlers** - `useCallback(() => { ... }, [deps])`
5. **Keep optional configs** - `emptyStateMessage`, `buttonText` (UX customization)
6. **Cross-store reads are OK** - Get `extractedPapers` from paper store in theme container

### DON'Ts ❌
1. **Don't pass state as props** - State should come from stores
2. **Don't pass actions as props** - Actions should come from stores/hooks
3. **Don't compute in parent** - Container should compute its own values
4. **Don't create new interfaces** - Remove props interfaces entirely (except optional configs)
5. **Don't mix patterns** - All data from stores, no hybrid approaches
6. **Don't over-optimize** - It's OK to read store multiple times

---

**End of Container-Store Mapping Reference**

**Usage:** Reference this document during Days 1-2 refactoring
**Next:** Create comprehensive refactoring plan document
