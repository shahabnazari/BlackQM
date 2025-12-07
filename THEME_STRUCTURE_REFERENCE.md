# Theme Extraction Store - Data Structure Summary

## Overview
The application uses a **Zustand-based store** for managing theme extraction with a **modular action creator architecture**. There are two main stores:

1. **useThemeExtractionStore** - New architecture (Phase 10.91) - Recommended
2. **useLiteratureThemeStore** - Legacy store - Still in use but being migrated

---

## UnifiedTheme Core Interface (Frontend)

**Location:** `/frontend/lib/api/services/unified-theme-api.service.ts`

```typescript
interface UnifiedTheme {
  id: string;                    // Unique theme identifier
  label: string;                 // Theme name/title
  description?: string;          // Human-readable description
  keywords: string[];            // Keywords associated with theme
  weight: number;                // Influence/importance score
  controversial: boolean;        // Whether theme is controversial
  confidence: number;            // Confidence score (0-1)
  sources: ThemeSource[];         // Papers/videos/podcasts this came from
  provenance: ThemeProvenance;    // Source breakdown and statistics
  extractedAt: Date;             // Timestamp of extraction
  extractionModel: string;       // Which AI model extracted it
}
```

### ThemeSource (Sub-structure)
```typescript
interface ThemeSource {
  id?: string;
  sourceType: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram';
  sourceId: string;              // ID in source system
  sourceUrl?: string;            // Direct URL to source
  sourceTitle: string;           // Name of the paper/video
  sourceAuthor?: string;         // Creator/Author name
  influence: number;             // How much this source influenced the theme
  keywordMatches: number;        // Number of keyword matches
  excerpts: string[];            // Key quotes supporting the theme
  timestamps?: Array<{           // For video/podcast timestamps
    start: number;
    end: number;
    text: string;
  }>;
  doi?: string;                  // Digital Object Identifier (papers)
  authors?: string[];            // List of authors
  year?: number;                 // Publication year
}
```

### ThemeProvenance (Sub-structure)
```typescript
interface ThemeProvenance {
  paperInfluence: number;        // Influence from academic papers
  videoInfluence: number;        // Influence from YouTube/videos
  podcastInfluence: number;      // Influence from podcasts
  socialInfluence: number;       // Influence from social media
  paperCount: number;            // Number of papers supporting
  videoCount: number;            // Number of videos supporting
  podcastCount: number;          // Number of podcasts supporting
  socialCount: number;           // Number of social posts supporting
  averageConfidence: number;     // Average confidence across sources
  citationChain: string[];       // Citation path to this theme
}
```

---

## useThemeExtractionStore (Recommended - Phase 10.91+)

**Location:** `/frontend/lib/stores/theme-extraction.store.ts`

### State Structure
```typescript
interface ThemeExtractionState {
  // ========== CORE THEME STATE ==========
  unifiedThemes: UnifiedTheme[];           // All extracted themes
  selectedThemeIds: string[];              // User-selected themes for export
  extractingPapers: Set<string>;           // Papers currently being extracted
  extractedPapers: Set<string>;            // Papers already extracted (max 10,000)

  // ========== EXTRACTION CONFIGURATION ==========
  extractionPurpose: ResearchPurpose | null;  // Purpose of extraction
  userExpertiseLevel: UserExpertiseLevel;     // 'novice'|'intermediate'|'advanced'|'expert'
  currentRequestId: string | null;            // Current WebSocket request ID

  // ========== PROGRESS STATE ==========
  analyzingThemes: boolean;                // Is extraction in progress?
  extractionProgress: ExtractionProgress | null;  // Progress percentage & stage
  extractionError: string | null;          // Error message if failed
  v2SaturationData: SaturationData | null; // Theoretical saturation metrics
  preparingMessage: string | null;         // Status message ("Analyzing paper content...")
  contentAnalysis: ContentAnalysis | null; // Stats about paper collection

  // ========== MODAL STATE ==========
  showModeSelectionModal: boolean;         // Show batch vs. incremental modal
  showPurposeWizard: boolean;              // Show research purpose selector
  showGuidedWizard: boolean;               // Show guided extraction wizard

  // ========== RESULTS STATE ==========
  researchQuestions: ResearchQuestionSuggestion[];  // Generated research questions
  hypotheses: HypothesisSuggestion[];               // Generated hypotheses
  constructMappings: ConstructMapping[];           // Theme → Construct mappings
  generatedSurvey: GeneratedSurvey | null;         // AI-generated survey instrument
  qStatements: string[];                           // Q-methodology statements
  researchGaps: ResearchGap[];                     // Identified literature gaps
}
```

### ExtractionProgress Structure
```typescript
interface ExtractionProgress {
  current: number;         // Current item (0-based)
  total: number;           // Total items to process
  stage: string;           // Current stage name
  message: string;         // Human-readable message
  percentage: number;      // 0-100%
  liveStats?: {
    papersProcessed: number;
    themesFound: number;
    estimatedTimeRemaining: number;  // milliseconds
  };
}
```

### ContentAnalysis Structure
```typescript
interface ContentAnalysis {
  totalPapers: number;           // Number of papers in collection
  avgAbstractLength: number;     // Average abstract word count
  fullTextAvailable: number;     // Papers with full text access
  estimatedExtractionTime: number;  // Estimated milliseconds
}
```

### SaturationData Structure
```typescript
interface SaturationData {
  sourceProgression: Array<{
    sourceNumber: number;        // Which source (1st, 2nd, etc.)
    newThemesDiscovered: number; // New themes found in this source
    cumulativeThemes: number;    // Total unique themes so far
  }>;
  saturationReached: boolean;    // Has theoretical saturation been reached?
  saturationPoint?: number;      // At which source did saturation occur?
  recommendation: string;        // Recommendation on continuing extraction
}
```

### ResearchPurpose Types
```typescript
type ResearchPurpose =
  | 'q_methodology'           // Q-sort studies
  | 'survey_construction'     // Building survey instruments
  | 'qualitative_analysis'    // Qualitative research
  | 'literature_synthesis'    // Literature reviews
  | 'hypothesis_generation';  // Generating testable hypotheses
```

### UserExpertiseLevel Types
```typescript
type UserExpertiseLevel = 'novice' | 'intermediate' | 'advanced' | 'expert';
```

### Store Actions (Modular)

#### Theme Management (createThemeActions)
```typescript
setUnifiedThemes: (themes: UnifiedTheme[]) => void;  // Bulk set
addTheme: (theme: UnifiedTheme) => void;              // Add single
removeTheme: (themeId: string) => void;               // Remove single
updateTheme: (themeId: string, updates: Partial<UnifiedTheme>) => void;
clearThemes: () => void;                              // Clear all
```

#### Selection Management (createSelectionActions)
```typescript
setSelectedThemeIds: (ids: string[]) => void;         // Bulk set selected
toggleThemeSelection: (themeId: string) => void;      // Toggle one
selectAllThemes: () => void;                          // Select all
clearThemeSelection: () => void;                      // Clear all
```

#### Progress Tracking (createProgressActions)
```typescript
setAnalyzingThemes: (analyzing: boolean) => void;
setExtractionProgress: (progress: ExtractionProgress | null) => void;
updateExtractionProgress: (updates: Partial<ExtractionProgress>) => void;
setExtractionError: (error: string | null) => void;
completeExtraction: (themesCount: number) => void;
resetExtractionProgress: () => void;
setV2SaturationData: (data: SaturationData | null) => void;
setPreparingMessage: (message: string | null) => void;
setContentAnalysis: (analysis: ContentAnalysis | null) => void;
```

#### Paper Tracking (createProgressActions)
```typescript
setExtractingPapers: (paperIds: Set<string>) => void;
addExtractingPaper: (paperId: string) => void;
removeExtractingPaper: (paperId: string) => void;
setExtractedPapers: (paperIds: Set<string>) => void;
addExtractedPaper: (paperId: string) => void;
markPapersAsExtracted: (paperIds: string[]) => void;
```

#### Configuration (createConfigModalActions)
```typescript
setExtractionPurpose: (purpose: ResearchPurpose | null) => void;
setUserExpertiseLevel: (level: UserExpertiseLevel) => void;
setShowModeSelectionModal: (show: boolean) => void;
setShowPurposeWizard: (show: boolean) => void;
setShowGuidedWizard: (show: boolean) => void;
closeAllModals: () => void;
```

#### Results Management (createResultsActions)
```typescript
setResearchQuestions: (questions: ResearchQuestionSuggestion[]) => void;
addResearchQuestion: (question: ResearchQuestionSuggestion) => void;
removeResearchQuestion: (questionId: string) => void;
setHypotheses: (hypotheses: HypothesisSuggestion[]) => void;
addHypothesis: (hypothesis: HypothesisSuggestion) => void;
removeHypothesis: (hypothesisId: string) => void;
setConstructMappings: (mappings: ConstructMapping[]) => void;
setGeneratedSurvey: (survey: GeneratedSurvey | null) => void;
setQStatements: (statements: string[]) => void;
setResearchGaps: (gaps: ResearchGap[]) => void;
clearResults: () => void;
clearIncompatibleResults: (purpose: string) => void;
```

### Persistence Configuration
```typescript
// Store name in localStorage
name: 'theme-extraction-store'

// What gets persisted
Persisted: {
  unifiedThemes: UnifiedTheme[];
  extractingPapers: string[];    // Converted from Set for storage
  extractedPapers: string[];     // Converted from Set for storage
  extractionPurpose: ResearchPurpose | null;
  userExpertiseLevel: UserExpertiseLevel;
  researchQuestions: ResearchQuestionSuggestion[];
  hypotheses: HypothesisSuggestion[];
  constructMappings: ConstructMapping[];
  generatedSurvey: GeneratedSurvey | null;
  qStatements: string[];
}

// Not persisted (transient)
Non-Persisted: {
  selectedThemeIds: string[]
  analyzingThemes: boolean
  extractionProgress: ExtractionProgress | null
  extractionError: string | null
  v2SaturationData: SaturationData | null
  preparingMessage: string | null
  contentAnalysis: ContentAnalysis | null
  showModeSelectionModal: boolean
  showPurposeWizard: boolean
  showGuidedWizard: boolean
}
```

### Selectors (for optimized re-renders)
```typescript
selectThemes(state) -> UnifiedTheme[];
selectSelectedThemes(state) -> UnifiedTheme[];  // Filtered by selection
selectExtractionStatus(state) -> { analyzing, progress, error };
selectModalState(state) -> { modeSelection, purpose, guided };
selectResults(state) -> { questions, hypotheses, constructs, survey, qStatements };
```

---

## useLiteratureThemeStore (Legacy - Phase 10.1)

**Location:** `/frontend/lib/stores/literature-theme.store.ts`

**Status:** Still in use but `useThemeExtractionStore` is recommended for new code.

### Key Differences from useThemeExtractionStore
- Uses `themes` instead of `unifiedThemes`
- Has loading flags for each operation type (`loadingQuestions`, `loadingHypotheses`, etc.)
- Separate `isThemeSelected()` and `getSelectedThemes()` getter actions
- Uses `saturationData` instead of `v2SaturationData`
- Includes `resetDownstream()` for clearing only downstream outputs

---

## Backend Type Definitions

**Location:** `/backend/src/modules/literature/types/theme-extraction.types.ts`

### Prisma Result Types
```typescript
interface PrismaUnifiedThemeWithRelations {
  id: string;
  label: string;
  description: string | null;
  keywords: JsonValue;  // Prisma returns JsonValue for arrays
  weight: number;
  controversial: boolean;
  confidence: number;
  extractedAt: Date;
  extractionModel: string;
  studyId: string | null;
  collectionId: string | null;
  sources: PrismaThemeSourceRelation[];
  provenance: PrismaThemeProvenanceRelation | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaThemeSourceRelation {
  id: string;
  sourceType: string;  // Paper, youtube, podcast, etc.
  sourceId: string;
  sourceUrl: string | null;
  sourceTitle: string;
  sourceAuthor?: string | null;
  influence: number;
  keywordMatches: number;
  excerpts: string[];
  timestamps?: JsonValue | null;
  doi: string | null;
  authors: JsonValue | null;
  year: number | null;
  createdAt: Date;
  themeId: string;
}

interface PrismaThemeProvenanceRelation {
  id: string;
  themeId: string;
  paperInfluence: number;
  videoInfluence: number;
  podcastInfluence: number;
  socialInfluence: number;
  paperCount: number;
  videoCount: number;
  podcastCount: number;
  socialCount: number;
  averageConfidence: number;
  citationChain: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Usage Example

```typescript
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

// Component using the store
export function MyComponent() {
  // Get specific slices for performance
  const themes = useThemeExtractionStore(state => state.unifiedThemes);
  const selectedThemes = useThemeExtractionStore(state =>
    state.unifiedThemes.filter(t => state.selectedThemeIds.includes(t.id))
  );
  const { analyzing, progress, error } = useThemeExtractionStore(state => ({
    analyzing: state.analyzingThemes,
    progress: state.extractionProgress,
    error: state.extractionError,
  }));

  // Or use selector
  const extractionStatus = useThemeExtractionStore(selectExtractionStatus);

  // Dispatch actions
  const { addTheme, toggleThemeSelection, setAnalyzingThemes } = useThemeExtractionStore();

  return (
    <div>
      {analyzing && <ProgressBar progress={progress?.percentage} />}
      {themes.map(theme => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isSelected={selectedThemes.some(t => t.id === theme.id)}
          onSelect={() => toggleThemeSelection(theme.id)}
        />
      ))}
    </div>
  );
}
```

---

## Key Design Patterns

### 1. Modular Actions (Phase 10.91)
The store uses helper modules to break down functionality:
- `theme-actions.ts` - CRUD operations
- `selection-actions.ts` - User selections
- `progress-actions.ts` - Progress tracking
- `results-actions.ts` - Generated outputs
- `config-modal-actions.ts` - Configuration & modals

### 2. Persistence with Hydration
- Sets are converted to Arrays for localStorage
- Custom `onRehydrateStorage` converts Arrays back to Sets
- Selective persistence (not all state)

### 3. Type Safety
- No `any` types
- Strict input validation in actions
- Type guards for discriminated unions
- Defensive programming (check for duplicates, null values, etc.)

### 4. Performance Optimization
- Selectors for fine-grained subscriptions
- Partial state updates
- Immutable patterns

---

## File Structure Summary

```
frontend/lib/
├── stores/
│   ├── theme-extraction.store.ts         # RECOMMENDED - Main store (315 lines)
│   ├── literature-theme.store.ts         # Legacy - Still used
│   └── helpers/theme-extraction/
│       ├── index.ts                      # Main export
│       ├── types.ts                      # Shared types
│       ├── theme-actions.ts              # Theme CRUD
│       ├── selection-actions.ts          # Selection logic
│       ├── progress-actions.ts           # Progress tracking
│       ├── results-actions.ts            # Results management
│       └── config-modal-actions.ts       # Config & modals
└── api/services/
    └── unified-theme-api.service.ts      # Frontend API client

backend/src/modules/
└── literature/types/
    └── theme-extraction.types.ts         # Backend types
```

