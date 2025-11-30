# Theme Extraction Flow Documentation

**Phase 10.101** - Enterprise-Grade Documentation for Theme Extraction System

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [4-Stage Workflow](#4-stage-workflow)
4. [Component Structure](#component-structure)
5. [Data Flow](#data-flow)
6. [Hook System](#hook-system)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Theme Extraction system is a sophisticated AI-powered workflow that extracts, analyzes, and generates research outputs from academic papers, multimedia content, and social media posts.

### Key Features

- **Multi-Source Support**: Academic papers, YouTube videos, podcasts, TikTok, Instagram
- **Purpose-Specific Extraction**: Q-Methodology, Survey Construction, Hypothesis Generation, Literature Synthesis, Qualitative Analysis
- **4-Stage Workflow**: Save Papers → Fetch Full-Text → Prepare Sources → Extract Themes
- **Real-Time Progress**: WebSocket-based progress tracking with transparent backend metrics
- **Research Output Generation**: Questions, Hypotheses, Construct Mappings, Complete Surveys, Q-Statements

### Technology Stack

- **Frontend**: React + Next.js 14 (App Router)
- **State Management**: Zustand stores
- **API Communication**: WebSocket (progress) + REST (operations)
- **Performance**: RAF-batched updates, memoized hooks
- **Type Safety**: TypeScript strict mode

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Literature Search Page                    │
│  (frontend/app/(researcher)/discover/literature/page.tsx)   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ThemeExtractionContainer Component              │
│  (containers/ThemeExtractionContainer.tsx)                  │
│  - Renders extraction UI                                    │
│  - Manages theme selection                                  │
│  - Coordinates workflow execution                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│  Workflow   │ │  API        │ │  Research       │
│  Hook       │ │  Handlers   │ │  Output         │
│             │ │  Hook       │ │  Handlers Hook  │
└─────────────┘ └─────────────┘ └─────────────────┘
         │             │             │
         └─────────────┼─────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Zustand Stores                          │
│  - theme-extraction.store.ts (extraction state)             │
│  - literature-search.store.ts (papers state)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  - Unified Theme Extraction Service                         │
│  - Enhanced Theme Integration Service                       │
│  - WebSocket Gateway (real-time progress)                   │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
frontend/
├── app/(researcher)/discover/literature/
│   ├── page.tsx                           # Main literature search page
│   └── containers/
│       └── ThemeExtractionContainer.tsx   # Theme extraction UI
│
├── components/literature/
│   ├── ThemeExtractionProgressModal.tsx   # Progress modal UI
│   ├── PurposeSpecificActions.tsx         # Research output buttons
│   └── ModeSelectionModal.tsx             # Extraction mode selector
│
├── lib/
│   ├── hooks/
│   │   ├── useExtractionWorkflow.ts       # Workflow orchestration
│   │   ├── useThemeApiHandlers.ts         # API handler functions
│   │   └── useResearchOutputHandlers.ts   # Output interactions
│   │
│   ├── stores/
│   │   ├── theme-extraction.store.ts      # Extraction state
│   │   └── literature-search.store.ts     # Papers state
│   │
│   ├── api/services/
│   │   ├── unified-theme-api.service.ts   # Theme extraction API
│   │   └── enhanced-theme-integration-api.service.ts  # Output generation API
│   │
│   └── types/
│       └── literature.types.ts            # Type definitions
│
backend/src/modules/literature/
├── literature.service.ts                  # Main literature service
├── literature.gateway.ts                  # WebSocket gateway
└── services/
    └── unified-theme-extraction.service.ts  # Theme extraction engine
```

---

## 4-Stage Workflow

The theme extraction process consists of 4 sequential stages with progress tracking:

### Stage 1: Save Papers (0-15%)

**Purpose**: Persist selected papers to the database

**Process**:
1. Validate user authentication
2. Check paper selection (minimum 1 paper required)
3. Save papers to database via `savePapers` API
4. Store paper IDs for subsequent stages

**Progress Updates**:
- Start: 0%
- During save: 5%
- Completion: 15%

**Error Handling**:
- Authentication failure → Redirect to login
- No papers selected → User warning
- Database error → Retry with exponential backoff

**Code Location**: `frontend/lib/hooks/useExtractionWorkflow.ts:230-280`

### Stage 2: Fetch Full-Text (15-40%)

**Purpose**: Extract full-text content from papers for richer theme extraction

**Process**:
1. Request full-text extraction for all papers
2. WebSocket connection established
3. Real-time progress updates from backend
4. Accumulate extraction metrics (success/failure counts)

**Content Sources**:
- **Academic Papers**: Unpaywall, PMC, ERIC, Springer, Nature, Wiley, Publisher APIs
- **Videos**: YouTube transcripts (via API)
- **Podcasts**: Audio transcription
- **Social Media**: Post content extraction

**Progress Updates**:
- Incremental updates via WebSocket: `15% + (progress * 25%)`
- Real-time metrics: papers processed, full-text retrieved, failures

**Fallback Strategy**:
- Full-text unavailable → Use abstract
- Abstract too short (<150 words) → Abstract overflow mode
- No content → Exclude from extraction

**Code Location**: `frontend/lib/hooks/useExtractionWorkflow.ts:282-340`

### Stage 3: Prepare Sources (40%)

**Purpose**: Transform papers into extraction-ready format

**Process**:
1. Map papers to source format required by extraction service
2. Classify content type (full_text, abstract, video_transcript, etc.)
3. Validate source data completeness
4. Prepare metadata for backend

**Data Transformation**:
```typescript
{
  sourceType: 'paper' | 'youtube' | 'podcast' | 'tiktok' | 'instagram',
  sourceId: string,
  sourceTitle: string,
  sourceAuthor?: string,
  sourceUrl?: string,
  content: string,  // Full-text or abstract
  metadata: {
    contentType: 'full_text' | 'abstract' | 'video_transcript' | ...,
    contentLength: number,
    hasFullText: boolean,
  }
}
```

**Code Location**: `frontend/lib/hooks/useExtractionWorkflow.ts:342-380`

### Stage 4: Extract Themes (40-100%)

**Purpose**: AI-powered theme extraction with purpose-specific algorithms

**Process**:
1. Initiate extraction via `extractThemes` API
2. WebSocket connection for live progress
3. Backend processes papers through AI pipeline
4. Real-time updates: current paper, themes extracted, confidence scores
5. Store results in Zustand store

**Extraction Algorithms** (Purpose-Specific):

- **Q-Methodology**:
  - Pairwise comparison clustering
  - Distinctiveness threshold: 0.3
  - Target: 30-80 statements
  - Focus: Diverse viewpoints

- **Survey Construction**:
  - Hierarchical theme clustering
  - Construct mapping
  - Target: 5-20 themes
  - Focus: Measurable dimensions

- **Hypothesis Generation**:
  - Relationship detection
  - Causal pattern identification
  - Target: 3-15 themes
  - Focus: Testable propositions

- **Literature Synthesis**:
  - Conceptual clustering
  - Cross-source aggregation
  - Target: 10-30 themes
  - Focus: Comprehensive coverage

- **Qualitative Analysis**:
  - Inductive coding
  - Saturation detection
  - Target: 5-25 themes
  - Focus: Emergent patterns

**Progress Updates**:
- Incremental: `40% + (progress * 60%)`
- Metrics: Papers processed, themes extracted, confidence scores

**Output**:
```typescript
{
  id: string,
  label: string,
  description: string,
  keywords: string[],
  weight: number,              // 0-1 (importance)
  controversial: boolean,      // Conflicting evidence
  confidence: number,          // 0-1 (AI confidence)
  sources: ThemeSource[],      // Origin papers
  provenance: {
    model: string,             // e.g., 'gpt-4'
    version: string,
    timestamp: Date,
  }
}
```

**Code Location**: `frontend/lib/hooks/useExtractionWorkflow.ts:382-450`

---

## Component Structure

### ThemeExtractionContainer

**Purpose**: Self-contained UI for theme extraction and management

**Key Features**:
- Zero required props (fully store-integrated)
- Inline or modal progress display
- Theme selection with multi-select support
- Research output generation buttons
- Empty state handling

**Component Size**: <400 lines (Phase 10.935 refactoring)

**Props** (all optional):
```typescript
interface ThemeExtractionContainerProps {
  emptyStateMessage?: string;      // Default: "No themes extracted yet"
  showProgressInline?: boolean;    // Default: false (modal)
}
```

**Usage**:
```tsx
// Minimal usage
<ThemeExtractionContainer />

// With inline progress
<ThemeExtractionContainer showProgressInline={true} />
```

**Code Location**: `frontend/app/(researcher)/discover/literature/containers/ThemeExtractionContainer.tsx`

### ExtractionModals

**Components**:
- `PurposeSelectionWizard`: Select research purpose (Q-Methodology, Survey, etc.)
- `ModeSelectionModal`: Choose extraction mode (Guided vs. Fast)
- `ThemeExtractionProgressModal`: Real-time progress tracking

**Modal Flow**:
```
User clicks "Extract Themes"
         ↓
Purpose Selection Modal (if purpose not set)
         ↓
Mode Selection Modal (Guided vs. Fast)
         ↓
Progress Modal (4-stage workflow visualization)
         ↓
Completion (display extracted themes)
```

**Code Location**: `frontend/components/literature/`

---

## Data Flow

### State Management

**Zustand Stores**:

1. **theme-extraction.store.ts**:
   - Extracted themes
   - Research questions
   - Hypotheses
   - Construct mappings
   - Generated surveys
   - Q-statements
   - Extraction progress
   - Selected theme IDs

2. **literature-search.store.ts**:
   - Search results (papers)
   - Selected papers
   - Search filters
   - Search query

**Store Actions**:
```typescript
// Theme Extraction Store
setThemes(themes: UnifiedTheme[])
setResearchQuestions(questions: ResearchQuestion[])
setHypotheses(hypotheses: Hypothesis[])
setGeneratedSurvey(survey: GeneratedSurvey)
setProgress(progress: ExtractionProgress | null)
toggleThemeSelection(themeId: string)
clearSelection()

// Literature Search Store
setSearchResults(papers: Paper[])
setSelectedPapers(ids: string[])
clearSelection()
```

### API Communication

**REST Endpoints**:
- `POST /api/literature/save-papers` - Save papers to database
- `POST /api/literature/extract-themes` - Initiate extraction
- `POST /api/themes/suggest-questions` - Generate research questions
- `POST /api/themes/suggest-hypotheses` - Generate hypotheses
- `POST /api/themes/map-constructs` - Map constructs
- `POST /api/themes/generate-survey` - Generate complete survey

**WebSocket Events**:
- `themeExtractionProgress` - Real-time extraction progress
- `fullTextFetchProgress` - Full-text fetching updates
- `error` - Error notifications

**WebSocket Message Format**:
```typescript
{
  stage: 1 | 2 | 3 | 4,
  percentage: number,          // 0-100
  message: string,
  currentPaper?: string,
  metrics?: {
    papersProcessed: number,
    fullTextRetrieved: number,
    themesExtracted: number,
    successCount: number,
    failureCount: number,
  }
}
```

---

## Hook System

### useExtractionWorkflow

**Purpose**: Orchestrate 4-stage extraction workflow

**API**:
```typescript
const {
  executeWorkflow,     // (params) => Promise<result>
  cancelWorkflow,      // () => void
  progress,            // ExtractionProgress | null
  isExecuting,         // boolean
} = useExtractionWorkflow();
```

**Workflow Execution**:
```typescript
const result = await executeWorkflow({
  papers: selectedPapers,
  purpose: 'q_methodology',
  mode: 'guided',
  userExpertiseLevel: 'researcher'
});
```

**Performance Optimizations**:
- RAF-batched progress updates (reduces re-renders by ~90%)
- Direct ref access in hot paths
- Accumulated metrics tracking

**Code Location**: `frontend/lib/hooks/useExtractionWorkflow.ts`

### useThemeApiHandlers

**Purpose**: Generate research outputs from themes

**API**:
```typescript
const {
  handleGenerateQuestions,    // () => Promise<void>
  handleGenerateHypotheses,   // () => Promise<void>
  handleMapConstructs,        // () => Promise<void>
  handleGenerateSurvey,       // (config) => Promise<void>
  handleGenerateStatements,   // () => void
  loadingQuestions,           // boolean
  loadingHypotheses,          // boolean
  loadingConstructs,          // boolean
  loadingSurvey,              // boolean
} = useThemeApiHandlers({
  selectedThemeIds,
  mappedSelectedThemes,
  extractionPurpose,
  // ... loading state setters
});
```

**Research Outputs**:
1. **Research Questions**: Theory-grounded questions (max 5)
2. **Hypotheses**: Testable propositions (max 5, types: correlational, causal, mediation)
3. **Construct Mappings**: Psychological/theoretical constructs with relationships
4. **Complete Survey**: Sections, items, scales, validation checks
5. **Q-Statements**: Q-methodology statements (from themes)

**Code Location**: `frontend/lib/hooks/useThemeApiHandlers.ts`

### useResearchOutputHandlers

**Purpose**: Handle user interactions with research outputs

**API**:
```typescript
const {
  handleSelectQuestion,          // (question) => void
  handleOperationalizeQuestion,  // (question) => void
  handleSelectHypothesis,        // (hypothesis) => void
  handleTestHypothesis,          // (hypothesis) => void
  handleConstructClick,          // (id) => void
  handleRelationshipClick,       // (source, target) => void
  handleEditSurvey,              // () => void
  handleExportSurvey,            // (format) => void
} = useResearchOutputHandlers({
  mappedSelectedThemes,
  constructMappings,
  generatedSurvey,
  extractionPurpose,
});
```

**Navigation Flow**:
- Questions/Hypotheses → `/design?source=themes&step=[question|hypotheses]`
- Survey Edit → `/questionnaire/builder-pro?import=survey&source=themes`

**Export Formats**: JSON, CSV, PDF (coming soon), Word (coming soon)

**Code Location**: `frontend/lib/hooks/useResearchOutputHandlers.ts`

---

## Usage Examples

### Example 1: Basic Theme Extraction

```tsx
import { ThemeExtractionContainer } from '@/app/(researcher)/discover/literature/containers/ThemeExtractionContainer';

export default function LiteraturePage() {
  return (
    <div>
      {/* Search and select papers */}
      <LiteratureSearchContainer />

      {/* Extract and manage themes */}
      <ThemeExtractionContainer />
    </div>
  );
}
```

### Example 2: Custom Extraction Workflow

```tsx
'use client';

import { useExtractionWorkflow } from '@/lib/hooks/useExtractionWorkflow';
import { useLiteratureSearchStore } from '@/lib/stores/literature-search.store';

export function CustomExtractionButton() {
  const selectedPapers = useLiteratureSearchStore(state => state.selectedPapers);
  const { executeWorkflow, progress, isExecuting } = useExtractionWorkflow();

  const handleExtract = async () => {
    const result = await executeWorkflow({
      papers: selectedPapers,
      purpose: 'survey_construction',
      mode: 'guided',
      userExpertiseLevel: 'researcher'
    });

    if (result.success) {
      console.log(`Extracted ${result.themes.length} themes`);
    }
  };

  return (
    <div>
      <button
        onClick={handleExtract}
        disabled={isExecuting || selectedPapers.length === 0}
      >
        Extract Themes
      </button>

      {progress && (
        <div>
          <div>Stage {progress.stage}: {progress.message}</div>
          <progress value={progress.percentage} max={100} />
        </div>
      )}
    </div>
  );
}
```

### Example 3: Generate Research Questions

```tsx
'use client';

import { useState } from 'react';
import { useThemeApiHandlers } from '@/lib/hooks/useThemeApiHandlers';
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

export function ResearchQuestionsPanel() {
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const themes = useThemeExtractionStore(state => state.themes);
  const selectedThemeIds = useThemeExtractionStore(state => state.selectedThemeIds);
  const researchQuestions = useThemeExtractionStore(state => state.researchQuestions);

  const { handleGenerateQuestions } = useThemeApiHandlers({
    selectedThemeIds,
    mappedSelectedThemes: themes.filter(t => selectedThemeIds.includes(t.id)),
    extractionPurpose: 'hypothesis_generation',
    setLoadingQuestions,
    loadingQuestions,
    // ... other props
  });

  return (
    <div>
      <button
        onClick={handleGenerateQuestions}
        disabled={loadingQuestions || selectedThemeIds.length === 0}
      >
        Generate Research Questions
      </button>

      {researchQuestions.map(q => (
        <div key={q.id}>
          <h4>{q.question}</h4>
          <p>Rationale: {q.rationale}</p>
          <p>Related Themes: {q.relatedThemes.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Export Survey

```tsx
'use client';

import { useResearchOutputHandlers } from '@/lib/hooks/useResearchOutputHandlers';
import { useThemeExtractionStore } from '@/lib/stores/theme-extraction.store';

export function SurveyExportPanel() {
  const themes = useThemeExtractionStore(state => state.themes);
  const selectedThemeIds = useThemeExtractionStore(state => state.selectedThemeIds);
  const generatedSurvey = useThemeExtractionStore(state => state.generatedSurvey);

  const { handleExportSurvey, handleEditSurvey } = useResearchOutputHandlers({
    mappedSelectedThemes: themes.filter(t => selectedThemeIds.includes(t.id)),
    constructMappings: [],
    generatedSurvey,
    extractionPurpose: 'survey_construction',
  });

  if (!generatedSurvey) return null;

  return (
    <div>
      <h3>Generated Survey ({generatedSurvey.metadata.totalItems} items)</h3>

      <div>
        <button onClick={() => handleExportSurvey('json')}>
          Export as JSON
        </button>
        <button onClick={() => handleExportSurvey('csv')}>
          Export as CSV
        </button>
        <button onClick={handleEditSurvey}>
          Edit in Questionnaire Builder
        </button>
      </div>
    </div>
  );
}
```

---

## Best Practices

### 1. Paper Selection

**Recommended**:
- Select 5-50 papers for optimal balance (quality vs. coverage)
- Ensure papers are relevant to research question
- Include diverse sources (journals, conferences, preprints)
- Verify papers have sufficient content (abstracts >100 words)

**Q-Methodology Specific**:
- 10-30 papers recommended
- Prioritize papers with diverse viewpoints
- Include controversial/contested topics

**Survey Construction**:
- 5-20 papers recommended
- Focus on validated measurement instruments
- Include psychometric studies

### 2. Purpose Selection

**Choose Based on Research Goal**:
- **Literature Synthesis**: Comprehensive overview of field
- **Hypothesis Generation**: Identify testable propositions
- **Survey Construction**: Build measurement instruments
- **Q-Methodology**: Explore subjective viewpoints
- **Qualitative Analysis**: Emergent patterns and themes

**Impact on Extraction**:
- Different clustering algorithms per purpose
- Varying theme count targets
- Purpose-specific output generation

### 3. Extraction Mode

**Guided Mode** (Recommended):
- Purpose selection wizard
- Expertise level configuration
- Optimal for first-time users
- Provides contextual help

**Fast Mode**:
- Uses last settings
- Skips configuration steps
- Optimal for repeated extractions
- Requires prior configuration

### 4. Theme Selection

**Research Output Generation**:
- Select 2-10 themes for questions/hypotheses
- Select 3-15 themes for surveys
- Select 5-20 themes for Q-statements

**Quality Considerations**:
- Prefer high-confidence themes (>0.7)
- Prefer high-weight themes (>0.5)
- Review controversial themes carefully

### 5. Performance Optimization

**Large Datasets**:
- Batch paper processing (max 50 papers per extraction)
- Monitor full-text retrieval rate
- Use fast mode for repeated extractions

**Network Considerations**:
- Stable connection required for WebSocket progress
- Fallback to polling if WebSocket fails
- Cancel and retry if progress stalls >30 seconds

### 6. Error Handling

**Common Issues**:
- Authentication timeout → Re-login required
- WebSocket disconnection → Progress lost, retry extraction
- Full-text retrieval failure → Uses abstracts (quality may decrease)
- Theme extraction timeout (>5 minutes) → Reduce paper count

**Retry Strategy**:
- Stage 1 (Save Papers): Automatic retry (3 attempts)
- Stage 2 (Full-Text): Continues with available content
- Stage 4 (Extraction): Manual retry required

---

## Performance Considerations

### Frontend Optimizations

**RAF-Batched Updates**:
- Progress updates batched via `requestAnimationFrame`
- Reduces re-renders by ~90%
- Ensures smooth UI during rapid backend updates

**Memoization**:
- All handlers wrapped in `useCallback`
- Stable dependencies to prevent re-creation
- Prevents unnecessary child component re-renders

**Component Size**:
- ThemeExtractionContainer: <400 lines (Phase 10.935)
- Business logic extracted to hooks
- Improved code splitting and tree shaking

### Backend Optimizations

**Parallel Processing**:
- Full-text fetching: 5 concurrent requests
- Theme extraction: Batch processing (10 papers per batch)

**Caching**:
- Full-text content cached (24 hours)
- Theme extraction results cached per paper set

**Rate Limiting**:
- Full-text APIs: Respects rate limits (100 req/min for Unpaywall)
- AI extraction: Token rate limiting (10K tokens/min)

### Memory Management

**Frontend**:
- Cleanup WebSocket connections on unmount
- Clear progress state after completion
- Limit stored theme count (max 200)

**Backend**:
- Stream processing for large papers
- Garbage collection after extraction
- Temp file cleanup

---

## Troubleshooting

### Issue: Extraction Stalls at Stage 2

**Symptoms**:
- Progress stuck at 15-40%
- No WebSocket updates for >30 seconds

**Causes**:
- Full-text APIs rate limited or down
- Network connectivity issues
- WebSocket connection lost

**Solutions**:
1. Check browser console for WebSocket errors
2. Cancel extraction and retry
3. Reduce paper count if rate limiting suspected
4. Use "Fast Mode" to skip full-text fetching (uses abstracts only)

### Issue: Zero Themes Extracted

**Symptoms**:
- Extraction completes successfully
- No themes displayed

**Causes**:
- Papers lack sufficient content (abstracts too short)
- Content quality too low (confidence scores <0.3)
- Purpose-specific filters too strict

**Solutions**:
1. Check paper selection (ensure >150 words per abstract)
2. Verify full-text retrieval success rate (should be >30%)
3. Try different extraction purpose
4. Review backend logs for extraction errors

### Issue: Progress Modal Won't Close

**Symptoms**:
- Extraction completes
- Modal remains open
- Can't interact with themes

**Causes**:
- WebSocket connection not properly closed
- Progress state not cleared
- React state update race condition

**Solutions**:
1. Manually close modal (X button)
2. Refresh page (themes preserved in store)
3. Check browser console for React errors
4. Clear localStorage and retry

### Issue: Research Questions Not Generating

**Symptoms**:
- Click "Generate Questions" button
- Loading state never completes
- No questions displayed

**Causes**:
- No themes selected
- API timeout (>30 seconds)
- Backend service unavailable

**Solutions**:
1. Ensure at least 2 themes selected
2. Check browser network tab for API errors
3. Retry with fewer themes (3-5 recommended)
4. Verify backend service health

### Issue: Survey Export Fails

**Symptoms**:
- Click export button
- Error toast displayed
- No download triggered

**Causes**:
- Browser blocks blob download
- Survey data incomplete
- Export format not supported

**Solutions**:
1. Check browser console for security errors
2. Allow downloads from site
3. Try different export format (JSON vs. CSV)
4. Verify survey was fully generated (check metadata)

---

## Related Documentation

- [COMPREHENSIVE_CODE_REVIEW_NOV_29.md](./COMPREHENSIVE_CODE_REVIEW_NOV_29.md) - Full system audit
- [PHASE_10.935_IMPLEMENTATION_GUIDE.md](./PHASE_10.935_IMPLEMENTATION_GUIDE.md) - Component refactoring
- [PHASE_10.101_COMPLETE.md](./PHASE_10.101_COMPLETE.md) - Recent improvements

## API Reference

- [useExtractionWorkflow Hook](./frontend/lib/hooks/useExtractionWorkflow.ts)
- [useThemeApiHandlers Hook](./frontend/lib/hooks/useThemeApiHandlers.ts)
- [useResearchOutputHandlers Hook](./frontend/lib/hooks/useResearchOutputHandlers.ts)
- [ThemeExtractionContainer Component](./frontend/app/(researcher)/discover/literature/containers/ThemeExtractionContainer.tsx)

---

**Last Updated**: Phase 10.101 (November 29, 2024)
**Maintained By**: Development Team
**Version**: 1.0.0
