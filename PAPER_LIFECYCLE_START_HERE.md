# Paper Lifecycle Workflow - START HERE

## Overview

This documentation package provides a complete understanding of how papers move through the VQMethod system from initial search through Q-sort completion.

**Total Documentation:** 2,241 lines across 3 files

---

## Which Document Should You Read?

### For a Quick Overview (5 minutes)
Start with: **PAPER_LIFECYCLE_QUICK_REF.md**
- 5-stage pipeline overview
- Key files and tables
- Common operations
- Troubleshooting tips

### For Complete Understanding (30 minutes)
Read: **PAPER_LIFECYCLE_ANALYSIS.md**
- 5-stage detailed breakdown with architecture
- Complete database schema with ER diagrams
- Frontend state management patterns
- API endpoints and flow diagrams
- Implementation status for each feature

### For Implementation Details (20 minutes)
Study: **PAPER_LIFECYCLE_CODE_EXAMPLES.md**
- Actual code snippets from the codebase
- Frontend component patterns
- Backend service implementations
- Database operations examples
- API integration samples

---

## The 5 Stages at a Glance

```
SEARCH (17 sources) → SAVE (database) → CORPUS (organize) → EXTRACT (themes) → Q-SORT (statements)
```

| Stage | What | Status | Phase |
|-------|------|--------|-------|
| 1. Search | Query 17 academic sources | ✅ Complete | 10.6+ |
| 2. Save | Add papers to user library | ✅ Complete | 10.93 |
| 3. Corpus | Organize papers by research purpose | ✅ Complete | 10.18 |
| 4. Extract | Extract themes from full-text | ✅ Complete | 10.8-10.18 |
| 5. Q-Sort | Generate statements for survey | ✅ Complete | 10.0+ |

---

## Key Facts You Need to Know

### Paper Flow
```
Papers (Search Results)
  ↓ User saves
Database (papers table)
  ↓ Async full-text fetch
Papers + Full-text (fullText column)
  ↓ User creates corpus
Extraction Corpus (organized by research purpose)
  ↓ AI extraction
Unified Themes (unified_themes table)
  ↓ AI conversion
Statements (statements table)
  ↓ Participant sorts
Q-Sort Responses (q_sorts table)
```

### State Management (Frontend)
```
Zustand Stores:
- paper-management.store.ts (690 lines)
  └─ Paper selection + library management
  
- theme-extraction.store.ts (315 lines)
  └─ Theme tracking + extraction progress
  
- literature-search.store.ts
  └─ Search results + filters
```

### Database
```
13 Core Tables:
- papers, paper_collections, extraction_corpus
- unified_themes, theme_sources, theme_provenance, processed_literature
- statements, statement_provenance
- surveys, q_sorts, responses

1,896 lines of Prisma schema
```

### Rate Limiting
- Backend limit: 100 req/60 sec = 1.67 req/sec
- Our config: Sequential + 700ms = 1.43 req/sec (safe)
- Fixed in Phase 10.93 (was causing 429 errors)

---

## Core Files (Absolute Paths)

### Frontend Stores
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/paper-management.store.ts`
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/stores/theme-extraction.store.ts`

### Frontend API
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/services/literature-api.service.ts`
- `/Users/shahabnazariadli/Documents/blackQmethhod/frontend/lib/services/theme-extraction/paper-save.service.ts`

### Backend Services
- `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/literature.service.ts`
- `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/literature.controller.ts`

### Database
- `/Users/shahabnazariadli/Documents/blackQmethhod/backend/prisma/schema.prisma`
- `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/types/paper-save.types.ts`

---

## Common Questions Answered

### How are papers saved?
1. User clicks "Save Paper" on search result
2. Frontend calls `usePaperManagementStore.handleSavePaper(paper)`
3. Optimistic UI update (paper marked as saved immediately)
4. Backend validates (title + source required) and checks duplicates
5. Paper record created in database
6. Async job queues full-text fetch (non-blocking)

**Key File:** paper-management.store.ts + literature.service.ts

### How do themes get extracted?
1. User creates corpus (groups papers by research purpose)
2. User selects extraction mode (batch or incremental)
3. Backend loads papers with full-text
4. Full-text checked against ProcessedLiterature cache
5. If missing: async fetch from PDF/HTML, cache it
6. AI (GPT-4 Turbo) extracts themes from full-text
7. Themes stored with provenance (which papers contributed)
8. Saturation detection: stop if <5% new themes

**Key Files:** theme-extraction.service.ts + paper-save.service.ts

### How do statements get created?
1. User selects extracted themes
2. AI converts themes to Q-statements
3. Each statement linked back to source paper/theme
4. Full provenance chain: paper → theme → statement
5. Statements grouped into survey
6. Q-grid configured (e.g., -3 to +3 Likert scale)

**Key File:** theme-to-statement.service.ts

### What's the rate limiting issue?
**Problem:** Phase 10.93 before fix had 3 concurrent saves + 500ms = 6 req/sec (exceeds 1.67 limit)
**Solution:** Sequential saves + 700ms delay = 1.43 req/sec (within limit)
**Impact:** Prevents 429 "too many requests" errors

**Key File:** paper-save.service.ts (lines 51-53)

### How is full-text managed?
**Async Fetch:** Non-blocking background job (doesn't slow down UI)
**Caching:** ProcessedLiterature table stores full-text + embeddings (per user/paper)
**Cost Tracking:** extractionCount field tracks reuse for cost analysis
**Status:** fullTextStatus field shows: not_fetched → fetching → success|failed

**Key File:** PDFQueueService + ProcessedLiterature table

---

## Architecture Principles

### Separation of Concerns
- **Controller:** HTTP routing only (literature.controller.ts)
- **Service:** Business logic (literature.service.ts)
- **Source Services:** External API adapters (ArxivService, PubMedService, etc.)
- **Frontend Stores:** Client-side state (Zustand)

### State Management
- **Zustand stores** for predictable updates
- **Set<string>** for O(1) paper lookups
- **Optimistic UI** updates with backend sync
- **Debounced** library refresh (500ms)

### Data Persistence
- **SQLite database** via Prisma ORM
- **JSON columns** for arrays/complex data
- **Unique indexes** for duplicate prevention
- **Foreign keys** for relationship integrity

### Performance
- **Batch operations** with rate limiting
- **Full-text caching** to avoid refetch
- **WebSocket progress** for real-time updates
- **Async background** jobs for long-running tasks

---

## Example: Complete Paper Lifecycle (Step-by-Step)

```
1. USER SEARCHES
   → Frontend: literatureAPI.searchLiterature(query)
   → Backend: searches 17 sources in parallel
   → Result: transient search results (not saved)

2. USER SAVES PAPER
   → Frontend: usePaperManagementStore.handleSavePaper(paper)
   → Backend: POST /literature/papers/save
   → Database: INSERT INTO papers (title, authors, year, doi, source, ...)
   → Async: Queue full-text fetch via PDFQueueService
   → Result: Paper stored, UI updated

3. USER CREATES CORPUS
   → Frontend: Select papers from library
   → Database: INSERT INTO extraction_corpus (name, purpose, paperIds)
   → Result: Organized collection ready for extraction

4. USER EXTRACTS THEMES
   → Frontend: literatureAPI.extractThemes({ corpusId, paperIds, purpose })
   → Backend: Load papers + full-text (from cache if available)
   → AI: Call GPT-4 Turbo to extract themes
   → Database: INSERT INTO unified_themes, theme_sources, theme_provenance
   → WebSocket: Send real-time progress updates
   → Result: Themes extracted + saturation checked

5. USER GENERATES STATEMENTS
   → Frontend: literatureAPI.generateStatements(themeIds)
   → AI: Convert themes to Q-statements
   → Database: INSERT INTO statements, statement_provenance
   → Result: Statements ready for Q-sort survey

6. PARTICIPANT SORTS
   → Frontend: Participant sorts statements (-3 to +3)
   → Database: INSERT INTO q_sorts (position)
   → Result: Q-methodology analysis data collected
```

---

## Troubleshooting Quick Reference

| Problem | Cause | Solution |
|---------|-------|----------|
| Papers not in library | Save failed silently | Check `fullTextStatus` field |
| 429 Rate Limit Errors | Too fast concurrent saves | Already fixed in Phase 10.93 |
| Themes not extracting | Full-text missing/too short | Check `fullTextWordCount` > 150 |
| WebSocket not updating | Connection dropped | Manual refresh or check logs |
| Missing full-text | Async fetch pending | Check `fullTextStatus` = 'fetching' |

---

## Related Documentation

### In This Repository
- PAPER_LIFECYCLE_ANALYSIS.md - Comprehensive 5-stage breakdown
- PAPER_LIFECYCLE_QUICK_REF.md - Quick reference guide
- PAPER_LIFECYCLE_CODE_EXAMPLES.md - Implementation samples

### Main Docs
- Main Docs/PHASE_TRACKER_PART3.md - Architecture principles
- Main Docs/IMPLEMENTATION_GUIDE_PART6.md - Development patterns
- Main Docs/LOCALSTORAGE_QUOTA_FIX.md - Browser storage optimization

### Analysis Docs
- LITERATURE_COMPONENTS_MAP.md
- LITERATURE_PAGE_ANALYSIS.md
- THEME_EXTRACTION_WORKFLOW_ANALYSIS.md
- ROOT_CAUSE_ANALYSIS_IDENTIFIER_ARCHITECTURE.md

---

## Getting Started

### For New Team Members
1. Read this file (5 min)
2. Read PAPER_LIFECYCLE_QUICK_REF.md (10 min)
3. Browse PAPER_LIFECYCLE_ANALYSIS.md (15 min)
4. Study relevant code files (30 min)

### For Implementation
1. Review PAPER_LIFECYCLE_CODE_EXAMPLES.md for patterns
2. Check absolute file paths for relevant modules
3. Use rate limiting config from Phase 10.93
4. Follow separation of concerns pattern

### For Debugging
1. Check troubleshooting table above
2. Review Stage-specific sections in PAPER_LIFECYCLE_ANALYSIS.md
3. Search for relevant service in backend/src/modules/literature/
4. Check database schema in backend/prisma/schema.prisma

---

## Key Metrics

- **5 Stages:** 100% complete
- **17 Academic Sources:** Integrated
- **2,241 Lines:** Documentation
- **690 Lines:** Paper management store
- **315 Lines:** Theme extraction store
- **1,896 Lines:** Database schema
- **1.43 req/sec:** Paper save rate (safe)
- **365 days:** Approx. development (Phase 9.0 → 10.96)

---

## Last Updated

Created: November 23, 2025
Covers: Phases 9.0 through 10.96

---

## Need Help?

1. Check the 3 documentation files in order of detail
2. Search for your topic in PAPER_LIFECYCLE_ANALYSIS.md
3. Look for code examples in PAPER_LIFECYCLE_CODE_EXAMPLES.md
4. Check absolute file paths for source code
5. Review Related Documentation links above

