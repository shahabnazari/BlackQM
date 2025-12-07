# PHASE 10.935 COMPREHENSIVE REFACTORING PLAN
**Date:** November 18, 2025
**Duration:** 8 days (64 hours total)
**Phase:** Literature Page Architecture Completion
**Quality Target:** 9.5/10 (Enterprise-Grade)
**Pattern:** Phase 10.91 + Phase 10.92 + Phase 10.93 Proven Patterns

---

## 🎯 PHASE OBJECTIVES

### Primary Goals
1. ✅ Make all 4 containers fully self-contained (eliminate 34+ props)
2. ✅ Re-enable all disabled features (search, paper management, theme extraction, gap analysis)
3. ✅ Break down 3 oversized components (from 2,464 lines → < 1,100 lines)
4. ✅ Implement or resolve 6 TODO items
5. ✅ Clean up debug logging for production
6. ✅ Achieve 9.5/10 quality score with comprehensive testing

### Success Metrics
| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Container props | 39+ | 5 (optional configs) | < 10 |
| Features enabled | 0% | 100% | 100% |
| Oversized components | 3 (2,464 lines) | 0 (< 1,100 lines) | 0 |
| TODO items | 6 | 0 | 0 |
| TypeScript errors | 0 (baseline) | 0 | 0 |
| Quality score | N/A | 9.5/10 | ≥ 9.5/10 |

---

## 📅 8-DAY IMPLEMENTATION TIMELINE

### DAY 0.5: INFRASTRUCTURE AUDIT & PLANNING (4 hours) ✅ COMPLETE

**Status:** ✅ DONE

**Deliverables:**
- [x] PHASE_10.935_CURRENT_STATE_AUDIT.md
- [x] PHASE_10.935_CONTAINER_STORE_MAPPING.md
- [x] PHASE_10.935_REFACTORING_PLAN.md (this document)

**Key Findings:**
- 39+ props to eliminate
- 3 oversized components to break down
- 6 TODO items to resolve
- TypeScript: 0 errors (good baseline)

---

### DAY 1: LITERATURE SEARCH & PAPER MANAGEMENT (8 hours)

**Goal:** Refactor 2 containers to be fully self-contained

#### Morning Session: LiteratureSearchContainer (4 hours)

**Current State:**
- File: `containers/LiteratureSearchContainer.tsx` (329 lines)
- Props: 6 required
- Status: Under size limit ✅, but has prop dependencies ❌

**Refactoring Steps:**

**STEP 1: Create Working Branch (10 min)**
```bash
git checkout -b phase-10-935-day-1-literature-search
git status  # Verify clean state
```

**STEP 2: Document Current Props (15 min)**
```typescript
// Create temporary file: REFACTORING_NOTES.md
Current props:
1. loadingAlternative: boolean → useAlternativeSourcesStore().loading
2. loadingSocial: boolean → useSocialMediaStore().loading
3. onSearch: () => Promise<void> → useLiteratureSearch().handleSearch
4. academicDatabasesCount: number → useLiteratureSearchStore().academicDatabases.length
5. alternativeSourcesCount: number → useAlternativeSourcesStore().sources.length
6. socialPlatformsCount: number → useSocialMediaStore().platforms.length
```

**STEP 3: Add Store Imports (15 min)**
```typescript
// At top of LiteratureSearchContainer.tsx
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';
import { useAlternativeSourcesStore } from '@/lib/stores/alternative-sources.store';  // Verify exists!
import { useSocialMediaStore } from '@/lib/stores/social-media.store';
import { useLiteratureSearch } from '@/lib/hooks/useLiteratureSearch';
import { useProgressiveSearch } from '@/lib/hooks/useProgressiveSearch';
```

**STEP 4: Refactor Component (2 hours)**
```typescript
// BEFORE: export function LiteratureSearchContainer(props: LiteratureSearchContainerProps) { ... }

// AFTER:
export function LiteratureSearchContainer() {
  // Store state
  const { academicDatabases, showFilters, toggleShowFilters, getAppliedFilterCount } = useLiteratureSearchStore();
  const { loading: loadingAlternative, sources } = useAlternativeSourcesStore();
  const { loading: loadingSocial, platforms } = useSocialMediaStore();

  // Hooks
  const { handleSearch } = useLiteratureSearch();
  const { isSearching, cancelProgressiveSearch } = useProgressiveSearch();

  // Computed values
  const academicDatabasesCount = academicDatabases.length;
  const alternativeSourcesCount = sources.length;
  const socialPlatformsCount = platforms.length;
  const isLoading = loadingAlternative || loadingSocial || isSearching;

  // ... rest of component
}
```

**STEP 5: Remove Props Interface (10 min)**
```typescript
// DELETE:
export interface LiteratureSearchContainerProps {
  loadingAlternative: boolean;
  loadingSocial: boolean;
  // ... all props
}
```

**STEP 6: Update Tests (45 min)**
```typescript
// Update containers/__tests__/LiteratureSearchContainer.test.tsx

// BEFORE:
render(<LiteratureSearchContainer loadingAlternative={false} ... />);

// AFTER:
// Mock stores
vi.mocked(useLiteratureSearchStore).mockReturnValue({
  academicDatabases: mockDatabases,
  showFilters: false,
  // ...
});

vi.mocked(useAlternativeSourcesStore).mockReturnValue({
  loading: false,
  sources: mockSources,
});

render(<LiteratureSearchContainer />);
```

**STEP 7: Update page.tsx (15 min)**
```typescript
// In page.tsx

// BEFORE:
<LiteratureSearchContainer
  loadingAlternative={loadingAlternative}
  loadingSocial={loadingSocial}
  onSearch={handleSearchWithMode}
  academicDatabasesCount={academicDatabases.length}
  alternativeSourcesCount={alternativeSources.length}
  socialPlatformsCount={socialPlatforms.length}
/>

// AFTER:
<LiteratureSearchContainer />
```

**STEP 8: Verify & Test (30 min)**
```bash
# TypeScript check
npx tsc --noEmit
# Expected: 0 errors

# Run tests
npm test LiteratureSearchContainer
# Expected: All passing

# Build check
npm run build
# Expected: Success

# Manual test
npm run dev
# Navigate to /discover/literature
# Verify container renders
```

**STEP 9: Commit (10 min)**
```bash
git add .
git commit -m "refactor(literature): Make LiteratureSearchContainer self-contained

- Remove 6 props (loadingAlternative, loadingSocial, onSearch, counts)
- Get all data from Zustand stores directly
- Update tests to mock stores instead of props
- Update page.tsx to use prop-less container

Phase 10.935 Day 1 - LiteratureSearchContainer complete
"
```

**End of Morning Checklist:**
- [ ] LiteratureSearchContainer refactored (0 props)
- [ ] Tests passing
- [ ] TypeScript: 0 errors
- [ ] Committed to git

---

#### Afternoon Session: PaperManagementContainer (4 hours)

**Current State:**
- File: `containers/PaperManagementContainer.tsx` (~300 lines)
- Props: 9 total (6 required, 3 optional)
- Status: Under size limit ✅, but has prop dependencies ❌

**Refactoring Steps:**

**STEP 1: Document Current Props (15 min)**
```typescript
Required props to REMOVE (6):
1. savedPapers: Paper[] → usePaperManagementStore().savedPapers
2. selectedPapers: Set<string> → usePaperManagementStore().selectedPapers
3. extractingPapers: Set<string> → usePaperManagementStore().extractingPapers
4. extractedPapers: Set<string> → usePaperManagementStore().extractedPapers
5. onTogglePaperSelection → usePaperManagementStore().togglePaperSelection
6. onTogglePaperSave → usePaperManagementStore().handleSavePaper

Optional props to KEEP (2):
1. emptyStateMessage?: string  ✅ (UX customization)
2. showBulkActions?: boolean   ✅ (feature toggle)

Optional props to REMOVE (1):
3. isLoading?: boolean → usePaperManagementStore().isLoading
4. error?: string → usePaperManagementStore().error
```

**STEP 2: Refactor Component (2 hours)**
```typescript
// Update interface to keep only optional configs
export interface PaperManagementContainerProps {
  emptyStateMessage?: string;
  showBulkActions?: boolean;
}

export function PaperManagementContainer({
  emptyStateMessage = 'No papers saved yet. Search and save papers to build your library.',
  showBulkActions = true,
}: PaperManagementContainerProps = {}) {
  // Get ALL data from store
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

  // Computed values
  const hasPapers = savedPapers.length > 0;
  const selectedCount = selectedPapers.size;
  const allSelected = hasPapers && selectedCount === savedPapers.length;

  // ... rest of component
}
```

**STEP 3: Update Tests (45 min)**
**STEP 4: Update page.tsx (15 min)**
**STEP 5: Verify & Test (30 min)**
**STEP 6: Commit (10 min)**

**End of Afternoon Checklist:**
- [ ] PaperManagementContainer refactored (2 optional props only)
- [ ] Tests passing
- [ ] TypeScript: 0 errors
- [ ] Committed to git

**End of Day 1 Checkpoint:**
- [ ] 2/4 containers refactored
- [ ] 15 props eliminated (6 + 9)
- [ ] TypeScript: 0 errors ✅
- [ ] All tests passing ✅
- [ ] Git commits clean ✅

---

### DAY 2: THEME EXTRACTION & GAP ANALYSIS (8 hours)

**Goal:** Refactor remaining 2 containers

#### Morning Session: ThemeExtractionContainer (4 hours)

**Current State:**
- File: `containers/ThemeExtractionContainer.tsx` (691 lines)
- Props: 18+ required
- Status: **72% OVER SIZE LIMIT** ❌, has prop dependencies ❌

**Refactoring Steps:**

**STEP 1: Analyze Component Structure (30 min)**
```
ThemeExtractionContainer.tsx (691 lines)
├── Imports & Types (50 lines)
├── Helper Components (100 lines)
│   ├── SourceSummaryCard (50 lines)
│   └── EmptyState (50 lines)
├── Main Component (541 lines)
│   ├── Store reads (20 lines)
│   ├── Computed values (30 lines)
│   ├── Handlers (80 lines)
│   ├── Theme list rendering (200 lines) ← EXTRACT
│   ├── Action buttons (80 lines) ← EXTRACT
│   └── Purpose-specific UI (131 lines) ← EXTRACT
└── Export (10 lines)
```

**Extraction Plan:**
```
CREATE: ThemeList.tsx (150 lines)
CREATE: ThemeActions.tsx (100 lines)
CREATE: PurposeSpecificActions.tsx (150 lines) - Already exists! ✅
KEEP: ThemeExtractionContainer.tsx (200 lines after extraction)
```

**STEP 2: Remove Props (1.5 hours)**
- Remove all 18+ props
- Add store reads directly
- Add hook integrations
- Keep component logic only

**STEP 3: Extract Sub-Components (1.5 hours)**
See "Day 5-6: Component Breakup" section for detailed extraction

**STEP 4: Update Tests (45 min)**
**STEP 5: Verify & Commit (15 min)**

**End of Morning Checklist:**
- [ ] ThemeExtractionContainer refactored (0 props)
- [ ] Component under 400 lines
- [ ] Tests passing
- [ ] Committed

---

#### Afternoon Session: GapAnalysisContainer (4 hours)

**Current State:**
- File: `containers/GapAnalysisContainer.tsx` (~300 lines)
- Props: 8 total (4 required, 4 optional)
- Status: Under size limit ✅, but has prop dependencies ❌

**Refactoring Steps:**

**STEP 1: Remove Required Props (2 hours)**
- Keep 3 optional configs (emptyStateMessage, analyzeButtonText, minPapersRequired)
- Remove 4 required props (gaps, analyzingGaps, selectedPapersCount, onAnalyzeGaps)
- Add store reads
- Add hook integration

**STEP 2: Update Tests (1.5 hours)**
**STEP 3: Verify & Commit (30 min)**

**End of Day 2 Checkpoint:**
- [ ] 4/4 containers refactored ✅
- [ ] 39+ props eliminated (down to 5 optional configs) ✅
- [ ] TypeScript: 0 errors ✅
- [ ] All tests passing ✅
- [ ] Ready for Day 2.5 strict audit ✅

---

### DAY 2.5: STRICT AUDIT & QUALITY GATES (4 hours) 🔥 CRITICAL

**Status:** MANDATORY GATE - CANNOT SKIP
**Pattern:** Phase 10.93 Day 3.5 Strict Audit

**Goal:** Verify architecture is clean before feature re-integration

#### Type Safety Audit (60 min) - ZERO TOLERANCE

**Automated Checks:**
```bash
# Search for 'any' types
rg ": any" frontend/app/\(researcher\)/discover/literature/containers/
# Expected: 0 results

# Search for unsafe 'as' assertions
rg " as " frontend/app/\(researcher\)/discover/literature/containers/
# Expected: 0 results (or all justified with type guards)

# Search for @ts-ignore
rg "@ts-ignore" frontend/app/\(researcher\)/discover/literature/
# Expected: 0 results

# TypeScript compilation
npx tsc --noEmit
# Expected: 0 errors

# ESLint
npm run lint
# Expected: 0 critical errors
```

**Manual Review Checklist:**
- [ ] All service methods have explicit return types
- [ ] All React components have proper prop types
- [ ] No implicit 'any' types
- [ ] Type guards used instead of 'as' assertions
- [ ] External API responses have interfaces with validation

**Result:** ✅ PASS / ❌ FAIL

---

#### Architecture Review (45 min)

**Container Self-Containment Check:**
```bash
# Search for container prop interfaces
rg "export interface.*ContainerProps" frontend/app/\(researcher\)/discover/literature/containers/
# Expected: 0-4 results (only optional config interfaces)

# Verify containers use stores
rg "useLiteratureSearchStore\(\)" frontend/app/\(researcher\)/discover/literature/containers/LiteratureSearchContainer.tsx
# Expected: 1+ results

# Verify no prop drilling
rg "const.*=.*props\." frontend/app/\(researcher\)/discover/literature/containers/
# Expected: 0 results (or only optional configs)
```

**Manual Review Checklist:**
- [ ] Each container has ZERO required props
- [ ] Only optional config props allowed (≤ 3 per container)
- [ ] All containers use Zustand stores directly
- [ ] NO prop drilling between containers
- [ ] Stores have proper types (no `any`)
- [ ] All async operations have error handling

**Result:** ✅ PASS / ❌ FAIL

---

#### React Best Practices Audit (45 min)

**Component Size Check:**
```bash
# Check container sizes
wc -l frontend/app/\(researcher\)/discover/literature/containers/*.tsx
# Expected: All < 400 lines

# Check function sizes
rg "^function\s+\w+|^const\s+\w+\s+=\s+\(" -A 100 frontend/app/\(researcher\)/discover/literature/containers/ | rg "^}" | wc -l
# Manually verify no function > 100 lines
```

**Manual Review Checklist:**
- [ ] All containers < 400 lines (STRICT)
- [ ] All functions < 100 lines (STRICT)
- [ ] useCallback() on all event handlers
- [ ] useMemo() on expensive computations
- [ ] Correct dependency arrays in hooks
- [ ] No missing dependencies
- [ ] ErrorBoundary wraps containers (if needed)

**Result:** ✅ PASS / ❌ FAIL

---

#### Performance & Bundle Size (30 min)

```bash
# Production build
npm run build
# Expected: Success

# Check bundle size
ls -lh .next/static/chunks/
# Compare to Day 0 baseline
# Expected: No significant increase
```

**Manual Review Checklist:**
- [ ] Production build succeeds
- [ ] Bundle size unchanged or smaller
- [ ] No accidentally imported large libraries
- [ ] Tree shaking works correctly
- [ ] No circular dependencies

**Result:** ✅ PASS / ❌ FAIL

---

#### Quality Scoring Matrix

| Category | Weight | Score | Pass/Fail |
|----------|--------|-------|-----------|
| **Architecture** | 30% | /10 | |
| - Self-contained containers | 15% | /10 | |
| - Store usage | 10% | /10 | |
| - No prop drilling | 5% | /10 | |
| **Type Safety** | 25% | /10 | |
| - Zero `any` types | 10% | /10 | |
| - Explicit return types | 10% | /10 | |
| - Type guards | 5% | /10 | |
| **Code Quality** | 20% | /10 | |
| - Component sizes | 10% | /10 | |
| - Function sizes | 5% | /10 | |
| - Readability | 5% | /10 | |
| **Testing** | 15% | /10 | |
| - Test coverage | 10% | /10 | |
| - Tests passing | 5% | /10 | |
| **Documentation** | 10% | /10 | |
| - Code comments | 5% | /10 | |
| - README updated | 5% | /10 | |
| **TOTAL** | 100% | **/10** | |

**Gate Criteria:** MUST achieve ≥ 9.5/10 to proceed

**IF GATE FAILS:**
- 🔴 STOP immediately
- 🔴 Fix all critical issues
- 🔴 Re-run audit
- 🔴 DO NOT proceed to Day 3

**IF GATE PASSES:**
- ✅ Document quality score
- ✅ Commit audit results
- ✅ Proceed to Day 3 (feature re-integration)

---

### DAY 3: SEARCH & PAPER MANAGEMENT FEATURES (8 hours)

**Goal:** Re-enable search and paper management features

#### Morning: Search Functionality (4 hours)

**STEP 1: Update page.tsx to Show Search Container (30 min)**
```typescript
// Remove "Coming Soon" card
// Add actual container

return (
  <div className="container mx-auto py-8 px-4 space-y-6">
    <Header />
    <LiteratureSearchContainer />  {/* NOW VISIBLE */}
    <AcademicResourcesPanel />      {/* NOW VISIBLE */}
  </div>
);
```

**STEP 2: Test Search Flow (1 hour)**
```
Manual Test Scenario:
1. Navigate to /discover/literature
2. Enter query: "machine learning"
3. Select databases: PubMed + arXiv
4. Click "Search" button
5. Verify results appear in AcademicResourcesPanel
6. Verify loading states work
7. Verify no console errors
8. Verify search completes < 5 seconds
```

**STEP 3: Fix Any Integration Issues (1.5 hours)**
- Debug store integration
- Fix missing data flows
- Verify all hooks work correctly

**STEP 4: Test Edge Cases (45 min)**
```
Edge Case Tests:
1. Empty query (should show error)
2. No databases selected (should show error)
3. No results found (should show empty state)
4. Search timeout (should show error)
5. Cancel search mid-progress (should stop)
```

**STEP 5: Commit (15 min)**
```bash
git commit -m "feat(literature): Re-enable search functionality

- Show LiteratureSearchContainer in page.tsx
- Show AcademicResourcesPanel for results
- Test all search flows work correctly
- Verify store integration works

Phase 10.935 Day 3 Morning - Search feature complete
"
```

---

#### Afternoon: Paper Management (4 hours)

**STEP 1: Enable PaperManagementContainer (30 min)**
**STEP 2: Test Paper Workflows (1.5 hours)**
```
Test Scenarios:
1. Select 5 papers via checkboxes
2. Click "Save to Library"
3. Navigate away and back
4. Verify papers still selected (state persisted)
5. Test bulk select all (50 papers)
6. Test bulk deselect
7. Test paper extraction status
```

**STEP 3: Fix Integration Issues (1.5 hours)**
**STEP 4: Commit (30 min)**

**End of Day 3 Checkpoint:**
- [ ] Search functionality working ✅
- [ ] Paper management working ✅
- [ ] No console errors ✅
- [ ] TypeScript: 0 errors ✅
- [ ] Committed to git ✅

---

### DAY 4: THEME EXTRACTION & GAP ANALYSIS FEATURES (8 hours)

**Goal:** Re-enable theme extraction and gap analysis features

#### Morning: Theme Extraction (4 hours)

**STEP 1: Enable ThemeExtractionContainer (30 min)**
**STEP 2: Test Theme Workflows (2 hours)**
```
Test Scenario:
1. Save 10 papers with DOIs
2. Click "Extract Themes"
3. Select purpose: "Literature Synthesis"
4. Monitor progress modal
5. Wait for completion (~2-3 minutes)
6. Verify 8-12 themes displayed
7. Select 3 themes
8. Export to CSV
9. Verify CSV contents
```

**STEP 3: Fix Integration Issues (1 hour)**
**STEP 4: Commit (30 min)**

---

#### Afternoon: Gap Analysis + Source Panels (4 hours)

**STEP 1: Enable All Remaining Features (1 hour)**
```typescript
return (
  <div>
    <LiteratureSearchContainer />
    <AcademicResourcesPanel />
    <AlternativeSourcesPanel />
    <SocialMediaPanel />
    <PaperManagementContainer />
    <ThemeExtractionContainer />
    <GapAnalysisContainer />
  </div>
);
```

**STEP 2: Test Full Workflow (2 hours)**
```
End-to-End Test:
1. Search "quantum computing" → Save 20 papers
2. Extract themes → Get 15 themes
3. Run gap analysis → Identify 5 gaps
4. Search alternative sources (GitHub repos)
5. Search social media (YouTube videos)
6. Verify all features work together
```

**STEP 3: Fix Issues & Commit (1 hour)**

**End of Day 4 Checkpoint:**
- [ ] All features re-enabled ✅
- [ ] Full workflow tested ✅
- [ ] No critical bugs ✅
- [ ] TypeScript: 0 errors ✅

---

### DAYS 5-6: COMPONENT SIZE REDUCTION + TODOs (16 hours)

**Goal:** Break down oversized components, implement TODOs

#### Day 5 Morning: ThemeExtractionContainer Breakup (4 hours)

**Current:** 691 lines (73% over limit)
**Target:** < 400 lines

**Extraction Strategy:**

**1. Create ThemeList.tsx (1.5 hours)**
```typescript
// NEW FILE: frontend/app/(researcher)/discover/literature/containers/theme-extraction/ThemeList.tsx

export interface ThemeListProps {
  themes: UnifiedTheme[];
  selectedThemeIds: string[];
  onToggleTheme: (themeId: string) => void;
  extractedPapers: Set<string>;
}

export function ThemeList({ themes, selectedThemeIds, onToggleTheme, extractedPapers }: ThemeListProps) {
  return (
    <div className="space-y-2">
      {themes.map(theme => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isSelected={selectedThemeIds.includes(theme.id)}
          onToggle={() => onToggleTheme(theme.id)}
          extractedPapersCount={theme.papers.filter(p => extractedPapers.has(p.id)).length}
        />
      ))}
    </div>
  );
}
```

**2. Create ThemeActions.tsx (1 hour)**
**3. Update ThemeExtractionContainer to use sub-components (1 hour)**
**4. Test & Verify (30 min)**

**Result:** ThemeExtractionContainer: 691 → 200 lines (-71%) ✅

---

#### Day 5 Afternoon: ProgressiveLoadingIndicator Breakup (4 hours)

**Current:** ~812 lines (171% over limit)
**Target:** < 300 lines

**Extraction Strategy:**
```
CREATE: ProgressStage.tsx (150 lines)
CREATE: ProgressMetrics.tsx (100 lines)
CREATE: ProgressActions.tsx (80 lines)
KEEP: ProgressiveLoadingIndicator.tsx (200 lines)
```

**Result:** ProgressiveLoadingIndicator: 812 → 200 lines (-75%) ✅

---

#### Day 6 Morning: PaperCard Breakup (4 hours)

**Current:** ~961 lines (140% over limit)
**Target:** < 400 lines

**Extraction Strategy:**
```
CREATE: PaperMetadata.tsx (150 lines)
CREATE: PaperActions.tsx (200 lines)
CREATE: PaperStatus.tsx (100 lines)
KEEP: PaperCard.tsx (350 lines)
```

**Result:** PaperCard: 961 → 350 lines (-64%) ✅

---

#### Day 6 Afternoon: TODO Implementation (4 hours)

**TODO #1: Fix 'any' Types in AcademicResourcesPanel (1 hour)**
```typescript
// BEFORE:
const institution: any = selectedInstitution;

// AFTER:
interface Institution {
  id: string;
  name: string;
  domain: string;
  country: string;
  access: {
    level: 'full' | 'partial' | 'none';
    databases: string[];
  };
}

const institution: Institution | null = selectedInstitution;
```

**TODO #2-5: Social Media Backend APIs (1 hour)**
```typescript
// TikTok, Instagram APIs
// DECISION: Show "Coming Soon" badges

<Button disabled className="relative">
  Transcribe Video
  <Badge className="ml-2 bg-blue-500">Coming Soon</Badge>
</Button>
```

**TODO #6: Replace alert() with Toast (1 hour)**
```typescript
// BEFORE:
alert('Paper saved successfully!');

// AFTER:
import { toast } from 'sonner';

toast.success('Paper saved successfully!', {
  description: 'Added to your library',
  action: {
    label: 'View Library',
    onClick: () => router.push('/library'),
  },
});
```

**Cleanup: Remove Debug Logging (1 hour)**
```typescript
// Wrap debug logs
if (process.env.NODE_ENV === 'development') {
  logger.debug('[Component]', data);
}
```

**End of Days 5-6 Checkpoint:**
- [ ] 3 components broken down ✅
- [ ] All components < 400 lines ✅
- [ ] 6 TODOs resolved ✅
- [ ] Debug logging cleaned ✅
- [ ] TypeScript: 0 errors ✅

---

### DAY 7: PRODUCTION TESTING & INTEGRATION (8 hours)

**Goal:** Comprehensive E2E testing

**Test Scenarios (6 scenarios × 1 hour each)**

#### Scenario 1: Basic Search Flow
```
1. Navigate to /discover/literature
2. Enter "machine learning"
3. Select PubMed + arXiv
4. Execute search
5. Verify 50+ results
6. Verify no console errors
7. Verify search time < 5s
```

#### Scenario 2: Paper Management Flow
```
1. Search for papers
2. Select 5 papers
3. Save to library
4. Navigate away and back
5. Verify papers still selected
6. Test bulk select all
7. Test bulk deselect
```

#### Scenario 3: Theme Extraction Flow
```
1. Save 10 papers with DOIs
2. Extract themes
3. Monitor progress
4. Verify 8-12 themes
5. Select 3 themes
6. Export to CSV
7. Verify CSV contents
```

#### Scenario 4: Gap Analysis Flow
```
1. With 20+ saved papers
2. Analyze gaps
3. Verify 5+ gaps identified
4. Verify visualization
5. Test gap filtering
6. Export to PDF
```

#### Scenario 5: Cross-Feature Integration
```
1. Full workflow: Search → Save → Extract → Analyze
2. Verify data flows correctly
3. Verify stores sync
4. Verify no state loss
5. Check for memory leaks
```

#### Scenario 6: Error Handling
```
1. Test no results query
2. Test extraction with 0 papers
3. Test invalid query
4. Verify error messages
5. Verify error recovery
```

**Performance Testing:**
```bash
# Page load time
lighthouse http://localhost:3000/discover/literature --only-categories=performance
# Target: Score > 90, Load time < 3s

# Memory profiling
# Target: No leaks, < 100MB heap
```

**Accessibility Testing:**
```bash
npm run test:a11y
# Target: 0 critical issues, WCAG 2.1 AA compliance
```

**End of Day 7 Checkpoint:**
- [ ] 6 E2E scenarios passing ✅
- [ ] Performance: Score > 90 ✅
- [ ] Accessibility: WCAG AA ✅
- [ ] No memory leaks ✅
- [ ] No critical bugs ✅

---

### DAY 8: DOCUMENTATION & HANDOFF (4 hours)

**Goal:** Complete documentation for handoff

#### Documentation Deliverables (3 hours)

**1. Update ARCHITECTURE.md**
- Document final container structure
- Document component breakup
- Document store usage patterns
- Document testing approach

**2. Create Troubleshooting Guide**
- Common issues and solutions
- Debug workflows
- Error recovery procedures

**3. Create Migration Guide**
- Breaking changes (none expected)
- Container API changes
- New sub-components
- Testing changes

**4. Update Phase Tracker**
- Mark Phase 10.935 complete
- Update completion metrics
- Document lessons learned

#### Final Verification (1 hour)

```bash
# TypeScript check
npx tsc --noEmit
# Expected: 0 errors

# Lint check
npm run lint
# Expected: 0 critical errors

# Test suite
npm test
# Expected: 100% passing

# Production build
npm run build
# Expected: Success
```

**End of Day 8 Deliverables:**
- [ ] ARCHITECTURE.md updated ✅
- [ ] Troubleshooting guide created ✅
- [ ] Migration guide created ✅
- [ ] Phase tracker updated ✅
- [ ] Final verification passed ✅
- [ ] Phase 10.935 COMPLETE ✅

---

## 📊 SUCCESS METRICS TRACKING

### Before Phase 10.935
```
page.tsx: 182 lines (features disabled)
Container props: 39 total
Features enabled: 0%
Oversized components: 3 (2,464 lines total)
TODO items: 6
Debug logging: Present
Test coverage: ~75%
Quality score: N/A (incomplete)
TypeScript errors: 0
```

### After Phase 10.935 (Target)
```
page.tsx: ~200 lines (fully functional)
Container props: 5 (optional configs only)
Features enabled: 100% ✅
Oversized components: 0 (all < 400 lines) ✅
TODO items: 0 (all resolved) ✅
Debug logging: None in production ✅
Test coverage: 80%+ ✅
Quality score: 9.5/10 ✅
TypeScript errors: 0 ✅
```

---

## 🚨 CRITICAL SUCCESS FACTORS

### DO NOT SKIP
1. ⚠️ Day 0.5 Infrastructure Audit (DONE ✅)
2. ⚠️ Day 2.5 Strict Audit Gate (MANDATORY)
3. ⚠️ TypeScript: 0 errors at end of EVERY day
4. ⚠️ Test containers after each refactoring

### ZERO TOLERANCE
1. ❌ No `: any` types
2. ❌ No `console.log` in production
3. ❌ No components > 400 lines
4. ❌ No functions > 100 lines
5. ❌ No prop drilling between containers

### QUALITY GATES
1. Each day ends with TypeScript: 0 errors ✅
2. Day 2.5: Must achieve 9.5/10 quality score ✅
3. Day 7: All E2E tests must pass ✅
4. Day 8: Production build must succeed ✅

---

## 🔄 ROLLBACK PLAN

### If Day 2.5 Gate Fails
```bash
# Fix all issues immediately
# Re-run audit
# Do NOT proceed until gate passes
```

### If Features Don't Work (Day 3-4)
```bash
# Revert to Day 2 state
git revert HEAD~N
# Fix store integration
# Re-test thoroughly
```

### If Critical Bug Found (Day 7)
```bash
# Stop testing
# Create bug report
# Fix immediately
# Re-run all tests
```

---

**End of Refactoring Plan**

**Status:** ✅ DAY 0.5 COMPLETE - READY FOR DAY 1

**Next Steps:**
1. Begin Day 1 Morning: LiteratureSearchContainer refactoring
2. Follow step-by-step plan exactly
3. Verify at each checkpoint
4. Commit frequently with clear messages
