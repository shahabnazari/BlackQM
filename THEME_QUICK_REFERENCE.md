# Theme Data Structure - Quick Reference

## Key Files
1. **Frontend Store:** `/frontend/lib/stores/theme-extraction.store.ts` (RECOMMENDED)
2. **Frontend Legacy Store:** `/frontend/lib/stores/literature-theme.store.ts`
3. **API Types:** `/frontend/lib/api/services/unified-theme-api.service.ts`
4. **Backend Types:** `/backend/src/modules/literature/types/theme-extraction.types.ts`

## Core Data Structure (UnifiedTheme)

```typescript
{
  id: "uuid",
  label: "Theme Name",
  description: "Human-readable description",
  keywords: ["keyword1", "keyword2"],
  weight: 0.85,           // Importance (0-1)
  controversial: false,
  confidence: 0.92,       // Confidence score (0-1)
  sources: [              // Supporting sources
    {
      sourceType: "paper",  // paper|youtube|podcast|tiktok|instagram
      sourceId: "uuid",
      sourceTitle: "Paper Title",
      sourceUrl: "https://...",
      sourceAuthor: "Author Name",
      influence: 0.8,       // How much this influenced the theme
      keywordMatches: 5,
      excerpts: ["quote 1", "quote 2"],
      timestamps: [{start: 0, end: 45, text: "..."}],  // For videos
      doi: "10.1234/...",
      authors: ["Author1", "Author2"],
      year: 2023
    }
  ],
  provenance: {          // Source breakdown
    paperInfluence: 0.6,
    videoInfluence: 0.2,
    podcastInfluence: 0.15,
    socialInfluence: 0.05,
    paperCount: 8,
    videoCount: 2,
    podcastCount: 1,
    socialCount: 3,
    averageConfidence: 0.88,
    citationChain: ["ref1", "ref2"]
  },
  extractedAt: "2024-11-23T10:30:00Z",
  extractionModel: "claude-3.5-sonnet"
}
```

## Store State Structure

```typescript
useThemeExtractionStore() returns {
  // ===== THEMES =====
  unifiedThemes: UnifiedTheme[],
  selectedThemeIds: string[],
  extractingPapers: Set<string>,
  extractedPapers: Set<string>,

  // ===== CONFIG =====
  extractionPurpose: 'q_methodology'|'survey_construction'|'qualitative_analysis'|'literature_synthesis'|'hypothesis_generation',
  userExpertiseLevel: 'novice'|'intermediate'|'advanced'|'expert',
  currentRequestId: string|null,

  // ===== PROGRESS =====
  analyzingThemes: boolean,
  extractionProgress: { current, total, stage, message, percentage, liveStats? },
  extractionError: string|null,
  v2SaturationData: { sourceProgression, saturationReached, saturationPoint?, recommendation },
  preparingMessage: string|null,
  contentAnalysis: { totalPapers, avgAbstractLength, fullTextAvailable, estimatedExtractionTime },

  // ===== MODALS =====
  showModeSelectionModal: boolean,
  showPurposeWizard: boolean,
  showGuidedWizard: boolean,

  // ===== RESULTS =====
  researchQuestions: ResearchQuestionSuggestion[],
  hypotheses: HypothesisSuggestion[],
  constructMappings: ConstructMapping[],
  generatedSurvey: GeneratedSurvey|null,
  qStatements: string[],
  researchGaps: ResearchGap[],

  // ===== ACTIONS =====
  // Theme Management
  setUnifiedThemes(themes: UnifiedTheme[]): void
  addTheme(theme: UnifiedTheme): void
  removeTheme(themeId: string): void
  updateTheme(themeId: string, updates: Partial<UnifiedTheme>): void
  clearThemes(): void

  // Selection
  setSelectedThemeIds(ids: string[]): void
  toggleThemeSelection(themeId: string): void
  selectAllThemes(): void
  clearThemeSelection(): void

  // Progress
  setAnalyzingThemes(analyzing: boolean): void
  setExtractionProgress(progress: ExtractionProgress|null): void
  updateExtractionProgress(updates: Partial<ExtractionProgress>): void
  setExtractionError(error: string|null): void
  completeExtraction(themesCount: number): void
  resetExtractionProgress(): void

  // Paper Tracking
  setExtractingPapers(paperIds: Set<string>): void
  addExtractingPaper(paperId: string): void
  removeExtractingPaper(paperId: string): void
  setExtractedPapers(paperIds: Set<string>): void
  addExtractedPaper(paperId: string): void
  markPapersAsExtracted(paperIds: string[]): void

  // Configuration
  setExtractionPurpose(purpose: ResearchPurpose|null): void
  setUserExpertiseLevel(level: UserExpertiseLevel): void
  setShowModeSelectionModal(show: boolean): void
  setShowPurposeWizard(show: boolean): void
  setShowGuidedWizard(show: boolean): void
  closeAllModals(): void

  // Results
  setResearchQuestions(questions: ResearchQuestionSuggestion[]): void
  setHypotheses(hypotheses: HypothesisSuggestion[]): void
  setConstructMappings(mappings: ConstructMapping[]): void
  setGeneratedSurvey(survey: GeneratedSurvey|null): void
  setQStatements(statements: string[]): void
  setResearchGaps(gaps: ResearchGap[]): void
  clearResults(): void
  clearIncompatibleResults(purpose: string): void

  // Utilities
  reset(): void
}
```

## Basic Usage

```typescript
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

// Read state
const themes = useThemeExtractionStore(s => s.unifiedThemes);
const { analyzingThemes, extractionProgress } = useThemeExtractionStore(s => ({
  analyzingThemes: s.analyzingThemes,
  extractionProgress: s.extractionProgress
}));

// Dispatch actions
const { addTheme, toggleThemeSelection } = useThemeExtractionStore();
addTheme(newTheme);
toggleThemeSelection(themeId);
```

## Persistence

**LocalStorage Key:** `theme-extraction-store`

**Persisted Fields:**
- unifiedThemes
- extractingPapers
- extractedPapers
- extractionPurpose
- userExpertiseLevel
- researchQuestions
- hypotheses
- constructMappings
- generatedSurvey
- qStatements

**Not Persisted (Transient):**
- selectedThemeIds
- analyzingThemes
- extractionProgress
- extractionError
- All modal states

## Constraints & Limits

- Max tracked papers: 10,000
- Theme weight: 0-1 range
- Confidence score: 0-1 range
- Default expertise level: 'intermediate'

## Common Operations

```typescript
const store = useThemeExtractionStore();

// Get selected themes
const selected = store.unifiedThemes.filter(t => 
  store.selectedThemeIds.includes(t.id)
);

// Get themes by source type
const paperThemes = store.unifiedThemes.filter(t =>
  t.sources.some(s => s.sourceType === 'paper')
);

// Get high-confidence themes
const highConfidence = store.unifiedThemes.filter(t => t.confidence > 0.8);

// Get theme by ID
const theme = store.unifiedThemes.find(t => t.id === themeId);
```

