# Phase 10.155: Netflix-Grade Iterative Paper Fetching System

**Date**: December 14, 2025
**Status**: Week 1 Complete - Week 2 In Progress
**Priority**: Critical - Core Pipeline Architecture Change
**Last Updated**: December 14, 2025 (Post-Audit Revision)

---

## Executive Summary

This phase implements an iterative paper fetching system that guarantees delivery of 300 high-quality papers (or maximum available) through adaptive quality thresholds and iterative re-fetching. The system addresses a critical UX issue where animation shows "300 selected" but only 82 papers are delivered.

---

## Problem Analysis

### Root Cause

- **Line 705** (`search-pipeline.service.ts`): Filters by `qualityScore >= 20` (metadata-based)
- **Line 722**: Sorts by `overallScore` (composite score)
- **Critical Issue**: `overallScore` calculated in `calculateCombinedScores()` AFTER filtering, but filter runs BEFORE

### Timing Analysis (Audit Fix #1)

**IMPORTANT**: `calculateCombinedScores()` requires `semanticScore` and `themeFitScore` which are calculated during semantic scoring:

```
Current Flow (Non-Streaming):
BM25 → Semantic Scoring → calculateCombinedScores() → Filter → Sort
                ↑                      ↑                  ↑
         adds semanticScore    needs semanticScore   uses qualityScore (WRONG)

Current Flow (Streaming - search-stream.service.ts line 874):
BM25 → Semantic Scoring → calculateCombinedScores() → Filter → Emit
                                      ↑                  ↑
                              already called       already has overallScore (OK)
```

**Key Insight**: The streaming path already calculates `overallScore` before emit. The issue is in the non-streaming path in `search-pipeline.service.ts`.

### Impact

- Papers delivered: 27% of target (82/300)
- Animation accuracy: 0% (misleading "300 selected")
- Social science papers penalized due to sparse metadata

---

## Technical Specifications

### 1. Adaptive Quality Threshold Service ✅ IMPLEMENTED

**File**: `backend/src/modules/literature/services/adaptive-quality-threshold.service.ts`

```typescript
// Field-based initial thresholds
const FIELD_THRESHOLDS: Record<string, number> = {
  'biomedical': 60,
  'physics': 55,
  'computer-science': 55,
  'social-science': 45,
  'humanities': 40,
  'interdisciplinary': 50, // default
};

// Progressive relaxation sequence
const RELAXATION_SEQUENCE = [60, 50, 40, 35, 30];

// Confidence threshold for field detection (Audit Fix #2)
// Lowered from 0.6 to 0.35 to accept single strong keyword matches
const FIELD_CONFIDENCE_THRESHOLD = 0.35;

// Field detection returns confidence scoring (Audit Fix #2)
interface FieldDetectionResult {
  field: AcademicField;
  confidence: number;
  matchedKeywords: string[];
  totalKeywordsChecked: number;
}
```

### 2. Iterative Fetch Service ✅ IMPLEMENTED

**File**: `backend/src/modules/literature/services/iterative-fetch.service.ts`

```typescript
// Iteration configuration
const DEFAULT_CONFIG: IterativeFetchConfig = {
  targetPaperCount: 300,
  maxIterations: 4,
  baseFetchLimit: 600,
  maxFetchLimit: 2000,
  minThreshold: 30,
  diminishingReturnsThreshold: 0.05, // 5%
  sourceExhaustionThreshold: 0.5, // 50%
  iterationTimeoutMs: 40000, // 40s
};

// Fetch limit multipliers
const FETCH_MULTIPLIERS = [1, 1.5, 2.25, 3.33]; // 600, 900, 1350, 2000

// Stop conditions
type StopReason =
  | 'TARGET_REACHED'        // filtered.length >= 300
  | 'RELAXING_THRESHOLD'    // Need more papers, relaxing threshold
  | 'MAX_ITERATIONS'        // iteration > 4
  | 'DIMINISHING_RETURNS'   // yieldRate < 5% (iteration > 1)
  | 'SOURCES_EXHAUSTED'     // all sources returned < 50%
  | 'MIN_THRESHOLD'         // can't relax below 30
  | 'USER_CANCELLED'        // user clicked cancel
  | 'TIMEOUT';              // iteration timeout
```

### 3. Memory Management (Audit Fix #3)

```typescript
// IterationState - papers stored per-search, not globally
interface IterationState {
  allPapers: Map<string, PaperWithOverallScore>; // Deduplicated collection
  exhaustedSources: Set<string>;                  // Track exhausted sources
  // ... cleared when search completes
}

// Memory strategy:
// 1. Papers stored in Map (deduped by DOI/title) - max ~2000 unique
// 2. State cleared via SearchStreamService.cleanupSearch()
// 3. Semantic embeddings cached separately in EmbeddingCacheService
// 4. Only papers above threshold delivered to frontend
```

### 4. Deduplication Strategy (Audit Fix #5)

```typescript
// Priority: DOI > normalized title
generatePaperKey(paper: { doi?: string; title?: string }): string {
  if (paper.doi && paper.doi.trim().length > 0) {
    return `doi:${paper.doi.toLowerCase().trim()}`;
  }
  if (paper.title && paper.title.trim().length > 0) {
    return `title:${this.normalizeTitle(paper.title)}`;
  }
  return `unknown:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // Remove punctuation
    .replace(/\s+/g, ' ')     // Collapse whitespace
    .trim()
    .substring(0, 100);       // Truncate for efficiency
}
```

### 5. Source Exhaustion Tracking (Audit Fix #6)

```typescript
// Per-source tracking
sourcePaperCounts.forEach((count, source) => {
  const exhaustionRate = count / fetchLimit;
  if (exhaustionRate < config.sourceExhaustionThreshold) {
    state.exhaustedSources.add(source);
  }
});

// Decision logic
if (state.exhaustedSources.size >= totalSourceCount) {
  return { shouldContinue: false, reason: 'SOURCES_EXHAUSTED' };
}
```

### 6. User Cancellation Protocol (Audit Fix #7)

```typescript
// On cancel:
cancelIteration(state: IterationState): void {
  state.cancelled = true;
  // 1. Stop current iteration immediately (checked in shouldContinue)
  // 2. Deliver all papers found so far (getFilteredPapers)
  // 3. Clear iteration state (handled by caller)
  // 4. Emit cancellation event (iteration_complete with USER_CANCELLED)
}
```

### 7. WebSocket Events ✅ IMPLEMENTED

**Files**:
- `backend/src/modules/literature/dto/search-stream.dto.ts`
- `frontend/lib/types/search-stream.types.ts`
- `frontend/lib/hooks/useSearchWebSocket.ts`

```typescript
interface IterationProgressEvent {
  type: 'iteration_start' | 'iteration_progress' | 'iteration_complete';
  searchId: string;
  iteration: number;
  totalIterations: number;
  fetchLimit: number;
  threshold: number;
  papersFound: number;
  targetPapers: number;
  newPapersThisIteration: number;
  yieldRate: number;
  sourcesExhausted: string[];
  reason?: IterationStopReason;
  field?: AcademicField;  // Added for debugging
  timestamp: number;
}

// WebSocket event types registered:
// 'search:iteration-start'
// 'search:iteration-progress'
// 'search:iteration-complete'
```

### 8. WebSocket Event Timing (Audit Fix #4)

```typescript
// Progressive emission strategy:
// 1. Emit papers from each iteration as they complete
// 2. Frontend shows partial results during iteration
// 3. Label clearly shows iteration progress

// Emit iteration start
emitIterationProgress({
  type: 'iteration_start',
  iteration: 1,
  papersFound: 0,
  targetPapers: 300,
  threshold: 60,
});

// Emit iteration progress (papers found)
emitIterationProgress({
  type: 'iteration_progress',
  iteration: 1,
  papersFound: 82,
  targetPapers: 300,
  newPapersThisIteration: 82,
});

// Emit iteration complete (moving to next iteration)
emitIterationProgress({
  type: 'iteration_complete',
  iteration: 1,
  papersFound: 82,
  targetPapers: 300,
  reason: 'RELAXING_THRESHOLD',
  // Will continue with iteration 2
});
```

### 9. Pipeline Filter Change (Audit Fix #9)

**File**: `backend/src/modules/literature/services/search-pipeline.service.ts`

```typescript
// BEFORE (Line 705)
const qualityFiltered = papersForSemantic.filter(
  (p: MutablePaper) => (p.qualityScore ?? 0) >= QUALITY_THRESHOLD
);

// AFTER - Correct signature (Audit Fix #9)
// Note: calculateCombinedScores requires papers WITH semantic scores
// So semantic scoring must run first
const scoredPapers = this.calculateCombinedScores(
  papersWithSemanticScores,  // Papers that have semanticScore set
  0.15,  // bm25Weight
  0.55,  // semanticWeight
  0.30,  // themeFitWeight
);

// Then filter by overallScore with adaptive threshold
const qualityFiltered = scoredPapers.filter(
  (p: MutablePaper) => {
    const score = p.overallScore ?? p.qualityScore ?? 0;
    return score >= currentThreshold;
  }
);
```

### 10. Threshold Service Integration (Audit Fix #10)

```typescript
// In SearchStreamService:
const recommendation = this.adaptiveThreshold.getThresholdRecommendation(query);
// Returns: { field: 'biomedical', threshold: 60, confidence: 0.75, ... }

// Pass to iteration service:
const state = this.iterativeFetch.createInitialState(query, config);
// state.field = 'biomedical'
// state.currentThreshold = 60
// state.currentIteration = 0

// During iteration, get next threshold:
const nextRec = this.adaptiveThreshold.getNextThresholdRecommendation(
  currentThreshold,  // 60
  field,             // 'biomedical'
  iteration,         // 1
  papersFound,       // 82
  targetPapers,      // 300
);
// Returns: { threshold: 50, relaxationReason: 'Below target', ... }
```

---

## Performance Expectations (Audit Fix #8)

### Realistic Timeline per Iteration

| Iteration | Fetch Limit | Semantic Scoring | Total Time | Cumulative |
|-----------|-------------|------------------|------------|------------|
| 1 | 600 | ~10s | ~15s | 15s |
| 2 | 900 | ~15s | ~22s | 37s |
| 3 | 1350 | ~22s | ~33s | 70s |
| 4 | 2000 | ~35s | ~50s | 120s |

**Worst Case**: 120s if all 4 iterations run

### Early Termination Optimization

```typescript
// If iteration 1 yields 250+ papers with high scores:
// - Calculate expected yield for next iteration
// - If expected yield < 50 papers, stop early

if (papersFound >= 250 && yieldRate > 0.4) {
  // Likely to hit target with current batch
  // Consider stopping to save time
}
```

### Target Performance

- **Best case** (target in iteration 1): ~15s
- **Average case** (target in iteration 2): ~37s
- **Worst case** (all iterations): ~120s
- **Acceptable threshold**: <60s for 90% of queries

---

## Files to Modify

### Backend (5 files)

| File | Change Type | Status |
|------|-------------|--------|
| `adaptive-quality-threshold.service.ts` | NEW | ✅ DONE |
| `iterative-fetch.service.ts` | NEW | ✅ DONE |
| `literature.module.ts` | MODIFY | ✅ DONE (services registered) |
| `search-pipeline.service.ts` | MODIFY | ⏳ Week 2 |
| `search-stream.service.ts` | MODIFY | ⏳ Week 2 |

### Frontend (6 files)

| File | Change Type | Status |
|------|-------------|--------|
| `search-stream.types.ts` | MODIFY | ✅ DONE |
| `search-stream.dto.ts` | MODIFY | ✅ DONE |
| `useSearchWebSocket.ts` | MODIFY | ✅ DONE |
| `constants.ts` (PipelineOrchestra) | MODIFY | ⏳ Week 3 |
| `LiveCounter.tsx` | MODIFY | ⏳ Week 3 |
| `IterationLoopVisualizer.tsx` | NEW | ⏳ Week 3 |

---

## Implementation Checklist

### Phase 0: Pre-Implementation ✅ COMPLETE

- [x] Commit current state: `git commit -m "Phase 10.155: Pre-iterative-fetch checkpoint"`
- [x] Create feature branch: `git checkout -b feature/iterative-fetch-system`
- [x] Verify clean state

### Week 1: Foundation ✅ COMPLETE

#### Day 1-2: Threshold Service ✅

- [x] Create `adaptive-quality-threshold.service.ts`
- [x] Implement `detectField()` with confidence scoring (Audit Fix #2)
- [x] Implement `getInitialThreshold()`
- [x] Implement `getNextThresholdRecommendation()`
- [x] Field confidence threshold: 0.35 (accepts single keyword matches)
- [x] 45 unit tests passing

#### Day 3-4: Iterative Fetch Service ✅

- [x] Create `iterative-fetch.service.ts`
- [x] Implement `createInitialState()` with field detection
- [x] Implement `processIterationResults()` with deduplication (Audit Fix #5)
- [x] Implement `shouldContinue()` with all stop conditions
- [x] Implement source exhaustion tracking (Audit Fix #6)
- [x] Implement `cancelIteration()` (Audit Fix #7)
- [x] 35 unit tests passing

#### Day 5: WebSocket Events ✅

- [x] Add `IterationProgressEvent` type to backend DTO
- [x] Add iteration events to frontend types
- [x] Add event handlers to `useSearchWebSocket.ts`
- [x] Event constants: `ITERATION_START`, `ITERATION_PROGRESS`, `ITERATION_COMPLETE`

#### Week 1 Audit ✅

- [x] Services registered in `literature.module.ts`
- [x] TypeScript passes (frontend + backend)
- [x] NestJS build succeeds
- [x] 80/80 unit tests pass
- [x] Micro-optimization: removed redundant `.toLowerCase()` calls

### Week 2: Pipeline Integration (Days 6-10) ✅ COMPLETE

#### Day 6-7: Critical Pipeline Fix ✅

- [x] **CRITICAL**: Updated Stage 4 filter to use `overallScore` instead of `qualityScore`
- [x] Filter now uses: `(p.overallScore ?? p.qualityScore ?? 0) >= QUALITY_THRESHOLD`
- [x] Updated test to verify sorting by `overallScore`
- [x] 48/48 search-pipeline tests pass

#### Day 8-9: Integration ✅

- [x] Imported `IterativeFetchService` and `AdaptiveQualityThresholdService`
- [x] Injected services in `SearchStreamService` constructor
- [x] Added `iterationState` to `SearchState` interface
- [x] Initialize iteration state with field detection at search start
- [x] Added iteration event emission methods (start, progress, complete)
- [x] Emit iteration start event before ranking
- [x] Emit iteration complete event after ranking with results

#### Day 10: Edge Cases ✅

- [x] Connected `cancelSearch()` to iteration state
- [x] Emit `USER_CANCELLED` iteration complete event on cancel
- [x] Papers found, elapsed time, exhausted sources included in event

#### Week 2 Verification ✅

- [x] 145/145 tests pass across all related modules
- [x] TypeScript compiles without errors
- [x] All iteration events properly typed
- [x] Cancellation properly propagated to iteration state

### Week 3: Frontend Animation (Days 11-15) ⏳ NOT STARTED

(unchanged)

### Week 4: Optimization & Polish (Days 16-20) ⏳ NOT STARTED

(unchanged)

---

## Testing Queries (Audit Fix #10)

### Standard Tests

| Query | Expected Field | Initial Threshold | Notes |
|-------|---------------|-------------------|-------|
| "quantum mechanics particle entanglement" | physics | 55 | Unambiguous physics |
| "cancer immunotherapy clinical trials" | biomedical | 60 | High confidence |
| "machine learning neural networks" | computer-science | 55 | CS keywords |
| "political behavior voting election democracy" | social-science | 45 | Multiple social keywords |
| "renaissance art history" | humanities | 40 | Clear humanities |

### Edge Case Tests (Audit Fix #10)

| Query | Expected Behavior | Notes |
|-------|-------------------|-------|
| "xyzabc123 nonexistent" | 0 papers, graceful stop | No matches |
| "research" | Interdisciplinary fallback | Too broad |
| "quantum computing algorithms" | CS (not physics) | "computing" + "algorithm" = CS |
| "covid mental health depression" | Social-science | Mental health keywords |

---

## Success Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Papers delivered vs target | 27% (82/300) | 90%+ (270+/300) | ⏳ Week 2 |
| Animation accuracy | 0% (misleading) | 100% (honest) | ⏳ Week 3 |
| Filter uses correct score | `qualityScore` | `overallScore` | ⏳ Week 2 |
| Search time | 25s | < 60s | ⏳ Week 4 |
| Unit tests passing | 80/80 | 80/80 | ✅ DONE |

---

## Risk Mitigation (Updated)

| Risk | Probability | Impact | Mitigation | Status |
|------|-------------|--------|------------|--------|
| Infinite loop | Low | High | Hard cap at 4 iterations + 40s timeout | ✅ Implemented |
| Memory exhaustion | Medium | High | State cleared per-search, cap at 2000 papers | ✅ Implemented |
| Field misclassification | Medium | Low | Confidence scoring + interdisciplinary fallback | ✅ Implemented |
| Source exhaustion | Low | Medium | Per-source tracking, skip exhausted | ✅ Implemented |
| User cancellation | Low | Low | Deliver partial results, clear state | ✅ Implemented |
| `overallScore` undefined | Low | High | Fallback to `qualityScore ?? 0` | ⏳ Week 2 |
| Performance > 60s | Medium | Medium | Early termination, parallel fetching | ⏳ Week 4 |

---

## Commits on `feature/iterative-fetch-system`

| Commit | Description | Date |
|--------|-------------|------|
| `d45a1cc` | Micro-optimization - Remove redundant toLowerCase() | Dec 14 |
| `9f834a8` | Netflix-Grade Audit Fixes | Dec 14 |
| `cd35fa6` | Week 1: Iterative Fetch Foundation | Dec 14 |

---

## Audit Response Summary

| Audit Issue | Priority | Status |
|-------------|----------|--------|
| #1 Timing mismatch | P1 | ✅ Clarified in doc |
| #2 Field detection accuracy | P1 | ✅ Implemented with 0.35 confidence |
| #3 Memory management | P2 | ✅ Clarified in doc |
| #4 WebSocket event timing | P2 | ✅ Clarified in doc |
| #5 Deduplication | P2 | ✅ Implemented DOI/title |
| #6 Source exhaustion | P2 | ✅ Implemented per-source |
| #7 User cancellation | P3 | ✅ Implemented |
| #8 Performance | P2 | ✅ Realistic targets in doc |
| #9 Code example fix | P1 | ✅ Fixed in doc |
| #10 Threshold integration | P2 | ✅ Clarified in doc |
| #11 Edge case tests | P3 | ✅ Added to doc |

---

*Phase 10.155 - Created December 14, 2025*
*Last Updated: December 14, 2025 (Post-Audit Revision)*
