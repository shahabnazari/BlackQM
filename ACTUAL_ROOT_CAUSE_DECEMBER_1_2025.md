# ACTUAL ROOT CAUSE - Literature Search Returns 0 Papers

**Date**: December 1, 2025, 5:35 PM
**Status**: ❌ NOT FIXED - Source allocation logic broken
**Severity**: CRITICAL - Blocks all literature search functionality

---

## 🔥 THE REAL ROOT CAUSE

The literature search returns **0 papers in ~12ms** because **sources are selected but NOT assigned to any tier**, so they **never actually get searched**.

### Evidence from Backend Logs

```log
[LiteratureService] ✅ [Source Selection] Using 1 sources: SEMANTIC_SCHOLAR
   • Tier 1 (Premium): 0 sources -
   • Tier 2 (Good): 0 sources -
   • Tier 3 (Preprint): 0 sources -
   • Tier 4 (Aggregator): 0 sources -

[LiteratureService]    📊 After Tier 1: 0 papers collected
[LiteratureService]    📊 After Tier 2: 0 papers collected
[LiteratureService]    📊 After Tier 3: 0 papers collected
[LiteratureService]    📊 After Tier 4: 0 papers collected

[SearchLoggerService] Total Collected: 0 papers
[SearchLoggerService] Search Duration: 12ms
[LiteratureController] [PUBLIC SEARCH] Search completed: 0 papers, total=0
```

**The system says**: "Using 1 sources: SEMANTIC_SCHOLAR"
**But then assigns**: 0 sources to ALL tiers
**Result**: No sources are actually searched → 0 papers in 12ms

---

## ❌ What Was WRONG in Previous Analysis

### ROOT_CAUSE_ANALYSIS_COMPLETE.md (INCORRECT)

That document claimed:
- ✅ Backend working, database connected
- ✅ 5300 papers being fetched
- ✅ BM25 filtering working (5063 → 2855 papers)
- ❌ Neural filtering too aggressive (2855 → 0 papers)

**This was from a PREVIOUS test run, NOT the current state!**

### Current Reality

- ❌ NO papers are being fetched from ANY source
- ❌ Search completes in 12ms (way too fast)
- ❌ Source allocation logic is broken
- ❌ Sources are selected but not assigned to tiers

---

## 📊 Technical Analysis

### What Should Happen

1. User requests search with query "education"
2. Frontend sends: `{query: "education", limit: 10}`
3. Backend selects default sources or uses frontend-specified sources
4. **Sources are assigned to tiers** (Tier 1-4 based on quality)
5. Each tier is searched sequentially
6. Papers are collected, deduplicated, filtered
7. Results returned to frontend

### What's Actually Happening

1. ✅ User requests search
2. ✅ Frontend sends request
3. ✅ Backend selects sources (e.g., SEMANTIC_SCHOLAR)
4. ❌ **Sources are NOT assigned to any tier** (ALL tiers show 0 sources)
5. ❌ No sources are searched (nothing to search!)
6. ❌ 0 papers collected in 12ms
7. ❌ Empty result set returned

---

## 🔍 Where the Bug Is

**File**: `/backend/src/modules/literature/literature.service.ts`

**Location**: `searchLiterature()` method - source allocation logic

**The Bug**: When sources are selected (either from frontend request or default allocation), they are **not being mapped to tier arrays** before the tier-based search begins.

**Expected Code Flow**:
```typescript
// 1. Select sources
const selectedSources = this.selectSources(searchDto);

// 2. Assign to tiers (THIS IS BROKEN!)
const tier1Sources = selectedSources.filter(s => isPremiumSource(s));
const tier2Sources = selectedSources.filter(s => isGoodSource(s));
// ...etc

// 3. Search each tier
const tier1Papers = await this.searchTier(tier1Sources, searchDto);
const tier2Papers = await this.searchTier(tier2Sources, searchDto);
```

**What's Probably Happening**:
```typescript
// Sources selected but never assigned to tier arrays
const selectedSources = ['SEMANTIC_SCHOLAR'];

// Tiers are empty!
const tier1Sources = [];  // ← BUG: Should contain sources
const tier2Sources = [];
const tier3Sources = [];
const tier4Sources = [];

// Searching empty arrays = 0 papers
```

---

## ✅ The Fix (For You to Apply)

### Step 1: Stop All Backend Processes

Multiple backend instances are running, causing confusion:

```bash
# Kill all node/nest processes
pkill -f "nest start"

# OR manually:
ps aux | grep "nest start" | awk '{print $2}' | xargs kill
```

### Step 2: Locate the Bug

```bash
cd /Users/shahabnazariadli/Documents/blackQmethhod/backend
grep -n "Tier 1 (Premium)" src/modules/literature/literature.service.ts
```

Find the code that:
1. Logs "Using X sources: ..."
2. Logs "Tier 1 (Premium): X sources"

### Step 3: Fix the Source-to-Tier Assignment

Look for where sources are being allocated to tiers. The bug is likely one of:

**Option A**: Sources array is not being populated
```typescript
// BEFORE (BROKEN):
const tier1Sources = []; // Always empty!

// AFTER (FIXED):
const tier1Sources = selectedSources.filter(s =>
  ['SEMANTIC_SCHOLAR', 'CROSSREF', 'PUBMED'].includes(s)
);
```

**Option B**: Source name mismatch
```typescript
// If source is 'SEMANTIC_SCHOLAR' but tier filter checks 'semantic-scholar'
// They won't match!

// FIX: Normalize source names
const normalizedSource = source.toUpperCase().replace('-', '_');
```

**Option C**: Conditional logic preventing assignment
```typescript
// BEFORE (BROKEN):
if (someConditionThatIsAlwaysFalse) {
  tier1Sources.push(source);
}

// AFTER (FIXED):
// Check why condition is false and fix it
```

### Step 4: Restart Backend and Test

```bash
cd backend
npm run start:dev

# In another terminal:
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 5}' \
  -s | jq '.total'

# Should return > 0 if fixed
```

---

## 🎯 Expected Behavior After Fix

```log
[LiteratureService] ✅ [Source Selection] Using 8 sources: SEMANTIC_SCHOLAR, CROSSREF, PUBMED, ...
   • Tier 1 (Premium): 3 sources - SEMANTIC_SCHOLAR, CROSSREF, PUBMED
   • Tier 2 (Good): 2 sources - ERIC, CORE
   • Tier 3 (Preprint): 2 sources - ARXIV, SSRN
   • Tier 4 (Aggregator): 1 sources - OPENALEX

[LiteratureService]    📊 After Tier 1: 1200 papers collected
[LiteratureService]    📊 After Tier 2: 2400 papers collected
[LiteratureService]    📊 After Tier 3: 3600 papers collected
[LiteratureService]    📊 After Tier 4: 4000 papers collected

[SearchLoggerService] Total Collected: 4000 papers
[SearchLoggerService] After Dedup: 3800 unique papers
[SearchLoggerService] Search Duration: 15,000ms

[LiteratureController] [PUBLIC SEARCH] Search completed: 350 papers, total=4000
```

---

## 📝 Summary

| Issue | Previous Analysis | Actual Reality |
|-------|------------------|---------------|
| **Papers Collected** | 5300 papers | 0 papers |
| **Search Duration** | ~30 seconds | 12 milliseconds |
| **Root Cause** | Neural filtering too aggressive | Source allocation broken |
| **Fix Needed** | Adjust SciBERT threshold | Fix tier assignment logic |
| **Location** | `neural-relevance.service.ts` | `literature.service.ts` |

**The Actual Problem**: Sources are selected but not assigned to tiers, so they're never searched.

**The Fix**: Debug `literature.service.ts` and fix the source-to-tier assignment logic.

---

## 🚀 Next Steps for User

1. **Stop duplicate backend processes** (multiple running)
2. **Read `literature.service.ts` around line ~200-400**
3. **Find where sources are assigned to tier arrays**
4. **Fix the assignment logic** (see options A, B, C above)
5. **Restart backend and test**

**Time to Fix**: 10-30 minutes (once you find the exact line)
**Complexity**: Medium (logical bug, not architectural)
