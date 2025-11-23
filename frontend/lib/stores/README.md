# Zustand Stores - Architecture & Usage Guide
## Phase 10.91: Centralized State Management

**Created:** November 15, 2025  
**Status:** ✅ Production Ready  
**Pattern:** Full Zustand Migration

---

## 📚 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Store Architecture](#store-architecture)
3. [Available Stores](#available-stores)
4. [Usage Patterns](#usage-patterns)
5. [Testing Guide](#testing-guide)
6. [Migration Guide](#migration-guide)
7. [Best Practices](#best-practices)

---

## 1. OVERVIEW

### **What is This?**
Centralized state management for the Literature Review application using **Zustand**.

### **Why Zustand?**
- ✅ **Single Pattern:** One way to manage state across entire app
- ✅ **Type-Safe:** Full TypeScript support out of the box
- ✅ **Persistent:** Built-in localStorage persistence
- ✅ **DevTools:** Redux DevTools integration for debugging
- ✅ **Performant:** Selector-based rendering optimization
- ✅ **Lightweight:** 3.6KB gzipped (vs 10KB for Redux)
- ✅ **Simple API:** No boilerplate, no reducers, no actions

### **Migration Status**
| Store | Status | Lines | Completion |
|-------|--------|-------|------------|
| `LiteratureSearchStore` | ✅ Complete | 636 | 100% |
| `ThemeExtractionStore` | 🚧 Day 3 | ~800 | 0% |
| `AlternativeSourcesStore` | 🚧 Day 4 | ~400 | 0% |
| `GapAnalysisStore` | 🚧 Day 5 | ~300 | 0% |

---

## 2. STORE ARCHITECTURE

### **Directory Structure**

```
frontend/lib/stores/
├── README.md                           # This file
├── store-utils.ts                      # Utilities & helpers
├── literature-search.store.ts          # ✅ Search, filters, papers
├── theme-extraction.store.ts           # 🚧 Themes, extraction, progress
├── alternative-sources.store.ts        # 🚧 YouTube, social media
└── gap-analysis.store.ts               # 🚧 Research gaps
```

### **Store Ownership (Single Responsibility)**

```
┌─────────────────────────────────────┐
│   LiteratureSearchStore             │
│   Owns: Search, Filters, Papers    │
└─────────────────────────────────────┘
              ↓ (paper IDs)
┌─────────────────────────────────────┐
│   ThemeExtractionStore              │
│   Owns: Themes, Extraction,  Progress│
└─────────────────────────────────────┘
              ↓ (theme IDs)
┌─────────────────────────────────────┐
│   GapAnalysisStore                  │
│   Owns: Research Gaps, Visualization│
└─────────────────────────────────────┘

              (Parallel)
┌─────────────────────────────────────┐
│   AlternativeSourcesStore           │
│   Owns: YouTube, Social Media       │
└─────────────────────────────────────┘
```

**Rules:**
- ✅ Each store owns ONE domain
- ✅ No store depends on another store directly
- ✅ Communication via IDs (strings)
- ✅ Hooks orchestrate cross-store operations

---

## 3. AVAILABLE STORES

### **3.1 LiteratureSearchStore** ✅ COMPLETE

**Purpose:** Manage search, filters, papers, selection

**State:**
```typescript
{
  query: string;
  papers: Paper[];
  loading: boolean;
  filters: SearchFilters;
  selectedPapers: Set<string>;
  // ... 20+ more fields
}
```

**Key Actions:**
- `setQuery()` - Update search query
- `setPapers()` - Set search results
- `setFilters()` - Update filters
- `togglePaperSelection()` - Select/deselect papers

**Usage:**
```typescript
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';

// In component
const papers = useLiteratureSearchStore((s) => s.papers);
const setPapers = useLiteratureSearchStore((s) => s.setPapers);

// Or get full store (less optimal)
const store = useLiteratureSearchStore();
```

**File:** `frontend/lib/stores/literature-search.store.ts` (636 lines)

---

### **3.2 ThemeExtractionStore** 🚧 COMING DAY 3

**Purpose:** Manage theme extraction, progress, results

**State:**
```typescript
{
  unifiedThemes: UnifiedTheme[];
  extractionProgress: ExtractionProgress | null;
  researchQuestions: ResearchQuestion[];
  showPurposeWizard: boolean;
  // ... 30+ more fields
}
```

**Key Actions:**
- `extractThemes()` - Start extraction
- `setExtractionProgress()` - Update progress
- `generateQuestions()` - Generate research questions

**File:** `frontend/lib/stores/theme-extraction.store.ts` (~800 lines)

---

### **3.3 AlternativeSourcesStore** 🚧 COMING DAY 4

**Purpose:** Manage YouTube, social media, grey literature

**State:**
```typescript
{
  youtubeVideos: YouTubeVideo[];
  transcribedVideos: TranscribedVideo[];
  socialResults: SocialMediaPost[];
  alternativeResults: AlternativeSource[];
}
```

**Key Actions:**
- `searchYouTube()` - Search YouTube
- `transcribeVideo()` - Transcribe video
- `searchSocialMedia()` - Search social platforms

**File:** `frontend/lib/stores/alternative-sources.store.ts` (~400 lines)

---

### **3.4 GapAnalysisStore** 🚧 COMING DAY 5

**Purpose:** Manage research gap identification

**State:**
```typescript
{
  researchGaps: ResearchGap[];
  aggregatedGapData: AggregatedGapData | null;
  showVisualization: boolean;
}
```

**Key Actions:**
- `analyzeGaps()` - Analyze papers for gaps
- `setResearchGaps()` - Set identified gaps
- `exportGapsAsJSON()` - Export gaps

**File:** `frontend/lib/stores/gap-analysis.store.ts` (~300 lines)

---

## 4. USAGE PATTERNS

### **4.1 Basic Usage**

```typescript
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';

function SearchResults() {
  // ✅ GOOD: Selector (only re-renders when papers change)
  const papers = useLiteratureSearchStore((s) => s.papers);
  const loading = useLiteratureSearchStore((s) => s.loading);

  // ❌ BAD: Full store (re-renders on ANY change)
  const store = useLiteratureSearchStore();

  return <div>{papers.length} papers</div>;
}
```

### **4.2 Actions**

```typescript
function SearchBar() {
  const setQuery = useLiteratureSearchStore((s) => s.setQuery);
  const search = useLiteratureSearchStore((s) => s.search);

  const handleSearch = async () => {
    setQuery('machine learning');
    await search();
  };

  return <button onClick={handleSearch}>Search</button>;
}
```

### **4.3 Multiple Selectors**

```typescript
function PaperList() {
  // ✅ GOOD: Multiple specific selectors
  const papers = useLiteratureSearchStore((s) => s.papers);
  const selectedIds = useLiteratureSearchStore((s) => s.selectedPapers);
  const loading = useLiteratureSearchStore((s) => s.loading);

  // Component only re-renders when these 3 values change
}
```

### **4.4 Computed Selectors**

```typescript
function PaperStats() {
  // ✅ GOOD: Computed selector (memoized)
  const selectedPapers = useLiteratureSearchStore((s) =>
    s.papers.filter((p) => s.selectedPapers.has(p.id))
  );

  return <div>{selectedPapers.length} selected</div>;
}
```

### **4.5 Async Actions**

```typescript
import { wrapAsyncAction } from '@/lib/stores/store-utils';

export const useThemeStore = create<ThemeState>((set) => ({
  themes: [],
  loading: false,
  error: null,

  // ✅ GOOD: Async action with loading/error handling
  extractThemes: wrapAsyncAction(
    async (paperIds: string[]) => {
      const result = await api.extractThemes(paperIds);
      set({ themes: result });
    },
    (loading) => set({ loading }),
    (error) => set({ error })
  ),
}));
```

---

## 5. TESTING GUIDE

### **5.1 Unit Testing Stores**

```typescript
import { renderHook, act } from '@testing-library/react';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';

describe('LiteratureSearchStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useLiteratureSearchStore.getState().reset();
  });

  it('should set query', () => {
    const { result } = renderHook(() => useLiteratureSearchStore());

    act(() => {
      result.current.setQuery('test query');
    });

    expect(result.current.query).toBe('test query');
  });

  it('should toggle paper selection', () => {
    const { result } = renderHook(() => useLiteratureSearchStore());

    act(() => {
      result.current.togglePaperSelection('paper-1');
    });

    expect(result.current.selectedPapers.has('paper-1')).toBe(true);

    act(() => {
      result.current.togglePaperSelection('paper-1');
    });

    expect(result.current.selectedPapers.has('paper-1')).toBe(false);
  });
});
```

### **5.2 Mocking Stores in Component Tests**

```typescript
import { createMockStore } from '@/lib/stores/store-utils';

const mockUseSearchStore = createMockStore(useLiteratureSearchStore, {
  papers: [{ id: '1', title: 'Test Paper' }],
  loading: false,
});

jest.mock('@/lib/stores/literature-search.store', () => ({
  useLiteratureSearchStore: mockUseSearchStore,
}));

// Now component tests use mock data
```

---

## 6. MIGRATION GUIDE

### **6.1 Migrating from useState**

**Before (useState):**
```typescript
function MyComponent() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    const results = await api.search();
    setPapers(results);
    setLoading(false);
  };
}
```

**After (Zustand):**
```typescript
// In store
export const useSearchStore = create<SearchState>((set) => ({
  papers: [],
  loading: false,
  setPapers: (papers) => set({ papers }),
  search: async () => {
    set({ loading: true });
    const results = await api.search();
    set({ papers: results, loading: false });
  },
}));

// In component
function MyComponent() {
  const papers = useSearchStore((s) => s.papers);
  const loading = useSearchStore((s) => s.loading);
  const search = useSearchStore((s) => s.search);
}
```

### **6.2 Migrating from Custom Hooks**

**Before (Hook with state):**
```typescript
function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);

  const extract = async () => {
    const result = await api.extract();
    setThemes(result);
  };

  return { themes, extract };
}
```

**After (Zustand + Orchestration Hook):**
```typescript
// In store
export const useThemeStore = create<ThemeState>((set) => ({
  themes: [],
  setThemes: (themes) => set({ themes }),
}));

// In hook (stateless orchestrator)
function useThemes() {
  const themes = useThemeStore((s) => s.themes);
  const setThemes = useThemeStore((s) => s.setThemes);

  const extract = async () => {
    const result = await api.extract();
    setThemes(result);
  };

  return { themes, extract };
}
```

---

## 7. BEST PRACTICES

### **7.1 DO: Use Selectors**
```typescript
// ✅ GOOD: Specific selector
const papers = useSearchStore((s) => s.papers);

// ❌ BAD: Full store
const store = useSearchStore();
```

### **7.2 DO: Keep Actions in Store**
```typescript
// ✅ GOOD: Action in store
export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  setQuery: (query: string) => set({ query }),
}));

// ❌ BAD: Action outside store
const setQuery = (query: string) => useSearchStore.setState({ query });
```

### **7.3 DO: Use Persistence for Important State**
```typescript
// ✅ GOOD: Persist user preferences
persist(
  (set) => ({ filters: defaultFilters, /* ... */ }),
  { name: 'search-store', partialize: (s) => ({ filters: s.filters }) }
);
```

### **7.4 DON'T: Store Transient State**
```typescript
// ❌ BAD: Don't persist loading/error
partialize: (s) => ({
  loading: s.loading, // ❌ Don't persist
  error: s.error, // ❌ Don't persist
});

// ✅ GOOD: Only persist meaningful state
partialize: (s) => ({
  papers: s.papers, // ✅ Persist
  filters: s.filters, // ✅ Persist
});
```

### **7.5 DON'T: Create Store Dependencies**
```typescript
// ❌ BAD: Store A depends on Store B
const useStoreA = create((set) => ({
  data: useStoreB.getState().data, // ❌ Creates coupling
}));

// ✅ GOOD: Independent stores, orchestrate in hooks
function useOrchestrator() {
  const dataA = useStoreA((s) => s.data);
  const dataB = useStoreB((s) => s.data);
  // Combine here
}
```

---

## 8. TROUBLESHOOTING

### **Problem: Store not persisting**
**Solution:** Check `partialize` config and localStorage quota

### **Problem: Too many re-renders**
**Solution:** Use specific selectors, not full store

### **Problem: DevTools not working**
**Solution:** Install Redux DevTools extension and set `NEXT_PUBLIC_ENABLE_DEVTOOLS=true`

### **Problem: Store state is stale**
**Solution:** Use `useEffect` to sync with store changes

---

## 9. REFERENCES

- **Zustand Docs:** https://github.com/pmndrs/zustand
- **Store Utilities:** `frontend/lib/stores/store-utils.ts`
- **Architecture Decision:** [PHASE_10.91_DAY_2_ARCHITECTURE_DECISION.md](../../../PHASE_10.91_DAY_2_ARCHITECTURE_DECISION.md)
- **Store Schemas:** [PHASE_10.91_DAY_2_STORE_SCHEMAS.md](../../../PHASE_10.91_DAY_2_STORE_SCHEMAS.md)

---

*Last Updated: November 15, 2025*  
*Phase 10.91 Day 2: State Management Strategy*

