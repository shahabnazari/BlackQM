# VQMethod Phase Tracker - Part 4 (Phases 11-20) - FUTURE ROADMAP

> **DOCUMENTATION RULE**: This tracker must remain concise. NO code blocks, NO verbose explanations, NO implementation details. Keep entries to: Problem → Solution → Tasks → Success Criteria. Detailed specs belong in separate implementation documents.

**Purpose:** Long-term future phases roadmap for world-class research platform expansion
**Part 1:** [PHASE_TRACKER_PART1.md](./PHASE_TRACKER_PART1.md) - Phases 1-8
**Part 2:** [PHASE_TRACKER_PART2.md](./PHASE_TRACKER_PART2.md) - Phases 8.5-9.5
**Part 3:** [PHASE_TRACKER_PART3.md](./PHASE_TRACKER_PART3.md) - Phase 10 (Current Work)
**Part 4:** You are here - Phases 11-20 (Future Roadmap)
**Status:** Phase 10 In Progress | Phase 11-20 Future Roadmap

---

## ARCHITECTURAL PRINCIPLES (Apply to All Future Phases)

**Pattern Source:** Phase 10.6 Day 3.5 + Phase 10.91 Days 1-17 + Phase 10.943 (Proven Patterns)

### Core Principles
- **Services:** < 300 lines, single responsibility only
- **State Management:** Zustand stores (state machine architecture)
- **Components:** < 400 lines (hard limit)
- **Functions:** < 100 lines (hard limit)
- **Test Coverage:** 70%+ minimum (85%+ target)
- **Type Safety:** Zero `any`, zero `@ts-ignore`, zero unsafe `as`
- **Error Classes:** Step-specific errors with context preservation
- **Feature Flags:** Gradual rollout for risky changes
- **Zero Technical Debt:** Fix violations immediately
- **Enterprise Logging:** Zero `console.*` in production code (see below)

### References
- Service Pattern: Phase 10.6 Day 3.5 (semantic-scholar.service.ts)
- Refactoring Pattern: Phase 10.91 Days 1-17
- State Machine: Phase 10.93 (useThemeExtractionStore)
- Architecture: frontend/app/(researcher)/discover/literature/ARCHITECTURE.md
- Migration Guide: PHASE_10.91_MIGRATION_GUIDE.md
- **Logging Compliance: PHASE_10.943_LOGGER_MIGRATION_COMPLETE.md**

---

## 🔒 ENTERPRISE LOGGING COMPLIANCE (MANDATORY - Phase 10.943)

> **All new development MUST comply with the enterprise logging system. Zero tolerance for violations.**

### Logging Rules (PR Blocking):

| Rule | Requirement | Enforcement |
|------|-------------|-------------|
| No `console.*` | Use enterprise logger only | PR rejection |
| Structured logs | `logger.info(msg, context, data)` | Code review |
| Error context | All catch blocks must log | Lint warning |
| Correlation IDs | Capture from API headers | Required for APIs |
| WebSocket errors | Log AND emit to client | Gateway requirement |

### Quick Reference:

**Frontend:**
```
import { logger } from '@/lib/utils/logger';
logger.info('Message', 'ComponentName', { data });
logger.error('Error', 'ServiceName', { error, errorMessage: error.message });
```

**Backend (NestJS):**
```
private readonly logger = new Logger(ClassName.name);
this.logger.log('Message', { context, data });
this.logger.error('Error', { error: error.message, stack: error.stack });
```

### Pre-Merge Checklist:
- [ ] Run: `grep -r "console\." <changed-files>` = 0 results (except dev blocks)
- [ ] All catch blocks have logger.error() calls
- [ ] Context names follow registry pattern (PascalCase)
- [ ] WebSocket events include correlationId

### Context Name Registry:
- API Services: `{Name}APIService` (e.g., `LiteratureAPIService`)
- Hooks: `{Name}Handlers` or `use{Name}` (e.g., `ThemeExtractionHandlers`)
- Components: `{ComponentName}` (e.g., `PaperActions`)
- Stores: `{Name}Store` (e.g., `ThemeExtractionStore`)
- Gateways: `{Name}Gateway` or `{Name}WS` (e.g., `ThemeExtractionProgressWS`)

---

## PHASE 10.93: THEME EXTRACTION WORKFLOW REFACTORING - ✅ COMPLETE

**Duration:** 11 days | **Status:** ✅ COMPLETE | **Quality:** 10/10
**Completed:** November 2025

### Implementation Summary
Complete refactoring from 1,077-line callback to modular service architecture.

### Services Created (frontend/lib/services/theme-extraction/)
| Service | Lines | Purpose |
|---------|-------|---------|
| theme-extraction.service.ts | 405 | Core theme extraction |
| paper-save.service.ts | 362 | Paper persistence |
| fulltext-extraction.service.ts | ~300 | Full-text fetching |
| retry.service.ts | 306 | Exponential backoff + jitter |
| circuit-breaker.service.ts | 346 | Martin Fowler pattern |
| error-classifier.service.ts | 349 | 10 error categories |
| performance-metrics.service.ts | 374 | High-precision timing |
| eta-calculator.service.ts | 390 | Rolling window average |

### E2E Test Suite (frontend/e2e/)
| Test File | Coverage |
|-----------|----------|
| theme-extraction-workflow.spec.ts | Success flow, cancellation, large batch |
| theme-extraction-error-injection.spec.ts | Timeouts, rate limits, partial failures |
| theme-extraction-performance.spec.ts | Render count, memory leaks, timing |
| cross-browser-theme-extraction.spec.ts | Chrome, Firefox, Safari, Edge |
| theme-extraction-6stage.spec.ts | Braun & Clarke 6-stage workflow |

### Success Metrics Achieved
| Metric | Before | After |
|--------|--------|-------|
| Function lines | 1,077 | <100 |
| Test coverage | 0% | 85%+ |
| Success rate | ~70% | >95% |
| Error rate | "a lot" | <1% |

---

## PHASE 10.935: LITERATURE PAGE ARCHITECTURE COMPLETION - ✅ COMPLETE

**Duration:** 13 days | **Status:** ✅ COMPLETE | **Priority:** URGENT
**Completed:** November 2025

### Implementation Summary
All containers are now self-contained with only optional props. Component sizes reduced significantly.

### Container Self-Containment (39 props → 0 required)
| Container | Before | After | Lines |
|-----------|--------|-------|-------|
| LiteratureSearchContainer | 6 required | **0 props** | 402 |
| PaperManagementContainer | 9 required | **1 optional** | 316 |
| ThemeExtractionContainer | 26 required | **1 optional** | 484 |
| GapAnalysisContainer | 4 required | **4 optional** | 371 |

### Component Size Reduction
| Component | Before | After | Reduction |
|-----------|--------|-------|-----------|
| PaperCard.tsx | 961 | **316** | -67% |
| ProgressiveLoadingIndicator.tsx | 812 | **201** | -75% |
| ThemeExtractionContainer.tsx | 688 | **484** | -30% |

### Key Architecture Patterns
- Self-Contained Container Pattern (Phase 10.935)
- Zustand stores for all state management
- Zero prop drilling (all containers usable with 0 args)
- React.memo + useCallback + useMemo optimizations

---

## PHASE 10.94: FULL-TEXT EXTRACTION ENHANCEMENT - ✅ COMPLETE

**Duration:** 14 days | **Status:** ✅ COMPLETE | **Priority:** HIGH
**Completed:** November 2025

### Implementation Summary
All planned components implemented with enterprise-grade architecture (different names, same/better functionality).

| Component | Implementation | File |
|-----------|---------------|------|
| Identifier Enrichment | ✅ | `identifier-enrichment.service.ts` |
| Source Routing | ✅ | 4-Tier Waterfall in `pdf-parsing.service.ts` |
| GROBID Integration | ✅ | `grobid-extraction.service.ts` (Tier 2.5) |
| HTML Full-Text | ✅ | `html-full-text.service.ts` |
| Backend Orchestrator | ✅ | `pdf-parsing.service.ts` processFullText() |
| Frontend Orchestrator | ✅ | `extraction-orchestrator.service.ts` |
| Frontend Fulltext Service | ✅ | `fulltext-extraction.service.ts` (retry, circuit breaker, ETA) |
| Frontend Store | ✅ | `theme-extraction.store.ts` (Zustand, 315 lines) |

### Implemented 4-Tier Waterfall
```
Tier 1: Database cache (instant)
Tier 2: PMC API + HTML scraping (40-50% coverage)
Tier 2.5: GROBID PDF extraction (6-10x better than pdf-parse)
Tier 3: Unpaywall PDF (25-30% coverage)
Tier 4: Direct publisher PDF (MDPI, Frontiers, Sage, Wiley)
Result: 90%+ full-text availability
```

### Key Files Reference
| Category | File Path |
|----------|-----------|
| Identifier Enrichment | `backend/src/modules/literature/services/identifier-enrichment.service.ts` |
| GROBID Service | `backend/src/modules/literature/services/grobid-extraction.service.ts` |
| HTML Full-Text | `backend/src/modules/literature/services/html-full-text.service.ts` |
| PDF Parsing (Waterfall) | `backend/src/modules/literature/services/pdf-parsing.service.ts` |
| Frontend Orchestrator | `frontend/lib/services/theme-extraction/extraction-orchestrator.service.ts` |
| Frontend Fulltext | `frontend/lib/services/theme-extraction/fulltext-extraction.service.ts` |
| Zustand Store | `frontend/lib/stores/theme-extraction.store.ts` |

### Success Metrics Achieved
- Full-text availability: 90%+ (was 30% PDF-only)
- Word extraction: 6-10x improvement with GROBID
- Enterprise features: Retry, Circuit Breaker, ETA calculation

---

## PHASE 10.942: WORLD-CLASS SEARCH & QUALITY SCORING INTEGRATION - ✅ COMPLETE

**Duration:** 5 days | **Status:** ✅ COMPLETE | **Priority:** CRITICAL
**Completed:** November 2025
**Documentation:** `SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md`, `ENTERPRISE_SEARCH_ENGINE_V4_FINAL.md`

### Implementation Summary
All 5 days completed. Science-backed v4.0 quality scoring fully integrated.

| Day | Task | Status |
|-----|------|--------|
| 1 | BM25 Integration & Backend Metadata | ✅ COMPLETE |
| 2 | Frontend Consistency (30/50/20) | ✅ COMPLETE |
| 2.5 | Enterprise Service Refactoring | ✅ COMPLETE |
| 3 | PaperQualityBadges v4.0 | ✅ COMPLETE |
| 4 | MethodologyModal + PDF Download | ✅ COMPLETE |
| 5 | Testing (MethodologyModal.test.tsx) | ✅ COMPLETE |

### Key Files Implemented
| Component | File |
|-----------|------|
| BM25 Algorithm | `backend/src/modules/literature/utils/relevance-scoring.util.ts` |
| Quality Scoring | `backend/src/modules/literature/utils/paper-quality.util.ts` |
| Quality Badges | `frontend/.../components/paper-card/PaperQualityBadges.tsx` |
| Constants | `frontend/.../components/paper-card/constants.ts` |
| Methodology Modal | `frontend/components/literature/MethodologyModal.tsx` |
| SearchBar Integration | `frontend/.../SearchSection/SearchBar.tsx` (lines 35, 644-670) |
| Tests | `frontend/components/literature/__tests__/MethodologyModal.test.tsx` |

### v4.0 Quality Scoring System
```
Core Weights (100%):
- 30% Citation Impact (FWCI)
- 50% Journal Prestige
- 20% Recency Boost (λ=0.15, half-life 4.6 years)

Optional Bonuses (+20 max):
- +10 Open Access
- +5 Data/Code Shared
- +5 Altmetric Impact
```

### Success Metrics Achieved
| Metric | Before | After |
|--------|--------|-------|
| Relevance Algorithm | Keyword matching | BM25 (+40% precision) |
| Quality Weights Consistency | 3 versions | 1 version (100%) |
| Metadata Accuracy | 40% | 100% |

---

## PHASE 10.96: UNIFIED HEADER DESIGN & THEMES PAGE - ✅ COMPLETE

**Duration:** 1 day | **Status:** ✅ COMPLETE | **Priority:** HIGH
**Completed:** November 2025
**Git Commit:** `b7eb273 feat: Phase 10.96 - Unified header design and dedicated themes page`

### Implementation Summary
Created dedicated themes analysis page with unified header design across the discover section.

### Files Implemented
| File | Lines | Purpose |
|------|-------|---------|
| `frontend/app/(researcher)/discover/themes/page.tsx` | 94 | Dedicated themes analysis page |

### Features Delivered
- [x] Dedicated `/discover/themes` route
- [x] Unified header design with back navigation
- [x] ThemeExtractionContainer integration
- [x] Zustand store integration for theme counts
- [x] Hydration-safe SSR rendering
- [x] Responsive design with mobile support

### Discover Section Status (Post-Phase 10.96)

| Page | Status | Lines | Features |
|------|--------|-------|----------|
| `/discover/literature` | ✅ COMPLETE | ~2,000+ | Multi-source search, paper management, theme extraction |
| `/discover/themes` | ✅ COMPLETE | 94 | Dedicated theme analysis, 6-stage Braun & Clarke workflow |
| `/discover/gaps` | ✅ COMPLETE | 1,439 | AI gap analysis, funding prediction, timeline optimization |
| `/discover/knowledge-map` | ✅ COMPLETE | 1,370 | Knowledge graph, bridge concepts, influence flow |
| `/discover/references` | 🟡 PARTIAL | 912 | Reference management (mock data, needs backend API) |

---

## PHASE 10.97: LITERATURE REVIEW COMPLETION & ENTERPRISE-GRADE FEATURE ENHANCEMENT

**Duration:** 16 days | **Status:** NOT STARTED | **Priority:** CRITICAL
**Dependencies:** Phase 10.96 Complete ✅
**Purpose:** Complete all literature review integrations with ENTERPRISE-GRADE evaluation criteria

### Overview

This phase completes the final integration gaps AND ensures each feature meets enterprise standards:
1. Theme extraction → Q-Statement generation
2. Theme extraction → Survey item generation
3. Knowledge graph → Theme visualization
4. References page → Real backend API
5. Generator UIs → Full functionality
6. **Enterprise evaluation of all features**
7. **Library enhancement with collection management** (NEW)
8. **Corpus Manager dedicated page with methodology explanation** (NEW)

---

## 🔬 ENTERPRISE EVALUATION CRITERIA

Each feature will be evaluated against these criteria:

| Criterion | Description | Weight |
|-----------|-------------|--------|
| **Scientific Rigor** | Based on peer-reviewed methodology, cites academic sources | 25% |
| **Visual Design** | Advanced, professional UI that communicates value | 20% |
| **Value Communication** | Explains WHAT it is, HOW it works, WHY it's useful | 25% |
| **Differentiation** | How we do it better than competitors | 15% |
| **User Guidance** | Tooltips, methodology cards, education | 15% |

---

## 📊 FEATURE EVALUATION MATRIX

### Feature 1: Knowledge Gap Analysis

**Current Status:** Backend 100% | Frontend 100% | Integration 90%

**Scientific Basis:** ✅ EXCELLENT
- 5-Factor Weighted Scoring Model:
  - Novelty (30%) - Gap coverage analysis
  - Feasibility (25%) - Complexity assessment
  - Impact (25%) - Citation prediction via ML
  - Timeliness (10%) - Trend analysis
  - Funding (10%) - Grant alignment scoring
- ML-based predictions (gradient boosting for opportunity scoring)
- Time-series forecasting for trend prediction
- Network analysis for collaboration matching

**What Competitors DON'T Have:**
- Funding probability prediction with grant type suggestions
- Research timeline optimization with critical path analysis
- Collaboration suggestion engine based on expertise gaps
- Q-methodology fit scoring (unique to our platform)

**GAPS IDENTIFIED:**

| Issue | Severity | Fix |
|-------|----------|-----|
| No methodology explanation panel | HIGH | Add "How We Score" expandable card |
| No factor breakdown visualization | HIGH | Add radar/spider chart for 5 factors |
| Missing scientific citations | MEDIUM | Add methodology references panel |
| Console.log statements in production | LOW | Migrate to enterprise logger |

### Feature 2: Knowledge Map Visualization

**Current Status:** Backend 100% | Frontend 100% | Integration 85%

**Scientific Basis:** ✅ EXCELLENT
- Bridge Concept Detection (betweenness centrality algorithm)
- Controversy Detection (citation pattern clustering)
- Influence Flow Tracking (PageRank-like algorithm)
- Missing Link Prediction (Jaccard similarity + ML)
- Emerging Topic Detection (time-series analysis)

**What Competitors DON'T Have:**
- Bridge concept identification connecting disparate research areas
- Controversy clusters showing opposing viewpoints
- Influence flow visualization (how ideas propagate)
- Predicted links (ML-based relationship discovery)
- Emerging topic detection with trajectory forecasting

**GAPS IDENTIFIED:**

| Issue | Severity | Fix |
|-------|----------|-----|
| No "How We Build This" panel | HIGH | Add methodology card explaining graph construction |
| Canvas rendering only | MEDIUM | Consider D3.js force-directed for interactivity |
| Missing node detail sidebar | MEDIUM | Show full node context on selection |
| No legend for edge types | LOW | Add edge type legend |
| Console.log statements | LOW | Migrate to enterprise logger |

### Feature 3: Theme Extraction (6-Stage Braun & Clarke)

**Current Status:** Backend 95% | Frontend 100% | Integration 95%

**Scientific Basis:** ✅ WORLD-CLASS
- Braun & Clarke (2006, 2019) Reflexive Thematic Analysis
- 6-Stage Workflow:
  1. Familiarization - Reading and noting initial impressions
  2. Coding - Systematic labeling of meaningful data segments
  3. Theme Generation - Pattern identification across codes
  4. Theme Review - Refinement and validation
  5. Theme Definition - Naming and describing each theme
  6. Production - Final theme set with provenance
- Purpose-Adaptive Algorithms (PATENT CLAIM #2):
  - Q-Methodology: 30-80 themes (breadth-focused)
  - Survey: 5-15 constructs (depth-focused)
  - Qualitative: 5-20 themes (saturation-driven)
  - Synthesis: 10-25 themes (meta-analytic)
  - Hypothesis: 8-15 themes (theory-building)

**What Competitors DON'T Have:**
- Multi-source extraction (papers, videos, podcasts, social)
- Purpose-adaptive theme counts with academic citations
- Statistical influence tracking per source
- Full provenance chain for reproducibility
- 6-stage transparency with real-time progress

**GAPS IDENTIFIED:**

| Issue | Severity | Fix |
|-------|----------|-----|
| No "About This Methodology" panel | HIGH | Add Braun & Clarke citation card |
| Purpose selection not prominent | MEDIUM | Add methodology picker at start |
| Theme → Q-Statement pipeline missing | HIGH | Create ThemeToStatementModal |
| Theme → Survey pipeline incomplete | HIGH | Complete ThemeImportModal |

### Feature 4: Research Question Generator

**Current Status:** Backend 100% | Frontend 100% | Integration 100%

**Scientific Basis:** ✅ EXCELLENT
- 6-Step Research Question Development Wizard
- PICO/SPIDER framework integration
- Construct operationalization
- Hypothesis derivation

**GAPS:** None critical - This is complete.

### Feature 5: Hypothesis Generator

**Current Status:** Backend 100% | Frontend 60% | Integration 50%

**Scientific Basis:** ✅ GOOD
- Construct relationship mapping
- Theory-driven hypothesis generation
- Testability assessment

**GAPS IDENTIFIED:**

| Issue | Severity | Fix |
|-------|----------|-----|
| No hypothesis relationship diagram | HIGH | Add D3/React Flow visualization |
| Missing strength indicators | MEDIUM | Add hypothesis confidence scores |
| No link to research questions | MEDIUM | Wire bidirectional navigation |

### Feature 6: Survey/Questionnaire Generator

**Current Status:** Backend 100% | Frontend 70% | Integration 60%

**Scientific Basis:** ✅ GOOD
- Churchill (1979) scale development paradigm
- DeVellis (2016) measurement theory
- Multi-item construct generation

**GAPS IDENTIFIED:**

| Issue | Severity | Fix |
|-------|----------|-----|
| Theme import incomplete | HIGH | Complete ThemeImportModal backend wiring |
| AI suggestions not fully integrated | MEDIUM | Wire AIQuestionSuggestions to backend |
| Missing construct validation | MEDIUM | Add content validity assessment |

### Feature 7: Library (Paper Management)

**Current Status:** Backend 100% | Frontend 100% | Integration 100%

**Scientific Basis:** ✅ EXCELLENT
- Comprehensive paper lifecycle management
- Full metadata preservation (MeSH terms, grants, publication types)
- Duplicate detection via (userId + title + year) composite index
- Async full-text extraction with background queue
- Citation export (BibTeX, RIS, JSON, CSV, APA, MLA, Chicago)

**Key Implementation Details:**
- Zustand store (`paper-management.store.ts`) - 690 lines
- Self-contained container pattern (zero required props)
- Rate limiting: 300 saves/min, 600 gets/min
- DOI-based or title+year match deduplication

**What Competitors DON'T Have:**
- Integrated full-text extraction pipeline (4-tier waterfall)
- Direct integration with theme extraction workflow
- Quality scoring on saved papers
- Background extraction status tracking
- Research corpus linking (papers → themes → Q-statements)

**GAPS IDENTIFIED:**

| Issue | Severity | Fix |
|-------|----------|-----|
| No "How Library Works" panel | MEDIUM | Add methodology card explaining paper lifecycle |
| Missing collection management UI | MEDIUM | Add folder/collection organization interface |
| No bulk import from Zotero/Mendeley | LOW | Add reference manager import |
| Missing collaboration features | LOW | Add paper sharing between researchers |

### Feature 8: Corpus Manager (Research Corpus & Incremental Extraction)

**Current Status:** Backend 100% | Frontend 95% | Integration 90%

**Scientific Basis:** ✅ WORLD-CLASS
- **Theoretical Saturation Tracking** (Glaser & Strauss, 1967):
  - Saturation confidence score (0-100 with confidence level)
  - New theme discovery rate tracking
  - Theme strengthening metrics per iteration
- **Reflexive Thematic Analysis** (Braun & Clarke, 2006, 2019):
  - 6-stage methodology compliance
  - Purpose-adaptive extraction algorithms
- **Meta-Ethnography** (Noblit & Hare, 1988):
  - Cross-paper synthesis methodology
  - Theme integration tracking
- **Cost Optimization**:
  - Full-text caching via content hashes
  - Incremental extraction reuses processed content
  - Cost savings analytics per corpus

**Key Implementation Details:**
- Database: `ExtractionCorpus` model with saturation tracking
- Cache: `ProcessedLiterature` table with embeddings
- Iteration history with completion status
- Multi-purpose support (literature_synthesis, hypothesis_generation, gap_analysis)

**5-Stage Paper Lifecycle:**
```
1. SEARCH → 17 academic sources (ArXiv, PubMed, Springer, etc.)
2. SAVE → Library storage with metadata
3. CORPUS → Organized research collections
4. EXTRACT → AI theme extraction (GPT-4 Turbo)
5. Q-SORT → Statement generation with provenance
```

**What Competitors DON'T Have:**
- **Theoretical saturation detection** - Auto-detects when "enough" papers analyzed
- **Incremental extraction** - Only processes new papers, reuses cached content
- **Cost optimization tracking** - Shows API savings per corpus
- **Research purpose adaptation** - Different algorithms for different research types
- **Full provenance chain** - Paper → Theme → Statement traceability

**GAPS IDENTIFIED:**

| Issue | Severity | Fix |
|-------|----------|-----|
| No dedicated Corpus Manager page | HIGH | Create `/discover/corpus` page |
| Corpus workflow not explained to users | HIGH | Add "How Iterative Extraction Works" panel |
| Saturation metrics hidden | MEDIUM | Surface saturation progress to main UI |
| No corpus comparison view | MEDIUM | Add side-by-side corpus comparison |
| Missing iteration timeline | LOW | Add visual timeline of extraction iterations |

---

## 📋 IMPLEMENTATION PLAN (16 Days)

> **DEPENDENCIES**: Tasks are ordered by dependency. Days 1-8 can run in parallel groups. Days 9-16 depend on earlier days.

### Day 1: References Page Frontend API Integration (4-6 hours)

**Problem:** References page uses mock data; frontend doesn't connect to existing backend API
**Solution:** Create frontend API service to connect to existing backend endpoints

**Backend API Already Exists:**
- `POST /api/literature/references/parse/bibtex` - Parse BibTeX
- `POST /api/literature/references/generate/bibtex` - Generate BibTeX
- `POST /api/literature/references/parse/ris` - Parse RIS
- `POST /api/literature/references/generate/ris` - Generate RIS
- `POST /api/literature/references/format` - Format citation (APA, MLA, Chicago, etc.)
- `POST /api/literature/references/zotero/sync` - Zotero integration

**Tasks:**
- [ ] Create `references-api.service.ts` in `frontend/lib/api/services/`
- [ ] Wire existing endpoints: `parseBibTeX()`, `generateBibTeX()`, `formatCitation()`, etc.
- [ ] Connect references page to saved papers from library (reuse library API)
- [ ] Add citation format dropdown with all 6 styles
- [ ] Implement BibTeX/RIS import via file upload
- [ ] Test Zotero sync integration

**Files to Modify:**
- `frontend/app/(researcher)/discover/references/page.tsx`
- **Create:** `frontend/lib/api/services/references-api.service.ts`

**Success Criteria:**
- References page shows user's saved papers
- Citation formatting works for all 6 styles
- BibTeX/RIS import functional
- Zotero sync initiates correctly

### Day 2: Theme → Q-Statement Generator Integration (6-8 hours)

**Problem:** Themes extracted but no automatic Q-statement (concourse) generation
**Solution:** Connect theme extraction output to statement generator service WITH FULL PROVENANCE

**Critical Integration Point:**
```
POST /studies/{id}/statements
Body: {
  text: "Statement text",
  sourceThemeId: "theme_123",      // ← REQUIRED for provenance
  sourcePaperId: "paper_456",      // ← Links to source paper
  generationMethod: "theme-based", // ← Audit trail
  provenance: { themeId, paperId, extractionId }
}
```

**Tasks:**
- [ ] Create `ThemeToStatementModal.tsx` component
- [ ] Add "Generate Q-Statements" button to ThemeExtractionContainer
- [ ] Wire to `POST /studies/{id}/statements` with provenance fields
- [ ] Pass `sourceThemeId` and `sourcePaperId` for every generated statement
- [ ] Add statement editing and refinement UI
- [ ] Create study selector dropdown (which study to add statements to)
- [ ] Implement bulk statement creation with transaction

**Files to Create:**
- `frontend/components/literature/ThemeToStatementModal.tsx`
- `frontend/lib/services/statement-generation.service.ts`

**Backend Already Complete:**
- `backend/src/modules/study/statement.service.ts` - Statement CRUD
- Statement model has: `sourceThemeId`, `sourcePaperId`, `provenance` fields

**Success Criteria:**
- User can generate Q-statements from themes
- **Each statement has sourceThemeId linked** (verifiable in DB)
- Statements appear in Q-sort builder with provenance badge
- Full audit trail: Paper → Theme → Statement

### Day 3: Theme → Survey Generator Integration (6-8 hours)

**Problem:** ThemeImportModal exists but integration incomplete
**Solution:** Complete theme-to-survey-item pipeline

**Tasks:**
- [ ] Enhance `ThemeImportModal.tsx` with full backend integration
- [ ] Connect to `theme-to-survey-item.service.ts`
- [ ] Add survey item preview and editing
- [ ] Implement Likert scale generation options
- [ ] Add multi-item generation per theme
- [ ] Create export to questionnaire builder

**Files to Modify:**
- `frontend/components/questionnaire/ThemeImportModal.tsx`
- `frontend/components/questionnaire/theme-import/ThemeSelector.tsx`
- `frontend/components/questionnaire/theme-import/SurveyItemPreview.tsx`

**Backend Already Complete:**
- `backend/src/modules/literature/services/theme-to-survey-item.service.ts`

**Success Criteria:**
- Themes can generate survey items
- Multiple scale types supported
- Export to questionnaire builder works

### Day 4: Knowledge Graph → Theme Visualization (6-8 hours)

**Problem:** Knowledge graph service exists but not connected to theme visualization
**Solution:** Add theme clusters to knowledge map

**Tasks:**
- [ ] Add theme nodes to knowledge graph visualization
- [ ] Create theme cluster visualization
- [ ] Connect extracted themes to knowledge-graph.service.ts
- [ ] Add "View in Knowledge Map" button to themes
- [ ] Implement theme relationship visualization
- [ ] Add theme-to-gap linking

**Files to Modify:**
- `frontend/app/(researcher)/discover/knowledge-map/page.tsx`
- `frontend/app/(researcher)/discover/themes/page.tsx`
- `backend/src/modules/literature/services/knowledge-graph.service.ts`

**Success Criteria:**
- Themes appear as nodes in knowledge map
- Theme relationships visualized
- Navigation between themes and knowledge map

### Day 5: Hypothesis Generator Complete Implementation (8-10 hours)

**Problem:** Hypothesis Generator is only 60% frontend, 50% integration - needs significant work
**Solution:** Complete UI, add visualizations, and wire full backend integration

**Current Gaps (Feature 5 Evaluation):**
- No hypothesis relationship diagram (D3/React Flow needed)
- Missing strength indicators
- No link to research questions
- Integration only 50%

**Tasks:**
- [ ] Add hypothesis relationship diagram using React Flow or D3.js
- [ ] Create bidirectional hypothesis ↔ research question linking
- [ ] Add hypothesis strength/confidence indicators (0-100 scale)
- [ ] Implement hypothesis testing suggestions with methodology
- [ ] Wire `hypothesis-generator.service.ts` to backend endpoints
- [ ] Add "Generate from Themes" button (link to theme extraction)
- [ ] Create hypothesis card component with construct visualization
- [ ] Add export to research design document

**Files to Modify:**
- `frontend/app/(researcher)/design/hypothesis/page.tsx`
- `frontend/components/questionnaire/HypothesisToItemsModal.tsx`
- **Create:** `frontend/components/hypothesis/HypothesisRelationshipDiagram.tsx`
- **Create:** `frontend/components/hypothesis/HypothesisStrengthIndicator.tsx`

**Backend Reference:**
- `backend/src/modules/research-design/services/hypothesis-generator.service.ts`

**Success Criteria:**
- Hypothesis visualizations render with React Flow diagram
- Bidirectional linking to research questions works
- Strength indicators show for each hypothesis
- Frontend integration reaches 100%
- Export functionality complete

### Day 6: Questionnaire Generator Enhancement (6-8 hours)

**Problem:** Questionnaire builder exists but AI generation features incomplete
**Solution:** Complete AI-powered question generation

**Tasks:**
- [ ] Enhance `AIQuestionSuggestions.tsx` with full backend integration
- [ ] Add question type recommendations
- [ ] Implement question validation suggestions
- [ ] Add response option generation
- [ ] Create question bank import from themes
- [ ] Implement skip logic recommendations

**Files to Modify:**
- `frontend/components/questionnaire/AIQuestionSuggestions.tsx`
- `frontend/components/questionnaire/QuestionEditor.tsx`
- `frontend/components/questionnaire/QuestionBankPanel.tsx`

**Success Criteria:**
- AI question suggestions work
- Question bank populated from themes
- Skip logic recommendations functional

### Day 7: Alternative Sources Pagination & Polish (4-6 hours)

**Problem:** Alternative sources panel lacks pagination and filtering
**Solution:** Add result pagination and advanced filtering

**Tasks:**
- [ ] Add pagination to AlternativeSourcesPanel
- [ ] Implement result filtering by source
- [ ] Add sorting options (relevance, date, popularity)
- [ ] Create source-specific filters (GitHub: stars, forks; SO: votes)
- [ ] Add result caching for performance

**Files to Modify:**
- `frontend/app/(researcher)/discover/literature/components/AlternativeSourcesPanel.tsx`
- `frontend/app/(researcher)/discover/literature/components/alternative-sources/*.tsx`

**Success Criteria:**
- Pagination works for all sources
- Filtering functional
- Performance improved

### Day 8: Enterprise Logging & Correlation IDs (4-6 hours)

**Problem:** Some components still use console.log statements
**Solution:** Complete migration to enterprise logger across ALL discover section

**Tasks:**
- [ ] Audit ALL discover section components for console.* usage
- [ ] Migrate remaining console.log to logger.info
- [ ] Migrate console.error to logger.error
- [ ] Add correlation IDs to all API calls in discover section
- [ ] Verify WebSocket error handling in gateways
- [ ] Create logging audit script for CI/CD

**Files to Audit (Priority Order):**
- `frontend/app/(researcher)/discover/gaps/page.tsx` (has console.log)
- `frontend/app/(researcher)/discover/knowledge-map/page.tsx` (has console.log)
- `frontend/app/(researcher)/discover/references/page.tsx`
- `frontend/app/(researcher)/discover/themes/page.tsx`
- `frontend/app/(researcher)/discover/literature/page.tsx`

**Success Criteria:**
- Zero console.* in discover section code
- All errors logged with context
- Correlation IDs in all API requests

### Day 9: Integration Testing - Core Flows (6-8 hours)

**Focus:** Test the NEW integrations created in Days 1-6

**Tasks:**
- [ ] E2E test: Theme → Q-Statement flow (Day 2 work)
- [ ] E2E test: Theme → Survey flow (Day 3 work)
- [ ] E2E test: References page CRUD + citation formatting
- [ ] E2E test: Knowledge map theme visualization
- [ ] E2E test: Hypothesis diagram rendering
- [ ] Verify provenance chain: Paper → Theme → Statement

**Test Files to Create:**
- `frontend/e2e/theme-to-statement.spec.ts`
- `frontend/e2e/theme-to-survey.spec.ts`
- `frontend/e2e/references-crud.spec.ts`

**Success Criteria:**
- All 5 E2E tests passing
- Provenance verified in DB
- No regressions in existing flows

### Day 10: Enterprise Methodology Cards (6-8 hours)

**Problem:** Features don't explain their scientific basis to users
**Solution:** Add methodology explanation panels to each feature

**Tasks:**
- [ ] Create `MethodologyExplainer.tsx` reusable component
- [ ] Add "How We Score Opportunities" card to Gaps page
  - Explain 5-factor model with weights
  - Cite gradient boosting, time-series methodology
  - Show factor breakdown radar chart
- [ ] Add "How Knowledge Maps Work" card to Knowledge Map page
  - Explain bridge concept detection algorithm
  - Cite PageRank influence flow
  - Show edge type legend with meanings
- [ ] Add "Braun & Clarke Thematic Analysis" card to Themes page
  - Explain 6-stage methodology
  - Cite Braun & Clarke (2006, 2019)
  - Link to academic references

**Files to Create:**
- `frontend/components/shared/MethodologyExplainer.tsx`
- `frontend/components/methodology/OpportunityScoringMethodology.tsx`
- `frontend/components/methodology/KnowledgeGraphMethodology.tsx`
- `frontend/components/methodology/ThematicAnalysisMethodology.tsx`

**Success Criteria:**
- Each feature has "How It Works" expandable panel
- Academic citations visible
- Users understand the scientific basis

### Day 11: Value Communication & Differentiation (6-8 hours)

**Problem:** Users don't understand what makes our platform unique
**Solution:** Add comparison and value proposition elements

**Tasks:**
- [ ] Create "What Makes This Different" section for each feature
- [ ] Add feature comparison tooltips (vs competitors)
- [ ] Create "Only on VQMethod" badges for unique features:
  - Q-methodology fit scoring
  - Multi-source theme extraction
  - Funding probability prediction
  - Purpose-adaptive algorithms
- [ ] Add contextual help tooltips throughout

**Files to Create:**
- `frontend/components/shared/DifferentiatorBadge.tsx`
- `frontend/components/shared/FeatureComparisonTooltip.tsx`
- `frontend/components/shared/MethodologyTooltip.tsx`

**Success Criteria:**
- Users understand platform's unique value
- Differentiation badges visible on unique features
- Scientific credibility communicated

### Day 12: Visual Enhancement - Data Visualizations (6-8 hours)

**Problem:** Data displays could be more visually compelling
**Solution:** Add advanced visualizations using Recharts

**Tasks:**
- [ ] Add radar/spider chart for 5-factor opportunity scoring
- [ ] Add timeline Gantt chart for research planning
- [ ] Add funding probability gauge chart
- [ ] Add trend forecast line chart with confidence intervals
- [ ] Add theme influence breakdown pie chart

**Files to Create/Modify:**
- `frontend/components/visualizations/OpportunityRadarChart.tsx`
- `frontend/components/visualizations/ResearchTimelineGantt.tsx`
- `frontend/components/visualizations/FundingProbabilityGauge.tsx`
- `frontend/components/visualizations/TrendForecastChart.tsx`
- `frontend/components/visualizations/ThemeInfluenceChart.tsx`

**Success Criteria:**
- Professional, publication-quality visualizations
- Interactive charts with tooltips
- Export-ready graphics

### Day 13: Performance Testing & Visual Enhancement Testing (6-8 hours)

**Focus:** Test the visualizations and performance created in Days 10-12

**Tasks:**
- [ ] Performance test: Methodology cards render < 100ms
- [ ] Performance test: Radar charts render with 1000+ data points
- [ ] Performance test: Knowledge map with 500+ nodes
- [ ] Test all Recharts visualizations render correctly
- [ ] Test DifferentiatorBadge placement on all features
- [ ] Cross-browser testing for new visualizations (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness check for all new components
- [ ] Memory leak testing for chart components

**Test Files to Create:**
- `frontend/e2e/methodology-cards.spec.ts`
- `frontend/e2e/visualization-performance.spec.ts`

**Success Criteria:**
- All visualizations render < 200ms
- No memory leaks detected
- Mobile responsive on all screens
- Cross-browser compatibility verified

### Day 14: Documentation & Final Polish (6-8 hours)

**Focus:** Documentation and accessibility - NOT duplicate logging work

**Tasks:**
- [ ] Update ARCHITECTURE.md with new integrations (Days 1-12)
- [ ] Document all new API service files
- [ ] Create user documentation for methodology explanations
- [ ] Run full accessibility audit (WCAG 2.1 AA compliance)
- [ ] Fix any accessibility violations found
- [ ] Update Phase Tracker with completion status
- [ ] Create release notes for Phase 10.97

**Files to Update:**
- `frontend/app/(researcher)/discover/literature/ARCHITECTURE.md`
- Create: `docs/METHODOLOGY_EXPLANATIONS.md`
- Create: `docs/RELEASE_NOTES_10.97.md`

**Success Criteria:**
- ARCHITECTURE.md reflects all new integrations
- User documentation complete
- WCAG 2.1 AA compliance verified
- Phase Tracker updated with completion

### Day 15: Library Enhancement & Collection Management (8-10 hours)

**Problem:** Library lacks collection organization; **CRITICAL: NO BACKEND API FOR COLLECTIONS**
**Solution:** Create backend API for PaperCollection CRUD, then add frontend UI

**⚠️ CRITICAL GAP FOUND:**
- Prisma model `PaperCollection` EXISTS in schema
- But NO API endpoints exist for collection CRUD
- Must create backend endpoints FIRST

**Tasks - Backend (4 hours):**
- [ ] Create `collection.controller.ts` endpoints:
  - `POST /api/literature/collections` - Create collection
  - `GET /api/literature/collections` - Get user's collections
  - `GET /api/literature/collections/:id` - Get collection by ID
  - `PATCH /api/literature/collections/:id` - Update collection
  - `DELETE /api/literature/collections/:id` - Delete collection
  - `POST /api/literature/collections/:id/papers` - Add papers to collection
  - `DELETE /api/literature/collections/:id/papers/:paperId` - Remove paper
- [ ] Create `collection.service.ts` with CRUD operations
- [ ] Add collection routes to literature.module.ts

**Tasks - Frontend (4 hours):**
- [ ] Create `collection-api.service.ts` - API client for collections
- [ ] Create `LibraryMethodologyCard.tsx` - Explain paper lifecycle
- [ ] Create `CollectionManager.tsx` component
- [ ] Add drag-and-drop paper organization (react-dnd)
- [ ] Implement bulk paper actions (add to collection, remove, export)
- [ ] Add collection statistics

**Files to Create:**
- **Backend:** `backend/src/modules/literature/controllers/collection.controller.ts`
- **Backend:** `backend/src/modules/literature/services/collection.service.ts`
- **Frontend:** `frontend/lib/api/services/collection-api.service.ts`
- **Frontend:** `frontend/components/library/CollectionManager.tsx`
- **Frontend:** `frontend/components/library/LibraryMethodologyCard.tsx`
- **Frontend:** `frontend/components/library/BulkActionsBar.tsx`

**Success Criteria:**
- Backend collection CRUD endpoints working
- Papers can be organized into collections via UI
- "How Library Works" panel visible
- Drag-and-drop functional
- Collection statistics displayed

### Day 16: Corpus Manager Page & Value Communication (10-12 hours)

**Problem:** No dedicated Corpus Manager page; corpus workflow not explained to users
**Solution:** Create dedicated `/discover/corpus` page WITH Zustand store and navigation update

**⚠️ CRITICAL GAPS FOUND:**
- No `corpus.store.ts` exists - must create
- Navigation sidebar doesn't link to corpus page - must update
- Backend API exists but frontend doesn't connect

**Tasks - Store & API (3 hours):**
- [ ] Create `frontend/lib/stores/corpus.store.ts` - Zustand store
  - State: corpuses[], selectedCorpus, saturationMetrics, costSavings
  - Actions: fetchCorpuses, createCorpus, updateCorpus, deleteCorpus
- [ ] Create `frontend/lib/api/services/corpus-api.service.ts` - Wire to existing backend
  - Endpoints already exist: `/corpus/list`, `/corpus/stats`, `/corpus/create`, etc.

**Tasks - UI Components (5 hours):**
- [ ] Create `frontend/app/(researcher)/discover/corpus/page.tsx`
- [ ] Add corpus list view with saturation metrics
- [ ] Create `CorpusMethodologyCard.tsx` - Explain iterative extraction
- [ ] Add saturation progress visualization (SaturationGauge with Recharts)
- [ ] Create corpus comparison view (side-by-side)
- [ ] Add iteration timeline visualization (IterationTimeline)
- [ ] Create "How Incremental Extraction Works" panel
- [ ] Surface cost savings prominently (CostSavingsDisplay)

**Tasks - Navigation Update (2 hours):**
- [ ] Update discover section sidebar to include `/discover/corpus` link
- [ ] Add corpus icon to navigation
- [ ] Update breadcrumbs for corpus page
- [ ] Add E2E test for corpus page navigation

**Files to Create:**
- **Store:** `frontend/lib/stores/corpus.store.ts`
- **API:** `frontend/lib/api/services/corpus-api.service.ts`
- **Page:** `frontend/app/(researcher)/discover/corpus/page.tsx`
- **Components:**
  - `frontend/components/corpus/CorpusMethodologyCard.tsx`
  - `frontend/components/corpus/SaturationGauge.tsx`
  - `frontend/components/corpus/IterationTimeline.tsx`
  - `frontend/components/corpus/CostSavingsDisplay.tsx`
  - `frontend/components/corpus/CorpusComparisonView.tsx`
- **Test:** `frontend/e2e/corpus-page.spec.ts`

**Navigation File to Update:**
- Likely in: `frontend/components/layout/Sidebar.tsx` or similar

**Academic References to Include:**
- Glaser & Strauss (1967) - Theoretical Saturation
- Braun & Clarke (2006, 2019) - Reflexive Thematic Analysis
- Noblit & Hare (1988) - Meta-Ethnography

**Success Criteria:**
- Corpus.store.ts created and working
- Navigation sidebar has `/discover/corpus` link
- Dedicated `/discover/corpus` page renders
- Saturation metrics visible with gauge visualization
- Cost savings prominently displayed
- E2E test passes for corpus page flow

---

## PHASE 10.97 SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Feature Integration | 100% of features connected end-to-end |
| Methodology Coverage | 100% of features have scientific explanation |
| Value Communication | 100% of features explain differentiation |
| Enterprise Logging | Zero console.* in production |
| E2E Test Coverage | 100% of critical flows tested |
| Visual Enhancement | All features have advanced visualizations |
| Library Collections | Users can organize papers into collections |
| Corpus Manager | Dedicated page with saturation metrics |
| Paper Lifecycle | Complete 5-stage workflow visible to users |

---

## 🔍 LOOPHOLES AUDIT (November 2025)

> **Audit Date:** November 23, 2025
> **Auditor:** Claude Code Analysis
> **Status:** All loopholes identified and fixed in plan above

### Loopholes Found & Fixed

| # | Loophole | Severity | Fix Applied |
|---|----------|----------|-------------|
| 1 | Day 9 & 13 duplicate (Integration Testing) | HIGH | Separated: Day 9 = Core flows, Day 13 = Performance |
| 2 | Day 8 & 14 duplicate (Enterprise Logging) | HIGH | Consolidated: Day 8 = Logging, Day 14 = Documentation |
| 3 | Header said "14 Days" but plan has 16 | MEDIUM | Fixed header to "16 Days" |
| 4 | Missing `corpus.store.ts` | HIGH | Added to Day 16 tasks |
| 5 | Missing Paper Collection API (no backend) | CRITICAL | Added backend API creation to Day 15 |
| 6 | Q-Sort provenance not specified | HIGH | Added `sourceThemeId` requirement to Day 2 |
| 7 | Navigation not updated for corpus page | HIGH | Added navigation update to Day 16 |
| 8 | No E2E tests for Days 15-16 | MEDIUM | Added test file creation tasks |
| 9 | Hypothesis day too short (4-6h for 60% work) | HIGH | Extended to 8-10 hours with full scope |
| 10 | References backend existed but unknown | LOW | Documented existing endpoints in Day 1 |
| 11 | No explicit dependencies | MEDIUM | Added dependency note at plan start |
| 12 | Missing API service files | MEDIUM | Added file creation tasks throughout |

### Backend API Verification Summary

| Feature | Backend Status | Frontend Status |
|---------|---------------|-----------------|
| References | ✅ 7 endpoints exist | ❌ No API service |
| Corpus | ✅ 5 endpoints exist | ❌ No API service |
| Collections | ❌ No endpoints | ❌ No API service |
| Statements | ✅ CRUD exists | ✅ Partial |

### File Verification Summary

| File | Exists? |
|------|---------|
| `corpus.store.ts` | ❌ MISSING - Day 16 will create |
| `corpus-api.service.ts` | ❌ MISSING - Day 16 will create |
| `collection-api.service.ts` | ❌ MISSING - Day 15 will create |
| `collection.controller.ts` | ❌ MISSING - Day 15 will create |
| All other referenced files | ✅ VERIFIED |

---

## ✅ ARCHITECTURE & LOGGING COMPLIANCE CHECKLIST

> **All Phase 10.97 deliverables MUST pass this checklist before merge.**

### Size Limits (Hard Limits)

| File Type | Max Lines | Applies To |
|-----------|-----------|------------|
| Services | < 300 | All `*.service.ts` files |
| Components | < 400 | All `*.tsx` components |
| Functions | < 100 | Every function/method |
| Stores | < 400 | All `*.store.ts` files |

### New Files - Compliance Matrix (ALL 37 Files)

| Day | File | Type | Logger Context | Max Lines |
|-----|------|------|----------------|-----------|
| 1 | `references-api.service.ts` | Service | `ReferencesAPIService` | < 300 |
| 2 | `ThemeToStatementModal.tsx` | Component | `ThemeToStatementModal` | < 400 |
| 2 | `statement-generation.service.ts` | Service | `StatementGenerationService` | < 300 |
| 5 | `HypothesisRelationshipDiagram.tsx` | Component | `HypothesisRelationshipDiagram` | < 400 |
| 5 | `HypothesisStrengthIndicator.tsx` | Component | `HypothesisStrengthIndicator` | < 400 |
| 9 | `theme-to-statement.spec.ts` | Test | N/A (test file) | No limit |
| 9 | `theme-to-survey.spec.ts` | Test | N/A (test file) | No limit |
| 9 | `references-crud.spec.ts` | Test | N/A (test file) | No limit |
| 10 | `MethodologyExplainer.tsx` | Component | `MethodologyExplainer` | < 400 |
| 10 | `OpportunityScoringMethodology.tsx` | Component | `OpportunityScoringMethodology` | < 400 |
| 10 | `KnowledgeGraphMethodology.tsx` | Component | `KnowledgeGraphMethodology` | < 400 |
| 10 | `ThematicAnalysisMethodology.tsx` | Component | `ThematicAnalysisMethodology` | < 400 |
| 11 | `DifferentiatorBadge.tsx` | Component | `DifferentiatorBadge` | < 400 |
| 11 | `FeatureComparisonTooltip.tsx` | Component | `FeatureComparisonTooltip` | < 400 |
| 11 | `MethodologyTooltip.tsx` | Component | `MethodologyTooltip` | < 400 |
| 12 | `OpportunityRadarChart.tsx` | Component | `OpportunityRadarChart` | < 400 |
| 12 | `ResearchTimelineGantt.tsx` | Component | `ResearchTimelineGantt` | < 400 |
| 12 | `FundingProbabilityGauge.tsx` | Component | `FundingProbabilityGauge` | < 400 |
| 12 | `TrendForecastChart.tsx` | Component | `TrendForecastChart` | < 400 |
| 12 | `ThemeInfluenceChart.tsx` | Component | `ThemeInfluenceChart` | < 400 |
| 13 | `methodology-cards.spec.ts` | Test | N/A (test file) | No limit |
| 13 | `visualization-performance.spec.ts` | Test | N/A (test file) | No limit |
| 15 | `collection.controller.ts` | Controller | `CollectionController` | < 300 |
| 15 | `collection.service.ts` | Service | `CollectionService` | < 300 |
| 15 | `collection-api.service.ts` | Service | `CollectionAPIService` | < 300 |
| 15 | `CollectionManager.tsx` | Component | `CollectionManager` | < 400 |
| 15 | `LibraryMethodologyCard.tsx` | Component | `LibraryMethodologyCard` | < 400 |
| 15 | `BulkActionsBar.tsx` | Component | `BulkActionsBar` | < 400 |
| 16 | `corpus.store.ts` | Store | `CorpusStore` | < 400 |
| 16 | `corpus-api.service.ts` | Service | `CorpusAPIService` | < 300 |
| 16 | `corpus/page.tsx` | Page | `CorpusPage` | < 400 |
| 16 | `CorpusMethodologyCard.tsx` | Component | `CorpusMethodologyCard` | < 400 |
| 16 | `SaturationGauge.tsx` | Component | `SaturationGauge` | < 400 |
| 16 | `IterationTimeline.tsx` | Component | `IterationTimeline` | < 400 |
| 16 | `CostSavingsDisplay.tsx` | Component | `CostSavingsDisplay` | < 400 |
| 16 | `CorpusComparisonView.tsx` | Component | `CorpusComparisonView` | < 400 |
| 16 | `corpus-page.spec.ts` | Test | N/A (test file) | No limit |

### Pre-Merge Checklist (Every PR)

```
[ ] grep -r "console\." <changed-files> = 0 results
[ ] All catch blocks have logger.error() with context
[ ] All new components import { logger } from '@/lib/utils/logger'
[ ] Context names match registry pattern (PascalCase)
[ ] No `any` types (use unknown or proper types)
[ ] No @ts-ignore comments
[ ] All services have try/catch with logging
[ ] Functions < 100 lines (split if larger)
```

### Logger Import Template

**Frontend (use in ALL new components/services):**
```typescript
import { logger } from '@/lib/utils/logger';

// In component/service:
logger.info('Action description', 'ContextName', { relevantData });
logger.error('Error description', 'ContextName', { error, errorMessage: error.message });
```

**Backend (NestJS):**
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class ServiceName {
  private readonly logger = new Logger(ServiceName.name);

  async method() {
    this.logger.log('Action', { context: 'data' });
  }
}
```

### Context Registry - Phase 10.97 Additions

| Context Name | File | Day |
|--------------|------|-----|
| `ReferencesAPIService` | references-api.service.ts | 1 |
| `StatementGenerationService` | statement-generation.service.ts | 2 |
| `CollectionAPIService` | collection-api.service.ts | 15 |
| `CollectionManager` | CollectionManager.tsx | 15 |
| `CorpusStore` | corpus.store.ts | 16 |
| `CorpusAPIService` | corpus-api.service.ts | 16 |
| `CorpusPage` | corpus/page.tsx | 16 |

### E2E Test Requirements

| Day | Test File | Must Verify |
|-----|-----------|-------------|
| 9 | `theme-to-statement.spec.ts` | Provenance chain intact |
| 9 | `theme-to-survey.spec.ts` | Survey items generated |
| 9 | `references-crud.spec.ts` | All 6 citation formats |
| 13 | `methodology-cards.spec.ts` | Render < 100ms |
| 16 | `corpus-page.spec.ts` | Navigation works, store syncs |

---

## PHASE 10.98: DESIGN SECTION COMPLETION (Future)

**Duration:** 5 days | **Status:** NOT STARTED | **Priority:** MEDIUM
**Dependencies:** Phase 10.97 Complete

### Overview
Complete remaining design section features and integrations.

**Scope:**
- Research question → hypothesis linking
- Hypothesis → construct mapping
- Construct → survey item generation
- Protocol builder integration
- Methodology selection wizard

---

## PHASE 11: ARCHIVE SYSTEM & META-ANALYSIS

**Duration:** 8 days | **Status:** NOT STARTED
**Dependencies:** Phase 10 Complete

### Revolutionary Features
- Real-Time Factor Analysis (Days 5-6)
- Cross-Study Pattern Recognition (Days 7-8) - TIER 2 PATENT

### Day 1: Version Control System
**Files:**
- `backend/src/modules/archive/archive.module.ts`
- `backend/src/modules/archive/archive.service.ts`
- `backend/src/modules/archive/version-control.service.ts`
- `frontend/app/(researcher)/archive/[studyId]/page.tsx`

**Tasks:**
- [ ] TODO: Create archive.module.ts and archive.service.ts
- [ ] TODO: Build /app/(researcher)/archive/[studyId]/page.tsx
- [ ] TODO: Create version-control.service.ts
- [ ] TODO: Create study-version.entity.ts in Prisma
- [ ] TODO: Implement snapshot storage

**Success Criteria:**
- Version control working
- Archive UI functional
- Tests passing

### Day 2: Archive Storage
- [ ] TODO: Set up cloud storage (S3/MinIO)
- [ ] TODO: Create backup service
- [ ] TODO: Implement compression and encryption
- [ ] TODO: Build retention policies

### Day 3: DOI Integration
- [ ] TODO: Integrate DOI service
- [ ] TODO: Create citation generator
- [ ] TODO: Build permanent links

### Day 4: Integration & Polish
- [ ] TODO: Connect to study lifecycle
- [ ] TODO: Add export packaging
- [ ] TODO: Create archive browser

### Days 5-6: Progressive Factor Analysis
- [ ] TODO: WebSocket for live progress updates
- [ ] TODO: Batch processing every 10 responses
- [ ] TODO: Preliminary factor preview
- [ ] TODO: Outlier detection

### Days 7-8: Cross-Study Pattern Recognition (TIER 2 PATENT)
- [ ] TODO: Build transfer learning framework
- [ ] TODO: Create "Viewpoint Genome" database
- [ ] TODO: Implement cultural universals detection
- [ ] TODO: Build meta-Q-methodology dashboard

---

## PHASE 12: PRE-PRODUCTION READINESS

**Duration:** 5 days | **Status:** NOT STARTED

### Day 1: Test Infrastructure
**Priority Fixes:**
- [ ] TODO: Cache service unit tests (frontend/lib/services/cache.service.ts - 805 lines untested)
- [ ] TODO: E2E tests with real backend
- [ ] TODO: Automated navigation tests
- [ ] TODO: ORCID authentication flow tests
- [ ] TODO: Create test coverage dashboard

**Success Criteria:**
- 95% unit test coverage
- E2E tests covering critical paths
- Coverage dashboard created

### Day 2: Performance & Load Testing
- [ ] TODO: AI endpoints: 100 concurrent requests, p95 ≤3s
- [ ] TODO: Analysis pipeline: 1000 responses <60s
- [ ] TODO: Database: 500 concurrent queries
- [ ] TODO: WebSocket: 200 concurrent users

### Day 3: Security Hardening
- [ ] TODO: Security audit
- [ ] TODO: Configure WAF and DDoS protection
- [ ] TODO: SSL/TLS configuration
- [ ] TODO: Penetration testing

### Day 4: Observability
- [ ] TODO: Configure metrics dashboard (Grafana)
- [ ] TODO: Set up APM
- [ ] TODO: Implement error tracking (Sentry)
- [ ] TODO: Configure log aggregation

### Day 5: Documentation
- [ ] TODO: Create user documentation
- [ ] TODO: Write API documentation
- [ ] TODO: Create runbooks
- [ ] TODO: Record video tutorials

---

## PHASE 13: ENTERPRISE SECURITY & COMPLIANCE

**Duration:** 5 days | **Status:** NOT STARTED
**Target:** Initial University & Enterprise Adoption

### Day 1: Compliance Documentation
- [ ] TODO: Create Privacy Policy (GDPR/FERPA)
- [ ] TODO: Draft Data Processing Agreement
- [ ] TODO: Build security questionnaire responses
- [ ] TODO: User data export functionality
- [ ] TODO: Account deletion (right to be forgotten)

### Day 2: SSO Implementation
- [ ] TODO: SAML 2.0 setup
- [ ] TODO: Google OAuth integration
- [ ] TODO: Microsoft OAuth integration
- [ ] TODO: JWT token management

### Day 3: AI Transparency
- [ ] TODO: AI usage disclosure page
- [ ] TODO: Model card documentation
- [ ] TODO: AI usage indicator on all features
- [ ] TODO: AI opt-out options

### Day 4: Security & Audit Trail
- [ ] TODO: User action logging
- [ ] TODO: Login/logout tracking
- [ ] TODO: Data access logs
- [ ] TODO: HTTPS enforcement

### Day 5: Launch Readiness
- [ ] TODO: Security overview document
- [ ] TODO: GDPR compliance checklist
- [ ] TODO: FERPA compliance guide

---

## PHASE 14: OBSERVABILITY & SRE

**Duration:** 3 days | **Status:** NOT STARTED

### Day 1: Monitoring Setup
- [ ] TODO: Configure APM
- [ ] TODO: Set up logging aggregation
- [ ] TODO: Create dashboards
- [ ] TODO: Build alert rules

### Day 2: SRE Practices
- [ ] TODO: Define SLIs/SLOs
- [ ] TODO: Create error budgets
- [ ] TODO: Build runbooks
- [ ] TODO: Implement on-call rotation

### Day 3: Automation
- [ ] TODO: Automate deployments
- [ ] TODO: Create self-healing systems
- [ ] TODO: Build auto-scaling
- [ ] TODO: Implement GitOps

---

## PHASE 15: PERFORMANCE & SCALE

**Duration:** 4 days | **Status:** NOT STARTED

### Day 1: Performance Baseline
- [ ] TODO: Performance profiling
- [ ] TODO: Identify bottlenecks
- [ ] TODO: Set performance budgets

### Day 2: Optimization
- [ ] TODO: Database query optimization
- [ ] TODO: API response optimization
- [ ] TODO: Frontend bundle optimization
- [ ] TODO: Caching optimization

### Day 3: Scalability
- [ ] TODO: Horizontal scaling setup
- [ ] TODO: Database sharding
- [ ] TODO: Queue implementation
- [ ] TODO: Auto-scaling policies

### Day 4: High Availability
- [ ] TODO: Multi-region setup
- [ ] TODO: Failover configuration
- [ ] TODO: Disaster recovery
- [ ] TODO: Circuit breakers

---

## PHASE 16: QUALITY GATES

**Duration:** 3 days | **Status:** NOT STARTED

### Day 1: Testing Framework
- [ ] TODO: Unit test coverage 95%
- [ ] TODO: E2E test automation
- [ ] TODO: Performance test suite
- [ ] TODO: Security test suite

### Day 2: Quality Metrics
- [ ] TODO: Code quality metrics
- [ ] TODO: Technical debt tracking
- [ ] TODO: Complexity analysis
- [ ] TODO: License compliance

### Day 3: Release Process
- [ ] TODO: Release automation
- [ ] TODO: Feature flags
- [ ] TODO: Canary deployments
- [ ] TODO: Rollback procedures

---

## PHASE 17: ADVANCED AI ANALYSIS

**Duration:** 10 days | **Status:** NOT STARTED (Post-MVP)

### Day 1: ML Infrastructure
- [ ] TODO: Set up ML pipeline
- [ ] TODO: Configure model registry
- [ ] TODO: Create training infrastructure

### Day 2: Self-Evolving Statements
- [ ] TODO: Reinforcement learning implementation
- [ ] TODO: Genetic algorithms for evolution
- [ ] TODO: A/B testing framework

### Day 3: Advanced Statement Features
- [ ] TODO: Cultural adaptation layer
- [ ] TODO: Multi-language evolution
- [ ] TODO: Emotional resonance scoring

### Day 4: Advanced NLP Models
- [ ] TODO: Implement advanced NLP models
- [ ] TODO: Add sentiment analysis
- [ ] TODO: Build clustering algorithms

### Day 5: Research Analytics
- [ ] TODO: Pattern recognition engine
- [ ] TODO: Predictive analytics
- [ ] TODO: Meta-analysis tools

### Day 6: AI-Powered Features
- [ ] TODO: Factor interpretation AI
- [ ] TODO: Auto-visualization selection
- [ ] TODO: Report figure generation

### Day 9: Multi-Modal Query Intelligence (TIER 1 PATENT)
**Innovation:** 6 data sources + explainable AI

**Implementation:**
- [ ] TODO: Social media monitoring service
- [ ] TODO: Trend velocity algorithm
- [ ] TODO: Co-occurrence matrix from 1M+ papers
- [ ] TODO: Citation network analysis
- [ ] TODO: Temporal topic modeling (LDA)
- [ ] TODO: Explainability transparency layer

**Success Criteria:**
- 6 data sources integrated
- Confidence scoring working
- Explainability UI complete

---

## PHASE 18: INTERNATIONALIZATION

**Duration:** 4 days | **Status:** NOT STARTED

### Day 1: i18n Infrastructure
- [ ] TODO: Set up i18n framework
- [ ] TODO: Create translation system
- [ ] TODO: Build locale detection

### Day 2: Translation Management
- [ ] TODO: Extract all strings
- [ ] TODO: Build translation UI
- [ ] TODO: Add crowdsourcing tools

### Day 3: Cultural Adaptation
- [ ] TODO: RTL language support
- [ ] TODO: Cultural imagery review
- [ ] TODO: Content adaptation

### Day 4: Launch Preparation
- [ ] TODO: Add initial languages
- [ ] TODO: Complete translations
- [ ] TODO: Performance impact check

---

## PHASE 19: GROWTH FEATURES

**Duration:** 5 days | **Status:** NOT STARTED

### Day 1: User Analytics
- [ ] TODO: Implement analytics tracking
- [ ] TODO: Create user segments
- [ ] TODO: Build funnel analysis

### Day 2: Engagement Features
- [ ] TODO: Add notifications system
- [ ] TODO: Create email campaigns
- [ ] TODO: Build gamification

### Day 3: Collaboration Tools
- [ ] TODO: Real-time collaboration
- [ ] TODO: Team workspaces
- [ ] TODO: Comments and mentions

### Day 4: API & Integrations
- [ ] TODO: Public API development
- [ ] TODO: Webhook system
- [ ] TODO: SDK development

### Day 5: Community Features
- [ ] TODO: User forums
- [ ] TODO: Knowledge base
- [ ] TODO: Template marketplace

---

## PHASE 20: MONETIZATION

**Duration:** 4 days | **Status:** NOT STARTED

### Day 1: Billing Infrastructure
- [ ] TODO: Payment gateway integration
- [ ] TODO: Subscription management
- [ ] TODO: Invoice generation

### Day 2: Pricing Tiers
- [ ] TODO: Create pricing plans
- [ ] TODO: Build feature gates
- [ ] TODO: Add usage metering

### Day 3: Revenue Optimization
- [ ] TODO: A/B testing framework
- [ ] TODO: Conversion optimization
- [ ] TODO: Churn reduction

### Day 4: Enterprise Features
- [ ] TODO: SSO integration
- [ ] TODO: Custom contracts
- [ ] TODO: White-labeling

---

## NAVIGATION

- **← Part 1:** [PHASE_TRACKER_PART1.md](./PHASE_TRACKER_PART1.md) - Phases 1-8
- **← Part 2:** [PHASE_TRACKER_PART2.md](./PHASE_TRACKER_PART2.md) - Phases 8.5-9.5
- **← Part 3:** [PHASE_TRACKER_PART3.md](./PHASE_TRACKER_PART3.md) - Phase 10
- **Part 4:** You are here - Phases 11-20

**Last Updated:** January 2025
