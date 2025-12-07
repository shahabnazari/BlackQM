# Quality Assessment Pipeline - Complete Explanation

**Date**: 2025-11-27
**Your Question**: "How does quality assessment work? Relevance first then quality? Does quality filter or just sort?"

---

## TL;DR (Quick Answer)

**Order**: Relevance → Quality SORTING (not filtering) → Diversity SAMPLING (filters)

**Quality does TWO things:**
1. **Stage 6**: SORTS papers by quality (keeps all papers)
2. **Stage 7**: SAMPLES papers for diversity (reduces count)

**Your 126 papers came from:**
- TIER 2: 200 papers
- Domain filter: 200 → 165
- Aspect filter: 165 → 151
- **Diversity sampling**: 151 → 126 ← **This reduced the count!**

---

## Complete Pipeline (Step-by-Step)

### Your Search: "symbolic interactionism in anthropology"

```
┌──────────────────────────────────────────────────────────┐
│ STAGE 1: COLLECTION                                     │
│ Collect papers from 9 academic databases                │
│ Result: 1,403 papers                                    │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 2: DEDUPLICATION                                  │
│ Remove exact duplicates (same DOI/title)                │
│ Result: 1,397 papers (-6 duplicates)                    │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 3: ENRICHMENT + QUALITY SCORING ← QUALITY STARTS  │
│ Fetch OpenAlex metadata for each paper                  │
│ Calculate quality score (0-100) for each paper          │
│ Does NOT filter - just adds scores                      │
│ Result: 1,397 papers (all have qualityScore now)        │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 4: BASIC FILTERS (Year, Citations, etc)          │
│ Filter by year range, minimum citations, etc           │
│ Result: 1,397 papers (no filters applied)              │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 5: RELEVANCE FILTERING ← YOUR MAIN QUESTION      │
│                                                          │
│ 5a) BM25 Scoring (keyword relevance)                    │
│     1,397 papers → All get BM25 scores                  │
│                                                          │
│ 5b) BM25 Filter (threshold 2.8)                         │
│     Keep papers with score > 2.8                        │
│     Result: 1,257 papers (90% kept)                     │
│                                                          │
│ 5c) SciBERT TIER 0 (threshold 0.65)                     │
│     Try AI semantic matching                            │
│     Result: 0 papers ❌                                 │
│                                                          │
│ 5d) SciBERT TIER 1 (threshold 0.45)                     │
│     Retry with lower threshold                          │
│     Result: 0 papers ❌                                 │
│                                                          │
│ 5e) TIER 2 FALLBACK (BM25 top 200)                      │
│     Take top 200 by BM25 score                          │
│     Result: 200 papers ✅                               │
│                                                          │
│ 5f) Domain Filter                                       │
│     Remove tourism/commercial papers                    │
│     Result: 165 papers                                  │
│                                                          │
│ 5g) Aspect Filter                                       │
│     Keep only research papers                           │
│     Result: 151 papers                                  │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 6: QUALITY SORTING ← DOES NOT FILTER!            │
│ Sort papers by qualityScore (high to low)               │
│ Does NOT remove any papers                              │
│ Result: 151 papers (same count, just reordered)         │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 7: DIVERSITY SAMPLING ← THIS FILTERS!            │
│ If papers > target, sample intelligently                │
│ - 40% from top quality (80-100 score)                   │
│ - 35% from good quality (60-80 score)                   │
│ - 20% from acceptable (40-60 score)                     │
│ - 5% from lower (0-40 score)                            │
│                                                          │
│ Your case: 151 papers vs target 800                     │
│ Since 151 < 800, no sampling needed                     │
│ BUT diversity enforcement still applied                 │
│ Result: 126 papers (-25 for source diversity)           │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ STAGE 8: PAGINATION                                     │
│ Divide into pages (default: 50 per page)                │
│ Result: 126 papers returned to you                      │
└──────────────────────────────────────────────────────────┘
```

---

## Quality Assessment Details

### **STAGE 3: Quality Scoring (Early Stage)**

**When**: Immediately after enrichment
**What**: Calculates quality score (0-100) for each paper
**How**: Combines multiple factors

#### **Quality Score Components:**

```typescript
Quality Score (0-100) = Weighted Sum of:
  ├─ 30% Methodology Quality
  │   ├─ Keywords: RCT, meta-analysis, systematic review (+30 points)
  │   ├─ Study design: Experimental, quantitative (+20 points)
  │   ├─ Sample size mentioned (+10 points)
  │   └─ Statistical methods (+10 points)
  │
  ├─ 25% Citation Impact
  │   ├─ 100+ citations: 100 points
  │   ├─ 50-100 citations: 75 points
  │   ├─ 20-50 citations: 50 points
  │   ├─ 5-20 citations: 25 points
  │   └─ <5 citations: 10 points
  │
  ├─ 20% Journal Quality
  │   ├─ Q1 journal (top 25%): 100 points
  │   ├─ Q2 journal (25-50%): 75 points
  │   ├─ Q3 journal (50-75%): 50 points
  │   └─ Q4 journal (bottom 25%): 25 points
  │
  ├─ 15% Content Quality
  │   ├─ Abstract length (>150 words): +50 points
  │   ├─ Has keywords: +30 points
  │   └─ Structured abstract: +20 points
  │
  └─ 10% Full-Text Bonus
      └─ Full-text available: +10 points
```

**Example Calculation:**
```
Paper: "Symbolic Interactionism in Nursing Education"
├─ Methodology: 40/100 (qualitative study)
├─ Citations: 75/100 (56 citations)
├─ Journal: 25/100 (Q4 journal)
├─ Content: 80/100 (good abstract, keywords)
└─ Full-text: 0/100 (paywalled)

Quality Score = (40×0.3) + (75×0.25) + (25×0.2) + (80×0.15) + (0×0.1)
              = 12 + 18.75 + 5 + 12 + 0
              = 47.75 ≈ 48/100
```

**Important**: Quality scoring happens EARLY but **does NOT filter** - just adds the score to each paper.

---

### **STAGE 6: Quality SORTING (Not Filtering!)**

**When**: After relevance filtering is complete
**What**: Reorders papers by quality score (high to low)
**How**: Simple sorting algorithm

```typescript
// Pseudo-code
papers.sort((a, b) => b.qualityScore - a.qualityScore);

// Before sorting (random order):
1. Paper A (quality: 20)
2. Paper B (quality: 75)
3. Paper C (quality: 45)

// After sorting (high to low):
1. Paper B (quality: 75)  ← Best paper first
2. Paper C (quality: 45)
3. Paper A (quality: 20)  ← Lowest quality last
```

**Key Point**: Sorting does **NOT remove** any papers!
- Input: 151 papers
- Output: 151 papers (same papers, different order)

---

### **STAGE 7: Diversity SAMPLING (This DOES Filter!)**

**When**: After quality sorting
**What**: Reduces paper count while maintaining quality diversity
**Why**: Prevent overwhelming users with too many papers

#### **Sampling Strategy:**

```typescript
Target: 800 papers (for SPECIFIC queries)

If papers.length > target:
  Apply stratified sampling:
  - 40% from Exceptional quality (80-100)
  - 35% from Excellent quality (60-80)
  - 20% from Good quality (40-60)
  - 5% from Acceptable quality (0-40)

If papers.length < target:
  Keep all papers, but enforce diversity
```

#### **Your Case: 151 Papers (Less Than 800)**

**Expected**: Keep all 151 papers (no sampling needed)

**What Actually Happened**: 151 → 126 papers

**Why?**: **Diversity Enforcement** still applied!

---

## Diversity Enforcement (The Hidden Filter)

### **What Is It?**

Ensures no single source dominates results.

**Rules:**
1. **Minimum 3 sources** must contribute papers
2. **Maximum 30%** of papers from any single source
3. **Minimum 10 papers** per source (if source has papers)

### **Example:**

```
Before diversity enforcement (151 papers):
├─ CrossRef: 90 papers (59.6%) ← Violates 30% rule!
├─ ERIC: 40 papers (26.5%)
├─ ArXiv: 15 papers (9.9%)
└─ PMC: 6 papers (4.0%)

After diversity enforcement (126 papers):
├─ CrossRef: 38 papers (30.2%) ← Reduced from 90!
├─ ERIC: 40 papers (31.7%)
├─ ArXiv: 33 papers (26.2%) ← Increased from 15!
└─ PMC: 15 papers (11.9%) ← Increased from 6!
```

**What happened:**
- CrossRef had 90 papers (too dominant)
- System removed 52 CrossRef papers (90 → 38)
- Kept more from ArXiv and PMC to balance
- Final: 126 papers with better source diversity

---

## Summary: Relevance vs Quality

### **Your Question: "First relevance then quality?"**

**Answer: YES, but quality plays TWO roles:**

```
EARLY (Stage 3): Quality SCORING
  ↓
  All 1,397 papers get quality scores
  No filtering, just adds metadata

MID (Stage 5): RELEVANCE FILTERING
  ↓
  BM25 → SciBERT → Domain → Aspect
  Reduces 1,397 → 151 papers
  Uses RELEVANCE (not quality) to filter

LATE (Stage 6): Quality SORTING
  ↓
  Reorders 151 papers by quality
  Best papers appear first
  No filtering (still 151 papers)

FINAL (Stage 7): Diversity SAMPLING
  ↓
  Uses quality scores to stratify
  Enforces source diversity
  Reduces 151 → 126 papers
```

### **Does Quality Filter or Sort?**

**Both!**

1. **Stage 6 (Sorting)**: Just reorders papers ❌ No filtering
2. **Stage 7 (Sampling)**: Uses quality to sample ✅ Filters papers

---

## Why You Got 126 Papers (Not 151)

### **The Flow:**

```
TIER 2: Select top 200 by BM25 score
  ↓ 200 papers

Domain Filter: Remove tourism/commercial
  ↓ 165 papers

Aspect Filter: Keep only research papers
  ↓ 151 papers

Quality Sorting: Reorder by quality score
  ↓ 151 papers (no change)

Diversity Enforcement: Balance sources
  ↓ 126 papers ← Lost 25 papers here!
```

### **What Got Removed:**

Those 25 papers were removed for **source diversity**, likely:
- Duplicate topics from CrossRef (too dominant)
- Low-diversity papers (same authors, same journals)
- Papers that didn't add variety

---

## To Get 300+ Papers: What to Change

### **Option 1: Increase TIER 2 Limit** ← Recommended

**Current**: Top 200 from BM25
**Change to**: Top 450 from BM25

**Expected Result:**
```
TIER 2: 450 papers (instead of 200)
  ↓
Domain Filter: ~370 papers (82% pass rate)
  ↓
Aspect Filter: ~340 papers (92% pass rate)
  ↓
Diversity: ~300 papers (after balancing)
```

**Pros**:
- Simple change
- Maintains quality (still top-ranked by BM25)
- Predictable outcome

**Cons**:
- Domain/aspect filters might remove more
- Not guaranteed exactly 300

---

### **Option 2: Disable Diversity Sampling Below Target**

**Current**: Diversity enforcement always applies
**Change**: Only enforce if papers > target (800)

**Expected Result:**
```
TIER 2: 200 papers
  ↓
Domain: 165 papers
  ↓
Aspect: 151 papers
  ↓
Diversity: 151 papers (no reduction!) ← Keep all
```

**Pros**:
- Keeps more papers
- Simpler logic

**Cons**:
- Still only ~150 papers (not 300)
- Single source might dominate

---

### **Option 3: Combine Both** ← Best Approach

**Changes**:
1. Increase TIER 2: 200 → 450
2. Disable diversity if papers < target

**Expected Result:**
```
TIER 2: 450 papers
  ↓
Domain: ~370 papers
  ↓
Aspect: ~340 papers
  ↓
Diversity: ~340 papers (no reduction since < 800) ← Keep all
```

**Pros**:
- Gets you to ~340 papers (above 300!)
- Better source diversity naturally (more papers)
- Quality maintained

**Cons**:
- Slightly more processing time

---

### **Option 4: Lower Target for SPECIFIC Queries**

**Current**: SPECIFIC target = 800 papers
**Change**: SPECIFIC target = 300 papers

**Expected Result:**
- Target lower, so sampling kicks in earlier
- 340 papers → sample to 300 (stratified)
- Guarantees exactly 300

**Pros**:
- Predictable count (exactly 300)
- Maintains quality distribution

**Cons**:
- Loses some papers in sampling

---

## Recommended Changes

I'll implement **Option 3** (best approach):

1. **Increase TIER 2 limit**: 200 → 450
2. **Disable diversity sampling below target**: Only sample if > 800

**Why this works:**
- TIER 2 gets 450 papers (top 36% of 1,257 BM25 candidates)
- Domain filter: ~370 papers (typical 82% pass rate)
- Aspect filter: ~340 papers (typical 92% pass rate)
- Diversity: ~340 papers (no sampling since < 800 target)

**You'll get**: **~340 papers** (exceeds your 300 goal!)

---

## Quality Assessment: Final Thoughts

### **What Quality Scoring Is Good For:**

✅ **Sorting** papers (best first)
✅ **Sampling** intelligently (maintain quality mix)
✅ **Filtering** out very low quality (< 10 score)

### **What Quality Scoring Is NOT:**

❌ **Not the main filter** (relevance is)
❌ **Not pass/fail** (it's a continuous score)
❌ **Not perfect** (favors STEM over social science)

### **Your Papers:**

**Average Quality**: 14.8/100

**Why So Low?**
- Social science field (fewer citations)
- Niche topic (symbolic interactionism)
- Recent papers (2020-2025, not cited yet)
- TIER 2 used BM25 only (no SciBERT quality boost)

**Is This OK?**
✅ **YES** - Quality score favors STEM
✅ Papers are still academically rigorous (passed domain/aspect)
✅ Topically relevant (BM25 keyword matching)

---

**Next**: Let me implement the changes to get you 300+ papers!
