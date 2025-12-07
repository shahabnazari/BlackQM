# CRITICAL BUG: 0 Papers Selected After Search

**Date**: 2025-11-27
**Severity**: 🔴 **CRITICAL**
**Status**: 🔍 **INVESTIGATING**

---

## The Problem

```
Search Results:
  Collected: 2,355 papers ✅
  Unique: 2,255 papers (4% duplicates removed) ✅
  Selected: 0 papers ❌ ← CRITICAL BUG!
```

**All papers are being filtered out** by the neural relevance system.

---

## Root Cause Analysis

### Filtering Pipeline (2 Stages)

**Stage 1: BM25 Recall Filter** (backend/src/modules/literature/literature.service.ts:952-963)
```typescript
const bm25Threshold = MIN_RELEVANCE_SCORE * 0.7;  // e.g., 5 * 0.7 = 3.5
const bm25Candidates = papersWithScore.filter((paper) => {
  const score = paper.relevanceScore ?? 0;  // ← Papers have NO score!
  if (score < bm25Threshold) {
    return false;  // ← ALL papers rejected here
  }
  return true;
});
```

**Stage 2: Neural Reranking** (lines 980-988)
```typescript
neuralRankedPapers = await this.neuralRelevance.rerankWithSciBERT(
  originalQuery,
  bm25Candidates,  // ← Empty array (all filtered in Stage 1)
  { threshold: 0.65, maxPapers: 800 }
);
```

---

## Why ALL Papers Are Rejected

### Hypothesis 1: Papers Have No `relevanceScore` ✅ MOST LIKELY

**Evidence**:
```typescript
const score = paper.relevanceScore ?? 0;  // If undefined/null, score = 0
if (score < bm25Threshold) {  // 0 < 3.5 = true → REJECTED
```

If papers don't have `relevanceScore` field set during collection, they default to 0 and ALL get filtered out.

---

### Hypothesis 2: BM25 Scoring Failed During Collection

**Where BM25 scoring should happen**: During paper collection from each source

**If BM25 scoring fails**: Papers get `relevanceScore = undefined` or `0`

---

### Hypothesis 3: Threshold Too High (Less Likely)

**Current thresholds**:
- Comprehensive query: MIN = 5, BM25 threshold = 3.5
- Specific query: MIN = 4, BM25 threshold = 2.8
- Broad query: MIN = 3, BM25 threshold = 2.1

Even with threshold of 2.1, if papers have score = 0, they'll still be rejected.

---

## The Fix (Multiple Options)

### Option 1: Bypass BM25 Filter If All Papers Have score=0 ✅ RECOMMENDED

**Location**: `backend/src/modules/literature/literature.service.ts:952`

**Add safety check**:
```typescript
// Check if papers have ANY valid scores
const papersWithValidScores = papersWithScore.filter(p => (p.relevanceScore ?? 0) > 0);
const hasValidScores = papersWithValidScores.length > 0;

if (!hasValidScores) {
  this.logger.warn(
    `⚠️ No papers have BM25 scores - bypassing Stage 1 filter (papers will be scored by SciBERT directly)`
  );
  // Pass ALL papers to SciBERT for scoring
  neuralRankedPapers = await this.neuralRelevance.rerankWithSciBERT(
    originalQuery,
    papersWithScore,  // All papers, not filtered
    { threshold: 0.65, maxPapers: 800 }
  );
} else {
  // Normal flow: BM25 filter → Neural reranking
  const bm25Candidates = papersWithScore.filter(...);
  neuralRankedPapers = await this.neuralRelevance.rerankWithSciBERT(...);
}
```

**Why this works**:
- If BM25 scoring failed, SciBERT will still score papers
- SciBERT is more accurate anyway (95%+ precision)
- Graceful degradation instead of total failure

---

### Option 2: Lower Threshold Temporarily ⚠️ TEMPORARY FIX

**Location**: Same file, line 941

**Change**:
```typescript
// BEFORE
MIN_RELEVANCE_SCORE = 5; // Rejects all if papers have score=0

// AFTER (temporary)
MIN_RELEVANCE_SCORE = 0.1; // Allow papers with any score through
```

**Why this works**: Allows papers with score >= 0.07 to pass to SciBERT

**Downside**: Doesn't fix root cause (BM25 scoring failure)

---

### Option 3: Fix BM25 Scoring at Collection ✅ LONG-TERM FIX

**Find where papers are collected** and ensure `relevanceScore` is set.

**Each source should calculate BM25**:
- PubMed collection → assign relevanceScore
- ArXiv collection → assign relevanceScore
- CrossRef collection → assign relevanceScore
- etc.

**If source doesn't provide score**: Calculate BM25 locally based on title/abstract match

---

## Immediate Action Required

### Quick Fix (5 minutes):

1. **Edit**: `backend/src/modules/literature/literature.service.ts`
2. **Find**: Line 952 (BM25 filter section)
3. **Add safety check**: Bypass filter if no valid scores
4. **Restart backend**
5. **Test search** - should return papers now

---

### Implementation

**I can implement Option 1 (bypass filter if no scores) immediately.**

This will:
- ✅ Allow search to return papers (SciBERT will score them)
- ✅ Preserve neural relevance ranking (95%+ precision)
- ✅ Graceful degradation (doesn't break if BM25 fails)
- ✅ Fix the "0 papers" issue

**Alternative**: Implement Option 2 (lower threshold) as emergency hotfix

---

## User Impact

**Current**: 🔴 Search completely broken - 0 results always

**After Fix**: 🟢 Search returns papers scored by SciBERT

**Long-term**: Need to ensure BM25 scoring works during collection

---

## Related to Week 2?

❌ **NO** - This is a backend filtering bug, not related to my frontend UI changes

**Week 2 changes**:
- Purple border (frontend UI)
- "AI-powered search" text (frontend UI)
- Button padding (frontend UI)

**This bug**:
- Backend neural relevance filtering
- BM25 scoring failure
- Threshold configuration

**Completely separate systems.**

---

## Next Steps

1. ✅ **Implement Option 1** - Bypass BM25 filter if no scores
2. ✅ **Test search** - Verify papers are returned
3. 🔍 **Investigate** - Why papers don't have BM25 scores from collection
4. 🛠️ **Fix root cause** - Ensure BM25 scoring works during collection

---

## Decision Required

**Do you want me to**:
A. **Implement Option 1** (bypass filter + SciBERT scoring) - RECOMMENDED
B. **Implement Option 2** (lower threshold temporarily) - QUICK FIX
C. **Investigate Option 3** (fix BM25 at collection) - THOROUGH BUT SLOW

**Recommendation**: **A** (Option 1) - Gets you working search immediately while preserving quality

---

**Status**: CRITICAL - Waiting for approval to implement fix
**ETA**: 5 minutes after approval
**Confidence**: 95% this will fix the issue
