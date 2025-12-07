# Theme Extraction Store - Implementation Guide

## Key Files to Know

### Frontend Files

1. **Main Store (RECOMMENDED - 315 lines)**
   - Path: `/frontend/lib/stores/theme-extraction.store.ts`
   - Status: Phase 10.91+ (Modular, Recommended)
   - What it does: Manages themes, selections, progress, and research outputs
   - Key class: `useThemeExtractionStore`
   - Architecture: Helper modules for modularity (action creators)

2. **Store Helper Modules**
   - Path: `/frontend/lib/stores/helpers/theme-extraction/`
   - Files:
     - `types.ts` - Shared type definitions
     - `theme-actions.ts` - Theme CRUD operations
     - `selection-actions.ts` - Theme selection logic
     - `progress-actions.ts` - Progress tracking
     - `results-actions.ts` - Research outputs management
     - `config-modal-actions.ts` - Configuration and modals

3. **Legacy Store**
   - Path: `/frontend/lib/stores/literature-theme.store.ts`
   - Status: Phase 10.1 (Still used but migrate to useThemeExtractionStore)
   - What it does: Similar to theme-extraction.store but older architecture
   - Key class: `useLiteratureThemeStore`

4. **API Service**
   - Path: `/frontend/lib/api/services/unified-theme-api.service.ts`
   - What it does: Frontend API client for theme extraction endpoints
   - Exports: UnifiedTheme, ThemeSource, ThemeProvenance interfaces
   - Provides: V2 purpose-driven extraction with transparent progress

### Backend Files

1. **Backend Type Definitions**
   - Path: `/backend/src/modules/literature/types/theme-extraction.types.ts`
   - What it does: Prisma result types and business logic types
   - Exports: PrismaUnifiedThemeWithRelations, PrismaThemeSourceRelation, etc.

2. **Theme Extraction Service**
   - Path: `/backend/src/modules/literature/services/unified-theme-extraction.service.ts`
   - What it does: Business logic for theme extraction
   - Responsible for: Extracting themes from multiple source types

---

## How to Use the Store

### Import the Store

```typescript
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

// Optional: Import types for type safety
import type {
  UnifiedTheme,
  ResearchPurpose,
  UserExpertiseLevel,
  ExtractionProgress,
  SaturationData,
  ContentAnalysis,
} from '@/lib/stores/theme-extraction.store';
```

### Read State (Subscribe)

```typescript
// Recommended: Slice reading for performance (prevents unnecessary re-renders)
const themes = useThemeExtractionStore(state => state.unifiedThemes);
const selectedIds = useThemeExtractionStore(state => state.selectedThemeIds);

// Multiple properties at once
const { unifiedThemes, extractionProgress, extractionError } = useThemeExtractionStore(
  state => ({
    unifiedThemes: state.unifiedThemes,
    extractionProgress: state.extractionProgress,
    extractionError: state.extractionError,
  })
);

// Or use built-in selectors
import { selectExtractionStatus, selectResults } from '@/lib/stores/theme-extraction.store';
const status = useThemeExtractionStore(selectExtractionStatus);
const results = useThemeExtractionStore(selectResults);
```

### Dispatch Actions (Modify State)

```typescript
const store = useThemeExtractionStore();

// Theme Management
store.setUnifiedThemes(newThemes);
store.addTheme(singleTheme);
store.removeTheme(themeId);
store.updateTheme(themeId, { label: 'Updated Label' });
store.clearThemes();

// Selection
store.toggleThemeSelection(themeId);
store.selectAllThemes();
store.clearThemeSelection();

// Progress
store.setAnalyzingThemes(true);
store.setExtractionProgress({ current: 5, total: 10, percentage: 50, ... });
store.updateExtractionProgress({ current: 6, percentage: 60 });
store.setExtractionError('Failed to extract themes');
store.completeExtraction(25);  // 25 themes found

// Configuration
store.setExtractionPurpose('survey_construction');
store.setUserExpertiseLevel('advanced');
store.setShowPurposeWizard(true);

// Results
store.setResearchQuestions(questions);
store.addHypothesis(hypothesis);
store.setGeneratedSurvey(survey);

// Cleanup
store.reset();
```

---

## Real-World Example: Theme Extraction Component

```typescript
'use client';

import { useEffect } from 'react';
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';
import { useUnifiedThemeAPIService } from '@/lib/api/services/unified-theme-api.service';

export function ThemeExtractionComponent() {
  // Subscribe to store
  const themes = useThemeExtractionStore(s => s.unifiedThemes);
  const selectedIds = useThemeExtractionStore(s => s.selectedThemeIds);
  const { analyzingThemes, extractionProgress, extractionError } = useThemeExtractionStore(s => ({
    analyzingThemes: s.analyzingThemes,
    extractionProgress: s.extractionProgress,
    extractionError: s.extractionError,
  }));

  // Get actions
  const {
    setUnifiedThemes,
    setAnalyzingThemes,
    setExtractionProgress,
    setExtractionError,
    toggleThemeSelection,
  } = useThemeExtractionStore();

  // API service
  const api = useUnifiedThemeAPIService();

  // Extract themes on demand
  const handleExtractThemes = async (papers: any[]) => {
    setAnalyzingThemes(true);
    setExtractionError(null);

    try {
      const sources = papers.map(p => ({
        id: p.id,
        type: 'paper',
        title: p.title,
        content: p.fullText || p.abstract,
        authors: p.authors,
        year: p.year,
        doi: p.doi,
      }));

      const response = await api.extractThemesV2(
        sources,
        'survey_construction',
        (stage, total, message) => {
          setExtractionProgress({
            current: stage,
            total: total,
            stage: 'Extracting',
            message: message,
            percentage: Math.round((stage / total) * 100),
          });
        }
      );

      setUnifiedThemes(response.themes);
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setAnalyzingThemes(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {analyzingThemes && extractionProgress && (
        <div className="bg-blue-100 p-4 rounded">
          <div className="text-sm text-gray-700">{extractionProgress.message}</div>
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${extractionProgress.percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {extractionProgress.percentage}% complete
          </div>
        </div>
      )}

      {/* Error Message */}
      {extractionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {extractionError}
        </div>
      )}

      {/* Themes List */}
      <div className="space-y-2">
        {themes.map(theme => (
          <div
            key={theme.id}
            className={`p-4 border rounded cursor-pointer ${
              selectedIds.includes(theme.id) ? 'bg-blue-50 border-blue-500' : 'border-gray-200'
            }`}
            onClick={() => toggleThemeSelection(theme.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{theme.label}</h3>
                <p className="text-sm text-gray-600">{theme.description}</p>
                <div className="mt-2 flex gap-2">
                  {theme.keywords.map((kw, i) => (
                    <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{theme.confidence.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Confidence</div>
              </div>
            </div>

            {/* Sources */}
            <div className="mt-3 border-t pt-2 text-sm text-gray-600">
              <div className="font-semibold mb-1">Sources:</div>
              {theme.sources.slice(0, 2).map((src, i) => (
                <div key={i} className="text-xs">
                  {src.sourceTitle} ({src.sourceType}) - influence: {src.influence.toFixed(2)}
                </div>
              ))}
              {theme.sources.length > 2 && (
                <div className="text-xs text-gray-500">+{theme.sources.length - 2} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Understanding Theme Relationships

### UnifiedTheme -> ThemeSource (1:Many)
```
One theme can come from multiple sources

UnifiedTheme {
  id: "theme-1"
  label: "AI Ethics"
  sources: [
    { sourceType: "paper", sourceId: "paper-123", ... },
    { sourceType: "youtube", sourceId: "video-456", ... },
    { sourceType: "podcast", sourceId: "pod-789", ... }
  ]
}
```

### UnifiedTheme -> ThemeProvenance (1:1)
```
One theme has one provenance record summarizing all sources

UnifiedTheme {
  id: "theme-1"
  label: "AI Ethics"
  provenance: {
    paperInfluence: 0.5,
    videoInfluence: 0.3,
    podcastInfluence: 0.2,
    paperCount: 15,
    videoCount: 3,
    podcastCount: 2,
    ...
  }
}
```

---

## State Update Patterns

### Immutable Updates (Recommended)
```typescript
// GOOD: Immutable state updates
const store = useThemeExtractionStore();

// Add a theme
store.addTheme(newTheme);

// Update a theme's label
store.updateTheme(themeId, { label: 'New Label' });

// Toggle selection
store.toggleThemeSelection(themeId);
```

### Direct State Mutations (Don't Do This!)
```typescript
// BAD: Direct mutations won't trigger re-renders
const state = useThemeExtractionStore.getState();
state.unifiedThemes.push(newTheme);  // Won't work!
state.selectedThemeIds[0] = 'new-id';  // Won't work!
```

---

## Persistence Behavior

### What Gets Persisted
When user closes browser and reopens:
- All extracted themes are restored
- Selection of research purpose is restored
- Expertise level is restored
- Generated outputs (questions, hypotheses, survey) are restored

### What Doesn't Get Persisted
When user closes browser and reopens:
- User theme selections are cleared (safety feature)
- Progress bar state is cleared
- Error messages are cleared
- Modal states are cleared

### Manual Rehydration (Advanced)
```typescript
// Get current state for debugging
const state = useThemeExtractionStore.getState();

// Manual reset if needed
useThemeExtractionStore.setState({
  unifiedThemes: [],
  selectedThemeIds: [],
  extractingPapers: new Set(),
  extractedPapers: new Set(),
  // ... rest of initial state
});
```

---

## Common Patterns

### Get Selected Themes
```typescript
const store = useThemeExtractionStore();
const selectedThemes = store.unifiedThemes.filter(t =>
  store.selectedThemeIds.includes(t.id)
);
```

### Get Themes by Confidence Level
```typescript
const store = useThemeExtractionStore();
const highConfidence = store.unifiedThemes.filter(t => t.confidence > 0.8);
const lowConfidence = store.unifiedThemes.filter(t => t.confidence < 0.5);
```

### Get Themes from Specific Source Type
```typescript
const store = useThemeExtractionStore();
const themesBySource = (sourceType: string) =>
  store.unifiedThemes.filter(t =>
    t.sources.some(s => s.sourceType === sourceType)
  );

const paperThemes = themesBySource('paper');
const videoThemes = themesBySource('youtube');
```

### Get Theme Statistics
```typescript
const store = useThemeExtractionStore();
const stats = {
  totalThemes: store.unifiedThemes.length,
  selectedThemes: store.selectedThemeIds.length,
  paperSourceCount: store.unifiedThemes.reduce(
    (sum, t) => sum + t.sources.filter(s => s.sourceType === 'paper').length,
    0
  ),
  averageConfidence: 
    store.unifiedThemes.reduce((sum, t) => sum + t.confidence, 0) /
    store.unifiedThemes.length,
};
```

---

## Error Handling

```typescript
const store = useThemeExtractionStore();

// Check for errors
if (store.extractionError) {
  console.error('Extraction failed:', store.extractionError);
  // Show error UI
}

// Set error
store.setExtractionError('Failed to fetch full text');

// Clear error
store.setExtractionError(null);
```

---

## Type Safety Tips

```typescript
// Import types for better IDE support
import type {
  UnifiedTheme,
  ExtractionProgress,
  ResearchPurpose,
} from '@/lib/stores/theme-extraction.store';

// Use const assertion for strict types
const purpose: ResearchPurpose = 'survey_construction';  // Good
// const purpose: ResearchPurpose = 'invalid_purpose';  // Type error!

// Type helper for action creators
const addThemesSafely = (themes: UnifiedTheme[]) => {
  if (!Array.isArray(themes)) return;
  themes.forEach(t => {
    useThemeExtractionStore.setState(state => ({
      unifiedThemes: [...state.unifiedThemes, t],
    }));
  });
};
```

