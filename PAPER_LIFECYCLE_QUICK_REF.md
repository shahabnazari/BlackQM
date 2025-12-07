# Paper Lifecycle - Quick Reference Guide

## 5-Stage Pipeline

```
SEARCH (17 sources) → SAVE (database) → CORPUS (organize) → EXTRACT (themes) → Q-SORT (statements)
```

---

## Stage Details at a Glance

### Stage 1: SEARCH
- **What:** Query 17 academic sources
- **Where:** `/discover/literature/page.tsx`
- **Store:** `literature-search.store.ts`
- **Result:** Transient search results (not saved)

### Stage 2: SAVE
- **What:** Add papers to user's library
- **Where:** Database `papers` table
- **Store:** `paper-management.store.ts`
- **API:** `POST /literature/papers/save`
- **Validation:** Title + source required, duplicate check

### Stage 3: CORPUS
- **What:** Organize papers into research collections
- **Where:** Database `extraction_corpus` table
- **Purpose:** `literature_synthesis` | `hypothesis_generation` | `gap_analysis` | etc.
- **Features:** Saturation detection, iteration tracking

### Stage 4: EXTRACT
- **What:** Extract themes from paper full-text
- **Where:** Database `unified_themes` + `theme_sources` + `theme_provenance`
- **Store:** `theme-extraction.store.ts`
- **Modes:** Batch (all at once) or Incremental (iterative)
- **Cache:** `processed_literature` table (per user/paper)
- **Progress:** WebSocket updates (Phase 10.8)

### Stage 5: Q-SORT
- **What:** Generate statements from themes
- **Where:** Database `statements` + `statement_provenance`
- **Create:** Survey with Q-grid configuration
- **Track:** Full provenance from paper → theme → statement

---

## Key Files

### Frontend
| File | Purpose |
|------|---------|
| `frontend/lib/stores/paper-management.store.ts` | Paper selection + library management |
| `frontend/lib/stores/theme-extraction.store.ts` | Theme tracking + progress |
| `frontend/lib/services/literature-api.service.ts` | API calls |
| `frontend/lib/services/theme-extraction/paper-save.service.ts` | Batch paper save |
| `frontend/app/(researcher)/discover/literature/page.tsx` | Search UI |

### Backend
| File | Purpose |
|------|---------|
| `backend/src/modules/literature/literature.controller.ts` | HTTP endpoints |
| `backend/src/modules/literature/literature.service.ts` | Business logic |
| `backend/prisma/schema.prisma` | Database schema |
| `backend/src/modules/literature/services/theme-extraction.service.ts` | Theme extraction |

---

## Database Tables

### Core Paper Management
- **papers** - User's saved papers (title, authors, year, doi, source, fullText, wordCount, etc.)
- **paper_collections** - User's paper collections
- **extraction_corpus** - Research corpuses for iterative extraction

### Theme Management
- **unified_themes** - Extracted themes (label, keywords, weight)
- **theme_sources** - Which papers/videos contributed to each theme
- **theme_provenance** - Statistical breakdown (65% papers, 25% videos, etc.)
- **processed_literature** - Cached full-text + embeddings (avoid refetching)

### Survey & Q-sort
- **statements** - Generated Q-statements (with provenance)
- **statement_provenance** - Links back to source paper/theme
- **surveys** - Q-sort survey configuration
- **q_sorts** - Participant responses (-3 to +3 positions)

---

## State Management Architecture

### paper-management.store.ts (Zustand)
```typescript
{
  selectedPapers: Set<string>,        // For bulk operations
  savedPapers: Paper[],                // User's library
  extractingPapers: Set<string>,       // Currently processing
  extractedPapers: Set<string>,        // Already extracted
  
  // Actions
  handleSavePaper(paper),
  handleRemovePaper(paperId),
  togglePaperSelection(paperId),
  loadUserLibrary()
}
```

### theme-extraction.store.ts (Zustand)
```typescript
{
  unifiedThemes: UnifiedTheme[],       // Extracted themes
  selectedThemeIds: string[],          // User selections
  extractingPapers: Set<string>,       // Being processed
  extractedPapers: Set<string>,        // Already done
  
  extractionProgress: {
    stage, percentage, paperCount, papersProcessed
  },
  
  // Results
  researchQuestions: [],
  hypotheses: [],
  generatedSurvey: null
}
```

---

## API Endpoints Quick Reference

### Search
- `POST /literature/search` - Search papers

### Papers
- `POST /literature/papers/save` - Save paper
- `DELETE /literature/papers/{id}` - Remove paper
- `GET /literature/papers` - Get library
- `GET /literature/papers/{id}` - Get paper details

### Full-text
- `POST /literature/fulltext/{paperId}` - Fetch full-text
- `GET /literature/fulltext/{paperId}/status` - Check fetch status

### Themes
- `POST /literature/themes/extract` - Batch extraction
- `POST /literature/themes/extract-incremental` - Iterative extraction
- `GET /literature/themes` - Get extracted themes
- `DELETE /literature/themes/{id}` - Remove theme

### Statements
- `POST /literature/themes/to-statements` - Generate statements

---

## Common Operations

### Save Papers
```typescript
// Single paper
const store = usePaperManagementStore();
await store.handleSavePaper(paper);

// Batch (from service)
const saveService = new PaperSaveService();
const result = await saveService.batchSave(papers, {
  signal: abortController.signal,
  onProgress: (msg) => setStatus(msg)
});
```

### Extract Themes
```typescript
// Batch extraction
const response = await literatureAPI.extractThemes({
  corpusId: 'corpus-123',
  paperIds: selectedIds,
  purpose: 'hypothesis_generation',
  userExpertiseLevel: 'advanced'
});

// Incremental extraction
const response = await literatureAPI.extractThemesIncremental({
  corpusId: 'corpus-123',
  newPaperIds: [newPaperId],
  previousThemeIds: existingThemeIds
});
```

### Generate Statements
```typescript
const result = await literatureAPI.generateStatements({
  themeIds: selectedThemeIds,
  surveyId: 'survey-123',
  statementCount: 3
});
```

---

## Implementation Status Summary

| Feature | Status | Phase | Notes |
|---------|--------|-------|-------|
| 17 source search | ✅ | 10.6+ | ArXiv, PubMed, Springer, IEEE, etc. |
| Paper saving | ✅ | 10.93 | Rate-limited batch save (700ms/paper) |
| Full-text fetching | ✅ | 10.5+ | Async background job |
| Word counting | ✅ | 10.5+ | Total + abstract only |
| Quality scoring | ✅ | 10.5+ | 0-100 score, eligibility check |
| Corpus management | ✅ | 10.18 | Organization + iteration tracking |
| Batch extraction | ✅ | 10.0+ | All papers at once |
| Incremental extraction | ✅ | 10.18 | Iterative with saturation detection |
| Full-text caching | ✅ | 10.18 | ProcessedLiterature table |
| WebSocket progress | ✅ | 10.8 | Real-time extraction updates |
| Statement generation | ✅ | 10.0+ | Theme → statements |
| Provenance tracking | ✅ | 9.20+ | Paper → theme → statement chain |

---

## Rate Limiting & Performance

### Paper Saving Rate Limit
- **Backend limit:** 100 requests / 60 seconds = 1.67 req/sec
- **Our config:** Sequential saves (1 concurrent) + 700ms delay = 1.43 req/sec
- **Safe margin:** 15% below limit

### Full-text Fetching
- **Async background job:** Non-blocking
- **Cache:** ProcessedLiterature table (avoids refetch)
- **Cost tracking:** extractionCount field

### Theme Extraction
- **Batch:** Process all papers at once
- **Incremental:** Add new papers + re-process existing (with cache)
- **Saturation:** Stop when no new themes detected

---

## Troubleshooting

### Issue: Papers not appearing in library
**Cause:** Backend save failed silently
**Fix:** Check `fullTextStatus` field - if 'failed', trigger retry

### Issue: 429 Rate Limit Errors
**Cause:** Too fast concurrent saves
**Fix:** Already fixed in Phase 10.93 (700ms sequential)

### Issue: Themes not extracting
**Cause:** Full-text missing or too short (< 150 words)
**Fix:** Check `fullTextStatus` and `fullTextWordCount`

### Issue: WebSocket not updating progress
**Cause:** WebSocket connection dropped
**Fix:** Manual refresh, or check client logs

---

## Key Concepts

### Theoretical Saturation
When extracting themes iteratively:
- After each batch, check if new themes decreased
- If <5% new themes after N papers → likely saturated
- Store confidence level (0-1) in ExtractionCorpus

### Provenance Chain
Every statement has complete citation lineage:
```
Paper (title, authors, year, doi)
  ↓ contains full-text
Paper.fullText (10,000+ words)
  ↓ analyzed by AI
UnifiedTheme (label, keywords)
  ↓ converted to statement
Statement (text, perspective)
  ↓ sorted by participant
QSort (position: -3 to +3)
```

### Q-Methodology
- Q-sort uses -3 to +3 scale (7-point Likert-like)
- Participants rank statements by agreement/disagreement
- Reveals different perspectives/viewpoints in population
- Papers → themes → statements enable evidence-based Q-design

---

## Related Documentation

- **PAPER_LIFECYCLE_ANALYSIS.md** - Comprehensive detailed guide
- **Main Docs/PHASE_TRACKER_PART3.md** - Architecture principles
- **Main Docs/IMPLEMENTATION_GUIDE_PART6.md** - Development patterns
