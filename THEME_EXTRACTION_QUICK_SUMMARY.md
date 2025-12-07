# Theme Extraction Workflow - Quick Summary

## What Is It?
The theme extraction workflow is a comprehensive system that:
1. Takes research papers (+ videos/podcasts)
2. Extracts key themes/concepts using AI
3. Generates research outputs (Q-statements, hypotheses, surveys)
4. Tracks full provenance (which papers influenced which themes)

## The Architecture

### Frontend (4 Stages)
```
Stage 1: Save papers to database (0-15%)
Stage 2: Fetch full-text content (15-40%)
Stage 3: Prepare sources for extraction (40%)
Stage 4: Send to backend for theme extraction (40-100%)
```

### Backend (6 Stages)
```
Stage 1: Familiarization (0-15%)   - Generate embeddings
Stage 2: Initial Coding (15-30%)   - Extract keywords
Stage 3: Theme Generation (30-60%) - Synthesize themes
Stage 4: Theme Review (60-75%)     - Deduplicate
Stage 5: Theme Definition (75-90%) - Label & describe
Stage 6: Report Production (90-100%) - Format output
```

## Key Components

### Backend Services
- **UnifiedThemeExtractionService** - Main extraction engine
- **EnhancedThemeIntegrationService** - Research output generation
- **KnowledgeGraphService** - Theme relationship mapping

### Frontend Services
- **ExtractionOrchestratorService** - Workflow coordination
- **ThemeExtractionService** - Validation & content analysis
- **FullTextExtractionService** - PDF content fetching
- **PaperSaveService** - Database persistence

### Stores & Hooks
- **ThemeExtractionStore** - Zustand store for theme state
- **useExtractionWorkflow** - Main orchestration hook

### Components
- **ThemeExtractionContainer** - Main UI container
- **ThemeExtractionProgressModal** - Real-time progress
- **PurposeSelectionWizard** - Research goal selection

## Research Output Generation

Once themes are extracted, the system can generate:

### 1. Research Questions
- SQUARE-IT framework compliant
- 4 types: exploratory, explanatory, evaluative, descriptive
- Relevance scoring
- Methodology suggestions

### 2. Hypotheses
- 5 types: correlational, causal, mediation, moderation, interaction
- Variable identification
- Confidence scoring
- Statistical test recommendations

### 3. Construct Mappings
- Theme clustering
- Relationship detection
- 5 relationship types

### 4. Complete Surveys
- 5-section structure (intro, demographics, main items, checks, debrief)
- Likert scales, multiple choice, semantic differential, open-ended
- Theme provenance per item
- Completion time estimation

## Purpose-Adaptive Extraction

The system adapts theme extraction based on research purpose:

| Purpose | Themes | Focus | Rigor |
|---------|--------|-------|-------|
| Q-Methodology | 30-80 | Breadth | Rigorous |
| Survey Construction | 5-15 | Depth | Publication-ready |
| Qualitative Analysis | 5-20 | Saturation | Rigorous |
| Literature Synthesis | 10-25 | Comprehensive | Publication-ready |
| Hypothesis Generation | 8-15 | Theory-building | Rigorous |

## AI Integration

### Preferred (FREE)
- Groq LLama 3.3-70b for text generation
- No API costs

### Required (PAID)
- OpenAI text-embedding-3-small for semantic analysis
- No free alternative available

### Fallback
- Template-based generation if no AI APIs
- Conservative thresholds for scoring

## Current Completeness

### What's Complete (95%+)
- ✅ Multi-source theme extraction
- ✅ Full provenance tracking
- ✅ Research question generation
- ✅ Hypothesis generation
- ✅ Survey generation
- ✅ WebSocket progress tracking

### What's Partial (50-90%)
- ⚠️ Knowledge graph integration (20%)
- ⚠️ Q-methodology integration (30%)
- ⚠️ Saturation detection (70%)

### What's Missing (0-30%)
- ❌ Q-statement generation
- ❌ Concourse development
- ❌ Statement diversity validation
- ❌ Graph visualization

## Integration Gaps

### High Priority Missing
1. **Q-Statement Generation** - No automatic concourse development
2. **Knowledge Graph UI** - Graph infrastructure exists but no visualization
3. **Incremental Merging** - Single extraction works, but batch updates need theme reconciliation

### How to Complete Integration
1. Create `ThemeToQStatementService`
2. Connect KnowledgeGraphService to theme results
3. Build graph visualization component
4. Add incremental theme reconciliation logic

## Files to Know

### Main Backend Files
- `/backend/src/modules/literature/services/unified-theme-extraction.service.ts` (1400+ lines)
- `/backend/src/modules/literature/services/enhanced-theme-integration.service.ts` (1228 lines)

### Main Frontend Files
- `/frontend/lib/services/theme-extraction/extraction-orchestrator.service.ts`
- `/frontend/app/(researcher)/discover/literature/containers/ThemeExtractionContainer.tsx`
- `/frontend/lib/stores/theme-extraction.store.ts`

### Full Analysis
See: `THEME_EXTRACTION_WORKFLOW_ANALYSIS.md` (706 lines)

## Quick Facts

- **Max sources per request:** 500 papers
- **Typical extraction time:** 30-60 seconds for 100 papers
- **AI cost:** Primarily OpenAI embeddings ($0.02 per 1M tokens)
- **Caching:** 1-hour TTL for deduplication
- **Theme limit:** 15 themes per extraction (configurable)
- **Confidence threshold:** 0.5 minimum (0-1 scale)
- **Similarity threshold:** 0.8 for merging themes

## Data Flow

```
User selects papers
    ↓
Choose research purpose (Q-method, survey, etc.)
    ↓
System analyzes content
    ↓
Frontend Stage 1-3: Prepare papers
    ↓
Backend Stage 1-6: Extract themes
    ↓
Store themes in database
    ↓
Generate research outputs (questions, hypotheses, survey)
    ↓
Display results to user
```

---

For detailed analysis, see: `THEME_EXTRACTION_WORKFLOW_ANALYSIS.md`
