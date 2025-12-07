# PHASE 10.94: WORLD-CLASS FULL-TEXT EXTRACTION ENHANCEMENT - CORRECTED VERSION
**This is the CORRECTED Phase 10.94 section for Phase Tracker Part 4**
**Addresses all 10 critical gaps from PHASE_10.94_ARCHITECTURAL_EVALUATION.md**

---

## PHASE 10.94: WORLD-CLASS FULL-TEXT EXTRACTION - ENTERPRISE-GRADE MULTI-TIER ARCHITECTURE

**Duration:** 14 days (112-140 hours total) - 🔧 ENHANCED from 13 days (added Day 5.5 strict audit)
**Status:** 🔴 NOT STARTED - ⚠️ **ARCHITECTURAL REVIEW REQUIRED FIRST**
**Priority:** 🔥 CRITICAL - Current system "does not work fine"
**Type:** System Enhancement - Intelligent 5-Tier Extraction Architecture + Frontend Integration
**Dependencies:** Phase 10.93 Complete (Service layer architecture), All 8 free sources integrated
**Reference:** [PHASE_10.94_FULL_TEXT_EXTRACTION_IMPLEMENTATION_GUIDE.md](../PHASE_10.94_FULL_TEXT_EXTRACTION_IMPLEMENTATION_GUIDE.md)
**Evaluation:** [PHASE_10.94_ARCHITECTURAL_EVALUATION.md](../PHASE_10.94_ARCHITECTURAL_EVALUATION.md) - **READ THIS FIRST**
**Pattern:** Phase 10.6 Day 3.5 Service Extraction + Phase 10.91 Size Limits + Phase 10.93 Quality Gates
**Expected Outcome:** 6-10x content improvement (5000+ words vs 500-800), 95%+ success rate, enterprise-grade quality
**Innovation:** 5-tier cascading + GROBID + source routing + identifier enrichment + state management
**Quality Target:** 9.5/10 (Enterprise-Grade)

**⚠️ CRITICAL: READ BEFORE STARTING**
- [ ] Read PHASE_10.94_ARCHITECTURAL_EVALUATION.md (identifies 10 critical gaps)
- [ ] Review all NEW sections below (State Management, Frontend Integration, AbortController)
- [ ] Understand Day 5.5 STRICT AUDIT gate is MANDATORY (cannot skip)
- [ ] Verify all prerequisites (Docker, Redis, GROBID knowledge)
- [ ] Get team approval for 14-day timeline (not 13 days)

### 🎯 PURPOSE & PROBLEM STATEMENT

**Current Issue:** Full-text extraction "does not work fine" across 8 free academic sources with different formats

**8 Free Sources:**
1. Semantic Scholar - PDF URLs (openAccessPdf)
2. CrossRef - Landing pages only (no full-text)
3. PubMed - Abstracts + PMID (missing PMC linkage)
4. arXiv - Direct PDF URLs (works well)
5. PMC - Direct full-text content (underutilized)
6. ERIC - Conditional PDF URLs
7. CORE - Download URLs
8. Springer - OA PDF URLs only

**Critical Problems:**
- PDF extraction gets 781 words from 5000-word article (15% of content)
- No source-specific intelligence (treats all sources the same)
- Missing identifier enrichment (PMID → PMC, DOI → Unpaywall)
- Limited HTML extraction (only 7 publisher selectors)
- No GROBID or advanced extraction methods
- **No UI integration planned** (backend-only in original plan)
- **No state management for extraction progress**
- **No cancellation mechanism for long-running extractions**

**Solution:** 5-tier intelligent cascading extraction with GROBID, source routing, identifier enrichment, **PLUS** state management, frontend integration, and AbortController cancellation

---

## 📊 PHASE 10.94 ENHANCED OVERVIEW

**5-Tier Cascading Strategy:**
1. **Tier 1:** Direct Content (PMC fullText, fastest)
2. **Tier 2:** Direct PDF URLs (arXiv, CORE, Semantic Scholar)
3. **Tier 3:** Identifier-Based (PMID → PMC, DOI → Unpaywall, DOI → Publisher HTML)
4. **Tier 4:** Advanced Extraction (GROBID PDF parsing, Publisher HTML with landing pages)
5. **Tier 5:** Fallback (Abstract only)

**Implementation Timeline (14 Days):**
- **Day 0:** Infrastructure & Prerequisites (GROBID, Redis, monitoring) - 🔥 **MANDATORY**
- **Days 1-2:** Identifier Enrichment Service (PMID → PMC, DOI → PMID, Title → DOI)
- **Day 3:** Source-Specific Routing Logic (intelligent tier selection per source)
- **Days 4-5:** GROBID Integration (structured PDF extraction, 10x better than pdf-parse)
- **Day 5.5:** **STRICT AUDIT & QUALITY GATES** - 🆕 **CRITICAL CHECKPOINT**
- **Day 6:** Publisher HTML Enhancement (Unpaywall landing pages before PDF)
- **Days 7-8:** Unified Extraction Orchestrator + State Management + Frontend Integration
- **Day 9-10:** Comprehensive Testing (160 papers across all 8 sources)
- **Day 11:** Performance, Security, Load Testing, Rollback Testing
- **Day 12:** Documentation & Production Readiness
- **Day 13:** Migration Planning & Team Training
- **Day 14:** Final Production Deployment Prep

**Progress:** 0/14 days complete (0%)
**Quality Score:** Target 9.5/10 (Enterprise-Grade) - Same as Phase 10.93
**Expected Impact:** 5-6x word count improvement, 33% success rate improvement

---

## 🏗️ ARCHITECTURAL ENHANCEMENTS (NEW SECTIONS)

### 1️⃣ STATE MANAGEMENT STRATEGY (NEW - CRITICAL)

**Why Added:** Backend services need frontend state management for UI integration

**Zustand Store: Full-Text Extraction State**

**Location:** `frontend/lib/stores/fulltext-extraction.store.ts`

**State Schema:**
- Extraction progress (current paper, total papers, tier info)
- Extraction results (success/failure per paper)
- Real-time tier information (which tier being attempted)
- AbortController reference (for cancellation)
- Error state per paper (tier-specific errors)

**Integration Points:**
1. Literature page: "Extract Full-Text" button triggers extraction
2. Progress modal: Real-time progress display with tier info
3. Paper cards: Show extraction status and tier badges
4. Error notifications: Show user-friendly tier-specific errors

**Testing Requirements:**
- 20+ store tests (state transitions, actions)
- Integration tests: Store + Service + UI
- E2E tests: Full user workflow

---

### 2️⃣ FRONTEND INTEGRATION PLAN (NEW - CRITICAL)

**Why Added:** Backend services with no UI = incomplete implementation

**UI Changes Required:**

**1. Paper Card Enhancement:**
- New button: "Extract Full-Text (5-Tier System)"
- Tier badge: Show which tier extracted content (Tier 1-5)
- Extraction status: "Extracting...", "Success", "Failed at Tier 3"

**2. Progress Modal Update:**
- Current tier display: "Attempting Tier 3: Unpaywall API"
- Tier method name: "GROBID Structured Extraction"
- Real-time progress per tier
- Cancel button (uses AbortController)

**3. Settings Panel:**
- Feature flag toggle: "Use new 5-tier extraction (Phase 10.94)"
- Extraction history: Show recent extractions with tier info

**Migration Strategy:**
- Old papers: Keep existing extraction (no re-extraction)
- New papers: Automatically use new system (if flag ON)
- Manual re-extraction: User can trigger for any paper
- Database column: `extraction_system: 'legacy' | 'v2'`
- Database column: `extraction_tier: 1 | 2 | 3 | 4 | 5 | null`

**Breaking Changes:**
- None (new system is additive via feature flag)
- Old extraction still works when flag OFF

**Integration with Existing Features:**
1. Theme extraction workflow (calls new UnifiedFullTextExtractionService)
2. Paper management (displays tier badges, extraction metadata)
3. Export functionality (includes tier info in exported data)
4. Gap analysis (uses improved full-text content for better results)

---

### 3️⃣ ABORTCONTROLLER & CANCELLATION STRATEGY (NEW - CRITICAL)

**Why Added:** Prevents memory leaks from long-running GROBID extractions (Phase 10.93 lesson: stale closures caused errors)

**Pattern:** Every async operation receives AbortSignal parameter

**Service Integration:**
```typescript
// All services accept AbortSignal
async extract(paper: Paper, signal: AbortSignal): Promise<FullTextResult>
```

**Signal Checks:**
- Check signal before EVERY tier attempt
- Pass signal to ALL HTTP requests (Axios, fetch)
- Pass signal to GROBID processing
- Throw AbortError if signal.aborted === true

**Frontend Integration:**
```typescript
// Store manages AbortController
const abortControllerRef = useRef<AbortController | null>(null);

const startExtraction = () => {
  abortControllerRef.current = new AbortController();
  await service.extractBatch(papers, abortControllerRef.current.signal);
};

const cancelExtraction = () => {
  abortControllerRef.current?.abort();
  abortControllerRef.current = null;
};
```

**Testing:**
- Test cancel during Tier 1
- Test cancel during GROBID processing (Tier 4 - long-running)
- Test cancel during Unpaywall lookup (Tier 3)
- Verify no memory leaks after cancel
- Verify no zombie API calls after cancel

---

### 4️⃣ ERROR HANDLING STRATEGY (NEW - ENHANCED)

**Why Added:** Generic errors make debugging impossible (Phase 10.93 lesson: context preservation critical)

**Custom Error Classes:**
```typescript
// errors.ts - Tier-specific errors
export class Tier1DirectContentError extends ExtractionError { }
export class Tier2DirectPDFError extends ExtractionError { }
export class Tier3IdentifierLookupError extends ExtractionError { }
export class Tier4GROBIDError extends ExtractionError { }
export class Tier5FallbackError extends ExtractionError { }

// Base class with context
export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly tier: 1 | 2 | 3 | 4 | 5,
    public readonly paperId: string,
    public readonly source: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

**Error Logging:**
- Log ALL tier failures (not just final failure)
- Track tier success rates for monitoring
- User sees: "Failed at Tier 3: Unpaywall timeout" (not generic "500 Error")

**Error Recovery:**
- Automatic tier cascading (Tier 1 fails → try Tier 2)
- User can retry with different papers
- System doesn't crash on single paper failure

---

### 5️⃣ TYPE SAFETY ENFORCEMENT (NEW - ZERO TOLERANCE)

**Why Added:** Type errors slip into production without checkpoints (Phase 10.93 standard)

**Mandatory Rules:**
1. Zero `: any` type annotations (use `unknown` and type guards)
2. Zero `as` type assertions (create proper type guards instead)
3. Zero `@ts-ignore` comments (fix the types, don't suppress)
4. All service methods have explicit return types
5. All API responses have TypeScript interfaces

**Type Guards for External APIs:**
```typescript
// ✅ CORRECT: Type guard for Unpaywall response
function isUnpaywallResponse(data: unknown): data is UnpaywallResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'best_oa_location' in data
  );
}

// ❌ WRONG: Using 'as' assertion
const unpaywallData = response.data as UnpaywallResponse; // NEVER DO THIS
```

**Daily Checkpoints:**
- End of Day 1-2: TypeScript: 0 errors ✅
- End of Day 3: TypeScript: 0 errors ✅
- Day 5.5 STRICT AUDIT: Type safety gate (MANDATORY) ✅
- End of Day 4-5: TypeScript: 0 errors ✅
- End of Day 6: TypeScript: 0 errors ✅
- Day 11: Type safety regression test ✅

---

## 📅 IMPLEMENTATION TIMELINE (14 DAYS)

### DAY 0: Infrastructure & Prerequisites Setup (6-8 hours) 🔥 **MANDATORY - NOT OPTIONAL**

**Status:** MANDATORY PREREQUISITE (Phase 10.93 Day 0 pattern - infrastructure before code)

**Goal:** Set up ALL infrastructure before Day 1 implementation begins

**Why MANDATORY:** Cannot test GROBID on Day 4-5 if not deployed. Cannot cache without Redis. Need rollback plan before production.

#### Infrastructure Deployment (3-4 hours)

- [ ] Deploy GROBID Docker container (lfoppiano/grobid:0.8.0)
- [ ] Configure GROBID health checks (http://localhost:8070/api/isalive)
- [ ] Deploy Redis for caching (or verify existing Redis available)
- [ ] Test Redis connection and basic operations
- [ ] Configure Docker Compose for all services (GROBID, Redis, backend)
- [ ] Set up monitoring infrastructure (Prometheus, Grafana, or similar)
- [ ] Create monitoring dashboards skeleton (will populate metrics in Day 11)
- [ ] Verify all services start correctly and communicate

#### Environment Configuration (2-3 hours)

- [ ] Create .env.fulltext-extraction file with all required variables
- [ ] Configure GROBID_URL environment variable
- [ ] Configure Redis connection string (REDIS_HOST, REDIS_PORT)
- [ ] Verify API keys for all services (Unpaywall email, NCBI API key, etc.)
- [ ] Set up feature flags infrastructure (ENABLE_NEW_EXTRACTION=false initially)
- [ ] Configure rate limit settings for each API
- [ ] Document all environment variables in README
- [ ] Create environment variable checklist for deployment

#### Rollback & Safety Planning (1 hour)

- [ ] Create ROLLBACK_PLAN.md document with step-by-step procedures
- [ ] Document how to disable new extraction system (feature flag OFF)
- [ ] Document how to rollback GROBID deployment
- [ ] Define rollback triggers (error rate > 5%, success rate < 70%)
- [ ] Create monitoring alert thresholds
- [ ] Set up automated health checks
- [ ] Test rollback procedure (simulate rollback without actual deployment)
- [ ] Brief team on rollback procedures

#### API Quota & Cost Baseline (30-60 min)

- [ ] Document current API usage baselines (before new system)
- [ ] Set up API quota monitoring for all APIs
- [ ] Configure cost alerts for GROBID compute (if cloud-hosted)
- [ ] Set up quota exhaustion alerts (email/Slack when approaching limits)
- [ ] Document expected API usage per extraction (for capacity planning)

**End of Day 0 Checklist:**
- [ ] GROBID Docker running and accessible (MANDATORY)
- [ ] Redis deployed and tested (MANDATORY)
- [ ] All environment variables configured (MANDATORY)
- [ ] Monitoring infrastructure ready (MANDATORY)
- [ ] Rollback plan documented and tested (MANDATORY)
- [ ] API quota monitoring configured (MANDATORY)
- [ ] Team briefed on infrastructure (MANDATORY)
- [ ] ✅ Ready to start Day 1 - zero infrastructure blockers

**Success Criteria (MUST PASS):**
- [ ] GROBID health check returns 200 OK
- [ ] Redis ping returns PONG
- [ ] All API keys verified working
- [ ] Feature flags infrastructure tested (can toggle ON/OFF)
- [ ] Monitoring dashboards accessible
- [ ] Rollback procedure documented with step-by-step commands

**⚠️ GATE: Cannot proceed to Day 1 if ANY infrastructure item fails**

---

### DAY 1-2: Identifier Enrichment Service (16 hours) + TDD

**Goal:** Cross-reference papers to find missing identifiers (PMID → PMC, DOI → PMID, Title → DOI)

**Why This Matters:** Paper with only PMID can't use PMC or Unpaywall. After enrichment → Can use Tier 3.

**Test-Driven Development:** Write tests FIRST, then implementation (Phase 10.93 pattern)

#### Service Implementation WITH TDD (16 hours)

**Test-First Approach:**
1. Write failing test: "PMID → PMC ID lookup"
2. Implement minimal code to pass test
3. Refactor for quality
4. Repeat for each method

- [ ] Create test file FIRST: identifier-enrichment.service.test.ts
- [ ] Write 5 failing tests for PMID → PMC lookup
- [ ] Create IdentifierEnrichmentService class
- [ ] Implement PMID to PMC ID lookup (NCBI elink API) - make tests pass
- [ ] Write 5 failing tests for DOI → PMID lookup
- [ ] Implement DOI to PMID lookup (PubMed esearch API) - make tests pass
- [ ] Write 5 failing tests for Title → DOI lookup
- [ ] Implement Title to DOI lookup (CrossRef API with fuzzy matching) - make tests pass
- [ ] Write 5 failing tests for Semantic Scholar enrichment
- [ ] Implement Semantic Scholar enrichment (extract all externalIds) - make tests pass
- [ ] Add enrichPaper orchestrator method (tries all enrichment methods)
- [ ] Write 20+ integration tests (full enrichment workflows)
- [ ] Test with real papers (PubMed, CrossRef, no-identifier papers)
- [ ] Add error handling for API failures and rate limits
- [ ] Document service API and enrichment strategies

**Test Organization:**
- `__tests__/identifier-enrichment.service.test.ts` (80+ tests target)
- `__tests__/fixtures/ncbi-responses.ts` (mock data)
- Test coverage target: 85%+

**Service Size Enforcement (Phase 10.91 Standard):**
- [ ] IdentifierEnrichmentService < 250 lines (HARD LIMIT)
- [ ] All functions < 100 lines (HARD LIMIT)
- [ ] If service exceeds 250 lines → split into sub-services

**End of Day 2 Checklist:**
- [ ] IdentifierEnrichmentService created and tested (85%+ coverage)
- [ ] 70%+ of test papers get at least one new identifier
- [ ] PMID → PMC conversion rate: 40%+
- [ ] DOI → PMID conversion rate: 70%+
- [ ] Title → DOI conversion rate: 80%+
- [ ] TypeScript: 0 errors (MANDATORY)
- [ ] Service < 250 lines (MANDATORY)
- [ ] All functions < 100 lines (MANDATORY)
- [ ] Daily error check at 5 PM ✅

---

### DAY 3: Source-Specific Routing Logic (8 hours) + TDD

**Goal:** Route papers to best extraction method based on source type

**Example:** arXiv paper → Immediately use direct PDF (not PMC API or Unpaywall)

#### Routing Implementation WITH TDD (8 hours)

- [ ] Create test file FIRST: source-aware-extraction-router.service.test.ts
- [ ] Write 8 failing tests (one per source routing)
- [ ] Create SourceAwareExtractionRouter service
- [ ] Implement route method (returns ExtractionPlan) - make tests pass
- [ ] Define routing matrix for all 8 sources
- [ ] Add priority logic (Tier 1 > Tier 2 > Tier 3 > Tier 4 > Tier 5)
- [ ] Implement fallback cascade (if Tier 2 fails → try Tier 3)
- [ ] Add expected success rate prediction per tier
- [ ] Write 10+ fallback cascade tests
- [ ] Benchmark routing performance (should be < 100ms)
- [ ] Document routing decision tree

**Service Size Enforcement:**
- [ ] SourceAwareExtractionRouter < 200 lines (HARD LIMIT)
- [ ] All functions < 100 lines (HARD LIMIT)

**End of Day Checklist:**
- [ ] SourceAwareExtractionRouter created and tested
- [ ] All 8 sources have defined routing strategies
- [ ] Routing performance < 100ms
- [ ] Test coverage: 85%+
- [ ] TypeScript: 0 errors (MANDATORY)
- [ ] Service < 200 lines (MANDATORY)
- [ ] Daily error check at 5 PM ✅

---

### DAY 4-5: GROBID Integration (16 hours) + TDD

**Goal:** Integrate GROBID for structured PDF extraction (10x better than pdf-parse)

**Comparison:** pdf-parse gets 781 words | GROBID gets 5000+ words from same PDF

#### GROBID Setup & Integration WITH TDD (16 hours)

**Day 4: Docker Setup & Service Creation (8 hours)**

- [ ] Verify GROBID Docker from Day 0 is running
- [ ] Test GROBID health endpoint (should return 200 OK)
- [ ] Create test file FIRST: grobid-extraction.service.test.ts
- [ ] Write 5 failing tests for processPDF method
- [ ] Create GrobidExtractionService class
- [ ] Implement processPDF method (sends PDF to GROBID API) - make tests pass
- [ ] Write 5 failing tests for parseTEIXml method
- [ ] Implement parseTEIXml method (extracts sections from GROBID XML) - make tests pass
- [ ] Add structured section extraction (Introduction, Methods, Results, Discussion)
- [ ] Add timeout handling (30s for large PDFs)
- [ ] Add AbortSignal support (for cancellation)

**Day 5: Integration & Testing (8 hours)**

- [ ] Integrate GROBID as Tier 4 in extraction waterfall
- [ ] Write 10+ integration tests (full extraction flows)
- [ ] Test with arXiv PDFs (clean, well-formatted)
- [ ] Test with publisher PDFs (multi-column, complex layouts)
- [ ] Benchmark extraction time (should be < 10s for 20-page paper)
- [ ] Compare quality: GROBID vs pdf-parse side-by-side (20 papers)
- [ ] Add error handling for GROBID service failures
- [ ] Add retry logic for GROBID timeouts
- [ ] Document GROBID deployment guide
- [ ] Add GROBID health checks and monitoring

**Service Size Enforcement:**
- [ ] GrobidExtractionService < 300 lines (HARD LIMIT)
- [ ] All functions < 100 lines (HARD LIMIT)
- [ ] If service exceeds 300 lines → split parseTEIXml into separate class

**End of Day 5 Checklist:**
- [ ] GROBID service running and accessible
- [ ] GrobidExtractionService created and tested (85%+ coverage)
- [ ] GROBID extracts 3-10x more content than pdf-parse (verified)
- [ ] Extraction time < 10s per paper
- [ ] TypeScript: 0 errors (MANDATORY)
- [ ] Service < 300 lines (MANDATORY)
- [ ] Docker deployment guide created
- [ ] Daily error check at 5 PM ✅

---

### DAY 5.5: STRICT AUDIT & QUALITY GATES (3-4 hours) 🔥 **MANDATORY CHECKPOINT**

**Goal:** Catch bugs BEFORE comprehensive testing phase (Phase 10.93 Day 3.5 pattern)

**Status:** 🔥 **GATE - MUST PASS TO PROCEED TO DAY 6**

**Why CRITICAL:** Phase 10.93 caught zero critical bugs BECAUSE of Day 3.5 audit. Without this gate, bugs discovered on Day 9-10 instead of Day 5.5.

**Priority:** CRITICAL - Prevents technical debt from entering codebase

**Pattern:** Same strict audit applied in Phase 10.93 Days 1-4

#### Type Safety Audit (60 min) - ZERO TOLERANCE

- [ ] Search entire codebase for `any` types in new code (MUST BE ZERO)
- [ ] Search for `as` type assertions (should use type guards instead)
- [ ] Search for `@ts-ignore` comments (MUST BE ZERO)
- [ ] Verify all error classes have proper typing
- [ ] Verify all service methods have explicit return types
- [ ] Run `npm run typecheck` - MUST be 0 errors
- [ ] Document any unavoidable technical debt with justification

**Type Safety Score Target:** 10/10 (PERFECT)

#### Service Architecture Audit (45 min)

- [ ] Verify all services < 300 lines (MANDATORY - Phase 10.91 standard)
  - [ ] IdentifierEnrichmentService < 250 lines
  - [ ] SourceAwareExtractionRouter < 200 lines
  - [ ] GrobidExtractionService < 300 lines
- [ ] Verify all functions < 100 lines (MANDATORY)
- [ ] Check for service size violations → If found, MUST refactor before Day 6
- [ ] Verify single responsibility principle (each service does ONE thing)
- [ ] Check for proper constructor validation
- [ ] Verify JSDoc documentation complete for all services

**Service Architecture Score Target:** 10/10 (PERFECT)

#### React Best Practices Audit (45 min) - **ADDED FOR FRONTEND**

- [ ] Verify useCallback() on all event handlers (state management)
- [ ] Verify useRef() for service instances
- [ ] Verify useEffect() for mount/unmount lifecycle
- [ ] Check dependency arrays in hooks (no missing dependencies)
- [ ] Verify no prop drilling (use Zustand store)
- [ ] Check for stale closure prevention (use refs for latest values)

**React Best Practices Score Target:** 9.5/10

#### Security Review (45 min)

- [ ] Verify API tokens not logged or exposed
- [ ] Check GROBID accepts only validated PDFs (prevent malicious PDFs)
- [ ] Verify input validation on all service methods
- [ ] Check error messages don't leak sensitive data
- [ ] Verify rate limiting respected (retry logic)
- [ ] Check AbortController prevents leaked requests
- [ ] Verify no SSRF vulnerabilities (GROBID PDF URL validation)
- [ ] Document security assumptions and threats

**Security Score Target:** 9.5/10 (Zero CRITICAL issues)

#### Performance & Bundle Size Check (30 min)

- [ ] Run production build and measure bundle size
- [ ] Compare to Day 0 baseline (should not increase >5%)
- [ ] Check for accidentally imported large libraries
- [ ] Verify tree shaking works (no unused exports)
- [ ] Measure GROBID processing time (should be < 10s)
- [ ] Check for duplicate dependencies
- [ ] Profile memory usage (no leaks)

**Performance Score Target:** 9.5/10

#### Integration Verification (30 min)

- [ ] Test integration with theme extraction workflow
- [ ] Test integration with paper management
- [ ] Verify no breaking changes to dependent features
- [ ] Test backward compatibility with existing data
- [ ] Verify old extraction (feature flag OFF) still works

**Integration Score Target:** 10/10

**END OF DAY 5.5 QUALITY GATE CHECKLIST (MANDATORY):**

- [ ] ✅ TypeScript: 0 errors (MANDATORY) - **PASS/FAIL**
- [ ] ✅ Type safety: 0 `any`, 0 unsafe `as`, 0 `@ts-ignore` (MANDATORY) - **PASS/FAIL**
- [ ] ✅ All services < 300 lines (MANDATORY) - **PASS/FAIL**
- [ ] ✅ All functions < 100 lines (MANDATORY) - **PASS/FAIL**
- [ ] ✅ React best practices applied (useCallback, useRef, no stale closures) - **PASS/FAIL**
- [ ] ✅ Security review complete with no CRITICAL findings - **PASS/FAIL**
- [ ] ✅ Bundle size unchanged or smaller - **PASS/FAIL**
- [ ] ✅ All integrations working - **PASS/FAIL**
- [ ] ✅ Code review approved - **PASS/FAIL**

**GATE STATUS:** ✅ **PASS** / ❌ **FAIL**

**If ANY item FAILS:**
- ❌ **CANNOT PROCEED TO DAY 6**
- MUST fix issues IMMEDIATELY
- Re-run audit after fixes
- Document fixes in PHASE_10.94_DAY5.5_AUDIT_REPORT.md

**If ALL items PASS:**
- ✅ **APPROVED TO PROCEED TO DAY 6**
- Document approval in PHASE_10.94_DAY5.5_AUDIT_COMPLETE.md
- Overall Quality Score: Calculate (should be 9.5-10/10)

**Deliverables:**
- PHASE_10.94_DAY5.5_STRICT_AUDIT_COMPLETE.md (audit results)
- PHASE_10.94_DAY5.5_AUDIT_FINDINGS.md (if issues found)
- Quality Score: X/10 (must be > 9.0 to proceed)

---

### DAY 6: Publisher HTML Enhancement (8 hours) + TDD

**Goal:** Extract from Unpaywall landing pages BEFORE falling back to PDF

**User Example:** ScienceDirect landing page has full 5000-word article in 1s (vs 781 words in 7s from PDF)

#### HTML Enhancement WITH TDD (8 hours)

- [ ] Write tests FIRST for Tier 2.5 extraction
- [ ] Add Tier 2.5 to pdf-parsing.service.ts (between current Tier 2 and Tier 3)
- [ ] Query Unpaywall for url_for_landing_page
- [ ] Use existing HtmlFullTextService to scrape landing page
- [ ] Add new publisher selectors (Wiley, Taylor & Francis, SAGE)
- [ ] Enhance anti-scraping headers (User-Agent, Referer from Unpaywall)
- [ ] Test with user's ScienceDirect example
- [ ] Test with 10 different publishers
- [ ] Measure success rate (target: 60-70%)
- [ ] Test fallback to PDF when HTML fails (403 error)
- [ ] Test word count improvement (target: 5x increase)
- [ ] Document publisher selector patterns

**End of Day Checklist:**
- [ ] Tier 2.5 (Publisher HTML) integrated
- [ ] 4+ new publisher selectors added
- [ ] Success rate: 60-70% for HTML extraction
- [ ] Word count: 5x improvement when successful
- [ ] Graceful fallback to PDF on 403 errors
- [ ] Test coverage: 85%+
- [ ] TypeScript: 0 errors (MANDATORY)
- [ ] Daily error check at 5 PM ✅

---

### DAY 7-8: Unified Orchestrator + State Management + Frontend Integration (20 hours) 🔧 **ENHANCED**

**Enhanced From:** 16 hours → 20 hours (added state management + frontend integration)

**Goal:** Coordinate all 5 tiers + integrate with frontend + implement cancellation

#### Day 7: Core Orchestrator + AbortController (10 hours)

**Morning: Orchestrator Service (5 hours)**

- [ ] Create test file FIRST: unified-fulltext-extraction.service.test.ts
- [ ] Create UnifiedFullTextExtractionService class
- [ ] Implement main extract method with AbortSignal parameter (MANDATORY)
- [ ] Implement executePlan method (routes to tier-specific methods)
- [ ] Implement Tier 1: extractDirectContent (PMC, ERIC) with signal check
- [ ] Implement Tier 2: extractFromPDF (arXiv, CORE, Semantic Scholar) with signal check
- [ ] Implement Tier 3: extractViaIdentifiers (PMID → PMC, DOI → Unpaywall) with signal check
- [ ] Implement Tier 4: advancedExtraction (GROBID, Publisher HTML) with signal check
- [ ] Implement Tier 5: fallbackToAbstract
- [ ] Add signal.aborted checks before EVERY tier
- [ ] Pass signal to ALL HTTP requests (Axios, fetch)

**Afternoon: Logging, Metrics, Error Handling (5 hours)**

- [ ] Create tier-specific error classes (Tier1Error, Tier2Error, etc.)
- [ ] Add detailed tier logging (plan, attempts, success/failure)
- [ ] Add performance tracking per tier
- [ ] Implement metrics recording (tier attempts, success, time, word count)
- [ ] Write 15+ integration tests (full extraction flows)
- [ ] Test cascade fallbacks (Tier 1 → 2 → 3 → 4 → 5)
- [ ] Test cancellation at each tier (AbortController)
- [ ] Document extraction architecture and flow
- [ ] Create extraction flow diagram

**Service Size Enforcement:**
- [ ] UnifiedFullTextExtractionService < 400 lines (HARD LIMIT)
- [ ] If exceeds 400 lines → split into orchestrator + tier-executors

#### Day 8: State Management + Frontend Integration (10 hours) 🆕 **CRITICAL ADDITION**

**Morning: Zustand Store (5 hours) - NEW**

- [ ] Create `frontend/lib/stores/fulltext-extraction.store.ts`
- [ ] Define FullTextExtractionStore interface (state + actions)
- [ ] Implement extraction state (isExtracting, progress, results)
- [ ] Add AbortController management (start, cancel actions)
- [ ] Implement tier tracking (currentTier, tierMethod)
- [ ] Add error state per paper (tier-specific errors)
- [ ] Write 20+ store tests (state transitions, actions)
- [ ] Test store integration with services
- [ ] Document store API and usage patterns

**Afternoon: Frontend UI Integration (5 hours) - NEW**

- [ ] Update PaperCard.tsx with "Extract Full-Text" button
- [ ] Add tier badge display to PaperCard
- [ ] Update ThemeExtractionProgressModal with tier info
- [ ] Add current tier display ("Attempting Tier 3: Unpaywall")
- [ ] Add tier method name display ("GROBID Structured Extraction")
- [ ] Implement cancel button (calls store.cancelExtraction())
- [ ] Add Settings panel with feature flag toggle
- [ ] Create tier badge component (Tier 1-5 with colors)
- [ ] Add extraction status indicators ("Extracting...", "Success", "Failed")
- [ ] Test full user workflow (search → select → extract → view tier)

**Database Migration (1 hour) - NEW**

- [ ] Add `extraction_system: 'legacy' | 'v2'` column to Paper table
- [ ] Add `extraction_tier: 1 | 2 | 3 | 4 | 5 | null` column to Paper table
- [ ] Add `extraction_method: string` column (e.g., "grobid", "unpaywall_html")
- [ ] Create migration script
- [ ] Test migration on development database
- [ ] Document rollback procedure for migration

**Feature Flag + Rollback Testing (2 hours)**

- [ ] Add ENABLE_UNIFIED_EXTRACTION feature flag to config
- [ ] Update pdf-parsing.service.ts to use flag for conditional logic
- [ ] Keep old extraction as fallback (do NOT delete old implementation)
- [ ] Test with feature flag ON (new 5-tier system)
- [ ] Test with feature flag OFF (old implementation)
- [ ] Verify no regressions in old implementation
- [ ] Test mid-workflow rollback (flag ON → OFF during extraction)
- [ ] Verify data integrity after rollback
- [ ] Document rollback procedure with step-by-step commands

**Security Scan (1 hour)**

- [ ] Run npm audit and fix HIGH/CRITICAL issues
- [ ] Verify no secrets in code (API keys, tokens)
- [ ] Check CORS configuration
- [ ] Verify rate limiting protects against abuse
- [ ] Check input sanitization (paper IDs, DOIs, PMIDs)
- [ ] Verify GROBID doesn't accept untrusted PDF URLs (SSRF prevention)
- [ ] Document security posture in SECURITY.md

**End of Day 8 Checklist:**
- [ ] UnifiedFullTextExtractionService created and tested (85%+ coverage)
- [ ] All 5 tiers implemented and integrated
- [ ] Tier cascade works correctly (automatic fallbacks)
- [ ] AbortController cancellation working (all tiers)
- [ ] FullTextExtractionStore created and tested (20+ tests)
- [ ] Frontend UI updated (PaperCard, ProgressModal, Settings)
- [ ] Database migration created and tested
- [ ] Feature flag implemented and tested (ON and OFF)
- [ ] Rollback tested and documented (mid-workflow, under load)
- [ ] Security scan complete with no CRITICAL issues
- [ ] TypeScript: 0 errors (MANDATORY)
- [ ] Services < 400 lines (MANDATORY)
- [ ] Daily error check at 5 PM ✅

---

### DAY 9-10: Comprehensive Testing - ALL 8 SOURCES (16 hours)

**Goal:** Test extraction across all 8 sources with 160 real papers

(Content continues with existing Day 9-10 testing plan from original tracker...)

**End of Day 10 Checklist:**
- [ ] All 160 papers tested across 8 sources
- [ ] Overall success rate: 80%+ (vs current ~60%)
- [ ] Average word count: 3000+ (vs current 500-800)
- [ ] Average extraction time: < 5s
- [ ] arXiv success: 100%
- [ ] PMC success: 100%
- [ ] Zero critical bugs found
- [ ] Test results documented comprehensively
- [ ] TypeScript: 0 errors (MANDATORY)
- [ ] Daily error check at 5 PM ✅

---

### DAY 11: Performance, Security, Load & Rollback Testing (12-14 hours) 🔧 **ENHANCED**

(Content continues with existing Day 11 plan from original tracker...)

**End of Day 11 Checklist:**
- [ ] 3-tier caching implemented and tested
- [ ] Load testing passed for 50 concurrent users
- [ ] Security scan complete (zero CRITICAL issues)
- [ ] Rollback tested and documented
- [ ] API quota tracking verified
- [ ] TypeScript: 0 errors (MANDATORY)
- [ ] Daily error check at 5 PM ✅

---

### DAY 12-14: Documentation, Migration & Production Readiness (16-20 hours) 🆕 **EXTENDED**

**Enhanced From:** Day 12 only → Days 12-14 (added migration planning + team training)

#### Day 12: Documentation & Architecture (8 hours)

(Existing Day 12 content...)

#### Day 13: Migration Planning & Data Strategy (6-8 hours) 🆕 **CRITICAL FOR PRODUCTION**

**Why Added:** Production deployment needs migration plan for existing papers

**Morning: Migration Strategy (4 hours)**

- [ ] Define migration strategy for existing papers
  - [ ] Old papers: Keep existing extraction (no automatic re-extraction)
  - [ ] New papers: Automatically use new system (if flag ON)
  - [ ] Manual re-extraction: User-triggered for any paper
- [ ] Create migration script for database columns
- [ ] Document breaking changes (if any - should be ZERO)
- [ ] Create data migration runbook
- [ ] Test migration on staging environment
- [ ] Verify rollback of migration (can revert database changes)

**Afternoon: Team Training & Handoff (2-4 hours)**

- [ ] Create team training presentation (new 5-tier architecture)
- [ ] Document troubleshooting guides for each tier
- [ ] Create debugging checklist for production issues
- [ ] Brief team on feature flag toggle procedure
- [ ] Practice rollback drill with team
- [ ] Create on-call escalation paths
- [ ] Document monitoring dashboards and alerts

#### Day 14: Final Production Deployment Prep (2-4 hours) 🆕 **FINAL CHECKLIST**

**Morning: Final Pre-Production Checks (2 hours)**

- [ ] Verify ALL Day 5.5 quality gates still pass
- [ ] Re-run TypeScript compilation (MUST be 0 errors)
- [ ] Re-run security scan (MUST have zero CRITICAL issues)
- [ ] Verify feature flag infrastructure working
- [ ] Verify rollback procedure documented and tested
- [ ] Verify monitoring dashboards configured
- [ ] Verify API quota tracking accurate

**Afternoon: Production Deployment Checklist (2 hours)**

- [ ] Create production deployment checklist
- [ ] Define deployment timeline (Week 1: 10%, Week 2: 50%, Week 3: 100%)
- [ ] Define rollback triggers (error rate > 5%, success rate < 70%)
- [ ] Create production runbook (step-by-step deployment)
- [ ] Brief stakeholders on deployment plan
- [ ] Schedule deployment window
- [ ] Create post-deployment verification plan
- [ ] Document success criteria for each deployment stage

**Final Phase 10.94 Completion Checklist:**
- [ ] All 14 days complete
- [ ] All 10 gaps from evaluation addressed
- [ ] TypeScript: 0 errors (FINAL CHECK)
- [ ] Day 5.5 quality gates: ALL PASSED
- [ ] Production deployment plan: COMPLETE
- [ ] Team training: COMPLETE
- [ ] Phase 10.94 development: ✅ **COMPLETE**

---

## 📊 PHASE 10.94 SUCCESS METRICS (ENHANCED)

**Code Quality Metrics:**

| Metric | Before | After | Target | Status |
|--------|--------|-------|--------|--------|
| Success Rate | 60% | 80-85% | 80%+ | Goal |
| Average Words | 500-800 | 3000-5000 | 3000+ | Goal |
| Extraction Time | 5-10s | 3-5s | < 5s | Goal |
| arXiv Success | 95% | 100% | 100% | Goal |
| PMC Success | 90% | 100% | 100% | Goal |
| Service Count | 3 | 8 | - | - |
| Test Coverage | 60% | 85%+ | 80%+ | Goal |
| Quality Score | 6/10 | 9.5/10 | 9.5+ | Goal |
| **Day 5.5 Audit Score** | N/A | 9.5/10 | 9.5+ | **NEW** |

**Architecture Compliance Metrics (NEW):**

| Metric | Target | Status |
|--------|--------|--------|
| Services < 300 lines | 100% | ENFORCED |
| Functions < 100 lines | 100% | ENFORCED |
| Type Safety (zero `any`) | 100% | ENFORCED |
| State Management (Zustand only) | 100% | IMPLEMENTED |
| AbortController (all async) | 100% | IMPLEMENTED |
| Frontend Integration | 100% | IMPLEMENTED |

---

## ✅ COMPLETION CRITERIA (ENHANCED)

**Technical Criteria:**
- [ ] All 5 tiers implemented and tested
- [ ] 8 new services created (Identifier, Router, GROBID, Unified, Store, etc.)
- [ ] GROBID Docker deployed and accessible
- [ ] State management implemented (Zustand store)
- [ ] Frontend integration complete (UI components updated)
- [ ] AbortController cancellation working
- [ ] Test coverage > 85% (all services + integration + E2E)
- [ ] TypeScript: 0 errors (MANDATORY)
- [ ] All services < 400 lines (MANDATORY)
- [ ] All functions < 100 lines (MANDATORY)
- [ ] Day 5.5 quality gate: PASSED
- [ ] Production build successful

**Functional Criteria:**
- [ ] Overall success rate > 80% (vs current ~60%)
- [ ] Average word count > 3000 (vs current 500-800)
- [ ] Average extraction time < 5s
- [ ] arXiv success: 100%
- [ ] PMC success: 100%
- [ ] All 8 sources tested with 20 papers each (160 total)
- [ ] No regressions in existing functionality
- [ ] User can cancel extraction mid-workflow
- [ ] Feature flag toggle works (ON/OFF)

**Documentation Criteria:**
- [ ] 5-tier architecture documented with diagrams
- [ ] State management documented (store API, usage)
- [ ] Frontend integration documented (UI changes)
- [ ] AbortController pattern documented
- [ ] Migration guide created
- [ ] Production runbook created
- [ ] Team training complete

**Production Readiness Criteria:**
- [ ] Feature flags implemented
- [ ] Monitoring dashboards configured
- [ ] Rollback procedures documented AND TESTED
- [ ] Rollback tested mid-workflow (data integrity verified)
- [ ] Load testing passed (50+ concurrent users)
- [ ] Security scan complete (zero CRITICAL issues)
- [ ] API quota tracking verified
- [ ] Migration plan documented
- [ ] Team trained on new system

**Business Criteria:**
- [ ] User problem resolved ("extraction does not work fine" → "works excellent")
- [ ] Quality improvement measurable (6/10 → 9.5/10)
- [ ] Success rate improvement measurable (60% → 80%+)
- [ ] Content quality improvement measurable (5-6x more words)
- [ ] Architecture sustainable for 2+ years
- [ ] All 8 free sources work reliably
- [ ] **Phase 10.94 evaluation gaps: ALL 10 ADDRESSED**

---

## 🎓 LESSONS APPLIED FROM PREVIOUS PHASES

**From Phase 10.91:**
- ✅ Component size limits prevent God classes (services < 300 lines)
- ✅ Single state management pattern (Zustand only)
- ✅ Service extraction pattern (business logic in services)

**From Phase 10.92:**
- ✅ Bug fixes complete before new features (Phase 10.93 dependency)
- ✅ Type safety enforced from Day 1
- ✅ Database migrations tested with rollback

**From Phase 10.93:**
- ✅ Day 5.5 strict audit gate (Phase 10.93 Day 3.5 pattern)
- ✅ AbortController prevents stale closures
- ✅ TDD approach (write tests first)
- ✅ Error context preservation (tier-specific errors)
- ✅ Rollback testing (mid-workflow, under load)
- ✅ Quality score: 9.5/10 target (same as Phase 10.93)

---

## 📚 REFERENCES (ENHANCED)

**Architectural Evaluation:**
- [PHASE_10.94_ARCHITECTURAL_EVALUATION.md](../PHASE_10.94_ARCHITECTURAL_EVALUATION.md) - **READ FIRST** - Identifies 10 critical gaps

**Internal Documentation:**
- [PHASE_10.94_FULL_TEXT_EXTRACTION_IMPLEMENTATION_GUIDE.md](../PHASE_10.94_FULL_TEXT_EXTRACTION_IMPLEMENTATION_GUIDE.md) - Original technical guide
- [literature/ARCHITECTURE.md](../frontend/app/(researcher)/discover/literature/ARCHITECTURE.md) - Architecture guidelines

**Pattern Sources:**
- Phase 10.6 Day 3.5 - Service extraction pattern (semantic-scholar.service.ts)
- Phase 10.91 Days 1-17 - Component size limits, testing standards
- Phase 10.93 Days 1-5 - Service layer architecture, Day 3.5 strict audit

**External Resources:**
- [GROBID Documentation](https://grobid.readthedocs.io/)
- [Unpaywall API](https://unpaywall.org/products/api)
- [PMC E-utilities Guide](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
- [CrossRef API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)

---

## 🚨 CRITICAL WARNINGS

**⚠️ DO NOT START IMPLEMENTATION WITHOUT:**
1. Reading PHASE_10.94_ARCHITECTURAL_EVALUATION.md (10,000+ words)
2. Understanding all 10 gaps and how they're addressed
3. Team approval for 14-day timeline (not 13 days)
4. Completing Day 0 infrastructure setup (MANDATORY)
5. Understanding Day 5.5 strict audit is NON-NEGOTIABLE

**⚠️ DO NOT SKIP:**
- Day 0: Infrastructure setup
- Day 5.5: Strict audit & quality gates
- Day 11: Rollback testing
- Day 13: Migration planning

**⚠️ DO NOT COMPROMISE ON:**
- Service size limits (< 300 lines)
- Type safety (zero `any`, zero `@ts-ignore`)
- Test coverage (85%+)
- Quality gates (all must pass)

---

**End of Phase 10.94 Corrected Section**
**Status:** ✅ READY FOR REVIEW
**All 10 Gaps Addressed:** YES
**Quality Target:** 9.5/10 (Enterprise-Grade)
**Duration:** 14 days (112-140 hours)

**Next Step:** Replace existing Phase 10.94 section in PHASE_TRACKER_PART4.md with this corrected version
