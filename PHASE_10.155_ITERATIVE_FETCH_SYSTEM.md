# Phase 10.155: Netflix-Grade Iterative Paper Fetching System

**Date**: December 14, 2025
**Status**: Planning Complete - Ready for Implementation
**Priority**: Critical - Core Pipeline Architecture Change

---

## Executive Summary

This phase implements an iterative paper fetching system that guarantees delivery of 300 high-quality papers (or maximum available) through adaptive quality thresholds and iterative re-fetching. The system addresses a critical UX issue where animation shows "300 selected" but only 82 papers are delivered.

---

## Problem Analysis

### Root Cause

- **Line 705** (`search-pipeline.service.ts`): Filters by `qualityScore >= 20` (metadata-based)
- **Line 722**: Sorts by `overallScore` (composite score)
- **Critical Issue**: `overallScore` calculated in `calculateCombinedScores()` AFTER filtering, but filter runs BEFORE

### Impact

- Papers delivered: 27% of target (82/300)
- Animation accuracy: 0% (misleading "300 selected")
- Social science papers penalized due to sparse metadata

### Current Flow (Broken)

```
COLLECT → DEDUPE → FILTER(qualityScore>=20) → SCORE(overallScore) → DELIVER(82)
                           ↑                        ↑
                     FILTERS HERE              CALCULATES HERE
                     (too early)               (too late)
```

### Fixed Flow

```
COLLECT → DEDUPE → SCORE(overallScore) → FILTER(overallScore>=threshold) → DELIVER(300)
                          ↑                           ↑
                   CALCULATE HERE               FILTER HERE
                   (before filter)              (after scoring)
```

---

## Technical Specifications

### 1. Adaptive Quality Threshold Service

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

// Field detection keywords
const FIELD_KEYWORDS: Record<string, string[]> = {
  'biomedical': ['medical', 'clinical', 'health', 'disease', 'patient', 'drug', 'therapy', 'cancer', 'covid'],
  'physics': ['quantum', 'particle', 'physics', 'energy', 'matter', 'relativity', 'cosmology'],
  'computer-science': ['algorithm', 'machine learning', 'AI', 'software', 'computing', 'neural', 'deep learning'],
  'social-science': ['social', 'political', 'economic', 'society', 'behavior', 'psychology', 'policy'],
  'humanities': ['history', 'philosophy', 'literature', 'art', 'culture', 'religion', 'ethics'],
};

// Confidence threshold for field detection
const FIELD_CONFIDENCE_THRESHOLD = 0.6; // 60%
```

### 2. Iterative Fetch Service

**File**: `backend/src/modules/literature/services/iterative-fetch.service.ts`

```typescript
// Iteration configuration
const ITERATION_CONFIG = {
  MAX_ITERATIONS: 4,
  BASE_FETCH_LIMIT: 600,
  FETCH_MULTIPLIERS: [1, 1.5, 2.25, 3.33], // 600, 900, 1350, 2000
  MAX_FETCH_LIMIT: 2000,
  DIMINISHING_RETURNS_THRESHOLD: 0.05, // 5%
  SOURCE_EXHAUSTION_THRESHOLD: 0.5, // 50%
  TARGET_PAPER_COUNT: 300,
  MIN_ACCEPTABLE_THRESHOLD: 30,
  ITERATION_TIMEOUT_MS: 40000, // 40s
};

// Stop conditions
type StopReason =
  | 'TARGET_REACHED'       // filtered.length >= 300
  | 'MAX_ITERATIONS'       // iteration > 4
  | 'DIMINISHING_RETURNS'  // yieldRate < 5% (iteration > 1)
  | 'SOURCES_EXHAUSTED'    // all sources returned < 50%
  | 'MIN_THRESHOLD'        // can't relax below 30
  | 'USER_CANCELLED';      // user clicked cancel
```

### 3. WebSocket Events

**File**: `frontend/lib/types/search-stream.types.ts`

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
  reason?: StopReason;
  timestamp: number;
}
```

### 4. Pipeline Filter Change

**File**: `backend/src/modules/literature/services/search-pipeline.service.ts`

```typescript
// BEFORE (Line 705)
const qualityFiltered = papersForSemantic.filter(
  (p: MutablePaper) => (p.qualityScore ?? 0) >= QUALITY_THRESHOLD
);

// AFTER
// Step 1: Calculate overallScore for all papers FIRST
const scoredPapers = this.calculateCombinedScores(papersForSemantic, query);

// Step 2: Filter by overallScore with adaptive threshold
const qualityFiltered = scoredPapers.filter(
  (p: MutablePaper) => {
    const score = p.overallScore ?? p.qualityScore ?? 0;
    return score >= currentThreshold;
  }
);
```

---

## Files to Modify

### Backend (5 files)

| File | Change Type | Description |
|------|-------------|-------------|
| `search-pipeline.service.ts` | MODIFY | Move `calculateCombinedScores()` before filter, switch to `overallScore` |
| `search-stream.service.ts` | MODIFY | Add iteration loop, emit progress events |
| `source-allocation.constants.ts` | MODIFY | Update fetch limits, add iteration config |
| `adaptive-quality-threshold.service.ts` | NEW | Field detection + adaptive thresholds |
| `iterative-fetch.service.ts` | NEW | Core iteration logic |

### Frontend (6 files)

| File | Change Type | Description |
|------|-------------|-------------|
| `search-stream.types.ts` | MODIFY | Add `IterationProgressEvent` type |
| `useSearchWebSocket.ts` | MODIFY | Handle iteration events |
| `constants.ts` (PipelineOrchestra) | MODIFY | Add "iterate" stage |
| `LiveCounter.tsx` | MODIFY | Show honest counts |
| `usePipelineState.ts` | MODIFY | Handle iteration state |
| `IterationLoopVisualizer.tsx` | NEW | Visual loop-back animation |

---

## Implementation Checklist

### Phase 0: Pre-Implementation

- [ ] Commit current state: `git add -A && git commit -m "Phase 10.155: Pre-iterative-fetch checkpoint"`
- [ ] Push to remote: `git push`
- [ ] Create feature branch: `git checkout -b feature/iterative-fetch-system`
- [ ] Verify clean state: `git status` shows clean

### Week 1: Foundation (Days 1-5)

#### Day 1: Setup

- [ ] Create `adaptive-quality-threshold.service.ts` file
- [ ] Implement `detectField()` function
- [ ] Implement `getInitialThreshold()` method
- [ ] Implement `getNextThreshold()` method
- [ ] Write unit tests for field detection

#### Day 2: Threshold Service

- [ ] Add field confidence scoring
- [ ] Implement fallback to "interdisciplinary"
- [ ] Test with 10 sample queries across fields
- [ ] Verify threshold selection is correct

#### Day 3-4: Iterative Fetch Service

- [ ] Create `iterative-fetch.service.ts` file
- [ ] Implement `fetchUntilTarget()` generator
- [ ] Implement deduplication logic
- [ ] Implement source exhaustion tracking
- [ ] Implement diminishing returns detection
- [ ] Write unit tests for iteration logic

#### Day 5: WebSocket Events

- [ ] Add `IterationProgressEvent` type to DTOs
- [ ] Add event emission in `search-stream.service.ts`
- [ ] Test events fire correctly in WebSocket
- [ ] Verify event structure matches type definition

#### Week 1 Verification

- [ ] Check what user sees in frontend now (no changes expected yet)
- [ ] Verify WebSocket connections stable
- [ ] Run `npm run typecheck` - no TypeScript errors
- [ ] Test backend API endpoints manually
- [ ] Unit tests pass for new services
- [ ] No regressions in existing functionality

### Week 2: Pipeline Integration (Days 6-10)

#### Day 6-7: Critical Pipeline Fix

- [ ] **CRITICAL**: Move `calculateCombinedScores()` call BEFORE quality filter
- [ ] Verify `overallScore` is populated for all papers
- [ ] Update filter to use `overallScore ?? qualityScore ?? 0`
- [ ] Test with A/B comparison (old vs new filter)
- [ ] Measure pass rate improvement

#### Day 8-9: Integration

- [ ] Integrate `IterativeFetchService` into `SearchStreamService`
- [ ] Connect adaptive threshold to iteration loop
- [ ] Emit iteration events during search
- [ ] Test end-to-end with single query

#### Day 10: Exhaustion & Cancellation

- [ ] Implement source exhaustion detection
- [ ] Implement user cancellation handling
- [ ] Test partial result delivery on cancel
- [ ] Test all stop conditions

#### Week 2 Verification

- [ ] Check what user sees in frontend now
- [ ] Test 10 diverse queries across different fields:
  - [ ] "quantum computing algorithms" (physics/CS)
  - [ ] "cancer immunotherapy clinical trials" (biomedical)
  - [ ] "machine learning neural networks" (CS)
  - [ ] "climate change policy economic impact" (social science)
  - [ ] "American politics research" (social science)
  - [ ] "renaissance art history" (humanities)
  - [ ] "indigenous knowledge systems" (interdisciplinary)
  - [ ] "COVID-19 vaccine efficacy" (biomedical)
  - [ ] "blockchain cryptocurrency security" (CS)
  - [ ] "mental health psychology depression" (social science)
- [ ] Verify 250+ papers returned for each query
- [ ] Compare paper quality: old filter vs new filter
- [ ] WebSocket stability check (long searches >30s)
- [ ] TypeScript error check: `npm run typecheck`
- [ ] Full integration test: backend + frontend

### Week 3: Frontend Animation (Days 11-15)

#### Day 11-12: Pipeline Stage

- [ ] Add "iterate" stage to `PIPELINE_STAGES` constant
- [ ] Update `usePipelineState.ts` to handle iteration state
- [ ] Implement stage transition logic
- [ ] Test stage rendering in orchestra

#### Day 13: Honest Counter

- [ ] Update `LiveCounter.tsx` interface
- [ ] Display format: "82/300 (Iteration 1/4 @ 60%)"
- [ ] Add iteration indicator during loop
- [ ] Test counter accuracy matches delivered papers

#### Day 14: Loop Visualizer

- [ ] Create `IterationLoopVisualizer.tsx`
- [ ] Implement visual arrow from FILTER to COLLECT
- [ ] Add particle effect during loop
- [ ] Test animation smoothness

#### Day 15: Cancellation UI

- [ ] Handle cancellation in `useSearchWebSocket.ts`
- [ ] Show "Search cancelled. X papers delivered"
- [ ] Clear iteration state on cancel
- [ ] Test cancel at different iteration stages

#### Week 3 Verification

- [ ] **CRITICAL**: Check what user sees in frontend - is it confusing?
- [ ] Animation accurately shows iteration progress
- [ ] Paper counts match delivered papers exactly
- [ ] Cancellation works and delivers partial results
- [ ] No confusing UX elements
- [ ] WebSocket reconnection test
- [ ] TypeScript clean: `npm run typecheck`
- [ ] User testing with 3 researchers (if available)

### Week 4: Optimization & Polish (Days 16-20)

#### Day 16-17: Performance

- [ ] Implement parallel fetching within iteration
- [ ] Optimize semantic embedding caching
- [ ] Reduce memory footprint
- [ ] Target: <35s for 300 papers

#### Day 18: Tuning

- [ ] Tune diminishing returns threshold (currently 5%)
- [ ] Tune source exhaustion threshold (currently 50%)
- [ ] Test with edge case queries
- [ ] Document optimal values

#### Day 19: Load Testing

- [ ] Test 10 concurrent searches
- [ ] Test 25 concurrent searches
- [ ] Test 50 concurrent searches
- [ ] Verify no memory leaks
- [ ] Check CPU usage acceptable

#### Day 20: Documentation

- [ ] Update API documentation
- [ ] Add inline code comments
- [ ] Write migration guide
- [ ] Code review with team

#### Week 4 Verification

- [ ] Full user experience walkthrough
- [ ] < 35s for 300 papers target
- [ ] WebSocket + backend + frontend integration stable
- [ ] API response validation
- [ ] TypeScript error check: `npm run typecheck`
- [ ] Memory leak check (heap snapshot before/after)
- [ ] Production deployment readiness
- [ ] Rollback plan documented

---

## Success Metrics

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| Papers delivered vs target | 27% (82/300) | 90%+ (270+/300) | `finalPapers.length / 300` |
| Animation accuracy | 0% (misleading) | 100% (honest) | Manual verification |
| Filter uses correct score | `qualityScore` | `overallScore` | Code review |
| Search time | 25s | < 35s | `totalTimeMs` in complete event |
| User confusion | High (support tickets) | Low | User feedback |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Infinite loop | Low | High | Hard cap at 4 iterations + 40s timeout |
| Memory exhaustion | Medium | High | Stream papers, cap at 8000 total, clear between iterations |
| Latency increase | Medium | Medium | Parallel fetching, early termination on target |
| Field misclassification | Medium | Low | Fallback to "interdisciplinary", log for improvement |
| Source exhaustion | Low | Medium | Track per-source yield, skip exhausted in next iteration |
| User cancellation | Low | Low | Deliver partial results, clear state |
| `overallScore` undefined | Low | High | Calculate BEFORE filter, fallback to `qualityScore` |
| WebSocket disconnection | Low | Medium | Reconnection logic, resume from last iteration |

---

## Rollback Plan

If critical issues are discovered post-deployment:

1. **Revert filter change**: Switch back to `qualityScore >= 20`
2. **Disable iteration**: Set `MAX_ITERATIONS = 1`
3. **Full rollback**: `git revert HEAD~N` to pre-Phase 10.155 commit

---

## Dependencies

- Phase 10.147: `overallScore` calculation (harmonic mean) - COMPLETED
- Phase 10.138: Netflix-grade pipeline orchestra - COMPLETED
- Phase 10.113: Progressive semantic ranking - COMPLETED

---

## Testing Queries

Use these queries to verify different field thresholds:

| Query | Expected Field | Initial Threshold |
|-------|---------------|-------------------|
| "quantum computing algorithms" | physics | 55 |
| "cancer immunotherapy clinical trials" | biomedical | 60 |
| "machine learning neural networks" | computer-science | 55 |
| "climate change policy economic impact" | social-science | 45 |
| "American politics research" | social-science | 45 |
| "renaissance art history" | humanities | 40 |
| "indigenous knowledge forest management" | interdisciplinary | 50 |

---

## Sign-off

- [ ] Architecture reviewed
- [ ] Security reviewed (no new vulnerabilities)
- [ ] Performance acceptable (<35s)
- [ ] UX approved (not confusing)
- [ ] Ready for production

---

*Phase 10.155 - Created December 14, 2025*
